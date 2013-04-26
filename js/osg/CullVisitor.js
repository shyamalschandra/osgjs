 //
 // CullVisitor traverse the tree and collect Matrix/State for the rendering traverse
 // and store each traversed node in leaf ready to be rendered
 // Each leaf is stored itsfelf in a renderbin
 // A node can be traversed multiple times, as a node can have multiples parent
 // therefore a Node can be referenced by multiple leaf.
 /**
  * @class CullVisitor
  */
/*jshint latedef: false*/
osg.CullVisitor = function () {
    osg.NodeVisitor.call(this);
    osg.CullSettings.call(this);
    osg.CullStack.call(this);

    this._rootStateGraph = undefined;
    this._currentStateGraph = undefined;
    this._currentRenderBin = undefined;
    this._currentRenderStage = undefined;
    this._rootRenderStage = undefined;
    this._currentCullStack = undefined;

    this._computedNear = Number.POSITIVE_INFINITY;
    this._computedFar = Number.NEGATIVE_INFINITY;

    var lookVector =[0.0,0.0,-1.0];
    this._bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);
    this._bbCornerNear = (~this._bbCornerFar)&7;

    // keep a matrix in memory to avoid to allocate/deallocate memory each frame
    // And store previous frame computations if no change in graphs
    // that can change the ordering. (or matrix change)
    this._reserveMatrixModelStack = new ReservedStack(function() { return osg.Matrix.makeIdentity([]); });
    this._reserveMatrixViewStack = new ReservedStack(function() { return osg.Matrix.makeIdentity([]); });


    this._reserveBoundingBoxStack = new ReservedStack(function() { return new osg.BoundingBox(); });

    this._reserveLeafStack = new ReservedStack(function() { return {};});

    this._renderBinStack = [];
    this._renderBinStack.current = -1;

    // keep trace of the node traversed
    // it's a first step, but a graph approach could be
    // better
    this._traceNode = new TraceNodePath();

    this._dirtyMatrixNode = new NodeDirtyMatrix();
};

var ReservedStack = function(entryConstructor) {
    this._array = [];
    this._constructor = entryConstructor;
    this._index = this._current = 0; this._dirty = true;
};
ReservedStack.prototype = {
    reset: function() {
        this._index = this._current = 0;
        this._dirty = false;
    },
    dirty: function() {
        this._current = this._index;
        this._dirty = true;
    },
    getCurrent: function() { return this._array[this._index]; },
    getIndex: function() { return this._index; },
    isDirty: function() { return this._dirty; },
    getReserved: function() {
        if (this._dirty) {
            if (this._current >= this._array.length) {
                this._array.push(this._constructor());
            }
            this._current++;
        }
        return this._array[this._index++];
    }
};

var NodeDirtyMatrix = function() {
    this.reset();
};
NodeDirtyMatrix.prototype = {
    reset: function() {
        this._dirtyMatrixNodes = {};
    },
    logNode: function(node) {
        var nodeID = node.getObjectID();
        if (node._dirtyMatrix) {
            this._dirtyMatrixNodes[nodeID] = node;
        }
        return node._dirtyMatrix;
    },
    cleanDirtyNodes: function() {
        var nodes = Object.keys(this._dirtyMatrixNodes);
        for ( var i = 0, l = nodes.length; i < l; i++) {
            var key = nodes[i];
            var n = this._dirtyMatrixNodes[key];
            n._dirtyMatrix = false;
        }
    }
};

var TraceNodePath = function() {
    this._array = [];
    this._dirty = false;
    this._previousIndex = this._index = -1;
    this.reset();
};
TraceNodePath.prototype = {
    reset: function() {

        // detect a change in path lenght
        // not that this detection could be useless
        // because it's only valid if you remove a node and add it again
        // at the same position in tree ( meaning in the end )
        // so not really sure we have to fix this
        var prevIndex = this._index;
        var prevPrevIndex = this._previousIndex;
        if (prevIndex !== prevPrevIndex && prevPrevIndex !== -1) {
            var i = Math.min(prevIndex, prevPrevIndex);
            for (var l = this._array.length; i < l; i++) {
                this._array[i] = undefined;
            }
        }
        this._previousIndex = this._index;

        this._dirty = false;
        this._index = -1;
    },
    checkOrTraceNode: function(node) {
        this._index++;
        var nodeID = node.getObjectID();
        var id = this._array[this._index];

        if (id !== nodeID) {
            this._dirty = true;
        }
        if (this._dirty) {
            if (this._index >= this._array.length) {
                this._array.push(nodeID);
            } else {
                this._array[this._index] = nodeID;
            }
        }
    },
    isDirty: function() { return this._dirty; }
};

/** @lends osg.CullVisitor.prototype */
osg.CullVisitor.prototype = osg.objectInehrit(osg.CullStack.prototype ,osg.objectInehrit(osg.CullSettings.prototype, osg.objectInehrit(osg.NodeVisitor.prototype, {

    pushOntoNodePath: function(node) {
        this._traceNode.checkOrTraceNode(node);
        osg.NodeVisitor.prototype.pushOntoNodePath.call(this, node);
    },


    // TODO: merge most parts node cullvisitor functor.
    startCullTransformCallBacks: function(camera, light, scene) {

        this.reset();

        var node = camera;
        this._traceNode.checkOrTraceNode(camera);

        // if path changed view is dirty for sure
        if (this._traceNode.isDirty() || this._reserveMatrixViewStack.isDirty() || node.isDirtyMatrix()) {
            this._reserveMatrixViewStack.dirty();
            this._reserveMatrixModelStack.dirty();
            this._reserveBoundingBoxStack.dirty();
            this._dirtyMatrixNode.logNode(node);
        }
        var view = this._reserveMatrixViewStack.getReserved();
        var projection = this._reserveMatrixViewStack.getReserved();
        var model = this._reserveMatrixModelStack.getReserved();

        var boundingbox = this._reserveBoundingBoxStack.getReserved();

        var recompute = this._reserveMatrixViewStack.isDirty();
        if (recompute) {
            // camera matrix view is an inverse matrix
            // like a matrix generated by osg.Matrix.lookat
            osg.Matrix.copy(camera.getViewMatrix(), view);
            osg.Matrix.copy(camera.getProjectionMatrix(), projection);
            // make sure to reset to identity in case of 
            // treenode changes after initialisations
            osg.Matrix.makeIdentity(model);
            boundingbox.init();
        }

        // as matrix allocated from reserved are
        // initialiazed  to identity

        this.pushStateSet(node.getStateSet());
        this.pushProjectionMatrix(projection);
        this.pushViewMatrix(view);
        this.pushModelMatrix(model);
        this.pushViewport(camera.getViewport());

        // update bound
        // for what ?
        var bs = camera.getBound();
        this.pushBoundingbox(boundingbox);
        if (light) {
            this.addPositionedAttribute(light);
        }
        this.setCullSettings(camera);

        if (camera.getViewport())
            this.pushViewport(camera.getViewport());

        this._rootRenderStage.setClearDepth(camera.getClearDepth());
        this._rootRenderStage.setClearColor(camera.getClearColor());
        this._rootRenderStage.setClearMask(camera.getClearMask());
        this._rootRenderStage.setViewport(camera.getViewport());

        //thid.handleCullCallbacksAndTraverse(camera);
        scene.accept(this);

        camera.boundingbox = boundingbox;
        this.popBoundingbox();

        this.popModelMatrix();
        this.popViewMatrix();
        this.popProjectionMatrix();
        this.popViewport();
        this.popStateSet();

        camera.near = this._computedNear;
        camera.far = this._computedFar;

        //using leaf instead of tree ?
        //clean whole hierarchy

        this._dirtyMatrixNode.cleanDirtyNodes();
    },


    //  Computes distance betwen a point and the viewpoint of a matrix  (modelview)
    distance: function(coord, matrix) {
        return -( coord[0]*matrix[2]+ coord[1]*matrix[6] + coord[2]*matrix[10] + matrix[14]);
    },

    handleCullCallbacksAndTraverse: function(node) {
        var ccb = node.getCullCallback();
        if (ccb) {
            if (!ccb.cull(node, this)) {
                return;
            }
        }
        this.traverse(node);
    },
    // distance betwen view and boundingbox in worldspace
    updateCalculatedNearFar: function(bb,  matrix) {

        var d_near, d_far;

        // efficient computation of near and far, only taking into account the nearest and furthest
        // corners of the bounding box.
        d_near = this.distance(bb.corner(this._bbCornerNear),matrix);
        d_far = this.distance(bb.corner(this._bbCornerFar),matrix);

        if (d_near>d_far) {
            var tmp = d_near;
            d_near = d_far;
            d_far = tmp;
        }

        if (d_far<0.0) {
            // whole object behind the eye point so discard
            return false;
        }
        if (d_near<0.0) {
            d_near = 0.00000001;
        }

        if (d_near<this._computedNear) {
            this._computedNear = d_near;
        }

        if (d_far>this._computedFar) {
            this._computedFar = d_far;
        }

        return true;
    },

    clampProjectionMatrix: function(projection, znear, zfar, nearFarRatio, resultNearFar) {

        var epsilon = 1e-6;
        if (zfar<znear-epsilon) {
            osg.log("clampProjectionMatrix not applied, invalid depth range, znear = " + znear + "  zfar = " + zfar);
            return false;
        }

        var desired_znear, desired_zfar;
        if (zfar<znear+epsilon) {
            // znear and zfar are too close together and could cause divide by zero problems
            // late on in the clamping code, so move the znear and zfar apart.
            var average = (znear+zfar)*0.5;
            znear = average-epsilon;
            zfar = average+epsilon;
            // OSG_INFO << "_clampProjectionMatrix widening znear and zfar to "<<znear<<" "<<zfar<<std::endl;
        }

        if (Math.abs(osg.Matrix.get(projection,0,3))<epsilon  &&
            Math.abs(osg.Matrix.get(projection,1,3))<epsilon  &&
            Math.abs(osg.Matrix.get(projection,2,3))<epsilon ) {
            // OSG_INFO << "Orthographic matrix before clamping"<<projection<<std::endl;

            var delta_span = (zfar-znear)*0.02;
            if (delta_span<1.0) {
                delta_span = 1.0;
            }
            desired_znear = znear - delta_span;
            desired_zfar = zfar + delta_span;

            // assign the clamped values back to the computed values.
            znear = desired_znear;
            zfar = desired_zfar;

            osg.Matrix.set(projection,2,2, -2.0/(desired_zfar-desired_znear));
            osg.Matrix.set(projection,3,2, -(desired_zfar+desired_znear)/(desired_zfar-desired_znear));

            // OSG_INFO << "Orthographic matrix after clamping "<<projection<<std::endl;
        } else {

            // OSG_INFO << "Persepective matrix before clamping"<<projection<<std::endl;
            //std::cout << "_computed_znear"<<_computed_znear<<std::endl;
            //std::cout << "_computed_zfar"<<_computed_zfar<<std::endl;

            var zfarPushRatio = 1.02;
            var znearPullRatio = 0.98;

            //znearPullRatio = 0.99;

            desired_znear = znear * znearPullRatio;
            desired_zfar = zfar * zfarPushRatio;

            // near plane clamping.
            var min_near_plane = zfar*nearFarRatio;
            if (desired_znear<min_near_plane) {
                desired_znear=min_near_plane;
            }

            // assign the clamped values back to the computed values.
            znear = desired_znear;
            zfar = desired_zfar;

            var m22 = osg.Matrix.get(projection,2,2);
            var m32 = osg.Matrix.get(projection,3,2);
            var m23 = osg.Matrix.get(projection,2,3);
            var m33 = osg.Matrix.get(projection,3,3);
            var trans_near_plane = (-desired_znear*m22 + m32)/(-desired_znear*m23+m33);
            var trans_far_plane = (-desired_zfar*m22+m32)/(-desired_zfar*m23+m33);

            var ratio = Math.abs(2.0/(trans_near_plane-trans_far_plane));
            var center = -(trans_near_plane+trans_far_plane)/2.0;

            var matrix = [1.0,0.0,0.0,0.0,
                          0.0,1.0,0.0,0.0,
                          0.0,0.0,ratio,0.0,
                          0.0,0.0,center*ratio,1.0];
            osg.Matrix.postMult(matrix, projection);
            // OSG_INFO << "Persepective matrix after clamping"<<projection<<std::endl;
        }
        if (resultNearFar !== undefined) {
            resultNearFar[0] = znear;
            resultNearFar[1] = zfar;
        }
        return true;
    },

    setStateGraph: function(sg) {
        this._rootStateGraph = sg;
        this._currentStateGraph = sg;
    },
    setRenderStage: function(rg) {
        this._rootRenderStage = rg;
        this._currentRenderBin = rg;
    },

    reset: function () {

        // they are now kept between frames, unless the scene changes.
        // (added or removed child)
        // TODO: more fine grained scenegraph dirty than whole node graph at each change...
        this.resetMatrixStacks();
        this._reserveBoundingBoxStack.reset();
        this._reserveMatrixViewStack.reset();
        this._reserveMatrixModelStack.reset();
        this._reserveLeafStack.reset();
        this._traceNode.reset();
        this._dirtyMatrixNode.reset();

        // update those only if Scene matrix other than camera are dirty...
        this._computedNear = Number.POSITIVE_INFINITY;
        this._computedFar = Number.NEGATIVE_INFINITY;
    },
    getCurrentRenderBin: function() { return this._currentRenderBin; },
    setCurrentRenderBin: function(rb) { this._currentRenderBin = rb; },
    addPositionedAttribute: function (attribute) {
       /* if (this._traceNode.isDirty()) {
           this._reserveMatrixModelStack.dirty();
        }
        var matrix = this._reserveMatrixModelStack.getReserved();
        var recomputeMatrix = this._reserveMatrixModelStack.isDirty() || this._reserveMatrixViewStack.isDirty();
        if (recomputeMatrix) {
            */
           
           var matrix = [];

            matrix = osg.Matrix.mult(this.getCurrentViewMatrix(), this.getCurrentModelMatrix(), []);
        //}
        this._currentRenderBin.getStage().positionedAttribute.push([matrix, attribute]);
    },

    pushStateSet: function (stateset) {
        this._currentStateGraph = this._currentStateGraph.findOrInsert(stateset);
        if (stateset.getBinName() !== undefined) {
            var renderBinStack = this._renderBinStack;
            var currentRenderBin = this._currentRenderBin;
            renderBinStack.push(currentRenderBin);
            this._currentRenderBin = currentRenderBin.getStage().findOrInsert(stateset.getBinNumber(),stateset.getBinName());
        }
    },

    //  Pop the top state set and hence associated state group.
    //  Move the current state group to the parent of the popped
    // state group.
    //
    popStateSet: function () {
        var currentStateGraph = this._currentStateGraph;
        var stateset = currentStateGraph.getStateSet();
        this._currentStateGraph = currentStateGraph.parent;
        if (stateset.getBinName() !== undefined) {
            var renderBinStack = this._renderBinStack;
            if (renderBinStack.length === 0) {
                this._currentRenderBin = this._currentRenderBin.getStage();
            } else {
                this._currentRenderBin = renderBinStack.pop();
            }
        }
    },

    // proxy for cull stack own pop projection matrix
    popProjectionMatrix: function () {
        if (this._computeNearFar === true && this._computedFar >= this._computedNear) {
            var m = this.getCurrentProjectionMatrix();
            this.clampProjectionMatrix(m, this._computedNear, this._computedFar, this._nearFarRatio);
        }
        osg.CullStack.prototype.popProjectionMatrix.call(this);
    },

    apply: function( node ) {
        this[node.objectType].call(this, node);
    },

    // faster path is stack does not change
    //  (and debug out of bounds if it changes when it should not)
    _getReservedLeaf: function() {
        if (this._traceNode.isDirty()) {
            this._reserveLeafStack.dirty();
        }
        return this._reserveLeafStack.getReserved();
    }
})));

osg.CullVisitor.prototype[osg.Camera.prototype.objectType] = function( camera ) {

    var stateset = camera.getStateSet();
    if (stateset) {
        this.pushStateSet(stateset);
    }

    if (camera.light) {
        osg.warn("using node.light is deprecated, using LightSource node instead");
        //this.addPositionedAttribute(camera.light);
    }

    var OldtraversalMask = this.traversalMask;
    if (camera.traversalMask) {
        this.traversalMask = camera.traversalMask & this.traversalMask;
    }
    var originalView = this.getCurrentViewMatrix();
    var originalModel = this.getCurrentModelMatrix();
    var originalProjectionMatrix = this.getCurrentProjectionMatrix();

    if (this._traceNode.isDirty() || camera.isDirtyMatrix() || this._reserveMatrixViewStack.isDirty()) {
        this._reserveMatrixViewStack.dirty();
        if (camera.getRenderOrder() === osg.Camera.NESTED_RENDER){
            this._reserveMatrixModelStack.dirty();
        }
        this._reserveBoundingBoxStack.dirty();
        this._dirtyMatrixNode.logNode(camera);
        recompute = true;
    }

    var view = this._reserveMatrixViewStack.getReserved();
    var model = this._reserveMatrixModelStack.getReserved();
    var projection = this._reserveMatrixViewStack.getReserved();

    var boundingbox = this._reserveBoundingBoxStack.getReserved();
    //var recompute = this._reserveMatrixViewStack.isDirty();
    if (recompute) {
        if (camera.getReferenceFrame() === osg.Transform.RELATIVE_RF) {
            this._reserveMatrixModelStack.dirty();

            osg.Matrix.mult(originalProjectionMatrix, camera.getProjectionMatrix(), projection);
            osg.Matrix.makeIdentity(model);
            osg.Matrix.mult(originalView, originalModel, view);
            osg.Matrix.mult(view, camera.getViewMatrix(), view);

        } else {
            // absolute
            osg.Matrix.copy(camera.getViewMatrix(), view);
            osg.Matrix.copy(camera.getProjectionMatrix(), projection);
            // make sure to reset to identity in case of 
            // treenode changes after initialisations
            osg.Matrix.makeIdentity(model);
        }
        boundingbox.init();
    }

    this.pushProjectionMatrix(projection);
    this.pushViewMatrix(view);
    this.pushModelMatrix(model);

    if (camera.getViewport()) {
        this.pushViewport(camera.getViewport());
    }
    this.pushBoundingbox(boundingbox);

    // save current state of the camera
    var previous_znear = this._computedNear;
    var previous_zfar = this._computedFar;
    var previous_cullsettings = new osg.CullSettings();
    previous_cullsettings.setCullSettings(this);

    this._computedNear = Number.POSITIVE_INFINITY;
    this._computedFar = Number.NEGATIVE_INFINITY;
    this.setCullSettings(camera);

    // nested camera
    if (camera.getRenderOrder() === osg.Camera.NESTED_RENDER) {

        this.handleCullCallbacksAndTraverse(camera);

    } else {
        // not tested

        var previous_stage = this.getCurrentRenderBin().getStage();


        // use render to texture stage
        var rtts = new osg.RenderStage();
        // caching per camera of sorted render leafs Oppotunitu
        // if (scenegraph is not dirty) reuse renderstage/bin/leaf
        // and just do the cullcback and culling
        // (setting leaf to invisible instead of not adding them ?)
        camera.renderStage = rtts;

        rtts.setCamera(camera);
        rtts.setClearDepth(camera.getClearDepth());
        rtts.setClearColor(camera.getClearColor());
        rtts.setClearMask(camera.getClearMask());

        var vp;
        if (camera.getViewport() === undefined) {
            vp = previous_stage.getViewport();
        } else {
            vp = camera.getViewport();
        }
        rtts.setViewport(vp);

        // skip positional state for now
        // ...

        var previousRenderBin = this.getCurrentRenderBin();

        this.setCurrentRenderBin(rtts);

        this.handleCullCallbacksAndTraverse(camera);

        this.setCurrentRenderBin(previousRenderBin);

        if (camera.getRenderOrder() === osg.Camera.PRE_RENDER) {
            this.getCurrentRenderBin().getStage().addPreRenderStage(rtts, camera.renderOrderNum);
        } else {
            this.getCurrentRenderBin().getStage().addPostRenderStage(rtts, camera.renderOrderNum);
        }
    }

    camera.boundingbox = boundingbox;
    this.popBoundingbox(boundingbox);

    this.popModelMatrix();
    this.popViewMatrix();
    this.popProjectionMatrix();


    camera.near = this._computedNear;
    camera.far = this._computedFar;

    if (camera.getViewport()) {
        this.popViewport();
    }

    this.traversalMask = OldtraversalMask;
    // restore previous state of the camera
    this.setCullSettings(previous_cullsettings);

    this._computedNear = previous_znear;
    this._computedFar = previous_zfar;

    if (stateset) {
        this.popStateSet();
    }
};

osg.CullVisitor.prototype[osg.MatrixTransform.prototype.objectType] = function (node) {

    if (this._traceNode.isDirty() || node.isDirtyMatrix()) {
        this._reserveMatrixModelStack.dirty();
        this._dirtyMatrixNode.logNode(node);
    }

    var matrixModel = this._reserveMatrixModelStack.getReserved();

    var recompute = this._reserveMatrixModelStack.isDirty();
    if (recompute) {
        if (node.getReferenceFrame() === osg.Transform.RELATIVE_RF) {

            var lastmodelmatrixStack = this.getCurrentModelMatrix();
            osg.Matrix.mult(lastmodelmatrixStack, node.getMatrix(), matrixModel);
        } else {
            // absolute
            osg.Matrix.copy(node.getMatrix(), matrixModel);
        }
    }

    this.pushModelMatrix(matrixModel);

    var stateset = node.getStateSet();
    if (stateset) {
        this.pushStateSet(stateset);
    }

    if (node.light) {
        osg.warn("using node.light is deprecated, using LightSource node instead");
        //this.addPositionedAttribute(node.light);
    }

    this.handleCullCallbacksAndTraverse(node);

    if (stateset) {
        this.popStateSet();
    }

    this.popModelMatrix();
};

osg.CullVisitor.prototype[osg.Projection.prototype.objectType] = function (node) {

    if (this._traceNode.isDirty()) {
        this._reserveMatrixViewStack.dirty();
        this._dirtyMatrixNode.logNode(node);
    }

    var matrix = this._reserveMatrixViewStack();
    var recompute = this._reserveMatrixViewStack.isDirty();
    if (recompute) {
        lastMatrixStack = this.getCurrentProjectionMatrix();
        osg.Matrix.mult(lastMatrixStack, node.getProjectionMatrix(), matrix);
    }

    this.pushProjectionMatrix(matrix);

    var stateset = node.getStateSet();

    if (stateset) {
        this.pushStateSet(stateset);
    }

    this.handleCullCallbacksAndTraverse(node);

    if (stateset) {
        this.popStateSet();
    }

    this.popProjectionMatrix();
};

osg.CullVisitor.prototype[osg.Node.prototype.objectType] = function (node) {

    if ( this._traceNode.isDirty() ) {
        this._reserveMatrixModelStack.dirty();
    }

    var stateset = node.getStateSet();
    if (stateset) {
        this.pushStateSet(stateset);
    }

    if (node.light) {
        osg.warn("using node.light is deprecated, using LightSource node instead");
        //this.addPositionedAttribute(node.light);
    }

    this.handleCullCallbacksAndTraverse(node);

    if (stateset) {
        this.popStateSet();
    }
};
osg.CullVisitor.prototype[osg.LightSource.prototype.objectType] = function (node) {

    if (this._traceNode.isDirty() || node.isDirtyMatrix()) {
        this._reserveMatrixModelStack.dirty();
        this._dirtyMatrixNode.logNode(node);
    }

    var matrixModel = this._reserveMatrixModelStack.getReserved();

    var recompute = this._reserveMatrixModelStack.isDirty();
    if (recompute) {
        if (node.getReferenceFrame() === osg.Transform.RELATIVE_RF) {

            var lastmodelmatrixStack = this.getCurrentModelMatrix();
            osg.Matrix.mult(lastmodelmatrixStack, node.getMatrix(), matrixModel);
        } else {
            // absolute
            osg.Matrix.copy(node.getMatrix(), matrixModel);
        }
    }
    this.pushModelMatrix(matrixModel);

    var stateset = node.getStateSet();
    if (stateset) {
        this.pushStateSet(stateset);
    }

    var light = node.getLight();
    if (light) {
        this.addPositionedAttribute(light);
    }

    this.handleCullCallbacksAndTraverse(node);

    if (stateset) {
        this.popStateSet();
    }
    this.popModelMatrix();
};

osg.CullVisitor.prototype[osg.Geometry.prototype.objectType] = function (node) {


    var view = this.getCurrentViewMatrix();
    var model = this.getCurrentModelMatrix();
    var recompute = this._traceNode.isDirty() || this._reserveMatrixModelStack.isDirty();
    if (recompute) {
        //this._reserveMatrixModelStack.dirty();
        this._reserveBoundingBoxStack.dirty();
    }
    var bb = this._reserveBoundingBoxStack.getReserved();

    if (recompute) {
        var localbb = node.getBoundingBox();
        osg.Matrix.transformBoundingbox( model, localbb,  bb);
    }
    var cameraBoundingbox = this.getCurrentBoundingbox();
    if (cameraBoundingbox) {
        cameraBoundingbox.expandByVec3(bb._min);
        cameraBoundingbox.expandByVec3(bb._max);
    }


    // have to do this here, otherwise if it
    // gets pruned by updatenearfar 
    // (because behind the camera)
    // the slot isn't reserved, thus,
    // getting out of reserved bound request
    var leaf = this._getReservedLeaf();
    leaf.node = node;
    leaf.bb = bb;

    var validBB = bb.valid();
    if (this._computeNearFar && validBB) {
        // could do that and get depth at once.
        if (!this.updateCalculatedNearFar(bb, view)) {
            return;
        }
    }

    var stateset = node.getStateSet();
    if (stateset) {
        this.pushStateSet(stateset);
    }
    this.handleCullCallbacksAndTraverse(node);

    var leafs = this._currentStateGraph.leafs;
    if (leafs.length === 0) {
        this._currentRenderBin.addStateGraph(this._currentStateGraph);
    }

    var depth = 0;
    if (validBB) {
        // cache center ?
        depth = this.distance(bb.center(), view);
    }
    if (isNaN(depth)) {
        osg.warn("warning geometry has a NaN depth, " + model + " center " + bb.center());
    } else  {
        // TODO reuse leafs, direclty?
        //  for now give flicker if doing nested camerastr
        //if (this._sceneGraphDirty){
            leaf.id = this._reserveLeafStack.getIndex();
            leaf.parent = this._currentStateGraph;

            leaf.projection = this.getCurrentProjectionMatrix();
            leaf.view = view;
            leaf.model = model;
            //if (node.modelview)
             //   leaf.modelview = modelview;
            //if (node.modelviewNormal)
            //    leaf.modelviewNormal = modelviewNormal;

            leaf.geometry = node;
            leaf.depth = depth;
        //}
        leafs.push(leaf);
    }

    if (stateset) {
        this.popStateSet();
    }
};

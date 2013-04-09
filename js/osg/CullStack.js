osg.CullStack = function() {
    // stacks are real heap, with pop and push upon
    // node tree traversal
    // (no memory between frame)
    this._modelviewMatrixStack = new Array(50);
    this._modelviewMatrixStackCurrent = -1;

    this._modelMatrixStack = new Array(50);
    this._modelMatrixStackCurrent = -1;

    this._viewMatrixStack = new Array(50);
    this._viewMatrixStackCurrent = -1;

    this._projectionMatrixStack = new Array(10);
    this._projectionMatrixStackCurrent = -1;

    this._viewportStack = new Array(10);
    this._viewportCurrent = -1;

    this._boundingboxStack = new Array(10);
    this._boundingboxCurrent = -1;

    this._bbCornerFar = 0;
    this._bbCornerNear = 0;

    this._dirtyStack = true;
};

osg.CullStack.prototype = {
    // 0 values of matrix stack needs to be already set.
    resetMatrixStacks: function() {
        this._modelviewMatrixStackCurrent = -1;
        this._modelMatrixStackCurrent = -1;
        this._viewMatrixStackCurrent = -1;
        this._projectionMatrixStackCurrent = -1;
        this._viewportCurrent = -1;
        this._boundingboxCurrent = -1;

    },
    getCurrentProjectionMatrix: function() {
        return this._projectionMatrixStack[this._projectionMatrixStackCurrent];
    },
    getCurrentModelviewMatrix: function() {
        return this._modelviewMatrixStack[this._modelviewMatrixStackCurrent];
    },
    getCurrentModelMatrix: function() {
        return this._modelMatrixStack[this._modelMatrixStackCurrent];
    },
    getCurrentViewMatrix: function() {
        return this._viewMatrixStack[this._viewMatrixStackCurrent];
    },
    getCurrentBoundingbox: function () {
        if (this._boundingboxCurrent ===  -1) {
            return undefined;
        }
        return this._boundingboxStack[this._boundingboxCurrent];
    },
    getViewport: function () {
        if (this._viewportCurrent ===  -1) {
            return undefined;
        }
        return this._viewportStack[this._viewportCurrent];
    },
    pushViewport: function (vp) {
        this._viewportCurrent++;
        if (this._viewportStack.length < this._viewportCurrent)
            this._viewportStack.push(vp);
        else
            this._viewportStack[this._viewportCurrent] = vp;
    },
    popViewport: function () {
        //this._viewportStack.pop();
        this._viewportCurrent--;
    },
    pushBoundingbox: function (boundingbox) {
        this._boundingboxCurrent++;
        if (this._boundingboxStack.length < this._boundingboxCurrent)
            this._boundingboxStack.push(boundingbox);
        else
            this._boundingboxStack[this._boundingboxCurrent] = boundingbox;
    },
    popBoundingbox: function () {
        this._boundingboxCurrent--;
    },
    pushModelMatrix: function (matrix) {
        this._modelMatrixStackCurrent++;
        if (this._modelMatrixStack.length < this._modelMatrixStackCurrent)
            this._modelMatrixStack.push(matrix);
        else
            this._modelMatrixStack[this._modelMatrixStackCurrent] = matrix;

/*            var lookVector = this.getLookVectorLocal();
            this._bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);
            this._bbCornerNear = (~this._bbCornerFar)&7;*/
    },
    popModelMatrix: function () {
        //this._modelMatrixStack.pop();
        this._modelMatrixStackCurrent--;

            /*var lookVector;
            if ( this._viewMatrixStackCurrent > -1) {
                lookVector = this.getLookVectorLocal();
            } else {
                lookVector = [0,0,-1];
            }
            this._bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);
            this._bbCornerNear = (~this._bbCornerFar)&7;*/
    },
    getLookVectorLocal: function() {
        var m = this.getCurrentViewMatrix();
        return [ -m[2], -m[6], -m[10] ];
    },
    pushModelviewMatrix: function (matrix) {
        this._modelviewMatrixStackCurrent++;
        if (this._modelviewMatrixStack.length < this._modelviewMatrixStackCurrent)
            this._modelviewMatrixStack.push(matrix);
        else
            this._modelviewMatrixStack[this._modelviewMatrixStackCurrent] = matrix;

        //if (osg.oldModelViewMatrixMode){
            var lookVector = this.getLookVectorLocal();
            this._bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);
            this._bbCornerNear = (~this._bbCornerFar)&7;
       // }
    },
    popModelviewMatrix: function () {
        //this._modelviewMatrixStack.pop();
        this._modelviewMatrixStackCurrent--;

       // if (osg.oldModelViewMatrixMode){
            var lookVector;
            if ( this._modelviewMatrixStackCurrent > -1) {
                lookVector = this.getLookVectorLocal();
            } else {
                lookVector = [0,0,-1];
            }
            this._bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);
            this._bbCornerNear = (~this._bbCornerFar)&7;
       // }

    },
    pushViewMatrix: function (matrix) {
        this._viewMatrixStackCurrent++;
        if (this._viewMatrixStack.length < this._viewMatrixStackCurrent)
            this._viewMatrixStack.push(matrix);
        else
            this._viewMatrixStack[this._viewMatrixStackCurrent] = matrix;

       var lookVector = this.getLookVectorLocal();
        this._bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);
        this._bbCornerNear = (~this._bbCornerFar)&7;
    },
    popViewMatrix: function () {
        //this._viewMatrixStack.pop();
        this._viewMatrixStackCurrent--;

        var lookVector;
        if (this._viewMatrixStackCurrent > -1) {
            lookVector = this.getLookVectorLocal();
        } else {
            lookVector = [0,0,-1];
        }
        this._bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);
        this._bbCornerNear = (~this._bbCornerFar)&7;
    },
    pushProjectionMatrix: function (matrix) {
        this._projectionMatrixStackCurrent++;
        if (this._projectionMatrixStack.length < this._projectionMatrixStackCurrent)
            this._projectionMatrixStack.push(matrix);
        else
            this._projectionMatrixStack[this._projectionMatrixStackCurrent] = matrix;
    },
    popProjectionMatrix: function () {
        //this._projectionMatrixStack.pop();
        this._projectionMatrixStackCurrent--;
    }
};

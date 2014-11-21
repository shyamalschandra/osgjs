define( [
    'osg/Node',
    'osg/MatrixTransform',
    'osg/Depth',
    'osg/Uniform',
    'osg/Vec2',
    'osg/Vec3',
    'osg/Matrix',
    'osg/Quat',
    'osgUtil/IntersectionVisitor',
    'osgUtil/LineSegmentIntersector',
    'osgUtil/GizmoGeometry',
    'osg/Utils'
], function ( Node, MatrixTransform, Depth, Uniform, Vec2, Vec3, Matrix, Quat, IntersectionVisitor, LineSegmentIntersector, GizmoGeometry, MACROUTILS ) {

    'use strict';

    var HideCullCallback = function () {};
    HideCullCallback.prototype = {
        cull: function () {
            return false;
        }
    };

    var LineLineIntersector = function ( rotateNode ) {
        this._rotateNode = rotateNode; // node to skip
        this._tr = 0.0; // translate distance
        LineSegmentIntersector.call( this );
    };
    LineLineIntersector.prototype = MACROUTILS.objectInherit( LineSegmentIntersector.prototype, {
        enter: ( function () {
            var axis = Vec3.create();
            var dir = Vec3.create();

            return function ( node ) {
                if ( node === this._rotateNode )
                    return false;
                if ( node.nbAxis === undefined )
                    return true;
                Vec3.init( axis );

                axis[ node.nbAxis ] = 1.0;
                Vec3.normalize( Vec3.sub( this._iEnd, this._iStart, dir ), dir );

                var a01 = -Vec3.dot( dir, axis );
                var b0 = Vec3.dot( this._iStart, dir );
                var det = Math.abs( 1.0 - a01 * a01 );

                var b1 = -Vec3.dot( this._iStart, axis );
                this._tr = ( a01 * b0 - b1 ) / det;
                return false;
            };
        } )(),
        intersect: function () {
            return false;
        }
    } );


    // MatrixTransform _______________
    //           |                    |
    //    ____ Rotate             Translate
    //   |     / | \                / | \
    //   MT   MT MT MT             MT MT MT
    //   |     \ | /                \ | /
    // FullArc  \|/                  \|/
    //       ____|_____            ___|________
    //      |          |          |            | 
    //   DrawArc   HideNode   DrawArrow    HideNode
    //                 |                       |
    //              PickArc                 PickArc
    var NodeGizmo = function ( viewer ) {
        MatrixTransform.call( this );

        this._viewer = viewer;
        this._canvas = viewer.getGraphicContext().canvas;
        this._manipulator = viewer.getManipulator();

        // rotate
        this._rotateNode = new MatrixTransform();

        // translate
        this._translateNode = new MatrixTransform();

        //for realtime picking
        this._hoverNode = null; // the hovered x/y/z MT node
        this._keepHoverColor = null;

        // for editing
        this._isEditing = true;
        this._editLine = {
            origin: Vec3.create(),
            direction: Vec3.create(),
            offsetTranslate: Vec2.create()
        };
        this._editLocal = Matrix.create();
        this._editWorldTrans = Matrix.create();
        this._editInvWorldScaleRot = Matrix.create();
        this._debugNode = new Node();

        this._attachedNode = null;
        this.attachTo( null );

        this.init();
    };

    // picking masks
    NodeGizmo.PICK_X = 1 << 0;
    NodeGizmo.PICK_Y = 1 << 1;
    NodeGizmo.PICK_Z = 1 << 2;
    NodeGizmo.PICK_ARC = 1 << 3;
    NodeGizmo.PICK_ARROW = 1 << 4;
    NodeGizmo.NO_PICK = 1 << 5;
    NodeGizmo.PICK_XYZ = NodeGizmo.PICK_X | NodeGizmo.PICK_Y | NodeGizmo.PICK_Z;

    NodeGizmo.prototype = MACROUTILS.objectInherit( MatrixTransform.prototype, {
        init: function () {
            this.getOrCreateStateSet().setAttributeAndModes( new Depth( Depth.DISABLE ) );
            // this.getOrCreateStateSet().setAttributeAndModes( new CullFace( CullFace.BACK ) );

            var UpdateCallback = function () {};
            UpdateCallback.prototype = {
                update: this.updateGizmo.bind( this )
            };
            this.addUpdateCallback( new UpdateCallback() );
            this.addChild( this.initNodeTranslate() );
            this.addChild( this.initNodeRotate() );
            if ( this._debugNode ) {
                this._debugNode.addChild( GizmoGeometry.createDebugLineGeometry() );
                this.addChild( this._debugNode );
                this._debugNode.setNodeMask( 0x0 );
            }
            // this._rotateNode.setNodeMask( 0x0 ); // disable rotate gizmo

            var canvas = this._canvas;
            canvas.addEventListener( 'dblclick', this.onDblClick.bind( this ) );
            canvas.addEventListener( 'mousemove', this.onMouseMove.bind( this ) );
            canvas.addEventListener( 'mousedown', this.onMouseDown.bind( this ) );
            canvas.addEventListener( 'mouseup', this.onMouseUp.bind( this ) );
            canvas.addEventListener( 'mouseout', this.onMouseUp.bind( this ) );
        },
        attachTo: function ( node ) {
            if ( !node ) {
                this._attachedNode = null;
                this.setNodeMask( 0x0 );
                return;
            }
            // insert MatrixTransform node before geometry node
            var pr = node.getParents();
            if ( pr[ 0 ].isInsertedMT === undefined ) {
                var imt = new MatrixTransform();
                while ( pr.length > 0 ) {
                    pr[ 0 ].addChild( imt );
                    pr[ 0 ].removeChild( node );
                }
                imt.addChild( node );
                imt.isInsertedMT = true;
                node = imt;
            } else {
                node = pr[ 0 ];
            }

            this._attachedNode = node;
            this.setNodeMask( NodeGizmo.NO_PICK );
        },
        onNodeHovered: function ( hit ) {
            if ( this._hoverNode )
                this._hoverNode.getStateSet().getUniform( 'uColor' ).set( this._keepHoverColor );
            if ( !hit ) {
                this._hoverNode = null;
                return;
            }
            var node = hit.nodepath[ hit.nodepath.length - 3 ];
            var unif = node.getStateSet().getUniform( 'uColor' );
            this._hoverNode = node;
            this._keepHoverColor = unif.get();
            unif.set( [ 1.0, 1.0, 0.0, 1.0 ] );
        },
        initNodeTranslate: function () {
            // cone arrow
            var mtCone = new MatrixTransform();
            Matrix.makeTranslate( 0.0, 0.0, 1.5, mtCone.getMatrix() );
            mtCone.addChild( GizmoGeometry.createCylinderGeometry( 0.0, 0.07, 0.3, 32, 1, true, true ) );
            // arrow base
            var mtArrow = new MatrixTransform();
            Matrix.makeTranslate( 0.0, 0.0, 0.75, mtArrow.getMatrix() );
            mtArrow.addChild( GizmoGeometry.createCylinderGeometry( 0.01, 0.01, 1.5, 32, 1, true, true ) );
            // draw arrow
            var drawArrow = new Node();
            drawArrow.addChild( mtArrow );
            drawArrow.addChild( mtCone );

            var pickArrow = GizmoGeometry.createCylinderGeometry( 0.1, 0.1, 1.8, 32, 1, true, true );

            var mtX = new MatrixTransform();
            var mtY = new MatrixTransform();
            var mtZ = new MatrixTransform();
            mtX.nbAxis = 0;
            mtY.nbAxis = 1;
            mtZ.nbAxis = 2;

            Matrix.makeRotate( -Math.PI * 0.5, 0.0, 1.0, 0.0, mtX.getMatrix() );
            Matrix.makeRotate( Math.PI * 0.5, 1.0, 0.0, 0.0, mtY.getMatrix() );

            var hideNode = new MatrixTransform();
            hideNode.setCullCallback( new HideCullCallback() );
            Matrix.makeTranslate( 0.0, 0.0, 1.8 * 0.5, hideNode.getMatrix() );
            hideNode.addChild( pickArrow );

            // set masks
            drawArrow.setNodeMask( NodeGizmo.NO_PICK );
            pickArrow.setNodeMask( NodeGizmo.PICK_ARROW );
            mtX.setNodeMask( NodeGizmo.PICK_X );
            mtY.setNodeMask( NodeGizmo.PICK_Y );
            mtZ.setNodeMask( NodeGizmo.PICK_Z );

            mtX.addChild( drawArrow );
            mtY.addChild( drawArrow );
            mtZ.addChild( drawArrow );

            mtX.addChild( hideNode );
            mtY.addChild( hideNode );
            mtZ.addChild( hideNode );

            mtX.getOrCreateStateSet().addUniform( Uniform.createFloat4( [ 1.0, 0.0, 0.0, 1.0 ], 'uColor' ) );
            mtY.getOrCreateStateSet().addUniform( Uniform.createFloat4( [ 0.0, 1.0, 0.0, 1.0 ], 'uColor' ) );
            mtZ.getOrCreateStateSet().addUniform( Uniform.createFloat4( [ 0.0, 0.0, 1.0, 1.0 ], 'uColor' ) );

            var translate = this._translateNode;
            translate.addChild( mtX );
            translate.addChild( mtY );
            translate.addChild( mtZ );
            return translate;
        },
        initNodeRotate: function () {
            var drawArcXYZ = GizmoGeometry.createTorusGeometry( 1.0, 0.007, 6, 64, Math.PI * 2 );
            var drawArc = GizmoGeometry.createTorusGeometry( 1.0, 0.007, 6, 64, Math.PI );
            var pickArc = GizmoGeometry.createTorusGeometry( 1.0, 0.1, 6, 64, Math.PI );

            var mtXYZ = new MatrixTransform();
            var mtX = new MatrixTransform();
            var mtY = new MatrixTransform();
            var mtZ = new MatrixTransform();
            mtX.nbAxis = 0;
            mtY.nbAxis = 1;
            mtZ.nbAxis = 2;

            var hideNode = new Node();
            hideNode.setCullCallback( new HideCullCallback() );
            hideNode.addChild( pickArc );

            // set masks
            drawArcXYZ.setNodeMask( NodeGizmo.NO_PICK );
            drawArc.setNodeMask( NodeGizmo.NO_PICK );
            pickArc.setNodeMask( NodeGizmo.PICK_ARC );
            mtX.setNodeMask( NodeGizmo.PICK_X );
            mtY.setNodeMask( NodeGizmo.PICK_Y );
            mtZ.setNodeMask( NodeGizmo.PICK_Z );

            mtXYZ.addChild( drawArcXYZ );
            mtX.addChild( drawArc );
            mtY.addChild( drawArc );
            mtZ.addChild( drawArc );

            mtX.addChild( hideNode );
            mtY.addChild( hideNode );
            mtZ.addChild( hideNode );

            mtXYZ.getOrCreateStateSet().addUniform( Uniform.createFloat4( [ 0.2, 0.2, 0.2, 1.0 ], 'uColor' ) );
            mtX.getOrCreateStateSet().addUniform( Uniform.createFloat4( [ 1.0, 0.0, 0.0, 1.0 ], 'uColor' ) );
            mtY.getOrCreateStateSet().addUniform( Uniform.createFloat4( [ 0.0, 1.0, 0.0, 1.0 ], 'uColor' ) );
            mtZ.getOrCreateStateSet().addUniform( Uniform.createFloat4( [ 0.0, 0.0, 1.0, 1.0 ], 'uColor' ) );

            var rotate = this._rotateNode;
            rotate.addChild( mtXYZ );
            rotate.addChild( mtX );
            rotate.addChild( mtY );
            rotate.addChild( mtZ );
            return rotate;
        },
        updateArcRotation: ( function () {
            var quat = Quat.create();
            var quatx = Quat.makeRotate( -Math.PI * 0.5, 0.0, 1.0, 0.0, Quat.create() );
            var quaty = Quat.makeRotate( -Math.PI * 0.5, 1.0, 0.0, 0.0, Quat.create() );
            return function ( eye ) {
                var rotateNode = this._rotateNode;
                var arcs = rotateNode.getChildren();
                // eye arc
                quat[ 0 ] = -eye[ 1 ];
                quat[ 1 ] = eye[ 0 ];
                quat[ 2 ] = 0.0;
                quat[ 3 ] = 1.0 + eye[ 2 ];
                Quat.normalize( quat, quat );
                Matrix.makeRotateFromQuat( quat, arcs[ 0 ].getMatrix() );
                // x arc
                Quat.makeRotate( Math.atan2( eye[ 2 ], eye[ 1 ] ), 1.0, 0.0, 0.0, quat );
                Quat.mult( quat, quatx, quat );
                Matrix.makeRotateFromQuat( quat, arcs[ 1 ].getMatrix() );
                // y arc
                Quat.makeRotate( Math.atan2( -eye[ 0 ], -eye[ 2 ] ), 0.0, 1.0, 0.0, quat );
                Quat.mult( quat, quaty, quat );
                Matrix.makeRotateFromQuat( quat, arcs[ 2 ].getMatrix() );
                // z arc
                Quat.makeRotate( Math.atan2( -eye[ 0 ], eye[ 1 ] ), 0.0, 0.0, 1.0, quat );
                Matrix.makeRotateFromQuat( quat, arcs[ 3 ].getMatrix() );

                arcs[ 1 ].dirtyBound();
                arcs[ 2 ].dirtyBound();
                arcs[ 3 ].dirtyBound();
            };
        } )(),
        updateGizmo: ( function () {
            var eye = Vec3.create();
            var trVec = Vec3.create();
            var tmpVec = Vec3.create();

            var temp = Matrix.create();
            var trWorld = Matrix.create();
            var invScale = Matrix.create();
            var scGiz = Matrix.create();

            return function () {
                if ( !this._attachedNode )
                    return;
                var worldMat = this._attachedNode.getWorldMatrices()[ 0 ];

                // world scale
                Matrix.getScale( worldMat, tmpVec );
                Matrix.makeScale( tmpVec[ 0 ], tmpVec[ 1 ], tmpVec[ 2 ], invScale );
                Matrix.inverse( invScale, invScale );
                // world trans
                Matrix.getTrans( worldMat, trVec );
                Matrix.makeTranslate( trVec[ 0 ], trVec[ 1 ], trVec[ 2 ], trWorld );

                // normalize gizmo size
                var scaleFov = Matrix.getScale( this._viewer.getCamera().getProjectionMatrix(), tmpVec )[ 0 ];
                this._manipulator.getEyePosition( eye );
                var scaleFactor = Vec3.distance( eye, trVec ) / ( 8 * scaleFov );
                Matrix.makeScale( scaleFactor, scaleFactor, scaleFactor, scGiz );

                // gizmo node
                Matrix.mult( trWorld, scGiz, this.getMatrix() );

                // rotate node
                Matrix.mult( worldMat, invScale, temp );
                temp[ 12 ] = temp[ 13 ] = temp[ 14 ] = 0.0;
                Matrix.copy( temp, this._rotateNode.getMatrix() );

                Vec3.sub( eye, trVec, eye );
                Vec3.normalize( eye, eye );

                Matrix.inverse( temp, temp );
                Matrix.transformVec3( temp, eye, eye );
                this.updateArcRotation( eye );

                this._rotateNode.dirtyBound();
                this._translateNode.dirtyBound();
            };
        } )(),
        computeNearestIntersection: ( function () {
            var sortByRatio = function ( a, b ) {
                return a.ratio - b.ratio;
            };

            return function ( e, tmask ) {
                var coordx = e.offsetX === undefined ? e.layerX : e.offsetX;
                var coordy = e.offsetY === undefined ? e.layerY : e.offsetY;

                // canvas to webgl coord
                var canvas = this._canvas;
                coordx = coordx * ( canvas.width / canvas.clientWidth );
                coordy = ( canvas.clientHeight - coordy ) * ( canvas.height / canvas.clientHeight );

                var hits = this._viewer.computeIntersections( coordx, coordy, tmask || 1 );

                if ( hits.length === 0 )
                    return;
                hits.sort( sortByRatio );
                return hits[ 0 ];
            };
        } )(),
        setOnlyGizmoPicking: function () {
            // enable picking only for the gizmo
            this._viewer.getCamera().addChild( this );
            this._viewer.getSceneData().setNodeMask( 0x0 );
            this.setNodeMask( ~0x0 );
        },
        setOnlyScenePicking: function () {
            this._viewer.getCamera().removeChild( this );
            this._viewer.getSceneData().setNodeMask( ~0x0 );
            this.setNodeMask( NodeGizmo.NO_PICK );
        },
        pickGizmo: function ( e, tmask ) {
            this.setOnlyGizmoPicking();
            var hit = this.computeNearestIntersection( e, tmask );
            this.setOnlyScenePicking();
            return hit;
        },
        getCanvasPositionFromWorldPoint: function ( worldPoint, out ) {
            var cam = this._viewer.getCamera();
            var mat = Matrix.create();
            Matrix.preMult( mat, cam.getViewport() ? cam.getViewport().computeWindowMatrix() : Matrix.create() );
            Matrix.preMult( mat, cam.getProjectionMatrix() );
            Matrix.preMult( mat, cam.getViewMatrix() );

            var screenPoint = out || Vec3.create();
            Matrix.transformVec3( mat, worldPoint, screenPoint );

            // canvas to webgl coord
            var canvas = this._canvas;
            out[ 0 ] = out[ 0 ] / ( canvas.width / canvas.clientWidth );
            out[ 1 ] = canvas.clientHeight - out[ 1 ] / ( canvas.height / canvas.clientHeight );
            return out;
        },
        onDblClick: function ( e ) {
            this.setNodeMask( 0x0 );
            var hit = this.computeNearestIntersection( e );
            this.setNodeMask( NodeGizmo.NO_PICK );
            this.attachTo( hit ? hit.nodepath[ hit.nodepath.length - 1 ] : hit );
        },
        onMouseDown: function ( e ) {
            if ( !this._hoverNode || !this._attachedNode )
                return;
            this._viewer._eventProxy.StandardMouseKeyboard._enable = false;

            var hit = this.pickGizmo( e, this._hoverNode.getNodeMask() | NodeGizmo.PICK_ARC | NodeGizmo.PICK_ARROW );
            if ( !hit )
                return;

            var hitNode = hit.nodepath[ hit.nodepath.length - 1 ];
            Matrix.copy( this._attachedNode.getMatrix(), this._editLocal );
            this._isEditing = true;

            if ( hitNode.getNodeMask() & NodeGizmo.PICK_ARC )
                this.startRotateEdit( e, hit );
            else if ( hitNode.getNodeMask() & NodeGizmo.PICK_ARROW ) {
                // save the world translation
                var wm = this._attachedNode.getWorldMatrices()[ 0 ];
                Matrix.makeTranslate( wm[ 12 ], wm[ 13 ], wm[ 14 ], this._editWorldTrans );
                // save the inv of world rotation + scale
                Matrix.copy( wm, this._editInvWorldScaleRot );
                // removes translation
                this._editInvWorldScaleRot[ 12 ] = this._editInvWorldScaleRot[ 13 ] = this._editInvWorldScaleRot[ 14 ] = 0.0;
                Matrix.inverse( this._editInvWorldScaleRot, this._editInvWorldScaleRot );

                this.startTranslateEdit( e );
            }
        },
        startRotateEdit: function ( e, hit ) {

            var normal = Matrix.create();
            var gizmoMat = this._rotateNode.getWorldMatrices()[ 0 ];
            Matrix.copy( this._viewer.getCamera().getViewMatrix(), normal );
            Matrix.preMult( normal, gizmoMat );
            normal[ 12 ] = 0.0;
            normal[ 13 ] = 0.0;
            normal[ 14 ] = 0.0;
            Matrix.inverse( normal, normal );
            Matrix.transpose( normal, normal );

            // center of gizmo on screen
            var projCenter = Vec3.create();
            Matrix.transformVec3( gizmoMat, projCenter, projCenter );
            this.getCanvasPositionFromWorldPoint( projCenter, projCenter );

            // compute tangent direction
            var sign = this._hoverNode.nbAxis === 0 ? -1.0 : 1.0;
            var tang = Vec3.create();
            tang[ 0 ] = sign * hit.point[ 1 ];
            tang[ 1 ] = -sign * hit.point[ 0 ];
            tang[ 2 ] = hit.point[ 2 ];

            // project tangent on screen
            var projArc = Vec3.create();
            Matrix.transformVec3( this._hoverNode.getMatrix(), tang, projArc );
            Matrix.transformVec3( gizmoMat, projArc, projArc );
            this.getCanvasPositionFromWorldPoint( projArc, projArc );

            var line = this._editLine;
            Vec2.sub( projArc, projCenter, line.direction );
            Vec2.normalize( line.direction, line.direction );

            var x = e.offsetX === undefined ? e.layerX : e.offsetX;
            var y = e.offsetY === undefined ? e.layerY : e.offsetY;
            line.origin[ 0 ] = x;
            line.origin[ 1 ] = y;

            // draw help line
            if ( this._debugNode ) {
                var h = Math.max( this._canvas.clientWidth, this._canvas.clientHeight );
                var nx = line.direction[ 0 ] * h;
                var ny = line.direction[ 1 ] * h;
                this.drawLineCanvasDebug( x + nx, y + ny, x - nx, y - ny );
            }
        },
        startTranslateEdit: function ( e ) {
            var line = this._editLine;
            var origin = line.origin;
            var dir = line.direction;

            // 3d origin (center of gizmo)
            var gizmoMat = this._translateNode.getWorldMatrices()[ 0 ];
            Matrix.getTrans( gizmoMat, origin );

            // 3d direction
            Vec3.init( dir );
            dir[ this._hoverNode.nbAxis ] = 1.0;
            Vec3.add( origin, dir, dir );

            // project on canvas
            this.getCanvasPositionFromWorldPoint( origin, origin );
            this.getCanvasPositionFromWorldPoint( dir, dir );

            Vec2.sub( dir, origin, dir );
            Vec2.normalize( dir, dir );

            line.offsetTranslate[ 0 ] = e.offsetX === undefined ? e.layerX : e.offsetX;
            line.offsetTranslate[ 1 ] = e.offsetY === undefined ? e.layerY : e.offsetY;
            Vec2.sub( line.offsetTranslate, origin, line.offsetTranslate );

            // draw help line
            if ( this._debugNode ) {
                var h = Math.max( this._canvas.clientWidth, this._canvas.clientHeight );
                var x = origin[ 0 ];
                var y = origin[ 1 ];
                var nx = dir[ 0 ] * h;
                var ny = dir[ 1 ] * h;
                this.drawLineCanvasDebug( x + nx, y + ny, x - nx, y - ny );
            }
        },
        drawLineCanvasDebug: function ( x1, y1, x2, y2 ) {
            this._debugNode.setNodeMask( NodeGizmo.NO_PICK );
            var buffer = this._debugNode.getChildren()[ 0 ].getAttributes().Vertex;
            buffer.getElements()[ 0 ] = ( ( x1 / this._canvas.clientWidth ) * 2 ) - 1.0;
            buffer.getElements()[ 1 ] = ( ( ( this._canvas.clientHeight - y1 ) / this._canvas.clientHeight ) ) * 2 - 1.0;
            buffer.getElements()[ 2 ] = ( ( x2 / this._canvas.clientWidth ) * 2 ) - 1.0;
            buffer.getElements()[ 3 ] = ( ( ( this._canvas.clientHeight - y2 ) / this._canvas.clientHeight ) ) * 2 - 1.0;
            buffer.dirty();
        },
        onMouseUp: function ( e ) {
            var smk = this._viewer._eventProxy.StandardMouseKeyboard;
            if ( smk._enable === false ) {
                smk._enable = true;
                this._viewer._eventProxy.StandardMouseKeyboard.mouseup( e );
            }
            if ( this._debugNode )
                this._debugNode.setNodeMask( 0x0 );
            this._isEditing = false;
        },
        onMouseMove: function ( e ) {
            if ( !this._attachedNode )
                return;
            var hit;
            if ( this._isEditing === false ) {
                hit = this.pickGizmo( e, NodeGizmo.PICK_XYZ | NodeGizmo.PICK_ARC | NodeGizmo.PICK_ARROW );
                this.onNodeHovered( hit );
            } else if ( this._hoverNode.getParents()[ 0 ] === this._rotateNode ) {
                this.updateRotateEdit( e );
            } else if ( this._hoverNode.getParents()[ 0 ] === this._translateNode ) {
                this.updateTranslateEdit( e );
            }
        },
        updateRotateEdit: ( function () {
            var mrot = Matrix.create();
            var vec = Vec2.create();

            return function ( e ) {
                var x = e.offsetX === undefined ? e.layerX : e.offsetX;
                var y = e.offsetY === undefined ? e.layerY : e.offsetY;

                vec[ 0 ] = x - this._editLine.origin[ 0 ];
                vec[ 1 ] = y - this._editLine.origin[ 1 ];
                var dist = Vec2.dot( vec, this._editLine.direction );
                var angle = 4 * dist / Math.min( this._canvas.clientWidth, this._canvas.clientHeight );

                if ( this._hoverNode.nbAxis === 0 )
                    Matrix.makeRotate( angle, 1.0, 0.0, 0.0, mrot );
                else if ( this._hoverNode.nbAxis === 1 )
                    Matrix.makeRotate( angle, 0.0, 1.0, 0.0, mrot );
                else if ( this._hoverNode.nbAxis === 2 )
                    Matrix.makeRotate( angle, 0.0, 0.0, 1.0, mrot );

                Matrix.mult( this._editLocal, mrot, this._attachedNode.getMatrix() );
                this._attachedNode.dirtyBound();
                this._rotateNode.dirtyBound();
            };
        } )(),
        updateTranslateEdit: ( function () {
            var vec = Vec2.create();

            return function ( e ) {
                var x = e.offsetX === undefined ? e.layerX : e.offsetX;
                var y = e.offsetY === undefined ? e.layerY : e.offsetY;

                var line = this._editLine;
                var origin = line.origin;
                var dir = line.direction;

                vec[ 0 ] = x - origin[ 0 ] - line.offsetTranslate[ 0 ];
                vec[ 1 ] = y - origin[ 1 ] - line.offsetTranslate[ 1 ];

                var dist = Vec2.dot( vec, dir ) / Vec2.length2( dir );
                vec[ 0 ] = origin[ 0 ] + dir[ 0 ] * dist;
                vec[ 1 ] = origin[ 1 ] + dir[ 1 ] * dist;

                if ( this._debugNode ) {
                    var x1 = line.origin[ 0 ];
                    var y1 = line.origin[ 1 ];
                    this.drawLineCanvasDebug( x1, y1, vec[ 0 ], vec[ 1 ] );
                }

                // canvas to webgl coord
                var canvas = this._canvas;
                var coordx = vec[ 0 ] * ( canvas.width / canvas.clientWidth );
                var coordy = ( canvas.clientHeight - vec[ 1 ] ) * ( canvas.height / canvas.clientHeight );

                // project 2D point on the 3d line
                var lsi = new LineLineIntersector( this._rotateNode );
                lsi.set( [ coordx, coordy, 0.0 ], [ coordx, coordy, 1.0 ] );
                var iv = new IntersectionVisitor();
                iv.setTraversalMask( this._hoverNode.getNodeMask() | NodeGizmo.PICK_ARROW );
                iv.setIntersector( lsi );

                Matrix.copy( this._editWorldTrans, this.getMatrix() );

                this.setOnlyGizmoPicking();
                this._viewer._camera.accept( iv );
                this.setOnlyScenePicking();

                Vec3.init( vec );
                vec[ this._hoverNode.nbAxis ] = lsi._tr;

                Matrix.transformVec3( this._editInvWorldScaleRot, vec, vec );
                Matrix.multTranslate( this._editLocal, vec, this._attachedNode.getMatrix() );

                this._attachedNode.dirtyBound();
            };
        } )()
    } );

    return NodeGizmo;
} );

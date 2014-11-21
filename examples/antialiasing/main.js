'use strict';

window.OSG.globalify();

var osg = window.osg;
var osgViewer = window.osgViewer;
var osgShader = window.osgShader;
var $ = window.$;
var viewer;


var addAliasedScene = function () {

    var NbItems = 3;
    var Deep = 2;
    var QuadSizeX = 1;
    var QuadSizeY = QuadSizeX * 9 / 16.0;
    var NbTotalItems = 0;
    var NbTotalNodes = 0;
    var Item;

    function getOrCreateItem() {
        if ( Item === undefined ) {
            var rq = osg.createTexturedQuadGeometry( -QuadSizeX / 2.0, -QuadSizeY / 2.0, 0,
                QuadSizeX, 0, 0,
                0, QuadSizeY, 0 );

            Item = rq;
        }
        return Item;
    }


    function createItems( deep ) {
        var scale = Math.pow( 2, deep - 1 );

        var root = new osg.MatrixTransform();
        var nbx = NbItems;
        var nby = Math.floor( nbx * 9 / 16.0 );
        if ( deep === 0 ) {
            NbTotalItems += nbx * nby;
        }
        NbTotalNodes += nbx * nby;

        for ( var i = 0, l = nbx; i < l; i++ ) {
            for ( var j = 0, m = nby; j < m; j++ ) {
                var mt = new osg.MatrixTransform();
                var x, y, m2;
                if ( deep === 0 ) {
                    x = ( -nbx * 0.5 + 0.5 + i ) * 1.1;
                    y = ( -nby * 0.5 + 0.5 + j ) * 1.1;
                    m2 = osg.Matrix.create();
                    osg.Matrix.makeTranslate( x, y, 0, m2 );
                    mt.setMatrix( m2 );
                    if ( i % 2 === 0 ) {
                        mt.addChild( getOrCreateItem() );
                    } else {
                        mt.addChild( getOrCreateItem() );
                    }
                } else {
                    var s = nbx * deep * scale * 1.1;
                    x = ( -nbx * 0.5 + 0.5 + i ) * ( s );
                    y = ( -nby * 0.5 + 0.5 + j ) * ( s * 9 / 16.0 );
                    //osg.log([x,y]);
                    m2 = osg.Matrix.create();
                    osg.Matrix.makeTranslate( x, y, 0, m2 );
                    mt.setMatrix( m2 );
                    mt.addChild( createItems( deep - 1 ) );
                }
                root.addChild( mt );
            }
        }
        return root;
    }


    function createAliasedScene() {
        var root = createItems( Deep );
        var ss = root.getOrCreateStateSet();
        var material = new osg.Material();
        material.setDiffuse( [ 0, 1, 1, 1 ] );
        material.setAmbient( [ 0, 0, 1, 1 ] );
        ss.setAttributeAndMode( material );
        return root;
    }
    var newScene = createAliasedScene();
    return newScene;
};

function commonScene( rttSize ) {

    //var model = osg.createTexturedBoxGeometry( 0, 0, 0, 2, 2, 2 );
    var model = addAliasedScene();
    var near = 0.1;
    var far = 100;

    var quadSize = [ 16 / 9, 1 ];

    // add a node to animate the scene
    var rootModel = new osg.MatrixTransform();
    rootModel.addChild( model );

    var UpdateCallback = function () {
        this.update = function ( node, nv ) {
            var currentTime = nv.getFrameStamp().getSimulationTime();
            var x = Math.cos( currentTime );
            osg.Matrix.makeRotate( x, 0, 0, 1, node.getMatrix() );
            node.traverse( nv );
        };
    };
    rootModel.setUpdateCallback( new UpdateCallback() );

    // create the camera that render the scene
    var camera = new osg.Camera();
    camera.setName( 'scene' );
    camera.setProjectionMatrix( osg.Matrix.makePerspective( 50, quadSize[ 0 ], near, far, [] ) );
    camera.setViewMatrix( osg.Matrix.makeLookAt( [ 0, 10, 0 ], [ 0, 0, 0 ], [ 0, 0, 1 ], [] ) );
    camera.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
    camera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
    camera.setViewport( new osg.Viewport( 0, 0, rttSize[ 0 ], rttSize[ 1 ] ) );
    camera.setClearColor( [ 0.5, 0.5, 0.5, 1 ] );

    // attach a texture to the camera to render the scene on
    var sceneTexture = new osg.Texture();
    sceneTexture.setTextureSize( rttSize[ 0 ], rttSize[ 1 ] );
    sceneTexture.setMinFilter( 'LINEAR' );
    sceneTexture.setMagFilter( 'LINEAR' );
    camera.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, sceneTexture, 0 );
    camera.attachRenderBuffer( osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16 );
    // add the scene to the camera
    camera.addChild( rootModel );

    // better view
    var oldRoot = viewer.getSceneData();
    var cam = viewer.getCamera();
    var oldMatProj, oldMatView;
    if ( oldRoot ) {
        oldMatProj = osg.Matrix.create();
        oldMatView = osg.Matrix.create();
        osg.Matrix.copy( cam.getProjectionMatrix(), oldMatProj );
        osg.Matrix.copy( cam.getViewMatrix(), oldMatView );
        viewer.getManipulator().setNode( rootModel );
    } else {

        viewer.setSceneData( rootModel );
        viewer.setupManipulator();
        viewer.getManipulator().computeHomePosition();
    }

    osg.Matrix.copy( cam.getProjectionMatrix(), camera.getProjectionMatrix() );
    osg.Matrix.copy( cam.getViewMatrix(), camera.getViewMatrix() );

    if ( oldRoot ) {
        viewer.getManipulator().setNode( rootModel );

        osg.Matrix.copy( oldMatProj, cam.getProjectionMatrix() );
        osg.Matrix.copy( oldMatView, cam.getViewMatrix() );
    }

    // attach camera to root
    var root = new osg.MatrixTransform();
    root.addChild( camera );
    return [ root, sceneTexture ];
}

function readShaders() {
    var defer = Q.defer();
    var shaderProcessor = new osgShader.ShaderProcessor();

    var shaders = [
        'fxaa',
        'cmaa',
        'colorDiscontinuity',
        'colorEdge',
        'simpleShapes',
        'complexLongSymShapes'
    ];

    var promises = [];
    var shadersLib = {};
    shaders.forEach( function ( shader ) {
        var promise = Q( $.get( 'shaders/' + shader + '.glsl?' + Math.random() ) );
        promise.then( function ( shaderText ) {
            if ( shader && shaderText ) {
                shadersLib[ shader ] = shaderText;
            }
        } );


        promises.push( promise );
    } );


    Q.all( promises ).then( function ( arg ) {
        shaderProcessor.addShaders( shadersLib );
        defer.resolve();
    } );

    return defer.promise;
}


function createScene( width, height, gui ) {


    var rttSize = [ width, height ];

    var result = commonScene( rttSize );
    var commonNode = result[ 0 ];
    var sceneTexture = result[ 1 ];

    var root = new osg.Node();

    var texW = osg.Uniform.createFloat1( rttSize[ 0 ], 'tex_w' );
    var texH = osg.Uniform.createFloat1( rttSize[ 1 ], 'tex_h' );

    root.getOrCreateStateSet().addUniform( texW );
    root.getOrCreateStateSet().addUniform( texH );

    // create a quad on which will be applied the postprocess effects
    var quadSize = [ 16 / 9, 1 ];
    var quad = osg.createTexturedQuadGeometry( -quadSize[ 0 ] / 2.0, 0, -quadSize[ 1 ] / 2.0,
        quadSize[ 0 ], 0, 0,
        0, 0, quadSize[ 1 ] );
    quad.getOrCreateStateSet().setAttributeAndMode( getTextureShader() );

    var scene = new osg.MatrixTransform();

    // create a texture to render the effect to
    var finalTexture = new osg.Texture();
    finalTexture.setTextureSize( width, height );
    finalTexture.setMinFilter( osg.Texture.LINEAR );
    finalTexture.setMagFilter( osg.Texture.LINEAR );

    // Set the final texture on the quad
    quad.getOrCreateStateSet().setTextureAttributeAndMode( 0, finalTexture );

    var postScenes = [
        getFXAA(),
        getColorDiscontinuity(),
        getColorEdge(),
        getSimpleShapes(),
        getComplexLongSymShapes(),
        getCMAA()
    ];

    var effects = [];
    for ( var i = 0; i < postScenes.length; i++ )
        effects[ postScenes[ i ].name ] = postScenes[ i ];

    var globalGui = {
        'filter': postScenes[ 0 ].name,
        'factor': 1.0,
        'reload': function () {
            readShaders().then( function () {
                if ( console.clear ) console.clear();
                setComposer( globalGui.filter, parseFloat( globalGui.factor ) );
            } );
        }
    };

    function addSceneController() {
        gui.add( globalGui, 'filter', Object.keys( effects ) ).onChange( function ( value ) {
            setComposer( value, parseFloat( globalGui.factor ) );
        } );
        gui.add( globalGui, 'factor', 0.125, 3.0 ).onChange( function ( value ) {
            setComposer( globalGui.filter, parseFloat( value ) );
        } );
        gui.add( globalGui, 'reload' );
    }

    var currentComposer = postScenes[ 0 ].buildComposer( sceneTexture, finalTexture, quad, scene );
    addSceneController();
    postScenes[ 0 ].buildGui( gui );

    var cachedComposers = [];
    cachedComposers[ postScenes[ 0 ].name ] = currentComposer;

    function setComposer( effectName, textureScale ) {

        // recreate the rtt
        //
        root.removeChild( commonNode );
        if ( rttSize[ 0 ] !== width * textureScale || rttSize[ 1 ] !== height * textureScale ) {

            rttSize = [ width * textureScale, height * textureScale ];

            // new scene Texture
            result = commonScene( rttSize );
            commonNode = result[ 0 ];
            sceneTexture = result[ 1 ];

            // new final Texture
            finalTexture = new osg.Texture();
            finalTexture.setTextureSize( rttSize[ 0 ], rttSize[ 1 ] );
            texW.set( rttSize[ 0 ] );
            texH.set( rttSize[ 1 ] );
            finalTexture.setMinFilter( osg.Texture.LINEAR );
            finalTexture.setMagFilter( osg.Texture.LINEAR );
            quad.getOrCreateStateSet().setTextureAttributeAndMode( 0, finalTexture );
        }

        //
        //
        // Put the composer in cache at first utilization
        //if ( cachedComposers[ effectName ] === undefined ) {
        cachedComposers[ effectName ] = effects[ effectName ].buildComposer( sceneTexture, finalTexture, quad, scene );
        //}


        // Recreate the whole gui
        gui.destroy();
        gui = new dat.GUI();
        addSceneController();
        effects[ effectName ].buildGui( gui );

        // Change the composer
        scene.removeChild( currentComposer );
        currentComposer = cachedComposers[ effectName ];
        scene.addChild( currentComposer );

        if ( effects[ effectName ].needCommonCube )
            root.addChild( commonNode );
        else
            root.removeChild( commonNode );

    }

    scene.addChild( quad );
    scene.addChild( currentComposer );

    root.addChild( scene );
    root.addChild( commonNode );

    return root;
}

var main = function () {

    // osg.ReportWebGLError = true;

    var canvas = document.getElementById( 'View' );
    canvas.style.width = canvas.width = window.innerWidth;
    canvas.style.height = canvas.height = window.innerHeight;

    var gui = new dat.GUI();
    viewer = new osgViewer.Viewer( canvas );
    viewer.init();

    readShaders().then( function () {
        viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
        var rotate = new osg.MatrixTransform();
        rotate.addChild( createScene( canvas.width, canvas.height, gui ) );
        rotate.getOrCreateStateSet().setAttributeAndMode( new osg.CullFace( 'DISABLE' ) );

        viewer.setSceneData( rotate );
        viewer.setupManipulator();
        viewer.getManipulator().computeHomePosition();
        viewer.run();
    } );
};


function getTextureShader() {

    var vertexshader = [
        '',
        'attribute vec3 Vertex;',
        'attribute vec2 TexCoord0;',
        'varying vec2 FragTexCoord0;',
        'uniform mat4 ModelViewMatrix;',
        'uniform mat4 ProjectionMatrix;',
        'void main(void) {',
        '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
        '  FragTexCoord0 = TexCoord0;',
        '}',
        ''
    ].join( '\n' );

    var fragmentshader = [
        '',
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'varying vec2 FragTexCoord0;',
        'uniform sampler2D Texture0;',

        '',
        'void main (void)',
        '{',
        '  vec2 uv = FragTexCoord0;',
        '  gl_FragColor = vec4(texture2D(Texture0, uv));',
        '}',
        ''
    ].join( '\n' );

    var program = new osg.Program(
        new osg.Shader( 'VERTEX_SHADER', vertexshader ),
        new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );
    return program;
}


window.addEventListener( 'load', main, true );
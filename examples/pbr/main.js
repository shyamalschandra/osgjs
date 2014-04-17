var Q = window.Q;
var OSG = window.OSG;
var Viewer;
var osg = OSG.osg;
var osgViewer = OSG.osgViewer;
var osgDB = OSG.osgDB;


var PBRExample = function() {
    this.textureEnvs = {
        'Alexs_Apartment': [ 'Alexs_Apt_2k.png', 'Alexs_Apt_Env.png' ],
        'Arches_E_PineTree': [ 'Arches_E_PineTree_3k.png', 'Arches_E_PineTree_Env.png' ],
        'GrandCanyon_C_YumaPoint': [ 'GCanyon_C_YumaPoint_3k.png', 'GCanyon_C_YumaPoint_Env.png' ],
        'Milkyway': [ 'Milkyway_small.png', 'Milkyway_Light.png' ],
        'Walk_Of_Fame': [ 'Mans_Outside_2k.png', 'Mans_Outside_Env.png' ]
    };

    this._viewer = undefined;


};

PBRExample.prototype = {

    getModel: function() {

        var removeLoading = function ( node, child ) {

            this._nbLoading -= 1;
            this._loaded.push( child );

            if ( this._nbLoading === 0 ) {
                document.getElementById( 'loading' ).style.display = 'None';
                this._viewer.getManipulator().computeHomePosition();
            }

        }.bind( this );

        var addLoading = function() {

            if ( !this._nbLoading ) this._nbLoading= 0;
            if ( !this._loaded ) this._loaded= [];

            this._nbLoading += 1;
            document.getElementById( 'loading' ).style.display = 'Block';

        }.bind( this );


        var node = new osg.MatrixTransform();
        node.setMatrix( osg.Matrix.makeRotate( -Math.PI / 2, 1, 0, 0, [] ) );

        var loadModel = function ( url, cbfunc ) {

            osg.log( 'loading ' + url );
            var req = new XMLHttpRequest();
            req.open( 'GET', url, true );

            var array = url.split( '/' );
            array.length = array.length - 1;
            if ( array.length <= 0 ) {
                osg.error( 'can\'t find prefix to load subdata' );
            }
            var prefixURL = array.join( '/' ) + '/';
            var opts = {
                prefixURL: prefixURL
            };

            var defer = Q.defer();

            req.onreadystatechange = function ( aEvt ) {

                if ( req.readyState === 4 ) {
                    if ( req.status === 200 ) {
                        Q.when( osgDB.parseSceneGraph( JSON.parse( req.responseText ), opts ) ).then( function ( child ) {
                            if ( cbfunc ) {
                                cbfunc( child );
                            }
                            node.addChild( child );
                            removeLoading( node, child );
                            osg.log( 'success ' + url );
                            defer.resolve( node );
                        }.bind( this ) ).fail( function( error ) {

                            defer.reject( error );

                        });

                    } else {
                        removeLoading( node );
                        osg.log( 'error ' + url );
                        defer.reject( node );
                    }
                }
            }.bind( this );
            req.send( null );
            addLoading();

            return defer.promise;

        }.bind( this );

        return loadModel( 'model/Cerberus_by_Andrew_Maximov.osgjs' );
    },

    setEnvironment: function( name, background, ground ) {

        var urls = this.textureEnvs[ name ];

        var readImageURL = function ( url, options ) {
            var ext = url.split( '.' ).pop();
            if ( ext === 'hdr' )
                return osgDB.readImageHDR( url, options );

            return osgDB.readImageURL.call( this,  url, options );
        };


        Q.all( [
            readImageURL( 'textures/' + name + '/' + urls[ 0 ] ),
            readImageURL( 'textures/' + name + '/' + urls[ 1 ] ) ] ).then( function ( images ) {
                var textureHigh = new osg.Texture();
                textureHigh.setImage( images[ 0 ] );
                if ( images[ 0 ].data ) {
                    textureHigh.setTextureSize( images[ 0 ].width, images[ 0 ].height );
                    textureHigh.setImage( images[ 0 ].data, osg.Texture.RGBA );
                }
                background.getOrCreateStateSet().setTextureAttributeAndMode( 0, textureHigh );
                background.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'Texture0' ) );

                var textureEnv = new osg.Texture();
                textureEnv.setImage( images[ 1 ] );
                if ( images[ 0 ].data ) {
                    textureEnv.setTextureSize( images[ 0 ].width, images[ 0 ].height );
                    textureEnv.setImage( images[ 0 ].data, osg.Texture.RGBA );
                }
                ground.getOrCreateStateSet().setTextureAttributeAndMode( 0, textureHigh );
                ground.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'Texture0' ) );
                ground.getOrCreateStateSet().setTextureAttributeAndMode( 1, textureEnv );
                ground.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'Texture1' ) );
            } );
    },


    getShader: function() {
        var vertexshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',

            'attribute vec3 Vertex;',
            'attribute vec3 Normal;',

            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',
            'uniform mat4 NormalMatrix;',

            'varying vec3 osg_FragEye;',
            'varying vec3 osg_FragNormal;',
            'varying vec3 osg_FragNormalWorld;',
            'varying vec3 osg_FragLightDirection;',

            'void main(void) {',
            '  osg_FragEye = vec3(ModelViewMatrix * vec4(Vertex, 1.0));',
            '  osg_FragNormal = vec3(NormalMatrix * vec4(Normal, 0.0));',
            '  osg_FragNormalWorld = Normal;',
            '  osg_FragLightDirection = vec3(NormalMatrix * vec4(0.0, -1.0, 0.0, 1.0));',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
            '}'
        ].join('\n');

        var fragmentshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            '#define PI 3.14159',

            'uniform sampler2D Texture0;',
            'uniform sampler2D Texture1;',
            'uniform float hdrExposure;',
            '//uniform float hdrGamma;',
            'uniform mat4 CubemapTransform;',

            'varying vec3 osg_FragEye;',
            'varying vec3 osg_FragNormal;',
            'varying vec3 osg_FragNormalWorld;',
            'varying vec3 osg_FragLightDirection;',
            'float gamma = 2.2;',

            'vec3 cubemapReflectionVector(const in mat4 transform, const in vec3 view, const in vec3 normal)',
            '{',
            '  vec3 lv = reflect(view, normal);',
            '  lv = normalize(lv);',
            '  vec3 x = vec3(transform[0][0], transform[1][0], transform[2][0]);',
            '  vec3 y = vec3(transform[0][1], transform[1][1], transform[2][1]);',
            '  vec3 z = vec3(transform[0][2], transform[1][2], transform[2][2]);',
            '  mat3 m = mat3(x,y,z);',
            '  return m*lv;',
            '}',

            // convert 8-bit RGB channels into floats using the common E exponent
            'vec3 decodeRGBE(vec4 rgbe) {',
            '  float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));',
            '  return rgbe.rgb * 255.0 * f;',
            '}',


            // fetch from environment sphere texture
            'vec4 textureSphere(sampler2D tex, vec3 n) {',
            '  float yaw = acos(n.y) / PI;',
            '  float pitch = (atan(n.x, n.z) + PI) / (2.0 * PI);',
            '  return texture2D(tex, vec2(pitch, yaw));',
            '}',

            // apply some gamma correction (http://www.geeks3d.com/20101001/tutorial-gamma-correction-a-story-of-linearity/)
            'vec3 linear2sRGB ( vec3 color ) {',
            '  return pow( color , 1.0/ vec3( gamma ) );',
            '}',

            'void main(void) {',
            '  vec3 normalWorld = normalize(osg_FragNormalWorld);',
            '  vec3 N = normalize(osg_FragNormal);',
            '  vec3 L = normalize(osg_FragLightDirection);',
            '  vec3 E = normalize(osg_FragEye);',
            '  vec3 R = cubemapReflectionVector(CubemapTransform, E, N);',

            '  float NdotL = dot(-N, L);',
            '  vec3 diffuse = hdrExposure*decodeRGBE(textureSphere(Texture1, normalWorld));',
            '  vec3 specular = hdrExposure*decodeRGBE(textureSphere(Texture0, R));',
            '  vec3 gammaCorrected = linear2sRGB( mix(diffuse, specular, 1.0) );',
            '  gl_FragColor = vec4( gammaCorrected, 1.0);',
            '}',
            ''
        ].join('\n');

        var program = new osg.Program(
            new osg.Shader('VERTEX_SHADER', vertexshader),
            new osg.Shader('FRAGMENT_SHADER', fragmentshader));

        return program;
    },

    createScene: function() {
        var group = new osg.Node();

        // HDR parameters uniform
        var uniformCenter = osg.Uniform.createFloat1( 1, 'hdrExposure' );
        var uniformGamma = osg.Uniform.createFloat1( 2.2, 'hdrGamma' );

        var size = 500;
        var background = this.getEnvSphere( size, group );
        background.getOrCreateStateSet().addUniform( uniformCenter );
        background.getOrCreateStateSet().addUniform( uniformGamma );


        Q.when( this.getModel() ).then( function( model ) {

            model.getOrCreateStateSet().setAttributeAndMode( this.getShader() );
            model.getOrCreateStateSet().addUniform( uniformCenter );
            model.getOrCreateStateSet().addUniform( uniformGamma );



            var ConfigUI = function() {
                this.rangeExposure = 1.0;
                this.environment = 'Alexs_Apartment';
            };

            var obj = new ConfigUI();
            var gui = new dat.GUI();

            var controller = gui.add( obj, 'rangeExposure' );
            controller.onChange( function( value ) {
                uniformCenter.set( value );
            });

            controller = gui.add( obj, 'environment', Object.keys( this.textureEnvs ) );
            controller.onChange( function ( value ) {
                this.setEnvironment( value, background, model );
            }.bind( this ) );
            this.setEnvironment( 'Alexs_Apartment', background, model );


            group.addChild( model );


        }.bind( this ) ).done();


        return group;
    },


    run: function() {

        var canvas = document.getElementById( '3DView' );

        var viewer;
        viewer = new osgViewer.Viewer( canvas );
        Viewer = viewer;
        viewer.init();
        var rotate = new osg.MatrixTransform();
        rotate.addChild( this.createScene() );
        viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
        viewer.setSceneData( rotate );
        viewer.setupManipulator();
        viewer.getManipulator().computeHomePosition();

        viewer.run();
        this._viewer = viewer;
    },

    getShaderBackground: function() {
        var vertexshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'attribute vec3 Vertex;',
            'attribute vec3 Normal;',
            'attribute vec2 TexCoord0;',
            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',
            'uniform mat4 NormalMatrix;',

            'varying vec3 osg_FragNormal;',
            'varying vec3 osg_FragEye;',
            'varying vec3 osg_FragVertex;',
            'varying vec2 osg_TexCoord0;',

            'void main(void) {',
            '  osg_FragVertex = Vertex;',
            '  osg_TexCoord0 = TexCoord0;',
            '  osg_FragEye = vec3(ModelViewMatrix * vec4(Vertex,1.0));',
            '  osg_FragNormal = vec3(NormalMatrix * vec4(Normal, 1.0));',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
            '}'
        ].join('\n');

        var fragmentshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            '#define PI 3.14159',

            'uniform sampler2D Texture0;',
            'uniform float hdrExposure;',
            'uniform float hdrGamma;',

            'varying vec3 osg_FragNormal;',
            'varying vec3 osg_FragEye;',
            'varying vec3 osg_FragVertex;',
            'varying vec2 osg_TexCoord0;',

            // convert 8-bit RGB channels into floats using the common E exponent
            'vec3 decodeRGBE(vec4 rgbe) {',
            '  float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));',
            '  return rgbe.rgb * 255.0 * f;',
            '}',

            // apply some gamma correction (http://www.geeks3d.com/20101001/tutorial-gamma-correction-a-story-of-linearity/)
            'vec3 toneMapHDR(vec3 rgb) {',
            '  return pow(rgb * hdrExposure, 1.0 / vec3(hdrGamma));',
            '}',

            // fetch from environment sphere texture
            'vec4 textureSphere(sampler2D tex, vec3 n) {',
            '  float yaw = acos(n.y) / PI;',
            '  float pitch = (atan(n.x, n.z) + PI) / (2.0 * PI);',
            '  return texture2D(tex, vec2(pitch, yaw));',
            '}',

            'void main(void) {',
            '  vec3 normal = normalize(osg_FragVertex.xyz);',
            '  vec3 c = toneMapHDR(decodeRGBE(textureSphere(Texture0, normal)));',
            '  gl_FragColor = vec4(c, 1.0);',
            '}',
            ''
        ].join('\n');

        var program = new osg.Program(
            new osg.Shader('VERTEX_SHADER', vertexshader),
            new osg.Shader('FRAGMENT_SHADER', fragmentshader));

        return program;
    },


    getEnvSphere: function( size, scene ) {

        // create the environment sphere
        //var geom = osg.createTexturedSphere(size, 32, 32);
        var geom = osg.createTexturedBoxGeometry( 0, 0, 0, size, size, size );
        geom.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
        geom.getOrCreateStateSet().setAttributeAndModes( this.getShaderBackground() );

        var cubemapTransform = osg.Uniform.createMatrix4( osg.Matrix.makeIdentity( [] ), 'CubemapTransform' );
        var mt = new osg.MatrixTransform();
        mt.setMatrix( osg.Matrix.makeRotate( Math.PI / 2.0, 1, 0, 0, [] ) );
        mt.addChild( geom );
        var CullCallback = function () {
            this.cull = function ( node, nv ) {
                // overwrite matrix, remove translate so environment is always at camera origin
                osg.Matrix.setTrans( nv.getCurrentModelviewMatrix(), 0, 0, 0 );
                var m = nv.getCurrentModelviewMatrix();
                osg.Matrix.copy( m, cubemapTransform.get() );
                cubemapTransform.dirty();
                return true;
            };
        };
        mt.setCullCallback( new CullCallback() );
        scene.getOrCreateStateSet().addUniform( cubemapTransform );

        var cam = new osg.Camera();

        cam.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
        cam.addChild( mt );

        // the update callback get exactly the same view of the camera
        // but configure the projection matrix to always be in a short znear/zfar range to not vary depend on the scene size
        var UpdateCallback = function () {
            this.update = function ( node, nv ) {
                var rootCam = Viewer.getCamera();

                //rootCam.
                var info = {};
                osg.Matrix.getPerspective( rootCam.getProjectionMatrix(), info );
                var proj = [];
                osg.Matrix.makePerspective( info.fovy, info.aspectRatio, 1.0, 100.0, proj );
                cam.setProjectionMatrix( proj );
                cam.setViewMatrix( rootCam.getViewMatrix() );

                return true;
            };
        };
        cam.setUpdateCallback( new UpdateCallback() );

        scene.addChild( cam );

        return geom;
    }
};


window.addEventListener('load', function() {
    var example = new PBRExample();
    example.run();
} ,true);

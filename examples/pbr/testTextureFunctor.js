( function () {
    'use strict';

    var Q = window.Q;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgDB = OSG.osgDB;
    var osgUtil = OSG.osgUtil;
    var osgShader = OSG.osgShader;
    var $ = window.$;

    var PanoramaToPanoramaInlineMipmap = window.PanoramanToPanoramaInlineMipmap;

    var readImageURL = function ( url, options ) {
        var opts = options || {};
        //opts.imageCrossOrigin = 'anonymous';
        opts.imageLoadingUsePromise = true;
        var ext = url.split( '.' ).pop();
        if ( ext === 'hdr' )
            return osgDB.readImageHDR( url, opts );

        return osgDB.readImageURL.call( this, url, opts );
    };


    var linear2Srgb = function ( value, gamma ) {
        if ( !gamma ) gamma = 2.2;
        var result = 0.0;
        if ( value < 0.0031308 ) {
            if ( value > 0.0 )
                result = value * 12.92;
        } else {
            result = 1.055 * Math.pow( value, 1.0 / gamma ) - 0.055;
        }
        return result;
    };

    var shaderProcessor = new osgShader.ShaderProcessor();


    var readTextFile = function( path ) {
        return Q( $.get( path ) );
    };



    var SphericalEnv = function( file ) {
        this._file = file;
    };

    SphericalEnv.prototype = {

        createShaderSpherical: function() {

            var vertexshader = shaderProcessor.getShader( 'sphericalHarmonicsVertex.glsl' );
            var fragmentshader = shaderProcessor.getShader( 'sphericalHarmonicsFragment.glsl' );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            return program;
        },

        createDebugGeometry: function () {

            var debugGroup = new osg.MatrixTransform();

            // create a sphere to debug it
            var sphere = osg.createTexturedSphereGeometry( 5, 20, 20 );
            sphere.getOrCreateStateSet().setAttributeAndModes( this.createShaderSpherical() );
            var uniform = osg.Uniform.createFloat3Array( this._sphCoef, 'uSph' );
            sphere.getOrCreateStateSet().addUniform( uniform );

            debugGroup.addChild( sphere );
            osg.Matrix.makeTranslate( -90, 0, 0, debugGroup.getMatrix() );

            return debugGroup;
        },

        load: function() {
            var p = readTextFile( this._file );
            p.then( function( text ) {
                this._sphCoef = JSON.parse( text );
                this._sphCoef.splice( 9*3 );
            }.bind( this ) );
            return p;
        }
    };

    var CubeMapEnv = function( filePattern, options ) {
        this._options = options || {};
        this._pattern = filePattern; // abandoned_sanatorium_staircase_%d.png
    };

    CubeMapEnv.prototype = {

        createTexture: function( image ) {
            var texture = new osg.Texture();
            texture.setImage( image );
            texture.setMinFilter( this._options.minFilter || 'NEAREST' );
            texture.setMagFilter( this._options.magFilter || 'NEAREST' );
            return texture;
        },

        createTextureCubemap: function() {

            var texture = new osg.TextureCubeMap();
            texture.setMinFilter( this._options.minFilter || 'NEAREST' );
            texture.setMagFilter( this._options.magFilter || 'NEAREST' );

            var remap = [ 0, 1, 3, 2, 4, 5 ];

            var i = 0;
            remap.forEach( function( index ) {
                texture.setImage( osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X + i++, this._images[index] );
            }.bind( this ) );
            return texture;
        },

        createShader: function() {

            var vertexshader = shaderProcessor.getShader( 'cubemapVertex.glsl' );
            var fragmentshader = shaderProcessor.getShader( 'cubemapFragment.glsl' );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            return program;

        },

        createDebugGeometry: function() {

            var scene = new osg.Node();

            var size = 10;
            //var geom = osg.createTexturedBoxGeometry( 0, 0, 0, size, size, size );
            var geom = osg.createTexturedSphereGeometry( 5, 20, 20 );

            geom.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
            var texture = this.createTextureCubemap();
            geom.getOrCreateStateSet().setTextureAttributeAndModes( 0, texture );
            geom.getOrCreateStateSet().setAttributeAndModes( this.createShader() );

            scene.addChild( geom );
            return scene;
        },


        load: function() {
            var defer = Q.defer();

            var images = [];
            for ( var i = 0; i < 6; i++ ) {
                var str = this._pattern;
                str = str.replace('%d',i);
                images.push( readImageURL( str ) );
            }
            this._images = images;

            Q.all( images ).then( function ( images ) {
                defer.resolve( images );
            });

            return defer.promise;

        }

    };


    var PanoramaEnv = function( file, options) {
        this._options = options || {};
        this._file = file;
    };

    PanoramaEnv.prototype = {

        createShaderInlineDebugPanorama: function () {

            var vertexshader = shaderProcessor.getShader( 'panoramaVertex.glsl' );
            var fragmentshader = shaderProcessor.getShader( 'panoramaDebugFragment.glsl' );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            return program;
        },

        createShaderPanorama: function ( defines ) {

            var vertexshader = shaderProcessor.getShader( 'panoramaVertex.glsl');
            var fragmentshader = shaderProcessor.getShader( 'panoramaFragment.glsl', defines  );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            return program;
        },

        load: function() {
            var defer = Q.defer();

            readImageURL( this._file ).then( function ( image ) {

                this._texture = new osg.Texture();
                this._texture.setImage( image );

                this._texture.setMinFilter( 'NEAREST' );
                this._texture.setMagFilter( 'NEAREST' );

                defer.resolve( this._texture );

            }.bind( this ) );

            return defer.promise;
        },

        createDebugGeometry: function () {

            var debugGroup = new osg.MatrixTransform();

            if ( this._textureInlineMipMap ) {
                // create a quad to display the panorama generated
                var quadDebug = osg.createTexturedQuadGeometry( -5, -5, 0,
                                                                10, 0, 0,
                                                                0, 10, 0,
                                                                0, 0,
                                                                1, 1 );
                quadDebug.getOrCreateStateSet().setAttributeAndModes( this.createShaderInlineDebugPanorama() );

                var mt = new osg.MatrixTransform();
                mt.addChild( quadDebug );
                osg.Matrix.makeTranslate( 30, 0, 0, mt.getMatrix() );
                debugGroup.addChild( mt );
            }

            // create a sphere to debug it
            var sphere = osg.createTexturedSphereGeometry( 5, 20, 20 );
            sphere.getOrCreateStateSet().setAttributeAndModes( this.createShaderPanorama() );

            debugGroup.addChild( sphere );

            osg.Matrix.makeTranslate( -60, 0, 0, debugGroup.getMatrix() );

            return debugGroup;
        },

        createDebugIrradianceGeometry: function () {

            var debugGroup = new osg.MatrixTransform();

            // create a sphere to debug it
            var sphere = osg.createTexturedSphereGeometry( 5, 20, 20 );
            sphere.getOrCreateStateSet().setAttributeAndModes( this.createShaderPanorama( [ '#define IRRADIANCE']) );
            sphere.getOrCreateStateSet().setTextureAttributeAndModes( 0 , this._texture );

            debugGroup.addChild( sphere );

            osg.Matrix.makeTranslate( -150, 0, 0, debugGroup.getMatrix() );

            return debugGroup;
        },


        // return a node to put in the graph to autobuild
        // mipmap inline
        createWorkerInlineMipMapRGBE: function () {

            var textureEnv = this._texture;
            var group = new osg.Node();

            var nodeFunctor = new PanoramaToPanoramaInlineMipmap( textureEnv );

            group.addChild( nodeFunctor );
            nodeFunctor.init();
            this._textureInlinePromise = nodeFunctor.getPromise();

            this._textureInlinePromise.then( function ( texture ) {

                this._textureInlineMipMap = texture;

            }.bind( this ) );
            return group;

        },
        getTextureInlineMipMapPromise: function() { return this._textureInlinePromise; }



    };


    var Example = function () {
        this._shaderPath = '';
        this._config = {
            lod: 0.01
        };

        this._albedoTextureUnit = 2;
        this._roughnessTextureUnit = 3;
        this._metalnessTextureUnit = 4;


        this._environmentTransformUniform = osg.Uniform.createMatrix4( osg.Matrix.makeIdentity( [] ), 'uEnvironmentTransform' );
    };

    Example.prototype = {

        getTexture1111: function () {
            if ( !this._texture1111 )
                this._texture1111 = this.createTextureFromColor( [ 1, 1, 1, 1 ] );
            return this._texture1111;
        },

        createTextureFromColor: function ( color, srgb, textureOutput ) {
            var albedo = new osg.Uint8Array( 4 );

            color.forEach( function ( value, index ) {
                if ( srgb )
                    albedo[ index ] = Math.floor( 255 * linear2Srgb( value ) );
                else
                    albedo[ index ] = Math.floor( 255 * value );
            } );

            var texture = textureOutput;
            if ( !texture )
                texture = new osg.Texture();
            texture.setTextureSize( 1, 1 );
            texture.setImage( albedo );
            return texture;
        },

        readShaders: function () {

            var defer = Q.defer();

            var shaderNames = [
                'cubemapVertex.glsl',
                'cubemapFragment.glsl',
                'cubemapSampler.glsl',
                'panoramaVertex.glsl',
                'panoramaFragment.glsl',
                'tangentVertex.glsl',
                'tangentFragment.glsl',
                'panoramaSampler.glsl',
                'panoramaDebugFragment.glsl',

                'pbrReferenceFragment.glsl',
                'pbrReferenceVertex.glsl',
                'colorSpace.glsl',
                'pbr.glsl',
                'sphericalHarmonics.glsl',
                'sphericalHarmonicsVertex.glsl',
                'sphericalHarmonicsFragment.glsl'

            ];


            var shaders = shaderNames.map( function ( arg ) {
                return this._shaderPath + arg;
            }.bind( this ) );


            var promises = [];
            shaders.forEach( function ( shader ) {
                promises.push( Q( $.get( shader ) ) );
            }.bind( this ) );


            Q.all( promises ).then( function ( args ) {

                var shaderNameContent = {};
                shaderNames.forEach( function ( name, idx ) {
                    shaderNameContent[ name ] = args[ idx ];
                } );

                shaderProcessor.addShaders( shaderNameContent );

                defer.resolve();

            }.bind( this ) );

            return defer.promise;
        },

        // config = {
        //     normalMap: false,
        //     glossinessMap: false,
        //     specularMap: false
        //     aoMap: false
        // }
        createShaderPbrReference: function ( config ) {

            var defines = [];
            if ( config && config.normalMap === true )
                defines.push( '#define NORMAL' );

            if ( config && config.glossinessMap === true )
                defines.push( '#define GLOSSINESS' );

            if ( config && config.specularMap === true )
                defines.push( '#define SPECULAR' );

            if ( config && config.aoMap === true )
                defines.push( '#define AO' );

            defines.push( '#define NB_SAMPLES 4' );

            var vertexshader = shaderProcessor.getShader( 'pbrReferenceVertex.glsl' );
            var fragmentshader = shaderProcessor.getShader( 'pbrReferenceFragment.glsl', defines );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            return program;
        },


        setPanoramaTexture: function ( texture, stateSet ) {

            var w = texture.getWidth();
            var name = 'uEnvironment';
            stateSet.addUniform( osg.Uniform.createFloat2( [ w, w / 2 ], name + 'Size' ) );
            stateSet.addUniform( osg.Uniform.createFloat1( Math.log( w ) / Math.LN2, name + 'MaxLod' ) );
            stateSet.addUniform( osg.Uniform.createInt1( 0, name ) );

            stateSet.addUniform( this._environmentTransformUniform );
            stateSet.setTextureAttributeAndModes( 0, texture );

        },

        setGlobalUniforms: function ( stateSet ) {

            this._lod = osg.Uniform.createFloat1( 0.0, 'uLod' );
            stateSet.addUniform( this._lod );

        },

        setupMaterial: function ( stateSet, albedo, roughness, metalness ) {
            this._albedoTexture = this.createTextureFromColor( albedo, true, this._albedoTexture );
            this._roughnessTexture = this.createTextureFromColor( [ roughness, roughness, roughness, 1.0 ], false, this._roughnessTexture );
            this._metalnessTexture = this.createTextureFromColor( [ metalness, metalness, metalness, 1.0 ], false, this._metalnessTexture );

            stateSet.setTextureAttributeAndModes( this._albedoTextureUnit, this._albedoTexture );
            stateSet.setTextureAttributeAndModes( this._roughnessTextureUnit, this._roughnessTexture );
            stateSet.setTextureAttributeAndModes( this._metalnessTextureUnit, this._metalnessTexture );
        },

        createEnvironmentNode: function () {

            var scene = new osg.Node();

            // create the environment sphere
            var size = 500;
            //var geom = osg.createTexturedBoxGeometry( 0, 0, 0, size, size, size );
            var geom = osg.createTexturedSphereGeometry( size/2, 20, 20 ); // to use the same shader panorama
            var ss = geom.getOrCreateStateSet();
            geom.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
            geom.getOrCreateStateSet().setAttributeAndModes( new osg.Depth('DISABLE') );

            ss.setRenderBinDetails( -1, 'RenderBin' );

            var environmentTransform = this._environmentTransformUniform;

            var mt = new osg.MatrixTransform();
            mt.addChild( geom );

            var CullCallback = function () {
                this.cull = function ( node, nv ) {
                    // overwrite matrix, remove translate so environment is always at camera origin
                    osg.Matrix.setTrans( nv.getCurrentModelViewMatrix(), 0, 0, 0 );
                    var m = nv.getCurrentModelViewMatrix();
                    osg.Matrix.copy( m, environmentTransform.get() );
                    environmentTransform.dirty();
                    return true;
                };
            };
            mt.setCullCallback( new CullCallback() );

            var cam = new osg.Camera();
            cam.setClearMask( 0x0 );
            cam.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
            cam.addChild( mt );
            cam.setCullCallback( new CullCallback() );


            var self = this;
            // the update callback get exactly the same view of the camera
            // but configure the projection matrix to always be in a short znear/zfar range to not vary depend on the scene size
            var info = {};
            var proj = [];
            var UpdateCallback = function () {
                this.update = function ( /*node, nv*/) {
                    var rootCam = self._viewer.getCamera();

                    osg.Matrix.getPerspective( rootCam.getProjectionMatrix(), info );
                    osg.Matrix.makePerspective( info.fovy, info.aspectRatio, 1.0, 1000.0, proj );
                    cam.setProjectionMatrix( proj );
                    cam.setViewMatrix( rootCam.getViewMatrix() );

                    return true;
                };
            };
            cam.setUpdateCallback( new UpdateCallback() );

            scene.addChild( cam );
            return scene;
        },

        createModelMaterialSample: function () {

            var request = osgDB.readNodeURL( '../media/models/material-test/file.osgjs' );

            Q.when( request, function ( model ) {



                var mt = new osg.MatrixTransform();
                osg.Matrix.makeRotate( Math.PI / 2, 1, 0, 0, mt.getMatrix() );
                var bb = model.getBound();
                osg.Matrix.mult( osg.Matrix.makeTranslate( 0, -bb.radius() / 2, 0, osg.Matrix.create() ), mt.getMatrix(), mt.getMatrix() );
                mt.addChild( model );
                this._modeltest = mt;

                var tangentVisitor = new osgUtil.TangentSpaceGenerator();
                model.accept( tangentVisitor );

            }.bind( this ) );

            return request;

        },

        getModelTestInstance: function () {
            var mt = new osg.MatrixTransform();
            mt.addChild( this._modeltest );
            return mt;
        },


        createSampleModel: function ( albedo, roughness, metal ) {

            var sample = this.getModelTestInstance();
            osg.Matrix.makeTranslate( 0, 0, 0, sample.getMatrix() );

            sample.getOrCreateStateSet().setAttributeAndModes( this.createShaderPbrReference() );
            this.setupMaterial( sample.getOrCreateStateSet(), albedo, roughness, metal );

            return sample;
        },



        createSampleModels: function() {
            var group = new osg.Node();
            group.addChild( this.createSampleModel( [ 0.5, 0.5, 0.5, 1.0 ], 0.3, 0.0 ) );
            return group;
        },

        implementPanoramaRGBE: function() {


            var group = new osg.Node();

            // add environment geometry
            var environmentGeometry = this.createEnvironmentNode();
            group.addChild( environmentGeometry );


            // add the functor to process the environment
            group.addChild( this._panoramaRGBE.createWorkerInlineMipMapRGBE() );
            this._panoramaRGBE.getTextureInlineMipMapPromise().then( function( texture ) {


                group.addChild( this.createSampleModels() );

                group.addChild( this._panoramaRGBE.createDebugGeometry() );

                // set the stateSet of the environment geometry
                environmentGeometry.getOrCreateStateSet().setAttributeAndModes( this._panoramaRGBE.createShaderPanorama() );
                this.setPanoramaTexture( texture,  group.getOrCreateStateSet() );

            }.bind ( this ) );

            return group;
        },


        testSphericalHarmonics: function() {


            var group = new osg.MatrixTransform();

            group.addChild( this._spherical.createDebugGeometry() );

            return group;
        },


        testCubemapIrradiance: function() {


            var group = new osg.MatrixTransform();

            group.addChild( this._cubemapIrradiance.createDebugGeometry() );

            osg.Matrix.makeTranslate( 120, 0,0, group.getMatrix());
            return group;
        },


        testPanoramaIrradiance: function() {


            var group = new osg.MatrixTransform();

            group.addChild( this._panoramaIrradianceRGBE.createDebugIrradianceGeometry() );

            osg.Matrix.makeTranslate( 80, 0,0, group.getMatrix());
            return group;
        },

        createScene: function () {

            var group = new osg.MatrixTransform();
            group.addChild( osg.createAxisGeometry( 50 ) );

            // add lod controller to debug
            this._lod = osg.Uniform.createFloat1( 0.0, 'uLod' );
            group.getOrCreateStateSet().addUniform( this._lod );


            // implement a scene with panorama RGBE
            group.addChild ( this.implementPanoramaRGBE() );

            group.addChild ( this.testSphericalHarmonics() );

            group.addChild ( this.testCubemapIrradiance() );

            group.addChild ( this.testPanoramaIrradiance() );


            group.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );

            // y up
            osg.Matrix.makeRotate( Math.PI / 2, -1, 0, 0, group.getMatrix() );

            group.getOrCreateStateSet().addUniform( osg.Uniform.createInt( this._roughnessTextureUnit, 'roughnessMap' ) );
            group.getOrCreateStateSet().addUniform( osg.Uniform.createInt( this._metalnessTextureUnit, 'specularMap' ) );
            group.getOrCreateStateSet().addUniform( osg.Uniform.createInt( this._albedoTextureUnit, 'albedoMap' ) );

            return group;

        },

        run: function ( canvas ) {

            var ready = [];

            var environement = 'textures/tmp/';

            var panorama = environement + 'panorama.png';
            var panoramaIrradiance = environement + 'panorama_irradiance.png';
            var spherical = environement + 'spherical';
            var cubemap = environement + 'cubemap_irradiance_%d.png';

            this._panoramaRGBE = new PanoramaEnv( panorama );
            this._panoramaIrradianceRGBE = new PanoramaEnv( panoramaIrradiance );
            this._cubemapIrradiance = new CubeMapEnv( cubemap );
            this._spherical = new SphericalEnv( spherical );

            ready.push( this.readShaders() );
            ready.push( this._panoramaRGBE.load() );
            ready.push( this._panoramaIrradianceRGBE.load() );
            ready.push( this._spherical.load() );
            ready.push( this._cubemapIrradiance.load() );
            ready.push( this.createModelMaterialSample() );

            Q.all( ready ).then( function () {

                var viewer = this._viewer = new osgViewer.Viewer( canvas );
                viewer.init();

                var gl = viewer.getState().getGraphicContext();
                console.log( gl.getExtension( 'OES_texture_float' ) );
                console.log( gl.getExtension( 'OES_texture_float_linear' ) );
                console.log( gl.getExtension( 'EXT_shader_texture_lod' ) );

                viewer.setSceneData( this.createScene() );
                viewer.setupManipulator();
                viewer.getManipulator().computeHomePosition();

                viewer.run();


                var gui = new window.dat.GUI();
                var controller = gui.add( this._config, 'lod', 0.0, 15.01 ).step( 0.1 );
                controller.onChange( function ( value ) {
                    this._lod.get()[ 0 ] = value;
                    this._lod.dirty();
                }.bind( this ) );

            }.bind( this ) );

        }

    };


    // convert rgbe image to mipmap

    var NodeGenerateMipMapRGBE = function ( texture ) {
        osg.Node.call( this );
        this._texture = texture;

        var nbMip = Math.log( this._texture.getImage().getWidth() ) / Math.log( 2 );
        this._nbMipmap = nbMip - 1;

        var UpdateCallback = function () {
            this._done = false;
            this.update = function ( node, nodeVisitor ) {

                if ( nodeVisitor.getVisitorType() === osg.NodeVisitor.UPDATE_VISITOR ) {
                    if ( this._done )
                        node.setNodeMask( 0 );
                    else
                        this.done = true;
                }
            };
        };
        this.setUpdateCallback( new UpdateCallback() );

    };

    NodeGenerateMipMapRGBE.prototype = osg.objectInherit( osg.Node.prototype, {

        createSubGraph: function ( sourceTexture, destinationTexture, color ) {
            var composer = new osgUtil.Composer();
            var reduce = new osgUtil.Composer.Filter.Custom( [
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',

                'uniform sampler2D source;',
                'varying vec2 FragTexCoord0;',
                'uniform vec3 color;',

                'vec4 textureRGBE(const in sampler2D texture, const in vec2 uv) {',
                '    vec4 rgbe = texture2D(texture, uv );',

                '    float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));',
                '    return vec4(rgbe.rgb * 255.0 * f, 1.0);',
                '}',

                'void main() {',
                '  vec3 decode = textureRGBE(source, FragTexCoord0).rgb;',
                '  gl_FragColor = vec4(decode, 1.0);',
                '}',
                ''
            ].join( '\n' ), {
                'source': sourceTexture,
                'color': color
            } );

            composer.addPass( reduce, destinationTexture );
            composer.build();
            return composer;
        },

        createSubGraphFinal: function ( sourceTexture, destinationTexture ) {

            var composer = new osgUtil.Composer();
            var copy = new osgUtil.Composer.Filter.Custom( [
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',

                'uniform sampler2D source;',
                'uniform float destSize;',
                'uniform float sourceSize;',

                'void main() {',
                '  float offset = sourceSize/2.0;',
                '  if ( gl_FragCoord.x >= sourceSize || ',
                '        gl_FragCoord.y < offset  || gl_FragCoord.y > offset + sourceSize/2.0 ) {',
                '      discard;',
                '      return;',
                '  }',

                '  vec2 uv = vec2( gl_FragCoord.x/sourceSize, (gl_FragCoord.y - offset) / sourceSize/2.0 );',
                '  gl_FragColor = texture2D(source, uv);',
                '}',
                ''
            ].join( '\n' ), {
                'source': sourceTexture,
                'destSize': destinationTexture.getWidth(),
                'sourceSize': sourceTexture.getWidth()
            } );

            composer.addPass( copy, destinationTexture );
            composer.build();
            return composer;
        },

        init: function () {

            var sourceTexture = this._texture;
            var finalTexture = new osg.Texture();
            finalTexture.setMinFilter( 'NEAREST' );
            finalTexture.setMagFilter( 'NEAREST' );

            this._finalTexture = finalTexture;

            var maxSize = Math.pow( 2, this._nbMipmap );
            finalTexture.setTextureSize( maxSize, maxSize );

            var colors = [
                [ 1, 0, 0 ],
                [ 0, 1, 0 ],
                [ 0, 0, 1 ]
            ];

            var root = new osg.Node();

            for ( var i = 0; i < this._nbMipmap; i++ ) {
                var size = Math.pow( 2, this._nbMipmap - i );

                var destinationTexture = new osg.Texture();
                destinationTexture.setMinFilter( 'NEAREST' );
                destinationTexture.setMagFilter( 'NEAREST' );

                destinationTexture.setTextureSize( size, size / 2 );
                var node = this.createSubGraph( sourceTexture, destinationTexture, colors[ i % 3 ] );

                var final = this.createSubGraphFinal( destinationTexture, finalTexture );
                node.addChild( final );
                root.addChild( node );
                sourceTexture = destinationTexture;
            }

            this.addChild( root );
        }


    } );


    // convert rgbe image to float texture
    var TextureRGBEToFloatTexture = function ( texture, dest, textureTarget ) {
        osg.Node.call( this );
        this._texture = texture;
        this._finalTexture = dest;
        this._textureTarget = textureTarget;
        this._defer = Q.defer();

        var self = this;
        var UpdateCallback = function () {
            this._done = false;
            this.update = function ( node, nodeVisitor ) {

                if ( nodeVisitor.getVisitorType() === osg.NodeVisitor.UPDATE_VISITOR ) {
                    if ( this._done ) {
                        self._defer.resolve( self._finalTexture );
                        self._finalTexture.dirtyMipmap();
                        node.setNodeMask( 0 );
                    } else {
                        this._done = true;
                    }
                }
            };
        };
        this.setUpdateCallback( new UpdateCallback() );

    };

    TextureRGBEToFloatTexture.prototype = osg.objectInherit( osg.Node.prototype, {

        getPromise: function () {
            return this._defer.promise;
        },

        createSubGraph: function ( sourceTexture, destinationTexture, textureTarget ) {
            var composer = new osgUtil.Composer();
            var reduce = new osgUtil.Composer.Filter.Custom( [
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',

                'uniform sampler2D source;',
                'varying vec2 FragTexCoord0;',

                'vec4 textureRGBE(const in sampler2D texture, const in vec2 uv) {',
                '    vec4 rgbe = texture2D(texture, uv );',

                '    float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));',
                '    return vec4(rgbe.rgb * 255.0 * f, 1.0);',
                '}',

                'void main() {',
                '  vec3 decode = textureRGBE(source, FragTexCoord0).rgb;',
                '  //gl_FragColor = vec4(vec3(1.0,0.0,1.0), 1.0);',
                '  gl_FragColor = vec4(decode, 1.0);',
                '}',
                ''
            ].join( '\n' ), {
                'source': sourceTexture
            } );

            composer.addPass( reduce, destinationTexture, textureTarget );
            composer.build();
            return composer;
        },


        init: function () {

            var sourceTexture = this._texture;
            if ( !this._finalTexture ) {
                var finalTexture = new osg.Texture();
                finalTexture.setTextureSize( sourceTexture.getImage().getWidth(), sourceTexture.getImage().getHeight() );
                finalTexture.setType( 'FLOAT' );
                finalTexture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                finalTexture.setMagFilter( 'LINEAR' );

                this._finalTexture = finalTexture;
            }
            var composer = this.createSubGraph( sourceTexture, this._finalTexture, this._textureTarget );
            this.addChild( composer );
        }


    } );





    // convert rgbe texture list into a cubemap float
    // we could make it more generic by giving parameter
    // like input format ( rgbe / float ) and cubemap output
    var TextureListRGBEToCubemapFloat = function ( textureSources ) {
        osg.Geometry.call( this );

        this._defer = Q.defer();
        var finalTexture = new osg.TextureCubeMap();

        this._width = textureSources[ 0 ].getImage().getWidth();
        this._height = textureSources[ 0 ].getImage().getHeight();

        finalTexture.setTextureSize( this._width, this._height );
        finalTexture.setType( 'FLOAT' );
        finalTexture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
        finalTexture.setMagFilter( 'LINEAR' );
        this._textureCubemap = finalTexture;

        this._textureTarget = [
            osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X,
            osg.Texture.TEXTURE_CUBE_MAP_NEGATIVE_X,
            osg.Texture.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_Y,
            osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_Z,
            osg.Texture.TEXTURE_CUBE_MAP_NEGATIVE_Z
        ];

        this._textureSources = textureSources;
        this._fbo = new osg.FrameBufferObject();
        this._fbo.setAttachment( {
            'attachment': osg.FrameBufferObject.COLOR_ATTACHMENT0,
            'texture': this._textureCubemap,
            'textureTarget': this._textureTarget[ 0 ]
        } );

        var self = this;
        var UpdateCallback = function () {
            this._done = false;
            this.update = function ( node, nodeVisitor ) {

                if ( nodeVisitor.getVisitorType() === osg.NodeVisitor.UPDATE_VISITOR ) {
                    if ( this._done ) {
                        self._defer.resolve( self._textureCubemap );
                        self._textureCubemap.dirtyMipmap();
                        node.setNodeMask( 0 );
                    } else {
                        this._done = true;
                    }
                }
            };
        };
        this.setUpdateCallback( new UpdateCallback() );

        var w = this._width;
        var h = this._height;
        var quad = osg.createTexturedQuadGeometry( -w / 2, -h / 2, 0,
            w, 0, 0,
            0, h, 0 );
        this.getAttributes().Vertex = quad.getAttributes().Vertex;
        this.getAttributes().TexCoord0 = quad.getAttributes().TexCoord0;
        this.getPrimitives().push( quad.getPrimitives()[ 0 ] );

        this.initStateSet();
    };

    TextureListRGBEToCubemapFloat.prototype = osg.objectInherit( osg.Geometry.prototype, {
        getPromise: function () {
            return this._defer.promise;
        },
        initStateSet: function () {
            var ss = this.getOrCreateStateSet();

            var vtx = [
                '#ifdef GL_FRAGMENT_PRECISION_HIGH',
                'precision highp float;',
                '#else',
                'precision mediump float;',
                '#endif',

                'attribute vec3 Vertex;',
                'attribute vec2 TexCoord0;',

                'uniform mat4 ModelViewMatrix;',
                'uniform mat4 ProjectionMatrix;',

                'varying vec2 FragTexCoord0;',

                'void main(void) {',
                '    FragTexCoord0 = TexCoord0;',
                '    gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
                '}',
            ].join( '\n' );

            var frag = [
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',

                'uniform sampler2D source;',
                'varying vec2 FragTexCoord0;',

                'vec4 textureRGBE(const in sampler2D texture, const in vec2 uv) {',
                '    vec4 rgbe = texture2D(texture, uv );',

                '    float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));',
                '    return vec4(rgbe.rgb * 255.0 * f, 1.0);',
                '}',

                'void main() {',
                '  vec3 decode = textureRGBE(source, FragTexCoord0).rgb;',
                '  gl_FragColor = vec4(decode, 1.0);',
                '}',
                ''
            ].join( '\n' );

            ss.addUniform( osg.Uniform.createInt1( 0, 'source' ) );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vtx ),
                new osg.Shader( 'FRAGMENT_SHADER', frag ) );

            ss.setAttributeAndModes( program );
            ss.setAttributeAndModes( this._fbo );
            ss.setAttributeAndModes( new osg.Depth( 'DISABLE' ) );
        },

        draw: function ( state ) {
            osg.Geometry.prototype.drawImplementation.call( this, state );
        },

        drawImplementation: function ( state ) {

            var gl = state.getGraphicContext();

            // will be applied by stateSet
            //state.applyAttribute( this._fbo );

            var textureID = this._textureCubemap.getTextureObject().id();

            for ( var i = 0; i < 6; i++ ) {
                gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, this._textureTarget[ i ], textureID, 0 );
                var status = gl.checkFramebufferStatus( gl.FRAMEBUFFER );
                if ( status !== 0x8CD5 ) {
                    this._fbo._reportFrameBufferError( status );
                }

                state.applyTextureAttribute( 0, this._textureSources[ i ] );

                this.draw( state );
            }
        }

    } );

    window.addEventListener( 'load', function () {
        var example = new Example();
        var canvas = $( '#View' )[ 0 ];
        example.run( canvas );
    }, true );

} )();

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


    var EnvironmentPanorama = window.EnvironmentPanorama;
    var EnvironmentCubeMap = window.EnvironmentCubeMap;
    var EnvironmentSphericalHarmonics = window.EnvironmentSphericalHarmonics;

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


    var Example = function () {
        this._shaderPath = 'shaders/';


        this._config = {
            lod: 0.01,
            albedo: '#bdaaeb',
            nbSamples: 8,
            environmentType: 'cubemap'
        };

        this.updateAlbedo();

        this._uniformHammersleySequence = {};
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
                'math.glsl',
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
                'sphericalHarmonicsFragment.glsl',

                'panoramaToCubemapVertex.glsl',
                'panoramaToCubemapFragment.glsl'

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
        createShaderPBR: function ( config ) {

            var defines = [];
            if ( config && config.normalMap === true )
                defines.push( '#define NORMAL' );

            if ( config && config.glossinessMap === true )
                defines.push( '#define GLOSSINESS' );

            if ( config && config.specularMap === true )
                defines.push( '#define SPECULAR' );

            if ( config && config.aoMap === true )
                defines.push( '#define AO' );

            if ( config && config.nbSamples !== undefined )
                defines.push( '#define NB_SAMPLES ' + config.nbSamples );
            else
                defines.push( '#define NB_SAMPLES 8' );

            if ( config && config.environmentType === 'cubemap' )
                defines.push( '#define FLOAT_CUBEMAP_LOD ');


            if ( !this._shaderCache )
                this._shaderCache = {};

            var hash = defines.join();
            if ( !this._shaderCache[ hash ] ) {

                var vertexshader = shaderProcessor.getShader( 'pbrReferenceVertex.glsl' );
                var fragmentshader = shaderProcessor.getShader( 'pbrReferenceFragment.glsl', defines );

                var program = new osg.Program(
                    new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                    new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

                this._shaderCache[ hash ] = program;

            }

            return this._shaderCache[ hash ];
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

        setupMaterial: function ( stateSet, roughness, metalness ) {


            var roughnessTexture = this._roughnessTexture = this.createTextureFromColor( [ roughness, roughness, roughness, 1.0 ], false // , this._roughnessTexture
            );
            var metalnessTexture = this._metalnessTexture = this.createTextureFromColor( [ metalness, metalness, metalness, 1.0 ], false //, this._metalnessTexture
            );

            stateSet.setTextureAttributeAndModes( this._albedoTextureUnit, this._albedoTexture );
            stateSet.setTextureAttributeAndModes( this._roughnessTextureUnit, roughnessTexture );
            stateSet.setTextureAttributeAndModes( this._metalnessTextureUnit, metalnessTexture );
        },

        createEnvironmentNode: function () {

            var scene = new osg.Node();

            // create the environment sphere
            var size = 500;
            //var geom = osg.createTexturedBoxGeometry( 0, 0, 0, size, size, size );
            var geom = osg.createTexturedSphereGeometry( size / 2, 20, 20 ); // to use the same shader panorama
            var ss = geom.getOrCreateStateSet();
            geom.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
            geom.getOrCreateStateSet().setAttributeAndModes( new osg.Depth( 'DISABLE' ) );

            ss.setRenderBinDetails( -1, 'RenderBin' );

            var environmentTransform = this._environmentTransformUniform;

            var mt = new osg.MatrixTransform();
            mt.addChild( geom );

            var CullCallback = function () {
                this.cull = function ( node, nv ) {
                    // overwrite matrix, remove translate so environment is always at camera origin
                    osg.Matrix.setTrans( nv.getCurrentModelViewMatrix(), 0, 0, 0 );
                    var m = nv.getCurrentModelViewMatrix();

                    // add a rotation, because environment has the convention y up
                    var rotateYtoZ = osg.Matrix.makeRotate( -Math.PI / 2, 1, 0, 0, osg.Matrix.create() );
                    osg.Matrix.mult( m, rotateYtoZ, environmentTransform.get() );
                    //osg.Matrix.copy( m, environmentTransform.get() );
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


        createSampleModel: function ( roughness, metal ) {

            var sample = this.getModelTestInstance();

            var x = roughness * 80;
            var y = metal * 80;
            osg.Matrix.makeTranslate( x, 0, y, sample.getMatrix() );

            this.setupMaterial( sample.getOrCreateStateSet(), roughness, metal );

            return sample;
        },


        createSampleModels: function () {
            var group = new osg.Node();
            var nb = 2;
            var nbRough = 5;
            for ( var i = 0; i < nb; i++ ) {
                for ( var j = 0; j < nbRough; j++ ) {
                    group.addChild( this.createSampleModel( j / ( nbRough - 1 ), i / ( nb - 1 ) ) );
                }
            }

            this._stateSetPBR = group.getOrCreateStateSet();
            this.updateShaderPBR();

            return group;
        },

        createSampleScene: function () {

            var group = new osg.Node();
            this._mainSceneNode = group;
            // add environment geometry
            var environmentGeometry = this.createEnvironmentNode();
            group.addChild( environmentGeometry );

            this._environmentStateSet = environmentGeometry.getOrCreateStateSet();

            group.addChild( this.createSampleModels() );

            return group;
        },

        setPanorama: function () {

            // set the stateSet of the environment geometry
            this._environmentStateSet.setAttributeAndModes( this._panoramaRGBE.createShaderPanorama() );
            var texture = this._panoramaRGBE._textureInlineMipMap;

            var stateSet = this._mainSceneNode.getOrCreateStateSet();
            var w = texture.getWidth();
            var name = 'uEnvironment';
            stateSet.addUniform( osg.Uniform.createFloat2( [ w, w / 2 ], name + 'Size' ) );
            stateSet.addUniform( osg.Uniform.createFloat1( Math.log( w ) / Math.LN2, name + 'MaxLod' ) );
            stateSet.addUniform( osg.Uniform.createInt1( 0, name ) );

            stateSet.addUniform( this._environmentTransformUniform );
            stateSet.setTextureAttributeAndModes( 0, texture );

        },

        setCubemap: function () {

            // set the stateSet of the environment geometry
            this._environmentStateSet.setAttributeAndModes( this._cubemapFloat.createShader( [ '#define FLOAT_CUBEMAP_LOD' ] ) );
            var texture = this._cubemapFloat._convertor.getTexture();

            var stateSet = this._mainSceneNode.getOrCreateStateSet();
            var w = texture.getWidth();

            stateSet.addUniform( osg.Uniform.createFloat2( [ w, w ], 'uEnvironmentSize' ) );
            stateSet.addUniform( osg.Uniform.createFloat1( Math.log( w ) / Math.LN2, 'uEnvironmentMaxLod' ) );
            stateSet.addUniform( osg.Uniform.createInt1( 0, 'uEnvironmentCube' ) );

            stateSet.addUniform( this._environmentTransformUniform );
            stateSet.setTextureAttributeAndModes( 0, texture );

        },

        implementPanoramaRGBE: function () {

            var group = new osg.Node();

            // add environment geometry
            var environmentGeometry = this.createEnvironmentNode();
            group.addChild( environmentGeometry );

            this._environmentStateSet = environmentGeometry.getOrCreateStateSet();

            // add the functor to process the environment
            group.addChild( this._panoramaRGBE.createWorkerInlineMipMapRGBE() );
            this._panoramaRGBE.getTextureInlineMipMapPromise().then( function ( texture ) {

                group.addChild( this.createSampleModels() );

                // set the stateSet of the environment geometry
                environmentGeometry.getOrCreateStateSet().setAttributeAndModes( this._panoramaRGBE.createShaderPanorama() );
                this.setPanoramaTexture( texture, group.getOrCreateStateSet() );

            }.bind( this ) );

            return group;
        },


        testSphericalHarmonics: function ( offset, offsety ) {

            var y = ( offsety !== undefined ) ? offsety : 0;
            var group = new osg.MatrixTransform();
            osg.Matrix.makeTranslate( offset, y, 0, group.getMatrix() );

            group.addChild( this._spherical.createDebugGeometry() );
            return group;
        },


        testCubemapIrradiance: function ( offset, offsety ) {

            var y = ( offsety !== undefined ) ? offsety : 0;
            var group = new osg.MatrixTransform();
            osg.Matrix.makeTranslate( offset, y, 0, group.getMatrix() );

            group.addChild( this._cubemapIrradiance.createDebugGeometry() );
            return group;
        },

        testCubemap: function ( offset, offsety ) {

            var y = ( offsety !== undefined ) ? offsety : 0;
            var group = new osg.MatrixTransform();
            osg.Matrix.makeTranslate( offset, y, 0, group.getMatrix() );

            group.addChild( this._cubemap.createDebugGeometry() );
            return group;
        },


        testCubemapFloat: function ( offset, offsety ) {

            var y = ( offsety !== undefined ) ? offsety : 0;
            var group = new osg.MatrixTransform();
            osg.Matrix.makeTranslate( offset, y, 0, group.getMatrix() );

            group.addChild( this._cubemapFloat.createFloatCubeMapDebugGeometry() );
            return group;
        },


        testPanoramaIrradiance: function ( offset, offsety ) {

            var y = ( offsety !== undefined ) ? offsety : 0;
            var group = new osg.MatrixTransform();
            osg.Matrix.makeTranslate( offset, y, 0, group.getMatrix() );

            group.addChild( this._panoramaIrradianceRGBE.createDebugIrradianceGeometry() );
            return group;
        },


        testPanorama: function ( offset, offsety ) {

            var y = ( offsety !== undefined ) ? offsety : 0;
            var group = new osg.MatrixTransform();
            osg.Matrix.makeTranslate( offset, y, 0, group.getMatrix() );

            group.addChild( this._panoramaRGBE.createDebugGeometry() );
            return group;
        },

        testCubemapFromPanorama: function ( offset, offsety ) {

            var y = ( offsety !== undefined ) ? offsety : 0;
            var group = new osg.MatrixTransform();
            osg.Matrix.makeTranslate( offset, y, 0, group.getMatrix() );

            group.addChild( this._cubemapFromPanorama.createFloatCubeMapDebugGeometry() );
            return group;
        },



        createScene: function () {

            var root = new osg.Node();
            root.addChild( osg.createAxisGeometry( 50 ) );

            var group = new osg.MatrixTransform();
            root.addChild( group );

            // add lod controller to debug
            this._lod = osg.Uniform.createFloat1( 0.0, 'uLod' );
            group.getOrCreateStateSet().addUniform( this._lod );


            var promises = [];

            // precompute panorama
            group.addChild( this._panoramaRGBE.createWorkerInlineMipMapRGBE() );
            promises.push( this._panoramaRGBE.getTextureInlineMipMapPromise() );

            // precompute cubemap float
            group.addChild( this._cubemapFloat.createWorkerRGBEToFloatCubeMap( {
                minFilter: 'LINEAR_MIPMAP_LINEAR'
            } ) );
            promises.push( this._cubemapFloat.getFloatCubeMapPromise() );

            group.addChild( this._cubemapFromPanorama.generate() );
            //promises.push( this._cubemapFromPanorama.getFloatCubeMapPromise() );



            Q.all( promises ).then( function () {

                //group.addChild( this.createSampleScene() );
                this.createSampleScene();

                this.updateEnvironment();


                group.addChild( this.testSphericalHarmonics( -30, 30 ) );

                group.addChild( this.testCubemap( -60 ) );
                group.addChild( this.testCubemapFloat( -60, -30 ) );
                group.addChild( this.testCubemapIrradiance( -60, 30 ) );

                group.addChild( this.testPanoramaIrradiance( -90, 30 ) );
                group.addChild( this.testPanorama( -90 ) );

                //group.addChild( this.testCubemapFromPanorama( -60, 60 ) );




                //group.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );

                // y up
                osg.Matrix.makeRotate( Math.PI / 2, -1, 0, 0, group.getMatrix() );

                group.getOrCreateStateSet().addUniform( osg.Uniform.createInt( this._roughnessTextureUnit, 'roughnessMap' ) );
                group.getOrCreateStateSet().addUniform( osg.Uniform.createInt( this._metalnessTextureUnit, 'specularMap' ) );
                group.getOrCreateStateSet().addUniform( osg.Uniform.createInt( this._albedoTextureUnit, 'albedoMap' ) );




            }.bind( this ) );



            return root;

        },

        run: function ( canvas ) {

            var ready = [];

            var environment = 'textures/tmp/';

            var panorama = environment + 'panorama.png';
            var panoramaIrradiance = environment + 'panorama_irradiance.png';
            var spherical = environment + 'spherical';
            var cubemapIrradiance = environment + 'cubemap_irradiance_%d.png';
            var cubemap = environment + 'cubemap_%d.png';
            //var cubemap = environment + 'fixup_%d.png';

            this._panoramaRGBE = new EnvironmentPanorama( panorama );
            this._panoramaIrradianceRGBE = new EnvironmentPanorama( panoramaIrradiance );
            this._cubemapIrradiance = new EnvironmentCubeMap( cubemapIrradiance );
            this._cubemap = new EnvironmentCubeMap( cubemap );
            this._cubemapFloat = new EnvironmentCubeMap( cubemap );
            this._spherical = new EnvironmentSphericalHarmonics( spherical );
            this._cubemapFromPanorama = new EnvironmentCubeMap( panorama );

            ready.push( this.readShaders() );
            ready.push( this._panoramaRGBE.load() );
            ready.push( this._panoramaIrradianceRGBE.load() );
            ready.push( this._spherical.load() );
            ready.push( this._cubemapIrradiance.load() );
            ready.push( this._cubemap.load() );
            ready.push( this._cubemapFloat.load() );
            ready.push( this._cubemapFromPanorama.loadPanorama( panorama ) );
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

                controller = gui.addColor( this._config, 'albedo' );
                controller.onChange( this.updateAlbedo.bind( this ) );

                controller = gui.add( this._config, 'nbSamples', [ 4, 8, 16, 32, 64, 128, 256 ] );
                controller.onChange( this.updateShaderPBR.bind( this ) );

                controller = gui.add( this._config, 'environmentType', [ 'cubemap', 'panorama' ] );
                controller.onChange( this.updateEnvironment.bind( this ) );

            }.bind( this ) );

        },

        // http://holger.dammertz.org/stuff/notes_HammersleyOnHemisphere.html
        computeHammersleyReverse: function ( a ) {
            a = ( a << 16 | a >>> 16 ) >>> 0;
            a = ( ( a & 1431655765 ) << 1 | ( a & 2863311530 ) >>> 1 ) >>> 0;
            a = ( ( a & 858993459 ) << 2 | ( a & 3435973836 ) >>> 2 ) >>> 0;
            a = ( ( a & 252645135 ) << 4 | ( a & 4042322160 ) >>> 4 ) >>> 0;
            return ( ( ( a & 16711935 ) << 8 | ( a & 4278255360 ) >>> 8 ) >>> 0 ) / 4294967296;
        },

        computeHammersleySequence: function ( size ) {
            var hammersley = [];
            for ( var i = 0; i < size; i++ ) {
                var u = i / size;
                var v = this.computeHammersleyReverse( i );
                hammersley.push( u );
                hammersley.push( v );
            }
            //console.log( this._hammersley );
            return hammersley;
        },

        updateAlbedo: function () {
            this._albedoTexture = this.createTextureFromColor( this.convertColor( this._config.albedo ), true, this._albedoTexture );
        },

        updateShaderPBR: function () {

            var nbSamples = this._config.nbSamples;
            if ( !this._uniformHammersleySequence[ nbSamples ] ) {
                var sequence = this.computeHammersleySequence( nbSamples );
                var uniformHammersley = osg.Uniform.createFloat2Array( sequence, 'uHammersleySamples' );
                this._uniformHammersleySequence[ nbSamples ] = uniformHammersley;
            }
            var uniformHammerslay = this._uniformHammersleySequence[ nbSamples ];

            var program = this.createShaderPBR( {
                nbSamples: nbSamples,
                environmentType: this._config.environmentType
            } );

            this._stateSetPBR.setAttributeAndModes( program );
            this._stateSetPBR.addUniform( uniformHammerslay );
        },

        updateEnvironment: function () {

            if ( this._config.environmentType === 'cubemap' ) {
                this.setCubemap();
            } else {
                this.setPanorama();
            }

            this.updateShaderPBR();
        },

        convertColor: function ( color ) {

            var r, g, b;

            if ( color.length === 3 ) { // rgb [255, 255, 255]
                r = color[ 0 ];
                g = color[ 1 ];
                b = color[ 2 ];

            } else if ( color.length === 7 ) { // hex (24 bits style) '#ffaabb'
                var intVal = parseInt( color.slice( 1 ), 16 );
                r = ( intVal >> 16 );
                g = ( intVal >> 8 & 0xff );
                b = ( intVal & 0xff );
            }

            var result = [ 0, 0, 0, 1 ];
            result[ 0 ] = r / 255.0;
            result[ 1 ] = g / 255.0;
            result[ 2 ] = b / 255.0;
            //console.log( result );
            return result;
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






    window.addEventListener( 'load', function () {
        var example = new Example();
        var canvas = $( '#View' )[ 0 ];
        example.run( canvas );
    }, true );

} )();

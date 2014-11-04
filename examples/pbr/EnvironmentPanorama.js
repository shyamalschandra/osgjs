window.EnvironmentPanorama = ( function () {
    'use strict';

    var Q = window.Q;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;
    var osgShader = OSG.osgShader;

    var shaderProcessor = new osgShader.ShaderProcessor();
    var PanoramaToPanoramaInlineMipmap = window.PanoramaToPanoramaInlineMipmap;

    var PanoramaEnv = function ( file, options ) {
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

            if ( this._shaderPanorama === undefined ) {

                var vertexshader = shaderProcessor.getShader( 'panoramaVertex.glsl' );
                var fragmentshader = shaderProcessor.getShader( 'panoramaFragment.glsl', defines );

                var program = new osg.Program(
                    new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                    new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

                this._shaderPanorama = program;
            }

            return this._shaderPanorama;
        },

        load: function () {
            var defer = Q.defer();

            osgDB.readImageURL( this._file, {
                imageLoadingUsePromise: true
            } ).then( function ( image ) {

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
            var texture = this._texture;
            var size = 10;
            if ( this._textureInlineMipMap ) {
                // create a quad to display the panorama generated
                var quadDebug = osg.createTexturedQuadGeometry( -size, -size, 0,
                    size * 2, 0, 0,
                    0, size * 2, 0,
                    0, 0,
                    1, 1 );
                quadDebug.getOrCreateStateSet().setAttributeAndModes( this.createShaderInlineDebugPanorama() );

                var mt = new osg.MatrixTransform();
                mt.addChild( quadDebug );
                osg.Matrix.makeTranslate( 0, -( size * 2 + 1 ), 0, mt.getMatrix() );
                debugGroup.addChild( mt );

                texture = this._textureInlineMipMap;
            }

            // create a sphere to debug it
            var sphere = osg.createTexturedSphereGeometry( size, 20, 20 );
            sphere.getOrCreateStateSet().setAttributeAndModes( this.createShaderPanorama() );
            debugGroup.getOrCreateStateSet().setTextureAttributeAndModes( 0, texture );

            debugGroup.addChild( sphere );
            return debugGroup;
        },

        createDebugIrradianceGeometry: function () {

            var debugGroup = new osg.MatrixTransform();

            var size = 10;
            // create a sphere to debug it
            var sphere = osg.createTexturedSphereGeometry( size, 20, 20 );

            sphere.getOrCreateStateSet().setAttributeAndModes( this.createShaderPanorama( [ '#define IRRADIANCE' ] ) );
            sphere.getOrCreateStateSet().setTextureAttributeAndModes( 0, this._texture );
            var w = this._texture.getImage().getWidth();
            debugGroup.getOrCreateStateSet().addUniform( osg.Uniform.createFloat2( [ w, w / 2 ], 'uIrradianceSize' ) );

            debugGroup.addChild( sphere );

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
        getTextureInlineMipMapPromise: function () {
            return this._textureInlinePromise;
        }

    };

    return PanoramaEnv;
} )();

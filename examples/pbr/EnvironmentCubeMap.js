window.EnvironmentCubeMap = ( function () {
    'use strict';

    var Q = window.Q;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgDB = OSG.osgDB;
    var osgShader = OSG.osgShader;

    var TextureListRGBEToCubemapFloat = window.TextureListRGBEToCubemapFloat;
    var PanoramaToCubeMap = window.PanoramaToCubeMap;

    var shaderProcessor = new osgShader.ShaderProcessor();

    var CubeMapEnv = function ( filePattern, options ) {
        this._options = options || {};
        this._pattern = filePattern; // abandoned_sanatorium_staircase_%d.png
    };

    CubeMapEnv.prototype = {

        createTexture: function ( image ) {
            var texture = new osg.Texture();
            texture.setImage( image );
            texture.setMinFilter( this._options.minFilter || 'NEAREST' );
            texture.setMagFilter( this._options.magFilter || 'NEAREST' );
            return texture;
        },

        createTextureCubemap: function () {

            var texture = new osg.TextureCubeMap();
            texture.setMinFilter( this._options.minFilter || 'NEAREST' );
            texture.setMagFilter( this._options.magFilter || 'NEAREST' );

            for ( var i = 0; i < 6; i++ )
                texture.setImage( osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X + i, this._images[ i ] );

            return texture;
        },

        createShader: function ( defines ) {

            var vertexshader = shaderProcessor.getShader( 'cubemapVertex.glsl' );
            var fragmentshader = shaderProcessor.getShader( 'cubemapFragment.glsl', defines );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            return program;

        },

        createDebugGeometry: function () {

            var scene = new osg.Node();

            var size = 10;
            var geom = osg.createTexturedSphereGeometry( size, 20, 20 );

            geom.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
            var texture = this.createTextureCubemap();
            geom.getOrCreateStateSet().setTextureAttributeAndModes( 0, texture );
            geom.getOrCreateStateSet().setAttributeAndModes( this.createShader() );

            scene.addChild( geom );
            return scene;
        },

        createFloatCubeMapDebugGeometry: function () {

            var scene = new osg.Node();

            var size = 10;
            var geom = osg.createTexturedSphereGeometry( size, 20, 20 );

            geom.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
            geom.getOrCreateStateSet().setTextureAttributeAndModes( 0, this._textureCube );
            geom.getOrCreateStateSet().setAttributeAndModes( this.createShader( [ '#define FLOAT_CUBEMAP_LOD' ] ) );

            scene.addChild( geom );
            return scene;
        },

        createWorkerRGBEToFloatCubeMap: function ( options ) {
            var textures = [];
            for ( var i = 0; i < 6; i++ ) {
                var texture = this.createTexture( this._images[ i ] );
                texture.setFlipY( false );
                textures.push( texture );
            }
            this._convertor = new TextureListRGBEToCubemapFloat( textures, options );
            this._textureCube = this._convertor.getTexture();

            return this._convertor.getOperatorNode();
        },

        loadPanorama: function ( path ) {
            var defer = Q.defer();

            osgDB.readImageURL( path, {
                imageLoadingUsePromise: true
            } ).then( function ( image ) {

                this._texturePanoramic = new osg.Texture();
                this._texturePanoramic.setImage( image );

                this._texturePanoramic.setMinFilter( 'NEAREST' );
                this._texturePanoramic.setMagFilter( 'NEAREST' );

                defer.resolve( this._texturePanoramic );

            }.bind( this ) );

            return defer.promise;
        },

        getFloatCubeMapPromise: function () {
            return this._convertor.getPromise();
        },

        load: function () {
            var defer = Q.defer();

            var images = [];
            for ( var i = 0; i < 6; i++ ) {
                var str = this._pattern;
                str = str.replace( '%d', i );
                images.push( osgDB.readImageURL( str, {
                    imageLoadingUsePromise: true
                } ) );
            }
            this._images = images;

            Q.all( images ).then( function ( images ) {
                defer.resolve( images );
            } );

            return defer.promise;

        },

        loadCubemapPacked: function () {
            var defer = Q.defer();

            var xhr = new XMLHttpRequest();

            var error = function() {};
            var load = function() {
                var data = xhr.response;

                var maxLevel = 9;
                var offset = 0;
                var images = { };
                for ( var i = 0; i <= maxLevel; i++ ) {
                    var size = Math.pow(2, maxLevel - i );
                    var byteSize = size*size*4*3;

                    for ( var face = 0; face < 6; face++ ) {

                        // add entry if does not exist
                        if (!images[osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X + face])
                            images[osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X + face] = [];

                        var imageData = new Float32Array( data, offset, byteSize/4 );
                        var image = new osg.Image();
                        image.setImage( imageData );

                        image.setWidth( size );
                        image.setHeight( size );
                        images[osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X + face].push(image);
                        offset += byteSize;
                    }
                }

                this._packedImages = images;
                this.createFloatCubemapPacked();

                defer.resolve();

            }.bind(this);

            xhr.addEventListener( 'error', error, false );
            xhr.addEventListener( 'load', function ( event ) {
                if ( xhr.status !== 200 ) {
                    error( event );
                    return;
                }
                load.call( event );

            },false);

            xhr.open( 'GET', this._pattern, true );
            xhr.responseType = 'arraybuffer';
            xhr.send( null );

            return defer.promise;

        },

        getPackedTexture: function() {
            return this._textureCubePacked;
        },
        createFloatCubemapPacked: function() {

            var texture = new osg.TextureCubeMap();
            texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
            texture.setMagFilter( 'LINEAR' );
            // texture.setMinFilter( 'NEAREST_MIPMAP_NEAREST' );
            // texture.setMagFilter( 'NEAREST' );
            texture.setType('FLOAT');
            texture.setFlipY(false);

            for ( var j = 0 ; j < 6 ; j++ ) {
                var f = osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X + j;
                texture.setImage( f , this._packedImages[f], 'RGB' );
            }
            this._textureCubePacked = texture;
            return texture;
        },

        createFloatCubeMapPackedDebugGeometry: function () {

            var scene = new osg.Node();

            var size = 10;
            var geom = osg.createTexturedSphereGeometry( size, 20, 20 );

            geom.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
            geom.getOrCreateStateSet().setTextureAttributeAndModes( 0, this._textureCubePacked );
            geom.getOrCreateStateSet().setAttributeAndModes( this.createShader( [ '#define FLOAT_CUBEMAP_LOD',
                                                                                  '#define FLOAT_CUBEMAP_SEAMLESS'] ) );

            scene.addChild( geom );
            return scene;
        }


    };

    return CubeMapEnv;
} )();

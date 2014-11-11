define( [
    'osg/Utils',
    'osg/Texture',
    'osg/Image',
    'osg/Utils'

], function ( MACROUTILS, Texture, Image ) {
    /**
     * TextureCubeMap
     * @class TextureCubeMap
     * @inherits Texture
     */
    var TextureCubeMap = function () {
        Texture.call( this );
        this._images = {};
    };

    /** @lends TextureCubeMap.prototype */
    TextureCubeMap.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInehrit( Texture.prototype, {
        setDefaultParameters: function () {
            Texture.prototype.setDefaultParameters.call( this );
            this._textureTarget = Texture.TEXTURE_CUBE_MAP;

            this._flipY = false;
        },
        cloneType: function () {
            var t = new TextureCubeMap();
            t.defaultType = true;
            return t;
        },
        setImage: function ( face, img, imageFormat ) {

            if ( typeof ( face ) === 'string' ) {
                face = Texture[ face ];
            }

            if ( this._images[ face ] === undefined ) {
                this._images[ face ] = {};
            }

            if ( typeof ( imageFormat ) === 'string' ) {
                imageFormat = Texture[ imageFormat ];
            }
            if ( imageFormat === undefined ) {
                imageFormat = Texture.RGBA;
            }

            var image = img;
            if ( image instanceof( Image ) === false ) {
                image = new Image( img );
            }

            this._images[ face ].image = image;
            this._images[ face ].format = imageFormat;
            this._images[ face ].dirty = true;
            this.dirty();
        },
        getImage: function ( face ) {
            return this._images[ face ].image;
        },

        initCubemapContent: function ( gl ) {

            var internalFormat = this._internalFormat;

            this.applyTexImage2D( gl, gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, internalFormat, this._textureWidth, this._textureHeight, 0, internalFormat, this._type, null );

            this.applyTexImage2D( gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, internalFormat, this._textureWidth, this._textureHeight, 0, internalFormat, this._type, null );

            this.applyTexImage2D( gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, internalFormat, this._textureWidth, this._textureHeight, 0, internalFormat, this._type, null );

            this.applyTexImage2D( gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, internalFormat, this._textureWidth, this._textureHeight, 0, internalFormat, this._type, null );

            this.applyTexImage2D( gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, internalFormat, this._textureWidth, this._textureHeight, 0, internalFormat, this._type, null );

            this.applyTexImage2D( gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, internalFormat, this._textureWidth, this._textureHeight, 0, internalFormat, this._type, null );

            return true;
        },

        applyImageTarget: function ( gl, internalFormat, target ) {

            var imgObject = this._images[ target ];

            if ( !imgObject )
                return 0;

            if ( !imgObject.image.isReady() ) {
                return 0;
            }

            if ( !imgObject.dirty )
                return 1;

            var image = imgObject.image;
            this.setTextureSize( image.getWidth(), image.getHeight() );

            this.applyTexImage2D( gl,
                target,
                0,
                internalFormat,
                internalFormat,
                this._type,
                image.getImage() );

            imgObject.dirty = false;

            if ( this._unrefImageDataAfterApply )
                delete this._images[ target ];

            return 1;
        },


        initCubemapContentImage: function ( gl ) {
            var internalFormat = this._internalFormat;
            var valid = 0;
            valid += this.applyImageTarget( gl, internalFormat, gl.TEXTURE_CUBE_MAP_POSITIVE_X );
            valid += this.applyImageTarget( gl, internalFormat, gl.TEXTURE_CUBE_MAP_NEGATIVE_X );

            valid += this.applyImageTarget( gl, internalFormat, gl.TEXTURE_CUBE_MAP_POSITIVE_Y );
            valid += this.applyImageTarget( gl, internalFormat, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y );

            valid += this.applyImageTarget( gl, internalFormat, gl.TEXTURE_CUBE_MAP_POSITIVE_Z );
            valid += this.applyImageTarget( gl, internalFormat, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z );

            if ( valid === 6 )
                return true;

            return false;
        },



        apply: function ( state ) {
            var gl = state.getGraphicContext();

            if ( this._textureObject !== undefined && !this.isDirty() ) {
                this._textureObject.bind( gl );

                // If we have modified the texture via Rtt or texSubImage2D and _need_ updated mipmaps,
                // then we must regenerate the mipmaps explicitely.
                // In all other cases, don't set this flag because it can be costly
                if ( this.isDirtyMipmap() ) {
                    this.generateMipmap( gl, this._textureTarget );
                }

            } else if ( this.defaultType ) {
                gl.bindTexture( this._textureTarget, null );

            } else {

                if ( !this._textureObject ) {

                    // must be called before init
                    this.computeTextureFormat();

                    this.init( gl );
                }
                this._textureObject.bind( gl );

                var valid;
                var keys = Object.keys( this._images );

                // no images it's must be a cubemap filled from rtt
                if ( !keys.length ) {

                    valid = this.initCubemapContent( gl );

                } else {

                    valid = this.initCubemapContentImage( gl );

                }

                if ( valid ) {
                    this.setDirty( false );
                    this.applyFilterParameter( gl, this._textureTarget );
                    this.generateMipmap( gl, this._textureTarget );
                }
            } // render to cubemap not yet implemented
        }
    } ), 'osg', 'TextureCubeMap' );

    return TextureCubeMap;
} );

( function () {
    'use strict';

    var Q = window.Q;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgDB = OSG.osgDB;
    var osgUtil = OSG.osgUtil;
    var $ = window.$;

    var readImageURL= function ( url, options ) {
        var opts = options || {};
        //opts.imageCrossOrigin = 'anonymous';
        opts.imageLoadingUsePromise = true;
        var ext = url.split( '.' ).pop();
        if ( ext === 'hdr' )
            return osgDB.readImageHDR( url, opts );

        return osgDB.readImageURL.call( this, url, opts );
    };

    var createTextureFromPath = function( path ) {

        var defer = Q.defer();

        readImageURL( path ).then( function ( image ) {

            var texture = new osg.Texture();
            texture.setImage( image );

            texture.setMinFilter( 'NEAREST' );
            texture.setMagFilter( 'NEAREST' );

            defer.resolve( texture );

        });


        return defer.promise;

    };


    var Example = function () {
    };

    Example.prototype = {


        createScene: function ( textureEnv ) {

            var geom2 = osg.createTexturedQuadGeometry(-5,-5,0,
                                                      10,0,0,
                                                      0,10,0,
                                                      0,0,
                                                      1,1);
            var group = new osg.Node();

            var nodeFunctor = new PanoramanToPanoramaInlineMipmap( textureEnv );
            group.addChild( nodeFunctor );
            nodeFunctor.init();
            nodeFunctor.getPromise().then ( function( texture ) {


                var geom = osg.createTexturedQuadGeometry(-5,-5,0,
                                                          10,0,0,
                                                          0,10,0,
                                                          0,0,
                                                          1,1);

                geom.getOrCreateStateSet().setTextureAttributeAndModes(0, texture );
                group.addChild( geom );

            });
            return group;

        },

        run: function ( canvas ) {

            // use a specific texture here
            var texture = createTextureFromPath('textures/road_in_tenerife_mountain/reference/rgbe/road_in_tenerife_mountain.png');

            texture.then( function( textureEnv ) {

                var viewer;
                viewer = new osgViewer.Viewer( canvas );
                this._viewer = viewer;
                viewer.init();

                var gl = viewer.getState().getGraphicContext();
                console.log( gl.getExtension( 'OES_texture_float' ) );
                console.log( gl.getExtension( 'OES_texture_float_linear' ) );
                console.log( gl.getExtension( 'EXT_shader_texture_lod' ) );

                viewer.setSceneData( this.createScene( textureEnv ) );
                viewer.setupManipulator();
                viewer.getManipulator().computeHomePosition();

                viewer.run();

            }.bind( this ));

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

        getPromise: function() {
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
    var TextureListRGBEToCubemapFloat = function( textureSources ) {
        osg.Geometry.call( this );

        this._defer = Q.defer();
        var finalTexture = new osg.TextureCubeMap();

        this._width = textureSources[0].getImage().getWidth();
        this._height = textureSources[0].getImage().getHeight();

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
            'textureTarget': this._textureTarget[0]
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
        this.getPrimitives().push( quad.getPrimitives()[0] );

        this.initStateSet();
    };

    TextureListRGBEToCubemapFloat.prototype = osg.objectInherit( osg.Geometry.prototype, {
        getPromise: function() { return this._defer.promise; },
        initStateSet: function() {
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
            ].join('\n');

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
            ].join('\n');

            ss.addUniform( osg.Uniform.createInt1( 0, 'source' ) );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vtx ),
                new osg.Shader( 'FRAGMENT_SHADER', frag ) );

            ss.setAttributeAndModes( program );
            ss.setAttributeAndModes( this._fbo );
            ss.setAttributeAndModes( new osg.Depth('DISABLE') );
        },

        draw: function( state ) {
            osg.Geometry.prototype.drawImplementation.call( this, state );
        },

        drawImplementation: function( state ) {

            var gl = state.getGraphicContext();

            // will be applied by stateSet
            //state.applyAttribute( this._fbo );

            var textureID = this._textureCubemap.getTextureObject().id();

            for( var i = 0; i < 6; i++ ) {
                gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, this._textureTarget[i] , textureID, 0 );
                var status = gl.checkFramebufferStatus( gl.FRAMEBUFFER );
                if ( status !== 0x8CD5 ) {
                    this._fbo._reportFrameBufferError( status );
                }

                state.applyTextureAttribute(0, this._textureSources[i]);

                this.draw( state );
            }
        }

    });

    window.addEventListener( 'load', function () {
        var example = new Example();
        var canvas = $('#View')[0];
        example.run( canvas );
    }, true );

} )();

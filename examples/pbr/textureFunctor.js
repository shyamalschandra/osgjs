var osg = window.OSG.osg;
var osgUtil = window.OSG.osgUtil;
var osgShader = window.OSG.osgShader;
var Q = window.Q;


var PanoramaToPanoramaInlineMipmap = function ( texture, dest, textureTarget ) {
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
                if ( true ) {
                    if ( this._done ) {
                        self._defer.resolve( self._finalTexture );
                        node.setNodeMask( 0 );
                    } else {
                        this._done = true;
                    }
                }
            }
        };
    };
    this.setUpdateCallback( new UpdateCallback() );
};


PanoramaToPanoramaInlineMipmap.prototype = osg.objectInherit( osg.Node.prototype, {

    getPromise: function () {
        return this._defer.promise;
    },
    getTexture: function () {
        return this._finalTexture;
    },

    getOrCreateCopyShader: function () {

        if ( this._shader ) {
            return this._shader;
        }

        var vtx = [
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',

            'attribute vec3 Vertex;',
            'attribute vec2 TexCoord0;',
            'varying vec2 FragTexCoord0;',
            'void main(void) {',
            '  gl_Position = ProjectionMatrix * vec4(Vertex,1.0);',
            '  FragTexCoord0 = TexCoord0;',
            '}',
        ].join( '\n' );

        var frg = [
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'varying vec2 FragTexCoord0;',
            'uniform sampler2D Texture0;',

            'void main (void)',
            '{',
            '  //gl_FragColor = vec4(1.0);', //texture2D( Texture0, FragTexCoord0);',
            '  gl_FragColor = texture2D( Texture0, FragTexCoord0);',
            '}',

        ].join( '\n' );

        var program = new osg.Program(
            new osg.Shader( 'VERTEX_SHADER', vtx ),
            new osg.Shader( 'FRAGMENT_SHADER', frg ) );
        this._shader = program;
        return this._shader;
    },

    getOrCreateFilter: function () {

        var reduce = new osgUtil.Composer.Filter.Custom( [
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',

            'uniform sampler2D Texture0;',
            'uniform vec2 RenderSize;',
            'varying vec2 FragTexCoord0;',
            'mat3 gaussianCoef = mat3 (vec3(1.0,	2.0,	1.0), vec3(2.0,	4.0,	2.0), vec3(1.0,	2.0,	1.0) );',
            '',
            'vec4 decodeRGBE(const in vec4 rgbe) {',
            '    float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));',
            '    return vec4(rgbe.rgb * 255.0 * f, 1.0);',
            '}',

            'vec3 textureRGBE(const in sampler2D texture, const in vec2 uv) {',
            '    vec4 rgbe = texture2D(texture, uv );',
            '    return decodeRGBE(rgbe).xyz;',
            '}',

            'vec3 textureRGBELinearPanoramic(const in sampler2D texture, const in vec2 size, const in vec2 uv, const in vec2 maxBox ) {',
            '',
            '    // texel size',
            '    vec2 t = vec2(1.0 / size);',
            '',
            '    vec2 uvTexelSpace = uv * size + vec2(0.5);',
            '    vec2 frac = fract(uvTexelSpace);',
            '',
            '    vec2 uvBase = floor ( uvTexelSpace ) * t;',
            '',
            '    float maxX = mod(uvBase.x+t.x, maxBox.x);',
            '    float maxY = min(uvBase.y+t.y, maxBox.y); // clamp to one pixel before',
            '',
            '    vec3 a = textureRGBE(texture, uvBase ),',
            '         b = textureRGBE(texture, vec2( maxX, uvBase.y) ),',
            '         c = textureRGBE(texture, vec2( uvBase.x, maxY) ),',
            '         d = textureRGBE(texture, vec2( maxX, maxY) );',
            '',
            '    vec3 A = mix(a, b, frac.x),',
            '         B = mix(c, d, frac.x);',
            '    return mix(A, B, frac.y);',
            '}',
            '',

            // not yet
            'vec3 textureRGBEGaussianPanoramic(const in sampler2D texture, const in vec2 size, const in vec2 uv ) {',
            '',
            '    // texel size',
            '    vec2 t = vec2(1.0 / size);',
            '    vec2 uvBase = uv + 0.5 * t;',
            '',
            '    vec3 result = vec3(0.0);',
            '    float sum = 0.0;',

            '    for(int i=0;i<3;i++) {',
            '       for(int j=0;j<3;j++) {',
            '            vec2 offset = vec2( float(i-1), float(j-1) ) * t;',
            '            vec2 texCoord = uvBase + offset;',
            '            if (texCoord.y < 0.0 || texCoord.y > 1.0 ) continue;',

            '            result += gaussianCoef[i][j] * textureRGBE(texture,texCoord);',
            '            sum += gaussianCoef[i][j];',
            '       }',
            '    }',
            '    result /= sum;',
            '    return result;',
            '}',
            '',


            'vec4 encodeRGBE(const in vec3 rgb) {',
            '  vec4 encoded;',
            '  float maxComponent = max(max(rgb.r, rgb.g), rgb.b );',
            '  float fExp = ceil( log2(maxComponent) );',
            '  encoded.rgb = rgb / exp2(fExp);',
            '  encoded.a = (fExp + 128.0) / 255.0;',
            '  return encoded;',
            '}',

            'void main() {',
            '  //vec4 rgbe = texture2D(Texture0, FragTexCoord0 );',
            '  //decodeRGBE(rgbe).rgb;',
            '  //vec3 decode = textureRGBELinearPanoramic( Texture0, RenderSize * 2.0, FragTexCoord0, vec2(1.0,1.0) );',
            '  vec3 decode = textureRGBEGaussianPanoramic( Texture0, RenderSize * 2.0, FragTexCoord0 );',
            '  gl_FragColor = vec4(encodeRGBE( decode ));',
            '}',
            ''
        ].join( '\n' ) );
        return reduce;
    },

    createSubGraph: function ( sourceTexture, destinationTexture, textureTarget ) {
        var composer = new osgUtil.Composer();

        // we will need to add a pixel format depending on the target plateform
        // ideally should be float/halffloat but if not possible rgbe
        var createTexture = function ( w, h ) {
            var texture = new osg.Texture();
            //texture.setMinFilter( 'LINEAR' );
            //texture.setMagFilter( 'LINEAR' );
            texture.setMinFilter( 'NEAREST' );
            texture.setMagFilter( 'NEAREST' );
            texture.setTextureSize( w, h );
            return texture;
        };

        var sourceTextureWidth = sourceTexture.getImage().getWidth();

        // the composer need it and the texture is not binded yet so
        // it results a textureSize of 0, so to avoid this we add it manually
        // we could imagine to improve the composer to ask for textureSize
        // imageSize if texture size is not yet set, but it could have side effect
        // so we do it manually here
        sourceTexture.setTextureSize( sourceTextureWidth, sourceTextureWidth / 2 );

        // compute each mipmap level
        var nbMipmapLevel = Math.log( sourceTextureWidth ) / Math.LN2;
        var textureList = [];

        composer.addPass( new osgUtil.Composer.Filter.InputTexture( sourceTexture ) );

        for ( var i = 0; i < nbMipmapLevel; i++ ) {
            var w = Math.pow( 2, nbMipmapLevel - i );
            var h = Math.max( 1, w / 2 );
            var targetTexture = createTexture( w, h );
            textureList.push( targetTexture );

            // we could imagine to re use a filter instead of instancing one at each
            // pass, but composer need a instance for each pass because it uses
            // stateset on it, and if it uses a texture it can't be shared
            composer.addPass( this.getOrCreateFilter(), targetTexture );
        }
        composer.build();

        // now we need to mix all mipmap level into one big texture
        // need a camera ortho
        // place all miplevel under each other
        var textureSize = sourceTextureWidth;
        //var finalTexture = createTexture( textureSize, textureSize );
        var camera = new osg.Camera();
        var vp = new osg.Viewport( 0, 0, textureSize, textureSize );
        camera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
        camera.setViewport( vp );
        osg.Matrix.makeOrtho( 0, textureSize, 0, textureSize, -5, 5, camera.getProjectionMatrix() );
        camera.setRenderOrder( osg.Camera.PRE_RENDER, 0 );

        camera.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, destinationTexture );

        // add here each quad with good offset / size
        var grp = new osg.Node();
        var offsety = 0.0;

        textureList.forEach( function ( texture ) {
            var w = texture.getWidth();
            var h = texture.getHeight(); // should w/2
            var geom = osg.createTexturedQuadGeometry( 0, offsety, 0, w, 0, 0, 0, h, 0, 0, 0, 1, 1 );
            geom.getOrCreateStateSet().setAttributeAndModes( this.getOrCreateCopyShader() );
            geom.getOrCreateStateSet().setTextureAttributeAndModes( 0, texture );
            geom.getOrCreateStateSet().addUniform( osg.Uniform.createFloat2( [ w, h ], 'uSize' ) );
            geom.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( [ 0 ], 'Texture0' ) );
            offsety += h;

            grp.addChild( geom );
        }.bind( this ) );

        camera.addChild( grp );

        var full = new osg.Node();
        full.addChild( composer );
        full.addChild( camera );
        return full;
    },

    init: function () {

        var sourceTexture = this._texture;
        if ( !this._finalTexture ) {
            var finalTexture = new osg.Texture();
            finalTexture.setTextureSize( sourceTexture.getImage().getWidth(), sourceTexture.getImage().getHeight() * 2 );

            // we have float linear we should prefer half float
            finalTexture.setMinFilter( 'NEAREST' );
            finalTexture.setMagFilter( 'NEAREST' );

            this._finalTexture = finalTexture;
        }
        var composer = this.createSubGraph( sourceTexture, this._finalTexture, this._textureTarget );
        this.addChild( composer );
    }


} );





var PanoramaToCubeMap = function ( texturePanoramic ) {
    osg.Node.call( this );
    this._texturePanoramic = texturePanoramic;
    this._texture = undefined;
    this._defer = Q.defer();

    this._textureRTT = {};
    this._cubemap = {};

};


PanoramaToCubeMap.prototype = osg.objectInherit( osg.Node.prototype, {

    getPromise: function () {
        return this._defer.promise;
    },

    getTexture: function () {
        return this._texture;
    },

    Environment: ( function () {

        var environmentGeometry = osg.createTexturedSphereGeometry( 100 / 2, 20, 20 ); // to use the same shader panorama
        environmentGeometry.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
        environmentGeometry.getOrCreateStateSet().setAttributeAndModes( new osg.Depth( 'DISABLE' ) );


        var Environment = function ( textureCubemap, cubemapTarget, level, size ) {
            this._level = level;
            this._size = size;
            this._cubemapTarget = cubemapTarget;
            this._textureCubemap = textureCubemap;
        };

        Environment.prototype = osg.objectInherit( environmentGeometry, {

            draw: function ( state ) {
                osg.Geometry.prototype.drawImplementation.call( this, state );
            },

            drawImplementation: function ( state ) {

                var gl = state.getGraphicContext();

                var textureID = this._textureCubemap.getTextureObject().id();

                for ( var i = 0; i < 6; i++ ) {
                    gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, this._textureTarget[ i ], textureID, 0 );
                    var status = gl.checkFramebufferStatus( gl.FRAMEBUFFER );
                    if ( status !== 0x8CD5 ) {
                        this._fbo._reportFrameBufferError( status );
                    }

                    //state.applyTextureAttribute( 0, this._textureSources[ i ] );

                    this.draw( state );
                }

                // draw as usual
                // this.draw( state );

                // then copy the current frame buffer to texture cubemap
                // var gl = state.getGraphicContext();

                // state.applyTextureAttribute( 1, this._textureCubemap );
                // gl.copyTexImage2D( this._cubemapTarget, this._level, gl.RGB, 0, 0, this._size, this._size, 0 );
            }
        } );

        return Environment;
    } )(),


    getOrCreateEnvironmentGeometry: function ( target, level, size ) {

        var Environment = this.Environment;
        return new Environment( this._texture, target, level, size );

    },

    getOrCreateEnvironment: function () {

        if ( !this._environmentNode ) {
            // create the environment sphere
            var size = 500;
            //var geom = osg.createTexturedBoxGeometry( 0, 0, 0, size, size, size );
            var geom = osg.createTexturedSphereGeometry( size / 2, 20, 20 ); // to use the same shader panorama
            geom.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
            geom.getOrCreateStateSet().setAttributeAndModes( new osg.Depth( 'DISABLE' ) );

            var mt = new osg.MatrixTransform();
            mt.addChild( geom );
            this._environmentNode = mt;
        }

        return this._environmentNode;
    },

    getOrCreateTextureCubeMap: function ( size ) {
        if ( !this._cubemap[ size ] ) {
            var cm = new osg.TextureCubeMap();
            cm.setTextureSize( size, size );
            cm.setType( 'FLOAT' );
            cm.setInternalFormat( 'RGB' );
            this._cubemap[ size ] = cm;
        }
        return this._cubemap[ size ];
    },

    getOrCreateTextureRTT: function ( size ) {
        if ( true || !this._textureRTT[ size ] ) {
            var t = new osg.Texture();
            t.setTextureSize( size, size );
            t.setType( 'FLOAT' );
            t.setMagFilter( 'NEAREST' );
            t.setMinFilter( 'NEAREST' );

            this._textureRTT[ size ] = t;
        }
        return this._textureRTT[ size ];
    },

    axis: [ {
        direction: [ 1, 0, 0 ],
        up: [ 0, 1, 0 ]
    }, {
        direction: [ -1, 0, 0 ],
        up: [ 0, 1, 0 ]
    }, {
        direction: [ 0, 1, 0 ],
        up: [ 0, 0, -1 ]
    }, {
        direction: [ 0, -1, 0 ],
        up: [ 0, 0, -1 ]
    }, {
        direction: [ 0, 0, 1 ],
        up: [ 0, 1, 0 ]
    }, {
        direction: [ 0, 0, -1 ],
        up: [ 0, 1, 0 ]
    } ],


    createGraphRenderToTexture: function ( index, level, size ) {

        var node = new osg.Node();
        var camera = new osg.Camera();

        var vp = new osg.Viewport( 0, 0, size, size );
        camera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
        camera.setViewport( vp );
        camera.setRenderOrder( osg.Camera.PRE_RENDER, 0 );
        camera.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, this._texture );

        var fov = (2.0 * Math.atan( size / ( size - 0.5 ) )) * 180.0/Math.PI;
        osg.Matrix.makePerspective( fov, 1.0, 0.1, 1000, camera.getProjectionMatrix() );
        osg.Matrix.makeLookAt( [ 0, 0, 0 ],
            this.axis[ index ].direction,
            this.axis[ index ].up,
            camera.getViewMatrix() );

        node.addChild( camera );
        camera.addChild( this.getOrCreateEnvironmentGeometry( osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X + index, level, size ) );

        return node;
    },

    init: function () {
        this._texture = this.getOrCreateTextureCubeMap( 512 );
        var maxLevel = 9;

        var node = new osg.Node();
        node.getOrCreateStateSet().setTextureAttributeAndModes( 0, this._texturePanoramic );
        node.getOrCreateStateSet().setAttributeAndModes( this.getOrCreateShader() );
        for ( var i = 0; i < 1; i++ ) {
            for ( var f = 0; f < 6; f++ ) {
                var rtt = this.createGraphRenderToTexture( f, i, Math.pow( 2, maxLevel - i ) );
                node.addChild( rtt );
            }
        }
        this.addChild( node );
    },

    getOrCreateShader: function () {

        if ( !this._shader ) {

            var shaderProcessor = new osgShader.ShaderProcessor();
            var vertexshader = shaderProcessor.getShader( 'panoramaToCubemapVertex.glsl' );
            var fragmentshader = shaderProcessor.getShader( 'panoramaToCubemapFragment.glsl' );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );
            this._shader = program;
        }

        return this._shader;
    }


} );





// convert rgbe texture list into a cubemap float
// we could make it more generic by giving parameter
// like input format ( rgbe / float ) and cubemap output
var TextureListRGBEToCubemapFloat = function ( textureSources, options ) {
    osg.Geometry.call( this );

    this._defer = Q.defer();
    var finalTexture = new osg.TextureCubeMap();

    this._width = textureSources[ 0 ].getImage().getWidth();
    this._height = textureSources[ 0 ].getImage().getHeight();

    var minFilter = options.minFilter || 'LINEAR'; // use mipamp if texture lod
    var textureType = options.textureType || 'FLOAT'; // or HALF_FLOAT

    finalTexture.setTextureSize( this._width, this._height );
    finalTexture.setType( textureType );
    finalTexture.setMinFilter( minFilter );
    finalTexture.setMagFilter( 'LINEAR' );
    this._textureCubemap = finalTexture;

    this._textureTarget = [
        osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_X,
        osg.Texture.TEXTURE_CUBE_MAP_NEGATIVE_X,
        osg.Texture.TEXTURE_CUBE_MAP_POSITIVE_Y,
        osg.Texture.TEXTURE_CUBE_MAP_NEGATIVE_Y,
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


    // new
    var camera = new osg.Camera();
    var vp = new osg.Viewport( 0, 0, w, h );
    camera.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
    camera.setViewport( vp );
    osg.Matrix.makeOrtho( -w / 2, w / 2, -h / 2, h / 2, -5, 5, camera.getProjectionMatrix() );
    camera.addChild( this );

    this.getPromise().then( function () {

        // auto remove it self
        camera.getParents()[ 0 ].removeChild( camera );

    }.bind( this ) );

    this._camera = camera;

    this.initStateSet();
};

TextureListRGBEToCubemapFloat.prototype = osg.objectInherit( osg.Geometry.prototype, {
    getTexture: function () {
        return this._textureCubemap;
    },
    getPromise: function () {
        return this._defer.promise;
    },
    getOperatorNode: function () {
        return this._camera;
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

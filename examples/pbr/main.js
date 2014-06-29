var Q = window.Q;
var OSG = window.OSG;
var Viewer;
var osg = OSG.osg;
var osgViewer = OSG.osgViewer;
var osgDB = OSG.osgDB;




var PBRExample = function () {

    this.referenceNbSamples = 256;


    this.textureEnvs = {
        'Alexs_Apartment': {
            'background': 'Alexs_Apt_2k.png',
            'specular': 'Alexs_Apt_2k.png',
            'diffuse': 'Alexs_Apt_Env.png'
        },

        'Walk_Of_Fame': {
            'specular': [ {
                'name': 'Mans_Outside_2k_1_0.png',
                'level': 0
            }, {
                'name': 'Mans_Outside_2k_2_1.png',
                'level': 1
            }, {
                'name': 'Mans_Outside_2k_4_2.png',
                'level': 2
            }, {
                'name': 'Mans_Outside_2k_8_3.png',
                'level': 3
            }, {
                'name': 'Mans_Outside_2k_16_4.png',
                'level': 4
            }, {
                'name': 'Mans_Outside_2k_32_5.png',
                'level': 5
            }, {
                'name': 'Mans_Outside_2k_64_6.png',
                'level': 6
            }, {
                'name': 'Mans_Outside_2k_128_7.png',
                'level': 7
            }, {
                'name': 'Mans_Outside_2k_256_8.png',
                'level': 8
            }, {
                'name': 'Mans_Outside_2k_512_9.png',
                'level': 9
            } ],
            'diffuse': 'Mans_Outside_Env.png',
            'background': 'Mans_Outside_2k.png'
        },

        'Arches_E_PineTree': {
            'specular': [ {
                'name': 'Arches_E_PineTree_3k_1_0.png',
                'level': 0
            }, {
                'name': 'Arches_E_PineTree_3k_2_1.png',
                'level': 1
            }, {
                'name': 'Arches_E_PineTree_3k_4_2.png',
                'level': 2
            }, {
                'name': 'Arches_E_PineTree_3k_8_3.png',
                'level': 3
            }, {
                'name': 'Arches_E_PineTree_3k_16_4.png',
                'level': 4
            }, {
                'name': 'Arches_E_PineTree_3k_32_5.png',
                'level': 5
            }, {
                'name': 'Arches_E_PineTree_3k_64_6.png',
                'level': 6
            }, {
                'name': 'Arches_E_PineTree_3k_128_7.png',
                'level': 7
            }, {
                'name': 'Arches_E_PineTree_3k_256_8.png',
                'level': 8
            }, {
                'name': 'Arches_E_PineTree_3k_512_9.png',
                'level': 9
            } ],
            'diffuse': 'Arches_E_PineTree_Env.png',
            'background': 'Arches_E_PineTree_3k.png'
        },

        'GrandCanyon_C_YumaPoint': {
            'specular': [ {
                'name': 'GCanyon_C_YumaPoint_3k_1_0.png',
                'level': 0
            }, {
                'name': 'GCanyon_C_YumaPoint_3k_2_1.png',
                'level': 1
            }, {
                'name': 'GCanyon_C_YumaPoint_3k_4_2.png',
                'level': 2
            }, {
                'name': 'GCanyon_C_YumaPoint_3k_8_3.png',
                'level': 3
            }, {
                'name': 'GCanyon_C_YumaPoint_3k_16_4.png',
                'level': 4
            }, {
                'name': 'GCanyon_C_YumaPoint_3k_32_5.png',
                'level': 5
            }, {
                'name': 'GCanyon_C_YumaPoint_3k_64_6.png',
                'level': 6
            }, {
                'name': 'GCanyon_C_YumaPoint_3k_128_7.png',
                'level': 7
            }, {
                'name': 'GCanyon_C_YumaPoint_3k_256_8.png',
                'level': 8
            }, {
                'name': 'GCanyon_C_YumaPoint_3k_512_9.png',
                'level': 9
            } ],
            'diffuse': 'GCanyon_C_YumaPoint_Env.png',
            'background': 'GCanyon_C_YumaPoint_3k.png'

        }

    };


    this.textureMipmapEnvs = {
        'integrateBRDF': 'integrateBRDF.png',
        'Alexs_Apartment': {
            'specular0': {
                'name': 'Alexs_Apt_2k_spec_rgbm_28.750336.png',
                'range': 28.750336
            },
            'specular': {
                'name': 'Alexs_Apt_2k_spec_rgbm_24.027901.png',
                'range': 24.027901
            },
            'background': {
                'name': 'Alexs_Apt_2k.png',
                'range': 30.0
            },
            'diffuse': {
                'name': 'Alexs_Apt_2k_diff_rgbm_0.098734.png',
                'range': 0.098734
            }
        }
    };

    this._viewer = undefined;

};

PBRExample.prototype = {

    // http://holger.dammertz.org/stuff/notes_HammersleyOnHemisphere.html
    computeHammersleyReverse: function ( a ) {
        a = ( a << 16 | a >>> 16 ) >>> 0;
        a = ( ( a & 1431655765 ) << 1 | ( a & 2863311530 ) >>> 1 ) >>> 0;
        a = ( ( a & 858993459 ) << 2 | ( a & 3435973836 ) >>> 2 ) >>> 0;
        a = ( ( a & 252645135 ) << 4 | ( a & 4042322160 ) >>> 4 ) >>> 0;
        return ( ( ( a & 16711935 ) << 8 | ( a & 4278255360 ) >>> 8 ) >>> 0 ) / 4294967296;
    },

    computeHammersleySequence: function ( size ) {
        this._hammersley = [];
        for ( var i = 0; i < size; i++ ) {
            var u = i / size;
            var v = this.computeHammersleyReverse( i );
            this._hammersley.push( u );
            this._hammersley.push( v );
        }
        console.log( this._hammersley );
        return this._hammersley;
    },


    getModel: function ( url, callback ) {
        var self = this;

        var removeLoading = function ( node, child ) {

            this._nbLoading -= 1;
            this._loaded.push( child );

            if ( this._nbLoading === 0 ) {
                document.getElementById( 'loading' ).style.display = 'None';
                this._viewer.getManipulator().computeHomePosition();
            }

        }.bind( this );

        var addLoading = function () {

            if ( !this._nbLoading ) this._nbLoading = 0;
            if ( !this._loaded ) this._loaded = [];

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
                            node.addChild( child );
                            removeLoading( node, child );
                            osg.log( 'success ' + url );

                            var cbPromise = true;
                            if ( cbfunc ) {
                                cbPromise = cbfunc.call( this, child );
                            }

                            Q( cbPromise ).then( function () {
                                defer.resolve( node );
                            } );


                        }.bind( this ) ).fail( function ( error ) {

                            defer.reject( error );

                        } );

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

        return loadModel( url, callback );
    },

    readImageURL: function ( url, options ) {
        var ext = url.split( '.' ).pop();
        if ( ext === 'hdr' )
            return osgDB.readImageHDR( url, options );

        return osgDB.readImageURL.call( this, url, options );
    },

    setEnvironment: function ( name, background, ground ) {

        var environmentConfig = this.textureEnvs[ name ];
        var environmentName = name;
        var self = this;



        var startUnit = 5;

        var reference = function () {

            var setNameTextureUnit = function ( stateSet, name, unit, w, h ) {
                stateSet.addUniform( osg.Uniform.createInt1( unit, name ) );
                if ( w !== undefined )
                    stateSet.addUniform( osg.Uniform.createFloat2( [ w, h ], name + 'Size' ) );
            };

            var createEnvironmnentTexture = function ( name, image, stateSet, unit ) {
                var texture = new osg.Texture();
                if ( image )
                    texture.setImage( image );
                texture.setMinFilter( 'NEAREST' );
                texture.setMagFilter( 'NEAREST' );
                texture.setWrapT( 'CLAMP_TO_EDGE' );
                texture.setWrapS( 'REPEAT' );

                stateSet.setTextureAttributeAndMode( startUnit, texture );
                var width = image ? image.getWidth() : 0;
                var height = image ? image.getHeight() : 0;

                if ( image )
                    setNameTextureUnit( stateSet, name, startUnit, width, height );

                startUnit += 1;
                return texture;
            };


            var images = [
                self.readImageURL( 'textures/' + name + '/' + environmentConfig.background ),
                self.readImageURL( 'textures/' + name + '/' + environmentConfig.diffuse ),
                self.readImageURL( 'textures/' + name + '/' + environmentConfig.specular )
            ];

            Q.all( images ).then( function ( images ) {
                createEnvironmnentTexture( 'envSpecular', images[ 2 ], ground.getOrCreateStateSet(), 6 );
                createEnvironmnentTexture( 'envBackground', images[ 0 ], background.getOrCreateStateSet(), 2 );
                createEnvironmnentTexture( 'envDiffuse', images[ 1 ], ground.getOrCreateStateSet(), 5 );

            } );
        };

        var mipmap = function () {
            var config = self.textureMipmapEnvs[ name ];
            var mipmapTexture = [
                self.readImageURL( 'textures/' + name + '/' + config.background.name ),
                self.readImageURL( 'textures/' + name + '/' + config.diffuse.name ),
                self.readImageURL( 'textures/' + name + '/' + config.specular.name ),
                self.readImageURL( 'textures/' + self.textureMipmapEnvs.integrateBRDF )
            ];


            var setNameTextureUnit = function ( stateSet, name, unit, w, h, range ) {
                stateSet.addUniform( osg.Uniform.createInt1( unit, name ) );
                stateSet.addUniform( osg.Uniform.createFloat2( [ w, h ], name + 'Size' ) );
                stateSet.addUniform( osg.Uniform.createFloat1( range, name + 'Range' ) );
            };

            var createEnvironmnentTexture = function ( name, image, stateSet, unit, range ) {
                var texture = new osg.Texture();
                if ( image )
                    texture.setImage( image );
                texture.setMinFilter( 'NEAREST' );
                texture.setMagFilter( 'NEAREST' );

                stateSet.setTextureAttributeAndMode( startUnit, texture );
                var width = image ? image.getWidth() : 0;
                var height = image ? image.getHeight() : 0;

                if ( image )
                    setNameTextureUnit( stateSet, name, startUnit, width, height, range );
                startUnit += 1;
                return texture;
            };


            Q.all( mipmapTexture ).then( function ( images ) {
                createEnvironmnentTexture( 'envBackgroundRGBM', images[ 0 ], background.getOrCreateStateSet(), 2, config.background.range );
                createEnvironmnentTexture( 'envDiffuseRGBM', images[ 1 ], ground.getOrCreateStateSet(), 5, config.diffuse.range );
                createEnvironmnentTexture( 'envSpecularRGBM', images[ 2 ], ground.getOrCreateStateSet(), 6, config.specular.range );
                createEnvironmnentTexture( 'integrateBRDF', images[ 3 ], ground.getOrCreateStateSet(), 7 );

            } );
        };

        mipmap();
        reference();
    },


    getTextureEnvFunctions: function () {

        return [
            'float TextureLevel = 0.0;',
            '#define DefaultGamma 2.4',

            '#ifdef BIAS',
            'float getBias( vec2 size, vec2 uv, float lod ) {',
            '  vec2  dx        = dFdx(uv) * size[0];',
            '  vec2  dy        = dFdy(uv) * size[1];',
            '  float  dotx        = dot(dx, dx);',
            '  float  doty        = dot(dy, dy);',
            '  float delta_max_sqr = dotx + doty;  ',
            '  float current_lod = 0.5 * log2(0.5*delta_max_sqr);   ',
            '  float new_bias = lod - current_lod;',
            '  return new_bias;',
            '}',
            '#endif',
            '',
            '',
            'float srgb_to_linearrgb1(const in float c, const in float gamma)',
            '{',
            '    float v = 0.0;',
            '    if ( c < 0.04045 ) {',
            '        if ( c >= 0.0 )',
            '            v = c * ( 1.0 / 12.92 );',
            '    } else {',
            '        v = pow( ( c + 0.055 ) * ( 1.0 / 1.055 ), gamma );',
            '    }',
            '    return v;',
            '}',
            'vec4 srgb2linearrgb_vec4(const in vec4 col_from)',
            '{',
            '    vec4 col_to;',
            '    col_to.r = srgb_to_linearrgb1(col_from.r, DefaultGamma);',
            '    col_to.g = srgb_to_linearrgb1(col_from.g, DefaultGamma);',
            '    col_to.b = srgb_to_linearrgb1(col_from.b, DefaultGamma);',
            '    col_to.a = col_from.a;',
            '    return col_to;',
            '}',
            'vec3 srgb2linearrgb_vec3(const in vec3 col_from)',
            '{',
            '    vec3 col_to;',
            '    col_to.r = srgb_to_linearrgb1(col_from.r, DefaultGamma);',
            '    col_to.g = srgb_to_linearrgb1(col_from.g, DefaultGamma);',
            '    col_to.b = srgb_to_linearrgb1(col_from.b, DefaultGamma);',
            '    return col_to;',
            '}',
            'float linearrgb_to_srgb1(const in float c, const in float gamma)',
            '{',
            '    float v = 0.0;',
            '    if(c < 0.0031308) {',
            '        if ( c > 0.0)',
            '            v = c * 12.92;',
            '    } else {',
            '        v = 1.055 * pow(c, 1.0/ gamma) - 0.055;',
            '    }',
            '    return v;',
            '}',
            '',
            '// coding style should be camel case except for acronyme like SRGB or HDR',
            'vec4 linearTosRGB(const in vec4 col_from, const in float gamma)',
            '{',
            '    vec4 col_to;',
            '    col_to.r = linearrgb_to_srgb1(col_from.r, gamma);',
            '    col_to.g = linearrgb_to_srgb1(col_from.g, gamma);',
            '    col_to.b = linearrgb_to_srgb1(col_from.b, gamma);',
            '    col_to.a = col_from.a;',
            '    return col_to;',
            '}',

            'vec3 linearTosRGB(const in vec3 col_from, const in float gamma)',
            '{',
            '    vec3 col_to;',
            '    col_to.r = linearrgb_to_srgb1(col_from.r, gamma);',
            '    col_to.g = linearrgb_to_srgb1(col_from.g, gamma);',
            '    col_to.b = linearrgb_to_srgb1(col_from.b, gamma);',
            '    return col_to;',
            '}',
            '',
            'float sRGBToLinear(const in float c, const in float gamma)',
            '{',
            '    float v = 0.0;',
            '    if ( c < 0.04045 ) {',
            '        if ( c >= 0.0 )',
            '            v = c * ( 1.0 / 12.92 );',
            '    } else {',
            '        v = pow( ( c + 0.055 ) * ( 1.0 / 1.055 ), gamma );',
            '    }',
            '    return v;',
            '}',
            'vec4 sRGBToLinear(const in vec4 col_from, const in float gamma)',
            '{',
            '    vec4 col_to;',
            '    col_to.r = sRGBToLinear(col_from.r, gamma);',
            '    col_to.g = sRGBToLinear(col_from.g, gamma);',
            '    col_to.b = sRGBToLinear(col_from.b, gamma);',
            '    col_to.a = col_from.a;',
            '    return col_to;',
            '}',
            'vec3 sRGBToLinear(const in vec3 col_from, const in float gamma)',
            '{',
            '    vec3 col_to;',
            '    col_to.r = sRGBToLinear(col_from.r, gamma);',
            '    col_to.g = sRGBToLinear(col_from.g, gamma);',
            '    col_to.b = sRGBToLinear(col_from.b, gamma);',
            '    return col_to;',
            '}',

            'vec4 textureRGBE(const in sampler2D texture, const in vec2 size, const in vec2 uv) {',
            '    #ifdef BIAS',
            '       vec4 rgbe = texture2D(texture, uv, getBias( size, uv, TextureLevel );',
            '    #else',
            '       vec4 rgbe = texture2D(texture, uv );',
            '    #endif',

            '    float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));',
            '    return vec4(rgbe.rgb * 255.0 * f, 1.0);',
            '}',

            'vec4 textureRGBM(const in sampler2D texture, const in vec2 uv ) {',
            '    vec4 rgbm = texture2D(texture, uv );',
            '    return vec4(rgbm.rgb * rgbm.a, 1.0);',
            '}',


            'vec2 normalToPanoramaUV( const in vec3 dir )',
            '{',
            'float n = length(dir.xz);',
            'vec2 pos = vec2( (n>0.0000001) ? dir.x / n : 0.0, dir.y);',
            'pos = acos(pos)*InversePI;',
            'pos.x = (dir.z > 0.0) ? pos.x*0.5 : 0.9999999-(pos.x*0.5);',
            '//pos.y = 1.0-pos.y;',
            'return pos;',
            '}',

            'vec2 normalToSphericalUV( const in vec3 n )',
            '{',
            '    return normalToPanoramaUV( n );',
            '    float EPS = 1e-5;',
            '',
            '    // acos is defined [ -1: 1 ]',
            '    // atan( x , y ) require to have |y| > 0',
            '',
            '    // when n.y is amlost 1.0 it means that the normal is aligned on axis y',
            '    // so instead of fixing numerical issue we can directly return the supposed',
            '    // uv value',
            '    if ( n.y > (1.0-EPS) ) {',
            '        return vec2( 0.5, 0.0);',
            '    } else if ( n.y < -(1.0-EPS) ) {',
            '        return vec2( 0.5, 1.0-EPS);',
            '    }',
            '',
            '    float yaw = acos(n.y) / PI;',
            '    float pitch;',
            '    float y = n.z;',
            '    if ( abs( y ) < EPS )',
            '        y = EPS;',
            '    pitch = ( atan(n.x, y) + PI) / (2.0 * PI);',
            '',
            '    return vec2( pitch, yaw );',
            '}',


            'void mtex_nspace_tangent(const in vec4 tangent, const in vec3 normal, const in vec3 texnormal, out vec3 outnormal)',
            '{',
            '    vec3 tang = vec3(0.0,1.0,0.0);',
            '    if (length(tangent.xyz) != 0.0) {',
            '        tang = normalize(tangent.xyz);',
            '    }',
            '    vec3 B = tangent.w * cross(normal, tang);',
            '    outnormal = texnormal.x*tang + texnormal.y*B + texnormal.z*normal;',
            '    outnormal = normalize(outnormal);',
            '}',

            '',
            'vec3 textureNormal(in sampler2D texture, const in vec2 uv) {',
            '    vec3 rgb = texture2D(texture, uv).rgb;',
            '    return normalize((2.0*rgb-vec3(1.0)));',
            '}',

            'vec4 textureRGBMLinear(const in sampler2D texture, const in vec2 size, const in vec2 uv ) {',
            '    vec2 t = 1.0 / size;',
            '    ',

            '    vec4 a = textureRGBM(texture, uv ),',
            '         b = textureRGBM(texture, uv + vec2(t.x, 0.0) ),',
            '         c = textureRGBM(texture, uv + vec2(0.0, t.y) ),',
            '         d = textureRGBM(texture, uv + vec2(t.x, t.y) );',
            '    vec2 f = fract(uv * size);',
            '    vec4 A = mix(a, b, f.x),',
            '         B = mix(c, d, f.x);',
            '    return mix(A, B, f.y);',
            '}',

            'vec4 textureRGBMLinearSpecular(const in sampler2D texture, const in vec2 size, const in vec2 uv, const in vec2 maxBox ) {',
            '    vec2 t = 1.0 / size;',

            '    ',
            '    float maxX = mod(uv.x+t.x, maxBox.x);',
            '    float maxY = min(uv.y+t.y, maxBox.y-t.y);', // clamp to one pixel before

            '    vec4 a = textureRGBM(texture, uv ),',
            '         b = textureRGBM(texture, vec2( maxX, uv.y) ),',
            '         c = textureRGBM(texture, vec2( uv.x, maxY) ),',
            '         d = textureRGBM(texture, vec2( maxX, maxY) );',
            '    vec2 f = fract(uv * size);',
            '    vec4 A = mix(a, b, f.x),',
            '         B = mix(c, d, f.x);',
            '    return mix(A, B, f.y);',
            '}',

            'vec4 textureRGBELinear(const in sampler2D texture, const in vec2 size, const in vec2 uv) {',
            '    vec2 t = 1.0 / size;',
            '    ',
            '    vec4 a = textureRGBE(texture,  size, uv ),',
            '         b = textureRGBE(texture,  size, uv + vec2(t.x, 0.0) ),',
            '         c = textureRGBE(texture,  size, uv + vec2(0.0, t.y) ),',
            '         d = textureRGBE(texture,  size, uv + vec2(t.x, t.y) );',

            '    vec2 f = fract(uv * size);',
            '    vec4 A = mix(a, b, f.x),',
            '        B = mix(c, d, f.x);',
            '    return mix(A, B, f.y);',
            '}',
            '',
            'vec3 textureSpheremapRGBE(const in sampler2D texture, const in vec2 size, const in vec3 normal) {',
            '    vec2 uv = normalToSphericalUV( normal );',
            '    return textureRGBELinear(texture, size, uv.xy ).rgb;',
            '}',

            'vec3 textureSpheremapRGBM(const in sampler2D texture, const in vec2 size, const in vec3 normal, const in float textureRange) {',
            '    vec2 uv = normalToSphericalUV( normal );',
            '    return textureRGBMLinear(texture, size, uv.xy ).rgb * textureRange;',
            '}',


            'vec2 texturePrecomputedBRDF( const in float roughness, const in float nov ) {',
            '    vec4 rgba = texture2D(integrateBRDF, vec2( roughness, nov ) );',
            '    const float div = 1.0/65535.0;',
            '    float b = (rgba[3] * 65280.0 + rgba[2] * 255.0);',
            '    float a = (rgba[1] * 65280.0 + rgba[0] * 255.0);',
            '    return vec2( a, b ) * div;',
            '}',

            'vec4 computeUVForMipmap( const in float level, const in vec2 uv, const in vec2 size ) {',
            '    // our texture is square, so each level is width x height/2',
            '    float u = uv[0];',
            '    float v = uv[1];',
            '    float height = pow( 2.0, level );',
            '    float heightInTextureSpace = height/size.y;', // rescale to the size of the mipmap level
            '    float maxU = 2.0 * heightInTextureSpace;',
            '    float maxV = maxU;',
            '    u *= maxU;',
            '    v *= maxU;',
            '    v += heightInTextureSpace;',

            '    return vec4( u, v , maxU, maxV );',
            '}',

            'vec3 texturePrefilteredSpecular( const in float roughness, const in vec3 direction ) {',

            '   vec2 virtualUV = normalToSphericalUV( direction );',
            '   virtualUV.y*=0.5;',

            '   // uv are virtual to a real panoramic texture 2x1',
            '   // we have mipmap encoding in the same texture',
            '',
            '   float minimumLod = 1.0;', // because lower level are too low res
            '   float nbMipMap = log2( envSpecularRGBMSize.y/2.0 );',
            '   float targetLod = (1.0-roughness) * nbMipMap;',
            '   targetLod = max( targetLod, minimumLod );',
            '   float highLod = ceil(targetLod);',
            '   float lowLod = floor(targetLod);',
            '   ',

            '   vec2 size = envSpecularRGBMSize;',
            '   float range = envSpecularRGBMRange;',

            '   vec4 uv0Max = computeUVForMipmap( lowLod, virtualUV, size );',

            '   vec3 texel0 = textureRGBMLinearSpecular( envSpecularRGBM, size, uv0Max.xy, uv0Max.zw).rgb;',
            '   //texel0 = textureRGBM(envSpecularRGBM, uv0 ).rgb * range;',
            '   //return texel0;',

            '   vec4 uv1Max = computeUVForMipmap( highLod, virtualUV, size );',
            '   vec3 texel1 = textureRGBMLinearSpecular( envSpecularRGBM, size, uv1Max.xy, uv1Max.zw ).rgb;',

            '   return mix( texel0, texel1, fract( targetLod ) );',
            '}',


        ].join( '\n' );
    },

    getCommonShader: function () {
        return [
            '#define PI 3.1415926535897932384626433832795',
            '#define InversePI 1.0/PI',

            // unreal pregenerated texture

            'uniform sampler2D integrateBRDF;',
            'uniform sampler2D integrateBRDFSize;',

            'uniform sampler2D envSpecularRGBM;',
            'uniform vec2 envSpecularRGBMSize;',
            'uniform float envSpecularRGBMRange;',

            'uniform sampler2D envDiffuseRGBM;',
            'uniform float envDiffuseRGBMRange;',
            'uniform vec2 envDiffuseRGBMSize;',

            // reference

            'uniform sampler2D envBackground;',
            'uniform vec2 envBackgroundSize;',

            'uniform sampler2D envSpecular;',
            'uniform sampler2D envDiffuse;',
            'uniform vec2 envSpecularSize;',
            'uniform vec2 envDiffuseSize;',


        ].join( '\n' );
    },

    getShader: function ( config, reference ) {
        if ( !config ) config = {};

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

            'varying vec3 osg_FragEye;',
            'varying vec3 osg_FragNormal;',
            'varying vec4 osg_FragTangent;',
            'varying vec3 osg_FragLightDirection;',
            'varying vec2 osg_FragTexCoord0;',

            'void main(void) {',
            '  osg_FragEye = vec3(ModelViewMatrix * vec4(Vertex, 1.0));',
            '  osg_FragNormal = vec3(NormalMatrix * vec4(Normal, 0.0));',
            '  osg_FragLightDirection = vec3(NormalMatrix * vec4(0.0, -1.0, 0.0, 1.0));',
            '  osg_FragTangent = NormalMatrix * osg_FragTangent;',
            '  osg_FragTexCoord0 = TexCoord0;',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
            '}'
        ].join( '\n' );

        var ambientOcclusion = '';
        if ( config.mapAmbientOcclusion )
            ambientOcclusion = '#define AO';

        var specular = '';
        if ( config.mapSpecular )
            specular = '#define SPECULAR';

        var glossiness = '';
        if ( config.mapGlossiness )
            glossiness = '#define GLOSSINESS';

        var normalmap = '';
        if ( config.mapNormal )
            normalmap = '#define NORMAL';

        var fragmentshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',

            this.getCommonShader(),
            ambientOcclusion,
            specular,
            glossiness,
            normalmap,

            '#define NB_SAMPLES ' + this.referenceNbSamples,


            'uniform sampler2D albedoMap;',
            'uniform sampler2D roughnessMap;',
            'uniform sampler2D metallicMap;',
            'uniform sampler2D normalMap;',
            'uniform sampler2D specularMap;',
            'uniform sampler2D aoMap;',

            'uniform int prefilterCubemap;',

            '#if ' + reference.toString(),
            'uniform vec2 hammersley[NB_SAMPLES];',
            '#endif',

            'uniform float hdrExposure;',
            'uniform mat4 CubemapTransform;',

            '#ifdef GL_OES_standard_derivatives',
            '#extension GL_OES_standard_derivatives : enable',
            '#endif',

            'varying vec3 osg_FragEye;',
            'varying vec3 osg_FragNormal;',
            'varying vec3 osg_FragLightDirection;',
            'varying vec2 osg_FragTexCoord0;',
            'varying vec4 osg_FragTangent;',

            'float gamma = 2.2;',

            'float MaterialRoughness = 0.99;',
            'vec3 MaterialSpecular = vec3(0.04);',
            'vec3 MaterialAlbedo;',
            'vec3 MaterialNormal;',
            'vec3 MaterialAO;',


            'vec3 fresnel( float vdh, vec3 F0 ) {',
            '// Schlick with Spherical Gaussian approximation',
            '// cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3',
            '    float sphg = pow(2.0, (-5.55473*vdh - 6.98316) * vdh);',
            '    return F0 + (vec3(1.0 ) - F0) * sphg;',
            '}',

            '#if ' + reference.toString(),

            '// A,B,C are ',
            'vec3 importanceSampleGGX(vec2 Xi, vec3 tangentX, vec3 tangentY, vec3 normal, float roughness)',
            '{',
            '	float a = roughness*roughness;',

            '	float cosT = sqrt( ( 1.0 - Xi.y ) / ( 1.0 + ( a * a - 1.0 ) * Xi.y ) );',
            '	float sinT = sqrt( 1.0 - cosT * cosT );',
            '	float phi = 2.0 * PI * Xi.x;',

            '   vec3 h;',
            '   h.x = sinT * cos( phi );',
            '   h.y = sinT * sin( phi );',
            '   h.z = cosT;',
            '	return tangentX * h.x + tangentY * h.y + normal * h.z;',
            '}',


            'float geometrySmithSchlickGGX(float alpha, float NdV, float NdL)',
            '{',
            '    float k = alpha*alpha * 0.5;',
            '    float one_minus_k = 1.0 -k;',
            '    float GV = NdV / (NdV * one_minus_k + k);',
            '    float GL = NdL / (NdL * one_minus_k + k);',
            '    return GV * GL;',
            '}',
            '#endif',

            '',


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

            this.getTextureEnvFunctions(),

            // apply some gamma correction (http://www.geeks3d.com/20101001/tutorial-gamma-correction-a-story-of-linearity/)
            'vec3 linear2sRGB ( vec3 color ) {',
            '  return pow( color , 1.0/ vec3( gamma ) );',
            '}',

            'vec3 lightDiffuseIndirect( mat3 iblTransform, vec3 albedo, vec3 normal ) {',
            '   vec3 lightDiffuse = hdrExposure * textureSpheremapRGBE(envDiffuse, envDiffuseSize, iblTransform*normal);',
            '   return lightDiffuse * albedo;',
            '}',

            'vec3 lightDiffuseIndirect2( const in mat3 iblTransform, const in vec3 albedo, const in vec3 normal ) {',
            '   vec3 lightDiffuse = hdrExposure * textureSpheremapRGBM(envDiffuseRGBM, envDiffuseRGBMSize, iblTransform*normal, envDiffuseRGBMRange );',
            '   return lightDiffuse * albedo;',
            '}',

            'mat3 getIBLTransfrom( mat4 transform ) {',
            '  vec3 x = vec3(transform[0][0], transform[1][0], transform[2][0]);',
            '  vec3 y = vec3(transform[0][1], transform[1][1], transform[2][1]);',
            '  vec3 z = vec3(transform[0][2], transform[1][2], transform[2][2]);',
            '  mat3 m = mat3(x,y,z);',
            '  return m;',
            '}',

            '#if ' + reference.toString(),
            'vec3 lightSpecularIndirect( const in mat3 iblTransform, const in vec3 albedo, const in vec3 normal, const in vec3 view ) {',

            '',
            '   //vectors used for importance sampling',
            '   vec3 upVector = abs(normal.z) < 0.999 ? vec3(0.0,0.0,1.0) : vec3(1.0,0.0,0.0);',
            '   vec3 tangentX = normalize( cross( upVector, normal ) );',
            '   vec3 tangentY = cross( normal, tangentX );',

            '   float ndv = max( 0.0, dot(normal, view) );',

            '   vec3 specularLighting = vec3(0.0);',

            '   for ( int i = 0; i < NB_SAMPLES; i++ ) {',

            '      vec2 xi = hammersley[i];',
            '      vec3 h = importanceSampleGGX( xi, tangentX, tangentY, normal, MaterialRoughness );',
            '      vec3 l = 2.0 * dot( view, h ) * h - view;',
            '      float ndl =  max( 0.0, dot( normal, l ) );',
            '      float ndh =  max( 0.0, dot( normal, h ) );',
            '      float vdh = max( 0.0, dot( view  , h ) );',


            '      if ( ndl > 0.0 ) {',
            '         vec3 color = hdrExposure * textureSpheremapRGBE( envSpecular, envSpecularSize, iblTransform * l );',
            '         float G = geometrySmithSchlickGGX( MaterialRoughness, ndv, ndl );',
            '         float Fc = pow( 1.0 - vdh, 5.0 );',
            '         vec3 F = (1.0 - Fc) * MaterialSpecular + Fc;',
            // Incident light = color * ndl
            // Microfacet specular = D*G*F / (4*ndl*ndv)
            // pdf = D * ndh / (4 * vdh)
            '         specularLighting += color * F * G * vdh / (ndh * ndv);',
            '      }',

            '   }',
            '   return specularLighting / float(NB_SAMPLES);',
            '}',
            '#endif',


            'vec3 lightSpecularIndirect2( const in mat3 iblTransform, const in vec3 albedo, const in vec3 normal, const in vec3 view ) {',
            '  float NoV = min( 0.0, dot( normal, view ) );',
            '  vec3 R = 2.0 * dot( view, normal ) * normal - view;',
            '  float mult = envSpecularRGBMRange * hdrExposure;',
            '  vec3 prefilteredColor = texturePrefilteredSpecular( MaterialRoughness, iblTransform * R )* mult;',
            '  vec2 envBRDF = texturePrecomputedBRDF( MaterialRoughness, NoV );',
            '  return prefilteredColor * ( MaterialSpecular * envBRDF.x + envBRDF.y );',
            '',
            '}',


            '#if ' + reference.toString(),
            'vec3 reference( const in mat3 iblTransform, const in vec3 E ) {',
            '  vec3 diffuseIndirect = MaterialAO * lightDiffuseIndirect( iblTransform, MaterialAlbedo, MaterialNormal );',
            '  vec3 specularIndirect = lightSpecularIndirect( iblTransform, MaterialAlbedo, MaterialNormal, -E );',
            '  vec3 gammaCorrected = linearTosRGB( diffuseIndirect + specularIndirect, DefaultGamma);',
            '  return gammaCorrected;',
            '}',
            '#endif',


            'vec3 prefilteredAndLUT( const in mat3 iblTransform, const in vec3 E ) {',
            '  vec3 diffuseIndirect = MaterialAO * lightDiffuseIndirect( iblTransform, MaterialAlbedo, MaterialNormal );',
            '  vec3 specularIndirect = lightSpecularIndirect2( iblTransform, MaterialAlbedo, MaterialNormal, -E );',
            '  vec3 gammaCorrected = linearTosRGB( diffuseIndirect + specularIndirect, DefaultGamma);',
            '  return gammaCorrected;',
            '}',

            'void main(void) {',
            '  vec3 N = normalize(osg_FragNormal);',
            '  vec3 L = normalize(osg_FragLightDirection);',
            '  vec3 E = normalize(osg_FragEye);',
            '  vec3 R = cubemapReflectionVector(CubemapTransform, E, N);',

            '  mat3 iblTransform = getIBLTransfrom( CubemapTransform );',

            '  const vec3 dielectricColor = vec3(0.04);',
            '  float minRoughness = 1.e-4;',


            '  vec3 albedo = sRGBToLinear( texture2D( albedoMap, osg_FragTexCoord0 ).rgb, DefaultGamma );',

            '  vec3 normal = N;',
            '  #ifdef NORMAL',
            '    mtex_nspace_tangent( osg_FragTangent, N, textureNormal( normalMap, osg_FragTexCoord0 ), normal );',
            '  #endif',


            '  float roughnessValue = texture2D( roughnessMap, osg_FragTexCoord0 ).r;',
            '  #ifdef GLOSSINESS',
            '  roughnessValue = 1.0 - roughnessValue;',
            '  #endif',
            '  MaterialRoughness = max( minRoughness , roughnessValue );',

            '  MaterialNormal = normal;',
            '  MaterialAlbedo = albedo;',
            '  MaterialAO = vec3(1.0);',
            '#ifdef AO',
            ' MaterialAO = sRGBToLinear( texture2D( aoMap, osg_FragTexCoord0 ), DefaultGamma ).rgb;',
            '#endif',

            '#ifdef SPECULAR',
            '  MaterialSpecular = sRGBToLinear( texture2D( specularMap, osg_FragTexCoord0 ), DefaultGamma ).rgb;',
            '#else',
            '  float metallic = texture2D( metallicMap, osg_FragTexCoord0 ).r;',
            '  MaterialAlbedo = albedo * (1.0 - metallic);',
            '  MaterialSpecular = mix( dielectricColor, albedo, metallic);',
            '#endif',

            '#if 0',
            '  vec3 diffuseIndirect = MaterialAO * lightDiffuseIndirect( iblTransform, MaterialAlbedo, MaterialNormal );',
            '  vec3 specularIndirect = lightSpecularIndirect( iblTransform, MaterialAlbedo, MaterialNormal, -E );',
            '#endif',

            'vec4 result;',
            '#if ' + reference.toString(),
            '  result = vec4( reference( iblTransform, E ), 1.0);',
            '#else',
            '  result = vec4( prefilteredAndLUT( iblTransform, E ), 1.0);',
            '#endif',

            '  gl_FragColor = result;',
            '}',
            ''
        ].join( '\n' );

        var program = new osg.Program(
            new osg.Shader( 'VERTEX_SHADER', vertexshader ),
            new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

        return program;
    },




    getShaderEarlyZ: function () {

        var vertexshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',

            'attribute vec3 Vertex;',

            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',

            'void main(void) {',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
            '}'
        ].join( '\n' );

        var fragmentshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',

            'void main(void) {',
            '  gl_FragColor = vec4(1.0,0.0,1.0,1.0);',
            '}',
            ''
        ].join( '\n' );

        var program = new osg.Program(
            new osg.Shader( 'VERTEX_SHADER', vertexshader ),
            new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

        return program;
    },


    installShaderOnNodes: function ( model, config ) {
        var reference = this.getShader( config, 1 );
        var prefiltered = this.getShader( config, 0 );

        model.setShaderReference = function () {
            this.getOrCreateStateSet().setAttributeAndModes( reference );
        };
        model.setShaderPrefiltered = function () {
            this.getOrCreateStateSet().setAttributeAndModes( prefiltered );
        };
        model.setShaderPrefiltered();
    },

    loadDefaultModel: function () {

        var self = this;

        var callbackModel = function ( model ) {

            var defer = Q.defer();

            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );

            var promises = [];
            promises.push( self.readImageURL( 'model/Cerberus_by_Andrew_Maximov/Textures/Cerberus_A.tga.png' ) );
            promises.push( self.readImageURL( 'model/Cerberus_by_Andrew_Maximov/Textures/Cerberus_R.tga.png' ) );

            promises.push( self.readImageURL( 'model/Cerberus_by_Andrew_Maximov/Textures/Cerberus_N.tga.png' ) );
            promises.push( self.readImageURL( 'model/Cerberus_by_Andrew_Maximov/Textures/Cerberus_M.tga.png' ) );

            var createTexture = function ( image ) {
                var texture = new osg.Texture();
                texture.setImage( image );
                return texture;
            };

            Q.all( promises ).then( function ( args ) {
                args.forEach( function ( image, index ) {
                    model.getOrCreateStateSet().setTextureAttributeAndMode( index, createTexture( args[ index ] ) );
                } );

                self.installShaderOnNodes( model, {
                    mapNormal: true
                } );

                defer.resolve( model );
            } );

            return defer.promise;
        };

        return this.getModel( 'model/Cerberus_by_Andrew_Maximov.osgjs', callbackModel );
    },



    loadRobotModel: function () {

        var self = this;

        var callbackModel = function ( model ) {

            var defer = Q.defer();

            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 4, 'aoMap' ) );

            var promises = [];
            promises.push( self.readImageURL( 'robot/Textures/map_A.jpg' ) );
            promises.push( self.readImageURL( 'robot/Textures/map_R.jpg' ) );

            promises.push( self.readImageURL( 'robot/Textures/map_N.jpg' ) );
            promises.push( self.readImageURL( 'robot/Textures/map_S.jpg' ) );
            promises.push( self.readImageURL( 'robot/Textures/map_AO.jpg' ) );

            var createTexture = function ( image ) {
                var texture = new osg.Texture();
                texture.setImage( image );
                return texture;
            };

            Q.all( promises ).then( function ( args ) {
                args.forEach( function ( image, index ) {
                    model.getOrCreateStateSet().setTextureAttributeAndMode( index, createTexture( args[ index ] ) );
                } );

                var config = {
                    mapSpecular: true,
                    mapAmbientOcclusion: true,
                    mapGlossiness: true,
                    mapNormal: true
                };

                self.installShaderOnNodes( model, config );
                model.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
                defer.resolve( model );
            } );

            return defer.promise;
        };

        var model = this.getModel( 'robot/Junkbot.osgjs', callbackModel );
        Q( model ).then( function ( node ) {
            osg.Matrix.makeIdentity( node.getMatrix() );
        } );
        return model;

    },


    loadCarModel: function () {

        var self = this;

        var callbackModel = function ( model ) {

            var defer = Q.defer();

            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 4, 'aoMap' ) );

            var promises = [];
            promises.push( self.readImageURL( 'hotrod/hotrod_diffuse.png' ) );
            promises.push( self.readImageURL( 'hotrod/hotrod_glossiness.png' ) );

            promises.push( self.readImageURL( 'hotrod/hotrod_normal.png' ) );
            promises.push( self.readImageURL( 'hotrod/hotrod_specular.png' ) );
            promises.push( self.readImageURL( 'hotrod/hotrod_ao.png' ) );

            var createTexture = function ( image ) {
                var texture = new osg.Texture();
                texture.setImage( image );
                return texture;
            };

            Q.all( promises ).then( function ( args ) {
                args.forEach( function ( image, index ) {
                    var texture = createTexture( args[ index ] );
                    texture.setWrapS( 'REPEAT' );
                    texture.setWrapT( 'REPEAT' );
                    model.getOrCreateStateSet().setTextureAttributeAndMode( index, texture );
                } );


                var config = {
                    mapSpecular: true,
                    mapAmbientOcclusion: true,
                    mapGlossiness: false,
                    mapNormal: true
                };

                self.installShaderOnNodes( model, config );
                model.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
                defer.resolve( model );
            } );

            return defer.promise;
        };

        var model = this.getModel( 'hotrod/hotrod.osgjs', callbackModel );
        Q( model ).then( function ( node ) {
            //osg.Matrix.makeIdentity( node.getMatrix() );
        } );
        return model;

    },

    loadTemplateScene: function () {

        var self = this;

        var nbMaterials = 8;

        var createConfig = function ( albedo, specular ) {

            var config = [];
            for ( var i = 0; i < nbMaterials; i++ ) {
                config[ i ] = config[ i ] || {};
                var material = config[ i ];

                material.roughness = i / nbMaterials;
                material.albedo = albedo.slice( 0 );
                material.specular = specular.slice( 0 );
            }
            return config;
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


        var createTexture = function ( color, srgb ) {
            var albedo = new osg.Uint8Array( 4 );

            color.forEach( function ( value, index ) {
                if ( srgb )
                    albedo[ index ] = Math.floor( 255 * linear2Srgb( value ) );
                else
                    albedo[ index ] = Math.floor( 255 * value );
            } );

            var texture = new osg.Texture();
            texture.setTextureSize( 1, 1 );
            texture.setImage( albedo );
            return texture;
        };

        var materialsConfig = [ {
                specular: [ 0.971519, 0.959915, 0.915324 ], // Silver
                albedo: [ 0, 0, 0 ]
            }, {
                specular: [ 0.913183, 0.921494, 0.924524 ], // Aluminium
                albedo: [ 0, 0, 0 ]
            }, {
                specular: [ 1.0, 0.765557, 0.336057 ], // Gold
                albedo: [ 0, 0, 0 ]
            }, {
                specular: [ 0.955008, 0.637427, 0.538163 ], // Copper
                albedo: [ 0, 0, 0 ]
            }, // {
            //     specular: [ 0.549585, 0.556114, 0.554256 ], // Chromium
            //     albedo: [ 0, 0, 0 ]
            // },
            {
                specular: [ 0.659777, 0.608679, 0.525649 ], // Nickel
                albedo: [ 0, 0, 0 ]
            }, //  {
            //     specular: [ 0.541931, 0.496791, 0.449419 ], // Titanium
            //     albedo: [ 0, 0, 0 ]
            // },
            {
                specular: [ 0.662124, 0.654864, 0.633732 ], // Cobalt
                albedo: [ 0, 0, 0 ]
            }, {
                specular: [ 0.672411, 0.637331, 0.585456 ], // Platinum
                albedo: [ 0, 0, 0 ]
            }
        ];



        var group = new osg.Node();


        materialsConfig.forEach( function ( material, index ) {
            var radius = 10.0;
            var offset = 5;

            var config = createConfig( material.albedo, material.specular );
            var subgroup = new osg.MatrixTransform();
            subgroup.setMatrix( osg.Matrix.makeTranslate( 0, index * ( 2 * radius + offset ), 0, osg.Matrix.create() ) );
            config.forEach( function ( config, index ) {

                var segment = 80;
                var sphere = osg.createTexturedSphere( radius, segment, segment / 2 );

                var color = config.albedo.slice( 0 );
                color[ 3 ] = 1.0;
                var albedo = createTexture( color, true );
                sphere.getOrCreateStateSet().setTextureAttributeAndModes( 0, albedo );

                var roughness = createTexture( [ config.roughness, config.roughness, config.roughness, 1.0 ], false );
                sphere.getOrCreateStateSet().setTextureAttributeAndModes( 1, roughness );

                color = config.specular.slice( 0 );
                color[ 3 ] = 1.0;
                var specular = createTexture( color, true );
                sphere.getOrCreateStateSet().setTextureAttributeAndModes( 3, specular );

                var transform = new osg.MatrixTransform();
                transform.setMatrix( osg.Matrix.makeTranslate( index * ( 2 * radius + offset ), 0, 0, osg.Matrix.create() ) );
                transform.addChild( sphere );
                subgroup.addChild( transform );
            } );
            group.addChild( subgroup );

        } );

        group.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
        group.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
        group.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
        group.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );
        group.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 4, 'aoMap' ) );

        self.installShaderOnNodes( group, {
            mapSpecular: true
        } );
        var rootModel = new osg.Node();
        rootModel.addChild( group );
        return rootModel;
    },

    createScene: function () {
        var self = this;
        var group = new osg.Node();

        // HDR parameters uniform
        var uniformExposure = osg.Uniform.createFloat1( 1, 'hdrExposure' );
        var sequence = this.computeHammersleySequence( this.referenceNbSamples );
        var uniformHammersley = osg.Uniform.createFloat2Array( sequence, 'hammersley' );
        var uniformPrefilterCubemap = osg.Uniform.createInt1( 1, 'prefilterCubemap' );

        var size = 500;
        var background = this.getEnvSphere( size, group );
        group.getOrCreateStateSet().addUniform( uniformExposure );
        group.getOrCreateStateSet().addUniform( uniformHammersley );
        group.getOrCreateStateSet().addUniform( uniformPrefilterCubemap );

        var rootGraph = new osg.Node();

        var groupModel = new osg.Node();
        var earlyZ = new osg.Node();
        earlyZ.addChild( groupModel );
        earlyZ.getOrCreateStateSet().setAttributeAndModes( this.getShaderEarlyZ(), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );
        earlyZ.getOrCreateStateSet().setAttributeAndModes( new osg.ColorMask( false, false, false, false ) );
        earlyZ.getOrCreateStateSet().setAttributeAndModes( new osg.Depth( 'LESS', 0.0, 1.0, true ), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );
        earlyZ.getOrCreateStateSet().setBinNumber( -1 );
        groupModel.getOrCreateStateSet().setAttributeAndModes( new osg.Depth( 'LEQUAL', 0.0, 1.0, false ) );


        var nodeEarlyPath = new osg.Node();
        nodeEarlyPath.addChild( earlyZ );
        nodeEarlyPath.addChild( groupModel );

        var regular = new osg.Node();
        regular.addChild( groupModel );
        regular.getOrCreateStateSet().setAttributeAndModes( new osg.Depth( 'LEQUAL', 0.0, 1.0, true ), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );
        regular.setNodeMask( 0x0 );

        rootGraph.addChild( regular );
        rootGraph.addChild( nodeEarlyPath );
        group.addChild( rootGraph );

        var config = [ {
            name: 'Cerberus_by_Andrew_Maximov',
            func: this.loadDefaultModel.bind( this )
        }, {
            name: 'Robot_by_Nicolas_Wirrmann',
            func: this.loadRobotModel.bind( this )
        }, {
            name: 'Car_by_Nicolas_Wirrmann',
            func: this.loadCarModel.bind( this )
        }, {
            name: 'Metallic sphere',
            func: this.loadTemplateScene.bind( this )
        } ];

        Q.all( config.map( function ( element ) {
            return element.func();
        } ) ).then( function ( models ) {


            // get array of names
            var names = config.map( function ( element ) {
                return element.name;
            } );

            var ConfigUI = function () {
                this.earlyZ = true;
                this.rendering = 'prefilter';
                this.rangeExposure = 1.0;
                this.environment = 'Alexs_Apartment';
                this.model = names[ 0 ];
            };
            var obj = new ConfigUI();


            var setShaderModel = function () {
                var index = names.indexOf( obj.model );
                if ( !models[ index ] )
                    return;
                var model = models[ index ].getChildren()[0];
                if ( obj.rendering === 'prefilter' )
                    model.setShaderPrefiltered();
                else
                    model.setShaderReference();
            };

            // function called when selecting a model
            var setModel = function ( str ) {
                models.forEach( function ( model ) {
                    model.setNodeMask( 0x0 );
                } );


                var index = names.indexOf( str );
                models[ index ].setNodeMask( ~0x0 );

                setShaderModel();

                self._viewer.getManipulator().setNode( models[ index ] );
                self._viewer.getManipulator().computeHomePosition();
            };

            // add all models to group
            models.forEach( function ( model ) {
                groupModel.addChild( model );
            } );


            var gui = new window.dat.GUI();


            var controller = gui.add( obj, 'earlyZ' );
            controller.onChange( function ( value ) {
                if ( value ) {
                    nodeEarlyPath.setNodeMask( ~0x0 );
                    regular.setNodeMask( 0x0 );
                } else {
                    nodeEarlyPath.setNodeMask( 0x0 );
                    regular.setNodeMask( ~0x0 );
                }
            } );

            controller = gui.add( obj, 'rangeExposure', 0, 4 );
            controller.onChange( function ( value ) {
                uniformExposure.set( value );
            } );


            controller = gui.add( obj, 'environment', Object.keys( this.textureEnvs ) );
            controller.onChange( function ( value ) {

                this.setEnvironment( value, background, groupModel );

            }.bind( this ) );


            controller = gui.add( obj, 'model', names );
            controller.onChange( function ( value ) {

                setModel( value );

            }.bind( this ) );


            controller = gui.add( obj, 'rendering', [ 'prefilter', 'reference ' + this.referenceNbSamples.toString() ] );
            controller.onChange( setShaderModel );


            setModel( names[ 0 ] );
            this.setEnvironment( 'Alexs_Apartment', background, groupModel );


        }.bind( this ) ).done();


        return group;
    },


    run: function () {

        var canvas = document.getElementById( '3DView' );

        var options = {};
        ( function ( options ) {
            var vars = [],
                hash;
            var indexOptions = window.location.href.indexOf( '?' );
            if ( indexOptions < 0 ) return;

            var hashes = window.location.href.slice( indexOptions + 1 ).split( '&' );
            for ( var i = 0; i < hashes.length; i++ ) {
                hash = hashes[ i ].split( '=' );
                var element = hash[ 0 ];
                vars.push( element );
                var result = hash[ 1 ];
                if ( result === undefined ) {
                    result = '1';
                }
                options[ element ] = result;
            }
        } )( options );


        var viewer;
        viewer = new osgViewer.Viewer( canvas );
        Viewer = viewer;
        viewer.init();
        var rotate = new osg.MatrixTransform();

        var nbVectors = viewer.getWebGLCaps().getWebGLParameter( 'MAX_FRAGMENT_UNIFORM_VECTORS' );
        this.referenceNbSamples = Math.min( nbVectors - 20, this.referenceNbSamples );

        rotate.addChild( this.createScene() );
        viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );
        viewer.setSceneData( rotate );
        viewer.setupManipulator();
        viewer.getManipulator().computeHomePosition();

        viewer.run();
        this._viewer = viewer;
    },

    getShaderBackground: function () {

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
            'varying vec2 osg_FragTexCoord0;',

            'void main(void) {',
            '  osg_FragVertex = Vertex;',
            '  osg_FragTexCoord0 = TexCoord0;',
            '  osg_FragEye = vec3(ModelViewMatrix * vec4(Vertex,1.0));',
            '  osg_FragNormal = vec3(NormalMatrix * vec4(Normal, 1.0));',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
            '}'
        ].join( '\n' );

        var fragmentshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',

            this.getCommonShader(),

            'uniform float hdrExposure;',

            'varying vec3 osg_FragNormal;',
            'varying vec3 osg_FragEye;',
            'varying vec3 osg_FragVertex;',
            'varying vec2 osg_FragTexCoord0;',

            this.getTextureEnvFunctions(),

            // apply some gamma correction (http://www.geeks3d.com/20101001/tutorial-gamma-correction-a-story-of-linearity/)
            'vec3 toneMapHDR(vec3 rgb) {',
            '  return pow(rgb , 1.0 / vec3(DefaultGamma));',
            '}',

            'void main(void) {',
            '  vec3 normal = normalize(osg_FragVertex.xyz);',
            '  vec3 c = toneMapHDR( hdrExposure * textureSpheremapRGBE( envBackground, envBackgroundSize, normal));',
            '  gl_FragColor = vec4(c, 1.0);',
            '}',
            ''
        ].join( '\n' );

        var program = new osg.Program(
            new osg.Shader( 'VERTEX_SHADER', vertexshader ),
            new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

        return program;
    },


    getEnvSphere: function ( size, scene ) {

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


window.addEventListener( 'load', function () {
    var example = new PBRExample();
    example.run();
}, true );

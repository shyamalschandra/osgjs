
'use strict';

var Q = window.Q;
var OSG = window.OSG;
var osg = OSG.osg;
var osgViewer = OSG.osgViewer;
var osgDB = OSG.osgDB;
var osgUtil = OSG.osgUtil;


var PBRExample = function () {

    this._mobile = 0;

    // set by createScene
    this._stateSetBackground = undefined;
    this._stateSetEnvironment = undefined;

    this._configModel = [ {
        name: 'C3PO',
        func: this.loadC3POModel.bind( this ),
        promise: undefined,
        model: new osg.Node(),
        config: {
            mapNormal: true,
            mapSpecular: false,
            mapAmbientOcclusion: false,
            mapGlossiness: false
        }
    }, {
        name: 'Cerberus',
        func: this.loadDefaultModel.bind( this ),
        promise: undefined,
        model: new osg.Node(),
        config: {
            mapNormal: true
        }
    }, {
        name: 'Mire',
        func: this.loadMireScene.bind( this ),
        promise: undefined,
        model: new osg.Node(),
        config: {
            mapSpecular: false,
            mapAmbientOcclusion: false,
            mapGlossiness: false,
            mapNormal: true
        }
    },{
        name: 'Sphere',
        func: this.loadTemplateScene.bind( this ),
        promise: undefined,
        model: new osg.Node(),
        config: {
            mapNormal: false,
            mapSpecular: true,
            mapAmbientOcclusion: false,
            mapGlossiness: false
        }
    }, {
        name: 'Robot',
        func: this.loadRobotModel.bind( this ),
        promise: undefined,
        model: new osg.Node(),
        config: {
            mapSpecular: true,
            mapAmbientOcclusion: true,
            mapGlossiness: true,
            mapNormal: true
        }

    }, {
        name: 'Robot-low',
        func: this.loadRobotModel2.bind( this ),
        promise: undefined,
        model: new osg.Node(),
        config: {
            mapSpecular: true,
            mapAmbientOcclusion: true,
            mapGlossiness: true,
            mapNormal: true
        }

    }, {
        name: 'Car1',
        func: this.loadCarModelSpecular.bind( this ),
        promise: undefined,
        model: new osg.Node(),
        config: {
            mapSpecular: true,
            mapAmbientOcclusion: true,
            mapGlossiness: true,
            mapNormal: true
        }

    }, {
        name: 'Car2',
        func: this.loadCarModelMetallic.bind( this ),
        promise: undefined,
        model: new osg.Node(),
        config: {
            mapSpecular: false,
            mapAmbientOcclusion: true,
            mapGlossiness: false,
            mapNormal: true
        }

    } ];

    this._modelList = this._configModel.map( function ( element ) {
        return element.name;
    });

    this._configGUI = {
        earlyZ: true,
        rendering: 'solid',
        rangeExposure: 1.0,
        environment : 'Alexs_Apartment',
        model: this._modelList[0],
        rotation: 0.0,
        textureMethod: 'RGBE',
        nbSamples: 4
    };


    this.textureEnvs = {};

    this.textureEnvs.bg = {
        'Alexs_Apartment': 'Alexs_Apt_2k_bg.jpg',
        'Allego': 'panorama_map_bg.jpg',
        'GrandCanyon_C_YumaPoint': 'GCanyon_C_YumaPoint_3k_bg.jpg',
        'Walk_Of_Fame': 'Mans_Outside_2k_bg.jpg',
        'HDR_Free_City_Night_Lights': 'HDR_Free_City_Night_Lights_Ref_bg.jpg'
    };

    this._environmentList = Object.keys(this.textureEnvs.bg);

    this.textureEnvs.solid = {
        rgbe: {
            'Alexs_Apartment': 'Alexs_Apt_2k_mip.png',
            'Allego': 'panorama_map_mip.png',
            'GCanyon_C_YumaPoint': 'GCanyon_C_YumaPoint_3k_mip.png',
            'Walk_Of_Fame': 'Mans_Outside_2k_mip.png',
            'HDR_Free_City_Night_Lights': 'HDR_Free_City_Night_Lights_Ref_mip.png'
        },
        rgbm: {
            'Alexs_Apartment': 'Alexs_Apt_2k_mip_17.375849.png',
            'Allego': 'panorama_map_mip_963.479187.png',
            'GrandCanyon_C_YumaPoint': 'GCanyon_C_YumaPoint_3k_mip_18.460438.png',
            'Walk_Of_Fame': 'Mans_Outside_2k_mip_34.611233.png',
            'HDR_Free_City_Night_Lights': 'HDR_Free_City_Night_Lights_Ref_mip_839.186951.png'
        }
    };

    this.textureEnvs.prefiltered = {
        rgbm: {
            'Alexs_Apartment': {
                'diff': 'Alexs_Apt_2k_diff_0.098734.png',
                'spec': 'Alexs_Apt_2k_spec_7.076629.png'
            },
            'Allego': {
                'diff': 'panorama_map_diff_0.328576.png',
                'spec': 'panorama_map_spec_1.561654.png'
            },
            'GrandCanyon_C_YumaPoint': {
                'diff': 'GCanyon_C_YumaPoint_3k_diff_0.136487.png',
                'spec': 'GCanyon_C_YumaPoint_3k_spec_17.478539.png'
            },
            'Walk_Of_Fame': {
                'diff': 'Mans_Outside_2k_diff_0.136116.png',
                'spec': 'Mans_Outside_2k_spec_31.384483.png'
            },
            'HDR_Free_City_Night_Lights': {
                'diff': 'HDR_Free_City_Night_Lights_Ref_diff_0.108381.png',
                'spec': 'HDR_Free_City_Night_Lights_Ref_spec_957.209351.png'
            }
        },
        rgbe: {
            'Alexs_Apartment': {
                'diff': 'Alexs_Apt_2k_diff.png',
                'spec': 'Alexs_Apt_2k_spec.png'
            },
            'Allego': {
                'diff': 'panorama_map_diff.png',
                'spec': 'panorama_map_spec.png'
            },
            'GrandCanyon_C_YumaPoint': {
                'diff': 'GCanyon_C_YumaPoint_3k_diff.png',
                'spec': 'GCanyon_C_YumaPoint_3k_spec.png'
            },
            'Walk_Of_Fame': {
                'diff': 'Mans_Outside_2k_diff.png',
                'spec': 'Mans_Outside_2k_spec.png'
            },
            'HDR_Free_City_Night_Lights': {
                'diff': 'HDR_Free_City_Night_Lights_Ref_diff.png',
                'spec': 'HDR_Free_City_Night_Lights_Ref_spec.png'
            }
        },
        'integrateBRDF': 'integrateBRDF.png'
    };

    this._viewer = undefined;
};

PBRExample.prototype = {

    modelFinishLoading: function() {
        this._loading--;
        if ( !this._loading ) {
            console.log( 'loading finished' );
            document.getElementById( 'loading' ).style.display = 'None';
        }
    },

    modelStartLoading: function( name ) {
        this._loading++;
        if ( name ) {
            console.log( 'loading ' + name );
        }
        document.getElementById( 'loading' ).style.display = 'Block';
    },

    setEnvironmentUniforms: function ( method, stateSet, name, unit, w, h, range ) {

        stateSet.addUniform( osg.Uniform.createInt1( unit, name ) );
        stateSet.addUniform( osg.Uniform.createFloat2( [ w, h ], name + 'Size' ) );

        if ( range !== undefined ) {
            stateSet.addUniform( osg.Uniform.createFloat1( range, name + 'Range' ) );
        }
    },

    createEnvironmnentTexture: function ( name, image, stateSet, unit ) {
        var method = this._configGUI.textureMethod;
        var texture = new osg.Texture();
        if ( image )
            texture.setImage( image );
        texture.setMinFilter( 'NEAREST' );
        texture.setMagFilter( 'NEAREST' );

        stateSet.setTextureAttributeAndModes( unit, texture );
        var width = image ? image.getWidth() : 0;
        var height = image ? image.getHeight() : 0;

        var range;
        if ( method.toLowerCase() === 'rgbm' ) {
            var re = /.*_(\d.*).png/;
            var str = image.getURL();
            var m;
            m = re.exec(str);
            if ( m )
                range = parseFloat(m.pop());
        }

        if ( image )
            this.setEnvironmentUniforms( method, stateSet, name, unit, width, height, range );
        return texture;
    },


    setEnvironmentPrefiltered: function( method, name, stateSet ) {
        var textureFormat = method.toLowerCase();
        var config = this.textureEnvs.prefiltered[textureFormat][ name ];
        var integrateBRDF = this.textureEnvs.prefiltered.integrateBRDF;

        var mipmapTexture = [
            this.readImageURL( 'textures/' + name + '/prefilter/' + textureFormat + '/' + config.diff ),
            this.readImageURL( 'textures/' + name + '/prefilter/' + textureFormat + '/' + config.spec ),
            this.readImageURL( 'textures/' + integrateBRDF )
        ];

        Q.all( mipmapTexture ).then( function ( images ) {
            this.createEnvironmnentTexture( 'envDiffuse', images[ 0 ], stateSet,5 );
            this.createEnvironmnentTexture( 'envSpecular', images[ 1 ], stateSet,6 );
            this.createEnvironmnentTexture( 'integrateBRDF', images[ 2 ], stateSet, 7 );
        }.bind( this ) );
    },

    setEnvironmentSolid: function( method, name, stateSet ) {
        var textureFormat = method.toLowerCase();
        var image = this.textureEnvs.solid[ textureFormat ][ name ];
        var texture = [
            this.readImageURL( 'textures/' + name + '/solid/' + textureFormat + '/' + image ),
        ];

        Q.all( texture ).then( function ( images ) {
            this.createEnvironmnentTexture( 'environment', images[ 0 ], stateSet, 5 );
        }.bind( this ) );
    },


    setEnvironmentBackground: function( name, stateSet ) {

        var image = this.textureEnvs.bg[ name ];
        var texture = [
            this.readImageURL( 'textures/' + name + '/' + image ),
        ];
        Q.all( texture ).then( function ( images ) {
            var texture = this.createEnvironmnentTexture( 'environment', images[ 0 ], stateSet, 0 );
            texture.setMinFilter( 'LINEAR');
            texture.setMagFilter( 'LINEAR');
            texture.setWrapS( 'REPEAT');
        }.bind( this ) );
    },

    setEnvironmentModel: function( name, stateSet ) {
        var method = this._configGUI.textureMethod;
        var rendering = this._configGUI.rendering;

        if ( rendering === 'prefilter' )
            this.setEnvironmentPrefiltered( method, name, stateSet );
        else
            this.setEnvironmentSolid( method, name, stateSet );
    },

    setEnvironment: function ( name ) {

        var stateSetBackground = this._stateSetBackground;
        this.setEnvironmentBackground( name, stateSetBackground );

        var stateSetEnvironment = this._stateSetEnvironment;
        this.setEnvironmentModel( name, stateSetEnvironment );
    },

    setModelShader: function ( model, modelConfig, stateSet ) {
        var config = {
            textureMethod: this._configGUI.textureMethod,
            rendering: this._configGUI.rendering,
            samples: this._configGUI.nbSamples
        };

        var shader = this.getShader( modelConfig, config );
        stateSet.setAttributeAndModes( shader, osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );
        this.setEnvironment( this._configGUI.environment );
        this.createHammersleyUniforms();
    },

    getTextureEnvFunctions: function () {

        return [
            'float TextureLevel = 0.0;',
            '#define DefaultGamma 2.4',

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

            'vec3 textureRGBE(const in sampler2D texture, const in vec2 uv) {',
            '    vec4 rgbe = texture2D(texture, uv );',

            '    float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));',
            '    return rgbe.rgb * 255.0 * f;',
            '}',

            'vec3 textureRGBM(const in sampler2D texture, const in vec2 uv ) {',
            '    vec4 rgbm = texture2D(texture, uv );',
            '    return rgbm.rgb * rgbm.a;',
            '}',


            'vec2 normalToPanoramaUV( const in vec3 dir )',
            '{',
            'float n = length(dir.xz);',
            'vec2 pos = vec2( (n>0.0000001) ? dir.x / n : 0.0, dir.y);',
            'pos = acos(pos)*INV_PI;',
            'pos.x = (dir.z > 0.0) ? pos.x*0.5 : 0.9999999-(pos.x*0.5);',
            '//pos.y = 1.0-pos.y;',
            'return pos;',
            '}',

            'vec2 normalToSphericalUV( const in vec3 n )',
            '{',
            '    //return normalToPanoramaUV( n );',
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
            '    float yaw = acos(n.y) * INV_PI;',
            '    float pitch;',
            '    float y = n.z;',
            '    if ( abs( y ) < EPS )',
            '        y = EPS;',
            '    pitch = ( atan(n.x, y) + PI) * 0.5  * INV_PI;',
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

            'vec3 textureRGBMLinear(const in sampler2D texture, const in vec2 size, const in vec2 uv ) {',
            '    vec2 t = 1.0 / size;',

            '    vec3 a = textureRGBM(texture, uv ),',
            '         b = textureRGBM(texture, uv + vec2(t.x, 0.0) ),',
            '         c = textureRGBM(texture, uv + vec2(0.0, t.y) ),',
            '         d = textureRGBM(texture, uv + vec2(t.x, t.y) );',
            '    vec2 f = fract(uv * size);',
            '    vec3 A = mix(a, b, f.x),',
            '         B = mix(c, d, f.x);',
            '    return mix(A, B, f.y);',
            '}',

            'vec3 textureRGBELinearPanoramic(const in sampler2D texture, const in vec2 size, const in vec2 uv, const in vec2 maxBox ) {',
            '    vec2 t = 1.0 / size;',
            '    ',
            '    float maxX = mod(uv.x+t.x, maxBox.x);',
            '    float maxY = min(uv.y+t.y, maxBox.y-t.y);', // clamp to one pixel before

            '    vec3 a = textureRGBE(texture, uv ),',
            '         b = textureRGBE(texture, vec2( maxX, uv.y) ),',
            '         c = textureRGBE(texture, vec2( uv.x, maxY) ),',
            '         d = textureRGBE(texture, vec2( maxX, maxY) );',
            '    vec2 f = fract(uv * size);',
            '    vec3 A = mix(a, b, f.x),',
            '         B = mix(c, d, f.x);',
            '    return mix(A, B, f.y);',
            '}',


            'vec3 textureRGBMLinearPanoramic(const in sampler2D texture, const in vec2 size, const in vec2 uv, const in vec2 maxBox ) {',
            '    vec2 t = 1.0 / size;',
            '    ',
            '    float maxX = mod(uv.x+t.x, maxBox.x);',
            '    float maxY = min(uv.y+t.y, maxBox.y-t.y);', // clamp to one pixel before

            '    vec3 a = textureRGBM(texture, uv ),',
            '         b = textureRGBM(texture, vec2( maxX, uv.y) ),',
            '         c = textureRGBM(texture, vec2( uv.x, maxY) ),',
            '         d = textureRGBM(texture, vec2( maxX, maxY) );',
            '    vec2 f = fract(uv * size);',
            '    vec3 A = mix(a, b, f.x),',
            '         B = mix(c, d, f.x);',
            '    return mix(A, B, f.y);',
            '}',

            'vec3 texturePanoramicRGBELod(const in sampler2D texture, const in vec2 size , const in vec3 direction, const float lodInput) {',

            '   vec2 uvBase = normalToSphericalUV( direction );',
            '   uvBase.y *= 0.5;',
            '   float lod = max(1.0, MaxLOD-lodInput);',
            '   float lod0 = floor(lod);',
            '   vec4 uv0 = computeUVForMipmap(lod0, uvBase, size );',
            '   vec3 texel0 = textureRGBELinearPanoramic( texture, size, uv0.xy, uv0.zw);',

            '   float lod1 = ceil(lod);',
            '   vec4 uv1 = computeUVForMipmap(lod1, uvBase, size );',
            '   vec3 texel1 = textureRGBELinearPanoramic( texture, size, uv1.xy, uv1.zw);',

            '    return mix(texel0, texel1, fract( lod ) );',
            '}',

            'vec3 texturePanoramicRGBMLod(const in sampler2D texture, const in vec2 size , const in float range, const in vec3 direction, const float lodInput) {',

            '   vec2 uvBase = normalToSphericalUV( direction );',
            '   uvBase.y *= 0.5;',
            '   float lod = max(1.0, MaxLOD-lodInput);',
            '   float lod0 = floor(lod);',
            '   vec4 uv0 = computeUVForMipmap(lod0, uvBase, size );',
            '   vec3 texel0 = textureRGBMLinearPanoramic( texture, size, uv0.xy, uv0.zw);',

            '   float lod1 = ceil(lod);',
            '   vec4 uv1 = computeUVForMipmap(lod1, uvBase, size );',
            '   vec3 texel1 = textureRGBMLinearPanoramic( texture, size, uv1.xy, uv1.zw);',

            '    return mix(texel0, texel1, fract( lod ) )* range;',
            '}',

            'vec3 textureRGBELinear(const in sampler2D texture, const in vec2 size, const in vec2 uv) {',
            '    vec2 t = 1.0 / size;',
            '    ',
            '    vec3 a = textureRGBE(texture, uv ),',
            '         b = textureRGBE(texture, uv + vec2(t.x, 0.0) ),',
            '         c = textureRGBE(texture, uv + vec2(0.0, t.y) ),',
            '         d = textureRGBE(texture, uv + vec2(t.x, t.y) );',

            '    vec2 f = fract(uv * size);',
            '    vec3 A = mix(a, b, f.x),',
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

        ].join( '\n' );
    },

    getCommonShader: function () {
        return [
            '#define PI 3.1415926535897932384626433832795',
            '#define PI_2 (2.0*3.1415926535897932384626433832795)',
            '#define INV_PI 1.0/PI',
            '#define INV_LOG2 1.4426950408889634073599246810019',

            'float MaxLOD = 0.0;',

            // unreal pregenerated texture


            // from https://www.shadertoy.com/view/4sfGDB
            'float seed = 0.;',
            'float rand() { return fract(sin(seed++)*43758.5453123); }',

            'uniform sampler2D integrateBRDF;',
            'uniform sampler2D integrateBRDFSize;',

            'uniform sampler2D envSpecular;',
            'uniform vec2 envSpecularSize;',
            'uniform float envSpecularRange;',

            'uniform sampler2D envDiffuse;',
            'uniform float envDiffuseRange;',
            'uniform vec2 envDiffuseSize;',


            'uniform sampler2D environment;',
            'uniform float environmentRange;',
            'uniform vec2 environmentSize;',

            'uniform sampler2D envBackground;',


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


        ].join( '\n' );
    },

    getShader: function ( config, shaderType ) {
        if ( !config ) config = {};

        if ( !shaderType )
            shaderType = {};

        var textureMethod = shaderType.textureMethod;
        var rendering = shaderType.rendering;

        var textureRGBE = textureMethod === 'RGBE' ? 1 : 0;
        var textureRGBM = textureMethod === 'RGBM' ? 1 : 0;
        var solid = rendering === 'solid' ? 1 : 0;
        var solid2 = rendering === 'solid2' ? 1 : 0;
        var prefilter = rendering === 'prefilter' ? 1 : 0;
        var nbSamples = 1;
        var brute = 0;
        if ( prefilter )
            solid = solid2 = 0;

        if ( solid || solid2 ) {
            nbSamples = shaderType.samples;
            brute = 1;
        }


        var vertexshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',

            'attribute vec3 Vertex;',
            'attribute vec3 Normal;',
            'attribute vec2 TexCoord0;',
            'attribute vec4 Tangent;',

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
            '  osg_FragTangent = NormalMatrix * Tangent;',
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


            '#define NB_SAMPLES ' + nbSamples,

            'uniform sampler2D albedoMap;',
            'uniform sampler2D roughnessMap;',
            'uniform sampler2D normalMap;',
            'uniform sampler2D specularMap;',
            'uniform sampler2D aoMap;',

            'uniform float hdrExposure;',
            'uniform mat4 CubemapTransform;',

            '#ifdef GL_OES_standard_derivatives',
            '#extension GL_OES_standard_derivatives : enable',
            '#endif',

            '#if ' + brute.toString(),
            'uniform vec2 hammersley[NB_SAMPLES];',
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
            'float MaterialAO;',


            '#if ' + brute.toString(),

            'vec3 fresnel( float vdh, vec3 F0 ) {',
            '// Schlick with Spherical Gaussian approximation',
            '// cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3',
            '    float sphg = pow(2.0, (-5.55473*vdh - 6.98316) * vdh);',
            '    return F0 + (vec3(1.0 ) - F0) * sphg;',
            '}',

            '// w is either Ln or Vn',
            'float G1( float ndw, float k ) {',
            '// One generic factor of the geometry function divided by ndw',
            '// NB : We should have k > 0',
            '    return 1.0 / ( ndw*(1.0-k) + k );',
            '}',

            'float visibility(float ndl,float ndv,float Roughness) {',
            '// Schlick with Smith-like choice of k',
            '// cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3',
            '// visibility is a Cook-Torrance geometry function divided by (n.l)*(n.v)',
            '    float k = Roughness * Roughness * 0.5;',
            '    return G1(ndl,k)*G1(ndv,k);',
            '}',

            'vec3 cookTorranceContrib(',
            '	float vdh,',
            '	float ndh,',
            '	float ndl,',
            '	float ndv,',
            '	vec3 Ks,',
            '	float Roughness)',
            '{',
            '// This is the contribution when using importance sampling with the GGX based',
            '// sample distribution. This means ct_contrib = ct_brdf / ggx_probability',
            '	return fresnel(vdh,Ks) * (visibility(ndl,ndv,Roughness) * vdh * ndl / ndh );',
            '}',
            '#endif',

            '// A,B,C are ',
            'vec3 importanceSampleGGX(const in vec2 Xi, const in vec3 tangentX, const in vec3 tangentY, const in vec3 normal, const in float roughness)',
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


            this.getTextureEnvFunctions(),

            // apply some gamma correction (http://www.geeks3d.com/20101001/tutorial-gamma-correction-a-story-of-linearity/)
            'vec3 linear2sRGB ( vec3 color ) {',
            '  return pow( color , 1.0/ vec3( gamma ) );',
            '}',

            'mat3 getIBLTransfrom( mat4 transform ) {',
            '  vec3 x = vec3(transform[0][0], transform[1][0], transform[2][0]);',
            '  vec3 y = vec3(transform[0][1], transform[1][1], transform[2][1]);',
            '  vec3 z = vec3(transform[0][2], transform[1][2], transform[2][2]);',
            '  mat3 m = mat3(x,y,z);',
            '  return m;',
            '}',

            'float distortion(const in vec3 Wn)',
            '{',
            '	// Computes the inverse of the solid angle of the (differential) pixel in',
            '	// the cube map pointed at by Wn',
            '	float sinT = max(0.0000001, sqrt(1.0-Wn.y*Wn.y));',
            '	return 1.0/sinT;',
            '}',

            'float computeLOD(const in vec3 Ln, const in float p)',
            '{',
            '	return max(0.0, (MaxLOD-1.5) - 0.5*(log(float(NB_SAMPLES)) + log( p * distortion(Ln) ))',
            '		* INV_LOG2);',
            '}',


            '#if '  + brute.toString(),
            'vec3 diffuseBRDF(',
            '	vec3 Nn,',
            '	vec3 Ln,',
            '	vec3 Vn,',
            '	vec3 Kd)',
            '{',
            '	return Kd;',
            '}',

            'vec3 importanceSampleLambert(vec2 Xi, vec3 A, vec3 B, vec3 C)',
            '{',
            '	float cosT = sqrt(Xi.y);',
            '	float sinT = sqrt(1.0-Xi.y);',
            '	float phi = 2.0*PI*Xi.x;',
            '	return (sinT*cos(phi)) * A + (sinT*sin(phi)) * B + cosT * C;',
            '}',
            '',
            'float probabilityLambert(const in vec3 Ln, const in vec3 Nn)',
            '{',
            '	return max( 0.0, dot(Nn, Ln) * INV_PI );',
            '}',

            'float normal_distrib(',
            '	float ndh,',
            '	float Roughness)',
            '{',
            '// use GGX / Trowbridge-Reitz, same as Disney and Unreal 4',
            '// cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3',
            '	float alpha = Roughness * Roughness;',
            '	float tmp = alpha / (ndh*ndh*(alpha*alpha-1.0)+1.0);',
            '	return tmp * tmp * INV_PI;',
            '}',

            'float probabilityGGX(float ndh, float vdh, float Roughness)',
            '{',
            '	return normal_distrib(ndh, Roughness) * ndh / (4.0*vdh);',
            '}',


            'vec3 solid( const in mat3 iblTransform, const in vec3 normal, const in vec3 view ) {',
            '',
            '   MaxLOD = log ( environmentSize[0] ) * INV_LOG2 - 1.0;',
            '   //vectors used for importance sampling',
            '   vec3 upVector = abs(normal.z) < 0.999 ? vec3(0.0,0.0,1.0) : vec3(1.0,0.0,0.0);',
            '   vec3 tangentX = normalize( cross( upVector, normal ) );',
            '   vec3 tangentY = cross( normal, tangentX );',


            '   vec3 tang = vec3(0.0,1.0,0.0);',
            '   tang = normalize(osg_FragTangent.xyz);',
            '   vec3 bin = osg_FragTangent.w * cross(normal, tang);',
            '   vec3 Tp = normalize(tang - normal*dot(tang, normal));', // local tangent
            '   vec3 Bp = normalize(bin  - normal*dot(bin, normal)  - Tp*dot(bin, Tp));', // local bitangent

            '   tangentX = Tp;',
            '   tangentY = Bp;',

            '   float ndv = max( 0.0, dot(normal, view) );',

            '   vec3 contrib = vec3(0.0);',

            '   for ( int i = 0; i < NB_SAMPLES; i++ ) {',

            '      vec2 xi = hammersley[i];',

            '      vec3 isl = importanceSampleLambert( xi, tangentX, tangentY, normal );',
            '      float probLambert = probabilityLambert(isl, normal);',


            '      float lodDiffuse = computeLOD(isl, probLambert);',
            '      vec3 diffuseContrib = diffuseBRDF( normal, isl,  view, MaterialAlbedo);',
            '      vec3 ray = iblTransform * isl;',
            '#if ' + textureRGBE.toString(),
            '      vec3 texel = texturePanoramic' + textureMethod + 'Lod(environment, environmentSize, ray, lodDiffuse);',
            '#endif',

            '#if ' + textureRGBM.toString(),
            '      vec3 texel = texturePanoramic' + textureMethod + 'Lod(environment, environmentSize, environmentRange, ray, lodDiffuse);',
            '#endif',

            '      contrib += MaterialAO * hdrExposure * texel * diffuseContrib;',


            '      vec3 h = importanceSampleGGX( xi, tangentX, tangentY, normal, MaterialRoughness );',
            '',
            '      float vdh = dot( view, h );',
            '      vec3 l = (2.0 * vdh * h - view);',
            '      float ndl =  dot( normal, l );',


            '      if ( ndl > 0.0 ) {',
            '         float ndh =  max( 0.0, dot( normal, h ) );',
            '         vdh = max( 0.0, vdh );',
            '         float probGGX = probabilityGGX( ndh, vdh, MaterialRoughness);',
            '         float lodSpecular = MaterialRoughness < 0.01 ? 0.0: computeLOD( l, probGGX );',
            '         vec3 specularContrib = cookTorranceContrib( vdh, ndh, ndl, ndv, MaterialSpecular, MaterialRoughness);',
            '         vec3 raySpec = iblTransform * l;',

            '#if ' + textureRGBE.toString(),
            '      vec3 color = texturePanoramic' + textureMethod + 'Lod(environment, environmentSize, raySpec, lodSpecular);',
            '#endif',

            '#if ' + textureRGBM.toString(),
            '      vec3 color = texturePanoramic' + textureMethod + 'Lod(environment, environmentSize, environmentRange, raySpec, lodSpecular);',
            '#endif',

            '         contrib += hdrExposure * color * specularContrib;',
            '      }',

            '   }',
            '   contrib = contrib / float(NB_SAMPLES);',

            '   vec3 gammaCorrected = linearTosRGB( contrib, DefaultGamma);',
            '   return gammaCorrected;',
            '}',

            '#endif',


            '#if ' + solid2.toString(),

            'vec3 tangentX;',
            'vec3 tangentY;',
            '',
            'vec3 F_Schlick( const in vec3 f0, const in float vdh ) {',
            '// Schlick with Spherical Gaussian approximation',
            '// cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3',
            '    float sphg = pow(2.0, (-5.55473*vdh - 6.98316) * vdh);',
            '    return f0 + (vec3(1.0 ) - f0) * sphg;',
            '}',
            '',
            'float G_SmithGGX(const in float NdotL, const in float NdotV, const in float roughness) {',
            '// cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3',
            '// visibility is a Cook-Torrance geometry function divided by (n.l)*(n.v)',
            '    float k = roughness * roughness * 0.5;',
            '    return NdotL * NdotV * G1(NdotL,k) * G1(NdotV,k);',
            '}',
            'float G_SmithGGX2(const in float NdotL, const in float NdotV, const in float roughness) {',
            '    float k = roughness * roughness * 0.5;',
            '    return G1(NdotL,k) * G1(NdotV,k);',
            '}',
            '',
            'float D_GGX( const in float NdotH, const in float roughness) {',
            '	float alpha = roughness * roughness;',
            '	float tmp = alpha / (NdotH*NdotH*(alpha*alpha-1.0)+1.0);',
            '	return tmp * tmp * INV_PI;',
            '}',
            '',
            'vec3 evaluateSpecularIBL( const in mat3 iblTransform, const in vec3 N, const in vec3 V ) {',
            '',
            '    vec3 contrib = vec3(0.0);',
            '    float roughness = max( MaterialRoughness, 0.015);',
            '    vec3 f0 = MaterialSpecular;',
            '',
            '',
            '    float NdotV = max( 0.0, dot(V, N));',
            '    float alpha = roughness*roughness;',
            '    float alpha2 = alpha*alpha;',
            '',
            '    float alpha2MinusOne = alpha2 - 1.0;',
            '',
            '    vec3 H, L;',
            '',
            '    for ( int i = 0; i < NB_SAMPLES; i++ ) {',
            '',
            '        vec2 u = hammersley[i];',
            '',
            '        // GGX NDF sampling',
            '        float cosThetaH = sqrt( (1.0-u.y) / (1.0 + alpha2MinusOne * u.y) );',
            '        float sinThetaH = sqrt(1.0 - cosThetaH*cosThetaH );',
            '        float phiH = u.x * PI_2;',
            '',
            '        // Convert sample from half angle to incident angle',
            '        H = vec3( sinThetaH*cos(phiH), sinThetaH*sin(phiH), cosThetaH);',
            '        H = normalize(tangentX * H.x + tangentY * H.y + N * H.z);',
            '',
            '        L = normalize(2.0 * dot(V, H) * H - V);',
            '',
            '        float LdotH = max( 0.0, dot(H, L));',
            '        float NdotH = max( 0.0, dot(H, N));',
            '        float NdotL = max( 0.0, dot(L, N));',
            '',
            '',
            '        // Importance sampling weight for each sample',
            '        //',
            '        //   weight = fr . (N.L)',
            '        //',
            '        // with:',
            '        //   fr  = D(H) . F(H) . G(V, L) / ( 4 (N.L) (N.V) )',
            '        //',
            '        // Since we integrate in the microfacet space, we include the',
            '        // jacobian of the transform',
            '        //',
            '        //   pdf = D(H) . (N.H) / ( 4 (L.H) )',
            '',
            '',
            '        // float D         = D_GGX(NdotH, roughness);',
            '        float tmp = alpha / ( NdotH * NdotH*( alpha2MinusOne ) + 1.0);',
            '        float D = tmp * tmp * INV_PI;',
            '',
            '        float pdfH      = D * NdotH;',
            '        float pdf       = pdfH / (4.0 * LdotH);',
            '',
            '        // Implicit weight (N.L canceled out)',
            '        //float3 F	   = F_Schlick(f0, f90, LdotH); // form Sebastien Lagarde',
            '        vec3 F         = F_Schlick(f0, LdotH);',
            '',
            '',
            '        // Geometry  G(V, L )',
            '        // float G     = G_SmithGGX(NdotL, NdotV, roughness);',
            '        // cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3',
            '        float k = alpha * 0.5;',
            '        // NdotL and NdotV can be simplifided later because of the weight / pdf',
            '        // float G = NdotL * NdotV * G1(NdotL,k) * G1(NdotV,k);',
            '        float Goptim = G1(NdotL,k) * G1(NdotV,k);',
            '',
            '        // original weight',
            '        // vec3 weight = F * G * D / (4.0 * NdotV);',
            '        // optimized weight because of the weight * 1.0/pdf',
            '        vec3 weight = F * ( Goptim * LdotH * NdotL / NdotH );',
            '',
            '        if ( NdotL > 0.0 && pdf > 0.0 )',
            '        {',
            '            //contrib += g_IBL.SampleLevel(sampler, L, 0).rgb * weight / pdf;',
            '',
            '            float lod = roughness < 0.01 ? 0.0: computeLOD( L, pdf );',
            '',
            '            // could we remove the transform ?',
            '            vec3 dir = iblTransform * L;',
            '',
            '#if ' + textureRGBE.toString(),
            'vec3 color = texturePanoramic' + textureMethod + 'Lod(environment, environmentSize, dir, lod);',
            '#endif',
            '#if ' + textureRGBM.toString(),
            'vec3 color = texturePanoramic' + textureMethod + 'Lod(environment, environmentSize, environmentRange, dir, lod);',
            '#endif',
            '            //contrib += color * weight / pdf;',
            '            contrib += color * weight;',
            '        }',
            '    }',
            '',
            '    contrib *= 1.0/float(NB_SAMPLES);',
            '    return contrib;',
            '}',

            'vec3 evaluateSpecularIBL2( const in mat3 iblTransform, const in vec3 N, const in vec3 V ) {',
            '',
            '    vec3 contrib = vec3(0.0);',
            '    float roughness = max(0.015, MaterialRoughness);',
            '    vec3 f0 = MaterialSpecular;',
            '',
            '    for ( int i = 0; i < NB_SAMPLES; i++ ) {',
            '        vec2 u = hammersley[i];',
            '',
            '        // GGX NDF sampling',
            '        float alpha = roughness*roughness;',
            '        float cosThetaH = sqrt( (1.0-u.y) / (1.0 + (alpha*alpha-1.0)*u.y) );',
            '        float sinThetaH = sqrt(1.0 - cosThetaH*cosThetaH );',
            '        float phiH = 2.0 * u.x * PI;',
            '',
            '        // Convert sample from half angle to incident angle',
            '        vec3 H;',
            '        H = vec3( sinThetaH*cos(phiH), sinThetaH*sin(phiH), cosThetaH);',
            '        H = normalize(tangentX * H.x + tangentY * H.y + N * H.z);',
            '',
            '        float VdotH = dot(V, H);',
            '',
            '        vec3 L = normalize(2.0 * VdotH * H - V);',
            '',
            '        float LdotH = max( 0.0, dot(H, L));',
            '        float NdotH = max( 0.0, dot(H, N));',
            '        float NdotV = max( 0.0, dot(V, N));',
            '        float NdotL = max( 0.0, dot(L, N));',
            '        VdotH = max( 0.0, VdotH );',
            '',
            '',
            '        // Importance sampling weight for each sample',
            '        //',
            '        //   weight = fr . (N.L)',
            '        //',
            '        // with:',
            '        //   fr  = D(H) . F(H) . G(V, L) / ( 4 (N.L) (N.V) )',
            '        //',
            '        // Since we integrate in the microfacet space, we include the',
            '        // jacobian of the transform',
            '        //',
            '        //   pdf = D(H) . (N.H) / ( 4 (L.H) )',
            '        float D         = D_GGX(NdotH, roughness);',
            '        // float roughness2 = roughness * roughness;',
            '        // float tmp = roughness2 / (NdotH*NdotH*(roughness2*roughness2-1.0)+1.0);',
            '        // D = tmp * tmp * INV_PI;',
            '',
            '',
            '',
            '        float pdfH      = D * NdotH;',
            '        //float pdf 	= pdfH / (4.0f * LdotH); // from Sebastien Lagarde',
            '        float pdf 	= pdfH / (4.0 * VdotH);',
            '',
            '        // Implicit weight (N.L canceled out)',
            '        //float3 F	   = F_Schlick(f0, f90, LdotH); // form Sebastien Lagarde',
            '        vec3  F         = F_Schlick(f0, VdotH);',

            '        float G         = G_SmithGGX(NdotL, NdotV, roughness);',
            '',
            '        // N.V should be also canceled out if G is like the one in epic paper',
            '        // but actually it s simpler to divide by pdf later',
            '        vec3 weight = F * G * D / (4.0 * NdotV);',
            '        vec3 weight2 = F * G_SmithGGX2(NdotL, NdotV, roughness) * VdotH * NdotL /NdotH;',
            '',
            '#if 0', // compare
            '            float probGGX = probabilityGGX( NdotH, VdotH, roughness);',
            '            if ( abs( probGGX - pdf ) > 1e-3 )',
            '                return vec3(1.0,0.0,1.0);',

            '            if ( length( fresnel( VdotH, f0 ) - F ) > 1e-3 )',
            '                return vec3(1.0,0.0,1.0);',

            '            if ( abs( G_SmithGGX2(NdotL, NdotV, roughness)*NdotL*NdotV - G ) > 1e-3 )',
            '                return vec3(1.0,0.0,1.0);',

            '            if ( length( weight2 - weight/pdf) > 1e3)',
            '                return vec3(1.0,0.0,1.0);',
            '#endif',

            '        if ( NdotL > 0.0 && pdf > 0.0 )',
            '        {',
            '            //contrib += g_IBL.SampleLevel(sampler, L, 0).rgb * weight / pdf;',
            '',

            '            float lod = roughness < 0.01 ? 0.0: computeLOD( L, pdf );',
            '',
            '            // could we remove the transform ?',
            '            vec3 dir = iblTransform * L;',
            '',
            '#if ' + textureRGBE.toString(),
            'vec3 color = texturePanoramic' + textureMethod + 'Lod(environment, environmentSize, dir, lod);',
            '#endif',
            '#if ' + textureRGBM.toString(),
            'vec3 color = texturePanoramic' + textureMethod + 'Lod(environment, environmentSize, environmentRange, dir, lod);',
            '#endif',
            '            contrib += color * weight / pdf;',
            '        }',
            '    }',
            '',
            '    contrib *= 1.0/float(NB_SAMPLES);',
            '  return contrib;',
            '}',
            '',
            'vec3 evaluateDiffuseIBL( const in mat3 iblTransform, const in vec3 N, const in vec3 V ) {',
            '',
            '    vec3 contrib = vec3(0.0);',
            '',
            '    for ( int i = 0; i < NB_SAMPLES; i++ ) {',
            '',
            '        // get sample',
            '        vec2 u = hammersley[i];',
            '',
            '        // compute L vector from importance sampling with cos',
            '        float sinT = sqrt( 1.0-u.y );',
            '        float phi = PI_2*u.x;',
            '        vec3 L = (sinT*cos(phi)) * tangentX + (sinT*sin(phi)) * tangentY + sqrt( u.y ) * N;',
            '',
            '        float NdotL = dot( L, N );',
            '',
            '        // compute pdf to get the good lod',
            '        float pdf = max( 0.0, NdotL * INV_PI );',
            '',
            '        float lod = computeLOD(L, pdf);',
            '        vec3 dir = iblTransform * L;',
            '',
            '#if ' + textureRGBE.toString(),
            'vec3 texel = texturePanoramic' + textureMethod + 'Lod(environment, environmentSize, dir, lod);',
            '#endif',

            '#if ' + textureRGBM.toString(),
            'vec3 texel = texturePanoramic' + textureMethod + 'Lod(environment, environmentSize, environmentRange, dir, lod);',
            '#endif',
            '',
            '      contrib += texel;',
            '   }',
            '',
            '   contrib *= MaterialAlbedo * MaterialAO / float(NB_SAMPLES);',
            '   return contrib;',
            '}',
            '',
            'vec3 solid2( const in mat3 iblTransform, const in vec3 normal, const in vec3 view) {',
            '',
            '    MaxLOD = log ( environmentSize[0] ) * INV_LOG2 - 1.0;',
            '    vec3 color = vec3(0.0);',
            '',
            '    //vectors used for importance sampling',
            '    vec3 tangent = normalize(osg_FragTangent.xyz);',
            '    vec3 binormal = osg_FragTangent.w * cross(normal, tangent);',
            '    tangentX = normalize(tangent - normal*dot(tangent, normal)); // local tangent',
            '    tangentY = normalize(binormal  - normal*dot(binormal, normal)  - tangentX*dot(binormal, tangentX)); // local bitange',
            '',
            // '    mat3 ibl = mat3( 1.0, 0.0, 0.0,',
            // '                     0.0, 1.0, 0.0,',
            // '                     0.0, 0.0, 1.0);',
            '    mat3 ibl = iblTransform;',
            '    color += evaluateDiffuseIBL(ibl, normal, view );',
            '    color += evaluateSpecularIBL(ibl, normal, view );',
            '    color *= hdrExposure;',
            '    return linearTosRGB( color, DefaultGamma);',
            '}',
            '#endif',




            '#if ' + prefilter.toString(),

            'vec3 lightDiffuseIndirect( mat3 iblTransform, vec3 albedo, vec3 normal ) {',
            '   vec2 uv = normalToSphericalUV( iblTransform*normal );',

            '#if ' + textureRGBE.toString(),
            '   vec3 texel = textureRGBELinear(envDiffuse, envDiffuseSize, uv.xy ).rgb;',
            '#endif',

            '#if ' + textureRGBM.toString(),
            '    vec3 texel = textureRGBMLinear(envDiffuse, envDiffuseSize, uv.xy ).rgb * envDiffuseRange;',
            '#endif',
            '   vec3 lightDiffuse = hdrExposure * texel;',
            '   return lightDiffuse * albedo;',
            '}',

            'vec3 texturePrefilteredSpecular( const in float roughness, const in vec3 direction ) {',

            '   MaxLOD = log2( envSpecularSize.x)-1.0;',
            '   float targetLod = roughness * MaxLOD;',

            '#if ' + textureRGBM.toString(),
            '   return texturePanoramicRGBMLod(envSpecular, envSpecularSize, envSpecularRange, direction, targetLod);',
            '#endif',
            '#if ' + textureRGBE.toString(),
            '   return texturePanoramicRGBELod(envSpecular, envSpecularSize, direction, targetLod);',
            '#endif',
            '}',

            'vec2 texturePrecomputedBRDF( const in float roughness, const in float nov ) {',
            '    vec4 rgba = texture2D(integrateBRDF, vec2( nov, roughness ) );',
            '    const float div = 1.0/65535.0;',
            '    float b = (rgba[3] * 65280.0 + rgba[2] * 255.0);',
            '    float a = (rgba[1] * 65280.0 + rgba[0] * 255.0);',
            '    return vec2( a, b ) * div;',
            '}',

            'vec3 lightSpecularIndirect( const in mat3 iblTransform, const in vec3 albedo, const in vec3 normal, const in vec3 view ) {',
            '  float NoV = max( 0.0, dot( normal, view ) );',
            '  vec3 R = 2.0 * dot( view, normal ) * normal - view;',
            '  float mult = hdrExposure;',
            '  vec3 prefilteredColor = texturePrefilteredSpecular( MaterialRoughness, iblTransform * R )* mult;',
            '  vec2 envBRDF = texturePrecomputedBRDF( MaterialRoughness, NoV );',
            '  return prefilteredColor * ( MaterialSpecular * envBRDF.x + envBRDF.y );',
            '',
            '}',

            'vec3 prefilteredAndLUT( const in mat3 iblTransform, const in vec3 E ) {',
            '  vec3 diffuseIndirect = MaterialAO * lightDiffuseIndirect( iblTransform, MaterialAlbedo, MaterialNormal );',
            '  vec3 specularIndirect = lightSpecularIndirect( iblTransform, MaterialAlbedo, MaterialNormal, E );',
            '  vec3 gammaCorrected = linearTosRGB( diffuseIndirect + specularIndirect, DefaultGamma);',
            '  return gammaCorrected;',
            '}',
            '#endif',

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
            '  MaterialAO = 1.0;',
            '#ifdef AO',
            ' MaterialAO = texture2D( aoMap, osg_FragTexCoord0 ).r;',
            ' //MaterialAO = sRGBToLinear( texture2D( aoMap, osg_FragTexCoord0 ), DefaultGamma ).rgb;',
            '#endif',

            '#ifdef SPECULAR',
            '  MaterialSpecular = sRGBToLinear( texture2D( specularMap, osg_FragTexCoord0 ), DefaultGamma ).rgb;',
            '#else',
            '  float metallic = texture2D( specularMap, osg_FragTexCoord0 ).r;',
            '  MaterialAlbedo = albedo * (1.0 - metallic);',
            '  MaterialSpecular = mix( dielectricColor, albedo, metallic);',
            '#endif',

            'vec4 result;',
            '#if ' + solid.toString(),
            '  result = vec4( solid( iblTransform, MaterialNormal, -E ), 1.0);',
            '#endif',
            '#if ' + prefilter.toString(),
            '  result = vec4( prefilteredAndLUT( iblTransform, -E ), 1.0);',
            '#endif',
            '#if ' + solid2.toString(),
            '  result = vec4( solid2( iblTransform, MaterialNormal, -E ), 1.0);',
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
                texture.setWrapS( 'REPEAT' );
                texture.setWrapT( 'REPEAT' );

                texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                texture.setMagFilter( 'LINEAR' );
                return texture;
            };

            Q.all( promises ).then( function ( args ) {
                args.forEach( function ( image, index ) {
                    model.getOrCreateStateSet().setTextureAttributeAndMode( index, createTexture( args[ index ] ) );
                } );

                defer.resolve( model );
            } );

            return defer.promise;
        };

        return this.getModel( 'model/Cerberus_by_Andrew_Maximov.osgjs.gz', callbackModel );
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
                texture.setWrapS( 'REPEAT' );
                texture.setWrapT( 'REPEAT' );

                texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                texture.setMagFilter( 'LINEAR' );

                texture.setImage( image );
                return texture;
            };

            Q.all( promises ).then( function ( args ) {
                args.forEach( function ( image, index ) {
                    model.getOrCreateStateSet().setTextureAttributeAndMode( index, createTexture( args[ index ] ) );
                } );

                model.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
                defer.resolve( model );
            } );

            return defer.promise;
        };

        var modelPromise = this.getModel( 'robot/Junkbot.osgjs.gz', callbackModel );
        Q( modelPromise ).then( function ( model ) {
            osg.Matrix.makeIdentity( model.getMatrix() );
        } );

        return modelPromise;
    },

    loadRobotModel2: function () {

        var self = this;

        var callbackModel = function ( model ) {

            var defer = Q.defer();

            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 4, 'aoMap' ) );

            var promises = [];
            promises.push( self.readImageURL( 'robot/Textures/map_A_2.jpg' ) );
            promises.push( self.readImageURL( 'robot/Textures/map_R_2.jpg' ) );

            promises.push( self.readImageURL( 'robot/Textures/map_N_2.jpg' ) );
            promises.push( self.readImageURL( 'robot/Textures/map_S_2.jpg' ) );
            promises.push( self.readImageURL( 'robot/Textures/map_AO_2.jpg' ) );

            var createTexture = function ( image ) {
                var texture = new osg.Texture();
                texture.setWrapS( 'REPEAT' );
                texture.setWrapT( 'REPEAT' );

                texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                texture.setMagFilter( 'LINEAR' );

                texture.setImage( image );
                return texture;
            };

            Q.all( promises ).then( function ( args ) {
                args.forEach( function ( image, index ) {
                    model.getOrCreateStateSet().setTextureAttributeAndMode( index, createTexture( args[ index ] ) );
                } );

                model.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
                defer.resolve( model );
            } );

            return defer.promise;
        };

        var modelPromise = this.getModel( 'robot/Junkbot.osgjs.gz', callbackModel );
        Q( modelPromise ).then( function ( model ) {
            osg.Matrix.makeIdentity( model.getMatrix() );
        } );

        return modelPromise;
    },

    loadCarModelSpecular: function () {

        var self = this;

        var callbackModel = function ( model ) {

            var defer = Q.defer();

            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 4, 'aoMap' ) );

            var promises = [];
            var base = 'hotrod2/';
            promises.push( self.readImageURL( base + 'hotrod_diffuse.png' ) );
            promises.push( self.readImageURL( base + 'hotrod_glossiness.png' ) );

            promises.push( self.readImageURL( base + 'hotrod_normal.png' ) );
            promises.push( self.readImageURL( base + 'hotrod_specular.png' ) );
            promises.push( self.readImageURL( base + 'hotrod_ao.png' ) );

            var createTexture = function ( image ) {
                var texture = new osg.Texture();
                texture.setWrapS( 'REPEAT' );
                texture.setWrapT( 'REPEAT' );

                texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                texture.setMagFilter( 'LINEAR' );
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

                model.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
                defer.resolve( model );
            } );

            return defer.promise;
        };



        return this.getModel( 'hotrod2/hotrod2.osgjs.gz', callbackModel );
    },



    loadCarModelMetallic: function () {
        var self = this;

        var callbackModel = function ( model ) {

            var defer = Q.defer();

            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 4, 'aoMap' ) );

            var promises = [];
            var base = 'hotrod2/';
            promises.push( self.readImageURL( base + 'hotrod_basecolor.png' ) );
            promises.push( self.readImageURL( base + 'hotrod_roughness.png' ) );

            promises.push( self.readImageURL( base + 'hotrod_normal.png' ) );
            promises.push( self.readImageURL( base + 'hotrod_metallic.png' ) );
            promises.push( self.readImageURL( base + 'hotrod_ao.png' ) );

            var createTexture = function ( image ) {
                var texture = new osg.Texture();
                texture.setWrapS( 'REPEAT' );
                texture.setWrapT( 'REPEAT' );

                texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                texture.setMagFilter( 'LINEAR' );
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

                model.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
                defer.resolve( model );
            }.bind(this) );

            return defer.promise;
        };
        return this.getModel( 'hotrod2/hotrod2.osgjs.gz', callbackModel );
    },



    loadC3POModel: function () {
        var self = this;

        var callbackModel = function ( model ) {

            var defer = Q.defer();

            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );
            // model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 4, 'aoMap' ) );

            var promises = [];
            var vers = '4k';
            if ( this._mobile )
                vers = '2k';
            var base = 'C3PO_head/textures/' + vers + '/';
            promises.push( self.readImageURL( base + 'c3po_D.tga.png' ) );
            promises.push( self.readImageURL( base + 'c3po_R.tga.png' ) );

            promises.push( self.readImageURL( base + 'c3po_N.tga.png' ) );
            promises.push( self.readImageURL( base + 'c3po_M.tga.png' ) );
            // promises.push( self.readImageURL( base + 'hotrod_ao.png' ) );

            var createTexture = function ( image ) {
                var texture = new osg.Texture();
                texture.setWrapS( 'REPEAT' );
                texture.setWrapT( 'REPEAT' );

                texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                texture.setMagFilter( 'LINEAR' );
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

                model.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
                defer.resolve( model );
            } );

            return defer.promise;
        };
        return this.getModel( 'C3PO_head/c3po.osgjs.gz', callbackModel );
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
                specular: [ 0.5, 0.5, 0.5 ], // plastic
                albedo: [ 0.6, 0.0, 0.0 ]
            }, {
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
            {
                specular: [ 0.659777, 0.608679, 0.525649 ], // Nickel
                albedo: [ 0, 0, 0 ]
            }, //  {
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

        var rootModel = new osg.Node();
        rootModel.addChild( group );
        return Q(rootModel);
    },


    loadMireScene: function () {
        var self = this;

        var callbackModel = function ( model ) {

            var defer = Q.defer();

            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 4, 'aoMap' ) );

            var promises = [];
            var base = 'mire/';
            promises.push( self.readImageURL( base + 'diffuse.png' ) );
            promises.push( self.readImageURL( base + 'roughness.png' ) );

            promises.push( self.readImageURL( base + 'normal.png' ) );
            promises.push( self.readImageURL( base + 'metallic.png' ) );

            var createTexture = function ( image ) {
                var texture = new osg.Texture();
                texture.setWrapS( 'REPEAT' );
                texture.setWrapT( 'REPEAT' );

                texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                texture.setMagFilter( 'LINEAR' );
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

                defer.resolve( model );
            } );

            return defer.promise;
        };

        var model = new osg.MatrixTransform();
        var geometry = osg.createTexturedQuadGeometry( -0.5, -0.5, 0,
                                                       1, 0,0,
                                                       0,1,0);
        geometry.getAttributes().Tangent = new osg.BufferArray('ARRAY_BUFFER',
                                                               [1,0,0,-1,
                                                                1,0,0,-1,
                                                                1,0,0,-1,
                                                                1,0,0,-1 ], 4);

        var mata = osg.Matrix.makeRotate( Math.PI/2, 0,0,1, osg.Matrix.create());
        var matb = osg.Matrix.makeRotate( -Math.PI/2.0, 1,0,0, model.getMatrix());
        osg.Matrix.mult( mata, matb, matb );
        model.addChild( geometry );
        model.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
        return callbackModel( model );
    },

    createHammersleyUniforms: function() {
        var sequence = this.computeHammersleySequence( this._configGUI.nbSamples );
        var uniformHammersley = osg.Uniform.createFloat2Array( sequence, 'hammersley' );
        this._stateSetScene.addUniform( uniformHammersley );
    },

    createScene: function () {
        var self = this;
        var group = new osg.Node();

        // HDR parameters uniform
        var uniformExposure = osg.Uniform.createFloat1( 1, 'hdrExposure' );

        var size = 500;
        this.getEnvSphere( size, group );

        this._stateSetScene = group.getOrCreateStateSet();

        group.getOrCreateStateSet().addUniform( uniformExposure );

        this.createHammersleyUniforms();

        var rootGraph = new osg.Node();

        var groupModel = new osg.MatrixTransform();
        this._stateSetEnvironment = groupModel.getOrCreateStateSet();

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

        var config = this._configModel;

        var setShaderModel = function ( value ) {
            var obj = this._configGUI;
            var index = this._modelList.indexOf( obj.model );
            if ( !config[ index ] || config[ index ].promise.isPending() )
                return;

            // set the value of the rendering changed
            if ( value )
                obj.rendering = value;

            // set the shader on the same stateSet than the model
            this.setModelShader( config[ index ].model, config[ index ].config, this._stateSetEnvironment );

        }.bind( this );

        // function called when selecting a model
        var setModel = function ( str ) {

            config.forEach( function ( entry ) {
                if ( !entry.promise || entry.promise.isPending() )
                    return;
                entry.model.setNodeMask( 0x0 );
            } );

            // force to update dat.gui config
            this._configGUI.model = str;

            var index = this._modelList.indexOf( str );
            config[ index ].model.setNodeMask( ~0x0 );

            setShaderModel();

            self._viewer.getManipulator().setNode( config[ index ].model );
            self._viewer.getManipulator().computeHomePosition();

        }.bind( this );

        // add all models to group
        config.forEach( function ( entry ) {
            entry.model.setNodeMask(0);
            groupModel.addChild( entry.model );
        } );


        // run loading sequencially
        config.reduce( function( previous, current ) {

            if (!previous) {
                this.modelStartLoading( current.name );

                var promise = current.func();
                current.promise = promise;

                promise.then( function( model ) {
                    current.model.addChild( model );
                    this.modelFinishLoading();

                }.bind( this ) );

                return current.promise;
            }

            var defer = Q.defer();
            previous.then( function() {
                var promise = current.func();
                current.promise = promise;
                promise.then( function( model ) {
                    current.model.addChild( model );
                    defer.resolve();
                });
            });
            return defer.promise;
        }.bind( this ) , undefined );

        config[0].promise.then( function() {
            setModel( config[0].name );
        }.bind( this ) );

        var gui = new window.dat.GUI();

        var obj = this._configGUI;
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


        controller = gui.add( obj, 'rotation', 0, 360 );
        controller.onChange( function ( value ) {
            osg.Matrix.makeRotate( value * Math.PI / 180.0, 0,0,1, groupModel.getMatrix() );
            groupModel.dirtyBound();
        } );


        controller = gui.add( obj, 'environment', this._environmentList );
        controller.onChange( function ( value ) {

            this.setEnvironment( value );

        }.bind( this ) );

        controller = gui.add( obj, 'textureMethod', [ 'RGBE', 'RGBM' ] );
        controller.onChange( function ( value ) {

            obj.textureMethod = value;
            setShaderModel();

        }.bind( this ) );

        controller = gui.add( obj, 'nbSamples', [ 1, 4, 8, 16, 32, 64 ] );
        controller.onChange( function ( value ) {

            obj.nbSamples = value;
            setShaderModel();

        }.bind( this ) );


        controller = gui.add( obj, 'model', this._modelList );
        controller.onChange( function ( value ) {

            setModel( value );

        }.bind( this ) );


        controller = gui.add( obj, 'rendering', [ 'prefilter', 'solid', 'solid2' ] );
        controller.onChange( setShaderModel );


        this.setEnvironment( 'Alexs_Apartment' );

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


        if ( options.model) {
            var array = this._configModel.filter( function( element ) {
                return ( element.name.toLowerCase() === options.model.toLowerCase() );
            });

            if ( array.length ) {
                this._configModel = array;
                this._modelList = this._configModel.map( function ( element ) {
                    return element.name;
                });
            }
        }

        if ( options.textureMethod) {
            this._configGUI.textureMethod = options.textureMethod;
        }

        if ( options.nbSamples) {
            this._configGUI.nbSamples = parseInt(options.nbSamples);
        }

        if ( options.rendering ) {
            this._configGUI.rendering = options.rendering;
        }

        if ( options.mobile  ) {
            this._mobile = 1;
        }
        if ( this._mobile )
            this._configGUI.nbSamples = 1;

        var opts = {
            useDevicePixelRatio: false
        };

        var viewer;
        viewer = new osgViewer.Viewer( canvas, opts );
        this._viewer = viewer;
        viewer.init();

        var gl = viewer.getState().getGraphicContext();
        console.log ( gl.getExtension('OES_texture_float') );
        console.log ( gl.getExtension('OES_texture_float_linear') );
        console.log ( gl.getExtension('EXT_shader_texture_lod') );

        var rotate = new osg.MatrixTransform();

        //var nbVectors = viewer.getWebGLCaps().getWebGLParameter( 'MAX_FRAGMENT_UNIFORM_VECTORS' );
        //this.referenceNbSamples = Math.min( nbVectors - 20, this.referenceNbSamples );

        rotate.addChild( this.createScene() );

        this._rootNode = new osg.Node();
        this._rootNode.addChild(rotate);
        viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );

        // only clear depth because we have a background
        viewer.getCamera().setClearMask( osg.Camera.DEPTH_BUFFER_BIT );

        viewer.setSceneData( this._rootNode );
        viewer.setupManipulator();
        viewer.getManipulator().computeHomePosition();

        viewer.run();
    },

    getShaderBackground: function () {

        var vertexshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'attribute vec3 Vertex;',
            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',

            'varying vec3 osg_FragVertex;',

            'void main(void) {',
            '  osg_FragVertex = Vertex;',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
            '}'
        ].join( '\n' );

        var fragmentshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',

            this.getCommonShader(),

            this.getTextureEnvFunctions(),

            'uniform float hdrExposure;',
            'varying vec3 osg_FragVertex;',

            'void main(void) {',
            '  vec3 direction = normalize(osg_FragVertex.xyz);',
            '  vec2 uv = normalToSphericalUV( direction );',
            '  vec3 c = hdrExposure * texture2D( envBackground, uv).rgb;',
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
        var self = this;

        // create the environment sphere
        //var geom = osg.createTexturedSphere(size, 32, 32);
        var geom = osg.createTexturedBoxGeometry( 0, 0, 0, size, size, size );
        this._stateSetBackground = geom.getOrCreateStateSet();
        geom.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
        geom.getOrCreateStateSet().setAttributeAndModes( new osg.Depth(0, 0, 1, false) );
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
        cam.setClearMask( 0x0 );
        cam.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
        cam.addChild( mt );

        // the update callback get exactly the same view of the camera
        // but configure the projection matrix to always be in a short znear/zfar range to not vary depend on the scene size
        var UpdateCallback = function () {
            this.update = function ( node, nv ) {
                var rootCam = self._viewer.getCamera();

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
                            //removeLoading( node, child );
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
                        // removeLoading( node );
                        osg.log( 'error ' + url );
                        defer.reject( node );
                    }
                }
            }.bind( this );
            req.send( null );
            // addLoading();

            return defer.promise;

        }.bind( this );

        return loadModel( url, callback );
    },

    readImageURL: function ( url, options ) {
        var ext = url.split( '.' ).pop();
        if ( ext === 'hdr' )
            return osgDB.readImageHDR( url, options );

        return osgDB.readImageURL.call( this, url, options );
    }


};


// convert rgbe image to mipmap

var NodeGenerateMipMapRGBE = function( texture ) {
    osg.Node.call( this );
    this._texture = texture;

    var nbMip = Math.log( this._texture.getImage().getWidth() )/Math.log(2);
    this._nbMipmap = nbMip - 1;

    var UpdateCallback = function() {
        this._done = false;
        this.update = function(node, nodeVisitor) {

            if ( nodeVisitor.getVisitorType() === osg.NodeVisitor.UPDATE_VISITOR ) {
                if ( this._done )
                    node.setNodeMask(0);
                else
                    this.done = true;
            }
        };
    };
    this.setUpdateCallback( new UpdateCallback () );

};

NodeGenerateMipMapRGBE.prototype = osg.objectInherit( osg.Node.prototype, {

    createSubGraph: function( sourceTexture, destinationTexture, color) {
        var composer = new osgUtil.Composer();
        var reduce = new osgUtil.Composer.Filter.Custom([
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
            ''].join('\n'), {
                'source': sourceTexture,
                'color': color
            });

        composer.addPass(reduce, destinationTexture);
        composer.build();
        return composer;
    },

    createSubGraphFinal: function( sourceTexture, destinationTexture) {

        var composer = new osgUtil.Composer();
        var copy = new osgUtil.Composer.Filter.Custom([
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
            ''].join('\n'), {
                'source': sourceTexture,
                'destSize': destinationTexture.getWidth(),
                'sourceSize': sourceTexture.getWidth()
            });

        composer.addPass( copy, destinationTexture);
        composer.build();
        return composer;
    },

    init: function() {

        var sourceTexture = this._texture;
        var finalTexture = new osg.Texture();
        finalTexture.setMinFilter( 'NEAREST' );
        finalTexture.setMagFilter( 'NEAREST' );

        this._finalTexture = finalTexture;

        var maxSize = Math.pow(2, this._nbMipmap);
        finalTexture.setTextureSize( maxSize, maxSize );

        var colors = [
            [ 1, 0, 0],
            [ 0, 1, 0],
            [ 0, 0, 1]
        ];

        var root = new osg.Node();

        for ( var i = 0; i < this._nbMipmap; i++ ) {
            var size = Math.pow(2, this._nbMipmap - i);

            var destinationTexture = new osg.Texture();
            destinationTexture.setMinFilter( 'NEAREST' );
            destinationTexture.setMagFilter( 'NEAREST' );

            destinationTexture.setTextureSize( size, size / 2 );
            var node = this.createSubGraph( sourceTexture, destinationTexture, colors[i%3] );

            var final = this.createSubGraphFinal( destinationTexture, finalTexture);
            node.addChild( final );
            root.addChild( node );
            sourceTexture = destinationTexture;
        }

        this.addChild ( root );
    }


});


// convert rgbe image to float texture
var TransformRGBE2FloatTexture = function( texture ) {
    osg.Node.call( this );
    this._texture = texture;


    var UpdateCallback = function() {
        this._done = false;
        this.update = function(node, nodeVisitor) {

            if ( nodeVisitor.getVisitorType() === osg.NodeVisitor.UPDATE_VISITOR ) {
                if ( this._done )
                    node.setNodeMask(0);
                else
                    this.done = true;
            }
        };
    };
    this.setUpdateCallback( new UpdateCallback () );

};

TransformRGBE2FloatTexture.prototype = osg.objectInherit( osg.Node.prototype, {

    createSubGraph: function( sourceTexture, destinationTexture, color) {
        var composer = new osgUtil.Composer();
        var reduce = new osgUtil.Composer.Filter.Custom([
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
            '  //gl_FragColor = vec4(vec3(1.0,0.0,1.0), 1.0);',
            '  gl_FragColor = vec4(decode, 1.0);',
            '}',
            ''].join('\n'), {
                'source': sourceTexture,
                'color': color
            });

        composer.addPass(reduce, destinationTexture);
        composer.build();
        return composer;
    },


    init: function() {

        var sourceTexture = this._texture;
        var finalTexture = new osg.Texture();
        finalTexture.setTextureSize( sourceTexture.getImage().getWidth(), sourceTexture.getImage().getHeight() );
        finalTexture.setType( 'FLOAT' );
         finalTexture.setMinFilter( 'LINEAR' );
         finalTexture.setMagFilter( 'LINEAR' );
         // finalTexture.setMinFilter( 'LINEAR' );
         // finalTexture.setMagFilter( 'LINEAR' );

        this._finalTexture = finalTexture;
        var composer = this.createSubGraph( sourceTexture, finalTexture, [ 5,0,5]);
        this.addChild( composer );

        // add an attribute to work around this bug
        // https://github.com/cedricpinson/osgjs/issues/78
        composer.getOrCreateStateSet().setAttributeAndModes( new osg.Viewport( 0,0,finalTexture.getWidth(), finalTexture.getHeight()));

    }


});




window.addEventListener( 'load', function () {
    var example = new PBRExample();
    example.run();
}, true );

#ifdef GL_ES
precision highp float;
#endif

varying vec4 VertexColor;
uniform float ArrayColorEnabled;
vec4 fragColor;
varying vec3 FragNormal;
varying vec3 FragEyeVector;

uniform float debug;

uniform int Light0_uniform_enable;
uniform vec4 Light0_uniform_position;
uniform vec3 Light0_uniform_direction;
uniform mat4 Light0_uniform_matrix;
uniform mat4 Light0_uniform_invMatrix;
uniform float Light0_uniform_constantAttenuation;
uniform float Light0_uniform_linearAttenuation;
uniform float Light0_uniform_quadraticAttenuation;
uniform vec4 Light0_uniform_ambient;
uniform vec4 Light0_uniform_diffuse;
uniform vec4 Light0_uniform_specular;
uniform float Light0_uniform_spotCutoff;
uniform float Light0_uniform_spotBlend;

uniform int Light1_uniform_enable;
uniform vec4 Light1_uniform_position;
uniform vec3 Light1_uniform_direction;
uniform mat4 Light1_uniform_matrix;
uniform mat4 Light1_uniform_invMatrix;
uniform float Light1_uniform_constantAttenuation;
uniform float Light1_uniform_linearAttenuation;
uniform float Light1_uniform_quadraticAttenuation;
uniform vec4 Light1_uniform_ambient;
uniform vec4 Light1_uniform_diffuse;
uniform vec4 Light1_uniform_specular;
uniform float Light1_uniform_spotCutoff;
uniform float Light1_uniform_spotBlend;

uniform int Light2_uniform_enable;
uniform vec4 Light2_uniform_position;
uniform vec3 Light2_uniform_direction;
uniform mat4 Light2_uniform_matrix;
uniform mat4 Light2_uniform_invMatrix;
uniform float Light2_uniform_constantAttenuation;
uniform float Light2_uniform_linearAttenuation;
uniform float Light2_uniform_quadraticAttenuation;
uniform vec4 Light2_uniform_ambient;
uniform vec4 Light2_uniform_diffuse;
uniform vec4 Light2_uniform_specular;
uniform float Light2_uniform_spotCutoff;
uniform float Light2_uniform_spotBlend;

uniform vec4 MaterialAmbient;
uniform vec4 MaterialDiffuse;
uniform vec4 MaterialSpecular;
uniform vec4 MaterialEmission;
uniform float MaterialShininess;

uniform vec4 Shadow_MapSize0;
uniform vec4 Shadow_MapSize1;
uniform vec4 Shadow_MapSize2;

uniform vec4 Shadow_DepthRange0;
uniform vec4 Shadow_DepthRange1;
uniform vec4 Shadow_DepthRange2;

uniform sampler2D Texture0;
uniform sampler2D Texture1;
uniform sampler2D Texture2;
uniform sampler2D Texture3;

varying vec4 Shadow_VertexProjected0;
varying vec4 Shadow_VertexProjected1;
varying vec4 Shadow_VertexProjected2;

varying vec4 Shadow_Z0;
varying vec4 Shadow_Z1;
varying vec4 Shadow_Z2;

varying vec2 FragTexCoord0;


#pragma include "floatrgbacodec.glsl"
#pragma include "common.frag"
#pragma include "shadow.glsl"

 float texture2DCompare(sampler2D depths, vec2 uv, float compare){
    float depth = DecodeFloatRGBA(texture2D(depths, uv));
    return step(compare, depth);
}

float texture2DShadowLerp(sampler2D depths, vec4 size, vec2 uv, float compare){
    vec2 texelSize = vec2(1.0)*size.zw;
    vec2 f = fract(uv*size.xy+0.5);
    vec2 centroidUV = floor(uv*size.xy+0.5)*size.zw;

    float lb = texture2DCompare(depths, centroidUV+texelSize*vec2(0.0, 0.0), compare);
    float lt = texture2DCompare(depths, centroidUV+texelSize*vec2(0.0, 1.0), compare);
    float rb = texture2DCompare(depths, centroidUV+texelSize*vec2(1.0, 0.0), compare);
    float rt = texture2DCompare(depths, centroidUV+texelSize*vec2(1.0, 1.0), compare);
    float a = mix(lb, lt, f.y);
    float b = mix(rb, rt, f.y);
    float c = mix(a, b, f.x);
    return c;
}

float PCFLerp(sampler2D depths, vec4 size, vec2 uv, float compare){
    float result = 0.0;
    for(int x=-1; x<=1; x++){
        for(int y=-1; y<=1; y++){
            vec2 off = vec2(x,y)*size.zw;
            result += texture2DShadowLerp(depths, size, uv+off, compare);
        }
    }
    return result/9.0;
}

float PCF(sampler2D tex, vec4 shadowMapSize, vec2 shadowUV, float shadowZ) {
    vec2 o = shadowMapSize.zw;
    float shadowed = 0.0;

    vec2 fetch[16];
    fetch[0] = shadowUV.xy + vec2(-1.5, -1.5)*o;
    fetch[1] = shadowUV.xy + vec2(-0.5, -1.5)*o;
    fetch[2] = shadowUV.xy + vec2(0.5, -1.5)*o;
    fetch[3] = shadowUV.xy + vec2(1.5, -1.5)*o;
    fetch[4] = shadowUV.xy + vec2(-1.5, -0.5)*o;
    fetch[5] = shadowUV.xy + vec2(-0.5, -0.5)*o;
    fetch[6] = shadowUV.xy + vec2(0.5, -0.5)*o;
    fetch[7] = shadowUV.xy + vec2(1.5, -0.5)*o;
    fetch[8] = shadowUV.xy + vec2(-1.5, 0.5)*o;
    fetch[9] = shadowUV.xy + vec2(-0.5, 0.5)*o;
    fetch[10] = shadowUV.xy + vec2(0.5, 0.5)*o;
    fetch[11] = shadowUV.xy + vec2(1.5, 0.5)*o;
    fetch[12] = shadowUV.xy + vec2(-1.5, 1.5)*o;
    fetch[13] = shadowUV.xy + vec2(-0.5, 1.5)*o;
    fetch[14] = shadowUV.xy + vec2(0.5, 1.5)*o;
    fetch[15] = shadowUV.xy + vec2(1.5, 1.5)*o;
    for(int i = 0; i < 16; i++) {
       float zz = DecodeFloatRGBA(texture2D(tex, fetch[i]));
       shadowed += step(shadowZ , zz);
     }
    shadowed = shadowed / 16.0;
    return shadowed;
}

float getShadowedTermPCFLerp(vec2 uv, float shadowZ, sampler2D tex, vec4 texSize) {
    float d = PCFLerp(tex, texSize, uv, shadowZ - 0.001) ;
    return d;
}
float getShadowedTermPCF(vec2 uv, float shadowZ, sampler2D tex, vec4 texSize) {
    float d = PCF(tex, texSize, uv, shadowZ - 0.001);
    return d;
}

float getShadowedTerm(vec2 uv, float shadowZ, sampler2D tex) {
    float d = shadowZ - DecodeFloatRGBA(texture2D(tex, uv));
    return (d >= 0.001) ? (0.0) : (1.0);
}

float getShadowedTermUnified(vec2 shadowUV, float shadowZ, sampler2D tex, vec4 shadowMapSize) {
  //
  // Calculate shadow amount
  //vec2 uv, float shadowZ, sampler2D tex
  vec3 depth = vec3(shadowUV.xy, shadowZ);
  float shadow = 1.0;
   #define _ESM
    #ifdef _NONE
        // "Peter Panning"/"Shadow Acne"
        depth.z *= 0.96;
        float shadowDepth = DecodeFloatRGBA(texture2D(tex, shadowUV.xy));
        if ( depth.z > shadowDepth )
            shadow = 0.0;
    #elif defined( _PCF )
        // "Peter Panning"/"Shadow Acne"
      depth.z *= 0.96;
      for (int y = -1; y <= 1; ++y)
      {
        for (int x = -1; x <= 1; ++x)
        {
          vec2 offset = depth.xy + vec2(float(x) * shadowMapSize.z, float(y) * shadowMapSize.w);
          if ( (offset.x >= 0.0) && (offset.x <= 1.0) && (offset.y >= 0.0) && (offset.y <= 1.0) )
          {
            // Decode from RGBA to float
            float shadowDepth = DecodeFloatRGBA(texture2D(tex, offset));
            if ( depth.z > shadowDepth )
              shadow *= 0.9;
          }
        }
      }
    #elif defined( _ESM )
      //http://research.edm.uhasselt.be/tmertens/papers/gi_08_esm.pdf
      float c = 80.0;
      vec4 texel = texture2D(tex, depth.xy);
      shadow = clamp(exp(-c * (depth.z - DecodeFloatRGBA(texel))), 0.0, 1.0);
      shadow = (1.0 - shadow >= 0.001) ? (0.0) : (1.0);
      //shadow *= 0.9;
    #elif  defined( _VSM )
      vec4 texel = texture2D(tex, depth.xy);
      vec2 moments = DecodeHalfFloatRGBA(texel);
      shadow = ChebychevInequality(moments, depth.z);
      shadow = (1.0 - shadow >= 0.001) ? (0.0) : (1.0);
    #elif  defined( _EVSM )
      vec4 texel = texture2D(tex, depth.xy);
      vec2 moments = DecodeHalfFloatRGBA(texel);
      shadow = ChebychevInequality(moments, depth.z);
      shadow = (1.0 - shadow >= 0.001) ? (0.0) : (1.0);
    #endif

    return shadow;
}

float computeShadowTerm(vec4 shadowVertexProjected, vec4 shadowZ, sampler2D tex, vec4 texSize, vec4 depthRange, vec4 LightPosition) {
    float shadowed = 0.0;
    vec4 shadowUV;
    shadowUV = shadowVertexProjected / shadowVertexProjected.w;
    shadowUV.xy = shadowUV.xy* 0.5 + 0.5;


    if (shadowUV.x > 1.0 || shadowUV.y > 1.0 || shadowUV.x < 0.0 || shadowUV.y < 0.0)
     return 1.0;// 0.0 to show limits of light frustum

    //float depth = length(shadowZ.xyz);
    float depth = -shadowZ.z;
    //float depth = length(shadowZ.xyzw - LightPosition);
    depth =  (depth - depthRange.x)* depthRange.w;// linerarize (aka map z to near..far to 0..1)
    depth =   clamp(depth, 0.0, 1.0);
    return getShadowedTermUnified(shadowUV.xy, depth, tex, texSize);
    /*
    #define _PCF
      #ifdef _PCF
      //#define _PCFLERP
      #ifdef _PCFLERP
        return getShadowedTermPCFLerp(shadowUV.xy, depth, tex, texSize);
      #else
        return getShadowedTermPCF(shadowUV.xy, depth, tex, texSize);
      #endif
    #else // only one fetch to debug
        return getShadowedTerm(shadowUV.xy, depth, tex);
    #endif
    */
}




void main(void) {
    fragColor = VertexColor;
    vec4 diffuse = (debug == 0.0) ? vec4(1.0, 1.0, 1.0, 1.0) : texture2D(Texture0, FragTexCoord0.xy);
    if (diffuse.x != 0.0 && diffuse.y != 0.0 && diffuse.z != 0.0)
      fragColor *= diffuse;


    vec3 normal = normalize(FragNormal);
    vec3 eyeVector = normalize(-FragEyeVector);
    vec3 Light0_lightEye = vec3(Light0_uniform_matrix * Light0_uniform_position);
    vec3 Light0_lightDir;
    if (Light0_uniform_position[3] == 1.0) {
        Light0_lightDir = Light0_lightEye - FragEyeVector;
    } else {
        Light0_lightDir = Light0_lightEye;
    }
    vec3 Light0_spotDirection = normalize(mat3(vec3(Light0_uniform_invMatrix[0]), vec3(Light0_uniform_invMatrix[1]), vec3(Light0_uniform_invMatrix[2])) * Light0_uniform_direction);
    float Light0_attenuation = getLightAttenuation(Light0_lightDir, Light0_uniform_constantAttenuation, Light0_uniform_linearAttenuation, Light0_uniform_quadraticAttenuation);
    Light0_lightDir = normalize(Light0_lightDir);
    vec4 LightColor0 = computeLightContribution(MaterialAmbient,  MaterialDiffuse,  MaterialSpecular,  MaterialShininess,  Light0_uniform_ambient,  Light0_uniform_diffuse,  Light0_uniform_specular,  normal,  eyeVector,  Light0_lightDir,  Light0_spotDirection,  Light0_uniform_spotCutoff,  Light0_uniform_spotBlend,  Light0_attenuation);


    vec4 lightColor1 = MaterialEmission;
    vec3 Light1_lightEye = vec3(Light1_uniform_matrix * Light1_uniform_position);
    vec3 Light1_lightDir;
    if (Light1_uniform_position[3] == 1.0) {
        Light1_lightDir = Light1_lightEye - FragEyeVector;
    } else {
        Light1_lightDir = Light1_lightEye;
    }
    vec3 Light1_spotDirection = normalize(mat3(vec3(Light1_uniform_invMatrix[0]), vec3(Light1_uniform_invMatrix[1]), vec3(Light1_uniform_invMatrix[2])) * Light1_uniform_direction);
    float Light1_attenuation = getLightAttenuation(Light1_lightDir, Light1_uniform_constantAttenuation, Light1_uniform_linearAttenuation, Light1_uniform_quadraticAttenuation);
    Light1_lightDir = normalize(Light1_lightDir);
    vec4 LightColor1 = computeLightContribution(MaterialAmbient,  MaterialDiffuse,  MaterialSpecular,  MaterialShininess,  Light1_uniform_ambient,  Light1_uniform_diffuse,  Light1_uniform_specular,  normal,  eyeVector,  Light1_lightDir,  Light1_spotDirection,  Light1_uniform_spotCutoff,  Light1_uniform_spotBlend,  Light1_attenuation);



    vec3 Light2_lightEye = vec3(Light2_uniform_matrix * Light2_uniform_position);
    vec3 Light2_lightDir;
    if (Light2_uniform_position[3] == 1.0) {
        Light2_lightDir = Light2_lightEye - FragEyeVector;
    } else {
        Light2_lightDir = Light2_lightEye;
    }
    vec3 Light2_spotDirection = normalize(mat3(vec3(Light2_uniform_invMatrix[0]), vec3(Light2_uniform_invMatrix[1]), vec3(Light2_uniform_invMatrix[2])) * Light2_uniform_direction);
    float Light2_attenuation = getLightAttenuation(Light2_lightDir, Light2_uniform_constantAttenuation, Light2_uniform_linearAttenuation, Light2_uniform_quadraticAttenuation);
    Light2_lightDir = normalize(Light2_lightDir);
    vec4 LightColor2 = computeLightContribution(MaterialAmbient,
    MaterialDiffuse,
    MaterialSpecular,
    MaterialShininess,
    Light2_uniform_ambient,
    Light2_uniform_diffuse,
    Light2_uniform_specular,
    normal,
    eyeVector,
    Light2_lightDir,
    Light2_spotDirection,
    Light2_uniform_spotCutoff,
    Light2_uniform_spotBlend,
    Light2_attenuation);


    vec4 nullColor = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 lightColor = nullColor;
//#define PURE
#ifdef PURE
  //#define LIGHT_ONLY
  #ifdef LIGHT_ONLY
      lightColor += Light0_uniform_enable == 0 ? nullColor : LightColor0;
      lightColor += Light1_uniform_enable == 0 ? nullColor : LightColor1;
      lightColor += Light2_uniform_enable == 0 ? nullColor : LightColor2;

  #else
      #define SHADOW_ONLY
      #ifdef SHADOW_ONLY
          lightColor += Light0_uniform_enable == 0 ? nullColor : vec4(1.0, 1.0, 1.0, 1.0) * computeShadowTerm(Shadow_VertexProjected0, Shadow_Z0, Texture1, Shadow_MapSize0, Shadow_DepthRange0, Light0_uniform_position);
          lightColor += Light1_uniform_enable == 0 ? nullColor : vec4(1.0, 1.0, 1.0, 1.0) * computeShadowTerm(Shadow_VertexProjected1, Shadow_Z1, Texture2, Shadow_MapSize1, Shadow_DepthRange1, Light1_uniform_position);
          lightColor += Light2_uniform_enable == 0 ? nullColor : vec4(1.0, 1.0, 1.0, 1.0) * computeShadowTerm(Shadow_VertexProjected2, Shadow_Z2, Texture3, Shadow_MapSize2, Shadow_DepthRange2, Light2_uniform_position);

      #else
          lightColor += Light0_uniform_enable == 0 ? nullColor : (LightColor0 * 0.5 + 0.5 * (computeShadowTerm(Shadow_VertexProjected0, Shadow_Z0, Texture1, Shadow_MapSize0, Shadow_DepthRange0, Light0_uniform_position)));
          lightColor += Light1_uniform_enable == 0 ? nullColor : (LightColor1 * 0.5 + 0.5 * (computeShadowTerm(Shadow_VertexProjected1, Shadow_Z1, Texture2, Shadow_MapSize1, Shadow_DepthRange1, Light1_uniform_position)));
          lightColor += Light2_uniform_enable == 0 ? nullColor : (LightColor2 * 0.5 + 0.5 * (computeShadowTerm(Shadow_VertexProjected2, Shadow_Z2, Texture3, Shadow_MapSize2, Shadow_DepthRange2, Light2_uniform_position)));
      #endif
  #endif
#else
      lightColor += Light0_uniform_enable == 0 ? nullColor : (LightColor0 * (computeShadowTerm(Shadow_VertexProjected0, Shadow_Z0, Texture1, Shadow_MapSize0, Shadow_DepthRange0, Light0_uniform_position)));
      lightColor += Light1_uniform_enable == 0 ? nullColor : (LightColor1 * (computeShadowTerm(Shadow_VertexProjected1, Shadow_Z1, Texture2, Shadow_MapSize1, Shadow_DepthRange1, Light1_uniform_position)));
      lightColor += Light2_uniform_enable == 0 ? nullColor : (LightColor2 * (computeShadowTerm(Shadow_VertexProjected2, Shadow_Z2, Texture3, Shadow_MapSize2, Shadow_DepthRange2, Light2_uniform_position)));
#endif

    fragColor = linearrgb_to_srgb(MaterialEmission + fragColor * lightColor);

    gl_FragColor = fragColor;
}
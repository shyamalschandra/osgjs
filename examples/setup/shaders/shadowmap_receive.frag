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

vec4 shadowPCF(sampler2D tex, vec4 shadowMapSize, vec2 shadowUV) {
    vec2 o = shadowMapSize.zw;
    vec4 c = texture2D(tex, shadowUV.xy); // center
    c += texture2D(tex, shadowUV.xy - o.xy); // top left
    c += texture2D(tex, shadowUV.xy + o.xy); // bottom right
    c += texture2D(tex, vec2(shadowUV.x - o.x, shadowUV.y)); // left
    c += texture2D(tex, vec2(shadowUV.x + o.x, shadowUV.y)); // right
    c += texture2D(tex, vec2(shadowUV.x, shadowUV.y + o.y)); // bottom
    c += texture2D(tex, vec2(shadowUV.x, shadowUV.y - o.y)); // top
    c += texture2D(tex, vec2(shadowUV.x - o.x, shadowUV.y + o.y)); // bottom left
    c += texture2D(tex, vec2(shadowUV.x + o.x, shadowUV.y - o.y)); // top right
    c /= 9.0;

    return c;
}
float getShadowedTermPCF(vec2 uv, float shadowZ, sampler2D tex, vec4 texSize) {
    float d = shadowZ - DecodeFloatRGBA(shadowPCF(tex, texSize, uv)) ;
    return (d >= 0.001) ? (0.0) : (1.0);
}

float getShadowedTerm(vec2 uv, float shadowZ, sampler2D tex) {
    float d = shadowZ - DecodeFloatRGBA(texture2D(tex, uv));
    return (d >= 0.001) ? (0.0) : (1.0);
}

float computeShadowTerm(vec4 shadowVertexProjected, vec4 shadowZ, sampler2D tex, vec4 texSize, vec4 depthRange) {
    float shadowed = 0.0;
    vec4 shadowUV = shadowVertexProjected / shadowVertexProjected.w;
   
    shadowUV.xy = shadowUV.xy* 0.5 + 0.5;
     // show limits of light frustum, 
    if (shadowUV.x >= 1.0 || shadowUV.y >= 1.0 || shadowUV.x <= 0.0 || shadowUV.y <= 0.0)
     return 0.0;
    float depth = length(shadowZ.xyz);
    depth =  (depth - depthRange.x)* depthRange.w;// linerarize (aka map z to near..far to 0..1)
   // depth =   clamp(depth, 0.0, 1.0);
  // #define SIMPLE
    #ifndef SIMPLE
      return getShadowedTermPCF(shadowUV.xy, depth, tex, texSize);
    #else // only one fetch to debug
        return getShadowedTerm(shadowUV.xy, depth, tex);
    #endif
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
      //#define SHADOW_ONLY
      #ifdef SHADOW_ONLY
          lightColor += Light0_uniform_enable == 0 ? nullColor : vec4(1.0, 1.0, 1.0, 1.0) * computeShadowTerm(Shadow_VertexProjected0, Shadow_Z0, Texture1, Shadow_MapSize0, Shadow_DepthRange0);
          lightColor += Light1_uniform_enable == 0 ? nullColor : vec4(1.0, 1.0, 1.0, 1.0) * computeShadowTerm(Shadow_VertexProjected1, Shadow_Z1, Texture2, Shadow_MapSize1, Shadow_DepthRange1);
          lightColor += Light2_uniform_enable == 0 ? nullColor : vec4(1.0, 1.0, 1.0, 1.0) * computeShadowTerm(Shadow_VertexProjected2, Shadow_Z2, Texture3, Shadow_MapSize2, Shadow_DepthRange2);

      #else
          lightColor += Light0_uniform_enable == 0 ? nullColor : (LightColor0 * 0.5 + 0.5 * (computeShadowTerm(Shadow_VertexProjected0, Shadow_Z0, Texture1, Shadow_MapSize0, Shadow_DepthRange0)));
          lightColor += Light1_uniform_enable == 0 ? nullColor : (LightColor1 * 0.5 + 0.5 * (computeShadowTerm(Shadow_VertexProjected1, Shadow_Z1, Texture2, Shadow_MapSize1, Shadow_DepthRange1)));
          lightColor += Light2_uniform_enable == 0 ? nullColor : (LightColor2 * 0.5 + 0.5 * (computeShadowTerm(Shadow_VertexProjected2, Shadow_Z2, Texture3, Shadow_MapSize2, Shadow_DepthRange2)));
      #endif  
  #endif
#else
      lightColor += Light0_uniform_enable == 0 ? nullColor : (LightColor0 * (computeShadowTerm(Shadow_VertexProjected0, Shadow_Z0, Texture1, Shadow_MapSize0, Shadow_DepthRange0)));
      lightColor += Light1_uniform_enable == 0 ? nullColor : (LightColor1 * (computeShadowTerm(Shadow_VertexProjected1, Shadow_Z1, Texture2, Shadow_MapSize1, Shadow_DepthRange1)));
      lightColor += Light2_uniform_enable == 0 ? nullColor : (LightColor2 * (computeShadowTerm(Shadow_VertexProjected2, Shadow_Z2, Texture3, Shadow_MapSize2, Shadow_DepthRange2)));
#endif

    fragColor = linearrgb_to_srgb(MaterialEmission + fragColor * lightColor);

    gl_FragColor = fragColor;
}
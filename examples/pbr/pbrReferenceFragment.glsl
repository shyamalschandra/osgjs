#define PI 3.1415926535897932384626433832795
#define PI_2 (2.0*3.1415926535897932384626433832795)
#define INV_PI 1.0/PI
#define INV_LOG2 1.4426950408889634073599246810019

uniform mat4 uEnvironmentTransform;
uniform sampler2D uEnvironment;
uniform vec2 uEnvironmentSize;
uniform float uEnvironmentMaxLod;
uniform float uLod;

varying vec3 osg_FragEye;
varying vec3 osg_FragNormal;
varying vec2 osg_FragTexCoord0;
varying vec4 osg_FragTangent;

mat3 environmentTransform;

uniform sampler2D albedoMap;
uniform sampler2D roughnessMap;
uniform sampler2D normalMap;
uniform sampler2D specularMap;
uniform sampler2D aoMap;


#pragma include "colorSpace.glsl"
#pragma include "panoramaSampler.glsl"

vec3 getReferenceTexelEnvironment( const in vec3 dirLocal, const in float lod ) {

    vec3 direction = environmentTransform * dirLocal;
    vec2 uvBase = normalToPanoramaUV( direction );
    vec3 texel = texturePanoramicRGBELod( uEnvironment,
                                          uEnvironmentSize,
                                          direction,
                                          lod,
                                          uEnvironmentMaxLod );
    return texel;
}

#pragma include "pbr.glsl"


mat3 getEnvironmentTransfrom( mat4 transform ) {
    vec3 x = vec3(transform[0][0], transform[1][0], transform[2][0]);
    vec3 y = vec3(transform[0][1], transform[1][1], transform[2][1]);
    vec3 z = vec3(transform[0][2], transform[1][2], transform[2][2]);
    mat3 m = mat3(x,y,z);
    return m;
}

vec3 computeNormalFromTangentSpaceNormalMap(const in vec4 tangent, const in vec3 normal, const in vec3 texnormal)
{
    vec3 tang = vec3(0.0,1.0,0.0);
    if (length(tangent.xyz) != 0.0) {
        tang = normalize(tangent.xyz);
    }
    vec3 B = -tangent.w * cross(normal, tang);
    vec3 outnormal = texnormal.x*tang + texnormal.y*B + texnormal.z*normal;
    return normalize(outnormal);
}

void main(void) {

    vec3 normal = normalize(osg_FragNormal);
    vec3 eye = normalize(osg_FragEye);
    vec4 tangent = osg_FragTangent;
    vec2 uv = osg_FragTexCoord0.xy;

    environmentTransform = getEnvironmentTransfrom( uEnvironmentTransform );

    const vec3 dielectricColor = vec3(0.04);
    float minRoughness = 1.e-4;

    vec4 albedoSource = texture2D( albedoMap, uv ).rgba;
    vec3 albedo = sRGBToLinear( albedoSource.rgb, DefaultGamma );

#ifdef NORMAL
    vec3 normalTexel = texture2D( normalMap, uv ).rgb;

    if ( length(normalTexel) > 0.0001 ) {
        normalTexel = fixTextureNormal( normalTexel );
        normal = computeNormalFromTangentSpaceNormalMap( tangent, normal, normalTexel );
    }
#endif

    float roughness = texture2D( roughnessMap, uv ).r;

#ifdef GLOSSINESS
    roughness = 1.0 - roughness;
#endif

    roughness = max( minRoughness , roughness );
    float ao = 1.0;

#ifdef AO
    ao = texture2D( aoMap, uv ).r;
#endif

    vec3 specular;

#ifdef SPECULAR
    specular = sRGBToLinear( texture2D( specularMap, osg_FragTexCoord0 ), DefaultGamma ).rgb;
#else
    float metallic = texture2D( specularMap, uv ).r;
    vec3 albedoReduced = albedo * (1.0 - metallic);
    specular = mix( dielectricColor, albedo, metallic);
    albedo = albedoReduced;
#endif

    vec4 result = vec4( referenceIBL( tangent, normal, -eye, albedo, roughness, specular ), 1.0);

    gl_FragColor = result;
}

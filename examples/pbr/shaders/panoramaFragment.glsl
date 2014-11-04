
#define PI 3.1415926535897932384626433832795
#define PI_2 (2.0*3.1415926535897932384626433832795)
#define INV_PI 1.0/PI
#define INV_LOG2 1.4426950408889634073599246810019

uniform sampler2D uEnvironment;
uniform vec2 uEnvironmentSize;
uniform vec2 uIrradianceSize;
uniform float uEnvironmentMaxLod;
uniform float uLod;

uniform mat4 uEnvironmentTransform;

varying vec3 osg_FragEye;
varying vec3 osg_FragNormal;
varying vec2 osg_FragTexCoord0;
varying vec3 osg_FragVertex;
varying vec3 osg_FragWorldVertex;

#pragma include "panoramaSampler.glsl"

// environment rgbe lod inline
vec3 test0( const in vec3 direction ) {
    vec2 uvBase = normalToPanoramaUV( direction );
    vec3 texel = texturePanoramicRGBELod( uEnvironment,
                                          uEnvironmentSize,
                                          direction,
                                          uLod,
                                          uEnvironmentMaxLod );
    return texel;
}

vec3 irradiance( const in vec3 direction ) {
    vec2 uvBase = normalToPanoramaUV( direction );
    vec3 texel = textureRGBELinearPanoramic( uEnvironment, uIrradianceSize, uvBase );
    return texel;
}

mat3 getEnvironmentTransfrom( mat4 transform ) {
    vec3 x = vec3(transform[0][0], transform[1][0], transform[2][0]);
    vec3 y = vec3(transform[0][1], transform[1][1], transform[2][1]);
    vec3 z = vec3(transform[0][2], transform[1][2], transform[2][2]);
    mat3 m = mat3(x,y,z);
    return m;
}

void main() {

    // vec3 N = normalize(osg_FragNormal);
    // mat3 environmentTransform = getEnvironmentTransfrom ( uEnvironmentTransform );

    // vec3 E = normalize(osg_FragEye);
    // vec3 V = -E;
    // vec3 H = N;
    // vec3 L = normalize(2.0 * dot(V, H) * H - V);

    // vec3 direction = environmentTransform * L;

    vec3 direction = normalize( osg_FragNormal);
    direction = getEnvironmentTransfrom ( uEnvironmentTransform ) * direction;

#ifdef IRRADIANCE
    vec3 color = irradiance( direction );
#else
    vec3 color = test0( direction );
#endif
    gl_FragColor = vec4( color, 1.0);
}

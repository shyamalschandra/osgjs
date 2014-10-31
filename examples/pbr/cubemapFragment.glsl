uniform samplerCube uEnvironment;

uniform mat4 uEnvironmentTransform;

varying vec3 osg_FragEye;
varying vec3 osg_FragNormal;
varying vec2 osg_FragTexCoord0;
varying vec3 osg_FragVertex;

#pragma include "cubemapSampler.glsl"

mat3 getEnvironmentTransfrom( mat4 transform ) {
    vec3 x = vec3(transform[0][0], transform[1][0], transform[2][0]);
    vec3 y = vec3(transform[0][1], transform[1][1], transform[2][1]);
    vec3 z = vec3(transform[0][2], transform[1][2], transform[2][2]);
    mat3 m = mat3(x,y,z);
    return m;
}

void main() {
    vec3 direction = normalize( osg_FragNormal);
    direction = getEnvironmentTransfrom( uEnvironmentTransform ) * direction;
    vec3 color = textureCubeRGBE( uEnvironment, direction );
    gl_FragColor = vec4( color, 1.0);
}

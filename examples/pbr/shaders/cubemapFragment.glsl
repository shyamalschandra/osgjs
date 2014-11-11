uniform samplerCube uEnvironmentCube;

uniform mat4 uEnvironmentTransform;
uniform float uLod;
uniform float uEnvironmentMaxLod;
#extension GL_EXT_shader_texture_lod : enable

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
    //direction = normalize(osg_FragVertex.xyz);
    direction = getEnvironmentTransfrom( uEnvironmentTransform ) * direction;
#ifdef FLOAT_CUBEMAP_LOD
    vec3 color = textureCubeLodEXTFixed(uEnvironmentCube, direction, uLod ).rgb;
#else
#ifndef FLOAT_CUBEMAP
    vec3 color = textureCubeRGBE( uEnvironmentCube, direction );
#else
    vec3 color = textureCube( uEnvironmentCube, direction ).rgb;
#endif
#endif
    //color = textureCube(uEnvironment, direction ).rgb;
    gl_FragColor = vec4( color, 1.0);
}

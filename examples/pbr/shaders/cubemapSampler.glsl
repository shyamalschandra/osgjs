#pragma include "colorSpace.glsl"

vec3 textureCubeRGBE(const in samplerCube texture, const in vec3 uv) {
    vec4 rgbe = textureCube(texture, uv );
    return RGBEToRGB( rgbe );
}


vec4 textureCubeLodEXTFixed(const in samplerCube texture, const in vec3 direction, const in float lodInput )
{

    // level 9 = 512 - 9*2 / 512
    // (512 - (2.0*MaxLod - lod )) / 512;

    float lod = min( 8.0, lodInput );

    //float scale = 1.0 - lod / uEnvironmentSize.x; // CubemapSize is the size of the base mipmap
    float scale = (512.0 - ( uEnvironmentMaxLod - lod + 1.0 ) ) / 512.0;
    vec3 dir = direction;
    float M = max(max(abs(dir.x), abs(dir.y)), abs(dir.z));
    if (abs(dir.x) != M) dir.x *= scale;
    if (abs(dir.y) != M) dir.y *= scale;
    if (abs(dir.z) != M) dir.z *= scale;

    return textureCubeLodEXT( texture, dir, lod );
}

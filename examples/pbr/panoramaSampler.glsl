#pragma include "colorSpace.glsl"

vec4 computeUVForMipmap( const in float level, const in vec2 uv, const in vec2 size, const in float maxLOD ) {

    // width for level
    float widthForLevel = pow( 2.0, maxLOD-level);

    // the height locally for the level in pixel
    // to opimitize a bit we scale down the v by two in the inputs uv
    //float heightForLevel = widthForLevel * 0.5;

    vec2 sizeForLevel = vec2( widthForLevel, widthForLevel - 2.0 ); // -2.0 avoid bleeding on the top


    // globally the texture is square so width = height for texture size
    float globalOffsetVInTexel = size.x - sizeForLevel.x; // in texel

    float oneOnSizeX = 1.0 / size.x;

    // we will need to transform our original uv to the mipmap level space
    // to opimitize a bit we scale down the v by two in the inputs
    // it simplifies and make ratioU/V the same
    vec2 ratio = sizeForLevel * oneOnSizeX;

    // u = u * ratioU
    // v = v * ratioV + offsetY / height
    vec2 uvGlobal = uv * ratio;

    float globalOffsetV = globalOffsetVInTexel * oneOnSizeX;
    uvGlobal.y += globalOffsetV;

    // zw contains the max box of the local mip level
    // boxXLimit = widthForLevel * oneOnSizeX
    // boxYLimit = (globalOffsetV + heightForLevel ) * oneOnSizeX
    // boxYLimit = ratioV + globalOffsetV;

    return vec4( uvGlobal.x, uvGlobal.y, ratio.x, ratio.y + globalOffsetV );
}

// for z up
vec2 normalToPanoramaUVZ( const in vec3 dir )
{
    float n = length(dir.xz);

    // to avoid bleeding the max(-1.0,dir.x / n) is needed
    vec2 pos = vec2( (n>0.0000001) ? max(-1.0,dir.x / n) : 0.0, dir.y);

    // fix edge bleeding
    if ( pos.x > 0.0 ) pos.x = min( 0.999999, pos.x );

    pos = acos(pos)*INV_PI;

    // to avoid bleeding the limit must be set to 0.4999999 instead of 0.5
    pos.x = (dir.z > 0.0) ? pos.x*0.5 : 1.0-(pos.x*0.5);
    pos.y = 1.0-pos.y;
    return pos;
}


//for y up
vec2 normalToPanoramaUVY( const in vec3 dir )
{
    float n = length(dir.xy);

    // to avoid bleeding the max(-1.0,dir.x / n) is needed
    vec2 pos = vec2( (n>0.0000001) ? max(-1.0,dir.x / n) : 0.0, dir.z);

    // fix edge bleeding
    if ( pos.x > 0.0 ) pos.x = min( 0.999999, pos.x );

    pos = acos(pos)*INV_PI;

    // to avoid bleeding the limit must be set to 0.4999999 instead of 0.5
    pos.x = (dir.y > 0.0) ? pos.x*0.5 : 1.0-(pos.x*0.5);
    pos.y = 1.0-pos.y;
    return pos;
}

#define normalToPanoramaUV normalToPanoramaUVY


vec3 textureRGBE(const in sampler2D texture, const in vec2 uv) {
    vec4 rgbe = texture2D(texture, uv );
    return RGBEToRGB( rgbe );
}



vec3 textureRGBELinearPanoramic(const in sampler2D texture, const in vec2 size, const in vec2 uv, const in vec2 maxBox ) {

    // texel size
    vec2 t = vec2(1.0 / size.x);

    vec2 uvTexelSpace = uv * size.x;
    vec2 frac = fract(uvTexelSpace);

    vec2 uvBase = floor ( uvTexelSpace ) * t;

    float maxX = mod(uvBase.x+t.x, maxBox.x);
    float maxY = min(uvBase.y+t.y, maxBox.y-t.y); // clamp to one pixel before

    vec3 a = textureRGBE(texture, uvBase ),
         b = textureRGBE(texture, vec2( maxX, uvBase.y) ),
         c = textureRGBE(texture, vec2( uvBase.x, maxY) ),
         d = textureRGBE(texture, vec2( maxX, maxY) );

    vec3 A = mix(a, b, frac.x),
         B = mix(c, d, frac.x);
    return mix(A, B, frac.y);
}


vec3 texturePanoramicRGBELod(const in sampler2D texture,
                             const in vec2 size ,
                             const in vec3 direction,
                             const in float lodInput,
                             const in float maxLOD ) {

    float lod = min( maxLOD, lodInput );
    vec2 uvBase = normalToPanoramaUV( direction );

    // we scale down v here because it avoid to do twice in sub functions
    uvBase.y *= 0.5;

    float lod0 = floor(lod);
    vec4 uv0 = computeUVForMipmap(lod0, uvBase, size, maxLOD );
    vec3 texel0 = textureRGBELinearPanoramic( texture, size, uv0.xy, uv0.zw);

    float lod1 = ceil(lod);
    vec4 uv1 = computeUVForMipmap(lod1, uvBase, size, maxLOD );
    vec3 texel1 = textureRGBELinearPanoramic( texture, size, uv1.xy, uv1.zw);

    return mix(texel0, texel1, fract( lod ) );
}


#define PI 3.1415926535897932384626433832795
#define PI_2 (2.0*3.1415926535897932384626433832795)
#define INV_PI 1.0/PI
#define INV_LOG2 1.4426950408889634073599246810019

uniform sampler2D uEnvironment;
uniform vec2 uEnvironmentSize;
uniform float uEnvironmentMaxLod;
uniform float uLod;

uniform mat4 uEnvironmentTransform;

varying vec3 osg_FragEye;
varying vec3 osg_FragNormal;
varying vec2 osg_FragTexCoord0;
varying vec3 osg_FragVertex;


vec4 computeUVForMipmapOld( const in float level, const in vec2 uv, const in vec2 size ) {
    float maxLOD = log ( size[0] ) * INV_LOG2 - 1.0;
    // our texture is square, so each level is width x height/2
    float u = uv[0];
    float v = uv[1];
    float height = pow( 2.0, maxLOD-level );
    float heightInTextureSpace = height/size.y; // rescale to the size of the mipmap level
    float maxU = 2.0 * heightInTextureSpace;
    float maxV = maxU;
    u *= maxU;
    v *= maxU;
    v += heightInTextureSpace;

    return vec4( u, v , maxU, maxV );
}


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

vec2 normalToPanoramaUV( const in vec3 dir )
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

vec2 normalToSphericalUV( const in vec3 n )
{
    //return normalToPanoramaUV( n );
    float EPS = 1e-5;

    // acos is defined [ -1: 1 ]
    // atan( x , y ) require to have |y| > 0

    // when n.y is amlost 1.0 it means that the normal is aligned on axis y
    // so instead of fixing numerical issue we can directly return the supposed
    // uv value
    if ( n.y > (1.0-EPS) ) {
        return vec2( 0.5, 0.0);
    } else if ( n.y < -(1.0-EPS) ) {
        return vec2( 0.5, 1.0-EPS);
    }

    float yaw = acos(n.y) * INV_PI;
    float pitch;
    float y = n.z;
    if ( abs( y ) < EPS )
        y = EPS;
    pitch = ( atan(n.x, y) + PI) * 0.5  * INV_PI;

    return vec2( pitch, yaw );
}


vec3 textureRGBE(const in sampler2D texture, const in vec2 uv) {
    vec4 rgbe = texture2D(texture, uv );

    float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));
    return rgbe.rgb * (255.0 * f);
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

    vec3 direction = normalize( osg_FragVertex);

    vec3 color = test0( direction );

    gl_FragColor = vec4( color, 1.0);
}
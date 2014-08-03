/** c++-mode **/
#define PI 3.1415926535897932384626433832795
#define PI_2 (2.0*3.1415926535897932384626433832795)
#define INV_PI 1.0/PI
#define INV_LOG2 1.4426950408889634073599246810019

float MaxLOD = 0.0;

// unreal pregenerated texture


// from https://www.shadertoy.com/view/4sfGDB
float seed = 0.;
float rand() { return fract(sin(seed++)*43758.5453123); }

uniform sampler2D integrateBRDF;
uniform sampler2D integrateBRDFSize;

uniform sampler2D envSpecular;
uniform vec2 envSpecularSize;
uniform float envSpecularRange;

uniform sampler2D envDiffuse;
uniform float envDiffuseRange;
uniform vec2 envDiffuseSize;

uniform int flipNormalY;

uniform sampler2D environment;
uniform float environmentRange;
uniform vec2 environmentSize;

uniform sampler2D envBackground;

uniform int useDiffuseAlpha;


const vec3 nullVec3 = vec3(0.0);

vec3 cubemapReflectionVector(const in mat4 transform, const in vec3 view, const in vec3 normal)
{
    vec3 lv = reflect(view, normal);
    lv = normalize(lv);
    vec3 x = vec3(transform[0][0], transform[1][0], transform[2][0]);
    vec3 y = vec3(transform[0][1], transform[1][1], transform[2][1]);
    vec3 z = vec3(transform[0][2], transform[1][2], transform[2][2]);
    mat3 m = mat3(x,y,z);
    return m*lv;
}

uniform sampler2D albedoMap;
uniform sampler2D roughnessMap;
uniform sampler2D normalMap;
uniform sampler2D specularMap;
uniform sampler2D aoMap;

uniform float hdrExposure;
uniform mat4 CubemapTransform;


#ifdef BRUT
uniform vec2 hammersley[NB_SAMPLES];

//vec3 diffuseSample[NB_SAMPLES];
//vec4 specularSample[NB_SAMPLES];

#endif


#ifdef BACKGROUND

varying vec3 osg_FragVertex;

#else

varying vec3 osg_FragEye;
varying vec3 osg_FragNormal;
varying vec2 osg_FragTexCoord0;
varying vec4 osg_FragTangent;

#endif

float gamma = 2.2;

float MaterialRoughness = 0.99;
vec3 MaterialSpecular = vec3(0.04);
vec3 MaterialAlbedo;
vec3 MaterialNormal;
float MaterialAO;
vec3 FragNormal;


float TextureLevel = 0.0;
#define DefaultGamma 2.4

vec4 computeUVForMipmap( const in float level, const in vec2 uv, const in vec2 size ) {
    // our texture is square, so each level is width x height/2
    float u = uv[0];
    float v = uv[1];
    float height = pow( 2.0, level );
    float heightInTextureSpace = height/size.y; // rescale to the size of the mipmap lev
    float maxU = 2.0 * heightInTextureSpace;
    float maxV = maxU;
    u *= maxU;
    v *= maxU;
    v += heightInTextureSpace;

    return vec4( u, v , maxU, maxV );
}


float linearrgb_to_srgb1(const in float c, const in float gamma)
{
    float v = 0.0;
    if(c < 0.0031308) {
        if ( c > 0.0)
            v = c * 12.92;
    } else {
        v = 1.055 * pow(c, 1.0/ gamma) - 0.055;
    }
    return v;
}

// coding style should be camel case except for acronyme like SRGB or HDR
vec4 linearTosRGB(const in vec4 col_from, const in float gamma)
{
    vec4 col_to;
    col_to.r = linearrgb_to_srgb1(col_from.r, gamma);
    col_to.g = linearrgb_to_srgb1(col_from.g, gamma);
    col_to.b = linearrgb_to_srgb1(col_from.b, gamma);
    col_to.a = col_from.a;
    return col_to;
}

vec3 linearTosRGB(const in vec3 col_from, const in float gamma)
{
    vec3 col_to;
    col_to.r = linearrgb_to_srgb1(col_from.r, gamma);
    col_to.g = linearrgb_to_srgb1(col_from.g, gamma);
    col_to.b = linearrgb_to_srgb1(col_from.b, gamma);
    return col_to;
}

float sRGBToLinear(const in float c, const in float gamma)
{
    float v = 0.0;
    if ( c < 0.04045 ) {
        if ( c >= 0.0 )
            v = c * ( 1.0 / 12.92 );
    } else {
        v = pow( ( c + 0.055 ) * ( 1.0 / 1.055 ), gamma );
    }
    return v;
}
vec4 sRGBToLinear(const in vec4 col_from, const in float gamma)
{
    vec4 col_to;
    col_to.r = sRGBToLinear(col_from.r, gamma);
    col_to.g = sRGBToLinear(col_from.g, gamma);
    col_to.b = sRGBToLinear(col_from.b, gamma);
    col_to.a = col_from.a;
    return col_to;
}
vec3 sRGBToLinear(const in vec3 col_from, const in float gamma)
{
    vec3 col_to;
    col_to.r = sRGBToLinear(col_from.r, gamma);
    col_to.g = sRGBToLinear(col_from.g, gamma);
    col_to.b = sRGBToLinear(col_from.b, gamma);
    return col_to;
}

vec3 textureRGBE(const in sampler2D texture, const in vec2 uv) {
    vec4 rgbe = texture2D(texture, uv );

    float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));
    return rgbe.rgb * 255.0 * f;
}

vec3 textureRGBM(const in sampler2D texture, const in vec2 uv ) {
    vec4 rgbm = texture2D(texture, uv );
    return rgbm.rgb * rgbm.a;
}


vec2 normalToPanoramaUV( const in vec3 dir )
{
    float n = length(dir.xz);
    vec2 pos = vec2( (n>0.0000001) ? dir.x / n : 0.0, dir.y);
    pos = acos(pos)*INV_PI;
    pos.x = (dir.z > 0.0) ? pos.x*0.5 : 0.9999999-(pos.x*0.5);
    //pos.y = 1.0-pos.y;
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



void mtex_nspace_tangent(const in vec4 tangent, const in vec3 normal, const in vec3 texnormal, out vec3 outnormal)
{
    vec3 tang = vec3(0.0,1.0,0.0);
    if (length(tangent.xyz) != 0.0) {
        tang = normalize(tangent.xyz);
    }
    vec3 B = -tangent.w * cross(normal, tang);
    outnormal = texnormal.x*tang + texnormal.y*B + texnormal.z*normal;
    outnormal = normalize(outnormal);
}


vec3 textureNormal(const in vec3 rgb) {
    vec3 n = normalize((rgb-vec3(0.5)));
    n[1] = (flipNormalY == 1) ? -n[1] : n[1];
    return n;
}

vec3 textureRGBMLinear(const in sampler2D texture, const in vec2 size, const in vec2 uv ) {
    vec2 t = 1.0 / size;

    vec3 a = textureRGBM(texture, uv ),
        b = textureRGBM(texture, uv + vec2(t.x, 0.0) ),
        c = textureRGBM(texture, uv + vec2(0.0, t.y) ),
        d = textureRGBM(texture, uv + vec2(t.x, t.y) );
    vec2 f = fract(uv * size);
    vec3 A = mix(a, b, f.x),
        B = mix(c, d, f.x);
    return mix(A, B, f.y);
}

vec3 textureRGBELinearPanoramic(const in sampler2D texture, const in vec2 size, const in vec2 uv, const in vec2 maxBox ) {
    vec2 t = 1.0 / size;

    float maxX = mod(uv.x+t.x, maxBox.x);
    float maxY = min(uv.y+t.y, maxBox.y-t.y); // clamp to one pixel befo

    vec3 a = textureRGBE(texture, uv ),
        b = textureRGBE(texture, vec2( maxX, uv.y) ),
        c = textureRGBE(texture, vec2( uv.x, maxY) ),
        d = textureRGBE(texture, vec2( maxX, maxY) );
    vec2 f = fract(uv * size);
    vec3 A = mix(a, b, f.x),
        B = mix(c, d, f.x);
    return mix(A, B, f.y);
}


vec3 textureRGBMLinearPanoramic(const in sampler2D texture, const in vec2 size, const in vec2 uv, const in vec2 maxBox ) {
    vec2 t = 1.0 / size;

    float maxX = mod(uv.x+t.x, maxBox.x);
    float maxY = min(uv.y+t.y, maxBox.y-t.y); // clamp to one pixel befo

    vec3 a = textureRGBM(texture, uv ),
        b = textureRGBM(texture, vec2( maxX, uv.y) ),
        c = textureRGBM(texture, vec2( uv.x, maxY) ),
        d = textureRGBM(texture, vec2( maxX, maxY) );
    vec2 f = fract(uv * size);
    vec3 A = mix(a, b, f.x),
        B = mix(c, d, f.x);
    return mix(A, B, f.y);
}

vec3 texturePanoramicRGBELod(const in sampler2D texture, const in vec2 size , const in vec3 direction, const float lodInput) {

    vec2 uvBase = normalToSphericalUV( direction );
    uvBase.y *= 0.5;
    float lod = max(1.0, MaxLOD-lodInput);
    float lod0 = floor(lod);
    vec4 uv0 = computeUVForMipmap(lod0, uvBase, size );
    vec3 texel0 = textureRGBELinearPanoramic( texture, size, uv0.xy, uv0.zw);

    float lod1 = ceil(lod);
    vec4 uv1 = computeUVForMipmap(lod1, uvBase, size );
    vec3 texel1 = textureRGBELinearPanoramic( texture, size, uv1.xy, uv1.zw);

    return mix(texel0, texel1, fract( lod ) );
}

vec3 texturePanoramicRGBMLod(const in sampler2D texture, const in vec2 size , const in float range, const in vec3 direction, const float lodInput) {

    vec2 uvBase = normalToSphericalUV( direction );
    uvBase.y *= 0.5;
    float lod = max(1.0, MaxLOD-lodInput);
    float lod0 = floor(lod);
    vec4 uv0 = computeUVForMipmap(lod0, uvBase, size );
    vec3 texel0 = textureRGBMLinearPanoramic( texture, size, uv0.xy, uv0.zw);

    float lod1 = ceil(lod);
    vec4 uv1 = computeUVForMipmap(lod1, uvBase, size );
    vec3 texel1 = textureRGBMLinearPanoramic( texture, size, uv1.xy, uv1.zw);

    return mix(texel0, texel1, fract( lod ) )* range;
}

vec3 textureRGBELinear(const in sampler2D texture, const in vec2 size, const in vec2 uv) {
    vec2 t = 1.0 / size;

    vec3 a = textureRGBE(texture, uv ),
        b = textureRGBE(texture, uv + vec2(t.x, 0.0) ),
        c = textureRGBE(texture, uv + vec2(0.0, t.y) ),
        d = textureRGBE(texture, uv + vec2(t.x, t.y) );

    vec2 f = fract(uv * size);
    vec3 A = mix(a, b, f.x),
        B = mix(c, d, f.x);
    return mix(A, B, f.y);
}

vec3 textureSpheremapRGBE(const in sampler2D texture, const in vec2 size, const in vec3 normal) {
    vec2 uv = normalToSphericalUV( normal );
    return textureRGBELinear(texture, size, uv.xy ).rgb;
}

vec3 textureSpheremapRGBM(const in sampler2D texture, const in vec2 size, const in vec3 normal, const in float textureRange) {
    vec2 uv = normalToSphericalUV( normal );
    return textureRGBMLinear(texture, size, uv.xy ).rgb * textureRange;
}


#ifndef BACKGROUND



#ifdef BRUT

vec3 fresnel( float vdh, vec3 F0 ) {
    // Schlick with Spherical Gaussian approximation
    // cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3
    float sphg = pow(2.0, (-5.55473*vdh - 6.98316) * vdh);
    return F0 + (vec3(1.0 ) - F0) * sphg;
}

// w is either Ln or Vn
float G1( float ndw, float k ) {
    // One generic factor of the geometry function divided by ndw
    // NB : We should have k > 0
//    return 1.0 / ( ndw*(1.0-k) + k );
    return 1.0 / mix( ndw, 1.0, k);
}

float visibility(float ndl,float ndv,float Roughness) {
    // Schlick with Smith-like choice of k
    // cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3
    // visibility is a Cook-Torrance geometry function divided by (n.l)*(n.v)
    float k = Roughness * Roughness * 0.5;
    return G1(ndl,k)*G1(ndv,k);
}

vec3 cookTorranceContrib(
    float vdh,
    float ndh,
    float ndl,
    float ndv,
    vec3 Ks,
    float Roughness)
{
    // This is the contribution when using importance sampling with the GGX based
    // sample distribution. This means ct_contrib = ct_brdf / ggx_probability
    return fresnel(vdh,Ks) * (visibility(ndl,ndv,Roughness) * vdh * ndl / ndh );
}
#endif

// A,B,C are
vec3 importanceSampleGGX(const in vec2 Xi, const in vec3 tangentX, const in vec3 tangentY, const in vec3 normal, const in float roughness)
{
    float a = roughness*roughness;

    float cosT = sqrt( ( 1.0 - Xi.y ) / ( 1.0 + ( a * a - 1.0 ) * Xi.y ) );
    float sinT = sqrt( 1.0 - cosT * cosT );
    float phi = 2.0 * PI * Xi.x;

    vec3 h;
    h.x = sinT * cos( phi );
    h.y = sinT * sin( phi );
    h.z = cosT;
    return tangentX * h.x + tangentY * h.y + normal * h.z;
}


// apply some gamma correction (http://www.geeks3d.com/20101001/tutorial-gamma-correction-a-story-of-linearity/)
vec3 linear2sRGB ( vec3 color ) {
    return pow( color , 1.0/ vec3( gamma ) );
}

mat3 getIBLTransfrom( mat4 transform ) {
    vec3 x = vec3(transform[0][0], transform[1][0], transform[2][0]);
    vec3 y = vec3(transform[0][1], transform[1][1], transform[2][1]);
    vec3 z = vec3(transform[0][2], transform[1][2], transform[2][2]);
    mat3 m = mat3(x,y,z);
    return m;
}

float distortion(const in vec3 Wn)
{
    // Computes the inverse of the solid angle of the (differential) pixel in
    // the cube map pointed at by Wn
    float sinT = max(0.0000001, sqrt(1.0-Wn.y*Wn.y));
    return 1.0/sinT;
}

#ifdef BRUT

float computeLOD(const in vec3 Ln, const in float p)
{
    return max(0.0, (MaxLOD-1.5) - 0.5*(log(float(NB_SAMPLES)) + log( p * distortion(Ln) ))
               * INV_LOG2);
}


vec3 diffuseBRDF(
    vec3 Nn,
    vec3 Ln,
    vec3 Vn,
    vec3 Kd)
{
    return Kd;
}

vec3 importanceSampleLambert(vec2 Xi, vec3 A, vec3 B, vec3 C)
{
    float cosT = sqrt(Xi.y);
    float sinT = sqrt(1.0-Xi.y);
    float phi = 2.0*PI*Xi.x;
    return (sinT*cos(phi)) * A + (sinT*sin(phi)) * B + cosT * C;
}

float probabilityLambert(const in vec3 Ln, const in vec3 Nn)
{
    return max( 0.0, dot(Nn, Ln) * INV_PI );
}

float normal_distrib(
    float ndh,
    float Roughness)
{
    // use GGX / Trowbridge-Reitz, same as Disney and Unreal 4
    // cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3
    float alpha = Roughness * Roughness;
    float tmp = alpha / (ndh*ndh*(alpha*alpha-1.0)+1.0);
    return tmp * tmp * INV_PI;
}

float probabilityGGX(float ndh, float vdh, float Roughness)
{
    return normal_distrib(ndh, Roughness) * ndh / (4.0*vdh);
}

vec3 solid( const in mat3 iblTransform, const in vec3 normal, const in vec3 view ) {

    MaxLOD = log ( environmentSize[0] ) * INV_LOG2 - 1.0;
    //vectors used for importance sampling
    vec3 upVector = abs(normal.z) < 0.999 ? vec3(0.0,0.0,1.0) : vec3(1.0,0.0,0.0);
    vec3 tangentX = normalize( cross( upVector, normal ) );
    vec3 tangentY = cross( normal, tangentX );


    vec3 tang = vec3(0.0,1.0,0.0);
    tang = normalize(osg_FragTangent.xyz);
    vec3 bin = osg_FragTangent.w * cross(normal, tang);
    vec3 Tp = normalize(tang - normal*dot(tang, normal)); // local tange
    vec3 Bp = normalize(bin  - normal*dot(bin, normal)  - Tp*dot(bin, Tp)); // local bitange

    tangentX = Tp;
    tangentY = Bp;

    float ndv = max( 0.0, dot(normal, view) );

    vec3 contrib = nullVec3;

    for ( int i = 0; i < NB_SAMPLES; i++ ) {

        vec2 xi = hammersley[i];

        vec3 isl = importanceSampleLambert( xi, tangentX, tangentY, normal );
        float probLambert = probabilityLambert(isl, normal);


        float lodDiffuse = computeLOD(isl, probLambert);
        vec3 diffuseContrib = diffuseBRDF( normal, isl,  view, MaterialAlbedo);
        vec3 ray = iblTransform * isl;
#ifdef RGBE
        vec3 texel = texturePanoramicRGBELod(environment, environmentSize, ray, lodDiffuse);
#endif

#ifdef RGBM
        vec3 texel = texturePanoramicRGBMLod(environment, environmentSize, environmentRange, ray, lodDiffuse);
#endif

        contrib += MaterialAO * hdrExposure * texel * diffuseContrib;


        vec3 h = importanceSampleGGX( xi, tangentX, tangentY, normal, MaterialRoughness );

        float vdh = dot( view, h );
        vec3 l = (2.0 * vdh * h - view);
        float ndl =  dot( normal, l );


        if ( ndl > 0.0 ) {
            float ndh =  max( 0.0, dot( normal, h ) );
            vdh = max( 0.0, vdh );
            float probGGX = probabilityGGX( ndh, vdh, MaterialRoughness);
            float lodSpecular = MaterialRoughness < 0.01 ? 0.0: computeLOD( l, probGGX );
            vec3 specularContrib = cookTorranceContrib( vdh, ndh, ndl, ndv, MaterialSpecular, MaterialRoughness);
            vec3 raySpec = iblTransform * l;

#ifdef RGBE
            vec3 color = texturePanoramicRGBELod(environment, environmentSize, raySpec, lodSpecular);
#endif

#ifdef RGBM
            vec3 color = texturePanoramicRGBMLod(environment, environmentSize, environmentRange, raySpec, lodSpecular);
#endif

            contrib += hdrExposure * color * specularContrib;
        }

    }
    contrib = contrib / float(NB_SAMPLES);

    vec3 gammaCorrected = linearTosRGB( contrib, DefaultGamma);
    return gammaCorrected;
}

#endif


#ifdef SOLID2

vec3 tangentX;
vec3 tangentY;

vec3 F_Schlick( const in vec3 f0, const in float vdh ) {
    // Schlick with Spherical Gaussian approximation
    // cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3
    float sphg = pow(2.0, (-5.55473*vdh - 6.98316) * vdh);
//    return f0 + (vec3(1.0 ) - f0) * sphg;
    return mix(vec3(sphg), vec3(1.0), f0);
//    return f0 + (vec3(1.0 ) - f0) * sphg;
}

float G_SmithGGX(const in float NdotL, const in float NdotV, const in float roughness) {
    // cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3
    // visibility is a Cook-Torrance geometry function divided by (n.l)*(n.v)
    float k = roughness * roughness * 0.5;
    return NdotL * NdotV * G1(NdotL,k) * G1(NdotV,k);
}
float G_SmithGGX2(const in float NdotL, const in float NdotV, const in float roughness) {
    float k = roughness * roughness * 0.5;
    return G1(NdotL,k) * G1(NdotV,k);
}

float D_GGX( const in float NdotH, const in float roughness) {
    float alpha = roughness * roughness;
    float tmp = alpha / (NdotH*NdotH*(alpha*alpha-1.0)+1.0);
    return tmp * tmp * INV_PI;
}


void texturePanoramicGenericLod( const in vec3 dir, const in float lod, out vec3 texel ) {

#ifdef RGBE
    texel = texturePanoramicRGBELod(environment, environmentSize, dir, lod);
#endif

#ifdef RGBM
    texel = texturePanoramicRGBMLod(environment, environmentSize, environmentRange, dir, lod);
#endif

}

// in the case of dx11 chrome, using the above just make the compiler glitch
// using this and thus avoiding a temp color varying
// we avoid the cryptic message 'sampler parameter must come from a literal expression'
// when shader program links
vec3 texturePanoramicGenericLodAdd( const in vec3 dir, const in float lod ) {

#ifdef RGBE
    return texturePanoramicRGBELod(environment, environmentSize, dir, lod);
#endif

#ifdef RGBM
    return texturePanoramicRGBMLod(environment, environmentSize, environmentRange, dir, lod);
#endif

}




// inline version diffuse + specular
//==================================

// sample0 does not need H
vec3 evaluateIBLDiffuseOptimSample0( const in mat3 iblTransform, const in vec3 N) {
    float pdf = INV_PI;
    vec3 dir = iblTransform * N;
    float lod = computeLOD(N, pdf);
    return texturePanoramicGenericLodAdd( dir, lod );
}

vec3 evaluateIBLDiffuseOptim(const in mat3 iblTransform, const in vec3 N ) {

	vec3 diffuseOptimContrib = vec3(0.0);

    diffuseOptimContrib += evaluateIBLDiffuseOptimSample0( iblTransform, N);

#if NB_SAMPLES > 1
    vec3 dir, L;
    float pdf, lod, NdotL;

#ifdef UNROLL
    vec2 u;
    for ( int i = 1; i < NB_SAMPLES; i++ ) {
        u = hammersley[i];

        float phi = PI_2*u.x;
        float cosT = sqrt( 1.0 - u.y );
        float sinT = sqrt( 1.0 - cosT * cosT );
        L = sinT* cos(phi ) * tangentX + ( sinT* sin(phi) ) * tangentY + cosT * N;

        NdotL = dot( L, N );

        // compute pdf to get the good lod
        pdf = max( 0.0, NdotL * INV_PI );

        lod = computeLOD(L, pdf);
        dir = iblTransform * L;

        diffuseOptimContrib += texturePanoramicGenericLodAdd( dir, lod );
    }

#else

UNROLL_LOOP_DIFFUSE

#endif

#endif
	return diffuseOptimContrib;
}

vec3 f0;
float NdotV, roughness, alpha, alpha2, alpha2MinusOne, alpha05;


void evaluateIBLSpecularOptimSample0(const in mat3 iblTransform, const in vec3 N, const in vec3 V, out vec3 color ) {

    // Convert sample from half angle to incident angle
    vec3 H = N;

    vec3 L = normalize(2.0 * NdotV * H - V);

    float NdotL = max( 0.0, dot(L, N));

    float LdotH = NdotL;

    // Importance sampling weight for each sample
    //
    //   weight = fr . (N.L)
    //
    // with:
    //   fr  = D(H) . F(H) . G(V, L) / ( 4 (N.L) (N.V) )
    //
    // Since we integrate in the microfacet space, we include the
    // jacobian of the transform
    //
    //   pdf = D(H) . (N.H) / ( 4 (L.H) )


    // float D         = D_GGX(NdotH, roughness);
    float D = INV_PI / alpha2;

    float pdf       = D / (4.0 * LdotH);

    if ( NdotL > 0.0 && pdf > 0.0 ) {

        // Implicit weight (N.L canceled out)
        //float3 F	   = F_Schlick(f0, f90, LdotH); // form Sebastien Lagarde
        vec3 F         = F_Schlick(f0, LdotH);


        // Geometry  G(V, L )
        // float G     = G_SmithGGX(NdotL, NdotV, roughness);
        // cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3
        float k = alpha * 0.5;
        // NdotL and NdotV can be simplifided later because of the weight / pdf
        // float G = NdotL * NdotV * G1(NdotL,k) * G1(NdotV,k);
        float Goptim = G1(NdotL,k) * G1(NdotV,k);

        // original weight
        // vec3 weight = F * G * D / (4.0 * NdotV);
        // optimized weight because of the weight * 1.0/pdf
        vec3 weight = F * ( Goptim * LdotH * NdotL );


        float lod = roughness < 0.01 ? 0.0: computeLOD( L, pdf );

        // could we remove the transform ?
        vec3 dir = iblTransform * L;

        texturePanoramicGenericLod( dir, lod, color );

        color *= weight;
        //contrib += color * weight / pdf;
    }
}

vec3 evaluateIBLSpecularOptimSampleX(const in vec3 L, const in vec3 H, const in float G1NdotV, const in mat3 iblTransform, const in vec3 N, const in vec3 V) {

    float LdotH = max( 0.0, dot(H, L));
    float NdotH = max( 0.0, dot(H, N));
    float NdotL = max( 0.0, dot(L, N));

    // Importance sampling weight for each sample
    //
    //   weight = fr . (N.L)
    //
    // with:
    //   fr  = D(H) . F(H) . G(V, L) / ( 4 (N.L) (N.V) )
    //
    // Since we integrate in the microfacet space, we include the
    // jacobian of the transform
    //
    //   pdf = D(H) . (N.H) / ( 4 (L.H) )


    // float D         = D_GGX(NdotH, roughness);
    float tmp = alpha / ( NdotH * NdotH*( alpha2MinusOne ) + 1.0);
    float D = tmp * tmp * INV_PI;

    float pdfH      = D * NdotH;
    float pdf       = pdfH / (4.0 * LdotH);

    if ( NdotL > 0.0 && pdf > 0.0 ) {

        // Implicit weight (N.L canceled out)
        //float3 F	   = F_Schlick(f0, f90, LdotH); // form Sebastien Lagarde
        vec3 F         = F_Schlick(f0, LdotH);

        // Geometry  G(V, L )
        // float G     = G_SmithGGX(NdotL, NdotV, roughness);
        // cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3

        // NdotL and NdotV can be simplifided later because of the weight / pdf
        // float G = NdotL * NdotV * G1(NdotL,k) * G1(NdotV,k);
        float Goptim = G1(NdotL, alpha05) * G1NdotV;

        // original weight
        // vec3 weight = F * G * D / (4.0 * NdotV);
        // optimized weight because of the weight * 1.0/pdf
        vec3 weight = F * ( Goptim * LdotH * NdotL / NdotH );

        //contrib += g_IBL.SampleLevel(sampler, L, 0).rgb * weight / pdf;

        float lod = roughness < 0.01 ? 0.0: computeLOD( L, pdf );

        // could we remove the transform ?
        vec3 dir = iblTransform * L;

        vec3 color;
        texturePanoramicGenericLod( dir, lod, color );
        return color * weight;

    } else {
        return nullVec3;
    }
}


void evaluateIBLSpecularOptim(const in mat3 iblTransform, const in vec3 N, const in vec3 V, out vec3 contrib ) {

    evaluateIBLSpecularOptimSample0(iblTransform, N, V, contrib );

#if NB_SAMPLES > 1

    float cosThetaH,sinThetaH;
    vec3 H;
    float G1NdotV = G1(NdotV, alpha05);

    if ( G1NdotV < 1e-5 )
        return;

#ifndef UNROLL
    float phi;
    vec2 u;
    const float horizonFade = 1.3;
    for ( int i = 1; i < NB_SAMPLES; i++ ) {

        u = hammersley[i];

        // specular part
        // GGX NDF sampling
        phi = PI_2*u.x;
        cosThetaH = sqrt( (1.0-u.y) / (1.0 + alpha2MinusOne * u.y) );
        sinThetaH = sqrt(1.0 - cosThetaH*cosThetaH );

        // Convert sample from half angle to incident angle
        H = vec3( sinThetaH * cos(phi), sinThetaH * sin(phi), cosThetaH);
        H = normalize(tangentX * H.x + tangentY * H.y + N * H.z);

        vec3 L = normalize(2.0 * dot(V, H) * H - V);

        // attenuate the contribution http://marmosetco.tumblr.com/post/81245981087
        float factor = clamp( 1.0 + horizonFade * dot( L, FragNormal ), 0.0, 1.0 );
        factor *= factor;
//        factor = 1.0;
        contrib += evaluateIBLSpecularOptimSampleX(L, H, G1NdotV, iblTransform, N, V) * factor;
    }
#else
UNROLL_LOOP_SPECULAR
    // contrib += evaluateIBLSpecularOptimSampleX( H, iblTransform, N, V );

#endif
#endif

}

vec3 evaluateIBLOptim( const in mat3 iblTransform, const in vec3 N, const in vec3 V ) {

    vec3 contrib = nullVec3;
    // if dont simplify the math you can get a rougness of 0 and it will
    // produce an error on D_GGX / 0.0
    // float roughness = max( MaterialRoughness, 0.015);
    roughness = MaterialRoughness;

    f0 = MaterialSpecular;


    NdotV = max( 0.0, dot(V, N));
    alpha = roughness*roughness;
    alpha2 = alpha*alpha;
    alpha05 = alpha*0.5;

    alpha2MinusOne = alpha2 - 1.0;

    vec3 H, L, dir, texel;
    float NdotL, pdf, lod;
    bool diffusePart = true;

    if ( MaterialAlbedo[0] == 0.0 &&
         MaterialAlbedo[1] == 0.0 &&
         MaterialAlbedo[2] == 0.0 )
        diffusePart = false;

    vec3 diffuse = nullVec3;
    vec3 specular = nullVec3;

    if ( diffusePart ) {
        diffuse = evaluateIBLDiffuseOptim( iblTransform, N);
        diffuse *= MaterialAlbedo;
    }

    // ==================================================
    evaluateIBLSpecularOptim( iblTransform, N, V, specular );

    contrib = ( diffuse + specular ) * ( MaterialAO * 1.0/float(NB_SAMPLES) );

    return contrib;
}


vec3 evaluateSpecularIBL( const in mat3 iblTransform, const in vec3 N, const in vec3 V ) {

    vec3 contrib = vec3(0.0);
    // if dont simplify the math you can get a rougness of 0 and it will
    // produce an error on D_GGX / 0.0
    float roughness = max( MaterialRoughness, 0.015);
    //float roughness = MaterialRoughness;

    vec3 f0 = MaterialSpecular;


    float NdotV = max( 0.0, dot(V, N));
    float alpha = roughness*roughness;
    float alpha2 = alpha*alpha;

    float alpha2MinusOne = alpha2 - 1.0;

    vec3 H, L;

    for ( int i = 0; i < NB_SAMPLES; i++ ) {

        vec2 u = hammersley[i];

        // GGX NDF sampling
        float cosThetaH = sqrt( (1.0-u.y) / (1.0 + alpha2MinusOne * u.y) );
        float sinThetaH = sqrt(1.0 - cosThetaH*cosThetaH );
        float phiH = u.x * PI_2;

        // Convert sample from half angle to incident angle
        H = vec3( sinThetaH*cos(phiH), sinThetaH*sin(phiH), cosThetaH );
        H = normalize(tangentX * H.x + tangentY * H.y + N * H.z);

        L = normalize(2.0 * dot(V, H) * H - V);

        float LdotH = max( 0.0, dot(H, L));
        float NdotH = max( 0.0, dot(H, N));
        float NdotL = max( 0.0, dot(L, N));


        // Importance sampling weight for each sample
        //
        //   weight = fr . (N.L)
        //
        // with:
        //   fr  = D(H) . F(H) . G(V, L) / ( 4 (N.L) (N.V) )
        //
        // Since we integrate in the microfacet space, we include the
        // jacobian of the transform
        //
        //   pdf = D(H) . (N.H) / ( 4 (L.H) )


        // float D         = D_GGX(NdotH, roughness);
        float tmp = alpha / ( NdotH * NdotH*( alpha2MinusOne ) + 1.0);
        float D = tmp * tmp * INV_PI;

        float pdfH      = D * NdotH;
        float pdf       = pdfH / (4.0 * LdotH);

        // Implicit weight (N.L canceled out)
        //float3 F	   = F_Schlick(f0, f90, LdotH); // form Sebastien Lagarde
        vec3 F         = F_Schlick(f0, LdotH);


        // Geometry  G(V, L )
        // float G     = G_SmithGGX(NdotL, NdotV, roughness);
        // cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3
        float k = alpha * 0.5;
        // NdotL and NdotV can be simplifided later because of the weight / pdf
        // float G = NdotL * NdotV * G1(NdotL,k) * G1(NdotV,k);
        float Goptim = G1(NdotL,k) * G1(NdotV,k);

        // original weight
        // vec3 weight = F * G * D / (4.0 * NdotV);
        // optimized weight because of the weight * 1.0/pdf
        vec3 weight = F * ( Goptim * LdotH * NdotL / NdotH );

        if ( NdotL > 0.0 && pdf > 0.0 )
        {
            //contrib += g_IBL.SampleLevel(sampler, L, 0).rgb * weight / pdf;

            float lod = roughness < 0.01 ? 0.0: computeLOD( L, pdf );

            // could we remove the transform ?
            vec3 dir = iblTransform * L;

            vec3 color;
            texturePanoramicGenericLod( dir, lod, color );

            //contrib += color * weight / pdf;
            contrib += color * weight;
        }
    }

    contrib *= 1.0/float(NB_SAMPLES);
    return contrib;
}


vec3 evaluateDiffuseIBL( const in mat3 iblTransform, const in vec3 N, const in vec3 V ) {

    vec3 contrib = vec3(0.0);

    for ( int i = 0; i < NB_SAMPLES; i++ ) {

        // get sample
        vec2 u = hammersley[i];

        // compute L vector from importance sampling with cos
        float phi = PI_2*u.x;
        float cosT = sqrt( 1.0 - u.y );
        float sinT = sqrt( 1.0 - cosT * cosT );
        vec3 L = sinT* cos(phi ) * tangentX + ( sinT* sin(phi) ) * tangentY + cosT * N;


        float NdotL = dot( L, N );

        // compute pdf to get the good lod
        float pdf = max( 0.0, NdotL * INV_PI );

        float lod = computeLOD(L, pdf);
        vec3 dir = iblTransform * L;

        vec3 texel;
        texturePanoramicGenericLod( dir, lod, texel );

        contrib += texel;
    }

    contrib *= MaterialAlbedo * MaterialAO / float(NB_SAMPLES);
    return contrib;
}

vec3 solid2( const in mat3 iblTransform, const in vec3 normal, const in vec3 view) {

    MaxLOD = log ( environmentSize[0] ) * INV_LOG2 - 1.0;
    vec3 color = nullVec3;

    //vectors used for importance sampling
    vec3 tangent = normalize(osg_FragTangent.xyz);
    vec3 binormal = osg_FragTangent.w * cross(normal, tangent);
    tangentX = normalize(tangent - normal*dot(tangent, normal)); // local tangent
    tangentY = normalize(binormal  - normal*dot(binormal, normal)  - tangentX*dot(binormal, tangentX)); // local bitange

    //     mat3 ibl = mat3( 1.0, 0.0, 0.0,
    //                      0.0, 1.0, 0.0,
    //                      0.0, 0.0, 1.0);
    mat3 ibl = iblTransform;
    //color += evaluateDiffuseIBL(ibl, normal, view );
    //color += evaluateSpecularIBL(ibl, normal, view );
    color += evaluateIBLOptim( ibl, normal, view ) * hdrExposure;
    return linearTosRGB( color, DefaultGamma);
}
#endif




#ifdef PREFILTER

vec3 lightDiffuseIndirect( mat3 iblTransform, vec3 albedo, vec3 normal ) {
    vec2 uv = normalToSphericalUV( iblTransform*normal );

#ifdef RGBE
    vec3 texel = textureRGBELinear(envDiffuse, envDiffuseSize, uv.xy ).rgb;
#endif

#ifdef RGBM
    vec3 texel = textureRGBMLinear(envDiffuse, envDiffuseSize, uv.xy ).rgb * envDiffuseRange;
#endif
    vec3 lightDiffuse = hdrExposure * texel;
    return lightDiffuse * albedo;
}

vec3 texturePrefilteredSpecular( const in float roughness, const in vec3 direction ) {

    MaxLOD = log2( envSpecularSize.x)-1.0;
    float targetLod = roughness * MaxLOD;

#ifdef RGBM
    return texturePanoramicRGBMLod(envSpecular, envSpecularSize, envSpecularRange, direction, targetLod);
#endif
#ifdef RGBE
    return texturePanoramicRGBELod(envSpecular, envSpecularSize, direction, targetLod);
#endif
}

vec2 texturePrecomputedBRDF( const in float roughness, const in float nov ) {
    vec4 rgba = texture2D(integrateBRDF, vec2( nov, roughness ) );
    const float div = 1.0/65535.0;
    float b = (rgba[3] * 65280.0 + rgba[2] * 255.0);
    float a = (rgba[1] * 65280.0 + rgba[0] * 255.0);
    return vec2( a, b ) * div;
}

vec3 lightSpecularIndirect( const in mat3 iblTransform, const in vec3 albedo, const in vec3 normal, const in vec3 view ) {
    float NoV = max( 0.0, dot( normal, view ) );
    vec3 R = 2.0 * dot( view, normal ) * normal - view;
    float mult = hdrExposure;
    vec3 prefilteredColor = texturePrefilteredSpecular( MaterialRoughness, iblTransform * R )* mult;
    vec2 envBRDF = texturePrecomputedBRDF( MaterialRoughness, NoV );
    return prefilteredColor * ( MaterialSpecular * envBRDF.x + envBRDF.y );

}

vec3 prefilteredAndLUT( const in mat3 iblTransform, const in vec3 E ) {
    vec3 diffuseIndirect = MaterialAO * lightDiffuseIndirect( iblTransform, MaterialAlbedo, MaterialNormal );
    vec3 specularIndirect = lightSpecularIndirect( iblTransform, MaterialAlbedo, MaterialNormal, E );
    vec3 gammaCorrected = linearTosRGB( diffuseIndirect + specularIndirect, DefaultGamma);
    return gammaCorrected;
}
#endif


void pbr(void) {
    FragNormal = normalize(osg_FragNormal);
    vec3 N = FragNormal;
    vec3 E = normalize(osg_FragEye);

    mat3 iblTransform = getIBLTransfrom( CubemapTransform );

    const vec3 dielectricColor = vec3(0.04);
    float minRoughness = 1.e-4;

    vec4 albedoSource = texture2D( albedoMap, osg_FragTexCoord0 ).rgba;
    vec3 albedo = sRGBToLinear( albedoSource.rgb, DefaultGamma );

    vec3 normal;
#ifdef NORMAL
    vec3 normalTexel = texture2D( normalMap, osg_FragTexCoord0 ).rgb;
    if ( length(normalTexel) < 0.0001 )
       normal = N;
    else
       mtex_nspace_tangent( osg_FragTangent, N, textureNormal(normalTexel), normal );
#else
    normal = N;
#endif

    float roughnessValue = texture2D( roughnessMap, osg_FragTexCoord0 ).r;
#ifdef GLOSSINESS
    roughnessValue = 1.0 - roughnessValue;
#endif
    MaterialRoughness = max( minRoughness , roughnessValue );

    MaterialNormal = normal;
    MaterialAlbedo = albedo;
    MaterialAO = 1.0;
#ifdef AO
    MaterialAO = texture2D( aoMap, osg_FragTexCoord0 ).r;
    //MaterialAO = sRGBToLinear( texture2D( aoMap, osg_FragTexCoord0 ), DefaultGamma ).rgb;
#endif

#ifdef SPECULAR
    MaterialSpecular = sRGBToLinear( texture2D( specularMap, osg_FragTexCoord0 ), DefaultGamma ).rgb;
#else
    float metallic = texture2D( specularMap, osg_FragTexCoord0 ).r;
    MaterialAlbedo = albedo * (1.0 - metallic);
    MaterialSpecular = mix( dielectricColor, albedo, metallic);
#endif

    vec4 result;
#ifdef SOLID
    result = vec4( solid( iblTransform, MaterialNormal, -E ), 1.0);
#endif
#ifdef PREFILTER
    result = vec4( prefilteredAndLUT( iblTransform, -E ), 1.0);
#endif
#ifdef SOLID2
    result = vec4( solid2( iblTransform, MaterialNormal, -E ), 1.0);
#endif

        if ( useDiffuseAlpha > 0 && albedoSource[3] != 1.0 ) {
           if ( albedoSource[3] == 0.0 ) {
              discard;
              return;

            } else {

          result[0] *= albedoSource[3];
          result[1] *= albedoSource[3];
          result[2] *= albedoSource[3];
          result[3] = albedoSource[3];
          }
        }

    gl_FragColor = result;
}


#else

void background() {
    vec3 direction = normalize(osg_FragVertex.xyz);
    vec2 uv = normalToSphericalUV( direction );
    vec3 c = hdrExposure * texture2D( envBackground, uv).rgb;
    gl_FragColor = vec4(c, 1.0);
}
#endif


void main() {

#ifdef BACKGROUND
    background();
#else
    pbr();
#endif

}

#ifdef GL_ES
   precision highp float;
 #endif

float EdgeDetectColorCalcDiff(  const in vec3 colorA,  const in vec3 colorB,  const in vec3 lumWeights )
{
#if 0
   // CONSIDER THIS as highest quality:
   // Weighted Euclidean distance
   // (Copyright © 2010, Thiadmer Riemersma, ITB CompuPhase, see http://www.compuphase.com/cmetric.htm for details)
   float rmean = ( colorA.r + colorB.r ) / 2.0;
   vec3 delta = colorA - colorB;
   return sqrt( ( (2.0+rmean)*delta.r*delta.r ) + 4*delta.g*delta.g + ( (3.0-rmean)*delta.b*delta.b ) ) * 0.28;
   // (0.28 is an empirically set fudge to match two functions below)
#endif

// two versions, very similar results and almost identical performance
//   - maybe a bit higher quality per-color diff (use this by default)
//   - maybe a bit lower quality luma only diff (use this if luma already available in alpha channel)
#if 1
    return dot( abs( colorA.rgb - colorB.rgb  ), lumWeights.rgb );
#else
    const vec3 cLumaConsts = vec3(0.299, 0.587, 0.114);                     // this matches FXAA (http://en.wikipedia.org/wiki/CCIR_601); above code uses http://en.wikipedia.org/wiki/Rec._709
    return abs( dot( colorA, cLumaConsts ) - dot( colorB, cLumaConsts ) );
#endif
}

bool EdgeDetectColor(  const in vec3 colorA,  const in vec3 colorB,  const in float colorThreshold, const in vec3 lumWeights )
{
     return EdgeDetectColorCalcDiff( colorA, colorB, lumWeights ) > colorThreshold;
}

vec4 colorEdge ( const in vec2 uvPos, const in vec2 texSize, const in sampler2D tex, const in float colorThreshold ,  const in vec3 lumWeights  )
{
  float offsetx = 1.0/texSize[0];
  float offsety = 1.0/texSize[1];
  vec2 pos = uvPos.xy/texSize;

    vec2 screenPos = vec3( uvPos.xy ) * vec3( offsetx, offsety );

    // .rgb contains color, .a contains flag whether to output it to working color texture
    vec4 pixel00   = texture2D(tex,  pos ).rgba                 );
    vec4 pixel10   = texture2D(tex,  pos, vec2( offsetx, 0.0) ).rgba );
    vec4 pixel20   = texture2D(tex,  pos, vec2( 2.0*offsetx, 0.0) ).rgba );
    vec4 pixel01   = texture2D(tex,  pos, vec2( 0.0, offsety ) ).rgba );
    vec4 pixel11   = texture2D(tex,  pos, vec2( offsetx, offsety ) ).rgba );
    vec4 pixel21   = texture2D(tex,  pos, vec2( 2.0*offsetx,offsety ) ).rgba );
    vec4 pixel02   = texture2D(tex,  pos, vec2( 0.0, 2.0*offsety ) ).rgba );
    vec4 pixel12   = texture2D(tex,  pos, vec2( offsetx, 2.0*offsety ) ).rgba );


    float storeFlagPixel00 = 0;
    float storeFlagPixel10 = 0;
    float storeFlagPixel20 = 0;
    float storeFlagPixel01 = 0;
    float storeFlagPixel11 = 0;
    float storeFlagPixel21 = 0;
    float storeFlagPixel02 = 0;
    float storeFlagPixel12 = 0;

    vec2 et;

    {
        et.x = EdgeDetectColorCalcDiff( pixel00.rgb, pixel10.rgb, lumWeights );
        et.y = EdgeDetectColorCalcDiff( pixel00.rgb, pixel01.rgb, lumWeights );
        et = saturate( et - colorThreshold.xx );
        int2 eti = int2( et * 15 + 0.99 );
        outEdges.x = eti.x | (eti.y << 4);

        storeFlagPixel00 += et.x;
        storeFlagPixel00 += et.y;
        storeFlagPixel10 += et.x;
        storeFlagPixel01 += et.y;
    }

    {
        et.x = EdgeDetectColorCalcDiff( pixel10.rgb, pixel20.rgb, lumWeights );
        et.y = EdgeDetectColorCalcDiff( pixel10.rgb, pixel11.rgb, lumWeights );
        et = saturate( et - colorThreshold.xx );
        int2 eti = int2( et * 15 + 0.99 );
        outEdges.y = eti.x | (eti.y << 4);

        storeFlagPixel10 += et.x;
        storeFlagPixel10 += et.y;
        storeFlagPixel20 += et.x;
        storeFlagPixel11 += et.y;
    }

    {
        et.x = EdgeDetectColorCalcDiff( pixel01.rgb, pixel11.rgb, lumWeights );
        et.y = EdgeDetectColorCalcDiff( pixel01.rgb, pixel02.rgb, lumWeights );
        et = clamp(et - colorThreshold.xx , 0.0, 1.0);
        int2 eti = int2( et * 15 + 0.99 );
        outEdges.z = eti.x | (eti.y << 4);

        storeFlagPixel01 += et.x;
        storeFlagPixel01 += et.y;
        storeFlagPixel11 += et.x;
        storeFlagPixel02 += et.y;
    }

    {
        et.x = EdgeDetectColorCalcDiff( pixel11.rgb, pixel21.rgb, lumWeights );
        et.y = EdgeDetectColorCalcDiff( pixel11.rgb, pixel12.rgb, lumWeights );
        et = clamp( et - colorThreshold.xx, 0.0, 1.0 );
        int2 eti = int2( et * 15 + 0.99 );
        outEdges.w = eti.x | (eti.y << 4);

        storeFlagPixel11 += et.x;
        storeFlagPixel11 += et.y;
        storeFlagPixel21 += et.x;
        storeFlagPixel12 += et.y;
    }

    outDepth = (any(outEdges) != 0)?(1.0):(0.0);

    if( outDepth != 0 )
    {
        if( storeFlagPixel00 != 0 )
            g_resultTextureFlt4Slot1[ pos.xy + int2( 0, 0 ) ] = pixel00.rgba;
        if( storeFlagPixel10 != 0 )
            g_resultTextureFlt4Slot1[ pos.xy + int2( 1, 0 ) ] = pixel10.rgba;
        if( storeFlagPixel20 != 0 )
            g_resultTextureFlt4Slot1[ pos.xy + int2( 2, 0 ) ] = pixel20.rgba;
        if( storeFlagPixel01 != 0 )
            g_resultTextureFlt4Slot1[ pos.xy + int2( 0, 1 ) ] = pixel01.rgba;
        if( storeFlagPixel02 != 0 )
            g_resultTextureFlt4Slot1[ pos.xy + int2( 0, 2 ) ] = pixel02.rgba;
        if( storeFlagPixel11 != 0 )
            g_resultTextureFlt4Slot1[ pos.xy + int2( 1, 1 ) ] = pixel11.rgba;
        if( storeFlagPixel21 != 0 )
            g_resultTextureFlt4Slot1[ pos.xy + int2( 2, 1 ) ] = pixel21.rgba;
        if( storeFlagPixel12 != 0 )
            g_resultTextureFlt4Slot1[ pos.xy + int2( 1, 2 ) ] = pixel12.rgba;
    }
}

uniform sampler2D Texture0;
uniform vec2 RenderSize;

void main(){
  vec4 color = colorEdge(gl_FragCoord.xy, RenderSize, Texture0);
  gl_FragColor = vec4(color.rgb, 1.0);
}
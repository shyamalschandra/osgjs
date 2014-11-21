#ifdef GL_ES
   precision highp float;
 #endif

void colorDiscontinuity( const in vec2 screenPosI )
{

    // source : edge differences from previous pass
    int packedVals[6][6];

    // center pixel (our output)
    vec4i packedQ4 = g_src0Texture4Uint.Load( ivec3( screenPosI.xy, 0 ), ivec2(  0,   0 ) ).rgba;
    packedVals[2][2] = packedQ4.x;
    packedVals[3][2] = packedQ4.y;
    packedVals[2][3] = packedQ4.z;
    packedVals[3][3] = packedQ4.w;

    // unused
    // packedVals[0][0] = 0; //packedQ0.x;
    // packedVals[1][0] = 0; //packedQ0.y;
    // packedVals[0][1] = 0; //packedQ0.z;
    // packedVals[1][1] = 0; //packedQ0.w;

    // unused
    //packedVals[4][4] = 0; //packedQ8.x;
    //packedVals[5][4] = 0; //packedQ8.y;
    //packedVals[4][5] = 0; //packedQ8.z;
    //packedVals[5][5] = 0; //packedQ8.w;

    vec4 edges[3];
    int pe;

    if( packedVals[2][2] || packedVals[3][2] )
    {
        vec4i packedQ1 = g_src0Texture4Uint.Load( ivec3( screenPosI.xy, 0 ), ivec2(  0,  -1 ) ).rgba;
        packedVals[2][0] = packedQ1.x;
        packedVals[3][0] = packedQ1.y;
        packedVals[2][1] = packedQ1.z;
        packedVals[3][1] = packedQ1.w;
    }

    if( packedVals[2][2] || packedVals[2][3] )
    {
        vec4i packedQ3 = g_src0Texture4Uint.Load( ivec3( screenPosI.xy, 0 ), ivec2( -1,   0 ) ).rgba;
        packedVals[0][2] = packedQ3.x;
        packedVals[1][2] = packedQ3.y;
        packedVals[0][3] = packedQ3.z;
        packedVals[1][3] = packedQ3.w;
    }

    if( packedVals[2][2] )
    {
        CollectEdges( 2, 2, edges, packedVals );
        int pe = PruneNonDominantEdges( edges );
        if( pe != 0 )
            g_resultTexture[ int2( screenPosI.x*2+0, screenPosI.y*2+0 ) ] = (pe | 0x80) / 255.0;
    }

    if( packedVals[3][2] || packedVals[3][3] )
    {
        vec4i packedQ5 = g_src0Texture4Uint.Load( ivec3( screenPosI.xy, 0 ), ivec2(  1,   0 ) ).rgba;
        packedVals[4][2] = packedQ5.x;
        packedVals[5][2] = packedQ5.y;
        packedVals[4][3] = packedQ5.z;
        packedVals[5][3] = packedQ5.w;
    }

    if( packedVals[3][2] )
    {
        vec4i packedQ2 = g_src0Texture4Uint.Load( ivec3( screenPosI.xy, 0 ), ivec2(  1,  -1 ) ).rgba;
        packedVals[4][0] = packedQ2.x;
        packedVals[5][0] = packedQ2.y;
        packedVals[4][1] = packedQ2.z;
        packedVals[5][1] = packedQ2.w;

        CollectEdges( 3, 2, edges, packedVals );
        int pe = PruneNonDominantEdges( edges );
        if( pe != 0 )
            g_resultTexture[ int2( screenPosI.x*2+1, screenPosI.y*2+0 ) ] = (pe | 0x80) / 255.0;
    }

    if( packedVals[2][3] || packedVals[3][3] )
    {
        vec4i packedQ7 = g_src0Texture4Uint.Load( ivec3( screenPosI.xy, 0 ), ivec2(  0,   1 ) ).rgba;
        packedVals[2][4] = packedQ7.x;
        packedVals[3][4] = packedQ7.y;
        packedVals[2][5] = packedQ7.z;
        packedVals[3][5] = packedQ7.w;
    }

    if( packedVals[2][3] )
    {
        vec4i packedQ6 = g_src0Texture4Uint.Load( ivec3( screenPosI.xy, 0 ), ivec2( -1,   1 ) ).rgba;
        packedVals[0][4] = packedQ6.x;
        packedVals[1][4] = packedQ6.y;
        packedVals[0][5] = packedQ6.z;
        packedVals[1][5] = packedQ6.w;

        CollectEdges( 2, 3, edges, packedVals );
        int pe = PruneNonDominantEdges( edges );
        if( pe != 0 )
            g_resultTexture[ int2( screenPosI.x*2+0, screenPosI.y*2+1 ) ] = (pe | 0x80) / 255.0;
    }

    if( packedVals[3][3] )
    {
        CollectEdges( 3, 3, edges, packedVals );
        int pe = PruneNonDominantEdges( edges );
        if( pe != 0 )
            g_resultTexture[ int2( screenPosI.x*2+1, screenPosI.y*2+1 ) ] = (pe | 0x80) / 255.0;
    }
}

uniform sampler2D Texture0;
uniform vec2 RenderSize;

void main(){
  vec4 color = colorDiscontinuity(gl_FragCoord.xy /  RenderSize.xy, Texture0);
  gl_FragColor = vec4(color.rgb, 1.0);
}
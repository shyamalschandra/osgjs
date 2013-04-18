#ifdef GL_ES
precision highp float;
#endif


uniform vec4 Shadow_DepthRange;
uniform mat4 Shadow_View;

varying vec4 WorldPos;


const vec2 g_EVSMExponents = vec2(20.0, 10.0);
const float g_EVSM_Derivation = 0.0001;

// Convert depth to EVSM coefficients
// Input depth should be in [0, 1]
vec2 WarpDepth(float depth, vec2 exponents)
{
    // Rescale depth into [-1, 1]
    depth = 2.0  * depth - 1.0;
    float pos =  exp( exponents.x * depth);
    float neg = -exp(-exponents.y * depth);
    return vec2(pos, neg);
}

// Convert depth value to EVSM representation
vec4 ShadowDepthToEVSM(float depth)
{
	vec2 exponents = g_EVSMExponents;
	vec2 warpedDepth = WarpDepth(depth, exponents);
	return  vec4(warpedDepth.xy, warpedDepth.xy * warpedDepth.xy);
}

void main(void) {
     // derive a per-pixel depth and depth squared
    // (length of the view space position == distance from camera)
    // (this is linear space, not post-projection quadratic space)
    float depth;
    // linerarize (aka map z to near..far to 0..1)
    //depth =  length(WorldPos.xyz);
    depth = - WorldPos.z;
    depth = (depth - Shadow_DepthRange.x )* Shadow_DepthRange.w;
    //depth = WorldPos.z / WorldPos.w;
    depth = clamp(depth, 0.0, 1.0);

    gl_FragColor = ShadowDepthToEVSM(depth);
}
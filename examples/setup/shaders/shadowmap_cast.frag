#ifdef GL_ES
precision highp float;
#endif

uniform vec4 Shadow_DepthRange;
uniform mat4 Shadow_View;

varying vec4 WorldPos;

#pragma include "floatrgbacodec.glsl"


void main(void) {
    float depth;
    // linerarize (aka map z to near..far to 0..1)
    //depth =  length(WorldPos.xyz);
    depth = - WorldPos.z;
    depth = (depth - Shadow_DepthRange.x )* Shadow_DepthRange.w;
    //depth = (depth)* Shadow_DepthRange.w;
    depth = clamp(depth, 0.0, 1.0);

  #define _ESM
    #ifndef _FLOATTEX
	    #ifdef _VSM
	    	gl_FragColor = EncodeHalfFloatRGBA(vec2(depth, depth*depth));
	    #else
	    	// _ESM, _PCF, _NONE
	    	gl_FragColor = EncodeFloatRGBA(depth);
	    #endif
	#else
	    #ifdef _VSM
	    	gl_FragColor = vec4(depth, depth*depth, 0.0, 1.0);
	    #else
	    	// _ESM, _PCF, _NONE
	    	gl_FragColor = vec4(depth, 0.0, 0.0, 1.0);
	    #endif
	#endif
}
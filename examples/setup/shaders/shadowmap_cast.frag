#ifdef GL_ES
precision highp float;
#endif

#pragma include "floatrgbacodec.glsl"


uniform vec4 Shadow_DepthRange;
uniform mat4 Shadow_ModelView;

varying vec4 WorldPos;


void main(void) { 
    float depth;
    // linerarize (aka map z to near..far to 0..1)
    depth = (length(WorldPos.xyz) - Shadow_DepthRange.x )* Shadow_DepthRange.w;
    depth = clamp(depth, 0.0, 1.0);
    gl_FragColor = EncodeFloatRGBA(depth);
}
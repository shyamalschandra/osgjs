#ifdef GL_ES
precision highp float;
#endif

#extension GL_OES_standard_derivatives : enable

uniform vec4 Shadow_DepthRange;
varying vec4 WorldPos;

void main(void) {
    float depth;
    // (this is linear space, not post-projection quadratic space)
    // (length of the view space position == distance from camera)
    //depth =  length(WorldPos.xyz);
    depth =  - WorldPos.z;
    // linerarize (aka map z to near..far to 0..1) 
    depth = (depth - Shadow_DepthRange.x )* Shadow_DepthRange.w;
    //depth = WorldPos.z / WorldPos.w;
     depth = clamp(depth, 0.0, 1.0);


#ifdef GL_OES_standard_derivatives
     // derive a per-pixel depth and depth squared
    float dx = dFdx(depth);
    float dy = dFdy(depth);
    gl_FragColor = vec4(depth, pow(depth, 2.0) + 0.25*(dx*dx + dy*dy), 0.0, 1.0);
#else
    gl_FragColor = vec4(depth, depth * depth, 1.0, 1.0);
#endif
}
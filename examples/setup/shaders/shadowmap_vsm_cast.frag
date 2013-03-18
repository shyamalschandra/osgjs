#ifdef GL_ES
precision highp float;
#endif

#extension GL_OES_standard_derivatives : enable

uniform vec4 Shadow_DepthRange;
varying vec3 vertexDepth;

void main(void) {
     // derive a per-pixel depth and depth squared
    // (length of the view space position == distance from camera)
    // (this is linear space, not post-projection quadratic space)
    float depth = (length(vertexDepth.xyz) - Shadow_DepthRange.x) * Shadow_DepthRange.w;

    float dx = dFdx(depth);
    float dy = dFdy(depth);

#ifdef GL_OES_standard_derivatives
    gl_FragColor = vec4(depth, pow(depth, 2.0) + 0.25*(dx*dx + dy*dy), 0.0, 1.0);
#else
    gl_FragColor = vec4(depth, depth * depth, 1.0, 1.0);
#endif
}
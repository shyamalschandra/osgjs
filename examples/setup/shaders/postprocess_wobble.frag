
#ifdef GL_ES
precision highp float;
#endif

uniform float amplitude;
uniform float frequency;
uniform float time;
uniform vec2 inverse_buffer_size;

varying vec2 FragTexCoord0;

uniform sampler2D texture;

void main() {
    vec2 p = (sin(time + frequency * FragTexCoord0.xy) + 0.5)* amplitude;
    //gl_FragColor = texture2D(texture, FragTexCoord0.xy * vec2(p.y, -p.x));
    gl_FragColor = texture2D(texture, FragTexCoord0.xy * vec2(p.y, 1.0));
}
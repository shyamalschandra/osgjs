/*Copyright (C) 2011 by Evan Wallace

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D texture;
uniform float blurRadius;
uniform float gradientRadius;
uniform vec2 start;
uniform vec2 end;
uniform vec2 delta;
uniform vec2 texSize;
uniform vec2 inverse_buffer_size;

varying vec2 FragTexCoord0;

 float random(vec3 scale, float seed) {
    /* use the fragment position for a different seed per-pixel */
    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
}

void main() {
    vec4 color = vec4(0.0);
    float total = 0.0;

    /* randomize the lookup values to hide the fixed number of samples */
    float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);
   // vec2 FragTexCoord0 = gl_FragCoord.xy  * inverse_buffer_size;
    vec2 normal = normalize(vec2(start.y - end.y, end.x - start.x));
    float radius = smoothstep(0.0, 1.0, abs(dot(FragTexCoord0 * texSize - start, normal)) / gradientRadius) * blurRadius;
    for (float t = -30.0; t <= 30.0; t++) {
        float percent = (t + offset - 0.5) / 30.0;
        float weight = 1.0 - abs(percent);
        vec4 sample = texture2D(texture, FragTexCoord0 + delta / texSize * percent * radius);

        /* switch to pre-multiplied alpha to correctly blur transparent images */
        sample.rgb *= sample.a;

        color += sample * weight;
        total += weight;
    }

    gl_FragColor = color / total;

    /* switch back from pre-multiplied alpha */
    gl_FragColor.rgb /= gl_FragColor.a + 0.00001;
}
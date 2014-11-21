#ifdef GL_ES
   precision highp float;
 #endif

vec4 colorEdge ( const in vec2 uvPos, const in vec2 texSize, const in sampler2D tex )
{

  float fac0 = 2.0;
  float fac1 = 1.0;

  float offsetx = 1.0/texSize[0];
  float offsety = 1.0/texSize[1];

  vec2 pos = uvPos.xy/texSize;

  vec4 texel0 = texture2D(tex, pos + vec2(offsetx, offsety));
  vec4 texel1 = texture2D(tex, pos + vec2(offsetx, 0.0));
  vec4 texel2 = texture2D(tex, pos + vec2(offsetx, -offsety));
  vec4 texel3 = texture2D(tex, pos + vec2(0.0, -offsety));
  vec4 texel4 = texture2D(tex, pos + vec2(-offsetx, -offsety));
  vec4 texel5 = texture2D(tex, pos + vec2(-offsetx, 0.0));
  vec4 texel6 = texture2D(tex, pos + vec2(-offsetx, offsety));
  vec4 texel7 = texture2D(tex, pos + vec2(0.0, offsety));

  vec4 rowx = -fac0*texel5 + fac0*texel1 +  -fac1*texel6 + fac1*texel0 + -fac1*texel4 + fac1*texel2;
  vec4 rowy = -fac0*texel3 + fac0*texel7 +  -fac1*texel4 + fac1*texel6 + -fac1*texel2 + fac1*texel0;

  float mag = sqrt(dot(rowy,rowy)+dot(rowx,rowx));

  if (mag < 1.0/255.0) discard;

  //mag *= factor;
  mag = min(1.0, mag);

  return vec4(mag);
}

uniform sampler2D Texture0;
uniform vec2 RenderSize;

void main(){
  vec4 color = colorEdge(gl_FragCoord.xy, RenderSize, Texture0);
  gl_FragColor = vec4(color.rgb, 1.0);
}
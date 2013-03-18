precision highp float;
precision highp vec2;
 
uniform highp sampler2D uSampler;
 
uniform int filter_type;
uniform int render_mode;
 
 
vec3 YCoCg2RGB(vec3 c){
    c.y-=0.5;
    c.z-=0.5;
    return vec3(c.r+c.g-c.b, c.r + c.b, c.r - c.g - c.b);
}
 
const float THRESH=30./255.;
 
float edge_filter(vec2 center, vec2 a0, vec2 a1, vec2 a2, vec2 a3){ 
  vec4 lum = vec4(a0.x, a1.x , a2.x, a3.x);
  vec4 w = 1.0-step(THRESH, abs(lum - center.x)); 
  float W = w.x + w.y + w.z + w.w;
  //Handle the special case where all the weights are zero.
  //In HDR scenes it's better to set the chrominance to zero. 
  //Here we just use the chrominance of the first neighbor.
  w.x = (W==0.0)? 1.0:w.x;  W = (W==0.0)? 1.0:W;  
 
  return (w.x*a0.y+w.y*a1.y+w.z*a2.y+w.w* a3.y)/W;
}
 
void main(void) {
    vec2 crd = gl_FragCoord.xy;
    vec2 coords = crd/vec2(1024,512);
    vec4 col = texture2D(uSampler, coords);
     
 
    float chroma = 0.0;
    //filter_type==0 performs no reconstruction
     
    if(filter_type==1){ 
        //nearest reconstruction:
        chroma = texture2D(uSampler, coords + vec2(1.0/1024.0,0.0)).g;
    }
    else if (filter_type==2){
        //bilinear reconstruction:
        chroma = 0.25*(texture2D(uSampler, coords + vec2(1.0/1024.0,0.0)).g +
         texture2D(uSampler, coords - vec2(1.0/1024.0,0.0)).g +
         texture2D(uSampler, coords + vec2(0.0,1.0/512.0)).g +
         texture2D(uSampler, coords - vec2(0.0,1.0/512.0)).g);
    }
    else if (filter_type==3){   
        //edge-directed reconstruction:
        vec2 a0 = texture2D(uSampler, coords + vec2(1.0/1024.0,0.0)).rg;
        vec2 a1 = texture2D(uSampler, coords - vec2(1.0/1024.0,0.0)).rg;
        vec2 a2 = texture2D(uSampler, coords + vec2(0.0,1.0/512.0)).rg;
        vec2 a3 = texture2D(uSampler, coords - vec2(0.0,1.0/512.0)).rg;     
        chroma = edge_filter(col.rg, a0, a1, a2, a3);
    }
     
 
    if(render_mode==1){
        bool pattern = (mod(crd.x,2.0)==mod(crd.y,2.0));
        col.b=chroma;
        col.rgb = (pattern)?col.rbg:col.rgb;
        col.rgb = YCoCg2RGB(col.rgb);
    }
 
 
    gl_FragColor =  col;
}
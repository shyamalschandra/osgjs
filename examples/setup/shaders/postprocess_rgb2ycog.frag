precision highp float;
 
varying vec2 vTextureCoord;
varying vec3 vTransformedNormal;
varying vec4 vPosition;
 
uniform sampler2D uSampler;
 
uniform int render_mode;
 
vec3 RGB2YCoCg(vec3 c){
    return vec3( 0.25*c.r+0.5*c.g+0.25*c.b, 0.5*c.r-0.5*c.b +0.5, -0.25*c.r+0.5*c.g-0.25*c.b +0.5);
}
 
void main(void) {
    vec4 fragColor = texture2D(uSampler, vTextureCoord);
     
    vec3 norm = normalize(vTransformedNormal);
    vec3 P = -vPosition.xyz/vPosition.w;
    //calculate the lighting from two directional lights
    vec3 lightDir1=vec3(19.2,0,70);
    vec3 lightDir2=vec3(-21.2,0,70);
     
    //diffuse lighting
    vec3 diffuse = vec3(1,0,0) * max(0.0,dot(normalize(lightDir1), norm)) +
                   vec3(0,1,0) * max(0.0,dot(normalize(lightDir2), norm));
     
    //specular lighting
    vec3 H1 = lightDir1 + P;
    vec3 H2 = lightDir2 + P;
    vec3 specular = vec3(1,0,0) * pow(max(0.0,dot(normalize(H1), norm)),64.0) +
                    vec3(0,1,0) * pow(max(0.0,dot(normalize(H2), norm)),64.0) ;
     
 
    fragColor.xyz=diffuse*(0.1+fragColor.xyz + 0.55*specular);
    if (render_mode==1){
        //compress the color
        fragColor.rgb = RGB2YCoCg(fragColor.rgb);
         
        vec2 crd = gl_FragCoord.xy;
        //since webgl does not support bitwise operators in GLSL, we don't follow exactly the code in the article
        bool pattern = (mod(crd.x,2.0)==mod(crd.y,2.0));
        fragColor.g = (pattern)?fragColor.b: fragColor.g;
        fragColor.b=0.0;
    }
    gl_FragColor = vec4(fragColor.rgb, 1.0);
}
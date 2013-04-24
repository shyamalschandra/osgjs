
////////////////////////////
// blinn Style
/* usage
    vec2 bln = blinn(lightDir, normal, view);
    vec4 lc = lit(bln.x, bln.y, 1.0);
    float fres = fresnel(bln.x, 0.2, 5.0);

    float index = ( (sin(v_pos.x*3.0+u_time)*0.3+0.7)
                + (  cos(v_pos.y*3.0+u_time)*0.4+0.6)
                + (  cos(v_pos.z*3.0+u_time)*0.2+0.8)
                )*M_PI;

    vec3 color = vec3(sin(index*8.0)*0.4 + 0.6
                    , sin(index*4.0)*0.4 + 0.6
                    , sin(index*2.0)*0.4 + 0.6
                    ) * v_color0.xyz;

    light = vec3(0.07, 0.06, 0.08) + color*lc.y + fres*pow(lc.z, 128.0);
*/     
vec2 blinn(vec3 _lightDir, vec3 _normal, vec3 _viewDir)
{
    float ndotl = dot(_normal, _lightDir);
    vec3 reflected = _lightDir - 2.0*ndotl*_normal; // reflect(_lightDir, _normal);
    float rdotv = dot(reflected, _viewDir);
    return vec2(ndotl, rdotv);
}

float fresnel(float _ndotl, float _bias, float _pow)
{
    float facing = (1.0 - _ndotl);
    return max(_bias + (1.0 - _bias) * pow(facing, _pow), 0.0);
}

vec4 lit(float _ndotl, float _rdotv, float _m)
{
    float diff = max(0.0, _ndotl);
    float spec = step(0.0, _ndotl) * max(0.0, _rdotv * _m);
    return vec4(1.0, diff, spec, 1.0);
}
////////////////////////////
// lambert style
/*
vec3 light = (
                skyLight(worldNormal) +
                lambert(lightSurfaceNormal, -lightPosNormal) *
                influence(lightPosNormal, 55.0) *
                attenuation(lightPos) *
                illuminated
            );
 */
#define PI 3.1415926535897932384626433832795

float attenuation(vec3 dir){
    float dist = length(dir);
    float radiance = 1.0/(1.0+pow(dist/10.0, 2.0));
    return clamp(radiance*10.0, 0.0, 1.0);
}

float influence(vec3 normal, float coneAngle){
    float minConeAngle = ((360.0-coneAngle-10.0)/360.0)*PI;
    float maxConeAngle = ((360.0-coneAngle)/360.0)*PI;
    return smoothstep(minConeAngle, maxConeAngle, acos(normal.z));
}

float lambert(vec3 surfaceNormal, vec3 lightDirNormal){
    return max(0.0, dot(surfaceNormal, lightDirNormal));
}

vec3 skyLight(vec3 normal){
    return vec3(smoothstep(0.0, PI, PI-acos(normal.y)))*0.4;
}

vec3 gamma(vec3 color){
    return pow(color, vec3(2.2));
}

////////////////////////////
// sketchfab history lighting.
float getLightAttenuation(vec3 lightDir, float constant, float linear, float quadratic) {
    float d = length(lightDir);
    float att = 1.0 / (constant + linear * d + quadratic * d * d);
    return att;
}
vec4 computeLightContribution(vec4 materialAmbient,   vec4 materialDiffuse,   vec4 materialSpecular,   float materialShininess,  
                             vec4 lightAmbient,   vec4 lightDiffuse,   vec4 lightSpecular,   
                             vec3 normal,   vec3 eye,   vec3 lightDirection,   vec3 lightSpotDirection,   
                             float lightCosSpotCutoff,   float lightSpotBlend,   float lightAttenuation) {
    vec3 L = lightDirection;
    vec3 N = normal;
    float NdotL = max(dot(L, N), 0.0);
    float halfTerm = NdotL;
    vec4 ambient = lightAmbient;
    vec4 diffuse = vec4(0.0);
    vec4 specular = vec4(0.0);
    float spot = 0.0;
    if (NdotL > 0.0) {
        vec3 E = eye;
        vec3 R = reflect(-L, N);
        float RdotE = max(dot(R, E), 0.0);
        if (RdotE > 0.0) {
            RdotE = pow(RdotE, materialShininess);
        }
        vec3 D = lightSpotDirection;
        spot = 1.0;
        if (lightCosSpotCutoff > 0.0) {
            float cosCurAngle = dot(-L, D);
            if (cosCurAngle < lightCosSpotCutoff) {
                spot = 0.0;
            } else {
                if (lightSpotBlend > 0.0)    
                    spot = cosCurAngle * smoothstep(0.0, 1.0, (cosCurAngle - lightCosSpotCutoff) / (lightSpotBlend));
            }
        }
        diffuse = lightDiffuse * ((halfTerm));
        specular = lightSpecular * RdotE;
    }
    return (materialAmbient * ambient + (materialDiffuse * diffuse + materialSpecular * specular) * spot) * lightAttenuation;
}
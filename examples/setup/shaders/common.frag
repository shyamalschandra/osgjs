
float getLightAttenuation(vec3 lightDir, float constant, float linear, float quadratic) {
    float d = length(lightDir);
    float att = 1.0 / (constant + linear * d + quadratic * d * d);
    return att;
}
vec4 computeLightContribution(vec4 materialAmbient,   vec4 materialDiffuse,   vec4 materialSpecular,   float materialShininess,   vec4 lightAmbient,   vec4 lightDiffuse,   vec4 lightSpecular,   vec3 normal,   vec3 eye,   vec3 lightDirection,   vec3 lightSpotDirection,   float lightCosSpotCutoff,   float lightSpotBlend,   float lightAttenuation) {
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
                if (lightSpotBlend > 0.0)    spot = cosCurAngle * smoothstep(0.0, 1.0, (cosCurAngle - lightCosSpotCutoff) / (lightSpotBlend));
            }
        }
        diffuse = lightDiffuse * ((halfTerm));
        specular = lightSpecular * RdotE;
    }
    return (materialAmbient * ambient + (materialDiffuse * diffuse + materialSpecular * specular) * spot) * lightAttenuation;
}
float linearrgb_to_srgb1(const in float c) {
    float v = 0.0;
    if (c < 0.0031308) {
        if (c > 0.0)   v = c * 12.92;
    } else {
        v = 1.055 * pow(c, 1.0 / 2.4) - 0.055;
    }
    return v;
}
vec4 linearrgb_to_srgb(const in vec4 col_from) {
    vec4 col_to;
    col_to.r = linearrgb_to_srgb1(col_from.r);
    col_to.g = linearrgb_to_srgb1(col_from.g);
    col_to.b = linearrgb_to_srgb1(col_from.b);
    col_to.a = col_from.a;
    return col_to;
}
float srgb_to_linearrgb1(const in float c) {
    float v = 0.0;
    if (c < 0.04045) {
        if (c >= 0.0)   v = c * (1.0 / 12.92);
    } else {
        v = pow((c + 0.055) * (1.0 / 1.055), 2.4);
    }
    return v;
}
vec4 srgb2linear(const in vec4 col_from) {
    vec4 col_to;
    col_to.r = srgb_to_linearrgb1(col_from.r);
    col_to.g = srgb_to_linearrgb1(col_from.g);
    col_to.b = srgb_to_linearrgb1(col_from.b);
    col_to.a = col_from.a;
    return col_to;
}

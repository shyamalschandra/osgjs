#pragma include "sphericalHarmonics.glsl"

// expect to have a function to fetch texel in it
// getReferenceTexelEnvironment( Direction, Lod )


// w is either Ln or Vn
float G1( const in float ndw, const in float k ) {
    // One generic factor of the geometry function divided by ndw
    // NB : We should have k > 0
    // return 1.0 / ( ndw*(1.0-k) + k );
    return 1.0 / mix( ndw, 1.0, k);
}


vec3 F_Schlick( const in vec3 f0, const in float vdh ) {
    // Schlick with Spherical Gaussian approximation
    // cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3

    float sphg = pow(2.0, (-5.55473*vdh - 6.98316) * vdh);
    // return f0 + (vec3(1.0 ) - f0) * sphg;
    return mix( vec3(sphg), vec3(1.0), f0);
}

float G_SmithGGX(const in float NdotL, const in float NdotV, const in float roughness) {
    // cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3
    // visibility is a Cook-Torrance geometry function divided by (n.l)*(n.v)
    float k = roughness * roughness * 0.5;
    return NdotL * NdotV * G1( NdotL, k) * G1( NdotV, k);
}


float D_GGX( const in float NdotH, const in float roughness) {
    // use GGX / Trowbridge-Reitz, same as Disney and Unreal 4
    // cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3
    float alpha = roughness * roughness;
    float tmp = alpha / (NdotH*NdotH*(alpha*alpha-1.0)+1.0);
    return tmp * tmp * INV_PI;
}


float rand2(const in vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec2 getSample(const in int i ) {
    vec2 u;
    u[0] = rand2(vec2( float(i) * 1.0 ) );
    u[1] = rand2(vec2( float(i) * 3.5 ) );
    return u;
}

vec3 evaluateDiffuseSphericalHarmonics( const in vec3 N,
                                        const in vec3 V,
                                        const in vec3 tangentX,
                                        const in vec3 tangentY) {

    return sphericalHarmonics( uEnvironmentSphericalHarmonics, environmentTransform * N );
}

vec3 evaluateDiffuseIBL( const in vec3 N,
                         const in vec3 V,
                         const in vec3 tangentX,
                         const in vec3 tangentY) {

    vec3 contrib = vec3(0.0);
    vec2 u;
    for ( int i = 0; i < NB_SAMPLES; i++ ) {

        // get sample
        vec2 u = getSample( i );
        //vec2 u = hammersley[i];

        // compute L vector from importance sampling with cos
        float phi = PI_2*u.x;
        float cosT = sqrt( 1.0 - u.y );
        float sinT = sqrt( 1.0 - cosT * cosT );
        vec3 L = sinT* cos(phi ) * tangentX + ( sinT* sin(phi) ) * tangentY + cosT * N;

        float NdotL = dot( L, N );

        if ( NdotL > 0.0 ) {

            // compute pdf
            float pdf = NdotL * INV_PI;

            // vec3 dir = uEnvironmentTransform * L;
            // vec3 color = textureCubeLodEXT(uEnvironment, dir, 0.0 ).rgb;
            vec3 color = getReferenceTexelEnvironment( L, 0.0 ).rgb;

            // could simplified to texel * INV_PI
            contrib += color * NdotL / pdf;
        }
    }

    contrib *= INV_PI * 1.0 / float(NB_SAMPLES);
    return contrib;
}

vec3 evaluateSpecularIBL( const in vec3 N,
                          const in vec3 V,
                          const in vec3 tangentX,
                          const in vec3 tangentY,

                          const in float roughness_,
                          const in vec3 specular ) {

    vec3 contrib = vec3(0.0);
    // if dont simplify the math you can get a rougness of 0 and it will
    // produce an error on D_GGX / 0.0
    float roughness = max( roughness_, 0.015);
    // float roughness = MaterialRoughness;

    //vec3 f0 = MaterialSpecular;
    vec3 f0 = specular;


    float NdotV = max( 0.0, dot(V, N));
    float alpha = roughness*roughness;
    float alpha2 = alpha*alpha;

    float alpha2MinusOne = alpha2 - 1.0;

    vec3 H, L;

    for ( int i = 0; i < NB_SAMPLES; i++ ) {

        // get sample
        //vec2 u = getSample( i );
        vec2 u = uHammersleySamples[i];

        // Importance sampling GGX NDF sampling
        float cosThetaH = sqrt( (1.0-u.y) / (1.0 + alpha2MinusOne * u.y) );
        float sinThetaH = sqrt(1.0 - cosThetaH*cosThetaH );
        float phiH = u.x * PI_2;

        // Convert sample from half angle to incident angle
        H = vec3( sinThetaH*cos(phiH), sinThetaH*sin(phiH), cosThetaH );
        H = normalize(tangentX * H.x + tangentY * H.y + N * H.z);


        L = normalize(2.0 * dot(V, H) * H - V);

        float LdotH = max( 0.0, dot(H, L));
        float NdotH = max( 0.0, dot(H, N));
        float NdotL = max( 0.0, dot(L, N));


        // Importance sampling weight for each sample
        //
        //   weight = fr . (N.L)
        //
        // with:
        //   fr  = D(H) . F(H) . G(V, L) / ( 4 (N.L) (N.V) )
        //
        // Since we integrate in the microfacet space, we include the
        // jacobian of the transform
        //
        //   pdf = D(H) . (N.H) / ( 4 (L.H) )


        float D         = D_GGX(NdotH, roughness);

        float pdfH      = D * NdotH;
        float pdf       = pdfH / (4.0 * LdotH);

        // Implicit weight (N.L canceled out)
        //float3 F	   = F_Schlick(f0, f90, LdotH); // form Sebastien Lagarde
        vec3 F         = F_Schlick(f0, LdotH);


        // Geometry  G(V, L )
        float G     = G_SmithGGX(NdotL, NdotV, roughness);
        // cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3

        // original weight
        vec3 weight = F * G * D / (4.0 * NdotV);

        if ( NdotL > 0.0 && pdf > 0.0 )
        {
            // could we remove the transform ?
            //vec3 dir = uEnvironmentTransform * L;
            //vec3 color = textureCubeLodEXT(uEnvironment, dir, 0.0 ).rgb;
            vec3 color = getReferenceTexelEnvironmentLod( L, pdf ).rgb;

            contrib += (color * weight) * (1.0 / pdf);
        }
    }

    contrib *= 1.0/float(NB_SAMPLES);
    return contrib;
}


void computeTangentFrame( const in vec4 tangent, const in vec3 normal,
                          out vec3 tangentx,
                          out vec3 tangenty ) {

    // Build local referential
#ifdef NO_TANGENT
    vec3 upVector = abs(normal.z) < 0.999 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0);
    tangentx = normalize( cross( upVector, normal ) );
    tangenty = cross( normal, tangentx );

#else

    vec3 tang = normalize(tangent.xyz);
    vec3 binormal = tangent.w * cross(normal, tang);
    tangentx = normalize(tang - normal*dot(tang, normal)); // local tangent
    tangenty = normalize(binormal  - normal*dot(binormal, normal)  - tang*dot(binormal, tangentx)); // local bitange
#endif

}

vec3 computeIBL( const in vec4 tangent,
                 const in vec3 normal,
                 const in vec3 view,
                 const in vec3 albedo,
                 const in float roughness,
                 const in vec3 specular)
{

    //vectors used for importance sampling
    vec3 tangentX, tangentY;
    computeTangentFrame(tangent, normal, tangentX, tangentY );

    vec3 color = vec3(0.0);
    if ( albedo != color ) { // skip if no diffuse
        color += albedo * evaluateDiffuseSphericalHarmonics(normal,
                                                            view,
                                                            tangentX,
                                                            tangentY);
    }

    color += evaluateSpecularIBL(normal,
                                 view,
                                 tangentX,
                                 tangentY,
                                 roughness,
                                 specular);

    return color;
}

vec3 referenceIBL( const in vec4 tangent,
                   const in vec3 normal,
                   const in vec3 view,
                   const in vec3 albedo,
                   const in float roughness,
                   const in vec3 specular) {

    //vectors used for importance sampling
    vec3 tangentX, tangentY;
    computeTangentFrame(tangent, normal, tangentX, tangentY );

    vec3 color = vec3(0.0);
    if ( albedo != color ) { // skip if no diffuse
         color += albedo * evaluateDiffuseIBL(normal,
                                              view,
                                              tangentX,
                                              tangentY);
    }

    color += evaluateSpecularIBL(normal,
                                 view,
                                 tangentX,
                                 tangentY,
                                 roughness,
                                 specular);

    return color;
}

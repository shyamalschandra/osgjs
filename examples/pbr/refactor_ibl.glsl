vec3 tangentX;
vec3 tangentY;

float distortion(const in vec3 Wn) {
// Computes the inverse of the solid angle of the (differential) pixel in',
// the cube map pointed at by Wn
    float sinT = max(0.0000001, sqrt(1.0-Wn.y*Wn.y));
    return 1.0/sinT;
}

float computeLOD(const in vec3 Ln, const in float p)
{
    return max(0.0, (MaxLOD-1.5) - 0.5*(log(float(NB_SAMPLES)) + log( p * distortion(Ln) ))
               * INV_LOG2);
}

vec3 F_Schlick( const in vec3 f0, const in float vdh ) {
// Schlick with Spherical Gaussian approximation
// cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3
    float sphg = pow(2.0, (-5.55473*vdh - 6.98316) * vdh);
    return f0 + (vec3(1.0 ) - f0) * sphg;
}

// w is either Ln or Vn
float G1( const in float NdotW, const in float k ) {
// One generic factor of the geometry function divided by ndw
// NB : We should have k > 0
    return 1.0 / ( NdotW*(1.0-k) + k );
}

float G_SmithGGX(const in float NdotL, const in float NdotV, const in float roughness) {
// cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3
// visibility is a Cook-Torrance geometry function divided by (n.l)*(n.v)
    float k = roughness * roughness * 0.5;
    return NdotL * NdotV * G1(NdotL,k) * G1(NdotV,k);
}

float D_GGX( const in float NdotH, const in float roughness) {
	float alpha = roughness * roughness;
	float tmp = alpha / (NdotH*NdotH*(alpha*alpha-1.0)+1.0);
	return tmp * tmp * INV_PI;
}

vec3 evaluateSpecularIBL( const in mat3 iblTransform, const in vec3 N, const in vec3 V ) {

    vec3 contrib = vec3(0.0);
    float roughness = max( MaterialRoughness, 0.015);
    vec3 f0 = MaterialSpecular;


    float NdotV = max( 0.0, dot(V, N));
    float alpha = roughness*roughness;
    float alpha2 = alpha*alpha;

    float alpha2MinusOne = alpha2 - 1.0;

    vec3 H, L;

    for ( int i = 0; i < NB_SAMPLES; i++ ) {

        vec2 u = hammersley[i];

        // GGX NDF sampling
        float cosThetaH = sqrt( (1.0-u.y) / (1.0 + alpha2MinusOne * u.y) );
        float sinThetaH = sqrt(1.0 - cosThetaH*cosThetaH );
        float phiH = u.x * PI_2;

        // Convert sample from half angle to incident angle
        H = vec3( sinThetaH*cos(phiH), sinThetaH*sin(phiH), cosThetaH);
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


        // float D         = D_GGX(NdotH, roughness);
        float tmp = alpha / ( NdotH * NdotH*( alpha2MinusOne ) + 1.0);
        float D = tmp * tmp * INV_PI;

        float pdfH      = D * NdotH;
        float pdf       = pdfH / (4.0 * LdotH);

        // Implicit weight (N.L canceled out)
        //float3 F	   = F_Schlick(f0, f90, LdotH); // form Sebastien Lagarde
        vec3 F         = F_Schlick(f0, LdotH);


        // Geometry  G(V, L )
        // float G     = G_SmithGGX(NdotL, NdotV, roughness);
        // cf http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf p3
        float k = alpha * 0.5;
        // NdotL and NdotV can be simplifided later because of the weight / pdf
        // float G = NdotL * NdotV * G1(NdotL,k) * G1(NdotV,k);
        float Goptim = G1(NdotL,k) * G1(NdotV,k);

        // original weight
        // vec3 weight = F * G * D / (4.0 * NdotV);
        // optimized weight because of the weight * 1.0/pdf
        vec3 weight = F * ( Goptim * LdotH * NdotL / NdotH );

        if ( NdotL > 0.0 && pdf > 0.0 )
        {
            //contrib += g_IBL.SampleLevel(sampler, L, 0).rgb * weight / pdf;

            float lod = roughness < 0.01 ? 0.0: computeLOD( L, pdf );

            // could we remove the transform ?
            vec3 dir = iblTransform * L;

'#if ' + textureRGBE.toString(),
            'vec3 color = texturePanoramic' + textureMethod + 'Lod(environment, environmentSize, dir, lod);',
'#endif',
'#if ' + textureRGBM.toString(),
            'vec3 color = texturePanoramic' + textureMethod + 'Lod(environment, environmentSize, environmentRange, dir, lod);',
'#endif',
            //contrib += color * weight / pdf;
            contrib += color * weight;
        }
    }

    contrib *= 1.0/float(NB_SAMPLES);
    return contrib;
}

vec3 evaluateDiffuseIBL( const in mat3 iblTransform, const in vec3 N, const in vec3 V ) {

    vec3 contrib = vec3(0.0);

    for ( int i = 0; i < NB_SAMPLES; i++ ) {

        // get sample
        vec2 u = hammersley[i];

        // compute L vector from importance sampling with cos
        float sinT = sqrt( 1.0-u.y );
        float phi = 2.0*PI*u.x;
        vec3 L = (sinT*cos(phi)) * tangentX + (sinT*sin(phi)) * tangentY + sqrt( u.y ) * N;

        float NdotL = dot( L, N );

        // compute pdf to get the good lod
        float pdf = max( 0.0, NdotL * INV_PI );

        float lod = computeLOD(L, pdf);
        vec3 dir = iblTransform * L;

'#if ' + textureRGBE.toString(),
    'vec3 texel = texturePanoramic' + textureMethod + 'Lod(environment, environmentSize, dir, lod);',
'#endif',

'#if ' + textureRGBM.toString(),
    'vec3 texel = texturePanoramic' + textureMethod + 'Lod(environment, environmentSize, environmentRange, dir, lodDiffuse);',
'#endif',

      contrib += texel;
   }

   contrib *= MaterialAlbedo * MaterialAO * ( 1.0 / float(NB_SAMPLES) );
   return contrib;
}

vec3 solid2( const in mat3 iblTransform, const in vec3 normal, const in vec3 view) {

    MaxLOD = log ( environmentSize[0] ) * INV_LOG2 - 1.0;
    vec3 color = vec3(0.0);

    //vectors used for importance sampling
    vec3 tangent = normalize(osg_FragTangent.xyz);
    vec3 binormal = osg_FragTangent.w * cross(normal, tangent);
    tangentX = normalize(tangent - normal*dot(tangent, normal)); // local tangent
    tangentY = normalize(binormal  - normal*dot(binormal, normal)  - tangentX*dot(binormal, tangentX)); // local bitange

    color += evaluateDiffuseIBL(iblTransform, normal, view );
    color += evaluateSpecularIBL(iblTransform, normal, view );
    color *= hdrExposure;
    return linearTosRGB( color, DefaultGamma);
}

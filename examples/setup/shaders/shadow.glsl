float ChebychevInequality (vec2 moments, float t)
{
	// No shadow if depth of fragment is in front
	if ( t <= moments.x )
		return 1.0;

	// Calculate variance, which is actually the amount of
	// error due to precision loss from fp32 to RG/BA
	// (moment1 / moment2)
	float variance = moments.y - (moments.x * moments.x);
	variance = max(variance, 0.02);

	// Calculate the upper bound
	float d = t - moments.x;
	return variance / (variance + d * d);
}

/// light bleeding when shadows overlap.
float linstep(float low, float high, float v){
    return clamp((v-low)/(high-low), 0.0, 1.0);
}

float ChebyshevUpperBound(vec2 moments, float mean, float bias, float minVariance)
{
    float d = mean - moments.x;
	if ( d <= 0.0 )
    {
        return 1.0;
    }

    // Compute variance    
    float variance = moments.y - (moments.x * moments.x);
    variance = max(variance, minVariance);

    // Compute probabilistic upper bound
    float p = smoothstep(mean - bias, mean, moments.x);
    //ReduceLightBleeding
    // Remove the [0, Amount] tail and linearly rescale (Amount, 1].  
    float pMax = linstep(0.2, 1.0, variance / (variance + d*d));
    // One-tailed Chebyshev 
    return clamp(max(p, pMax), 0.0, 1.0);
}

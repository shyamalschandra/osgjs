
vec4 ftransform() {
	return ProjectionMatrix  * ModelViewMatrix * vec4(Vertex, 1.0);
}
vec3 computeNormal() {
	return vec3(NormalMatrix * vec4(Normal, 0.0));
}
vec3 computeEyeVertex() {
	return vec3(ModelViewMatrix * vec4(Vertex,1.0));
}
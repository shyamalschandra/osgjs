vec4 ftransform() {
	return ProjectionMatrix  * ViewMatrix * ModelMatrix * vec4(Vertex, 1.0);
}
vec3 computeNormal() {
	return vec3(ViewMatrix * ModelMatrix  * vec4(Normal, 0.0));
}
vec3 computeEyeVertex() {
	return vec3(ViewMatrix * ModelMatrix * vec4(Vertex,1.0));
}

void eye_world_transform(
	in mat4 p_ProjectionMatrix, in mat4 p_ViewMatrix, in mat4 p_ModelMatrix,
	in vec4 p_Vertex, in vec4 p_Normal,
	out mat4 p_ProjViewModelMatrix, out mat4 p_ModelViewMatrix,
	out vec4 p_WorldPos,
	out vec4 p_EyePos,
	out vec4 p_EyeNormal,
	out vec4 p_ProjEyePos) {
	p_WorldPos = p_ModelMatrix * p_Vertex;
	p_ModelViewMatrix =  p_ViewMatrix * p_ModelMatrix;
	p_EyePos = p_ModelViewMatrix * p_Vertex;
	p_EyeNormal = p_ModelViewMatrix  * p_Normal;
	p_ProjViewModelMatrix = p_ProjectionMatrix  * p_ModelViewMatrix;
	p_ProjEyePos = p_ProjViewModelMatrix * p_Vertex;
}

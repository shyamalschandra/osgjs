#ifdef GL_ES
precision highp float;
#endif

attribute vec3 Vertex;
attribute vec4 Color;
attribute vec3 Normal;

uniform float ArrayColorEnabled;

 uniform mat4 ViewMatrix;
 uniform mat4 ModelMatrix;
uniform mat4 ModelViewMatrix;
uniform mat4 ProjectionMatrix;
uniform mat4 NormalMatrix;

varying vec4 VertexColor;


attribute vec2 TexCoord0;
varying vec2 FragTexCoord0;


// shadow stuff
uniform int Light0_uniform_enable;
// shadow 0
uniform mat4 Shadow_Projection0;
uniform mat4 Shadow_View0;
uniform vec4 Shadow_DepthRange0;

varying vec4 Shadow_VertexProjected0;
varying vec4 Shadow_Z0;

uniform int Light1_uniform_enable;
// shadow 1
uniform mat4 Shadow_Projection1;
uniform mat4 Shadow_View1;
uniform vec4 Shadow_DepthRange1;

varying vec4  Shadow_VertexProjected1;
varying vec4 Shadow_Z1;

uniform int Light2_uniform_enable;
// shadow 2
uniform mat4 Shadow_Projection2;
uniform mat4 Shadow_View2;
uniform vec4 Shadow_DepthRange2;

varying vec4  Shadow_VertexProjected2;
varying vec4 Shadow_Z2;

varying vec3 FragNormal;
varying vec3 FragEyeVector;

#pragma include "common.vert"

void main(void) {
	gl_Position = ftransform();
	if (ArrayColorEnabled == 1.0)
		VertexColor = Color;
	else
		VertexColor = vec4(1.0,1.0,1.0,1.0);
	gl_PointSize = 1.0;

	FragEyeVector = computeEyeVertex();
	FragNormal = computeNormal();

	// Project the vertex from the light's point of view
	vec4 worldPosition =  ModelMatrix *  vec4(Vertex,1.0);

	/// The scale matrix is used to push the projected vertex into the 0.0 - 1.0 region.
	/// Similar in role to a * 0.5 + 0.5, where -1.0 < a < 1.0.
	//const mat4 ScaleMatrix = mat4(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);
	if (Light0_uniform_enable == 1) {
		Shadow_Z0 =  Shadow_View0 * worldPosition;
		Shadow_VertexProjected0 =  Shadow_Projection0 * Shadow_Z0;
		//Shadow_VertexProjected0 =  ScaleMatrix * Shadow_VertexProjected0;
	}
	if (Light1_uniform_enable == 1) {
		Shadow_Z1 =  Shadow_View1 * worldPosition;
		Shadow_VertexProjected1 =  Shadow_Projection1  * Shadow_Z1;
		//Shadow_VertexProjected1 =  ScaleMatrix * Shadow_VertexProjected1;
	}
	if (Light2_uniform_enable == 1) {
		Shadow_Z2 =  Shadow_View2 * worldPosition;
		Shadow_VertexProjected2 =  Shadow_Projection2   *  Shadow_Z2;
		//Shadow_VertexProjected2 =  ScaleMatrix * Shadow_VertexProjected1;
	}

	FragTexCoord0 = TexCoord0;
} 




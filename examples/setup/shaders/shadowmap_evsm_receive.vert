#ifdef GL_ES
precision highp float;
#endif

attribute vec3 Vertex;
attribute vec4 Color;
attribute vec3 Normal;

uniform float ArrayColorEnabled;
uniform mat4 ModelViewMatrix;
uniform mat4 invViewMatrix;
uniform mat4 ProjectionMatrix;
uniform mat4 NormalMatrix;

varying vec4 VertexColor;


attribute vec2 TexCoord0;
varying vec2 FragTexCoord0;


// shadow stuff
uniform int Light0_uniform_enable;
// shadow 0
uniform mat4 Shadow_Projection0;
uniform mat4 Shadow_ModelView0;
uniform vec4 Shadow_DepthRange0;

varying vec4  Shadow_VertexProjected0;
varying float Shadow_Z0;

uniform int Light1_uniform_enable;
// shadow 1
uniform mat4 Shadow_Projection1;
uniform mat4 Shadow_ModelView1;
uniform vec4 Shadow_DepthRange1;

varying vec4  Shadow_VertexProjected1;
varying float Shadow_Z1;

uniform int Light2_uniform_enable;
// shadow 2
uniform mat4 Shadow_Projection2;
uniform mat4 Shadow_ModelView2;
uniform vec4 Shadow_DepthRange2;

varying vec4  Shadow_VertexProjected2;
varying float Shadow_Z2;

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

	Shadow_Z0 = -1.0;
	Shadow_Z1 = -1.0;
	Shadow_Z2 = -1.0;

	//reuse var accross lights
	vec4 shadowPosition;

	if (Light0_uniform_enable == 1) {
		shadowPosition = Shadow_ModelView0 * invViewMatrix * ModelViewMatrix *  vec4(Vertex,1.0);
		Shadow_VertexProjected0 = Shadow_Projection0 * shadowPosition;
		Shadow_Z0 =  (length(shadowPosition.xyz) - Shadow_DepthRange0.x) * Shadow_DepthRange0.w;
	}
	if (Light1_uniform_enable == 1) {
		shadowPosition =  Shadow_ModelView1 * invViewMatrix * ModelViewMatrix *  vec4(Vertex,1.0);
		Shadow_VertexProjected1 = Shadow_Projection1 * shadowPosition;
		Shadow_Z1 =  (length(shadowPosition.xyz)- Shadow_DepthRange1.x) * Shadow_DepthRange1.w;
	}
	if (Light2_uniform_enable == 1) {
		shadowPosition =  Shadow_ModelView2 * invViewMatrix * ModelViewMatrix *  vec4(Vertex,1.0);	
		Shadow_VertexProjected2 = Shadow_Projection2 * shadowPosition;
		Shadow_Z2 =  (length(shadowPosition.xyz) - Shadow_DepthRange2.x) * Shadow_DepthRange2.w;
	}

	FragTexCoord0 = TexCoord0;
} 




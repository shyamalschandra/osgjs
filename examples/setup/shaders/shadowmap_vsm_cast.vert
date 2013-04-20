#ifdef GL_ES
 precision highp float;
#endif

 attribute vec3 Vertex;

 uniform mat4 ViewMatrix;
 uniform mat4 ModelMatrix;
 uniform mat4 ProjectionMatrix;

 uniform mat4 Shadow_View;
 uniform mat4 Shadow_Projection;
 
 varying vec4 WorldPos;


const mat4 biasMatrix = mat4(   0.5, 0.0, 0.0, 0.0,
							0.0, 0.5, 0.0, 0.0,
							0.0, 0.0, 0.5, 0.0,
							0.5, 0.5, 0.5, 1.0);

 void main(void) {
   WorldPos = ViewMatrix * ModelMatrix * vec4(Vertex,1.0);
   gl_Position = ProjectionMatrix  * WorldPos;
}


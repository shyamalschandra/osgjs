#ifdef GL_ES
 precision highp float;
#endif

attribute vec3 Vertex;


 uniform mat4 ViewMatrix;
 uniform mat4 ModelMatrix;
 uniform mat4 ProjectionMatrix;


 varying vec4 WorldPos;

 void main(void) {
   WorldPos = ViewMatrix * ModelMatrix * vec4(Vertex,1.0);
   gl_Position = ProjectionMatrix  * WorldPos;
}


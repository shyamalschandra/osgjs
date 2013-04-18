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

 void main(void) {
   WorldPos = ModelMatrix * vec4(Vertex,1.0);
   gl_Position = Shadow_Projection * Shadow_View * WorldPos;
   WorldPos =  Shadow_View * WorldPos;
}
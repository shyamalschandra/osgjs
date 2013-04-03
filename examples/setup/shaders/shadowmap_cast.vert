#ifdef GL_ES
 precision highp float;
#endif

attribute vec3 Vertex;


 uniform mat4 ViewMatrix;
 uniform mat4 ModelMatrix;
 uniform mat4 ModelViewMatrix;
 uniform mat4 ProjectionMatrix;

 uniform mat4 Shadow_ModelView;
 uniform mat4 Shadow_Projection;

 uniform mat4 invShadowViewMatrix;

 varying vec4 WorldPos;
 varying float z;

 void main(void) {
   gl_Position = Shadow_Projection  * ModelViewMatrix * vec4(Vertex,1.0);
   WorldPos = ModelViewMatrix *  vec4(Vertex,1.0);
} 

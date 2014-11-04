#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

attribute vec3 Vertex;
attribute vec3 Normal;
attribute vec2 TexCoord0;
attribute vec4 Tangent;

uniform mat4 ModelViewMatrix;
uniform mat4 ProjectionMatrix;
uniform mat4 NormalMatrix;


#ifdef BACKGROUND

varying vec3 osg_FragVertex;

#else

varying vec3 osg_FragEye;
varying vec3 osg_FragNormal;
varying vec4 osg_FragTangent;
varying vec2 osg_FragTexCoord0;

#endif


void main(void) {

#ifdef BACKGROUND
    osg_FragVertex = Vertex;
#else
    osg_FragEye = vec3(ModelViewMatrix * vec4(Vertex, 1.0));
    osg_FragNormal = vec3(NormalMatrix * vec4(Normal, 0.0));
    osg_FragTangent = NormalMatrix * Tangent;
    osg_FragTexCoord0 = TexCoord0;
#endif
    gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);
}

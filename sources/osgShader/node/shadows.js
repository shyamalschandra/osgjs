define( [
    'osg/Utils',
    'osgShader/utils',
    'osgShader/node/Node'

], function ( MACROUTILS, ShaderUtils, Node ) {
    'use strict';

    // TODO : use GLSL libraries shadow.glsl
    var ShadowNode = function ( shadowOutput, lightedOutput, lighted, lightPos, lightDir, lightNDL, lighting, light, bias, VsmEpsilon, exponent1, exponent, debug /* tex */ ) {
        Node.call( this );

        this._lighting = lighting;
        this._light = light;
        this._lightedOutput = lightedOutput;
        this._lighted = lighted;
        this._lightPos = lightPos;
        this._lightDir = lightDir;
        this._lightNDL = lightNDL;
        //this._shadowTex = tex;



        //
        //texture
        //
        this.connectInputs( lightedOutput, lighted, lightPos, lightDir, lightNDL, bias, VsmEpsilon, exponent1, exponent, debug /*, tex */ );

        this.connectOutput( shadowOutput );
    };

    ShadowNode.prototype = MACROUTILS.objectInherit( Node.prototype, {
        type: 'ShadowBasic',


        globalFunctionDeclaration: function () {
            return '#pragma include "shadowsFrag.glsl"';
        },

        connectInputsAndCallFunction: function ( name, output, inputs ) {
            // connects all inputs
            if ( inputs )
                this.connectInputs( inputs );
            this._text = ShaderUtils.callFunction( name, output, inputs );
            return this;
        },

        computeFragment: function () {
            return this._text;
        },


        createFragmentShaderGraph: function ( context ) {

            // Common
            var normal = this._lighting._normal;
            var shadowDepthRange = context.getOrCreateUniform( 'vec4', 'Shadow_DepthRange0' );
            var shadowMapSize = context.getOrCreateUniform( 'vec4', 'Shadow_MapSize0' );

            //
            var shadowVertexProjected = context.getOrCreateVarying( 'vec4', 'Shadow_VertexProjected0' );
            var shadowZ = context.getOrCreateVarying( 'vec4', 'Shadow_Z0' );


            var inputs = [
                shadowVertexProjected, shadowZ,
                /*this._shadowTex,*/
                shadowMapSize,
                shadowDepthRange, this._lightPos, this._lightNDL, normal
            ];

            this.connectInputsAndCallFunction( 'computeShadow', this.getOutput(), inputs );
            return this;
        }

    } );

    return ShadowNode;
} );
define( [
    'osg/Utils',
    'osgShader/utils',
    'osgShader/node',
    'osgShader/node/Node',
    'osgShader/node/shadows'

], function ( MACROUTILS, ShaderUtils, shaderNode, Node, ShadowNode ) {
    'use strict';


    // maybe we will need a struct later for the material
    var Lighting = function ( output, lights, normal, eyeVector, ambient, diffuse, specular, shininess ) {

        Node.call( this, ambient, diffuse, specular, shininess );

        this._lights = lights || [];
        this._normal = normal;
        this._eyeVector = eyeVector;
        this._ambientColor = ambient;
        this._diffuseColor = diffuse;
        this._specularColor = specular;
        this._shininess = shininess;

        this.connectInputs( this._ambientColor, this._diffuseColor, this.specularColor, this.shininess, this._normal, this._eyeVector );

        this.connectOutput( output );
    };

    Lighting.prototype = MACROUTILS.objectInherit( Node.prototype, {

        type: 'Light',

        createFragmentShaderGraph: function ( context ) {

            shaderNode = require( 'osgShader/node' );

            var lightInputs = [];

            var bias = context.getOrCreateUniform( 'float', 'bias' );
            var VsmEpsilon = context.getOrCreateUniform( 'float', 'VsmEpsilon' );
            var exponent = context.getOrCreateUniform( 'float', 'exponent' );
            var exponent1 = context.getOrCreateUniform( 'float', 'exponent1' );
            var debug = context.getOrCreateUniform( 'float', 'debug' );

            var lightNode;
            var shadowNode;

            var lightedOutput = context.getOrCreateVariable( 'vec4', 'lightTempOutput' );
            var lighted = context.getOrCreateVariable( 'bool', 'lighted' );
            var lightPos = context.getOrCreateVariable( 'vec3', 'eyePosWorld' );
            var lightDir = context.getOrCreateVariable( 'vec3', 'eyeDirWorld' );
            var lightDNL = context.getOrCreateVariable( 'float', 'lightNDL' );
            var shadowTempOutput = context.getOrCreateVariable( 'vec4', 'shadowContribTempOutput' );
            var lightAndShadowTempOutput = context.getOrCreateVariable( 'vec4', 'lightAndShadowTempOutput' );

            for ( var i = 0; i < this._lights.length; i++ ) {

                var light = this._lights[ i ];

                switch ( light.getLightType() ) {
                case 'DIRECTION':
                    lightNode = new SunLight( lightedOutput, this, light, lighted, lightPos, lightDir, lightDNL );
                    break;
                case 'SPOT':
                    lightNode = new SpotLight( lightedOutput, this, light, lighted, lightPos, lightDir, lightDNL );
                    break;
                default:
                case 'POINT':
                    lightNode = new PointLight( lightedOutput, this, light, lighted, lightPos, lightDir, lightDNL );
                    break;
                }

                lightNode.createFragmentShaderGraph( context );

                if ( light._shadowTechnique ) {


                    /*

                    var textures = context._texturesByName;
                    // TODO: texture name should be its name ?
                    //var tex = textures[ 'shadow_' + light.getName() ];
                    var tex = textures[ 'Texture1' ];
                    if ( !tex )
                        tex = textures[ 'Texture0' ];
 */
                    shadowNode = new ShadowNode( shadowTempOutput, lightedOutput, lighted, lightPos, lightDir, lightDNL, this, light, bias, VsmEpsilon, exponent1, exponent, debug );

                    new shaderNode.Mult( lightAndShadowTempOutput, lightedOutput, shadowTempOutput );
                    lightInputs.push( lightAndShadowTempOutput );


                    shadowNode.createFragmentShaderGraph( context );


                } else {
                    lightInputs.push( lightedOutput );
                }
            }

            new shaderNode.Add( this.getOutput(), lightInputs );

        }
    } );



    // base class for all point based light: Point/Directional/Spot/Hemi
    // avoid duplicate code
    var NodeLightsPointBased = function ( output, lighting, light, lighted, lightPos, lightDir, lightDNL ) {

        Node.call( this );

        this.connectOutput( output );

        this._lighting = lighting;
        this._light = light;

        this._lighted = lighted;
        this._lightPos = lightPos;
        this._lightDir = lightDir;
        this._lightNDL = lightDNL;

        this.connectInputs( this._ambientColor, this._diffuseColor, this.specularColor, this.shininess, lighting._normal, lighting._eyeVector, lighted, lightPos, lightDir, lightDNL );
    };

    NodeLightsPointBased.prototype = MACROUTILS.objectInherit( Node.prototype, {

        globalFunctionDeclaration: function () {
            return '#pragma include "lights.glsl"';
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
        }

    } );



    var PointLight = function ( output, lighting, light, lighted, lightPos, lightDir, lightDNL ) {

        NodeLightsPointBased.call( this, output, lighting, light, lighted, lightPos, lightDir, lightDNL );

    };

    PointLight.prototype = MACROUTILS.objectInherit( NodeLightsPointBased.prototype, {

        type: 'PointLight',

        createFragmentShaderGraph: function ( context ) {

            // Common
            var normal = this._lighting._normal;
            var eyeVector = this._lighting._eyeVector;

            // light specifics
            var nodeLight = this._light;
            var lightUniforms = nodeLight.getOrCreateUniforms();

            // connect variable to light node
            var lightAttenuation = context.getOrCreateUniform( lightUniforms.attenuation );
            var lightPosition = context.getOrCreateUniform( lightUniforms.position );
            var lightDiffuseColor = context.getOrCreateUniform( lightUniforms.diffuse );
            var lightAmbientColor = context.getOrCreateUniform( lightUniforms.ambient );
            var lightSpecularColor = context.getOrCreateUniform( lightUniforms.specular );

            var lightMatrix = context.getOrCreateUniform( lightUniforms.matrix );
            var lightInvMatrix = context.getOrCreateUniform( lightUniforms.invMatrix );

            var inputs = [
                normal, eyeVector,
                // materials data
                this._lighting._ambientColor, this._lighting._diffuseColor, this._lighting._specularColor, this._lighting._shininess,
                // light data
                lightAmbientColor, lightDiffuseColor, lightSpecularColor, lightPosition, lightAttenuation,
                lightMatrix, lightInvMatrix, // light matrix
                this._lightPos, this._lightDir,
                this._lightNDL, this._lighted
            ];

            this.connectInputsAndCallFunction( 'computePointLightShading', this.getOutput(), inputs );
            return this;
        }

    } );



    var SpotLight = function ( output, lighting, light, lighted, lightPos, lightDir, lightDNL ) {

        NodeLightsPointBased.call( this, output, lighting, light, lighted, lightPos, lightDir, lightDNL );

    };

    SpotLight.prototype = MACROUTILS.objectInherit( NodeLightsPointBased.prototype, {

        type: 'SpotLight',

        createFragmentShaderGraph: function ( context ) {
            // Common
            var normal = this._lighting._normal;
            var eyeVector = this._lighting._eyeVector;

            // light specifics
            var nodeLight = this._light;
            var lightUniforms = nodeLight.getOrCreateUniforms();

            // connect variable to light node
            var lightAttenuation = context.getOrCreateUniform( lightUniforms.attenuation );
            var lightPosition = context.getOrCreateUniform( lightUniforms.position );
            var lightDirection = context.getOrCreateUniform( lightUniforms.direction );
            var lightSpotCutOff = context.getOrCreateUniform( lightUniforms.spotCutOff );
            var lightSpotBlend = context.getOrCreateUniform( lightUniforms.spotBlend );

            var lightDiffuseColor = context.getOrCreateUniform( lightUniforms.diffuse );
            var lightAmbientColor = context.getOrCreateUniform( lightUniforms.ambient );
            var lightSpecularColor = context.getOrCreateUniform( lightUniforms.specular );

            var lightMatrix = context.getOrCreateUniform( lightUniforms.matrix );
            var lightInvMatrix = context.getOrCreateUniform( lightUniforms.invMatrix );


            var inputs = [
                normal, eyeVector,
                // materials data
                this._lighting._ambientColor, this._lighting._diffuseColor, this._lighting._specularColor, this._lighting._shininess,
                // common lights data
                lightAmbientColor, lightDiffuseColor, lightSpecularColor,
                // specific lights data
                lightDirection, lightAttenuation, lightPosition,
                lightSpotCutOff, lightSpotBlend,
                lightMatrix, lightInvMatrix, // light matrix
                this._lightPos, this._lightDir,
                this._lightNDL, this._lighted
            ];

            this.connectInputsAndCallFunction( 'computeSpotLightShading', this.getOutput(), inputs );
            return this;
        }

    } );


    var SunLight = function ( output, lighting, light, lighted, lightPos, lightDir, lightDNL ) {

        NodeLightsPointBased.call( this, output, lighting, light, lighted, lightPos, lightDir, lightDNL );

    };

    SunLight.prototype = MACROUTILS.objectInherit( NodeLightsPointBased.prototype, {

        type: 'SunLight',

        createFragmentShaderGraph: function ( context ) {
            // Common
            var normal = this._lighting._normal;
            var eyeVector = this._lighting._eyeVector;

            // light specifics
            var nodeLight = this._light;
            var lightUniforms = nodeLight.getOrCreateUniforms();

            // connect variable to light node
            var lightDirection = context.getOrCreateUniform( lightUniforms.position );
            var lightDiffuseColor = context.getOrCreateUniform( lightUniforms.diffuse );
            var lightAmbientColor = context.getOrCreateUniform( lightUniforms.ambient );
            var lightSpecularColor = context.getOrCreateUniform( lightUniforms.specular );

            var lightMatrix = context.getOrCreateUniform( lightUniforms.matrix );
            var lightInvMatrix = context.getOrCreateUniform( lightUniforms.invMatrix );


            var inputs = [
                normal, eyeVector,
                // materials data
                this._lighting._ambientColor, this._lighting._diffuseColor, this._lighting._specularColor, this._lighting._shininess,
                // lights data
                lightAmbientColor, lightDiffuseColor, lightSpecularColor, lightDirection,
                lightMatrix, lightInvMatrix, // light matrix
                this._lightPos, this._lightDir,
                this._lightNDL, this._lighted
            ];

            this.connectInputsAndCallFunction( 'computeSunLightShading', this.getOutput(), inputs );
            return this;
        }
    } );


    return {
        'Lighting': Lighting,
        'PointLight': PointLight,
        'SpotLight': SpotLight,
        'SunLight': SunLight
    };

} );
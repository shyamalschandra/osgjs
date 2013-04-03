/** -*- compile-command: "jslint-cli Node.js" -*- */

/**
 *  ShadowTechniqueEVSM
 *  @class ShadowTechniqueEVSM
 */
osg.ShadowTechniqueEVSM = function(ShadowTechniqueEVSMNumber) {
	osg.StateAttribute.call(this);

	if (ShadowTechniqueEVSMNumber === undefined) {
		ShadowTechniqueEVSMNumber = 0;
	}

	this._position = [0.0, 0.0, 1.0, 0.0];
	this._direction = [0.0, 0.0, -1.0];
	this._ShadowTechniqueEVSMUnit = ShadowTechniqueEVSMNumber;
	this._enabled = 0;

	this.dirty();
};

/** @lends osg.ShadowTechniqueEVSM.prototype */
osg.ShadowTechniqueEVSM.uniforms = {};
osg.ShadowTechniqueEVSM.prototype = osg.objectLibraryClass(osg.objectInehrit(osg.StateAttribute.prototype, {
	attributeType: "ShadowTechniqueEVSM",
	cloneType: function() {
		return new osg.ShadowTechniqueEVSM(this._ShadowTechniqueEVSMUnit);
	},
	getType: function() {
		return this.attributeType;
	},
	getTypeMember: function() {
		return this.attributeType + this._ShadowTechniqueEVSMUnit;
	},
	getOrCreateUniforms: function() {
		var uniforms = osg.ShadowTechniqueEVSM.uniforms;
		var typeMember = this.getTypeMember();
		if (uniforms[typeMember] === undefined) {
			var uFact = osg.Uniform;
			uniforms[typeMember] = {
				"enable": uFact.createInt1(0, this.getUniformName('enable')),
				"matrix": uFact.createMatrix4(osg.Matrix.makeIdentity([]), this.getUniformName('matrix')),
				"invMatrix": uFact.createMatrix4(osg.Matrix.makeIdentity([]), this.getUniformName('invMatrix'))
			};

			uniforms[typeMember].uniformKeys = Object.keys(uniforms[typeMember]);
		}
		return uniforms[typeMember];
	},

	setPosition: function(pos) {
		osg.Vec4.copy(pos, this._position);
	},
	getPosition: function() {
		return this._position;
	},

	setDirection: function(a) {
		this._direction = a;
		this.dirty();
	},
	getDirection: function() {
		return this._direction;
	},

	setShadowTechniqueEVSMNumber: function(unit) {
		this._ShadowTechniqueEVSMUnit = unit;
		this.dirty();
	},
	getShadowTechniqueEVSMNumber: function() {
		return this._ShadowTechniqueEVSMUnit;
	},

	getPrefix: function() {
		return this.getType() + this._ShadowTechniqueEVSMUnit;
	},
	getParameterName: function(name) {
		return this.getPrefix() + "_" + name;
	},
	getUniformName: function(name) {
		return this.getPrefix() + "_uniform_" + name;
	},

	applyPositionedUniform: function(matrix, state) {
		var uniform = this.getOrCreateUniforms();
		osg.Matrix.copy(matrix, uniform.matrix.get());
		uniform.matrix.dirty();

		osg.Matrix.copy(matrix, uniform.invMatrix.get());
		uniform.invMatrix.get()[12] = 0;
		uniform.invMatrix.get()[13] = 0;
		uniform.invMatrix.get()[14] = 0;
		osg.Matrix.inverse(uniform.invMatrix.get(), uniform.invMatrix.get());
		osg.Matrix.transpose(uniform.invMatrix.get(), uniform.invMatrix.get());
		uniform.invMatrix.dirty();
	},

	apply: function(state) {
		var ShadowTechniqueEVSM = this.getOrCreateUniforms();

		//ShadowTechniqueEVSM._enable.set([this.enable]);

		this.setClean();
	},


	_replace: function(prefix, list, text, func) {
		for (var i = 0, l = list.length; i < l; i++) {
			var regex = new RegExp(prefix + list[i], 'g');
			text = text.replace(regex, func.call(this, list[i]));
		}
		return text;
	},

	// will contain functions to generate shader
	_shader: {},
	_shaderCommon: {},

	generateShader: function(type) {
		if (this._shader[type]) {
			return this._shader[type].call(this);
		}
		return "";
	},

	generateShaderCommon: function(type) {
		if (this._shaderCommon[type]) {
			return this._shaderCommon[type].call(this);
		}
		return "";
	}


}), "osg", "ShadowTechniqueEVSM");


// common shader generation functions
osg.ShadowTechniqueEVSM.prototype._shaderCommon[osg.ShaderGeneratorType.VertexInit] = function() {
	return ["",
		"varying vec3 FragNormal;",
		"varying vec3 FragEyeVector;",
		"",
		""].join('\n');
};

osg.ShadowTechniqueEVSM.prototype._shaderCommon[osg.ShaderGeneratorType.VertexFunction] = function() {
	return ["",
		"vec3 computeNormal() {",
		"   return vec3(NormalMatrix * vec4(Normal, 0.0));",
		"}",
		"",
		"vec3 computeEyeVertex() {",
		"   return vec3(ModelViewMatrix * vec4(Vertex,1.0));",
		"}",
		"",
		""].join('\n');
};

osg.ShadowTechniqueEVSM.prototype._shaderCommon[osg.ShaderGeneratorType.VertexMain] = function() {
	return ["",
		"  FragEyeVector = computeEyeVertex();",
		"  FragNormal = computeNormal();",
		""].join('\n');
};

osg.ShadowTechniqueEVSM.prototype._shaderCommon[osg.ShaderGeneratorType.FragmentInit] = function() {
	return ["varying vec3 FragNormal;",
		"varying vec3 FragEyeVector;",
		""].join('\n');
};

osg.ShadowTechniqueEVSM.prototype._shaderCommon[osg.ShaderGeneratorType.FragmentFunction] = function() {
	return ["",
		"float getShadowTechniqueEVSMAttenuation(vec3 ShadowTechniqueEVSMDir, float constant, float linear, float quadratic) {",
		"    ",
		"    float d = length(ShadowTechniqueEVSMDir);",
		"    float att = 1.0 / ( constant + linear*d + quadratic*d*d);",
		"    return att;",
		"}",
		"vec4 computeShadowTechniqueEVSMContribution(vec4 materialAmbient,",
		"                              vec4 materialDiffuse,",
		"                              vec4 materialSpecular,",
		"                              float materialShininess,",
		"                              vec4 ShadowTechniqueEVSMAmbient,",
		"                              vec4 ShadowTechniqueEVSMDiffuse,",
		"                              vec4 ShadowTechniqueEVSMSpecular,",
		"                              vec3 normal,",
		"                              vec3 eye,",
		"                              vec3 ShadowTechniqueEVSMDirection,",
		"                              vec3 ShadowTechniqueEVSMSpotDirection,",
		"                              float ShadowTechniqueEVSMCosSpotCutoff,",
		"                              float ShadowTechniqueEVSMSpotBlend,",
		"                              float ShadowTechniqueEVSMAttenuation)",
		"{",
		"    vec3 L = ShadowTechniqueEVSMDirection;",
		"    vec3 N = normal;",
		"    float NdotL = max(dot(L, N), 0.0);",
		"    float halfTerm = NdotL;",
		"    vec4 ambient = ShadowTechniqueEVSMAmbient;",
		"    vec4 diffuse = vec4(0.0);",
		"    vec4 specular = vec4(0.0);",
		"    float spot = 0.0;",
		"",
		"    if (NdotL > 0.0) {",
		"        vec3 E = eye;",
		"        vec3 R = reflect(-L, N);",
		"        float RdotE = max(dot(R, E), 0.0);",
		"        if ( RdotE > 0.0) {",
		"           RdotE = pow( RdotE, materialShininess );",
		"        }",
		"        vec3 D = ShadowTechniqueEVSMSpotDirection;",
		"        spot = 1.0;",
		"        if (ShadowTechniqueEVSMCosSpotCutoff > 0.0) {",
		"          float cosCurAngle = dot(-L, D);",
		"          if (cosCurAngle < ShadowTechniqueEVSMCosSpotCutoff) {",
		"             spot = 0.0;",
		"          } else {",
		"             if (ShadowTechniqueEVSMSpotBlend > 0.0)",
		"               spot = cosCurAngle * smoothstep(0.0, 1.0, (cosCurAngle-ShadowTechniqueEVSMCosSpotCutoff)/(ShadowTechniqueEVSMSpotBlend));",
		"          }",
		"        }",

		"        diffuse = ShadowTechniqueEVSMDiffuse * ((halfTerm));",
		"        specular = ShadowTechniqueEVSMSpecular * RdotE;",
		"    }",
		"",
		"    return (materialAmbient*ambient + (materialDiffuse*diffuse + materialSpecular*specular) * spot) * ShadowTechniqueEVSMAttenuation;",
		"}",
		"float linearrgb_to_srgb1(const in float c)",
		"{",
		"  float v = 0.0;",
		"  if(c < 0.0031308) {",
		"    if ( c > 0.0)",
		"      v = c * 12.92;",
		"  } else {",
		"    v = 1.055 * pow(c, 1.0/2.4) - 0.055;",
		"  }",
		"  return v;",
		"}",

		"vec4 linearrgb_to_srgb(const in vec4 col_from)",
		"{",
		"  vec4 col_to;",
		"  col_to.r = linearrgb_to_srgb1(col_from.r);",
		"  col_to.g = linearrgb_to_srgb1(col_from.g);",
		"  col_to.b = linearrgb_to_srgb1(col_from.b);",
		"  col_to.a = col_from.a;",
		"  return col_to;",
		"}",
		"float srgb_to_linearrgb1(const in float c)",
		"{",
		"  float v = 0.0;",
		"  if(c < 0.04045) {",
		"    if (c >= 0.0)",
		"      v = c * (1.0/12.92);",
		"  } else {",
		"    v = pow((c + 0.055)*(1.0/1.055), 2.4);",
		"  }",
		" return v;",
		"}",
		"vec4 srgb2linear(const in vec4 col_from)",
		"{",
		"  vec4 col_to;",
		"  col_to.r = srgb_to_linearrgb1(col_from.r);",
		"  col_to.g = srgb_to_linearrgb1(col_from.g);",
		"  col_to.b = srgb_to_linearrgb1(col_from.b);",
		"  col_to.a = col_from.a;",
		"  return col_to;",
		"}",

		""].join('\n');
};

osg.ShadowTechniqueEVSM.prototype._shaderCommon[osg.ShaderGeneratorType.FragmentMain] = function() {
	return ["",
		"  vec3 normal = normalize(FragNormal);",
		"  vec3 eyeVector = normalize(-FragEyeVector);",
		"  vec4 ShadowTechniqueEVSMColor = MaterialEmission;",
		""].join("\n");
};

osg.ShadowTechniqueEVSM.prototype._shaderCommon[osg.ShaderGeneratorType.FragmentEnd] = function() {
	return ["",
		"  fragColor *= ShadowTechniqueEVSMColor;",
		""].join('\n');
};


// shader generation per instance of attribute
osg.ShadowTechniqueEVSM.prototype._shader[osg.ShaderGeneratorType.FragmentInit] = function() {
	var str = ["",
		"uniform vec4 ShadowTechniqueEVSM_position;",
		"uniform vec3 ShadowTechniqueEVSM_direction;",
		"uniform mat4 ShadowTechniqueEVSM_matrix;",
		"uniform mat4 ShadowTechniqueEVSM_invMatrix;",
		"uniform float ShadowTechniqueEVSM_constantAttenuation;",
		"uniform float ShadowTechniqueEVSM_linearAttenuation;",
		"uniform float ShadowTechniqueEVSM_quadraticAttenuation;",
		"uniform vec4 ShadowTechniqueEVSM_ambient;",
		"uniform vec4 ShadowTechniqueEVSM_diffuse;",
		"uniform vec4 ShadowTechniqueEVSM_specular;",
		"uniform float ShadowTechniqueEVSM_spotCutoff;",
		"uniform float ShadowTechniqueEVSM_spotBlend;",
		""].join('\n');

	// replace ShadowTechniqueEVSM_xxxx by instance variable of 'this' ShadowTechniqueEVSM
	uniforms = Object.keys(this.getOrCreateUniforms());
	str = this._replace("ShadowTechniqueEVSM_", uniforms, str, this.getUniformName);
	return str;
};

osg.ShadowTechniqueEVSM.prototype._shader[osg.ShaderGeneratorType.FragmentMain] = function() {
	var str = ["",
		"  vec3 ShadowTechniqueEVSMEye = vec3(ShadowTechniqueEVSM_matrix * ShadowTechniqueEVSM_position);",
		"  vec3 ShadowTechniqueEVSMDir;",
		"  if (ShadowTechniqueEVSM_position[3] == 1.0) {",
		"    ShadowTechniqueEVSMDir = ShadowTechniqueEVSMEye - FragEyeVector;",
		"  } else {",
		"    ShadowTechniqueEVSMDir = ShadowTechniqueEVSMEye;",
		"  }",
		"  vec3 spotDirection = normalize(mat3(vec3(ShadowTechniqueEVSM_invMatrix[0]), vec3(ShadowTechniqueEVSM_invMatrix[1]), vec3(ShadowTechniqueEVSM_invMatrix[2]))*ShadowTechniqueEVSM_direction);",
		"  float attenuation = getShadowTechniqueEVSMAttenuation(ShadowTechniqueEVSMDir, ShadowTechniqueEVSM_constantAttenuation, ShadowTechniqueEVSM_linearAttenuation, ShadowTechniqueEVSM_quadraticAttenuation);",
		"  ShadowTechniqueEVSMDir = normalize(ShadowTechniqueEVSMDir);",
		"  ShadowTechniqueEVSMColor += computeShadowTechniqueEVSMContribution(MaterialAmbient,",
		"                                         MaterialDiffuse, ",
		"                                         MaterialSpecular,",
		"                                         MaterialShininess,",
		"                                         ShadowTechniqueEVSM_ambient,",
		"                                         ShadowTechniqueEVSM_diffuse,",
		"                                         ShadowTechniqueEVSM_specular,",
		"                                         normal,",
		"                                         eyeVector,",
		"                                         ShadowTechniqueEVSMDir,",
		"                                         spotDirection,",
		"                                         ShadowTechniqueEVSM_spotCutoff,",
		"                                         ShadowTechniqueEVSM_spotBlend,",
		"                                         attenuation);",
		""].join('\n');

	var fields = ["ShadowTechniqueEVSMEye",
		"ShadowTechniqueEVSMDir",
		"spotDirection",
		"attenuation"];
	str = this._replace("", fields, str, this.getParameterName);
	uniforms = Object.keys(this.getOrCreateUniforms());
	str = this._replace("ShadowTechniqueEVSM_", uniforms, str, this.getUniformName);
	return str;
};
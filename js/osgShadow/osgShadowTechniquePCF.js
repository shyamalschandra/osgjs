/** -*- compile-command: "jslint-cli Node.js" -*- */

/**
 *  ShadowTechniquePCF
 *  @class ShadowTechniquePCF
 */
osg.ShadowTechniquePCF = function(ShadowTechniquePCFNumber) {
	osg.StateAttribute.call(this);

	if (ShadowTechniquePCFNumber === undefined) {
		ShadowTechniquePCFNumber = 0;
	}

	this._position = [0.0, 0.0, 1.0, 0.0];
	this._direction = [0.0, 0.0, -1.0];
	this._ShadowTechniquePCFUnit = ShadowTechniquePCFNumber;
	this._enabled = 0;

	this.dirty();
};

/** @lends osg.ShadowTechniquePCF.prototype */
osg.ShadowTechniquePCF.uniforms = {};
osg.ShadowTechniquePCF.prototype = osg.objectLibraryClass(osg.objectInehrit(osg.StateAttribute.prototype, {
	attributeType: "ShadowTechniquePCF",
	cloneType: function() {
		return new osg.ShadowTechniquePCF(this._ShadowTechniquePCFUnit);
	},
	getType: function() {
		return this.attributeType;
	},
	getTypeMember: function() {
		return this.attributeType + this._ShadowTechniquePCFUnit;
	},
	getOrCreateUniforms: function() {
		var uniforms = osg.ShadowTechniquePCF.uniforms;
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

	setShadowTechniquePCFNumber: function(unit) {
		this._ShadowTechniquePCFUnit = unit;
		this.dirty();
	},
	getShadowTechniquePCFNumber: function() {
		return this._ShadowTechniquePCFUnit;
	},

	getPrefix: function() {
		return this.getType() + this._ShadowTechniquePCFUnit;
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
		var ShadowTechniquePCF = this.getOrCreateUniforms();

		//ShadowTechniquePCF._enable.set([this.enable]);

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


}), "osg", "ShadowTechniquePCF");


// common shader generation functions
osg.ShadowTechniquePCF.prototype._shaderCommon[osg.ShaderGeneratorType.VertexInit] = function() {
	return ["",
		"varying vec3 FragNormal;",
		"varying vec3 FragEyeVector;",
		"",
		""].join('\n');
};

osg.ShadowTechniquePCF.prototype._shaderCommon[osg.ShaderGeneratorType.VertexFunction] = function() {
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

osg.ShadowTechniquePCF.prototype._shaderCommon[osg.ShaderGeneratorType.VertexMain] = function() {
	return ["",
		"  FragEyeVector = computeEyeVertex();",
		"  FragNormal = computeNormal();",
		""].join('\n');
};

osg.ShadowTechniquePCF.prototype._shaderCommon[osg.ShaderGeneratorType.FragmentInit] = function() {
	return ["varying vec3 FragNormal;",
		"varying vec3 FragEyeVector;",
		""].join('\n');
};

osg.ShadowTechniquePCF.prototype._shaderCommon[osg.ShaderGeneratorType.FragmentFunction] = function() {
	return ["",
		"float getShadowTechniquePCFAttenuation(vec3 ShadowTechniquePCFDir, float constant, float linear, float quadratic) {",
		"    ",
		"    float d = length(ShadowTechniquePCFDir);",
		"    float att = 1.0 / ( constant + linear*d + quadratic*d*d);",
		"    return att;",
		"}",
		"vec4 computeShadowTechniquePCFContribution(vec4 materialAmbient,",
		"                              vec4 materialDiffuse,",
		"                              vec4 materialSpecular,",
		"                              float materialShininess,",
		"                              vec4 ShadowTechniquePCFAmbient,",
		"                              vec4 ShadowTechniquePCFDiffuse,",
		"                              vec4 ShadowTechniquePCFSpecular,",
		"                              vec3 normal,",
		"                              vec3 eye,",
		"                              vec3 ShadowTechniquePCFDirection,",
		"                              vec3 ShadowTechniquePCFSpotDirection,",
		"                              float ShadowTechniquePCFCosSpotCutoff,",
		"                              float ShadowTechniquePCFSpotBlend,",
		"                              float ShadowTechniquePCFAttenuation)",
		"{",
		"    vec3 L = ShadowTechniquePCFDirection;",
		"    vec3 N = normal;",
		"    float NdotL = max(dot(L, N), 0.0);",
		"    float halfTerm = NdotL;",
		"    vec4 ambient = ShadowTechniquePCFAmbient;",
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
		"        vec3 D = ShadowTechniquePCFSpotDirection;",
		"        spot = 1.0;",
		"        if (ShadowTechniquePCFCosSpotCutoff > 0.0) {",
		"          float cosCurAngle = dot(-L, D);",
		"          if (cosCurAngle < ShadowTechniquePCFCosSpotCutoff) {",
		"             spot = 0.0;",
		"          } else {",
		"             if (ShadowTechniquePCFSpotBlend > 0.0)",
		"               spot = cosCurAngle * smoothstep(0.0, 1.0, (cosCurAngle-ShadowTechniquePCFCosSpotCutoff)/(ShadowTechniquePCFSpotBlend));",
		"          }",
		"        }",

		"        diffuse = ShadowTechniquePCFDiffuse * ((halfTerm));",
		"        specular = ShadowTechniquePCFSpecular * RdotE;",
		"    }",
		"",
		"    return (materialAmbient*ambient + (materialDiffuse*diffuse + materialSpecular*specular) * spot) * ShadowTechniquePCFAttenuation;",
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

osg.ShadowTechniquePCF.prototype._shaderCommon[osg.ShaderGeneratorType.FragmentMain] = function() {
	return ["",
		"  vec3 normal = normalize(FragNormal);",
		"  vec3 eyeVector = normalize(-FragEyeVector);",
		"  vec4 ShadowTechniquePCFColor = MaterialEmission;",
		""].join("\n");
};

osg.ShadowTechniquePCF.prototype._shaderCommon[osg.ShaderGeneratorType.FragmentEnd] = function() {
	return ["",
		"  fragColor *= ShadowTechniquePCFColor;",
		""].join('\n');
};


// shader generation per instance of attribute
osg.ShadowTechniquePCF.prototype._shader[osg.ShaderGeneratorType.FragmentInit] = function() {
	var str = ["",
		"uniform vec4 ShadowTechniquePCF_position;",
		"uniform vec3 ShadowTechniquePCF_direction;",
		"uniform mat4 ShadowTechniquePCF_matrix;",
		"uniform mat4 ShadowTechniquePCF_invMatrix;",
		"uniform float ShadowTechniquePCF_constantAttenuation;",
		"uniform float ShadowTechniquePCF_linearAttenuation;",
		"uniform float ShadowTechniquePCF_quadraticAttenuation;",
		"uniform vec4 ShadowTechniquePCF_ambient;",
		"uniform vec4 ShadowTechniquePCF_diffuse;",
		"uniform vec4 ShadowTechniquePCF_specular;",
		"uniform float ShadowTechniquePCF_spotCutoff;",
		"uniform float ShadowTechniquePCF_spotBlend;",
		""].join('\n');

	// replace ShadowTechniquePCF_xxxx by instance variable of 'this' ShadowTechniquePCF
	uniforms = Object.keys(this.getOrCreateUniforms());
	str = this._replace("ShadowTechniquePCF_", uniforms, str, this.getUniformName);
	return str;
};

osg.ShadowTechniquePCF.prototype._shader[osg.ShaderGeneratorType.FragmentMain] = function() {
	var str = ["",
		"  vec3 ShadowTechniquePCFEye = vec3(ShadowTechniquePCF_matrix * ShadowTechniquePCF_position);",
		"  vec3 ShadowTechniquePCFDir;",
		"  if (ShadowTechniquePCF_position[3] == 1.0) {",
		"    ShadowTechniquePCFDir = ShadowTechniquePCFEye - FragEyeVector;",
		"  } else {",
		"    ShadowTechniquePCFDir = ShadowTechniquePCFEye;",
		"  }",
		"  vec3 spotDirection = normalize(mat3(vec3(ShadowTechniquePCF_invMatrix[0]), vec3(ShadowTechniquePCF_invMatrix[1]), vec3(ShadowTechniquePCF_invMatrix[2]))*ShadowTechniquePCF_direction);",
		"  float attenuation = getShadowTechniquePCFAttenuation(ShadowTechniquePCFDir, ShadowTechniquePCF_constantAttenuation, ShadowTechniquePCF_linearAttenuation, ShadowTechniquePCF_quadraticAttenuation);",
		"  ShadowTechniquePCFDir = normalize(ShadowTechniquePCFDir);",
		"  ShadowTechniquePCFColor += computeShadowTechniquePCFContribution(MaterialAmbient,",
		"                                         MaterialDiffuse, ",
		"                                         MaterialSpecular,",
		"                                         MaterialShininess,",
		"                                         ShadowTechniquePCF_ambient,",
		"                                         ShadowTechniquePCF_diffuse,",
		"                                         ShadowTechniquePCF_specular,",
		"                                         normal,",
		"                                         eyeVector,",
		"                                         ShadowTechniquePCFDir,",
		"                                         spotDirection,",
		"                                         ShadowTechniquePCF_spotCutoff,",
		"                                         ShadowTechniquePCF_spotBlend,",
		"                                         attenuation);",
		""].join('\n');

	var fields = ["ShadowTechniquePCFEye",
		"ShadowTechniquePCFDir",
		"spotDirection",
		"attenuation"];
	str = this._replace("", fields, str, this.getParameterName);
	uniforms = Object.keys(this.getOrCreateUniforms());
	str = this._replace("ShadowTechniquePCF_", uniforms, str, this.getUniformName);
	return str;
};
/** -*- compile-command: "jslint-cli Node.js" -*- */

/**
 *  ShadowTechnique
 *  @class ShadowTechnique
 */
osg.ShadowTechnique = function(ShadowTechniqueNumber, CastsShadowTraversalMask) {
	osg.StateAttribute.call(this);

	if (ShadowTechniqueNumber === undefined) {
		ShadowTechniqueNumber = 0;
	}

	if (!CastsShadowTraversalMask) CastsShadowTraversalMask = 0x2;
	this._CastsShadowTraversalMask = CastsShadowTraversalMask;

	this._position = [0.0, 0.0, 1.0, 0.0];
	this._direction = [0.0, 0.0, -1.0];
	this._ShadowTechniqueUnit = ShadowTechniqueNumber;
	this._enabled = 0;

	this._Textures = [];
	var texSize = 256;
	this._TextureSize = [texSize, texSize, 1.0 / texSize, 1.0 / texSize];

	this._biasScale = 0.0;
	this._fov = 60;
	this._ratio = 1.0;
	this._Camera = new osg.Camera();
	this._Camera.setName("light_perspective_camera" + ShadowTechniqueNumber);

	// update projection each frame, at least near/far but better a computed matrix
	this._projection = osg.Matrix.makePerspective(this._fov, this._ratio, this._depthRange.get()[0], this._depthRange.get()[0], this._projection);
	this._Camera.setProjectionMatrix(this._projection);


	// update order upon render shadow/ render scene/postproc/etc. inehritance.
	this._Camera.setRenderOrder(osg.Camera.PRE_RENDER, 0);
	this._Camera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
	this._Camera.setViewport(new osg.Viewport(0, 0, this._TextureSize[0], this._TextureSize[1]));
	this._Camera.setClearColor([1, 1, 1, 0.0]);

	this.shadowmapCasterVertex = "shadowmap_cast.vert";
	this.shadowmapCasterFragment = "shadowmap_cast.frag";
	this.shadowmapReceiverVertex = "shadowmap_receive.vert";
	this.shadowmapReceiverFragment = "shadowmap_receive.frag";
	this.textureType = osg.Texture.UNSIGNED_BYTE;
	this.textureFormat = osg.Texture.RGBA;

	this.dirty();
};

/** @lends osg.ShadowTechnique.prototype */
osg.ShadowTechnique.uniforms = {};
osg.ShadowTechnique.prototype = osg.objectLibraryClass(osg.objectInehrit(osg.StateAttribute.prototype, {
	attributeType: "Shadow",
	cloneType: function() {
		return new osg.ShadowTechnique(this._ShadowTechniqueUnit);
	},
	getType: function() {
		return this.attributeType;
	},
	getTypeMember: function() {
		return this.attributeType + this._ShadowTechniqueUnit;
	},
	getOrCreateUniforms: function() {
		var uniforms = osg.ShadowTechnique.uniforms;
		var typeMember = this.getTypeMember();
		if (uniforms[typeMember] === undefined) {
			var uFact = osg.Uniform;
			uniforms[typeMember] = {
				"depthRange": uFact.createFloat2(this.depthRange, "DepthRange"),
				"Projection": uFact.createMatrix4(osg.Matrix.makeIdentity([]), this.getUniformName('Projection')),
				"ModelView": uFact.createMatrix4(osg.Matrix.makeIdentity([]), this.getUniformName('ModelView')),
				"MapSize": uFact.createFloat4(this._TextureSize, this.getUniformName('MapSize'))
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

	setShadowTechniqueNumber: function(unit) {
		this._ShadowTechniqueUnit = unit;
		this.dirty();
	},
	getShadowTechniqueNumber: function() {
		return this._ShadowTechniqueUnit;
	},

	getPrefix: function() {
		return this.getType() + this._ShadowTechniqueUnit;
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
		var ShadowTechnique = this.getOrCreateUniforms();

		//ShadowTechnique._enable.set([this.enable]);

		this.setDirty(false);
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


}), "osg", "ShadowTechnique");


// common shader generation functions
osg.ShadowTechnique.prototype._shaderCommon[osg.ShaderGeneratorType.VertexInit] = function() {
	return ["",
		"varying vec4 ShadowVertexProjected0;",
		"varying float ShadowZ;",
		"",
		""].join('\n');
};

osg.ShadowTechnique.prototype._shaderCommon[osg.ShaderGeneratorType.VertexFunction] = function() {
	return ["",
		"",
		""].join('\n');
};

osg.ShadowTechnique.prototype._shaderCommon[osg.ShaderGeneratorType.VertexMain] = function() {
	return ["",
		""].join('\n');
};

osg.ShadowTechnique.prototype._shaderCommon[osg.ShaderGeneratorType.FragmentInit] = function() {
	return [
		""].join('\n');
};

osg.ShadowTechnique.prototype._shaderCommon[osg.ShaderGeneratorType.FragmentFunction] = function() {
	return ["",
		""].join('\n');
};

osg.ShadowTechnique.prototype._shaderCommon[osg.ShaderGeneratorType.FragmentMain] = function() {
	return [
		""].join("\n");
};

osg.ShadowTechnique.prototype._shaderCommon[osg.ShaderGeneratorType.FragmentEnd] = function() {
	return ["",
		""].join('\n');
};


// shader generation per instance of attribute
osg.ShadowTechnique.prototype._shader[osg.ShaderGeneratorType.FragmentInit] = function() {
	var str = ["",
		"uniform mat4 Shadow_Projection;",
		"uniform mat4 Shadow_ModelView;",
		"uniform vec4 Shadow_DepthRange;",
		""].join('\n');

	// replace ShadowTechnique_xxxx by instance variable of 'this' ShadowTechnique
	uniforms = Object.keys(this.getOrCreateUniforms());
	str = this._replace("Shadow_", uniforms, str, this.getUniformName);
	return str;
};

osg.ShadowTechnique.prototype._shader[osg.ShaderGeneratorType.FragmentMain] = function() {
	var str = ["",
		""].join('\n');
	var fields = ["Shadow_VertexProjected",
		"Shadow_Z",
		"Shadow_MapSize"];
	str = this._replace("", fields, str, this.getParameterName);
	uniforms = Object.keys(this.getOrCreateUniforms());
	str = this._replace("Shadow_", uniforms, str, this.getUniformName);
	return str;
};
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
	},
	setShadowReceiving: function(receivers, sceneCamera, ReceivesShadowTraversalMask) {

		//sceneCamera.traversalMask = ReceivesShadowTraversalMask;
		// applies on receivers selection for material state set apply only ?

		// scene models (shadow receiver)
		var shadowReceiverScene = new osg.Node();
		shadowReceiverScene.addChild(receivers);

		var shadowmapReceiverVertex;
		var shadowmapReceiverFragment;
		var floatTexSupp = osg.profile.extensions['OES_texture_float'];
		if (floatTexSupp && window.location.href.indexOf("EVSM") != -1) {
			shadowmapReceiverVertex = "shadowmap_evsm_receive.vert";
			shadowmapReceiverFragment = "shadowmap_evsm_receive.frag";
		} else if (floatTexSupp && window.location.href.indexOf("VSM") != -1) {
			shadowmapReceiverVertex = "shadowmap_vsm_receive.vert";
			shadowmapReceiverFragment = "shadowmap_vsm_receive.frag";
		} else {
			shadowmapReceiverVertex = "shadowmap_receive.vert";
			shadowmapReceiverFragment = "shadowmap_receive.frag";
		}

		var stateSet = new osg.StateSet();
		prg = getProgramFromShaders(shadowmapReceiverVertex, shadowmapReceiverFragment);
		stateSet.setAttributeAndMode(prg, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

		stateSet.addUniform(osg.Uniform.createInt1(0, "Texture0"));

		prg.trackAttributes = {};
		prg.trackAttributes.attributeKeys = [];
		prg.trackAttributes.attributeKeys.push('Material');

		prg.trackAttributes.attributeKeys.push('Light0');
		prg.trackAttributes.attributeKeys.push('Light1');
		prg.trackAttributes.attributeKeys.push('Light2');

		var texturedebug = window.location.href.indexOf('textureDebug') !== -1 ? 0 : 1;
		var debugUniform = osg.Uniform.createFloat1(texturedebug, 'debug');
		stateSet.addUniform(debugUniform);


		shadowReceiverScene.setStateSet(stateSet);
		return shadowReceiverScene;
	},

	setShadowCasting: function(receivers, lightsource, position, num, CastsShadowTraversalMask) {

		var shadowCamera = new osg.Camera();
		shadowCamera.setName("light_perspective_camera" + num);
		shadowCamera.traversalMask = CastsShadowTraversalMask;
		// scene models (shadow caster)
		//  filled upon distance from light and node/geom mask and transparency
		var shadowCasterScene = new osg.MatrixTransform();
		shadowCasterScene.addChild(receivers);
		shadowCamera.addChild(shadowCasterScene);

		var mapsize = 256;
		shadowSize = [mapsize, mapsize, 1.0 / mapsize, 1.0 / mapsize];

		// important because we use linear zbuffer
		var near = 0.0;
		var far = 1.0;


		// update projection each frame, at least near/far but better a computed matrix
		shadowCamera.setProjectionMatrix(osg.Matrix.makePerspective(15, 1, near, far));

		// update order upon render shadow/ render scene/postproc/etc. inehritance.
		shadowCamera.setRenderOrder(osg.Camera.PRE_RENDER, 0);
		shadowCamera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
		shadowCamera.setViewport(new osg.Viewport(0, 0, shadowSize[0], shadowSize[1]));
		shadowCamera.setClearColor([1.0, 1.0, 1.0, 1.0]);



		var shadowmapCasterVertex;
		var shadowmapCasterFragment;
		var floatTexSupp = osg.profile.extensions['OES_texture_float'];
		var textureType, textureFormat;
		if (floatTexSupp && window.location.href.indexOf("EVSM") != -1) {
			shadowmapCasterVertex = "shadowmap_evsm_cast.vert";
			shadowmapCasterFragment = "shadowmap_evsm_cast.frag";
			textureType = osg.Texture.FLOAT;
			textureFormat = osg.Texture.RGBA;
		} else if (floatTexSupp && window.location.href.indexOf("VSM") != -1) {
			shadowmapCasterVertex = "shadowmap_vsm_cast.vert";
			shadowmapCasterFragment = "shadowmap_vsm_cast.frag";
			textureType = osg.Texture.FLOAT;
			textureFormat = osg.Texture.RGB;
		} else {
			shadowmapCasterVertex = "shadowmap_cast.vert";
			shadowmapCasterFragment = "shadowmap_cast.frag";
			textureType = osg.Texture.UNSIGNED_BYTE;
			textureFormat = osg.Texture.RGBA;
		}


		var prg = getProgramFromShaders(shadowmapCasterVertex, shadowmapCasterFragment);
		var casterStateSet = shadowCasterScene.getOrCreateStateSet();
		casterStateSet.setAttributeAndMode(prg, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

		//casterStateSet.setAttributeAndMode(new osg.CullFace(osg.CullFace.DISABLE), osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
		//casterStateSet.setAttributeAndMode(new osg.CullFace(osg.CullFace.BACK), osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

		//prevent unessecary texture bindings
		casterStateSet.setTextureAttributeAndMode(0, new osg.Texture(), osg.StateAttribute.OFF | osg.StateAttribute.OVERRIDE);
		casterStateSet.setTextureAttributeAndMode(1, new osg.Texture(), osg.StateAttribute.OFF | osg.StateAttribute.OVERRIDE);
		casterStateSet.setTextureAttributeAndMode(2, new osg.Texture(), osg.StateAttribute.OFF | osg.StateAttribute.OVERRIDE);
		casterStateSet.setTextureAttributeAndMode(3, new osg.Texture(), osg.StateAttribute.OFF | osg.StateAttribute.OVERRIDE);

		//casterStateSet.setAttributeAndMode(new osg.BlendFunc('ONE', 'ZERO'));
		//casterStateSet.setAttributeAndMode(new osg.Depth('LESS', 0.0, 1.0, false));


		var depthRange = new osg.Uniform.createFloat4([near, far, far - near, 1.0 / (far - near)], "Shadow_DepthRange");
		var projectionShadowCast = new osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), "Shadow_Projection");
		var viewShadowCast = new osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), "Shadow_View");
		//var invShadowViewMatrixUniform = osg.Uniform.createMatrix4(shadowCamera.getViewMatrix(), 'invShadowViewMatrix');

		casterStateSet.addUniform(depthRange);
		casterStateSet.addUniform(projectionShadowCast);
		casterStateSet.addUniform(viewShadowCast);
		//casterStateSet.addUniform(invShadowViewMatrixUniform);


		var shadowTexture = new osg.Texture();
		shadowTexture.setName("shadow" + num);
		shadowTexture.setTextureSize(shadowSize[0], shadowSize[1]);
		shadowTexture.setType(textureType);
		shadowTexture.setInternalFormat(textureFormat);

		//shadowTexture.setMinFilter('NEAREST');
		//shadowTexture.setMagFilter('NEAREST');

		shadowTexture.setMinFilter('LINEAR');
		shadowTexture.setMagFilter('LINEAR');

		shadowTexture.setWrapS(osg.Texture.CLAMP_TO_EDGE);
		shadowTexture.setWrapT(osg.Texture.CLAMP_TO_EDGE);
		shadowCamera.attachTexture(gl.COLOR_ATTACHMENT0, shadowTexture, 0);
		shadowCamera.attachRenderBuffer(gl.DEPTH_ATTACHMENT, gl.DEPTH_COMPONENT16);


		// LIGHT SHADOW RELATION
		lightsource.addChild(shadowCamera);

		var doBlur = true;
		var doDownSample = 1;
		var shadowTextureFinal = shadowTexture;
		var shadowSizeFinal = shadowSize;
		//var shadowSizeFinal shadowSize.slice(0);//cp by value
		while (doDownSample-- && shadowSizeFinal[0] > 64) {
			var halfPass;
			halfPass = addHalfDownSample(shadowTextureFinal, shadowSizeFinal);
			shadowTextureFinal = halfPass.texture;
			shadowSizeFinal[0] *= 0.5;
			shadowSizeFinal[1] *= 0.5;
			shadowSizeFinal[2] *= 2.0;
			shadowSizeFinal[3] *= 2.0;
			lightsource.addChild(halfPass.camera);

		}
		if (doBlur) {
			var blurPass;
			blurPass = addBlur(shadowTextureFinal, shadowSizeFinal);
			shadowTextureFinal = blurPass.texture;
			lightsource.addChild(blurPass.camera);
		}

		lightsource.getOrCreateStateSet().setAttributeAndMode(lightsource.getLight());


		var stateSet = receivers.getOrCreateStateSet();

		stateSet.setTextureAttributeAndMode(num + 1, shadowTextureFinal, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
		stateSet.addUniform(osg.Uniform.createInt1(num + 1, "Texture" + (num + 1)));

		var depthRangeNum = new osg.Uniform.createFloat4([near, far, far - near, 1.0 / (far - near)], "Shadow_DepthRange" + num);
		var shadowMapSizeNum = new osg.Uniform.createFloat4(shadowSize, "Shadow_MapSize" + num);
		var projectionShadowNum = new osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), "Shadow_Projection" + num);
		var viewShadowNum = new osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), "Shadow_View" + num);

		stateSet.addUniform(projectionShadowNum);
		stateSet.addUniform(viewShadowNum);
		stateSet.addUniform(depthRangeNum);
		stateSet.addUniform(shadowMapSizeNum);

		lightsource.setUpdateCallback(new LightUpdateCallbackShadowMap({
			'projectionShadow': projectionShadowNum,
			'viewShadow': viewShadowNum,
			'depthRangeNum': depthRangeNum,
			'projectionShadowCast': projectionShadowCast,
			'viewShadowCast': viewShadowCast,
			'camera': shadowCamera,
			'position': position,
			'shadowCasterScene': shadowCasterScene,
			'depthRange': depthRange
			//'invShadowViewMatrix': invShadowViewMatrixUniform
		}));

		return lightsource;
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
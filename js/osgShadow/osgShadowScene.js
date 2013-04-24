/** -*- compile-command: "jslint-cli Node.js" -*- */


/**
 *  Shadow
 *  @class ShadowScene
 */
osg.ShadowScene = function(sceneCamera, lightNode, technique, ReceivesShadowTraversalMask) {
	osg.Node.call(this);

	if (!ReceivesShadowTraversalMask) ReceivesShadowTraversalMask = 0x1;
	this._receivesShadowTraversalMask = ReceivesShadowTraversalMask;

	this._camera = sceneCamera;
	this._lightNode = lightNode;
	this._technique = technique;

	// scene models (shadow receiver)
};

/** @lends osg.ShadowScene.prototype */
osg.ShadowScene.prototype = osg.objectLibraryClass(osg.objectInehrit(
osg.Node.prototype, {
	setSceneCamera: function(light) {
		this._camera = _camera;
	},
	getSceneCamera: function() {
		return this._camera;
	},
	setLightSource: function(light) {
		this._lightNode = _lightSource;
	},
	getLightSource: function() {
		return this._lightNode;
	},
	setTechnique: function(technique) {
		this._technique = technique;
	},
	getTechnique: function() {
		return this._technique;
	}

}), "osg", "Shadow");
osg.ShadowScene.prototype.objectType = osg.objectType.generate("ShadowScene");
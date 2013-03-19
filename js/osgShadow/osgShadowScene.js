/** -*- compile-command: "jslint-cli Node.js" -*- */


/**
 *  Shadow
 *  @class ShadowScene
 */
osg.ShadowScene = function(sceneCamera, lightNode, technique, ReceivesShadowTraversalMask) {
	osg.Transform.call(this);
	osg.CullSettings.call(this);

	if (!ReceivesShadowTraversalMask) ReceivesShadowTraversalMask = 0x1;
	this._receivesShadowTraversalMask = ReceivesShadowTraversalMask;

	this._camera = sceneCamera;
	this._lightNode = lightNode;
	this._technique = technique;

	// scene models (shadow receiver)
	this._shadowReceiverScene = new osg.Node();
	this._stateSet = this.getorCreateStateSet();
};

/** @lends osg.ShadowScene.prototype */
osg.ShadowScene.prototype = osg.objectLibraryClass(osg.objectInehrit(
osg.CullSettings.prototype,
osg.objectInehrit(osg.Transform.prototype, {
	hasChild: function(child) {
		return this._ShadowedScene.hasChild(child);
	},
	removeChildren: function() {
		this._ShadowedScene.removeChildren();
	},
	removeChild: function(child) {
		this._ShadowedScene.removeChild(child);
	},
	addChild: function(child) {
		child.setNodeMask(child.getNodeMask() | this._receivesShadowTraversalMask);
		return this._ShadowedScene.addChild(child);
	},
	getChildren: function() {
		return this._ShadowedScene.getChildren();
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

})), "osg", "Shadow");
osg.ShadowScene.prototype.objectType = osg.objectType.generate("ShadowScene");
/** -*- compile-command: "jslint-cli Node.js" -*- */


/**
 *  Shadow
 *  @class ShadowScene
 */
osg.ShadowScene = function(sceneCamera, lightNode, ReceivesShadowTraversalMask, technique) {
	osg.Transform.call(this);
	osg.CullSettings.call(this);

	this._camera = sceneCamera;
	this._lightNode = lightNode0;
	this._technique = technique;
	this._receivesShadowTraversalMask = ReceivesShadowTraversalMask;

	// scene models (shadow receiver)
	this._shadowReceiverScene = new osg.Node();

	this._enabled = 0;

	//this.dirty();
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
		return this._ShadowedScene.addChild(child);
	},
	getChildren: function() {
		return this._ShadowedScene.getChildren();
	},
	setLightSource: function(light) {
		this._lightSource = _lightSource;
	},
	getLightSource: function() {
		return this._lightSource;
	},
	setTechnique: function(technique) {
		this._technique = technique;
	},
	getTechnique: function() {
		return this._technique;
	},
	setScene: function(light, technique) {}

})), "osg", "Shadow");
osg.ShadowScene.prototype.objectType = osg.objectType.generate("ShadowScene");
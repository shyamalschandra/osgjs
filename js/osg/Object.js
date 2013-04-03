/** -*- compile-command: "jslint-cli Object.js" -*- */

/**
 *  Object class
 *  @class Object
 */
osg.Object = function() {
	this._name = undefined;
	this._userdata = undefined;
    this._dirty = true;
};

/** @lends osg.Object.prototype */
osg.Object.prototype = osg.objectLibraryClass({
	setName: function(name) {
		this._name = name;
	},
	getName: function() {
		return this._name;
	},
	dirty: function() {
		this._dirty = true;
	},
	setClean: function() {
		this._dirty = false;
	},
	isDirty: function() {
		return this._dirty;
	},
	setUserData: function(data) {
		this._userdata = data;
	},
	getUserData: function() {
		return this._userdata;
	},
	toString: function() {
		return JSON.stringify(this.toObject());
	},
	toJSON: function() {
		return JSON.stringify(this.toObject());
	},
	toObject: function() {
		var object = {
			_name: this._name,
			_userdata: this._userdata
		};
		return object;
	}
}, "osg", "Object");
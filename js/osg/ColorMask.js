osg.ColorMask = function(colorMask) {
    osg.StateAttribute.call(this);
    if(!colorMask) this._colorMask = [true, true, true, true];
    else this._colorMask = colorMask;
};


osg.ColorMask.prototype = osg.objectLibraryClass(osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "ColorMask",
    cloneType: function() {
        return new osg.ColorMask();
    },
    getType: function() {
        return this.attributeType;
    },
    getTypeMember: function() {
        return this.attributeType;
    },
    setColorMask: function(mask) {
        this._colorMask = mask;
    },
    apply: function(state) {
        var gl = state.getGraphicContext();
        gl.colorMask(this._colorMask[0], this._colorMask[1], this._colorMask[2], this._colorMask[3]);

    }
}), "osg", "ColorMask");
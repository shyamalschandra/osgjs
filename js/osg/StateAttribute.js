/** 
 * StateAttribute base class
 * @class StateAttribute
 */
osg.StateAttribute = function() {
    osg.Object.call(this);
};

/** @lends osg.StateAttribute.prototype */
osg.StateAttribute.prototype = osg.objectLibraryClass( osg.objectInehrit(osg.Object.prototype, {
}), "osg", "StateAttribute");

osg.StateAttribute.OFF = 0;
osg.StateAttribute.ON = 1;
osg.StateAttribute.OVERRIDE = 2;
osg.StateAttribute.PROTECTED = 4;
osg.StateAttribute.INHERIT = 8;

/** -*- compile-command: "jslint-cli osg.js" -*- */
module("osg.shadows");

test("shadows", function() {
    (function() {

	var ReceivesShadowTraversalMask = 0x1;
	var CastsShadowTraversalMask = 0x2;


	var root = new osg.Node();
	root.setNodeMask(ReceivesShadowTraversalMask | CastsShadowTraversalMask);
	root.setName("a");
	var b = new osg.Node();
	b.setName("b");
	b.setNodeMask(ReceivesShadowTraversalMask);
	root.addChild(b);
	var c = new osg.Node();
	c.setName("c");
	c.setNodeMask(CastsShadowTraversalMask);
	root.addChild(c);


	var fb = function() {
	    this.result = [];
	};
	fb.prototype = {
	    cull: function(node, nv) {
		this.result.push(node);
		return true;
	    }
	};

	var v = new fb();
	root.setCullCallback(v);
	b.setCullCallback(v);
	c.setCullCallback(v);

	var cull = new osg.CullVisitor();

	var receiverCam = new osg.Camera();
	receiverCam.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
	receiverCam.addChild(root);
	receiverCam.setTraversalMask(ReceivesShadowTraversalMask);
	var casterCam = new osg.Camera();
	casterCam.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
	receiverCam.addChild(casterCam);
	casterCam.addChild(root);
	casterCam.setTraversalMask(CastsShadowTraversalMask);


	receiverCam.accept(cull);
	ok(v.result[0] === root, "Camera TraversalMask: Should find item named 'a' " + v.result[0].getName());
	ok(v.result[1] === b, "Camera TraversalMask: Should find item named 'b' " + v.result[1].getName());		

	v.result = [];
	casterCam.accept(cull);
	ok(v.result[0] === root, "Camera TraversalMask: Should find item named 'a' " + v.result[0].getName());
	ok(v.result[1] === c, "Camera TraversalMask: Should find item named 'c' " + v.result[1].getName());
    })();
});

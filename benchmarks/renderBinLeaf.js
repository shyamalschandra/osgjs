benchmarks.push(new Benchmark('renderBinLeaf',

function() {

	var NbItems = 4;
	var Deep = 3;

	var QuadSizeX = 1;
	var QuadSizeY = QuadSizeX * 9 / 16.0;

	var Item;

	function getOrCreateItem() {
		if (Item === undefined) {
			var rq = osg.createTexturedQuadGeometry(-QuadSizeX / 2.0, -QuadSizeY / 2.0, 0,
			QuadSizeX, 0, 0,
			0, QuadSizeY, 0);
			Item = rq;
		}
		return Item;
	}

	var NbTotalItems = 0;
	var NbTotalNodes = 0;

	function createItems(deep) {
		var scale = Math.pow(2, deep - 1);

		var root = new osg.MatrixTransform();
		var nbx = NbItems;
		var nby = Math.floor(nbx * 9 / 16.0);
		if (deep === 0) {
			NbTotalItems += nbx * nby;
		}
		NbTotalNodes += nbx * nby;

		for (var i = 0, l = nbx; i < l; i++) {
			for (var j = 0, m = nby; j < m; j++) {
				var mt = new osg.MatrixTransform();
				var x, y;
				if (deep === 0) {
					x = (-nbx * 0.5 + 0.5 + i) * 1.1;
					y = (-nby * 0.5 + 0.5 + j) * 1.1;
					mt.setMatrix(osg.Matrix.makeTranslate(x, y, 0));
					if (i % 2 === 0) {
						mt.addChild(getOrCreateItem());
					} else {
						mt.addChild(getOrCreateItem());
					}
				} else {
					var s = nbx * deep * scale * 1.1;
					x = (-nbx * 0.5 + 0.5 + i) * (s);
					y = (-nby * 0.5 + 0.5 + j) * (s * 9 / 16.0);
					//osg.log([x,y]);
					mt.setMatrix(osg.Matrix.makeTranslate(x, y, 0));
					mt.addChild(createItems(deep - 1));
				}
				root.addChild(mt);
			}
		}
		return root;
	}
	// setup
	var canvas, viewer;
	// setup a  canvas

	canvas = document.createElement('canvas');
	canvas.id = "3dView";
	document.body.appendChild(canvas);
	// setup a simple scene, but with lots of instance of the exact same object
	viewer = new osgViewer.Viewer(canvas);
	viewer.init();
	viewer.setSceneData(createItems(Deep));
	viewer.setupManipulator();
	viewer.getManipulator().computeHomePosition();
    // update/cull/draw the frame once  (warming the cache)
	viewer.frame();

	return {
		runCount: 100,
        NbTotalItems: NbTotalItems,
        NbTotalNodes: NbTotalNodes,
		canvas: canvas,
		viewer: viewer
	};
},

function(context) {
	// render the frame multiple times
	for (var i = 0; i < context.runCount; i++)
		context.viewer.draw();

	return {
		"count": context.runCount,
        "result": "Total Items " + context.NbTotalItems + ", Total Nodes " + context.NbTotalNodes
	};
},

function(context) {
	//remove context.canvas;
	context.canvas.parentNode.removeChild(context.canvas);
}));
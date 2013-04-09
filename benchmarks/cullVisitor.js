benchmarks.push(new Benchmark('CullVisitor',

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
    var camera0 = new osg.Camera();
    camera0.setRenderOrder(osg.Transform.NESTED_RENDER);
    var node0 = new osg.Node();
    var node1 = new osg.Node();
    camera0.addChild(node0);
    camera0.addChild(node1);

    var camera1 = new osg.Camera();
    camera1.setRenderOrder(osg.Transform.NESTED_RENDER);
    var node00 = new osg.Node();
    var node10 = new osg.Node();
    camera1.addChild(node00);
    camera1.addChild(node10);

    camera0.addChild(camera1);

    camera1.addChild(createItems(Deep));

    var cull = new osg.CullVisitor();
    var rs = new osg.RenderStage();
    var sg = new osg.StateGraph();
    cull.setRenderStage(rs);
    cull.setStateGraph(sg);

    cull.pushProjectionMatrix(osg.Matrix.makeIdentity([]));
    cull.pushViewMatrix(osg.Matrix.makeIdentity([]));
    //cull.pushModelviewMatrix(osg.Matrix.makeIdentity([]));
    cull.pushModelMatrix(osg.Matrix.makeIdentity([]));
    return {
        camera: camera0,
        cull: cull,
        NbTotalItems: NbTotalItems,
        NbTotalNodes: NbTotalNodes,
        runCount: 10
    };
},

function(context) {
    for (var i = 0; i < context.runCount; i++)
    context.camera.accept(context.cull);

    return {
        "count": context.runCount,
        "result": "Total Items " + context.NbTotalItems + ", Total Nodes " + context.NbTotalNodes
    };
},

function(context) {
    //end;
}));
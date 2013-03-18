/** -*- compile-command: "jslint-cli osg.js" -*- */
module("osg.memoryPools");

test("Memory Pool", function() {
	(function() {
		var i;
		var inUseObject = [];

		osg.memoryPools.stateGraph = new osg.ObjectMemoryPool(osg.StateGraph).grow(50);

		ok(osg.memoryPools.stateGraph._memPool.length == 50, "Check osg.ObjectMemoryPool allocate correct numbers");
		sg = osg.memoryPools.stateGraph.get();
		ok(sg instanceof osg.StateGraph, "Check osg.ObjectMemoryPool grow correct objects");
		ok(osg.memoryPools.stateGraph._memPool.length == 49, "Check osg.ObjectMemoryPool remove in-use object from pool");
		osg.memoryPools.stateGraph.put(sg);
		ok(osg.memoryPools.stateGraph._memPool.length == 50, "Check osg.ObjectMemoryPool store back object to pool");

		for (i = 0; i < 50; i++) {
			sg = osg.memoryPools.stateGraph.get();
			inUseObject.push(sg);
		}
		ok(osg.memoryPools.stateGraph._memPool.length === 0, "Check osg.ObjectMemoryPool empty pool");
		sg = osg.memoryPools.stateGraph.get();
		ok(osg.memoryPools.stateGraph._memPool.length > 0, "Check osg.ObjectMemoryPool empty pool");
		ok(sg !== undefined, "Check osg.ObjectMemoryPool auto grow pool return valid objects");
		for (i = 0; i < 50; i++) {
			sg = inUseObject.pop();
			osg.memoryPools.stateGraph.put(sg);
		}
		ok(osg.memoryPools.stateGraph._memPool.length > 50, "Check osg.ObjectMemoryPool auto-grow keep at least new pool size");

	})();
});
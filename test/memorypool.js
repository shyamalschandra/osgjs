/** -*- compile-command: "jslint-cli osg.js" -*- */
module("osg.memoryPools");

test("Memory Pool", function() {
	(function() {
		var i;
		var inUseObject = [];

		osg.memoryPools.stateGraph = new OsgObjectMemoryPool(osg.StateGraph).grow(50);

		ok(osg.memoryPools.stateGraph._memPool.length == 50, "Check OsgObjectMemoryPool allocate correct numbers");
		sg = osg.memoryPools.stateGraph.get();
		ok(sg instanceof osg.StateGraph, "Check OsgObjectMemoryPool grow correct objects");
		ok(osg.memoryPools.stateGraph._memPool.length == 49, "Check OsgObjectMemoryPool remove in-use object from pool");
		osg.memoryPools.stateGraph.put(sg);
		ok(osg.memoryPools.stateGraph._memPool.length == 50, "Check OsgObjectMemoryPool store back object to pool");

		for (i = 0; i < 50; i++) {
			sg = osg.memoryPools.stateGraph.get();
			inUseObject.push(sg);
		}
		ok(osg.memoryPools.stateGraph._memPool.length === 0, "Check OsgObjectMemoryPool empty pool");
		sg = osg.memoryPools.stateGraph.get();
		ok(osg.memoryPools.stateGraph._memPool.length > 0, "Check OsgObjectMemoryPool empty pool");
		ok(sg !== undefined, "Check OsgObjectMemoryPool auto grow pool return valid objects");
		for (i = 0; i < 50; i++) {
			sg = inUseObject.pop();
			osg.memoryPools.stateGraph.put(sg);
		}
		ok(osg.memoryPools.stateGraph._memPool.length > 50, "Check OsgObjectMemoryPool auto-grow keep at least new pool size");

	})();
});
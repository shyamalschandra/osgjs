/** -*- compile-command: "jslint-cli osg.js" -*- */
module("osg.shaderLoader");

test("shader Loading/compositing", function() {
	(function() {
		var shaderslib = ({
			"includetest.vert": "#pragma include \"common.vert\"\r\n",
			"common.vert": "#pragma include \"common2.vert\"\nfloat hasinclude(){retur 0.0;};\n",
			"common2.vert": "float hasinclude2(){retur 0.0;};",
			"basic.frag": "#ifdef GL_ES\r\nprecision highp float;\r\n#endif"
		});
		var shaderOptions = {
			inline: true,
			async: false,
			callbacksingle: function(e) {
				//console.log(e + "is loaded");
			},
			callbackAll: function(e) {
				console.log("Shaders loaded");
			},
			loadprefix: '',
			shaders: shaderslib
		};
		var shaderLoader = new osg.ShaderLoader(shaderOptions).loadAll();

		console.log(shaderLoader.getShaderText('includetest.vert', ['#define TEST', '#define TEST2']));

		ok(shaderLoader.getShaderText('includetest.vert').indexOf('hasinclude') !== -1, "check include");
		ok(shaderLoader.getShaderText('includetest.vert').indexOf('hasinclude2') !== -1, "check nestd include");
		ok(shaderLoader.getShaderText('includetest.vert', ['#define TEST']).indexOf('define TEST') !== -1, "check define");
		ok(shaderLoader.getShaderText('includetest.vert', ['#define TEST', '#define TEST2']).indexOf('TEST2') !== -1, "check 2 define");

		ok(shaderLoader.getShaderText('includetest.vert', ['#define TEST', '#define TEST2']).indexOf('highp') !== -1, "check precision auto");

		shaderLoader._debugLines = true;
		console.log(shaderLoader.getShaderText('includetest.vert', ['#define TEST', '#define TEST2']));
		ok(shaderLoader.getShaderText('includetest.vert', ['#define TEST', '#define TEST2']).indexOf('#line 0 0') !== -1, "check line_debugging 1 files");
		ok(shaderLoader.getShaderText('includetest.vert', ['#define TEST', '#define TEST2']).indexOf('#line 0 1') !== -1, "check line_debugging 2 files");
		ok(shaderLoader.getShaderText('includetest.vert', ['#define TEST', '#define TEST2']).indexOf('#line 0 2') !== -1, "check line_debugging 3 files");

		//var shaderObj = shaderLoader.getShaderObject('includetest.vert', ['#define TEST','#define TEST2']);
		//var shaderObj2 = shaderLoader.getShaderObject('includetest.vert', ['#define TEST']);
		//ok(shaderObj !== shaderObj, "check live reloading");



	})();
});
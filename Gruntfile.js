module.exports = function(grunt) {
	// project files
	var projectJson = grunt.file.read("project.json");
	var project = JSON.parse(projectJson);
	grunt.file.write("project.jsonp", "var dataScripts=" + projectJson);
	project.core = project.scripts.filter(function(item) {
		return /js\/osg\//i.test(item);
	});
	project.animation = project.scripts.filter(function(item) {
		return /js\/osgAnimation\//i.test(item);
	});
	project.ga = project.scripts.filter(function(item) {
		return /js\/osgGA\//i.test(item);
	});
	project.db = project.scripts.filter(function(item) {
		return /js\/osgDB\//i.test(item);
	});
	project.util = project.scripts.filter(function(item) {
		return /js\/osgUtil\//i.test(item);
	});
	project.viewer = project.scripts.filter(function(item) {
		return /js\/osgViewer\//i.test(item);
	});
	project.wrappers = project.scripts.filter(function(item) {
		return /js\/osgWrappers\//i.test(item);
	});
	project.shadows = project.scripts.filter(function(item) {
		return /js\/osgShadow\//i.test(item);
	});

	// Project configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		meta: {
			banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %>\n' + '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' + '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' + ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
		},
		watch: {
			error: {
				files: [project.scripts, 'examples/*/*.js', 'sandbox/*/*.js', 'test/*.js'],
				tasks: ['jsvalidate']
			},
			syntax: {
				files: project.scripts,
				tasks: ['jsvalidate', 'jshint:beforeconcat']
			}
		},
		jshint: {
			options: {
				// http://www.jshint.com/docs/
				// Enforcing Options:
				curly: false,
				eqeqeq: false,
				//eqeqeq: true, <= TODO: lots of cleaning
				immed: false,
				//immed: true, <= TODO: lots of cleaning
				latedef: true,
				noarg: true,
				sub: true,
				undef: false,
				//undef: true, <= TODO: lots of cleaning
				eqnull: true,
				browser: true,
				unused: false,
				//unused: true, <= TODO: lots of cleaning
				forin: true,
				camelcase: false,
				newcap: false,
				// Relaxing Options:
				loopfunc: true,
				evil: true,

				globals: {
					gl: true,

					osg: true,
					osgDB: true,
					osgGA: true,
					osgUtil: true,
					osgViewer: true,
					osgAnimation: true,

					WebGLDebugUtils: true,
					WebGLUtils: true,

					Stats: true,
					performance: true,

					WebGLRenderingContext: true,
					WebGLBuffer: true,
					WebGLRenderbuffer: true,
					WebGLFramebuffer: true,
					WebGLProgram: true,
					WebGLTexture: true,
					WebGLShader: true
				}
			},
			beforeconcat: project.scripts,
			afterconcat: 'build/<%= pkg.name %>-debug.js'
		},
		jsvalidate: {
			options: {
				tolerant: true
			},
			main: {
				src: project.scripts
			}
		},
		qunit: {
			all: ['test/index.html']
		},
		concat: {
			build: {
				src: ['<banner:meta.banner>', project.scripts],
				dest: 'build/<%= pkg.name %>-debug.js'
			}
		},
		strip: {
			main: {
				src: 'build/<%= pkg.name %>-debug.js',
				dest: 'build/<%= pkg.name %>.js',
				nodes: ['console', 'debug']
			}
		},
		uglify: {
			main: {
				options: {
					//wrap: 'osgLib',// amd step
					//exportAll: true,
					beautify: false,
					quote_keys: false,
					sourceMap: 'build/source-map.js',
					sourceMapPrefix: 1,
					compressor: {
						sequences: true, // join consecutive statements with the “comma operator”
						properties: false, // optimize property access: a["foo"] → a.foo
						dead_code: false, // discard unreachable code
						drop_debugger: true, // discard “debugger” statements
						unsafe: true, // some unsafe optimizations (see below)
						conditionals: true, // optimize if-s and conditional expressions
						comparisons: true, // optimize comparisons
						evaluate: true, // evaluate constant expressions
						booleans: true, // optimize boolean expressions
						loops: true, // optimize loops
						unused: true, // drop unused variables/functions
						hoist_funs: true, // hoist function declarations
						hoist_vars: false, // hoist variable declarations
						if_return: true, // optimize if-s followed by return/continue
						join_vars: true, // join var declarations
						cascade: true, // try to cascade `right` into `left` in sequences
						side_effects: true, // drop side-effect-free statements
						warnings: true, // warn about potentially dangerous optimizations/code
						global_defs: {
							//osg.debug: FALSE // will remove all code inside "if (osg.debug){..}"
						} // global definitions
					},
					mangle: {
						toplevel: false,
						except: ['osgViewer']
					}
				},
				files: {
					'build/<%= pkg.name %>.min.js': ['build/<%= pkg.name %>.js']
				}
			}
		},
		compress: {
			options: {
				archive: 'build/<%= pkg.name %>.min.js.gz',
				mode: 'gzip',
				pretty: true
			},
			main: {
				files: [{
					src: 'build/<%= pkg.name %>.min.js',
					dest: 'build/<%= pkg.name %>.min.js'
				}]
			}
		},
		copy: {
			dist: {
				files: {
					'build/<%= pkg.name %>-debug-<%= pkg.version %>.js': 'build/<%= pkg.name %>-debug.js',
					'build/<%= pkg.name %>-<%= pkg.version %>.js': 'build/<%= pkg.name %>.min.js'
				}
			}
		},
		docs: {
			file: {
				src: "js/",
				dest: "docs/"
			}
		},
		"qunit-cov": {
			test: {
				minimum: 0.1,
				srcDir: 'js',
				depDirs: ['test'],
				outDir: 'testResults',
				testFiles: ['test/*.html']
			}
		},
		dir2json: {
			options: {
				extension: true,
				space: " ",
				pathSep: '/'
			},
			data: {
				root: 'examples/setup/shaders',
				dest: 'examples/setup/shaderlib.json'
			},
			datap: {
				options: {
					jsonpCallback: 'var shaderslib = '
				},
				root: 'examples/setup/shaders',
				dest: 'examples/setup/shaderlib.js'
			},
			datalist: {
				options: {
					jsonfiledir: true
				},
				root: 'examples/setup/shaders',
				dest: 'examples/setup/shaderliblist.js'
			}

		},
		plato: {
			options: {
				// Task-specific options go here.
			},
			main: {
				files: {
					'docs/analysis': project.scripts
				}
			}
		},
		docco: {
			options: {
				//layout: 'parallel', //   'choose a layout (parallel, linear or classic'
				css: 'docs/docco/docco.css' //'use a custom css file'
				//template:  'docs/docco/mytemplace.jst',//'use a custom .jst template'
				//extension:  'js'//'assume a file extension for all inputs'
			},
			main: {
				src: project.scripts,
				options: {
					output: 'docs/docco'
				}
			}
			/*
			core: {
				src: project.core,
				options: {
					output: 'docs/docco/osg'
				}
			},
			animation: {
				src: project.animation,
				options: {
					output: 'docs/docco/animation'
				}
			},
			db: {
				src: project.db,
				options: {
					output: 'docs/docco/db'
				}
			},
			ga: {
				src: project.ga,
				options: {
					output: 'docs/docco/ga'
				}
			},
			shadows: {
				src: project.shadows,
				options: {
					output: 'docs/docco/shadows'
				}
			},
			util: {
				src: project.util,
				options: {
					output: 'docs/docco/util'
				}
			},
			viewer: {
				src: project.viewer,
				options: {
					output: 'docs/docco/viewer'
				}
			},
			wrappers: {
				src: project.wrappers,
				options: {
					output: 'docs/docco/wrappers'
				}
			}*/
		},
		wrap: { // wrap my modules with define
			main: {
				files: ['build/<%= pkg.name %>.min.js'],
				dest: 'build',
				pathSep: '/',
				prefix: 'amd.',
				wrapper: ['define(["osg"], function () {\n', '\nreturn osg;});']
				// wrapper can also be a function, like so:
				//
				// wrapper: function(filepath, options) {
				//   // ...
				//   return ['define(function (require, exports, module) {\n', '\n});'];
				// }
			}
		},
		dox: {
			options: {
				title: "osgjs documentation"
			},
			files: {
				src: ['js'],
				dest: 'doc/dox'
			}
		}
	});

	// usual suspects
	grunt.loadNpmTasks('grunt-contrib-uglify'); // todo : use the if(debug){} and deadcode removal
	grunt.loadNpmTasks('grunt-contrib-jshint'); // promises...
	grunt.loadNpmTasks('grunt-contrib-qunit'); // todo: separate gl dependant test and pure js tests, add visual diff, have a mock gl context ?
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');


	grunt.loadNpmTasks('grunt-contrib-compress'); // get idea of compressed server size in gz
	grunt.loadNpmTasks('grunt-contrib-copy'); // copy file builds
	grunt.loadNpmTasks('grunt-strip'); // remove console.log, etc
	grunt.loadNpmTasks('grunt-qunit-cov'); // jscoverage

	// watch
	//grunt.loadNpmTasks('grunt-jsvalidate'); // check basic syntax error

	//
	//
	grunt.loadTasks('tasks');

	// convert to amd (requirejs like) module
	// patched version
	//grunt.loadNpmTasks('grunt-wrap');

	//shaders
	//grunt.loadNpmTasks('grunt-dir2json');
	//
	//grunt.loadNpmTasks('grunt-glslvalidator'); // GL shader validator sublime plugin ?
	//grunt.loadNpmTasks('grunt-glsloptimizer'); // @aras_p  glsl optimizer
	//grunt.loadNpmTasks('grunt-glslmin'); // just min

	// docs
	grunt.loadNpmTasks('grunt-plato'); // bug prediction
	//
	grunt.loadNpmTasks('grunt-docco'); // nice docs. https://bitbucket.org/doklovic_atlassian/atlassian-docco/wiki/writing-docco-comments
	//grunt.loadNpmTasks('grunt-docco-husky');
	//grunt.loadNpmTasks('grunt-dox');

	//grunt.loadTasks('tasks'); // pure jsdoc
	
	// chrome dev tool for grunt 
	grunt.loadNpmTasks('grunt-devtools');

	grunt.registerTask('release', ['jshint:beforeconcat', 'concat', 'jshint:afterconcat', 'strip', 'uglify', 'compress', 'copy']);
	grunt.registerTask('verify', ['jsvalidate', 'release']);
	grunt.registerTask('default', ['concat', 'strip', 'uglify', 'compress', 'copy', 'wrap', 'dir2json']);


};
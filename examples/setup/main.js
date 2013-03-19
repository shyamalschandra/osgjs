/** -*- compile-command: "jslint-cli main.js" -*-
 *
 *  Copyright (C) 2010-2011 Cedric Pinson
 *
 *                  GNU LESSER GENERAL PUBLIC LICENSE
 *                      Version 3, 29 June 2007
 *
 * Copyright (C) 2007 Free Software Foundation, Inc. <http://fsf.org/>
 * Everyone is permitted to copy and distribute verbatim copies
 * of this license document, but changing it is not allowed.
 *
 * This version of the GNU Lesser General Public License incorporates
 * the terms and conditions of version 3 of the GNU General Public
 * License
 *
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 *
 */

var shaderLoader;

var viewMatrixCallbackShadowMap = function(options) {
    this.invViewMatrix = options.invViewMatrix;
    this.camera = options.camera;
    this.invViewMat = [];
};
viewMatrixCallbackShadowMap.prototype = {
    update: function(node, nv) {
        osg.Matrix.inverse(this.camera.getPureViewMatrix(),  this.invViewMat );
        this.invViewMatrix.set(this.invViewMat);
        node.traverse(nv);
    }
};


var LightUpdateCallbackShadowMap = function(options) {

    this.projectionShadow = options.projectionShadow;
    this.modelviewShadow = options.modelViewShadow;
    this.projectionShadowCast = options.projectionShadowCast;
    this.modelviewShadowCast = options.modelViewShadowCast;
    this.shadowCasterScene = options.shadowCasterScene;
    this.depthRange = options.depthRange;
    this.depthRangeNum = options.depthRangeNum;
    this.camera = options.camera;
    this.invShadowViewMatrix = options.invShadowViewMatrix;
    this.lightTarget = [0.0, 0.0, -5.0];
    this.worldlightTarget = [];
    this.invViewMat  = [];
    if (options.position) this.lightPositionProjTexOrig = options.position;
    else this.lightPositionProjTexOrig = [50.0, 50.0, 80.0, 0.0];
    this.lightPositionProjTex = [0.0, 0.0, 0.0, 0.0];

    this.worldLightPos = [];
    this.worldLightDir = [];

    this.shadowProj = [];
    this.shadowView = [];

    this.idlook = [0, 0, 1];

    this.biasScale = [];
    this.move = [0.5, 0.5, 0.5];
    this.Translate = [];
    this.Translate = osg.Matrix.makeTranslate(this.move[0], this.move[1], this.move[2], this.Translate);
    this.Scale = [];
    this.Scale = osg.Matrix.makeScale(this.move[0], this.move[1], this.move[2], this.Scale);
    this.biasScale = osg.Matrix.preMult(this.Translate, this.Scale);
};
LightUpdateCallbackShadowMap.prototype = {
    update: function(node, nv) {
        var currentTime = nv.getFrameStamp().getSimulationTime() * 0.25;


        if (node.getLight()._enabled){

            // animation !
            this.lightPositionProjTex[0] = this.lightPositionProjTexOrig[0] * (Math.cos(currentTime) + this.lightPositionProjTexOrig[3]); //x
            this.lightPositionProjTex[1] = this.lightPositionProjTexOrig[1] * (Math.sin(currentTime) + this.lightPositionProjTexOrig[3]); //y
            this.lightPositionProjTex[2] = this.lightPositionProjTexOrig[2]; //z

            //update osg objects
            node.getLight().setPosition(this.lightPositionProjTex);

            //  GENERIC Code getting pos&dir from light
            // update shadow camera with  light parameters
            var lightPos = node.getLight().getPosition();
            var lightDir = node.getLight().getDirection();
            osg.Vec3.sub(lightPos, this.lightTarget, lightDir);
            osg.Vec3.normalize(lightDir, lightDir);
            node.getLight().setDirection(lightDir);



            var up = [0, 0, 1]; //  Z camera up
            // Check it's not coincident with lightdir
            if (Math.abs(osg.Vec3.dot(up, lightDir)) >= 1.0)
            {
                // Use Y camera up
                up = [0, 1, 0];
            }


            // camera world matrix.
            var matrixList = node.parents[0].getWorldMatrices();
            var worldMatrix = matrixList[0];

            //  light pos & lightTarget in World Space
            osg.Matrix.transformVec3(worldMatrix, lightPos, this.worldLightPos);
            osg.Matrix.transformVec3(worldMatrix, this.lightTarget, this.worldlightTarget);
            //osg.Vec3.normalize(this.worldlightTarget, this.worldlightTarget);

            // LIGHT VIEW MATRIX
            // put that into shadow camera view matrix.
            osg.Matrix.makeLookAt(this.worldLightPos, this.worldlightTarget, up, this.camera.getViewMatrix());
            //this.shadowCasterScene.setMatrix(worldMatrix);

           // osg.Matrix.mult(this.camera.pureViewMatrix, worldMatrix, this.shadowView);
            osg.Matrix.copy(this.camera.getPureViewMatrix(), this.shadowView);

            // LIGHT PROJ MATRIX
            // update depth range camera with  light parameters
            // camera proj matrix should be automatically updated by update/culling ?
            if (this.camera.near !== undefined && this.camera.far !== undefined){
                var near = this.camera.near;
                var far =  this.camera.far + 1;
                this.depthRange.set([near, far, far - near, 1.0 / (far - near)]);
                this.depthRangeNum.set([near, far, far - near, 1.0 / (far - near)]);

                // spot light get spot light angle/frustum
                this.camera.setProjectionMatrix(osg.Matrix.makePerspective(35, 1, near, far));

                // Dir light
                // get scene bbox ?
                //this.camera.setProjectionMatrix(osg.Matrix.makeOrtho(-60, 60, -60, 80, 0, 100));

            }

            osg.Matrix.inverse(this.camera.getPureViewMatrix(),  this.invViewMat );
            this.invShadowViewMatrix.set(this.invViewMat);

            osg.Matrix.copy(this.camera.getProjectionMatrix(), this.shadowProj);

            // udpate shader Parameters
            this.projectionShadow.set(this.shadowProj);
            this.modelviewShadow.set(this.shadowView);

            this.projectionShadowCast.set(this.shadowProj);
            this.modelviewShadowCast.set(this.shadowView);

            // update Light node
            //osg.Matrix.makeLookAt(lightPos, lightDir, [0,0,1], node.getMatrix());
            osg.Matrix.makeTranslate(lightPos[0], lightPos[1], lightPos[2], node.getMatrix());

            node.getLight().dirty();
        }
        node.traverse(nv);
    }
};


function getProgramFromShaders(vs, ps) {

    var vertexshader = shaderLoader.getShaderText(vs);
    var fragmentshader = shaderLoader.getShaderText(ps);
    console.log(fragmentshader);

    var program = new osg.Program(
    new osg.Shader(gl.VERTEX_SHADER, vertexshader), new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

    return program;
}

function setShadowReceiving(receivers, sceneCamera, ReceivesShadowTraversalMask) {

    //sceneCamera.traversalMask = ReceivesShadowTraversalMask;
    // applies on receivers selection for material state set apply only ?

    // scene models (shadow receiver)
    var shadowReceiverScene = new osg.Node();
    shadowReceiverScene.addChild(receivers);

    var shadowmapReceiverVertex;
    var shadowmapReceiverFragment;
    var floatTexSupp = osg.profile.extensions['OES_texture_float'];
    if (floatTexSupp && window.location.href.indexOf("EVSM") != -1) {
        shadowmapReceiverVertex = "shadowmap_evsm_receive.vert";
        shadowmapReceiverFragment = "shadowmap_evsm_receive.frag";
    } else if (floatTexSupp && window.location.href.indexOf("VSM") != -1) {
        shadowmapReceiverVertex = "shadowmap_vsm_receive.vert";
        shadowmapReceiverFragment = "shadowmap_vsm_receive.frag";
    } else {
        shadowmapReceiverVertex = "shadowmap_receive.vert";
        shadowmapReceiverFragment = "shadowmap_receive.frag";
    }

    var stateSet = new osg.StateSet();
    prg = getProgramFromShaders(shadowmapReceiverVertex, shadowmapReceiverFragment);
    stateSet.setAttributeAndMode(prg, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

    stateSet.addUniform(osg.Uniform.createInt1(0, "Texture0"));

    prg.trackAttributes = {};
    prg.trackAttributes.attributeKeys = [];
    prg.trackAttributes.attributeKeys.push('Material');

    prg.trackAttributes.attributeKeys.push('Light0');
    prg.trackAttributes.attributeKeys.push('Light1');
    prg.trackAttributes.attributeKeys.push('Light2');

    var texturedebug = window.location.href.indexOf('textureDebug') !== -1 ? 0 : 1;
    var debugUniform = osg.Uniform.createFloat1(texturedebug, 'debug');
    stateSet.addUniform(debugUniform);

    var invViewMatrixUniform = osg.Uniform.createMatrix4(sceneCamera.getViewMatrix(), 'invViewMatrix');
    stateSet.addUniform(invViewMatrixUniform);

    shadowReceiverScene.setUpdateCallback(new viewMatrixCallbackShadowMap({
        'camera': sceneCamera,
        'invViewMatrix': invViewMatrixUniform
    }));

    shadowReceiverScene.setStateSet(stateSet);
    return shadowReceiverScene;
}

function setShadowCasting(receivers,  lightsource, position, num, CastsShadowTraversalMask) {



    var shadowCamera = new osg.Camera();
    shadowCamera.setName("light_perspective_camera" + num);
    shadowCamera.traversalMask = CastsShadowTraversalMask;
    // scene models (shadow caster)
    //  filled upon distance from light and node/geom mask and transparency
    var shadowCasterScene = new osg.MatrixTransform();
    shadowCasterScene.addChild(receivers);
    shadowCamera.addChild(shadowCasterScene);

    var mapsize = 512;
    shadowSize = [mapsize, mapsize, 1.0 / mapsize, 1.0 / mapsize];

    shadowCamera.light = lightsource.getLight();

    // important because we use linear zbuffer
    var near = 0.0;
    var far = 1.0;


    // update projection each frame, at least near/far but better a computed matrix
    shadowCamera.setProjectionMatrix(osg.Matrix.makePerspective(15, 1, near, far));

    // update order upon render shadow/ render scene/postproc/etc. inehritance.
    shadowCamera.setRenderOrder(osg.Camera.PRE_RENDER, 0);
    shadowCamera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
    shadowCamera.setViewport(new osg.Viewport(0, 0, shadowSize[0], shadowSize[1]));
    shadowCamera.setClearColor([1.0, 1.0, 1.0, 0.0]);



    var shadowmapCasterVertex;
    var shadowmapCasterFragment;
    var floatTexSupp = osg.profile.extensions['OES_texture_float'];
    var textureType, textureFormat;
    if (floatTexSupp && window.location.href.indexOf("EVSM") != -1) {
        shadowmapCasterVertex = "shadowmap_evsm_cast.vert";
        shadowmapCasterFragment = "shadowmap_evsm_cast.frag";
        textureType = osg.Texture.FLOAT;
        textureFormat = osg.Texture.RGBA;
    } else if (floatTexSupp && window.location.href.indexOf("VSM") != -1) {
        shadowmapCasterVertex = "shadowmap_vsm_cast.vert";
        shadowmapCasterFragment = "shadowmap_vsm_cast.frag";
        textureType = osg.Texture.FLOAT;
        textureFormat = osg.Texture.RGB;
    } else {
        shadowmapCasterVertex = "shadowmap_cast.vert";
        shadowmapCasterFragment = "shadowmap_cast.frag";
        textureType = osg.Texture.UNSIGNED_BYTE;
        textureFormat = osg.Texture.RGBA;
    }


    var prg = getProgramFromShaders(shadowmapCasterVertex, shadowmapCasterFragment);
    var casterStateSet =  shadowCasterScene.getOrCreateStateSet();
   casterStateSet.setAttributeAndMode(prg, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

    //shadowCasterScene.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace(osg.CullFace.DISABLE), osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
    //shadowCasterScene.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace(osg.CullFace.BACK), osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
    //

    var depthRange = new osg.Uniform.createFloat4([near, far, far - near, 1.0 / (far - near)], "Shadow_DepthRange");
    var projectionShadowCast = new osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), "Shadow_Projection");
    var modelViewShadowCast = new osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), "Shadow_ModelView");
    var invShadowViewMatrixUniform = osg.Uniform.createMatrix4(shadowCamera.getViewMatrix(), 'invShadowViewMatrix');

    casterStateSet.addUniform(depthRange);
    casterStateSet.addUniform(projectionShadowCast);
    casterStateSet.addUniform(modelViewShadowCast);
    casterStateSet.addUniform(invShadowViewMatrixUniform);


    var shadowTexture = new osg.Texture();
    shadowTexture.setName("shadow" + num);
    shadowTexture.setTextureSize(shadowSize[0], shadowSize[1]);
    shadowTexture.setType(textureType);
    shadowTexture.setInternalFormat(textureFormat);
    //shadowTexture.setMinFilter('LINEAR');
   // shadowTexture.setMinFilter('LINEAR');
    shadowTexture.setMagFilter('NEAREST');
    shadowTexture.setMagFilter('NEAREST');
    shadowTexture.setWrapS(osg.Texture.CLAMP_TO_EDGE);
    shadowTexture.setWrapT(osg.Texture.CLAMP_TO_EDGE);
    shadowCamera.attachTexture(gl.COLOR_ATTACHMENT0, shadowTexture, 0);
    shadowCamera.attachRenderBuffer(gl.DEPTH_ATTACHMENT, gl.DEPTH_COMPONENT16);

    // LIGHT SHADOW RELATION
    lightsource.addChild(shadowCamera);
    lightsource.getOrCreateStateSet().setAttributeAndMode(lightsource.getLight());


    var stateSet = receivers.getOrCreateStateSet();

    stateSet.setTextureAttributeAndMode(num + 1, shadowTexture, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
    stateSet.addUniform(osg.Uniform.createInt1(num + 1, "Texture" + (num + 1)));

    var depthRangeNum = new osg.Uniform.createFloat4([near, far, far - near, 1.0 / (far - near)], "Shadow_DepthRange" + num);
    var shadowMapSizeNum = new osg.Uniform.createFloat4(shadowSize, "Shadow_MapSize" + num);
    var projectionShadowNum = new osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), "Shadow_Projection" + num);
    var modelViewShadowNum = new osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), "Shadow_ModelView" + num);

    stateSet.addUniform(projectionShadowNum);
    stateSet.addUniform(modelViewShadowNum);
    stateSet.addUniform(depthRangeNum);
    stateSet.addUniform(shadowMapSizeNum);

    lightsource.setUpdateCallback(new LightUpdateCallbackShadowMap({
        'projectionShadow': projectionShadowNum,
        'modelViewShadow': modelViewShadowNum,
        'depthRangeNum': depthRangeNum,
        'projectionShadowCast': projectionShadowCast,
        'modelViewShadowCast': modelViewShadowCast,
        'camera': shadowCamera,
        'position': position,
        'shadowCasterScene': shadowCasterScene,
        'depthRange': depthRange,
        'invShadowViewMatrix': invShadowViewMatrixUniform
    }));

    return lightsource;
}


var addCameraRtt = function(resultTexture, name, camera) {
    var w, h;
    w = resultTexture.getWidth();
    h = resultTexture.getHeight();
    if (!camera) camera = new osg.Camera();
    camera.setName(name);
    camera.setViewport(new osg.Viewport(0, 0, w, h));

    camera.setClearColor([0.0, 0.0, 0.0, 0.0]);
    camera.setClearDepth(1.0);
    camera.setClearMask(osg.Camera.COLOR_BUFFER_BIT | osg.Camera.DEPTH_BUFFER_BIT);

    //camera.setClearMask(osg.Camera.COLOR_BUFFER_BIT);

    camera.setRenderOrder(osg.Camera.PRE_RENDER, 0);

    camera.attachTexture(osg.FrameBufferObject.COLOR_ATTACHMENT0, resultTexture, 0);
    camera.attachRenderBuffer(osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16);

    return camera;
};


var addPostProcess = function(scene, camera, viewer) {
    var root = new osg.Node();

    var composer = new osgUtil.Composer();


    var w, h;
    w = 1024;
    h = 1024;

    var shadowTexture = new osg.Texture();
    shadowTexture.setTextureSize(w, h);
    shadowTexture.setMinFilter('LINEAR');
    shadowTexture.setMagFilter('LINEAR');

    var sceneshadowCamera = addCameraRtt(shadowTexture, "sceneinput", camera);
    //sceneshadowCamera.setProjectionMatrix(osg.Matrix.makePerspective(scene.fov, scene.ratio, 1000.0, 100000000.0, []));

    var input = new osgUtil.Composer.Filter.InputTexture(shadowTexture);

    var inverse_buffer_size = osg.Uniform.createFloat2([1.0 / w, 1.0 / h], 'inverse_buffer_size');
    var FXAA = new osgUtil.Composer.Filter.Custom(
    shaderLoader.getShader("fxaa"), {
        'inverse_buffer_size': inverse_buffer_size
    });

    var startX = 0.25 * w,
        startY = 0.5 * h,
        endX = 0.75 * w,
        endY = 0.5 * h;
    var dx = endX - startX;
    var dy = endY - startY;
    var d = Math.sqrt(dx * dx + dy * dy);

    var blurRadius = osg.Uniform.createFloat(2, 'blurRadius');
    var gradientRadius = osg.Uniform.createFloat(50, 'gradientRadius');
    var start = osg.Uniform.createFloat2([startX, startY], 'start');
    var end = osg.Uniform.createFloat2([endX, endY], 'end');
    var delta = osg.Uniform.createFloat2([dx / d, dy / d], 'delta');
    var texSize = osg.Uniform.createFloat2([w, h], 'texSize');


    var tiltshift = new osgUtil.Composer.Filter.Custom(
    shaderLoader.getShader("tiltshift"), {
        'blurRadius': blurRadius,
        'gradientRadius': gradientRadius,
        'start': start,
        'end': end,
        'delta': delta,
        'texSize': texSize,
        'inverse_buffer_size': inverse_buffer_size
    });
    /* tiltshift.update = function(nv) {
        blurRadius.set(2);
        gradientRadius.set(50);
    };*/

    composer.addPass(input);
    composer.addPass(tiltshift);
    composer.addPass(FXAA);
    composer.renderToScreen(viewer._canvas.width, viewer._canvas.height);

    composer.build();

    root.addChild(composer);

    return root;

};

var getModel = function(func) {
    var modelName;
    modelName = 'ogre';
    //modelName = 'monkey';
    //modelName = 'sponza';
    //modelName = 'raceship';
    var url = window.location.href;
    if (window.location.href.indexOf('model') != -1) {
        var urlParts = url.split('?');
        if (urlParts.length > 1) {
            urlParts = urlParts[1].split('&');
            for (var k in urlParts) {
                if (urlParts[k].indexOf('model') !== -1) {
                    urlParts = urlParts[k].split('=');
                    modelName = urlParts[1];
                    break;
                }
            }
        }
    }
    var node = new osg.MatrixTransform();
    if (modelName == 'none')
        return node;


    var defer = osgDB.Promise.defer();
    //node.setMatrix(osg.Matrix.makeRotate(-Math.PI/2, 1,0,0, []));
    var loadModel = function(url) {
        osg.log("loading " + url);
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.onreadystatechange = function(aEvt) {
            if (req.readyState == 4) {
                var child;
                if (req.status == 200) {
                    osgDB.Promise.when(osgDB.parseSceneGraph(JSON.parse(req.responseText))).then(function(child) {
                        node.addChild(child);
                        defer.resolve(node);
                        osg.log("success " + url);
                    });
                } else {
                    osg.log("error " + url);
                }
            }
        };
        req.send(null);
    };

    loadModel(modelName + '.osgjs');
    return defer.promise;
};

function getBlurrShader() {
    var vertexshader = ["", "#ifdef GL_ES", "precision highp float;", "#endif", "attribute vec3 Vertex;", "attribute vec2 TexCoord0;", "uniform mat4 ModelViewMatrix;", "uniform mat4 ProjectionMatrix;", "varying vec2 uv0;", "void main(void) {", "  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);", "  uv0 = TexCoord0;", "}", ""].join('\n');
    var fragmentshader = ["", "#ifdef GL_ES", "precision highp float;", "#endif", "uniform sampler2D Texture0;", "varying vec2 uv0;", "float shift = 1.0/512.0;", "vec4 getSmoothTexelFilter(vec2 uv) {", "  vec4 c = texture2D( Texture0,  uv);", "  c += texture2D( Texture0, uv+vec2(0,shift));", "  c += texture2D( Texture0, uv+vec2(shift,shift));", "  c += texture2D( Texture0, uv+vec2(shift,0));", "  c += texture2D( Texture0, uv+vec2(shift,-shift));", "  c += texture2D( Texture0, uv+vec2(0,-shift));", "  c += texture2D( Texture0, uv+vec2(-shift,-shift));", "  c += texture2D( Texture0, uv+vec2(-shift,0));", "  c += texture2D( Texture0, uv+vec2(-shift,shift));", "  return c/9.0;", "}", "void main(void) {", "   gl_FragColor = getSmoothTexelFilter( uv0);", "}", ""].join('\n');
    var program = new osg.Program(
    new osg.Shader(gl.VERTEX_SHADER, vertexshader), new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));
    return program;
}

var addBlur = function (rttTexture, rttSize){
    var blurr = new osg.Camera();
    blurr.setProjectionMatrix(osg.Matrix.makeOrtho(0, rttSize[0], 0, rttSize[1], -5, 5));
    blurr.setRenderOrder(osg.Camera.PRE_RENDER, 0);
    blurr.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
    blurr.setViewport(new osg.Viewport(0, 0, rttSize[0], rttSize[1]));
    var quad = osg.createTexturedQuad(0, 0, 0, rttSize[0], 0, 0, 0, rttSize[1], 0);
    quad.getOrCreateStateSet().setTextureAttributeAndMode(0, rttTexture);
    quad.getOrCreateStateSet().setAttributeAndMode(getBlurrShader());
    var blurredTexture = new osg.Texture();
    blurredTexture.setTextureSize(rttSize[0], rttSize[1]);
    blurredTexture.setMinFilter('LINEAR');
    blurredTexture.setMagFilter('LINEAR');
    blurr.setClearColor([0, 0, 0, 0]);
    blurr.attachTexture(gl.COLOR_ATTACHMENT0, blurredTexture, 0);
    blurr.addChild(quad);
    return blurredTexture;
};

var startViewer = function() {


    var shaderOptions = {
        inline: (window.location.href.indexOf("debug") === -1),
        async: false,
        callbacksingle: function(e) {
            //console.log(e + "is loaded");
        },
        callbackAll: function(e) {
            console.log("Shaders loaded");
        },
        loadprefix: 'shaders/',
        shaders: shaderslib
    };
    shaderLoader = new osg.ShaderLoader(shaderOptions).loadAll();

    var canvas = document.getElementById("3DView");
    canvas.style.width = window.innerWidth;
    canvas.style.height = window.innerHeight;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var stats = document.getElementById("Stats");

    var viewer;
    viewer = new osgViewer.Viewer(canvas, {
        antialias: true,
        premultipliedAlpha: true
    });

    viewer.init();
    viewer.setupManipulator();

    var modelNode = new osg.Node();
    modelNode.setName('cubeSubNode');
    (function() {
        osgDB.Promise.when(getModel()).then(function(model) {
            var dist = 25;
            var modelSubNode = new osg.MatrixTransform();
            modelSubNode.setMatrix(osg.Matrix.makeTranslate(0, 0, 0, []));
            modelSubNode.addChild(model);
            modelNode.addChild(modelSubNode);
            modelSubNode = new osg.MatrixTransform();
            modelSubNode.setMatrix(osg.Matrix.makeTranslate(0, dist, 0, []));
            modelSubNode.addChild(model);
            modelNode.addChild(modelSubNode);

            modelSubNode = new osg.MatrixTransform();
            modelSubNode.setMatrix(osg.Matrix.makeTranslate(dist, 0, 0, []));
            modelSubNode.addChild(model);
            modelNode.addChild(modelSubNode);

            modelSubNode = new osg.MatrixTransform();
            modelSubNode.setMatrix(osg.Matrix.makeTranslate(-dist, 0, -5, []));
            modelSubNode.addChild(model);
            modelNode.addChild(modelSubNode);
        });
    })();
    var cubeNode = new osg.Node();
    if (window.location.href.indexOf('cube') != -1){
        var size = 2;
        var dist = 15;
        var cube = osg.createTexturedBox(0, 0, 0, size,size,size*10);
        var cubeSubNode = new osg.MatrixTransform();
        cubeSubNode.setName('cubeSubNode');

        cubeSubNode.setMatrix(osg.Matrix.makeTranslate(-dist, -dist , dist/2, []));
        cubeSubNode.addChild(cube);
        cubeNode.addChild(cubeSubNode);
        if (window.location.href.indexOf('cubes') != -1){
            cubeSubNode = new osg.MatrixTransform();
            cubeSubNode.setMatrix(osg.Matrix.makeTranslate(dist, 0 ,0, []));
            cubeSubNode.addChild(cube);
            cubeNode.addChild(cubeSubNode);

            cubeSubNode = new osg.MatrixTransform();
            cubeSubNode.setMatrix(osg.Matrix.makeTranslate(dist, dist ,0, []));
            cubeSubNode.addChild(cube);
            cubeNode.addChild(cubeSubNode);

            cubeSubNode = new osg.MatrixTransform();
            cubeSubNode.setMatrix(osg.Matrix.makeTranslate(0, dist ,0, []));
            cubeSubNode.addChild(cube);
            cubeNode.addChild(cubeSubNode);

            cubeSubNode = new osg.MatrixTransform();
            cubeSubNode.setMatrix(osg.Matrix.makeTranslate(-dist, dist ,-dist/2, []));
            cubeSubNode.addChild(cube);
            cubeNode.addChild(cubeSubNode);

        }

        var cubeTex = osg.Texture.createFromURL("textures/sol_trauma_periph.png");
        cubeTex.setMinFilter('LINEAR_MIPMAP_LINEAR', 16);
        cubeTex.setMagFilter('LINEAR_MIPMAP_LINEAR', 16);
        cubeTex.setWrapT('MIRRORED_REPEAT');
        cubeTex.setWrapS('MIRRORED_REPEAT');
        cubeNode.getOrCreateStateSet().setTextureAttributeAndMode(0, cubeTex);

    }
    var groundNode = new osg.Node();
    groundNode.setName('groundNode');
    
    var groundSize = 5;
    var ground = osg.createTexturedQuadGeometry(0, 0, 0, groundSize, 0, 0, 0, groundSize, 0);
    var groundTex = osg.Texture.createFromURL("textures/sol_trauma_periph.png");
    groundTex.setMinFilter('LINEAR_MIPMAP_LINEAR', 16);
    groundTex.setMagFilter('LINEAR_MIPMAP_LINEAR', 16);
    groundTex.setWrapT('MIRRORED_REPEAT');
    groundTex.setWrapS('MIRRORED_REPEAT');
    ground.getOrCreateStateSet().setTextureAttributeAndMode(0, groundTex);
    ground.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace(osg.CullFace.DISABLE), osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

    var groundSubNode;
    for (var wG = 0; wG < 40; wG++){
        for (var wH = 0; wH < 40; wH++){
            groundSubNode = new osg.MatrixTransform();
            groundSubNode.setMatrix(osg.Matrix.makeTranslate(wG*groundSize - 100, wH*groundSize -100 , -5.0, []));
            groundSubNode.setName('groundSubNode');
            groundSubNode.addChild(ground);
            groundNode.addChild(groundSubNode);
        }
    }
    var lightNodemodel0 = osg.createAxisGeometry();
    var lightNodemodelNode0 = new osg.MatrixTransform();
    lightNodemodelNode0.addChild(lightNodemodel0);

    var lightNodemodel1 = osg.createAxisGeometry();
    var lightNodemodelNode1 = new osg.MatrixTransform();
    lightNodemodelNode1.addChild(lightNodemodel1);

    var lightNodemodel2 = osg.createAxisGeometry();
    var lightNodemodelNode2 = new osg.MatrixTransform();
    lightNodemodelNode2.addChild(lightNodemodel2);

    // Scene to be shadowed,  and to cast  shadow from
    // Multiple parents...
    var ShadowScene = new osg.Node();
    ShadowScene.setName('ShadowScene');

    ShadowScene.addChild(modelNode);
    ShadowScene.addChild(groundNode);
    ShadowScene.addChild(cubeNode);

    // Let there be lights.
    var lightedmodel0;
    var lightedmodel1;
    var lightedmodel2;

    var lightPos0 = [10, 30, 62, 0];
    var lightNode0 = new osg.LightSource();
    lightNode0.setName('lightNode0');
    var light0 = new osg.Light(0);
    light0.setName('light0');
    lightNode0.setLight(light0);

    var lightPos1 = [50, 50, 80, 1.2];
    var lightNode1 = new osg.LightSource();
    lightNode1.setName('lightNode1');
    var light1 = new osg.Light(1);
    light1.setName('light1');
    lightNode1.setLight(light1);

    var lightPos2 = [25, 25, 20, 2.0];
    var lightNode2 = new osg.LightSource();
    lightNode2.setName('lightNode2');
    var light2 = new osg.Light(2);
    light2.setName('light2');
    lightNode2.setLight(light2);

    var rootShadowScene = new osg.Node();// will handle lights and scene
    rootShadowScene.setName('rootShadowScene');
    //
    //rootShadowScene.addChild(ShadowScene);
    //
    rootShadowScene.addChild(lightNode0);
    rootShadowScene.getOrCreateStateSet().setAttributeAndMode(lightNode0.getLight());
    rootShadowScene.addChild(lightNode1);
    rootShadowScene.getOrCreateStateSet().setAttributeAndMode(lightNode1.getLight());
    rootShadowScene.addChild(lightNode2);
    rootShadowScene.getOrCreateStateSet().setAttributeAndMode(lightNode2.getLight());
    //
    var sceneCamera = new osg.Camera();
    sceneCamera.setName("mainShadowReceivingCam");
    sceneCamera.addChild(rootShadowScene);  // Shadowed scene root, all lights
    // Node Mask
    var ReceivesShadowTraversalMask = 0x1;
    var CastsShadowTraversalMask = 0x2;
    //
    //
    modelNode.setNodeMask(ReceivesShadowTraversalMask | CastsShadowTraversalMask);
    cubeNode.setNodeMask(ReceivesShadowTraversalMask | CastsShadowTraversalMask);
    //
    groundNode.setNodeMask(ReceivesShadowTraversalMask);
    //
    var isNative = window.location.href.indexOf('custom') === -1;
    //
    //
    light0._enabled = 1;
    light1._enabled = 1;
    light2._enabled = 1;
    //
    //
    if (isNative) {

        var technique = '';
        var floatTexSupp = osg.profile.extensions['OES_texture_float'];
        if (floatTexSupp && window.location.href.indexOf("EVSM") != -1) {
            technique = 'EVSM';
        } else if (floatTexSupp && window.location.href.indexOf("VSM") != -1) {
            technique = 'VSM';
        } else {
            technique = 'PCF';
        }
        if (light0._enabled){
            lightedmodel0 = new osg.ShadowScene(sceneCamera, lightNode0, new osg['ShadowTechnique' + technique](0, CastsShadowTraversalMask), ReceivesShadowTraversalMask);
            lightedmodel0.addChild(ShadowScene);
        }
        if (light1._enabled){
            lightedmodel1 = new osg.ShadowScene(sceneCamera, lightNode1,new osg['ShadowTechnique' + technique](0, CastsShadowTraversalMask, ReceivesShadowTraversalMask));
            lightedmodel0.addChild(ShadowScene);
        }

        if (light2._enabled){
            lightedmodel2 = new osg.ShadowScene(sceneCamera, lightNode2,new osg['ShadowTechnique' + technique](0, CastsShadowTraversalMask), ReceivesShadowTraversalMask);
            lightedmodel0.addChild(ShadowScene);
        }


    } else {


        //receiving scene
        shadowReceiverScene = setShadowReceiving(ShadowScene, sceneCamera, ReceivesShadowTraversalMask);
        rootShadowScene.addChild(shadowReceiverScene);

        //casting scene
        if (light0._enabled)
            setShadowCasting(shadowReceiverScene, lightNode0, lightPos0, 0, CastsShadowTraversalMask);
        if (light1._enabled)
            setShadowCasting(shadowReceiverScene, lightNode1, lightPos1, 1, CastsShadowTraversalMask);
        if (light2._enabled)
            setShadowCasting(shadowReceiverScene, lightNode2, lightPos2, 2, CastsShadowTraversalMask);
    }
    if (light0._enabled)
        lightNode0.addChild(lightNodemodelNode0);
    if (light1._enabled)
        lightNode1.addChild(lightNodemodelNode1);
    if (light2._enabled)
        lightNode2.addChild(lightNodemodelNode2);


    var root = new osg.Node();// All pure native root.
    root.addChild(sceneCamera);

    //root = addPostProcess(root, sceneCamera, viewer);

    root.addChild(osgUtil.addFrameBufferVisuals({
        screenW: canvas.width,
        screenH: canvas.height
    }));

    viewer.setLight(light0);

    viewer.getCamera().setClearColor([0.0, 0.0, 0.0, 0.0]);

    viewer.setSceneData(root);
    viewer.getManipulator().computeHomePosition();

    viewer.run();

    osgUtil.ParameterVisitor.createSlider({
        min: 1,
        max: 10,
        step: 1,
        value: 2,
        name: "fogdensity",
        object: root,
        field: '_noiseTextureSize',
        onchange: function(value) {
            // fix to a power of two
            root._noiseTextureSize = Math.pow(2, value);
            root._noiseTextureSize = Math.min(root._noiseTextureSize, 512);
        },
        html: document.getElementById('fogparameters')
    });

    osgUtil.ParameterVisitor.createSlider({
        min: 1,
        max: 10,
        step: 1,
        value: 2,
        name: "fogStart",
        object: root,
        field: '_noiseTextureSize',
        onchange: function(value) {
            // fix to a power of two
            root._noiseTextureSize = Math.pow(2, value);
            root._noiseTextureSize = Math.min(root._noiseTextureSize, 512);
        },
        html: document.getElementById('fogparameters')
    });

    osgUtil.ParameterVisitor.createSlider({
        min: 1,
        max: 10,
        step: 1,
        value: 2,
        name: "fogEnd",
        object: root,
        field: '_noiseTextureSize',
        onchange: function(value) {
            // fix to a power of two
            root._noiseTextureSize = Math.pow(2, value);
            root._noiseTextureSize = Math.min(root._noiseTextureSize, 512);
        },
        html: document.getElementById('fogparameters')
    });


    osgUtil.ParameterVisitor.createSlider({
        min: 1,
        max: 10,
        step: 1,
        value: 2,
        name: "mirrorCoef",
        object: root,
        field: '_noiseTextureSize',
        onchange: function(value) {
            // fix to a power of two
            root.mirrorCoef = Math.pow(2, value);
            root.mirrorCoef = Math.min(root.mirrorCoef, 512);
        },
        html: document.getElementById('groundparameters')
    });
    osgUtil.ParameterVisitor.createSlider({
        min: 1,
        max: 10,
        step: 1,
        value: 2,
        name: "mirrorBlur",
        object: root,
        field: '_mirrorBlur',
        onchange: function(value) {
            // fix to a power of two
            root.mirrorBlur = Math.pow(2, value);
            root.mirrorBlur = Math.min(root.mirrorBlur, 512);
        },
        html: document.getElementById('groundparameters')
    });
    osgUtil.ParameterVisitor.createSlider({
        min: 1,
        max: 10,
        step: 1,
        value: 2,
        name: "_mirrorTexSize",
        object: root,
        field: '_mirrorTexSize',
        onchange: function(value) {
            // fix to a power of two
            root._mirrorTexSize = Math.pow(2, value);
            root._mirrorTexSize = Math.min(root._mirrorTexSize, 512);
        },
        html: document.getElementById('groundparameters')
    });



     osgUtil.ParameterVisitor.createSlider({
                min: 0.0,
                max: 0.1,
                step: 0.0001,
                value: 0.001,
                name: "bias",
                object: root,
                field: '_shadowBias',
                onchange: function(value) {
                    // fix to a power of two
                    root._shadowBias = value;
                },
                html: document.getElementById('shadowparameters')
            });
  osgUtil.ParameterVisitor.createSlider({
            min: 1,
            max: 8,
            step: 0.5,
            value: 1,
            name: "blurPixelDistance",
            object: root,
            field: '_pixelSize',
            onchange: function(value) {
                root.setPixelSize = value;
                root.setPixelSize = value;
            },
            html: document.getElementById('shadowblurparameters')
        });




    var mousedown = function(ev) {
        ev.stopPropagation();
    };
    document.getElementById("explanation").addEventListener("mousedown", mousedown, false);

};

extensions = [
   // "/js/osgUtil/ShaderLoader.js",
    "/examples/setup/shaderlib.js"];

if (!window.multidemo) {
    window.addEventListener("load", function() {
        if (window.location.href.indexOf("debug") !== -1) {
            loadOSGJSON("../../", "project.json", startViewer, extensions);
        } else if (window.location.href.indexOf("concat") !== -1) {
            loadOSGJS("../../", "build/osg.debug.js", startViewer, extensions);
        } else {
            loadOSGJS("../../", "build/osg.min.js", startViewer, extensions);
        }
    }, true);
}



var paramCurrent = {};
var paramChange = function(option, type) {
  var url = window.location.href;
  var param = '';
  if (url.indexOf('?') !== -1) {
      //todo: handle models and debug option
    param = '?';
    url = url.split('?')[0];
  }
  else {
    param = '?';
  }

  switch (type){
  case 'debug':
      if (option.indexOf('debug') !== -1)
        param += "&debug=1";
      if (option.indexOf('stats') !== -1)
        param += "&stats=1";
      if (option.indexOf('DebugPromise') !== -1)
        param += "&DebugPromise=1";
      break;
  case 'model':
      param += "&model=" + option ;
      break;
  }
  console.log(url+param);
  window.location.href = url + param;
};
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

var started, parametersURL, parameterUniform = {}, lights = [], shaderLoader;

// UI auto-tweaking parameters utilities using url params
// with memory/overwrite
// and combobox, slider, checkbox initialisation
// with default value  and url parameters
parametersURL = {
    'texturesize': 256,
    'shadow': 'Variance Shadow Map (VSM)',
    'textureformat': 'Autodetect',
    'lightnum': 1,
    'bias': 0.001,
    'VsmEpsilon': 0.001,
    'exponent': 40,
    'blur': 1,
    'msaa': 1,
    'model' : 'ogre',
    'shadowstable': 'World Position',
    'shadowproj': 'fov',
    'fov': 30,
    'exponent1': 10.0,
    'lightselect': 0,
    'lightrotate': 1,
    '_spotCutoff' : 35.0,
    '_spotBlend' : 0.01,
    '_constantAttenuation' : 1.0,
    '_linearAttenuation' : 0.1,
    '_quadraticAttenuation' : 0.1
};

var urlParam = window.location.href;
if (urlParam.indexOf('?') !== -1) {
    urlParam = urlParam.split('?')[1];
    if (urlParam.length > 1) {
        urlParam = urlParam.replace(/^&/g, "").replace(/&/g, "\",\"").replace(/=/g, "\":\"");
        urlParam = decodeURI(urlParam);
        urlParam = JSON.parse('{"' + urlParam + '"}');
        for (var option in urlParam) {
            var val = parseFloat(urlParam[option]);
            if (!isNaN(val))
                parametersURL[option] = val;
            else
                parametersURL[option] = urlParam[option];
        }
    }
}


var paramChange = function(valueName, optionName, noReload, light) {
    if (started){

        var url = window.location.href;
        if (url.indexOf('?') !== -1) {
            param = '?';
            url = url.split('?')[0];
        } else {
            param = '?';
        }
        var didChange = false;
        if (valueName.indexOf('+') !== -1){
            if (parametersURL[debug]){
                parametersURL['vanilla'] = undefined;
                parametersURL['stats'] = undefined;
                parametersURL['debug'] = undefined;
                parametersURL['stats'] = undefined;
                parametersURL['DebugPromise'] = undefined;
            }
            var valueEnabled = valueName.split('+');
            var i = valueEnabled.length;
            while (i--){
                parametersURL[valueName[i]] = 1;
            }
        }
        else if (valueName !== ''){
            var val = parseFloat(valueName);
            if (!isNaN(val)){
                didChange =  parametersURL[optionName] !== val;
                parametersURL[optionName] = val;
            }
            else{
                didChange =  parametersURL[optionName] !== valueName;
                parametersURL[optionName] = valueName;
            }
        }
        else{
            didChange = true;
        }

        for (var option in parametersURL) {
            param += '&' + option + '=' + parametersURL[option];
        }
        if (!noReload){
            if (didChange)
                window.location.href = url + param;
        }
        else{
            if (light){
                currentLight = lights[parametersURL['lightselect']];
                currentLight[ optionName] = parametersURL[optionName];
                currentLight.dirty();
            }
            else{
                for (option in parametersURL) {
                    if (parameterUniform[option])
                        parameterUniform[option].set(parametersURL[option]);
                }
            }
        }
    }
};

var LightUpdateCallbackShadowMap = function(options) {

    this.projectionShadow = options.projectionShadow;
    this.viewShadow = options.viewShadow;
    this.projectionShadowCast = options.projectionShadowCast;
    this.viewShadowCast = options.viewShadowCast;
    this.shadowCasterScene = options.shadowCasterScene;
    this.depthRange = options.depthRange;
    this.depthRangeNum = options.depthRangeNum;
    this.camera = options.camera;
    //this.invShadowViewMatrix = options.invShadowViewMatrix;
    this.lightTarget = [0.0, 0.0, -5.0];
    //this.lightTarget = [15.0, 15.0, 0.0];
    this.worldlightTarget = [];
    if (options.position) this.lightPositionProjTexOrig = options.position;
    else this.lightPositionProjTexOrig = [50.0, 50.0, 80.0, 0.0];

    this.lightPos = [];
    this.lightDir = [];


    this.worldLightPos = [];
    this.worldLightDir = [];

    this.shadowProj = [];
    this.shadowView = [];

    this.up = [0, 0, 1];
    this.first = true;

};
LightUpdateCallbackShadowMap.prototype = {
    updateLightPos: function(node){
        if (node.getLight()._enabled) {
            // TODO: check change
            //if (this.lastPos !== &&& this.lastTargetPos !== ){

            //  GENERIC Code getting pos&dir from light
            // update shadow camera with  light parameters
            osg.Vec3.sub(this.lightPos, this.lightTarget, this.lightDir);
            osg.Vec3.normalize(this.lightDir, this.lightDir);
            this.up = [0, 0, 1]; //   camera up
            // Check it's not coincident with lightdir
            if (Math.abs(osg.Vec3.dot(this.up, this.lightDir)) >= 1.0) {
                // another camera up
               this.up = [0, 1, 0];
            }

            var lightMatrix = node.getMatrix();
            // update Light node
            osg.Matrix.makeLookAt(this.lightPos, this.lightTarget, this.up, lightMatrix);
            osg.Matrix.inverse(lightMatrix, lightMatrix);
           // osg.Matrix.setTrans(lightMatrix, this.lightPos[0], this.lightPos[1], this.lightPos[2]);
            //osg.Matrix.makeTranslate(this.lightPos[0], this.lightPos[1], this.lightPos[2], lightMatrix);

            //
            // camera world matrix.
            var matrixList = node.parents[0].getWorldMatrices();
            var worldMatrix = matrixList[0];

            //  light pos & lightTarget in World Space
            osg.Matrix.transformVec3(worldMatrix, this.lightPos, this.worldLightPos);
            osg.Matrix.transformVec3(worldMatrix, this.lightTarget, this.worldlightTarget);
            //
            // LIGHT VIEW MATRIX
            // put that into shadow camera view matrix.
            osg.Matrix.makeLookAt(this.worldLightPos, this.worldlightTarget, this.up, this.camera.getViewMatrix());
            //this.shadowCasterScene.setMatrix(worldMatrix);


            // LIGHT PROJ MATRIX
            // update depth range camera with  light parameters
            // camera proj matrix should be automatically updated by update/culling ?
            var near = this.camera.near;
            var far = this.camera.far;
            if (near === undefined || far === undefined) {
                near = 0.01;
                far = 200;
            }

            if (near === far) {
                far += 1;
            }

            this.depthRange.set([near, far, far - near, 1.0 / (far - near)]);
            this.depthRangeNum.set([near, far, far - near, 1.0 / (far - near)]);

            if (parametersURL['shadowproj'] === 'fov' || this.camera.boundingbox === undefined ){
                // spot light get spot light angle/frustum
                var fov =parametersURL['fov'];
                this.camera.setProjectionMatrix(osg.Matrix.makePerspective(fov, 1, near, far));
            }
            else{
                // Dir light
                // get scene bbox ?
                var min = this.camera.boundingbox._min;
                var max = this.camera.boundingbox._max;
                /*   var ortho = [
                    2.0 / max[0] - min[0], 0.0, 0.0, 0.0,
                    0.0, 2.0 / max[1] - min[1], 0.0, 0.0,
                    0.0, 0.0, 1.0 / (far - near), -1.0 * near / (far - near),
                    0.0, 0.0, 0.0, 1.0];

                this.camera.setProjectionMatrix(ortho);
        */
                this.camera.setProjectionMatrix(osg.Matrix.makeOrtho(min[0], max[0], min[1], max[1], min[2], max[2]));
            }
            osg.Matrix.copy(this.camera.getProjectionMatrix(), this.shadowProj);
            osg.Matrix.copy(this.camera.getViewMatrix(), this.shadowView);

            // udpate shader Parameters
            //this.projectionShadowCast.set(this.shadowProj);
            // this.viewShadowCast.set(this.shadowView);

            this.projectionShadow.set(this.shadowProj);
            this.viewShadow.set(this.shadowView);


            node.setDirtyMatrix(true);
            this.camera.setDirtyMatrix(true);
        }
    },
    animation : function (currentTime){
        this.lightPos[0] = this.lightPositionProjTexOrig[0] * (Math.cos(currentTime) + this.lightPositionProjTexOrig[3]); //x
        this.lightPos[1] = this.lightPositionProjTexOrig[1] * (Math.sin(currentTime) + this.lightPositionProjTexOrig[3]); //y
        this.lightPos[2] = this.lightPositionProjTexOrig[2]; //z
    },
    update: function(node, nv) {
        if (node.getLight()._enabled) {
            // animation !
            if (this.first || (parametersURL['lightrotate'] && parametersURL['lightrotate'] !== 0)){
                this.animation(nv.getFrameStamp().getSimulationTime() * 0.2);
                this.updateLightPos(node);
                this.first = false;
            }

        }
        node.traverse(nv);
    }
};


function getProgramFromShaders(vs, ps, defines) {

    var vertexshader = shaderLoader.getShaderText(vs, defines);
    var fragmentshader = shaderLoader.getShaderText(ps, defines);
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
    var defines = [];
    if(parametersURL['shadowstable'] === 'World Position')
        defines.push('#define NUM_STABLE');
    var floatTexSupp = osg.profile.extensions['OES_texture_float'] && parametersURL['textureformat'] !== 'Force8bits';
    if (floatTexSupp && parametersURL['shadow'] === 'Exponential Variance Shadow Map (EVSM)') {
        shadowmapReceiverVertex = "shadowmap_evsm_receive.vert";
        shadowmapReceiverFragment = "shadowmap_evsm_receive.frag";
    } else if (floatTexSupp && parametersURL['shadow'] === 'Variance Shadow Map (VSM)') {
        shadowmapReceiverVertex = "shadowmap_vsm_receive.vert";
        shadowmapReceiverFragment = "shadowmap_vsm_receive.frag";
    } else {
        if (parametersURL['shadow'] === 'Exponential Shadow Map (ESM)'){
            defines.push('#define _ESM');
        }
        else if (parametersURL['shadow'] === 'Shadow Map'){
            defines.push('#define _NONE');
        }
        else if (parametersURL['shadow'] === 'Shadow Map Percentage Close Filtering (PCF)'){
            defines.push('#define _PCF');
        }
        else if (parametersURL['shadow'] === 'Variance Shadow Map (VSM)'){
            defines.push('#define _VSM');
        }
        shadowmapReceiverVertex = "shadowmap_receive.vert";
        shadowmapReceiverFragment = "shadowmap_receive.frag";
    }

    var stateSet = new osg.StateSet();
    prg = getProgramFromShaders(shadowmapReceiverVertex, shadowmapReceiverFragment, defines);
    stateSet.setAttributeAndMode(prg, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

    stateSet.addUniform(osg.Uniform.createInt1(0, "Texture0"));

    prg.trackAttributes = {};
    prg.trackAttributes.attributeKeys = [];
    prg.trackAttributes.attributeKeys.push('Material');

    prg.trackAttributes.attributeKeys.push('Light0');
    prg.trackAttributes.attributeKeys.push('Light1');
    prg.trackAttributes.attributeKeys.push('Light2');

    var myuniform;

    var texturedebug = parametersURL['lightonly'];
    myuniform = osg.Uniform.createFloat1(texturedebug, 'debug');
    stateSet.addUniform(myuniform);
    parameterUniform['lightonly'] = myuniform;

    var bias = parametersURL['bias'];
    myuniform = osg.Uniform.createFloat1(bias, 'bias');
    stateSet.addUniform(myuniform);
    parameterUniform['bias'] = myuniform;

    var exponent = parametersURL['exponent'];
    myuniform = osg.Uniform.createFloat1(exponent, 'exponent');
    stateSet.addUniform(myuniform);
    parameterUniform['exponent'] = myuniform;

    var exponent1 = parametersURL['exponent1'];
    myuniform = osg.Uniform.createFloat1(exponent1, 'exponent1');
    stateSet.addUniform(myuniform);
    parameterUniform['exponent1'] = myuniform;

    var VsmEpsilon = parametersURL['VsmEpsilon'];
    myuniform = osg.Uniform.createFloat1(VsmEpsilon, 'VsmEpsilon');
    stateSet.addUniform(myuniform);
    parameterUniform['VsmEpsilon'] = myuniform;


    shadowReceiverScene.setStateSet(stateSet);
    return shadowReceiverScene;
}

function setShadowCasting(receivers, lightsource, position, num, CastsShadowTraversalMask) {



    var shadowCamera = new osg.Camera();
    shadowCamera.setName("light_perspective_camera" + num);
    shadowCamera.traversalMask = CastsShadowTraversalMask;
    // scene models (shadow caster)
    //  filled upon distance from light and node/geom mask and transparency
    var shadowCasterScene = new osg.MatrixTransform();
    shadowCasterScene.addChild(receivers);
    shadowCamera.addChild(shadowCasterScene);

    var mapsize = parametersURL['texturesize'];
    shadowSize = [mapsize, mapsize, 1.0 / mapsize, 1.0 / mapsize];

    // important because we use linear zbuffer
    var near = 0.0;
    var far = 1.0;


    // update projection each frame, at least near/far but better a computed matrix
    shadowCamera.setProjectionMatrix(osg.Matrix.makePerspective(15, 1, near, far));

    // update order upon render shadow/ render scene/postproc/etc. inehritance.
    shadowCamera.setRenderOrder(osg.Camera.PRE_RENDER, 0);
    shadowCamera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
    shadowCamera.setViewport(new osg.Viewport(0, 0, shadowSize[0], shadowSize[1]));
    shadowCamera.setClearColor([1.0, 1.0, 1.0, 1.0]);



    var shadowmapCasterVertex;
    var shadowmapCasterFragment;
    var floatTexSupp = osg.profile.extensions['OES_texture_float'] && parametersURL['textureformat'] !== 'Force8bits';
    var textureType, textureFormat, defines = [];

    if(parametersURL['shadowstable'] === 'World Position')
        defines.push('#define NUM_STABLE');
     if (floatTexSupp && parametersURL['shadow'] === 'Exponential Variance Shadow Map (EVSM)') {
        shadowmapCasterVertex = "shadowmap_evsm_cast.vert";
        shadowmapCasterFragment = "shadowmap_evsm_cast.frag";
        textureType = osg.Texture.FLOAT;
        textureFormat = osg.Texture.RGBA;
    } else if (floatTexSupp && parametersURL['shadow'] === 'Variance Shadow Map (VSM)') {
        shadowmapCasterVertex = "shadowmap_vsm_cast.vert";
        shadowmapCasterFragment = "shadowmap_vsm_cast.frag";
        textureType = osg.Texture.FLOAT;
        textureFormat = osg.Texture.RGB;
    } else {
        if (parametersURL['shadow'] === 'Exponential Shadow Map (ESM)'){
            defines.push('#define _ESM');
        }
        else if (parametersURL['shadow'] === 'Shadow Map'){
            defines.push('#define _NONE');
        }
        else if (parametersURL['shadow'] === 'Shadow Map Percentage Close Filtering (PCF)'){
            defines.push('#define _PCF');
        }
        else if (parametersURL['shadow'] === 'Variance Shadow Map (VSM)'){
            defines.push('#define _VSM');
        }
        shadowmapCasterVertex = "shadowmap_cast.vert";
        shadowmapCasterFragment = "shadowmap_cast.frag";
        textureType = osg.Texture.UNSIGNED_BYTE;
        textureFormat = osg.Texture.RGBA;
    }

    var prg = getProgramFromShaders(shadowmapCasterVertex, shadowmapCasterFragment, defines);
    var casterStateSet = shadowCasterScene.getOrCreateStateSet();
    casterStateSet.setAttributeAndMode(prg, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

    //casterStateSet.setAttributeAndMode(new osg.CullFace(osg.CullFace.DISABLE), osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
    //casterStateSet.setAttributeAndMode(new osg.CullFace(osg.CullFace.BACK), osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

    //prevent unessecary texture bindings
    casterStateSet.setTextureAttributeAndMode(0, new osg.Texture(), osg.StateAttribute.OFF | osg.StateAttribute.OVERRIDE);
    casterStateSet.setTextureAttributeAndMode(1, new osg.Texture(), osg.StateAttribute.OFF | osg.StateAttribute.OVERRIDE);
    casterStateSet.setTextureAttributeAndMode(2, new osg.Texture(), osg.StateAttribute.OFF | osg.StateAttribute.OVERRIDE);
    casterStateSet.setTextureAttributeAndMode(3, new osg.Texture(), osg.StateAttribute.OFF | osg.StateAttribute.OVERRIDE);

    //casterStateSet.setAttributeAndMode(new osg.BlendFunc('ONE', 'ZERO'));
    //casterStateSet.setAttributeAndMode(new osg.Depth('LESS', 0.0, 1.0, false));


    var depthRange = new osg.Uniform.createFloat4([near, far, far - near, 1.0 / (far - near)], "Shadow_DepthRange");
    var projectionShadowCast = new osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), "Shadow_Projection");
    var viewShadowCast = new osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), "Shadow_View");
    //var invShadowViewMatrixUniform = osg.Uniform.createMatrix4(shadowCamera.getViewMatrix(), 'invShadowViewMatrix');

    casterStateSet.addUniform(depthRange);
    casterStateSet.addUniform(projectionShadowCast);
    casterStateSet.addUniform(viewShadowCast);
    //casterStateSet.addUniform(invShadowViewMatrixUniform);


    var shadowTexture = new osg.Texture();
    shadowTexture.setName("shadow" + num);
    shadowTexture.setTextureSize(shadowSize[0], shadowSize[1]);
    shadowTexture.setType(textureType);
    shadowTexture.setInternalFormat(textureFormat);

    //shadowTexture.setMinFilter('NEAREST');
    //shadowTexture.setMagFilter('NEAREST');

    shadowTexture.setMinFilter('LINEAR');
    shadowTexture.setMagFilter('LINEAR');

    shadowTexture.setWrapS(osg.Texture.CLAMP_TO_EDGE);
    shadowTexture.setWrapT(osg.Texture.CLAMP_TO_EDGE);
    shadowCamera.attachTexture(gl.COLOR_ATTACHMENT0, shadowTexture, 0);
    shadowCamera.attachRenderBuffer(gl.DEPTH_ATTACHMENT, gl.DEPTH_COMPONENT16);


    // LIGHT SHADOW RELATION
    lightsource.addChild(shadowCamera);

    var doBlur = parametersURL['blur'] !== 0;
    var doDownSample = parametersURL['msaa'];
    var shadowTextureFinal = shadowTexture;
    var shadowSizeFinal = shadowSize;
    //var shadowSizeFinal shadowSize.slice(0);//cp by value
    if (doBlur) {
        var blurPass;
        blurPass = addBlur(shadowTextureFinal, shadowSizeFinal);
        shadowTextureFinal = blurPass.texture;
        lightsource.addChild(blurPass.camera);
    }
    while (doDownSample-- && shadowSizeFinal[0] > 64) {
        var halfPass;
        halfPass = addHalfDownSample(shadowTextureFinal, shadowSizeFinal);
        shadowTextureFinal = halfPass.texture;
        shadowSizeFinal[0] *= 0.5;
        shadowSizeFinal[1] *= 0.5;
        shadowSizeFinal[2] *= 2.0;
        shadowSizeFinal[3] *= 2.0;
        lightsource.addChild(halfPass.camera);

    }

    lightsource.getOrCreateStateSet().setAttributeAndMode(lightsource.getLight());


    var stateSet = receivers.getOrCreateStateSet();

    stateSet.setTextureAttributeAndMode(num + 1, shadowTextureFinal, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
    stateSet.addUniform(osg.Uniform.createInt1(num + 1, "Texture" + (num + 1)));

    var depthRangeNum = new osg.Uniform.createFloat4([near, far, far - near, 1.0 / (far - near)], "Shadow_DepthRange" + num);
    var shadowMapSizeNum = new osg.Uniform.createFloat4(shadowSize, "Shadow_MapSize" + num);
    var projectionShadowNum = new osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), "Shadow_Projection" + num);
    var viewShadowNum = new osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), "Shadow_View" + num);

    stateSet.addUniform(projectionShadowNum);
    stateSet.addUniform(viewShadowNum);
    stateSet.addUniform(depthRangeNum);
    stateSet.addUniform(shadowMapSizeNum);

    var lightCallback = new LightUpdateCallbackShadowMap({
        'projectionShadow': projectionShadowNum,
        'viewShadow': viewShadowNum,
        'depthRangeNum': depthRangeNum,
        'projectionShadowCast': projectionShadowCast,
        'viewShadowCast': viewShadowCast,
        'camera': shadowCamera,
        'position': position,
        'shadowCasterScene': shadowCasterScene,
        'depthRange': depthRange
        //'invShadowViewMatrix': invShadowViewMatrixUniform
    });

    lightsource.setUpdateCallback(lightCallback);

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
    modelName = parametersURL['model'];
    var node = new osg.MatrixTransform();
    if (!modelName) return node;


    var defer = osgDB.Promise.defer();
    //node.setMatrix(osg.Matrix.makeRotate(-Math.PI/2, 1,0,0, []));
    var loadModel = function(url) {
        osg.log("loading " + url);
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        var options = {};
        var urlParts = url.split('/');
        urlParts = urlParts.slice(0, urlParts.length - 1);
        options.prefixURL = urlParts.join('/') + '/';
        req.onreadystatechange = function(aEvt) {
            if (req.readyState == 4) {
                var child;
                if (req.status == 200) {
                    osgDB.Promise.when(osgDB.parseSceneGraph(JSON.parse(req.responseText), options)).then(function(child) {
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

var addHalfDownSample = function(rttTexture, rttSize) {
    var w = rttSize[0] / 2,
        h = rttSize[1] / 2;

    var halfDownedTexture = new osg.Texture();
    halfDownedTexture.setTextureSize(w, h);

    halfDownedTexture.setMinFilter('NEAREST');
    halfDownedTexture.setMagFilter('NEAREST');

    halfDownedTexture.setType(rttTexture.getGLType());
    halfDownedTexture.setInternalFormat(rttTexture.getInternalFormat());

    var halfDownQuad = osg.createTexturedQuadGeometry(-w / 2, -h / 2, 0, w, 0, 0, 0, h, 0);
    stateSet = halfDownQuad.getOrCreateStateSet();
    stateSet.setTextureAttributeAndMode(0, rttTexture);
    stateSet.setAttributeAndMode(getProgramFromShaders("basic.vert", "downsize.frag"));
    var texMapSize = new osg.Uniform.createFloat4(rttSize, "TexSize");
    stateSet.addUniform(texMapSize);

    var halfDownCam = new osg.Camera();
    halfDownCam.setProjectionMatrix(osg.Matrix.makeOrtho(-w / 2, w / 2, -h / 2, h / 2, -5, 5, []));
    //TODO disable clear & depth checks
    halfDownCam.setClearMask(0);
    //halfDownCam.setClearColor([0, 0, 0, 0]);
    //halfDownCam.setClearDepth(1.0);
    halfDownCam.setRenderOrder(osg.Camera.PRE_RENDER, 0);
    halfDownCam.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
    halfDownCam.setViewport(new osg.Viewport(0, 0, rttSize[0], rttSize[1]));
    halfDownCam.attachTexture(gl.COLOR_ATTACHMENT0, halfDownedTexture, 0);

    halfDownCam.addChild(halfDownQuad);

    return {
        camera: halfDownCam,
        texture: halfDownedTexture,
        quad: halfDownQuad
    };

};

var addBlur = function(rttTexture, rttSize) {

    var w = rttSize[0],
        h = rttSize[1];

    var blurredTexture = new osg.Texture();
    blurredTexture.setTextureSize(w, h);

    blurredTexture.setMinFilter('LINEAR');
    blurredTexture.setMagFilter('LINEAR_MIPMAP_LINEAR', 16);

    blurredTexture.setType(rttTexture.getGLType());
    blurredTexture.setInternalFormat(rttTexture.getInternalFormat());

    var blurQuad = osg.createTexturedQuadGeometry(-w / 2, -h / 2, 0, w, 0, 0, 0, h, 0);
    stateSet = blurQuad.getOrCreateStateSet();
    stateSet.setTextureAttributeAndMode(0, rttTexture);
    stateSet.setAttributeAndMode(getProgramFromShaders("basic.vert", "fastblur.frag"));
    var texMapSize = new osg.Uniform.createFloat4(rttSize, "TexSize");
    stateSet.addUniform(texMapSize);

    var blurCam = new osg.Camera();
    blurCam.setProjectionMatrix(osg.Matrix.makeOrtho(-w / 2, w / 2, -h / 2, h / 2, -5, 5, []));
    //TODO disable clear & depth checks
    blurCam.setClearMask(0);
    //blurCam.setClearColor([0, 0, 0, 0]);
    //blurCam.setClearDepth(1.0);
    blurCam.setRenderOrder(osg.Camera.PRE_RENDER, 0);
    blurCam.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
    blurCam.setViewport(new osg.Viewport(0, 0, rttSize[0], rttSize[1]));
    blurCam.attachTexture(gl.COLOR_ATTACHMENT0, blurredTexture, 0);

    blurCam.addChild(blurQuad);

    return {
        camera: blurCam,
        texture: blurredTexture,
        quad: blurQuad
    };
};

var startViewer = function() {


    for (var option in parametersURL) {
        var elem = document.getElementById(option);
        if (elem){
            elem.value = parametersURL[option];
            if (elem.previousSibling && elem.previousSibling.innerHTML)
                elem.previousSibling.innerHTML = elem.previousSibling.innerHTML.split(':')[0] + ': ' + elem.value;
        }
    }

    var shaderOptions = {
        inline: parametersURL['debug'] ? false : true,
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

    viewer.setLightingMode(osgViewer.View.LightingMode.NO_LIGHT);
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
    if (1 || window.location.href.indexOf('cube') != -1) {
        var size = 2;
        var dist = 15;
        var cube = osg.createTexturedBox(0, 0, 0, size, size, size * 10);
        var cubeSubNode = new osg.MatrixTransform();
        cubeSubNode.setName('cubeSubNode');

        cubeSubNode.setMatrix(osg.Matrix.makeTranslate(-dist, -dist, dist / 2, []));
        cubeSubNode.addChild(cube);
        cubeNode.addChild(cubeSubNode);
        if (1 || window.location.href.indexOf('cubes') != -1) {
            cubeSubNode = new osg.MatrixTransform();
            cubeSubNode.setMatrix(osg.Matrix.makeTranslate(dist, 0, 0, []));
            cubeSubNode.addChild(cube);
            cubeNode.addChild(cubeSubNode);

            cubeSubNode = new osg.MatrixTransform();
            cubeSubNode.setMatrix(osg.Matrix.makeTranslate(dist, dist, 0, []));
            cubeSubNode.addChild(cube);
            cubeNode.addChild(cubeSubNode);

            cubeSubNode = new osg.MatrixTransform();
            cubeSubNode.setMatrix(osg.Matrix.makeTranslate(0, dist, 0, []));
            cubeSubNode.addChild(cube);
            cubeNode.addChild(cubeSubNode);

            cubeSubNode = new osg.MatrixTransform();
            cubeSubNode.setMatrix(osg.Matrix.makeTranslate(-dist, dist, -dist / 2, []));
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

    var groundSize = 40;
    var ground = osg.createTexturedQuadGeometry(0, 0, 0, groundSize, 0, 0, 0, groundSize, 0);
    var groundTex = osg.Texture.createFromURL("textures/sol_trauma_periph.png");
    groundTex.setMinFilter('LINEAR_MIPMAP_LINEAR', 16);
    groundTex.setMagFilter('LINEAR_MIPMAP_LINEAR', 16);
    groundTex.setWrapT('MIRRORED_REPEAT');
    groundTex.setWrapS('MIRRORED_REPEAT');
    ground.getOrCreateStateSet().setTextureAttributeAndMode(0, groundTex);
    ground.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace(osg.CullFace.DISABLE), osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

    var groundSubNode;
    for (var wG = 0; wG < 5; wG++) {
        for (var wH = 0; wH < 5; wH++) {
            groundSubNode = new osg.MatrixTransform();
            groundSubNode.setMatrix(osg.Matrix.makeTranslate(wG * groundSize - 100, wH * groundSize - 100, -5.0, []));
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
    //

    var lightedmodel0;
    var lightedmodel1;
    var lightedmodel2;

    var lightPos0 = [50, 50, 80, 0];
    var lightNode0 = new osg.LightSource();
    lightNode0.setName('lightNode0');
    var light0 = new osg.Light(0);
    light0.setName('light0');

    light0.setSpotCutoff(parametersURL['_spotCutoff']);
    light0.setSpotBlend(parametersURL['_spotBlend']);
    light0.setConstantAttenuation(parametersURL['_constantAttenuation']);
    light0.setLinearAttenuation(parametersURL['_linearAttenuation']);
    light0.setQuadraticAttenuation(parametersURL['_quadraticAttenuation']);

/*
    light0._ambient = [ 0, 0, 0, 1 ];
    light0._diffuse = [ 0.8, 0, 0, 1.0 ];
    light0._specular = [ 0, 0, 0.8, 1.0 ];
*/
    lightNode0.setLight(light0);
    lights.push(light0);

    var lightPos1 = [-15, -5, 30, 1.2];
    var lightNode1 = new osg.LightSource();
    lightNode1.setName('lightNode1');
    var light1 = new osg.Light(1);


    light1.setName('light1');
    lightNode1.setLight(light1);
    lights.push(light1);

    var lightPos2 = [25, 25, 30, 2.0];
    var lightNode2 = new osg.LightSource();
    lightNode2.setName('lightNode2');
    var light2 = new osg.Light(2);
    light2.setName('light2');
    lightNode2.setLight(light2);
    lights.push(light2);

    light0._enabled = 0;
    light1._enabled = 0;
    light2._enabled = 0;
    if(parametersURL['lightnum'] >= 1){
        light0._enabled = 1;
    }
    if(parametersURL['lightnum'] >= 2){
        light1._enabled = 1;
    }
    if(parametersURL['lightnum'] >= 3){
        light2._enabled = 1;
    }

    //
    var rootShadowScene = new osg.Node(); // will handle lights and scene
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
    var sceneCamera = viewer.getCamera();
    sceneCamera.setName("mainShadowReceivingCam");
    sceneCamera.addChild(rootShadowScene); // Shadowed scene root, all lights
    // Node Mask
    var ReceivesShadowTraversalMask = 0x1;
    var CastsShadowTraversalMask = 0x2;
    //
    //
    modelNode.setNodeMask(ReceivesShadowTraversalMask | CastsShadowTraversalMask);
    cubeNode.setNodeMask(ReceivesShadowTraversalMask | CastsShadowTraversalMask);
    // needed for VSM
    groundNode.setNodeMask(ReceivesShadowTraversalMask | CastsShadowTraversalMask);
    // PCF ok with this
    //groundNode.setNodeMask(ReceivesShadowTraversalMask);
    //
    var isNative = false;//window.location.href.indexOf('custom') === -1;

    var technique = '';
    var defines = [];

    var showhide = {};
    showhide['bias'] = true;
    showhide['VsmEpsilon'] = true;
    showhide['exponent'] = true;
    showhide['exponent1'] = true;
    var floatTexSupp = osg.profile.extensions['OES_texture_float'] && parametersURL['textureformat'] !== 'Force8bits';
     if (floatTexSupp){
        if(parametersURL['shadow'] === 'Exponential Variance Shadow Map (EVSM)') {
                technique = 'EVSM';
        }
         else if (floatTexSupp && parametersURL['shadow'] === 'Variance Shadow Map (VSM)') {
                technique = 'VSM';
                showhide['exponent'] = false;
                showhide['exponent1'] = false;
        }
        else if (parametersURL['shadow'] === 'Exponential Shadow Map (ESM)'){
            defines.push('#define _ESM');
            defines.push('#define _FLOATTEX');
                showhide['exponent1'] = false;
                showhide['VsmEpsilon'] = false;
        }
        else if (parametersURL['shadow'] === 'Shadow Map'){
            defines.push('#define _NONE');
            defines.push('#define _FLOATTEX');
                showhide['exponent'] = false;
                showhide['exponent1'] = false;
                showhide['VsmEpsilon'] = false;
        }
        else if (parametersURL['shadow'] === 'Shadow Map Percentage Close Filtering (PCF)'){
            defines.push('#define _PCF');
            defines.push('#define _FLOATTEX');
                showhide['exponent'] = false;
                showhide['exponent1'] = false;
                showhide['VsmEpsilon'] = false;
        }
    } else {
        if (parametersURL['shadow'] === 'Exponential Shadow Map (ESM)'){
            defines.push('#define _ESM');
                showhide['exponent1'] = false;
                showhide['VsmEpsilon'] = false;
        }
        else if (parametersURL['shadow'] === 'Shadow Map'){
            defines.push('#define _NONE');
                showhide['exponent'] = false;
                showhide['exponent1'] = false;
                showhide['VsmEpsilon'] = false;
        }
        else if (parametersURL['shadow'] === 'Shadow Map Percentage Close Filtering (PCF)'){
            defines.push('#define _PCF');
                showhide['exponent'] = false;
                showhide['exponent1'] = false;
                showhide['VsmEpsilon'] = false;
        }
        else if (parametersURL['shadow'] === 'Variance Shadow Map (VSM)'){
            defines.push('#define _VSM');
                showhide['exponent'] = false;
                showhide['exponent1'] = false;
            technique = 'PCF';
        }
    }
    //
    for (var id in showhide){
        var el = document.getElementById(id);
        if (el) {
            el.style.display = showhide[id] ? 'block' : 'none';
            el.previousSibling.style.display = showhide[id] ? 'block' : 'none';
        }
    }

    //
    if (isNative) {


        if (light0._enabled) {
            lightedmodel0 = new osg.ShadowScene(sceneCamera, lightNode0, new osg['ShadowTechnique' + technique](0, CastsShadowTraversalMask), ReceivesShadowTraversalMask);
            lightedmodel0.addChild(ShadowScene);
        }
        if (light1._enabled) {
            lightedmodel1 = new osg.ShadowScene(sceneCamera, lightNode1, new osg['ShadowTechnique' + technique](0, CastsShadowTraversalMask, ReceivesShadowTraversalMask));
            lightedmodel0.addChild(ShadowScene);
        }

        if (light2._enabled) {
            lightedmodel2 = new osg.ShadowScene(sceneCamera, lightNode2, new osg['ShadowTechnique' + technique](0, CastsShadowTraversalMask), ReceivesShadowTraversalMask);
            lightedmodel0.addChild(ShadowScene);
        }


    } else {
        //receiving scene
        shadowReceiverScene = setShadowReceiving(ShadowScene, sceneCamera, ReceivesShadowTraversalMask);
        rootShadowScene.addChild(shadowReceiverScene);

        //casting scene
        if (light0._enabled) setShadowCasting(shadowReceiverScene, lightNode0, lightPos0, 0, CastsShadowTraversalMask);
        if (light1._enabled) setShadowCasting(shadowReceiverScene, lightNode1, lightPos1, 1, CastsShadowTraversalMask);
        if (light2._enabled) setShadowCasting(shadowReceiverScene, lightNode2, lightPos2, 2, CastsShadowTraversalMask);
    }
    if (light0._enabled) lightNode0.addChild(lightNodemodelNode0);
    if (light1._enabled) lightNode1.addChild(lightNodemodelNode1);
    if (light2._enabled) lightNode2.addChild(lightNodemodelNode2);


    var root = new osg.Node(); // All pure native root.

    //root = addPostProcess(root, sceneCamera, viewer);

    rootShadowScene.addChild(osgUtil.addFrameBufferVisuals({
        screenW: canvas.width,
        screenH: canvas.height
    }));

    osg.updateCacheUniform = true;
    osg.UniformScalingEnabled = true;


    // will cause double positionned atributes store...
    //viewer.setLight(light0);

    viewer.getCamera().setClearColor([0.0, 0.0, 0.0, 0.0]);

    viewer.setSceneData(rootShadowScene);
    viewer.getManipulator().computeHomePosition();

    viewer.run();



    var mousedown = function(ev) {
        ev.stopPropagation();
    };
    document.getElementById("explanation").addEventListener("mousedown", mousedown, false);

    started = true;
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

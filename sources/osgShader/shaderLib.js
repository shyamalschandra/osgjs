define( [
    'text!osgShader/node/functions.glsl',
    'text!osgShader/node/lights.glsl',
    'text!osgShader/node/textures.glsl',
    'text!osgShader/node/shadowsVert.glsl',
    'text!osgShader/node/shadowsFrag.glsl'
], function ( functions, lights, textures, shadowsVert, shadowsFrag ) {
    'use strict';

    return {
        'functions.glsl': functions,
        'lights.glsl': lights,
        'textures.glsl': textures,
        'shadowsVert.glsl': shadowsVert,
        'shadowsFrag.glsl': shadowsFrag
    };
} );
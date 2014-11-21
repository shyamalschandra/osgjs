'use strict';

window.OSG.globalify();

var osg = window.osg;
var osgUtil = window.osgUtil;
var osgShader = window.osgShader;

/*
    This filter simulate the reduction of an image's brightness at the periphery compared to the image center.
    It can be used as an artistic effect or to reproduce the look of old photo and films
*/
function getCMAA() {


    var effect = {

        name: 'CMAA',
        needCommonCube: true,

        buildComposer: function ( sceneTexture, finalTexture ) {

            var CMAAFilter = new osgUtil.Composer.Filter.Custom(
                osgShader.ShaderProcessor.instance.getShader( 'cmaa' ), {
                    'Texture0': sceneTexture,
                    'viewport': [ sceneTexture.getWidth(), sceneTexture.getHeight() ]
                }
            );

            var composer = new osgUtil.Composer();
            composer.addPass( CMAAFilter, finalTexture );
            composer.build();
            return composer;
        },

        buildGui: function ( mainGui ) {

            var folder = mainGui.addFolder( this.name );
            folder.open();

        }
    };

    return effect;

}
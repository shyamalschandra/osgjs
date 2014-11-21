'use strict';

window.OSG.globalify();

var osg = window.osg;
var osgUtil = window.osgUtil;
var osgShader = window.osgShader;

/*
    This filter simulate the reduction of an image's brightness at the periphery compared to the image center.
    It can be used as an artistic effect or to reproduce the look of old photo and films
*/
function getSimpleShapes( sceneTexture ) {



    var effect = {

        name: 'SimpleShapes',
        needCommonCube: true,

        buildComposer: function ( sceneTexture, finalTexture ) {

            var SimpleShapesFilter = new osgUtil.Composer.Filter.Custom(
                osgShader.ShaderProcessor.instance.getShader( 'simpleShapes' ), {
                    'Texture0': sceneTexture
                }
            );
            var composer = new osgUtil.Composer();
            composer.addPass( SimpleShapesFilter, finalTexture );
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
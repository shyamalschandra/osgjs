'use strict';

window.OSG.globalify();

var osg = window.osg;
var osgUtil = window.osgUtil;
var osgShader = window.osgShader;

/*
    This filter simulate the reduction of an image's brightness at the periphery compared to the image center.
    It can be used as an artistic effect or to reproduce the look of old photo and films
*/
function getComplexLongSymShapes() {


    var effect = {

        name: 'ComplexLongSymShapes',
        needCommonCube: true,

        buildComposer: function ( sceneTexture, finalTexture ) {

            var ComplexLongSymShapesFilter = new osgUtil.Composer.Filter.Custom(
                osgShader.ShaderProcessor.instance.getShader( 'complexLongSymShapes' ), {
                    'Texture0': sceneTexture
                }
            );

            var composer = new osgUtil.Composer();
            composer.addPass( ComplexLongSymShapesFilter, finalTexture );
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
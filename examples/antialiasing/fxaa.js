'use strict';

window.OSG.globalify();

var osg = window.osg;
var osgUtil = window.osgUtil;;
var osgShader = window.osgShader;

/*
    This filter simulate the reduction of an image's brightness at the periphery compared to the image center.
    It can be used as an artistic effect or to reproduce the look of old photo and films
*/
function getFXAA() {

    var effect = {

        name: 'FXAA',
        needCommonCube: true,

        buildComposer: function ( sceneTexture, finalTexture ) {

            var FXAAFilter = new osgUtil.Composer.Filter.Custom(
                osgShader.ShaderProcessor.instance.getShader( 'fxaa' ), {
                'Texture0': sceneTexture,
                    'subpixel_aa': 0.75,
                    'contrast_treshold': 0.1,
                    'edge_treshold': 0.0
                }
            );

            var composer = new osgUtil.Composer();
            composer.addPass( FXAAFilter, finalTexture );
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
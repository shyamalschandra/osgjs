window.EnvironmentSphericalHarmonics = ( function () {
    'use strict';

    var Q = window.Q;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgShader = OSG.osgShader;
    var $ = window.$;

    var shaderProcessor = new osgShader.ShaderProcessor();

    var EnvironmentSphericalHarmonics = function ( file ) {
        this._file = file;
        this._uniformSpherical = undefined;

    };

    EnvironmentSphericalHarmonics.prototype = {

        createShaderSpherical: function () {


            var vertexshader = shaderProcessor.getShader( 'sphericalHarmonicsVertex.glsl' );
            var fragmentshader = shaderProcessor.getShader( 'sphericalHarmonicsFragment.glsl' );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            return program;
        },

        createDebugGeometry: function () {

            var debugGroup = new osg.MatrixTransform();
            var size = 10;
            // create a sphere to debug it
            var sphere = osg.createTexturedSphereGeometry( size, 20, 20 );
            sphere.getOrCreateStateSet().setAttributeAndModes( this.createShaderSpherical() );
            sphere.getOrCreateStateSet().addUniform( this._uniformSpherical );

            debugGroup.addChild( sphere );
            return debugGroup;
        },

        load: function () {
            var p = Q( $.get( this._file ) );

            p.then( function ( text ) {
                this._sphCoef = JSON.parse( text );
                this._sphCoef.splice( 9 * 3 );

                var coef0 = 1.0 / ( 2.0 * Math.sqrt( Math.PI ) );
                var coef1 = -( Math.sqrt( 3.0 / Math.PI ) * 0.5 );
                var coef2 = -coef1;
                var coef3 = coef1;
                var coef4 = Math.sqrt( 15.0 / Math.PI ) * 0.5;
                var coef5 = -coef4;
                var coef6 = Math.sqrt( 5.0 / Math.PI ) * 0.25;
                var coef7 = coef5;
                var coef8 = Math.sqrt( 15.0 / Math.PI ) * 0.25;

                var coef = [ coef0, coef0, coef0,
                    coef1, coef1, coef1,
                    coef2, coef2, coef2,
                    coef3, coef3, coef3,
                    coef4, coef4, coef4,
                    coef5, coef5, coef5,
                    coef6, coef6, coef6,
                    coef7, coef7, coef7,
                    coef8, coef8, coef8,
                ];

                this._sphCoef = coef.map( function ( value, index ) {
                    return value * this._sphCoef[ index ];
                }.bind( this ) );

                this._uniformSpherical = osg.Uniform.createFloat3Array( this._sphCoef, 'uEnvironmentSphericalHarmonics' );

            }.bind( this ) );
            return p;
        }
    };

    return EnvironmentSphericalHarmonics;
} )();

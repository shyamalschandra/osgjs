window.modelConfig = ( function () {
    'use strict';

    var osg = window.OSG.osg;
    var Q = window.Q;

    var config = [ {
        name: 'devastator',
        root: 'devastator/',
        promise: undefined,
        model: new osg.Node(),
        thumbnail: 'thumbnail.jpg',
        description: {
            rank: 1,
            title: 'Android Helper',
            author: 'Allegorithmic',
            link: ''
        },
        config: {
            mapNormal: true,
            mapSpecular: true,
            mapAmbientOcclusion: false,
            mapGlossiness: true
        },
        init: function ( config ) {
            var self = this;

            var rootNode = new osg.MatrixTransform();

            var defer = Q.defer();
            var root = config.root;
            var callbackModel = function ( model ) {
                rootNode.addChild( model );

                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 4, 'aoMap' ) );

                var promises = [];
                var base = root;
                promises.push( self.readImageURL( base + 'Devastator_diffuse.tga.png' ) );
                promises.push( self.readImageURL( base + 'Devastator_glossiness.tga.png' ) );

                promises.push( self.readImageURL( base + 'Devastator_normal.tga.png' ) );
                promises.push( self.readImageURL( base + 'Devastator_specular.tga.png' ) );

                var createTexture = function ( image ) {
                    var texture = new osg.Texture();
                    texture.setWrapS( 'REPEAT' );
                    texture.setWrapT( 'REPEAT' );

                    texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                    texture.setMagFilter( 'LINEAR' );
                    texture.setImage( image );
                    return texture;
                };

                Q.all( promises ).then( function ( args ) {
                    args.forEach( function ( image, index ) {
                        var texture = createTexture( args[ index ] );
                        texture.setWrapS( 'REPEAT' );
                        texture.setWrapT( 'REPEAT' );
                        model.getOrCreateStateSet().setTextureAttributeAndMode( index, texture );
                    } );

                    defer.resolve( rootNode );
                }.bind( this ) );

                return defer.promise;
            };

            this.getModel( root + 'devastator.osgjs.gz', callbackModel );
            return defer.promise;
        }
    }, {
        name: 'Android',
        root: 'Android_Helper/',
        promise: undefined,
        model: new osg.Node(),
        thumbnail: 'thumbnail.jpg',
        description: {
            rank: 1,
            title: 'Android Helper',
            author: 'Allegorithmic',
            link: ''
        },
        config: {
            mapNormal: true,
            mapSpecular: false,
            mapAmbientOcclusion: true,
            mapGlossiness: false
        },
        init: function ( config ) {

            var root = config.root;
            var model = new osg.MatrixTransform();

            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 4, 'aoMap' ) );

            var arms = [
                root + 'outputs/arms/arms_diffuse.png',
                root + 'outputs/arms/arms_roughness.png',
                root + 'outputs/arms/arms_normal.png',
                root + 'outputs/arms/arms_metallic.png',
                root + 'outputs/arms/arms_ambient_occlusion.png'
            ];

            var body = [
                root + 'outputs/body/body_diffuse.png',
                root + 'outputs/body/body_roughness.png',
                root + 'outputs/body/body_normal.png',
                root + 'outputs/body/body_metallic.png',
                root + 'outputs/body/body_ambient_occlusion.png',
                //                root + 'outputs/body/body_emissive.png'
            ];

            var bodyMetal = [
                root + 'outputs/bodymetal/bodymetal_diffuse.png',
                root + 'outputs/bodymetal/bodymetal_roughness.png',
                root + 'outputs/bodymetal/bodymetal_normal.png',
                root + 'outputs/bodymetal/bodymetal_metallic.png',
                root + 'outputs/bodymetal/bodymetal_ambient_occlusion.png',
                //                root + 'outputs/bodymetal/bodymetal_emissive.png'
            ];

            var face = [
                root + 'outputs/face/face_diffuse.png',
                root + 'outputs/face/face_roughness.png',
                root + 'outputs/face/face_normal.png',
                root + 'outputs/face/face_metallic.png',
                root + 'outputs/face/face_AO.png',
                //                root + 'outputs/face/face_emissive.png'
            ];

            var FindNodeVisitor = function ( name ) {
                osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
                this._name = name;
                this._node = undefined;
            };

            // reference all light in the scene
            FindNodeVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
                init: function ( name ) {
                    this._name = name;
                    this._node = undefined;
                },
                apply: function ( node ) {
                    if ( node.getName() === this._name ) {
                        this._node = node;
                        return;
                    }
                    if ( this._node )
                        return;

                    this.traverse( node );
                }
            } );


            var callbackModel = function ( model, textures ) {

                var promises = [];

                // iter on each part to assign textures
                var names = Object.keys( textures );
                var finder = new FindNodeVisitor();

                var createTexture = function ( image ) {
                    var texture = new osg.Texture();
                    texture.setWrapS( 'REPEAT' );
                    texture.setWrapT( 'REPEAT' );

                    texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                    texture.setMagFilter( 'LINEAR' );
                    texture.setImage( image );
                    return texture;
                };

                names.forEach( function ( name ) {

                    // find the node to assign textures
                    finder.init( name );
                    model.accept( finder );

                    var node = finder._node;
                    if ( !node )
                        console.error( 'can\'t find node ' + name );

                    var stateSet = node.getOrCreateStateSet();


                    textures[ name ].forEach( function ( element, index ) {

                        var promise = this.readImageURL( element );
                        promises.push( promise );

                        promise.then( function ( texture ) {
                            stateSet.setTextureAttributeAndModes( index, createTexture( texture ) );
                        }.bind( this ) );

                    }.bind( this ) );

                }.bind( this ) );

                return Q.all( promises );
            };

            var createCallback = function ( textures ) {
                return function ( model ) {
                    return callbackModel.call( this, model, textures );
                };
            };


            var defer = Q.defer();

            Q.all( [

                this.getModel( root + 'android.osgjs.gz', createCallback( {
                    'Object001': arms,
                    'Robot_Lady_Body': body,
                    'Robot_Lady_Pose_v06': bodyMetal,
                    'Face': face
                } ) )

            ] ).then( function ( args ) {

                model.addChild( args[ 0 ] );

                defer.resolve( model );

            }.bind( this ) );

            return defer.promise;
        }
    }, {
        name: 'Alien',
        root: 'ChrisNarchi/',
        promise: undefined,
        model: new osg.Node(),
        thumbnail: 'thumbnail.jpg',
        description: {
            rank: 1,
            title: 'Johann Krauss',
            author: 'Chris Narchi',
            link: ''
        },
        config: {
            mapNormal: true,
            mapSpecular: false,
            mapAmbientOcclusion: false,
            mapGlossiness: false
        },
        init: function ( config ) {

            var root = config.root;
            var model = new osg.MatrixTransform();
            osg.Matrix.makeRotate( Math.PI * 0.5, 1, 0, 0, model.getMatrix() );

            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );
            model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 4, 'aoMap' ) );

            var set1 = [
                root + 'SET_1_diffuse.tga.png',
                root + 'SET_1_roughness.tga.png',
                root + 'SET_1_normal.tga.png',
                root + 'SET_1_metallic.tga.png'
            ];

            var set2 = [
                root + 'SET_2_diffuse.tga.png',
                root + 'SET_2_roughness.tga.png',
                root + 'SET_2_normal.tga.png',
                root + 'SET_2_metallic.tga.png'
            ];

            var glass = [
                root + 'glass_smoke_diffuse.tga.png',
                root + 'glass_smoke_reflection.tga.png',
            ];

            var callbackModel = function ( model, textures, transparency ) {

                this.clearStateSetFromGraph( model );

                if ( transparency ) {
                    model.getOrCreateStateSet().setRenderingHint( 'TRANSPARENT_BIN' );
                    model.getOrCreateStateSet().setTextureAttributeAndModes();
                    model.getOrCreateStateSet().setTextureAttributeAndModes();
                    model.getOrCreateStateSet().setTextureAttributeAndModes();
                }

                var defer = Q.defer();

                var promises = [];

                textures.forEach( function ( element ) {
                    promises.push( this.readImageURL( element ) );
                }.bind( this ) );

                var createTexture = function ( image ) {
                    var texture = new osg.Texture();
                    texture.setWrapS( 'REPEAT' );
                    texture.setWrapT( 'REPEAT' );

                    texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                    texture.setMagFilter( 'LINEAR' );
                    texture.setImage( image );
                    return texture;
                };

                Q.all( promises ).then( function ( args ) {
                    args.forEach( function ( image, index ) {
                        var texture = createTexture( args[ index ] );
                        texture.setWrapS( 'REPEAT' );
                        texture.setWrapT( 'REPEAT' );
                        model.getOrCreateStateSet().setTextureAttributeAndMode( index, texture );
                    } );

                    defer.resolve( model );
                }.bind( this ) );

                return defer.promise;
            };

            var createCallback = function ( textures, transparency ) {
                return function ( model ) {
                    return callbackModel.call( this, model, textures, transparency );
                };
            };


            var defer = Q.defer();

            Q.all( [

                this.getModel( root + 'set_1.osgjs.gz', createCallback( set1 ) ),
                this.getModel( root + 'set_2.osgjs.gz', createCallback( set2 ) ),
                //                this.getModel( root + 'glass.osgjs.gz', createCallback( glass, true ) ),

            ] ).then( function ( args ) {

                model.addChild( args[ 0 ] );
                model.addChild( args[ 1 ] );

                defer.resolve( model );

            }.bind( this ) );

            return defer.promise;
        }
    }, {
        name: 'C3PO',
        root: 'C3PO_optim/',
        promise: undefined,
        model: new osg.Node(),
        thumbnail: 'thumbnail.jpg',
        description: {
            rank: 1,
            title: 'C3PO',
            author: 'Christian Hecht',
            link: ''
        },
        config: {
            mapNormal: true,
            mapSpecular: false,
            mapAmbientOcclusion: false,
            mapGlossiness: false
        },
        init: function ( config ) {
            var self = this;

            var callbackModel = function ( model ) {

                var defer = Q.defer();

                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );

                var promises = [];
                var vers = '2k';
                if ( this._textureHighres )
                    vers = '4k';

                var base = config.root + 'textures/' + vers + '/';
                promises.push( self.readImageURL( base + 'c3po_D.tga.png' ) );
                promises.push( self.readImageURL( base + 'c3po_R.tga.png' ) );

                promises.push( self.readImageURL( base + 'c3po_N.tga.png' ) );
                promises.push( self.readImageURL( base + 'c3po_M.tga.png' ) );

                var createTexture = function ( image ) {
                    var texture = new osg.Texture();
                    texture.setWrapS( 'REPEAT' );
                    texture.setWrapT( 'REPEAT' );

                    texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                    texture.setMagFilter( 'LINEAR' );
                    texture.setImage( image );
                    return texture;
                };

                Q.all( promises ).then( function ( args ) {
                    args.forEach( function ( image, index ) {
                        var texture = createTexture( args[ index ] );
                        texture.setWrapS( 'REPEAT' );
                        texture.setWrapT( 'REPEAT' );
                        model.getOrCreateStateSet().setTextureAttributeAndMode( index, texture );
                    } );

                    defer.resolve( model );
                } );

                return defer.promise;
            };
            return this.getModel( config.root + 'C3PO_head.osgjs.gz', callbackModel );
        }
    }, {
        name: 'Cerberus',
        root: 'model/',
        promise: undefined,
        model: new osg.Node(),
        thumbnail: 'thumbnail.jpg',
        description: {
            title: 'Cerberus',
            link: 'http://artisaverb.info/Cerberus.html',
            rank: 1,
            author: 'Andrew Maximov'
        },
        config: {
            mapNormal: true
        },
        init: function ( config ) {

            var self = this;
            var root = config.root;
            var callbackModel = function ( model ) {

                var defer = Q.defer();

                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );

                var promises = [];
                promises.push( self.readImageURL( root + '/Cerberus_by_Andrew_Maximov/Textures/Cerberus_A.tga.png' ) );
                promises.push( self.readImageURL( root + '/Cerberus_by_Andrew_Maximov/Textures/Cerberus_R.tga.png' ) );

                promises.push( self.readImageURL( root + '/Cerberus_by_Andrew_Maximov/Textures/Cerberus_N.tga.png' ) );
                promises.push( self.readImageURL( root + '/Cerberus_by_Andrew_Maximov/Textures/Cerberus_M.tga.png' ) );

                var createTexture = function ( image ) {
                    var texture = new osg.Texture();
                    texture.setImage( image );
                    texture.setWrapS( 'REPEAT' );
                    texture.setWrapT( 'REPEAT' );

                    texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                    texture.setMagFilter( 'LINEAR' );
                    return texture;
                };

                Q.all( promises ).then( function ( args ) {
                    args.forEach( function ( image, index ) {
                        model.getOrCreateStateSet().setTextureAttributeAndMode( index, createTexture( args[ index ] ) );
                    } );

                    defer.resolve( model );
                } );

                return defer.promise;
            };

            return this.getModel( root + '/Cerberus_by_Andrew_Maximov.osgjs.gz', callbackModel );
        }
    }, {
        name: 'Mire',
        root: 'mire/',
        promise: undefined,
        model: new osg.Node(),
        thumbnail: 'thumbnail.jpg',
        description: {
            title: 'Mire test',
            rank: 1,
            link: 'http://www.allegorithmic.com/',
            author: 'Allegorithmic'
        },
        config: {
            mapSpecular: false,
            mapAmbientOcclusion: false,
            mapGlossiness: false,
            mapNormal: true
        },
        init: function ( config ) {
            var self = this;
            var root = config.root;

            var callbackModel = function ( model ) {

                var defer = Q.defer();

                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );

                var promises = [];
                var base = root;
                promises.push( self.readImageURL( base + 'diffuse.png' ) );
                promises.push( self.readImageURL( base + 'roughness.png' ) );

                promises.push( self.readImageURL( base + 'normal.png' ) );
                promises.push( self.readImageURL( base + 'metallic.png' ) );

                var createTexture = function ( image ) {
                    var texture = new osg.Texture();
                    texture.setWrapS( 'REPEAT' );
                    texture.setWrapT( 'REPEAT' );

                    texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                    texture.setMagFilter( 'LINEAR' );
                    texture.setImage( image );
                    return texture;
                };

                Q.all( promises ).then( function ( args ) {
                    args.forEach( function ( image, index ) {
                        var texture = createTexture( args[ index ] );
                        texture.setWrapS( 'REPEAT' );
                        texture.setWrapT( 'REPEAT' );
                        model.getOrCreateStateSet().setTextureAttributeAndMode( index, texture );
                    } );

                    defer.resolve( model );
                } );

                return defer.promise;
            };

            var model = new osg.MatrixTransform();
            var geometry = osg.createTexturedQuadGeometry( -0.5, -0.5, 0,
                1, 0, 0,
                0, 1, 0 );
            geometry.getAttributes().Tangent = new osg.BufferArray( 'ARRAY_BUFFER', [ 1, 0, 0, -1,
                1, 0, 0, -1,
                1, 0, 0, -1,
                1, 0, 0, -1
            ], 4 );

            var mata = osg.Matrix.makeRotate( Math.PI / 2, 0, 0, 1, osg.Matrix.create() );
            var matb = osg.Matrix.makeRotate( -Math.PI / 2.0, 1, 0, 0, model.getMatrix() );
            osg.Matrix.mult( mata, matb, matb );
            model.addChild( geometry );
            model.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
            return callbackModel( model );
        }
    }, {
        name: 'Sphere',
        root: '',
        promise: undefined,
        model: new osg.Node(),
        thumbnail: 'thumbnail.jpg',
        description: {
            title: 'Sphere test',
            rank: 1,
            link: '',
            author: 'The matrix'
        },
        config: {
            mapNormal: false,
            mapSpecular: true,
            mapAmbientOcclusion: false,
            mapGlossiness: false
        },
        init: function () {

            var nbMaterials = 8;

            var createConfig = function ( albedo, specular ) {

                var config = [];
                for ( var i = 0; i < nbMaterials; i++ ) {
                    config[ i ] = config[ i ] || {};
                    var material = config[ i ];

                    material.roughness = i / nbMaterials;
                    material.albedo = albedo.slice( 0 );
                    material.specular = specular.slice( 0 );
                }
                return config;
            };



            var materialsConfig = [ {
                    specular: [ 0.5, 0.5, 0.5 ], // plastic
                    albedo: [ 0.6, 0.0, 0.0 ]
                }, {
                    specular: [ 0.971519, 0.959915, 0.915324 ], // Silver
                    albedo: [ 0, 0, 0 ]
                }, {
                    specular: [ 0.913183, 0.921494, 0.924524 ], // Aluminium
                    albedo: [ 0, 0, 0 ]
                }, {
                    specular: [ 1.0, 0.765557, 0.336057 ], // Gold
                    albedo: [ 0, 0, 0 ]
                }, {
                    specular: [ 0.955008, 0.637427, 0.538163 ], // Copper
                    albedo: [ 0, 0, 0 ]
                }, // {
                {
                    specular: [ 0.659777, 0.608679, 0.525649 ], // Nickel
                    albedo: [ 0, 0, 0 ]
                }, //  {
                {
                    specular: [ 0.662124, 0.654864, 0.633732 ], // Cobalt
                    albedo: [ 0, 0, 0 ]
                }, {
                    specular: [ 0.672411, 0.637331, 0.585456 ], // Platinum
                    albedo: [ 0, 0, 0 ]
                }
            ];



            var group = new osg.Node();


            materialsConfig.forEach( function ( material, index ) {
                var radius = 10.0;
                var offset = 5;

                var config = createConfig( material.albedo, material.specular );
                var subgroup = new osg.MatrixTransform();
                subgroup.setMatrix( osg.Matrix.makeTranslate( 0, index * ( 2 * radius + offset ), 0, osg.Matrix.create() ) );
                config.forEach( function ( config, index ) {

                    var segment = 80;
                    var sphere = osg.createTexturedSphere( radius, segment, segment / 2 );

                    var color = config.albedo.slice( 0 );
                    color[ 3 ] = 1.0;
                    var albedo = this.createTextureFromColor( color, true );
                    sphere.getOrCreateStateSet().setTextureAttributeAndModes( 0, albedo );

                    var roughness = this.createTextureFromColor( [ config.roughness, config.roughness, config.roughness, 1.0 ], false );
                    sphere.getOrCreateStateSet().setTextureAttributeAndModes( 1, roughness );

                    color = config.specular.slice( 0 );
                    color[ 3 ] = 1.0;
                    var specular = this.createTextureFromColor( color, true );
                    sphere.getOrCreateStateSet().setTextureAttributeAndModes( 3, specular );

                    var transform = new osg.MatrixTransform();
                    transform.setMatrix( osg.Matrix.makeTranslate( index * ( 2 * radius + offset ), 0, 0, osg.Matrix.create() ) );
                    transform.addChild( sphere );
                    subgroup.addChild( transform );
                }.bind( this ) );
                group.addChild( subgroup );

            }.bind( this )  );

            group.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
            group.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
            group.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
            group.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );
            group.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 4, 'aoMap' ) );

            var rootModel = new osg.Node();
            rootModel.addChild( group );
            return Q( rootModel );
        }
    }, {
        name: 'Robot',
        root: 'robot/',
        promise: undefined,
        model: new osg.Node(),
        thumbnail: 'thumbnail.jpg',
        description: {
            title: 'Junkbot',
            rank: 1,
            author: 'Paweł Łyczkowski (design + model) + Nicolas Wirrmann (texturing)',
            link: ''
        },
        config: {
            mapSpecular: true,
            mapAmbientOcclusion: true,
            mapGlossiness: true,
            mapNormal: true
        },
        init: function ( config ) {

            var self = this;
            var root = config.root;
            var callbackModel = function ( model ) {

                var defer = Q.defer();

                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 4, 'aoMap' ) );


                var prefix = '_2';
                if ( this._textureHighres )
                    prefix = '';

                var promises = [];
                promises.push( self.readImageURL( root + 'Textures/map_A' + prefix + '.jpg' ) );
                promises.push( self.readImageURL( root + 'Textures/map_R' + prefix + '.jpg' ) );

                promises.push( self.readImageURL( root + 'Textures/map_N' + prefix + '.jpg' ) );
                promises.push( self.readImageURL( root + 'Textures/map_S' + prefix + '.jpg' ) );
                promises.push( self.readImageURL( root + 'Textures/map_AO' + prefix + '.jpg' ) );

                var createTexture = function ( image ) {
                    var texture = new osg.Texture();
                    texture.setWrapS( 'REPEAT' );
                    texture.setWrapT( 'REPEAT' );

                    texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                    texture.setMagFilter( 'LINEAR' );

                    texture.setImage( image );
                    return texture;
                };

                Q.all( promises ).then( function ( args ) {
                    args.forEach( function ( image, index ) {
                        model.getOrCreateStateSet().setTextureAttributeAndMode( index, createTexture( args[ index ] ) );
                    } );

                    model.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
                    defer.resolve( model );
                } );

                return defer.promise;
            };

            var modelPromise = this.getModel( root + 'Junkbot.osgjs.gz', callbackModel );
            Q( modelPromise ).then( function ( model ) {
                osg.Matrix.makeIdentity( model.getMatrix() );
            } );

            return modelPromise;
        }
    }, {
        name: 'hotrod',
        root: 'hotrod2/',
        promise: undefined,
        model: new osg.Node(),
        thumbnail: 'thumbnail.jpg',
        description: {
            title: 'Hotrod',
            author: 'Christophe Desse (design + model) + Jeremie Noguer (texturing)',
            rank: 1,
            link: ''
        },
        config: {
            mapSpecular: true,
            mapAmbientOcclusion: true,
            mapGlossiness: true,
            mapNormal: true
        },
        init: function ( config ) {

            var self = this;
            var root = config.root;
            var callbackModel = function ( model ) {

                var defer = Q.defer();

                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 4, 'aoMap' ) );

                var promises = [];
                var base = root;
                promises.push( self.readImageURL( base + 'hotrod_diffuse.png' ) );
                promises.push( self.readImageURL( base + 'hotrod_glossiness.png' ) );

                promises.push( self.readImageURL( base + 'hotrod_normal.png' ) );
                promises.push( self.readImageURL( base + 'hotrod_specular.png' ) );
                promises.push( self.readImageURL( base + 'hotrod_ao.png' ) );

                var createTexture = function ( image ) {
                    var texture = new osg.Texture();
                    texture.setWrapS( 'REPEAT' );
                    texture.setWrapT( 'REPEAT' );

                    texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                    texture.setMagFilter( 'LINEAR' );
                    texture.setImage( image );
                    return texture;
                };

                Q.all( promises ).then( function ( args ) {
                    args.forEach( function ( image, index ) {
                        var texture = createTexture( args[ index ] );
                        texture.setWrapS( 'REPEAT' );
                        texture.setWrapT( 'REPEAT' );
                        model.getOrCreateStateSet().setTextureAttributeAndMode( index, texture );
                    } );

                    defer.resolve( model );
                } );

                return defer.promise;
            };

            return this.getModel( root + 'hotrod2.osgjs.gz', callbackModel );
        }
    } ];

    return config;
} )();
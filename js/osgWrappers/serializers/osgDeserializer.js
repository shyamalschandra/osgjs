/** -*- compile-command: "jslint-cli osg.js" -*-
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

osgDB.ObjectWrapper.deserializers.osg = {};

osgDB.ObjectWrapper.deserializers.osg.Object = function(output, obj) {

    if (obj.getName()) {
        output += '"name": ' + obj.getName();
    }
    output += ',';
    if (obj.getUserData()) {
        output += '"UserDataContainer": ' + obj.getUserData();
    }

    return output;
};

osgDB.ObjectWrapper.deserializers.osg.Node = function(output, node) {

    output += '{';

    osgDB.ObjectWrapper.deserializers.osg.Object(output, node);


    if (node.Children) {
        for (var i = 0, k = node.Children.length; i < k; i++) {
            createChildren(node.Children[i]);
        }
    }

    var defer = osgDB.Promise.defer();
    osgDB.Promise.all(promiseArray).then(function() {
        defer.resolve(node);
    });

    output += '}';
    return defer.promise;
};

osgDB.ObjectWrapper.deserializers.osg.StateSet = function(output, stateSet) {
    var jsonObj = output.getJSON();
    var check = function(o) {
        return true;
    };

    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.deserializers.osg.Object(output, stateSet);

    if (jsonObj.RenderingHint !== undefined) {
        stateSet.setRenderingHint(jsonObj.RenderingHint);
    }

    var createAttribute = function(jsonAttribute) {
        var promise = output.setJSON(jsonAttribute).readObject();
        var df = osgDB.Promise.defer();
        promiseArray.push(df.promise);
        osgDB.Promise.when(promise).then(function(attribute) {
            if (attribute !== undefined) {
                stateSet.setAttributeAndMode(attribute);
            }
            df.resolve();
        });
    };

    var promiseArray = [];

    if (jsonObj.AttributeList !== undefined) {
        for (var i = 0, l = jsonObj.AttributeList.length; i < l; i++) {
            createAttribute(jsonObj.AttributeList[i]);
        }
    }

    var createTextureAttribute = function(unit, textureAttribute) {
        var promise = output.setJSON(textureAttribute).readObject();
        var df = osgDB.Promise.defer();
        promiseArray.push(df.promise);
        osgDB.Promise.when(promise).then(function(attribute) {
            if (attribute)
                stateSet.setTextureAttributeAndMode(unit, attribute);
            df.resolve();
        });
    };

    if (jsonObj.TextureAttributeList) {
        var textures = jsonObj.TextureAttributeList;
        for (var t = 0, lt = textures.length; t < lt; t++) {
            var textureAttributes = textures[t];
            for (var a = 0, al = textureAttributes.length; a < al; a++) {
                createTextureAttribute(t, textureAttributes[a]);
            }
        }
    }

    var defer = osgDB.Promise.defer();
    osgDB.Promise.all(promiseArray).then(function() {
        defer.resolve(stateSet);
    });

    return defer.promise;
};

osgDB.ObjectWrapper.deserializers.osg.Material = function(output, material) {
    var jsonObj = output.getJSON();

    var check = function(o) {
        if (o.Diffuse !== undefined &&
            o.Emission !== undefined &&
            o.Specular !== undefined &&
            o.Shininess !== undefined) {
            return true;
        }
        return false;
    };

    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.deserializers.osg.Object(output, material);

    material.setAmbient(jsonObj.Ambient);
    material.setDiffuse(jsonObj.Diffuse);
    material.setEmission(jsonObj.Emission);
    material.setSpecular(jsonObj.Specular);
    material.setShininess(jsonObj.Shininess);
    return material;
};


osgDB.ObjectWrapper.deserializers.osg.BlendFunc = function(output, blend) {
    var jsonObj = output.getJSON();
    var check = function(o) {
        if (o.SourceRGB && o.SourceAlpha && o.DestinationRGB && o.DestinationAlpha) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.deserializers.osg.Object(output, blend);

    blend.setSourceRGB(jsonObj.SourceRGB);
    blend.setSourceAlpha(jsonObj.SourceAlpha);
    blend.setDestinationRGB(jsonObj.DestinationRGB);
    blend.setDestinationAlpha(jsonObj.DestinationAlpha);
    return blend;
};

osgDB.ObjectWrapper.deserializers.osg.CullFace = function(output, attr) {
    var jsonObj = output.getJSON();
    var check = function(o) {
        if (o.Mode !== undefined) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.deserializers.osg.Object(output, attr);
    attr.setMode(jsonObj.Mode);
    return attr;
};

osgDB.ObjectWrapper.deserializers.osg.BlendColor = function(output, attr) {
    var jsonObj = output.getJSON();
    var check = function(o) {
        if (o.ConstantColor !== undefined) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.deserializers.osg.Object(output, attr);
    attr.setConstantColor(jsonObj.ConstantColor);
    return attr;
};

osgDB.ObjectWrapper.deserializers.osg.Light = function(output, light) {
    var jsonObj = output.getJSON();
    var check = function(o) {
        if (o.LightNum !== undefined &&
            o.Ambient !== undefined &&
            o.Diffuse !== undefined &&
            o.Direction !== undefined &&
            o.Position !== undefined &&
            o.Specular !== undefined &&
            o.SpotCutoff !== undefined &&
            o.LinearAttenuation !== undefined &&
            o.ConstantAttenuation !== undefined &&
            o.QuadraticAttenuation !== undefined ) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.deserializers.osg.Object(output, light);
    light.setAmbient(jsonObj.Ambient);
    light.setConstantAttenuation(jsonObj.ConstantAttenuation);
    light.setDiffuse(jsonObj.Diffuse);
    light.setDirection(jsonObj.Direction);
    light.setLightNumber(jsonObj.LightNum);
    light.setLinearAttenuation(jsonObj.LinearAttenuation);
    light.setPosition(jsonObj.Position);
    light.setQuadraticAttenuation(jsonObj.QuadraticAttenuation);
    light.setSpecular(jsonObj.Specular);
    light.setSpotCutoff(jsonObj.SpotCutoff);
    light.setSpotBlend(0.01);
    if (jsonObj.SpotExponent !== undefined) {
        light.setSpotBlend(jsonObj.SpotExponent/128.0);
    }
    return light;
};

osgDB.ObjectWrapper.deserializers.osg.Texture = function(output, texture) {
    var jsonObj = output.getJSON();
    var check = function(o) {
        return true;
    };
    if (!check(jsonObj)) {
        return;
    }

    osgDB.ObjectWrapper.deserializers.osg.Object(output, texture);

    if (jsonObj.MinFilter !== undefined) {
        texture.setMinFilter(jsonObj.MinFilter);
    }
    if (jsonObj.MagFilter !== undefined) {
        texture.setMagFilter(jsonObj.MagFilter);
    }

    if (jsonObj.WrapT !== undefined) {
        texture.setWrapT(jsonObj.WrapT);
    }
    if (jsonObj.WrapS !== undefined) {
        texture.setWrapS(jsonObj.WrapS);
    }

    // no file return dummy texture
    var file = jsonObj.File;
    if (file === undefined) {
        file = "no-image-provided";
    }

    var defer = osgDB.Promise.defer();
    osgDB.Promise.when(output.readImageURL(file)).then(
        function(img) {
            texture.setImage(img);
            defer.resolve(texture);
        });
    return defer.promise;
};


osgDB.ObjectWrapper.deserializers.osg.Projection = function(output, node) {
    var jsonObj = output.getJSON();
    var check = function(o) {
        if (o.Matrix !== undefined) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    var promise = osgDB.ObjectWrapper.deserializers.osg.Node(output, node);

    if (jsonObj.Matrix !== undefined) {
        node.setMatrix(jsonObj.Matrix);
    }
    return promise;
};


osgDB.ObjectWrapper.deserializers.osg.MatrixTransform = function(output, node) {
    var jsonObj = output.getJSON();
    var check = function(o) {
        if (o.Matrix) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    var promise = osgDB.ObjectWrapper.deserializers.osg.Node(output, node);

    if (jsonObj.Matrix !== undefined) {
        node.setMatrix(jsonObj.Matrix);
    }
    return promise;
};


osgDB.ObjectWrapper.deserializers.osg.LightSource = function(output, node) {
    var jsonObj = output.getJSON();
    var check = function(o) {
        if (o.Light !== undefined) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    var defer = osgDB.Promise.defer();
    var promise = osgDB.ObjectWrapper.deserializers.osg.Node(output, node);
    osgDB.Promise.all([output.setJSON(jsonObj.Light).readObject(), promise]).then( function (args) {
        var light = args[0];
        var lightsource = args[1];
        node.setLight(light);
        defer.resolve(node);
    });
    return defer.promise;
};


osgDB.ObjectWrapper.deserializers.osg.Geometry = function(output, node) {
    var jsonObj = output.getJSON();
    var check = function(o) {
        if (o.PrimitiveSetList !== undefined && o.VertexAttributeList !== undefined) {
            return true;
        }
        return false;
    };
    if (!check(jsonObj)) {
        return;
    }

    var arraysPromise = [];
    arraysPromise.push(osgDB.ObjectWrapper.deserializers.osg.Node(output, node));

    var createPrimitive = function(jsonPrimitive) {
        var defer = osgDB.Promise.defer();
        arraysPromise.push(defer.promise);
        var promise = output.setJSON(jsonPrimitive).readPrimitiveSet();
        osgDB.Promise.when(promise).then(function(primitiveSet) {
            if (primitiveSet !== undefined) {
                node.getPrimitives().push(primitiveSet);
            }
            defer.resolve(primitiveSet);
        });
    };

    for (var i = 0, l = jsonObj.PrimitiveSetList.length; i < l; i++) {
        var entry = jsonObj.PrimitiveSetList[i];
        createPrimitive(entry);
    }

    var createVertexAttribute = function(name, jsonAttribute) {
        var defer = osgDB.Promise.defer();
        arraysPromise.push(defer.promise);
        var promise = output.setJSON(jsonAttribute).readBufferArray();
        osgDB.Promise.when(promise).then(function(buffer) {
            if (buffer !== undefined) {
                node.getVertexAttributeList()[name] = buffer;
            }
            defer.resolve(buffer);
        });
    };
    for (var key in jsonObj.VertexAttributeList) {
        if (jsonObj.VertexAttributeList.hasOwnProperty(key)) {
            createVertexAttribute(key, jsonObj.VertexAttributeList[key]);
        }
    }

    var defer = osgDB.Promise.defer();
    osgDB.Promise.all(arraysPromise).then(function() { defer.resolve(node);});
    return defer.promise;
};

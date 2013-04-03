/**
 * Program encapsulate an vertex and fragment shader
 * @class Program
 */
osg.Program = function(vShader, fShader) {
    osg.StateAttribute.call(this);

    if(osg.Program.instanceID === undefined) {
        osg.Program.instanceID = 0;
    }
    this.instanceID = osg.Program.instanceID;

    osg.Program.instanceID += 1;

    this.program = null;
    this.setVertexShader(vShader);
    this.setFragmentShader(fShader);
    this.dirty = true;
};

/** @lends osg.Program.prototype */
osg.Program.prototype = osg.objectLibraryClass(osg.objectInehrit(osg.StateAttribute.prototype, {

    attributeType: "Program",
    cloneType: function() {
        var p = new osg.Program();
        p.default_program = true;
        return p;
    },
    getType: function() {
        return this.attributeType;
    },
    getTypeMember: function() {
        return this.attributeType;
    },
    setVertexShader: function(vs) {
        this.vertex = vs;
    },
    setFragmentShader: function(fs) {
        this.fragment = fs;
    },
    getVertexShader: function() {
        return this.vertex;
    },
    getFragmentShader: function() {
        return this.fragment;
    },
    apply: function(state) {
        if(!this.program || this.isDirty()) {

            if(this.default_program === true) {
                return;
            }

            if(!this.vertex.shader) {
                this.vertex.compile();
            }
            if(!this.fragment.shader) {
                this.fragment.compile();
            }
            this.program = gl.createProgram();
            gl.attachShader(this.program, this.vertex.shader);
            gl.attachShader(this.program, this.fragment.shader);
            gl.linkProgram(this.program);
            gl.validateProgram(this.program);

            // failsafe if shader doesn't compile ?
            this.uniformsCache = {};
            this.uniformsCache.uniformKeys = [];
            this.attributesCache = {};
            this.attributesCache.attributeKeys = [];

            if(!gl.getProgramParameter(this.program, gl.LINK_STATUS) && !gl.isContextLost()) {
                osg.error("can't link program\n" + "vertex shader:\n" + this.vertex.text + "\n fragment shader:\n" + this.fragment.text);
                osg.error(gl.getProgramInfoLog(this.program));
                this.setClean();
                //debugger;
                return null;
            }

            this.cacheUniformAndAttributeList();

            //this.cacheUniformList(this.vertex.text);
            //this.cacheUniformList(this.fragment.text);
            //osg.log(this.uniformsCache);
            //this.cacheAttributeList(this.vertex.text);

            this.setClean();
        }

        gl.useProgram(this.program);
    },

    cacheUniformAndAttributeList: function() {
        var i, uniform, attr, location;
        i = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        while(i--) {
            uniform = gl.getActiveUniform(this.program, i).name;
            location = gl.getUniformLocation(this.program, uniform);
            if(uniform !== undefined && location !== null) {
                if(this.uniformsCache[uniform] === undefined) {
                    this.uniformsCache[uniform] = location;
                    this.uniformsCache.uniformKeys.push(uniform);
                }
            }
        }

        i = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
        while(i--) {
            attr = gl.getActiveAttrib(this.program, i).name;
            location = gl.getAttribLocation(this.program, attr);

            if(uniform !== undefined && location !== null) {
                if(this.attributesCache[attr] === undefined) {
                    this.attributesCache[attr] = location;
                    this.attributesCache.attributeKeys.push(attr);
                }
            }
        }
    }/*,
 Useful for non used parameters ?
    cacheUniformList: function(str) {
        var r = str.match(/uniform\s+\w+\s+\w+/g);
        if(r !== null) {
            for(var i = 0, l = r.length; i < l; i++) {
                var uniform = r[i].match(/uniform\s+\w+\s+(\w+)/)[1];
                var location = gl.getUniformLocation(this.program, uniform);
                if(location !== undefined && location !== null) {
                    if(this.uniformsCache[uniform] === undefined) {
                        this.uniformsCache[uniform] = location;
                        this.uniformsCache.uniformKeys.push(uniform);
                    }
                }
            }
        }
    },

    cacheAttributeList: function(str) {
        var r = str.match(/attribute\s+\w+\s+\w+/g);
        if(r !== null) {
            for(var i = 0, l = r.length; i < l; i++) {
                var attr = r[i].match(/attribute\s+\w+\s+(\w+)/)[1];
                var location = gl.getAttribLocation(this.program, attr);
                if(location !== -1 && location !== undefined) {
                    if(this.attributesCache[attr] === undefined) {
                        this.attributesCache[attr] = location;
                        this.attributesCache.attributeKeys.push(attr);
                    }
                }
            }
        }
    }
    */
}), "osg", "Program");

osg.Program.create = function(vShader, fShader) {
    console.log("osg.Program.create is deprecated use new osg.Program(vertex, fragment) instead");
    var program = new osg.Program(vShader, fShader);
    return program;
};
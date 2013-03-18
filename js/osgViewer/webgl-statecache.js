/*jshint sub:true*/

WebGL_StateCache = function(gl) {


    this.gl = gl;

    function initializeStateCache(gl) {

        var n;
        var stateCache = {};
        var stateParameters = ["ACTIVE_TEXTURE", "ARRAY_BUFFER_BINDING", "BLEND", "BLEND_COLOR", "BLEND_DST_ALPHA", "BLEND_DST_RGB", "BLEND_EQUATION_ALPHA", "BLEND_EQUATION_RGB", "BLEND_SRC_ALPHA", "BLEND_SRC_RGB", "COLOR_CLEAR_VALUE", "COLOR_WRITEMASK", "CULL_FACE", "CULL_FACE_MODE", "CURRENT_PROGRAM", "DEPTH_FUNC", "DEPTH_RANGE", "DEPTH_WRITEMASK", "ELEMENT_ARRAY_BUFFER_BINDING", "FRAMEBUFFER_BINDING", "FRONT_FACE", "GENERATE_MIPMAP_HINT", "LINE_WIDTH", "PACK_ALIGNMENT", "POLYGON_OFFSET_FACTOR", "POLYGON_OFFSET_FILL", "POLYGON_OFFSET_UNITS", "RENDERBUFFER_BINDING", "POLYGON_OFFSET_FACTOR", "POLYGON_OFFSET_FILL", "POLYGON_OFFSET_UNITS", "SAMPLE_COVERAGE_INVERT", "SAMPLE_COVERAGE_VALUE", "SCISSOR_BOX", "SCISSOR_TEST", "STENCIL_BACK_FAIL", "STENCIL_BACK_FUNC", "STENCIL_BACK_PASS_DEPTH_FAIL", "STENCIL_BACK_PASS_DEPTH_PASS", "STENCIL_BACK_REF", "STENCIL_BACK_VALUE_MASK", "STENCIL_BACK_WRITEMASK", "STENCIL_CLEAR_VALUE", "STENCIL_FAIL", "STENCIL_FUNC", "STENCIL_PASS_DEPTH_FAIL", "STENCIL_PASS_DEPTH_PASS", "STENCIL_REF", "STENCIL_TEST", "STENCIL_VALUE_MASK", "STENCIL_WRITEMASK", "UNPACK_ALIGNMENT", "UNPACK_COLORSPACE_CONVERSION_WEBGL", "UNPACK_FLIP_Y_WEBGL", "UNPACK_PREMULTIPLY_ALPHA_WEBGL", "VIEWPORT"];
        var param, glparam, glparamname;
        for(n = 0; n < stateParameters.length; n++) {
            try {
                 param = stateParameters[n];
                 glparamname = gl[param]; 
                 glparam = gl.getParameter(glparamname);
                stateCache[glparamname] = param;
                //stateCache[glparam] = param;
                stateCache[param] = glparam;
            } catch(e) {
                // Ignored
            }
        }
        var maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
        var originalActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        for(n = 0; n < maxTextureUnits; n++) {
            gl.activeTexture(gl.TEXTURE0 + n);
            stateCache["TEXTURE_BINDING_2D_" + n] = gl.getParameter(gl.TEXTURE_BINDING_2D);
            stateCache["TEXTURE_BINDING_CUBE_MAP_" + n] = gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP);
        }
        gl.activeTexture(originalActiveTexture);
        var maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        for(n = 0; n < maxVertexAttribs; n++) {
            stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_ENABLED);
            stateCache["VERTEX_ATTRIB_ARRAY_BUFFER_BINDING_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
            stateCache["VERTEX_ATTRIB_ARRAY_SIZE_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_SIZE);
            stateCache["VERTEX_ATTRIB_ARRAY_STRIDE_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_STRIDE);
            stateCache["VERTEX_ATTRIB_ARRAY_TYPE_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_TYPE);
            stateCache["VERTEX_ATTRIB_ARRAY_NORMALIZED_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED);
            stateCache["VERTEX_ATTRIB_ARRAY_POINTER_" + n] = gl.getVertexAttribOffset(n, gl.VERTEX_ATTRIB_ARRAY_POINTER);
            stateCache["CURRENT_VERTEX_ATTRIB_" + n] = gl.getVertexAttrib(n, gl.CURRENT_VERTEX_ATTRIB);
        }
        return stateCache;
    }

    var stateCache = initializeStateCache(gl);
    this.stateCache = stateCache;

    this.wrapper = {
        gl: gl,
        stateCache: stateCache,
        activeTexture: function(texture) {
            if(this.stateCache["ACTIVE_TEXTURE"] == texture) return;
            this.gl.activeTexture(texture);
            this.stateCache["ACTIVE_TEXTURE"] = texture;
        },
        bindBuffer: function(target, buffer) {
            var idx = target;
            
            //switch(target) {
            //case this.ARRAY_BUFFER_BINDING:
            //    idx = "ARRAY_BUFFER_BINDING";
            //    break;
            //case this.ELEMENT_ARRAY_BUFFER:
            //    idx = "ELEMENT_ARRAY_BUFFER";
            //    break;
            //}
            
            if(this.stateCache[target] == buffer) return;
            this.gl.bindBuffer(target, buffer);
            this.stateCache[target] = buffer;
        },
        bindFramebuffer: function(target, framebuffer) {
            if(this.stateCache["FRAMEBUFFER_BINDING"] == framebuffer) return;
            this.gl.bindFramebuffer(target, framebuffer);
            this.stateCache["FRAMEBUFFER_BINDING"] = framebuffer;
        },
        bindRenderbuffer: function(target, renderbuffer) {
            if(this.stateCache["RENDERBUFFER_BINDING"] == renderbuffer) return;
            this.gl.bindRenderbuffer(target, renderbuffer);
            this.stateCache["RENDERBUFFER_BINDING"] = renderbuffer;
        },
        bindTexture: function(target, texture) {
            if (!texture)
                return;
            var activeTexture = (this.stateCache["ACTIVE_TEXTURE"] - this.TEXTURE0);
            var idx;
            switch(target) {
            case this.TEXTURE_2D:
                idx = "TEXTURE_BINDING_2D_" + activeTexture;
                break;
            case this.TEXTURE_CUBE_MAP:
                idx = "TEXTURE_BINDING_CUBE_MAP_" + activeTexture;
                break;
            }
            if(this.stateCache[idx] == texture) return;
            this.stateCache[idx] = texture;
            this.gl.bindTexture(target, texture);
        },
        blendEquation: function(mode) {
            if(this.stateCache["BLEND_EQUATION_RGB"] == mode && this.stateCache["BLEND_EQUATION_ALPHA"] == mode) return;

            this.stateCache["BLEND_EQUATION_RGB"] = mode;
            this.stateCache["BLEND_EQUATION_ALPHA"] = mode;

            this.gl.blendEquation(mode);
        },
        blendEquationSeparate: function(modeRGB, modeAlpha) {
            if((this.stateCache["BLEND_EQUATION_RGB"] == modeRGB) && (this.stateCache["BLEND_EQUATION_ALPHA"] == modeAlpha)) return;

            this.gl.blendEquation(modeRGB, modeAlpha);
            this.stateCache["BLEND_EQUATION_RGB"] = modeRGB;
            this.stateCache["BLEND_EQUATION_ALPHA"] = modeAlpha;
        },
        blendFunc: function(sfactor, dfactor) {
            if(this.stateCache["BLEND_SRC_RGB"] == sfactor && this.stateCache["BLEND_SRC_ALPHA"] == sfactor && this.stateCache["BLEND_DST_RGB"] == dfactor && this.stateCache["BLEND_DST_ALPHA"] == dfactor) return;

            this.gl.blendFunc(sfactor, dfactor);
            this.stateCache["BLEND_SRC_RGB"] = sfactor;
            this.stateCache["BLEND_SRC_ALPHA"] = sfactor;
            this.stateCache["BLEND_DST_RGB"] = dfactor;
            this.stateCache["BLEND_DST_ALPHA"] = dfactor;
        },
        blendFuncSeparate: function(srcRGB, dstRGB, srcAlpha, dstAlpha) {
            if((this.stateCache["BLEND_SRC_RGB"] == sfactor) && (this.stateCache["BLEND_SRC_ALPHA"] == sfactor) && (this.stateCache["BLEND_DST_RGB"] == dfactor) && (this.stateCache["BLEND_DST_ALPHA"] == dfactor)) return;

            this.gl.blendFuncSeparate(srcRGB, dstRGB, srcAlpha, dstAlpha);
            this.stateCache["BLEND_SRC_RGB"] = srcRGB;
            this.stateCache["BLEND_SRC_ALPHA"] = srcAlpha;
            this.stateCache["BLEND_DST_RGB"] = dstRGB;
            this.stateCache["BLEND_DST_ALPHA"] = dstAlpha;
        },
        clearColor: function(red, green, blue, alpha) {
            var clearVal = this.stateCache["COLOR_CLEAR_VALUE"];
            if(clearVal[0] == red && clearVal[1] == green && clearVal[2] == blue && clearVal[3] == alpha) return;

            this.gl.clearColor(red, green, blue, alpha);
            this.stateCache["COLOR_CLEAR_VALUE"] = [red, green, blue, alpha];
        },
        clearDepth: function(depth) {
            if(this.stateCache["DEPTH_CLEAR_VALUE"] == depth) return;

            this.gl.clearDepth(depth);
            this.stateCache["DEPTH_CLEAR_VALUE"] = depth;
        },
        clearStencil: function(s) {
            if(this.stateCache["STENCIL_CLEAR_VALUE"] == s) return;

            this.gl.clearStencil(s);
            this.stateCache["STENCIL_CLEAR_VALUE"] = s;
        },
        colorMask: function(red, green, blue, alpha) {
            var clearVal = this.stateCache["COLOR_WRITEMASK"];
            if(clearVal[0] == red && clearVal[1] == green && clearVal[2] == blue && clearVal[3] == alpha) return;

            this.gl.colorMask(red, green, blue, alpha);
            this.stateCache["COLOR_WRITEMASK"] = [red, green, blue, alpha];
        },
        cullFace: function(mode) {
            if(this.stateCache["CULL_FACE_MODE"] == mode) return;

            this.gl.cullFace(mode);
            this.stateCache["CULL_FACE_MODE"] = mode;
        },
        depthFunc: function(func) {
            if(this.stateCache["DEPTH_FUNC"] == func) return;

            this.gl.depthFunc(func);
            this.stateCache["DEPTH_FUNC"] = func;
        },
        depthMask: function(flag) {
            if(this.stateCache["DEPTH_WRITEMASK"] == flag) return;

            this.gl.depthMask(flag);
            this.stateCache["DEPTH_WRITEMASK"] = flag;
        },
        depthRange: function(zNear, zFar) {
            var dRange = this.stateCache["DEPTH_RANGE"];
            if(dRange[0] == zNear && dRange[1] == zFar) return;

            this.gl.depthRange(zNear, zFar);
            this.stateCache["DEPTH_RANGE"] = [zNear, zFar];
        },
        toggleIdx: function(cap) {
            return this.stateCache[cap];
           /* switch(cap) {
            case this.BLEND:
               return  "BLEND";
            case this.CULL_FACE:
               return "CULL_FACE";
            case this.DEPTH_TEST:
                return "DEPTH_TEST";
            case this.POLYGON_OFFSET_FILL:
                return "POLYGON_OFFSET_FILL";
            case this.SAMPLE_ALPHA_TO_COVERAGE:
               return "SAMPLE_ALPHA_TO_COVERAGE";
            case this.SAMPLE_COVERAGE:
                return "SAMPLE_COVERAGE";
            case this.SCISSOR_TEST:
                return "SCISSOR_TEST";
            case this.STENCIL_TEST:
                return "STENCIL_TEST";
            }*/
        },
        toggleNeeded: function(idx, value) {
            if(this.stateCache[idx] !== value) return true;
            return false;
        },
        disable: function(cap) {
            var idx = this.toggleIdx(cap);
            if(this.toggleNeeded(idx, false)) {
                this.stateCache[idx] = false;
                this.gl.disable(cap);
            }
        },
        enable: function(cap) {
            var idx = this.toggleIdx(cap);
            if(this.toggleNeeded(idx, true)) {
                this.stateCache[idx] = true;
                this.gl.enable(cap);
            }
        },
        disableVertexAttribArray: function(index) {
            if(this.stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + index] === false) return;
            this.gl.disableVertexAttribArray(index);
            this.stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + index] = false;
        },
        enableVertexAttribArray: function(index) {
            if(this.stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + index] === true) return;
            this.gl.enableVertexAttribArray(index);
            this.stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + index] = true;
        },
        frontFace: function(mode) {
            if(this.stateCache["FRONT_FACE"] == mode) return;
            this.gl.frontFace(mode);
            this.stateCache["FRONT_FACE"] = mode;
        },
        hint: function(target, mode) {
            if(target == this.GENERATE_MIPMAP_HINT) {
                if(this.stateCache["GENERATE_MIPMAP_HINT"] == mode) return;
                this.stateCache["GENERATE_MIPMAP_HINT"] = mode;
            }
            gl.hint(target, mode);
        },
        lineWidth: function(width) {
            if(this.stateCache["LINE_WIDTH"] == width) return;
            this.gl.lineWidth(width);
            this.stateCache["LINE_WIDTH"] = width;
        },
        pixelStorei: function(pname, param) {
            var idx = this.stateCache[pname];
           /* switch(pname) {
            case this.PACK_ALIGNMENT:
                idx = "PACK_ALIGNMENT";
                break;
            case this.UNPACK_ALIGNMENT:
                idx = "UNPACK_ALIGNMENT";
                break;
            case this.UNPACK_COLORSPACE_CONVERSION_WEBGL:
                idx = "UNPACK_COLORSPACE_CONVERSION_WEBGL";
                break;
            case this.UNPACK_FLIP_Y_WEBGL:
                idx = "UNPACK_FLIP_Y_WEBGL";
                break;
            case this.UNPACK_PREMULTIPLY_ALPHA_WEBGL:
                idx = "UNPACK_PREMULTIPLY_ALPHA_WEBGL";
                break;
            }*/
            if(this.stateCache[idx] == param) return;
            this.gl.pixelStorei(pname, param);
            this.stateCache[idx] = param;
        },
        polygonOffset: function(factor, units) {
            if(this.stateCache["POLYGON_OFFSET_FACTOR"] == factor && this.stateCache["POLYGON_OFFSET_UNITS"] == units) return;
            this.gl.polygonOffset(factor, units);
            this.stateCache["POLYGON_OFFSET_FACTOR"] = factor;
            this.stateCache["POLYGON_OFFSET_UNITS"] = units;
        },
        sampleCoverage: function(value, invert) {
            if(this.stateCache["SAMPLE_COVERAGE_VALUE"] == value && this.stateCache["SAMPLE_COVERAGE_INVERT"] == invert) return;
            this.gl.sampleCoverage(value, invert);
            this.stateCache["SAMPLE_COVERAGE_VALUE"] = value;
            this.stateCache["SAMPLE_COVERAGE_INVERT"] = invert;
        },
        scissor: function(x, y, width, height) {
            var clearVal = this.stateCache["SCISSOR_BOX"];
            if(clearVal[0] == x && clearVal[1] == y && clearVal[2] == width && clearVal[3] == height) return;

            this.gl.scissor(x, y, width, height);
            this.stateCache["SCISSOR_BOX"] = [x, y, width, height];
        },
        stencilFunc: function(func, ref, mask) {
            if((this.stateCache["STENCIL_FUNC"] == func) && (this.stateCache["STENCIL_REF"] == ref) && (this.stateCache["STENCIL_VALUE_MASK"] == mask) && (this.stateCache["STENCIL_BACK_FUNC"] == func) && (this.stateCache["STENCIL_BACK_REF"] == ref) && (this.stateCache["STENCIL_BACK_VALUE_MASK"] == mask)) return;

            this.gl.stencilFunc(func, ref, mask);

            this.stateCache["STENCIL_FUNC"] = func;
            this.stateCache["STENCIL_REF"] = ref;
            this.stateCache["STENCIL_VALUE_MASK"] = mask;
            this.stateCache["STENCIL_BACK_FUNC"] = func;
            this.stateCache["STENCIL_BACK_REF"] = ref;
            this.stateCache["STENCIL_BACK_VALUE_MASK"] = mask;
        },
        stencilFuncSeparate: function(face, func, ref, mask) {
            switch(face) {
            case this.FRONT:
                if((this.stateCache["STENCIL_FUNC"] == func) && (this.stateCache["STENCIL_REF"] == ref) && (this.stateCache["STENCIL_VALUE_MASK"] == mask)) return;

                this.stateCache["STENCIL_FUNC"] = func;
                this.stateCache["STENCIL_REF"] = ref;
                this.stateCache["STENCIL_VALUE_MASK"] = mask;
                break;
            case this.BACK:
                if((this.stateCache["STENCIL_BACK_FUNC"] == func) && (this.stateCache["STENCIL_BACK_REF"] == ref) && (this.stateCache["STENCIL_BACK_VALUE_MASK"] == mask)) return;
                this.stateCache["STENCIL_BACK_FUNC"] = func;
                this.stateCache["STENCIL_BACK_REF"] = ref;
                this.stateCache["STENCIL_BACK_VALUE_MASK"] = mask;
                break;
            case this.FRONT_AND_BACK:
                if((this.stateCache["STENCIL_FUNC"] == func) && (this.stateCache["STENCIL_REF"] == ref) && (this.stateCache["STENCIL_VALUE_MASK"] == mask) && (this.stateCache["STENCIL_BACK_FUNC"] == func) && (this.stateCache["STENCIL_BACK_REF"] == ref) && (this.stateCache["STENCIL_BACK_VALUE_MASK"] == mask)) return;
                this.stateCache["STENCIL_FUNC"] = func;
                this.stateCache["STENCIL_REF"] = ref;
                this.stateCache["STENCIL_VALUE_MASK"] = mask;
                this.stateCache["STENCIL_BACK_FUNC"] = func;
                this.stateCache["STENCIL_BACK_REF"] = ref;
                this.stateCache["STENCIL_BACK_VALUE_MASK"] = mask;
                break;
            }
            this.gl.stencilFuncSeparate(face, func, ref, mask);
        },
        stencilMask: function(mask) {
            if((this.stateCache["STENCIL_WRITEMASK"] == mask) && (this.stateCache["STENCIL_BACK_WRITEMASK"] == mask)) return;

            this.gl.stencilMask(mask);
            this.stateCache["STENCIL_WRITEMASK"] = mask;
            this.stateCache["STENCIL_BACK_WRITEMASK"] = mask;
        },
        stencilMaskSeparate: function(face, mask) {
            switch(face) {
            case this.FRONT:
                if(this.stateCache["STENCIL_WRITEMASK"] == mask) return;
                this.stateCache["STENCIL_WRITEMASK"] = mask;
                break;
            case this.BACK:
                if(this.stateCache["STENCIL_BACK_WRITEMASK"] == mask) return;
                this.stateCache["STENCIL_BACK_WRITEMASK"] = mask;
                break;
            case this.FRONT_AND_BACK:
                if((this.stateCache["STENCIL_WRITEMASK"] == mask) && (this.stateCache["STENCIL_BACK_WRITEMASK"] == mask)) return;
                this.stateCache["STENCIL_WRITEMASK"] = mask;
                this.stateCache["STENCIL_BACK_WRITEMASK"] = mask;
                break;
            }
            this.gl.stencilMaskSeparate(face, mask);
        },
        stencilOp: function(fail, zfail, zpass) {
            if((this.stateCache["STENCIL_FAIL"] == fail) && (this.stateCache["STENCIL_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_PASS_DEPTH_PASS"] == zpass) && (this.stateCache["STENCIL_BACK_FAIL"] == fail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] == zpass)) return;
            this.stateCache["STENCIL_FAIL"] = fail;
            this.stateCache["STENCIL_PASS_DEPTH_FAIL"] = zfail;
            this.stateCache["STENCIL_PASS_DEPTH_PASS"] = zpass;
            this.stateCache["STENCIL_BACK_FAIL"] = fail;
            this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] = zfail;
            this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] = zpass;
            this.gl.stencilOp(fail, zfail, zpass);
        },
        stencilOpSeparate: function(face, fail, zfail, zpass) {
            switch(face) {
            case this.FRONT:
                if((this.stateCache["STENCIL_FAIL"] == fail) && (this.stateCache["STENCIL_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_PASS_DEPTH_PASS"] == zpass)) return;
                this.stateCache["STENCIL_FAIL"] = fail;
                this.stateCache["STENCIL_PASS_DEPTH_FAIL"] = zfail;
                this.stateCache["STENCIL_PASS_DEPTH_PASS"] = zpass;
                break;
            case this.BACK:
                if((this.stateCache["STENCIL_BACK_FAIL"] == fail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] == zpass)) return;
                this.stateCache["STENCIL_BACK_FAIL"] = fail;
                this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] = zfail;
                this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] = zpass;
                break;
            case this.FRONT_AND_BACK:
                if((this.stateCache["STENCIL_FAIL"] == fail) && (this.stateCache["STENCIL_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_PASS_DEPTH_PASS"] == zpass) && (this.stateCache["STENCIL_BACK_FAIL"] == fail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] == zpass)) return;
                this.stateCache["STENCIL_FAIL"] = fail;
                this.stateCache["STENCIL_PASS_DEPTH_FAIL"] = zfail;
                this.stateCache["STENCIL_PASS_DEPTH_PASS"] = zpass;
                this.stateCache["STENCIL_BACK_FAIL"] = fail;
                this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] = zfail;
                this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] = zpass;
                break;
            }
            this.gl.stencilOpSeparate(face, fail, zfail, zpass);
        },
        /*
        uniformN: function(location, v) {
            if(!location) {
                return;
            }
            var program = location.sourceProgram;
            if(v.slice !== undefined) {
                v = v.slice();
            } else {
                v = new Float32Array(v);
            }
            program.uniformCache[location.sourceUniformName] = v;
        },
        uniform1f: function(location, v0) {
            stateCacheModifiers.uniformN.call(this, location, [v0]);
        },
        uniform2f: function(location, v0, v1) {
            stateCacheModifiers.uniformN.call(this, location, [v0, v1]);
        },
        uniform3f: function(location, v0, v1, v2) {
            stateCacheModifiers.uniformN.call(this, location, [v0, v1, v2]);
        },
        uniform4f: function(location, v0, v1, v2, v3) {
            stateCacheModifiers.uniformN.call(this, location, [v0, v1, v2, v3]);
        },
        uniform1i: function(location, v0) {
            stateCacheModifiers.uniformN.call(this, location, [v0]);
        },
        uniform2i: function(location, v0, v1) {
            stateCacheModifiers.uniformN.call(this, location, [v0, v1]);
        },
        uniform3i: function(location, v0, v1, v2) {
            stateCacheModifiers.uniformN.call(this, location, [v0, v1, v2]);
        },
        uniform4i: function(location, v0, v1, v2, v3) {
            stateCacheModifiers.uniformN.call(this, location, [v0, v1, v2, v3]);
        },
        uniform1fv: function(location, v) {
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        uniform2fv: function(location, v) {
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        uniform3fv: function(location, v) {
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        uniform4fv: function(location, v) {
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        uniform1iv: function(location, v) {
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        uniform2iv: function(location, v) {
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        uniform3iv: function(location, v) {
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        uniform4iv: function(location, v) {
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        uniformMatrix2fv: function(location, transpose, v) {
            // TODO: transpose
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        uniformMatrix3fv: function(location, transpose, v) {
            // TODO: transpose
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        uniformMatrix4fv: function(location, transpose, v) {
            // TODO: transpose
            stateCacheModifiers.uniformN.call(this, location, v);
        },*/
        useProgram: function(program) {
            if(this.stateCache["CURRENT_PROGRAM"] == program) return;
            this.gl.useProgram(program);
            this.stateCache["CURRENT_PROGRAM"] = program;
        },
        /*
        vertexAttrib1f: function(indx, x) {
            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [x, 0, 0, 1];
        },
        vertexAttrib2f: function(indx, x, y) {
            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [x, y, 0, 1];
        },
        vertexAttrib3f: function(indx, x, y, z) {
            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [x, y, z, 1];
        },
        vertexAttrib4f: function(indx, x, y, z, w) {
            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [x, y, z, w];
        },
        vertexAttrib1fv: function(indx, v) {
            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [v[0], 0, 0, 1];
        },
        vertexAttrib2fv: function(indx, v) {
            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [v[0], v[1], 0, 1];
        },
        vertexAttrib3fv: function(indx, v) {
            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [v[0], v[1], v[2], 1];
        },
        vertexAttrib4fv: function(indx, v) {
            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [v[0], v[1], v[2], v[3]];
        },
        vertexAttribPointer: function(indx, size, type, normalized, stride, offset) {
            this.stateCache["VERTEX_ATTRIB_ARRAY_SIZE_" + indx] = size;
            this.stateCache["VERTEX_ATTRIB_ARRAY_TYPE_" + indx] = type;
            this.stateCache["VERTEX_ATTRIB_ARRAY_NORMALIZED_" + indx] = normalized;
            this.stateCache["VERTEX_ATTRIB_ARRAY_STRIDE_" + indx] = stride;
            this.stateCache["VERTEX_ATTRIB_ARRAY_POINTER_" + indx] = offset;
            this.stateCache["VERTEX_ATTRIB_ARRAY_BUFFER_BINDING_" + indx] = this.stateCache["ARRAY_BUFFER_BINDING"];
        },*/
        viewport: function(x, y, width, height) {
            var viewportVal = this.stateCache["SCISSOR_BOX"];
            if(viewportVal[0] == x && viewportVal[1] == y && viewportVal[2] == width && viewportVal[3] == height) return;
            return;
            this.gl.viewport(x, y, width, height);
            this.stateCache["VIEWPORT"] = [x, y, width, height];
        }
    };



    /*
        uniformN: function(location, v) {
            if(!location) {
                return true;
            }
            var program = location.sourceProgram;
            if(!program.uniformCache) return false;
            return gli.util.arrayCompare(program.uniformCache[location.sourceUniformName], v);
        },
        uniform1f: function(location, v0) {
            return redundantChecks.uniformN.call(this, location, [v0]);
        },
        uniform2f: function(location, v0, v1) {
            return redundantChecks.uniformN.call(this, location, [v0, v1]);
        },
        uniform3f: function(location, v0, v1, v2) {
            return redundantChecks.uniformN.call(this, location, [v0, v1, v2]);
        },
        uniform4f: function(location, v0, v1, v2, v3) {
            return redundantChecks.uniformN.call(this, location, [v0, v1, v2, v3]);
        },
        uniform1i: function(location, v0) {
            return redundantChecks.uniformN.call(this, location, [v0]);
        },
        uniform2i: function(location, v0, v1) {
            return redundantChecks.uniformN.call(this, location, [v0, v1]);
        },
        uniform3i: function(location, v0, v1, v2) {
            return redundantChecks.uniformN.call(this, location, [v0, v1, v2]);
        },
        uniform4i: function(location, v0, v1, v2, v3) {
            return redundantChecks.uniformN.call(this, location, [v0, v1, v2, v3]);
        },
        uniform1fv: function(location, v) {
            return redundantChecks.uniformN.call(this, location, v);
        },
        uniform2fv: function(location, v) {
            return redundantChecks.uniformN.call(this, location, v);
        },
        uniform3fv: function(location, v) {
            return redundantChecks.uniformN.call(this, location, v);
        },
        uniform4fv: function(location, v) {
            return redundantChecks.uniformN.call(this, location, v);
        },
        uniform1iv: function(location, v) {
            return redundantChecks.uniformN.call(this, location, v);
        },
        uniform2iv: function(location, v) {
            return redundantChecks.uniformN.call(this, location, v);
        },
        uniform3iv: function(location, v) {
            return redundantChecks.uniformN.call(this, location, v);
        },
        uniform4iv: function(location, v) {
            return redundantChecks.uniformN.call(this, location, v);
        },
        uniformMatrix2fv: function(location, transpose, v) {
            // TODO: transpose
            return redundantChecks.uniformN.call(this, location, v);
        },
        uniformMatrix3fv: function(location, transpose, v) {
            // TODO: transpose
            return redundantChecks.uniformN.call(this, location, v);
        },
        uniformMatrix4fv: function(location, transpose, v) {
            // TODO: transpose
            return redundantChecks.uniformN.call(this, location, v);
        },
        vertexAttrib1f: function(indx, x) {
            return gli.util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [x, 0, 0, 1]);
        },
        vertexAttrib2f: function(indx, x, y) {
            return gli.util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [x, y, 0, 1]);
        },
        vertexAttrib3f: function(indx, x, y, z) {
            return gli.util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [x, y, z, 1]);
        },
        vertexAttrib4f: function(indx, x, y, z, w) {
            return gli.util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [x, y, z, w]);
        },
        vertexAttrib1fv: function(indx, v) {
            return gli.util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [v[0], 0, 0, 1]);
        },
        vertexAttrib2fv: function(indx, v) {
            return gli.util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [v[0], v[1], 0, 1]);
        },
        vertexAttrib3fv: function(indx, v) {
            return gli.util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [v[0], v[1], v[2], 1]);
        },
        vertexAttrib4fv: function(indx, v) {
            return gli.util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], v);
        },
        vertexAttribPointer: function(indx, size, type, normalized, stride, offset) {
            return(this.stateCache["VERTEX_ATTRIB_ARRAY_SIZE_" + indx] == size) && (this.stateCache["VERTEX_ATTRIB_ARRAY_TYPE_" + indx] == type) && (this.stateCache["VERTEX_ATTRIB_ARRAY_NORMALIZED_" + indx] == normalized) && (this.stateCache["VERTEX_ATTRIB_ARRAY_STRIDE_" + indx] == stride) && (this.stateCache["VERTEX_ATTRIB_ARRAY_POINTER_" + indx] == offset) && (this.stateCache["VERTEX_ATTRIB_ARRAY_BUFFER_BINDING_" + indx] == this.stateCache["ARRAY_BUFFER_BINDING"]);
        }
    };
    */
    for(var propertyName in gl) {
        if (this.wrapper[propertyName] === undefined) {
            if(typeof gl[propertyName] == 'function') {
                this.wrapper[propertyName] = gl[propertyName].bind(gl);
            } else {
                 this.wrapper[propertyName] = gl[propertyName];
            }
        }
    }

    return this.wrapper;
};
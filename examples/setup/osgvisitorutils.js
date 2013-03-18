/** -*- compile-command: "jslint-cli listVisitor.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */

(function() {


    osgUtil.flatListVisitor = function() {
        osg.NodeVisitor.call(this);
    };


    osgUtil.flatListVisitor.prototype = osg.objectInehrit(osg.NodeVisitor.prototype, {
            resetLists : function() {

                        this.nodeList = [];
                        this.vertexShaderList = [];
                        this.pixelShaderList = [];
                        this.shaderParameterList = [];
                        this.geometryList = [];
                        this.compositorList = [];
                        this.lightList = [];
                        this.cameraList  = [];

                        this.nodeListObject = [];
                        this.vertexShaderListObject = [];
                        this.pixelShaderListObject = [];
                        this.shaderParameterListObject = [];
                        this.geometryListObject = [];
                        this.compositorListObject = [];
                        this.lightListObject = [];
                        this.cameraListObject  = [];

                        this.nodeCount = 0;
                        this.vsCount = 0;
                        this.psCount = 0;
                        this.shaderParameterCount = 0;
                        this.geometryCount = 0;
                        this.compositorCount = 0;
                        this.lightCount = 0;
                        this.cameraCount = 0;
        },
        apply: function(node) {

            //console.log(osg.objectType[node.objectType]);
            var idx = node.getName();
            if (idx)
                console.log(idx + ": " + osg.objectType[node.objectType]);
            else
                console.log(osg.objectType[node.objectType]);

            switch(node.objectType){
                case osg.Node.prototype.objectType:
                this.nodeList.push(idx ? idx :  this.nodeCount++);
                this.nodeListObject.push(node);
                break;
                case osg.MatrixTransform.prototype.objectType:
                this.nodeList.push(idx ? idx : this.nodeCount++);
                this.nodeListObject.push(node);
                break;
                case osg.Light.prototype.objectType:
                this.lightList.push(idx ? idx : this.lightCount++);
                this.lightListObject.push(node);
                break;
                case osg.LightSource.prototype.objectType:
                this.lightList.push(idx ? idx : this.lightCount++);
                this.lightListObject.push(node);
                break;
                case osg.Camera.prototype.objectType:
                this.cameraList.push(idx ? idx : this.cameraCount++);
                this.cameraListObjecObject.push(node);
                break;
                case osg.Geometry.prototype.objectType:
                this.geometryList.push(idx ? idx : this.geometryCount++);
                this.geometryListObject.push(node);
                break;
                default:
                console.log(osg.objectType[node.objectType]);
                break;
            }

            if (node.getStateSet){
                var st = node.getStateSet();
                if(st !== undefined) {
                    var program = st.getAttribute('Program');
                    if (program !== undefined) {
                        var vs = program.getVertexShader();
                        var ps = program.getpixelShader();
                        this.vertexShaderList[this.vsCount++] = vs;
                        this.pixelShaderList[this.psCount++] = ps;
                    }
                }
            }

            this.traverse(node);
        }
    });


})();
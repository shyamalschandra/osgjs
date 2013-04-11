//load scripts from project.json, for now synchronously
// TODO: allow for async script loading
// TODO:means solving dependencies (osg.exten, osg.inherits, etc.)
// TODO:handle cache
// TODO:handle reloading
var loadedJSONP = {};
//
var loadJSONP = function(script, callback, reload) {
    if (!reload && loadedJSONP[script]) callback(loadedJSONP[script]);
    var s = document.createElement("script");
    s.onload = function(data) {
        loadedJSONP[script] = data;
        if (callback) callback(data);
        //document.body.headremoveChild(s);
    };
    s.type = "text/javascript";
    s.src = script.replace(/\\\\|\\|\/\//g, "/");
    if (reload && window.location.href.indexOf('http') !== -1)
        s.src += '?rand=' + Math.round(Math.random() * 999999999);
    document.head.appendChild(s);
};

var loadedJSON = {};
var loadJSON = function(script, callback, reload) {
    if (!reload && loadedJSON[script]) callback();
    req = new XMLHttpRequest();
    var src = script;
    if (reload && window.location.href.indexOf('http') !== -1)
        src += '?rand=' + Math.round(Math.random() * 999999999);
    req.open("GET", src, true);
    var loadCallBack = function(e) {
        if (e.target.status === 200) {
            var data = JSON.parse(e.target.responseText);
            loadedJSON[script] = data;
            if (callback) callback(data);
        }
    };
    req.addEventListener("load", loadCallBack, false);
    //req.addEventListener("progress", updateProgress, false);
    req.addEventListener("error", function() {
        console.error("Cannot Load");
    }, false);
    req.addEventListener("abort", function() {
        console.error("Cannot Load");
    }, false);
    req.send(null);
};

var osg = osg || {};

// either all js file are loaded before DOMcontentloaded 
// and then we must wait
// or it's not loaded and loadcallback will be called by 
// doActload
var loadComplete = function(){
    if (osg.jsLoaded)
        this.loadCallBack();
};

var loadOSGJSON = function(prefix, jsonlib, loadCallBack, extensions) {
    this.loadCallBack = loadCallBack;
    var doActload = function() {
        var loader = loadJSON;
        if (window.location.href.indexOf('file://') != -1) {
            loader = loadJSONP;
            jsonlib += 'p';
        }

        loader(prefix + jsonlib, function(data) {
            if (!data.scripts) {
                data.scripts = dataScripts.scripts;
            }
            var loadList = extensions ? data.scripts.concat(extensions) : data.scripts;
            var num = 0,
                numTotal = loadList.length;
            var loadCountAndLog = function(src) {
                num++;

                //console.log("loaded " + src);
                if (num >= numTotal && document.readyState === "complete") {
                    console.log("Osg loaded");
                    osg.jsLoaded = true;
                    if (loadCallBack) loadCallBack();
                } else {
                    loadJSONP(prefix + loadList[num], loadCountAndLog);
                }
            };
            loadJSONP(prefix + loadList[num], loadCountAndLog);
        });
    };
    doActload();
    window.addEventListener("load", loadComplete.bind(this), false);
};

var loadOSGJS = function(prefix, libjs, loadCallBack, extensions) {
    this.loadCallBack = loadCallBack;
    var doActload = function() {
        var loadList = [libjs];
        loadList = extensions ? loadList.concat(extensions) : loadList;
        var num = 0,
            numTotal = loadList.length;
        var loadCountAndLog = function(src) {
            num++;

            //console.log("loaded " + src);
            if (num >= numTotal && document.readyState === "complete") {
                console.log("Osg loaded");
                osg.jsLoaded = true;
                if (loadCallBack) loadCallBack();
            } else {
                loadJSONP(prefix + loadList[num], loadCountAndLog);
            }
        };
        loadJSONP(prefix + loadList[num], loadCountAndLog);
    };
    doActload();
    window.addEventListener("load", loadComplete.bind(this), false);
};

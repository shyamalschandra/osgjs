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
        //document.body.removeChild(s);
    };
    s.type = "text/javascript";
    s.src = script.replace(/\\\\|\\|\/\//g, "/");
    s.src += '?rand=' + Math.round(Math.random() * 999999999);
    document.body.appendChild(s);
};

var loadedJSON = {};
var loadJSON = function(script, callback, reload) {
    if (!reload && loadedJSON[script]) callback();
    req = new XMLHttpRequest();
    var src = script;
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

var convertObjToArray = function(obj) {
    var arr = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            arr.push(obj[key]);
        }
    }
    return arr;
};

var loadOSGJSON = function(prefix, jsonlib, loadCallBack, extensions) {
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
                if (num >= numTotal) {
                    console.log("Osg loaded");
                    if (loadCallBack) loadCallBack();
                } else {
                    loadJSONP(prefix + loadList[num], loadCountAndLog);
                }
            };
            loadJSONP(prefix + loadList[num], loadCountAndLog);
        });
    };
    if (document.readyState === "complete") {
        doActload();
    } else {
        window.addEventListener("load", doActload.bind(this), false);
    }
};

var loadOSGJS = function(prefix, libjs, loadCallBack, extensions) {
    var doActload = function() {
        var loadList = [libjs];
        loadList = extensions ? loadList.concat(extensions) : loadList;
        var num = 0,
            numTotal = loadList.length;
        var loadCountAndLog = function(src) {
            num++;

            //console.log("loaded " + src);
            if (num >= numTotal) {
                console.log("Osg loaded");
                if (loadCallBack) loadCallBack();
            } else {
                loadJSONP(prefix + loadList[num], loadCountAndLog);
            }
        };
        loadJSONP(prefix + loadList[num], loadCountAndLog);
    };
    if (document.readyState === "complete") {
        doActload();
    } else {
        window.addEventListener("load", doActload.bind(this), false);
    }
};
/** -*- compile-command: "jslint-cli main.js" -*-
 *
 *  Copyright (C) 2010-2013 Cedric Pinson
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
 *  Cedric Pinson <cedric@plopbyte.com>
 *
 */

var start = function() {

    var canvas = document.getElementById("3DView");
    var w = window.innerWidth;
    var h = window.innerHeight;
    osg.log("size " + w + " x " + h );
    canvas.style.width = w;
    canvas.style.height = h;
    canvas.width = w;
    canvas.height = h;

    var viewer;
    viewer = new osgViewer.Viewer(canvas, {antialias : true });
    Viewer = viewer;
    viewer.init();

    viewer.getCamera().setClearColor([0.0, 0.0, 0.0, 0.0]);
    viewer.setSceneData(getModel());
    viewer.setupManipulator();
    viewer.getManipulator().computeHomePosition();

    viewer.run();

    var mousedown = function(ev) {
        ev.stopPropagation();
    };
    document.getElementById("explanation").addEventListener("mousedown", mousedown, false);

};

var getModel = function() {
    var node = new osg.MatrixTransform();
    node.setMatrix(osg.Matrix.makeRotate(-Math.PI/2, 1,0,0, []));
    var cube = new osg.createTexturedBoxGeometry(0,0,0,
                                                 50, 50, 50 );
    node.addChild(cube);
    return node;
};

if (!window.multidemo) {
    window.addEventListener("load", function() {
        if (window.location.href.indexOf("debug") !== -1) {
            loadOSGJSON("../../", "project.json", start);
        } else if (window.location.href.indexOf("concat") !== -1) {
            loadOSGJS("../../", "build/osg.debug.js", start);
        } else {
            loadOSGJS("../../", "build/osg.min.js", start);
        }
    }, true);
}

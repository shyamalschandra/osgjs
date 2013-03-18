/** -*- compile-command: "jslint-cli stats.js" -*-
 *
 *  Copyright (C) 2010 Cedric Pinson
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
 *  Cedric Pinson <cedric.pinson@plopbyte.net>
 *
 */

var Stats = {};

Stats.Stats = function(canvas, textCanvas) {
    this.layers = [];
    this.last_update = undefined;
    this.canvas = canvas;
    this.text_canvas = textCanvas;
    this.numberUpdateGraph = 0;
    this.numberUpdateText = 0;
    this.deltaSum = 0;
    this.deltas = [];
};

Stats.Stats.prototype = {
    addLayer: function(color, maxVal, getter, texter) {
        if(color === undefined) {
            color = "rgb(255,255,255)";
        }
        this.layers.push({
            previous: 0,
            color: color,
            getValue: getter,
            getText: texter,
            average: 0,
            max: maxVal,
            data: []
        });
    },

    update: function() {

        var delta, i, k, l, layer, value, c, ctx, height, myImageData, t = performance.now();
        if(this.last_update === undefined) {
            this.last_update = t;
        }
        //i = 2.0 * 60.0 / 1000.0;
        i = 0.12; //4.0 * 60.0 / 1000.0;
        delta = (t - this.last_update) * i;
        if(delta >= 1.0) {

            this.numberUpdateGraph++;
            this.numberUpdateText++;

            t -= (delta - Math.floor(delta)) / i;
            delta = Math.floor(delta);

            this.deltaSum += delta;
            this.deltas.push(delta);

            for(i = 0, l = this.layers.length; i < l; i++) {
                layer = this.layers[i];
                layer.data.push(layer.getValue(t));
            }

            
            if(this.numberUpdateGraph > 0 && (this.deltaSum > this.canvas.width || this.numberUpdateGraph % 30 === 0)) {
                if(this.numberUpdateText > 0 && this.numberUpdateText % 60 === 0) {
                    c = this.text_canvas;
                    ctx = c.getContext("2d");
                    ctx.font = "14px Sans";
                    height = 17;
                    delta = height;
                    ctx.clearRect(0, 0, c.width, c.height);
                    for(i = 0, l = this.layers.length; i < l; i++) {
                        layer = this.layers[i];
                        value = layer.getText(layer.average / this.numberUpdateText);
                        layer.average = 0;
                        ctx.fillStyle = layer.color;
                        ctx.fillText(value, 0, delta);
                        delta += height;
                    }
                    this.numberUpdateText = 0;
                }
                c = this.canvas;
                ctx = c.getContext("2d");
                var xStart = c.width - this.deltaSum;
                if(xStart > 0) {
                    myImageData = ctx.getImageData(this.deltaSum, 0, xStart, c.height);
                    ctx.putImageData(myImageData, 0, 0);
                    ctx.clearRect(xStart, 0, this.deltaSum, c.height);
                } else {
                    xStart = 0;
                    ctx.clearRect(0, 0, c.width, c.height);
                }

                ctx.lineWidth = 1.0;

                for(i = 0, l = this.layers.length; i < l; i++) {
                    layer = this.layers[i];
                    layer.average = layer.data[0];
                    var xstartCurr = xStart;

                    ctx.strokeStyle = layer.color;
                    ctx.beginPath();
                    ctx.moveTo(xstartCurr, c.height - layer.previous);

                    for(k = 1; k < layer.data.length; k++) {
                        value = layer.data[k];
                        layer.average += value;

                        value *= c.height / layer.max;
                        if(value > c.height) value = c.height;

                        xstartCurr += this.deltas[k];
                        ctx.lineTo(xstartCurr, c.height - value);
                    }
                    ctx.stroke();
                    layer.previous = value;
                }

                this.deltaSum = 0;
                this.deltas = [0];

                c = this.text_canvas;
                ctx = c.getContext("2d");
                ctx.font = "14px Sans";
                height = 17;
                delta = height;
                ctx.clearRect(0, 0, c.width, c.height);
                for(i = 0, l = this.layers.length; i < l; i++) {
                    layer = this.layers[i];
                    value = layer.getText(layer.average / layer.data.length);
                    layer.average = 0;
                    ctx.fillStyle = layer.color;
                    ctx.fillText(value, 0, delta);
                    delta += height;

                    layer.data = [layer.data[layer.data.length - 1]];
                }
                this.numberUpdateGraph = 0;
            }

            this.last_update = t;
        }
    }
}
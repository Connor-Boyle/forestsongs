var canvas = document.createElement('canvas')
var Socket = require('net').Socket
var PixelGrid = require('ndpixels-opc')
var NdArray = require('ndarray')
var toCanvas = require('pixels-canvas')

var pixelsToCanvas = toCanvas(canvas)

document.body.appendChild(canvas)

// var socket = new Socket({ highWaterMark: 1 })
// socket.setNoDelay()
// socket.connect(7000)
//
// var output = PixelGrid(1)
// output.pipe(socket)

function Frame (width, height) {
  var arr = NdArray(new Uint8Array(width * height * 3), [width, height, 3])
  arr.format = 'rgb'
  return arr
}

function set (target, x, y, rgb) {
  target.set(x, y, 0, rgb[0])
  target.set(x, y, 1, rgb[1])
  target.set(x, y, 2, rgb[2])
}

var pitchLoop = require('./analyse_pitch')

pitchLoop(renderFrame)

var pitches = []

function renderFrame (pitch){
  pitches.push(pitch)
  if (pitch > 0){
    if (pitches.length >5) {
      pitches.shift()
    }
    var averagePitch = pitches.reduce(function (sum, value){
      return sum + value
    }) / pitches.length
    var frame = Frame(8,8)
    var note = noteFromPitch(averagePitch)
    var hue = (note % 12) / 12
    console.log(averagePitch, pitch)
    set(frame, 0, 0, hslToRgb(hue, 1, 0.5))
    // set(frame, 2, 2, [255,0,0])
    // set(frame, 4, 4, [255,0,0])
    // set(frame, 1, 1, [255,0,0])
    // output.write(frame)
    pixelsToCanvas(frame)
  }
  else{
    pitches.length = 0
  }
}

function noteFromPitch( frequency ) {
	var noteNum = 12 * (Math.log( frequency / 440 )/Math.log(2) );
	return Math.round( noteNum ) + 69;
}

function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hue2rgb(p, q, t){
    if(t < 0) t += 1;
    if(t > 1) t -= 1;
    if(t < 1/6) return p + (q - p) * 6 * t;
    if(t < 1/2) return q;
    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
}

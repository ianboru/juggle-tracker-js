import cv from 'opencv.js';

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

function RGBtoHSV(r, g, b) {
    if (arguments.length === 1) {
        g = r.g, b = r.b, r = r.r;
    }
    var max = Math.max(r, g, b), min = Math.min(r, g, b),
        d = max - min,
        h,
        s = (max === 0 ? 0 : d / max),
        v = max / 255;

    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }

    return [h,s,v];
}
function calculateCurrentColor(ballColorRange,opacity){ 
    const r = this.mean(ballColorRange['lr'],ballColorRange['hr'])
    const g = this.mean(ballColorRange['lg'],ballColorRange['hg'])
    const b = this.mean(ballColorRange['lb'],ballColorRange['hb'])
    return "rgb(" + r + "," + g + "," + b + ","+opacity+")"
}
function sortContours(contours){
    let contourAreas = []
    for (let i = 0; i < contours.size(); ++i) {
      contourAreas.push(cv.contourArea(contours.get(i), false))
    }
    const len = contourAreas.length
    var indices = new Array(len);
    for (let i = 0; i < len; ++i) indices[i] = i;
    indices.sort(function (a, b) { return contourAreas[a] > contourAreas[b] ? -1 : contourAreas[a] > contourAreas[b] ? 1 : 0; });
    return indices
}
function mean(x,y){
    return (x + y)/2
}
const red = {
    'lr' : 40,
    'lg' : 0,
    'lb' : 0,
    'hr' : 255,
    'hg' : 30,
    'hb' : 60,
  }
const green = {
    'lr' : 0,
    'lg' : 80,
    'lb' : 0,
    'hr' : 50,
    'hg' : 255,
    'hb' : 80,
  }
const blue = {
    'lr' : 0,
    'lg' : 0,
    'lb' : 60,
    'hr' : 50,
    'hg' : 100,
    'hb' : 255,
  }
const white = {
    'lr' : 220,
    'lg' : 225,
    'lb' : 230,
    'hr' : 255,
    'hg' : 255,
    'hb' : 255,
  }
export default { 
    calculateCurrentColor,
    mean,
    sortContours,
    RGBtoHSV,
    HSVtoRGB,
    red,
    green,
    blue,
    white
}
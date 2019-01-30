import cv from 'opencv.js';
function colorFilter(src, colorRange){
    let dst = new cv.Mat();

    // Create a two new mat objects for the image in different color spaces
    let temp = new cv.Mat();
    let hsv = new cv.Mat();


    // Convert the RGBA source image to RGB
    cv.cvtColor(src, temp, cv.COLOR_RGBA2RGB)

    // Blur the temporary image
    let ksize = new cv.Size(11,11);
    let anchor = new cv.Point(-1, -1);
    cv.blur(temp, temp, ksize, anchor, cv.BORDER_DEFAULT);

    // Convert the RGB temporary image to HSV
    cv.cvtColor(temp, hsv, cv.COLOR_RGB2HSV)
    // Get values for the color ranges from the trackbars

    let lowerHSV = this.htmlToOpenCVHSV([colorRange.lh, colorRange.ls, colorRange.lv])
    lowerHSV.push(0)
    let higherHSV = this.htmlToOpenCVHSV([colorRange.hh, colorRange.hs, colorRange.hv])
    higherHSV.push(255)

    // Create the new mat objects that are the lower and upper ranges of the color
    let low = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), lowerHSV);
    let high = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), higherHSV);

    // Find the colors that are within (low, high)
    cv.inRange(hsv, low, high, dst);

    // Track the balls - arguments: mask image, and number of balls

    low.delete();high.delete();

    src.delete();temp.delete();hsv.delete();
    return dst
}
function findBalls(src){
    //src is a frame filtered for the current color
    const sizeThreshold = 60
    const maxNumContours = 15
    //Used to know how many contours to connect later
    let numContoursOverThreshold = 0
    //initialize contour finding data
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    //find contours
    cv.findContours(src, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_NONE);
    //sort contours by size
    const sortedContourIndices = this.sortContours(contours)

    let contourPositions = []
    //Catalogue the contour locations to draw later
    if(sortedContourIndices.length > 0){
      for(let i = 0; i < Math.min(sortedContourIndices.length, maxNumContours); ++i){
        const contour = contours.get(sortedContourIndices[i])
        const contourArea = cv.contourArea(contour)
        //Check if contour is big enough to be a real object
        if(contourArea > sizeThreshold){
          const circle = cv.minEnclosingCircle(contour)
          contourPositions.push({
            'x' : circle.center.x,
            'y' : circle.center.y,
            'r' : circle.radius,
          })
        }       
      }
    }
    // Cleanup open cv objects
    src.delete();contours.delete(); hierarchy.delete();
    return contourPositions

}
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
function calculateCurrentHSVString(ballColorRange,opacity){
    return "hsl(" + ballColorRange['hh'] + "," + ballColorRange['hs']*100 + "%," + ballColorRange['hv']*100/2 +"%)"
}
function calculateCurrentHSV(ballColorRange,opacity){ 
    return "hsl(" + ballColorRange['hh'] + "," + ballColorRange['hs']*100 + "%," + ballColorRange['hv']*100/2 +"%)"
}
function htmlToOpenCVHSV(htmlHSV){
    let openCVHSV  = htmlHSV
    openCVHSV[0] =  180*openCVHSV[0]/360
    openCVHSV[1] = openCVHSV[1] * 255
    openCVHSV[2] = openCVHSV[2] * 255
    return openCVHSV
  }
function sortContours(contours){
    let contourAreas = []
    for (let i = 0; i < contours.size(); ++i) {
      const contourArea = cv.contourArea(contours.get(i), false)
      contourAreas.push(contourArea)
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
    calculateCurrentHSV,
    calculateCurrentHSVString,
    htmlToOpenCVHSV,
    mean,
    sortContours,
    RGBtoHSV,
    HSVtoRGB,
    red,
    green,
    blue,
    white,
    colorFilter,
    findBalls
}
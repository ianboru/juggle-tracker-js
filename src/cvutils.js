import cv from 'opencv.js';
function getMatFromCanvas(context, width, height){
    // Create a new blank mat (or canvas) to draw on
    let srcMat = new cv.Mat(height, width, cv.CV_8UC4);
    // Get the image data from the source video
    let imageData = context.getImageData(0, 0, width, height);
    // Set the image onto the srcMat
    srcMat.data.set(imageData.data);
    imageData = null
    return srcMat
}
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
    low.delete();high.delete();
    temp.delete();hsv.delete();
    // Return the masked image (objects are white, background is black)
    return dst
}

function colorWhite(src, colorRange){
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    let ksize = new cv.Size(20,20);
    let anchor = new cv.Point(-1, -1);
    cv.blur(src, src, ksize, anchor, cv.BORDER_DEFAULT);
    let dst = new cv.Mat();
    // You can try more different parameters
    cv.threshold(src, dst, Math.round(360*colorRange.tv/100), 255, cv.THRESH_BINARY);
    // Return the masked image (objects are white, background is black)
    return dst
}

function findBalls(src){
    // Minimum size of a contour to interpret as an object

    const sizeThreshold = 25
    // Maximum number of contours to interpret as objects
    const maxNumContours = 12
    // Initialize contour finding data
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    // Find contours - src is a frame filtered for the current color
    cv.findContours(src, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_NONE);
    // Sort contours by size
    let sortedContourIndices = this.sortContours(contours)
    let contourPositions = []
    // Catalogue the contour locations to draw later
    if(sortedContourIndices.length > 0){
      // Iterate though the largest contours
      for(let i = 0; i < Math.min(sortedContourIndices.length, maxNumContours); ++i){
        // Find the contour area
        const contour = contours.get(sortedContourIndices[i])
        const contourArea = cv.contourArea(contour)
        //Check if contour is big enough to be a real object
        if(contourArea > sizeThreshold){
          // Use circle to get x,y coordinates and radius
          const circle = cv.minEnclosingCircle(contour)
          // Push the coordinates of the contour and the radius to the list of objects
          contourPositions.push({
            'x' : circle.center.x,
            'y' : circle.center.y,
            'r' : circle.radius,
          })
        }
        contour.delete; 
      }
    }
    // Cleanup open cv objects
    contours.delete(); hierarchy.delete();sortedContourIndices = null
    // Return list of contour positions and sizes
    return contourPositions
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

function getColorIndicesForCoord(x, y, width) {
  var red = y * (width * 4) + x * 4;
  return [red, red + 1, red + 2, red + 3];
}

function calculateRelativeCoord(e){
    //get mouse coordinates relative to parent element
    let targetX
    let targetY
    if(e.clientX){
        targetX = e.clientX; targetY = e.clientY;
    }else if(e.touches[0]){
        targetX = e.touches[0].clientX; targetY = e.touches[0].clientY;
    }else if(e.changedTouches[0]){
        targetX = e.changedTouches[0].clientX; targetY = e.changedTouches[0].clientY;
    }

    const bounds = e.target.getBoundingClientRect();
    const x = targetX - bounds.left;
    const y = targetY - bounds.top;
    return [x,y]
}

function getColorFromImage(imageData,minX,minY,maxX,maxY){
    //Round to get integer
    //Check that min and max are in right order
    //In case rectangle was made from bottom right
    const trueMinX = Math.round(Math.min(minX,maxX))
    const trueMaxX = Math.round(Math.max(minX,maxX))
    const trueMinY = Math.round(Math.min(minY,maxY))
    const trueMaxY = Math.round(Math.max(minY,maxY))

    let minR = 255;let minG = 255;let minB = 255;
    let maxR = 0;let maxG = 0;let maxB = 0;
    //Loop through pixels to get RGB vals
    for(let x = trueMinX;  x< trueMaxX; ++x){
        for(let y = trueMinY;  y< trueMaxY; ++y){
            const colorIndices = getColorIndicesForCoord(x,y,imageData.cols)
            minR = Math.min(imageData.data[colorIndices[0]], minR)
            minG = Math.min(imageData.data[colorIndices[1]], minG)
            minB = Math.min(imageData.data[colorIndices[2]], minB)
            maxR = Math.max(imageData.data[colorIndices[0]], maxR)
            maxG = Math.max(imageData.data[colorIndices[1]], maxG)
            maxB = Math.max(imageData.data[colorIndices[2]], maxB)
        }
    }
    //return object with min and max rgb
    return {
        'lr' : minR, 'lg' : minG, 'lb' : minB,
        'hr' : maxR, 'hg' : maxG, 'hb' : maxB,
    }
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
    //Convert to opencv values
    h = Math.round(h * 360)
    return [h,s,v];
}

function hsvToRgb( H,  S,  V) {

        let R=0;let G=0;let B=0;

        H /= 360;
        S /= 100;
        V /= 100;

        if (S == 0)
        {
            R = V * 255;
            G = V * 255;
            B = V * 255;
        } else {
            let var_h = H * 6;
            if (var_h == 6)
                var_h = 0; // H must be < 1
            let var_i = Math.floor(var_h); // Or ... var_i =
                                                            // floor( var_h )
            let var_1 = V * (1 - S);
            let var_2 = V * (1 - S * (var_h - var_i));
            let var_3 = V * (1 - S * (1 - (var_h - var_i)));

            let var_r;
            let var_g;
            let var_b;
            if (var_i == 0) {
                var_r = V;
                var_g = var_3;
                var_b = var_1;
            } else if (var_i == 1) {
                var_r = var_2;
                var_g = V;
                var_b = var_1;
            } else if (var_i == 2) {
                var_r = var_1;
                var_g = V;
                var_b = var_3;
            } else if (var_i == 3) {
                var_r = var_1;
                var_g = var_2;
                var_b = V;
            } else if (var_i == 4) {
                var_r = var_3;
                var_g = var_1;
                var_b = V;
            } else {
                var_r = V;
                var_g = var_1;
                var_b = var_2;
            }

            R = var_r * 255; // RGB results from 0 to 255
            G = var_g * 255;
            B = var_b * 255;
        }
        return ''+ Math.round(R) + ','+Math.round(G)+','+Math.round(B)
    }
    function hsvToHEX( H,  S,  V) {

            let R=0;let G=0;let B=0;

            H /= 360;
            S /= 100;
            V /= 100;

            if (S == 0)
            {
                R = V * 255;
                G = V * 255;
                B = V * 255;
            } else {
                let var_h = H * 6;
                if (var_h == 6)
                    var_h = 0; // H must be < 1
                let var_i = Math.floor(var_h); // Or ... var_i =
                                                                // floor( var_h )
                let var_1 = V * (1 - S);
                let var_2 = V * (1 - S * (var_h - var_i));
                let var_3 = V * (1 - S * (1 - (var_h - var_i)));

                let var_r;
                let var_g;
                let var_b;
                if (var_i == 0) {
                    var_r = V;
                    var_g = var_3;
                    var_b = var_1;
                } else if (var_i == 1) {
                    var_r = var_2;
                    var_g = V;
                    var_b = var_1;
                } else if (var_i == 2) {
                    var_r = var_1;
                    var_g = V;
                    var_b = var_3;
                } else if (var_i == 3) {
                    var_r = var_1;
                    var_g = var_2;
                    var_b = V;
                } else if (var_i == 4) {
                    var_r = var_3;
                    var_g = var_1;
                    var_b = V;
                } else {
                    var_r = V;
                    var_g = var_1;
                    var_b = var_2;
                }

                R = var_r * 255; // RGB results from 0 to 255
                G = var_g * 255;
                B = var_b * 255;
            }
            let hexR = R.toString(16)
            if (hexR.length == 1){ hexR = '0' + hexR}
            let hexG = G.toString(16)
            if (hexG.length == 1){ hexG = '0' + hexG}
            let hexB = B.toString(16)
            if (hexB.length == 1){ hexB = '0' + hexB}
            hexR = hexR.substring(0,2)
            hexG = hexG.substring(0,2)
            hexB = hexB.substring(0,2)
            //return ''+ R.toString(16)+''+G.toString(16)+''+B.toString(16)
            //console.log('val is  '+hexR.substring(0,2))
            return ''+ hexR+''+hexG+''+hexB
        }

const initalTV = 55
const initialHSV = {
      lh : 180,
      ls : .2,
      lv : .2,
      hh : 230,
      hs : 1,
      hv : 1,
      tv : initalTV,
    }
export default {
    RGBtoHSV,
    hsvToRgb,
    hsvToHEX,
    calculateCurrentHSV,
    calculateCurrentHSVString,
    htmlToOpenCVHSV,
    mean,
    sortContours,
    colorFilter,
    colorWhite,
    findBalls,
    getColorFromImage,
    calculateRelativeCoord,
    initialHSV,
    getMatFromCanvas
}

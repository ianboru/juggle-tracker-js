import cv from 'opencv.js';
import store from "./store"
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

    cv.cvtColor(src, dst, cv.COLOR_RGBA2RGB)
    // Blur the temporary image
    
    if(store.blurAmount > 1){
        let ksize = new cv.Size(store.blurAmount,store.blurAmount);
        let anchor = new cv.Point(-1, -1);
        cv.blur(dst, dst, ksize, anchor, cv.BORDER_DEFAULT);
    }
    // Convert the RGB temporary image to HSV
    cv.cvtColor(dst, dst, cv.COLOR_RGB2HSV)
    // Get values for the color ranges from the trackbars
    let lowerHSV = htmlToOpenCVHSV([colorRange.lh, colorRange.ls, colorRange.lv])
    lowerHSV.push(0)
    let higherHSV = htmlToOpenCVHSV([colorRange.hh, colorRange.hs, colorRange.hv])
    higherHSV.push(255)
    // Create the new mat objects that are the lower and upper ranges of the color
    let low = new cv.Mat(dst.rows, dst.cols, dst.type(), lowerHSV);
    let high = new cv.Mat(dst.rows, dst.cols, dst.type(), higherHSV);
    // Find the colors that are within (low, high)
    cv.inRange(dst, low, high, dst);
    // You can try more different parameters
    if(store.closeAmount > 0){
        let M = cv.Mat.ones(store.closeSize, store.closeSize, cv.CV_8U);
        cv.morphologyEx(dst, dst, cv.MORPH_CLOSE, M);
    }

    low.delete();high.delete();
    // Return the masked image (objects are white, background is black)
    return dst
}

function colorWhite(src, colorRange){
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    let ksize = new cv.Size(store.blurAmount,store.blurAmount);
    let anchor = new cv.Point(-1, -1);
    cv.blur(src, src, ksize, anchor, cv.BORDER_DEFAULT);
    let dst = new cv.Mat();
    // You can try more different parameters
    cv.threshold(src, dst, Math.round(360*store.brightnessThreshold/100), 255, cv.THRESH_BINARY);
    // Return the masked image (objects are white, background is black)
    return dst
}
function checkCircleIntersection(circle1,circle2){
    const dist = Math.pow(
                    Math.pow(circle1.x-circle2.x,2) +
                    Math.pow(circle1.y-circle2.y,2)
                ,.5)
    if(dist <= circle1.r + circle2.r){
        return true
    }else{
        return false
    }
}
function filterOverlappingContours(contourPositions){
    const filteredContourPositions = []
    for(let i = 0; i < contourPositions.length; ++i){
      for(let j = i+1; j < contourPositions.length; ++j){
        if(!contourPositions[i]|| !contourPositions[j]){
            continue
        }
        const intersect = checkCircleIntersection(
                            contourPositions[i],
                            contourPositions[j]
                            )
        //set smaller intersecting contour to null
        if(intersect && contourPositions[i].r > contourPositions[j].r){
            contourPositions[j] = null
        }else if(intersect && contourPositions[i].r > contourPositions[j].r){
            contourPositions[i] = null
        }
      } 
    }
    contourPositions.forEach((position)=>{
        if(position){
            filteredContourPositions.push(position)
        }
    })
    return filteredContourPositions
}

function findBalls(src){
    // Maximum number of contours to interpret as objects
    const maxNumContours = 10
    // Initialize contour finding data
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    // Find contours - src is a frame filtered for the current color
    cv.findContours(src, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    let contourPositions = []
    // Catalogue the contour locations to draw later
    // Iterate though the largest contours
      let contourNum = 0
      for (let i = 0; i < contours.size(); ++i) {
        // Find the contour area
        const contour = contours.get(i)
        const contourArea = cv.contourArea(contour)
        //Check if contour is big enough to be a real object
        if(contourArea > store.sizeThreshold && contourPositions.length < maxNumContours){
          // Use circle to get x,y coordinates and radius
          const circle = cv.minEnclosingCircle(contour)
          // Push the coordinates of the contour and the radius to the list of objects
          contourPositions.push({
            'x' : circle.center.x,
            'y' : circle.center.y,
            'r' : circle.radius,
          })
        }
        ++contourNum
        contour.delete; 
      }
    
    if(contourPositions.length > 0){
        contourPositions = filterOverlappingContours(contourPositions)
    }
    // Cleanup open cv objects
    contours.delete(); hierarchy.delete();
    // Return list of contour positions and sizes
    return contourPositions
}

function calculateCurrentHSVString(ballColorRange,opacity){
    return "hsl(" + mean(ballColorRange['lh'],ballColorRange['hh']) + "," + ballColorRange['hs']*100 + "%," + ballColorRange['hv']*100/2 +"%)"
}

function calculateCurrentHSV(ballColorRange,opacity){
    return "hsl(" + mean(ballColorRange['lh'],ballColorRange['hh']) + "," + ballColorRange['hs']*100 + "%," + ballColorRange['hv']*100/2 +"%)"
}

function htmlToOpenCVHSV(htmlHSV){
    let openCVHSV  = htmlHSV
    openCVHSV[0] =  180*openCVHSV[0]/360
    openCVHSV[1] = openCVHSV[1] * 255
    openCVHSV[2] = openCVHSV[2] * 255
    return openCVHSV
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

export default {
    RGBtoHSV,
    hsvToRgb,
    hsvToHEX,
    calculateCurrentHSV,
    calculateCurrentHSVString,
    htmlToOpenCVHSV,
    mean,
    colorFilter,
    colorWhite,
    findBalls,
    getColorFromImage,
    calculateRelativeCoord,
    getMatFromCanvas
}

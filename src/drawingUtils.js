import cvutils from './cvutils';

function drawSelectColorText(context, isMobile, usingWhite){
  let text
  if(isMobile && !usingWhite){
    text = "Hold finger on prop to set color"
  }else if(!isMobile && !usingWhite){
    text = "Click and drag box over prop to set color"
  }else{
    text = "Adjust brightness threshold to find prop"
  }
  context.font = "30px Arial"
  context.fillStyle = "#ffffff"
  context.fillText(text,30,40)
}

function drawCircle(context, x,y,r, color){
    //Draw circle for coordinate and color
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
    context.strokeStyle = color;
    context.stroke();
  }

function drawTrails(context, contourPositions, color, trailLength){
  //Draw circle and trail
  if(contourPositions){

    for(let i = 0; i < contourPositions.length; ++i){
      //Don't draw if x oordinate is -1
      if(contourPositions[i] && contourPositions[i]['x'] != -1 ){
        //Rename for convenience
        const xHistory = contourPositions[i]['x']
        const yHistory = contourPositions[i]['y']
        const rHistory = contourPositions[i]['r']

        //Don't draw a trail longer than the window
        const maxWindowSize = trailLength
        let currentWindowSize  = Math.min(xHistory.length, maxWindowSize)
        //Draw circle and trail
        for (let t=0; t < currentWindowSize; ++t){
          //At least draw the ball itself
          if(xHistory[xHistory.length - 1 - t] > -1 && xHistory[xHistory.length - 1 - t] != -1 ){

            //Look backwards in history stepping by t
            const lastX = xHistory[xHistory.length - 1 - t]
            const lastY = yHistory[yHistory.length - 1 - t]
            const lastR = rHistory[rHistory.length - 1 - t]
            drawCircle(context,lastX, lastY, lastR*(1-(t/currentWindowSize)), color)
          }
        }
      }
    }
  }
}

function drawConnections(context,positions, color){
  const thickness = 3
  if(!positions){
    return
  }
  //Draw connection between currentNumContours contours
  const numObjects = positions.currentNumContours
  if(numObjects > 1){
    for(let i = 0; i < numObjects; ++i){
      for(let j = i+1; j < numObjects; ++j){
        //Connect last ball to first ball if there are 3 or more objects
        /*if(i == numObjects-1 && numObjects > 2){
          nextBallIndex = 0
        }else if(i == numObjects-1 && numObjects <= 2){
          continue
        }*/
        //Draw
        if(
          positions[i] && positions[i]['x'].slice(-1).pop() != -1 &&
          positions[j] && positions[j]['x'].slice(-1).pop() != -1
        ){
          const curBallX = positions[i]['x'].slice(-1).pop()
          const curBallY = positions[i]['y'].slice(-1).pop()

          const nextBallX = positions[j]['x'].slice(-1).pop()
          const nextBallY = positions[j]['y'].slice(-1).pop()
          context.beginPath();
          context.moveTo(curBallX, curBallY)
          context.lineTo(nextBallX, nextBallY)
          context.strokeStyle = color
          context.lineWidth = thickness;
          context.stroke();
        }
      }
    }
  }
}

function drawStars(context,positions, existingStarsX, existingStarsY, existingStarsDx, existingStarsDy, existingStarsSize, existingStarsColor, discoColor){

  // Create some temporary lists
  let newStarsX = []
  let newStarsY = []
  let newStarsDx = []
  let newStarsDy = []
  let newStarsSize = []
  let newStarsColor = []
  // Number of stars created for each object detected
  const numStarsPerObject = 8
  // If data exists for this object, proceed
  if(positions){
    // Iterate though each contour for this color
    for(let i = 0; i < positions.currentNumContours; ++i){
      // If this a contour in this colorNum exists, proceed
      if(positions[i]){
        // Get the x and y values
        const x = positions[i]['x'].slice(-1).pop()
        const y = positions[i]['y'].slice(-1).pop()
        // Get the radius
        const r = positions[i]['r'].slice(-1).pop()
        // Create some stars
        for (let numStars=0; numStars<numStarsPerObject; numStars++){
          // A star is born!
          newStarsX.push(x + (.5-Math.random())*r) // Around the xy coordinate
          newStarsY.push(y + (.5-Math.random())*r)
          newStarsDx.push(2*(.5-Math.random())) // With a random velocity
          newStarsDy.push(2*(.5-Math.random()))
          newStarsSize.push(positions[i]['r'].slice(-1).pop()/5 + Math.random()*2) // And a random size
          //console.log(cvutils.hsvToHEX(discoColor, 100, 100))
          newStarsColor.push('#'+cvutils.hsvToHEX(discoColor, 100,100))
        }
      }
    }
  }

  // Add the old stars to the list of new stars
  for (let i=0; i<existingStarsX.length; i++){
    // Has the star burned out?
    if (existingStarsSize[i]-.15>1){
      // The star needs to move. x and y change by dx and dy
      newStarsX.push(existingStarsX[i]+existingStarsDx[i])
      newStarsY.push(existingStarsY[i]+existingStarsDy[i])
      // Save the dx, dy. They remain constant
      newStarsDx.push(existingStarsDx[i])
      newStarsDy.push(existingStarsDy[i])
      // The star get smaller
      newStarsSize.push(existingStarsSize[i]-.2)
      // Preserve the color
      newStarsColor.push(existingStarsColor[i])
    }
  }
  // Draw the stars
  for (let i=0; i< newStarsX.length; i++){
    const x = newStarsX[i]
    const y = newStarsY[i]
    const size = newStarsSize[i]
    const color = newStarsColor[i]
    drawCircle(context,x,y,size,color)
  }
  return {
    starsX : newStarsX,
    starsY : newStarsY,
    starsDx : newStarsDx,
    starsDy : newStarsDy,
    starsSize : newStarsSize,
    starsColor : newStarsColor
  }
}
function fitVidToCanvas(canvas, imageObj, isMobile){
  var imageAspectRatio = imageObj.videoWidth / imageObj.videoHeight;
  var canvasAspectRatio = canvas.width / canvas.height;
  var renderableHeight, renderableWidth, xStart, yStart;

  // If image's aspect ratio is less than canvas's we fit on height
  // and place the image centrally along width
  if(imageAspectRatio < canvasAspectRatio) {
    renderableHeight = canvas.height;
    renderableWidth = imageObj.videoWidth * (renderableHeight / imageObj.videoHeight);
    xStart = (canvas.width - renderableWidth) / 2;
    yStart = 0;
  }

  // If image's aspect ratio is greater than canvas's we fit on width
  // and place the image centrally along height
  else if(imageAspectRatio > canvasAspectRatio) {
    renderableWidth = canvas.width
    renderableHeight = imageObj.videoHeight * (renderableWidth / imageObj.videoWidth);
    xStart = 0;
    yStart = (canvas.height - renderableHeight) / 2;
  }

  // Happy path - keep aspect ratio
  else {
    renderableHeight = canvas.height;
    renderableWidth = canvas.width;
    xStart = 0;
    yStart = 0;
  }
  const context = canvas.getContext("2d")
    if(isMobile){
     context.save(); 

      // move to the middle of where we want to draw our image
      context.translate(xStart, yStart);

      // rotate around that point, converting our 
      // angle from degrees to radians 
      context.rotate(90 * Math.PI/180);

      // draw it up and to the left by half the width
      // and height of the image 
      context.drawImage(imageObj, -(renderableWidth/2), -(renderableHeight/2));

      // and restore the co-ords to how they were when we began
      context.restore(); 
    }else{
        context.drawImage(imageObj, xStart, yStart, renderableWidth, renderableHeight);
    }
};
export default {
    drawTrails,
    drawConnections,
    drawStars,
    drawSelectColorText,
    fitVidToCanvas
}

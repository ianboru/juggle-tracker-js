import cvutils from './cvutils';
import drawingStore from './drawingStore'
import store from './store'

function addOpacityToColor(color,opacity){
  if(color.includes("rgb(")){
    color = color.replace("rgb","rgba")
    color = color.replace(")","," + opacity + ")")
  }else if(color.includes("hsl(")){
    color = color.replace("hsl", "hsla")
    color = color.replace(")","," + opacity + ")")
  }
  return color
}
function drawSelectColorText(context, isMobile, usingWhite){
  let text
  context.font = "25px Arial"
  context.fillStyle = "#ffffff"
  context.textAlign = "center"; 
  const x = context.canvas.width*.5
  const y = context.canvas.height*.92
  if(isMobile && !usingWhite){
    text = "Hold finger on prop to set color\n THEN use sliders refine prop color"
  }else if(!isMobile && !usingWhite){
    text = "Click and drag box over prop\n THEN use sliders refine prop color"
    context.textBaseline="bottom";
    context.fillText("Click and drag box over prop THEN", x, y);
    context.textBaseline="top";
    context.fillText("use sliders to refine prop color", x, y);
  }else{
    text = "Adjust brightness threshold to find prop"
    context.fillText(
      text,
      x, 
      y
    )
  }
}
function getHueFromColorString(string){
  const splitString = string.split(",")
  return splitString[0].replace("hsl(","")
}
function drawCircles(context, contourPositions,color){
  // Check if tracking data exists
  if(contourPositions){    
    // Iterate through each color being tracked
    for(let i = 0; i < contourPositions.length; ++i){
      // Don't draw if x coordinate is -1
      if(contourPositions[i] && contourPositions[i]['x'] !== -1 ){
        // Rename for convenience
        const xHistory = contourPositions[i]['x']
        const yHistory = contourPositions[i]['y']
        const rHistory = contourPositions[i]['r']
        // Don't draw a trail longer than the window or the trail length       
        let currentWindowSize  = Math.min(xHistory.length, store.trailLength)
        // Draw the trail of circles, 't' represents # of frames in the past
        for (let t=currentWindowSize; t > -1; --t){
          // At least draw the ball itself
          if(xHistory[xHistory.length - 1 - t] > -1 && xHistory[xHistory.length - 1 - t] !== -1 ){
            // Get parameters for circle
            const lastX = xHistory[xHistory.length - 1 - t]
            const lastY = yHistory[yHistory.length - 1 - t]
            const lastR = rHistory[rHistory.length - 1 - t]
            const opacity = store.opacity*(1 - t/currentWindowSize)
            const thickness = store.trailThickness*lastR*(1-(t/currentWindowSize))
            // Call the draw circle function to paint the canvas
            if(store.discoMode){
              const hue = (getHueFromColorString(color) - t*store.discoIncrement) % 360
              drawSphere(context,lastX, lastY, thickness, 'hsl(' + hue + ', 100,100)', opacity)  
            }else{
              drawSphere(context,lastX, lastY, thickness, color, opacity)  

            }
          }
        }
      }
    }
  }
}
function drawFlowers(context, contourPositions, color){
  // Check if tracking data exists
  if(contourPositions){    
    // Iterate through each color being tracked
    for(let i = 0; i < contourPositions.length; ++i){
      // Don't draw if x coordinate is -1
      if(contourPositions[i] && contourPositions[i]['x'] !== -1 ){
        //Rename for convenience
        const xHistory = contourPositions[i]['x']
        const yHistory = contourPositions[i]['y']
        const rHistory = contourPositions[i]['r']

        // Don't draw a trail longer than the window or the ring length     
        let currentWindowSize  = 1
        // Draw the trail of rings, 't' represents # of frames in the past
        for (let t=currentWindowSize; t > -1; --t){
          // At least draw the ball itself
          if(xHistory[xHistory.length - 1 - t] > -1 && xHistory[xHistory.length - 1 - t] !== -1 ){
            // Get parameters for circle
            const lastX = xHistory[xHistory.length - 1 - t]
            const lastY = yHistory[yHistory.length - 1 - t]
            const lastR = rHistory[rHistory.length - 1 - t]
            const opacity = store.opacity*(1 - t/currentWindowSize)
            const thickness = store.ringThickness*lastR*(1-(t/currentWindowSize))
            // Call the draw circle function to paint the canvas
            drawFlower(context,lastX, lastY, lastR,  color )
          }
        }
      }
    }
  }
}
function drawFlower(ctx, cx,cy ,radius1, color ) {
   cx, cy, radius1, radius2, ratio
  radius1 = radius1 * store.flowerSize
  const radius2 = radius1/2 * store.flowerSize
  const ratio = store.numFlowerPetals
  var x, y, theta;
  ctx.lineWidth = store.connectionThickness;
  ctx.strokeStyle = addOpacityToColor(color, store.opacity)
  // Move to starting point (theta = 0)
  ctx.beginPath();
  ctx.moveTo(cx + radius1 + radius2, cy);

  // Draw segments from theta = 0 to theta = 2PI
  for (theta = 0; theta < Math.PI * 2; theta += 0.01) {
    x = cx + radius1 * Math.cos(theta + store.flowerRotation*Math.PI/180) + radius2 * Math.cos( theta * ratio);
    y = cy + radius1 * Math.sin(theta + store.flowerRotation*Math.PI/180) + radius2 * Math.sin(theta * ratio);
    ctx.lineTo(x, y);
  }
  ctx.stroke()
}
function drawRings(context, contourPositions, color){
  // Check if tracking data exists
  if(contourPositions){    
    // Iterate through each color being tracked
    for(let i = 0; i < contourPositions.length; ++i){
      // Don't draw if x coordinate is -1
      if(contourPositions[i] && contourPositions[i]['x'] !== -1 ){
        //Rename for convenience
        const xHistory = contourPositions[i]['x']
        const yHistory = contourPositions[i]['y']
        const rHistory = contourPositions[i]['r']

        // Don't draw a trail longer than the window or the ring length     
        let currentWindowSize  = Math.min(xHistory.length, store.ringLength)
        // Draw the trail of rings, 't' represents # of frames in the past
        for (let t=currentWindowSize; t > -1; --t){
          // At least draw the ball itself
          if(xHistory[xHistory.length - 1 - t] > -1 && xHistory[xHistory.length - 1 - t] !== -1 ){
            // Get parameters for circle
            const lastX = xHistory[xHistory.length - 1 - t]
            const lastY = yHistory[yHistory.length - 1 - t]
            const lastR = rHistory[rHistory.length - 1 - t]
            const opacity = store.opacity*(1 - t/currentWindowSize)
            const thickness = store.ringThickness*lastR*(1-(t/currentWindowSize))
            // Call the draw circle function to paint the canvas
            drawRing(context,lastX, lastY, thickness, color, opacity)
          }
        }
      }
    }
  }
}



  

function drawCircleThroughContours(context, x1,y1, x2,y2, color){
  const midPoint = findMidpoint(x1,y1,x2,y2)
  const diameter = calculateDistance({'x':x1,'y':y1},{'x':x2,'y':y2})
  context.beginPath();
  context.moveTo(x1, y1)
  context.lineTo(x2, y2)
  context.strokeStyle = color
  drawCircle(context,midPoint[0],midPoint[1], diameter/2, color)
}
function drawCirclesThroughContours(context, allPositions, allColors){
  const flattenedPositions = []
  const flattenedPositionColors = []
  for(let i = 0; i < allPositions.length; ++i){
    for(let j = 0; j < allPositions[i].length; ++j){
      if(allPositions[i][j].x.slice(-1).pop() !== -1){
        flattenedPositions.push(allPositions[i][j])
        const color = addOpacityToColor(cvutils.calculateCurrentHSV(allColors[i]), store.opacity)
        flattenedPositionColors.push(color)
      }
    }
  }
  let lastColor = {}
  let curColor
  let curObjectX ; let curObjectR ; let curObjectY ; let lastObjectX ; let lastObjectR; let lastObjectY;
  for(let i = 0; i < flattenedPositions.length; ++i){
    for(let j = i+1; j < flattenedPositions.length; ++j){
        lastObjectX = flattenedPositions[i]['x'].slice(-1).pop()
        lastObjectY = flattenedPositions[i]['y'].slice(-1).pop()
        lastObjectR = flattenedPositions[i]['r'].slice(-1).pop()
        lastColor = flattenedPositionColors[i] 
        curObjectX = flattenedPositions[j]['x'].slice(-1).pop()
        curObjectY = flattenedPositions[j]['y'].slice(-1).pop() 
        curObjectR = flattenedPositions[j]['r'].slice(-1).pop()
        curColor = flattenedPositionColors[j] 
        context.lineWidth = store.connectionThickness
        const grad= context.createLinearGradient(curObjectX, curObjectY, lastObjectX, lastObjectY);
        grad.addColorStop(0, curColor);
        grad.addColorStop(1, lastColor);
        drawCircleThroughContours(context, curObjectX, curObjectY,lastObjectX, lastObjectY, grad)
    }
  }
}

function drawSquares(context,allPositions, allColors){
console.log("drawing squares")
  const flattenedPositions = []
  const flattenedPositionColors = []
  for(let i = 0; i < allPositions.length; ++i){
    for(let j = 0; j < allPositions[i].length; ++j){
      if(allPositions[i][j].x.slice(-1).pop() !== -1){
        flattenedPositions.push(allPositions[i][j])
        const color = addOpacityToColor(cvutils.calculateCurrentHSV(allColors[i]), store.opacity)
        flattenedPositionColors.push(color)
      }
    }
  }
  let lastColor = {}
  let curColor
  let curObjectX ; let curObjectR ; let curObjectY ; let lastObjectX ; let lastObjectR; let lastObjectY;
  for(let i = 0; i < flattenedPositions.length; ++i){
    for(let j = i+1; j < flattenedPositions.length; ++j){
        lastObjectX = flattenedPositions[i]['x'].slice(-1).pop()
        lastObjectY = flattenedPositions[i]['y'].slice(-1).pop()
        lastObjectR = flattenedPositions[i]['r'].slice(-1).pop()
        lastColor = flattenedPositionColors[i] 
        curObjectX = flattenedPositions[j]['x'].slice(-1).pop()
        curObjectY = flattenedPositions[j]['y'].slice(-1).pop() 
        curObjectR = flattenedPositions[j]['r'].slice(-1).pop()
        curColor = flattenedPositionColors[j] 
        context.lineWidth = store.connectionThickness
        drawSquarePerpendicular(context, curObjectX, curObjectY,lastObjectX, lastObjectY, curColor,lastColor)
    }
  }
}
function calculateDistance(position1, position2){
  const dxSquared = Math.pow(position1.x - position2.x,2)
  const dySquared = Math.pow(position1.y - position2.y,2)
  return Math.pow(dxSquared + dySquared, .5)
}

function drawSquarePerpendicular(context, x1,y1, x2,y2, curColor, lastColor){
  const cx = (x1+x2)/2 ; const cy = (y1+y2)/2
  const vx = x1 - cx; const vy = y1 - cy; // vector c->(x1,y1)
  const ux = vy; const uy = -vx;          // rotate through 90 degrees
  const x3 = cx + ux; const y3 = cy + uy; // one of the endpoints of other diagonal
  const x4 = cx - ux; const y4 = cy - uy; // the other endpoint
  context.lineWidth = store.connectionThickness;
        context.beginPath()

  context.moveTo(x1, y1)
  context.strokeStyle = curColor
  context.lineTo(x3, y3)
    context.stroke();
        context.beginPath()

  context.moveTo(x3, y3)
  context.strokeStyle = lastColor
  context.lineTo(x2, y2)
    context.stroke();
        context.beginPath()

  context.moveTo(x2, y2)
  context.strokeStyle = lastColor
  context.lineTo(x4, y4)
    context.stroke();
        context.beginPath()

  context.moveTo(x4, y4)
  context.strokeStyle = curColor
  context.lineTo(x1, y1)
    context.stroke();


  context.stroke();
}
function drawConnections(context,positions, color){
  if(!positions){
    return
  }
  //Draw connection between currentNumContours contours
  const numObjects = positions.currentNumContours
  if(numObjects > 1){
    for(let i = 0; i < numObjects; ++i){
      for(let j = i+1; j < numObjects; ++j){
        if(
          positions[i] && positions[i]['x'].slice(-1).pop() !== -1 &&
          positions[j] && positions[j]['x'].slice(-1).pop() !== -1
        ){
          const curBallX = positions[i]['x'].slice(-1).pop()
          const curBallY = positions[i]['y'].slice(-1).pop()

          const nextBallX = positions[j]['x'].slice(-1).pop()
          const nextBallY = positions[j]['y'].slice(-1).pop()

          const lastColor = addOpacityToColor(color, store.opacity)
          context.beginPath();
          context.moveTo(curBallX, curBallY)
          context.lineTo(nextBallX, nextBallY)
          context.strokeStyle = lastColor
          context.lineWidth = store.connectionThickness;
          context.stroke();
        }
      }
    }
  }
}
function drawLineGradient(x1,y1,x2,y2,color1,color2,context){
  const thickness = 5

  var grad= context.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);
  context.beginPath();
  context.moveTo(x1, y1)
  context.lineTo(x2, y2)
  context.strokeStyle = grad
  context.lineWidth = store.connectionThickness;
  context.stroke();
}
function drawAllConnections(context,allPositions, allColors){

  const flattenedPositions = []
  const flattenedPositionColors = []
  for(let i = 0; i < allPositions.length; ++i){
    for(let j = 0; j < allPositions[i].length; ++j){
      if(allPositions[i][j].x.slice(-1).pop() !== -1){
        flattenedPositions.push(allPositions[i][j])
        const color = addOpacityToColor(cvutils.calculateCurrentHSV(allColors[i]), store.opacity)
        flattenedPositionColors.push(color)
      }
    }
  }
  let lastColor = {}
  let curColor
  let curObjectX ; let curObjectY ; let lastObjectX ; let lastObjectY;
  for(let i = 0; i < flattenedPositions.length; ++i){
    for(let j = i+1; j < flattenedPositions.length; ++j){
        lastObjectX = flattenedPositions[i]['x'].slice(-1).pop()
        lastObjectY = flattenedPositions[i]['y'].slice(-1).pop()
        lastColor = flattenedPositionColors[i] 
        curObjectX = flattenedPositions[j]['x'].slice(-1).pop()
        curObjectY = flattenedPositions[j]['y'].slice(-1).pop() 
        curColor = flattenedPositionColors[j] 
        drawLineGradient(curObjectX,curObjectY,lastObjectX,lastObjectY, curColor, lastColor, context)
    }
  }
}
function drawStars(context,positions, color){
  const maxStars = 500
  const starDecayRate = .25
  // Create some temporary lists
  let newStarsX = []
  let newStarsY = []
  let newStarsDx = []
  let newStarsDy = []
  let newStarsSize = []
  let newStarsColor = []
  // If data exists for this object, proceed
  let initialOpacity = .75*store.opacity
  const maxSize = 30
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
        for (let starNum=0; starNum< store.numStarsPerObject+1; starNum++){
          // A star is born!
          if(drawingStore.starsX.length + starNum > maxStars){
            continue
          }
          const curX = x + (.5-Math.random())*r
          const curY = y + (.5-Math.random())*r
          newStarsX.push(curX) // Around the xy coordinate
          newStarsY.push(curY)
          newStarsDx.push(2*(.5-Math.random())) // With a random velocity
          newStarsDy.push(2*(.5-Math.random()))
          let size = positions[i]['r'].slice(-1).pop()*Math.random()*store.starSize
          // Prevent HUGE stars (stars more than 90px in diameter)
          if (size>maxSize){ size=maxSize}
          newStarsSize.push(size)
          newStarsColor.push(color)
          drawStar(context,curX,curY,size,color, initialOpacity)
        }
      }
    }
  }

  // Add the old stars to the list of new stars
  for (let i=0; i<drawingStore.starsX.length; i++){
    // Has the star burned out?
    if (drawingStore.starsSize[i]-starDecayRate > 1){
      // The star needs to move. x and y change by dx and dy
      const x = drawingStore.starsX[i]+drawingStore.starsDx[i]
      const y = drawingStore.starsY[i]+drawingStore.starsDy[i]
      const color = drawingStore.starsColor[i]
      newStarsX.push(x)
      newStarsY.push(y)
      // Save the dx, dy. They remain constant
      newStarsDx.push(drawingStore.starsDx[i])
      newStarsDy.push(drawingStore.starsDy[i])
      // The star get smaller
      const size = drawingStore.starsSize[i]-(1-store.starLife)
      const opacity = Math.min( initialOpacity, initialOpacity * size/10)

      newStarsSize.push(size)
      // Preserve the color
      newStarsColor.push(color)
      drawStar(context,x,y,size,color, opacity)
    }
  }

  drawingStore.setStars({
    starsX : newStarsX,
    starsY : newStarsY,
    starsDx : newStarsDx,
    starsDy : newStarsDy,
    starsSize : newStarsSize,
    starsColor : newStarsColor
  })
}
function drawStar(context,x, y, r, color, opacityBySize) {
  context.save();
 
  // draw shape
  const innerRadius = r*.2
  const outerRadius = r*1.1
  let editColor = color.replace("hsl(","")
  editColor = editColor.replace(")","")
  const splitColor = editColor.split(",")

  var gradient = context.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
  gradient.addColorStop(0, 'hsla('+ splitColor[0] + ',100%,90%,'+opacityBySize+')');
  gradient.addColorStop(.9, 'hsla('+ splitColor[0] + ',100%,75%,'+opacityBySize*.8+')');
  gradient.addColorStop(1, 'hsla('+ splitColor[0] + ',100%,60%,'+opacityBySize*.8+')');

  context.strokeStyle = 'hsla('+ splitColor[0] + ',100%,50%,'+opacityBySize*.15+')';

  const strokeColor = addOpacityToColor(color, .4)
  const fillColor = addOpacityToColor(color, opacityBySize)
  context.beginPath();
  context.lineWidth = r*.2;
  //context.strokeStyle = strokeColor;
  context.fillStyle = gradient;
  context.translate(x, y);
  context.moveTo(0,0-r);
  /*context.shadowBlur = r*.2;
  context.shadowColor = "black";*/
  const inset = .15
  const sides = 6
  for (var i = 0; i < sides; i++) {
      context.rotate(Math.PI / sides);
      context.lineTo(0, 0 - (r*inset));
      context.rotate(Math.PI / sides);
      context.lineTo(0, 0 - r);
  }
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();
}
function drawSphere(context, x,y,r, color, opacity){
    context.beginPath();
    r = store.pulseSpeed > 0 ? r*(store.pulseSize/100) : r
    // Radii of the white glow. 
    const innerRadius = r*.2
    const outerRadius = r*1.1
    let editColor = color.replace("hsl(","")
    editColor = editColor.replace(")","")
    const splitColor = editColor.split(",")

    var gradient = context.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
    gradient.addColorStop(0, 'hsla('+ splitColor[0] + ',100%,90%,'+opacity+')');
    gradient.addColorStop(.50, 'hsla('+ splitColor[0] + ',100%,60%,'+opacity*.9+')');
    gradient.addColorStop(.9, 'hsla('+ splitColor[0] + ',100%,30%,'+opacity*.7+')');
    gradient.addColorStop(1, 'hsla('+ splitColor[0] + ',100%,15%,'+opacity*.15+')');
    context.strokeStyle = 'hsla('+ splitColor[0] + ',100%,5%,'+opacity*.15+')';

    context.arc(x, y, r, 0, 2 * Math.PI, false);
    context.fillStyle = gradient;
    context.fill();
    context.stroke();
}
function drawCircle(context, x,y,r, color){
  context.beginPath()
  context.strokeStyle = color
  context.arc(x, y, r, 0, 2 * Math.PI, false);
  context.lineWidth = store.connectionThickness
  context.stroke();
}
function findMidpoint(x1,y1,x2,y2){
  return [x2 + (x1 - x2)/2, y2 + (y1 - y2)/2] 

}
function drawRing(context, x,y,r, color, opacity){
    context.beginPath();
    // Radii of the white glow.
    const innerRadius = r*1
    const outerRadius = r*1.8
    let editColor = color.replace("hsl(","")
    editColor = editColor.replace(")","")
    const splitColor = editColor.split(",")

    var gradient = context.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
    gradient.addColorStop(0, 'hsla('+ splitColor[0] + ',100%,90%,'+opacity+')');
    gradient.addColorStop(.8, 'hsla('+ splitColor[0] + ',100%,30%,'+opacity*.6+')');
    gradient.addColorStop(.97, 'hsla('+ splitColor[0] + ',100%,75%,'+opacity*.3+')');

    context.arc(x, y, r*1.5, 0, 2 * Math.PI, false);
    context.strokeStyle = gradient;
    context.lineWidth = r*.5
    context.stroke();
}
function fitVidToCanvas(canvas, imageObj, opacity){
  let imageWidth
  let imageHeight
  if(imageObj.videoWidth){
    imageWidth = imageObj.videoWidth
    imageHeight = imageObj.videoHeight
  }else{
    imageWidth = imageObj.width
    imageHeight = imageObj.height
  }

  var imageAspectRatio = imageWidth/ imageHeight;
  var canvasAspectRatio = canvas.width / canvas.height;
  var renderableHeight, renderableWidth, xStart, yStart;

  // If image's aspect ratio is less than canvas's we fit on height
  // and place the image centrally along width
  if(imageAspectRatio < canvasAspectRatio) {
    renderableHeight = canvas.height;
    renderableWidth = imageWidth* (renderableHeight / imageHeight);
    xStart = (canvas.width - renderableWidth) / 2;
    yStart = 0;
  }

  // If image's aspect ratio is greater than canvas's we fit on width
  // and place the image centrally along height
  else if(imageAspectRatio > canvasAspectRatio) {
    renderableWidth = canvas.width
    renderableHeight = imageHeight * (renderableWidth / imageWidth);
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
  context.globalAlpha = opacity
  context.drawImage(imageObj, xStart, yStart, renderableWidth, renderableHeight);
  context.globalAlpha = 1
};

export default {
    drawCircles,
    drawCirclesThroughContours,
    drawConnections,
    drawRings,
    drawAllConnections,
    drawStars,
    drawSquares,
    drawSelectColorText,
    drawFlowers,
    fitVidToCanvas,
}

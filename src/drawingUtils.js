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
  if(isMobile && !usingWhite){
    text = "Hold finger on prop to set color"
  }else if(!isMobile && !usingWhite){
    text = "Click and drag box over prop to set color"
  }else{
    text = "Adjust brightness threshold to find prop"
  }
  context.font = "30px Arial"
  context.fillStyle = "#ffffff"
  context.fillText(text,40, context.canvas.clientHeight - 40)
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

function drawCircleTrails(context, contourPositions, color){
  //Draw circle and trail
  if(contourPositions){
    for(let i = 0; i < contourPositions.currentNumContours; ++i){
      //Don't draw if x oordinate is -1
      if(contourPositions[i] && contourPositions[i]['x'] !== -1 ){
        //Rename for convenience
        const xHistory = contourPositions[i]['x']
        const yHistory = contourPositions[i]['y']
        const rHistory = contourPositions[i]['r']

        //Don't draw a trail longer than the window
        const maxWindowSize = store.trailLength
        let currentWindowSize  = Math.min(xHistory.length, maxWindowSize)
        //Draw circle and trail
        for (let t=0; t < currentWindowSize; ++t){
          //At least draw the ball itself
          if(xHistory[xHistory.length - 1 - t] > -1 && xHistory[xHistory.length - 1 - t] !== -1 ){

            //Look backwards in history stepping by t
            const lastX = xHistory[xHistory.length - 1 - t]
            const lastY = yHistory[yHistory.length - 1 - t]
            const lastR = rHistory[rHistory.length - 1 - t]
            const lastColor = addOpacityToColor(color, 1 - t/(currentWindowSize*2))
            drawCircle(context,lastX, lastY, lastR*(1-(t/currentWindowSize)), lastColor)
          }
        }
      }
    }
  }
}
function drawConnections(context,positions, color, thickness){
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
function drawLineGradient(x1,y1,x2,y2,color1,color2,context){
  const thickness = 5

  var grad= context.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);
  context.beginPath();
  context.moveTo(x1, y1)
  context.lineTo(x2, y2)
  context.strokeStyle = grad
  context.lineWidth = thickness;
  context.stroke();
}
function drawAllConnections(context,allPositions, allColors){
  const flattenedPositions = []
  const flattenedPositionColors = []
  for(let i = 0; i < allPositions.length; ++i){
    for(let j = 0; j < allPositions[i].length; ++j){
      if(allPositions[i][j].x.slice(-1).pop() !== -1){
        flattenedPositions.push(allPositions[i][j])
        flattenedPositionColors.push(cvutils.calculateCurrentHSV(allColors[i]))
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
  let initialOpacity = .75

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
          const size = positions[i]['r'].slice(-1).pop()*Math.random()*store.starSize
          newStarsSize.push(size) // And a random size
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
  const strokeColor = addOpacityToColor(color, .4)
  const fillColor = addOpacityToColor(color, opacityBySize)
  context.beginPath();
  context.lineWidth = r*.2;
  context.strokeStyle = strokeColor;
  context.fillStyle = fillColor;
  context.translate(x, y);
  context.moveTo(0,0-r);
  context.shadowBlur = r*.2;
  context.shadowColor = "black";
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
  context.restore();
}
function fitVidToCanvas(canvas, imageObj){
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
  context.drawImage(imageObj, xStart, yStart, renderableWidth, renderableHeight);
};
export default {
    drawCircleTrails,
    drawConnections,
    drawAllConnections,
    drawStars,
    drawSelectColorText,
    fitVidToCanvas
}

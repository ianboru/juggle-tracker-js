import cvutils from './cvutils';

function drawCircle(context, x,y,r, color){
    //Draw circle for coordinate and color
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
    context.strokeStyle = color;
    context.stroke();
  }

function drawTrails(context, contourPositions, colorRange, trailLength){
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
            const color = cvutils.calculateCurrentHSVString(colorRange,(1-(t/currentWindowSize)))
            drawCircle(context,lastX, lastY, lastR*(1-(t/currentWindowSize)), color)
          }
        }
      }
    }
  }
}
function drawConnections(context,positions, colorRange){

  if(!positions){
    return
  }
  //Draw connection between currentNumContours contours
  const numObjects = positions.currentNumContours
  if(numObjects > 1){
    for(let i = 0; i < numObjects; ++i){
      let nextBallIndex = i+1
      //Connect last ball to first ball if there are 3 or more objects
      if(i == numObjects-1 && numObjects > 2){
        nextBallIndex = 0
      }else if(i == numObjects-1 && numObjects <= 2){
        continue
      }
      //Draw
      if(
        positions[i] && positions[i]['x'].slice(-1).pop() != -1 &&
        positions[nextBallIndex] && positions[nextBallIndex]['x'].slice(-1).pop() != -1
      ){
        const curBallX = positions[i]['x'].slice(-1).pop()
        const curBallY = positions[i]['y'].slice(-1).pop()

        const nextBallX = positions[nextBallIndex]['x'].slice(-1).pop()
        const nextBallY = positions[nextBallIndex]['y'].slice(-1).pop()
        context.beginPath();
        context.moveTo(curBallX, curBallY)
        context.lineTo(nextBallX, nextBallY)
        context.strokeStyle = cvutils.calculateCurrentHSVString(colorRange, 1);
        context.lineWidth = 4;
        context.stroke();
      }
    }
  }
}
export default { 
    drawTrails,
    drawConnections
}
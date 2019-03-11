import cvutils from './cvutils';

function updateBallHistories(contourPositions, colorNum, allPositions){
  // Maximum number of contours that will be interpreted as objects
  const maxNumContours = 12
  //Used to know how many contours to connect later
  let numContoursOverThreshold = 0
  //Catalogue the contour locations to draw later
  if(contourPositions.length > 0){
    //initialize for the first contours
    if(!allPositions[colorNum]){
      allPositions[colorNum] = []
    }
    //Shouldn't be more than max contours realistically
    for(let i = 0; i < Math.min(contourPositions.length, maxNumContours); ++i){
      //Initialize current object
      if(!allPositions[colorNum][i]){
        allPositions[colorNum][i]={
          'x':[],
          'y':[],
          'r':[]
        }
      }
      ++numContoursOverThreshold
      //Add latest coordinates to history
      allPositions[colorNum][i]['x'].push(contourPositions[i].x*cvutils.imageScale)
      allPositions[colorNum][i]['y'].push(contourPositions[i].y*cvutils.imageScale)
      allPositions[colorNum][i]['r'].push(contourPositions[i].r*cvutils.imageScale)
    }
    allPositions[colorNum]["currentNumContours"] = numContoursOverThreshold
  }
  if(!allPositions[colorNum]){
    return allPositions
  }
  // For any existing object histories push -1 to not be drawn later
  for(let i = 0 ;
    i < allPositions[colorNum].length; ++i
  ){
    if(i > contourPositions.length-1){
      allPositions[colorNum][i]['x'].push(-1)
      allPositions[colorNum][i]['y'].push(-1)
      allPositions[colorNum][i]['r'].push(-1)
    }
  }
  contourPositions = null
  return allPositions
}
function trimHistories(positions, trailLength){
  // Trim the position history of each object of each color
  let histories = []
  positions.forEach((colorPositions, colorNum)=>{
    histories[colorNum] = []
    let rejectedBalls = 0
    colorPositions.forEach((history,ballNum)=>{
      //check if object hasn't been detected in a while
      let keepBall = false
      for(let i=0; i < Math.min(trailLength,history['x'].length);++i){
        if(history['x'][i] !== -1){
          keepBall = true
          break
        }
      }
      //exit if object hasn't been detected in a while
      if(!keepBall){
        ++rejectedBalls
        return
      }
      histories[colorNum][ballNum - rejectedBalls] = []

      if(history['x'].length > trailLength){
        //reindex to replace rejected balls in array
        histories[colorNum][ballNum - rejectedBalls]['x'] = history['x'].slice(history['x'].length - 1 - trailLength, history['x'].length)
        histories[colorNum][ballNum - rejectedBalls]['y'] = history['y'].slice(history['y'].length - 1 - trailLength, history['y'].length)
        histories[colorNum][ballNum - rejectedBalls]['r'] = history['r'].slice(history['r'].length - 1 - trailLength, history['r'].length)

      }else{
        histories[colorNum][ballNum - rejectedBalls] = positions[colorNum][ballNum]
      }
    })
  })
  positions = null
  return histories
}
export default { 
  updateBallHistories,
  trimHistories
}
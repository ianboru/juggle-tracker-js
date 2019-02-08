function updateBallHistories(contourPositions, colorNum, allPositions){
  // Maximum number of contours that will be interpreted as objects
  const maxNumContours = 15
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
      allPositions[colorNum][i]['x'].push(contourPositions[i].x)
      allPositions[colorNum][i]['y'].push(contourPositions[i].y)
      allPositions[colorNum][i]['r'].push(contourPositions[i].r)
    }
    //allPositions[colorNum] = this.reorderNearestContours(allPositions[colorNum])
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
  return allPositions
}
function trimHistories(positions, trailLength){
  // Trim the position history of each object of each color
  let histories = []
  positions.forEach((colorPositions, colorNum)=>{
    histories[colorNum] = []
    colorPositions.forEach((history,ballNum)=>{
      histories[colorNum][ballNum] = []
      if(history['x'].length > trailLength){
        histories[colorNum][ballNum]['x'] = history['x'].slice(history['x'].length - 1 - trailLength, history['x'].length)
        histories[colorNum][ballNum]['y'] = history['y'].slice(history['y'].length - 1 - trailLength, history['y'].length)
        histories[colorNum][ballNum]['r'] = history['r'].slice(history['r'].length - 1 - trailLength, history['r'].length)
      }else{
        histories[colorNum][ballNum] = positions[colorNum][ballNum]
      }
    })
  })
  return histories
}
export default { 
  updateBallHistories,
  trimHistories
}
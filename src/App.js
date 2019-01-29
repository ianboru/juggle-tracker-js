import React, { Component } from 'react';
import './App.css';
import cv from 'opencv.js';
import utils from './utils'
import { HuePicker } from 'react-color';

//@observer
const initialHSV = {
      lh : 200,
      ls : .2,
      lv : .2,
      hh : 230,
      hs : .9,
      hv : .9,
    }
class App extends Component {

  state = {
    src : null,
    dst : null,
    stream : null,
    streaming : false,
    videoHeight : null,
    videoWidth : null,
    startTime : Date.now(),
    lh : 200,
    ls : .2,
    lv : .2,
    hh : 230,
    hs : .9,
    hv : .9,
    net : null,
    allColors : [{},initialHSV],
    colorNum : 1,
    positions : [],
    totalNumColors : 1,
    showRaw : true,
    trailLength : 1,
    showConnections : false,
    showStars     : false,
    mediaRecorder : null,
    recordedBlobs : null,
    visiblePlayer : "live",
    canvasStream : null,
    showTrails : true,
    starsX     : [],
    starsY     : [],
    starsDx    : [],
    starsDy    : [],
    starsSize  : [],
  }

  componentDidMount=()=>{
    this.startCamera()
    const downloadButton = document.querySelector('button#download');
    downloadButton.disabled = true
    document.title = "AR Flow Arts"
  }
  /****
  Camera Stuff
  ****/
  startCamera=()=> {
    let that = this

    if (this.state.streaming) return;

    //get video 
    navigator.mediaDevices.getUserMedia({video: {faceingMode : 'user', width:320,height:240}, audio: false})
    .then(function(s) {
      console.log("got user media")
      //Set stream to stop later
      that.setState({
        stream : s,
      })
      //Set stream to video tag
      that.video.srcObject = s;
      that.video.play();
    })
    .catch(function(err) {
      console.log("An error occured! " + err);
    });

    this.video.addEventListener("canplay", function(ev){
      if (!that.state.streaming) {
        let videoWidth = that.video.videoWidth;
        let videoHeight = that.video.videoHeight;
        that.video.setAttribute("width", videoWidth);
        that.video.setAttribute("height", videoHeight);
        that.canvasOutput.width = videoWidth;
        that.canvasOutput.height = videoHeight;
        that.setState({
          videoWidth,
          videoHeight,
          streaming : true,
        })
      }
      that.startVideoProcessing();
    }, false);
  }
  stopCamera=()=> {
    if (!this.state.streaming) return;
    this.stopVideoProcessing();
    document.getElementById("canvasOutput").getContext("2d").clearRect(0, 0, this.state.videoWidth, this.state.videoHeight);
    this.video.pause();
    this.video.srcObject=null;
    this.state.stream.getVideoTracks()[0].stop();
    this.setState({
      streaming :false,
    })

  }
  startVideoProcessing=()=> {
    const context = document.getElementById("canvasOutput").getContext("2d")
    this.setState({
      canvasStream : this.canvasOutput.captureStream()
    })
    if (!this.state.streaming) { console.warn("Please startup your webcam"); return; }
    this.stopVideoProcessing();
    requestAnimationFrame(this.processVideo);
  }

  stopVideoProcessing = () =>{
    let src = this.state.src
    if (src != null && !src.isDeleted()) src.delete();

  }

  /****
  Recording Stuff
  ****/
 handleDataAvailable=(event)=>{
    let recordedBlobs = this.state.recordedBlobs
    if (event.data && event.data.size > 0) {
      recordedBlobs.push(event.data);
      this.setState({
        recordedBlobs
      })
    }
  }

  handleStopMediaRecorder=(event)=>{
    console.log('Recorder stopped: ', event);
    const superBuffer = new Blob(this.state.recordedBlobs, {type: 'video/webm'});
    this.recordedVideo.src = window.URL.createObjectURL(superBuffer);
    
  }

  toggleRecording=()=>{
    const recordButton = document.querySelector('button#record');
    const downloadButton = document.querySelector('button#download');
    if (recordButton.textContent === 'Start Recording') {
      if(!this.state.streaming){
        this.startCamera()
      }
      this.recordedVideo.hidden = true
      this.canvasOutput.hidden = false
      this.canvasOutput.style.display = "inline"
      this.startRecording();
    } else {
      this.stopRecording();
      this.stopCamera();
      this.recordedVideo.controls = true
      this.recordedVideo.hidden = false
      this.canvasOutput.style.display = "none"
      recordButton.textContent = 'Start Recording';
      downloadButton.disabled = false;
    }
  }

  // The nested try blocks will be simplified when Chrome 47 moves to Stable
  startRecording=()=>{
    this.recordedVideo.hidden = true
    
    let options = {mimeType: 'video/webm;codecs=h264'};
    this.setState({
      recordedBlobs : []
    })
    let mediaRecorder
    if(!this.state.canvasStream){
      alert('video not running');
      console.error('Exception while creating MediaRecorder:');
      return
    }
    try {
      mediaRecorder = new MediaRecorder(this.state.canvasStream, options);
    } catch (e0) {
      console.log('Unable to create MediaRecorder with options Object: ', e0);
      try {
        options = {mimeType: 'video/webm,codecs=vp9'};
        mediaRecorder = new MediaRecorder(this.state.canvasStream, options);
      } catch (e1) {
        console.log('Unable to create MediaRecorder with options Object: ', e1);
        try {
          options = 'video/vp8'; // Chrome 47
          mediaRecorder = new MediaRecorder(this.state.canvasStream, options);
        } catch (e2) {
          alert('MediaRecorder is not supported by this browser.\n\n' +
            'Try Firefox 29 or later, or Chrome 47 or later, ' +
            'with Enable experimental Web Platform features enabled from chrome://flags.');
          console.error('Exception while creating MediaRecorder:', e2);
          return;
        }
      }
    }
    const recordButton = document.querySelector('button#record');
    const downloadButton = document.querySelector('button#download');

    recordButton.textContent = 'Stop Recording';
    downloadButton.disabled = true;
    mediaRecorder.onstop = this.handleStopMediaRecorder;
    mediaRecorder.ondataavailable = this.handleDataAvailable;
    mediaRecorder.start(100); // collect 100ms of data
    this.setState({
        mediaRecorder
      })
  }
  stopRecording=()=>{
    const mediaRecorder = this.state.mediaRecorder
    mediaRecorder.stop()
    this.setState({
      mediaRecorder,
    })
  }

  
  download=()=>{
    const blob = new Blob(this.state.recordedBlobs, {type: 'video/webm'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'test.webm';
    document.body.appendChild(a);

    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }


  /****
    CV STUFF
  ****/
   processVideo=()=> {
    if(this.canvasOutput){
      let srcMat = new cv.Mat(this.state.videoHeight, this.state.videoWidth, cv.CV_8UC4);
      const context = document.getElementById("canvasOutput").getContext("2d")
      //Draw video frame onto canvas context
      context.drawImage(this.video, 0, 0, this.state.videoWidth, this.state.videoHeight);
      //Extra image data from canvas context
      let imageData = context.getImageData(0, 0, this.state.videoWidth, this.state.videoHeight);
      srcMat.data.set(imageData.data);
      //Flip horizontally because camera feed is pre-flipped
      cv.flip(srcMat, srcMat,1)
      //Filters by color AND tracks ball positions by color

      let combinedColorMat = this.colorFilter(srcMat.clone())

      if(this.state.showRaw){
        // Initialize final canvas with raw video
        cv.imshow('canvasOutput',srcMat)
      }else{
        // Initialize final canvas with the mask of the colors within the color ranges
        // This setting is used when calibrating the colors
        cv.imshow('canvasOutput',combinedColorMat)
      }

      //Draw balls and trails
      this.drawTrails(context)

      //Draw lines between balls of same color
      this.drawConnections(context)

      this.drawStars(context)
      //Trim histories to trail length
      this.trimHistories()

      //Clean up all possible data
      combinedColorMat.delete();srcMat.delete()
      srcMat = null; combinedColorMat = null
      imageData = null

      //Process next frame
      requestAnimationFrame(this.processVideo);
    }
  }


  trackBall=(src,colorNum)=>{
    //src is a frame filtered for the current color
    const sizeThreshold = 60
    const maxNumContours = 15
    let allPositions = this.state.positions
    //Used to know how many contours to connect later
    let numContoursOverThreshold = 0
    //initialize contour finding data
    let dst = cv.Mat.zeros(this.state.videoHeight, this.state.videoWidth, cv.CV_8UC4);
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    //find contours
    cv.findContours(src, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_NONE);
    //sort contours by size
    const sortedContourIndices = utils.sortContours(contours)

    //Catalogue the contour locations to draw later
    if(sortedContourIndices.length > 0){
      
      //initialize for the first contours
      if(!allPositions[colorNum]){
        allPositions[colorNum] = []
      }
      let lastX
      let lastR
      for(let i = 0; i < Math.min(sortedContourIndices.length, maxNumContours); ++i){
        const contour = contours.get(sortedContourIndices[i])
        const contourArea = cv.contourArea(contour)
        let x; let y; let r
        //Check if contour is big enough to be a real object
        if(contourArea < sizeThreshold && this.state.positions[colorNum][i]){
          //If it is not big enough but an the current object has a history 
          //then use -1 so this object isnt drawn for this frame and the history can continue 
          x = -1; y = -1; r = -1 
        }else if (contourArea < sizeThreshold && !this.state.positions[colorNum][i]){
          //If it is not big enough and the current object hasn't been seen yet then throw it away
          continue
        }else{
          const circle = cv.minEnclosingCircle(contour)

          x = circle.center.x
          y = circle.center.y
          r = circle.radius
          //Find circle that encloses contour
        
          ++numContoursOverThreshold
        }
        

        //Initialize current object
        if(!allPositions[colorNum][i]){
          allPositions[colorNum][i]={
            'x':[],
            'y':[],
            'r':[]
          }
        }
        //Add latest coordinates to history
        allPositions[colorNum][i]['x'].push(x)
        allPositions[colorNum][i]['y'].push(y)
        allPositions[colorNum][i]['r'].push(r)
        lastX = x
        lastR = r 
      }
      allPositions[colorNum]["currentNumContours"] = numContoursOverThreshold
    }else if( sortedContourIndices.length == 0 && this.state.positions[colorNum]){
      // For any existing object histories push -1 to not be drawn later
      for(let i = 0; i < this.state.positions[colorNum].length; ++i){
        allPositions[colorNum][i]['x'].push(-1)
        allPositions[colorNum][i]['y'].push(-1)
        allPositions[colorNum][i]['r'].push(-1)
      }
    }
    
    // Update position histories
    this.setState({
      positions : allPositions
    })
    // Cleanup open cv objects
    src.delete();dst.delete(); contours.delete(); hierarchy.delete();
  }
  trimHistories=()=>{
    // Trim the position history of each object of each color
    let histories = []
    this.state.positions.forEach((colorPositions, colorNum)=>{
      histories[colorNum] = []
      colorPositions.forEach((history,ballNum)=>{
        histories[colorNum][ballNum] = []
        if(history['x'].length > this.state.trailLength){
          histories[colorNum][ballNum]['x'] = history['x'].slice(history['x'].length - 1 - this.state.trailLength, history['x'].length)
          histories[colorNum][ballNum]['y'] = history['y'].slice(history['y'].length - 1 - this.state.trailLength, history['y'].length)
          histories[colorNum][ballNum]['r'] = history['r'].slice(history['r'].length - 1 - this.state.trailLength, history['r'].length)
        }else{
          histories[colorNum][ballNum] = this.state.positions[colorNum][ballNum]
        }
      })
    })
    // Update state
    this.setState({
      positions : histories
    })
    histories = null
  }
// Function that draws stars
drawStars = (context)=>{
  if(!this.state.showStars){
    return
  }
  // Create some temporary lists
  let newStarsX = []
  let newStarsY = []
  let newStarsDx = []
  let newStarsDy = []
  let newStarsSize = []

  const numStarsPerObject = 10
  // Get the positions of the balls in this frame and create stars around them
  this.state.allColors.forEach((ballColors,colorNum)=>{
    // If data exists for this object, proceed
    if(this.state.positions[colorNum]){
      // Iterate though each contour for this color
      for(let i = 0; i < this.state.positions[colorNum].currentNumContours; ++i){
        // If this a contour in this colorNum exists, proceed
        if(this.state.positions[colorNum][i]){
          // Get the x and y values
          const x = this.state.positions[colorNum][i]['x'].slice(-1).pop()
          const y = this.state.positions[colorNum][i]['y'].slice(-1).pop()
          // Create some stars
          for (let numStars=0; numStars<numStarsPerObject; numStars++){
            // A star is born!
            newStarsX.push(x + (30-Math.random()*30)) // Around the xy coordinate
            newStarsY.push(y + (30-Math.random()*30))
            newStarsDx.push(1-2*Math.random()) // With a random velocity
            newStarsDy.push(1-2*Math.random())
            newStarsSize.push(4 + Math.random()*2) // And a random size
          }
        }
      }
    }
  })

  // Add the old stars to the list of new stars
  for (let i=0; i<this.state.starsX.length; i++){
    // Has the star burned out?
    if (this.state.starsSize[i]-.2>1){
      // The star needs to move. x and y change by dx and dy
      newStarsX.push(this.state.starsX[i]+this.state.starsDx[i])
      newStarsY.push(this.state.starsY[i]+this.state.starsDy[i])
      // Save the dx, dy. They remain constant
      newStarsDx.push(this.state.starsDx[i])
      newStarsDy.push(this.state.starsDy[i])
      // The star get smaller
      newStarsSize.push(this.state.starsSize[i]-.2)
    }
  }
  //console.log(newStarsX)
  console.log("lengths" ,this.state.starsX.length,this.state.starsY.length)
  this.setState({
    starsX : newStarsX,
    starsY : newStarsY,
    starsDx : newStarsDx,
    starsDy : newStarsDy,
    starsSize : newStarsSize
  })

  for (let i=0; i< newStarsX.length; i++){
    const x = newStarsX[i]
    const y = newStarsY[i]
    const size = newStarsSize[i]
    if(size>0){
      const randomColor = '#'+Math.floor(Math.random()*16777215).toString(16);
      this.drawCircle(context,x,y,size,randomColor)
    }
  }
}
  drawCircle = (context, x,y,r, color)=>{
    //Draw circle for coordinate and color
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
    context.strokeStyle = color;
    context.stroke();
  }

  drawTrails =(context)=>{
    //Draw circle and trail
    this.state.allColors.forEach((ballColors,colorNum)=>{
      if(this.state.positions[colorNum]){
        
        for(let i = 0; i < this.state.positions[colorNum].length; ++i){
          //Don't draw if x oordinate is -1 
          if(this.state.positions[colorNum][i] && this.state.positions[colorNum][i]['x'] != -1 ){
            //Rename for convenience 
            const xHistory = this.state.positions[colorNum][i]['x']
            const yHistory = this.state.positions[colorNum][i]['y']
            const rHistory = this.state.positions[colorNum][i]['r']

            //Don't draw a trail longer than the window 
            const maxWindowSize = this.state.trailLength
            let currentWindowSize  = Math.min(xHistory.length, maxWindowSize)
            //Draw circle and trail
            for (let t=0; t < currentWindowSize; ++t){
              //At least draw the ball itself
              if(!this.state.showTrails && t > 0){
                return
              }
              if(xHistory[xHistory.length - 1 - t] > -1 && xHistory[xHistory.length - 1 - t] != -1 ){

                //Look backwards in history stepping by t
                const lastX = xHistory[xHistory.length - 1 - t]
                const lastY = yHistory[yHistory.length - 1 - t]
                const lastR = rHistory[rHistory.length - 1 - t]
                const color = utils.calculateCurrentHSVString(ballColors,(1-(t/currentWindowSize)))
                console.log("trail colors", color)
                this.drawCircle(context,lastX, lastY, lastR*(1-(t/currentWindowSize)), color)
              }
            }
          }
        }
      }
    })
  }
  drawConnections=(context)=>{
    //Draw connection between balls of same color 
    if(!this.state.showConnections){
      return
    }
    this.state.allColors.forEach((ballColors,colorNum)=>{
      //Check if no there is an object history for this color
      if(!this.state.positions[colorNum]){
        return
      }
      //Draw connection between currentNumContours contours
      const numObjects = this.state.positions[colorNum].currentNumContours
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
            this.state.positions[colorNum][i] && this.state.positions[colorNum][i]['x'].slice(-1).pop() != -1 && 
            this.state.positions[colorNum][nextBallIndex] && this.state.positions[colorNum][nextBallIndex]['x'].slice(-1).pop() != -1
          ){
            const curBallX = this.state.positions[colorNum][i]['x'].slice(-1).pop()
            const curBallY = this.state.positions[colorNum][i]['y'].slice(-1).pop()

            const nextBallX = this.state.positions[colorNum][nextBallIndex]['x'].slice(-1).pop()
            const nextBallY = this.state.positions[colorNum][nextBallIndex]['y'].slice(-1).pop()
            context.beginPath();
            context.moveTo(curBallX, curBallY)
            context.lineTo(nextBallX, nextBallY)
            context.strokeStyle = utils.calculateCurrentHSVString(ballColors, 1);
            context.lineWidth = 4;
            context.stroke();
          }
        }
      }
    })
  }

  colorFilter=(src)=>{
    let dst = new cv.Mat();

    // Create a two new mat objects for the image in different color spaces
    let temp = new cv.Mat();
    let hsv = new cv.Mat();

    this.state.allColors.forEach((colorRange,colorNum)=>{
      if(colorNum > 0){

        // Convert the RGBA source image to RGB
        cv.cvtColor(src, temp, cv.COLOR_RGBA2RGB)

        // Blur the temporary image
        let ksize = new cv.Size(11,11);
        let anchor = new cv.Point(-1, -1);
        cv.blur(temp, temp, ksize, anchor, cv.BORDER_DEFAULT);

        // Convert the RGB temporary image to HSV
        cv.cvtColor(temp, hsv, cv.COLOR_RGB2HSV)
        // Get values for the color ranges from the trackbars

        let lowerHSV = utils.htmlToOpenCVHSV([colorRange.lh, colorRange.ls, colorRange.lv])
        lowerHSV.push(0)
        let higherHSV = utils.htmlToOpenCVHSV([colorRange.hh, colorRange.hs, colorRange.hv])
        higherHSV.push(255)

        // Create the new mat objects that are the lower and upper ranges of the color
        let low = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), lowerHSV);
        let high = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), higherHSV);

        // Find the colors that are within (low, high)
        cv.inRange(hsv, low, high, dst);

        // Track the balls - arguments: mask image, and number of balls
        this.trackBall(dst.clone(),colorNum)

        low.delete();high.delete();
      }
    })
    src.delete();temp.delete();hsv.delete();
    return dst
  }

  handleHSVSliderChange=(e)=>{
    let state = this.state
    state[e.target.name] =parseFloat(e.target.value)
    this.setState({
      state
    },()=>{
      this.setColorRange()
    })
  }
  setColorRange=()=>{
    let colorRanges = this.state.allColors
    colorRanges[this.state.colorNum] = {
      'lh' : this.state.lh,
      'ls' : this.state.ls,
      'lv' : this.state.lv,
      'hh' : this.state.hh,
      'hs' : this.state.hs,
      'hv' : this.state.hv,
    }
    this.setState({
      allColors : colorRanges,
      pickedColor : utils.calculateCurrentHSV(colorRanges[this.state.colorNum])

    })
  }

  addColor=()=>{
    this.setColorRange()
    let colorNum = this.state.allColors.length

    this.setState(initialHSV)
    this.setState({
      colorNum
    },()=>{
      this.setColorRange()
    })
  }
  selectColor=(i)=>{
    this.setState(this.state.allColors[i])
    this.setState({
      colorNum : i
    },()=>{
      this.setColorRange()
    }) 
  }
  toggleShowRaw=()=>{
    this.setState({
      showRaw : !this.state.showRaw
    })
  }
  handleTrailLength=(e)=>{
    this.setState({
      trailLength : e.target.value
    })
  }
  toggleShowConnections=()=>{
    this.setState({
      showConnections : !this.state.showConnections
    })
  }
  toggleShowStars=()=>{
    this.setState({
      showStars : !this.state.showStars
    })
  }
  toggleShowTrails=()=>{
    this.setState({
      showTrails : !this.state.showTrails
    },()=>{
      const slider = document.getElementById("trailSlider")
      slider.hidden = !this.state.showTrails

    })
  }
  handleChangeComplete = (color) => {
    this.setState({ pickedColor: color.hsv });
    let colorRanges = this.state.allColors
    const hRange = 30
    let lowH = Math.max(Math.round(color.hsv.h) - hRange, 0)
    let highH = Math.min(Math.round(color.hsv.h) + hRange, 360)

    colorRanges[this.state.colorNum]['hh'] = highH
    colorRanges[this.state.colorNum]['lh'] = lowH

    this.setState({
      allColors : colorRanges,
      'hh' : highH,
      'lh' : lowH,
    })
  };
  render() {

    const sliders =
        <div style={{"paddingTop": "15px"}} className="sliders">
          <h3>Adjust Color Range</h3>
          <div style={{"width": "80px", "display" :"inline-block"}} >Hue</div><input style={{"width": "30px", "marginRight" : "10px", "marginLeft" : "10px"}} value={this.state.lh}/><label>min</label><input name="lh" type="range" min={0} max={360} step={1} value={this.state.lh} onChange={this.handleHSVSliderChange}/>
          <input style={{"width": "30px", "marginRight" : "10px", "marginLeft" : "10px"}} value={this.state.hh}/><label>max</label><input name="hh" type="range" min={0} max={360} step={1} value={this.state.hh} onChange={this.handleHSVSliderChange}/>
          <br/>
          <br/>
          <div style={{"width": "80px", "display" :"inline-block"}} >Saturation</div><input style={{"width": "30px", "marginRight" : "10px", "marginLeft" : "10px"}} value={this.state.ls}/><label>min</label><input name="ls" type="range" min={0} max={1} step={.01} value={this.state.ls} onChange={this.handleHSVSliderChange}/>
          <input style={{"width": "30px", "marginRight" : "10px", "marginLeft" : "10px"}} value={this.state.hs}/><label>max</label><input name="hs" type="range" min={0} max={1} step={.01} value={this.state.hs} onChange={this.handleHSVSliderChange}/>
          <br/>
          <br/>
          <div style={{"width": "80px", "display" :"inline-block"}} >Value</div><input style={{"width": "30px", "marginRight" : "10px", "marginLeft" : "10px"}} value={this.state.lv}/><label>min</label><input name="lv" type="range" min={0} max={1} step={.01} value={this.state.lv} onChange={this.handleHSVSliderChange}/>
          <input style={{"width": "30px", "marginRight" : "10px", "marginLeft" : "10px"}} value={this.state.hv}/><label>max</label><input name="hv" type="range" min={0} max={1} step={.01} value={this.state.hv} onChange={this.handleHSVSliderChange}/>
        </div> 

    const colorSwatches = this.state.allColors.map((colorRange,index)=>{
      if(index > 0){
        return(
          <div 
            onClick={()=>{this.selectColor(index)}} 
            style={{ 
              'marginRight': '20px', 
              'display':'inline-block',
              'backgroundColor' : utils.calculateCurrentHSVString(colorRange,1), 
              'width' : '50px',
              'height' : '50px',
              'left' : '0',
              'position' : 'relative'
            }}>
          </div>
        )
      }
      
    })

    const videoControls = 
      <div>
        <h3>Video Controls</h3>
        <div style={{'marginBottom' :'10px'}}>
          <button style={{'fontSize':'12pt'}} id="record" onClick={this.toggleRecording}>Start Recording</button>
          <button style={{'fontSize':'12pt'}} onClick={this.toggleShowRaw}>Filtered/Raw Video</button>       
          <button style={{'fontSize':'12pt'}} id="download" onClick={this.download} >Download</button>
        </div>
        <video hidden={true} ref={ref => this.recordedVideo = ref} id="recorded" playsInline ></video>
      </div>

    const animationControls = 
      <div>
        <h3>Animation Controls</h3>
        <button style={{'fontSize':'12pt', 'marginBottom' : '10px'}} onClick={this.toggleShowConnections}>Connect Same Colors</button>
        <button style={{'fontSize':'12pt', 'marginBottom' : '10px'}} onClick={this.toggleShowTrails}>Show Trails</button>
        <button style={{'fontSize':'12pt', 'marginBottom' : '10px'}} onClick={this.toggleShowStars}>Show Stars</button>
        <br/>
        <div hidden={false} id="trailSlider">
          <input style={{ "marginRight" : "10px", "width" : "30px"}} value={this.state.trailLength}/><label>Trail Length</label>
          <input  name="ls" type="range" min={0} max={20} value={this.state.trailLength} onChange={this.handleTrailLength}/>
        </div>
        <video hidden={true} width={320} height={240} muted playsInline autoPlay className="invisible" ref={ref => this.video = ref}></video>
      </div>


    return (
      <div className="App" >
        {videoControls}
        <canvas ref={ref => this.canvasOutput = ref}  className="center-block" id="canvasOutput" width={320} height={240}></canvas>
        <h3 style={{'fontSize':'12pt'}}>Choose Colors to Animate</h3>
        <div 
          style={{
            width : '350px',
            margin : '0 auto',
            marginBottom : '10px',
          }}
         >
          {colorSwatches}
        </div>
        
        <button style={{'fontSize':'12pt'}} onClick={this.addColor}>Add Another Color</button>
        <br/>
        <br/>
        <div 
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',

          }}
         >
          <HuePicker
            color={ this.state.pickedColor }
            onChangeComplete={ this.handleChangeComplete }
          />
        </div>
        {sliders}
        {animationControls}
      </div>
    );
  }
}
//<Terminal watchConsoleLogging />

export default App;


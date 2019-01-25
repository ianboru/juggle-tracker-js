import React, { Component } from 'react';
import './App.css';
import cv from 'opencv.js';
import utils from './utils'
import Recorder from './recorder'
import store from "./store"
import { observer } from "mobx-react"

const scoreThreshold = .5

//@observer
class App extends Component {

  state = {
    src : null,
    dst : null,
    stream : null,
    streaming : false,
    videoHeight : null,
    videoWidth : null,
    startTime : Date.now(),
    numObjects : 1,
    lr : 24,
    lg : 75,
    lb : 160,
    hr : 45,
    hg : 255,
    hb : 255,
    net : null,
    allColors : [{},{
      numObjects : 1,
      lr : 24,
      lg : 75,
      lb : 160,
      hr : 45,
      hg : 255,
      hb : 255,
    }],
    colorNum : 3,
    calibrating : true,
    positions : [],
    totalNumColors : 1,
    showRaw : true,
    tailLength : 1,
    connectSameColor : false,
    mediaRecorder : null,
    recordedBlobs : null,
    mediaSource : new MediaSource(),
    mediaSource : null,
    visiblePlayer : "live",
    canvasStream : null
  }

  componentDidMount=()=>{
    this.startCamera()
  }
  startCamera=()=> {
    let that = this
    if (this.state.streaming) return;

      navigator.mediaDevices.getUserMedia({video: {faceingMode : 'user', width:320, height:240}, audio: false})
        .then(function(s) {

        that.setState({
          stream : s,
        })
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
  startVideoProcessing=()=> {
    //store.setVisiblePlayer("live")
    this.setState({
      canvasStream : this.canvasOutput.captureStream()
    })
    var vidLength = 30 //seconds
    var fps = 24;
    if (!this.state.streaming) { console.warn("Please startup your webcam"); return; }
    this.stopVideoProcessing();
    requestAnimationFrame(this.processVideo);
  }

  stopVideoProcessing = () =>{
    //store.setVisiblePlayer("recorded")
    let src = this.state.src
    if (src != null && !src.isDeleted()) src.delete();

  }

  trackBall=(src,colorNum)=>{
    let allPositions = this.state.positions

    //initialize contour finding data
    let dst = cv.Mat.zeros(this.state.videoHeight, this.state.videoWidth, cv.CV_8UC4);
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(src, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_NONE);

    const sortedContourIndices = utils.sortContours(contours)
    if(sortedContourIndices.length > 0){
      const numObjects = this.state.allColors[colorNum].numObjects
      for(let i = 0; i < Math.min(sortedContourIndices.length, numObjects); ++i){
        const circle = cv.minEnclosingCircle(contours.get(sortedContourIndices[i]))
        if(!allPositions[colorNum]){
          allPositions[colorNum] = []
        }
        if(!allPositions[colorNum][i]){
          allPositions[colorNum][i]={
            'x':[],
            'y':[],
            'r':[]
          }
        }
        allPositions[colorNum][i]['x'].push(circle.center.x)
        allPositions[colorNum][i]['y'].push(circle.center.y)
        allPositions[colorNum][i]['r'].push(circle.radius)
      }

      this.setState({
        positions : allPositions
      })
    }

    src.delete();dst.delete(); contours.delete(); hierarchy.delete();
  }
  
  drawCircle = (context, x,y,r, color)=>{
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
    context.strokeStyle = color;
    context.stroke();
  }
  drawTails =(context)=>{
    let ballNum = 0
    this.state.allColors.forEach((ballColors,colorNum)=>{
      for(let i = 0; i < ballColors.numObjects; ++i){
        if(!this.state.positions[colorNum]){
          continue
        }
        if(this.state.positions[colorNum][i]){
          const xHistory = this.state.positions[colorNum][i]['x']
          const yHistory = this.state.positions[colorNum][i]['y']
          const rHistory = this.state.positions[colorNum][i]['r']

          const maxWindowSize = this.state.tailLength
          let currentWindowSize
          if(this.state.connectSameColor){
            currentWindowSize = 1
          }else{
            currentWindowSize = Math.min(xHistory.length, maxWindowSize)
          }
          for (let t=0; t < currentWindowSize; ++t){
            const lastX = xHistory[xHistory.length - 1 - t]
            const lastY = yHistory[yHistory.length - 1 - t]
            const lastR = rHistory[rHistory.length - 1 - t]
            const color = utils.calculateCurrentColor(ballColors,(1-(t/currentWindowSize)))
            this.drawCircle(context,lastX, lastY, lastR*(1-(t/currentWindowSize)), color)
          }
        }
        ballNum += 1
      }
    })
  }
  drawConnections=(context)=>{
    let ballNum = 0
    this.state.allColors.forEach((ballColors,colorNum)=>{
      if(!this.state.positions[colorNum]){
        return
      }
      if(ballColors.numObjects > 1){
        for(let i = 0; i < ballColors.numObjects; ++i){
          let nextBallIndex = i+1
          if(i == ballColors.numObjects-1){
            nextBallIndex = 0
          }
          if(this.state.positions[colorNum][i] && this.state.positions[colorNum][nextBallIndex]){
            const curBallX = this.state.positions[colorNum][i]['x'][this.state.positions[colorNum][i]['x'].length-1]
            const curBallY = this.state.positions[colorNum][i]['y'][this.state.positions[colorNum][i]['y'].length-1]

            const nextBallX = this.state.positions[colorNum][nextBallIndex]['x'][this.state.positions[colorNum][nextBallIndex]['x'].length-1]
            const nextBallY = this.state.positions[colorNum][nextBallIndex]['y'][this.state.positions[colorNum][nextBallIndex]['y'].length-1]

            context.beginPath();
            context.moveTo(curBallX, curBallY)
            context.lineTo(nextBallX, nextBallY)
            context.strokeStyle = utils.calculateCurrentColor(ballColors, 1);
            context.lineWidth = 4;
            context.stroke();
          }
          ++ballNum
        }
      }
    })
  }


  colorFilter=(src)=>{
    let previousDst
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
        let lower = [colorRange.lr, colorRange.lg, colorRange.lb,0];
        let higher = [colorRange.hr, colorRange.hg, colorRange.hb,255];

        // Create the new mat objects that are the lower and upper ranges of the color
        let low = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), lower);
        let high = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), higher);

        // Find the colors that are within (low, high)
        cv.inRange(hsv, low, high, dst);

        // Track the balls - arguments: mask image, and number of balls
        this.trackBall(dst.clone(),colorNum)

        //let kernel = cv.Mat.ones(5, 5, cv.CV_8U);
        //cv.dilate(dst,dst,kernel)

        /*if(previousDst){
          cv.add(dst,previousDst,dst)
          previousDst.delete()
        }*/
        previousDst = dst.clone()
        //kernel.delete();
        low.delete();high.delete();
      }
    })
    src.delete();temp.delete();hsv.delete();
    return dst
  }
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
      const combinedColorMat = this.colorFilter(srcMat.clone())

      if(this.state.showRaw){
        // Initialize final canvas with raw video
        cv.imshow('canvasOutput',srcMat)
      }else{
        // Initialize final canvas with the mask of the colors within the color ranges
        // This setting is used when calibrating the colors
        cv.imshow('canvasOutput',this.colorFilter(srcMat.clone()))
      }

      //Draw balls and tails
      this.drawTails(context)


      //Draw lines between balls of same color
      if(this.state.connectSameColor){
        this.drawConnections(context)
      }

      //Trim histories to tail length
      this.trimHistories()

      //Clean up all possible data
      combinedColorMat.delete();srcMat.delete()
      imageData = null

      //Process next frame
      requestAnimationFrame(this.processVideo);
    }
  }
  handleColorNum=(e)=>{
    if(e.target.value < 0){
      return
    }
    this.setState({
      colorNum : parseInt(e.target.value)
    })
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

  handleRGBChange=(e)=>{
    let state = this.state
    state[e.target.name] =parseInt(e.target.value)
    this.setState({
      state
    },()=>{
      this.setColorRange()
    })
  }
  setColorRange=()=>{
    let colorRanges = this.state.allColors
    colorRanges[this.state.colorNum] = {
      'numObjects' : parseInt(this.state.numObjects),
      'lr' : this.state.lr,
      'lg' : this.state.lg,
      'lb' : this.state.lb,
      'hr' : this.state.hr,
      'hg' : this.state.hg,
      'hb' : this.state.hb,
    }
    console.log("setting color range", colorRanges)
    this.setState({
      allColors : colorRanges
    })
  }
  setColorPreset=(e)=>{
    console.log("setting color" , this.state.allColors)

    let tempState = this.state
    let color = {}
    let colorRanges = this.state.allColors

    console.log("color ranges" , this.state.allColors, tempState.allColors)
    console.log(this.state.colorNum)
    let numObjects = colorRanges[this.state.colorNum].numObjects

    if(e.target.name == "red"){
      colorRanges[this.state.colorNum] = utils.red
      color = utils.red
    }else if(e.target.name == "green"){
      colorRanges[this.state.colorNum] = utils.green
      color = utils.green
    }else if(e.target.name == "blue"){
      colorRanges[this.state.colorNum] = utils.blue
      color = utils.blue
    }else if(e.target.name == "white"){
      colorRanges[this.state.colorNum] = utils.white
      color = utils.white
    }
    colorRanges[this.state.colorNum].numObjects = numObjects
    tempState.allColors = colorRanges
    console.log("final state", tempState.allColors)

    tempState = Object.assign(tempState, color);
    this.setState(
      tempState
    )
  }
  nextColor=()=>{
    this.setColorRange()
    let colorNum = this.state.colorNum
    console.log(this.state.totalNumColors, colorNum,colorNum%this.state.totalNumColors+1 )
    if(colorNum%this.state.totalNumColors == 0 ){
      colorNum = 1
    }else{
      colorNum += 1
    }

    console.log("next color ", colorNum,this.state.allColors  )
    if(this.state.allColors[colorNum]){
      this.setState({
        colorNum,
        numObjects : this.state.allColors[colorNum].numObjects,
        lr : this.state.allColors[colorNum]['lr'],
        lg : this.state.allColors[colorNum]['lg'],
        lb : this.state.allColors[colorNum]['lb'],
        hr : this.state.allColors[colorNum]['hr'],
        hg : this.state.allColors[colorNum]['hg'],
        hb : this.state.allColors[colorNum]['hb'],
      })
    }else{
      this.setState({
        numObjects : 1,
        colorNum
      },()=>{
        this.setColorRange()
      })
    }
  }
  toggleShowRaw=()=>{
    this.setState({
      showRaw : !this.state.showRaw
    })
  }
  trimHistories=()=>{
    let histories = []

    this.state.positions.forEach((colorPositions, colorNum)=>{
      histories[colorNum] = []
      colorPositions.forEach((history,ballNum)=>{
        histories[colorNum][ballNum] = []
        if(history['x'].length > this.state.tailLength){
          histories[colorNum][ballNum]['x'] = history['x'].slice(history['x'].length - 1 - this.state.tailLength, history['x'].length)
          histories[colorNum][ballNum]['y'] = history['y'].slice(history['y'].length - 1 - this.state.tailLength, history['y'].length)
          histories[colorNum][ballNum]['r'] = history['r'].slice(history['r'].length - 1 - this.state.tailLength, history['r'].length)
        }else{
          histories[colorNum][ballNum] = this.state.positions[colorNum][ballNum]
        }
      })
    })

    this.setState({
      positions : histories
    })
    histories = null
  }
  handleNumObjects=(e)=>{
    console.log("num objects", e.target.value)
    this.setState({
      numObjects : e.target.value
    },()=>{
      this.setColorRange()
    })
  }
  handleTotalNumColors=(e)=>{
    this.setState({
      totalNumColors : e.target.value
    })
  }
  handleTailLength=(e)=>{
    this.setState({
      tailLength : e.target.value
    })
  }
  toggleConnectSameColor=()=>{
    console.log("changing connect", this.state.connectSameColor, this.state.positions)
    this.setState({
      connectSameColor : !this.state.connectSameColor
    })
  }

  handleDataAvailable=(event)=>{
    let recordedBlobs = this.state.recordedBlobs
    if (event.data && event.data.size > 0) {
      recordedBlobs.push(event.data);
      this.setState({
        recordedBlobs
      })
    }
  }

  handleStop=(event)=>{
    console.log('Recorder stopped: ', event);
    const superBuffer = new Blob(this.state.recordedBlobs, {type: 'video/webm'});
    this.recordedVideo.src = window.URL.createObjectURL(superBuffer);

  }

  toggleRecording=()=>{
    const recordButton = document.querySelector('button#record');
    const downloadButton = document.querySelector('button#download');
    console.log("first",recordButton.textContent,this.canvasOutput.display , this.canvasOutput.hidden )
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
    console.log("second", recordButton.textContent,this.canvasOutput.display , this.canvasOutput.hidden )

  }

  // The nested try blocks will be simplified when Chrome 47 moves to Stable
  startRecording=()=>{
    this.recordedVideo.hidden = true
    
    let options = {mimeType: 'video/webm'};
    this.setState({
      recordedBlobs : []
    })
    let mediaRecorder
    console.log(this.state.canvasStream)
    if(!this.state.canvasStream){
      alert('video not running');
          console.error('Exception while creating MediaRecorder:');
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
    console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
    const recordButton = document.querySelector('button#record');
    const downloadButton = document.querySelector('button#download');

    recordButton.textContent = 'Stop Recording';
    downloadButton.disabled = true;
    mediaRecorder.onstop = this.handleStop;
    mediaRecorder.ondataavailable = this.handleDataAvailable;
    mediaRecorder.start(100); // collect 100ms of data
    this.setState({
        mediaRecorder
      })
    console.log('MediaRecorder started', mediaRecorder);
  }
  stopRecording=()=>{
    const mediaRecorder = this.state.mediaRecorder
    mediaRecorder.stop()
    this.setState({
      mediaRecorder,
    })
  }

  
  download=()=>{
    console.log("clicked download ")
    const blob = new Blob(this.state.recordedBlobs, {type: 'video/webm'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'test.webm';
    document.body.appendChild(a);
    console.log("a",a)

    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }
  render() {

    const sliders =
        this.state.calibrating ?
        <div className="sliders">
          <label>Color Number</label><input type="input" value={this.state.colorNum} onChange={this.handleColorNum}/>
          <button onClick={this.nextColor}>Next Color</button>
          <br/>
          <label>Number of Objects for this Color</label><input type="number" value={this.state.numObjects} onChange={this.handleNumObjects}/>
          <br/>
          <h3>Preset Colors</h3>
          <button style={{"backgroundColor":'red', 'color': 'white','fontSize':'12pt'}} name="red" onClick={this.setColorPreset}>Red</button>
          <button style={{"backgroundColor":'green', 'color': 'white','fontSize':'12pt'}} name="green" onClick={this.setColorPreset}>Green</button>
          <button style={{"backgroundColor":'blue', 'color': 'white','fontSize':'12pt'}} name="blue" onClick={this.setColorPreset}>Blue</button>
          <button style={{"backgroundColor":'white', 'color': 'black','fontSize':'12pt'}} name="white" onClick={this.setColorPreset}>White</button>

          <br/>
          <h3>Adjust Colors</h3>
          <span style={{"margin": "10px","border": "1px solid black"}}>{this.state.lr}</span><label>Low R</label><input name="lr" type="range" min={0} max={255} value={this.state.lr} onChange={this.handleRGBChange}/>
          <span style={{"margin": "10px","border": "1px solid black"}}>{this.state.lg}</span><label>Low G</label><input name="lg" type="range" min={0} max={255} value={this.state.lg} onChange={this.handleRGBChange}/>
          <span style={{"margin": "10px","border": "1px solid black"}}>{this.state.lb}</span><label>Low B</label><input name="lb" type="range" min={0} max={255} value={this.state.lb} onChange={this.handleRGBChange}/>
          <br/>
          <br/>
          <span style={{"margin": "10px","border": "1px solid black"}}>{this.state.hr}</span><label>High R</label><input name="hr" type="range" min={0} max={255} value={this.state.hr} onChange={this.handleRGBChange}/>
          <span style={{"margin": "10px","border": "1px solid black"}}>{this.state.hg}</span><label>High G</label><input name="hg" type="range" min={0} max={255} value={this.state.hg} onChange={this.handleRGBChange}/>
          <span style={{"margin": "10px","border": "1px solid black"}}>{this.state.hb}</span><label>High B</label><input name="hb" type="range" min={0} max={255} value={this.state.hb} onChange={this.handleRGBChange}/>
        </div> : null

    return (
      <div className="App">
        <br/>
        <h1>Video Controls</h1>
        <button style={{'fontSize':'12pt'}} id="record" onClick={this.toggleRecording}>Start Recording</button>
        <button style={{'fontSize':'12pt'}} onClick={this.toggleShowRaw}>Filtered/Raw Video</button>       
        <button style={{'fontSize':'12pt'}} id="download" onClick={this.download} >Download</button>

        <br/>
        <br/>
        
        <canvas display ref={ref => this.canvasOutput = ref}  className="center-block" id="canvasOutput" width={320} height={240}></canvas>
        <br/>
         <canvas ref={ref => this.canvasOutput1 = ref}  className="center-block" id="canvasOutput1" width={320} height={240}></canvas>
         <br/>
        <video hidden={true} ref={ref => this.recordedVideo = ref} id="recorded" playsInline ></video>
        <h1>Animation Controls</h1>
        <button style={{'fontSize':'12pt'}} onClick={this.toggleConnectSameColor}>Connect Same Colors</button>
        <br/>
        <br/>
        <span style={{"margin": "10px","border": "1px solid black"}}>{this.state.tailLength}</span><label>Tail Length</label><input name="lg" type="range" min={0} max={20} value={this.state.tailLength} onChange={this.handleTailLength}/>
        <br/>
        <br/>
         

        <h3>choose color ranges</h3>
        <label>Total Number of Colors</label><input type="number" value={this.state.totalNumColors} onChange={this.handleTotalNumColors}/>

        {sliders}
          
        <video hidden={true} width={320} height={240} muted playsInline autoPlay className="invisible" ref={ref => this.video = ref}></video>
        

      </div>
    );
  }
}

export default App;


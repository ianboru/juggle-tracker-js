import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import cv from 'opencv.js';
import utils from './utils'
class App extends Component {

  state = {
    canvasOutputCtx : null,
    numFrames : 0,
    src : null,
    dst : null,
    vc : null,
    stream : null,
    streaming : false,
    videoHeight : null,
    videoWidth : null,
    srcMat : null,
    net : null,
    startTime : Date.now(),
    lh:0,
    ls:0,
    lv:0,
    hh:255,
    hs:255,
    hv:255,
    allBallColors : [],
    upsideDownMode:false,
    ballNum : 1,
    hsvValues : [],
    calibrating : true,
    positions : [],
    numBalls : 3
  }

  startCamera=()=> {
    let that = this
    if (this.state.streaming) return;
      navigator.mediaDevices.getUserMedia({video: true, audio: false})
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
          videoHeight
        })
        that.setState({
          streaming : true,
        })
      }
      that.startVideoProcessing();
    }, false);
  }
  startVideoProcessing=()=> {
    var vidLength = 30 //seconds
    var fps = 24;
    if (!this.state.streaming) { console.warn("Please startup your webcam"); return; }
    this.stopVideoProcessing();
    let srcMat = new cv.Mat(this.state.videoHeight, this.state.videoWidth, cv.CV_8UC4);
    this.setState({
      srcMat
    })
    requestAnimationFrame(this.processVideo);
  }

  stopVideoProcessing = () =>{
    let src = this.state.src
    if (src != null && !src.isDeleted()) src.delete();

  }
  trackBall=(src)=>{
    const ballNum = this.state.ballNum
    let dst = cv.Mat.zeros(this.state.videoHeight, this.state.videoWidth, cv.CV_8UC4);
    //cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    //cv.threshold(src, src, 255, 0, cv.THRESH_BINARY_INV );//+ cv.THRESH_OTSU
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(src, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_NONE);
    let maxArea = 0
    let largestContourIndex 
    let maxContour
    for (let i = 0; i < contours.size(); ++i) {
      const contour = contours.get(i)
      const area = cv.contourArea(contour, false)
      if(area > maxArea){
        maxArea = area
        largestContourIndex = i
        maxContour = contour
      }
    }
    if(maxContour){
      const circle = cv.minEnclosingCircle(maxContour)
      console.log("circle", circle.center)
      let allPositions = this.state.positions
      if(!allPositions[ballNum]){
        allPositions[ballNum]={
          'x':[],
          'y':[],
          'r':[]
        }
      }
      allPositions[ballNum]['x'].push(circle.center.x)
      allPositions[ballNum]['y'].push(circle.center.y)
      allPositions[ballNum]['r'].push(circle.radius)

      this.setState({
        positions : allPositions
      })
    }
    
    src.delete();dst.delete(); contours.delete(); hierarchy.delete();

    return [dst,src];

  }
  drawTail =(ballNum)=>{
    const xHistory = this.state.positions[ballNum]['x']
    const yHistory = this.state.positions[ballNum]['y']
    const rHistory = this.state.positions[ballNum]['r']

    const maxWindowSize = 10
    const currentWindowSize = Math.min(xHistory.length, maxWindowSize)
    for (let i=0; i < currentWindowSize; ++i){
      const lastX = xHistory[xHistory.length - 1 - i]
      const lastY = yHistory[yHistory.length - 1 - i]
      const lastR = rHistory[rHistory.length - 1 - i]
      const context = this.canvasOutput.getContext("2d")
      context.beginPath();
      context.arc(lastX, lastY, lastR*(1-(i/currentWindowSize)), 0, 2 * Math.PI, false);
      context.fillStyle = 'green';
      context.fill();
      context.strokeStyle = 'green';
      context.stroke();
    }
  }
  processVideo=()=> {
    let canvasOutputCtx = this.canvasOutput.getContext("2d")
    let videoWidth = this.state.videoWidth
    let videoHeight = this.state.videoHeight

    canvasOutputCtx.drawImage(this.video, 0, 0, videoWidth, videoHeight);
    let imageData = canvasOutputCtx.getImageData(0, 0, videoWidth, videoHeight);
    document.getElementById("canvasOutput").getContext("2d").clearRect(0, 0, this.state.videoWidth, this.state.videoHeight);

    this.state.srcMat.data.set(imageData.data);
    cv.flip(this.state.srcMat, this.state.srcMat,1)
    let dst = new cv.Mat();
    const lowHSV = utils.RGBtoHSV(this.state.lh, this.state.ls, this.state.lv)
    lowHSV.push(0)
    const highHSV = utils.RGBtoHSV(this.state.hh, this.state.hs, this.state.hv)
    highHSV.push(255)
    const low = new cv.Mat(this.state.srcMat.rows, this.state.srcMat.cols, this.state.srcMat.type(), [this.state.lh, this.state.ls, this.state.lv, 0]);
    const high = new cv.Mat(this.state.srcMat.rows, this.state.srcMat.cols, this.state.srcMat.type(), [this.state.hh, this.state.hs, this.state.hv, 255]);
    cv.inRange(this.state.srcMat,low, high, dst);
    let contourData = this.trackBall(dst.clone())
    let kernel = cv.Mat.ones(5, 5, cv.CV_8U);
    cv.dilate(dst,dst,kernel)
    //cv.erode(dst,dst,kernel)
    kernel.delete()
    cv.imshow('canvasOutput',this.state.srcMat)
    this.drawTail(this.state.ballNum)

    low.delete();high.delete();dst.delete();
    var vidLength = 30 //seconds
    var fps = 24; 
    var interval = 1000/fps;
    const delta = Date.now() - this.state.startTime;

    requestAnimationFrame(this.processVideo);
    this.setState({
      startTime : Date.now()
    })
  }
  handleBallNum=(e)=>{
    this.setState({
      ballNum : parseInt(e.target.value)
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
  opencvIsReady=()=> {
    console.log('OpenCV.js is ready');
    this.startCamera();
  }
  handleLHChange=(e)=>{
    this.setState({
      lh : parseInt(e.target.value)
    })
  }
  handleLSChange=(e)=>{
    this.setState({
      ls : parseInt(e.target.value)
    })
  }
  handleLVChange=(e)=>{
    this.setState({
      lv : parseInt(e.target.value)
    })
  }
  
  handleHHChange=(e)=>{
    this.setState({
      hh : parseInt(e.target.value)
    })
  }
  handleHSChange=(e)=>{
    this.setState({
      hs : parseInt(e.target.value)
    })
  }
  handleHVChange=(e)=>{
    this.setState({
      hv : parseInt(e.target.value)
    })
  }
  handleUpsideDown=()=>{
    this.setState({
      upsideDownMode : !this.state.upsideDownMode
    })
  }
  handleToggleCalibrationMode=()=>{
    this.setState({
      calibrating : false
    })
  }
  nextBall=()=>{
    let colorRanges = this.state.allBallColors
    let ballNum = this.state.ballNum
    colorRanges[ballNum] = {
      'lh' : this.state.lh,
      'ls' : this.state.ls,
      'lv' : this.state.lv,
      'hh' : this.state.hh,
      'hs' : this.state.hs,
      'hv' : this.state.hv,
    }
    ballNum += 1 
    if(ballNum%this.state.numBalls == 1 ){
      ballNum = 1
    }
    this.setState({
      ballNum
    })
    console.log(colorRanges)
  }
  render() {
    const sliders = 
        this.state.calibrating ? 
        <div className="sliders">
          <label>Ball Number</label><input type="input" value={this.state.ballNum} onChange={this.handleBallNum}/>
          <button onClick={this.nextBall}>Next Ball</button>
          <br/>
          <label>Low R</label><input type="range" min={0} max={255} value={this.state.lh} onChange={this.handleLHChange}/>
          <label>Low G</label><input type="range" min={0} max={255} value={this.state.ls} onChange={this.handleLSChange}/>
          <label>Low B</label><input type="range" min={0} max={255} value={this.state.lv} onChange={this.handleLVChange}/>
          <br/>
          <label>High R</label><input type="range" min={0} max={255} value={this.state.hh} onChange={this.handleHHChange}/>
          <label>High G</label><input type="range" min={0} max={255} value={this.state.hs} onChange={this.handleHSChange}/>
          <label>High B</label><input type="range" min={0} max={255} value={this.state.hv} onChange={this.handleHVChange}/>
        </div> : null
      
    return (
      <div className="App">
        <button onClick={this.startCamera}>Start Video</button> 
        <button onClick={this.stopCamera}>Stop Video</button>      
        <button onClick={this.toggleCalibrationMode}>Finish Calibration</button>      
         <div id="container">
            <h3>Set color range</h3>
            {sliders}
            <video hidden={true} className="invisible" ref={ref => this.video = ref}></video>
            <canvas ref={ref => this.canvasOutput = ref}  className="center-block" id="canvasOutput" width={320} height={240}></canvas>
            <canvas ref={ref => this.canvasTest = ref}  className="center-block" id="canvasTest" width={320} height={240}></canvas>

          </div>
        </div>
    );
  }
}

export default App;

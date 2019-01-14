import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import cv from 'opencv.js';
import utils from './utils'
class App extends Component {

  state = {
    canvasOutputCtx : null,
    src : null,
    dst : null,
    stream : null,
    streaming : false,
    videoHeight : null,
    videoWidth : null,
    srcMat : null,
    startTime : Date.now(),
    lr : 0,
    lg : 0,
    lb : 50,
    hr : 20,
    hg : 50,
    hb : 255,
    allBallColors : [{},{
      lr : 0,
      lg : 0,
      lb : 50,
      hr : 20,
      hg : 50,
      hb : 255,
    }],
    ballNum : 1,
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
  trackBall=(src,ballNum)=>{
    let dst = cv.Mat.zeros(this.state.videoHeight, this.state.videoWidth, cv.CV_8UC4);
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
  }
  mean = (x,y)=>{
    return (x + y)/2
  }
  calculateCurrentColor=(ballColorRange)=>{
    const r = this.mean(ballColorRange['lr'],ballColorRange['hr'])
    const g = this.mean(ballColorRange['lg'],ballColorRange['hg'])
    const b = this.mean(ballColorRange['lb'],ballColorRange['hb'])
    return "rgb(" + r + "," + g + "," + b + ",60)"
  }
  drawTails =(ballNum)=>{
    const context = this.canvasOutput.getContext("2d")
    this.state.allBallColors.forEach((ballColors,ballNum)=>{
      if(this.state.positions[ballNum]){
        const xHistory = this.state.positions[ballNum]['x']
        const yHistory = this.state.positions[ballNum]['y']
        const rHistory = this.state.positions[ballNum]['r']
        const color = this.calculateCurrentColor(ballColors)

        const maxWindowSize = 8
        const currentWindowSize = Math.min(xHistory.length, maxWindowSize)
        for (let i=0; i < currentWindowSize; ++i){
          const lastX = xHistory[xHistory.length - 1 - i]
          const lastY = yHistory[yHistory.length - 1 - i]
          const lastR = rHistory[rHistory.length - 1 - i]
          context.beginPath();
          context.arc(lastX, lastY, lastR*(1-(i/currentWindowSize)), 0, 2 * Math.PI, false);
          context.fillStyle = color;
          context.fill();
          context.strokeStyle = color;
          context.stroke();
        }
      }
    })
  }
  colorFilter=(src)=>{
    let previousDst 
    let dst
    this.state.allBallColors.forEach((ballColors,ballNum)=>{
      if(ballNum > 0){
        dst = new cv.Mat();
        const lowHSV = utils.RGBtoHSV(ballColors.lr, ballColors.lg, ballColors.lb)
        lowHSV.push(0)
        const highHSV = utils.RGBtoHSV(ballColors.hr, ballColors.hg, ballColors.hb)
        highHSV.push(255)
        const low = new cv.Mat(src.rows, src.cols, src.type(), [ballColors.lr, ballColors.lg, ballColors.lb, 0]);
        const high = new cv.Mat(src.rows, src.cols, src.type(), [ballColors.hr, ballColors.hg, ballColors.hb, 255]);
        cv.inRange(src,low, high, dst);
        this.trackBall(dst.clone(),ballNum)
        let kernel = cv.Mat.ones(5, 5, cv.CV_8U);
        cv.dilate(dst,dst,kernel)
        if(previousDst){
          cv.add(dst,previousDst,dst)
          previousDst.delete()
        }
        previousDst = dst.clone()
        kernel.delete();low.delete();high.delete();
      }
    })
    src.delete()
    return dst
  }
  processVideo=()=> {
    let canvasOutputCtx = this.canvasOutput.getContext("2d")
    let videoWidth = this.state.videoWidth
    let videoHeight = this.state.videoHeight
    document.getElementById("canvasOutput").getContext("2d").clearRect(0, 0, this.state.videoWidth, this.state.videoHeight);

    canvasOutputCtx.drawImage(this.video, 0, 0, videoWidth, videoHeight);
    let imageData = canvasOutputCtx.getImageData(0, 0, videoWidth, videoHeight);

    this.state.srcMat.data.set(imageData.data);
    cv.flip(this.state.srcMat, this.state.srcMat,1)
    const finalMat = this.colorFilter(this.state.srcMat.clone())
    cv.imshow('canvasOutput',this.state.srcMat)
    finalMat.delete()
    this.drawTails()

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
  handleRGBChange=(e)=>{
    let state = this.state
    state[e.target.name] =parseInt(e.target.value)
    console.log(state)
    this.setState({
      state
    },()=>{
      this.setColorRange()
    })
  }
  setColorRange=()=>{
    let colorRanges = this.state.allBallColors
    colorRanges[this.state.ballNum] = {
      'lr' : this.state.lr,
      'lg' : this.state.lg,
      'lb' : this.state.lb,
      'hr' : this.state.hr,
      'hg' : this.state.hg,
      'hb' : this.state.hb,
    }
    this.setState({
      allBallColors : colorRanges
    })
  }
  setColor=(e)=>{
    const red = {
        'lr' : 40,
        'lg' : 0,
        'lb' : 0,
        'hr' : 255,
        'hg' : 30,
        'hb' : 60,
      }
    const green = {
        'lr' : 0,
        'lg' : 40,
        'lb' : 0,
        'hr' : 30,
        'hg' : 255,
        'hb' : 80,
      }
    const blue = {
        'lr' : 0,
        'lg' : 0,
        'lb' : 40,
        'hr' : 10,
        'hg' : 80,
        'hb' : 255,
      }
    let state = this.state
    let color = {}
    let colorRanges = this.state.allBallColors
    if(e.target.name == "red"){
      colorRanges[this.state.ballNum] = red
      color = red
    }else if(e.target.name == "green"){
      colorRanges[this.state.ballNum] = green
      color = green
    }else if(e.target.name == "blue"){
      colorRanges[this.state.ballNum] = blue
      color = blue
    }
    state.allBallColors = colorRanges
      state = Object.assign(state, color);
      this.setState({
        state
      })
  }
  nextBall=()=>{
    this.setColorRange()
    let ballNum = this.state.ballNum
    ballNum += 1 
    if(ballNum%this.state.numBalls == 1 ){
      ballNum = 1
    }
    if(this.state.allBallColors[ballNum]){
      this.setState({
        ballNum,
        lr : this.state.allBallColors[ballNum]['lr'],
        lg : this.state.allBallColors[ballNum]['lg'],
        lb : this.state.allBallColors[ballNum]['lb'],
        hr : this.state.allBallColors[ballNum]['hr'],
        hg : this.state.allBallColors[ballNum]['hg'],
        hb : this.state.allBallColors[ballNum]['hb'],
      })
    }else{
      this.setState({
        ballNum
      })
    }
    
  }
  render() {
    const sliders = 
        this.state.calibrating ? 
        <div className="sliders">
          <label>Ball Number</label><input type="input" value={this.state.ballNum} onChange={this.handleBallNum}/>
          <button onClick={this.nextBall}>Next Ball</button>
          <br/>
          <button style={{"background-color":'red', 'color': 'white'}} name="red" onClick={this.setColor}>Red</button>
          <button style={{"background-color":'green', 'color': 'white'}} name="green" onClick={this.setColor}>Green</button>
          <button style={{"background-color":'blue', 'color': 'white'}} name="blue" onClick={this.setColor}>Blue</button>
          <br/>
          <label>Low R</label><input name="lr" type="range" min={0} max={255} value={this.state.lr} onChange={this.handleRGBChange}/>
          <label>Low G</label><input name="lg" type="range" min={0} max={255} value={this.state.lg} onChange={this.handleRGBChange}/>
          <label>Low B</label><input name="lb" type="range" min={0} max={255} value={this.state.lb} onChange={this.handleRGBChange}/>
          <br/>
          <label>High R</label><input name="hr" type="range" min={0} max={255} value={this.state.hr} onChange={this.handleRGBChange}/>
          <label>High G</label><input name="hg" type="range" min={0} max={255} value={this.state.hg} onChange={this.handleRGBChange}/>
          <label>High B</label><input name="hb" type="range" min={0} max={255} value={this.state.hb} onChange={this.handleRGBChange}/>
        </div> : null
      
    return (
      <div className="App">
        <button onClick={this.startCamera}>Start Video</button> 
        <button onClick={this.stopCamera}>Stop Video</button>      
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

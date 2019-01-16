import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import cv from 'opencv.js';
import utils from './utils'
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
    'lg' : 80,
    'lb' : 0,
    'hr' : 50,
    'hg' : 255,
    'hb' : 80,
  }
const blue = {
    'lr' : 0,
    'lg' : 0,
    'lb' : 60,
    'hr' : 50,
    'hg' : 100,
    'hb' : 255,
  }
const white = {
    'lr' : 220,
    'lg' : 225,
    'lb' : 230,
    'hr' : 255,
    'hg' : 255,
    'hb' : 255,
  }
class App extends Component {

  state = {
    canvasOutputCtx : null,
    src : null,
    dst : null,
    stream : null,
    streaming : false,
    videoHeight : null,
    videoWidth : null,
    startTime : Date.now(),
    lr : 0,
    lg : 0,
    lb : 50,
    hr : 20,
    hg : 50,
    hb : 255,
    allColors : [{},{
      numObjects : 1,
      lr : 0,
      lg : 0,
      lb : 50,
      hr : 20,
      hg : 50,
      hb : 255,
    }],
    ballNum : 1,
    colorNum : 1,
    calibrating : true,
    positions : [],
    numBalls : 3,
    numObjects : 1,

    showRaw : true,
    tailSize : 10
  }

  startCamera=()=> {
    let that = this
    if (this.state.streaming) return;

      navigator.mediaDevices.getUserMedia({video: {width:320, height:240}, audio: false})
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
    requestAnimationFrame(this.processVideo);
  }

  stopVideoProcessing = () =>{
    let src = this.state.src
    if (src != null && !src.isDeleted()) src.delete();

  }
  sortContours = (contours)=>{
    let contourAreas = []
    for (let i = 0; i < contours.size(); ++i) {
      contourAreas.push(cv.contourArea(contours.get(i), false))
    }
    const len = contourAreas.length
    var indices = new Array(len);
    for (let i = 0; i < len; ++i) indices[i] = i;
    indices.sort(function (a, b) { return contourAreas[a] > contourAreas[b] ? -1 : contourAreas[a] > contourAreas[b] ? 1 : 0; });
    return indices
  }
  trackBall=(src,colorNum)=>{
    let allPositions = this.state.positions

    //initialize contour finding data
    let dst = cv.Mat.zeros(this.state.videoHeight, this.state.videoWidth, cv.CV_8UC4);
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(src, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_NONE);
    
    const sortedContourIndices = this.sortContours(contours)
    if(sortedContourIndices.length > 0){
      const numObjects = this.state.allColors[colorNum].numObjects
      for(let i = 0; i < Math.min(sortedContourIndices.length, numObjects); ++i){
        const ballNum = colorNum + i 
        console.log("track ball" ,colorNum, ballNum, numObjects)

        const circle = cv.minEnclosingCircle(contours.get(sortedContourIndices[i]))
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
      }
      
      this.setState({
        positions : allPositions
      })
    }
    
    src.delete();dst.delete(); contours.delete(); hierarchy.delete();
  }
  mean = (x,y)=>{
    return (x + y)/2
  }
  calculateCurrentColor=(ballColorRange,opacity)=>{
    const r = this.mean(ballColorRange['lr'],ballColorRange['hr'])
    const g = this.mean(ballColorRange['lg'],ballColorRange['hg'])
    const b = this.mean(ballColorRange['lb'],ballColorRange['hb'])
    return "rgb(" + r + "," + g + "," + b + ","+opacity+")"
  }
  drawCircle = (context, x,y,r, color)=>{
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
    context.strokeStyle = color;
    context.stroke();
  }
  drawTails =(colorNum)=>{
    const context = this.canvasOutput.getContext("2d")
    this.state.allColors.forEach((ballColors,colorNum)=>{
      for(let i = 0; i < ballColors.numObjects; ++i){
        const ballNum = colorNum + i 
        console.log("track ball" ,colorNum, ballNum, ballColors)

        if(this.state.positions[ballNum] && ballNum > 0){
          const xHistory = this.state.positions[ballNum]['x']
          const yHistory = this.state.positions[ballNum]['y']
          const rHistory = this.state.positions[ballNum]['r']

          const maxWindowSize = 8
          const currentWindowSize = Math.min(xHistory.length, maxWindowSize)
          for (let i=0; i < currentWindowSize; ++i){
            const lastX = xHistory[xHistory.length - 1 - i]
            const lastY = yHistory[yHistory.length - 1 - i]
            const lastR = rHistory[rHistory.length - 1 - i]
            const color = this.calculateCurrentColor(ballColors,(1-(i/currentWindowSize)))

            /*if(yHistory.length - 1 >= 1+i){
              const prevX = xHistory[xHistory.length - 2 - i ]
              const prevY = yHistory[yHistory.length - 2 - i ]
              const prevR = rHistory[rHistory.length - 2 - i ]
              if(prevY + prevR < 1.5 * (lastY-lastR)){
                this.drawCircle(context,this.mean(lastX,prevX), this.mean(lastY,prevY), this.mean(lastR,prevR)*(1-(i/currentWindowSize)), color)
              }
            }*/
            this.drawCircle(context,lastX, lastY, lastR*(1-(i/currentWindowSize)), color)
            
          }
        }
      }
    })
  }
  colorFilter=(src)=>{
    let previousDst 
    let dst = new cv.Mat();
    this.state.allColors.forEach((colorRange,colorNum)=>{
      if(colorNum > 0){
        console.log("color filter number" ,colorNum, colorRange)
        const lowHSV = utils.RGBtoHSV(colorRange.lr, colorRange.lg, colorRange.lb)
        lowHSV.push(0)
        const highHSV = utils.RGBtoHSV(colorRange.hr, colorRange.hg, colorRange.hb)
        highHSV.push(255)
        const low = new cv.Mat(src.rows, src.cols, src.type(), [colorRange.lr, colorRange.lg, colorRange.lb, 0]);
        const high = new cv.Mat(src.rows, src.cols, src.type(), [colorRange.hr, colorRange.hg, colorRange.hb, 255]);
        cv.inRange(src,low, high, dst);
        this.trackBall(dst.clone(),colorNum)
        let kernel = cv.Mat.ones(5, 5, cv.CV_8U);
        cv.dilate(dst,dst,kernel)
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
    let srcMat = new cv.Mat(this.state.videoHeight, this.state.videoWidth, cv.CV_8UC4);
    const context = document.getElementById("canvasOutput").getContext("2d")
    context.clearRect(0, 0, this.state.videoWidth, this.state.videoHeight);
    context.drawImage(this.video, 0, 0, this.state.videoWidth, this.state.videoHeight);
    let imageData = context.getImageData(0, 0, this.state.videoWidth, this.state.videoHeight);
    srcMat.data.set(imageData.data);
    cv.flip(srcMat, srcMat,1)
    const finalMat = this.colorFilter(srcMat.clone())
    if(this.state.showRaw){
      cv.imshow('canvasOutput',srcMat)
    }else{
      context.fillStyle = 'rgba(0, 0, 0, 1)';
      context.fillRect(0, 0, this.state.videoWidth, this.state.videoHeight);
    }
    finalMat.delete();srcMat.delete()
    this.drawTails()
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
    this.setState({
      allColors : colorRanges
    })
  }
  setColor=(e)=>{
    
    let state = this.state
    let color = {}
    let colorRanges = this.state.allColors
    if(e.target.name == "red"){
      colorRanges[this.state.colorNum] = red
      color = red
    }else if(e.target.name == "green"){
      colorRanges[this.state.colorNum] = green
      color = green
    }else if(e.target.name == "blue"){
      colorRanges[this.state.colorNum] = blue
      color = blue
    }else if(e.target.name == "white"){
      colorRanges[this.state.colorNum] = white
      color = white
    }
    state.allColors = colorRanges
    state = Object.assign(state, color);
    this.setState({
      state
    })
  }
  nextColor=()=>{
    this.setColorRange()
    let colorNum = this.state.colorNum
    colorNum += 1 
    if(colorNum%this.state.numBalls == 1 ){
      colorNum = 1
    }
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
      })
    }
    console.log(this.state.allColors)
  }
  toggleShowRaw=()=>{
    this.setState({
      showRaw : !this.state.showRaw
    })
  }
  trimHistories=()=>{
    let histories = []
    this.state.positions.forEach((history, ballNum)=>{
      history['x'] = history['x'][history['x'].length - 1 - this.state.tailSize]
      history['y'] = history['y'][history['y'].length - 1 - this.state.tailSize]
      history['r'] = history['r'][history['r'].length - 1 - this.state.tailSize]
      histories[ballNum] = [history['x'],history['y'],history['r']]
    })
    this.setState({
      positions : histories
    })
  }
  handleNumObjects=(e)=>{
    console.log("num objects", e.target.value)
    this.setState({
      numObjects : e.target.value 
    },()=>{
      this.setColorRange()
    })
  }
  render() {
    const sliders = 
        this.state.calibrating ? 
        <div className="sliders">
          <label>Color Number</label><input type="input" value={this.state.colorNum} onChange={this.handleColorNum}/>
          <button onClick={this.nextColor}>Next Color</button>
          <br/>
          <label>Number of Objects</label><input type="input" value={this.state.numObjects} onChange={this.handleNumObjects}/>

          <br/>
          <h3>Preset Colors</h3>
          <button style={{"backgroundColor":'red', 'color': 'white','fontSize':'12pt'}} name="red" onClick={this.setColor}>Red</button>
          <button style={{"backgroundColor":'green', 'color': 'white','fontSize':'12pt'}} name="green" onClick={this.setColor}>Green</button>
          <button style={{"backgroundColor":'blue', 'color': 'white','fontSize':'12pt'}} name="blue" onClick={this.setColor}>Blue</button>
          <button style={{"backgroundColor":'white', 'color': 'black','fontSize':'12pt'}} name="white" onClick={this.setColor}>White</button>

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
        <button style={{'fontSize':'12pt'}} onClick={this.startCamera}>Start Video</button> 
        <button style={{'fontSize':'12pt'}} onClick={this.stopCamera}>Stop Video</button>
        <button style={{'fontSize':'12pt'}} onClick={this.toggleShowRaw}>Filtered/Raw Video</button>       
         <div id="container">
            <canvas ref={ref => this.canvasOutput = ref}  className="center-block" id="canvasOutput" width={320} height={240}></canvas>

            <h1>choose color range</h1>
            {sliders}
            <video hidden={true} width={320} height={240} className="invisible" ref={ref => this.video = ref}></video>
          </div>
        </div>
    );
  }
}

export default App;

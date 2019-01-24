import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import cv from 'opencv.js';
import utils from './utils'
import * as tf from '@tensorflow/tfjs';
import * as posenet from '@tensorflow-models/posenet';
const scoreThreshold = .5
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
    numObjects : 1,
    lr : 0,
    lg : 0,
    lb : 50,
    hr : 20,
    hg : 50,
    hb : 255,
    net : null,
    allColors : [{},{
      numObjects : 1,
      lr : 0,
      lg : 0,
      lb : 50,
      hr : 20,
      hg : 50,
      hb : 255,
    }],
    colorNum : 1,
    calibrating : true,
    positions : [],
    totalNumColors : 1,
    showRaw : true,
    tailLength : 1,
    connectSameColor : false,
    showPosePoints : false
  }

  componentDidMount=()=>{
    posenet.load().then(data=>{
      console.log("posenet loaded")
       this.setState({
          net : data
        })

    });
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
  drawPose = (context)=>{

    var boxSize = 5
    context.lineWidth = 4;
    context.strokeStyle = 'rgba(255,255,255,0.8)'
    if(this.state.pose){
      this.state.pose.keypoints.forEach((keypoint,index)=>{
        if(keypoint.score > scoreThreshold){
          console.log("drawing keypoint",keypoint.part, keypoint.position.x,keypoint.position.y )

          context.strokeRect(keypoint.position.x - boxSize/2 , keypoint.position.y - boxSize/2, boxSize, boxSize);

        }
      })
    }
  }
  detectPose = ()=>{
    if(this.state.net){

      var imageScaleFactor = 0.5;
      var outputStride = 16;
      var flipHorizontal = true;
      this.state.net.estimateSinglePose(this.video,imageScaleFactor, flipHorizontal, outputStride).then(pose=>{
        this.setState({
          pose
        })
      });
    }
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
          for (let i=0; i < currentWindowSize; ++i){
            const lastX = xHistory[xHistory.length - 1 - i]
            const lastY = yHistory[yHistory.length - 1 - i]
            const lastR = rHistory[rHistory.length - 1 - i]
            const color = utils.calculateCurrentColor(ballColors,(1-(i/currentWindowSize)))
            this.drawCircle(context,lastX, lastY, lastR*(1-(i/currentWindowSize)), color)
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
    this.state.allColors.forEach((colorRange,colorNum)=>{
      if(colorNum > 0){
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
    //context.clearRect(0, 0, this.state.videoWidth, this.state.videoHeight);
    context.drawImage(this.video, 0, 0, this.state.videoWidth, this.state.videoHeight);

    let imageData = context.getImageData(0, 0, this.state.videoWidth, this.state.videoHeight);
    srcMat.data.set(imageData.data);
    cv.flip(srcMat, srcMat,1)
    const combinedColorMat = this.colorFilter(srcMat.clone())

    if(this.state.showRaw){
      cv.imshow('canvasOutput',srcMat)
    }else{
      context.fillStyle = 'rgba(0, 0, 0, 1)';
      context.fillRect(0, 0, this.state.videoWidth, this.state.videoHeight);
    }
    combinedColorMat.delete();srcMat.delete()
    this.drawTails(context)
    if(this.state.showPosePoints){
      this.detectPose(context)
      this.drawPose(context)
    }

    if(this.state.connectSameColor){
      this.drawConnections(context)
    }

    this.trimHistories()

    requestAnimationFrame(this.processVideo);
    imageData = null
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

      if(!histories[colorNum]){
        histories[colorNum] = []
      }
      colorPositions.forEach((history,ballNum)=>{
        if(history['x'].length > this.state.tailLength){
          histories[colorNum][ballNum]['x'] = history['x'].slice(history['x'].length - 1 - this.state.tailLength, history['x'].length)
          histories[colorNum][ballNum]['y'] = history['y'].slice(history['y'].length - 1 - this.state.tailLength, history['y'].length)
          histories[colorNum][ballNum]['r'] = history['r'].slice(history['r'].length - 1 - this.state.tailLength, history['r'].length)
        }
      })
    })

    if(histories.length > 0){
      this.setState({
        positions : histories
      })
    }
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
  toggleDrawPose=()=>{
    this.setState({
      showPosePoints : !this.state.showPosePoints
    })
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
        <button style={{'fontSize':'12pt'}} onClick={this.startCamera}>Start Video</button> 
        <button style={{'fontSize':'12pt'}} onClick={this.stopCamera}>Stop Video</button>
        <button style={{'fontSize':'12pt'}} onClick={this.toggleShowRaw}>Filtered/Raw Video</button>       
        <button style={{'fontSize':'12pt'}} onClick={this.toggleConnectSameColor}>Connect Same Colors</button>
        <button style={{'fontSize':'12pt'}} onClick={this.toggleDrawPose}>Draw Body Parts</button>

        <br/>
        <span style={{"margin": "10px","border": "1px solid black"}}>{this.state.tailLength}</span><label>Tail Length</label><input name="lg" type="range" min={0} max={20} value={this.state.tailLength} onChange={this.handleTailLength}/>
       

         <div id="container">
            <canvas ref={ref => this.canvasOutput = ref}  className="center-block" id="canvasOutput" width={320} height={240}></canvas>
            <br/>
            
            <h1>choose color ranges</h1>
            <label>Total Number of Colors</label><input type="number" value={this.state.totalNumColors} onChange={this.handleTotalNumColors}/>

            {sliders}
            <video hidden={true} width={320} height={240} playsInline className="invisible" ref={ref => this.video = ref}></video>
          </div>
        </div>
    );
  }
}

export default App;



/*
<br/>
<h3>current color setting</h3>
<div style={{
  'width' : '80px',
  'height' : '80px',
  'margin' : '0 auto',
  'backgroundColor':utils.calculateCurrentColor(
    this.state.allColors[this.state.colorNum],1
    )
}}
></div>
*/

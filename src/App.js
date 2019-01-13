import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import cv from 'opencv4nodejs';

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
    lh:5,
    ls:5,
    lv:5,
    hh:30,
    hs:30,
    hv:30,
    upsideDownMode:false,
    ballNum : 1,
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

  processVideo=()=> {
    let canvasOutputCtx = this.canvasOutput.getContext("2d")
    let videoWidth = this.state.videoWidth
    let videoHeight = this.state.videoHeight

    canvasOutputCtx.drawImage(this.video, 0, 0, videoWidth, videoHeight);
    let imageData = canvasOutputCtx.getImageData(0, 0, videoWidth, videoHeight);
    this.state.srcMat.data.set(imageData.data);
    cv.flip(this.state.srcMat, this.state.srcMat,1)
    let dst = new cv.Mat();
    const low = new cv.Mat(this.state.srcMat.rows, this.state.srcMat.cols, this.state.srcMat.type(), [this.state.lh, this.state.ls, this.state.lv, 0]);
    const high = new cv.Mat(this.state.srcMat.rows, this.state.srcMat.cols, this.state.srcMat.type(), [this.state.hh, this.state.hs, this.state.hv, 255]);
    const colored = cv.inRange(this.state.srcMat, low, high, dst);
    cv.imshow('canvasOutput',colored)
      
    canvasOutputCtx.lineWidth = 6;
    canvasOutputCtx.strokeStyle = 'rgba(255,255,255,0.7)';
    canvasOutputCtx.strokeRect(Math.floor(videoWidth/2)-10, 0, 20, videoHeight);

    var vidLength = 30 //seconds
    var fps = 24;
    var interval = 1000/fps;
    const delta = Date.now() - this.state.startTime;
    

    if (delta > interval) {
      requestAnimationFrame(this.processVideo);
      this.setState({
        startTime : Date.now()
      })
    }
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
  render() {
    
    return (
      <div className="App">
        <button onClick={this.startCamera}>Start Video</button> 
        <button onClick={this.stopCamera}>Stop Video</button>      
        <button onClick={this.handleUpsideDown}>Upside down mode</button>      
         <div id="container">
            <h3>Set color range</h3>
            <div className="sliders">
              <input type="range" min={0} max={255} value={this.state.ballNum} onChange={this.handleBallNum}/>
              <input type="range" min={0} max={255} value={this.state.lh} onChange={this.handleLHChange}/>
              <input type="range" min={0} max={255} value={this.state.ls} onChange={this.handleLSChange}/>
              <input type="range" min={0} max={255} value={this.state.lv} onChange={this.handleLVChange}/>
              <input type="range" min={0} max={255} value={this.state.hh} onChange={this.handleHHChange}/>
              <input type="range" min={0} max={255} value={this.state.hs} onChange={this.handleHSChange}/>
              <input type="range" min={0} max={255} value={this.state.hv} onChange={this.handleHVChange}/>
            </div>
            <video className="invisible" ref={ref => this.video = ref}></video>
            <canvas ref={ref => this.canvasOutput = ref}  className="center-block" id="canvasOutput" width={320} height={240}></canvas>
          </div>
        </div>
    );
  }
}

export default App;

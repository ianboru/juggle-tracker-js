import React, { Component } from 'react';
import './App.css';
import cv from 'opencv.js';
import cvutils from './cvutils';
import drawingUtils from './drawingUtils'
import { HuePicker } from 'react-color';

//@observer
const initialHSV = {
      lh : 200,
      ls : .2,
      lv : .2,
      hh : 230,
      hs : 1,
      hv : 1,
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
    hs : 1,
    hv : 1,
    net : null,
    allColors : [initialHSV],
    colorNum : 0,
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
    starsColor : [],
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
    //Fix for firefox to have context available
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
      cv.imshow('canvasOutput',srcMat)
      //Filters by color AND tracks ball positions by color
      let colorFilteredImage
      this.state.allColors.forEach((colorRange,colorNum)=>{

        colorFilteredImage = cvutils.colorFilter(srcMat.clone(), colorRange)
        const ballLocations = cvutils.findBalls(colorFilteredImage.clone())
        this.updateBallHistories(ballLocations, colorNum)
        if(!this.state.showRaw){
          // Initialize final canvas with the mask of the colors within the color ranges
          // This setting is used when calibrating the colors
          cv.imshow('canvasOutput',colorFilteredImage)
        }
        //Draw balls and trails
        if(this.state.showTrails){
          drawingUtils.drawTrails(context,this.state.positions[colorNum], colorRange, this.state.trailLength)
        }
        if(this.state.showConnections){
          //Draw lines between balls of same color
          drawingUtils.drawConnections(context, this.state.positions[colorNum], colorRange)
        }
        if(this.state.showStars){
          //Draw stars coming from balls
          const newStars = drawingUtils.drawStars(context, this.state.positions[colorNum],this.state.starsX,this.state.starsY,this.state.starsDx,this.state.starsDy,this.state.starsSize,this.state.starsColor)
          this.setState(newStars)
        }
      })


      //Trim histories to trail length
      this.trimHistories()

      //Clean up all possible data
      colorFilteredImage.delete();srcMat.delete()
      srcMat = null; colorFilteredImage = null
      imageData = null

      //Process next frame
      requestAnimationFrame(this.processVideo);
    }
  }


  updateBallHistories=(contourPositions, colorNum)=>{
    // Maximum number of contours that will be interpreted as objects
    const maxNumContours = 15
    //Used to know how many contours to connect later
    let numContoursOverThreshold = 0
    let allPositions = this.state.positions
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
      allPositions[colorNum]["currentNumContours"] = numContoursOverThreshold
    }
    if(!allPositions[colorNum]){
      return
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
    // Update position histories
    this.setState({
      positions : allPositions
    })
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
      pickedColor : cvutils.calculateCurrentHSV(colorRanges[this.state.colorNum])

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
  handleTrailLength=(e)=>{
    this.setState({
      trailLength : e.target.value
    })
  }
  toggleShowRaw=()=>{

      // Toggle the text on the button
      const starsButton = document.querySelector('button#calibration');
      if (starsButton.textContent === 'Show Raw') {starsButton.textContent = 'Calibration';}
      else {starsButton.textContent = 'Show Raw';}
    this.setState({
      showRaw : !this.state.showRaw
    })
  }

  toggleShowConnections=()=>{
    // Toggle the text on the button
    const connectionsButton = document.querySelector('button#connections');
    if (connectionsButton.textContent === 'Show Connections') {connectionsButton.textContent = 'Hide Connections';}
    else {connectionsButton.textContent = 'Show Connections';}
    // Change the state so that connections are shown or not
    this.setState({
      showConnections : !this.state.showConnections
    })
  }
  toggleShowStars=()=>{
    // Toggle the text on the button
    const starsButton = document.querySelector('button#starsButton');
    if (starsButton.textContent === 'Show Stars') {starsButton.textContent = 'Hide Stars';}
    else {starsButton.textContent = 'Show Stars';}
    // Change the state so that stars are shown or not
    this.setState({
      showStars : !this.state.showStars
    })
  }
  toggleShowTrails=()=>{
    //Toggle the text on the trailsButton
    const trailsButton = document.querySelector('button#trailsButton');
    if (trailsButton.textContent === 'Show Trails') {trailsButton.textContent = 'Hide Trails';}
    else {trailsButton.textContent = 'Show Trails';}
    this.setState({
      showTrails : !this.state.showTrails
    },()=>{
      const slider = document.getElementById("trailSlider")
      slider.hidden = !this.state.showTrails

    })
  }
  handleColorPickerChangeComplete = (color) => {
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
        <div style={{"paddingTop": "5px"}} className="sliders">
          <h3>Lower Range</h3>
          <input style={{"width": "30px", "marginRight" : "10px", "marginLeft" : "10px"}} value={this.state.lh}/><label>Hue</label><input name="lh" type="range" min={0} max={360} step={1} value={this.state.lh} onChange={this.handleHSVSliderChange}/>
          <br/>
          <input style={{"width": "30px", "marginRight" : "10px", "marginLeft" : "10px"}} value={this.state.ls}/><label>Saturation</label><input name="ls" type="range" min={0} max={1} step={.01} value={this.state.ls} onChange={this.handleHSVSliderChange}/>
          <br/>
          <input style={{"width": "30px", "marginRight" : "10px", "marginLeft" : "10px"}} value={this.state.lv}/><label>Value</label><input name="lv" type="range" min={0} max={1} step={.01} value={this.state.lv} onChange={this.handleHSVSliderChange}/>
          <br/>
          <h3>Upper Range</h3>
          <br/>
          <input style={{"width": "30px", "marginRight" : "10px", "marginLeft" : "10px"}} value={this.state.hh}/><label>Hue</label><input name="hh" type="range" min={0} max={360} step={1} value={this.state.hh} onChange={this.handleHSVSliderChange}/>
          <br/>
          <input style={{"width": "30px", "marginRight" : "10px", "marginLeft" : "10px"}} value={this.state.hs}/><label>Saturation</label><input name="hs" type="range" min={0} max={1} step={.01} value={this.state.hs} onChange={this.handleHSVSliderChange}/>
          <br/>
          <input style={{"width": "30px", "marginRight" : "10px", "marginLeft" : "10px"}} value={this.state.hv}/><label>Value</label><input name="hv" type="range" min={0} max={1} step={.01} value={this.state.hv} onChange={this.handleHSVSliderChange}/>
        </div>

    const colorSwatches = this.state.allColors.map((colorRange,index)=>{
        return(
          <div
            onClick={()=>{this.selectColor(index)}}
            style={{
              'marginRight': '20px',
              'display':'inline-block',
              'backgroundColor' : cvutils.calculateCurrentHSVString(colorRange,1),
              'width' : '50px',
              'height' : '50px',
              'left' : '0',
              'position' : 'relative'
            }}>
          </div>
        )

    })

    const videoControls =
      <div>
        <div style={{'marginBottom' :'10px'}}>
          <button style={{'fontSize':'12pt'}} id="record" onClick={this.toggleRecording}>Start Recording</button>
          <button style={{'fontSize':'12pt'}} id="calibration" onClick={this.toggleShowRaw}>Calibration</button>
          <button style={{'fontSize':'12pt'}} id="download" onClick={this.download} >Download</button>
        </div>
        <video hidden={true} ref={ref => this.recordedVideo = ref} id="recorded" playsInline ></video>
      </div>

    const animationControls =
      <div>
        <br/>
        <button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="connections" onClick={this.toggleShowConnections}>Show Connections</button>
        <button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="trailsButton" onClick={this.toggleShowTrails}>Hide Trails</button>
        <button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="starsButton" onClick={this.toggleShowStars}>Show Stars</button>
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
            onChangeComplete={ this.handleColorPickerChangeComplete }
          />
        </div>
        {animationControls}
        {sliders}
      </div>
    );
  }
}

export default App;

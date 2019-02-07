import React, { Component } from 'react';
import './App.css';
import cv from 'opencv.js';
import cvutils from './cvutils';
import drawingUtils from './drawingUtils'
import { HuePicker } from 'react-color';
import ColorSliders from './colorSliders'
//@observer

const calibrateHelp = `Calibration Process:\n
1: Click 'Calibration View'
2: Set 'Hue Center' slider to approximate color of prop
3: Adjust HSV Sliders until prop is completely white
4: When you walk farther from the camera, the hue shouldn't change but the saturation and value likely decrease

Tips:\n
1: Use bright balls that are distinct colors from background and clothes
2: White and Red won't work well until next version
3: Light should be behind the camera facing you
`
const touchDuration = 500
const isMobile = true ?  /Mobi|Android/i.test(navigator.userAgent) : false
class App extends Component {

  state = {
    src : null,
    dst : null,
    flippedFrame : null,
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
    tv : cvutils.initialHSV.tv,
    net : null,
    allColors : [cvutils.initialHSV],
    colorNum : 0,
    positions : [],
    totalNumColors : 1,
    showRaw : true,
    usingWhite : false,
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
    canvasMouseDownX : null,
    canvasMouseDownY : null,
    calibrationRect : null,
    showSelectColorText : true,
    touchTimer : null,
    isFacebookApp : false,
    colorModeButtonText : 'Use White Props',
  }

  componentDidMount=()=>{
    const isFacebookApp = this.isFacebookApp()
    if(!isFacebookApp){
      this.startCamera()
    }
    this.setState({
      isFacebookApp
    })
    const downloadButton = document.querySelector('button#download');
    downloadButton.disabled = true
    document.title = "AR Flow Arts"
    
  }
  isFacebookApp=()=>{
    var ua = navigator.userAgent || navigator.vendor || window.opera;
    return (ua.indexOf("FBAN") > -1) || (ua.indexOf("FBAV") > -1) || (ua.indexOf("Instagram") > -1);;
  }
  /****
  Camera Stuff
  ****/
  startCamera=()=> {
    let that = this

    if (this.state.streaming) return;

    //get video
    navigator.mediaDevices.getUserMedia({video: {faceingMode : 'user'}, audio: false})
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
        //that.canvasOutput.width = videoWidth;
        //that.canvasOutput.height = videoHeight;
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
    this.canvasOutput.getContext("2d").clearRect(0, 0, this.state.videoWidth, this.state.videoHeight);
    this.video.pause();
    this.video.srcObject=null;
    this.state.stream.getVideoTracks()[0].stop();
    this.setState({
      streaming :false,
    })

  }
  startVideoProcessing=()=> {
    //Fix for firefox to have context available
    const context = this.canvasOutput.getContext("2d")
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
  // On click method for using white balls.
  toggleWhiteMode=()=>{
    // Toggle the text on the button
    let colorModeButtonText = ""
    if (!this.state.usingWhite) {
      colorModeButtonText = 'Use Color Props';
    }else {
      colorModeButtonText = 'Use White Props';
    }
    // Change the state so that connections are shown or not
    this.setState({
      usingWhite : !this.state.usingWhite,
      colorModeButtonText
    })
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
  getMatFromCanvas=(context)=>{
    let srcMat = new cv.Mat(this.state.videoHeight, this.state.videoWidth, cv.CV_8UC4);
    //Draw video frame onto canvas context
    //Extra image data from canvas context
    let imageData = context.getImageData(0, 0, this.state.videoWidth, this.state.videoHeight);
    srcMat.data.set(imageData.data);
    imageData = null
    return srcMat
  }

   processVideo=()=> {
    if(this.canvasOutput){
      const context = this.canvasOutput.getContext("2d")
      context.drawImage(this.video, 0, 0, this.state.videoWidth, this.state.videoHeight);

      let srcMat = this.getMatFromCanvas(context)
      //Flip horizontally because camera feed is pre-flipped
      cv.flip(srcMat, srcMat,1)
      if(this.state.canvasMouseDownX){this.setState({flippedFrame : srcMat.clone()})}
      cv.imshow('canvasOutput',srcMat)
      //Filters by color AND tracks ball positions by color
      let colorFilteredImage
      this.state.allColors.forEach((colorRange,colorNum)=>{
        if(!this.state.usingWhite){
          colorFilteredImage = cvutils.colorFilter(srcMat.clone(), colorRange)
        }else{
          colorFilteredImage = cvutils.colorWhite(srcMat.clone(), colorRange)
        }

        const ballLocations = cvutils.findBalls(colorFilteredImage.clone())
        this.updateBallHistories(ballLocations, colorNum)

        if(!this.state.showRaw){
          // Initialize final canvas with the mask of the colors within the color ranges
          // This setting is used when calibrating the colors
          cv.imshow('canvasOutput',colorFilteredImage)
        }
        //Draw balls and trails
        if(this.state.showTrails){
          const color = this.state.usingWhite ? "white" : cvutils.calculateCurrentHSVString(colorRange)
          drawingUtils.drawTrails(context,this.state.positions[colorNum], color, this.state.trailLength)
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
      if(this.state.calibrationRect){
        //Draw color selection rectangle
        context.strokeStyle = "#ffffff"
        const rect = this.state.calibrationRect
        const scaleFactor = this.state.videoWidth/this.canvasOutput.clientWidth

        context.strokeRect(rect[0]*scaleFactor,rect[1]*scaleFactor,(rect[2]-rect[0])*scaleFactor,(rect[3]-rect[1])*scaleFactor)
      }
      if(this.state.showSelectColorText){ 
        drawingUtils.drawSelectColorText(context, isMobile, this.state.usingWhite) 
      }
      //Trim histories to trail length
      this.trimHistories()

      //Clean up all possible data
      colorFilteredImage.delete();srcMat.delete()
      srcMat = null; colorFilteredImage = null


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
      console.log(e)
      let state = this.state
      state[e.name] =parseFloat(e.value)
      this.setState({
        state
      },()=>{
        this.setColorRange()
      })
      this.setState({
        showSelectColorText : false
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
      'tv' : this.state.tv
    }
    this.setState({
      allColors : colorRanges,
      pickedColor : cvutils.calculateCurrentHSV(colorRanges[this.state.colorNum])

    })
  }
  addColor=()=>{
    this.setColorRange()
    let colorNum = this.state.allColors.length

    this.setState(cvutils.initialHSV)
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

    const calibrationButton = document.querySelector('button#calibration');
    if (calibrationButton.textContent === 'Show Cam') {calibrationButton.textContent = 'Calibration View';}
    else {calibrationButton.textContent = 'Show Cam';}
    this.setState({
      showRaw : !this.state.showRaw
    })
    if(this.state.showRaw){
      alert(
        `Calibration Process:\n
        1: Click 'Calibrate'
        2: Set 'Hue Center' slider to approximate color of prop
        3: Adjust HSV Sliders until prop is completely white
        `
      )
    }
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
  }
  showCalibrateHelp = (asdf) =>{
    alert(calibrateHelp)
  }
  touchHeld = ()=>{
    const rectWidth = 50
    //use flipped frame that has not been drawn on yet
    const rectLeft = this.state.canvasMouseDownX - rectWidth/2
    const rectRight = this.state.canvasMouseDownX + rectWidth/2
    const rectTop = this.state.canvasMouseDownY - rectWidth/2
    const rectBottom = this.state.canvasMouseDownY + rectWidth/2
    let rgbRange = cvutils.getColorFromImage(
      this.state.flippedFrame, 
      rectLeft, 
      rectTop,  
      rectRight,
      rectBottom,
    )
    
    const lowerHSV = cvutils.RGBtoHSV(rgbRange['lr'],rgbRange['lg'],rgbRange['lb'])
    const upperHSV = cvutils.RGBtoHSV(rgbRange['hr'],rgbRange['hg'],rgbRange['hb'])
    // converted hsv ranges may have maxs and mins swapped
    const hsvRange = {
      'lh' : Math.min(lowerHSV[0],upperHSV[0]),
      'ls' :  Math.min(lowerHSV[1],upperHSV[1]),
      'lv' :  Math.min(lowerHSV[2],upperHSV[2]),
      'hh' :  Math.max(lowerHSV[0],upperHSV[0]),
      'hs' :  Math.max(lowerHSV[1],upperHSV[1]),
      'hv' :  Math.max(lowerHSV[2],upperHSV[2]),
    }
    hsvRange['hs'] = Math.max(hsvRange['hs'], .75)
    hsvRange['hv'] = Math.max(hsvRange['hv'], .75)
    this.setState(hsvRange,()=>{
      this.setColorRange()
    })
    this.setState({
      canvasMouseDownX : null,
      canvasMouseDownY : null,
      showSelectColorText : false,
      calibrationRect : [
          rectLeft, 
          rectTop,  
          rectRight,
          rectBottom,
      ]
    })
  }
  handleTouchEnd = ()=>{
    if (this.state.touchTimer)
        clearTimeout(this.state.touchTimer);
      this.setState({
        calibrationRect : null,
        canvasMouseDownX : null,
        canvasMouseDownY : null,
        showSelectColorText : false,
      })
  }
  handleCanvasMouseDown = (e)=>{
    if(isMobile){
      this.setState({
        touchTimer : setTimeout(this.touchHeld, touchDuration)
      })
    }
    
    const clickCoord = cvutils.calculateRelativeCoord(e, this.canvasOutput)
    this.setState({
      canvasMouseDownX : clickCoord[0],
      canvasMouseDownY : clickCoord[1],
    })
  }
  handleCanvasMouseUp = (e)=>{
    const clickCoord = cvutils.calculateRelativeCoord(e, this.canvasOutput)
    //use flipped frame that has not been drawn on yet
    let rgbRange = cvutils.getColorFromImage(
      this.state.flippedFrame,
      this.state.canvasMouseDownX,
      this.state.canvasMouseDownY,
      clickCoord[0],
      clickCoord[1]
    )
    const lowerHSV = cvutils.RGBtoHSV(rgbRange['lr'],rgbRange['lg'],rgbRange['lb'])
    const upperHSV = cvutils.RGBtoHSV(rgbRange['hr'],rgbRange['hg'],rgbRange['hb'])
    // converted hsv ranges may have maxs and mins swapped
    const hsvRange = {
      'lh' : Math.min(lowerHSV[0],upperHSV[0]),
      'ls' :  Math.min(lowerHSV[1],upperHSV[1]),
      'lv' :  Math.min(lowerHSV[2],upperHSV[2]),
      'hh' :  Math.max(lowerHSV[0],upperHSV[0]),
      'hs' :  255,
      'hv' :  Math.max(lowerHSV[2],upperHSV[2]),
    }
    const hDiff = hsvRange['hh'] - hsvRange['lh'] 
    const minHDiff = 20
    if( hDiff < minHDiff && hsvRange['hh'] < 350){
      hsvRange['hh'] = hsvRange['hh'] + minHDiff - hDiff
    }else if( hDiff < minHDiff && hsvRange['hh'] > 350){
      hsvRange['lh'] = hsvRange['lh'] - minHDiff + hDiff
    }
    this.setState(hsvRange,()=>{
      this.setColorRange()
    })
    this.setState({
      canvasMouseDownX : null,
      canvasMouseDownY : null,
      calibrationRect : null,
      showSelectColorText : false,
    })
  }
  handleCanvasMouseDrag = (e)=>{
    e.preventDefault()
    if(this.state.canvasMouseDownX){
      const mouseCoord = cvutils.calculateRelativeCoord(e, this.canvasOutput)
      const context = this.canvasOutput.getContext("2d")
      this.setState({
        calibrationRect : [
          this.state.canvasMouseDownX,
          this.state.canvasMouseDownY,
          mouseCoord[0],
          mouseCoord[1]
        ]
      })
    }
  }
  render() {

    const colorSwatches = this.state.allColors.map((colorRange,index)=>{
        return(
          // only return the color swatches if the user is on the color mode
          !this.state.usingWhite ? (
          <div
            onClick={()=>{this.selectColor(index)}}
            style={{
              'marginRight': '15px',
              'display':'inline-block',
              'backgroundColor' : cvutils.calculateCurrentHSVString(colorRange,1),
              'width' : '50px',
              'height' : '50px',
              'vertical-align' : 'middle'

            }}>
          </div>) : null
        )

    })

    const videoControls =
      <div>
        <div style={{'marginBottom' :'10px'}}>
          <button style={{'fontSize':'12pt'}} id="calibration" onClick={this.toggleShowRaw}>Calibration View</button>
          <button style={{'fontSize':'12pt'}} id="record" onClick={this.toggleRecording}>Start Recording</button>
          <button style={{'fontSize':'12pt'}} id="download" onClick={this.download} >Download</button>
        </div>
        <video hidden={true} ref={ref => this.recordedVideo = ref} id="recorded" playsInline ></video>
      </div>

    const animationControls =
      <div>
        <h3 className="primary-header">Animation Effects</h3>
        <button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="connections" onClick={this.toggleShowConnections}>Show Connections</button>
        <button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="trailsButton" onClick={this.toggleShowTrails}>Hide Trails</button>
        <button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="starsButton" onClick={this.toggleShowStars}>Show Stars</button>
        <br/>
        <div hidden={false} id="trailSlider">
          <input style={{ "marginRight" : "10px", "width" : "30px"}} value={this.state.trailLength}/><label>Trail Length</label>
          <input  name="ls" type="range" min={0} max={20} value={this.state.trailLength} onChange={this.handleTrailLength}/>
        </div>
        <video hidden={true} muted playsInline autoPlay className="invisible" ref={ref => this.video = ref}></video>
      </div>

    const openInBrowser =  
      this.state.isFacebookApp ? <div style={{fontSize : '16px'}}>
        Does Not Work in Instagram/Facebook Preview.
        <br/>
        Please copy and paste link in browser (Safari for iOS).
      </div>   : null


      const addButton =
      // only show this if the user is in color mode
      !this.state.usingWhite ? (
        <div>
        <div
          style={{
            width : '350px',
            margin : '0 auto',
            marginBottom : '15px'
          }}
         >
        <button style={{'fontSize':'12pt', 'color':'white', 'background-color':'black'}}  onClick={this.toggleWhiteMode} >{this.state.colorModeButtonText}</button>

         <h3 className="secondary-header">Animated Colors</h3>
          {colorSwatches}
           <div
            style={{
              'fontSize':'14px',
              'margin' : '0 auto',
              'border' : '1px solid gray',
              'paddingTop' : '16px',
              'paddingBottom' : '14px',
              'width' : '50px',
              'height' : '20px',
              'display' : 'inline-block',
              'vertical-align' : 'middle'
            }}
            onClick={this.addColor}
          >Add</div>
        </div>
        </div>) : 
        <div>
          <button style={{'fontSize':'12pt', 'color':'white', 'background-color':'black'}}  onClick={this.toggleWhiteMode} >{this.state.colorModeButtonText}</button>
        </div>

    const cantFindBallButton = 
      this.state.usingWhite ? null : <button style={{'fontSize':'12pt', 'backgroundColor' : '#FF6666'}} id="helpButton" onClick={this.showCalibrateHelp}>Can't Find My Ball!</button>
    const HSV = {
                  lh : this.state.lh,
                  hh : this.state.hh,
                  ls : this.state.ls,
                  hs : this.state.hs,
                  lv : this.state.lv,
                  hv : this.state.hv,
                  tv : this.state.tv
                } 
                
    const detectionControls = 
      <div>
          <ColorSliders HSV = {HSV} usingWhite = {this.state.usingWhite} handleHSVSliderChange={this.handleHSVSliderChange}/>
      </div>

    const app = 
      //Don't show app if in-app browser
      //Because getUserMedia doesn't work
      !this.state.isFacebookApp ?
      <div className="App" >
          <h3 style={{marginBottom : '5px'}} className="primary-header">AR Flow Arts</h3>
          <div style={{marginBottom : '15px'}}>Send feedback to @arflowarts on Instagram</div>
          {addButton}
          {detectionControls}
          <canvas ref={ref => this.canvasOutput = ref}
            className="center-block" id="canvasOutput"
              onMouseDown={this.handleCanvasMouseDown}
              onMouseUp={this.handleCanvasMouseUp}
              onMouseMove={this.handleCanvasMouseDrag}
              onTouchStart={this.handleCanvasMouseDown}
              onTouchEnd={this.handleTouchEnd}
              onTouchMove={this.handleTouchEnd}
            ></canvas>
            {cantFindBallButton}
            {videoControls}

          {animationControls}
      </div> : null
    // TOP LAYER
    return (
      <div>
        {app}
        {openInBrowser}
     </div>
    );
  }
}

export default App;

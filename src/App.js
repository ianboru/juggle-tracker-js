import React, { Component } from 'react';
import './App.css';
import cv from 'opencv.js';
import cvutils from './cvutils';
import drawingUtils from './drawingUtils'
import trackingUtils from './trackingUtils'
import { HuePicker } from 'react-color';
import ColorSliders from './colorSliders'
import Recorder from './recorder'
import { MdHelp } from "react-icons/md"
import Terminal from 'terminal-in-react';
//@observer
const calibrateHelp = `Calibration Process:\n
1: Click 'Calibration View' to see what the computer sees.
2: Set 'Hue Center' slider to approximate color of prop
3: Adjust the sliders so that the props are white and the background is black.
4: Make the 'saturation' and 'value' ranges as large as possible.

Tips:\n
1: Use bright balls that are distinct colors from background and clothes.
2: Turn on all the lights.
3: Don't point the camera at the lights.
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
    // Color blue (initial value for hsv sliders)
    lh : 180, ls : .2, lv : .2, hh : 230, hs : 1, hv : 1,
    tv : cvutils.initialHSV.tv,
    net : null,
    allColors : [cvutils.initialHSV],
    colorNum : 0,
    positions : [],
    totalNumColors : 1,
    showRaw : true,
    usingWhite : false,
    trailLength : 1,
    // Animation Controls (connctions, disco, and stars off, trails on)
    showConnections:false, showStars:false, discoMode:false, showTrails:true,
    canvasStream : null,
    // Lists that contain data about stars
    starsX:[], starsY:[], starsDx:[], starsDy:[],starsSize:[], starsColor:[],
    // Coordinates of mouse when pressed
    canvasMouseDownX : null, canvasMouseDownY : null,
    calibrationRect : null,
    showSelectColorText : true,
    touchTimer : null,
    isFacebookApp : false,
    colorModeButtonText : 'Use White Props',
    recording : null,
    discoTimer : null,
    discoColorNumber : 0,
    videoFile : null,
    fileUploaded : false,
    discoHue : 0,
  }

  componentDidMount=()=>{
    const isFacebookApp = this.isFacebookApp()
    if(!isFacebookApp){
      this.startCamera()
    }
    this.setState({
      isFacebookApp
    })
    document.title = "AR Flow Arts"
  }

  isFacebookApp=()=>{
    let ua = navigator.userAgent || navigator.vendor || window.opera;
    return (ua.indexOf("FBAN") > -1) || (ua.indexOf("FBAV") > -1) || (ua.indexOf("Instagram") > -1);;
  }

  startCamera=()=> {
    let that = this
    // Break if the camera is already streaming
    if (this.state.streaming) return;
    // Get video
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
    if (!this.state.streaming) { console.warn("Please startup your webcam"); return; }
    this.stopVideoProcessing();
    requestAnimationFrame(this.processVideo);
  }

  stopVideoProcessing = () =>{
    let src = this.state.src
    if (src != null && !src.isDeleted()) src.delete();
  }

  toggleWhiteMode=()=>{
    // Toggle the text on the button
    let colorModeButtonText = ""
    if (!this.state.usingWhite) {
      colorModeButtonText = 'Use Color Props';
    }else {
      colorModeButtonText = 'Use White Props';
    }
    // Change the state to reflect changes
    this.setState({
      usingWhite : !this.state.usingWhite,
      colorModeButtonText
    })
  }

  toggleRecording=()=>{
    // Change the text on the record button
    const recordButton = document.querySelector('button#record');
    // User wants to record
    if (recordButton.textContent === 'Start Recording') {
      // Start the camera if not already streaming
      if(!this.state.streaming){
        this.startCamera()
      }
      this.canvasOutput.hidden = false
      this.canvasOutput.style.display = "inline"
      // Capture the video stream, and set recording to true
      this.setState({
        canvasStream : this.canvasOutput.captureStream(),
        recording : true
      })
      // Now recording, the button needs to change to 'stop' recording
      const recordButton = document.querySelector('button#record');
      recordButton.textContent = 'Stop Recording';
    // User wants to stop recording
    } else {
      // Stop recording
      this.setState({
        canvasStream : null,
        recording : false
      })
      // Stop the camera
      this.stopCamera();
      this.canvasOutput.style.display = "none"
      // Now stopped, the button needs to change to 'start' recording
      recordButton.textContent = 'Start Recording';
    }
  }

  getMatFromCanvas=(context)=>{
    // Create a new blank mat (or canvas) to draw on
    let srcMat = new cv.Mat(this.state.videoHeight, this.state.videoWidth, cv.CV_8UC4);
    // Get the image data from the source video
    let imageData = context.getImageData(0, 0, this.state.videoWidth, this.state.videoHeight);
    // Set the image onto the srcMat
    srcMat.data.set(imageData.data);
    imageData = null
    return srcMat
  }

  processVideo=()=> {
    if(this.canvasOutput){
      const context = this.canvasOutput.getContext("2d")
      context.clearRect( 0, 0, this.state.videoWidth, this.state.videoHeight)
      // Use the uploaded file
      if(this.state.fileUploaded){
        drawingUtils.fitVidToCanvas(this.canvasOutput, this.uploadedVideo)
      // Use the webcam image
      }else{
        context.drawImage(this.video, 0, 0, this.state.videoWidth, this.state.videoHeight);
      }
      // Get the srcMat from the canvas
      let srcMat = this.getMatFromCanvas(context)
      // Flip horizontally because camera feed is pre-flipped
      if(!this.state.fileUploaded){
        cv.flip(srcMat, srcMat,1)
      }
      // If the mouse is down, clone the srcMat and save it as flippedFrame
      if(this.state.canvasMouseDownX){
        this.setState({flippedFrame : srcMat.clone()})
      }
      // Show the srcMat to the user
      cv.imshow('canvasOutput',srcMat)
      // Create a temporary image to store the color segmentation
      let colorFilteredImage
      // Iterate through each color being tracked
      this.state.allColors.forEach((colorRange,colorNum)=>{
        // If colored balls are being used, use cvutils.colorfilter
        if(!this.state.usingWhite){
          colorFilteredImage = cvutils.colorFilter(srcMat.clone(), colorRange)
        // If white balls are being used, use cvutils.colorWhite
        }else{
          colorFilteredImage = cvutils.colorWhite(srcMat.clone(), colorRange)
        }
        // Get the ball locations
        const ballLocations = cvutils.findBalls(colorFilteredImage.clone())
        // Update the tracking history
        this.state.positions = trackingUtils.updateBallHistories(ballLocations, colorNum, this.state.positions)
        // If in calibration mode
        if(!this.state.showRaw && colorNum == this.state.colorNum){
          // Initialize final canvas with the mask of the colors within the color ranges
          // This setting is used when calibrating the colors
          cv.imshow('canvasOutput',colorFilteredImage)
        }
        // Get the color values for the object being tracked (white if usingWhite)
        let color = this.state.usingWhite ? "white" : cvutils.calculateCurrentHSVString(colorRange)
        // If disco mode is on, use the current disco color
        if(this.state.discoMode){
          color = 'rgb(' + cvutils.hsvToRgb(this.state.discoHue, 100,100) + ')'
        }
        //Draw trails
        if(this.state.showTrails){
          drawingUtils.drawTrails(context,this.state.positions[colorNum], color, this.state.trailLength)
        }
        // Draw connections
        if(this.state.showConnections){
          drawingUtils.drawConnections(context, this.state.positions[colorNum], color)
        }
        // Draw Stars
        if(this.state.showStars){
          // Draw the stars. Get the updated stars' positions.
          const newStars = drawingUtils.drawStars(context, this.state.positions[colorNum],this.state.starsX,this.state.starsY,this.state.starsDx,this.state.starsDy,this.state.starsSize,this.state.starsColor,this.state.discoHue)
          // Update the global stars variable
          this.setState(newStars)
        }
      })
      // If the user is clicking and draging to select a color
      if(this.state.calibrationRect){
        //Draw color selection rectangle
        context.strokeStyle = "#ffffff"
        const rect = this.state.calibrationRect
        const scaleFactor = this.state.videoWidth/this.canvasOutput.clientWidth
        context.strokeRect(rect[0]*scaleFactor,rect[1]*scaleFactor,(rect[2]-rect[0])*scaleFactor,(rect[3]-rect[1])*scaleFactor)
      }
      // Shows text to instruct user
      if(this.state.showSelectColorText){
        drawingUtils.drawSelectColorText(context, isMobile, this.state.usingWhite)
      }
      //Trim histories to trail length
      this.state.positions = trackingUtils.trimHistories(this.state.positions, this.state.trailLength)
      //Clean up all possible data
      colorFilteredImage.delete();srcMat.delete()
      srcMat = null; colorFilteredImage = null
      //Process next frame
      requestAnimationFrame(this.processVideo);
    }
  }

  handleHSVSliderChange=(e)=>{
    // Log the slider change
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
    // Change the state
    this.setState({
      showRaw : !this.state.showRaw
    })
    // Show an alert about how to calibrate
    if(this.state.showRaw){
      alert(
        `Calibration Process:\n
        Set 'Hue Center' slider to approximate color of prop
        Adjust sliders until prop is completely white and the background is black`
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

  changeDiscoColor=()=>{
    // Disco hue goes from 0 to 360 (rainbow)
    this.state.discoHue = this.state.discoHue + 4
    // When the hue reaches 360, it goes back to zero (HSV colorspace loops)
    if(this.state.discoHue>360){
      this.state.discoHue = 0
    }
  }

  toggleDiscoMode=()=>{
    // Disco color changes, so a timer is required
    const discoInterval = 1
    // Toggle the text on the button
    const discoButton = document.querySelector('button#discoModeButton');
    if (discoButton.textContent === 'Disco Mode') {discoButton.textContent = 'Stop Disco';}
    else {discoButton.textContent = 'Disco Mode';}
    // Update disco state and timer
    if(this.state.discoTimer){clearInterval(this.state.discoColorNumber)}
    this.setState({
      discoMode : !this.state.discoMode,
      discoTimer : setInterval(this.changeDiscoColor, discoInterval)
    })
  }

  toggleShowTrails=()=>{
    //Toggle the text on the trails button
    const trailsButton = document.querySelector('button#trailsButton');
    if (trailsButton.textContent === 'Show Trails') {trailsButton.textContent = 'Hide Trails';}
    else {trailsButton.textContent = 'Show Trails';}
    // Update the state
    this.setState({
      showTrails : !this.state.showTrails
    },()=>{
      // Hide the trail length slider
      const slider = document.getElementById("trailSlider")
      slider.hidden = !this.state.showTrails
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

  handleFile = ()=>{
    let URL = window.URL || window.webkitURL

    let file = this.input.files[0]
    if(!file){return}
    let type = file.type
    let canPlay = this.uploadedVideo.canPlayType(type)
    if (canPlay === '') canPlay = 'no'
    let message = 'Can play type "' + type + '": ' + canPlay
    let isError = canPlay === 'no'

    let fileURL = URL.createObjectURL(file)
    this.uploadedVideo.src = fileURL
    this.setState({
      fileUploaded : true
    })
  }

  handlePlayUploaded = ()=>{
    const recordButton = document.querySelector('button#playUploadedButton');
    if(this.uploadedVideo.currentTime > 0 && !this.uploadedVideo.paused && !this.uploadedVideo.ended){
      this.uploadedVideo.pause()
      recordButton.textContent = 'Play Video';
    }else{
      this.uploadedVideo.play()
      this.stopCamera()
      recordButton.textContent = 'Pause Video';
    }
  }

  handleVideoEnded = ()=>{
    const recordButton = document.querySelector('button#playUploadedButton');
    recordButton.textContent = 'Play Video';
  }

  render() {
    const colorSwatches = this.state.allColors.map((colorRange,index)=>{
        const borderString = index == this.state.colorNum ? '3px solid black' : 'none'

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
              'border' : borderString,
              'vertical-align' : 'middle'

            }}>
          </div>) : null
        )

    })

    const fileButton = this.input ? <button style={{'fontSize':'12pt'}} onClick={()=>{this.input.click()}}>Upload Video</button> : null
    let playUploadedButton
    if(this.input){
      playUploadedButton = this.state.fileUploaded ? <button style={{'fontSize':'12pt'}} id="playUploadedButton" onClick={this.handlePlayUploaded}>Play Video</button> : null
    }

    const videoControls =
      <div>
        <div style={{'marginBottom' :'10px'}}>
          <button style={{'fontSize':'12pt'}} id="record" onClick={this.toggleRecording}>Start Recording</button>
          <input className='invisible' type="file" accept="video/*" ref={ref => this.input = ref} src={this.state.videoFile} onChange={this.handleFile}/>
          {fileButton}
          {playUploadedButton}
        </div>
      </div>
    const animationControls =
      <div>
        <h3 className="primary-header">Animation Effects</h3>
        <button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="connections" onClick={this.toggleShowConnections}>Show Connections</button>
        <button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="trailsButton" onClick={this.toggleShowTrails}>Hide Trails</button>
        <button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="starsButton" onClick={this.toggleShowStars}>Show Stars</button>
        <button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="discoModeButton" onClick={this.toggleDiscoMode}>Disco Mode</button>
        <br/>
        <div hidden={false} id="trailSlider">
          <input style={{ "marginRight" : "10px", "width" : "30px"}} value={this.state.trailLength}/><label>Trail Length</label>
          <input  name="ls" type="range" min={0} max={20} value={this.state.trailLength} onChange={this.handleTrailLength}/>
        </div>
        <video hidden={true} muted playsInline autoPlay className="invisible live-video" ref={ref => this.video = ref}></video>
        <video hidden={true} muted playsInline autoPlay onEnded={this.handleVideoEnded}   className="invisible live-video" ref={ref => this.uploadedVideo = ref}></video>
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
        <button style={{'fontSize':'12pt','marginLeft' : '10px'}} id="calibration" onClick={this.toggleShowRaw}>Calibration View</button>
        <MdHelp style={{'fontSize':'15pt','marginLeft' : '10px'}} id="helpButton" onClick={this.showCalibrateHelp}/>
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
          <button style={{'fontSize':'12pt','marginLeft' : '10px'}} id="calibration" onClick={this.toggleShowRaw}>Calibration View</button>
          <MdHelp style={{'fontSize':'15pt','marginLeft' : '10px'}} id="helpButton" onClick={this.showCalibrateHelp}/>
        </div>

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
          <div style={{marginBottom : '25px', 'fontSize' : '10px'}}>Send feedback to @arflowarts on Instagram</div>
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
          <Recorder recording={this.state.recording} canvasStream={this.state.canvasStream}/>
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

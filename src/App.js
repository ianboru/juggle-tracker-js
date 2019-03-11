import React, { Component } from 'react';
import './App.css';
import cv from 'opencv.js';
import cvutils from './cvutils';
import drawingUtils from './drawingUtils'
import trackingUtils from './trackingUtils'
import ColorControls from './colorControls'
import AnimationControls from './animationControls'
import DetectionControls from './detectionControls'
import Camera from './camera'
import { MdHelp } from "react-icons/md"
import { observer } from "mobx-react"
import store from "./store"
import InteractiveCanvas from "./interactiveCanvas"
const calibrateHelp = `Calibration Process\n
  == Basic Calibration ==
  1: (optional) Click and drag a box over the prop 
  2: Adjust Hue sliders to capture the range of colors on your prop
  3: Raise Saturation minimum to cut out less colored background objects
     Lower Saturation minimum to include less colored parts of prop
  4: Raise Value minimum to cut out darker background objects
  4: Lower Value minimum to include darker parts of the props
  5: Add another color and repeat if your props are multiple colors 

  == Advanced Calibration ==
  1: Click "Advanced Calibaion"
  2: Click "Calibration View", this shows what is being detected for the current color
  3: Repeat == Basic Calibration ==
  
  == Tips== 
  1: Use bright balls that are distinct colors from background and clothes.
  2: Turn on all the lights.
  3: Light yourself and props from the front not the back
`
let tempMat = new cv.Mat();
@observer
class App extends Component {

  state = {
    dst : null,
    // Color blue (initial value for hsv sliders)
    net : null,
    positions : [], 
    canvasStream : null,
    isFacebookApp : false,
    discoHue : 0,
    startTime : null,
    contourLocations : []
  }

  componentDidMount=()=>{
    const isFacebookApp = this.isFacebookApp()
    this.setState({
      isFacebookApp
    })
    document.title = "AR Flow Arts"
    store.setHiddenCanvas(this.hiddenCanvas)

  }

  isFacebookApp=()=>{
    let ua = navigator.userAgent || navigator.vendor || window.opera;
    return (ua.indexOf("FBAN") > -1) || (ua.indexOf("FBAV") > -1) || (ua.indexOf("Instagram") > -1);;
  }

  startVideoProcessing=()=> {
    //Fix for firefox to have context available
    const context = store.canvasOutput.getContext("2d")
    const hiddenContext = store.hiddenCanvas.getContext("2d")

    this.state.startTime = new Date().getTime();
    requestAnimationFrame(this.animate);
  }
  handleVideoData=(canvas)=>{
    const context = canvas.getContext("2d")
    const outputContext = store.canvasOutput.getContext("2d")
    context.clearRect( 0, 0, store.videoWidth, store.videoHeight)
    outputContext.clearRect( 0, 0, store.videoWidth, store.videoHeight)

    if(store.uploadedVideo){
      // Use the uploaded file
      drawingUtils.fitVidToCanvas(canvas, store.uploadedVideo)
    }else{
      // Use the webcam image
      if(!store.liveVideo){
        return null
      }
      context.drawImage(store.liveVideo, 0, 0, store.videoWidth, store.videoHeight);
    }

    // Get the srcMat from the canvas
    let srcMat = cvutils.getMatFromCanvas(context, store.videoWidth, store.videoHeight)
    // Flip horizontally because camera feed is pre-flipped
    if(!store.uploadedVideo){
      cv.flip(srcMat, srcMat,1)
    }
    // If the mouse is down, clone the srcMat and save it as flippedFrame
    if(store.mouseDown){
      store.setFlippedFrame(srcMat.clone())
    }
    // Show the srcMat to the user
    cv.imshow('hiddenCanvas',srcMat)
    srcMat = cvutils.downSize(srcMat)
    return srcMat
  }
  processCurrentColor=(colorRange=null, colorNum=null, context,srcMat)=>{
    let colorFilteredImage
    let color
    // If colored balls are being used, use cvutils.colorfilter
    if(!store.usingWhite){
      colorFilteredImage = cvutils.colorFilter(srcMat, tempMat, colorRange)
      color = cvutils.calculateCurrentHSV(colorRange)
    // If white balls are being used, use cvutils.colorWhite
    }else{
      colorFilteredImage = cvutils.colorWhite(srcMat, tempMat)
      color = "hsl(175,0%,100%)"
    }
    if(!store.showContourOutlines){
       // Get the ball locations
      const ballLocations = cvutils.findBalls(colorFilteredImage)
      // Update the tracking history
      this.state.positions = trackingUtils.updateBallHistories(ballLocations, colorNum, this.state.positions)
    }else{
      this.state.contourLocations = cvutils.findContours(colorFilteredImage)
    }
    
    // If in calibration mode
    if(store.calibrationMode && (colorNum === store.colorNum || store.usingWhite)){
      // Initialize final canvas with the mask of the colors within the color ranges
      // This setting is used when calibrating the colors
      let contourImage= cvutils.getContourImage(colorFilteredImage, colorRange)
      let upSizedContours 
      if(store.imageScale != 1){
        upSizedContours = cvutils.upSize(contourImage.clone())
      }
      if(upSizedContours){
        cv.imshow('hiddenCanvas',upSizedContours)
        upSizedContours.delete()
      }else{
        cv.imshow('hiddenCanvas',contourImage)
      }
      contourImage.delete()
    }
    // Get the color values for the object being tracked (white if usingWhite)
    
    this.drawEffects(context,colorNum,color)
  }
  drawEffects=(context,colorNum,color)=>{
    if(store.showBrushColor){
      color = 'rgb(' + cvutils.hsvToRgb(store.brushColor, 100,100) + ')'
    }
    // If disco mode is on, use the current disco color
    if(store.discoMode){
      color = 'rgb(' + cvutils.hsvToRgb(this.state.discoHue, 100,100) + ')'
      // Update the disco hue so that the color changes
      this.state.discoHue = this.state.discoHue + store.discoIncrement
      // When the hue reaches 360, it goes back to zero (HSV colorspace loops)
      if(this.state.discoHue>360){
        this.state.discoHue = 0
      }
    }
    //Draw trails
    if(store.showTrails){
      drawingUtils.drawCircleTrails(context,this.state.positions[colorNum], color, store.trailThickness, store.opacity)
    }
    if(store.showContourOutlines){
      drawingUtils.drawContours(context,this.state.contourLocations, color)
    }
    // Draw connections
    if(store.showConnections){
      drawingUtils.drawConnections(context, this.state.positions[colorNum], color, store.connectionThickness, store.opacity)
    }
    if(store.showAllConnections){
      drawingUtils.drawAllConnections(context, this.state.positions, store.allColors)
    }
    // Draw Stars
    if(store.showStars){
      // Draw the stars. Get the updated stars' positions.
      drawingUtils.drawStars(context, this.state.positions[colorNum],color)
      // Update the global stars variable
    }
  }
  animate=()=> {
    if(store.canvasOutput){
      if(store.videoWidth === 0 || store.videoWidth == null && !store.uploadedVideo){
        requestAnimationFrame(this.animate);
        return
      }
      const context = store.hiddenCanvas.getContext("2d")
      let srcMat = this.handleVideoData(store.hiddenCanvas);
      if(!srcMat){
        requestAnimationFrame(this.animate);
        return
      }
      // Iterate through each color being tracked
      srcMat = cvutils.prepareImage(srcMat)

      if(!store.usingWhite){
        store.allColors.forEach((colorRange,colorNum)=>{
          this.processCurrentColor(colorRange, colorNum, context, srcMat)
        })
      }else{
        this.processCurrentColor(null, null, context, srcMat)
      }
      // If the user is clicking and draging to select a color
      const scaleFactor = store.videoWidth/store.hiddenCanvas.width
      if(store.calibrationRect){
        //Draw color selection rectangle
        context.strokeStyle = "#ffffff"
        const rect = store.calibrationRect
        context.strokeRect(rect[0]*scaleFactor,rect[1]*scaleFactor,(rect[2]-rect[0])*scaleFactor,(rect[3]-rect[1])*scaleFactor)
      }
      // Shows text to instruct user
      if(store.showSelectColorText){
        drawingUtils.drawSelectColorText(context, store.isMobile, store.usingWhite)
      }
      var destCtx = store.canvasOutput.getContext('2d');
      destCtx.drawImage(store.hiddenCanvas, 0,0, store.videoWidth, store.videoHeight)
      //Trim histories to trail length
      this.state.positions = trackingUtils.trimHistories(this.state.positions, store.trailLength)
      //srcMat.delete();srcMat = null;
      srcMat.delete();srcMat = null
      //Process next frame
      requestAnimationFrame(this.animate);

    }
  }

  selectColor=(i)=>{
    store.selectColor(i)
  }

  showCalibrateHelp = (asdf) =>{
    alert(calibrateHelp)
  }

  render() {
    const colorSwatches = store.allColors.map((colorRange,index)=>{
        const borderString = index === store.colorNum ? '3px solid black' : 'none'

        return(
          // only return the color swatches if the user is on the color mode
          !store.usingWhite ? (
          <div
            onClick={()=>{this.selectColor(index)}}
            style={{
              'marginRight': '15px',
              'display':'inline-block',
              'backgroundColor' : cvutils.calculateCurrentHSV(colorRange),
              'width' : '25px',
              'height' : '25px',
              'border' : borderString,
              'vertical-align' : 'middle'

            }}>
          </div>) : null
        )

    })

    const openInBrowser =
      this.state.isFacebookApp ? <div style={{fontSize : '16px'}}>
        Does Not Work in Instagram/Facebook Preview.
        <br/>
        Please copy and paste link in browser (Safari for iOS).
      </div>   : null

    const addButton =
      // only show this if the user is in color mode
      !store.usingWhite ? (
        <div>
        <div
          style={{
            width : '100%',
            margin : '0 auto',
            marginBottom : '10px',
            marginTop : '10px'

          }}
         >
          {colorSwatches}
           <div
            style={{
              'fontSize':'11px',
              'margin' : '0 auto',
              'border' : '1px solid gray',
              'width' : '25px',
              'height' : '22px',
              'padding-top' : '6px',
              'display' : 'inline-block',
              'vertical-align' : 'middle'
            }}
            onClick={store.addColor}
          >Add</div>
        </div>
        </div>) :
        null
    const buttonClass = (shown)=>{
      return shown ? "active large-button" : "inactive large-button"
    }

    const colorControls = store.showColorControls ? 
      <div className="overlay-controls">
          <h3>Color Controls</h3>
          <button className={buttonClass(store.calibrationMode)} id="showRaw" onClick={store.toggleCalibrationMode}>Calibration View</button>
          <button className={buttonClass(store.usingWhite)} id="usingWhite" onClick={store.toggleUsingWhite}>Bright Props</button>
          {addButton}
          <ColorControls usingWhite = {store.usingWhite} />
      </div> : null
    const animationControls = store.showAnimationControls ? 
      <div className="overlay-controls">
          <h3>Animation Controls</h3>
          <AnimationControls/>
      </div> : null
    const detectionControls = store.showDetectionControls ? 
      <div className="overlay-controls">
          <h3>Advanced Detection Controls</h3>
          <DetectionControls/>
      </div> : null
    
    const app =
      //Don't show app if in-app browser
      //Because getUserMedia doesn't work
      !this.state.isFacebookApp ?
      <div className="App" >
          <h3 style={{marginBottom : '5px'}} className="primary-header">AR Flow Arts</h3>
          <div style={{marginBottom : '10px', 'fontSize' : '10px'}}>Version 1.0</div>
          <div style={{marginBottom : '10px', 'fontSize' : '10px'}}>Send feedback to @arflowarts on Instagram</div>
          <MdHelp style={{'fontSize':'18pt','marginLeft' : '10px'}} id="helpButton" onClick={this.showCalibrateHelp}/>
          <br/>
          <button onClick={()=>{store.toggleShowControls("color")}} className={buttonClass(store.showColorControls)}>Color Calibration</button>
          <button onClick={()=>{store.toggleShowControls("animation")}} className={buttonClass(store.showAnimationControls)}>Animations</button>
          <button onClick={()=>{store.toggleShowControls("detection")}} className={buttonClass(store.showDetectionControls)}>Advanced Calibration</button>
          <div className="videoContainer">
            {colorControls}
            {detectionControls}
            {animationControls}
            <InteractiveCanvas className="center-block canvas"/>
            <canvas 
              ref={ref => this.hiddenCanvas = ref}
              id="hiddenCanvas"
              className="canvas"
            ></canvas>
          </div>
          <Camera 
            isFacebookApp={this.state.isFacebookApp}
            startVideoProcessing={this.startVideoProcessing}
          />          

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
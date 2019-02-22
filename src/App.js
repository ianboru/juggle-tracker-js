import React, { Component } from 'react';
import './App.css';
import cv from 'opencv.js';
import cvutils from './cvutils';
import drawingUtils from './drawingUtils'
import trackingUtils from './trackingUtils'
import { HuePicker } from 'react-color';
import ColorSliders from './colorSliders'
import AnimationControls from './animationControls'
import DetectionControls from './detectionControls'
import Recorder from './recorder'
import Camera from './camera'
import { MdHelp } from "react-icons/md"
import { observer } from "mobx-react"
import store from "./store"
import drawingStore from "./drawingStore"
import InteractiveCanvas from "./interactiveCanvas"
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
@observer
class App extends Component {

  state = {
    dst : null,
    flippedFrame : null,
    startTime : Date.now(),
    // Color blue (initial value for hsv sliders)
    tv : cvutils.initialHSV.tv,
    net : null,
    allColors : [cvutils.initialHSV],
    positions : [], 
    canvasStream : null,
    showSelectColorText : true,
    isFacebookApp : false,
    discoHue : 0,
    blurSize : 1,
    closeSize : 1,
    normalizeRGB : false,
    normalizeHSV : false,
  }

  componentDidMount=()=>{
    const isFacebookApp = this.isFacebookApp()
    this.setState({
      isFacebookApp
    })
    document.title = "AR Flow Arts"
  }

  isFacebookApp=()=>{
    let ua = navigator.userAgent || navigator.vendor || window.opera;
    return (ua.indexOf("FBAN") > -1) || (ua.indexOf("FBAV") > -1) || (ua.indexOf("Instagram") > -1);;
  }

  startVideoProcessing=()=> {
    //Fix for firefox to have context available
    const context = store.canvasOutput.getContext("2d")
    requestAnimationFrame(this.processVideo);
  }

  processVideo=()=> {
    let lastVideo = null
    if(store.canvasOutput){
      if(store.videoWidth == 0){
        requestAnimationFrame(this.processVideo);
        return
      }
      let video
      const context = store.canvasOutput.getContext("2d")
      if(lastVideo){ 
        context.clearRect( 0, 0, video.videoWidth, video.videoHeight)
      }
      if(store.uploadedVideo){
        // Use the uploaded file
        video = store.uploadedVideo
        drawingUtils.fitVidToCanvas(store.canvasOutput, store.uploadedVideo)
      }else{
        // Use the webcam image
        context.drawImage(store.liveVideo, 0, 0, store.liveVideo.videoWidth, store.liveVideo.videoHeight);
      }
      

      // Get the srcMat from the canvas
      let srcMat = cvutils.getMatFromCanvas(context, store.videoWidth, store.videoHeight)
      // Flip horizontally because camera feed is pre-flipped
      if(!store.uploadedVideo){
        cv.flip(srcMat, srcMat,1)
      }
      // If the mouse is down, clone the srcMat and save it as flippedFrame
      if(store.calibrationRect){
        this.setState({flippedFrame : srcMat.clone()})
      }
      // Show the srcMat to the user
      cv.imshow('canvasOutput',srcMat)
      // Create a temporary image to store the color segmentation
      let colorFilteredImage
      // Iterate through each color being tracked
      store.allColors.forEach((colorRange,colorNum)=>{
        // If colored balls are being used, use cvutils.colorfilter
        if(!store.usingWhite){
          colorFilteredImage = cvutils.colorFilter(srcMat, colorRange, store.blurAmount)
        // If white balls are being used, use cvutils.colorWhite
        }else{
          colorFilteredImage = cvutils.colorWhite(srcMat, colorRange, store.blurAmount)
        }
        // Get the ball locations
        const ballLocations = cvutils.findBalls(colorFilteredImage, store.sizeThreshold)

        // Update the tracking history
        this.state.positions = trackingUtils.updateBallHistories(ballLocations, colorNum, this.state.positions)

        // If in calibration mode
        if(store.calibrationMode && colorNum == store.colorNum){
          // Initialize final canvas with the mask of the colors within the color ranges
          // This setting is used when calibrating the colors
          cv.imshow('canvasOutput',colorFilteredImage)
        }
        // Get the color values for the object being tracked (white if usingWhite)
        let color = cvutils.calculateCurrentHSV(colorRange)
        let currentColor = store.animationColor
        // If disco mode is on, use the current disco color
        if(store.discoMode){
          color = 'rgb(' + cvutils.hsvToRgb(this.state.discoHue, 100,100) + ')'
          currentColor = this.state.discoHue
          // Update the disco hue so that the color changes
          this.state.discoHue = this.state.discoHue + store.discoIncrement
          // When the hue reaches 360, it goes back to zero (HSV colorspace loops)
          if(this.state.discoHue>360){
            this.state.discoHue = 0
          }
        }
        //Draw trails
        if(store.showTrails){
          drawingUtils.drawTrails(context,this.state.positions[colorNum], color, store.trailLength)
        }
        // Draw connections
        if(store.showConnections){
          drawingUtils.drawAllConnections(context, this.state.positions, store.allColors)
          //drawingUtils.drawConnections(context, this.state.positions[colorNum], color, store.connectionThickness)
        }
        // Draw Stars
        if(store.showStars){
          // Draw the stars. Get the updated stars' positions.
          drawingUtils.drawStars(context, this.state.positions[colorNum],currentColor, this.state.numStarsPerObject, this.state.starLife)
          // Update the global stars variable
        }
      })

      // If the user is clicking and draging to select a color
      if(store.calibrationRect){
        //Draw color selection rectangle
        context.strokeStyle = "#ffffff"
        const rect = store.calibrationRect
        const scaleFactor = store.liveVideo.videoWidth/store.canvasOutput.clientWidth
        context.strokeRect(rect[0]*scaleFactor,rect[1]*scaleFactor,(rect[2]-rect[0])*scaleFactor,(rect[3]-rect[1])*scaleFactor)
      }
      // Shows text to instruct user
      if(this.state.showSelectColorText){
        drawingUtils.drawSelectColorText(context, store.isMobile, store.usingWhite)
      }
      //Trim histories to trail length
      this.state.positions = trackingUtils.trimHistories(this.state.positions, store.trailLength)
      
      //Clean up all possible data
      colorFilteredImage.delete();srcMat.delete()
      colorFilteredImage = null; srcMat = null
      //Process next frame
      lastVideo = video
      requestAnimationFrame(this.processVideo);
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
        const borderString = index == store.colorNum ? '3px solid black' : 'none'

        return(
          // only return the color swatches if the user is on the color mode
          !store.usingWhite ? (
          <div
            onClick={()=>{this.selectColor(index)}}
            style={{
              'marginRight': '15px',
              'display':'inline-block',
              'backgroundColor' : cvutils.calculateCurrentHSV(colorRange,1),
              'width' : '50px',
              'height' : '50px',
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
            width : '350px',
            margin : '0 auto',
            marginBottom : '15px'
          }}
         >
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
            onClick={store.addColor}
          >Add</div>
        </div>
        </div>) :
        <div>
          <MdHelp style={{'fontSize':'15pt','marginLeft' : '10px'}} id="helpButton" onClick={this.showCalibrateHelp}/>
        </div>

    const HSV = {}
    const AnimationParameters = {}
    const DetectionControlsConst = {}   

    const detectionControlSliders =
      <div>
          <ColorSliders HSV = {HSV} usingWhite = {store.usingWhite} handleHSVSliderChange={this.handleHSVSliderChange}/>
      </div>
    const animationControlSliders =
      <div>
          <AnimationControls AnimationParameters = {AnimationParameters} handleAnimationControlsChange={this.handleAnimationControlsChange}/>
      </div>
    const detectionControls = 
      <div className="detection-controls">
          <DetectionControls DetectionControlsConst = {DetectionControlsConst} handleDetectionControlsChange={this.handleDetectionControlsChange}/>
      </div>

    const app =
      //Don't show app if in-app browser
      //Because getUserMedia doesn't work
      !this.state.isFacebookApp ?
      <div className="App" >
          <h3 style={{marginBottom : '5px'}} className="primary-header">AR Flow Arts</h3>
          <div style={{marginBottom : '25px', 'fontSize' : '10px'}}>Send feedback to @arflowarts on Instagram</div>
          {addButton}
          {detectionControlSliders}
          {detectionControls}
          <div className="videoContainer">
            {detectionControls}
            <InteractiveCanvas 
              flippedFrame={this.state.flippedFrame}
            ></InteractiveCanvas>
          </div>
          <Camera 
            canvasOutput={store.canvasOutput} 
            isFacebookApp={this.state.isFacebookApp}
            startVideoProcessing={this.startVideoProcessing}
          />          
          {animationControlSliders}

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

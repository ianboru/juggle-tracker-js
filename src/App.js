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
import { MdRemovedRedEye } from "react-icons/md"
import { observer } from "mobx-react"
import store from "./store"
import InteractiveCanvas from "./interactiveCanvas"
import calibrationInactive from "./assets/calibration_inactive.png"
import calibrationActive from "./assets/calibration_active.png"
import UploadControls from './uploadControls'
import BigUploadButton from './bigUploadButton'
import generalUtils from './generalUtils'
const calibrateHelp = `Calibration Process\n
  == Basic Calibration ==
  1: (optional) Click and drag a box over the prop 
  2: Adjust Hue sliders to capture the range of colors on your prop
  3: Raise Saturation minimum to cut out less colored background objects
     Lower Saturation minimum to include less colored parts of prop
  4: Raise Brightness minimum to cut out darker background objects
  4: Lower Brightness minimum to include darker parts of the props
  5: Add another color and repeat if your props are multiple colors 

  == Advanced Calibration ==
  1: Click "Advanced Calibaion"
  2: Click "Calibration View Icon (Eye)", this shows what is being detected for the current color
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
    contourTrails : []
  }
   
  componentDidMount=()=>{
    const isFacebookApp = generalUtils.isFacebookApp()
    this.setState({
      isFacebookApp : true
    })
    document.title = "AR Flow Arts"
    store.setHiddenCanvas(this.hiddenCanvas)
    if(isFacebookApp){
      alert("Visit website outside of instagram/facebook to use live video")
    }
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
    const scaleFactor = (store.canvasOutput.width/store.videoWidth)*store.videoHeight

    const context = canvas.getContext("2d")
    const outputContext = store.canvasOutput.getContext("2d")
    context.clearRect( 0, 0, canvas.width, canvas.height)
    outputContext.clearRect( 0, 0, store.canvasOutput.width, store.canvasOutput.height)

    if(store.videoUploaded){
      // Use the uploaded file
      drawingUtils.fitVidToCanvas(canvas, store.uploadedVideo)
    }else{
      // Use the webcam image
      if(!store.liveVideo){
        return null
      }
      drawingUtils.fitVidToCanvas(canvas, store.liveVideo)
    }

    // Get the srcMat from the canvas
    let srcMat = cvutils.getMatFromCanvas(context, store.hiddenCanvas.width, store.hiddenCanvas.height)
    // Flip horizontally because camera feed is pre-flipped
    if(!store.videoUploaded){
      cv.flip(srcMat, srcMat,1)
    }
    // If the mouse is down, clone the srcMat and save it as flippedFrame
    if(store.mouseDown){
      store.setFlippedFrame(srcMat.clone())
    }
    // Show the srcMat to the user
    cv.imshow('hiddenCanvas',srcMat)
    
    return srcMat
  }
  processCurrentColor=(colorRange=null, colorNum=null, context,preparedMat)=>{
    let color
    let contourImage
    let originalSize = preparedMat.size()
    let colorFilteredImage
    // If colored balls are being used, use cvutils.colorfilter
    if(store.imageScale > 1){  
      preparedMat = cvutils.downSize(preparedMat)
    }
    if(!store.usingWhite){
      colorFilteredImage = cvutils.colorFilter(preparedMat, tempMat, colorRange)
      color = cvutils.calculateCurrentHSV(colorRange)
    // If white balls are being used, use cvutils.colorWhite
    }else{
      colorFilteredImage = cvutils.brightnessFilter(preparedMat, tempMat)
      color = "hsl(175,0%,100%)"
    }
    // Get the ball locations
    const ballLocations = cvutils.findBalls(colorFilteredImage, color)
    // Update the tracking history
    this.state.positions = trackingUtils.updateBallHistories(ballLocations, colorNum, this.state.positions)
  

    if(store.showBrushColor){
      color = 'hsl(' + store.brushColor + ', 100,100)'
    }
    // If disco mode is on, use the current disco color
    if(store.discoMode){
      color = 'hsl(' +this.state.discoHue+', 100,100)'
      // Update the disco hue so that the color changes
      this.state.discoHue = this.state.discoHue + store.discoIncrement
      // When the hue reaches 360, it goes back to zero (HSV colorspace loops)
      if(this.state.discoHue>360){
        this.state.discoHue = 0
      }
    }
    if(store.showContours && !store.calibrationMode){
      contourImage= cvutils.getContourImage(colorFilteredImage, colorRange, color)
    }
    if(store.imageScale > 1 && contourImage){
      contourImage = cvutils.upSize(contourImage, originalSize)
    }
    if(contourImage){
      return contourImage
    }else{
      return null
    }
  }
  drawEffects=(context,colorNum,color)=>{
    // Draw connections
    if(store.showBrushColor){
      color = 'hsl(' + store.brushColor + ', 100%,65%)'
    }
    // If disco mode is on, use the current disco color
    if(store.discoMode){
      color = 'hsl(' +this.state.discoHue+', 100%,65%)'
      // Update the disco hue so that the color changes
      this.state.discoHue = this.state.discoHue + store.discoIncrement
      // When the hue reaches 360, it goes back to zero (HSV colorspace loops)
      if(this.state.discoHue>360){
        this.state.discoHue = 0
      }
    }
    
    //Draw Connections
    if(store.showConnections){
      drawingUtils.drawConnections(context, this.state.positions[colorNum], color)
    }

    //Draw trails
    if(store.showTrails){
      drawingUtils.drawCircles(context,this.state.positions[colorNum], color)
    }

    // Draw rings
    if(store.showRings){
      drawingUtils.drawRings(context,this.state.positions[colorNum], color)
    }    

    // Draw Stars
    if(store.showStars){
      // Draw the stars. Get the updated stars' positions.
      drawingUtils.drawStars(context, this.state.positions[colorNum],color)
      // Update the global stars variable
    }
  }
  combineContoursWithSrc=(contourMat, srcMat)=>{
    // Initialize final canvas with the mask of the colors within the color ranges
    // This setting is used when calibrating the colors
    let dst = new cv.Mat();
    cv.cvtColor(contourMat, dst, cv.COLOR_RGB2RGBA )

    cv.add(dst,srcMat,dst)
    return dst
  }
  addContourTrails=(allContourImage,srcMat)=>{
    let srcWithContours
      if(store.showContours && allContourImage && !store.calibrationMode){
       
        if(store.trailLength > 1 && store.showContours){
          this.state.contourTrails.unshift(allContourImage.clone())
        }

        this.state.contourTrails.forEach((contourImage,index)=>{
          if(index < store.trailLength && contourImage){
              cv.add(contourImage, allContourImage, allContourImage)
          }else if(index > store.trailLength-1 && contourImage){
            this.state.contourTrails[index].delete()
            this.state.contourTrails[index] = null
          }
        })
        if(this.state.contourTrails.length > store.trailLength){
          this.state.contourTrails = this.state.contourTrails.slice(0,store.trailLength-1)
        }

        srcWithContours = this.combineContoursWithSrc(allContourImage,srcMat)
        cv.imshow('hiddenCanvas',srcWithContours)
        if(srcWithContours){
          srcWithContours.delete()
          srcWithContours = null
        }
        allContourImage.delete();allContourImage=null
        srcMat.delete();srcMat = null

      }
  }
  animate=()=> {
    if(store.canvasOutput){
      const scaleFactor = (store.canvasOutput.width/store.videoWidth)*store.videoHeight
      if(store.videoWidth === 0 || store.videoWidth == null && !store.videoUploaded){
        requestAnimationFrame(this.animate);
        return
      }
      const context = store.hiddenCanvas.getContext("2d")
      let srcMat = this.handleVideoData(store.hiddenCanvas);
      if(!srcMat){
        requestAnimationFrame(this.animate);
        return
      }
      if(store.videoUploaded && !store.uploadedDimensionsExist){
        store.setUploadedVideoDimensions()  
      }
      // Iterate through each color being tracked
      let preparedMat = cvutils.prepareImage(srcMat.clone())
      let allContourImage = new cv.Mat();
      if(!store.usingWhite){
        store.allColors.forEach((colorRange,colorNum)=>{
          const contourImage = this.processCurrentColor(colorRange, colorNum, context, preparedMat)
          if(contourImage){  
            if(allContourImage.cols > 0){
              cv.add(contourImage, allContourImage, allContourImage )
            }else{
              allContourImage = contourImage.clone()
            }
            contourImage.delete()
          }
        })
      }else{
        allContourImage.delete()
        allContourImage = this.processCurrentColor(null, 0, context, preparedMat)
      }

      if(allContourImage && allContourImage.cols > 0 && store.calibrationMode){
        cv.imshow('hiddenCanvas',allContourImage)
      }
      this.addContourTrails(allContourImage, srcMat)
      
      if(store.showAllConnections ){
        drawingUtils.drawAllConnections(context, this.state.positions, store.allColors)
      }
      store.allColors.forEach((colorRange,colorNum)=>{
        let color
        if(!store.usingWhite){
          color = cvutils.calculateCurrentHSV(colorRange)
        }else{
          color = "hsl(175,0%,100%)"
        }
        this.drawEffects(context,colorNum,color)
      })

      // If the user is clicking and draging to select a color
      if(store.calibrationRect){
        //Draw color selection rectangle
        context.strokeStyle = "#ffffff"
        context.lineWidth = 3
        const rect = store.calibrationRect
        context.strokeRect(rect[0],rect[1],(rect[2]-rect[0]),(rect[3]-rect[1]))
      }
      // Shows text to instruct user
      if(store.showSelectColorText){
        drawingUtils.drawSelectColorText(context, store.isMobile, store.usingWhite)
      }
      drawingUtils.fitVidToCanvas(store.canvasOutput, store.hiddenCanvas)
      //Trim histories to a value that is greater than trail length and ring history length
      this.state.positions = trackingUtils.trimHistories(this.state.positions, store.trailLength)
      preparedMat.delete();preparedMat = null
      
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
              'border' : '2px solid black',
              'width' : '30px',
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

    const tabClass = (shown)=>{
      return shown ? "active tab" : "inactive tab"
    }
    const colorControls = store.showColorControls ? 
      <div className="overlay-controls">
          <span className={tabClass(!store.usingWhite) + " left-tab"} id="usingColor" onClick={store.setColorMode}>Colored</span>
          <span className={tabClass(store.usingWhite) + " right-tab"} id="usingWhite" onClick={store.setBrightnessMode}>Bright</span>
          {addButton}
          <ColorControls usingWhite = {store.usingWhite} />
      </div> : null
    const animationControls = store.showAnimationControls ? 
      <div className="overlay-controls">
          <AnimationControls/>
      </div> : null
    const detectionControls = store.showDetectionControls ? 
      <div className="overlay-controls">
        <DetectionControls/>
      </div> : null
    const uploadControls = store.showBigUploadButton ? 
    <BigUploadButton startVideoProcessing={this.startVideoProcessing}/> : 
    <UploadControls startVideoProcessing={this.startVideoProcessing}/>
    const app =
      //Don't show app if in-app browser
      //Because getUserMedia doesn't work
      <div className="App" >
          <h3 style={{marginBottom : '5px'}} className="primary-header">AR Flow Arts</h3>
          <span style={{marginBottom : '10px','marginLeft' : '10px', 'fontSize' : '12px'}}>Version 1.9</span>
          <a style={{marginBottom : '10px','marginLeft' : '10px', 'fontSize' : '12px'}} href="http://instagram.com/arflowarts">Contact</a>
          <button style={{'fontSize':'10px','marginLeft' : '10px', 'fontSize' : '12px'}} id="helpButton" onClick={this.showCalibrateHelp}>How to</button>
          <br/>
          <div className="top-tabs">
              <ul>
                  <span className="calibrate-icon">
                    <img title="Calibration View" onClick={store.toggleCalibrationMode} src={store.calibrationMode ? calibrationActive : calibrationInactive}/>
                  </span>
                  <li onClick={()=>{store.toggleShowControls("color")}} className={tabClass(store.showColorControls) + " left-tab" }>Calibration</li>
                  <li onClick={()=>{store.toggleShowControls("animation")}} className={tabClass(store.showAnimationControls)}>Animations</li>
                  <li onClick={()=>{store.toggleShowControls("detection")}} className={tabClass(store.showDetectionControls) + " right-tab"}>Advanced</li>
              </ul>
          </div>
          
          <div className="video-container" id="videoContainer">
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
          {uploadControls}
          <Camera 
            isFacebookApp={this.state.isFacebookApp}
            startVideoProcessing={this.startVideoProcessing}
          />          

      </div> 
    // TOP LAYER
    return (
      <div>
        {app}
     </div>
    );
  }
}

export default App;
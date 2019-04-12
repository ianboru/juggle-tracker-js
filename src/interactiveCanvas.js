import React, { Component } from 'react';
import cvutils from "./cvutils"
import store from "./store"
import "./App.css"
const touchDuration = 500

class InteractiveCanvas extends Component {
  state = {
    touchTimer : null,
    // Coordinates of mouse when pressed
    canvasMouseDownX : null, canvasMouseDownY : null,
  }
  componentDidMount(){
    store.setCanvasOutput(this.canvasOutput)
  }
  setColorFromSelectedRegion = (frame, x1, y1, x2, y2)=>{
    //ignore accidental clicks 
    if(Math.abs(x1-x2) < 10){
      return
    }
    let rgbRange = cvutils.getColorFromImage(
      frame,
      x1,
      y1,
      x2,
      y2,
    )

    const lowerHSV = cvutils.RGBtoHSV(rgbRange['lr'],rgbRange['lg'],rgbRange['lb'])
    const upperHSV = cvutils.RGBtoHSV(rgbRange['hr'],rgbRange['hg'],rgbRange['hb'])
    // converted hsv ranges may have maxs and mins swapped
    const hsvRange = {
      'lh' : Math.min(lowerHSV[0],upperHSV[0]),
      'ls' :  .15,
      'lv' :  .2,
      'hh' :  Math.max(lowerHSV[0],upperHSV[0]),
      'hs' :  1,
      'hv' :  1,
    }

    const hDiff = hsvRange['hh'] - hsvRange['lh']
    hsvRange['ls'] = Math.max(hsvRange['ls'],.1)
    hsvRange['lv'] = Math.max(hsvRange['lv'],.1)

    const minHDiff = 35
    if( hDiff < minHDiff && hsvRange['hh'] < 360 - minHDiff){
      hsvRange['hh'] = hsvRange['hh'] + minHDiff - hDiff
    }else if( hDiff < minHDiff && hsvRange['hh'] > 350){
      hsvRange['lh'] = hsvRange['lh'] - minHDiff + hDiff
    }
    store.setCurrentColorRange(hsvRange)
    store.setFilterHSV(hsvRange)
  }
  

  handleTouchEnd = ()=>{
    if (this.state.touchTimer)
        clearTimeout(this.state.touchTimer);
      this.setState({
        canvasMouseDownX : null,
        canvasMouseDownY : null,
        showSelectColorText : false,
      })
      store.setCalibrationRect(null)
      store.setFlippedFrame(null)
      store.setMouseDown(false)
  }

  handleCanvasMouseDown = (e)=>{
    store.setMouseDown(true)
    if(store.isMobile){
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

  handleCanvasMouseDrag = (e)=>{
    e.preventDefault()
    if(this.state.canvasMouseDownX){
      const mouseCoord = cvutils.calculateRelativeCoord(e, this.canvasOutput)
      store.setCalibrationRect([
        this.state.canvasMouseDownX,
        this.state.canvasMouseDownY,
        mouseCoord[0],
        mouseCoord[1]
      ])
    }

  }
  handleCanvasMouseUp = (e)=>{
    const widthScaleFactor = store.canvasOutput.clientWidth/store.hiddenCanvas.width
    const heightScaleFactor = store.canvasOutput.clientHeight/store.hiddenCanvas.height

    const clickCoord = cvutils.calculateRelativeCoord(e, this.canvasOutput)
    //use flipped frame that has not been drawn on yet
    this.setColorFromSelectedRegion(
      store.flippedFrame,
      Math.round(this.state.canvasMouseDownX/widthScaleFactor),
      Math.round(this.state.canvasMouseDownY/heightScaleFactor),
      Math.round(clickCoord[0]/widthScaleFactor),
      Math.round(clickCoord[1]/heightScaleFactor)
    )
   
    this.setState({
      canvasMouseDownX : null,
      canvasMouseDownY : null,
      showSelectColorText : false,
    })
    store.setCalibrationRect(null)
    store.setFlippedFrame(null)
    store.setMouseDown(false)
  }
  touchHeld = ()=>{
    const rectWidth = 40
    const widthScaleFactor = store.canvasOutput.clientWidth/store.hiddenCanvas.width
    const heightScaleFactor = store.canvasOutput.clientHeight/store.hiddenCanvas.height
    //use flipped frame that has not been drawn on yet

    const rectLeft = this.state.canvasMouseDownX - rectWidth/2
    const rectRight = this.state.canvasMouseDownX + rectWidth/2
    const rectTop = this.state.canvasMouseDownY - rectWidth/2
    const rectBottom = this.state.canvasMouseDownY + rectWidth/2
    this.setColorFromSelectedRegion(
      store.flippedFrame,
      rectLeft/widthScaleFactor,
      rectTop/heightScaleFactor,
      rectRight/widthScaleFactor,
      rectBottom/heightScaleFactor
    )
    
    this.setState({
      canvasMouseDownX : null,
      canvasMouseDownY : null,
      showSelectColorText : false,
    })
    store.setCalibrationRect([
          rectLeft,
          rectTop,
          rectRight,
          rectBottom,
    ])
    store.setFlippedFrame(null)
    store.setMouseDown(false)

  }
  render(){
    return (
      <canvas 
        ref={ref => this.canvasOutput = ref}
        id="canvas-output"
        onMouseDown={this.handleCanvasMouseDown}
        onMouseUp={this.handleCanvasMouseUp}
        onMouseMove={this.handleCanvasMouseDrag}
        onTouchStart={this.handleCanvasMouseDown}
        onTouchEnd={this.handleTouchEnd}
        onTouchMove={this.handleTouchEnd}
      ></canvas>
    )
  }
}

export default InteractiveCanvas;

import { action, configure, computed, observable} from "mobx"
import iosHeight from 'ios-inner-height'
const initialHSV = {
      lh : 180,
      ls : .2,
      lv : .2,
      hh : 230,
      hs : 1,
      hv : 1,
    }
configure({ enforceActions: "always" })


class Store {
  //
  // STATE
  //
  @observable liveVideo           = null
  @observable uploadedVideo       = null
  @observable videoWidth          = null
  @observable videoHeight          = null
  @observable uploadedVideoWidth          = null
  @observable uploadedVideoHeight          = null
  @observable calibrationMode     = false
  @observable calibratRect        = null
  @observable filterHSV           = initialHSV
  @observable allColors           = [initialHSV]
  @observable colorNum            = 0
  @observable usingWhite          = false
  @observable showConnections     = false
  @observable showAllConnections  = false
  @observable showTrails          = false
  @observable showRings           = false
  @observable showStars           = false
  @observable showBrushColor      = false
  @observable discoMode           = false
  @observable canvasOutput        = null
  @observable blurAmount          = 0
  @observable sizeThreshold       = 50
  @observable brushColor          = 123
  @observable connectionThickness = 6
  @observable numStarsPerObject   = 12
  @observable starLife            = .5
  @observable starSize            = .5
  @observable trailLength         = 1
  @observable ringLength          = 1
  @observable ringThickness       = 1
  @observable opacity             = 1
  @observable trailThickness      = 1
  @observable discoIncrement      = 12
  @observable showColorControls   = true
  @observable showAnimationControls = false
  @observable showDetectionControls = false
  @observable showContourOutlines  = false
  @observable brightnessThreshold  = 55
  @observable closeAmount          = 0
  @observable showSelectColorText  = true
  @observable mouseDown            = false
  @observable flippedFrame         = null
  @observable starSides           = 6
  @observable starPoint           = .5
  @observable hiddenCanvas        = null
  @observable imageScale          = 1
  @observable showContours         = true
  @observable contourThickness     = 1
  @observable uploadedDimensionsExist = false


  //
  // ACTIONS
  //
  @computed get isMobile(){
    return true ?  /Mobi|Android/i.test(navigator.userAgent) : false
  }
  @computed get calibrationModeText(){
    return this.calibrationMode ? "Show Raw" : "Calibration View"
  } 
  @computed get usingWhiteText(){
    return this.usingWhite ? "Use Color" : "Use Brightness"
  } 
  @computed get playingUploaded(){
    if(this.uploadedVideo){
      return this.uploadedVideo.currentTime > 0 && !this.uploadedVideo.paused && !this.uploadedVideo.ended
    }else{
      return false
    }
  }
  @computed get canvasDimensions(){
    let width
    let height
    if(window.innerWidth > 640){
        width = 640
        height = 480
    }else{
      const iOSDevice = !!navigator.platform.match(/iPhone|iPod|iPad/);
        width = window.innerWidth
        height = iOSDevice ? iosHeight() : window.innerHeight
    }
    return {
      height : height,
      width : width
    }
  }
  @action setUploadedVideoDimensions=()=>{
    if(this.uploadedVideo.videoWidth == 0){ return }
    var scale = window.devicePixelRatio
    console.log("scale", scale)
    console.log("exit", this.uploadedDimensionsExist)
    const hiddenContext = this.hiddenCanvas.getContext("2d")
    const outputContext = this.canvasOutput.getContext("2d")
    this.uploadedDimensionsExist = true
    this.hiddenCanvas.width = this.uploadedVideo.videoWidth/2
    this.hiddenCanvas.height = this.uploadedVideo.videoHeight/2
    /*this.hiddenCanvas.width = scale * this.uploadedVideo.videoWidth/2
    this.hiddenCanvas.height = scale * this.uploadedVideo.videoHeight/2
    this.hiddenCanvas.style.width = this.uploadedVideo.videoWidth/2 + "px"
    this.hiddenCanvas.style.height = this.uploadedVideo.videoHeight/2 + "px"
    const scaleFactor = this.canvasDimensions.width/this.hiddenCanvas.width*/
    this.canvasOutput.width = this.canvasDimensions.width
    this.canvasOutput.height = this.canvasDimensions.height// this.hiddenCanvas.height*scaleFactor
    //this.canvasOutput.style.width = this.canvasDimensions.width + "px"
    //this.canvasOutput.style.height = this.hiddenCanvas.height*scaleFactor + "px"

    // Normalize coordinate system to use css pixels.
    hiddenContext.scale(scale, scale);
    //outputContext.scale(scale, scale);

  }
  @action setCanvasOutput(canvas){
    canvas.width = this.canvasDimensions.width
    canvas.height = this.canvasDimensions.height
    this.canvasOutput = canvas
  }
  @action setHiddenCanvas(canvas){
    canvas.width = 640
    canvas.height = 980
    this.hiddenCanvas = canvas
  }
  /*@action setUploadedVideoDimensions=()=>{
    if(this.uploadedVideo.videoWidth == 0){ return }
    
    this.uploadedDimensionsExist = true
    let scaleFactor = 1
    if(this.uploadedVideo.videoHeight/this.canvasDimensions.height > 1.5){
      scaleFactor = (.4 * (this.uploadedVideo.videoHeight-this.canvasDimensions.height) + this.canvasDimensions.height)/this.canvasDimensions.height
    }
    this.hiddenCanvas.width = Math.round(this.canvasDimensions.width * scaleFactor)
    this.hiddenCanvas.height = Math.round(this.canvasDimensions.height * scaleFactor)
    console.log("SET UPLOADED")
    console.log(this.uploadedVideo.videoHeight, this.hiddenCanvas.height)
  }*/

  @action setCalibrationRect(rect){
    this.calibrationRect = rect
    this.showSelectColorText = false
  }
  @action setHSVValue(sliderName, value){
    this.filterHSV[sliderName] = value
    this.setCurrentColorRange(this.filterHSV)
    this.showSelectColorText = false
  }
  @action setBrightnessThreshold(value){
    this.brightnessThreshold = value
    this.showSelectColorText = false
  }
  @action setLiveVideo= (video) => {
    this.liveVideo = video
  }
  @action setUploadedVideo= (video) => {
    console.log("set uploaded 1")
    this.uploadedVideo = video
    this.uploadedDimensionsExist = false
  }
  @action setVideoDimensions=(width,height)=>{
    const scaleFactor = 640/width
    this.videoWidth = 640
    this.videoHeight = height*scaleFactor
  }
  @action setUploadedVideoDimensions=()=>{
    if(this.uploadedVideo.videoWidth == 0){ return }
    console.log("SET UPLOADED")
    console.log(this.uploadedVideo.videoWidth)
    const scaleFactor = 375/this.uploadedVideo.videoWidth
    const scaledHeight = this.uploadedVideo.videoHeight*scaleFactor
    this.uploadedVideo.width = 375
    this.uploadedVideo.height  = scaledHeight
    this.hiddenCanvas.width = 375
    this.hiddenCanvas.height = scaledHeight
    this.canvasOutput.width = 375
    this.canvasOutput.height = scaledHeight
    this.uploadedVideoWidth = 375
    this.uploadedVideoHeight = 375
  }
  @action addUploadedVideoTime =(time)=>{
    this.uploadedVideo.currentTime = this.uploadedVideo.currentTime + time
  }
  @action toggleCalibrationMode = () => {
    this.calibrationMode = !this.calibrationMode
    this.showConnections     = false
    this.showAllConnections  = false
    this.showContours = false
    if(this.calibrationMode){
      this.showContours          = false
    }else{
      this.showContours          = true
    }
    this.showStars           = false
    this.showBrushColor      = false
    this.showRings           = false
  }

  @action setBrightnessMode = () => {
    this.usingWhite = true
  }
  @action setColorMode = () => {
    this.usingWhite = false
  }
  @action toggleShowConnections = () => {
    this.showConnections = !this.showConnections
    if(this.showConnections){
      this.showAllConnections = false
    }
    this.showContours = false
  }
  @action toggleShowAllConnections = () => {
    this.showAllConnections = !this.showAllConnections
    if(this.showAllConnections){
      this.showConnections = false
    }
    this.showContours = false
  }
  @action toggleShowTrails = () => {
    this.showTrails = !this.showTrails
    this.showContours = false
  }
  @action toggleShowContours = () => {
    this.showContours = !this.showContours
    this.showConnections     = false
    this.showAllConnections  = false
    this.showTrails          = false
    this.showStars           = false
    this.showBrushColor      = false
    this.showRings           = false

  }
  @action toggleShowRings = () => {
    this.showRings = !this.showRings
    this.showContours = false
  }
  @action toggleShowStars = () => {
    this.showStars = !this.showStars
    if(this.showStars && this.showTrails){
      this.showTrails = false
    }
    this.showContours = false
  }
  @action toggleDiscoMode = () => {
    this.discoMode = !this.discoMode
  }
  @action toggleShowBrushColor = () => {
    this.showBrushColor = !this.showBrushColor
  }
  @action setCurrentColorRange = (colorRange)=>{
    this.allColors[this.colorNum] = colorRange
  }
  @action setBlurAmount = (blurAmount) => {
    this.blurAmount = blurAmount
  }
  @action setCloseAmount = (closeAmount) => {
    this.closeAmount = closeAmount
  }
  @action setDiscoIncrement = (discoIncrement) => {
    this.discoIncrement = discoIncrement
  }
  @action setTrailLength = (trailLength) => {
    this.trailLength = trailLength
  }
  @action setContourThickness = (contourThickness) => {
    this.contourThickness = contourThickness
  }
  @action setTrailThickness = (trailThickness) => {
    this.trailThickness = trailThickness
  }

  @action setRingLength = (ringLength) => {
    this.ringLength = ringLength
  }
  @action setRingThickness = (ringThickness) => {
    this.ringThickness = ringThickness
  }


  @action setOpacity = (opacity) => {
    this.opacity = opacity
  }
  @action setStarLife = (starLife) => {
    this.starLife = starLife
  }
  @action setStarPoint = (starPoint) => {
    this.starPoint = starPoint
  }
  @action setStarSides = (starSides) => {
    this.starSides = starSides
  }
  @action setStarSize = (starSize) => {
    this.starSize = starSize
  }
  @action setNumStarsPerObject = (numStarsPerObject) => {
    this.numStarsPerObject = numStarsPerObject
  }
  @action setConnectionThickness = (connectionThickness) => {
    this.connectionThickness = connectionThickness
  }
  @action setSizeThreshold = (sizeThreshold) => {
    this.sizeThreshold = sizeThreshold
  }
  @action setBrushColor = (brushColor) => {
    this.brushColor = brushColor
  }
  @action setFilterHSV = (colorRange)=>{
    this.filterHSV = colorRange
  }
  @action addColor = ()=>{
    this.allColors.push(initialHSV)
    this.colorNum = this.allColors.length - 1
    this.filterHSV = initialHSV
  }
  @action selectColor = (colorNum)=>{
    this.colorNum = colorNum
    this.filterHSV = this.allColors[colorNum]
  }
  @action setMouseDown = (state)=>{
    this.mouseDown = state
  }
  @action toggleShowControls =(type)=>{
    if(type === "color"){
      this.showColorControls = !this.showColorControls
      if(this.showColorControls){
        this.showDetectionControls = false
        this.showAnimationControls = false
      }
    }else if(type === "detection"){
      this.showDetectionControls = !this.showDetectionControls
      if(this.showDetectionControls){
        this.showColorControls = false
        this.showAnimationControls = false
      }
    }else if(type === "animation"){
      this.showAnimationControls = !this.showAnimationControls
      if(this.showAnimationControls){
        this.showDetectionControls = false
        this.showColorControls = false
      }
    }
  }
  @action setFlippedFrame=(frame)=>{
    if(this.flippedFrame){
      this.flippedFrame.delete()
    }
    this.flippedFrame = frame
  }
}

const store = new Store()

export default store
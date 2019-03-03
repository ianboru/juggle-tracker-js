import { action, configure, computed, observable} from "mobx"

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
  @observable calibrationMode     = false
  @observable calibratRect        = null
  @observable filterHSV           = initialHSV
  @observable allColors           = [initialHSV]
  @observable colorNum            = 0
  @observable usingWhite          = false
  @observable showConnections     = false
  @observable showAllConnections  = false
  @observable showTrails          = true
  @observable showStars           = false
  @observable showBrushColor      = false
  @observable discoMode           = false
  @observable canvasOutput        = null
  @observable blurAmount          = 8
  @observable sizeThreshold       = 50
  @observable brushColor          = 123
  @observable connectionThickness = 6
  @observable numStarsPerObject   = 12
  @observable starLife            = .5
  @observable starSize            = .5
  @observable trailLength         = 1
  @observable discoIncrement      = 12
  @observable showColorControls = true
  @observable showAnimationControls = false
  @observable showDetectionControls = false
  @observable brightnessThreshold  = 55
  @observable closeAmount          = 0
  @observable showSelectColorText  = true
  @observable mouseDown            = false
  @observable flippedFrame         = null
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
  @action setCanvasOutput(canvas){
    this.canvasOutput = canvas
  }
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
    this.uploadedVideo = video
  }
  @action setVideoDimensions=(width,height)=>{
    this.videoWidth = width
    this.videoHeight = height
  }
  
  @action toggleCalibrationMode = () => {
    this.calibrationMode = !this.calibrationMode
  }
  @action toggleUsingWhite = () => {
    this.usingWhite = !this.usingWhite
  }
  @action toggleShowConnections = () => {
    this.showConnections = !this.showConnections
    if(this.showConnections){
      this.showAllConnections = false
    }
  }
  @action toggleShowAllConnections = () => {
    this.showAllConnections = !this.showAllConnections
    if(this.showAllConnections){
      this.showConnections = false
    }
  }
  @action toggleShowTrails = () => {
    this.showTrails = !this.showTrails
  }
  @action toggleShowStars = () => {
    this.showStars = !this.showStars
    if(this.showStars && this.showTrails){
      this.showTrails = false
    }
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
  @action setStarLife = (starLife) => {
    this.starLife = starLife
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
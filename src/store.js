import { action, configure, computed, observable, toJS} from "mobx"
import cvutils from "./cvutils"
import generalUtils from "./generalUtils"

const initialHSV = {
      lh : 200,
      ls : .2,
      lv : .2,
      hh : 250,
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
  @observable showContours = true
  @observable showConnections     = false
  @observable showAllConnections  = false
  @observable showTrails          = false
  @observable showRings           = false
  @observable showStars           = false
  @observable showBrushColor      = false
  @observable showSquares         = false
  @observable showFlowers        = false
  @observable numFlowerPetals    = 20
  @observable showCircles        = false
  @observable discoMode           = false
  @observable canvasOutput        = null
  @observable blurAmount          = 0
  @observable sizeThreshold       = 10
  @observable brushColor          = 123
  @observable connectionThickness = 3
  @observable numStarsPerObject   = 12
  @observable starLife            = .5
  @observable starSize            = .2
  @observable trailLength         = 1
  @observable ringLength          = 1
  @observable ringThickness       = 1
  @observable opacity             = 1
  @observable trailThickness      = 1
  @observable discoIncrement      = 12
  @observable showColorControls   = false
  @observable showAnimationControls = false
  @observable showDetectionControls = false
  @observable brightnessThreshold  = 55
  @observable closeAmount          = 0
  @observable showSelectColorText  = true
  @observable mouseDown            = false
  @observable flippedFrame         = null
  @observable starSides           = 6
  @observable starPoint           = .5
  @observable hiddenCanvas        = null
  @observable imageScale          = 2  
  @observable numProps            = 20
  @observable contourThickness     = 1
  @observable uploadedDimensionsExist = false
  @observable videoUploaded = false
  @observable recordMessageShown = false
  @observable rawOpacity = 1
  @observable pulseSize = 20
  @observable pulseDirection = -1
  @observable pulseSpeed = 0
  @observable flowerRotation = 0
  @observable flowerRotationSpeed = 1
  @observable flowerSize   = 1
  //
  // ACTIONS
  //
  @computed get shouldScaleImage(){
    return !this.showContours
  }
  @computed get showBigUploadButton(){
    return (generalUtils.isFacebookApp() || !this.liveVideo) && !this.uploadedDimensionsExist 
  }
  @computed get isMobile(){
    return true ?  /Mobi|Android/i.test(navigator.userAgent) : false
  }
  @computed get currentH(){
    return cvutils.mean(this.filterHSV.lh,this.filterHSV.hh,)
  }
  @computed get currentS(){
    return this.filterHSV.hs
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
        width = window.innerWidth
        height = window.innerHeight
    }
    console.log("dimensions", width,height)
    return {
      height : height,
      width : width
    }
  }
  @action incrementPulseSize=()=>{
    this.pulseSize += this.pulseDirection * this.pulseSpeed
    if(this.pulseSize <= 50){
      this.pulseDirection = 1
    }
    if(this.pulseSize >= 100){
      this.pulseDirection = -1
    }
  }
  @action incrementFlowerRotation=()=>{
    this.flowerRotation += this.flowerRotationSpeed % 360
  }
  @action setVideoUploaded(){
    console.log("video officially uploaded")
    this.videoUploaded = true
    generalUtils.sendGA("video","uploaded")
  }
  @action setCanvasOutput(canvas){
    canvas.width = this.canvasDimensions.width
    canvas.height = this.canvasDimensions.height
    this.canvasOutput = canvas
  }
  @action setHiddenCanvas(canvas){
    canvas.width = this.canvasDimensions.width
    canvas.height = this.canvasDimensions.height
    this.hiddenCanvas = canvas
  }

  @action setCalibrationRect(rect){
    this.calibrationRect = rect
    this.showSelectColorText = false
    generalUtils.sendGA("calibration","click drag")
  }
  @action setHSVValue(sliderName, value){
    console.log("HSV", sliderName, value)
    this.filterHSV[sliderName] = value
    this.setCurrentColorRange(this.filterHSV)
    this.showSelectColorText = false
    generalUtils.sendGA('setHSV',JSON.stringify(this.filterHSV))
  }
  @action setBrightnessThreshold(value){
    this.brightnessThreshold = value
    this.showSelectColorText = false
    generalUtils.sendGA("brightMode","set threshold")
  }
  @action setLiveVideo= (video) => {
    this.liveVideo = video
    this.showColorControls = true
  }
  @action setUploadedVideo= (video) => {
    this.uploadedVideo = video
    this.uploadedDimensionsExist = false
  }
  @action setUploadedVideoDimensions= () => {
    console.log("uploaded set")
    this.uploadedDimensionsExist = true
    this.showColorControls = true
  }
  @action setVideoDimensions=(width,height)=>{
    this.videoWidth = width
    this.videoHeight = height
  }
  
  @action toggleCalibrationMode = () => {
    this.calibrationMode = !this.calibrationMode
    if(this.calibrationMode){
      this.setRawOpacity(0)
    }else{
      this.setRawOpacity(1)
    }
  }
  @action setRawOpacity = (opacity) => {
    this.rawOpacity = opacity
  }
  @action setBrightnessMode = () => {
    generalUtils.sendGA("brightMode", "toggle")
    this.usingWhite = true
  }
  @action setColorMode = () => {
    generalUtils.sendGA("colorMode", "toggle")

    this.usingWhite = false
  }
  @action toggleShowConnections = () => {
    generalUtils.sendGA("effects", "connections")

    this.showConnections = !this.showConnections
    if(this.showConnections){
      this.showAllConnections = false
    }
  }
  @action toggleShowAllConnections = () => {
    generalUtils.sendGA("effects", "all connections")
    this.showAllConnections = !this.showAllConnections
    if(this.showAllConnections){
      this.showConnections = false
    }
  }
  @action toggleShowTrails = () => {
    generalUtils.sendGA("effects", "trails")
    this.showTrails = !this.showTrails
  }
  @action toggleShowSquares = () => {
    generalUtils.sendGA("effects", "squares")
    this.showSquares = !this.showSquares
  }
  @action toggleShowCircles = () => {
    generalUtils.sendGA("effects", "circles")
    this.showCircles = !this.showCircles
  }
  @action toggleShowContours = () => {
    generalUtils.sendGA("effects", "contours")
    this.showContours = !this.showContours
  }
  @action toggleShowRings = () => {
    this.showRings = !this.showRings
    generalUtils.sendGA("effects", "rings")
  }
   @action toggleShowFlowers = () => {
    this.showFlowers = !this.showFlowers
    generalUtils.sendGA("effects", "flowers")
  }
  @action toggleShowStars = () => {
    generalUtils.sendGA("effects", "stars")
    this.showStars = !this.showStars
    if(this.showStars && this.showTrails){
      this.showTrails = false
    }
  }
  @action toggleDiscoMode = () => {
    generalUtils.sendGA("effects", "rainbow")
    this.discoMode = !this.discoMode
  }
  @action toggleShowBrushColor = () => {
    generalUtils.sendGA("effects", "brush")
    this.showBrushColor = !this.showBrushColor
  }
  @action setCurrentColorRange = (colorRange)=>{
    console.log("set current", this.colorNum, toJS(colorRange))
    this.allColors[this.colorNum] = colorRange
  }
  @action setBlurAmount = (blurAmount) => {
    generalUtils.sendGA("advanced", "blur")
    this.blurAmount = blurAmount
  }
  @action setImageScale = (imageScale) => {
    generalUtils.sendGA("advanced", "imageScale")
    this.imageScale = imageScale
  }
  @action setNumProps = (numProps) => {
    generalUtils.sendGA("advanced", "numProps")
    this.numProps = numProps
  }
  @action setCloseAmount = (closeAmount) => {
    generalUtils.sendGA("advanced", "closeAmount")
    this.closeAmount = closeAmount
  }
  @action setDiscoIncrement = (discoIncrement) => {
    this.discoIncrement = discoIncrement
  }
  @action setTrailLength = (trailLength) => {
    generalUtils.sendGA("effects", "trailLength")
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
  @action setNumFlowerPetals = (numFlowerPetals) => {
    this.numFlowerPetals = numFlowerPetals
  }
  @action setPulseSpeed = (pulseSpeed) => {
    this.pulseSpeed = pulseSpeed
  }
  @action setFlowerRotationSpeed = (flowerRotationSpeed) => {
    this.flowerRotationSpeed = flowerRotationSpeed
  }
  @action setFlowerSize = (flowerSize) => {
    this.flowerSize = flowerSize
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
    console.log("setting filter", toJS(colorRange))
    this.filterHSV = colorRange
  }
  @action addColor = ()=>{
    this.allColors.push(initialHSV)
    this.colorNum = this.allColors.length - 1
    this.filterHSV = initialHSV
  }
  @action selectColor = (colorNum)=>{
    console.log("filters", colorNum, toJS(this.allColors[colorNum]))
    this.colorNum = colorNum
    this.filterHSV = this.allColors[colorNum]
  }
  @action setMouseDown = (state)=>{
    this.mouseDown = state
  }
  @action toggleShowControls =(type)=>{
    if(!this.videoUploaded && !this.liveVideo){
      return
    }
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
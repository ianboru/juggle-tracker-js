import { action, configure, computed, observable, toJS } from "mobx"

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
  @observable calibrationMode     = false
  @observable filterHSV           = initialHSV
  @observable allColors           = [initialHSV]
  @observable colorNum            = 0
  @observable usingWhite          = false
  @observable showConnections     = false
  @observable showTrails          = true
  @observable showStars           = false
  @observable discoMode           = false
  @observable blurAmount          = 12
  @observable sizeThreshold       = 12
  @observable animationColor      = 123
  @observable connectionThickness = 12
  @observable numStarsPerObject   = 12
  @observable starLife            = .5
  @observable trailLength         = 12
  @observable discoIncrement      = 12
  //
  // ACTIONS
  //
  @computed get calibrationModeText(){
    return this.calibrationMode ? "Show Raw" : "Calibration View"
  } 
  @computed get usingWhiteText(){
    return this.usingWhite ? "Use Color" : "Use Brightness"
  }
  @computed get showConnectionsText(){
    return this.showConnections ? "Hide Connections" : "Show Connections"
  }
  @computed get showTrailsText(){
    return this.showTrails ? "Hide Trails" : "Show Trails"
  }
  @computed get showStarsText(){
    return this.showStars ? "Hide Stars" : "Show Stars"
  }
  @computed get discoModeText(){
    return this.discoMode ? "Rainbow Off" : "Rainbow On"
  }  
  @computed get playingUploaded(){
    if(this.uploadedVideo){
      return this.uploadedVideo.currentTime > 0 && !this.uploadedVideo.paused && !this.uploadedVideo.ended
    }else{
      return false
    }
  }
  @action setHSVValue(sliderName, value){
    this.filterHSV[sliderName] = value
    this.setCurrentColorRange(this.filterHSV)
  }
  @action setLiveVideo= (video) => {
    this.liveVideo = video
  }
  @action setUploadedVideo= (video) => {
    this.uploadedVideo = video
  }
  @action toggleCalibrationMode = () => {
    this.calibrationMode = !this.calibrationMode
  }
  @action toggleUsingWhite = () => {
    this.usingWhite = !this.usingWhite
  }
  @action toggleShowConnections = () => {
    this.showConnections = !this.showConnections
  }
  @action toggleShowTrails = () => {
    this.showTrails = !this.showTrails
  }
  @action toggleShowStars = () => {
    this.showStars = !this.showStars
  }
  @action toggleDiscoMode = () => {
    this.discoMode = !this.discoMode
  }
  @action setCurrentColorRange = (colorRange)=>{
    this.allColors[this.colorNum] = colorRange
  }
  @action setBlurAmount = (blurAmount) => {
    this.blurAmount = blurAmount
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
  @action setNumStarsPerObject = (numStarsPerObject) => {
    this.numStarsPerObject = numStarsPerObject
  }
  @action setConnectionThickness = (connectionThickness) => {
    this.connectionThickness = connectionThickness
  }
  @action setSizeThreshold = (sizeThreshold) => {
    this.sizeThreshold = sizeThreshold
  }
  @action setAnimationColor = (animationColor) => {
    this.animationColor = animationColor
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
}

const store = new Store()

export default store
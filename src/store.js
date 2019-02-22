import { action, configure, computed, observable, toJS } from "mobx"

const initialHSV = {
      lh : 180,
      ls : .2,
      lv : .2,
      hh : 230,
      hs : 1,
      hv : 1,
    }
const initialDetectionParams = {
      blur : 12,
      minContourSize : 20,
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
  @observable detectionParameters = initialDetectionParams
  @observable blurAmount          = 12
  @observable sizeThreshold       = 12
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
    return this.showConnections ? "Show Connections" : "Hide Connections"
  }
  @computed get showTrailsText(){
    return this.showTrails ? "Show Trails" : "Hide Trails"
  }
  @computed get showStarsText(){
    return this.showStars ? "Show Stars" : "Hide Stars"
  }
  @computed get discoModeText(){
    return this.discoMode ? "Rainbow On" : "Rainbow Off"
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
  @action setDetectionParameters(sliderName, value){
    this.detectionParameters[sliderName] = value
    this.setCurrentDetectionParameters(this.detectionParameters)
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
  @action setSizeThreshold = (sizeThreshold) => {
    this.sizeThreshold = sizeThreshold
  }
  @action setCurrentDetectionParameters = (detectionParameters) => {
    this.detectionParameters = detectionParameters
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
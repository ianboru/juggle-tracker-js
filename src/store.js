import { action, configure, computed, observable, toJS } from "mobx"

configure({ enforceActions: "always" })


class Store {
  //
  // STATE
  //
  @observable liveVideo           = null
  @observable uploadedVideo       = null
  @observable videoWidth          = null
  @observable videoHeight          = null

  //
  // ACTIONS
  //
  @computed get playingUploaded(){
    if(this.uploadedVideo){
      return this.uploadedVideo.currentTime > 0 && !this.uploadedVideo.paused && !this.uploadedVideo.ended
    }else{
      return false
    }
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
  
}

const store = new Store()

export default store

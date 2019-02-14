import { action, configure, computed, observable, toJS } from "mobx"

configure({ enforceActions: "always" })


class Store {
  //
  // STATE
  //
  @observable liveVideo           = null
  @observable uploadedVideo       = null

  //
  // ACTIONS
  //
  @computed get playingUploaded(){
    return this.uploadedVideo.currentTime > 0 && !this.uploadedVideo.paused && !this.uploadedVideo.ended
  }
  @action setLiveVideo= (video) => {
    this.liveVideo = video
  }
  @action setUploadedVideo= (video) => {
    this.uploadedVideo = video
  }
  
}

const store = new Store()

export default store

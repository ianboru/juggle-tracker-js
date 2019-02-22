import { action, configure, computed, observable, toJS } from "mobx"

configure({ enforceActions: "always" })


class DrawingStore {
  //
  // STATE
  //
  @observable starsX = []
  @observable starsY = []
  @observable starsDx = []
  @observable starsDy = [] 
  @observable starsSize = []
  @observable starsColor = []

  //
  // ACTIONS
  //
  @action setStars(starData){
    this.starsX = starData.starsX
    this.starsY = starData.starsY
    this.starsDx = starData.starsDx
    this.starsDy = starData.starsDy
    this.starsSize = starData.starsSize
    this.starsColor = starData.starsColor
  }
}

const drawingStore = new DrawingStore()

export default drawingStore
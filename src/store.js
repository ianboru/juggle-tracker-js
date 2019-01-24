import { action, configure, computed, observable, toJS } from "mobx"

configure({ enforceActions: "always" })


class Store {
  //
  // STATE
  //
  /*@observable visiblePlayer = "live"

  //
  // ACTIONS
  //
  @action setVisiblePlayer = (player) => {
    this.visiblePlayer = player
  }*/

}

const store = new Store()

export default store

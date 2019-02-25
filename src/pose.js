import React, { Component } from 'react';

import * as tf from '@tensorflow/tfjs';
import * as posenet from '@tensorflow-models/posenet';
import store from "./store"
class Pose extends Component {
	componentDidMount=()=>{
	    posenet.load().then(data=>{
	      console.log("posenet loaded")
	       store.setPosenet(data)
	    });
  	}
  	render(){
  		return(
  			<div/>
  		)
  	}
}
export default Pose
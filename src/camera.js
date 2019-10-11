import React, { Component } from 'react';
import { observer } from "mobx-react"
import store from "./store"
import Recorder from './recorder'
import axois, { post } from 'axios'
import generalUtils from "./generalUtils"
const webtaskUrl = "https://wt-b5a67af96f44fb6828d5a07d6bb70476-0.sandbox.auth0-extend.com/arflowarts"
@observer
class Camera extends Component {
  state={
    stream : null,
    streaming : false,
    videoHeight : null,
    videoWidth : null,
    fileUploaded : true,
        recording : null,
        mounted : true

  }
  componentDidMount(){
    if(!generalUtils.isFacebookApp()){
      this.startCamera()
    }
    store.setUploadedVideo(this.uploadedVideo)
    this.setState({
      mounted : true
    })
  }

  startCamera=()=>{
      let that = this
      // Break if the camera is already streaming
      if (this.state.streaming) return;
      // Get video
      try{
        navigator.mediaDevices.getUserMedia({video: {faceingMode : 'user'}, audio: false})
        .then(function(s) {
          //Set stream to stop later
          that.state.stream = s
          //Set stream to video tag
          that.video.srcObject = s;
          that.video.play();
          store.setLiveVideo(that.video)
        })
        .catch(function(err) {
          store.setVideoDimensions(640, 480)
          that.props.startVideoProcessing();
        });
        this.video.addEventListener("canplay", function(ev){
          if (!store.streaming) {
            let videoWidth = that.video.videoWidth;
            let videoHeight = that.video.videoHeight;
            console.log("width height", videoWidth, videoHeight)
            that.video.setAttribute("width", videoWidth);
            that.video.setAttribute("height", videoHeight);
            that.state.streaming = true 
            store.setVideoDimensions(that.video.videoWidth, that.video.videoHeight)
            that.state.videoWidth = videoWidth
            that.state.videoHeight = videoHeight
          }
          that.props.startVideoProcessing();
        }, false);
      }catch(error){
        store.setVideoDimensions(640, 480)
        that.props.startVideoProcessing();
      }
  }
  stopCamera=()=> {
    if (!this.state.streaming) return;
    store.canvasOutput.getContext("2d").clearRect(0, 0, this.state.videoWidth, this.state.videoHeight);
    this.video.srcObject=null;
    this.state.stream.getVideoTracks()[0].stop();
    this.state.streaming = false
  }
  handleVideoEnded = ()=>{
    store.uploadedVideo.play()
  }
  render(){
    return(
      <span>
        <video hidden={true} muted playsInline autoPlay className="invisible live-video" ref={ref => this.video = ref}></video>
        <video hidden={true} muted playsInline autoPlay onEnded={this.handleVideoEnded}   className="invisible live-video" ref={ref => this.uploadedVideo = ref}></video>
      </span>
    )
  }
}

export default Camera
import React, { Component } from 'react';
import { observer } from "mobx-react"
import store from "./store"

@observer
class Camera extends Component {
  state={
    stream : null,
    streaming : false,
    videoHeight : null,
    videoWidth : null,
    fileUploaded : true
  }
  componentDidMount(){
    if(!this.props.isFaceBookApp){
      this.startCamera()
    }
  }
  startCamera=()=>{
      let that = this
      // Break if the camera is already streaming
      if (this.state.streaming) return;
      // Get video
      navigator.mediaDevices.getUserMedia({video: {faceingMode : 'user'}, audio: false})
      .then(function(s) {
        console.log("got user media")
        //Set stream to stop later
        that.state.stream = s
        //Set stream to video tag
        that.video.srcObject = s;
        that.video.play();
        store.setLiveVideo(that.video)
      })
      .catch(function(err) {
        console.log("An error occured! " + err);
      });
      this.video.addEventListener("canplay", function(ev){
        if (!store.streaming) {
          let videoWidth = that.video.videoWidth;
          let videoHeight = that.video.videoHeight;
          that.video.setAttribute("width", videoWidth);
          that.video.setAttribute("height", videoHeight);
          that.state.streaming = true 
          that.state.videoWidth = videoWidth
          that.state.videoHeight = videoHeight
        }
        that.props.startVideoProcessing();
      }, false);
  }
  stopCamera=()=> {
    if (!this.state.streaming) return;
    this.stopVideoProcessing();
    this.props.canvasOutput.getContext("2d").clearRect(0, 0, this.state.videoWidth, this.state.videoHeight);
    this.video.pause();
    this.video.srcObject=null;
    this.state.stream.getVideoTracks()[0].stop();
    this.state.streaming = false
  }
  handleFile = ()=>{
    let URL = window.URL || window.webkitURL

    let file = this.input.files[0]
    if(!file){return}
    let fileURL = URL.createObjectURL(file)
    this.uploadedVideo.src = fileURL
    store.setUploadedVideo(this.uploadedVideo)
    this.setState({
      fileUploaded : true
    })
  }

  handlePlayUploaded = ()=>{
    const recordButton = document.querySelector('button#playUploadedButton');
    if(this.uploadedVideo.currentTime > 0 && !this.uploadedVideo.paused && !this.uploadedVideo.ended){
      this.uploadedVideo.pause()
      recordButton.textContent = 'Play Video';
    }else{
      this.uploadedVideo.play()
      this.stopCamera()
      recordButton.textContent = 'Pause Video';
    }
  }

  handleVideoEnded = ()=>{
    const recordButton = document.querySelector('button#playUploadedButton');
    recordButton.textContent = 'Play Video';
  }

  render(){

    const fileButton = this.input ? <button style={{'fontSize':'12pt'}} onClick={()=>{this.input.click()}}>Upload Video</button> : null
    let playUploadedButton
    if(this.input){
      playUploadedButton = this.state.fileUploaded ? <button style={{'fontSize':'12pt'}} id="playUploadedButton" onClick={this.handlePlayUploaded}>Play Video</button> : null
    }

    const videoControls =
      <div>
        <div style={{'marginBottom' :'10px'}}>
          <button style={{'fontSize':'12pt'}} id="record" onClick={this.toggleRecording}>Start Recording</button>
          <input className='invisible' type="file" accept="video/*" ref={ref => this.input = ref} onChange={this.handleFile}/>
          {fileButton}
          {playUploadedButton}
        </div>
      </div>

    return(

      <span>
        <video hidden={true} muted playsInline autoPlay className="invisible live-video" ref={ref => this.video = ref}></video>
        <video hidden={true} muted playsInline autoPlay onEnded={this.handleVideoEnded}   className="invisible live-video" ref={ref => this.uploadedVideo = ref}></video>
        {videoControls}
      </span>
    )
  }
}

export default Camera
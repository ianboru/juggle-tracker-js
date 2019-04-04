import React, { Component } from 'react';
import { observer } from "mobx-react"
import store from "./store"
import Recorder from './recorder'
import axois, { post } from 'axios'
const iOSDevice = !!navigator.platform.match(/iPhone|iPod|iPad/);
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
    if(!this.props.isFaceBookApp){
      this.startCamera()
    }
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
          store.setVideoDimensions(640, 480)
          that.props.startVideoProcessing();
        });
        this.video.addEventListener("canplay", function(ev){
          if (!store.streaming) {
            let videoWidth = that.video.videoWidth;
            let videoHeight = that.video.videoHeight;
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
        console.log("error 2", error)
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
    console.log("stopping camera")
  }
  handleInputClick = ()=>{
    if(iOSDevice){
      alert("Video recorded by iOS must be landscape or square.")
    }
    this.input.click()
  }
  postVideo = (video)=>{
    console.log("posting video")
    const formData = new FormData()
    const config = {
        headers: {
            'content-type': 'multipart/form-data'
        }
    }
    formData.append('file',video)
    return post(webtaskUrl + "/upload", formData, config).then(response => {
      console.log(response)
    }) 
  }
  handleFile = ()=>{
    
    let URL = window.URL || window.webkitURL

    let file = this.input.files[0]
    console.log("file",file)
    if(!file){return}
      console.log("file uploarded")
    this.postVideo(file).then((response)=>{
      console.log("video posted", response)
    })
    let fileURL = URL.createObjectURL(file)
    this.uploadedVideo.src = fileURL
    store.setUploadedVideo(this.uploadedVideo)
    this.setState({
      fileUploaded : true
    },()=>{
      this.stopCamera()
    })

  }


  handlePlayUploaded = ()=>{
    const recordButton = document.querySelector('button#playUploadedButton');
    if(this.uploadedVideo.currentTime > 0 && !this.uploadedVideo.paused && !this.uploadedVideo.ended){
      this.uploadedVideo.pause()
      recordButton.textContent = 'Play Video';
    }else{
      this.uploadedVideo.play()
      recordButton.textContent = 'Pause Video';
    }
  }

  handleVideoEnded = ()=>{
    const recordButton = document.querySelector('button#playUploadedButton');
    this.uploadedVideo.play()
  }
 toggleRecording=()=>{
    // Change the text on the record button
    // User wants to record
    console.log(this.state.recording)
    if (!this.state.recording) {
      // Capture the video stream, and set recording to true
      this.setState({
        canvasStream : store.canvasOutput.captureStream(),
        recording : true
      })
    } else {
      // Stop recording
      this.setState({
        canvasStream : null,
        recording : false
      })
      // Stop the camera
    }
  }
  render(){
    const uploadFileButton = this.state.mounted && this.input ? <button style={{'margin-bottom':'10px','fontSize':'12pt'}} onClick={this.handleInputClick}>Upload Video</button> : null
    let playUploadedButton
    if(store.uploadedVideo){
      playUploadedButton = this.state.fileUploaded ? <button style={{'margin-bottom':'10px','fontSize':'12pt'}} id="playUploadedButton" onClick={this.handlePlayUploaded}>Play Video</button> : null
    }

    const screenRecordText = iOSDevice ? "Record with iOS screen recording " : null
    const recordingText = this.state.recording ? "Stop Recording" : "Start Recording"
    const recordingButton = iOSDevice ? null : <button style={{'margin-bottom':'10px','fontSize':'12pt'}} id="record" onClick={this.toggleRecording}>{recordingText}</button>
    const videoControls =
      <div>
        <div style={{'marginBottom' :'10px'}}>
          <input className='invisible' type="file" accept="video/*" ref={ref => this.input = ref} onChange={this.handleFile}/>
          {uploadFileButton}
          {playUploadedButton}
        </div>
      </div>

    return(
      <span>
        <video hidden={true} muted playsInline autoPlay className="invisible live-video" ref={ref => this.video = ref}></video>
        <video hidden={true} muted playsInline autoPlay onEnded={this.handleVideoEnded}   className="invisible live-video" ref={ref => this.uploadedVideo = ref}></video>
        <div style={{'color' : 'red'}} >Use Screen Recording to Record Video</div>
        {videoControls}
      </span>
    )
  }
}

export default Camera
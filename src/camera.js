import React, { Component } from 'react';
import { observer } from "mobx-react"
import store from "./store"
import Recorder from './recorder'
const iOSDevice = !!navigator.platform.match(/iPhone|iPod|iPad/);

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
          store.setVideoDimensions(that.video.videoWidth, that.video.videoHeight)
          that.state.videoWidth = videoWidth
          that.state.videoHeight = videoHeight
        }
        that.props.startVideoProcessing();
      }, false);
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
  handleFile = ()=>{
    
    let URL = window.URL || window.webkitURL

    let file = this.input.files[0]
    if(!file){return}
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
    recordButton.textContent = 'Play Video';
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
          {recordingButton}
        </div>
      </div>

    return(
      <span>
        <video hidden={true} muted playsInline autoPlay className="invisible live-video" ref={ref => this.video = ref}></video>
        <video hidden={true} muted playsInline autoPlay onEnded={this.handleVideoEnded}   className="invisible live-video" ref={ref => this.uploadedVideo = ref}></video>
        <Recorder recording={this.state.recording} canvasStream={this.state.canvasStream}/>
        <div style={{'color' : 'red'}} >{screenRecordText}</div>
        {videoControls}
      </span>
    )
  }
}

export default Camera
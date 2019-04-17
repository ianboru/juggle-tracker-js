import React, { Component } from 'react';
import { observer } from "mobx-react"
import store from "./store"
import generalUtils from "./generalUtils"
import axios, { post } from 'axios'
const postUrl = "http://45.33.81.74:5000"
@observer
class UploadControls extends Component {
  state={
    videoHeight : null,
    videoWidth : null,
    fileUploaded : true,
        recording : null,
        mounted : true

  }
  componentDidMount(){
    console.log(generalUtils)
    console.log("is facebook app" ,generalUtils.isFacebookApp())
    this.setState({
      mounted : true
    })
  }
  handleInputClick = ()=>{
    if(generalUtils.iOSDevice){
      alert("Video recorded by iOS must be landscape or square.")
    }
    this.input.click()
  }

  handleFile = ()=>{
    let URL = window.URL || window.webkitURL
    let file = this.input.files[0]
    if(!file){return}
    console.log("file uploading")
    this.postVideo(file).then((response)=>{
      console.log("video posted", response)
    })
    let fileURL = URL.createObjectURL(file)
    store.uploadedVideo.src = fileURL
    store.setVideoUploaded()
    this.props.startVideoProcessing()
    this.setState({
      fileUploaded : true
    })
  }
  postVideo = (video)=>{
    console.log("posting video")
    const formData = new FormData()
    const config = {
        crossdomain: true,
        timeout: 10000,
        responseType: 'blob',
        headers: {
            'content-type': 'multipart/form-data',
            //'Access-Control-Allow-Origin' : "*",
            //'Access-Control-Allow-Headers' : 'Cache-Control, Pragma, Origin, Authorization,Content-Type, X-Requested-With'
        }
    }
    formData.append('file',video)
    return post(postUrl + "/upload", formData, config).then(response => {
      console.log("response",response)
      const url = window.URL.createObjectURL(new Blob([response.data]));
       const link = document.createElement('a');
       link.href = url;
       link.setAttribute('download', 'file.mp4'); //or any other extension
       document.body.appendChild(link);
       link.click();
    }) 
  }
  handlePlayUploaded = ()=>{
    const playUploadedButton = document.querySelector('button#playUploadedButton');
    if(store.uploadedVideo.currentTime > 0 && !store.uploadedVideo.paused && !store.uploadedVideo.ended){
      store.uploadedVideo.pause()
      playUploadedButton.textContent = 'Play Video';
    }else{
      store.uploadedVideo.play()
      playUploadedButton.textContent = 'Pause Video';
    }
  }

  handleVideoEnded = ()=>{
    store.uploadedVideo.play()
  }

  render(){
    const uploadFileButton = this.state.mounted && this.input ? <button style={{'margin-bottom':'10px','fontSize':'12pt'}} onClick={this.handleInputClick}>Upload Video</button> : null
    let playUploadedButton
    if(store.uploadedVideo){
      playUploadedButton = this.state.fileUploaded ? <button style={{'margin-bottom':'10px','fontSize':'12pt'}} id="playUploadedButton" onClick={this.handlePlayUploaded}>Play Video</button> : null
    }
    const videoControls =
        <div style={{'marginBottom' :'10px'}}>
          <input className='invisible' name="videoUploader" type="file" accept="video/*" ref={ref => this.input = ref} onChange={this.handleFile}/>
          {uploadFileButton}
          {playUploadedButton}
        </div>

    return(
      <div>
        {videoControls}
      </div>
    )
  }
}

export default UploadControls
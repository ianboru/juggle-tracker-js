import React, { Component } from 'react';
import { observer } from "mobx-react"
import store from "./store"
import generalUtils from "./generalUtils"
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
    let fileURL = URL.createObjectURL(file)
    store.uploadedVideo.src = fileURL
    store.setVideoUploaded()
    this.props.startVideoProcessing()
    this.setState({
      fileUploaded : true
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
    const uploadFileButton = this.state.mounted && this.input ? <button style={{'margin-bottom':'10px','fontSize':'12pt', 'color' : 'white','backgroundColor': 'hsl(40, 100%,50%)'}} onClick={this.handleInputClick}>Upload Video</button> : null
    let playUploadedButton
    if(store.uploadedVideo){
      playUploadedButton = this.state.fileUploaded ? <button style={{'margin-bottom':'10px','fontSize':'12pt', 'color' : 'white','backgroundColor': 'hsl(40, 100%,50%)'}} id="playUploadedButton" onClick={this.handlePlayUploaded}>Play Video</button> : null
    }
    const videoControls =
        <div style={{'marginBottom' :'10px'}}>
          <input className='invisible' type="file" accept="video/*" ref={ref => this.input = ref} onChange={this.handleFile}/>
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
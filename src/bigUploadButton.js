import React, { Component } from 'react';
import { observer } from "mobx-react"
import store from "./store"
import generalUtils from "./generalUtils"
@observer
class BigUploadButton extends Component {
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


  handleVideoEnded = ()=>{
    const recordButton = document.querySelector('button#playUploadedButton');
    store.uploadedVideo.play()
  }

  render(){
    const uploadFileButton = this.state.mounted && this.input ? <button style={{'margin-bottom':'10px','fontSize':'20pt', 'background-color': 'lightblue'}} onClick={this.handleInputClick}>Upload Video</button> : null
        

    return(
      <div className="big-upload-button">
          <input className='invisible' type="file" accept="video/*" ref={ref => this.input = ref} onChange={this.handleFile}/>
          {uploadFileButton}
      </div>
    )
  }
}

export default BigUploadButton
import React, { Component } from 'react';

class Recorder extends Component {
// The nested try blocks will be simplified when Chrome 47 moves to Stable
  state = {
    recordedBlobs : null,
    mediaRecorder : null
  }
  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.recording === nextProps.recording) {
      return false;
    } else {
      return true;
    }
  }
  componentDidMount=()=>{
    const downloadButton = document.querySelector('button#download');
    downloadButton.disabled = true
  }
  startRecording=()=>{
    let options = {mimeType: 'video/webm;codecs=h264'};
    this.state.recordedBlobs = []
    let mediaRecorder
    this.recordedVideo.hidden = true
    const downloadButton = document.querySelector('button#download');
    downloadButton.disabled = true;

    try {
      mediaRecorder = new MediaRecorder(this.props.canvasStream, options);
    } catch (e0) {
      console.log('Unable to create MediaRecorder with options Object: ', e0);
      try {
        options = {mimeType: 'video/webm,codecs=vp9'};
        mediaRecorder = new MediaRecorder(this.props.canvasStream, options);
      } catch (e1) {
        console.log('Unable to create MediaRecorder with options Object: ', e1);
        try {
          options = 'video/vp8'; // Chrome 47
          mediaRecorder = new MediaRecorder(this.props.canvasStream, options);
        } catch (e2) {
          alert('MediaRecorder is not supported by this browser.\n\n' +
            'Try Firefox 29 or later, or Chrome 47 or later, ' +
            'with Enable experimental Web Platform features enabled from chrome://flags.');
          console.error('Exception while creating MediaRecorder:', e2);
          return;
        }
      }
    }

    mediaRecorder.onstop = this.handleStopMediaRecorder;
    mediaRecorder.ondataavailable = this.handleDataAvailable;
    mediaRecorder.start(100); // collect 100ms of data
    this.state.mediaRecorder = mediaRecorder
  }

  stopRecording=()=>{
    const mediaRecorder = this.state.mediaRecorder
    mediaRecorder.stop()
    this.recordedVideo.controls = true
    this.recordedVideo.hidden = false
    this.setState({
      mediaRecorder,
    })
    const downloadButton = document.querySelector('button#download');
    downloadButton.disabled = false;

  }

  handleDataAvailable=(event)=>{
    let recordedBlobs = this.state.recordedBlobs
    if (event.data && event.data.size > 0) {
      recordedBlobs.push(event.data);
      this.setState({
        recordedBlobs
      })
    }
  }

  handleStopMediaRecorder=(event)=>{
    console.log('Recorder stopped: ', event);
    const superBuffer = new Blob(this.state.recordedBlobs, {type: 'video/webm'});
    this.recordedVideo.src = window.URL.createObjectURL(superBuffer);
  }

  download=()=>{
    const blob = new Blob(this.state.recordedBlobs, {type: 'video/webm'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'test.webm';
    document.body.appendChild(a);

    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }
  render(){
    if(this.props.recording){
      this.startRecording()
    }else if(!this.props.recording && this.state.mediaRecorder){
      this.stopRecording()
    }
    return(
      <div>
        <video hidden={true} ref={ref => this.recordedVideo = ref} id="recorded" playsInline ></video>
        <button style={{'fontSize':'12pt'}} id="download" onClick={this.download} >Download</button>

      </div>
    )
  }
}
export default Recorder
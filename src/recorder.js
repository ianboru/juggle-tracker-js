import React, { Component } from 'react';
import store from "./store"
const scoreThreshold = .5
//@observer
class Recorder extends Component {
	state = {
		mediaRecorder : null,
		recordedBlobs : null,
		mediaSource : new MediaSource(),
		mediaSource : null,
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

	handleStop=(event)=>{
	  console.log('Recorder stopped: ', event);
	  const superBuffer = new Blob(this.state.recordedBlobs, {type: 'video/webm'});
	  this.video.src = window.URL.createObjectURL(superBuffer);
	}

	toggleRecording=()=>{
		const recordButton = document.querySelector('button#record');
		const playButton = document.querySelector('button#play');
		const downloadButton = document.querySelector('button#download');

	  if (recordButton.textContent === 'Start Recording') {
	    this.startRecording();
	  } else {
	    this.stopRecording();
	    recordButton.textContent = 'Start Recording';
	    playButton.disabled = false;
	    downloadButton.disabled = false;
	  }
	}

	// The nested try blocks will be simplified when Chrome 47 moves to Stable
	startRecording=()=>{
	  let options = {mimeType: 'video/webm'};
	  this.setState({
	  	recordedBlobs : []
	  })
	  let mediaRecorder
	  console.log(this.props.stream)
	  if(!this.props.stream){
	  	alert('video not running');
	        console.error('Exception while creating MediaRecorder:');
	  }
	  try {
	    mediaRecorder = new MediaRecorder(this.props.stream, options);
	  } catch (e0) {
	    console.log('Unable to create MediaRecorder with options Object: ', e0);
	    try {
	      options = {mimeType: 'video/webm,codecs=vp9'};
	      mediaRecorder = new MediaRecorder(this.props.stream, options);
	    } catch (e1) {
	      console.log('Unable to create MediaRecorder with options Object: ', e1);
	      try {
	        options = 'video/vp8'; // Chrome 47
	        mediaRecorder = new MediaRecorder(this.props.stream, options);
	      } catch (e2) {
	        alert('MediaRecorder is not supported by this browser.\n\n' +
	          'Try Firefox 29 or later, or Chrome 47 or later, ' +
	          'with Enable experimental Web Platform features enabled from chrome://flags.');
	        console.error('Exception while creating MediaRecorder:', e2);
	        return;
	      }
	    }
	  }
	  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
	  const recordButton = document.querySelector('button#record');
	  const playButton = document.querySelector('button#play');
	  const downloadButton = document.querySelector('button#download');

	  recordButton.textContent = 'Stop Recording';
	  playButton.disabled = true;
	  downloadButton.disabled = true;
	  mediaRecorder.onstop = this.handleStop;
	  mediaRecorder.ondataavailable = this.handleDataAvailable;
	  mediaRecorder.start(100); // collect 100ms of data
	  this.setState({
	    	mediaRecorder
	    })
	  console.log('MediaRecorder started', mediaRecorder);
	}

	stopRecording=()=>{
	  this.state.mediaRecorder.stop();
	  console.log('Recorded Blobs: ', this.state.recordedBlobs);
	  this.video.controls = true;
	}

	
	download=()=>{
		console.log("clicked download ")
	  const blob = new Blob(this.state.recordedBlobs, {type: 'video/webm'});
	  const url = window.URL.createObjectURL(blob);
	  const a = document.createElement('a');
	  a.style.display = 'none';
	  a.href = url;
	  a.download = 'test.webm';
	  document.body.appendChild(a);
	  console.log("a",a)

	  a.click();
	  setTimeout(() => {
	    document.body.removeChild(a);
	    window.URL.revokeObjectURL(url);
	  }, 100);
	}

	render(){
		
		return(
		    
			<div id="container">
				<title>Record canvas stream</title>
			    <video ref={ref => this.video = ref} id="recorded" playsInline loop></video>
			    

			</div>
		)
	}
}
export default Recorder
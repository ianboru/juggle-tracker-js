import React, { Component } from 'react';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import 'rc-slider/assets/index.css';
import cvutils from './cvutils'
import './detectionControls.css'
import store from './store'
import { observer } from 'mobx-react'
const createSliderWithTooltip = Slider.createSliderWithTooltip;
const Range = createSliderWithTooltip(Slider.Range);
const Handle = Slider.Handle;
const wrapperStyle = { width: '300px', margin: '0 auto' };
const handle = (props) => {
  const { value, dragging, index, ...restProps } = props;
  return (
    <Tooltip
      prefixCls="rc-slider-tooltip"
      overlay={value}
      visible={dragging}
      placement="top"
      key={index}
    >
      <Handle value={value} {...restProps} />
    </Tooltip>
  );
};
@observer
class DetectionControls extends Component {
	onBlurAmountChange = (values) =>{
		let target = {
			name : 'blurAmount',
			value : values
		}
		this.props.handleDetectionControlsChange(target)
	} 
	onSizeThresholdChange = (values) =>{
		let target = {
			name : 'sizeThreshold',
			value : values
		}
		this.props.handleDetectionControlsChange(target)
	}  

	onUsingWhiteOn = (values) =>{
		let target = {
			name : 'usingWhite',
			value : 1
		}
		this.props.handleDetectionControlsChange(target)
	} 
	onUsingWhiteOff = (values) =>{
		let target = {
			name : 'usingWhite',
			value : 0
		}
		this.props.handleDetectionControlsChange(target)
	} 

	render() {
		store.calibrationMode
		console.log("text", store.calibrationModeText)
		const sliders = 
				<div style={wrapperStyle}>				
				<button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="showRaw" onClick={store.toggleCalibrationMode}>{store.calibrationModeText}</button>
				<button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="showRaw" onClick={this.onShowRawOff}>Show Mask</button>
				<br/>					
				<button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="usingWhite" onClick={this.onUsingWhiteOn}>Use Brightness</button>
				<button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="usingWhite" onClick={this.onUsingWhiteOff}>Use Colors</button>
				<br/>	
				<div style={{"width": "80px", "display" :"inline-block"}}>Blur</div><Slider min={1} max={30} step={1} defaultvalue={this.props.blurAmount}  handle={handle} onChange={this.onBlurAmountChange}/>
				<div style={{"width": "80px", "display" :"inline-block"}}>Min Size Threshold</div><Slider min={1} max={20000} step={250} defaultvalue={this.props.sizeThreshold}  handle={handle} onChange={this.onSizeThresholdChange}/>
				</div>

		return (
			<div>
				{sliders}
			</div>
		)
	}
}
export default DetectionControls
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

	render() {
		store.calibrationMode
		store.usingWhite
		console.log("text", store.usingWhite)
		const sliders = 
				<div style={wrapperStyle}>				
				<button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="showRaw" onClick={store.toggleCalibrationMode}>{store.calibrationModeText}</button>
				<br/>					
				<button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="usingWhite" onClick={store.toggleUsingWhite}>{store.usingWhiteText}</button>
				<br/>	
				<div style={{"width": "80px", "display" :"inline-block"}}>Blur</div><Slider min={1} max={30} step={1} defaultvalue={store.blurAmount}  handle={handle} onChange={store.setBlurAmount}/>
				<div style={{"width": "80px", "display" :"inline-block"}}>Min Size Threshold</div><Slider min={1} max={10000} step={50} defaultvalue={store.sizeThreshold}  handle={handle} onChange={store.setSizeThreshold}/>
				</div>

		return (
			<div>
				{sliders}
			</div>
		)
	}
}
export default DetectionControls
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
		store.blurAmount
		return (
			<div>				
				<button className="small-button" id="showRaw" onClick={store.toggleCalibrationMode}>Color Filter</button>
				<div className="slider-label">Blur</div><Slider min={1} max={30} step={1} defaultValue={store.blurAmount}  handle={handle} onChange={store.setBlurAmount}/>
				<div className="slider-label">Minimum Size</div><Slider min={1} max={100} step={1} defaultValue={store.sizeThreshold} handle={handle} onChange={store.setSizeThreshold}/>
			</div>
		)
	}
}
export default DetectionControls
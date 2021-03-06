import React, { Component } from 'react';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import 'rc-slider/assets/index.css';
import store from './store'
import "./App.css"
import { observer } from 'mobx-react'
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
const buttonClass = (shown)=>{
  return shown ? "active small-button" : "inactive small-button"
}

@observer
class DetectionControls extends Component {
	render() {
		return (
			<div>	
				<div className="slider-label">Blur</div><Slider min={0} max={30} step={1} defaultValue={store.blurAmount}  handle={handle} onChange={store.setBlurAmount}/>
				<div className="slider-label">Minimum Size</div><Slider min={0} max={2000} step={20} defaultValue={store.sizeThreshold} handle={handle} onChange={store.setSizeThreshold}/>
        <div className="slider-label">Image Scale</div><Slider min={1} max={4} step={.1} defaultValue={store.imageScale} handle={handle} onChange={store.setImageScale}/>
        <div className="slider-label">Number of Props</div><Slider min={1} max={20} step={1} defaultValue={store.numProps} handle={handle} onChange={store.setNumProps}/>
			</div>
		)
	}
}
export default DetectionControls
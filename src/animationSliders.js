import React, { Component } from 'react';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import 'rc-slider/assets/index.css';
import cvutils from './cvutils'
import './animationSliders.css'
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

class AnimationSliders extends Component {

	onColorOneChange = (values) =>{
		let target = {
			name : 'colorOne',
			value : values
		}
		this.props.handleAnimationSliderChange(target)
	}
	onColorTwoChange = (values) =>{
		let target = {
			name : 'colorTwo',
			value : values
		}
		this.props.handleAnimationSliderChange(target)
	}
	onThickChange = (values) =>{
		let target = {
			name : 'connectionsThickness',
			value : values
		}
		this.props.handleAnimationSliderChange(target)
	} 

	render() {
		const sliders = 
			<div style={wrapperStyle}>
				<div style={{"width": "80px", "display" :"inline-block"}}>ColorOne</div><Slider className="hue-slider" min={0} max={180} step={1} value={this.props.colorOne} handle={handle} onChange={this.onColorOneChange} />
				<div style={{"width": "80px", "display" :"inline-block"}}>ColorTwo</div><Slider className="hue-slider" min={0} max={180} step={1} value={this.props.colorTwo}  handle={handle} onChange={this.onColorTwoChange}/>
				<div style={{"width": "80px", "display" :"inline-block"}}>Thickness</div><Slider min={0} max={25} step={1} value={this.props.connectionsThickness}  handle={handle} onChange={this.onThickChange}/>
			</div>

		return (
			<div>
				{sliders}
			</div>
		)
	}
}
export default AnimationSliders
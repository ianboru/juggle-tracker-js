import React, { Component } from 'react';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import 'rc-slider/assets/index.css';
import cvutils from './cvutils'
import './colorSliders.css'
const createSliderWithTooltip = Slider.createSliderWithTooltip;
const Range = createSliderWithTooltip(Slider.Range);
const Handle = Slider.Handle;
const wrapperStyle = { width: '250px', margin: '0 auto' };
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

class ColorSliders extends Component {
	state = {
		lh : 200,
	    ls : .2,
	    lv : .2,
	    hh : 230,
	    hs : 1,
	    hv : 1,
	    tv : cvutils.initialHSV.tv,
	}
	onHChange = (values) =>{
		console.log(values) 
		let target = {
			name : 'lh',
			value : values[0]
		}
		this.props.handleHSVSliderChange(target)
		target = {
			name : 'hh',
			value : values[1]
		}
		this.props.handleHSVSliderChange(target)
	}
	onSChange = (values) =>{
		console.log(values) 
		let target = {
			name : 'ls',
			value : values[0]
		}
		this.props.handleHSVSliderChange(target)
		target = {
			name : 'hs',
			value : values[1]
		}
		this.props.handleHSVSliderChange(target)
	}
	onVChange = (values) =>{
		console.log(values) 
		let target = {
			name : 'lv',
			value : values[0]
		}
		this.props.handleHSVSliderChange(target)
		target = {
			name : 'hv',
			value : values[1]
		}
		this.props.handleHSVSliderChange(target)
	}
	onBrightnessChange = (values) =>{
		console.log(values) 
		this.props.handleHSVSliderChange(this.state.hsv)
	} 
	render() {
		const sliders = 
			this.props.usingWhite ?
				<div style={wrapperStyle}>
					<div style={{"width": "80px", "display" :"inline-block"}}>Brightness</div><Slider min={0} max={100} step={1} defaultValue={cvutils.initialHSV.tv} handle={handle} onChange={this.onChange} />
				</div> 
					:
				<div style={wrapperStyle}>
					<div style={{"width": "80px", "display" :"inline-block"}}>Hue</div><Range className="hue-slider" min={0} max={360} step={1} defaultValue={[cvutils.initialHSV.lh,cvutils.initialHSV.hh]} handle={handle} onChange={this.onHChange} />
					<div style={{"width": "80px", "display" :"inline-block"}}>Saturation</div><Range min={0} max={1} step={.01} defaultValue={[cvutils.initialHSV.ls,cvutils.initialHSV.hs]}  handle={handle} onChange={this.onSChange}/>
					<div style={{"width": "80px", "display" :"inline-block"}}>Brightness</div><Range min={0} max={1} step={.01} defaultValue={[cvutils.initialHSV.lv,cvutils.initialHSV.hv]}  handle={handle} onChange={this.onVChange} />
				</div>

		return (
			<div>
				{sliders}
			</div>
		)
	}
}
export default ColorSliders
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

class ColorSliders extends Component {

	onHChange = (values) =>{
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
	onBrightnessChange = (value) =>{
		const target = {
			name : "tv",
			value : value
		}
		this.props.handleHSVSliderChange(target)
	} 

	render() {
		const sliders = 
			this.props.usingWhite ?
				<div style={wrapperStyle}>
					<div style={{"width": "180px", "display" :"inline-block", "marginTop" : "15px"}}>Minumum Brightness</div><Slider min={0} max={100} step={1} defaultValue={this.props.HSV.tv} handle={handle} onChange={this.onBrightnessChange} />
				</div> 
					:
				<div style={wrapperStyle}>
					<div style={{"width": "80px", "display" :"inline-block"}}>Hue</div><Range className="hue-slider" allowCross={false} min={0} max={360} step={1} value={[this.props.HSV.lh,this.props.HSV.hh]} handle={handle} onChange={this.onHChange} />
					<div style={{"width": "80px", "display" :"inline-block"}}>Saturation</div><Range allowCross={false} min={0} max={1} step={.01} value={[this.props.HSV.ls,this.props.HSV.hs]}  handle={handle} onChange={this.onSChange}/>
					<div style={{"width": "80px", "display" :"inline-block"}}>Brightness</div><Range allowCross={false}  min={0} max={1} step={.01} value={[this.props.HSV.lv,this.props.HSV.hv]}  handle={handle} onChange={this.onVChange} />
				</div>

		return (
			<div>
				{sliders}
			</div>
		)
	}
}
export default ColorSliders
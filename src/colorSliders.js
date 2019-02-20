import React, { Component } from 'react';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import 'rc-slider/assets/index.css';
import cvutils from './cvutils'
import './colorSliders.css'
import store from './store'
import { observer } from 'mobx-react'
import { toJS } from 'mobx'

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
class ColorSliders extends Component {

	onHChange = (values) =>{
		store.setHSVValue('lh', values[0])
		store.setHSVValue('hh', values[1])
	}
	onSChange = (values) =>{
		store.setHSVValue('ls', values[0])
		store.setHSVValue('hs', values[1])
	}
	onVChange = (values) =>{
		store.setHSVValue('lv', values[0])
		store.setHSVValue('hv', values[1])
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
					<div style={{"width": "80px", "display" :"inline-block"}}>Hue</div><Range className="hue-slider" allowCross={false} min={0} max={360} step={1} value={[store.filterHSV.lh,store.filterHSV.hh]} handle={handle} onChange={this.onHChange} />
					<div style={{"width": "80px", "display" :"inline-block"}}>Saturation</div><Range allowCross={false} min={0} max={1} step={.01} value={[store.filterHSV.ls,store.filterHSV.hs]}  handle={handle} onChange={this.onSChange}/>
					<div style={{"width": "80px", "display" :"inline-block"}}>Brightness</div><Range allowCross={false}  min={0} max={1} step={.01} value={[store.filterHSV.lv,store.filterHSV.hv]}  handle={handle} onChange={this.onVChange} />
				</div>

		return (
			<div>
				{sliders}
			</div>
		)
	}
}
export default ColorSliders
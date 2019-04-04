import React, { Component } from 'react';
import ReactDOM from 'react-dom'
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import 'rc-slider/assets/index.css';
import store from './store'
import { observer } from 'mobx-react'
//TODO: switch to App.css, currently cancels styles for some reason 
import "./colorControls.css"
import cvutils from './cvutils'
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
const buttonClass = (shown)=>{
  return shown ? "active small-button" : "inactive small-button"
}

@observer
class ColorControls extends Component {
	state = {
		adjustedSlider : false
	}
	componentDidMount(){
		this.forceUpdate()
	}
	componentDidUpdate(prevState){
		if(this.satSlider && !this.state.adjustedSlider){
			const satNode = ReactDOM.findDOMNode(this.satSlider)
			const satRCSliders = satNode.getElementsByClassName('rc-slider-rail')
			this.setSGradient(satRCSliders[0],store.currentH)
			const valNode = ReactDOM.findDOMNode(this.valSlider)
			const valRCSliders = valNode.getElementsByClassName('rc-slider-rail')
			this.setVGradient(valRCSliders[0],store.currentH, store.currentS)
		}
	}
	setSGradient=(node,currentH)=>{
		node.style.backgroundImage = "-o-linear-gradient(hsl("+currentH +",0%,80%),hsl("+currentH +",100%,80%))";
		node.style.backgroundImage = "-ms-linear-gradient(hsl("+currentH +",0%,80%),hsl("+currentH +",100%,80%))";
		node.style.backgroundImage = "-moz-linear-gradient(hsl("+currentH +",0%,80%),hsl("+currentH +",100%,80%))";
		node.style.backgroundImage = "-webkit-linear-gradient(hsl("+currentH +",0%,80%),hsl("+currentH +",100%,80%))";
		node.style.backgroundImage = "linear-gradient(to right,hsl("+currentH +",0%,80%),hsl("+currentH +",100%,80%))";
	}
	setVGradient=(node,currentH, currentS)=>{
		currentS = Math.round(currentS*100)
		node.style.backgroundImage = "-o-linear-gradient(hsl("+currentH +","+currentS+"%,15%),hsl("+currentH +","+currentS+"%,90%))";
		node.style.backgroundImage = "-ms-linear-gradient(hsl("+currentH +","+currentS+"%,15%),hsl("+currentH +","+currentS+"%,90%))";
		node.style.backgroundImage = "-moz-linear-gradient(hsl("+currentH +","+currentS+"%,15%),hsl("+currentH +","+currentS+"%,90%))";
		node.style.backgroundImage = "-webkit-linear-gradient(hsl("+currentH +","+currentS+"%,15%),hsl("+currentH +","+currentS+"%,90%))";
		node.style.backgroundImage = "linear-gradient(to right,hsl("+currentH +","+currentS+"%,15%),hsl("+currentH +","+currentS+"%,90%))";
	}
	onHChange = (values) =>{
		store.setHSVValue('lh', values[0])
		store.setHSVValue('hh', values[1])
		const currentH = cvutils.mean(values[0], values[1])
		const satNode = ReactDOM.findDOMNode(this.satSlider)
		const satRCSliders = satNode.getElementsByClassName('rc-slider-rail')
		this.setSGradient(satRCSliders[0],store.currentH)
		const valNode = ReactDOM.findDOMNode(this.valSlider)
		const valRCSliders = valNode.getElementsByClassName('rc-slider-rail')
		this.setVGradient(valRCSliders[0],store.currentH, store.currentS)
		this.setState({adjustedSlider : true})
	}
	onSChange = (values) =>{
		store.setHSVValue('ls', values[0])
		store.setHSVValue('hs', values[1])
		const valNode = ReactDOM.findDOMNode(this.valSlider)
		const valRCSliders = valNode.getElementsByClassName('rc-slider-rail')
		this.setVGradient(valRCSliders[0],store.currentH, store.currentS)
		this.setState({adjustedSlider : true})
	}
	onVChange = (values) =>{
		store.setHSVValue('lv', values[0])
		store.setHSVValue('hv', values[1])
		this.setState({adjustedSlider : true})
	}
	onBrightnessChange = (value) =>{
		store.setBrightnessThreshold(value)
	} 

	render() {
		store.usingWhite
		const sliders = 
			store.usingWhite ?
				<div>
					<div className="slider-label" style={{"width": "180px", "display" :"inline-block"}}>Minimum Brightness</div><Slider min={0} max={100} step={1} defaultValue={store.brightnessThreshold} handle={handle} onChange={this.onBrightnessChange} />
				</div> 
					:
				<div>
					<span  className="slider-label">Hue</span><Range className="hue-slider" allowCross={false} min={0} max={360} step={1} value={[store.filterHSV.lh,store.filterHSV.hh]} handle={handle} onChange={this.onHChange} />
					<span  className="slider-label">Saturation</span><Range ref={ref => this.satSlider = ref}  id="sat-slider" allowCross={false} min={0} max={1} step={.01} value={[store.filterHSV.ls,store.filterHSV.hs]}  handle={handle} onChange={this.onSChange}/>
					<span  className="slider-label" >Brightness</span><Range ref={ref => this.valSlider = ref} allowCross={false}  min={0} max={1} step={.01} value={[store.filterHSV.lv,store.filterHSV.hv]}  handle={handle} onChange={this.onVChange} />
				</div>

		return (
			<div>
				{sliders}
			</div>
		)
	}
}
export default ColorControls
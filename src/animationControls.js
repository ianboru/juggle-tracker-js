import React, { Component } from 'react';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import 'rc-slider/assets/index.css';
import cvutils from './cvutils'
import './animationControls.css'
import store from './store'
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

class AnimationControls extends Component {

	onColorOneChange = (values) =>{
		let target = {
			name : 'colorOne',
			value : values
		}
		this.props.handleAnimationControlsChange(target)
	}
	onDiscoIncrementChange = (values) =>{
		let target = {
			name : 'discoIncrement',
			value : values
		}
		this.props.handleAnimationControlsChange(target)
	}
	onThickChange = (values) =>{
		let target = {
			name : 'connectionsThickness',
			value : values
		}
		this.props.handleAnimationControlsChange(target)
	} 
	onStarsPerObjectChange = (values) =>{
		let target = {
			name : 'numStarsPerObject',
			value : values
		}
		this.props.handleAnimationControlsChange(target)
	}  
	onStarLifeChange = (values) =>{
		let target = {
			name : 'starLife',
			value : values
		}
		this.props.handleAnimationControlsChange(target)
	}  
	onTrailLengthChange = (values) =>{
		let target = {
			name : 'trailLength',
			value : values
		}
		this.props.handleAnimationControlsChange(target)
	}
	render() {
		store.showConnections
		store.showTrails
		store.showStars
		store.discoMode
		const sliders = 
			<div style={wrapperStyle}>
				<button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="connections" onClick={store.toggleShowConnections}>{store.showConnectionsText}</button>
				<br/>				
				<button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="trails" onClick={store.toggleShowTrails}>{store.showTrailsText}</button>
				<br/>				
				<button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="stars" onClick={store.toggleShowStars}>{store.showStarsText}</button>
				<br/>				
				<button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="disco" onClick={store.toggleDiscoMode}>{store.discoModeText}</button>
				<br/>
				<div style={{"width": "80px", "display" :"inline-block"}}>ColorOne</div><Slider className="hue-slider" min={0} max={360} step={1} defaultvalue={this.props.colorOne} handle={handle} onChange={this.onColorOneChange} />
				<div style={{"width": "80px", "display" :"inline-block"}}>Thickness</div><Slider min={0} max={25} step={1} defaultvalue={this.props.connectionsThickness}  handle={handle} onChange={this.onThickChange}/>
				<div style={{"width": "80px", "display" :"inline-block"}}>Number of new stars</div><Slider min={1} max={100} step={1} defaultvalue={this.props.numStarsPerObject}  handle={handle} onChange={this.onStarsPerObjectChange}/>
				<div style={{"width": "80px", "display" :"inline-block"}}>Star Life</div><Slider min={0} max={1} step={.01} defaultvalue={this.props.starLife}  handle={handle} onChange={this.onStarLifeChange}/>
				<div style={{"width": "80px", "display" :"inline-block"}}>Trail Length</div><Slider min={0} max={50} step={1} defaultvalue={this.props.trailLength}  handle={handle} onChange={this.onTrailLengthChange}/>
				<div style={{"width": "80px", "display" :"inline-block"}}>Disco Increment</div><Slider min={1} max={10} step={1} defaultvalue={this.props.discoIncrement}  handle={handle} onChange={this.onDiscoIncrementChange}/>
			</div>

		return (
			<div>
				{sliders}
			</div>
		)
	}
}
export default AnimationControls
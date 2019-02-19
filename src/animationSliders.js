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
	onDiscoIncrementChange = (values) =>{
		let target = {
			name : 'discoIncrement',
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
	onStarsPerObjectChange = (values) =>{
		let target = {
			name : 'numStarsPerObject',
			value : values
		}
		this.props.handleAnimationSliderChange(target)
	}  
	onStarLifeChange = (values) =>{
		let target = {
			name : 'starLife',
			value : values
		}
		this.props.handleAnimationSliderChange(target)
	}  
	onTrailLengthChange = (values) =>{
		let target = {
			name : 'trailLength',
			value : values
		}
		this.props.handleAnimationSliderChange(target)
	} 
	onConnectionsOn = (values) =>{
		let target = {
			name : 'showConnections',
			value : 1
		}
		this.props.handleAnimationSliderChange(target)
	} 
	onConnectionsOff = (values) =>{
		let target = {
			name : 'showConnections',
			value : 0
		}
		this.props.handleAnimationSliderChange(target)
	}  
	onTrailsOn = (values) =>{
		let target = {
			name : 'showTrails',
			value : 1
		}
		this.props.handleAnimationSliderChange(target)
	} 
	onTrailsOff = (values) =>{
		let target = {
			name : 'showTrails',
			value : 0
		}
		this.props.handleAnimationSliderChange(target)
	}  
	onStarsOn = (values) =>{
		let target = {
			name : 'showStars',
			value : 1
		}
		this.props.handleAnimationSliderChange(target)
	} 
	onStarsOff = (values) =>{
		let target = {
			name : 'showStars',
			value : 0
		}
		this.props.handleAnimationSliderChange(target)
	}  
	onDiscoOn = (values) =>{
		let target = {
			name : 'discoMode',
			value : 1
		}
		this.props.handleAnimationSliderChange(target)
	} 
	onDiscoOff = (values) =>{
		let target = {
			name : 'discoMode',
			value : 0
		}
		this.props.handleAnimationSliderChange(target)
	} 

	render() {
		const sliders = 
			<div style={wrapperStyle}>
				<button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="connections" onClick={this.onConnectionsOn}>Show Connections</button>
				<button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="connections" onClick={this.onConnectionsOff}>Hide Connections</button>
				<br/>				
				<button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="trails" onClick={this.onTrailsOn}>Show Trails</button>
				<button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="trails" onClick={this.onTrailsOff}>Hide Trails</button>
				<br/>				
				<button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="stars" onClick={this.onStarsOn}>Show Stars</button>
				<button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="stars" onClick={this.onStarsOff}>Hide Stars</button>
				<br/>				
				<button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="disco" onClick={this.onDiscoOn}>Start Disco</button>
				<button style={{'fontSize':'12pt', 'marginBottom' : '10px'}}  id="disco" onClick={this.onDiscoOff}>Stop Disco</button>
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
export default AnimationSliders
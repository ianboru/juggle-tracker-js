import React, { Component } from 'react';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import 'rc-slider/assets/index.css';
import cvutils from './cvutils'
import './animationControls.css'
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
class AnimationControls extends Component {
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
				<div style={{"width": "80px", "display" :"inline-block"}}>ColorOne</div><Slider className="hue-slider" min={0} max={360} step={1} defaultvalue={store.animationColor} handle={handle} onChange={store.setAnimationColor} />
				<div style={{"width": "80px", "display" :"inline-block"}}>Thickness</div><Slider min={0} max={25} step={1} defaultvalue={store.connectionsThickness}  handle={handle} onChange={store.setConnectionThickness}/>
				<div style={{"width": "80px", "display" :"inline-block"}}>Number of new stars</div><Slider min={1} max={100} step={1} defaultvalue={store.numStarsPerObject}  handle={handle} onChange={store.setNumStarsPerObject}/>
				<div style={{"width": "80px", "display" :"inline-block"}}>Star Life</div><Slider min={0} max={1} step={.01} defaultvalue={store.starLife}  handle={handle} onChange={store.setStarLife}/>
				<div style={{"width": "80px", "display" :"inline-block"}}>Trail Length</div><Slider min={0} max={50} step={1} defaultvalue={store.trailLength}  handle={handle} onChange={store.setTrailLength}/>
				<div style={{"width": "80px", "display" :"inline-block"}}>Disco Increment</div><Slider min={1} max={24} step={1} defaultvalue={store.discoIncrement}  handle={handle} onChange={store.setDiscoIncrement}/>
			</div>

		return (
			<div>
				{sliders}
			</div>
		)
	}
}
export default AnimationControls
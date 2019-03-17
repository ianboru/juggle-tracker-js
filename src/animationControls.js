import React, { Component } from 'react';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import 'rc-slider/assets/index.css';
import store from './store'
import { observer } from 'mobx-react'
import "./App.css"
import trailsInactive from "./assets/trails_inactive.png"
import ringsInactive from "./assets/rings_inactive.png"

import connectSameInactive from "./assets/connect_same_inactive.png"
import connectAllInactive from "./assets/connect_all_inactive.png"
import starsInactive from "./assets/stars_inactive.png"
import rainbowInactive from "./assets/rainbow_inactive.png"
import brushInactive from "./assets/brush_inactive.png"

import trailsActive from "./assets/trails_active.png"
import ringsActive from "./assets/rings_active.png"
import connectSameActive from "./assets/connect_same_active.png"
import connectAllActive from "./assets/connect_all_active.png"
import starsActive from "./assets/stars_active.png"
import rainbowActive from "./assets/rainbow_active.png"
import brushActive from "./assets/brush_active.png"

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
class AnimationControls extends Component {
	render() {
		
		const buttonClass = (shown)=>{
	      return shown ? "active small-button" : "inactive small-button"
	    }
		const connectionControls = store.showConnections ? 
			<div>
			  <div className="slider-label" >Line Thickness</div><Slider min={0} max={25} step={1} defaultValue={store.connectionThickness}  handle={handle} onChange={store.setConnectionThickness}/>
			</div> : null
		
		const starControls = store.showStars ?
			<div>
				<div className="slider-label" ># Stars</div><Slider min={1} max={100} step={1} defaultValue={store.numStarsPerObject} handle={handle} onChange={store.setNumStarsPerObject}/>
				<div className="slider-label" >Star Life</div><Slider min={0} max={1} step={.01} defaultValue={store.starLife}  handle={handle} onChange={store.setStarLife}/>
				<div className="slider-label" >Star Size</div><Slider min={0} max={1} step={.01} defaultValue={store.starSize}  handle={handle} onChange={store.setStarSize}/>
			</div> : null
		
		const trailControls = store.showTrails ? 
			<div>
				<div className="slider-label" >Trail Length</div><Slider min={0} max={50} step={1} defaultValue={store.trailLength}  handle={handle} onChange={store.setTrailLength}/>
				<div className="slider-label" >Trail Thickness</div><Slider min={0} max={3} step={.01} defaultValue={store.trailThickness}  handle={handle} onChange={store.setTrailThickness}/>
			</div> : null

		const rainbowControls = store.discoMode ? 
			<div>
				<div className="slider-label" >Rainbow Speed</div><Slider min={1} max={24} step={1} defaultValue={store.discoIncrement}  handle={handle} onChange={store.setDiscoIncrement}/>
			</div> : null 

		const brushColorControls = store.showBrushColor ? 
			<div>
				<div className="slider-label" >Brush Color</div><Slider className="hue-slider" min={0} max={360} step={1} defaultValue={store.brushColor} handle={handle} onChange={store.setBrushColor} />
			</div> : null 
		return (
			<div>
				<div>
					<img className="icon" title="trails" onClick={store.toggleShowTrails} src={store.showTrails ? trailsActive : trailsInactive}/>
					<img className="icon" title="rings" onClick={store.toggleShowRings} src={store.showRings ? ringsActive : ringsInactive}/>
					<img className="icon" title="connect same colors" onClick={store.toggleShowConnections} src={store.showConnections ? connectSameActive : connectSameInactive}/>
					<img className="icon" title="connect all colors" onClick={store.toggleShowAllConnections} src={store.showAllConnections ? connectAllActive : connectAllInactive}/>
					<img className="icon" title="stars" onClick={store.toggleShowStars} src={store.showStars ? starsActive : starsInactive}/>
					<img className="icon" title="rainbow" onClick={store.toggleDiscoMode} src={store.discoMode ? rainbowActive : rainbowInactive}/>
					<img className="icon" title="brush color" onClick={store.toggleShowBrushColor} src={store.showBrushColor ? brushActive : brushInactive}/>
				</div>
				<div className="slider-label" >Animation Opacity</div><Slider min={0} max={1} step={.01} defaultValue={store.opacity}  handle={handle} onChange={store.setOpacity}/>
				{brushColorControls}
				{connectionControls}
				{trailControls}
				{starControls}
				{rainbowControls}

			</div>
		)
	}
}
export default AnimationControls
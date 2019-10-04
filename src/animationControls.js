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
import contoursInactive from "./assets/contours_inactive.png"
import connectSameInactive from "./assets/connect_same_inactive.png"
import connectAllInactive from "./assets/connect_all_inactive.png"
import starsInactive from "./assets/stars_inactive.png"
import rainbowInactive from "./assets/rainbow_inactive.png"
import brushInactive from "./assets/brush_inactive.png"
import squaresInactive from "./assets/squares_inactive.png"
import circlesInactive from "./assets/circles_inactive.png"

import circlesActive from "./assets/circles_active.png"
import trailsActive from "./assets/trails_active.png"
import ringsActive from "./assets/rings_active.png"
import contoursActive from "./assets/contours_active.png"
import connectSameActive from "./assets/connect_same_active.png"
import connectAllActive from "./assets/connect_all_active.png"
import starsActive from "./assets/stars_active.png"
import rainbowActive from "./assets/rainbow_active.png"
import brushActive from "./assets/brush_active.png"
import squaresActive from "./assets/squares_active.png"
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
		const connectionControls = store.showConnections || store.showAllConnections || store.showSquares ? 
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
				<div className="slider-label" >Sphere Trails</div><Slider min={1} max={50} step={1} defaultValue={store.trailLength}  handle={handle} onChange={store.setTrailLength}/>
				<div className="slider-label" >Sphere Radius</div><Slider min={0} max={3} step={.01} defaultValue={store.trailThickness}  handle={handle} onChange={store.setTrailThickness}/>
			</div> : null


		const ringControls = store.showRings ?
			<div>
				<div className="slider-label" >Ring Trails</div><Slider min={1} max={50} step={1} defaultValue={store.ringLength}  handle={handle} onChange={store.setRingLength}/>
				<div className="slider-label" >Ring Radius</div><Slider min={0} max={3} step={.01} defaultValue={store.ringThickness}  handle={handle} onChange={store.setRingThickness}/>
			</div> : null

		const rainbowControls = store.discoMode ? 
			<div>
				<div className="slider-label" >Rainbow Speed</div><Slider min={1} max={24} step={1} defaultValue={store.discoIncrement}  handle={handle} onChange={store.setDiscoIncrement}/>
			</div> : null 

		const brushColorControls = store.showBrushColor ? 
			<div>
				<div className="slider-label" >Brush Color</div><Slider className="hue-slider gradient-slider" min={0} max={360} step={1} defaultValue={store.brushColor} handle={handle} onChange={store.setBrushColor} />
			</div> : null 

		const contourControls = store.showContours ? 
			<div>

				<div className="slider-label" >Contour Thickness</div><Slider min={1} max={24} step={1} defaultValue={store.contourThickness}  handle={handle} onChange={store.setContourThickness}/>
				<div className="slider-label" >Contour Trails</div><Slider min={1} max={50} step={1} defaultValue={store.trailLength}  handle={handle} onChange={store.setTrailLength}/>

			</div> : null 


		return (
			<div>
				<div>
					<img className="icon" title="contours" onClick={store.toggleShowContours} src={store.showContours ? contoursActive : contoursInactive}/>
					<img className="icon" title="trails" onClick={store.toggleShowTrails} src={store.showTrails ? trailsActive : trailsInactive}/>
					<img className="icon" title="rings" onClick={store.toggleShowRings} src={store.showRings ? ringsActive : ringsInactive}/>
					<img className="icon" title="connect same colors" onClick={store.toggleShowConnections} src={store.showConnections ? connectSameActive : connectSameInactive}/>
					<img className="icon" title="connect all colors" onClick={store.toggleShowAllConnections} src={store.showAllConnections ? connectAllActive : connectAllInactive}/>
					<img className="icon" title="squares" onClick={store.toggleShowSquares} src={store.showSquares? squaresActive : squaresInactive}/>
					<img className="icon" title="circles" onClick={store.toggleShowCircles} src={store.showCircles? circlesActive : circlesInactive}/>

					<img className="icon" title="stars" onClick={store.toggleShowStars} src={store.showStars ? starsActive : starsInactive}/>
					<img className="icon" title="rainbow" onClick={store.toggleDiscoMode} src={store.discoMode ? rainbowActive : rainbowInactive}/>
					<img className="icon" title="brush color" onClick={store.toggleShowBrushColor} src={store.showBrushColor ? brushActive : brushInactive}/>
				</div>
				<div className="slider-label" >Animation Opacity</div><Slider min={0} max={1} step={.01} defaultValue={store.opacity}  handle={handle} onChange={store.setOpacity}/>
				{brushColorControls}
				{connectionControls}
				{trailControls}
				{ringControls}
				{starControls}
				{rainbowControls}
				{contourControls}
			</div>
		)
	}
}
export default AnimationControls
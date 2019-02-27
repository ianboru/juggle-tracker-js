import React, { Component } from 'react';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import 'rc-slider/assets/index.css';
import store from './store'
import { observer } from 'mobx-react'
import "./App.css"
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
					<button className={buttonClass(store.showConnections)}  id="connections" onClick={store.toggleShowConnections}>Connections</button>
					<button className={buttonClass(store.showTrails)}  id="trails" onClick={store.toggleShowTrails}>Trails</button>				
					<button className={buttonClass(store.showStars)}  id="stars" onClick={store.toggleShowStars}>Stars</button>				
					<button className={buttonClass(store.discoMode)}  id="disco" onClick={store.toggleDiscoMode}>Rainbow</button>
					<button className={buttonClass(store.showBrushColor)}  id="disco" onClick={store.toggleShowBrushColor}>Brush Color</button>
				</div>
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
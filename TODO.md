Workflow: 

Image processing: 
	- Allow connecting all balls of any color
	- Add superuser controls for detection (Stephen)
	- Improve detection for bad lighting/colors (Stephen)

UI:
	- Add animation sliders for choosing draw color (Stephen)
	- Icons for effect toggling
	- Ability to switch from front and rear facing cameras. (didnt work)
	- Add prompt for mobile that video must be landscape or cropped.

"backend":
	- Export mp4 instead of webm (involves codecs)
	- Improve quality of recorded video

Refactors:
	- Create data store to separate UI from data changes (mob x) (Ian)
	- Pull out css from js file or make styled components 
	
Bugs:
	- Touch held colors don't seem to work on mobile (ian)
	- Upload portait video from mobile always renders landscape
	- disco colors flash black on iOS safari

For fun:
	- Add body points 
	- allow non ball contour drawing
	- Background Subtraction
function isFacebookApp(){
    let ua = navigator.userAgent || navigator.vendor || window.opera;
    return (ua.indexOf("FBAN") > -1) || (ua.indexOf("FBAV") > -1) || (ua.indexOf("Instagram") > -1);;
 	//return true
 }
function calculateDistance(pt1, pt2){
	return Math.pow(
			Math.pow(pt1.x - pt2.x,2) + Math.pow(pt1.y - pt2.y,2)
		,.5)
}
const iOSDevice = !!navigator.platform.match(/iPhone|iPod|iPad/);

 export default {
 	calculateDistance,
 	isFacebookApp,
 	iOSDevice
 }
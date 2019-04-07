function isFacebookApp(){
    let ua = navigator.userAgent || navigator.vendor || window.opera;
    return (ua.indexOf("FBAN") > -1) || (ua.indexOf("FBAV") > -1) || (ua.indexOf("Instagram") > -1);;
 	//return true
 }

const iOSDevice = !!navigator.platform.match(/iPhone|iPod|iPad/);

 export default {
 	isFacebookApp,
 	iOSDevice
 }
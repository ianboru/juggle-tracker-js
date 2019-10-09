import ReactGA from 'react-ga'

function isFacebookApp(){
    let ua = navigator.userAgent || navigator.vendor || window.opera;
    return (ua.indexOf("FBAN") > -1) || (ua.indexOf("FBAV") > -1) || (ua.indexOf("Instagram") > -1);;
 	//return true
 }

const iOSDevice = !!navigator.platform.match(/iPhone|iPod|iPad/);
function sendGA(cat, act, lab){
  //console.log('sendGA ',cat+' ', act+' ', lab)
  if(!(window.location.host.includes("localhost") || window.location.host.match(/(\.\d+){3}/))){
    if (lab){
      ReactGA.event({
          category: cat,
          action: act,
          label: lab,
      });
    }
    else{
      ReactGA.event({
          category: cat,
          action: act,
      });
    }
  } 
}
 export default {
 	isFacebookApp,
 	iOSDevice,
 	sendGA
 }
import clock from "clock";
import * as document from "document";
import { preferences } from "user-settings";

import * as messaging from "messaging";
import { geolocation } from "geolocation";
import * as filesync from "fs";



function zeroPad(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

// Update the clock every minute
clock.granularity = "hours";

// Get a handle on the <text> element
const myLabel = document.getElementById("myLabel");
// Interval will start off with current time
const intervalLabel = document.getElementById("intervalLabel");
const intensityLabel = document.getElementById("intensityLabel");
const intensityDescrLabel = document.getElementById("intensityDescrLabel");
let today;
// Update the <text> element every tick with the current time
clock.ontick = (evt) => {
  
  today = evt.date;
  // now = new Date(today);
  let hours = today.getHours();
  if (preferences.clockDisplay === "12h") {
    // 12h format
    hours = hours % 12 || 12;
  } else {
    // 24h format
    hours = zeroPad(hours);
  }
  let mins = zeroPad(today.getMinutes());
  myLabel.text = `${hours}:${mins}`;




  // Check if location is still stored (on storage or at companion), if so load that location and refetch if older than ... hours.
  let UVdata_filename = "UVfetchdata.txt";

  // console.log("now"+today.getTime());

  // console.log("last modify: "+ (filesync.statSync(UVdata_filename).mtime.getTime() + 24*60*60*1000));
  startListener();
  if(filesync.existsSync(UVdata_filename) && today.toLocaleDateString() <= (filesync.statSync(UVdata_filename).mtime.toLocaleDateString())){
    let UVdata = filesync.readFileSync(UVdata_filename, "json");
    console.log("check 1")
    if(UVdata.skinIndex == null){
      //UVdata.skinIndex = 1;
      console.log("check 2 renew")
      renewData();
      return;
    }
    updateDisplay(UVdata.UVvalue, UVdata.skinIndex); //,"cached:"+UVdata.descrValue
    console.log("updating display from cache with: " +UVdata.UVvalue+ "and" + UVdata.skinIndex)
  } else 
  {
    renewData();
  }
}

function renewData(){
  // console.log("check 3 start renew")
  intensityDescrLabel.text = "Starting app geolocation...";

  // If location is stored, maybe try to update the current location asynchrously for the next time or till new fetch was made.
  // If location is not stored at all, retrieve new location like now.

  // Get current location which is probably already known, then use it to fetch the url
  // geolocation.getCurrentPosition(locationSuccess, locationError, {
  //   timeout: 15 * 1000,
  //   maximumAge: Infinity
  // });

  // function locationSuccess(_position) {
  //   if(_position == null || _position == undefined){
  //     _position.coords = {latitude: 52.0,longitude: 4.0}
  //   }
  //   console.log(
  //     "Latitude: " + _position.coords.latitude,
  //     "Longitude: " + _position.coords.longitude
  //   );
  //   // position = _position;

  //   intensityDescrLabel.text = "LocSuc:latlong="+ _position.coords.latitude+";"+ _position.coords.longitude;
  //   messaging.peerSocket.addEventListener("open", (evt) => {
  //     console.log("Ready to send or receive messages");
  //     intensityDescrLabel.text = `MessPeerOpen: sending loc to companion for fetch`;
  //     messaging.peerSocket.send({ loc: _position });
  //   });

  //   messaging.peerSocket.addEventListener("error", (err) => {
  //     console.error(`Connection error: ${err.code} - ${err.message}`);
  //     intensityDescrLabel.text = `MessPeerError: ${err.code} - ${err.message}`;
  //   });

  //   // messaging.peerSocket.send({ loc: _position});
  // }

  messaging.peerSocket.addEventListener("open", (evt) => {
    console.log("Ready to send or receive messages");
    messaging.peerSocket.send({ newLocComp: true });
  });

  messaging.peerSocket.addEventListener("error", (err) => {
    console.error(`Connection error: ${err.code} - ${err.message}`);
  });

  // messaging.peerSocket.send({ newLocComp: true });

  function locationError(error) {
    console.log("Error: " + error.code, "Message: " + error.message);
    let locError = "Error: " + error.code + " Message: " + error.message; //  

    intensityDescrLabel.text = "app: " + locError + "try companion...";

    // console.log(locError);
    
  }

  // startListener();
}

function startListener(){
  // Display results to intensity (descr) labels
  messaging.peerSocket.addEventListener("message", (evt) => {
    if(evt.data.error == "debug"){
      intensityLabel.text = `DEBUG`;
      intensityDescrLabel.text = evt.data.descrText;
      return;
    } else if(evt.data.error != "success"){
      intensityLabel.text = `-1`;
      intensityDescrLabel.text = evt.data.error;
      return;
    }  
    
    let curUVindex = evt.data.UVvalue;
    //let curDescrtext = evt.data.descrText;
    let curSkinType = evt.data.skinIndex;
    // console.log("1.curskinconstfortype: "+curSkinType);

    let UVfetchjson_data = {UVvalue: curUVindex, skinIndex: curSkinType}; //,descrValue: curDescrtext

    filesync.writeFileSync("UVfetchdata.txt", UVfetchjson_data, "json");
    let updatedUV = JSON.stringify(curUVindex)

    updateDisplay(updatedUV,curSkinType)
  });
}

function updateDisplay(updatedUV,curSkinType){
  intensityLabel.text = `Max UV:${updatedUV}`;

  let SkinTypeConst = [67,100,200,300,400,500];
  // console.log("U.curskinconstfortype: "+curSkinType);
  let burnTime = Math.round(SkinTypeConst[curSkinType]/updatedUV);
  let descrText = ` You could burn in: ${burnTime} minutes`;//${initiator}
  intensityDescrLabel.text = descrText;
}


// (Other window) show amount of minutes till you burn

// Get this value from tap or something
//intervalLabel.text = 




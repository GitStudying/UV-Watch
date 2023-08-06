import { geolocation } from "geolocation";
import * as messaging from "messaging";
import { me as companion } from "companion";

import { settingsStorage } from "settings";

// Get default city from settings
let cityValue = settingsStorage.getItem("cityDefault");
// Convert city to coordinates using fetch api 52, 5
let cityCoor = [52.0,5.0];
// message to app if 


// Fetch from companion: 

if (!companion.permissions.granted("access_location") || !companion.permissions.granted("access_internet")) {
  let internetPermError = "We're not allowed to access the internet!";

  let locPermError = "We're not allowed to access the location!"; //No location (grant permission)
  console.log(locPermError);
  messaging.peerSocket.addEventListener("open", (evt) => {
    console.log("Ready to send or receive messages");
    messaging.peerSocket.send({ error: locPermError });
  });

  messaging.peerSocket.addEventListener("error", (err) => {
    console.error(`Connection error: ${err.code} - ${err.message}`);
  });
}

let position;

messaging.peerSocket.addEventListener("message", (evt) => { 
  if(evt.data.newLocComp){
    compLoc();
    sendMessage({ descrText: "Companion start loc", error: "debug" });

    return;
  }

  position = evt.data.loc;
  // Save position
  console.log(
    "app.Latitude: " + position.coords.latitude,
    "app.Longitude: " + position.coords.longitude
  );
  fetchandmessage(position,"app: ");
});

let UVindex;
let skintype = -1;

//settingsStorage.getItem("SkinType").addEventListener(type: "change", listener: (this: LiveStorage, event: StorageChangeEvent) => any)
settingsStorage.onchange = function (evt) {
  if (evt.key === "SkinType") {
    if(UVindex == null){
      compLoc();
      return;
    }

    // Handle the "SkinType" setting change here
    let skintypesetting = settingsStorage.getItem("SkinType");
    skintype = parseInt(JSON.parse(skintypesetting).selected);
    if(skintype == -1 || skintype == null){
      sendMessage({ UVvalue: Math.round(UVindex), error: "Skintype not set in settingsmenu" });
    } else {
      sendMessage({ UVvalue: Math.round(UVindex), error: "success", skinIndex: skintype  });//, descrText: intensityDescrLabel
    }


  }
};

function fetchandmessage(position, initiator)
{
  sendMessage({ descrText: initiator+" start fetch: latlong: "+ position.coords.latitude +";" +position.coords.longitude, error: "debug" });
  let weatherAPIurl = "https://api.open-meteo.com/v1/forecast?latitude="+position.coords.latitude+"&longitude="+ position.coords.longitude+"&daily=uv_index_max,uv_index_clear_sky_max&timezone=Europe%2FBerlin";
  
  // try {
    fetch(weatherAPIurl).then( function(res) {
        // sendMessage({ descrText: initiator+"Fetch done resParseJson: "+ JSON.parse(res.text()), error: "success" });
        return res.text();
      }).then( (text) => {
        // console.log(text);
        UVindex = JSON.parse(text).daily.uv_index_max[0];
        console.log("UV:"+ UVindex);

        let updatedUV = UVindex;

        
        //console.log("intensityDescrLabel:"+ intensityDescrLabel);
        let skintypesetting = settingsStorage.getItem("SkinType");
        let skintype = parseInt(JSON.parse(skintypesetting).selected); // Handle no setting selected properly
        if(skintype == -1 || skintype == null){
          sendMessage({ UVvalue: Math.round(UVindex), error: "Skintype not set in settingsmenu" });
        } else {
          sendMessage({ UVvalue: Math.round(UVindex), error: "success", skinIndex: skintype  });//, descrText: intensityDescrLabel
        }
        // console.log("Skintype changed to:" + skintype);

        
      }).catch( e => {
        console.log(e);
        sendMessage({ descrText: initiator+"Fetch e: " + e, error: "debug" });
      });
    // } catch (e) {
    //   console.log(e)
    //   sendMessage({ descrText: initiator+"TRYCATCH Fetch error: " + e, error: "success" });
    // }
}

function compLoc()
{
  geolocation.getCurrentPosition(locationSuccess, locationError, {
    timeout: 60 * 1000,
    maximumAge: Infinity
  });
  function locationSuccess(_position) {
    console.log(
      "Latitude: " + _position.coords.latitude,
      "Longitude: " + _position.coords.longitude
    );
    position = _position;
  
    // intensityDescrLabel.text = "LocSuc:latlong="+ position.coords.latitude+";"+ position.coords.longitude;
    fetchandmessage(position,"companion: ");

    // Store position here as well if it has been success on device location.
  }
  function locationError(error) {
    console.log("Error: " + error.code, "Message: " + error.message);
    let locError = "Error: " + error.code + "Message: " + error.message; //No location (grant permission)
    sendMessage({ error: "comp"+locError });
  }
}

function sendMessage(messageJson)
{
  messaging.peerSocket.addEventListener("open", (evt) => {
    console.log("Ready to send or receive messages");
    messaging.peerSocket.send(messageJson);
  });

  messaging.peerSocket.addEventListener("error", (err) => {
    console.error(`Connection error: ${err.code} - ${err.message}`);
  });

  messaging.peerSocket.send(messageJson);
}
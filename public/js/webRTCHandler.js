import * as wss from "./wss.js";
import * as constants from "./constants.js";
import * as ui from "./ui.js";
import * as store from './store.js';
let connectedUserDetails;
let peerConnection;
const defaultConstraints = {
  audio: true,
  video: true
};

const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:13902'
    }
  ]
}

export const getLocalPreview = () => {
  navigator.mediaDevices.getUserMedia(defaultConstraints).then((stream) => {
    ui.updateLocalVideo(stream);
    store.setLocalStream(stream);
  }).catch((err) => {
    console.log('error occured when trying to get an access to camera');
    console.log("error--->" + err);
  });
};




const createPeerConnection = () => {
  peerConnection = new RTCPeerConnection(configuration);
  peerConnection.onicecandidate = (event) => {
    console.log('getting ice candidates from stun server...');
    if (event.candidate) {
      // send our ice candidates to other peer
      wss.sendDataUsingWebRTCSignaling({
        connectedUserSocketId:connectedUserDetails.socketId,
        type: constants.webRTCSignaling.ICE_CANDIDATE,
        candidate: event.candidate
      });
    }
  };


  peerConnection.onconnectionstatechange = (event) => {
    if (peerConnection.connectionState === 'connected') {
      console.log('successfully connected with other peer...');
    }
  }

  ///receiving tracks
  const remoteStream = new MediaStream();
  store.setRemoteStream(remoteStream);
  ui.updateRemoteVideo(remoteStream);

  peerConnection.ontrack = (event) => {
    remoteStream.addTrack(event.track);
  }

  //add our stream to peer connection 

  if (connectedUserDetails.callType === constants.callType.VIDEO_PERSONAL_CODE) {
    const localStream = store.getState().localStream;

    for (const track of localStream.getTracks()) {
      peerConnection.addTrack(track, localStream);
    }
  }
};

export const sendPreOffer = (callType, calleePersonalCode) => {
  connectedUserDetails = {
    callType,
    socketId: calleePersonalCode,
  };

  if (
    callType === constants.callType.CHAT_PERSONAL_CODE ||
    callType === constants.callType.VIDEO_PERSONAL_CODE
  ) {
    const data = {
      callType,
      calleePersonalCode,
    };
    ui.showCallingDialog(callingDialogRejectCallHandler);
    wss.sendPreOffer(data);
  }
};

export const handlePreOffer = (data) => {
  const { callType, callerSocketId } = data;

  connectedUserDetails = {
    socketId: callerSocketId,
    callType,
  };

  if (
    callType === constants.callType.CHAT_PERSONAL_CODE ||
    callType === constants.callType.VIDEO_PERSONAL_CODE
  ) {
    console.log("showing call dialog");
    ui.showIncomingCallDialog(callType, acceptCallHandler, rejectCallHandler);
  }
};

const acceptCallHandler = () => {
  console.log("call accepted");
  sendPreOfferAnswer(constants.preOfferAnswer.CALL_ACCEPTED);
  ui.showCallElements(connectedUserDetails.callType);
};

const rejectCallHandler = () => {
  console.log("call rejected");
  sendPreOfferAnswer(constants.preOfferAnswer.CALL_REJECTED);
};

const callingDialogRejectCallHandler = () => {
  console.log("rejecting the call");
};
const sendPreOfferAnswer = (preOfferAnswer) => {
  const data = {
    callerSocketId: connectedUserDetails.socketId,
    preOfferAnswer
  }
  ui.removeAllDialogs();
  wss.sendPreOfferAnswer(data);
}

export const handlePreOfferAnswer = (data) => {
  const { preOfferAnswer } = data;

  ui.removeAllDialogs();
  if (preOfferAnswer === constants.preOfferAnswer.CALLEE_NOT_FOUND) {
    ui.showInfoDialog(preOfferAnswer);
    //show dialog that callee has not been found
  }
  if (preOfferAnswer === constants.preOfferAnswer.CALL_UNAVAIABLE) {
    ui.showInfoDialog(preOfferAnswer);
    ///show dialog that callee is not able to connect 
  }
  if (preOfferAnswer === constants.preOfferAnswer.CALL_REJECTED) {
    ui.showInfoDialog(preOfferAnswer);
    //show dialog that call is rejected by the calee
  }
  if (preOfferAnswer === constants.preOfferAnswer.CALL_ACCEPTED) {
    ui.showCallElements(connectedUserDetails.callType);
    createPeerConnection();
    //send webrtc offer
    sendWebRTCOffer();
  }
};

const sendWebRTCOffer = async () => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  wss.sendDataUsingWebRTCSignaling({
    connectedUserSocketId: connectedUserDetails.socketId,
    type: constants.webRTCSignaling.OFFER,
    offer: offer
  });
};

export const handleWebRTCOffer = async (data) => {
  await peerConnection.setRemoteDescription(data.offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  wss.sendDataUsingWebRTCSignaling({
    connectedUserSocketId: connectedUserDetails.socketId,
    type: constants.webRTCSignaling.ANSWER,
    answer
  });
};

export const handleWebRTCAnswer = async (data) => {
  console.log('handle webrtc answer');
  await peerConnection.setRemoteDescription(data.answer);
}


export const handlewebRTCCandidate = async (data) => {
  console.log("handling incoming webRTC candidates");
  try {
    await peerConnection.addIceCandidate(data.candidate)
  } catch (err) {
    console.log("error occured while trying to add received ice candidate---->"+err);
  }
}
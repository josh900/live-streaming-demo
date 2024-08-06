import { setStreamSdp } from '../api/didApi.js';

let peerConnection;
let pcDataChannel;

function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({ iceServers });
    pcDataChannel = peerConnection.createDataChannel('JanusDataChannel');
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);

    pcDataChannel.onopen = () => {
      console.debug('Data channel opened');
    };
    pcDataChannel.onclose = () => {
      console.debug('Data channel closed');
    };
    pcDataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
    };
    pcDataChannel.onmessage = onStreamEvent;
  }

  return setRemoteAndCreateAnswer(offer);
}

async function setRemoteAndCreateAnswer(offer) {
  await peerConnection.setRemoteDescription(offer);
  console.debug('Set remote SDP');

  const sessionClientAnswer = await peerConnection.createAnswer();
  console.debug('Created local SDP');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  console.debug('Set local SDP');

  return sessionClientAnswer;
}

function onIceGatheringStateChange() {
  console.debug('ICE gathering state changed:', peerConnection.iceGatheringState);
  window.dispatchEvent(new CustomEvent('iceGatheringStateChange', { detail: peerConnection.iceGatheringState }));
}

function onIceCandidate(event) {
  if (event.candidate) {
    console.debug('New ICE candidate:', event.candidate.candidate);
    window.dispatchEvent(new CustomEvent('iceCandidate', { detail: event.candidate }));
  }
}

function onIceConnectionStateChange() {
  console.debug('ICE connection state changed:', peerConnection.iceConnectionState);
  window.dispatchEvent(new CustomEvent('iceConnectionStateChange', { detail: peerConnection.iceConnectionState }));
}

function onConnectionStateChange() {
  console.debug('Peer connection state changed:', peerConnection.connectionState);
  window.dispatchEvent(new CustomEvent('connectionStateChange', { detail: peerConnection.connectionState }));
}

function onSignalingStateChange() {
  console.debug('Signaling state changed:', peerConnection.signalingState);
  window.dispatchEvent(new CustomEvent('signalingStateChange', { detail: peerConnection.signalingState }));
}

function onTrack(event) {
  console.debug('onTrack event:', event);
  if (event.track && event.streams && event.streams.length > 0) {
    window.dispatchEvent(new CustomEvent('trackReceived', { detail: { track: event.track, streams: event.streams } }));
  }
}

function onStreamEvent(message) {
  if (pcDataChannel.readyState === 'open') {
    const [event, _] = message.data.split(':');
    window.dispatchEvent(new CustomEvent('streamEvent', { detail: event }));
  }
}

function closeConnection() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  if (pcDataChannel) {
    pcDataChannel.close();
    pcDataChannel = null;
  }
}

export { createPeerConnection, closeConnection };
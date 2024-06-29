import Logger from './logger.js';

const logger = new Logger('INFO');

export async function initializeWebRTC(DID_API) {
  logger.log('Initializing WebRTC');
  const sessionResponse = await fetch(`${DID_API.url}/${DID_API.service}/streams`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg',
      output_resolution: 720,
      stream_warmup: true
    }),
  });

  const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
  return { newStreamId, newSessionId, offer, iceServers };
}

export async function createPeerConnection(offer, DID_API) {
  logger.log('Creating peer connection');
  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
    sdpSemantics: 'unified-plan'
  });

  peerConnection.addEventListener('icegatheringstatechange', () => logger.log('ICE gathering state:', peerConnection.iceGatheringState));
  peerConnection.addEventListener('iceconnectionstatechange', () => logger.log('ICE connection state:', peerConnection.iceConnectionState));
  peerConnection.addEventListener('connectionstatechange', () => logger.log('Connection state:', peerConnection.connectionState));

  await peerConnection.setRemoteDescription(offer);
  logger.log('Set remote description');

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  logger.log('Set local description');

  return peerConnection;
}
'use strict';
import DID_API from './api.js';
import Logger from './logger.js';
import { initializeWebRTC, createPeerConnection, addIceCandidate, closePeerConnection } from './webrtc.js';
import { initializeDeepgram, startRecording, stopRecording } from './deepgram.js';
import { initializeGroq, sendChatToGroq } from './groq.js';
import { initializeAvatar, updateAvatarAppearance } from './avatar.js';
import { handleError } from './errorHandler.js';

const logger = new Logger('INFO');

let peerConnection;
let streamId;
let sessionId;
let isRecording = false;
let keepAliveInterval;
let ws;

const videoElement = document.getElementById('video-element');
videoElement.setAttribute('playsinline', '');

function initializeWebSocket() {
    ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`);

    ws.onopen = () => {
        logger.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
            case 'groq_response':
                startStreaming(data.response);
                break;
            case 'avatar_update_confirmation':
                logger.log('Avatar update confirmed');
                break;
            default:
                logger.log('Unknown message type:', data.type);
        }
    };

    ws.onerror = (error) => {
        handleError('WebSocket error', error);
    };

    ws.onclose = (event) => {
        logger.log('WebSocket connection closed:', event);
    };
}

async function initializeConnection() {
    logger.log('Initializing WebRTC connection');
    try {
        const { newStreamId, newSessionId, offer, iceServers } = await initializeWebRTC(DID_API);
        streamId = newStreamId;
        sessionId = newSessionId;
        peerConnection = await createPeerConnection(offer, iceServers);
        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                sendIceCandidate(event.candidate);
            }
        };
        startKeepAlive();
    } catch (error) {
        handleError('Failed to initialize connection', error);
        showErrorMessage('Failed to connect. Please try again.');
    }
}

function sendIceCandidate(candidate) {
    fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/ice`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${DID_API.key}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            candidate: candidate.candidate,
            sdpMid: candidate.sdpMid,
            sdpMLineIndex: candidate.sdpMLineIndex,
            session_id: sessionId,
        }),
    }).catch(error => handleError('Error sending ICE candidate', error));
}

function startKeepAlive() {
    logger.log('Starting keep-alive mechanism');
    keepAliveInterval = setInterval(async () => {
        try {
            await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/keepalive`, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${DID_API.key}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ session_id: sessionId }),
            });
        } catch (error) {
            handleError('Keep-alive request failed', error);
        }
    }, 30000);
}

function stopKeepAlive() {
  if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
  }
}

async function initialize() {
  logger.log('Initializing application');
  initializeWebSocket();
  await initializeConnection();
  await initializeGroq(DID_API.groqKey);
  initializeAvatar();
  
  document.getElementById('start-button').addEventListener('click', handleStartButtonClick);
}

async function handleStartButtonClick() {
  const startButton = document.getElementById('start-button');
  if (!isRecording) {
      logger.log('Starting recording');
      startButton.textContent = 'Stop';
      try {
          await initializeDeepgram(DID_API.deepgramKey, onTranscriptionReceived);
          await startRecording();
          isRecording = true;
      } catch (error) {
          handleError('Failed to start recording', error);
          startButton.textContent = 'Start';
          alert('Failed to start recording. Please check your internet connection and try again.');
      }
  } else {
      logger.log('Stopping recording');
      await stopRecording();
      isRecording = false;
      startButton.textContent = 'Start';
  }
}

function onTranscriptionReceived(transcript) {
  logger.log('Transcription received:', transcript);
  ws.send(JSON.stringify({ type: 'transcription', text: transcript }));
}

async function startStreaming(response) {
  logger.log('Starting stream with response:', response);
  try {
      const playResponse = await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
          method: 'POST',
          headers: {
              Authorization: `Basic ${DID_API.key}`,
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              script: {
                  type: 'text',
                  input: response,
                  provider: {
                      type: 'microsoft',
                      voice_id: 'en-US-JennyMultilingualV2Neural'
                  }
              },
              config: {
                  fluent: true,
                  pad_audio: 0,
                  stitch: true
              },
              session_id: sessionId,
          }),
      });

      if (!playResponse.ok) {
          throw new Error(`HTTP error ${playResponse.status}`);
      }
  } catch (error) {
      handleError('Error during streaming', error);
  }
}

function updateAvatar(imageUrl) {
  ws.send(JSON.stringify({ type: 'avatar_update', imageUrl }));
}

function showErrorMessage(message) {
  logger.error(message);
  const errorElement = document.createElement('div');
  errorElement.textContent = message;
  errorElement.style.color = 'red';
  errorElement.style.marginTop = '10px';
  document.body.appendChild(errorElement);
}

window.onload = initialize;

export { startStreaming, showErrorMessage, updateAvatar };
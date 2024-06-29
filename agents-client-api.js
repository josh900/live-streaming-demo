'use strict';
import DID_API from './api.js';
import Logger from './logger.js';
import { initializeWebRTC, createPeerConnection } from './webrtc.js';
import { initializeDeepgram, startRecording, stopRecording } from './deepgram.js';
import { initializeGroq, sendChatToGroq } from './groq.js';
import { initializeAvatar, updateAvatarAppearance } from './avatar.js';

const logger = new Logger('INFO'); // Set to 'DEBUG' for advanced logging

let peerConnection;
let streamId;
let sessionId;
let isRecording = false;
let keepAliveInterval;
let ws;

const videoElement = document.getElementById('video-element');
videoElement.setAttribute('playsinline', '');

// Initialize WebSocket connection
function initializeWebSocket() {
  ws = new WebSocket('ws://localhost:3000');

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
    logger.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    logger.log('WebSocket connection closed');
  };
}

// Initialize WebRTC connection
async function initializeConnection() {
  logger.log('Initializing WebRTC connection');
  try {
    const { newStreamId, newSessionId, sessionClientAnswer } = await initializeWebRTC(DID_API);
    streamId = newStreamId;
    sessionId = newSessionId;
    peerConnection = await createPeerConnection(sessionClientAnswer, DID_API);
    startKeepAlive();
  } catch (error) {
    logger.error('Error initializing connection:', error);
    showErrorMessage('Failed to connect. Please try again.');
  }
}

// Start keep-alive mechanism
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
      logger.error('Keep-alive request failed:', error);
    }
  }, 30000); // Send keep-alive every 30 seconds
}

// Stop keep-alive mechanism
function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
}

// Initialize the application
async function initialize() {
  logger.log('Initializing application');
  initializeWebSocket();
  await initializeConnection();
  await initializeDeepgram(DID_API.deepgramKey, onTranscriptionReceived);
  await initializeGroq(DID_API.groqKey);
  initializeAvatar();
}

// Handle start/stop button click
const startButton = document.getElementById('start-button');
startButton.onclick = async () => {
  if (!isRecording) {
    logger.log('Starting recording');
    startButton.textContent = 'Stop';
    await startRecording();
  } else {
    logger.log('Stopping recording');
    startButton.textContent = 'Start';
    await stopRecording();
  }
  isRecording = !isRecording;
};

// Handle transcription received from Deepgram
function onTranscriptionReceived(transcript) {
  logger.log('Transcription received:', transcript);
  ws.send(JSON.stringify({ type: 'transcription', text: transcript }));
}

// Start streaming the response
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
    logger.error('Error during streaming:', error);
  }
}

// Update avatar appearance
function updateAvatar(imageUrl) {
  ws.send(JSON.stringify({ type: 'avatar_update', imageUrl }));
}

// Initialize the application when the page loads
window.onload = initialize;

// Export functions for use in other modules
export { startStreaming, showErrorMessage, updateAvatar };
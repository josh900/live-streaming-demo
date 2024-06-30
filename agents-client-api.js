'use strict';
import DID_API from './api.js';
import Logger from './logger.js';
import { initializeWebRTC, createPeerConnection } from './webrtc.js';
import { initializeDeepgram, startRecording, stopRecording } from './deepgram.js';
import { initializeGroq, sendChatToGroq } from './groq.js';
import { initializeAvatar, updateAvatarAppearance } from './avatar.js';

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
        logger.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        logger.log('WebSocket connection closed');
    };
}

async function initializeConnection() {
    logger.log('Initializing WebRTC connection');
    try {
        const { newStreamId, newSessionId, offer, iceServers } = await initializeWebRTC(DID_API);
        streamId = newStreamId;
        sessionId = newSessionId;
        peerConnection = await createPeerConnection(offer, iceServers);
        startKeepAlive();
    } catch (error) {
        logger.error('Error initializing connection:', error);
        showErrorMessage('Failed to connect. Please try again.');
    }
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
            logger.error('Keep-alive request failed:', error);
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
  
  // Initialize Deepgram after user interaction
  document.getElementById('start-button').addEventListener('click', async () => {
      if (!isRecording) {
          await initializeDeepgram(DID_API.deepgramKey, onTranscriptionReceived);
          await startRecording();
          isRecording = true;
          document.getElementById('start-button').textContent = 'Stop';
      } else {
          await stopRecording();
          isRecording = false;
          document.getElementById('start-button').textContent = 'Start';
      }
  });
}

const startButton = document.getElementById('start-button');
startButton.onclick = async () => {
    if (!isRecording) {
        logger.log('Starting recording');
        startButton.textContent = 'Stop';
        try {
            await initializeDeepgram(DID_API.deepgramKey, onTranscriptionReceived);
            await startRecording();
            isRecording = true;
        } catch (error) {
            logger.error('Failed to start recording:', error);
            startButton.textContent = 'Start';
            alert('Failed to start recording. Please check your internet connection and try again.');
        }
    } else {
        logger.log('Stopping recording');
        await stopRecording();
        isRecording = false;
        startButton.textContent = 'Start';
    }
};

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
        logger.error('Error during streaming:', error);
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
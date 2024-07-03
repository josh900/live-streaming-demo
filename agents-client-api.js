'use strict';
import DID_API from './api.js';
import logger from './logger.js';
const { Deepgram } = deepgram;
const { createClient, LiveTranscriptionEvents } = deepgram;

const GROQ_API_KEY = DID_API.groqKey;
const DEEPGRAM_API_KEY = DID_API.deepgramKey;

if (DID_API.key == '🤫') alert('Please put your api key inside ./api.js and restart..');

const deepgramClient = createClient(DID_API.deepgramKey);

const RTCPeerConnection = (
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
).bind(window);

let peerConnection;
let streamId;
let sessionId;
let sessionClientAnswer;
let statsIntervalId;
let videoIsPlaying;
let lastBytesReceived;
let chatHistory = [];
let mediaRecorder;
let deepgramSocket;
let transcript = '';
let inactivityTimeout;
let transcriptionTimer;
let keepAliveInterval;
let socket;
let transcriptionStartTime;
let sdpExchangeComplete = false;
let isInitializing = false;
let audioContext;
let audioSource;
let audioDelay = 0.2; // 200ms delay
let streamVideoElement;
let idleVideoElement;
let deepgramConnection;
let isRecording = false;
let mediaStreamSource;
let processor;
let audioWorkletNode;
let microphoneStream;
let audioChunks = [];
let deepgramSource;
let additionalContext = '';
let currentUtterance = '';
let interimMessageAdded = false;
let autoSpeakMode = true;
let speakTimeout;
let autoSpeakInProgress = false;
let audioBufferSource;
let videoStartTimeout;




const avatars = {
  Brad: {
    idleImage: 'https://skoop-general.s3.amazonaws.com/brad_idle.png',
    idleVideo: 'brad_idle.mp4',
    voice: 'en-US-ChristopherNeural'
  },
  Ava: {
    idleImage: 'https://skoop-general.s3.amazonaws.com/ava_idle.png',
    idleVideo: 'ava_idle.mp4',
    voice: 'en-US-AvaNeural'
  },
  JoshC: {
    idleImage: 'https://skoop-general.s3.amazonaws.com/Joshc_idle.png',
    idleVideo: 'Joshc_idle.mp4',
    voice: 'en-US-GuyNeural'
  },
  Aric: {
    idleImage: 'https://skoop-general.s3.amazonaws.com/Aric_idle.png',
    idleVideo: 'Aric_idle.mp4',
    voice: 'en-US-GuyNeural'
  }
};

let currentAvatar = 'brad';

const avatarSelect = document.getElementById('avatar-select');
avatarSelect.addEventListener('change', handleAvatarChange);

const maxRetryCount = 3;
const maxDelaySec = 4;

let context = `
You are a helpful, harmless, and honest assistant. Please answer the users questions briefly, be concise, not more than 1 sentance unless absolutely needed.
`;

setLogLevel('INFO');

async function handleAvatarChange() {
  currentAvatar = avatarSelect.value;
  
  const idleVideoElement = document.getElementById('idle-video-element');
  if (idleVideoElement) {
    idleVideoElement.src = avatars[currentAvatar].idleVideo;
    idleVideoElement.load();
  }

  const streamVideoElement = document.getElementById('stream-video-element');
  if (streamVideoElement) {
    streamVideoElement.srcObject = null;
  }

  // Stop the current recording and reset states
  await stopRecording();
  
  // Reset transcription-related variables
  currentUtterance = '';
  interimMessageAdded = false;
  
  // Clear the message history
  const msgHistory = document.getElementById('msgHistory');
  msgHistory.innerHTML = '';
  
  // Reset chat history
  chatHistory = [];

  await destroyConnection();
  await initializeConnection();
}


async function destroyConnection() {
  if (streamId) {
    try {
      await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      logger.info('Stream destroyed successfully');
    } catch (error) {
      logger.error('Error destroying stream:', error);
    } finally {
      stopAllStreams();
      closePC();
      streamId = null;
      sessionId = null;
    }
  }
}

function blendFrames(idleFrame, talkingFrame, progress) {
  const canvas = document.createElement('canvas');
  canvas.width = idleFrame.videoWidth || 400;
  canvas.height = idleFrame.videoHeight || 400;
  const ctx = canvas.getContext('2d');
  
  ctx.globalAlpha = 1 - progress;
  ctx.drawImage(idleFrame, 0, 0, canvas.width, canvas.height);
  
  ctx.globalAlpha = progress;
  ctx.drawImage(talkingFrame, 0, 0, canvas.width, canvas.height);
  
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
  ctx.fill();
  
  return canvas;
}

let transitionCanvas;
let transitionCtx;

function initTransitionCanvas() {
  transitionCanvas = document.createElement('canvas');
  transitionCanvas.width = 400;
  transitionCanvas.height = 400;
  transitionCtx = transitionCanvas.getContext('2d');
  
  transitionCanvas.style.position = 'absolute';
  transitionCanvas.style.top = '0';
  transitionCanvas.style.left = '0';
  transitionCanvas.style.zIndex = '3';
  transitionCanvas.style.borderRadius = '50%';
  document.querySelector('#video-wrapper').appendChild(transitionCanvas);
}

function smoothTransition(duration = 300) {
  const { idle: idleVideoElement, stream: streamVideoElement } = getVideoElements();
  
  if (!idleVideoElement || !streamVideoElement) {
    logger.warn('Video elements not found for transition');
    return;
  }

  logger.debug('Starting smooth transition');

  // Ensure both videos are visible and positioned correctly
  idleVideoElement.style.opacity = '1';
  streamVideoElement.style.opacity = '0';
  
  // Force a reflow to ensure the initial state is applied
  void idleVideoElement.offsetWidth;
  
  // Apply transition to both elements
  idleVideoElement.style.transition = `opacity ${duration}ms ease-in-out`;
  streamVideoElement.style.transition = `opacity ${duration}ms ease-in-out`;
  
  // Trigger the transition
  idleVideoElement.style.opacity = '0';
  streamVideoElement.style.opacity = '1';
  
  // Remove transitions after they complete
  setTimeout(() => {
    idleVideoElement.style.transition = '';
    streamVideoElement.style.transition = '';
    logger.debug('Smooth transition completed');
  }, duration);
}


function getVideoElements() {
  const idle = document.getElementById('idle-video-element');
  const stream = document.getElementById('stream-video-element');
  
  if (!idle || !stream) {
    logger.warn('Video elements not found in the DOM');
  }
  
  return { idle, stream };
}

function getStatusLabels() {
  return {
    peer: document.getElementById('peer-status-label'),
    ice: document.getElementById('ice-status-label'),
    iceGathering: document.getElementById('ice-gathering-status-label'),
    signaling: document.getElementById('signaling-status-label'),
    streaming: document.getElementById('streaming-status-label')
  };
}

function initializeWebSocket() {
  socket = new WebSocket(`wss://${window.location.host}`);

  socket.onopen = () => {
    logger.info('WebSocket connection established');
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    logger.debug('Received WebSocket message:', data);

    switch (data.type) {
      case 'transcription':
        updateTranscription(data.text);
        break;
      case 'assistantReply':
        updateAssistantReply(data.text);
        break;
      default:
        logger.warn('Unknown WebSocket message type:', data.type);
    }
  };

  socket.onerror = (error) => {
    logger.error('WebSocket error:', error);
  };

  socket.onclose = () => {
    logger.info('WebSocket connection closed');
    setTimeout(initializeWebSocket, 5000);
  };
}

function updateTranscript(text, isFinal) {
  const msgHistory = document.getElementById('msgHistory');
  let interimSpan = msgHistory.querySelector('span[data-interim]');
  
  if (isFinal) {
    if (interimSpan) {
      interimSpan.remove();
    }
    msgHistory.innerHTML += `<span><u>User:</u> ${text}</span><br>`;
    logger.info('Final transcript added to chat history:', text);
    interimMessageAdded = false;
  } else {
    if (text.trim()) {
      if (!interimMessageAdded) {
        msgHistory.innerHTML += `<span data-interim style='opacity:0.5'><u>User (interim):</u> ${text}</span><br>`;
        interimMessageAdded = true;
      } else if (interimSpan) {
        interimSpan.innerHTML = `<u>User (interim):</u> ${text}`;
      }
    }
  }
  // Scroll to the bottom of the chat history
  msgHistory.scrollTop = msgHistory.scrollHeight;
}


function updateAssistantReply(text) {
  document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${text}</span><br>`;
}

async function initialize() {
  const { idle, stream } = getVideoElements();
  idleVideoElement = idle;
  streamVideoElement = stream;

  if (idleVideoElement) idleVideoElement.setAttribute('playsinline', '');
  if (streamVideoElement) streamVideoElement.setAttribute('playsinline', '');

  initTransitionCanvas();

  // Dynamically populate avatar options
  const avatarSelect = document.getElementById('avatar-select');
  avatarSelect.innerHTML = ''; // Clear existing options
  for (const [key, value] of Object.entries(avatars)) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = key.charAt(0).toUpperCase() + key.slice(1); // Capitalize first letter
    avatarSelect.appendChild(option);
  }

  playIdleVideo();
  showLoadingSymbol();
  initTransitionCanvas();
  try {
    await initializeConnection();
    startKeepAlive();
    hideLoadingSymbol();
  } catch (error) {
    logger.error('Error during initialization:', error);
    hideLoadingSymbol();
    showErrorMessage('Failed to connect. Please try again.');
  }

  // Add event listeners for context buttons
  const appendContextButton = document.getElementById('append-context-button');
  const replaceContextButton = document.getElementById('replace-context-button');
  const contextInput = document.getElementById('context-input');

  appendContextButton.addEventListener('click', () => updateContext('append'));
  replaceContextButton.addEventListener('click', () => updateContext('replace'));
}



function updateContext(action) {
  const contextInput = document.getElementById('context-input');
  const newContext = contextInput.value.trim();

  if (newContext) {
    if (action === 'append') {
      context += '\n' + newContext;
    } else if (action === 'replace') {
      context = newContext;
    }
    logger.info('Context updated:', context);
    contextInput.value = ''; // Clear the input field
    showToast('Context saved successfully');
  } else {
    showToast('Please enter some text before updating the context');
  }
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  toast.style.color = 'white';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '5px';
  toast.style.zIndex = '1000';

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease-out';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 500);
  }, 3000);
}


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initialize().catch(error => {
      logger.error('Error during initialization:', error);
      showErrorMessage('Failed to initialize. Please refresh the page and try again.');
    });
  });
} else {
  initialize().catch(error => {
    logger.error('Error during initialization:', error);
    showErrorMessage('Failed to initialize. Please refresh the page and try again.');
  });
}


function showLoadingSymbol() {
  const loadingSymbol = document.createElement('div');
  loadingSymbol.id = 'loading-symbol';
  loadingSymbol.innerHTML = 'Connecting...';
  loadingSymbol.style.position = 'absolute';
  loadingSymbol.style.top = '50%';
  loadingSymbol.style.left = '50%';
  loadingSymbol.style.transform = 'translate(-50%, -50%)';
  loadingSymbol.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  loadingSymbol.style.color = 'white';
  loadingSymbol.style.padding = '10px';
  loadingSymbol.style.borderRadius = '5px';
  loadingSymbol.style.zIndex = '9999';
  document.body.appendChild(loadingSymbol);
}

function hideLoadingSymbol() {
  const loadingSymbol = document.getElementById('loading-symbol');
  if (loadingSymbol) {
    document.body.removeChild(loadingSymbol);
  }
}

function showErrorMessage(message) {
  const errorMessage = document.createElement('div');
  errorMessage.innerHTML = message;
  errorMessage.style.color = 'red';
  errorMessage.style.marginBottom = '10px';
  document.body.appendChild(errorMessage);

  const destroyButton = document.getElementById('destroy-button');
  const connectButton = document.getElementById('connect-button');
  if (destroyButton) destroyButton.style.display = 'inline-block';
  if (connectButton) connectButton.style.display = 'inline-block';
}


async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({ iceServers });
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);
  }

  await peerConnection.setRemoteDescription(offer);
  logger.debug('Set remote SDP');

  const sessionClientAnswer = await peerConnection.createAnswer();
  logger.debug('Created local SDP');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  logger.debug('Set local SDP');

  return sessionClientAnswer;
}

function onIceGatheringStateChange() {
  const { iceGathering: iceGatheringStatusLabel } = getStatusLabels();
  if (iceGatheringStatusLabel) {
    iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
    iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
  }
  logger.debug('ICE gathering state changed:', peerConnection.iceGatheringState);
}

function onIceCandidate(event) {
  if (event.candidate) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;
    logger.debug('New ICE candidate:', candidate);

    fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/ice`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate,
        sdpMid,
        sdpMLineIndex,
        session_id: sessionId,
      }),
    }).catch(error => {
      logger.error('Error sending ICE candidate:', error);
    });
  }
}

function onIceConnectionStateChange() {
  const { ice: iceStatusLabel } = getStatusLabels();
  if (iceStatusLabel) {
    iceStatusLabel.innerText = peerConnection.iceConnectionState;
    iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
  }
  logger.debug('ICE connection state changed:', peerConnection.iceConnectionState);

  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
    showErrorMessage('Connection lost. Please try again.');
  }
}

function onConnectionStateChange() {
  const { peer: peerStatusLabel } = getStatusLabels();
  if (peerStatusLabel) {
    peerStatusLabel.innerText = peerConnection.connectionState;
    peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
  }
  logger.debug('Peer connection state changed:', peerConnection.connectionState);
}

function onSignalingStateChange() {
  const { signaling: signalingStatusLabel } = getStatusLabels();
  if (signalingStatusLabel) {
    signalingStatusLabel.innerText = peerConnection.signalingState;
    signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
  }
  logger.debug('Signaling state changed:', peerConnection.signalingState);
}

function onVideoStatusChange(videoIsPlaying, stream) {
  const { idle: idleVideoElement, stream: streamVideoElement } = getVideoElements();
  let status;

  if (videoIsPlaying) {
    status = 'streaming';
    streamVideoElement.style.opacity = '1';
    idleVideoElement.style.opacity = '0';
    setStreamVideoElement(stream);
  } else {
    status = 'empty';
    streamVideoElement.style.opacity = '0';
    idleVideoElement.style.opacity = '1';
    playIdleVideo();
  }

  const { streaming: streamingStatusLabel } = getStatusLabels();
  if (streamingStatusLabel) {
    streamingStatusLabel.innerText = status;
    streamingStatusLabel.className = 'streamingState-' + status;
  }
  logger.debug('Video status changed:', status);
}


function setStreamVideoElement(stream) {
  const { stream: streamVideoElement } = getVideoElements();
  if (!streamVideoElement) {
    logger.error('Stream video element not found');
    return;
  }

  logger.debug('Setting stream video element');
  streamVideoElement.srcObject = stream;
  streamVideoElement.play().then(() => {
    logger.debug('Stream video playback started');
    smoothTransition();
  }).catch(e => logger.error('Error playing video:', e));
}



function onTrack(event) {
  logger.debug('onTrack event:', event);
  if (!event.track) return;

  if (statsIntervalId) {
    clearInterval(statsIntervalId);
  }

  statsIntervalId = setInterval(async () => {
    if (peerConnection && peerConnection.connectionState === 'connected') {
      try {
        const stats = await peerConnection.getStats(event.track);
        let videoStatsFound = false;
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            videoStatsFound = true;
            const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived;

            logger.debug('Video stats:', {
              bytesReceived: report.bytesReceived,
              lastBytesReceived,
              videoIsPlaying,
              videoStatusChanged
            });

            if (videoStatusChanged) {
              videoIsPlaying = report.bytesReceived > lastBytesReceived;
              logger.debug('Video status changed:', videoIsPlaying);
              onVideoStatusChange(videoIsPlaying, event.streams[0]);
            }
            lastBytesReceived = report.bytesReceived;
          }
        });
        if (!videoStatsFound) {
          logger.debug('No video stats found yet.');
        }
      } catch (error) {
        logger.error('Error getting stats:', error);
      }
    } else {
      logger.debug('Peer connection not ready for stats.');
    }
  }, 1000);

  setVideoElement(event.streams[0]);
}

function setVideoElement(stream) {
  const { stream: streamVideoElement } = getVideoElements();
  if (!streamVideoElement) {
    logger.error('Stream video element not found');
    return;
  }
  if (!stream) {
    logger.warn('No stream available to set video element');
    return;
  }
  streamVideoElement.classList.add("animated");
  streamVideoElement.srcObject = stream;
  streamVideoElement.loop = false;
  streamVideoElement.muted = false;

  setTimeout(() => {
    streamVideoElement.classList.remove("animated");
  }, 300);

  if (streamVideoElement.paused) {
    streamVideoElement.play().then(() => {
      logger.debug('Video playback started');
    }).catch(e => logger.error('Error playing video:', e));
  }
}

function playIdleVideo() {
  const { idle: idleVideoElement } = getVideoElements();
  if (!idleVideoElement) {
    logger.error('Idle video element not found');
    return;
  }
  idleVideoElement.classList.add("animated");
  idleVideoElement.src = avatars[currentAvatar].idleVideo;
  idleVideoElement.loop = true;

  setTimeout(() => {
    idleVideoElement.classList.remove("animated");
  }, 300);
}

function stopAllStreams() {
  if (streamVideoElement && streamVideoElement.srcObject) {
    logger.debug('Stopping video streams');
    streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    streamVideoElement.srcObject = null;
    
    smoothTransition();
  }
}

function closePC(pc = peerConnection) {
  if (!pc) return;
  logger.debug('Stopping peer connection');
  pc.close();
  pc.removeEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
  pc.removeEventListener('icecandidate', onIceCandidate, true);
  pc.removeEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
  pc.removeEventListener('connectionstatechange', onConnectionStateChange, true);
  pc.removeEventListener('signalingstatechange', onSignalingStateChange, true);
  pc.removeEventListener('track', onTrack, true);
  clearInterval(statsIntervalId);
  const labels = getStatusLabels();
  stopKeepAlive();
  if (labels.iceGathering) labels.iceGathering.innerText = '';
  if (labels.signaling) labels.signaling.innerText = '';
  if (labels.ice) labels.ice.innerText = '';
  if (labels.peer) labels.peer.innerText = '';
  logger.debug('Stopped peer connection');
  if (pc === peerConnection) {
    peerConnection = null;
  }
}

async function fetchWithRetries(url, options, retries = 1) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }
    return response;
  } catch (err) {
    if (retries <= maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 1000;
      logger.warn(`Request failed, retrying ${retries}/${maxRetryCount} in ${delay}ms. Error: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetries(url, options, retries + 1);
    } else {
      throw new Error(`Max retries exceeded. Error: ${err.message}`);
    }
  }
}

async function initializeConnection() {
  if (isInitializing) {
    logger.warn('Connection initialization already in progress. Skipping initialize.');
    return;
  }

  isInitializing = true;
  logger.info('Initializing connection...');

  try {
    stopAllStreams();
    closePC();

    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: avatars[currentAvatar].idleImage,
        driver_url: 'bank://lively/',
        stream_warmup: true,
        config: {
          stitch: true,
          fluent: true,
          pad_audio: 0.5,
        }
      }),
    });

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
    streamId = newStreamId;
    sessionId = newSessionId;
    logger.info('Stream created:', { streamId, sessionId });

    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
      logger.error('Error during streaming setup:', e);
      stopAllStreams();
      closePC();
      throw e;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answer: sessionClientAnswer,
        session_id: sessionId,
      }),
    });

    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }

    logger.info('Connection initialized successfully');
    startKeepAlive();
  } catch (error) {
    logger.error('Failed to initialize connection:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

function startKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  keepAliveInterval = setInterval(async () => {
    try {
      await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/keepalive`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
      logger.debug('Keep-alive sent successfully');
    } catch (error) {
      logger.warn('Error sending keep-alive:', error);
    }
  }, 100000);
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

async function startStreaming(assistantReply) {
  try {
    logger.debug('Starting streaming with reply:', assistantReply);
    const playResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script: {
          type: 'text',
          input: assistantReply,
          provider: {
            type: 'microsoft',
            voice_id: avatars[currentAvatar].voice
          }
        },
        config: {
          fluent: true,
          pad_audio: 0.5,
          stitch: true,
        },
        driver_url: 'bank://lively/',
        session_id: sessionId,
      }),
    });

    const playResponseData = await playResponse.json();
    logger.debug('Streaming response:', playResponseData);

    if (playResponseData.status === 'started') {
      logger.debug('Stream started successfully');
      
      // Get video elements
      const { idle: idleVideoElement, stream: streamVideoElement } = getVideoElements();
      
      // Ensure the stream video element is visible
      streamVideoElement.style.display = 'block';
      
      // Log the current state of video elements
      logger.debug('Idle video element:', idleVideoElement.src);
      logger.debug('Stream video element:', streamVideoElement.srcObject);
      
      // Set up event listeners for the stream video
      streamVideoElement.onloadedmetadata = () => {
        logger.debug('Stream video metadata loaded');
        smoothTransition(300);
        streamVideoElement.play().then(() => {
          logger.debug('Stream video playback started');
        }).catch(e => logger.error('Error playing stream video:', e));
      };
      
      streamVideoElement.oncanplay = () => {
        logger.debug('Stream video can play');
      };
      
      streamVideoElement.onerror = (e) => {
        logger.error('Error with stream video:', e);
      };
      
      // Calculate the duration of the audio
      const audioDuration = playResponseData.audio_duration * 1000;
      
      // Set a timeout to start speaking mode when the avatar finishes
      if (autoSpeakMode) {
        clearTimeout(speakTimeout);
        autoSpeakInProgress = true;
        const startButton = document.getElementById('start-button');
        startButton.textContent = 'Stop';
        
        speakTimeout = setTimeout(async () => {
          if (!isRecording) {
            try {
              await startRecording();
            } catch (error) {
              logger.error('Failed to auto-start recording:', error);
            }
          }
        }, audioDuration - 200);
      } else {
        // If auto-speak is off, change button text after audio finishes
        setTimeout(() => {
          const startButton = document.getElementById('start-button');
          startButton.textContent = 'Speak';
        }, audioDuration);
      }
    } else {
      logger.warn('Unexpected response status:', playResponseData.status);
    }
  } catch (error) {
    logger.error('Error during streaming:', error);
    if (isRecording) {
      await reinitializeConnection();
    }
  }
}

function startSendingAudioData() {
  logger.debug('Starting to send audio data...');

  let packetCount = 0;
  let totalBytesSent = 0;

  audioWorkletNode.port.onmessage = (event) => {
    const audioData = event.data;
    
    if (!(audioData instanceof ArrayBuffer)) {
      logger.warn('Received non-ArrayBuffer data from AudioWorklet:', typeof audioData);
      return;
    }

    if (deepgramConnection && deepgramConnection.getReadyState() === WebSocket.OPEN) {
      try {
        deepgramConnection.send(audioData);
        packetCount++;
        totalBytesSent += audioData.byteLength;
        
        if (packetCount % 100 === 0) {
          logger.debug(`Sent ${packetCount} audio packets to Deepgram. Total bytes: ${totalBytesSent}`);
        }
      } catch (error) {
        logger.error('Error sending audio data to Deepgram:', error);
      }
    } else {
      logger.warn('Deepgram connection not open, cannot send audio data. ReadyState:', deepgramConnection ? deepgramConnection.getReadyState() : 'undefined');
    }
  };

  logger.debug('Audio data sending setup complete');
}

function handleTranscription(data) {
  if (!isRecording) return;  // Ignore transcriptions if we're not recording
  
  const transcript = data.channel.alternatives[0].transcript;
  if (data.is_final) {
    logger.info('Final transcript:', transcript);
    if (transcript.trim()) {  // Only add non-empty transcripts
      currentUtterance += transcript + ' ';
      updateTranscript(currentUtterance.trim(), true);
      chatHistory.push({
        role: 'user',
        content: currentUtterance.trim(),
      });
      sendChatToGroq();
    }
    currentUtterance = '';
    interimMessageAdded = false;
  } else {
    logger.info('Interim transcript:', transcript);
    updateTranscript(currentUtterance + transcript, false);
  }
}

async function startRecording() {
  if (isRecording) {
    logger.warn('Recording is already in progress. Stopping current recording.');
    await stopRecording();
    return;
  }

  logger.info('Starting recording process...');
  
  // Reset states
  currentUtterance = '';
  interimMessageAdded = false;
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    logger.info('Microphone stream obtained');
    
    // Set up AudioContext and AudioWorklet for Deepgram
    audioContext = new AudioContext();
    logger.debug('Audio context created. Sample rate:', audioContext.sampleRate);
    
    await audioContext.audioWorklet.addModule('audio-processor.js');
    logger.debug('Audio worklet module added successfully');
    
    const source = audioContext.createMediaStreamSource(stream);
    logger.debug('Media stream source created');
    
    audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
    logger.debug('Audio worklet node created');
    
    source.connect(audioWorkletNode);
    logger.debug('Media stream source connected to audio worklet node');

    // Set up Deepgram connection
    deepgramConnection = deepgramClient.listen.live({
      model: "nova-2",
      language: "en-US",
      smart_format: true,
      interim_results: true,
      utterance_end_ms: 1000,
      punctuate: true,
      encoding: "linear16",
      sample_rate: audioContext.sampleRate,
    });

    logger.debug('Deepgram connection created with options:', {
      model: "nova-2",
      language: "en-US",
      smart_format: true,
      interim_results: true,
      utterance_end_ms: 1000,
      punctuate: true,
      encoding: "linear16",
      sample_rate: audioContext.sampleRate,
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Open, () => {
      logger.debug('Deepgram WebSocket Connection opened');
      startSendingAudioData();
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Close, () => {
      logger.debug('Deepgram WebSocket connection closed');
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Transcript, (data) => {
      logger.debug('Received transcription:', JSON.stringify(data));
      handleTranscription(data);
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.UtteranceEnd, (data) => {
      logger.debug('Utterance end event received:', data);
      handleUtteranceEnd(data);
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Error, (err) => {
      logger.error('Deepgram error:', err);
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Warning, (warning) => {
      logger.warn('Deepgram warning:', warning);
    });

    // Set recording state
    isRecording = true;
    const startButton = document.getElementById('start-button');
    startButton.textContent = 'Stop';

    logger.debug('Recording and transcription started successfully');
  } catch (error) {
    logger.error('Error starting recording:', error);
    isRecording = false;
    const startButton = document.getElementById('start-button');
    startButton.textContent = 'Speak';
    throw error;
  }
}


function handleUtteranceEnd(data) {
  if (!isRecording) return;  // Ignore utterance end if we're not recording
  
  logger.info('Utterance end detected:', data);
  if (currentUtterance.trim()) {
    updateTranscript(currentUtterance.trim(), true);
    chatHistory.push({
      role: 'user',
      content: currentUtterance.trim(),
    });
    sendChatToGroq();
    currentUtterance = '';
    interimMessageAdded = false;
  }
}

async function stopRecording() {
  if (isRecording) {
    logger.info('Stopping recording...');
    
    if (audioContext) {
      await audioContext.close();
      logger.info('AudioContext closed');
    }
    
    if (deepgramConnection) {
      deepgramConnection.finish();
      logger.info('Deepgram connection finished');
    }
    
    isRecording = false;
    autoSpeakInProgress = false;
    const startButton = document.getElementById('start-button');
    startButton.textContent = 'Speak';
    
    logger.info('Recording and transcription stopped');
  }
}


async function sendChatToGroq() {
  if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1].content.trim() === '') {
    logger.debug('No new content to send to Groq. Skipping request.');
    return;
  }

  logger.debug('Sending chat to Groq...');
  try {
    const startTime = Date.now();
    const requestBody = {
      messages: [
        {
          role: 'system',
          content: context,
        },
        ...chatHistory,
      ],
      model: 'mixtral-8x7b-32768',
    };
    logger.debug('Request body:', JSON.stringify(requestBody));

    const response = await fetch('/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    logger.debug('Groq response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const reader = response.body.getReader();
    let assistantReply = '';
    let done = false;

    const msgHistory = document.getElementById('msgHistory');
    const assistantSpan = document.createElement('span');
    assistantSpan.innerHTML = '<u>Assistant:</u> ';
    msgHistory.appendChild(assistantSpan);
    msgHistory.appendChild(document.createElement('br'));

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;

      if (value) {
        const chunk = new TextDecoder().decode(value);
        logger.debug('Received chunk:', chunk);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            if (data === '[DONE]') {
              done = true;
              break;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              assistantReply += content;
              assistantSpan.innerHTML += content;
              logger.debug('Parsed content:', content);
            } catch (error) {
              logger.error('Error parsing JSON:', error);
            }
          }
        }
        
        // Scroll to the bottom of the chat history
        msgHistory.scrollTop = msgHistory.scrollHeight;
      }
    }

    const endTime = Date.now();
    const processingTime = endTime - startTime;
    logger.debug(`Groq processing completed in ${processingTime}ms`);

    chatHistory.push({
      role: 'assistant',
      content: assistantReply,
    });

    logger.debug('Assistant reply:', assistantReply);

    await startStreaming(assistantReply);
  } catch (error) {
    logger.error('Error in sendChatToGroq:', error);
    const msgHistory = document.getElementById('msgHistory');
    msgHistory.innerHTML += `<span><u>Assistant:</u> I'm sorry, I encountered an error. Could you please try again?</span><br>`;
    msgHistory.scrollTop = msgHistory.scrollHeight;
  } finally {
    // Ensure the button is reset and recording is stopped
    await stopRecording();
    const startButton = document.getElementById('start-button');
    startButton.textContent = 'Speak';
    isRecording = false;
    autoSpeakInProgress = false;
  }
}


function toggleAutoSpeak() {
  autoSpeakMode = !autoSpeakMode;
  const toggleButton = document.getElementById('auto-speak-toggle');
  const startButton = document.getElementById('start-button');
  toggleButton.textContent = `Auto-Speak: ${autoSpeakMode ? 'On' : 'Off'}`;
  if (autoSpeakMode) {
    startButton.textContent = 'Stop';
  } else {
    startButton.textContent = isRecording ? 'Stop' : 'Speak';
  }
}

async function reinitializeConnection() {
  if (isInitializing) {
    logger.warn('Connection initialization already in progress. Skipping reinitialize.');
    return;
  }

  isInitializing = true;
  logger.debug('Reinitializing connection...');

  try {
    stopAllStreams();
    closePC();

    clearInterval(transcriptionTimer);
    clearTimeout(inactivityTimeout);

    transcript = '';
    chatHistory = chatHistory.slice(0, -1); // Remove the last incomplete transcription from the chat history

    const msgHistory = document.getElementById('msgHistory');
    msgHistory.innerHTML = msgHistory.innerHTML.slice(0, msgHistory.innerHTML.lastIndexOf('<span style=\'opacity:0.5\'><u>User:</u>'));

    if (peerConnection && peerConnection.connectionState === 'connected') {
      logger.debug('Existing connection is still active. Reusing connection.');
      await startRecording();
    } else {
      await initializeConnection();
      await startRecording();
    }
  } catch (error) {
    logger.error('Error during reinitialization:', error);
    showErrorMessage('Failed to reinitialize connection. Please try again.');
  } finally {
    isInitializing = false;
  }
}

const connectButton = document.getElementById('connect-button');
connectButton.onclick = initializeConnection;

const destroyButton = document.getElementById('destroy-button');
destroyButton.onclick = async () => {
  try {
    await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    logger.debug('Stream destroyed successfully');
  } catch (error) {
    logger.error('Error destroying stream:', error);
  } finally {
    stopAllStreams();
    closePC();
  }
};

const startButton = document.getElementById('start-button');

startButton.onclick = async () => {
  logger.info('Start button clicked. Current state:', isRecording ? 'Recording' : 'Not recording');
  if (!isRecording) {
    try {
      await startRecording();
    } catch (error) {
      logger.error('Failed to start recording:', error);
      showErrorMessage('Failed to start recording. Please try again.');
    }
  } else {
    await stopRecording();
  }
};






// Initialize WebSocket connection
initializeWebSocket();

// Initialize the connection when the page loads
initializeConnection().catch(error => {
  logger.error('Failed to initialize connection:', error);
  showErrorMessage('Failed to initialize connection. Please try again.');
  document.getElementById('auto-speak-toggle').addEventListener('click', toggleAutoSpeak);

});

export function setLogLevel(level) {
  logger.setLogLevel(level);
}
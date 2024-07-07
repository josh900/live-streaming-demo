'use strict';
import DID_API from './api.js';
import logger from './logger.js';
const { createClient, LiveTranscriptionEvents } = deepgram;

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
let inactivityTimeout;
let transcriptionTimer;
let keepAliveInterval;
let socket;
let isInitializing = false;
let audioContext;
let streamVideoElement;
let idleVideoElement;
let deepgramConnection;
let isRecording = false;
let audioWorkletNode;
let currentUtterance = '';
let interimMessageAdded = false;
let autoSpeakMode = true;
let speakTimeout;
let transitionCanvas;
let transitionCtx;
let transitionAnimationFrame;
let isDebugMode = false;

export function setLogLevel(level) {
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}

let avatars = {};
let currentAvatar = '';

const avatarSelect = document.getElementById('avatar-select');
avatarSelect.addEventListener('change', handleAvatarChange);

const maxRetryCount = 3;
const maxDelaySec = 4;

let context = `
You are a helpful, harmless, and honest grocery store assistant. Please answer the users questions briefly, be concise.
`;

function initializeTransitionCanvas() {
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

async function handleAvatarChange() {
  currentAvatar = avatarSelect.value;
  if (currentAvatar === 'create-new') {
    openAvatarModal();
    return;
  }

  const idleVideoElement = document.getElementById('idle-video-element');
  if (idleVideoElement) {
    idleVideoElement.src = avatars[currentAvatar].silentVideoUrl;
    try {
      await idleVideoElement.load();
      logger.debug(`Idle video loaded for ${currentAvatar}`);
    } catch (error) {
      logger.error(`Error loading idle video for ${currentAvatar}:`, error);
    }
  }

  const streamVideoElement = document.getElementById('stream-video-element');
  if (streamVideoElement) {
    streamVideoElement.srcObject = null;
  }

  await stopRecording();
  currentUtterance = '';
  interimMessageAdded = false;
  const msgHistory = document.getElementById('msgHistory');
  msgHistory.innerHTML = '';
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

      logger.debug('Stream destroyed successfully');
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

function smoothTransition(toStreaming, duration = 0) {
  const idleVideoElement = document.getElementById('idle-video-element');
  const streamVideoElement = document.getElementById('stream-video-element');

  if (!idleVideoElement || !streamVideoElement) {
    logger.warn('Video elements not found for transition');
    return;
  }

  logger.debug(`Starting smooth transition to ${toStreaming ? 'streaming' : 'idle'} state`);

  let startTime = null;

  function animate(currentTime) {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    transitionCtx.clearRect(0, 0, transitionCanvas.width, transitionCanvas.height);

    if (toStreaming) {
      transitionCtx.globalAlpha = 1;
      transitionCtx.drawImage(idleVideoElement, 0, 0, transitionCanvas.width, transitionCanvas.height);

      transitionCtx.globalAlpha = progress;
      transitionCtx.drawImage(streamVideoElement, 0, 0, transitionCanvas.width, transitionCanvas.height);
    } else {
      transitionCtx.globalAlpha = 1;
      transitionCtx.drawImage(streamVideoElement, 0, 0, transitionCanvas.width, transitionCanvas.height);

      transitionCtx.globalAlpha = progress;
      transitionCtx.drawImage(idleVideoElement, 0, 0, transitionCanvas.width, transitionCanvas.height);
    }

    if (progress < 1) {
      transitionAnimationFrame = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(transitionAnimationFrame);
      transitionCtx.clearRect(0, 0, transitionCanvas.width, transitionCanvas.height);
      if (toStreaming) {
        streamVideoElement.style.opacity = '1';
        idleVideoElement.style.opacity = '0';
      } else {
        streamVideoElement.style.opacity = '0';
        idleVideoElement.style.opacity = '1';
      }
      logger.debug('Smooth transition completed');
    }
  }

  cancelAnimationFrame(transitionAnimationFrame);
  transitionAnimationFrame = requestAnimationFrame(animate);
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
    logger.debug('Final transcript added to chat history:', text);
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
  msgHistory.scrollTop = msgHistory.scrollHeight;
}

function handleTextInput(text) {
  if (text.trim() === '') return;

  const textInput = document.getElementById('text-input');
  textInput.value = '';

  updateTranscript(text, true);

  chatHistory.push({
    role: 'user',
    content: text,
  });

  sendChatToGroq();
}

function updateAssistantReply(text) {
  document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${text}</span><br>`;
}

async function initialize() {
  setLogLevel('DEBUG');

  const { idle, stream } = getVideoElements();
  idleVideoElement = idle;
  streamVideoElement = stream;

  if (idleVideoElement) idleVideoElement.setAttribute('playsinline', '');
  if (streamVideoElement) streamVideoElement.setAttribute('playsinline', '');

  initializeTransitionCanvas();

  await loadAvatars();
  populateAvatarSelect();

  const contextInput = document.getElementById('context-input');
  contextInput.value = context.trim();
  contextInput.addEventListener('input', () => {
    if (!contextInput.value.includes('Original Context:')) {
      context = contextInput.value.trim();
    }
  });

  const sendTextButton = document.getElementById('send-text-button');
  const textInput = document.getElementById('text-input');
  const replaceContextButton = document.getElementById('replace-context-button');
  const autoSpeakToggle = document.getElementById('auto-speak-toggle');
  const editAvatarButton = document.getElementById('edit-avatar-button');

  sendTextButton.addEventListener('click', () => handleTextInput(textInput.value));
  textInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') handleTextInput(textInput.value);
  });
  replaceContextButton.addEventListener('click', () => updateContext('replace'));
  autoSpeakToggle.addEventListener('click', toggleAutoSpeak);
  editAvatarButton.addEventListener('click', () => openAvatarModal(currentAvatar));

  initializeWebSocket();
  playIdleVideo();

  showLoadingSymbol();
  try {
    await initializeConnection();
    startKeepAlive();
    hideLoadingSymbol();
  } catch (error) {
    logger.error('Error during initialization:', error);
    hideLoadingSymbol();
    showErrorMessage('Failed to connect. Please try again.');
  }
}

async function loadAvatars() {
  try {
    const response = await fetch('/avatars');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    avatars = await response.json();
    logger.debug('Avatars loaded:', avatars);
  } catch (error) {
    logger.error('Error loading avatars:', error);
    showErrorMessage('Failed to load avatars. Please try again.');
  }
}

function populateAvatarSelect() {
  const avatarSelect = document.getElementById('avatar-select');
  avatarSelect.innerHTML = '';
  
  const createNewOption = document.createElement('option');
  createNewOption.value = 'create-new';
  createNewOption.textContent = 'Create New Avatar';
  avatarSelect.appendChild(createNewOption);

  for (const [key, value] of Object.entries(avatars)) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = value.name;
    avatarSelect.appendChild(option);
  }

  if (Object.keys(avatars).length > 0) {
    currentAvatar = Object.keys(avatars)[0];
    avatarSelect.value = currentAvatar;
  }
}

function openAvatarModal(avatarName = null) {
  const modal = document.getElementById('avatar-modal');
  const nameInput = document.getElementById('avatar-name');
  const voiceInput = document.getElementById('avatar-voice');
  const imagePreview = document.getElementById('avatar-image-preview');
  const saveButton = document.getElementById('save-avatar-button');

  if (avatarName && avatars[avatarName]) {
    nameInput.value = avatars[avatarName].name;
    voiceInput.value = avatars[avatarName].voiceId;
    imagePreview.src = avatars[avatarName].imageUrl;
    saveButton.textContent = 'Update Avatar';
  } else {
    nameInput.value = '';
    voiceInput.value = '';
    imagePreview.src = '';
    saveButton.textContent = 'Create Avatar';
  }

  modal.style.display = 'block';
}

function closeAvatarModal() {
  document.getElementById('avatar-modal').style.display = 'none';
}

async function saveAvatar() {
  const name = document.getElementById('avatar-name').value;
  const voiceId = document.getElementById('avatar-voice').value;
  const imageFile = document.getElementById('avatar-image').files[0];

  if (!name || !voiceId || !imageFile) {
    showErrorMessage('Please fill all fields and select an image.');
    return;
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('voiceId', voiceId);
  formData.append('image', imageFile);

  try {
    const response = await fetch('/avatar', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const avatar = await response.json();
    avatars[name] = avatar;
    populateAvatarSelect();
    closeAvatarModal();
    showToast('Avatar saved successfully');
  } catch (error) {
    logger.error('Error saving avatar:', error);
    showErrorMessage('Failed to save avatar. Please try again.');
  }
}

function updateContext(action) {
  const contextInput = document.getElementById('context-input');
  const newContext = contextInput.value.trim();

  if (newContext) {
    const originalContext = context;
    if (action === 'append') {
      context += '\n' + newContext;
    } else if (action === 'replace') {
      context = newContext;
    }
    logger.info('Context updated:', context);
    showToast('Context saved successfully');

    displayBothContexts(originalContext, context);
  } else {
    showToast('Please enter some text before updating the context');
  }
}

function displayBothContexts(original, updated) {
  const contextInput = document.getElementById('context-input');
  contextInput.value = `Original Context:\n${original}\n\nNew Context:\n${updated}`;

  setTimeout(() => {
    contextInput.value = updated;
  }, 3000);
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
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
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
    setStreamVideoElement(stream);
    smoothTransition(true);  // Transition to streaming state
  } else {
    status = 'empty';
    smoothTransition(false);  // Transition to idle state
  }

  const { streaming: streamingStatusLabel } = getStatusLabels();
  if (streamingStatusLabel) {
    streamingStatusLabel.innerText = status;
    streamingStatusLabel.className = 'streamingState-' + status;
  }
  logger.debug('Video status changed:', status);
}

function setStreamVideoElement(stream) {
  const streamVideoElement = document.getElementById('stream-video-element');
  if (!streamVideoElement) {
    logger.error('Stream video element not found');
    return;
  }

  logger.debug('Setting stream video element');
  streamVideoElement.srcObject = stream;
  streamVideoElement.style.opacity = '0';

  streamVideoElement.onloadedmetadata = () => {
    logger.debug('Stream video metadata loaded');
    streamVideoElement.play().catch(e => logger.error('Error playing stream video:', e));

    if (isDebugMode) {
      downloadStreamVideo(stream);
    }
  };
}

function downloadStreamVideo(stream) {
  logger.debug('Starting video download in debug mode');

  const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  const chunks = [];

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = url;
    a.download = `talking-video-${new Date().toISOString()}.webm`;
    a.click();
    window.URL.revokeObjectURL(url);
    logger.debug('Video download completed');
  };

  mediaRecorder.start();

  // Stop recording after 20 seconds (adjust as needed)
  setTimeout(() => {
    mediaRecorder.stop();
  }, 20000);
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

  setStreamVideoElement(event.streams[0]);
}

function playIdleVideo() {
  const { idle: idleVideoElement } = getVideoElements();
  if (!idleVideoElement) {
    logger.error('Idle video element not found');
    return;
  }

  if (!currentAvatar || !avatars[currentAvatar]) {
    logger.warn(`No avatar selected or avatar ${currentAvatar} not found. Using default idle video.`);
    idleVideoElement.src = 'path/to/default/idle/video.mp4'; // Replace with your default video path
  } else {
    idleVideoElement.src = avatars[currentAvatar].silentVideoUrl;
  }

  idleVideoElement.loop = true;

  idleVideoElement.onloadeddata = () => {
    logger.debug(`Idle video loaded successfully for ${currentAvatar || 'default'}`);
  };

  idleVideoElement.onerror = (e) => {
    logger.error(`Error loading idle video for ${currentAvatar || 'default'}:`, e);
  };

  idleVideoElement.play().catch(e => logger.error('Error playing idle video:', e));
}

function stopAllStreams() {
  if (streamVideoElement && streamVideoElement.srcObject) {
    logger.debug('Stopping video streams');
    streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    streamVideoElement.srcObject = null;
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

    if (!currentAvatar || !avatars[currentAvatar]) {
      throw new Error('No avatar selected or avatar not found');
    }

    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: avatars[currentAvatar].imageUrl,
        driver_url: "bank://lively/driver-06",
        config: {
          stitch: true,
          fluent: true,
          pad_audio: 0,
          driver_expressions: {
            expressions: [
              {
                start_frame: 0,
                expression: "neutral",
                intensity: 0
              }
            ],
            transition_frames: 0
          },
          align_driver: true,
          align_expand_factor: 0,
          auto_match: true,
          motion_factor: 0,
          normalization_factor: 0,
          sharpen: true,
          result_format: "mp4"
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
  }, 30000);
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
    if (!streamId || !sessionId) {
      logger.error('Stream ID or Session ID is missing. Cannot start streaming.');
      return;
    }

    if (!currentAvatar || !avatars[currentAvatar]) {
      logger.error('No avatar selected or avatar not found. Cannot start streaming.');
      return;
    }

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
            voice_id: avatars[currentAvatar].voiceId,
            voice_config: {
              rate: 'medium'
            }
          },
          ssml: false,
        },
        config: {
          stitch: true,
          fluent: true,
          pad_audio: 0,
          driver_expressions: {
            expressions: [
              {
                start_frame: 0,
                expression: "neutral",
                intensity: 0
              }
            ],
            transition_frames: 0
          },
          align_driver: true,
          align_expand_factor: 0,
          auto_match: true,
          motion_factor: 0.7,  // Increased from 0 to 0.7
          normalization_factor: 0,
          sharpen: true,
          result_format: "mp4"
        },
        driver_url: "bank://lively/driver-06",
        session_id: sessionId,
      }),
    });

    if (!playResponse.ok) {
      throw new Error(`HTTP error! status: ${playResponse.status}`);
    }

    const playResponseData = await playResponse.json();
    logger.debug('Streaming response:', playResponseData);

    if (playResponseData.status === 'started') {
      logger.debug('Stream started successfully');

      const { idle: idleVideoElement, stream: streamVideoElement } = getVideoElements();

      if (!streamVideoElement) {
        logger.error('Stream video element not found');
        return;
      }

      streamVideoElement.style.display = 'block';

      logger.debug('Idle video element:', idleVideoElement.src);
      logger.debug('Stream video element:', streamVideoElement.srcObject);

      streamVideoElement.onloadedmetadata = () => {
        logger.debug('Stream video metadata loaded');
        streamVideoElement.play().then(() => {
          logger.debug('Stream video playback started');
          smoothTransition(true);
        }).catch(e => logger.error('Error playing stream video:', e));
      };

      streamVideoElement.oncanplay = () => {
        logger.debug('Stream video can play');
      };

      streamVideoElement.onerror = (e) => {
        logger.error('Error with stream video:', e);
      };

      const audioDuration = playResponseData.audio_duration * 1000;

      if (autoSpeakMode) {
        clearTimeout(speakTimeout);
        autoSpeakInProgress = true;
        const startButton = document.getElementById('start-button');
        if (startButton) startButton.textContent = 'Stop';

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
        setTimeout(() => {
          const startButton = document.getElementById('start-button');
          if (startButton) startButton.textContent = 'Speak';
        }, audioDuration);
      }

      // Wait for the audio to finish playing before transitioning back to idle
      setTimeout(() => {
        smoothTransition(false);
      }, audioDuration);

    } else {
      logger.warn('Unexpected response status:', playResponseData.status);
    }
  } catch (error) {
    logger.error('Error during streaming:', error);
    if (error.message.includes('HTTP error! status: 404')) {
      logger.warn('Stream not found. Attempting to reinitialize connection.');
      await reinitializeConnection();
    } else if (isRecording) {
      logger.warn('Error occurred while recording. Attempting to reinitialize connection.');
      await reinitializeConnection();
    }
  } finally {
    // Ensure we always transition back to idle state if something goes wrong
    setTimeout(() => {
    }, 1000);
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

function handleTranscription(transcription) {
  if (!isRecording) return;

  if (transcription.type === 'Results') {
    const transcript = transcription.channel.alternatives[0].transcript;
    const isFinal = transcription.is_final;
    const speechFinal = transcription.speech_final;

    logger.debug('Received transcription:', { transcript, isFinal, speechFinal });

    if (transcript.trim()) {
      if (isFinal || speechFinal) {
        currentUtterance += transcript + ' ';
        updateTranscript(currentUtterance.trim(), true);
        
        if (speechFinal) {
          chatHistory.push({
            role: 'user',
            content: currentUtterance.trim(),
          });
          sendChatToGroq();
          currentUtterance = '';
        }
      } else {
        updateTranscript(currentUtterance + transcript, false);
      }
    }
  }
}

async function startRecording() {
  if (isRecording) {
    logger.warn('Recording is already in progress. Stopping current recording.');
    await stopRecording();
    return;
  }

  logger.debug('Starting recording process...');

  currentUtterance = '';
  interimMessageAdded = false;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    logger.info('Microphone stream obtained');

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

    const deepgramOptions = {
      language: "en-US",
      model: "nova-2",
      encoding: "linear16",
      sampleRate: audioContext.sampleRate,
      interim_results: true,
      punctuate: true,
      smart_format: true,
      utterance_end_ms: "1000",
      endpointing: "500",
      vad_events: true
    };

    logger.debug('Creating Deepgram connection with options:', deepgramOptions);

    deepgramConnection = deepgramClient.listen.live(deepgramOptions);

    deepgramConnection.addListener('open', () => {
      logger.debug('Deepgram WebSocket Connection opened');
      startSendingAudioData();
    });

    deepgramConnection.addListener('close', () => {
      logger.debug('Deepgram WebSocket connection closed');
    });

    deepgramConnection.addListener('transcriptReceived', (message) => {
      if (message.type === 'Results' || message.type === 'Metadata') {
        handleTranscription(message);
      } else if (message.type === 'UtteranceEnd') {
        handleUtteranceEnd(message);
      }
    });

    deepgramConnection.addListener('error', (err) => {
      logger.error('Deepgram error:', err);
    });

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

function handleDeepgramError(err) {
  logger.error('Deepgram error:', err);
  isRecording = false;
  const startButton = document.getElementById('start-button');
  startButton.textContent = 'Speak';
  
  // Attempt to close the connection and clean up
  if (deepgramConnection) {
    try {
      deepgramConnection.finish();
    } catch (closeError) {
      logger.warn('Error while closing Deepgram connection:', closeError);
    }
  }

  if (audioContext) {
    audioContext.close().catch(closeError => {
      logger.warn('Error while closing AudioContext:', closeError);
    });
  }
}


function handleUtteranceEnd(utteranceEnd) {
  logger.debug('Utterance end detected:', utteranceEnd);
  if (currentUtterance.trim()) {
    updateTranscript(currentUtterance.trim(), true);
    chatHistory.push({
      role: 'user',
      content: currentUtterance.trim(),
    });
    sendChatToGroq();
    currentUtterance = '';
  }
}

async function stopRecording() {
  if (isRecording) {
    logger.info('Stopping recording...');

    if (audioContext) {
      await audioContext.close();
      logger.debug('AudioContext closed');
    }

    if (deepgramConnection) {
      deepgramConnection.finish();
      logger.debug('Deepgram connection finished');
    }

    isRecording = false;
    autoSpeakInProgress = false;
    const startButton = document.getElementById('start-button');
    startButton.textContent = 'Speak';

    logger.debug('Recording and transcription stopped');
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
    const currentContext = document.getElementById('context-input').value.trim();
    const requestBody = {
      messages: [
        {
          role: 'system',
          content: currentContext || context,
        },
        ...chatHistory,
      ],
      model: 'llama3-8b-8192',
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
    chatHistory = chatHistory.slice(0, -1);

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

const saveAvatarButton = document.getElementById('save-avatar-button');
saveAvatarButton.onclick = saveAvatar;

const avatarImageInput = document.getElementById('avatar-image');
avatarImageInput.onchange = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('avatar-image-preview').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Export functions and variables that need to be accessed from other modules
export {
  
  initialize,
  handleAvatarChange,
  openAvatarModal,
  closeAvatarModal,
  saveAvatar,
  updateContext,
  handleTextInput,
  toggleAutoSpeak
};
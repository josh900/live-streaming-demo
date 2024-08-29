'use strict';
import DID_API from './api.js';
import logger from './logger.js';

const { createClient, LiveTranscriptionEvents } = deepgram;

function getUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    avatarId: urlParams.get('avatar'),
    contextId: urlParams.get('context'),
    interfaceMode: urlParams.get('interfaceMode'),
    header: urlParams.get('header') !== 'false' // true by default, false only if explicitly set to 'false'
  };
}


const deepgramClient = createClient(DID_API.deepgramKey);

const RTCPeerConnection = (
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
).bind(window);

let peerConnection;
let pcDataChannel;
let streamId;
let sessionId;
let sessionClientAnswer;
let statsIntervalId;
let videoIsPlaying;
let lastBytesReceived;
let chatHistory = [];
let inactivityTimeout;
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
let transitionCanvas;
let transitionCtx;
let isDebugMode = false;
let isTransitioning = false;
let lastVideoStatus = null;
let isCurrentlyStreaming = false;
let reconnectAttempts = 10;
let persistentStreamId = null;
let persistentSessionId = null;
let isPersistentStreamActive = false;
const API_RATE_LIMIT = 40; // Maximum number of calls per minute
const API_CALL_INTERVAL = 30000 / API_RATE_LIMIT; // Minimum time between API calls in milliseconds
let lastApiCallTime = 0;
const maxRetryCount = 10;
const maxDelaySec = 100;
const RECONNECTION_INTERVAL = 100000; // 25 seconds for testing, adjust as needed
let isAvatarSpeaking = false;
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 2000; // 1 second
const MAX_RECONNECT_DELAY = 90000; // 30 seconds
let autoSpeakInProgress = false;
let isPushToTalkEnabled = false;
let isPushToTalkActive = false;
let pushToTalkStartTime = 0;
const MIN_PUSH_TO_TALK_DURATION = 600; // 1 second in milliseconds
let pushToTalkTimer = null;
let contexts = [];
let currentContextId = '';
let currentAvatarId = '';
let isInitializingStream = false;
let currentInterfaceMode = null;




const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
};

let lastConnectionTime = Date.now();

let connectionState = ConnectionState.DISCONNECTED;

export function setLogLevel(level) {
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}


async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
    logger.error('Error loading contexts:', error);
    showErrorMessage('Failed to load contexts. Please try again.');
  }
}

function getCurrentContext() {
  return contexts.find(c => c.id === currentContextId)?.context || '';
}

function populateContextSelect() {
  const contextSelect = document.getElementById('context-select');
  contextSelect.innerHTML = '';

  const createNewOption = document.createElement('option');
  createNewOption.value = 'create-new';
  createNewOption.textContent = 'Create New Context';
  contextSelect.appendChild(createNewOption);

  for (const context of contexts) {
    const option = document.createElement('option');
    option.value = context.id;
    option.textContent = context.name;
    contextSelect.appendChild(option);
  }

  if (contexts.length > 0) {
    contextSelect.value = currentContextId;
  }
}

function handleIncomingMessage(event) {

  const { action, text } = event.data;

  if (action === 'speak') {
    // Trigger the avatar to speak the received text
    speakDirectly(text);
  }
}



window.addEventListener('message', handleIncomingMessage, false);

function notifyParentWindowReady() {
  // In a production environment, you should specify the exact origin of the parent window.
  window.parent.postMessage({ action: 'avatarReady' }, '*');
}



function handleContextChange() {
  currentContextId = document.getElementById('context-select').value;
  if (currentContextId === 'create-new') {
    openContextModal();
  } else {
    updateContextDisplay();

    // Update URL with new context ID
    const url = new URL(window.location);
    url.searchParams.set('context', currentContextId);
    window.history.pushState({}, '', url);
  }
}


function updateContextDisplay() {
  const contextInput = document.getElementById('context-input');
  contextInput.value = getCurrentContext();
}

function openContextModal(contextId = null) {
  const modal = document.getElementById('context-modal');
  const nameInput = document.getElementById('context-name');
  const contentInput = document.getElementById('context-content');
  const saveButton = document.getElementById('save-context-button');

  if (contextId && contexts.find(c => c.id === contextId)) {
    const context = contexts.find(c => c.id === contextId);
    nameInput.value = context.name;
    contentInput.value = context.context;
    saveButton.textContent = 'Update Context';
    saveButton.onclick = () => saveContext(contextId);
  } else {
    nameInput.value = '';
    contentInput.value = '';
    saveButton.textContent = 'Create Context';
    saveButton.onclick = () => saveContext();
  }

  modal.style.display = 'block';
}

function closeContextModal() {
  const modal = document.getElementById('context-modal');
  modal.style.display = 'none';
}

async function saveContext(contextId = null) {
  const name = document.getElementById('context-name').value;
  const content = document.getElementById('context-content').value;

  if (!name || !content) {
    showErrorMessage('Please fill in both the context name and content.');
    return;
  }

  const contextData = {
    name,
    context: content
  };

  if (contextId) {
    contextData.id = contextId;
  }

  try {
    const response = await fetch('/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contextData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const savedContext = await response.json();

    if (contextId) {
      const index = contexts.findIndex(c => c.id === contextId);
      if (index !== -1) {
        contexts[index] = savedContext;
      }
    } else {
      contexts.push(savedContext);
    }

    populateContextSelect();
    currentContextId = savedContext.id;
    updateContextDisplay();
    closeContextModal();
    showToast('Context saved successfully!');
  } catch (error) {
    logger.error('Error saving context:', error);
    showErrorMessage('Failed to save context. Please try again.');
  }
}



let avatars = {};
let currentAvatar = '';

const avatarSelect = document.getElementById('avatar-select');
avatarSelect.addEventListener('change', handleAvatarChange);

let context = ``;

async function prepareForStreaming() {
  if (!streamId || !sessionId) {
    throw new Error('Stream ID or Session ID is missing. Cannot prepare for streaming.');
  }

  const streamVideoElement = document.getElementById('stream-video-element');
  const idleVideoElement = document.getElementById('idle-video-element');

  if (!streamVideoElement || !idleVideoElement) {
    throw new Error('Video elements not found');
  }

  // Reset video elements
  streamVideoElement.srcObject = null;
  streamVideoElement.src = '';
  streamVideoElement.style.display = 'none';

  idleVideoElement.style.display = 'block';
  idleVideoElement.play().catch((e) => logger.error('Error playing idle video:', e));

  logger.debug('Prepared for streaming');
}

function initializeTransitionCanvas() {
  const videoWrapper = document.querySelector('#video-wrapper');
  const rect = videoWrapper.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height, 550);

  transitionCanvas = document.createElement('canvas');
  transitionCanvas.width = size;
  transitionCanvas.height = size;
  transitionCtx = transitionCanvas.getContext('2d');

  Object.assign(transitionCanvas.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    maxWidth: '550px',
    maxHeight: '550px',
    zIndex: '3',
    borderRadius: '13%',
    objectFit: 'cover',
  });

  videoWrapper.appendChild(transitionCanvas);

  window.addEventListener('resize', () => {
    const videoWrapper = document.querySelector('#video-wrapper');
    const rect = videoWrapper.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height, 550);

    transitionCanvas.width = size;
    transitionCanvas.height = size;
  });
}

function smoothTransition(toStreaming, duration = 250) {
  const idleVideoElement = document.getElementById('idle-video-element');
  const streamVideoElement = document.getElementById('stream-video-element');

  if (!idleVideoElement || !streamVideoElement) {
    logger.warn('Video elements not found for transition');
    return;
  }

  if (isTransitioning) {
    logger.debug('Transition already in progress, skipping');
    return;
  }

  // Don't transition if we're already in the desired state
  if ((toStreaming && isCurrentlyStreaming) || (!toStreaming && !isCurrentlyStreaming)) {
    logger.debug('Already in desired state, skipping transition');
    return;
  }

  isTransitioning = true;
  logger.debug(`Starting smooth transition to ${toStreaming ? 'streaming' : 'idle'} state`);

  let startTime = null;

  function animate(currentTime) {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    transitionCtx.clearRect(0, 0, transitionCanvas.width, transitionCanvas.height);

    // Draw the fading out video
    transitionCtx.globalAlpha = 1 - progress;
    transitionCtx.drawImage(
      toStreaming ? idleVideoElement : streamVideoElement,
      0,
      0,
      transitionCanvas.width,
      transitionCanvas.height,
    );

    // Draw the fading in video
    transitionCtx.globalAlpha = progress;
    transitionCtx.drawImage(
      toStreaming ? streamVideoElement : idleVideoElement,
      0,
      0,
      transitionCanvas.width,
      transitionCanvas.height,
    );

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Ensure final state is set correctly
      if (toStreaming) {
        streamVideoElement.style.display = 'block';
        idleVideoElement.style.display = 'none';
      } else {
        streamVideoElement.style.display = 'none';
        idleVideoElement.style.display = 'block';
      }
      isTransitioning = false;
      isCurrentlyStreaming = toStreaming;
      transitionCanvas.style.display = 'none';
      logger.debug('Smooth transition completed');
    }
  }

  // Show the transition canvas
  transitionCanvas.style.display = 'block';

  // Start the animation
  requestAnimationFrame(animate);
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
    streaming: document.getElementById('streaming-status-label'),
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
    setTimeout(initializeWebSocket, 10000);
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

async function speakDirectly(text) {
  if (!text.trim()) {
    console.warn('Received empty text for direct speech');
    return;
  }

  try {
    // Update the chat history UI
    const msgHistory = document.getElementById('msgHistory');
    msgHistory.innerHTML += `<span><u>Assistant:</u> ${text}</span><br>`;
    msgHistory.scrollTop = msgHistory.scrollHeight;

    // Trigger the avatar to speak
    await startStreaming(text);
  } catch (error) {
    console.error('Error in direct speech:', error);
  }
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

async function initializePersistentStream() {
  if (isInitializingStream) {
    logger.warn('Stream initialization already in progress. Skipping.');
    return;
  }

  if (isPersistentStreamActive) {
    logger.warn('Persistent stream is already active. Skipping initialization.');
    return;
  }

  isInitializingStream = true;
  logger.info('Initializing persistent stream...');
  connectionState = ConnectionState.CONNECTING;

  try {
    const currentAvatar = avatars.find(avatar => avatar.id === currentAvatarId);
    if (!currentAvatar) {
      throw new Error('No avatar selected or avatar not found');
    }

    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: currentAvatar.imageUrl,
        driver_url: 'bank://lively/driver-06',
        output_resolution: 512,
        stream_warmup: true,
        config: {
          stitch: true,
          fluent: true,
          auto_match: true,
          pad_audio: 0.5,
          normalization_factor: 0.1,
          align_driver: true,
          motion_factor: 0.55,
          align_expand_factor: 0.3,
          driver_expressions: {
            expressions: [
              {
                start_frame: 0,
                expression: 'neutral',
                intensity: 0.5,
              },
            ],
          },
        },
      }),
    });

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();

    persistentStreamId = newStreamId;
    persistentSessionId = newSessionId;

    logger.info('Persistent stream created:', { persistentStreamId, persistentSessionId });

    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
      logger.error('Error during streaming setup:', e);
      stopAllStreams();
      closePC();
      throw e;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}/sdp`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answer: sessionClientAnswer,
        session_id: persistentSessionId,
      }),
    });

    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }
    isPersistentStreamActive = true;
    startKeepAlive();
    lastConnectionTime = Date.now();
    logger.info('Persistent stream initialized successfully');
    connectionState = ConnectionState.CONNECTED;
  } catch (error) {
    logger.error('Failed to initialize persistent stream:', error);
    isPersistentStreamActive = false;
    persistentStreamId = null;
    persistentSessionId = null;
    connectionState = ConnectionState.DISCONNECTED;
    throw error;
  } finally {
    isInitializingStream = false;
  }
}


function shouldReconnect() {
  const timeSinceLastConnection = Date.now() - lastConnectionTime;
  return timeSinceLastConnection > RECONNECTION_INTERVAL * 0.9;
}

function scheduleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    logger.error('Max reconnection attempts reached. Please refresh the page.');
    showErrorMessage('Failed to reconnect after multiple attempts. Please refresh the page.');
    return;
  }

  const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  logger.debug(`Scheduling reconnection attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
  setTimeout(backgroundReconnect, delay);
  reconnectAttempts++;
}

function startKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }

  keepAliveInterval = setInterval(() => {
    if (isPersistentStreamActive && peerConnection && peerConnection.connectionState === 'connected' && pcDataChannel) {
      try {
        const keepAliveMessage = JSON.stringify({ type: 'KeepAlive' });
        if (pcDataChannel.readyState === 'open') {
          pcDataChannel.send(keepAliveMessage);
          logger.debug('Keepalive message sent successfully');
        } else {
          logger.warn('Data channel is not open. Current state:', pcDataChannel.readyState);
        }
      } catch (error) {
        logger.warn('Error sending keepalive message:', error);
      }
    } else {
      logger.debug(
        'Conditions not met for sending keepalive. isPersistentStreamActive:',
        isPersistentStreamActive,
        'peerConnection state:',
        peerConnection ? peerConnection.connectionState : 'null',
        'pcDataChannel:',
        pcDataChannel ? 'exists' : 'null',
      );
    }
  }, 30000); // Send keepalive every 30 seconds
}

async function destroyPersistentStream() {
  if (persistentStreamId) {
    try {
      await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: persistentSessionId }),
      });

      logger.debug('Persistent stream destroyed successfully');
    } catch (error) {
      logger.error('Error destroying persistent stream:', error);
    } finally {
      stopAllStreams();
      closePC();
      persistentStreamId = null;
      persistentSessionId = null;
      isPersistentStreamActive = false;
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
      connectionState = ConnectionState.DISCONNECTED;
    }
  }
}


async function reinitializePersistentStream() {
  logger.info('Reinitializing persistent stream...');
  await destroyPersistentStream();
  await initializePersistentStream();
}

async function createNewPersistentStream() {
  logger.debug('Creating new persistent stream...');

  try {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: avatars[currentAvatar].imageUrl,
        driver_url: 'bank://lively/driver-06',
        output_resolution: 512,
        stream_warmup: true,
        config: {
          stitch: true,
          fluent: true,
          auto_match: true,
          pad_audio: 0.5,
          normalization_factor: 0.1,
          align_driver: true,
          motion_factor: 0.55,
          align_expand_factor: 0.3,
          driver_expressions: {
            expressions: [
              {
                start_frame: 0,
                expression: 'neutral',
                intensity: 0.5,
              },
            ],
          },
        },
      }),
    });

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();

    logger.debug('New stream created:', { newStreamId, newSessionId });

    const newSessionClientAnswer = await createPeerConnection(offer, iceServers);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${newStreamId}/sdp`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answer: newSessionClientAnswer,
        session_id: newSessionId,
      }),
    });

    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }

    return { streamId: newStreamId, sessionId: newSessionId };
  } catch (error) {
    logger.error('Error creating new persistent stream:', error);
    return null;
  }
}

async function backgroundReconnect() {
  if (connectionState === ConnectionState.RECONNECTING) {
    logger.debug('Background reconnection already in progress. Skipping.');
    return;
  }

  connectionState = ConnectionState.RECONNECTING;
  logger.debug('Starting background reconnection process...');

  try {
    await destroyPersistentStream();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await initializePersistentStream();
    lastConnectionTime = Date.now();
    logger.info('Background reconnection completed successfully');
    connectionState = ConnectionState.CONNECTED;
    reconnectAttempts = 0;
  } catch (error) {
    logger.error('Error during background reconnection:', error);
    connectionState = ConnectionState.DISCONNECTED;
    scheduleReconnect();
  }
}

function waitForIdleState() {
  return new Promise((resolve) => {
    const checkIdleState = () => {
      if (!isAvatarSpeaking) {
        resolve();
      } else {
        setTimeout(checkIdleState, 500); // Check every 500ms
      }
    };
    checkIdleState();
  });
}

async function switchToNewStream(newStreamData) {
  logger.debug('Switching to new stream...');

  try {
    connectionState = ConnectionState.RECONNECTING;

    // Quickly switch the video source to the new stream
    if (streamVideoElement) {
      // Instead of directly setting src, we need to update the WebRTC connection
      await updateWebRTCConnection(newStreamData);
    }

    // Update global variables
    persistentStreamId = newStreamData.streamId;
    persistentSessionId = newStreamData.sessionId;

    // Clean up the old stream
    await cleanupOldStream();

    connectionState = ConnectionState.CONNECTED;
    logger.debug('Successfully switched to new stream');
  } catch (error) {
    logger.error('Error switching to new stream:', error);
    connectionState = ConnectionState.DISCONNECTED;
    throw error;
  }
}

async function updateWebRTCConnection(newStreamData) {
  logger.debug('Updating WebRTC connection...');

  try {
    const offer = await fetchStreamOffer(newStreamData.streamId);
    const iceServers = await fetchIceServers();

    const newSessionClientAnswer = await createPeerConnection(offer, iceServers);

    await sendSDPAnswer(newStreamData.streamId, newStreamData.sessionId, newSessionClientAnswer);

    logger.debug('WebRTC connection updated successfully');
  } catch (error) {
    logger.error('Error updating WebRTC connection:', error);
    throw error;
  }
}

async function fetchStreamOffer(streamId) {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/offer`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
    },
  });
  const data = await response.json();
  return data.offer;
}

async function fetchIceServers() {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/ice_servers`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
    },
  });
  const data = await response.json();
  return data.ice_servers;
}

async function sendSDPAnswer(streamId, sessionId, answer) {
  await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      answer,
      session_id: sessionId,
    }),
  });
}


function togglePushToTalk() {
  isPushToTalkEnabled = !isPushToTalkEnabled;
  const toggleButton = document.getElementById('push-to-talk-toggle');
  const pushToTalkButton = document.getElementById('push-to-talk-button');
  toggleButton.textContent = `Push to Talk: ${isPushToTalkEnabled ? 'On' : 'Off'}`;
  pushToTalkButton.style.display = isPushToTalkEnabled ? 'inline-block' : 'none';
  if (isPushToTalkEnabled) {
    autoSpeakMode = false;
    document.getElementById('auto-speak-toggle').textContent = 'Auto-Speak: Off';
  }
}


function startPushToTalk(event) {
  if (!isPushToTalkEnabled) return;
  event.preventDefault();
  pushToTalkStartTime = Date.now();
  const logoWrapper = document.getElementById('logo-wrapper');
  logoWrapper.classList.add('active');
  pushToTalkTimer = setTimeout(() => {
    startRecording(true);
  }, MIN_PUSH_TO_TALK_DURATION);
}

function endPushToTalk(event) {
  if (!isPushToTalkEnabled) return;
  event.preventDefault();
  clearTimeout(pushToTalkTimer);
  const logoWrapper = document.getElementById('logo-wrapper');
  logoWrapper.classList.remove('active');
  const duration = Date.now() - pushToTalkStartTime;
  if (duration >= MIN_PUSH_TO_TALK_DURATION) {
    stopRecording(true);
  }
  pushToTalkStartTime = 0;
}


async function initialize() {
  setLogLevel('INFO');
  connectionState = ConnectionState.DISCONNECTED;

  const { avatarId, contextId, interfaceMode, header } = getUrlParameters();
  currentInterfaceMode = interfaceMode; // Store the interface mode

  // Handle header visibility
  const headerBar = document.getElementById('header-bar');
  if (headerBar && header) {
    headerBar.classList.add('visible');
  }

  const { idle, stream } = getVideoElements();
  idleVideoElement = idle;
  streamVideoElement = stream;

  if (idleVideoElement) idleVideoElement.setAttribute('playsinline', '');
  if (streamVideoElement) streamVideoElement.setAttribute('playsinline', '');

  initializeTransitionCanvas();

  await loadAvatars(avatarId);
  await loadContexts(contextId);
  populateAvatarSelect();
  populateContextSelect();
  updateContextDisplay();

  const contextSelect = document.getElementById('context-select');
  contextSelect.addEventListener('change', handleContextChange);

  const editContextButton = document.getElementById('edit-context-button');
  editContextButton.addEventListener('click', () => openContextModal(currentContextId));

  const sendTextButton = document.getElementById('send-text-button');
  const textInput = document.getElementById('text-input');
  const autoSpeakToggle = document.getElementById('auto-speak-toggle');
  const editAvatarButton = document.getElementById('edit-avatar-button');
  const pushToTalkToggle = document.getElementById('push-to-talk-toggle');
  const pushToTalkButton = document.getElementById('push-to-talk-button');
  const simplePushTalkButton = document.getElementById('simple-push-talk-button');
  const startButton = document.getElementById('start-button');

  sendTextButton.addEventListener('click', () => handleTextInput(textInput.value));
  textInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') handleTextInput(textInput.value);
  });
  autoSpeakToggle.addEventListener('click', toggleAutoSpeak);
  editAvatarButton.addEventListener('click', () => openAvatarModal(currentAvatarId));
  pushToTalkToggle.addEventListener('click', togglePushToTalk);
  pushToTalkButton.addEventListener('mousedown', startPushToTalk);
  pushToTalkButton.addEventListener('mouseup', endPushToTalk);
  pushToTalkButton.addEventListener('mouseleave', endPushToTalk);
  pushToTalkButton.addEventListener('touchstart', startPushToTalk);
  pushToTalkButton.addEventListener('touchend', endPushToTalk);

  if (simplePushTalkButton) {
    simplePushTalkButton.addEventListener('mousedown', startPushToTalk);
    simplePushTalkButton.addEventListener('mouseup', endPushToTalk);
    simplePushTalkButton.addEventListener('mouseleave', endPushToTalk);
    simplePushTalkButton.addEventListener('touchstart', startPushToTalk);
    simplePushTalkButton.addEventListener('touchend', endPushToTalk);
  }

  startButton.addEventListener('click', toggleRecording);

  initializeWebSocket();
  playIdleVideo();

  if (avatars.length > 0 && currentAvatarId) {
    // showLoadingSymbol();
    try {
      await initializePersistentStream();
      startConnectionHealthCheck();
      // hideLoadingSymbol();
    } catch (error) {
      logger.error('Error during initialization:', error);
      // hideLoadingSymbol();
      showErrorMessage('Failed to connect. Please try again.');
      connectionState = ConnectionState.DISCONNECTED;
    }
  } else {
    logger.warn('No avatars available or no current avatar selected. Skipping stream initialization.');
    showErrorMessage('No avatars available or no avatar selected. Please create or select an avatar before connecting.');
  }

  window.addEventListener('online', async () => {
    if (connectionState === ConnectionState.DISCONNECTED) {
      logger.info('Network connection restored. Attempting to reconnect...');
      try {
        await backgroundReconnect();
      } catch (error) {
        logger.error('Failed to reconnect after network restoration:', error);
      }
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && connectionState === ConnectionState.DISCONNECTED) {
      logger.info('Page became visible. Checking connection...');
      if (navigator.onLine) {
        backgroundReconnect();
      }
    }
  });

  // Apply simple mode after initialization is complete
  if (currentInterfaceMode === 'simpleVoice' || currentInterfaceMode === 'simplePushTalk') {
    applySimpleMode(currentInterfaceMode);
  }

  // Check if the application is running in an iframe
  if (window.self !== window.top) {
    console.log('Running in iframe mode');
  }

  // Remove the initialization class to show the content
  document.body.classList.remove('initializing');

  document.addEventListener('DOMContentLoaded', notifyParentWindowReady);


  logger.info('Initialization complete');


}

function applySimpleMode(mode) {
  const content = document.getElementById('content');
  const videoWrapper = document.getElementById('video-wrapper');
  const simpleModeButton = document.getElementById('simple-mode-button');
  const header = document.querySelector('.header');
  const logoWrapper = document.getElementById('logo-wrapper');

  content.style.display = 'none';
  document.body.appendChild(videoWrapper);
  videoWrapper.style.position = 'fixed';
  videoWrapper.style.top = '50%';
  videoWrapper.style.left = '50%';
  videoWrapper.style.transform = 'translate(-50%, -50%)';
  simpleModeButton.textContent = 'Exit';
  simpleModeButton.classList.add('simple-mode');
  header.style.position = 'fixed';
  header.style.width = '100%';
  header.style.zIndex = '1000';

  if (mode === 'simpleVoice') {
    if (!autoSpeakMode) {
      toggleAutoSpeak();
    }
    if (!isRecording) {
      startRecording();
    }
  } else if (mode === 'simplePushTalk') {
    if (!isPushToTalkEnabled) {
      togglePushToTalk();
    }
    document.body.classList.add('simple-push-talk');
    logoWrapper.style.backgroundImage = "url('Slogo_PushTalk.svg')";

    document.body.addEventListener('mousedown', startPushToTalk);
    document.body.addEventListener('mouseup', endPushToTalk);
    document.body.addEventListener('mouseleave', endPushToTalk);
    document.body.addEventListener('touchstart', startPushToTalk);
    document.body.addEventListener('touchend', endPushToTalk);
  }

  currentInterfaceMode = mode;
  logger.info(`Applied simple mode: ${mode}`);
}

function exitSimpleMode() {
  const content = document.getElementById('content');
  const videoWrapper = document.getElementById('video-wrapper');
  const simpleModeButton = document.getElementById('simple-mode-button');
  const header = document.querySelector('.header');
  const logoWrapper = document.getElementById('logo-wrapper');
  const simplePushTalkButton = document.getElementById('simple-push-talk-button');

  // Restore content display
  content.style.display = 'flex';
  const leftColumn = document.getElementById('left-column');
  leftColumn.appendChild(videoWrapper);

  // Reset video wrapper styles
  videoWrapper.style.position = 'relative';
  videoWrapper.style.top = 'auto';
  videoWrapper.style.left = 'auto';
  videoWrapper.style.transform = 'none';

  // Reset simple mode button
  simpleModeButton.textContent = 'Simple Mode';
  simpleModeButton.classList.remove('simple-mode');

  // Reset header styles
  header.style.position = 'static';
  header.style.width = 'auto';

  // Reset logo
  logoWrapper.style.backgroundImage = "url('Slogo.svg')";
  logoWrapper.style.width = '100%'; // Reset to original width
  logoWrapper.style.height = '18%'; // Reset to original width


  // Remove simple push talk class from body
  document.body.classList.remove('simple-push-talk');

  // Remove event listeners for push-to-talk
  document.body.removeEventListener('mousedown', startPushToTalk);
  document.body.removeEventListener('mouseup', endPushToTalk);
  document.body.removeEventListener('mouseleave', endPushToTalk);
  document.body.removeEventListener('touchstart', startPushToTalk);
  document.body.removeEventListener('touchend', endPushToTalk);

  // Turn off auto-speak if it's on
  if (autoSpeakMode) {
    toggleAutoSpeak();
  }

  // Turn off push-to-talk if it's on
  if (isPushToTalkEnabled) {
    togglePushToTalk();
  }

  // Stop recording if it's active
  if (isRecording) {
    stopRecording();
  }

  // Hide simple push talk button if it exists
  if (simplePushTalkButton) {
    simplePushTalkButton.style.display = 'none';
  }

  // Reset interface mode
  currentInterfaceMode = null;

  // Update URL to remove interface mode parameter
  const url = new URL(window.location);
  url.searchParams.delete('interfaceMode');
  window.history.pushState({}, '', url);

  logger.info('Exited simple mode');
}

async function handleAvatarChange() {
  const avatarSelect = document.getElementById('avatar-select');
  currentAvatarId = avatarSelect.value;
  if (currentAvatarId === 'create-new') {
    openAvatarModal();
    return;
  }

  const currentAvatar = avatars.find(avatar => avatar.id === currentAvatarId);
  if (!currentAvatar) {
    logger.error(`Avatar with id ${currentAvatarId} not found`);
    return;
  }

  // Update URL with new avatar ID
  const url = new URL(window.location);
  url.searchParams.set('avatar', currentAvatarId);
  window.history.pushState({}, '', url);

  const idleVideoElement = document.getElementById('idle-video-element');
  if (idleVideoElement) {
    idleVideoElement.src = currentAvatar.silentVideoUrl;
    try {
      await idleVideoElement.load();
      logger.debug(`Idle video loaded for ${currentAvatar.name}`);
    } catch (error) {
      logger.error(`Error loading idle video for ${currentAvatar.name}:`, error);
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

  await destroyPersistentStream();
  await initializePersistentStream();
}


async function loadAvatars(selectedAvatarId) {
  try {
    const response = await fetch('/avatars');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    avatars = await response.json();
    logger.debug('Avatars loaded:', avatars);

    if (selectedAvatarId && avatars.some(avatar => avatar.id === selectedAvatarId)) {
      currentAvatarId = selectedAvatarId;
    } else if (!currentAvatarId && avatars.length > 0) {
      currentAvatarId = avatars[0].id;
    }
  } catch (error) {
    logger.error('Error loading avatars:', error);
    showErrorMessage('Failed to load avatars. Please try again.');
  }
}


function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

function populateAvatarSelect() {
  const avatarSelect = document.getElementById('avatar-select');
  avatarSelect.innerHTML = '';

  const createNewOption = document.createElement('option');
  createNewOption.value = 'create-new';
  createNewOption.textContent = 'Create New Avatar';
  avatarSelect.appendChild(createNewOption);

  for (const avatar of avatars) {
    const option = document.createElement('option');
    option.value = avatar.id;
    option.textContent = avatar.name;
    avatarSelect.appendChild(option);
  }

  if (avatars.length > 0) {
    if (!currentAvatarId) {
      currentAvatarId = avatars[0].id;
    }
    avatarSelect.value = currentAvatarId;
  } else {
    avatarSelect.value = 'create-new';
  }
}



function openAvatarModal(avatarId = null) {
  const modal = document.getElementById('avatar-modal');
  const nameInput = document.getElementById('avatar-name');
  const voiceInput = document.getElementById('avatar-voice');
  const imagePreview = document.getElementById('avatar-image-preview');
  const saveButton = document.getElementById('save-avatar-button');
  const idInput = document.getElementById('avatar-id');

  if (avatarId && avatars.find(a => a.id === avatarId)) {
    const avatar = avatars.find(a => a.id === avatarId);
    nameInput.value = avatar.name;
    voiceInput.value = avatar.voiceId;
    imagePreview.src = avatar.imageUrl;
    idInput.value = avatar.id;
    saveButton.textContent = 'Update Avatar';
  } else {
    nameInput.value = '';
    voiceInput.value = 'en-US-GuyNeural';
    imagePreview.src = '';
    idInput.value = crypto.randomUUID(); // Use the Web Crypto API to generate a UUID
    saveButton.textContent = 'Create Avatar';
  }

  modal.style.display = 'block';
}



function closeAvatarModal() {
  const modal = document.getElementById('avatar-modal');
  modal.style.display = 'none';
}

async function saveAvatar() {
  const name = document.getElementById('avatar-name').value;
  const voiceId = document.getElementById('avatar-voice').value || 'en-US-GuyNeural';
  const imageFile = document.getElementById('avatar-image').files[0];
  const avatarId = document.getElementById('avatar-id').value;

  if (!name) {
    showErrorMessage('Please fill in the avatar name.');
    return;
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('voiceId', voiceId);
  formData.append('id', avatarId);
  if (imageFile) {
    formData.append('image', imageFile);
  }

  showToast('Saving avatar...', 0);

  try {
    const response = await fetch('/avatar', {
      method: 'POST',
      body: formData,
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const events = chunk.split('\n\n');

      for (const event of events) {
        if (event.startsWith('data: ')) {
          const data = JSON.parse(event.slice(6));
          if (data.status === 'processing') {
            showToast('Processing avatar...', 0);
          } else if (data.status === 'completed') {
            const updatedAvatarIndex = avatars.findIndex(avatar => avatar.id === data.avatar.id);
            if (updatedAvatarIndex !== -1) {
              avatars[updatedAvatarIndex] = data.avatar;
            } else {
              avatars.push(data.avatar);
            }
            populateAvatarSelect();
            closeAvatarModal();
            showToast('Avatar saved successfully!', 3000);
            currentAvatarId = data.avatar.id;
            await handleAvatarChange();
          } else if (data.status === 'error') {
            showErrorMessage(data.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error saving avatar:', error);
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
    logger.debug('Context updated:', context);
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
  connectButton.onclick = initializePersistentStream;

  if (destroyButton) destroyButton.style.display = 'inline-block';
  destroyButton.onclick = destroyPersistentStream;

  if (connectButton) connectButton.style.display = 'inline-block';
}

async function createPeerConnection(offer, iceServers) {
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
      logger.debug('Data channel opened');
    };
    pcDataChannel.onclose = () => {
      logger.debug('Data channel closed');
    };
    pcDataChannel.onerror = (error) => {
      logger.error('Data channel error:', error);
    };
    pcDataChannel.onmessage = onStreamEvent;
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
  if (event.candidate && persistentStreamId && persistentSessionId) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;
    logger.debug('New ICE candidate:', candidate);

    fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}/ice`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate,
        sdpMid,
        sdpMLineIndex,
        session_id: persistentSessionId,
      }),
    }).catch((error) => {
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

async function attemptReconnect() {
  logger.debug('Attempting to reconnect...');
  try {
    await reinitializeConnection();
    logger.debug('Reconnection successful');
    reconnectAttempts = 0;
  } catch (error) {
    logger.error('Reconnection attempt failed:', error);
    scheduleReconnect();
  }
}

function onConnectionStateChange() {
  const { peer: peerStatusLabel } = getStatusLabels();
  if (peerStatusLabel) {
    peerStatusLabel.innerText = peerConnection.connectionState;
    peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
  }
  logger.debug('Peer connection state changed:', peerConnection.connectionState);

  if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
    logger.warn('Peer connection failed or disconnected. Attempting to reconnect...');
    connectionState = ConnectionState.DISCONNECTED;
    backgroundReconnect();
  } else if (peerConnection.connectionState === 'connected') {
    logger.debug('Peer connection established successfully');
    connectionState = ConnectionState.CONNECTED;
    reconnectAttempts = 0;
  }
}

function startConnectionHealthCheck() {
  setInterval(() => {
    if (peerConnection) {
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        logger.warn('Connection health check detected disconnected state. Attempting to reconnect...');
        connectionState = ConnectionState.DISCONNECTED;
        backgroundReconnect();
      } else if (peerConnection.connectionState === 'connected') {
        const timeSinceLastConnection = Date.now() - lastConnectionTime;
        if (timeSinceLastConnection > RECONNECTION_INTERVAL * 0.9) {
          logger.info('Approaching reconnection threshold. Initiating background reconnect.');
          backgroundReconnect();
        }
      }
    }
  }, 30000); // Check every 30 seconds
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
  let status = videoIsPlaying ? 'streaming' : 'empty';

  if (status === lastVideoStatus) {
    logger.debug('Video status unchanged:', status);
    return;
  }

  logger.debug('Video status changing from', lastVideoStatus, 'to', status);

  const streamVideoElement = document.getElementById('stream-video-element');
  const idleVideoElement = document.getElementById('idle-video-element');

  if (!streamVideoElement || !idleVideoElement) {
    logger.error('Video elements not found');
    return;
  }

  if (status === 'streaming') {
    setStreamVideoElement(stream);
  } else {
    smoothTransition(false);
  }

  lastVideoStatus = status;

  const streamingStatusLabel = document.getElementById('streaming-status-label');
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
  if (stream instanceof MediaStream) {
    streamVideoElement.srcObject = stream;
  } else {
    logger.warn('Invalid stream provided to setStreamVideoElement');
    return;
  }

  streamVideoElement.onloadedmetadata = () => {
    logger.debug('Stream video metadata loaded');
    streamVideoElement
      .play()
      .then(() => {
        logger.debug('Stream video playback started');
        smoothTransition(true);
      })
      .catch((e) => logger.error('Error playing stream video:', e));
  };

  streamVideoElement.oncanplay = () => {
    logger.debug('Stream video can play');
  };

  streamVideoElement.onerror = (e) => {
    logger.error('Error with stream video:', e);
  };
}

function onStreamEvent(message) {
  if (pcDataChannel.readyState === 'open') {
    let status;
    const [event, _] = message.data.split(':');

    switch (event) {
      case 'stream/started':
        status = 'started';
        break;
      case 'stream/done':
        status = 'done';
        break;
      case 'stream/ready':
        status = 'ready';
        break;
      case 'stream/error':
        status = 'error';
        break;
      default:
        status = 'dont-care';
        break;
    }

    // Set stream ready after a short delay, adjusting for potential timing differences between data and stream channels
    if (status === 'ready') {
      setTimeout(() => {
        console.log('stream/ready');
        isStreamReady = true;
        const streamEventLabel = document.getElementById('stream-event-label');
        if (streamEventLabel) {
          streamEventLabel.innerText = 'ready';
          streamEventLabel.className = 'streamEvent-ready';
        }
      }, 1000);
    } else {
      console.log(event);
      const streamEventLabel = document.getElementById('stream-event-label');
      if (streamEventLabel) {
        streamEventLabel.innerText = status === 'dont-care' ? event : status;
        streamEventLabel.className = 'streamEvent-' + status;
      }
    }
  }
}

function onTrack(event) {
  logger.debug('onTrack event:', event);
  if (!event.track) {
    logger.warn('No track in onTrack event');
    return;
  }

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

            // logger.debug('Video stats:', {
            //  bytesReceived: report.bytesReceived,
            //  lastBytesReceived,
            //  videoIsPlaying,
            //  videoStatusChanged
            // });

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
  }, 250); // Check every 500ms

  if (event.streams && event.streams.length > 0) {
    const stream = event.streams[0];
    if (stream.getVideoTracks().length > 0) {
      logger.debug('Setting stream video element with track:', event.track.id);
      setStreamVideoElement(stream);
    } else {
      logger.warn('Stream does not contain any video tracks');
    }
  } else {
    logger.warn('No streams found in onTrack event');
  }

  if (isDebugMode) {
    // downloadStreamVideo(event.streams[0]);
  }
}

function playIdleVideo() {
  const { idle: idleVideoElement } = getVideoElements();
  if (!idleVideoElement) {
    logger.error('Idle video element not found');
    return;
  }

  const currentAvatar = avatars.find(avatar => avatar.id === currentAvatarId);
  if (!currentAvatar) {
    logger.warn(`No avatar selected or avatar ${currentAvatarId} not found. Unable to play idle video.`);
    return;
  }

  idleVideoElement.src = currentAvatar.silentVideoUrl;
  idleVideoElement.loop = true;

  idleVideoElement.onloadeddata = () => {
    logger.debug(`Idle video loaded successfully for ${currentAvatar.name}`);
  };

  idleVideoElement.onerror = (e) => {
    logger.error(`Error loading idle video for ${currentAvatar.name}:`, e);
  };

  idleVideoElement.play().catch((e) => logger.error('Error playing idle video:', e));
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
  if (labels.iceGathering) labels.iceGathering.innerText = '';
  if (labels.signaling) labels.signaling.innerText = '';
  if (labels.ice) labels.ice.innerText = '';
  if (labels.peer) labels.peer.innerText = '';
  logger.debug('Stopped peer connection');
  if (pc === peerConnection) {
    peerConnection = null;
  }
}

async function fetchWithRetries(url, options, retries = 0, delayMs = 1000) {
  try {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallTime;

    if (timeSinceLastCall < API_CALL_INTERVAL) {
      await new Promise((resolve) => setTimeout(resolve, API_CALL_INTERVAL - timeSinceLastCall));
    }

    lastApiCallTime = Date.now();

    const response = await fetch(url, options);
    if (!response.ok) {
      if (response.status === 429) {
        // If rate limited, wait for a longer time before retrying
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        logger.warn(`Rate limited. Retrying after ${retryAfter} seconds.`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        return fetchWithRetries(url, options, retries, delayMs);
      }
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }
    return response;
  } catch (err) {
    if (retries < maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) * delayMs + Math.random() * 1000, maxDelaySec * 1000);
      logger.warn(`Request failed, retrying ${retries + 1}/${maxRetryCount} in ${delay}ms. Error: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetries(url, options, retries + 1, delayMs);
    } else {
      throw err;
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
        driver_url: 'bank://lively/driver-06',
        output_resolution: 512,
        stream_warmup: true,
        config: {
          stitch: true,
          fluent: true,
          auto_match: true,
          pad_audio: 0.5,
          normalization_factor: 0.1,
          align_driver: true,
          motion_factor: 0.55,
          align_expand_factor: 0.3,
          driver_expressions: {
            expressions: [
              {
                start_frame: 0,
                expression: 'neutral',
                intensity: 0.5,
              },
            ],
          },
        },
      }),
    });

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();

    if (!newStreamId || !newSessionId) {
      throw new Error('Failed to get valid stream ID or session ID from API');
    }

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

    await new Promise((resolve) => setTimeout(resolve, 6000));

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
  } catch (error) {
    logger.error('Failed to initialize connection:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

async function startStreaming(assistantReply) {
  try {
    logger.debug('Starting streaming with reply:', assistantReply);
    if (!persistentStreamId || !persistentSessionId) {
      logger.error('Persistent stream not initialized. Cannot start streaming.');
      await initializePersistentStream();
    }

    const currentAvatar = avatars.find(avatar => avatar.id === currentAvatarId);
    if (!currentAvatar) {
      logger.error('No avatar selected or avatar not found. Cannot start streaming.');
      return;
    }

    const streamVideoElement = document.getElementById('stream-video-element');
    const idleVideoElement = document.getElementById('idle-video-element');

    if (!streamVideoElement || !idleVideoElement) {
      logger.error('Video elements not found');
      return;
    }

    // Remove outer <speak> tags if present
    let ssmlContent = assistantReply.trim();
    if (ssmlContent.startsWith('<speak>') && ssmlContent.endsWith('</speak>')) {
      ssmlContent = ssmlContent.slice(7, -8).trim();
    }

    // Split the SSML content into chunks, respecting SSML tags
    const chunks = ssmlContent.match(/(?:<[^>]+>|[^<]+)+/g) || [];

    logger.debug('Chunks', chunks);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim();
      if (chunk.length === 0) continue;

      isAvatarSpeaking = true;
      const playResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: {
            type: 'text',
            input: chunk,
            ssml: true,
            provider: {
              type: 'microsoft',
              voice_id: currentAvatar.voiceId,
            },
          },
          session_id: persistentSessionId,
          driver_url: 'bank://lively/driver-06',
          output_resolution: 512,
          stream_warmup: true,
          config: {
            fluent: true,
            stitch: true,
            pad_audio: 0.5,
            auto_match: true,
            align_driver: true,
            normalization_factor: 0.1,
            align_expand_factor: 0.3,
            motion_factor: 0.55,
            result_format: 'webm',
            driver_expressions: {
              expressions: [
                {
                  start_frame: 0,
                  expression: 'neutral',
                  intensity: 0.5,
                },
              ],
            },
          },
          background: {
            color: false
          }
        }),
      });

      if (!playResponse.ok) {
        throw new Error(`HTTP error! status: ${playResponse.status}`);
      }

      const playResponseData = await playResponse.json();
      logger.debug('Streaming response:', playResponseData);

      if (playResponseData.status === 'started') {
        logger.debug('Stream chunk started successfully');

        if (playResponseData.result_url) {
          // Wait for the video to be ready before transitioning
          await new Promise((resolve) => {
            streamVideoElement.src = playResponseData.result_url;
            streamVideoElement.oncanplay = resolve;
          });

          // Perform the transition
          smoothTransition(true);

          await new Promise((resolve) => {
            streamVideoElement.onended = resolve;
          });
        } else {
          logger.debug('No result_url in playResponseData. Waiting for next chunk.');
        }
      } else {
        logger.warn('Unexpected response status:', playResponseData.status);
      }
    }

    isAvatarSpeaking = false;
    smoothTransition(false);

    // Check if we need to reconnect
    if (shouldReconnect()) {
      logger.info('Approaching reconnection threshold. Initiating background reconnect.');
      await backgroundReconnect();
    }
  } catch (error) {
    logger.error('Error during streaming:', error);
    if (error.message.includes('HTTP error! status: 404') || error.message.includes('missing or invalid session_id')) {
      logger.warn('Stream not found or invalid session. Attempting to reinitialize persistent stream.');
      await reinitializePersistentStream();
    }
  }
}

export function toggleSimpleMode() {
  if (currentInterfaceMode) {
    exitSimpleMode();
  } else {
    applySimpleMode('simpleVoice'); // Default to simpleVoice when toggling
  }

  // Update URL
  const url = new URL(window.location);
  if (currentInterfaceMode) {
    url.searchParams.set('interfaceMode', currentInterfaceMode);
  } else {
    url.searchParams.delete('interfaceMode');
  }
  window.history.pushState({}, '', url);

  logger.info(`Toggled simple mode. Current mode: ${currentInterfaceMode || 'full'}`);
}



function createSimplePushTalkButton() {
  const button = document.createElement('button');
  button.id = 'simple-push-talk-button';
  button.textContent = 'Push to Talk';
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.left = '50%';
  button.style.transform = 'translateX(-50%)';
  button.style.zIndex = '1001';
  button.addEventListener('mousedown', startPushToTalk);
  button.addEventListener('mouseup', endPushToTalk);
  button.addEventListener('mouseleave', endPushToTalk);
  button.addEventListener('touchstart', startPushToTalk);
  button.addEventListener('touchend', endPushToTalk);
  document.body.appendChild(button);
  return button;
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
      logger.warn(
        'Deepgram connection not open, cannot send audio data. ReadyState:',
        deepgramConnection ? deepgramConnection.getReadyState() : 'undefined',
      );
    }
  };

  logger.debug('Audio data sending setup complete');
}

function handleTranscription(data, isPushToTalk) {
  if (!isRecording) return;

  const transcript = data.channel.alternatives[0].transcript;
  if (data.is_final || isPushToTalk) {
    logger.debug('Final transcript:', transcript);
    if (transcript.trim()) {
      currentUtterance += transcript + ' ';
      updateTranscript(currentUtterance.trim(), !isPushToTalk);
      if (!isPushToTalk) {
        chatHistory.push({
          role: 'user',
          content: currentUtterance.trim(),
        });
        sendChatToGroq();
        currentUtterance = '';
        interimMessageAdded = false;
      }
    }
  } else {
    logger.debug('Interim transcript:', transcript);
    updateTranscript(currentUtterance + transcript, false);
  }
}

async function startRecording(isPushToTalk = false) {
  if (isRecording && !isPushToTalk) {
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
      model: 'nova-2',
      language: 'en-US',
      smart_format: true,
      interim_results: true,
      punctuate: true,
      encoding: 'linear16',
      sample_rate: audioContext.sampleRate,
    };

    if (!isPushToTalk) {
      deepgramOptions.utterance_end_ms = 2500;
      deepgramOptions.vad_events = true;
    }

    logger.debug('Creating Deepgram connection with options:', deepgramOptions);

    deepgramConnection = await deepgramClient.listen.live(deepgramOptions);

    deepgramConnection.addListener(LiveTranscriptionEvents.Open, () => {
      logger.debug('Deepgram WebSocket Connection opened');
      startSendingAudioData();
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Close, () => {
      logger.debug('Deepgram WebSocket connection closed');
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Transcript, (data) => {
      logger.debug('Received transcription:', JSON.stringify(data));
      handleTranscription(data, isPushToTalk);
    });

    if (!isPushToTalk) {
      deepgramConnection.addListener(LiveTranscriptionEvents.UtteranceEnd, (data) => {
        logger.debug('Utterance end event received:', data);
        handleUtteranceEnd(data);
      });
    }

    deepgramConnection.addListener(LiveTranscriptionEvents.Error, (err) => {
      logger.error('Deepgram error:', err);
      handleDeepgramError(err);
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Warning, (warning) => {
      logger.warn('Deepgram warning:', warning);
    });

    isRecording = true;
    if (autoSpeakMode && !isPushToTalk) {
      autoSpeakInProgress = true;
    }
    const startButton = document.getElementById('start-button');
    startButton.textContent = 'Stop';

    logger.debug('Recording and transcription started successfully');
  } catch (error) {
    logger.error('Error starting recording:', error);
    isRecording = false;
    const startButton = document.getElementById('start-button');
    startButton.textContent = 'Speak';
    showErrorMessage('Failed to start recording. Please try again.');
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
    audioContext.close().catch((closeError) => {
      logger.warn('Error while closing AudioContext:', closeError);
    });
  }
}

function handleUtteranceEnd(data) {
  if (!isRecording) return;

  logger.debug('Utterance end detected:', data);
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

async function stopRecording(isPushToTalk = false) {
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
    if (!isPushToTalk) {
      const startButton = document.getElementById('start-button');
      startButton.textContent = 'Speak';
    }

    logger.debug('Recording and transcription stopped');

    if (isPushToTalk && currentUtterance.trim()) {
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
}

async function sendChatToGroq() {
  if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1].content.trim() === '') {
    logger.debug('No new content to send to Groq. Skipping request.');
    return;
  }

  logger.debug('Sending chat to Groq...');
  try {
    const startTime = Date.now();
    const currentContext = getCurrentContext();
    const requestBody = {
      messages: [
        {
          role: 'system',
          content: currentContext,
        },
        ...chatHistory,
      ],
      model: 'llama-3.1-8b-instant',
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

    // Start streaming the entire response
    await startStreaming(assistantReply);

    // Ensure Push to Talk remains active after avatar response
    if (isPushToTalkEnabled) {
      const pushToTalkButton = document.getElementById('push-to-talk-button');
      pushToTalkButton.disabled = false;
    }
  } catch (error) {
    logger.error('Error in sendChatToGroq:', error);
    const msgHistory = document.getElementById('msgHistory');
    msgHistory.innerHTML += `<span><u>Assistant:</u> I'm sorry, I encountered an error. Could you please try again?</span><br>`;
    msgHistory.scrollTop = msgHistory.scrollHeight;
  }
}

function toggleAutoSpeak() {
  autoSpeakMode = !autoSpeakMode;
  const toggleButton = document.getElementById('auto-speak-toggle');
  const startButton = document.getElementById('start-button');
  toggleButton.textContent = `Auto-Speak: ${autoSpeakMode ? 'On' : 'Off'}`;
  if (autoSpeakMode) {
    startButton.textContent = 'Stop';
    if (!isRecording) {
      startRecording();
    }
  } else {
    startButton.textContent = isRecording ? 'Stop' : 'Speak';
    if (isRecording) {
      stopRecording();
    }
  }
}

async function reinitializeConnection() {
  if (connectionState === ConnectionState.RECONNECTING) {
    logger.warn('Connection reinitialization already in progress. Skipping reinitialize.');
    return;
  }

  connectionState = ConnectionState.RECONNECTING;
  logger.debug('Reinitializing connection...');

  try {
    await destroyPersistentStream();
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second

    stopAllStreams();
    closePC();

    clearInterval(statsIntervalId);
    clearTimeout(inactivityTimeout);
    clearInterval(keepAliveInterval);

    streamId = null;
    sessionId = null;
    peerConnection = null;
    lastBytesReceived = 0;
    videoIsPlaying = false;

    currentUtterance = '';
    interimMessageAdded = false;

    const msgHistory = document.getElementById('msgHistory');
    msgHistory.innerHTML = '';
    chatHistory = [];

    // Reset video elements
    const streamVideoElement = document.getElementById('stream-video-element');
    const idleVideoElement = document.getElementById('idle-video-element');
    if (streamVideoElement) streamVideoElement.srcObject = null;
    if (idleVideoElement) idleVideoElement.style.display = 'block';

    // Add a delay before initializing to avoid rapid successive calls
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await initializePersistentStream();

    if (!persistentStreamId || !persistentSessionId) {
      throw new Error('Persistent Stream ID or Session ID is missing after initialization');
    }

    await prepareForStreaming();

    logger.info('Connection reinitialized successfully');
    logger.debug(`New Persistent Stream ID: ${persistentStreamId}, New Persistent Session ID: ${persistentSessionId}`);
    reconnectAttempts = 0; // Reset reconnect attempts on successful connection
    connectionState = ConnectionState.CONNECTED;
  } catch (error) {
    logger.error('Error during reinitialization:', error);
    showErrorMessage('Failed to reconnect. Please refresh the page.');
    connectionState = ConnectionState.DISCONNECTED;
  }
}

async function cleanupOldStream() {
  logger.debug('Cleaning up old stream...');

  try {
    if (peerConnection) {
      peerConnection.close();
    }

    if (pcDataChannel) {
      pcDataChannel.close();
    }

    // Stop all tracks in the streamVideoElement
    if (streamVideoElement && streamVideoElement.srcObject) {
      streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    }

    // Clear any ongoing intervals or timeouts
    clearInterval(statsIntervalId);
    clearTimeout(inactivityTimeout);
    clearInterval(keepAliveInterval);

    logger.debug('Old stream cleaned up successfully');
  } catch (error) {
    logger.error('Error cleaning up old stream:', error);
  }
}

const connectButton = document.getElementById('connect-button');
connectButton.onclick = initializeConnection;

const destroyButton = document.getElementById('destroy-button');
destroyButton.onclick = async () => {
  try {
    await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
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
  toggleAutoSpeak,
  initializePersistentStream,
  destroyPersistentStream,
  speakDirectly
};

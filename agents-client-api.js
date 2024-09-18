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
const API_RATE_LIMIT = 80; // Maximum number of calls per minute
const API_CALL_INTERVAL = 5000 / API_RATE_LIMIT; // Minimum time between API calls in milliseconds
let lastApiCallTime = 0;
const maxRetryCount = 10;
const maxDelaySec = 100;
const RECONNECTION_INTERVAL = 100000; // 25 seconds for testing, adjust as needed
let isAvatarSpeaking = false;
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 300; // 1 second
const MAX_RECONNECT_DELAY = 90000; // 30 seconds
let isPushToTalkEnabled = false;
let pushToTalkStartTime = 0;
const MIN_PUSH_TO_TALK_DURATION = 300;
let pushToTalkTimer = null;
let contexts = [];
let currentContextId = '';
let currentAvatarId = '';
let isInitializingStream = false;
let currentInterfaceMode = null;
let isPushToTalkActive = false;
let autoSpeakInProgress = false;
let streamStartTime = 0;
const STREAM_DURATION_THRESHOLD = 300; // 300ms threshold to consider a stream stable
let videoStatusDebounceTimer;
const MIN_BYTES_THRESHOLD = 1000;
let streamingStartTime = 0;
const STREAMING_HYSTERESIS = 500;
let lastActivityTime = 0;
const IDLE_TIMEOUT = 1000; // 2 seconds of inactivity before transitioning to idle
let isWaitingForStream = false;
let isWarmingUp = false;
let transitionDebounceTimer;
let pendingTransition = null;
let hasWarmUpPlayed = false;
let ws;
let isStreaming = false;


function debouncedVideoStatusChange(isPlaying, stream) {
  clearTimeout(videoStatusDebounceTimer);
  videoStatusDebounceTimer = setTimeout(() => {
    if (isPlaying !== lastVideoStatus) {
      onVideoStatusChange(isPlaying, stream);
      lastVideoStatus = isPlaying;
    }
  }, 200);
}


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

function smoothTransition(toStreaming, duration = 300) {
  if (isTransitioning) {
    pendingTransition = { toStreaming, duration };
    logger.debug('Transition already in progress, queueing next transition');
    return;
  }

  if (isWarmingUp) {
    logger.debug('Warming up, skipping transition');
    return;
  }

  isTransitioning = true;
  logger.debug(`Starting smooth transition to ${toStreaming ? 'streaming' : ''} state`);

  const idleVideoElement = document.getElementById('idle-video-element');
  const streamVideoElement = document.getElementById('stream-video-element');

  if (!idleVideoElement || !streamVideoElement) {
    logger.warn('Video elements not found for transition');
    isTransitioning = false;
    checkPendingTransition();
    return;
  }

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
        idleVideoElement.play().catch(e => logger.error('Error playing idle video:', e));
      }
      isTransitioning = false;
      isCurrentlyStreaming = toStreaming;
      transitionCanvas.style.display = 'none';
      logger.debug('Smooth transition completed');
      checkPendingTransition();
    }
  }

  // Show the transition canvas
  transitionCanvas.style.display = 'block';

  // Start the animation
  requestAnimationFrame(animate);
}


function checkPendingTransition() {
  if (pendingTransition) {
    const { toStreaming, duration } = pendingTransition;
    pendingTransition = null;
    smoothTransition(toStreaming, duration);
  }
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
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('WebSocket connection established');
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'streamStatus') {
        updateStreamStatus(message.status);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed');
    setTimeout(initializeWebSocket, 5000); // Attempt to reconnect after 5 seconds
  };
}

function updateStreamStatus(status) {
  const streamingStatusLabel = document.getElementById('streaming-status-label');
  if (streamingStatusLabel) {
    streamingStatusLabel.textContent = status;
  }
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

async function handleTextInput() {
  const textInput = document.getElementById('text-input');
  const message = textInput.value.trim();

  if (message) {
    try {
      updateChatHistory('User', message);
      textInput.value = '';

      const response = await sendChatToGroq(message);
      if (response) {
        updateChatHistory('Assistant', response);
        await startStreaming(response);
      }
    } catch (error) {
      console.error('Error handling text input:', error);
      updateChatHistory('System', 'An error occurred while processing your message.');
    }
  }
}

function updateChatHistory(sender, message) {
  const msgHistory = document.getElementById('msgHistory');
  const messageElement = document.createElement('div');
  messageElement.className = `message ${sender.toLowerCase()}`;
  messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
  msgHistory.appendChild(messageElement);
  msgHistory.scrollTop = msgHistory.scrollHeight;
}

function updateAssistantReply(text) {
  document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${text}</span><br>`;
}


async function warmUpStream() {
  if (!persistentStreamId || !persistentSessionId) {
    logger.error('Persistent stream not initialized. Cannot warm up stream.');
    return;
  }

  const currentAvatar = avatars.find(avatar => avatar.id === currentAvatarId);
  if (!currentAvatar) {
    logger.error('No avatar selected or avatar not found. Cannot warm up stream.');
    return;
  }

  isWarmingUp = true;
  const streamVideoElement = document.getElementById('stream-video-element');
  const idleVideoElement = document.getElementById('idle-video-element');
  const originalStreamDisplay = streamVideoElement.style.display;
  const originalIdleDisplay = idleVideoElement.style.display;

  try {
    logger.debug('Warming up stream...');

    const warmUpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script: {
          type: 'text',
          input: '<break time="1500ms"/>',
          ssml: true,
          provider: {
            type: 'microsoft',
            voice_id: currentAvatar.voiceId,
          },
        },
        session_id: persistentSessionId,
        driver_url: 'bank://lively/driver-06',
        compatibility_mode: "on",
        config: {
          fluent: true,
          stitch: true,
          pad_audio: 0.5,
          auto_match: true,
          align_driver: true,
          normalization_factor: 0.1,
          align_expand_factor: 0.3,
          motion_factor: 0.55,
          result_format: 'mp4'
        },
      }),
    });

    if (!warmUpResponse.ok) {
      throw new Error(`HTTP error! status: ${warmUpResponse.status}`);
    }

    const warmUpData = await warmUpResponse.json();
    logger.debug('Warm-up stream response:', warmUpData);

    if (warmUpData.status === 'started') {
      streamVideoElement.style.display = 'none';
      streamVideoElement.muted = true;
      streamVideoElement.src = warmUpData.result_url;

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for video to be ready to play'));
        }, 10000); // 10 seconds timeout

        streamVideoElement.oncanplay = () => {
          clearTimeout(timeout);
          streamVideoElement.play().then(resolve).catch(reject);
        };

        streamVideoElement.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Error loading warm-up video'));
        };
      });

      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          logger.warn('Warm-up video did not end naturally, forcing completion');
          hasWarmUpPlayed = true;
          updateStreamEventLabel('');
          resolve();
        }, 5000); // 5 seconds timeout

        streamVideoElement.onended = () => {
          clearTimeout(timeout);
          resolve();
        };
      });

      logger.debug('Warm-up stream completed');
    } else {
      logger.warn('Unexpected response status for warm-up stream:', warmUpData.status);
    }
  } catch (error) {
    logger.error('Error during stream warm-up:', error);
  } finally {
    isWarmingUp = false;
    isCurrentlyStreaming = false;
    isAvatarSpeaking = false;
    streamVideoElement.muted = false;
    streamVideoElement.style.display = originalStreamDisplay;
    idleVideoElement.style.display = originalIdleDisplay;
    smoothTransition(false);
    hasWarmUpPlayed = true;
    updateStreamEventLabel(''); // Set to empty string to indicate idle state
    logger.debug('Warm-up process finished, restored original video element states');
  }
}


async function initializePersistentStream() {
  logger.info('Initializing persistent stream...');
  try {
    const response = await fetchWithRetries(`${DID_API.url}/talks/streams`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: currentAvatarId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    persistentStreamId = data.id;
    persistentSessionId = data.session_id;
    logger.info('Persistent stream created:', { persistentStreamId, persistentSessionId });

    await createPeerConnection();
    logger.info('Persistent stream initialized successfully');
  } catch (error) {
    logger.error('Error initializing persistent stream:', error);
    throw error;
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

async function backgroundReconnect() {
  if (connectionState === ConnectionState.RECONNECTING) {
    logger.debug('Background reconnection already in progress. Skipping.');
    return;
  }

  connectionState = ConnectionState.RECONNECTING;
  logger.debug('Starting background reconnection process...');

  try {
    await destroyPersistentStream();
    await new Promise((resolve) => setTimeout(resolve, 300));
    await initializePersistentStream();
    // Remove the warmUpStream call from here
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
  try {
    const urlParams = getUrlParameters();
    currentAvatarId = urlParams.avatarId || '';
    currentContextId = urlParams.contextId || '';
    currentInterfaceMode = urlParams.interfaceMode || 'full';

    await loadContexts(currentContextId);
    await loadAvatars();

    initializeWebSocket();
    initializeAudioContext();
    await initializePersistentStream();

    populateAvatarSelect();
    populateContextSelect();
    updateContextDisplay();

    if (currentInterfaceMode === 'simple') {
      toggleSimpleMode();
    }

    const header = document.querySelector('.header');
    if (header) {
      header.style.display = urlParams.header ? 'flex' : 'none';
    }

    document.body.classList.remove('initializing');
    notifyParentWindowReady();
  } catch (error) {
    console.error('Initialization error:', error);
    showErrorMessage('Failed to initialize the application. Please try refreshing the page.');
  }
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
  if (!hasWarmUpPlayed) {
    await warmUpStream();
    hasWarmUpPlayed = true;
  }
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
    voiceInput.value = 'en-US-AndrewNeural';
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
  const voiceId = document.getElementById('avatar-voice').value || 'en-US-AndrewNeural';
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

async function createPeerConnection() {
  const iceServers = await fetchIceServers();
  const configuration = { iceServers };

  logger.debug('Creating RTCPeerConnection with config:', configuration);
  peerConnection = new RTCPeerConnection(configuration);

  peerConnection.ontrack = handleOnTrack;
  peerConnection.onicecandidate = handleICECandidate;
  peerConnection.oniceconnectionstatechange = handleICEConnectionStateChange;
  peerConnection.onicegatheringstatechange = handleICEGatheringStateChange;
  peerConnection.onsignalingstatechange = handleSignalingStateChange;
  peerConnection.onconnectionstatechange = handleConnectionStateChange;

  pcDataChannel = peerConnection.createDataChannel('data');
  pcDataChannel.onmessage = onStreamEvent;

  const offer = await fetchStreamOffer(persistentStreamId);
  await peerConnection.setRemoteDescription(offer);
  logger.debug('Set remote SDP successfully');

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  logger.debug('Created local SDP successfully');

  await sendSDPAnswer(persistentStreamId, persistentSessionId, answer);
  logger.debug('Peer connection established successfully');
}

function handleOnTrack(event) {
  logger.debug('onTrack event:', event);
  if (event.track.kind === 'video') {
    const streamVideoElement = document.getElementById('stream-video-element');
    if (streamVideoElement) {
      streamVideoElement.srcObject = event.streams[0];
      streamVideoElement.play().catch(e => logger.error('Error playing video:', e));
    }
  }
}

function handleICECandidate(event) {
  logger.debug('New ICE candidate:', event.candidate);
}

function handleICEConnectionStateChange() {
  logger.debug('ICE connection state changed:', peerConnection.iceConnectionState);
}

function handhandleICEGatheringStateChangeleICEGatheringStateChange() {
  logger.debug('ICE gathering state changed:', peerConnection.iceGatheringState);
}

function handleSignalingStateChange() {
  logger.debug('Signaling state changed:', peerConnection.signalingState);
}

function handleConnectionStateChange() {
  logger.debug('Peer connection state changed:', peerConnection.connectionState);
  if (peerConnection.connectionState === 'connected') {
    logger.debug('Peer connection established successfully');
  }
}

function modifySdp(sdp) {
  if (isAndroidWebView()) {
    const sdpLines = sdp.split('\n');
    let videoSectionIndex = -1;
    
    // Find the video section
    for (let i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].startsWith('m=video')) {
        videoSectionIndex = i;
        break;
      }
    }

    if (videoSectionIndex !== -1) {
      // Modify the video section instead of removing it
      sdpLines[videoSectionIndex] = sdpLines[videoSectionIndex].replace('UDP/TLS/RTP/SAVPF', 'UDP/TLS/RTP/SAVPF 96');
      
      // Add necessary attributes for the video section
      sdpLines.splice(videoSectionIndex + 1, 0, 'a=rtpmap:96 VP8/90000');
      sdpLines.splice(videoSectionIndex + 2, 0, 'a=rtcp-fb:96 nack');
      sdpLines.splice(videoSectionIndex + 3, 0, 'a=rtcp-fb:96 nack pli');
      sdpLines.splice(videoSectionIndex + 4, 0, 'a=rtcp-fb:96 ccm fir');
    }

    sdp = sdpLines.join('\n');
    logger.debug('Modified SDP for Android WebView:', sdp);
  }
  return sdp;
}

function isAndroidWebView() {
  const userAgent = navigator.userAgent.toLowerCase();
  return /android/.test(userAgent) && /wv/.test(userAgent);
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

function onVideoStatusChange(videoIsPlaying) {
  if (videoIsPlaying === lastVideoStatus) {
    return; // No change, ignore
  }

  logger.debug(`Video status changing from ${lastVideoStatus} to ${videoIsPlaying ? 'streaming' : ''}`);

  lastVideoStatus = videoIsPlaying;

  const streamVideoElement = document.getElementById('stream-video-element');
  const idleVideoElement = document.getElementById('idle-video-element');

  if (!streamVideoElement || !idleVideoElement) {
    logger.error('Video elements not found');
    return;
  }

  smoothTransition(videoIsPlaying);

  const streamingStatusLabel = document.getElementById('streaming-status-label');
  if (streamingStatusLabel) {
    streamingStatusLabel.innerText = videoIsPlaying ? 'streaming' : '';
    streamingStatusLabel.className = 'streamingState-' + (videoIsPlaying ? 'streaming' : '');
  }
}


function setStreamVideoElement(stream) {
  const streamVideoElement = document.getElementById('stream-video-element');
  if (!streamVideoElement) {
    logger.error('Stream video element not found');
    return;
  }

  logger.debug('Setting stream video element');
  streamVideoElement.srcObject = stream;
  streamVideoElement.onloadedmetadata = () => {
    logger.debug('Stream video metadata loaded');
    streamVideoElement.play().catch(e => logger.error('Error playing stream video:', e));
  };
}

function onStreamingComplete() {
  logger.debug('Streaming completed, transitioning to idle state');
  isCurrentlyStreaming = false;
  onVideoStatusChange(false, null);
}


function onStreamEvent(event) {
  const [eventType, eventData] = event.data.split('|');
  switch (eventType) {
    case 'stream-started':
      logger.debug('Stream started');
      break;
    case 'stream-ended':
      logger.debug('Stream ended');
      stopStreaming();
      break;
    default:
      logger.debug('Unknown stream event:', eventType, eventData);
  }
}




function handleStreamStarted() {
  clearTimeout(transitionDebounceTimer);
  transitionDebounceTimer = setTimeout(() => {
    logger.debug('Stream started');
    isWaitingForStream = false;
    if (!isCurrentlyStreaming) {
      isCurrentlyStreaming = true;
      smoothTransition(true);
    }
  }, 100);
}




function handleStreamDone() {
  clearTimeout(transitionDebounceTimer);
  transitionDebounceTimer = setTimeout(() => {
    logger.debug('Stream done');
    isCurrentlyStreaming = false;
    smoothTransition(false);
    hasWarmUpPlayed = true;
    updateStreamEventLabel('');
  }, 100);
  hasWarmUpPlayed = true;
  updateStreamEventLabel('');
}



function handleStreamReady() {
  logger.debug('Stream ready');
  isStreamReady = true;
  if (isWaitingForStream) {
    isWaitingForStream = false;
    startStreaming();
  }
}


function handleStreamError() {
  logger.error('Stream error occurred');
  isCurrentlyStreaming = false;
  isWaitingForStream = false;
  onVideoStatusChange(false);
  hasWarmUpPlayed = true;
  updateStreamEventLabel('');
}


function updateStreamEventLabel(status) {
  const streamEventLabel = document.getElementById('streaming-status-label');
  if (streamEventLabel) {
    streamEventLabel.textContent = status;
  } else {
    console.warn('Streaming status label element not found');
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
            const currentTime = Date.now();
            const isReceivingVideo = report.bytesReceived > lastBytesReceived;

            if (isReceivingVideo) {
              lastActivityTime = currentTime;
              if (!isCurrentlyStreaming) {
                // Start of a new stream
                isCurrentlyStreaming = true;
                streamStartTime = currentTime;
                onVideoStatusChange(true, event.streams[0]);
              }
            } else if (isCurrentlyStreaming && (currentTime - lastActivityTime > IDLE_TIMEOUT)) {
              // Transition to idle state
              isCurrentlyStreaming = false;
              onVideoStatusChange(false, event.streams[0]);
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
  }, 50); // Check every 100ms

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

async function fetchWithRetries(url, options, retries = 3, delay = 1000) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      logger.warn(`Fetch failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetries(url, options, retries - 1, delay * 2);
    } else {
      logger.error(`Fetch failed after retries:`, error);
      throw error;
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
        compatibility_mode: "on",
        config: {
          fluent: true,
          stitch: true,
          pad_audio: 0.5,
          auto_match: true,
          align_driver: true,
          normalization_factor: 0.1,
          align_expand_factor: 0.3,
          motion_factor: 0.55,
          result_format: 'mp4'
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

    await new Promise((resolve) => setTimeout(resolve, 3000));

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


async function startStreaming(reply) {
  if (isStreaming || isTransitioning) {
    console.warn('Already streaming or transitioning');
    return;
  }
  isTransitioning = true;
  
  try {
    if (!sessionId || !streamId) {
      await initializePersistentStream();
    }

    const streamResponse = await fetchWithRetries(`${DID_API.url}/talks/streams/${streamId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script: {
          type: 'text',
          input: reply,
        },
        driver_url: 'bank://lively/',
        config: {
          stitch: true,
        },
        session_id: sessionId,
      }),
    });

    if (!streamResponse.ok) {
      throw new Error(`HTTP error ${streamResponse.status}`);
    }

    isStreaming = true;
    updateStreamStatus('Streaming');
    ws.send(JSON.stringify({ type: 'updateStreamStatus', status: 'Streaming' }));
  } catch (error) {
    console.error('Error starting stream:', error);
    updateStreamStatus('Error');
  } finally {
    isTransitioning = false;
  }
}

function stopStreaming() {
  if (!isStreaming) return;
  
  try {
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    if (pcDataChannel) {
      pcDataChannel.close();
      pcDataChannel = null;
    }

    isStreaming = false;
    updateStreamStatus('Idle');
    ws.send(JSON.stringify({ type: 'updateStreamStatus', status: 'Idle' }));
  } catch (error) {
    console.error('Error stopping stream:', error);
    updateStreamStatus('Error');
  }
}


function toggleSimpleMode() {
  const fullModeElements = document.querySelectorAll('.full-mode');
  const simpleModeElements = document.querySelectorAll('.simple-mode');
  const simpleModeButtton = document.getElementById('simple-mode-button');

  fullModeElements.forEach(el => el.classList.toggle('hidden'));
  simpleModeElements.forEach(el => el.classList.toggle('hidden'));

  if (simpleModeButtton.textContent === 'Simple Mode') {
    simpleModeButtton.textContent = 'Full Mode';
    currentInterfaceMode = 'simple';
  } else {
    simpleModeButtton.textContent = 'Simple Mode';
    currentInterfaceMode = 'full';
  }

  // Update URL with new interface mode
  const url = new URL(window.location);
  url.searchParams.set('interfaceMode', currentInterfaceMode);
  window.history.pushState({}, '', url);
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

async function sendChatToGroq(message) {
  try {
    const context = getCurrentContext();
    chatHistory.push({ role: 'user', content: message });

    const messages = [
      { role: 'system', content: 'You are a helpful, harmless, and honest grocery store assistant. Please answer the users questions briefly, be concise. Reply with 1 sentance in SSML syntax.' },
      { role: 'system', content: context },
      ...chatHistory
    ];

    logger.debug('Sending chat to Groq...');
    logger.debug('Request body:', JSON.stringify({ messages, model: 'llama-3.1-8b-instant' }));

    const startTime = Date.now();
    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model: 'llama-3.1-8b-instant' })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    let accumulatedResponse = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      logger.debug('Received chunk:', chunk);

      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonData = line.slice(6);
          if (jsonData === '[DONE]') {
            logger.debug('Groq processing completed');
            break;
          }
          try {
            const parsedData = JSON.parse(jsonData);
            const content = parsedData.choices[0]?.delta?.content || '';
            accumulatedResponse += content;
            logger.debug('Parsed content:', content);
          } catch (error) {
            logger.error('Error parsing JSON:', error);
          }
        }
      }
    }

    const endTime = Date.now();
    logger.debug(`Groq processing completed in ${endTime - startTime}ms`);

    chatHistory.push({ role: 'assistant', content: accumulatedResponse });
    logger.debug('Assistant reply:', accumulatedResponse);

    return accumulatedResponse;
  } catch (error) {
    logger.error('Error in sendChatToGroq:', error);
    throw error;
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
  toggleSimpleMode,
  speakDirectly,
  stopStreaming,
  startStreaming,
  updateChatHistory
};

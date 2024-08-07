import { ConnectionState, initializePersistentStream, destroyPersistentStream, reinitializePersistentStream, createNewPersistentStream, backgroundReconnect, createPeerConnection, onIceGatheringStateChange, onIceCandidate, onIceConnectionStateChange, onConnectionStateChange, onSignalingStateChange, onTrack, startConnectionHealthCheck, attemptReconnect, stopAllStreams, closePC, fetchWithRetries, initializeConnection, reinitializeConnection, cleanupOldStream, setConnectionState } from './connection-manager.js';
import { initializeTransitionCanvas, smoothTransition, getVideoElements, onVideoStatusChange, setStreamVideoElement, playIdleVideo, prepareForStreaming } from './video-manager.js';
import logger from './logger.js';
import DID_API from './api.js';

const { createClient, LiveTranscriptionEvents } = deepgram;

const deepgramClient = createClient(DID_API.deepgramKey);

let socket;
let isDebugMode = false;
let isAvatarSpeaking = false;
let autoSpeakInProgress = false;

let avatars = {};
let currentAvatar = '';

const avatarSelect = document.getElementById('avatar-select');
avatarSelect.addEventListener('change', handleAvatarChange);

let context = `
`;

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

async function initialize() {
  logger.setLogLevel('DEBUG');
  setConnectionState(ConnectionState.DISCONNECTED);

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
    await initializePersistentStream();
    startConnectionHealthCheck();
    hideLoadingSymbol();
  } catch (error) {
    logger.error('Error during initialization:', error);
    hideLoadingSymbol();
    showErrorMessage('Failed to connect. Please try again.');
    connectionState = ConnectionState.DISCONNECTED;
  }

  // Set up reconnection mechanism
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

  // Handle visibility change
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && connectionState === ConnectionState.DISCONNECTED) {
      logger.info('Page became visible. Checking connection...');
      if (navigator.onLine) {
        backgroundReconnect();
      }
    }
  });

  logger.info('Initialization complete');
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

  await destroyPersistentStream();
  await initializePersistentStream();
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
    voiceInput.value = 'en-US-GuyNeural';
    imagePreview.src = '';
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

  if (!name) {
    showErrorMessage('Please fill in the avatar name.');
    return;
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('voiceId', voiceId);
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
            avatars[name] = data.avatar;
            populateAvatarSelect();
            closeAvatarModal();
            showToast('Avatar created successfully!', 3000);
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

async function startStreaming(assistantReply) {
  try {
    logger.debug('Starting streaming with reply:', assistantReply);
    if (!persistentStreamId || !persistentSessionId) {
      logger.error('Persistent stream not initialized. Cannot start streaming.');
      await initializePersistentStream();
    }

    if (!currentAvatar || !avatars[currentAvatar]) {
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
            input: chunk, // Send the chunk without additional <speak> tags
            ssml: true,
            provider: {
              type: 'microsoft',
              voice_id: avatars[currentAvatar].voiceId,
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
            result_format: 'mp4',
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
  const content = document.getElementById('content');
  const videoWrapper = document.getElementById('video-wrapper');
  const simpleModeButton = document.getElementById('simple-mode-button');
  const header = document.querySelector('.header');
  const autoSpeakToggle = document.getElementById('auto-speak-toggle');
  const startButton = document.getElementById('start-button');

  if (content.style.display !== 'none') {
    // Entering simple mode
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

    // Turn on auto-speak if it's not already on
    if (autoSpeakToggle.textContent.includes('Off')) {
      autoSpeakToggle.click();
    }

    // Start recording if it's not already recording
    if (startButton.textContent === 'Speak') {
      startButton.click();
    }
  } else {
    // Exiting simple mode
    content.style.display = 'flex';
    const leftColumn = document.getElementById('left-column');
    leftColumn.appendChild(videoWrapper);
    videoWrapper.style.position = 'relative';
    videoWrapper.style.top = 'auto';
    videoWrapper.style.left = 'auto';
    videoWrapper.style.transform = 'none';
    simpleModeButton.textContent = 'Simple Mode';
    simpleModeButton.classList.remove('simple-mode');
    header.style.position = 'static';
    header.style.width = 'auto';

    // Turn off auto-speak
    if (autoSpeakToggle.textContent.includes('On')) {
      autoSpeakToggle.click();
    }

    // Stop recording
    if (startButton.textContent === 'Stop') {
      startButton.click();
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
      logger.warn(
        'Deepgram connection not open, cannot send audio data. ReadyState:',
        deepgramConnection ? deepgramConnection.getReadyState() : 'undefined',
      );
    }
  };

  logger.debug('Audio data sending setup complete');
}

function handleTranscription(data) {
  if (!isRecording) return;

  const transcript = data.channel.alternatives[0].transcript;
  if (data.is_final) {
    logger.debug('Final transcript:', transcript);
    if (transcript.trim()) {
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
    logger.debug('Interim transcript:', transcript);
    updateTranscript(currentUtterance + transcript, false);
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
      model: 'nova-2',
      language: 'en-US',
      smart_format: true,
      interim_results: true,
      utterance_end_ms: 2500,
      punctuate: true,
      // endpointing: 300,
      vad_events: true,
      encoding: 'linear16',
      sample_rate: audioContext.sampleRate,
    };

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
      handleTranscription(data);
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.UtteranceEnd, (data) => {
      logger.debug('Utterance end event received:', data);
      handleUtteranceEnd(data);
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Error, (err) => {
      logger.error('Deepgram error:', err);
      handleDeepgramError(err);
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Warning, (warning) => {
      logger.warn('Deepgram warning:', warning);
    });

    isRecording = true;
    if (autoSpeakMode) {
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

    // Start streaming the entire response
    await startStreaming(assistantReply);
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

function updateAssistantReply(text) {
  document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${text}</span><br>`;
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
  toggleAutoSpeak,
  initializePersistentStream,
  destroyPersistentStream,
};
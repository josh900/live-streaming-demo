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


const avatars = {
  brad: {
    idleImage: 'https://skoop-general.s3.amazonaws.com/brad_idle.png',
    idleVideo: 'brad_idle.mp4',
    voice: 'en-US-ChristopherNeural'
  },
  emma: {
    idleImage: 'https://skoop-general.s3.amazonaws.com/emma_idle.png',
    idleVideo: 'emma_idle.mp4',
    voice: 'en-US-AvaNeural'
  }
};

let currentAvatar = 'brad';

const avatarSelect = document.getElementById('avatar-select');
avatarSelect.addEventListener('change', handleAvatarChange);

const maxRetryCount = 3;
const maxDelaySec = 4;

const context = `
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

function smoothTransition(duration = 500) {
  if (!transitionCanvas) {
    initTransitionCanvas();
  }

  const startTime = performance.now();
  
  function animate() {
    const now = performance.now();
    const progress = Math.min((now - startTime) / duration, 1);
    
    const blendedFrame = blendFrames(idleVideoElement, streamVideoElement, progress);
    transitionCtx.clearRect(0, 0, transitionCanvas.width, transitionCanvas.height);
    transitionCtx.drawImage(blendedFrame, 0, 0);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      transitionCanvas.style.display = 'none';
    }
  }
  
  transitionCanvas.style.display = 'block';
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
  const interimSpan = msgHistory.querySelector('span[data-interim]');
  
  if (isFinal) {
    if (interimSpan) {
      interimSpan.remove();
    }
    msgHistory.innerHTML += `<span><u>User:</u> ${text}</span><br>`;
    logger.info('Final transcript added to chat history:', text);
  } else {
    if (interimSpan) {
      interimSpan.innerHTML = `<u>User (interim):</u> ${text}`;
    } else {
      msgHistory.innerHTML += `<span data-interim style='opacity:0.5'><u>User (interim):</u> ${text}</span><br>`;
    }
    // Scroll to the bottom of the chat history
    msgHistory.scrollTop = msgHistory.scrollHeight;
  }
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
  logger.info('Set remote SDP');

  const sessionClientAnswer = await peerConnection.createAnswer();
  logger.info('Created local SDP');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  logger.info('Set local SDP');

  return sessionClientAnswer;
}

function onIceGatheringStateChange() {
  const { iceGathering: iceGatheringStatusLabel } = getStatusLabels();
  if (iceGatheringStatusLabel) {
    iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
    iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
  }
  logger.info('ICE gathering state changed:', peerConnection.iceGatheringState);
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
  logger.info('ICE connection state changed:', peerConnection.iceConnectionState);

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
  logger.info('Peer connection state changed:', peerConnection.connectionState);
}

function onSignalingStateChange() {
  const { signaling: signalingStatusLabel } = getStatusLabels();
  if (signalingStatusLabel) {
    signalingStatusLabel.innerText = peerConnection.signalingState;
    signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
  }
  logger.info('Signaling state changed:', peerConnection.signalingState);
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
  logger.info('Video status changed:', status);
}

function setStreamVideoElement(stream) {
  const { stream: streamVideoElement } = getVideoElements();
  if (!streamVideoElement) {
    logger.error('Stream video element not found');
    return;
  }

  smoothTransition();
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
              logger.info('Video status changed:', videoIsPlaying);
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
      logger.info('Video playback started');
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
    logger.info('Stopping video streams');
    streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    streamVideoElement.srcObject = null;
    
    smoothTransition();
  }
}

function closePC(pc = peerConnection) {
  if (!pc) return;
  logger.info('Stopping peer connection');
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
  logger.info('Stopped peer connection');
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
    logger.info('Starting streaming with reply:', assistantReply);
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
    logger.info('Streaming response:', playResponseData);

    if (playResponseData.status === 'started') {
      logger.info('Stream started successfully');
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

async function startRecording() {
  logger.info('Starting recording process...');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    logger.info('Microphone stream obtained');
    
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = 'recorded_audio.webm';
      link.click();
      
      audioChunks = [];
    };

    mediaRecorder.start();
    logger.info('MediaRecorder started');

    audioContext = new AudioContext();
    logger.info('Audio context created. Sample rate:', audioContext.sampleRate);
    
    logger.info('Adding audio worklet module...');
    await audioContext.audioWorklet.addModule('audio-processor.js');
    logger.info('Audio worklet module added successfully');
    
    const source = audioContext.createMediaStreamSource(stream);
    logger.info('Media stream source created');
    
    audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
    logger.info('Audio worklet node created');
    
    source.connect(audioWorkletNode);
    logger.info('Media stream source connected to audio worklet node');

    deepgramConnection = deepgramClient.listen.live({
      model: "general",
      language: "en-US",
      smart_format: true,
      interim_results: true,
      utterance_end_ms: 500,
      punctuate: true,
      encoding: "linear16",
      sample_rate: audioContext.sampleRate,
    });
    
    logger.info('Deepgram connection created with options:', {
      model: "general",
      language: "en-US",
      smart_format: true,
      interim_results: true,
      utterance_end_ms: 500,
      punctuate: true,
      encoding: "linear16",
      sample_rate: audioContext.sampleRate,
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Open, () => {
      logger.info('Deepgram WebSocket Connection opened');
      startSendingAudioData();
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Close, () => {
      logger.info('Deepgram WebSocket connection closed');
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Transcript, (data) => {
      logger.info('Received transcription:', JSON.stringify(data));
      handleTranscription(data);
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Error, (err) => {
      logger.error('Deepgram error:', err);
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Warning, (warning) => {
      logger.warn('Deepgram warning:', warning);
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.UtteranceEnd, (data) => {
      logger.info('Utterance end event received:', data);
      handleUtteranceEnd(data);
    });

    logger.info('Recording and transcription started successfully');
  } catch (error) {
    logger.error('Error starting recording:', error);
  }
}

function startSendingAudioData() {
  logger.info('Starting to send audio data...');

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
          logger.info(`Sent ${packetCount} audio packets to Deepgram. Total bytes: ${totalBytesSent}`);
        }
      } catch (error) {
        logger.error('Error sending audio data to Deepgram:', error);
      }
    } else {
      logger.warn('Deepgram connection not open, cannot send audio data. ReadyState:', deepgramConnection ? deepgramConnection.getReadyState() : 'undefined');
    }
  };

  logger.info('Audio data sending setup complete');
}

function handleTranscription(data) {
  const transcript = data.channel.alternatives[0].transcript;
  if (data.is_final) {
    logger.info('Final transcript:', transcript);
    currentUtterance += transcript + ' ';
    updateTranscript(currentUtterance, false);
  } else {
    logger.info('Interim transcript:', transcript);
    updateTranscript(currentUtterance + transcript, false);
  }
}



function handleUtteranceEnd(data) {
  logger.info('Utterance end detected:', data);
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


function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    logger.info('MediaRecorder stopped');
  }
  
  if (audioContext) {
    audioContext.close();
    logger.info('AudioContext closed');
  }
  
  if (deepgramConnection) {
    deepgramConnection.finish();
    logger.info('Deepgram connection finished');
  }
  
  logger.info('Recording and transcription stopped');
}

async function sendChatToGroq() {
  logger.info('Sending chat to Groq...');
  try {
    const startTime = Date.now();
    const requestBody = {
      messages: [
        {
          role: 'system',
          content: context + (additionalContext ? ' ' + additionalContext : ''),
        },
        ...chatHistory,
      ],
      model: 'mixtral-8x7b-32768',
    };
    logger.info('Request body:', JSON.stringify(requestBody));

    const response = await fetch('/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    logger.info('Groq response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const reader = response.body.getReader();
    let assistantReply = '';
    let done = false;

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
              logger.debug('Parsed content:', content);
            } catch (error) {
              logger.error('Error parsing JSON:', error);
            }
          }
        }
      }
    }

    const endTime = Date.now();
    const processingTime = endTime - startTime;
    logger.info(`Groq processing completed in ${processingTime}ms`);

    chatHistory.push({
      role: 'assistant',
      content: assistantReply,
    });

    logger.info('Updating chat history in UI');
    const msgHistory = document.getElementById('msgHistory');
    msgHistory.innerHTML += `<span><u>Assistant:</u> ${assistantReply}</span><br>`;
    msgHistory.scrollTop = msgHistory.scrollHeight;

    logger.info('Assistant reply:', assistantReply);

    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
      if (isRecording) {
        logger.info('Inactivity timeout reached. Stopping recording.');
        startButton.click();
      }
    }, 45000); // 45 seconds

    await startStreaming(assistantReply);
  } catch (error) {
    logger.error('Error in sendChatToGroq:', error);
    if (isRecording) {
      await reinitializeConnection();
    }
  }
}

async function reinitializeConnection() {
  if (isInitializing) {
    logger.warn('Connection initialization already in progress. Skipping reinitialize.');
    return;
  }

  isInitializing = true;
  logger.info('Reinitializing connection...');

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
      logger.info('Existing connection is still active. Reusing connection.');
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

    logger.info('Stream destroyed successfully');
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
    startButton.textContent = 'Stop';
    logger.info('Starting recording...');
    await startRecording();
    isRecording = true;
    logger.info('Recording started');
  } else {
    startButton.textContent = 'Speak';
    logger.info('Stopping recording...');
    stopRecording();
    isRecording = false;
    logger.info('Recording stopped');
  }
};

document.getElementById('save-context').addEventListener('click', () => {
  const contextInput = document.getElementById('context-input');
  additionalContext = contextInput.value.trim();
  contextInput.value = '';
  showToast('Context saved successfully!');
});

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show';
  setTimeout(() => {
    toast.className = toast.className.replace('show', '');
  }, 3000);
}

// Initialize WebSocket connection
initializeWebSocket();

// Initialize the connection when the page loads
initializeConnection().catch(error => {
  logger.error('Failed to initialize connection:', error);
  showErrorMessage('Failed to initialize connection. Please try again.');
});

export function setLogLevel(level) {
  logger.setLogLevel(level);
}
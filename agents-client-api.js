// agents-client-api.js

'use strict';

// Import configuration
import config from './config.js';

// Logging levels
const LOG_LEVELS = {
  BASIC: 'basic',
  ADVANCED: 'advanced'
};

let currentLogLevel = LOG_LEVELS.BASIC;

// Logging function
function log(message, level = LOG_LEVELS.BASIC) {
  if (level === currentLogLevel || currentLogLevel === LOG_LEVELS.ADVANCED) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

// Set log level
function setLogLevel(level) {
  if (Object.values(LOG_LEVELS).includes(level)) {
    currentLogLevel = level;
    log(`Log level set to: ${level}`, LOG_LEVELS.BASIC);
  } else {
    console.error('Invalid log level');
  }
}

// Initially set to BASIC
setLogLevel(LOG_LEVELS.BASIC);

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

const context = `You are a helpful, harmless, and honest assistant. Please answer the users questions briefly, be concise, not more than 1 sentence unless absolutely needed.`;

const videoElement = document.getElementById('video-element');
videoElement.setAttribute('playsinline', '');
const peerStatusLabel = document.getElementById('peer-status-label');
const iceStatusLabel = document.getElementById('ice-status-label');
const iceGatheringStatusLabel = document.getElementById('ice-gathering-status-label');
const signalingStatusLabel = document.getElementById('signaling-status-label');
const streamingStatusLabel = document.getElementById('streaming-status-label');

window.onload = async (event) => {
  log('Page loaded, initializing...', LOG_LEVELS.BASIC);
  initializeIdleVideo();
  showLoadingSymbol();
  try {
    await initializeConnection();
    hideLoadingSymbol();
    log('Connection initialized successfully', LOG_LEVELS.BASIC);
  } catch (error) {
    console.error('Error during auto-initialization:', error);
    hideLoadingSymbol();
    showErrorMessage('Failed to connect. Please try again.');
  }
};

function initializeIdleVideo() {
  log('Initializing idle video', LOG_LEVELS.ADVANCED);
  videoElement.src = config.idleVideoUrl;
  videoElement.loop = true;
  videoElement.muted = true;
  videoElement.playsInline = true;
  
  videoElement.play().catch(error => {
    console.warn("Autoplay was prevented for idle video:", error);
    showPlayButton();
  });
}

function playIdleVideo() {
  log('Playing idle video', LOG_LEVELS.ADVANCED);
  if (videoElement.src !== config.idleVideoUrl) {
    videoElement.src = config.idleVideoUrl;
  }
  videoElement.loop = true;
  videoElement.muted = true;
  videoElement.currentTime = 0;
  
  videoElement.play().catch(error => {
    console.warn("Playback of idle video was prevented:", error);
    showPlayButton();
  });
}

function showPlayButton() {
  log('Showing play button', LOG_LEVELS.ADVANCED);
  const playButton = document.createElement('button');
  playButton.textContent = 'Play Idle Video';
  playButton.style.position = 'absolute';
  playButton.style.zIndex = '1000';
  playButton.style.top = '50%';
  playButton.style.left = '50%';
  playButton.style.transform = 'translate(-50%, -50%)';
  playButton.onclick = () => {
    videoElement.play();
    playButton.remove();
  };
  videoElement.parentElement.appendChild(playButton);
}

function setVideoElement(stream) {
  if (!stream) {
    log('No stream available, playing idle video', LOG_LEVELS.ADVANCED);
    playIdleVideo();
    return;
  }

  log('Setting video element with stream', LOG_LEVELS.ADVANCED);
  videoElement.srcObject = stream;
  videoElement.muted = false;
  videoElement.loop = false;

  videoElement.play().then(() => {
    log('Video playback started', LOG_LEVELS.ADVANCED);
  }).catch(e => {
    console.error('Error playing video:', e);
    showPlayButton();
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

  document.getElementById('destroy-button').style.display = 'inline-block';
  document.getElementById('connect-button').style.display = 'inline-block';
}

async function createPeerConnection(offer, iceServers) {
  log('Creating peer connection', LOG_LEVELS.ADVANCED);
  if (!peerConnection) {
    const config = {
      iceServers,
      sdpSemantics: 'unified-plan'
    };
    peerConnection = new RTCPeerConnection(config);
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);

    peerConnection.addTransceiver('audio', {direction: 'recvonly'});
    peerConnection.addTransceiver('video', {direction: 'recvonly'});
  }

  await peerConnection.setRemoteDescription(offer);
  log('Set remote SDP', LOG_LEVELS.ADVANCED);

  const sessionClientAnswer = await peerConnection.createAnswer();
  log('Created local SDP', LOG_LEVELS.ADVANCED);

  await peerConnection.setLocalDescription(sessionClientAnswer);
  log('Set local SDP', LOG_LEVELS.ADVANCED);

  return sessionClientAnswer;
}

function onIceGatheringStateChange() {
  iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
  iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
  log(`ICE gathering state changed: ${peerConnection.iceGatheringState}`, LOG_LEVELS.ADVANCED);
}

function onIceCandidate(event) {
  if (event.candidate) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;
    log(`ICE candidate: ${JSON.stringify(event.candidate)}`, LOG_LEVELS.ADVANCED);

    fetch(`${config.didApi.url}/${config.didApi.service}/streams/${streamId}/ice`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${config.didApi.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate,
        sdpMid,
        sdpMLineIndex,
        session_id: sessionId,
      }),
    });
  }
}

function onIceConnectionStateChange() {
  iceStatusLabel.innerText = peerConnection.iceConnectionState;
  iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
  log(`ICE connection state changed: ${peerConnection.iceConnectionState}`, LOG_LEVELS.ADVANCED);

  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
    showErrorMessage('Connection lost. Please try again.');
  }
}

function onConnectionStateChange() {
  peerStatusLabel.innerText = peerConnection.connectionState;
  peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
  log(`Peer connection state changed: ${peerConnection.connectionState}`, LOG_LEVELS.ADVANCED);
}

function onSignalingStateChange() {
  signalingStatusLabel.innerText = peerConnection.signalingState;
  signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
  log(`Signaling state changed: ${peerConnection.signalingState}`, LOG_LEVELS.ADVANCED);
}

function onVideoStatusChange(videoIsPlaying, stream) {
  let status;
  if (videoIsPlaying) {
    status = 'streaming';
    setVideoElement(stream);
  } else {
    status = 'empty';
    playIdleVideo();
  }
  streamingStatusLabel.innerText = status;
  streamingStatusLabel.className = 'streamingState-' + status;
  log(`Video status changed: ${status}`, LOG_LEVELS.ADVANCED);
}

function onTrack(event) {
  log('onTrack event:', event, LOG_LEVELS.ADVANCED);
  if (!event.track) return;

  if (statsIntervalId) {
    clearInterval(statsIntervalId);
  }

  statsIntervalId = setInterval(async () => {
    if (peerConnection && peerConnection.connectionState === 'connected') {
      try {
        const stats = await peerConnection.getStats(event.track);
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived;

            if (videoStatusChanged) {
              videoIsPlaying = report.bytesReceived > lastBytesReceived;
              onVideoStatusChange(videoIsPlaying, event.streams[0]);
            }
            lastBytesReceived = report.bytesReceived;
          }
        });
      } catch (error) {
        console.error('Error getting stats:', error);
      }
    } else {
      log('Peer connection not ready for stats.', LOG_LEVELS.ADVANCED);
    }
  }, 1000);

  setVideoElement(event.streams[0]);
}

function stopAllStreams() {
  log('Stopping all streams', LOG_LEVELS.ADVANCED);
  if (videoElement.srcObject) {
    videoElement.srcObject.getTracks().forEach((track) => track.stop());
    videoElement.srcObject = null;
  }
}

function closePC(pc = peerConnection) {
  if (!pc) return;
  log('Closing peer connection', LOG_LEVELS.ADVANCED);
  pc.close();
  pc.removeEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
  pc.removeEventListener('icecandidate', onIceCandidate, true);
  pc.removeEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
  pc.removeEventListener('connectionstatechange', onConnectionStateChange, true);
  pc.removeEventListener('signalingstatechange', onSignalingStateChange, true);
  pc.removeEventListener('track', onTrack, true);
  clearInterval(statsIntervalId);
  iceGatheringStatusLabel.innerText = '';
  signalingStatusLabel.innerText = '';
  iceStatusLabel.innerText = '';
  peerStatusLabel.innerText = '';
  log('Peer connection closed', LOG_LEVELS.ADVANCED);
  if (pc === peerConnection) {
    peerConnection = null;
  }
}

async function fetchWithRetries(url, options, retries = 1) {
  const maxRetryCount = 2;
  const maxDelaySec = 2;
  try {
    const response = await fetch(url, options);
    if (response.ok) {
      return response;
    } else {
      throw new Error(`HTTP error ${response.status}`);
    }
  } catch (err) {
    if (retries <= maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
      log(`Request failed, retrying ${retries}/${maxRetryCount}. Error ${err}`, LOG_LEVELS.ADVANCED);
      return fetchWithRetries(url, options, retries + 1);
    } else {
      throw new Error(`Max retries exceeded. error: ${err}`);
    }
  }
}

async function initializeConnection() {
  log('Initializing connection', LOG_LEVELS.BASIC);
  if (peerConnection && peerConnection.connectionState === 'connected') {
    log('Already connected', LOG_LEVELS.BASIC);
    return;
  }
  stopAllStreams();
  closePC();

  const sessionResponse = await fetchWithRetries(`${config.didApi.url}/${config.didApi.service}/streams`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${config.didApi.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: config.avatarImageUrl,
      output_resolution: 720,
      stream_warmup: true,
      audio_codec: 'opus', // Using Opus for better audio quality and lower latency
    }),
  });

  const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
  streamId = newStreamId;
  sessionId = newSessionId;
  try {
    sessionClientAnswer = await createPeerConnection(offer, iceServers);
  } catch (e) {
    console.error('Error during streaming setup', e);
    stopAllStreams();
    closePC();
    throw e;
  }

  await fetch(`${config.didApi.url}/${config.didApi.service}/streams/${streamId}/sdp`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${config.didApi.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      answer: sessionClientAnswer,
      session_id: sessionId,
    }),
  });

  log('Connection initialized', LOG_LEVELS.BASIC);

  // Start keep-alive mechanism
  startKeepAlive();
}

function startKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  
  keepAliveInterval = setInterval(async () => {
    try {
      await fetch(`${config.didApi.url}/${config.didApi.service}/streams/${streamId}/keepalive`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${config.didApi.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
      log('Keep-alive sent', LOG_LEVELS.ADVANCED);
    } catch (error) {
      console.error('Error sending keep-alive:', error);
    }
  }, 30000); // Send keep-alive every 30 seconds
}

async function startStreaming(assistantReply) {
  try {
    log('Starting streaming', LOG_LEVELS.BASIC);
    const playResponse = await fetchWithRetries(`${config.didApi.url}/${config.didApi.service}/streams/${streamId}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${config.didApi.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script: {
          type: 'text',
          input: assistantReply,
          provider: {
            type: 'microsoft',
            voice_id: 'en-US-JennyMultilingualV2Neural'
          }
        },
        config: {
          fluent: true,
          pad_audio: 0,
          stitch: true,
          reduction_factor: 1.5 // Adjust this for faster response times
        },
        session_id: sessionId,
      }),
    });

    videoElement.muted = false;
    log('Streaming started', LOG_LEVELS.BASIC);
  } catch (error) {
    console.error('Error during streaming:', error);
    if (isRecording) {
      await reinitializeConnection();
    }
  }
}

async function startRecording() {
  log('Starting recording', LOG_LEVELS.BASIC);
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  deepgramSocket = new WebSocket('wss://api.deepgram.com/v1/listen', [
    'token',
    config.deepgramKey,
  ]);

  deepgramSocket.onopen = () => {
    log('Deepgram WebSocket opened', LOG_LEVELS.ADVANCED);
    mediaRecorder.addEventListener('dataavailable', async (event) => {
      if (event.data.size > 0 && deepgramSocket.readyState === 1) {
        deepgramSocket.send(event.data);
      }
    });
    mediaRecorder.start(250); // Reduce chunk size for faster transmission

    setInterval(() => {
      if (deepgramSocket.readyState === 1) {
        deepgramSocket.send(JSON.stringify({ type: "KeepAlive" }));
        log("Sent KeepAlive message to Deepgram", LOG_LEVELS.ADVANCED);
      }
    }, 3000);

    transcriptionTimer = setInterval(() => {
      if (transcript.trim() !== '') {
        document.getElementById('msgHistory').innerHTML += `<span style='opacity:0.5'><u>User:</u> ${transcript}</span><br>`;
        chatHistory.push({
          role: 'user',
          content: transcript,
        });
        sendChatToGroq();
        transcript = '';
      }
    }, 1000); // Reduce interval for faster response
  };

  deepgramSocket.onmessage = (message) => {
    const received = JSON.parse(message.data);
    const partialTranscript = received.channel.alternatives[0].transcript;

    if (partialTranscript) {
      transcript += partialTranscript;
      document.getElementById('msgHistory').innerHTML = document.getElementById('msgHistory').innerHTML.replace(/<span style='opacity:0.5'><u>User \(interim\):<\/u>.*<\/span><br>/, `<span style='opacity:0.5'><u>User (interim):</u> ${transcript}</span><br>`);
      log(`Partial transcript: ${partialTranscript}`, LOG_LEVELS.ADVANCED);
    }
  };

  deepgramSocket.onclose = async () => {
    log('Deepgram WebSocket closed', LOG_LEVELS.ADVANCED);
    if (isRecording) {
      await reinitializeConnection();
    }
  };

  // Start inactivity timeout
  inactivityTimeout = setTimeout(() => {
    if (isRecording) {
      log('Inactivity timeout reached. Stopping recording.', LOG_LEVELS.BASIC);
      document.getElementById('start-button').click();
    }
  }, 45000); // 45 seconds
}

async function stopRecording() {
  log('Stopping recording', LOG_LEVELS.BASIC);
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    deepgramSocket.send(JSON.stringify({ type: "CloseStream" }));
    deepgramSocket.close();
    mediaRecorder = null;
  }

  clearInterval(transcriptionTimer);
  clearTimeout(inactivityTimeout);
}

async function sendChatToGroq() {
  try {
    log('Sending chat to Groq', LOG_LEVELS.BASIC);
    const response = await fetch(config.groqServerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: context,
          },
          ...chatHistory,
        ],
        model: 'mixtral-8x7b-32768',
      }),
    });

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
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            if (data === '[DONE]') {
              done = true;
              break;
            }

            const parsed = JSON.parse(data);
            assistantReply += parsed.choices[0]?.delta?.content || '';
          }
        }
      }
    }

    chatHistory.push({
      role: 'assistant',
      content: assistantReply,
    });

    document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${assistantReply}</span><br>`;

    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
      if (isRecording) {
        log('Inactivity timeout reached. Stopping recording.', LOG_LEVELS.BASIC);
        document.getElementById('start-button').click();
      }
    }, 45000); // 45 seconds

    await startStreaming(assistantReply);
  } catch (error) {
    console.error('Error:', error);
    if (isRecording) {
      await reinitializeConnection();
    }
  }
}

async function reinitializeConnection() {
  log('Reinitializing connection', LOG_LEVELS.BASIC);
  stopAllStreams();
  closePC();

  clearInterval(transcriptionTimer);
  clearTimeout(inactivityTimeout);

  transcript = '';
  chatHistory = chatHistory.slice(0, -1); // Remove the last incomplete transcription from the chat history

  const msgHistory = document.getElementById('msgHistory');
  msgHistory.innerHTML = msgHistory.innerHTML.slice(0, msgHistory.innerHTML.lastIndexOf('<span style=\'opacity:0.5\'><u>User:</u>'));

  await initializeConnection();
  await startRecording();
}

const destroyButton = document.getElementById('destroy-button');
destroyButton.onclick = async () => {
  log('Destroying connection', LOG_LEVELS.BASIC);
  await fetch(`${config.didApi.url}/${config.didApi.service}/streams/${streamId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${config.didApi.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  stopAllStreams();
  closePC();
  clearInterval(keepAliveInterval);
};

const startButton = document.getElementById('start-button');
let isRecording = false;

startButton.onclick = async () => {
  if (!isRecording) {
    startButton.textContent = 'Stop';
    await startRecording();
  } else {
    startButton.textContent = 'Speak';
    await stopRecording();
  }
  isRecording = !isRecording;
};

// Export functions and variables for external use if needed
export {
  initializeConnection,
  startStreaming,
  stopRecording,
  setLogLevel,
  LOG_LEVELS
};
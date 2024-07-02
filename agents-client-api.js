'use strict';
import DID_API from './api.js';
import logger from './logger.js';

const GROQ_API_KEY = DID_API.groqKey;
const DEEPGRAM_API_KEY = DID_API.deepgramKey;

if (DID_API.key == '🤫') alert('Please put your api key inside ./api.js and restart..');

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


const context = `You are a helpful, harmless, and honest assistant. Please answer the users questions briefly, be concise, not more than 1 sentence unless absolutely needed.`;

setLogLevel('DEBUG');

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

function updateTranscription(text) {
  document.getElementById('msgHistory').innerHTML += `<span style='opacity:0.5'><u>User (interim):</u> ${text}</span><br>`;
}

function updateAssistantReply(text) {
  document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${text}</span><br>`;
}

async function initialize() {
  const { idle, stream } = getVideoElements();
  if (idle) idle.setAttribute('playsinline', '');
  if (stream) stream.setAttribute('playsinline', '');

  playIdleVideo();
  showLoadingSymbol();
  try {
    await initializeConnection();
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

    fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/ice`, {
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
    }).then(response => {
      if (!response.ok) {
        logger.error('Failed to send ICE candidate:', response.status, response.statusText);
      }
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
  if (!stream) {
    logger.warn('No stream available to set video element');
    return;
  }
  streamVideoElement.srcObject = stream;
  streamVideoElement.play().catch(e => logger.error('Error playing video:', e));
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
  idleVideoElement.src = 'brad_idle.mp4';
  idleVideoElement.loop = true;

  setTimeout(() => {
    idleVideoElement.classList.remove("animated");
  }, 300);
}

function stopAllStreams() {
  const { stream: streamVideoElement } = getVideoElements();
  if (streamVideoElement && streamVideoElement.srcObject) {
    logger.info('Stopping video streams');
    streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    streamVideoElement.srcObject = null;
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
  const maxRetryCount = 3;
  const maxDelaySec = 4;
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
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
  stopAllStreams();
  closePC();

  logger.info('Initializing connection...');
  const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: 'https://skoop-general.s3.amazonaws.com/brad_idle.png',
      driver_url: 'bank://lively/',
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
}


function startKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  keepAliveInterval = setInterval(async () => {
    try {
      const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/keepalive`, {
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
  }, 100000); // Send keep-alive every 30 seconds
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
            voice_id: 'en-US-ChristopherNeural'
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
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  transcriptionStartTime = Date.now();


  deepgramSocket = new WebSocket('wss://api.deepgram.com/v1/listen', [
    'token',
    DEEPGRAM_API_KEY,
  ]);

  deepgramSocket.onopen = () => {
    logger.info('Deepgram WebSocket Connection opened');
    mediaRecorder.addEventListener('dataavailable', async (event) => {
      if (event.data.size > 0 && deepgramSocket.readyState === WebSocket.OPEN) {
        deepgramSocket.send(event.data);
      }
    });
    mediaRecorder.start(1000);

    // Send KeepAlive message every 3 seconds
    setInterval(() => {
      if (deepgramSocket.readyState === WebSocket.OPEN) {
        const keepAliveMsg = JSON.stringify({ type: "KeepAlive" });
        deepgramSocket.send(keepAliveMsg);
        logger.debug("Sent KeepAlive message to Deepgram");
      }
    }, 3000);

    // Start transcription timer
    transcriptionTimer = setInterval(() => {
      if (transcript.trim() !== '') {
        const transcriptionTime = Date.now() - transcriptionStartTime;
        logger.info(`Transcription completed in ${transcriptionTime}ms`);
        document.getElementById('msgHistory').innerHTML += `<span style='opacity:0.5'><u>User:</u> ${transcript}</span><br>`;
        chatHistory.push({
          role: 'user',
          content: transcript,
        });
        sendChatToGroq();
        transcript = '';
        transcriptionStartTime = Date.now();
      }
    }, 5000); // Send transcription every 5 seconds
  };

  deepgramSocket.onmessage = (message) => {
    const received = JSON.parse(message.data);
    if (received.channel && received.channel.alternatives && received.channel.alternatives.length > 0) {
      const partialTranscript = received.channel.alternatives[0].transcript;
      if (partialTranscript) {
        transcript += partialTranscript;
        document.getElementById('msgHistory').innerHTML = document.getElementById('msgHistory').innerHTML.replace(/<span style='opacity:0.5'><u>User \(interim\):<\/u>.*<\/span><br>/, `<span style='opacity:0.5'><u>User (interim):</u> ${transcript}</span><br>`);
      }
    }
  };
  
  
  deepgramSocket.onclose = async () => {
    logger.info('Deepgram WebSocket connection closed');
    if (isRecording) {
      await reinitializeConnection();
    }
  };

  // Start inactivity timeout
  inactivityTimeout = setTimeout(() => {
    if (isRecording) {
      logger.info('Inactivity timeout reached. Stopping recording.');
      startButton.click();
    }
  }, 45000); // 45 seconds

  transcriptionStartTime = Date.now();
}

async function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    const closeMsg = JSON.stringify({ type: "CloseStream" });
    deepgramSocket.send(closeMsg);
    deepgramSocket.close();
    mediaRecorder = null;
  }

  clearInterval(transcriptionTimer);
  clearTimeout(inactivityTimeout);
}

async function sendChatToGroq() {
  try {
    const startTime = Date.now();
    const response = await fetch('https://avatar.skoop.digital/chat', {
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

    const endTime = Date.now();
    const processingTime = endTime - startTime;
    logger.info(`Groq processing completed in ${processingTime}ms`);

    chatHistory.push({
      role: 'assistant',
      content: assistantReply,
    });

    document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${assistantReply}</span><br>`;

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
    logger.error('Error:', error);
    if (isRecording) {
      await reinitializeConnection();
    }
  }
}

async function reinitializeConnection() {
  logger.info('Reinitializing connection...');
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
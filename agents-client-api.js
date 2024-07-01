'use strict';
import DID_API from './api.js';
import logger from './logger.js';

const GROQ_API_KEY = DID_API.groqKey;
const DEEPGRAM_API_KEY = DID_API.deepgramKey;

if (DID_API.key == '🤫') {
  logger.error('Please put your API key inside ./api.js and restart.');
  alert('Please put your api key inside ./api.js and restart..');
}

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
let isRecording = false;

const context = `You are a helpful, harmless, and honest assistant. Please answer the users questions briefly, be concise, not more than 1 sentence unless absolutely needed.`;

const videoElement = document.getElementById('video-element');
videoElement.setAttribute('playsinline', '');
const peerStatusLabel = document.getElementById('peer-status-label');
const iceStatusLabel = document.getElementById('ice-status-label');
const iceGatheringStatusLabel = document.getElementById('ice-gathering-status-label');
const signalingStatusLabel = document.getElementById('signaling-status-label');
const streamingStatusLabel = document.getElementById('streaming-status-label');

window.onload = async (event) => {
  logger.info('Window loaded, initializing application');
  await playIdleVideo();
  showLoadingSymbol();
  try {
    await initializeConnection();
    hideLoadingSymbol();
  } catch (error) {
    logger.error('Error during auto-initialization:', error);
    hideLoadingSymbol();
    showErrorMessage('Failed to connect. Please try again.');
  }
};

function showLoadingSymbol() {
  logger.debug('Showing loading symbol');
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
  logger.debug('Hiding loading symbol');
  const loadingSymbol = document.getElementById('loading-symbol');
  if (loadingSymbol) {
    document.body.removeChild(loadingSymbol);
  }
}

function showErrorMessage(message) {
  logger.error('Showing error message:', message);
  const errorMessage = document.createElement('div');
  errorMessage.innerHTML = message;
  errorMessage.style.color = 'red';
  errorMessage.style.marginBottom = '10px';
  document.body.appendChild(errorMessage);

  destroyButton.style.display = 'inline-block';
  connectButton.style.display = 'inline-block';
}

async function createPeerConnection(offer, iceServers) {
  logger.info('Creating peer connection');
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

    // Add transceivers to ensure we receive audio and video
    peerConnection.addTransceiver('audio', {direction: 'recvonly'});
    peerConnection.addTransceiver('video', {direction: 'recvonly'});
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
  iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
  iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
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
  iceStatusLabel.innerText = peerConnection.iceConnectionState;
  iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
  logger.debug('ICE connection state changed:', peerConnection.iceConnectionState);

  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
    showErrorMessage('Connection lost. Please try again.');
  }
}

function onConnectionStateChange() {
  peerStatusLabel.innerText = peerConnection.connectionState;
  peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
  logger.debug('Peer connection state changed:', peerConnection.connectionState);
}

function onSignalingStateChange() {
  signalingStatusLabel.innerText = peerConnection.signalingState;
  signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
  logger.debug('Signaling state changed:', peerConnection.signalingState);
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
  logger.info('Video status changed:', status);
}

function onTrack(event) {
  logger.debug('onTrack event:', event);
  if (!event.track) return;

  // Clear any existing interval
  if (statsIntervalId) {
    clearInterval(statsIntervalId);
  }

  // Set up a new interval for this track
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

  // Immediately set up the video element
  setVideoElement(event.streams[0]);
}

function setVideoElement(stream) {
  if (!stream) {
    logger.warn('No stream available to set video element');
    return;
  }
  videoElement.srcObject = stream;
  videoElement.loop = false;
  videoElement.muted = false;

  if (videoElement.paused) {
    videoElement.play().then(() => {
      logger.info('Video playback started');
    }).catch(e => {
      logger.error('Error playing video:', e);
      if (e.name === 'NotAllowedError') {
        logger.info('Autoplay not allowed, waiting for user interaction');
        document.addEventListener('click', () => {
          videoElement.play().catch(playError => logger.error('Error playing video after user interaction:', playError));
        }, { once: true });
      }
    });
  }
}

async function playIdleVideo() {
  logger.info('Playing idle video');
  videoElement.src = 'emma_idle.mp4';
  videoElement.loop = true;
  try {
    await videoElement.play();
    logger.info('Idle video playback started');
  } catch (e) {
    logger.error('Error playing idle video:', e);
    if (e.name === 'NotAllowedError') {
      logger.info('Autoplay not allowed, waiting for user interaction');
      document.addEventListener('click', () => {
        videoElement.play().catch(playError => logger.error('Error playing idle video after user interaction:', playError));
      }, { once: true });
    }
  }
}

function stopAllStreams() {
  if (videoElement.srcObject) {
    logger.info('Stopping video streams');
    videoElement.srcObject.getTracks().forEach((track) => track.stop());
    videoElement.srcObject = null;
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
  iceGatheringStatusLabel.innerText = '';
  signalingStatusLabel.innerText = '';
  iceStatusLabel.innerText = '';
  peerStatusLabel.innerText = '';
  logger.debug('Stopped peer connection');
  if (pc === peerConnection) {
    peerConnection = null;
  }
}

async function fetchWithRetries(url, options, retries = 0) {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }
    return response;
  } catch (err) {
    if (retries < maxRetries) {
      const delay = Math.min(Math.pow(2, retries) * baseDelay + Math.random() * 1000, 10000);
      logger.warn(`Request failed, retrying in ${delay}ms. Error: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
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
      source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg',
      driver_url: 'bank://lively/',
      config: {
        stitch: true,
        fluent: true,
        pad_audio: 0.5,
        auto_match: true,
        normalization_factor: 1,
        sharpen: true,
      },
      audio_optimization: 2,
      output_resolution: 720,
      stream_warmup: true
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
  logger.debug('Starting keep-alive mechanism');
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
      if (!response.ok) {
        throw new Error(`Keep-alive failed: ${response.status} ${response.statusText}`);
      }
      logger.debug('Keep-alive successful');
    } catch (error) {
      logger.error('Keep-alive error:', error);
    }
  }, 30000); // Send keep-alive every 30 seconds
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
            voice_id: 'en-US-JennyMultilingualV2Neural'
          }
        },
        config: {
          fluent: true,
          pad_audio: 0.5,
          stitch: true,
          auto_match: true,
          normalization_factor: 1,
          sharpen: true,
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
    logger.error('Error during streaming:', error.message);
    if (isRecording) {
      await reinitializeConnection();
    }
  }
}

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

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
        document.getElementById('msgHistory').innerHTML += `<span style='opacity:0.5'><u>User:</u> ${transcript}</span><br>`;
        chatHistory.push({
          role: 'user',
          content: transcript,
        });
        sendChatToGroq();
        transcript = '';
      }
    }, 5000); // Send transcription every 5 seconds
  };

  deepgramSocket.onmessage = (message) => {
    const received = JSON.parse(message.data);
    const partialTranscript = received.channel.alternatives[0].transcript;

    if (partialTranscript) {
      transcript += partialTranscript;
      document.getElementById('msgHistory').innerHTML = document.getElementById('msgHistory').innerHTML.replace(/<span style='opacity:0.5'><u>User \(interim\):<\/u>.*<\/span><br>/, `<span style='opacity:0.5'><u>User (interim):</u> ${transcript}</span><br>`);
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
    const startTime = performance.now();
    logger.info('Sending chat to Groq');
    const response = await fetchWithRetries('https://avatar.skoop.digital/chat', {
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

    const endTime = performance.now();
    logger.info(`Groq response time: ${endTime - startTime}ms`);

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
    await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
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
    clearInterval(keepAliveInterval);
  }
};

const startButton = document.getElementById('start-button');

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

// Initialize the connection when the page loads
initializeConnection().catch(error => {
  logger.error('Failed to initialize connection:', error);
  showErrorMessage('Failed to initialize connection. Please try again.');
});
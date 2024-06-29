
'use strict';

// Import configuration
import config from './config.js';

// Logging setup
const LOG_LEVELS = {
  BASIC: 'basic',
  ADVANCED: 'advanced'
};
const currentLogLevel = LOG_LEVELS.BASIC; // Change to LOG_LEVELS.ADVANCED for detailed logs

function log(message, level = LOG_LEVELS.BASIC) {
  if (level === currentLogLevel || currentLogLevel === LOG_LEVELS.ADVANCED) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

// WebRTC setup
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
  initializeIdleVideo();
  showLoadingSymbol();
  try {
    await connectButton.onclick();
    hideLoadingSymbol();
  } catch (error) {
    console.error('Error during auto-initialization:', error);
    hideLoadingSymbol();
    showErrorMessage('Failed to connect. Please try again.');
  }
};

function initializeIdleVideo() {
  videoElement.src = config.idleVideoUrl;
  videoElement.loop = true;
  videoElement.muted = true;
  videoElement.playsInline = true;
  
  videoElement.play().catch(error => {
    log("Autoplay was prevented for idle video:", error);
    showPlayButton();
  });
}

function playIdleVideo() {
  if (videoElement.src !== config.idleVideoUrl) {
    videoElement.src = config.idleVideoUrl;
  }
  videoElement.loop = true;
  videoElement.muted = true;
  videoElement.currentTime = 0;
  
  videoElement.play().catch(error => {
    log("Playback of idle video was prevented:", error);
    showPlayButton();
  });
}

function showPlayButton() {
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
    log('No stream available to set video element');
    playIdleVideo();
    return;
  }

  videoElement.srcObject = stream;
  videoElement.muted = false;
  videoElement.loop = false;

  videoElement.play().then(() => {
    log('Video playback started');
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

  destroyButton.style.display = 'inline-block';
  connectButton.style.display = 'inline-block';
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
  log('Set remote SDP OK', LOG_LEVELS.ADVANCED);

  const sessionClientAnswer = await peerConnection.createAnswer();
  log('Create local SDP OK', LOG_LEVELS.ADVANCED);

  await peerConnection.setLocalDescription(sessionClientAnswer);
  log('Set local SDP OK', LOG_LEVELS.ADVANCED);

  return sessionClientAnswer;
}

function onIceGatheringStateChange() {
  iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
  iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
  log(`ICE gathering state changed to: ${peerConnection.iceGatheringState}`, LOG_LEVELS.ADVANCED);
}

function onIceCandidate(event) {
  if (event.candidate) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;

    fetch(`${config.DID_API.url}/${config.DID_API.service}/streams/${streamId}/ice`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${config.DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate,
        sdpMid,
        sdpMLineIndex,
        session_id: sessionId,
      }),
    });
    log(`ICE candidate sent: ${JSON.stringify(event.candidate)}`, LOG_LEVELS.ADVANCED);
  }
}

function onIceConnectionStateChange() {
  iceStatusLabel.innerText = peerConnection.iceConnectionState;
  iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
  log(`ICE connection state changed to: ${peerConnection.iceConnectionState}`);

  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
    showErrorMessage('Connection lost. Please try again.');
  }
}

function onConnectionStateChange() {
  peerStatusLabel.innerText = peerConnection.connectionState;
  peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
  log(`Peer connection state changed to: ${peerConnection.connectionState}`);
}

function onSignalingStateChange() {
  signalingStatusLabel.innerText = peerConnection.signalingState;
  signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
  log(`Signaling state changed to: ${peerConnection.signalingState}`);
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
  log(`Video status changed to: ${status}`);
}

function onTrack(event) {
  log('onTrack event:', event);
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
      log('Peer connection not ready for stats.');
    }
  }, 1000);

  setVideoElement(event.streams[0]);
}

function setVideoElement(stream) {
  if (!stream) {
    log('No stream available to set video element');
    return;
  }

  videoElement.srcObject = stream;
  videoElement.muted = false;
  videoElement.classList.add("animated");

  videoElement.play().then(() => {
    log('Video playback started');
  }).catch(e => {
    console.error('Error playing video:', e);
    playIdleVideo();
  });

  setTimeout(() => {
    videoElement.classList.remove("animated");
  }, 300);
}

function playIdleVideo() {
  videoElement.srcObject = undefined;
  videoElement.src = config.idleVideoUrl;
  videoElement.loop = true;
  videoElement.muted = true;
  videoElement.play().then(() => {
    log('Idle video playback started');
  }).catch(e => console.error('Error playing idle video:', e));
}

function stopAllStreams() {
  if (videoElement.srcObject) {
    log('Stopping video streams');
    videoElement.srcObject.getTracks().forEach((track) => track.stop());
    videoElement.srcObject = null;
  }
}

function closePC(pc = peerConnection) {
  if (!pc) return;
  log('Stopping peer connection');
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
  log('Stopped peer connection');
  if (pc === peerConnection) {
    peerConnection = null;
  }
}

const maxRetryCount = 2;
const maxDelaySec = 2;
async function fetchWithRetries(url, options, retries = 1) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (err) {
    if (retries <= maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
      log(`Request failed, retrying ${retries}/${maxRetryCount}. Error ${err}`);
      return fetchWithRetries(url, options, retries + 1);
    } else {
      throw new Error(`Max retries exceeded. error: ${err}`);
    }
  }
}

const connectButton = document.getElementById('connect-button');
connectButton.onclick = async () => {
  if (peerConnection && peerConnection.connectionState === 'connected') {
    return;
  }
  stopAllStreams();
  closePC();

  const sessionResponse = await fetchWithRetries(`${config.DID_API.url}/${config.DID_API.service}/streams`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${config.DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: config.avatarImageUrl,
      driver_url: 'bank://lively/',
      output_resolution: 720,
      stream_warmup: true,
      config: {
        stitch: true,
        fluent: true,
        pad_audio: 0,
        auto_match: true,
        driver_expressions: {
          attention: 0.3,
          surprise: 0.3,
        },
        motion_factor: 0.8,
        normalization_factor: 0.8,
        sharpen: true,
      },
    }),
  });

  const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
  streamId = newStreamId;
  sessionId = newSessionId;
  log(`Stream created with ID: ${streamId}`, LOG_LEVELS.ADVANCED);

  try {
    sessionClientAnswer = await createPeerConnection(offer, iceServers);
  } catch (e) {
    console.error('Error during streaming setup', e);
    stopAllStreams();
    closePC();
    return;
  }

  const sdpResponse = await fetch(`${config.DID_API.url}/${config.DID_API.service}/streams/${streamId}/sdp`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${config.DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      answer: sessionClientAnswer,
      session_id: sessionId,
    }),
  });

  if (sdpResponse.ok) {
    log('SDP answer sent successfully', LOG_LEVELS.ADVANCED);
    startKeepAlive();
  } else {
    console.error('Error sending SDP answer:', await sdpResponse.text());
  }
};

function startKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  keepAliveInterval = setInterval(async () => {
    try {
      const response = await fetch(`${config.DID_API.url}/${config.DID_API.service}/streams/${streamId}/keepalive`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${config.DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (response.ok) {
        log('Keep-alive sent successfully', LOG_LEVELS.ADVANCED);
      } else {
        console.error('Error sending keep-alive:', await response.text());
      }
    } catch (error) {
      console.error('Failed to send keep-alive:', error);
    }
  }, 30000); // Send keep-alive every 30 seconds
}

async function startStreaming(assistantReply) {
  try {
    const startTime = performance.now();
    const playResponse = await fetchWithRetries(`${config.DID_API.url}/${config.DID_API.service}/streams/${streamId}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${config.DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script: {
          type: 'text',
          input: assistantReply,
          provider: {
            type: 'microsoft',
            voice_id: config.voiceId
          }
        },
        config: {
          fluent: true,
          pad_audio: 0,
          stitch: true,
          sharpen: true,
          motion_factor: 0.8,
        },
        session_id: sessionId,
      }),
    });

    if (playResponse.ok) {
      const endTime = performance.now();
      log(`Streaming request successful. Time taken: ${endTime - startTime}ms`, LOG_LEVELS.ADVANCED);
    } else {
      throw new Error(`HTTP error! status: ${playResponse.status}`);
    }

    videoElement.muted = false;
  } catch (error) {
    console.error('Error during streaming:', error);
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
    config.DEEPGRAM_API_KEY,
  ]);

  deepgramSocket.onopen = () => {
    log('Deepgram WebSocket connection opened', LOG_LEVELS.ADVANCED);
    mediaRecorder.addEventListener('dataavailable', async (event) => {
      if (event.data.size > 0 && deepgramSocket.readyState === 1) {
        deepgramSocket.send(event.data);
      }
    });
    mediaRecorder.start(1000);

    setInterval(() => {
      if (deepgramSocket.readyState === 1) {
        const keepAliveMsg = JSON.stringify({ type: "KeepAlive" });
        deepgramSocket.send(keepAliveMsg);
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
    }, 3000);
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
    log('Deepgram WebSocket connection closed', LOG_LEVELS.ADVANCED);
    if (isRecording) {
      await reinitializeConnection();
    }
  };

  inactivityTimeout = setTimeout(() => {
    if (isRecording) {
      log('Inactivity timeout reached. Stopping recording.');
      startButton.click();
    }
  }, 45000);
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
    const response = await fetch(config.GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.GROQ_API_KEY}`
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
        max_tokens: 150,
        temperature: 0.7,
        top_p: 1,
        stream: true,
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
    log(`Groq API response time: ${endTime - startTime}ms`, LOG_LEVELS.ADVANCED);

    chatHistory.push({
      role: 'assistant',
      content: assistantReply,
    });

    document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${assistantReply}</span><br>`;

    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
      if (isRecording) {
        log('Inactivity timeout reached. Stopping recording.');
        startButton.click();
      }
    }, 45000);

    await startStreaming(assistantReply);
  } catch (error) {
    console.error('Error:', error);
    if (isRecording) {
      await reinitializeConnection();
    }
  }
}

async function reinitializeConnection() {
  log('Reinitializing connection...', LOG_LEVELS.ADVANCED);
  stopAllStreams();
  closePC();

  clearInterval(transcriptionTimer);
  clearTimeout(inactivityTimeout);

  transcript = '';
  chatHistory = chatHistory.slice(0, -1);

  const msgHistory = document.getElementById('msgHistory');
  msgHistory.innerHTML = msgHistory.innerHTML.slice(0, msgHistory.innerHTML.lastIndexOf('<span style=\'opacity:0.5\'><u>User:</u>'));

  await connectButton.onclick();
  await startRecording();
}

const destroyButton = document.getElementById('destroy-button');
destroyButton.onclick = async () => {
  await fetch(`${config.DID_API.url}/${config.DID_API.service}/streams/${streamId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${config.DID_API.key}`,
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

export { log, LOG_LEVELS };
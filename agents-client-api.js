'use strict';
import DID_API from './api.js';

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

const context = `You are a helpful, harmless, and honest assistant. Please answer the users questions briefly, be concise, not more than 1 sentance unless absolutely needed.`;

const videoElement = document.getElementById('video-element');
videoElement.setAttribute('playsinline', '');
const peerStatusLabel = document.getElementById('peer-status-label');
const iceStatusLabel = document.getElementById('ice-status-label');
const iceGatheringStatusLabel = document.getElementById('ice-gathering-status-label');
const signalingStatusLabel = document.getElementById('signaling-status-label');
const streamingStatusLabel = document.getElementById('streaming-status-label');

window.onload = async (event) => {
  playIdleVideo();

  const loadingSymbol = document.createElement('div');
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

  try {
    await connectButton.onclick();
    document.body.removeChild(loadingSymbol);
  } catch (error) {
    console.error('Error during auto-initialization:', error);
    document.body.removeChild(loadingSymbol);
    showErrorMessage('Failed to connect. Please try again.');
  }
};

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
    peerConnection = new RTCPeerConnection({ iceServers });
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);
  }

  try {
    await peerConnection.setRemoteDescription(offer);
    console.log('Set remote SDP OK');

    const sessionClientAnswer = await peerConnection.createAnswer();
    console.log('Create local SDP OK');

    await peerConnection.setLocalDescription(sessionClientAnswer);
    console.log('Set local SDP OK');

    return sessionClientAnswer;
  } catch (error) {
    console.error('Error in createPeerConnection:', error);
    throw error;
  }
}

function onIceGatheringStateChange() {
  iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
  iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
}

function onIceCandidate(event) {
  if (event.candidate) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;

    fetch(`/api/d-id/${DID_API.service}/streams/${streamId}/ice`, {
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
    });
  }
}

function onIceConnectionStateChange() {
  iceStatusLabel.innerText = peerConnection.iceConnectionState;
  iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;

  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
    showErrorMessage('Connection lost. Please try again.');
  }
}

function onConnectionStateChange() {
  peerStatusLabel.innerText = peerConnection.connectionState;
  peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
}

function onSignalingStateChange() {
  signalingStatusLabel.innerText = peerConnection.signalingState;
  signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
}

function onVideoStatusChange(videoIsPlaying, stream) {
  let status;
  if (videoIsPlaying) {
    status = 'streaming';
    const remoteStream = stream;
    setVideoElement(remoteStream);
  } else {
    status = 'empty';
    playIdleVideo();
  }
  streamingStatusLabel.innerText = status;
  streamingStatusLabel.className = 'streamingState-' + status;
}

function onTrack(event) {
  console.log('onTrack event:', event);
  if (!event.track) return;

  statsIntervalId = setInterval(async () => {
    if (peerConnection && event.track) {
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
    }
  }, 300);
}

function setVideoElement(stream) {
  if (!stream) return;
  videoElement.classList.add("animated");
  videoElement.muted = false;
  videoElement.srcObject = stream;
  videoElement.loop = false;

  setTimeout(() => {
    videoElement.classList.remove("animated");
  }, 300);

  if (videoElement.paused) {
    videoElement.play().then(() => {}).catch((e) => {
      console.error('Error playing video:', e);
    });
  }
}

function playIdleVideo() {
  videoElement.classList.toggle("animated");
  videoElement.srcObject = undefined;
  videoElement.src = 'emma_idle.mp4';
  videoElement.loop = true;

  setTimeout(() => {
    videoElement.classList.remove("animated");
  }, 300);
}

function stopAllStreams() {
  if (videoElement.srcObject) {
    console.log('stopping video streams');
    videoElement.srcObject.getTracks().forEach((track) => track.stop());
    videoElement.srcObject = null;
  }
}

function closePC(pc = peerConnection) {
  if (!pc) return;
  console.log('stopping peer connection');
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
  console.log('stopped peer connection');
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
      throw new Error(`HTTP error ${response.status}`);
    }
    return response;
  } catch (err) {
    if (retries <= maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
      console.log(`Request failed, retrying ${retries}/${maxRetryCount}. Error ${err}`);
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

  try {
    console.log('Initializing connection...');
    const sessionResponse = await fetchWithRetries(`/api/d-id/${DID_API.service}/streams`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg'
      }),
    });

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
    streamId = newStreamId;
    sessionId = newSessionId;
    console.log('Stream created:', { streamId, sessionId });

    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
      console.error('Error during streaming setup', e);
      stopAllStreams();
      closePC();
      return;
    }

    const sdpResponse = await fetch(`/api/d-id/${DID_API.service}/streams/${streamId}/sdp`, {
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
      throw new Error(`SDP response error: ${sdpResponse.status}`);
    }

    console.log('Connection initialized successfully');
  } catch (error) {
    console.error('Error during connection initialization:', error);
    showErrorMessage('Failed to initialize connection. Please try again.');
  }
};

async function isSessionValid() {
  try {
    const response = await fetch(`/api/d-id/${DID_API.service}/streams/${streamId}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error checking session validity:', error);
    return false;
  }
}

async function startStreaming(assistantReply) {
  try {
    if (!(await isSessionValid())) {
      console.log('Session is no longer valid. Reinitializing connection...');
      await reinitializeConnection();
    }

    console.log('Starting streaming with reply:', assistantReply);
    const playResponse = await fetchWithRetries(`/api/d-id/${DID_API.service}/streams/${streamId}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script: {
          type: 'text',
          input: assistantReply,
        },
        config: {
          fluent: true,
          pad_audio: 0,
        },
        session_id: sessionId,
      }),
    });

    if (!playResponse.ok) {
      const errorData = await playResponse.json();
      throw new Error(`Play response error: ${playResponse.status}, ${JSON.stringify(errorData)}`);
    }

    const playResult = await playResponse.json();
    console.log('Streaming started successfully:', playResult);
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
    DEEPGRAM_API_KEY,
  ]);

  deepgramSocket.onopen = () => {
    console.log('Deepgram WebSocket connection opened');
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
        console.log("Sent KeepAlive message to Deepgram");
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
    }, 5000);
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
    console.log('Deepgram WebSocket connection closed');
    if (isRecording) {
      await reinitializeConnection();
    }
  };

  inactivityTimeout = setTimeout(() => {
    if (isRecording) {
      console.log('Inactivity timeout reached. Stopping recording.');
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

    chatHistory.push({
      role: 'assistant',
      content: assistantReply,
    });

    document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${assistantReply}</span><br>`;

    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
      if (isRecording) {
        console.log('Inactivity timeout reached. Stopping recording.');
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
  console.log('Reinitializing connection...');
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
  try {
    const response = await fetch(`/api/d-id/${DID_API.service}/streams/${streamId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    console.log('Stream destroyed successfully');
  } catch (error) {
    console.error('Error destroying stream:', error);
  }

  stopAllStreams();
  closePC();
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

async function checkCORSConfiguration() {
  try {
    const response = await fetch(`/api/d-id/${DID_API.service}/streams`, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
      },
    });

    console.log('CORS preflight response:', response);
    console.log('Access-Control-Allow-Origin:', response.headers.get('Access-Control-Allow-Origin'));
    console.log('Access-Control-Allow-Methods:', response.headers.get('Access-Control-Allow-Methods'));
    console.log('Access-Control-Allow-Headers:', response.headers.get('Access-Control-Allow-Headers'));
  } catch (error) {
    console.error('Error checking CORS configuration:', error);
  }
}

window.addEventListener('load', checkCORSConfiguration);

window.addEventListener('error', function(event) {
  console.error('Uncaught error:', event.error);
});
'use strict';
import DID_API from './api.js';

const GROQ_API_KEY = DID_API.groqKey;
const DEEPGRAM_API_KEY = DID_API.deepgramKey;

if (DID_API.key == '🤫') alert('Please put your api key inside ./api.json and restart..');

let peerConnection;
let streamId;
let sessionId;
let chatHistory = [];
let mediaRecorder;
let deepgramSocket;
let transcript = '';
let inactivityTimeout;
let transcriptionTimer;

const videoElement = document.getElementById('video-element');
videoElement.setAttribute('playsinline', '');
const peerStatusLabel = document.getElementById('peer-status-label');
const iceStatusLabel = document.getElementById('ice-status-label');
const iceGatheringStatusLabel = document.getElementById('ice-gathering-status-label');
const signalingStatusLabel = document.getElementById('signaling-status-label');
const streamingStatusLabel = document.getElementById('streaming-status-label');

const context = `grocery store info:
---
Product,"Aisle and side (<Aisle, Left or Right>)",Est. Price,Promo price,Category
Double Zipper Gallon Storage Bags ,16 - R,4,,Cleaning Products
Double Zipper Gallon Size Freezer Bags ,16 - R,4,,Cleaning Products
Reclosable Colorful Assorted Square Snack Bags ,16 - R,3,,Cleaning Products
Fresh Lemons,PRODUCE - nan,5,4,Produce
Clover Honey Bear SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM - L,5,4,Condiment & Sauces
Heavy Duty Aluminum Foil ,16 - R,5,4,Cleaning Products
Soft & Strong Toilet Paper Double Roll ,18 - L,8,6,Cleaning Products
---

store layout:
---
Directions
Straight: Moving from south to north.
Left: Moving from west to east(if facing north) or east to west(if facing south) depending on the current facing direction.
Right: Moving from east to west(if facing south) or west to east(if facing north) depending on the current facing direction.
Prompt:
Customer is at the "ENTER" and wants to find the "Fruits" aisle. Guide the customer with step-by-step directions using map references and directional guidance.

---

You are a helpful, harmless, and honest assistant. Please answer the users questions briefly, be concise, not more than 1 sentance unless absolutely needed.
`;

window.onload = async (event) => {
  playIdleVideo();
  showLoadingSymbol();
  try {
    await initializeConnection();
    hideLoadingSymbol();
  } catch (error) {
    console.error('Error during auto-initialization:', error);
    hideLoadingSymbol();
    showErrorMessage('Failed to connect. Please try again.');
  }
};

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
}

async function initializeConnection() {
  const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
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
  console.log('New stream created:', streamId);

  try {
    const sessionClientAnswer = await createPeerConnection(offer, iceServers);
    await sendSDPAnswer(sessionClientAnswer);
  } catch (e) {
    console.log('error during streaming setup', e);
    stopAllStreams();
    closePC();
    throw e;
  }
}

async function createPeerConnection(offer, iceServers) {
  peerConnection = new RTCPeerConnection({ iceServers });
  peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
  peerConnection.addEventListener('icecandidate', onIceCandidate, true);
  peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
  peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
  peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
  peerConnection.addEventListener('track', onTrack, true);

  await peerConnection.setRemoteDescription(offer);
  console.log('Set remote description:', offer.type);

  const sessionClientAnswer = await peerConnection.createAnswer();
  console.log('Created answer:', sessionClientAnswer.type);

  await peerConnection.setLocalDescription(sessionClientAnswer);
  console.log('Set local description:', sessionClientAnswer.type);

  return sessionClientAnswer;
}

async function sendSDPAnswer(sessionClientAnswer) {
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
  console.log('SDP answer sent, status:', sdpResponse.status);
}

function onIceGatheringStateChange() {
  iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
  iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
}

async function onIceCandidate(event) {
  if (event.candidate) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;
    console.log('New ICE candidate:', candidate);

    await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/ice`, {
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
    showErrorMessage('ICE Connection failed or closed. Please try again.');
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

function onTrack(event) {
  console.log('Received track:', event.track.kind);
  if (event.track.kind === 'video') {
    videoElement.srcObject = event.streams[0];
  }
}

function setVideoElement(stream) {
  if (!stream) return;
  videoElement.srcObject = stream;
  videoElement.loop = false;
  videoElement.muted = false;

  // Remove browsers' "autoplay policy" restrictions
  videoElement.play().catch(error => {
    console.error('Error attempting to play:', error);
  });
}

function playIdleVideo() {
  videoElement.srcObject = null;
  videoElement.src = 'emma_idle.mp4';
  videoElement.loop = true;
}

function stopAllStreams() {
  if (videoElement.srcObject) {
    console.log('Stopping video streams');
    videoElement.srcObject.getTracks().forEach(track => track.stop());
    videoElement.srcObject = null;
  }
}

function closePC() {
  if (!peerConnection) return;
  peerConnection.close();
  peerConnection = null;
  console.log('Peer connection closed');
}

const maxRetryCount = 3;
const maxDelaySec = 4;

async function fetchWithRetries(url, options, retries = 1) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (err) {
    if (retries <= maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 1000;
      console.log(`Request failed, retrying ${retries}/${maxRetryCount}. Error: ${err}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetries(url, options, retries + 1);
    } else {
      throw new Error(`Max retries exceeded. Error: ${err}`);
    }
  }
}

async function startStreaming(assistantReply) {
  console.log('Starting streaming with reply:', assistantReply);
  try {
    const playResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
        Cookie: sessionId
      },
      body: JSON.stringify({
        script: {
          type: 'text',
          input: assistantReply,
        },
        config: {
          fluent: true,
          pad_audio: 0,
        }
      }),
    });
    console.log('Play response status:', playResponse.status);
    if (!playResponse.ok) {
      const errorData = await playResponse.json();
      console.error('Error in play response:', errorData);
    }
  } catch (error) {
    console.error('Error during streaming:', error);
    await reinitializeConnection();
  }
}

async function startRecording() {
  console.log('Starting recording');
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
        deepgramSocket.send(JSON.stringify({ type: "KeepAlive" }));
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
      document.getElementById('msgHistory').innerHTML = document.getElementById('msgHistory').innerHTML.replace(
        /<span style='opacity:0.5'><u>User \(interim\):<\/u>.*<\/span><br>/,
        `<span style='opacity:0.5'><u>User (interim):</u> ${transcript}</span><br>`
      );
    }
  };

  deepgramSocket.onclose = async () => {
    console.log('Deepgram WebSocket connection closed');
    await reinitializeConnection();
  };

  inactivityTimeout = setTimeout(() => {
    console.log('Inactivity timeout reached. Stopping recording.');
    stopRecording();
  }, 45000);
}

async function stopRecording() {
  console.log('Stopping recording');
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
  console.log('Sending chat to Groq');
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

    console.log('Assistant reply:', assistantReply);

    chatHistory.push({
      role: 'assistant',
      content: assistantReply,
    });

    document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${assistantReply}</span><br>`;

    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
      console.log('Inactivity timeout reached. Stopping recording.');
      stopRecording();
    }, 45000);

    await startStreaming(assistantReply);
  } catch (error) {
    console.error('Error in sendChatToGroq:', error);
    await reinitializeConnection();
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

  await initializeConnection();
  await startRecording();
}

const destroyButton = document.getElementById('destroy-button');
destroyButton.onclick = async () => {
  console.log('Destroy button clicked');
  await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  stopAllStreams();
  closePC();
};

const startButton = document.getElementById('start-button');
let isRecording = false;

startButton.onclick = async () => {
  console.log('Start/Stop button clicked');
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
  console.error('Error during initialization:', error);
  showErrorMessage('Failed to initialize connection. Please refresh the page and try again.');
});
'use strict';
import DID_API from './api.js';

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

const context = `You are a helpful, harmless, and honest assistant. Please answer the users questions briefly, be concise, not more than 1 sentence unless absolutely needed.`;

const videoElement = document.getElementById('video-element');
videoElement.setAttribute('playsinline', '');
const peerStatusLabel = document.getElementById('peer-status-label');
const iceStatusLabel = document.getElementById('ice-status-label');
const iceGatheringStatusLabel = document.getElementById('ice-gathering-status-label');
const signalingStatusLabel = document.getElementById('signaling-status-label');
const streamingStatusLabel = document.getElementById('streaming-status-label');

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
  // Implementation of showing loading symbol
}

function hideLoadingSymbol() {
  // Implementation of hiding loading symbol
}

function showErrorMessage(message) {
  // Implementation of showing error message
}

async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    const config = {
      iceServers,
      sdpSemantics: 'unified-plan'
    };
    peerConnection = new RTCPeerConnection(config);
    peerConnection.addTransceiver('audio', {direction: 'recvonly'});
    peerConnection.addTransceiver('video', {direction: 'recvonly'});
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);
  }

  await peerConnection.setRemoteDescription(offer);
  console.log('set remote sdp OK');

  const sessionClientAnswer = await peerConnection.createAnswer();
  console.log('create local sdp OK');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  console.log('set local sdp OK');

  return sessionClientAnswer;
}

function onIceGatheringStateChange() {
  iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
  iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
}

function onIceCandidate(event) {
  if (event.candidate) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;
    
    fetch(`${DID_API.url}/talks/streams/${streamId}/ice`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ candidate, sdpMid, sdpMLineIndex, session_id: sessionId})
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

function onTrack(event) {
  console.log('onTrack event:', event);
  if (!event.track) return;

  if (statsIntervalId) {
    clearInterval(statsIntervalId);
  }

  statsIntervalId = setInterval(async () => {
    if (peerConnection && peerConnection.connectionState === 'connected') {
      try {
        const stats = await peerConnection.getStats(event.track);
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
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
      console.log('Peer connection not ready for stats.');
    }
  }, 1000);

  setVideoElement(event.streams[0]);
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
}

function setVideoElement(stream) {
  if (!stream) {
    console.log('No stream available to set video element');
    return;
  }
  videoElement.srcObject = stream;
  videoElement.play().then(() => {
    console.log('Video playback started');
  }).catch(e => console.error('Error playing video:', e));
}

function playIdleVideo() {
  videoElement.srcObject = null;
  videoElement.src = 'emma_idle.mp4';
  videoElement.loop = true;
}

async function initializeConnection() {
  stopAllStreams();
  closePC();

  const sessionResponse = await fetchWithRetries(`${DID_API.url}/talks/streams`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg',
      compatibility_mode: 'auto',
      output_resolution: 720,
      stream_warmup: true
    }),
  });

  const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
  streamId = newStreamId;
  sessionId = newSessionId;

  try {
    sessionClientAnswer = await createPeerConnection(offer, iceServers);
  } catch (e) {
    console.log('error during streaming setup', e);
    stopAllStreams();
    closePC();
    return;
  }

  const sdpResponse = await fetch(`${DID_API.url}/talks/streams/${streamId}/sdp`, {
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
}

async function startStreaming(assistantReply) {
  try {
    const playResponse = await fetchWithRetries(`${DID_API.url}/talks/streams/${streamId}`, {
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
          pad_audio: 0,
          stitch: true
        },
        session_id: sessionId,
      }),
    });

    if (!playResponse.ok) {
      throw new Error(`HTTP error ${playResponse.status}`);
    }

    console.log('Streaming started successfully');
  } catch (error) {
    console.error('Error during streaming:', error);
    if (isRecording) {
      await reinitializeConnection();
    }
  }
}

// ... (rest of the code, including audio handling, remains the same)

const connectButton = document.getElementById('connect-button');
connectButton.onclick = initializeConnection;

const destroyButton = document.getElementById('destroy-button');
destroyButton.onclick = async () => {
  await fetch(`${DID_API.url}/talks/streams/${streamId}`, {
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
  if (!isRecording) {
    startButton.textContent = 'Stop';
    await startRecording();
  } else {
    startButton.textContent = 'Speak';
    await stopRecording();
  }
  isRecording = !isRecording;
};

// ... (previous code remains the same)

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

    // Send KeepAlive message every 3 seconds
    setInterval(() => {
      if (deepgramSocket.readyState === 1) {
        const keepAliveMsg = JSON.stringify({ type: "KeepAlive" });
        deepgramSocket.send(keepAliveMsg);
        console.log("Sent KeepAlive message to Deepgram");
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
    }, 3000); // Send transcription every 3 seconds
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
    if (isRecording) {
      await reinitializeConnection();
    }
  };

  // Start inactivity timeout
  inactivityTimeout = setTimeout(() => {
    if (isRecording) {
      console.log('Inactivity timeout reached. Stopping recording.');
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

    // Add assistant reply to chat history
    chatHistory.push({
      role: 'assistant',
      content: assistantReply,
    });

    // Append the complete assistant reply to the chat history element
    document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${assistantReply}</span><br>`;

    // Reset inactivity timeout
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
      if (isRecording) {
        console.log('Inactivity timeout reached. Stopping recording.');
        startButton.click();
      }
    }, 45000); // 45 seconds

    // Initiate streaming
    await startStreaming(assistantReply);
  } catch (error) {
    console.error('Error in sendChatToGroq:', error);
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

  // Reset transcription state
  transcript = '';
  chatHistory = chatHistory.slice(0, -1); // Remove the last incomplete transcription from the chat history

  // Update UI to remove the incomplete transcription
  const msgHistory = document.getElementById('msgHistory');
  msgHistory.innerHTML = msgHistory.innerHTML.slice(0, msgHistory.innerHTML.lastIndexOf('<span style=\'opacity:0.5\'><u>User:</u>'));

  await initializeConnection();
  await startRecording();
}

function stopAllStreams() {
  if (videoElement.srcObject) {
    console.log('Stopping video streams');
    videoElement.srcObject.getTracks().forEach((track) => track.stop());
    videoElement.srcObject = null;
  }
}

function closePC(pc = peerConnection) {
  if (!pc) return;
  console.log('Stopping peer connection');
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
  console.log('Stopped peer connection');
  if (pc === peerConnection) {
    peerConnection = null;
  }
}

const maxRetryCount = 2;
const maxDelaySec = 2;
async function fetchWithRetries(url, options, retries = 1) {
  try {
    return await fetch(url, options);
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

// Event listeners for buttons
const connectButton = document.getElementById('connect-button');
connectButton.onclick = initializeConnection;

const destroyButton = document.getElementById('destroy-button');
destroyButton.onclick = async () => {
  await fetch(`${DID_API.url}/talks/streams/${streamId}`, {
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
  if (!isRecording) {
    startButton.textContent = 'Stop';
    await startRecording();
  } else {
    startButton.textContent = 'Speak';
    await stopRecording();
  }
  isRecording = !isRecording;
};
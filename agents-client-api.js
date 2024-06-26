'use strict';

const fetchJsonFile = await fetch("./api.json");
const DID_API = await fetchJsonFile.json();

if (DID_API.key == '🤫') alert('Please put your api key inside ./api.json and restart..');

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
let videoIsPlaying = false;
let lastBytesReceived;
let streamVideoOpacity = 0;

const stream_warmup = true;
let isStreamReady = !stream_warmup;

const idleVideoElement = document.getElementById('idle-video-element');
const streamVideoElement = document.getElementById('stream-video-element');
idleVideoElement.setAttribute('playsinline', '');
streamVideoElement.setAttribute('playsinline', '');

const peerStatusLabel = document.getElementById('peer-status-label');
const iceStatusLabel = document.getElementById('ice-status-label');
const iceGatheringStatusLabel = document.getElementById('ice-gathering-status-label');
const signalingStatusLabel = document.getElementById('signaling-status-label');
const streamingStatusLabel = document.getElementById('streaming-status-label');
const streamEventLabel = document.getElementById('stream-event-label');
const agentIdLabel = document.getElementById('agentId-label');
const chatIdLabel = document.getElementById('chatId-label');
const textArea = document.getElementById("textArea");

// Play the idle video when the page is loaded
window.onload = (event) => {
  playIdleVideo();

  if (agentId == "" || agentId == undefined) {
    console.log("Empty 'agentID' and 'chatID' variables\n\n1. Click on the 'Create new Agent with Knowledge' button\n2. Open the Console and wait for the process to complete\n3. Press on the 'Connect' button\n4. Type and send a message to the chat\nNOTE: You can store the created 'agentID' and 'chatId' variables at the bottom of the JS file for future chats");
  } else {
    console.log("You are good to go!\nClick on the 'Connect Button', Then send a new message\nAgent ID: ", agentId, "\nChat ID: ", chatId);
    agentIdLabel.innerHTML = agentId;
    chatIdLabel.innerHTML = chatId;
  }
};

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
  console.log('set remote sdp OK');

  const sessionClientAnswer = await peerConnection.createAnswer();
  console.log('create local sdp OK');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  console.log('set local sdp OK');

  // Data Channel creation (for displaying the Agent's responses as text)
  pcDataChannel = peerConnection.createDataChannel("JanusDataChannel");
  pcDataChannel.onopen = () => {
    console.log("datachannel open");
  };

  let decodedMsg;
  // Agent Text Responses - Decoding the responses, pasting to the HTML element
  pcDataChannel.onmessage = onStreamEvent;

  pcDataChannel.onclose = () => {
    console.log("datachannel close");
  };

  return sessionClientAnswer;
}

function onIceGatheringStateChange() {
  iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
  iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
}

function onIceCandidate(event) {
  if (event.candidate) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;

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
    });
  } else {
    // For the initial 2 sec idle stream at the beginning of the connection, we utilize a null ice candidate.
    fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/ice`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
  if (peerConnection.connectionState === 'connected') {
    playIdleVideo();
    setTimeout(() => {
      if (!isStreamReady) {
        console.log('forcing stream/ready');
        isStreamReady = true;
        streamEventLabel.innerText = 'ready';
        streamEventLabel.className = 'streamEvent-ready';
      }
    }, 5000);
  }
}

function onSignalingStateChange() {
  signalingStatusLabel.innerText = peerConnection.signalingState;
  signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
}

function onVideoStatusChange(videoIsPlaying, stream) {
  let status;
  if (videoIsPlaying) {
    status = 'streaming';
    streamVideoOpacity = isStreamReady ? 1 : 0;
    setStreamVideoElement(stream);
  } else {
    status = 'empty';
    playIdleVideo();
    streamVideoOpacity = 0;
  }

  streamVideoElement.style.opacity = streamVideoOpacity;
  idleVideoElement.style.opacity = 1 - streamVideoOpacity;

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
  }, 500);
}

function onStreamEvent(message) {
  if (pcDataChannel.readyState === 'open') {
    let status;
    const [event, data] = message.data.split(':');

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
      case 'chat/answer':
        const decodedMsg = decodeURIComponent(data);
        document.getElementById("msgHistory").innerHTML += `<span>${decodedMsg}</span><br><br>`;
        return;
      default:
        status = 'dont-care';
        break;
    }

    if (status === 'ready') {
      setTimeout(() => {
        console.log('stream/ready');
        isStreamReady = true;
        streamEventLabel.innerText = 'ready';
        streamEventLabel.className = 'streamEvent-ready';
      }, 1000);
    } else {
      console.log(event);
      streamEventLabel.innerText = status === 'dont-care' ? event : status;
      streamEventLabel.className = 'streamEvent-' + status;
    }
  }
}

function setStreamVideoElement(stream) {
  if (!stream) return;
  streamVideoElement.srcObject = stream;
  streamVideoElement.loop = false;
  streamVideoElement.muted = !isStreamReady;

  if (streamVideoElement.paused) {
    streamVideoElement
      .play()
      .then((_) => {})
      .catch((e) => {});
  }
}

function playIdleVideo() {
  idleVideoElement.src = DID_API.service == 'clips' ? 'rian_idle.mp4' : 'emma_idle.mp4';
}

function stopAllStreams() {
  if (streamVideoElement.srcObject) {
    console.log('stopping video streams');
    streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    streamVideoElement.srcObject = null;
    streamVideoOpacity = 0;
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
  isStreamReady = !stream_warmup;
  streamVideoOpacity = 0;
  iceGatheringStatusLabel.innerText = '';
  signalingStatusLabel.innerText = '';
  iceStatusLabel.innerText = '';
  peerStatusLabel.innerText = '';
  streamEventLabel.innerText = '';
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
  if (agentId == "" || agentId === undefined) {
    return alert("1. Click on the 'Create new Agent with Knowledge' button\n2. Open the Console and wait for the process to complete\n3. Press on the 'Connect' button\n4. Type and send a message to the chat\nNOTE: You can store the created 'agentID' and 'chatId' variables at the bottom of the JS file for future chats");
  }

  if (peerConnection && peerConnection.connectionState === 'connected') {
    return;
  }
  stopAllStreams();
  closePC();

  try {
    console.log('Initializing connection...');
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg',
        stream_warmup: stream_warmup
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

    const sdpResponse = await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, {
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
const startButton = document.getElementById('start-button');
startButton.onclick = async () => {
  if (
    (peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') &&
    isStreamReady
  ) {
    // Pasting the user's message to the Chat History element
    document.getElementById("msgHistory").innerHTML += `<span style='opacity:0.5'><u>User:</u> ${textArea.value}</span><br>`;

    // Storing the Text Area value
    let txtAreaValue = document.getElementById("textArea").value;

    // Clearing the text-box element
    document.getElementById("textArea").value = "";

    // Agents Overview - Step 3: Send a Message to a Chat session - Send a message to a Chat
    try {
      const playResponse = await fetchWithRetries(`${DID_API.url}/agents/${agentId}/chat/${chatId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "streamId": streamId,
          "sessionId": sessionId,
          "messages": [
            {
              "role": "user",
              "content": txtAreaValue,
              "created_at": new Date().toString()
            }
          ]
        }),
      });

      const playResponseData = await playResponse.json();
      if (playResponse.status === 200 && playResponseData.chatMode === 'TextOnly') {
        console.log('User is out of credit, API only return text messages');
        document.getElementById('msgHistory').innerHTML += `<span style='opacity:0.5'> ${playResponseData.result}</span><br>`;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showErrorMessage('Failed to send message. Please try again.');
    }
  } else {
    console.log('Connection not ready or stream not ready');
    showErrorMessage('Connection or stream not ready. Please wait and try again.');
  }
};

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

    console.log('Stream destroyed successfully');
  } catch (error) {
    console.error('Error destroying stream:', error);
  }

  stopAllStreams();
  closePC();
};

// Agents API Workflow
async function agentsAPIworkflow() {
  agentIdLabel.innerHTML = `<span style='color:orange'>Processing...<style='color:orange'>`;
  chatIdLabel.innerHTML = `<span style='color:orange'>Processing...<style='color:orange'>`;
  axios.defaults.baseURL = `${DID_API.url}`;
  axios.defaults.headers.common['Authorization'] = `Basic ${DID_API.key}`;
  axios.defaults.headers.common['content-type'] = 'application/json';

  // Retry Mechanism (Polling) for this demo only - Please use Webhooks in real life applications! 
  // as described in https://docs.d-id.com/reference/knowledge-overview#%EF%B8%8F-step-2-add-documents-to-the-knowledge-base
  async function retry(url, retries = 1) {
    const maxRetryCount = 5; // Maximum number of retries
    const maxDelaySec = 10; // Maximum delay in seconds
    try {
      let response = await axios.get(`${url}`);
      if (response.data.status == "done") {
        return console.log(response.data.id + ": " + response.data.status);
      }
      else {
        throw new Error("Status is not 'done'");
      }
    } catch (err) {
      if (retries <= maxRetryCount) {
        const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        console.log(`Retrying ${retries}/${maxRetryCount}. ${err}`);
        return retry(url, retries + 1);
      } else {
        agentIdLabel.innerHTML = `<span style='color:red'>Failed</span>`;
        chatIdLabel.innerHTML = `<span style='color:red'>Failed</span>`;
        throw new Error(`Max retries exceeded. error: ${err}`);
      }
    }
  }

  try {
    // Knowledge Overview - Step 1: Create a new Knowledge Base
    const createKnowledge = await axios.post('/knowledge', {
      name: "knowledge",
      description: "D-ID Agents API"
    });
    console.log("Create Knowledge:", createKnowledge.data);

    let knowledgeId = createKnowledge.data.id;
    console.log("Knowledge ID: " + knowledgeId);

    // Knowledge Overview - Step 2: Add Documents to the Knowledge Base
    const createDocument = await axios.post(`/knowledge/${knowledgeId}/documents`, {
      text: "Prompt Engineering is the practice of designing and refining input prompts to effectively communicate with AI language models. It involves crafting clear, specific instructions to guide the model's responses. RAG (Retrieval-Augmented Generation) is a technique that enhances language models by retrieving relevant information from external sources before generating responses, improving accuracy and contextual relevance."
    });
    console.log("Create Document: ", createDocument.data);

    // Split the # to use in documentID
    let documentId = createDocument.data.id;
    let splitArr = documentId.split("#");
    documentId = splitArr[1];
    console.log("Document ID: " + documentId);

    // Knowledge Overview - Step 3: Retrieving the Document and Knowledge status
    await retry(`/knowledge/${knowledgeId}/documents/${documentId}`);
    await retry(`/knowledge/${knowledgeId}`);

    // Agents Overview - Step 1: Create an Agent
    const createAgent = await axios.post('/agents', {
      "knowledge": {
        "provider": "pinecone",
        "embedder": {
          "provider": "pinecone",
          "model": "ada02"
        },
        "id": knowledgeId
      },
      "presenter": {
        "type": "talk",
        "voice": {
          "type": "microsoft",
          "voice_id": "en-US-JennyMultilingualV2Neural"
        },
        "thumbnail": "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg",
        "source_url": "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg"
      },
      "llm": {
        "type": "openai",
        "provider": "openai",
        "model": "gpt-3.5-turbo-1106",
        "instructions": "Your name is Emma, an AI designed to assist with information about Prompt Engineering and RAG"
      },
      "preview_name": "Emma"
    });
    console.log("Create Agent: ", createAgent.data);
    let agentId = createAgent.data.id;
    console.log("Agent ID: " + agentId);

    // Agents Overview - Step 2: Create a new Chat session with the Agent
    const createChat = await axios.post(`/agents/${agentId}/chat`);
    console.log("Create Chat: ", createChat.data);
    let chatId = createChat.data.id;
    console.log("Chat ID: " + chatId);

    console.log("Create new Agent with Knowledge - DONE!\n Press on the 'Connect' button to proceed.\n Store the created 'agentID' and 'chatId' variables at the bottom of the JS file for future chats");
    agentIdLabel.innerHTML = agentId;
    chatIdLabel.innerHTML = chatId;
    return { agentId: agentId, chatId: chatId };
  } catch (error) {
    console.error('Error in agentsAPIworkflow:', error);
    agentIdLabel.innerHTML = `<span style='color:red'>Failed</span>`;
    chatIdLabel.innerHTML = `<span style='color:red'>Failed</span>`;
    throw error;
  }
}

const agentsButton = document.getElementById("agents-button");
agentsButton.onclick = async () => {
  try {
    const agentsIds = await agentsAPIworkflow();
    console.log(agentsIds);
    agentId = agentsIds.agentId;
    chatId = agentsIds.chatId;
  } catch (err) {
    console.error('Error creating agent:', err);
    showErrorMessage('Failed to create agent. Please try again.');
  }
};

function showErrorMessage(message) {
  const errorMessage = document.createElement('div');
  errorMessage.innerHTML = message;
  errorMessage.style.color = 'red';
  errorMessage.style.marginBottom = '10px';
  document.body.appendChild(errorMessage);

  setTimeout(() => {
    document.body.removeChild(errorMessage);
  }, 5000);
}

// Paste Your Created Agent and Chat IDs Here:
let agentId = "";
let chatId = "";
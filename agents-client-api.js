'use strict';
import DID_API from './api.js';

if (DID_API.key == '🤫') alert('Please put your api key inside ./api.json and restart..');

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
let agentId;
let chatId;

const videoElement = document.getElementById('video-element');
videoElement.setAttribute('playsinline', '');
const peerStatusLabel = document.getElementById('peer-status-label');
const iceStatusLabel = document.getElementById('ice-status-label');
const iceGatheringStatusLabel = document.getElementById('ice-gathering-status-label');
const signalingStatusLabel = document.getElementById('signaling-status-label');
const streamingStatusLabel = document.getElementById('streaming-status-label');
const agentIdLabel = document.getElementById('agentId-label');
const chatIdLabel = document.getElementById('chatId-label');
const textArea = document.getElementById("textArea");

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

function parseSdp(sdp) {
    const sections = sdp.split('\r\nm=');
    const parsed = { global: sections[0] };
    for (let i = 1; i < sections.length; i++) {
        const mediaType = sections[i].split(' ')[0];
        parsed[mediaType] = 'm=' + sections[i];
    }
    return parsed;
}

function filterCodecs(sdp, preferredVideoCodec) {
    const parsed = parseSdp(sdp);
    let modifiedSdp = parsed.global;

    if (parsed.audio) {
        modifiedSdp += '\r\n' + parsed.audio.replace('sendonly', 'recvonly');
    }

    if (parsed.video) {
        const videoLines = parsed.video.split('\r\n');
        let modifiedVideoLines = [];

        let rtxPayloadType;
        for (let line of videoLines) {
            if (line.startsWith('a=rtpmap:')) {
                const [, payloadType, codecName] = line.split(' ');
                if (codecName.startsWith(preferredVideoCodec)) {
                    modifiedVideoLines.push(line);
                } else if (codecName.startsWith('rtx')) {
                    rtxPayloadType = payloadType.split(':')[1];
                }
            } else if (line.startsWith('a=fmtp:') && rtxPayloadType && line.includes(`apt=${preferredVideoCodec.split('/')[0]}`)) {
                modifiedVideoLines.push(line);
            } else {
                modifiedVideoLines.push(line);
            }
        }

        modifiedSdp += '\r\n' + modifiedVideoLines.join('\r\n').replace('sendonly', 'recvonly');
    }

    if (parsed.application) {
        modifiedSdp += '\r\n' + parsed.application;
    }

    return modifiedSdp;
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

    const preferredVideoCodec = 'H264';
    const modifiedOffer = { type: offer.type, sdp: filterCodecs(offer.sdp, preferredVideoCodec) };

    await peerConnection.setRemoteDescription(modifiedOffer);
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
    }
}

function onIceConnectionStateChange() {
    iceStatusLabel.innerText = peerConnection.iceConnectionState;
    iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
    if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
        stopAllStreams();
        closePC();
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
    if (!event.track) return;

    statsIntervalId = setInterval(async () => {
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
    }, 500);
}

function setVideoElement(stream) {
    if (!stream) return;
    videoElement.classList.add("animated");

    videoElement.muted = false;

    videoElement.srcObject = stream;
    videoElement.loop = false;

    setTimeout(() => {
        videoElement.classList.remove("animated");
    }, 1000);

    if (videoElement.paused) {
        videoElement
            .play()
            .then((_) => {})
            .catch((e) => {});
    }
}

function playIdleVideo() {
    videoElement.classList.toggle("animated");

    videoElement.srcObject = undefined;
    videoElement.src = 'emma_idle.mp4';
    videoElement.loop = true;

    setTimeout(() => {
        videoElement.classList.remove("animated");
    }, 1000);
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

const maxRetryCount = 3;
const maxDelaySec = 4;
async function fetchWithRetries(url, options, retries = 1) {
    try {
        return await fetch(url, options);
    } catch (err) {
        if (retries <= maxRetryCount) {
            const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 1000;

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
    try {
        sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
        console.log('error during streaming setup', e);
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
};

const startButton = document.getElementById('start-button');
startButton.onclick = async () => {
    if (peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') {
        document.getElementById("msgHistory").innerHTML += `<span style='opacity:0.5'><u>User:</u> ${textArea.value}</span><br>`;

        let txtAreaValue = document.getElementById("textArea").value;
        document.getElementById("textArea").value = "";

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
            document.getElementById(
                'msgHistory'
            ).innerHTML += `<span style='opacity:0.5'> ${playResponseData.result}</span><br>`;
        }
    }
};

const destroyButton = document.getElementById('destroy-button');
destroyButton.onclick = async () => {
    await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
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

async function agentsAPIworkflow() {
  agentIdLabel.innerHTML = `<span style='color:orange'>Processing...<style='color:orange'>`;
  chatIdLabel.innerHTML = `<span style='color:orange'>Processing...<style='color:orange'>`;
  axios.defaults.baseURL = `${DID_API.url}`;
  axios.defaults.headers.common['Authorization'] = `Basic ${DID_API.key}`;
  axios.defaults.headers.common['content-type'] = 'application/json';

  async function retry(url, retries = 1) {
      const maxRetryCount = 5;
      const maxDelaySec = 10;
      try {
          let response = await axios.get(`${url}`);
          if (response.data.status == "done") {
              return console.log(response.data.id + ": " + response.data.status);
          } else {
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

  const createKnowledge = await axios.post('/knowledge', {
      name: "knowledge",
      description: "D-ID Agents API"
  });
  console.log("Create Knowledge:", createKnowledge.data);

  let knowledgeId = createKnowledge.data.id;
  console.log("Knowledge ID: " + knowledgeId);

  const createDocument = await axios.post(`/knowledge/${knowledgeId}/documents`, {
      "documentType": "pdf",
      "source_url": "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/Prompt_engineering_Wikipedia.pdf",
      "title": "Prompt Engineering Wikipedia Page PDF",
  });
  console.log("Create Document: ", createDocument.data);

  let documentId = createDocument.data.id;
  let splitArr = documentId.split("#");
  documentId = splitArr[1];
  console.log("Document ID: " + documentId);

  await retry(`/knowledge/${knowledgeId}/documents/${documentId}`);
  await retry(`/knowledge/${knowledgeId}`);

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

  const createChat = await axios.post(`/agents/${agentId}/chat`);
  console.log("Create Chat: ", createChat.data);
  let chatId = createChat.data.id;
  console.log("Chat ID: " + chatId);

  console.log("Create new Agent with Knowledge - DONE!\n Press on the 'Connect' button to proceed.\n Store the created 'agentID' and 'chatId' variables at the bottom of the JS file for future chats");
  agentIdLabel.innerHTML = agentId;
  chatIdLabel.innerHTML = chatId;
  return { agentId: agentId, chatId: chatId };
}

document.addEventListener('DOMContentLoaded', function() {
  const agentsButton = document.getElementById("agents-button");
  agentsButton.onclick = async () => {
      try {
          const agentsIds = {} = await agentsAPIworkflow();
          console.log(agentsIds);
          agentId = agentsIds.agentId;
          chatId = agentsIds.chatId;
          return;
      } catch (err) {
          agentIdLabel.innerHTML = `<span style='color:red'>Failed</span>`;
          chatIdLabel.innerHTML = `<span style='color:red'>Failed</span>`;
          throw new Error(err);
      }
  };
});

agentId = "";
chatId = "";
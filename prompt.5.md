

Docs:
```
---
Overview 📙
===========

✴️ Streams Overview
---------------------------------------------------------------------------------

![](https://create-images-results.d-id.com/api_docs/assets/streaming_cover_v3.png)\
The D-ID Live Streaming API allows you to use D-ID's AI tools to generate videos of digital humans from a single photo, in real time. This powerful functionality opens up various use cases, such as virtual assistants, interactive broadcasting, online education & training, and more. This document provides an overview of the Live Streaming API's features and guides you through the steps required to set up a video streaming session in real time. See a working example of Chat.D-ID app utilizes realtime streaming API [here](https://chat.d-id.com/)

Chat.D-ID is an interactive chatbot application that showcases the power of the D-ID Live Streaming API. It features a real-time chatbot digital human that engages in dynamic conversations with users. You can experience the power of real-time video streaming as the digital human avatar responds to your queries with personalized video messages. [Try it](https://chat.d-id.com/)

✴️ When Not to Use Streaming

The Live Streaming API provides a dedicated [/talks/streams](https://docs.d-id.com/reference/createstream) endpoint specifically designed for real-time video streaming. However, if your requirement involves asynchronous video generation, where you can submit input and receive the generated video as a downloadable video file once it's ready, you should refer to the [/talks](https://docs.d-id.com/reference/createtalk) endpoint instead.\
✴️ Streaming Protocol


D-ID's Live Streaming protocol is based on WebRTC (Web Real-Time Communication) which is a technology that enables real-time communication, including audio, video, and data streaming, directly between web browsers or other compatible applications. It establishes a peer-to-peer connection between the participants, allowing for efficient and low-latency streaming. To learn more about WebRTC and its underlying concepts, you can visit the [WebRTC website](https://webrtc.org/). In the context of this document, we'll focus on the key aspects related to setting up a video streaming session.

✴️ Terminology

WebRTC\
create a new streamSDP Offer\
start a streamICE Candidates\
submit network information

WebRTC establishes a connection between two or more parties, allowing them to exchange audio, video, and data. This connection is peer-to-peer and is established using D-ID's signaling server.Session Description Protocol (SDP) is used to negotiate and exchange session details between peers. The initiating peer sends an SDP offer containing its capabilities, and the receiving peer responds with an SDP answer that includes its own capabilities.Interactive Connectivity Establishment (ICE) is a technique used to determine the most suitable network path between peers. ICE candidates represent possible IP addresses and transport protocols that can be used for the connection.


✴️ Ready to Start

5 Steps\
is all it takes


✴️ Step 1: Create a new stream

[](https://docs.d-id.com/reference/talks-streams-overview#%EF%B8%8F-step-1-create-a-new-stream)

To initiate a video streaming session, make a POST request to [/streams](https://docs.d-id.com/reference/createstream) endpoint. In the request's body, you must provide a `source_url` pointing to the photo you wish to animate in the stream. This request will provide you with a unique `id` (referred to as `stream_id` in other requests) and a session ID. The stream ID serves as a unique identifier for the streaming session, while the session ID needs to be included in subsequent requests' bodies to ensure they reach the correct server instance.

Here's an example of the request you should send:

JavaScript

`

const sessionResponse = await fetchWithRetries(`https://api.d-id.com/talks/streams`, {
    method: 'POST',
    headers: {
      Authorization: `Basic {YOUR_DID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: `{AVATAR_IMAGE_URL}`,
    }),
  });

`

And an example of the response you would get:

Response

`

{
  "id": "your_stream_id",
  "session_id": "your_session_id",
  "offer": "your_sdp_offer",
  "ice_servers": [
    {
      "urls": ["stun:stun.example.com"]
    }
  ]
}

`

Make sure to extract and store both the stream ID (`your_stream_id`) and session ID (`your_session_id`) for further usage in subsequent steps.

####

✴️ Step 2: Starting the stream


After receiving the SDP offer from the server in Step 1, you need to generate the SDP answer and send it back. To obtain the SDP answer, you can use WebRTC APIs or libraries that provide the necessary functionality. Here is a general outline of the steps involved:

1.  Create a WebRTC peer connection object in your application.
2.  Set the received SDP offer as the remote description of the peer connection using the `setRemoteDescription()` method.
3.  Generate the SDP answer by calling the `createAnswer()` method on the peer connection.
4.  Set the generated SDP answer as the local description of the peer connection using the `setLocalDescription()` method.

Once you have obtained the SDP answer as a string, you can send it back to the server using the [/talks/streams/{session_id}/sdp](https://docs.d-id.com/reference/startconnection) endpoint.

Here's an example of the answer creation code,
JavaScript

`

async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({ iceServers });
// Here we add event listeners for any events we want to handle
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);
  }

  await peerConnection.setRemoteDescription(offer);
  const sessionClientAnswer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(sessionClientAnswer);

  return sessionClientAnswer;
}
...
const sdpResponse = await fetch(`https://api.d-id.com/talks/streams/${streamId}/sdp`, {
    method: 'POST',
    headers: {
      Authorization: `Basic {YOUR_DID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      answer: sessionClientAnswer,
      session_id: sessionId,
    }),
  });
};

`

####

✴️ Step 3: Submit network information


Once the SDP answer is sent, you must gather ICE candidates and send them to the server to complete the WebRTC handshake. ICE candidates allow the peers to discover and establish an optimal network path for communication.

Listen for the `icecandidate` event on your peer connection object and send each ICE candidate to the server using the [/talks/streams/{stream_id}/ice](https://docs.d-id.com/reference/addicecandidate) endpoint. Replace `{stream_id}` with the appropriate stream ID obtained in Step 1. From the ice candidates you receive, you should only send the `candidate`, `sdpMid`, and `sdpMLineIndex` attributes.

Here's an example of the `icecandidate` event handler from our streaming [demo repository](https://github.com/de-id/live-streaming-demo):

JavaScript

`

function onIceCandidate(event) {
  if (event.candidate) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;

    fetch(`https://api.d-id.com/talks/streams/${streamId}/ice`, {
      method: 'POST',
      headers: {
        Authorization: `Basic {YOUR_DID_API_KEY}`,
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

`

####

Waiting for Connection Readiness:


After sending the SDP answer and the ICE candidates, you need to wait for the WebRTC connection to become ready. Listen for the `iceconnectionstatechange` event on your peer connection object and check for the `iceConnectionState` property. When the connection state changes to `connected` or `completed`, the connection is ready to proceed. This event listener is one of those we used in Step 2, specifically, `onIceConnectionStateChange`

####

✴️ Step 4: Create a talk stream

With the connection established, you can now create a talk. Make a POST request to [/talks/streams/{stream_id}](https://docs.d-id.com/reference/createtalkstream) endpoint to request a video to be created and streamed over the established connection. Remember to include the session ID in the request body. In this request you can send the details of the audio or text for the avatar to speak, along with additional configuration options that allow for greater flexibility and customization.

####

✴️ Step 5: Closing the stream


To close the video streaming session, make a DELETE request to [/talks/streams/{stream_id}](https://docs.d-id.com/reference/deletestream) endpoint. This will close the connection and end the session. If no messages are sent within the session for 5 minutes, the session will be automatically terminated.

Here is an example of the request:

JavaScript

`

fetch(`https://api.d-id.com/talks/streams/${streamId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic {YOUR_DID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

`

✴️ Developer Starter Code


For a code example demonstrating the entire process, you can visit the D-ID Live Streaming Demo repository. The repository provides a starter code to help you get started with implementing the D-ID Streaming API in your own applications. By following these steps, you can leverage the D-ID Live Streaming API to create engaging and interactive video streaming experiences that incorporate real-time speaking digital avatars.

Initial setup:

-   Clone [this repo](https://github.com/de-id/live-streaming-demo) from GitHub
-   Install express: open a terminal in the folder and run `npm install express`
-   Add your API key: edit the `api.json` inside the uncompressed folder and add your key there

Start the example app:

-   Bring up the app in the folder (ctr left click on folder through finder)
-   Open the terminal, run `node app.js`
-   You should see this message: `server started on port localhost:3000`
-   Open the app in the browser, add `localhost:3000`
-   Connect: press connect you should see the connection ready
-   Stream: press the start button to start streaming

streaming-client-api.js:

`
'use strict';
import DID_API from './api.js';

const GROQ_API_KEY = DID_API.groqKey;
const DEEPGRAM_API_KEY = DID_API.deepgramKey;

if (DID_API.key == '🤫') alert('Please put your api key inside ./api.json and restart..');
const RTCPeerConnection = (window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection).bind(window);

let peerConnection;
let streamId;
let sessionId;
let sessionClientAnswer;


const talkVideo = document.getElementById('talk-video');
talkVideo.setAttribute('playsinline', '');
const peerStatusLabel = document.getElementById('peer-status-label');
const iceStatusLabel = document.getElementById('ice-status-label');
const iceGatheringStatusLabel = document.getElementById('ice-gathering-status-label');
const signalingStatusLabel = document.getElementById('signaling-status-label');

const connectButton = document.getElementById('connect-button');
connectButton.onclick = async () => {
  if (peerConnection && peerConnection.connectionState === 'connected') {
    return;
  }

  stopAllStreams();
  closePC();

  const sessionResponse = await fetch(`${DID_API.url}/talks/streams`, {
    method: 'POST',
    headers: {'Authorization': `Basic ${DID_API.key}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      source_url: "https://d-id-public-bucket.s3.amazonaws.com/or-roman.jpg"
    }),
  });

  
  const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json()
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

  const sdpResponse = await fetch(`${DID_API.url}/talks/streams/${streamId}/sdp`,
    {
      method: 'POST',
      headers: {Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({answer: sessionClientAnswer, session_id: sessionId})
    });
};

const talkButton = document.getElementById('talk-button');
talkButton.onclick = async () => {
  // connectionState not supported in firefox
  if (peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') {
    const talkResponse = await fetch(`${DID_API.url}/talks/streams/${streamId}`,
      {
        method: 'POST',
        headers: { Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'script': {
            'type': 'audio',
            'audio_url': 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/webrtc.mp3',
          },
          'driver_url': 'bank://lively/',
          'config': {
            'stitch': true,
          },
          'session_id': sessionId
        })
      });
  }};

const destroyButton = document.getElementById('destroy-button');
destroyButton.onclick = async () => {
  await fetch(`${DID_API.url}/talks/streams/${streamId}`,
    {
      method: 'DELETE',
      headers: {Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({session_id: sessionId})
    });

  stopAllStreams();
  closePC();
};

function onIceGatheringStateChange() {
  iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
  iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
}
function onIceCandidate(event) {
  console.log('onIceCandidate', event);
  if (event.candidate) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;
    
    fetch(`${DID_API.url}/talks/streams/${streamId}/ice`,
      {
        method: 'POST',
        headers: {Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json'},
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
  }
}
function onConnectionStateChange() {
  // not supported in firefox
  peerStatusLabel.innerText = peerConnection.connectionState;
  peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
}
function onSignalingStateChange() {
  signalingStatusLabel.innerText = peerConnection.signalingState;
  signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
}
function onTrack(event) {
  const remoteStream = event.streams[0];
  setVideoElement(remoteStream);
}

async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({iceServers});
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

function setVideoElement(stream) {
  if (!stream) return;
  talkVideo.srcObject = stream;

  // safari hotfix
  if (talkVideo.paused) {
    talkVideo.play().then(_ => {}).catch(e => {});
  }
}

function stopAllStreams() {
  if (talkVideo.srcObject) {
    console.log('stopping video streams');
    talkVideo.srcObject.getTracks().forEach(track => track.stop());
    talkVideo.srcObject = null;
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
  iceGatheringStatusLabel.innerText = '';
  signalingStatusLabel.innerText = '';
  iceStatusLabel.innerText = '';
  peerStatusLabel.innerText = '';
  console.log('stopped peer connection');
  if (pc === peerConnection) {
    peerConnection = null;
  }
}
`

Create a new stream
===================

posthttps://api.d-id.com/talks/streams

Initiates the creation of a new WebRTC connection to a browser peer. The endpoint returns the necessary information to set up and manage the connection.

Step 1\
Create a new stream

![](https://create-images-results.d-id.com/api_docs/assets/step1.png)

To initiate a video streaming session, make a POST request to this endpoint. In the request's body, you must provide a `source_url` pointing to the photo you wish to animate in the stream. This request will provide you with a unique `id` (referred to as `stream_id` in other requests) and a session ID. The stream ID serves as a unique identifier for the streaming session, while the session ID needs to be included in subsequent requests' bodies to ensure they reach the correct server instance. [Learn more](https://docs.d-id.com/reference/overview-1#-ready-to-start)

Body Params:
source_url
string
required
URL to a photo you wish to animate in the stream
driver_url - string - The URL of the driver video to drive the talk, or a selection from the list or provided drivers.\
If not provided a driver video will be selected for you from the predefined drivers bank.
face - object - the face to animate - otherwise detects the dominant face face object

config object
Advanced configuration options.
compatibility_mode - Defines the video codec to be used in the stream. - When set to on: VP8 will be used.\  -  When set to off: H264 will be used\  - When set to auto the codec will be selected according to the browser.
stream_warmup - boolean (true/false) - Whether to stream wamrup video on the connection.\ If set to true, will stream a warmup video when connection is established.\ At the end of the warmup video, a message containing "stream/ready" will be sent on the data channel. This is a good speed up.
session_timeout - double - Maximum duration (in seconds) between messages before session times out.\ - 

Example:
Headers
curl --request POST \
     --url https://api.d-id.com/talks/streams \
    --header 'accept: application/json' \
    --header 'authorization: Basic YWRtaW4xQHNrb29wLmRpZ2l0YWw6RGp6Uzg1SzRXKlg5' \
     --header 'content-type: application/json' \
     --data '
{
  "face": {
    "top_left": [
      0,
      0
    ],
    "size": 512
  },
  "config": {
    "motion_factor": 0,
    "align_expand_factor": 0,
    "stitch": true
  },
  "stream_warmup": true,
  "source_url": "string",
  "driver_url": "string",
  "compatibility_mode": "on",
  "session_timeout": 180,
  "output_resolution": 512
}
'

Start a stream
post
https://api.d-id.com/talks/streams/{id}/sdp
Updates the server with the SDP answer to the SDP offer received from the initial call to the /streams endpoint, during the offer/answer negotiation of a WebRTC connection.

Step 2
Start a stream

After receiving the SDP offer from the server in Step 1, you need to generate the SDP answer and send it back. To obtain the SDP answer, you can use WebRTC APIs or libraries that provide the necessary functionality. Learn more

Path Params
id
string
required
the stream identifier

Body Params
session_id
string
Session identifier information, should be returned in the body of all streaming requests (from the response
of the POST /streams)

answer
object
required
Jsep answer object used to create a peer connection

answer object
type
string | null
required
The SDP contained in the sdp property is the definitive choice in the exchange. In other words, this session
description describes the agreed-upon configuration, and is being sent to finalize negotiation.

answer
sdp
string
required
Describe the media communication sessions to accept the session the is being negotiated

Headers



Step 3
Submit network information

Submit network information
post
https://api.d-id.com/talks/streams/{id}/ice
Updates the server with a WebRTC ICE candidate. If the candidate parameter is missing or a value of null is given the added ICE candidate is an "end-of-candidates" indicator.

Once the SDP answer is sent, you must gather ICE candidates and send them to the server to complete the WebRTC handshake. ICE candidates allow the peers to discover and establish an optimal network path for communication. Listen for the icecandidate event on your peer connection object and send each ICE candidate to the server using this endpoint. Replace {stream_id} with the appropriate stream ID obtained in Step 1. From the ice candidates you receive, you should only send the candidate, sdpMid, and sdpMLineIndex attributes. Learn more

Path Params
id
string
required
the stream identifier

Body Params
IceCandidate
candidate
string
required
A string representing the transport address for the candidate that can be used for connectivity checks.
The format of this address is a candidate-attribute as defined in RFC 5245. This string is empty ("") if the
RTCIceCandidate is an "end of candidates" indicator.

sdpMid
string
required
A string specifying the candidate's media stream identification tag which uniquely identifies the media stream
within the component with which the candidate is associated, or null if no such association exists.

sdpMLineIndex
double
required
If not null, sdpMLineIndex indicates the zero-based index number of the media description (as defined in RFC
4566) in the SDP with which the candidate is associated.

session_id
string
Session identifier information, should be returned in the body of all streaming requests (from the response
of the POST /streams)


Option 2
Headers

session_id
string
Session identifier information, should be returned in the body of all streaming requests (from the response
of the POST /streams)




Step 4\
Create a talk stream
====================

posthttps://api.d-id.com/talks/streams/{id}


![](https://create-images-results.d-id.com/api_docs/assets/step4.png)

With the connection established, you can now create a talk. Make a POST request to this endpoint to request a video to be created and streamed over the established connection. Remember to include the session ID in the request body. In this request you can send the details of the audio or text for the avatar to speak, along with additional configuration options that allow for greater flexibility and customization. [Learn more](https://docs.d-id.com/reference/overview-1#-ready-to-start)

Path Params
id - string - required
the stream identifier

Body Params
session_id - string
result_url - string - The URL to save the video result.
script - required - Stream_Text_Script
type - string | null - required - The type of the script.

provider - text-to-speech provider from list of supported providers. default is microsoft tts

Microsoft_tts_provider1
AzureMicrosoft provider details, contains the provider type and requested voice id and style
type - string - required

microsoft 
voice_id - string - required - Defaults to en-US-JennyNeural

The voice_id from the list of available voices.\
For full list of voice_ids: <https://docs.d-id.com/reference/microsoft-azure>

voice_config
object
Voice customization options
voice_config object
language - string
Voice customization options. To save the language of the selected agent voice

Elevenlabs_stream_tts_provider1
input - string - required - The input text that will be synthesized to an audio file.\
Note that each provider has its own limitations on the text length.
ssml - boolean - Defaults to false - Is the text provided in ssml form.

config
object
Construct a type with the properties of T except for those in type K.
config object
user_data
string
Non-sensitive custom data that will be added to the talk response and webhook.


Step 4\
Create a talk stream
example:
Create a talk stream
====================

posthttps://api.d-id.com/talks/streams/{id}


![](https://create-images-results.d-id.com/api_docs/assets/step4.png)

With the connection established, you can now create a talk. Make a POST request to this endpoint to request a video to be created and streamed over the established connection. Remember to include the session ID in the request body. In this request you can send the details of the audio or text for the avatar to speak, along with additional configuration options that allow for greater flexibility and customization. [Learn more](https://docs.d-id.com/reference/overview-1#-ready-to-start)

Path Params
id - string - the stream identifier

Body Params
session_id
result_url - The URL to save the video result.
Stream_Text_Script - type - string | null
The type of the script.
provider - text-to-speech provider from list of supported providers. default is microsoft tts

Microsoft_tts_provider1
AzureMicrosoft provider details, contains the provider type and requested voice id and style
type

microsoft
voice_id
Defaults to en-US-JennyNeural
he voice_id from the list of available voices.\
For full list of voice_ids: <https://docs.d-id.com/reference/microsoft-azure>

voice_config
object
Voice customization options

voice_config object
language
string
Voice customization options. To save the language of the selected agent voice

Elevenlabs_stream_tts_provider1

ssml - boolean - Is the text provided in ssml form.


The name of the talk video

audio_optimization - double - Defaults to 2 - The optimization level of the audio


Headers
x-api-key-external

string

It is possible to add external API key for TTS generation, to access the API programmatically. The x-api-key-external header must be added, the required value format is {"elevenlabs": "your-api-key"}. Note: Your ElevenLabs quota consumes. Example: x-api-key-external: "{"elevenlabs": "ABCDEFGH123456"}"

Show Deprecated
---

```



Repo:
---

The following text is a Git repository with code. The structure of the text are sections that begin with ----, followed by a single line containing the file path and file name, followed by a variable amount of lines containing the file contents. The text representing the Git repository ends when the symbols --END-- are encounted. Any further text beyond --END-- are meant to be interpreted as instructions using the aforementioned Git repository as context.
----
README.md
# Streaming Live Demo by D-ID

* (install express) Open a terminal in the folder and run - `npm install express`
* (add your API key) Edit the `api.json` inside the uncompressed folder and replace the emoji with your key
* (select service) in the same `api.json` file, edit the `service` field to choose your avatar type, use `talks` for an avatar made from an image or `clips` to use a premade HQ avatar from a video

## Start Streaming Demo:
* (bring up the app) in the folder (ctr left click on folder through finder) open the terminal run `node app.js`
* you should see this message - server started on port localhost:3000
* (open the app) In the browser add localhost:3000
* (connect) press connect you should see the connection ready 
* (stream) Press the start button to start streaming
<img src="./app.png" alt="Streaming App" width="200"/>

## ⭐ Start Agents Demo [NEW!] ⭐
* (bring up the app) in the folder (ctr left click on folder through finder) open the terminal `run node app.js` 
* you should see this message - server started on port localhost:3000
* (open the app) In the browser add localhost:3000/agents
* press 'Create new Agent with Knowledge' to create a new Agent. All API endpoints' responses are visible in the console. 
* press 'Connect' to connect to the agent, once done, type a message and press 'Send' to start a chat
* you can store the created `agentId` and `chatID` variables and at the bottom of the `agents-client-api.js` file for future chats with your newly created Agent.
![app](./agents_app.png)

----
agents-client-api.js
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

  // Show loading symbol
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
    // Remove loading symbol
    document.body.removeChild(loadingSymbol);
  } catch (error) {
    console.error('Error during auto-initialization:', error);
    // Remove loading symbol and show error message
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

  // Show destroy and connect buttons
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

    // WEBRTC API CALL 3 - Submit network information
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
    showErrorMessage('Connection lost. Please try again.');
  }

}
function onConnectionStateChange() {
  // not supported in firefox
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
  /**
   * The following code is designed to provide information about whether there is currently data
   * that's being streamed - It does so by periodically looking for changes in total stream data size
   *
   * This information in our case is used in order to show idle video while no video is streaming.
   * To create this idle video, use the POST https://api.d-id.com/talks (or clips) endpoint with a silent audio file or a text script with only ssml breaks
   * https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html#break-tag
   * for seamless results, use `config.fluent: true` and provide the same configuration as the streaming video
   */

  if (!event.track) return;

  statsIntervalId = setInterval(async () => {
    if (peerConnection && event.track) {
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
    }
  }, 300);
}

function setVideoElement(stream) {
  if (!stream) return;
  // Add Animation Class
  videoElement.classList.add("animated")

  // Removing browsers' autoplay's 'Mute' Requirement
  videoElement.muted = false;

  videoElement.srcObject = stream;
  videoElement.loop = false;

  // Remove Animation Class after it's completed
  setTimeout(() => {
    videoElement.classList.remove("animated")
  }, 300);

  // safari hotfix
  if (videoElement.paused) {
    videoElement
      .play()
      .then((_) => { })
      .catch((e) => { });
  }
}
function playIdleVideo() {
  // Add Animation Class
  videoElement.classList.toggle("animated")

  videoElement.srcObject = undefined;
  videoElement.src = 'emma_idle.mp4';
  videoElement.loop = true;

  // Remove Animation Class after it's completed
  setTimeout(() => {
    videoElement.classList.remove("animated")
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

const connectButton = document.getElementById('connect-button');
connectButton.onclick = async () => {


  if (peerConnection && peerConnection.connectionState === 'connected') {
    return;
  }
  stopAllStreams();
  closePC();

  // WEBRTC API CALL 1 - Create a new stream
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

  // WEBRTC API CALL 2 - Start a stream
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




async function startStreaming(assistantReply) {
  try {
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
        },
        config: {
          fluent: true,
          pad_audio: 0,
        },
        session_id: sessionId,
      }),
    });
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
    console.log('Connection opened');
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
        console.log("Sent KeepAlive message");
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
      document.getElementById('msgHistory').innerHTML = document.getElementById('msgHistory').innerHTML.replace(/<span style='opacity:0.5'><u>User \(interim\):<\/u>.*<\/span><br>/, `<span style='opacity:0.5'><u>User (interim):</u> ${transcript}</span><br>`);
    }
  };

  deepgramSocket.onclose = async () => {
    console.log('WebSocket connection closed');
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

  // Clear transcription timer
  clearInterval(transcriptionTimer);

  // Clear inactivity timeout
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

  // Clear transcription timer
  clearInterval(transcriptionTimer);

  // Clear inactivity timeout
  clearTimeout(inactivityTimeout);

  // Reset transcription state
  transcript = '';
  chatHistory = chatHistory.slice(0, -1); // Remove the last incomplete transcription from the chat history

  // Update UI to remove the incomplete transcription
  const msgHistory = document.getElementById('msgHistory');
  msgHistory.innerHTML = msgHistory.innerHTML.slice(0, msgHistory.innerHTML.lastIndexOf('<span style=\'opacity:0.5\'><u>User:</u>'));

  await connectButton.onclick();
  await startRecording();
}

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



----
api.js
export default {
    key: "YWRtaW4xQHNrb29wLmRpZ2l0YWw:1FItMzMiqjms0QwfA9g8p",
    url: "https://api.d-id.com",
    service: "talks",
    groqKey: "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",
    deepgramKey: "ab184815a3899aea7e3add69b9d5b7bc6894dc74"
};
----
app.js
const express = require('express');
const http = require('http');
const cors = require('cors');

const port = 3000;

const app = express();
app.use(cors());

app.use('/', express.static(__dirname, {
    setHeaders: (res, path) => {
      if (path.endsWith('.json')) {
        res.type('application/javascript');
      }
    }
  }));

app.use('/', express.static(__dirname));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html')
});
app.get('/agents', function(req, res) {
    res.sendFile(__dirname + '/index-agents.html')
});

const server = http.createServer(app);

server.listen(port, () => console.log(`Server started on port localhost:${port}`));


----
groqServer.js
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
const port = 3001;

const GROQ_API_KEY = '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';
const groq = new Groq({ apiKey: GROQ_API_KEY });

app.use(cors());
app.use(express.json());;

app.post('/chat', async (req, res) => {
  const { messages, model } = req.body;

  try {
    const completion = await groq.chat.completions.create({
      messages,
      model,
      stream: true,
    });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    for await (const chunk of completion) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
----
index-agents.html
<!DOCTYPE html>
<html>

<head>
  <title>D-ID Agents API Demo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style-agents.css">
  <link rel="icon" type="image/png" sizes="192x192" href="https://studio.d-id.com/favicon/favicon-192x192.png">
</head>

<body>
  <div id="content">
    <div id="status">
      <h4>WebRTC Connection Status</h4>
      ICE gathering status: <label id="ice-gathering-status-label"></label><br />
      ICE status: <label id="ice-status-label"></label><br />
      Peer connection status: <label id="peer-status-label"></label><br />
      Signaling status: <label id="signaling-status-label"></label><br />
      Streaming status: <label id="streaming-status-label"></label><br />
      <br>
      <div id="buttons">
        <button id="connect-button" type="button">Connect</button>
        <button id="destroy-button" type="button">Destroy</button>
      </div>
    </div>

    <div id="video-wrapper">
      <div>
        <video id="video-element" width="400" height="400" src="" autoplay loop muted class="animated"></video>
      </div>
    </div>

    <div class="chat">
      <h4>Chat History</h4>
      <div id="msgHistory">
      </div>
    </div>
  </div>



  </div>
  <div>
    <h3>Click the button below to start speaking:</h3>
 <button id="start-button"
      type="button">Speak</button>
  </div>

  <script type="module" src="./agents-client-api.js"></script>
</body>

</html>
----
index-agents.js
import './agents-client-api.js';

----
index.html
<!DOCTYPE html>
<html>
  <head>
    <title>D-ID Streaming POC</title>
    <!-- added google fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;700&display=swap"
      rel="stylesheet"
    />

    <style>
      .peerConnectionState-new {
        color: cornflowerblue;
      }
      .peerConnectionState-connecting {
        color: orange;
      }
      .peerConnectionState-connected {
        color: green;
      }
      .peerConnectionState-disconnected,
      .peerConnectionState-closed,
      .peerConnectionState-failed {
        color: red;
      }

      .iceConnectionState-new {
        color: cornflowerblue;
      }
      .iceConnectionState-checking {
        color: orange;
      }
      .iceConnectionState-connected,
      .iceConnectionState-completed {
        color: green;
      }
      .peerConnectionState-disconnected,
      .peerConnectionState-closed,
      .peerConnectionState-failed {
        color: red;
      }

      .iceGatheringState-new {
        color: cornflowerblue;
      }
      .iceGatheringState-gathering {
        color: orange;
      }
      .iceGatheringState-complete {
        color: black;
      }

      .signalingState-stable {
        color: green;
      }
      .signalingState-have-local-offer,
      .signalingState-have-remote-offer,
      .signalingState-have-local-pranswer,
      .signalingState-have-remote-pranswer {
        color: cornflowerblue;
      }
      .signalingState-closed {
        color: red;
      }

      .streamingState-streaming {
        color: green;
      }

      .streamingState-empty {
        color: grey;
      }

      /* added css from here */

      body * {
        font-family: 'Mulish', sans-serif;
        text-align: center;
      }

      #content {
        width: 820px;
        position: relative;
        margin: 0 auto;
      }

      #buttons {
        clear: both;
        padding: 0 0 0 0;
        text-align: center;
      }

      button {
        padding: 10px 20px;
        border-radius: 5px;
        border: none;
        font-size: 16px;
        margin: 0 5px;
        background-color: #7459fe;
        color: #fff;
      }

      button:hover {
        background-color: #9480ff;
        cursor: pointer;
        transition: all 0.2s ease-out;
      }

      #status {
        clear: both;
        padding: 20px 0 0 0;
        text-align: left;
        display: inline-block;
        zoom: 1;
        line-height: 140%;
        font-size: 15px;
      }

      #status div {
        padding-bottom: 10px;
      }

      #video-wrapper {
        background: url(bg.png);
        height: 500px;
        background-position: top;
      }

      #video-wrapper div {
        width: 400px;
        margin: 0 auto;
        padding: 50px 0 0 0;
      }
      video {
        display: block;
        /*border:1px solid;*/
        border-radius: 50%;
        background-color: #fff;
      }
    </style>
  </head>

  <body>
    <!-- adde "id=content" -->
    <div id="content">
      <!-- added "id=video-wrapper" -->
      <div id="video-wrapper">
        <div>
          <video id="video-element" width="400" height="400" autoplay></video>
        </div>
      </div>
      <br />

      <!-- added div#buttons -->
      <div id="buttons">
        <button id="connect-button" type="button">Connect</button>
        <button id="start-button" type="button">Start</button>
        <button id="destroy-button" type="button">Destroy</button>
      </div>

      <!-- added div#status -->
      <div id="status">
        <!-- removed the wrapping <div> tags -->
        ICE gathering status: <label id="ice-gathering-status-label"></label
        ><br />
        ICE status: <label id="ice-status-label"></label><br />
        Peer connection status: <label id="peer-status-label"></label><br />
        Signaling status: <label id="signaling-status-label"></label><br />
        Streaming status: <label id="streaming-status-label"></label><br />
      </div>
    </div>

    <script type="module" src="./index.js"></script>
  </body>
</html>

----
index.js
import './streaming-client-api.js';

----
package.json
{
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "groq-sdk": "^0.5.0"
  },
  "scripts": {
    "dev": "node app.js"
  }
}
----
style-agents.css
.peerConnectionState-new {
  color: cornflowerblue;
}
.peerConnectionState-connecting {
  color: orange;
}
.peerConnectionState-connected {
  color: green;
}
.peerConnectionState-disconnected,
.peerConnectionState-closed,
.peerConnectionState-failed {
  color: red;
}

.iceConnectionState-new {
  color: cornflowerblue;
}
.iceConnectionState-checking {
  color: orange;
}
.iceConnectionState-connected,
.iceConnectionState-completed {
  color: green;
}
.peerConnectionState-disconnected,
.peerConnectionState-closed,
.peerConnectionState-failed {
  color: red;
}

.iceGatheringState-new {
  color: cornflowerblue;
}
.iceGatheringState-gathering {
  color: orange;
}
.iceGatheringState-complete {
  color: black;
}

.signalingState-stable {
  color: green;
}
.signalingState-have-local-offer,
.signalingState-have-remote-offer,
.signalingState-have-local-pranswer,
.signalingState-have-remote-pranswer {
  color: cornflowerblue;
}
.signalingState-closed {
  color: red;
}

.streamingState-streaming {
  color: green;
}

.streamingState-empty {
  color: grey;
}

#agentId-label, #chatId-label{
  color: green;
}

/* added css from here */

body * {
  font-family: 'Mulish', sans-serif;
  text-align: center;
}

#content {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  margin-top: 50px;
}

#buttons {
  clear: both;
  padding: 0 0 0 0;
  text-align: center;
}

button {
  padding: 10px 20px;
  border-radius: 5px;
  border: none;
  font-size: 16px;
  margin: 0 5px;
  background-color: #7459fe;
  color: #fff;
}

button#connect-button {
background-color: green;
}
button#destroy-button{
  background-color: red;
}

button#start-button{
  margin: 1em;
}

button:hover, #destroy-button:hover,#connect-button:hover {
  filter: brightness(85%);
  cursor: pointer;
  transition: all 0.2s ease-out;
}

h4{
  margin: 0;
  margin-bottom: 10px;
}

#destroy-button, #connect-button {
  display: none;
}

textarea {
  font-size: 16px;
  text-align: center;
  width: 500px;
  border-radius: 5px;
  padding: 10px 20px;
  border: 2px solid #7459fe;
  font-size: 16px;
  margin: 0 5px;
}

#msgHistory {
  overflow-y: auto;
  line-break: loose;
}

#status {
  display: inline-block;
  zoom: 1;
  line-height: 140%;
  font-size: 15px;
  width: 400px;
}

#status div {
  padding-bottom: 10px;
}

#video-wrapper {
  /* height: 500px; */
  width: 400px;
  height: 400px;
  background-position: top;
}

.chat{
  width: 400px;
}


video {
  /* display: block; */
  border-radius: 50%;
  background-image: url("emma_idle.png");
  background-position: top;
  /* position: absolute; */
  background-size: contain;
}

.animated {
  animation: opacityAnimation 0.2s ease-in-out;
}

@keyframes opacityAnimation {
from { opacity: 0.8; }
to { opacity: 1; }
}

--END--

---


Important note:
```

Overview

This report details the implementation of a real-time avatar video streaming solution using the D-ID API, integrated with WebRTC, Groq for language model interactions, and Deepgram for speech-to-text functionality. The solution enables a conversational AI avatar that responds to user speech with generated video and audio.

Problem Statement

The initial implementation faced issues with video playback, where the D-ID avatar would remain in an idle state despite successful audio transcription and text responses. The main challenges included:

Incorrect WebRTC configuration for receiving video streams

Improper handling of track events and statistics

Compatibility issues with different video codecs

Solution

The solution involved several key modifications to the agents-client-api.js file:

1\. WebRTC Configuration

Updated the createPeerConnection function to use the unified-plan SDP semantics.

Added transceivers for both audio and video with recvonly direction.

javascriptCopyconst config = { 

  iceServers,

  sdpSemantics: 'unified-plan'

};

peerConnection = new RTCPeerConnection(config);

peerConnection.addTransceiver('audio', {direction: 'recvonly'});

peerConnection.addTransceiver('video', {direction: 'recvonly'});

2\. Stream Initialization

Modified the initializeConnection function to include additional parameters for optimal video streaming:

javascriptCopyconst sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {

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

3\. Track Event Handling

Improved the onTrack function to handle cases where the video track might not be immediately available:

javascriptCopyfunction onTrack(event) {

  console.log('onTrack event:', event);

  if (!event.track) return;

  if (statsIntervalId) {

    clearInterval(statsIntervalId);

  }

  statsIntervalId = setInterval(async () => {

    if (peerConnection && peerConnection.connectionState === 'connected') {

      try {

        const stats = await peerConnection.getStats(event.track);

        // ... (stats processing logic)

      } catch (error) {

        console.error('Error getting stats:', error);

      }

    } else {

      console.log('Peer connection not ready for stats.');

    }

  }, 1000);

  setVideoElement(event.streams[0]);

}

4\. Video Element Setup

Enhanced the setVideoElement function for better error handling and logging:

javascriptCopyfunction setVideoElement(stream) {

  if (!stream) {

    console.log('No stream available to set video element');

    return;

  }

  videoElement.srcObject = stream;

  videoElement.play().then(() => {

    console.log('Video playback started');

  }).catch(e => console.error('Error playing video:', e));

}

5\. Streaming Configuration

Updated the startStreaming function with more detailed configuration:

javascriptCopyconst playResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {

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


notes on audio:
```
Overview of Audio Components
The audio processing in this system involves several key steps:

Capturing user audio input
Real-time transcription of speech to text
Generating text responses
Converting text responses to speech for the avatar
Synchronizing the generated speech with the avatar's video

Audio Capture and Transcription
User Audio Capture
The system uses the browser's getUserMedia API to capture audio from the user's microphone:
javascriptCopyconst stream = await navigator.mediaDevices.getUserMedia({ audio: true });
mediaRecorder = new MediaRecorder(stream);
Real-time Transcription with Deepgram
Deepgram's WebSocket API is used for real-time speech-to-text transcription:
javascriptCopydeepgramSocket = new WebSocket('wss://api.deepgram.com/v1/listen', [
  'token',
  DEEPGRAM_API_KEY,
]);

deepgramSocket.onmessage = (message) => {
  const received = JSON.parse(message.data);
  const partialTranscript = received.channel.alternatives[0].transcript;

  if (partialTranscript) {
    transcript += partialTranscript;
    // Update UI with interim transcript
  }
};
Text-to-Speech for Avatar
The D-ID API handles the text-to-speech conversion for the avatar's responses. This is configured in the startStreaming function:
javascriptCopyconst playResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
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
Audio-Video Synchronization
The D-ID API handles the synchronization of the generated speech with the avatar's lip movements and facial expressions. The fluent: true and stitch: true options in the configuration help ensure smooth and natural-looking speech animation.
Potential Issues and Considerations for Audio

Microphone Access: Ensure the application requests and receives permission to access the user's microphone.
Background Noise: Consider implementing noise reduction techniques or providing guidance to users about optimal audio input conditions.
Latency: Be aware of potential latency in the speech-to-text transcription and subsequent processing steps.
Audio Quality: The quality of the avatar's speech can impact user experience. Monitor and adjust the text-to-speech settings as needed.

Best Practices for Audio Handling

Error Handling: Implement robust error handling for scenarios where audio capture or processing fails.
Feedback to Users: Provide visual feedback about audio capture status and transcription progress.
Configurable Audio Settings: Allow users to adjust audio input sensitivity or choose different voice options for the avatar if possible.
Testing: Thoroughly test the audio components across different devices and browsers to ensure consistent performance.

Future Improvements for Audio

Voice Activity Detection: Implement voice activity detection to more accurately determine when the user is speaking.
Custom Voice Models: Explore options for using custom voice models with D-ID or other text-to-speech services for more personalized avatar voices.
Audio Preprocessing: Consider adding audio preprocessing on the client-side to improve transcription accuracy in noisy environments.
Offline Support: Investigate possibilities for limited offline functionality, such as caching common responses or implementing a fallback local speech recognition system.
```

Key Components

WebRTC: Handles real-time communication for video streaming.

D-ID API: Generates the avatar video based on text input.

Groq: Provides the language model for generating responses.

Deepgram: Performs speech-to-text transcription of user input.

Potential Issues and Considerations

Browser Compatibility: Ensure testing across different browsers, as WebRTC implementation can vary.

Network Conditions: Poor network conditions may affect video quality or cause connection issues.

API Rate Limits: Be aware of rate limits for D-ID, Groq, and Deepgram APIs.

Video Codec Support: Different browsers support different video codecs. The compatibility_mode: 'auto' setting helps, but may need manual adjustment in some cases.

Best Practices

Error Handling: Implement robust error handling and logging throughout the application.

Connection Management: Properly manage WebRTC connections, closing them when not in use.

Security: Securely store and manage API keys. Consider using environment variables or a secure backend.

Performance Optimization: Monitor and optimize performance, especially for long-running sessions.

User Experience: Provide clear feedback to users about connection status and any issues.

Future Improvements

Adaptive Streaming: Implement adaptive bitrate streaming for varying network conditions.

Caching: Consider caching frequently used avatar animations to reduce API calls.

Fallback Mechanisms: Implement fallback options for cases where video streaming fails.

Analytics: Add analytics to track usage patterns and identify areas for improvement.

Testing

Thorough testing is crucial for this application. Key areas to test include:

Connection initialization and tear-down

Video and audio synchronization

Performance under different network conditions

Long-running sessions for stability

Cross-browser compatibility

Error recovery and graceful degradation

Conclusion

This solution provides a robust foundation for creating interactive AI avatars using D-ID's streaming API. By carefully managing WebRTC connections, handling video tracks correctly, and providing detailed configuration options, we've resolved the initial playback issues and created a more reliable system.

Future developers should pay close attention to WebRTC configuration, codec compatibility, and the intricate dance between the various APIs involved. Regular testing and monitoring will be key to maintaining and improving this system over time.

```



---

I have this repo which was forked from https://github.com/de-id/live-streaming-demo.

I have made significant modifications, swapping to the talks endpoint of d-id and then using groq for LLM and ddepgram for transcription, and the d-id still does the video generation.


I have an issue where everything is working asside from the video generation of the d-id avatar. Instead it just stays in its idel mode forever even as messages are being transcribed and responded to in the chat. 

The issue only lies with the specific calls above. Everything else is working fine, so do not change them. The one above is the only one, and even other d-id calls are working fine.


Please use this new important note, and the reminder of the documentation on the talk streams,
and try and resolve all issues with retrieving the video and audio in our app. 
Note that the video and audio may need to be handled slightly differantly. check the 

The re-write the whole entire file/s.
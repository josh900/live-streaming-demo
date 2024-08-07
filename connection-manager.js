// connection-manager.js

import logger from './logger.js';
import DID_API from './api.js';

let peerConnection;
let pcDataChannel;
let persistentStreamId;
let persistentSessionId;
let sessionClientAnswer;
let statsIntervalId;
let videoIsPlaying;
let lastBytesReceived;
let inactivityTimeout;
let keepAliveInterval;
let isInitializing = false;
let streamVideoElement;
let lastConnectionTime = Date.now();
let reconnectAttempts = 10;
let isPersistentStreamActive = false;
const maxRetryCount = 10;
const maxDelaySec = 100;
const RECONNECTION_INTERVAL = 100000; // 25 seconds for testing, adjust as needed
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 2000; // 1 second
const MAX_RECONNECT_DELAY = 90000; // 30 seconds

const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
};

async function initializePersistentStream() {
  logger.info('Initializing persistent stream...');
  connectionState = ConnectionState.CONNECTING;

  try {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: avatars[currentAvatar].imageUrl,
        driver_url: 'bank://lively/driver-06',
        output_resolution: 512,
        stream_warmup: true,
        config: {
          stitch: true,
          fluent: true,
          auto_match: true,
          pad_audio: 0.5,
          normalization_factor: 0.1,
          align_driver: true,
          motion_factor: 0.55,
          align_expand_factor: 0.3,
          driver_expressions: {
            expressions: [
              {
                start_frame: 0,
                expression: 'neutral',
                intensity: 0.5,
              },
            ],
          },
        },
      }),
    });

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();

    persistentStreamId = newStreamId;
    persistentSessionId = newSessionId;

    logger.info('Persistent stream created:', { persistentStreamId, persistentSessionId });

    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
      logger.error('Error during streaming setup:', e);
      stopAllStreams();
      closePC();
      throw e;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}/sdp`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answer: sessionClientAnswer,
        session_id: persistentSessionId,
      }),
    });

    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }
    isPersistentStreamActive = true;
    startKeepAlive();
    lastConnectionTime = Date.now(); // Update the last connection time
    logger.info('Persistent stream initialized successfully');
    connectionState = ConnectionState.CONNECTED;
  } catch (error) {
    logger.error('Failed to initialize persistent stream:', error);
    isPersistentStreamActive = false;
    persistentStreamId = null;
    persistentSessionId = null;
    connectionState = ConnectionState.DISCONNECTED;
    throw error;
  }
}

async function destroyPersistentStream() {
  if (persistentStreamId) {
    try {
      await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: persistentSessionId }),
      });

      logger.debug('Persistent stream destroyed successfully');
    } catch (error) {
      logger.error('Error destroying persistent stream:', error);
    } finally {
      stopAllStreams();
      closePC();
      persistentStreamId = null;
      persistentSessionId = null;
      isPersistentStreamActive = false;
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
      connectionState = ConnectionState.DISCONNECTED;
    }
  }
}

async function reinitializePersistentStream() {
  logger.info('Reinitializing persistent stream...');
  await destroyPersistentStream();
  await initializePersistentStream();
}

async function createNewPersistentStream() {
  logger.debug('Creating new persistent stream...');

  try {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: avatars[currentAvatar].imageUrl,
        driver_url: 'bank://lively/driver-06',
        output_resolution: 512,
        stream_warmup: true,
        config: {
          stitch: true,
          fluent: true,
          auto_match: true,
          pad_audio: 0.5,
          normalization_factor: 0.1,
          align_driver: true,
          motion_factor: 0.55,
          align_expand_factor: 0.3,
          driver_expressions: {
            expressions: [
              {
                start_frame: 0,
                expression: 'neutral',
                intensity: 0.5,
              },
            ],
          },
        },
      }),
    });

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();

    logger.debug('New stream created:', { newStreamId, newSessionId });

    const newSessionClientAnswer = await createPeerConnection(offer, iceServers);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${newStreamId}/sdp`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answer: newSessionClientAnswer,
        session_id: newSessionId,
      }),
    });

    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }

    return { streamId: newStreamId, sessionId: newSessionId };
  } catch (error) {
    logger.error('Error creating new persistent stream:', error);
    return null;
  }
}

async function backgroundReconnect() {
  if (connectionState === ConnectionState.RECONNECTING) {
    logger.debug('Background reconnection already in progress. Skipping.');
    return;
  }

  connectionState = ConnectionState.RECONNECTING;
  logger.debug('Starting background reconnection process...');

  try {
    await destroyPersistentStream();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await initializePersistentStream();
    lastConnectionTime = Date.now(); // Update the last connection time
    logger.info('Background reconnection completed successfully');
    connectionState = ConnectionState.CONNECTED;
    reconnectAttempts = 0;
  } catch (error) {
    logger.error('Error during background reconnection:', error);
    connectionState = ConnectionState.DISCONNECTED;
    scheduleReconnect();
  }
}

async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({ iceServers });
    pcDataChannel = peerConnection.createDataChannel('JanusDataChannel');
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);

    pcDataChannel.onopen = () => {
      logger.debug('Data channel opened');
    };
    pcDataChannel.onclose = () => {
      logger.debug('Data channel closed');
    };
    pcDataChannel.onerror = (error) => {
      logger.error('Data channel error:', error);
    };
    pcDataChannel.onmessage = onStreamEvent;
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
  const { iceGathering: iceGatheringStatusLabel } = getStatusLabels();
  if (iceGatheringStatusLabel) {
    iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
    iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
  }
  logger.debug('ICE gathering state changed:', peerConnection.iceGatheringState);
}

function onIceCandidate(event) {
  if (event.candidate && persistentStreamId && persistentSessionId) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;
    logger.debug('New ICE candidate:', candidate);

    fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}/ice`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate,
        sdpMid,
        sdpMLineIndex,
        session_id: persistentSessionId,
      }),
    }).catch((error) => {
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
  logger.debug('ICE connection state changed:', peerConnection.iceConnectionState);

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
  logger.debug('Peer connection state changed:', peerConnection.connectionState);

  if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
    logger.warn('Peer connection failed or disconnected. Attempting to reconnect...');
    connectionState = ConnectionState.DISCONNECTED;
    backgroundReconnect();
  } else if (peerConnection.connectionState === 'connected') {
    logger.debug('Peer connection established successfully');
    connectionState = ConnectionState.CONNECTED;
    reconnectAttempts = 0;
  }
}

function startConnectionHealthCheck() {
  setInterval(() => {
    if (peerConnection) {
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        logger.warn('Connection health check detected disconnected state. Attempting to reconnect...');
        connectionState = ConnectionState.DISCONNECTED;
        backgroundReconnect();
      } else if (peerConnection.connectionState === 'connected') {
        const timeSinceLastConnection = Date.now() - lastConnectionTime;
        if (timeSinceLastConnection > RECONNECTION_INTERVAL * 0.9) {
          logger.info('Approaching reconnection threshold. Initiating background reconnect.');
          backgroundReconnect();
        }
      }
    }
  }, 30000); // Check every 30 seconds
}

function onSignalingStateChange() {
  const { signaling: signalingStatusLabel } = getStatusLabels();
  if (signalingStatusLabel) {
    signalingStatusLabel.innerText = peerConnection.signalingState;
    signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
  }
  logger.debug('Signaling state changed:', peerConnection.signalingState);
}

function onTrack(event) {
  logger.debug('onTrack event:', event);
  if (!event.track) {
    logger.warn('No track in onTrack event');
    return;
  }

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

            // logger.debug('Video stats:', {
            //  bytesReceived: report.bytesReceived,
            //  lastBytesReceived,
            //  videoIsPlaying,
            //  videoStatusChanged
            // });

            if (videoStatusChanged) {
              videoIsPlaying = report.bytesReceived > lastBytesReceived;
              logger.debug('Video status changed:', videoIsPlaying);
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
  }, 250); // Check every 500ms
  if (event.streams && event.streams.length > 0) {
    const stream = event.streams[0];
    if (stream.getVideoTracks().length > 0) {
      logger.debug('Setting stream video element with track:', event.track.id);
      setStreamVideoElement(stream);
    } else {
      logger.warn('Stream does not contain any video tracks');
    }
  } else {
    logger.warn('No streams found in onTrack event');
  }

  if (isDebugMode) {
    // downloadStreamVideo(event.streams[0]);
  }
}

async function attemptReconnect() {
  logger.debug('Attempting to reconnect...');
  try {
    await reinitializeConnection();
    logger.debug('Reconnection successful');
    reconnectAttempts = 0;
  } catch (error) {
    logger.error('Reconnection attempt failed:', error);
    scheduleReconnect();
  }
}

function stopAllStreams() {
  if (streamVideoElement && streamVideoElement.srcObject) {
    logger.debug('Stopping video streams');
    streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    streamVideoElement.srcObject = null;
  }
}

function closePC(pc = peerConnection) {
  if (!pc) return;
  logger.debug('Stopping peer connection');
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
  logger.debug('Stopped peer connection');
  if (pc === peerConnection) {
    peerConnection = null;
  }
}

async function fetchWithRetries(url, options, retries = 0, delayMs = 1000) {
  try {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallTime;

    if (timeSinceLastCall < API_CALL_INTERVAL) {
      await new Promise((resolve) => setTimeout(resolve, API_CALL_INTERVAL - timeSinceLastCall));
    }

    lastApiCallTime = Date.now();

    const response = await fetch(url, options);
    if (!response.ok) {
      if (response.status === 429) {
        // If rate limited, wait for a longer time before retrying
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        logger.warn(`Rate limited. Retrying after ${retryAfter} seconds.`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        return fetchWithRetries(url, options, retries, delayMs);
      }
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }
    return response;
  } catch (err) {
    if (retries < maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) * delayMs + Math.random() * 1000, maxDelaySec * 1000);
      logger.warn(`Request failed, retrying ${retries + 1}/${maxRetryCount} in ${delay}ms. Error: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetries(url, options, retries + 1, delayMs);
    } else {
      throw err;
    }
  }
}

async function initializeConnection() {
  if (isInitializing) {
    logger.warn('Connection initialization already in progress. Skipping initialize.');
    return;
  }

  isInitializing = true;
  logger.info('Initializing connection...');

  try {
    stopAllStreams();
    closePC();

    if (!currentAvatar || !avatars[currentAvatar]) {
      throw new Error('No avatar selected or avatar not found');
    }

    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: avatars[currentAvatar].imageUrl,
        driver_url: 'bank://lively/driver-06',
        output_resolution: 512,
        stream_warmup: true,
        config: {
          stitch: true,
          fluent: true,
          auto_match: true,
          pad_audio: 0.5,
          normalization_factor: 0.1,
          align_driver: true,
          motion_factor: 0.55,
          align_expand_factor: 0.3,
          driver_expressions: {
            expressions: [
              {
                start_frame: 0,
                expression: 'neutral',
                intensity: 0.5,
              },
            ],
          },
        },
      }),
    });

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();

    if (!newStreamId || !newSessionId) {
      throw new Error('Failed to get valid stream ID or session ID from API');
    }

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

    await new Promise((resolve) => setTimeout(resolve, 6000));

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
  } catch (error) {
    logger.error('Failed to initialize connection:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

async function reinitializeConnection() {
  if (connectionState === ConnectionState.RECONNECTING) {
    logger.warn('Connection reinitialization already in progress. Skipping reinitialize.');
    return;
  }

  connectionState = ConnectionState.RECONNECTING;
  logger.debug('Reinitializing connection...');

  try {
    await destroyPersistentStream();
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second

    stopAllStreams();
    closePC();

    clearInterval(statsIntervalId);
    clearTimeout(inactivityTimeout);
    clearInterval(keepAliveInterval);

    streamId = null;
    sessionId = null;
    peerConnection = null;
    lastBytesReceived = 0;
    videoIsPlaying = false;

    currentUtterance = '';
    interimMessageAdded = false;

    const msgHistory = document.getElementById('msgHistory');
    msgHistory.innerHTML = '';
    chatHistory = [];

    // Reset video elements
    const streamVideoElement = document.getElementById('stream-video-element');
    const idleVideoElement = document.getElementById('idle-video-element');
    if (streamVideoElement) streamVideoElement.srcObject = null;
    if (idleVideoElement) idleVideoElement.style.display = 'block';

    // Add a delay before initializing to avoid rapid successive calls
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await initializePersistentStream();

    if (!persistentStreamId || !persistentSessionId) {
      throw new Error('Persistent Stream ID or Session ID is missing after initialization');
    }

    await prepareForStreaming();

    logger.info('Connection reinitialized successfully');
    logger.debug(`New Persistent Stream ID: ${persistentStreamId}, New Persistent Session ID: ${persistentSessionId}`);
    reconnectAttempts = 0; // Reset reconnect attempts on successful connection
    connectionState = ConnectionState.CONNECTED;
  } catch (error) {
    logger.error('Error during reinitialization:', error);
    showErrorMessage('Failed to reconnect. Please refresh the page.');
    connectionState = ConnectionState.DISCONNECTED;
  }
}

async function cleanupOldStream() {
  logger.debug('Cleaning up old stream...');

  try {
    if (peerConnection) {
      peerConnection.close();
    }

    if (pcDataChannel) {
      pcDataChannel.close();
    }

    // Stop all tracks in the streamVideoElement
    if (streamVideoElement && streamVideoElement.srcObject) {
      streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    }

    // Clear any ongoing intervals or timeouts
    clearInterval(statsIntervalId);
    clearTimeout(inactivityTimeout);
    clearInterval(keepAliveInterval);

    logger.debug('Old stream cleaned up successfully');
  } catch (error) {
    logger.error('Error cleaning up old stream:', error);
  }
}

let connectionState = ConnectionState.DISCONNECTED;

function setConnectionState(state) {
  connectionState = state;
}

export {
  initializePersistentStream,
  destroyPersistentStream,
  reinitializePersistentStream,
  createNewPersistentStream,
  backgroundReconnect,
  createPeerConnection,
  onIceGatheringStateChange,
  onIceCandidate,
  onIceConnectionStateChange,
  onConnectionStateChange,
  onSignalingStateChange,
  onTrack,
  startConnectionHealthCheck,
  attemptReconnect,
  stopAllStreams,
  closePC,
  fetchWithRetries,
  initializeConnection,
  reinitializeConnection,
  cleanupOldStream,
  ConnectionState,
  connectionState,
  setConnectionState,
};

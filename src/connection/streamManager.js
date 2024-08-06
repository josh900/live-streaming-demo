import { createStream, setStreamSdp, destroyStream, streamAudio } from '../api/didApi.js';
import { createPeerConnection, closeConnection } from './peerConnection.js';
import { avatars, currentAvatar } from '../avatar/avatarManager.js';

let persistentStreamId = null;
let persistentSessionId = null;
let isPersistentStreamActive = false;

async function initializePersistentStream() {
  console.info('Initializing persistent stream...');

  try {
    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await createStream(avatars[currentAvatar].imageUrl);

    persistentStreamId = newStreamId;
    persistentSessionId = newSessionId;

    console.info('Persistent stream created:', { persistentStreamId, persistentSessionId });

    const sessionClientAnswer = await createPeerConnection(offer, iceServers);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await setStreamSdp(persistentStreamId, persistentSessionId, sessionClientAnswer);

    isPersistentStreamActive = true;
    console.info('Persistent stream initialized successfully');

    return { streamId: persistentStreamId, sessionId: persistentSessionId };
  } catch (error) {
    console.error('Failed to initialize persistent stream:', error);
    isPersistentStreamActive = false;
    persistentStreamId = null;
    persistentSessionId = null;
    throw error;
  }
}

async function destroyPersistentStream() {
  if (persistentStreamId) {
    try {
      await destroyStream(persistentStreamId, persistentSessionId);
      console.debug('Persistent stream destroyed successfully');
    } catch (error) {
      console.error('Error destroying persistent stream:', error);
    } finally {
      closeConnection();
      persistentStreamId = null;
      persistentSessionId = null;
      isPersistentStreamActive = false;
    }
  }
}

async function reinitializePersistentStream() {
  console.info('Reinitializing persistent stream...');
  await destroyPersistentStream();
  return initializePersistentStream();
}

async function startStreaming(audioChunks) {
  if (!persistentStreamId || !persistentSessionId) {
    console.error('Persistent stream not initialized. Cannot start streaming.');
    throw new Error('Persistent stream not initialized');
  }

  if (!currentAvatar || !avatars[currentAvatar]) {
    console.error('No avatar selected or avatar not found. Cannot start streaming.');
    throw new Error('No avatar selected or avatar not found');
  }

  for (const chunk of audioChunks) {
    try {
      const response = await streamAudio(persistentStreamId, persistentSessionId, chunk, avatars[currentAvatar].voiceId);
      console.debug('Streaming response:', response);

      if (response.status === 'started') {
        console.debug('Stream chunk started successfully');
        if (response.result_url) {
          window.dispatchEvent(new CustomEvent('streamChunkReady', { detail: response.result_url }));
        }
      } else {
        console.warn('Unexpected response status:', response.status);
      }
    } catch (error) {
      console.error('Error during streaming:', error);
      if (error.message.includes('HTTP error! status: 404') || error.message.includes('missing or invalid session_id')) {
        console.warn('Stream not found or invalid session. Attempting to reinitialize persistent stream.');
        await reinitializePersistentStream();
      }
      throw error;
    }
  }
}

export { initializePersistentStream, destroyPersistentStream, reinitializePersistentStream, startStreaming, isPersistentStreamActive };
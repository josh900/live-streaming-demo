import DID_API from '/api.js';
import { fetchWithRetries } from '../utils/helpers.js';

const API_RATE_LIMIT = 40; // Maximum number of calls per minute
const API_CALL_INTERVAL = 30000 / API_RATE_LIMIT; // Minimum time between API calls in milliseconds
let lastApiCallTime = 0;

async function createStream(avatarUrl) {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: avatarUrl,
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

  return response.json();
}

async function setStreamSdp(streamId, sessionId, answer) {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      answer,
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to set SDP: ${response.status} ${response.statusText}`);
  }
}

async function destroyStream(streamId, sessionId) {
  await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });
}

async function streamAudio(streamId, sessionId, audioChunk, avatarVoiceId) {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      script: {
        type: 'text',
        input: audioChunk,
        ssml: true,
        provider: {
          type: 'microsoft',
          voice_id: avatarVoiceId,
        },
      },
      session_id: sessionId,
      driver_url: 'bank://lively/driver-06',
      output_resolution: 512,
      stream_warmup: true,
      config: {
        fluent: true,
        stitch: true,
        pad_audio: 0.5,
        auto_match: true,
        align_driver: true,
        normalization_factor: 0.1,
        align_expand_factor: 0.3,
        motion_factor: 0.55,
        result_format: 'mp4',
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

  return response.json();
}

export { createStream, setStreamSdp, destroyStream, streamAudio };
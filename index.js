import {
    connectButton,
    startButton,
    destroyButton,
    onTrack,
    onStreamEvent,
    createPeerConnection,
    setStreamVideoElement,
    playIdleVideo,
    stopAllStreams,
    closePC,
    fetchWithRetries
  } from './streaming-client-api.js';
  
  // Any additional initialization or event listeners can be added here
  document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    playIdleVideo();
  });
  
  // You can add more code here to handle other aspects of your application
  // For example, integrating with Groq for LLM and Deepgram for transcription
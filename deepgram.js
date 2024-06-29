import Logger from './logger.js';

const logger = new Logger('INFO');
let deepgramSocket;
let mediaRecorder;
let audioContext;
let sourceNode;
let processorNode;

export async function initializeDeepgram(apiKey, onTranscriptionReceived) {
  logger.log('Initializing Deepgram');
  
  deepgramSocket = new WebSocket('wss://api.deepgram.com/v1/listen', [
    'token',
    apiKey,
  ]);

  deepgramSocket.onopen = () => {
    logger.log('Deepgram WebSocket opened');
    deepgramSocket.send(JSON.stringify({
      type: 'KeepAlive',
    }));
  };

  deepgramSocket.onclose = () => logger.log('Deepgram WebSocket closed');
  deepgramSocket.onerror = (error) => logger.error('Deepgram WebSocket error:', error);

  deepgramSocket.onmessage = (message) => {
    const received = JSON.parse(message.data);
    const transcript = received.channel?.alternatives[0]?.transcript;
    if (transcript && transcript.trim() !== '') {
      logger.debug('Raw transcript:', transcript);
      onTranscriptionReceived(transcript);
    }
  };

  // Set up audio context and processor
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  processorNode = audioContext.createScriptProcessor(4096, 1, 1);
  
  processorNode.onaudioprocess = (e) => {
    if (deepgramSocket.readyState === WebSocket.OPEN) {
      const inputData = e.inputBuffer.getChannelData(0);
      const uint8Array = new Uint8Array(inputData.buffer);
      deepgramSocket.send(uint8Array);
    }
  };
}

export async function startRecording() {
  logger.log('Starting recording');
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    sourceNode = audioContext.createMediaStreamSource(stream);
    sourceNode.connect(processorNode);
    processorNode.connect(audioContext.destination);

    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();

    logger.log('Recording started successfully');
  } catch (error) {
    logger.error('Error starting recording:', error);
    throw error;
  }
}

export async function stopRecording() {
  logger.log('Stopping recording');
  
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
  
  if (sourceNode) {
    sourceNode.disconnect();
  }
  
  if (processorNode) {
    processorNode.disconnect();
  }
  
  if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
    deepgramSocket.close();
  }
  
  logger.log('Recording stopped');
}

// Function to handle reconnection
async function reconnectDeepgram(apiKey, onTranscriptionReceived) {
  logger.log('Attempting to reconnect to Deepgram');
  await initializeDeepgram(apiKey, onTranscriptionReceived);
}

// Set up an interval to send keep-alive messages
setInterval(() => {
  if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
    deepgramSocket.send(JSON.stringify({ type: 'KeepAlive' }));
    logger.debug('Sent KeepAlive message to Deepgram');
  }
}, 5000);  // Send keep-alive every 5 seconds
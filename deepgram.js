import Logger from './logger.js';

const logger = new Logger('INFO');

let deepgramSocket;
let audioContext;
let mediaStream;
let audioInput;
let workletNode;

const SAMPLE_RATE = 16000;

// First, we need to define the AudioWorklet processor
const workletCode = `
class DeepgramProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 1024;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const channel = input[0];

    for (let i = 0; i < channel.length; i++) {
      this.buffer[this.bufferIndex] = channel[i];
      this.bufferIndex++;

      if (this.bufferIndex === this.bufferSize) {
        this.port.postMessage(this.buffer);
        this.bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('deepgram-processor', DeepgramProcessor);
`;

export async function initializeDeepgram(apiKey, onTranscriptionReceived) {
    logger.log('Initializing Deepgram');
    
    deepgramSocket = new WebSocket('wss://api.deepgram.com/v1/listen', [
        'token',
        apiKey,
    ]);

    deepgramSocket.onopen = () => {
        logger.log('Deepgram WebSocket opened');
        const metadata = {
            sampling_rate: SAMPLE_RATE,
            channels: 1,
            encoding: 'linear16',
            language: 'en-US',
        };
        deepgramSocket.send(JSON.stringify(metadata));
    };

    deepgramSocket.onmessage = (message) => {
        try {
            const received = JSON.parse(message.data);
            const transcript = received.channel?.alternatives[0]?.transcript;
            if (transcript && transcript.trim() !== '') {
                onTranscriptionReceived(transcript);
            }
        } catch (error) {
            logger.error('Error parsing Deepgram message:', error);
        }
    };

    deepgramSocket.onclose = () => logger.log('Deepgram WebSocket closed');
    deepgramSocket.onerror = (error) => logger.error('Deepgram WebSocket error:', error);

    // Initialize AudioContext
    audioContext = new (window.AudioContext || window.webkitAudioContext)({sampleRate: SAMPLE_RATE});
}

export async function startRecording() {
    logger.log('Starting recording');
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)({sampleRate: SAMPLE_RATE});
        }
        await audioContext.resume();

        // Add the AudioWorklet module
        const blob = new Blob([workletCode], { type: 'application/javascript' });
        const workletUrl = URL.createObjectURL(blob);
        await audioContext.audioWorklet.addModule(workletUrl);

        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        audioInput = audioContext.createMediaStreamSource(mediaStream);

        workletNode = new AudioWorkletNode(audioContext, 'deepgram-processor');
        workletNode.port.onmessage = (event) => {
            if (deepgramSocket.readyState === WebSocket.OPEN) {
                const floatData = event.data;
                const intData = new Int16Array(floatData.length);
                for (let i = 0; i < floatData.length; i++) {
                    intData[i] = Math.max(-1, Math.min(1, floatData[i])) * 0x7FFF;
                }
                deepgramSocket.send(intData.buffer);
            }
        };

        audioInput.connect(workletNode).connect(audioContext.destination);

        logger.log('Recording started successfully');
    } catch (error) {
        logger.error('Error starting recording:', error);
        throw error;
    }
}

export async function stopRecording() {
    logger.log('Stopping recording');
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    if (workletNode) {
        workletNode.disconnect();
    }
    if (audioInput) {
        audioInput.disconnect();
    }
    if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
        deepgramSocket.close();
    }
    await audioContext.suspend();
    logger.log('Recording stopped');
}

export function isDeepgramConnected() {
    return deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN;
}

export async function reconnectDeepgram(apiKey, onTranscriptionReceived) {
    if (isDeepgramConnected()) {
        logger.log('Deepgram is already connected');
        return;
    }

    logger.log('Attempting to reconnect to Deepgram');
    await initializeDeepgram(apiKey, onTranscriptionReceived);
}
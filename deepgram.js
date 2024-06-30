import Logger from './logger.js';

const logger = new Logger('DEBUG');

let deepgramSocket;
let audioContext;
let mediaStream;
let audioInput;
let processor;

const SAMPLE_RATE = 16000;

export async function initializeDeepgram(apiKey, onTranscriptionReceived) {
    logger.log('Initializing Deepgram');

    return new Promise((resolve, reject) => {
        deepgramSocket = new WebSocket('wss://api.deepgram.com/v1/listen', [
            'token',
            apiKey,
        ]);

        const timeout = setTimeout(() => {
            if (deepgramSocket.readyState !== WebSocket.OPEN) {
                reject(new Error('Connection to Deepgram timed out'));
                deepgramSocket.close();
            }
        }, 10000); // 10 second timeout

        deepgramSocket.onopen = () => {
            clearTimeout(timeout);
            logger.log('Deepgram WebSocket opened');
            const metadata = {
                sampling_rate: SAMPLE_RATE,
                channels: 1,
                encoding: 'linear16',
                language: 'en-US',
            };
            deepgramSocket.send(JSON.stringify(metadata));
            resolve();
        };

        deepgramSocket.onmessage = (event) => {
            const result = JSON.parse(event.data);
            if (result.channel && result.channel.alternatives && result.channel.alternatives[0]) {
                const transcript = result.channel.alternatives[0].transcript;
                if (transcript) {
                    onTranscriptionReceived(transcript);
                }
            }
        };

        deepgramSocket.onerror = (error) => {
            clearTimeout(timeout);
            logger.error('Deepgram WebSocket error:', error);
            reject(error);
        };
    });
}

export async function startRecording() {
    logger.log('Starting recording');
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)({sampleRate: SAMPLE_RATE});
        await audioContext.resume();

        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioInput = audioContext.createMediaStreamSource(mediaStream);

        processor = audioContext.createScriptProcessor(1024, 1, 1);
        processor.onaudioprocess = (e) => {
            if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
                const float32Array = e.inputBuffer.getChannelData(0);
                const int16Array = new Int16Array(float32Array.length);
                for (let i = 0; i < float32Array.length; i++) {
                    int16Array[i] = Math.max(-1, Math.min(1, float32Array[i])) * 0x7FFF;
                }
                deepgramSocket.send(int16Array.buffer);
            }
        };

        audioInput.connect(processor);
        processor.connect(audioContext.destination);

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
    if (processor) {
        processor.disconnect();
    }
    if (audioInput) {
        audioInput.disconnect();
    }
    if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
        deepgramSocket.close();
    }
    if (audioContext) {
        await audioContext.close();
    }
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
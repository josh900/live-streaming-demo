import Logger from './logger.js';
import { handleError } from './errorHandler.js';

const logger = new Logger('INFO');

let deepgramSocket;
let audioContext;
let mediaStream;
let audioWorkletNode;

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
                handleError('Connection to Deepgram timed out', new Error('Connection timeout'));
                deepgramSocket.close();
                reject(new Error('Connection to Deepgram timed out'));
            }
        }, 10000);

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
            handleError('Deepgram WebSocket error', error);
            reject(error);
        };
    });

    await initializeAudioContext();
}

async function initializeAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE });
    await audioContext.audioWorklet.addModule('audioProcessor.js');
}

export async function startRecording() {
    logger.log('Starting recording');
    try {
        if (!audioContext) {
            await initializeAudioContext();
        }
        await audioContext.resume();

        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const audioInput = audioContext.createMediaStreamSource(mediaStream);

        audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
        audioWorkletNode.port.onmessage = (event) => {
            if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
                deepgramSocket.send(event.data);
            } else {
              logger.warn('Deepgram WebSocket not open, audio data discarded');
            }
        };

        audioInput.connect(audioWorkletNode).connect(audioContext.destination);

        logger.log('Recording started successfully');
    } catch (error) {
        handleError('Error starting recording', error);
        throw error;
    }
}

export async function stopRecording() {
    logger.log('Stopping recording');
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    if (audioWorkletNode) {
        audioWorkletNode.disconnect();
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
import Logger from './logger.js';

const logger = new Logger('INFO');

let deepgramSocket;
let audioContext;
let mediaStream;
let mediaRecorder;
let audioInput;
let processor;

const SAMPLE_RATE = 16000;
const SAMPLE_SIZE = 16;

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

    // Initialize AudioContext only after user interaction
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContext.suspend(); // Suspend until user interacts
}

export async function startRecording() {
    logger.log('Starting recording');
    try {
        await audioContext.resume(); // Resume AudioContext
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 1.0;

        audioInput = audioContext.createMediaStreamSource(mediaStream);
        audioInput.connect(gainNode);

        processor = audioContext.createScriptProcessor(1024, 1, 1);
        gainNode.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (e) => {
            if (deepgramSocket.readyState === WebSocket.OPEN) {
                const inputData = e.inputBuffer.getChannelData(0);
                const downsampledBuffer = downsampleBuffer(inputData, SAMPLE_RATE);
                const intData = new Int16Array(downsampledBuffer.length);
                for (let i = 0; i < downsampledBuffer.length; i++) {
                    intData[i] = Math.max(-1, Math.min(1, downsampledBuffer[i])) * 0x7FFF;
                }
                deepgramSocket.send(intData.buffer);
            }
        };

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
        audioInput.disconnect();
    }
    if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
        deepgramSocket.close();
    }
    await audioContext.suspend(); // Suspend AudioContext
    logger.log('Recording stopped');
}

function downsampleBuffer(buffer, targetSampleRate) {
    if (targetSampleRate === audioContext.sampleRate) {
        return buffer;
    }
    
    const sampleRateRatio = audioContext.sampleRate / targetSampleRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    
    let offsetResult = 0;
    let offsetBuffer = 0;
    
    while (offsetResult < result.length) {
        const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
        let accum = 0, count = 0;
        for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
            accum += buffer[i];
            count++;
        }
        result[offsetResult] = accum / count;
        offsetResult++;
        offsetBuffer = nextOffsetBuffer;
    }
    
    return result;
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
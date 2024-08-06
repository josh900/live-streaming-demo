import DID_API from '/api.js';


//const deepgramClient = createClient(DID_API.deepgramKey);

let audioContext;
let audioWorkletNode;
let deepgramConnection;
let isRecording = false;
let currentUtterance = '';
let deepgramClient;


// Initialize Deepgram client
function initializeDeepgram() {
    if (typeof Deepgram !== 'undefined') {
      deepgramClient = Deepgram.createClient(DID_API.deepgramKey);
    } else {
      console.error('Deepgram SDK not loaded');
    }
  }

  
  
async function startRecording() {
    if (!deepgramClient) {
        initializeDeepgram();
      }
      if (!deepgramClient) {
        throw new Error('Deepgram client not initialized');
      }
    if (isRecording) {
        console.warn('Recording is already in progress. Stopping current recording.');
        await stopRecording();
        return;
    }

    console.debug('Starting recording process...');

    currentUtterance = '';

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.info('Microphone stream obtained');

        audioContext = new AudioContext();
        console.debug('Audio context created. Sample rate:', audioContext.sampleRate);

        await audioContext.audioWorklet.addModule('/src/audio/audioProcessor.js');
        console.debug('Audio worklet module added successfully');

        const source = audioContext.createMediaStreamSource(stream);
        console.debug('Media stream source created');

        audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
        console.debug('Audio worklet node created');

        source.connect(audioWorkletNode);
        console.debug('Media stream source connected to audio worklet node');

        const deepgramOptions = {
            model: 'nova-2',
            language: 'en-US',
            smart_format: true,
            interim_results: true,
            utterance_end_ms: 2500,
            punctuate: true,
            vad_events: true,
            encoding: 'linear16',
            sample_rate: audioContext.sampleRate,
        };

        console.debug('Creating Deepgram connection with options:', deepgramOptions);
        const deepgramClient = new Deepgram.Deepgram(DID_API.deepgramKey);
        deepgramConnection = await deepgramClient.listen.live(deepgramOptions);


        deepgramConnection.addListener(Deepgram.LiveTranscriptionEvents.Open, () => {
            console.debug('Deepgram WebSocket Connection opened');
            startSendingAudioData();
          });
        
        deepgramConnection.addListener(Deepgram.LiveTranscriptionEvents.Transcript, (data) => {
            console.debug('Received transcription:', JSON.stringify(data));
            handleTranscription(data);
        });

        deepgramConnection.addListener(Deepgram.LiveTranscriptionEvents.UtteranceEnd, (data) => {
            console.debug('Utterance end event received:', data);
            handleUtteranceEnd(data);
        });

        deepgramConnection.addListener(Deepgram.LiveTranscriptionEvents.Error, (err) => {
            console.error('Deepgram error:', err);
            handleDeepgramError(err);
        });

        deepgramConnection.addListener(Deepgram.LiveTranscriptionEvents.Warning, (warning) => {
            console.warn('Deepgram warning:', warning);
        });


        deepgramConnection.addListener('open', () => {
            console.debug('Deepgram WebSocket Connection opened');
            startSendingAudioData();
        });
    
        deepgramConnection.addListener('close', () => {
            console.debug('Deepgram WebSocket connection closed');
        });
    
        deepgramConnection.addListener('transcriptReceived', (data) => {
            console.debug('Received transcription:', JSON.stringify(data));
            handleTranscription(data);
        });

        deepgramConnection.addListener('UtteranceEnd', (data) => {
            console.debug('Utterance End:', JSON.stringify(data));
            handleUtteranceEnd(data);
        });
    
        deepgramConnection.addListener('error', (err) => {
            console.error('Deepgram error:', err);
            handleDeepgramError(err);
        });

        isRecording = true;
        console.debug('Recording and transcription started successfully');
    } catch (error) {
        console.error('Error starting recording:', error);
        isRecording = false;
        throw error;
    }
}

function startSendingAudioData() {
    console.debug('Starting to send audio data...');

    let packetCount = 0;
    let totalBytesSent = 0;

    audioWorkletNode.port.onmessage = (event) => {
        const audioData = event.data;

        if (!(audioData instanceof ArrayBuffer)) {
            console.warn('Received non-ArrayBuffer data from AudioWorklet:', typeof audioData);
            return;
        }

        if (deepgramConnection && deepgramConnection.getReadyState() === WebSocket.OPEN) {
            try {
                deepgramConnection.send(audioData);
                packetCount++;
                totalBytesSent += audioData.byteLength;

                if (packetCount % 100 === 0) {
                    console.debug(`Sent ${packetCount} audio packets to Deepgram. Total bytes: ${totalBytesSent}`);
                }
            } catch (error) {
                console.error('Error sending audio data to Deepgram:', error);
            }
        } else {
            console.warn(
                'Deepgram connection not open, cannot send audio data. ReadyState:',
                deepgramConnection ? deepgramConnection.getReadyState() : 'undefined',
            );
        }
    };

    console.debug('Audio data sending setup complete');
}

async function stopRecording() {
    if (isRecording) {
        console.info('Stopping recording...');

        if (audioContext) {
            await audioContext.close();
            console.debug('AudioContext closed');
        }

        if (deepgramConnection) {
            deepgramConnection.finish();
            console.debug('Deepgram connection finished');
        }

        isRecording = false;
        console.debug('Recording and transcription stopped');
    }
}

function handleTranscription(data) {
    if (!isRecording) return;

    const transcript = data.transcript;
    if (data.is_final) {
        console.debug('Final transcript:', transcript);
        if (transcript.trim()) {
            currentUtterance += transcript + ' ';
            // Emit an event with the final transcription
            const event = new CustomEvent('finalTranscription', { detail: currentUtterance.trim() });
            window.dispatchEvent(event);
        }
    } else {
        console.debug('Interim transcript:', transcript);
        // Emit an event with the interim transcription
        const event = new CustomEvent('interimTranscription', { detail: currentUtterance + transcript });
        window.dispatchEvent(event);
    }
}

function handleUtteranceEnd(data) {
    if (!isRecording) return;

    console.debug('Utterance end detected:', data);
    if (currentUtterance.trim()) {
        // Emit an event with the final utterance
        const event = new CustomEvent('utteranceEnd', { detail: currentUtterance.trim() });
        window.dispatchEvent(event);
        currentUtterance = '';
    }
}

function handleDeepgramError(err) {
    console.error('Deepgram error:', err);
    isRecording = false;

    // Attempt to close the connection and clean up
    if (deepgramConnection) {
        try {
            deepgramConnection.finish();
        } catch (closeError) {
            console.warn('Error while closing Deepgram connection:', closeError);
        }
    }

    if (audioContext) {
        audioContext.close().catch((closeError) => {
            console.warn('Error while closing AudioContext:', closeError);
        });
    }

    // Emit an error event
    const event = new CustomEvent('recordingError', { detail: err });
    window.dispatchEvent(event);
}

export { startRecording, stopRecording, isRecording };
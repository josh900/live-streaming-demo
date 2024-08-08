// pushToTalk.js
export let isPushToTalkMode = false;
export let isPushToTalkActive = false;
let pushToTalkTranscript = '';

export function togglePushToTalk() {
  isPushToTalkMode = !isPushToTalkMode;
  if (isPushToTalkMode && autoSpeakMode) {
    toggleAutoSpeak(); // Turn off Auto-Speak when enabling Push to Talk
  }
  updatePushToTalkUI(isPushToTalkMode);
  if (isPushToTalkMode) {
    prepareForPushToTalk();
  } else {
    cleanupPushToTalk();
  }
}

export async function prepareForPushToTalk() {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    await audioContext.audioWorklet.addModule('audio-processor.js');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(stream);
    audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
    source.connect(audioWorkletNode);

    const deepgramOptions = {
      model: 'nova-2',
      language: 'en-US',
      smart_format: true,
      interim_results: true,
      punctuate: true,
      encoding: 'linear16',
      sample_rate: audioContext.sampleRate,
    };

    deepgramConnection = await deepgramClient.listen.live(deepgramOptions);

    deepgramConnection.addListener(LiveTranscriptionEvents.Open, () => {
      logger.debug('Deepgram WebSocket Connection opened for Push to Talk');
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Transcript, (data) => {
      handlePushToTalkTranscription(data);
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Error, (err) => {
      logger.error('Deepgram error in Push to Talk mode:', err);
    });

    updatePushToTalkUI(true);
  } catch (error) {
    logger.error('Error preparing Push to Talk:', error);
    isPushToTalkMode = false;
    updatePushToTalkUI(false);
  }
}

export function cleanupPushToTalk() {
  if (deepgramConnection) {
    deepgramConnection.finish();
  }
  if (audioContext) {
    audioContext.close();
  }
  audioWorkletNode = null;
}

export function startPushToTalk() {
  isPushToTalkActive = true;
  pushToTalkTranscript = '';
  startSendingAudioData();
  document.getElementById('push-to-talk-button').classList.add('active');
}

export function stopPushToTalk() {
  isPushToTalkActive = false;
  stopSendingAudioData();
  document.getElementById('push-to-talk-button').classList.remove('active');
  if (pushToTalkTranscript.trim()) {
    updateTranscript(pushToTalkTranscript.trim(), true);
    chatHistory.push({
      role: 'user',
      content: pushToTalkTranscript.trim(),
    });
    sendChatToGroq();
  }
  pushToTalkTranscript = '';
}

function handlePushToTalkTranscription(data) {
  const transcript = data.channel.alternatives[0].transcript;
  if (data.is_final) {
    pushToTalkTranscript += transcript + ' ';
  }
  updateTranscript(pushToTalkTranscript + transcript, false);
}

function updatePushToTalkUI(isEnabled) {
  const pushToTalkToggle = document.getElementById('push-to-talk-toggle');
  const pushToTalkButton = document.getElementById('push-to-talk-button');
  const startButton = document.getElementById('start-button');

  pushToTalkToggle.textContent = `Push to Talk: ${isEnabled ? 'On' : 'Off'}`;
  pushToTalkButton.style.display = isEnabled ? 'inline-block' : 'none';
  startButton.style.display = isEnabled ? 'none' : 'inline-block';
}

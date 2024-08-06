import { handleAvatarChange, openAvatarModal, saveAvatar } from '../avatar/avatarManager.js';
import { startRecording, stopRecording } from '../audio/recorder.js';
import { destroyPersistentStream, initializePersistentStream } from '../connection/streamManager.js';
import { sendChatToGroq, processGroqResponse } from '../api/groqApi.js';
import { showToast, toggleSimpleMode, updateTranscript, updateAssistantReply } from './uiManager.js';

let autoSpeakMode = true;
let chatHistory = [];


function initializeEventListeners() {
    const avatarSelect = document.getElementById('avatar-select');
    const contextInput = document.getElementById('context-input');
    const sendTextButton = document.getElementById('send-text-button');
    const textInput = document.getElementById('text-input');
    const replaceContextButton = document.getElementById('replace-context-button');
    const autoSpeakToggle = document.getElementById('auto-speak-toggle');
    const editAvatarButton = document.getElementById('edit-avatar-button');
    const startButton = document.getElementById('start-button');
    const simpleModeButton = document.getElementById('simple-mode-button');
    const saveAvatarButton = document.getElementById('save-avatar-button');
    const avatarImageInput = document.getElementById('avatar-image');

    avatarSelect.addEventListener('change', handleAvatarChange);
    sendTextButton.addEventListener('click', () => handleTextInput(textInput.value));
    textInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') handleTextInput(textInput.value);
    });
    replaceContextButton.addEventListener('click', () => updateContext('replace'));
    autoSpeakToggle.addEventListener('click', toggleAutoSpeak);
    editAvatarButton.addEventListener('click', () => openAvatarModal());
    startButton.addEventListener('click', toggleRecording);
    simpleModeButton.addEventListener('click', toggleSimpleMode);
    saveAvatarButton.addEventListener('click', saveAvatar);

    avatarImageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('avatar-image-preview').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    window.addEventListener('finalTranscription', (event) => {
        updateTranscript(event.detail, true);
        chatHistory.push({ role: 'user', content: event.detail });
        handleChatToGroq();
    });

    window.addEventListener('interimTranscription', (event) => {
        updateTranscript(event.detail, false);
    });

    window.addEventListener('utteranceEnd', (event) => {
        updateTranscript(event.detail, true);
        chatHistory.push({ role: 'user', content: event.detail });
        handleChatToGroq();
    });

    window.addEventListener('recordingError', (event) => {
        showToast(`Recording error: ${event.detail.message}`);
        toggleRecording();
    });
}

function handleTextInput(text) {
    if (text.trim() === '') return;

    const textInput = document.getElementById('text-input');
    textInput.value = '';

    updateTranscript(text, true);

    chatHistory.push({
        role: 'user',
        content: text,
    });

    handleChatToGroq();
}



function updateContext(action) {
    const contextInput = document.getElementById('context-input');
    const newContext = contextInput.value.trim();

    if (newContext) {
        if (action === 'replace') {
            chatHistory = [];
        }
        showToast('Context saved successfully');
    } else {
        showToast('Please enter some text before updating the context');
    }
}

function toggleAutoSpeak() {
    autoSpeakMode = !autoSpeakMode;
    const toggleButton = document.getElementById('auto-speak-toggle');
    const startButton = document.getElementById('start-button');
    toggleButton.textContent = `Auto-Speak: ${autoSpeakMode ? 'On' : 'Off'}`;
    if (autoSpeakMode) {
        startButton.textContent = 'Stop';
        if (!isRecording) {
            startRecording();
        }
    } else {
        startButton.textContent = isRecording ? 'Stop' : 'Speak';
        if (isRecording) {
            stopRecording();
        }
    }
}

async function toggleRecording() {
    const startButton = document.getElementById('start-button');
    if (startButton.textContent === 'Speak') {
        startButton.textContent = 'Stop';
        await startRecording();
    } else {
        startButton.textContent = 'Speak';
        await stopRecording();
    }
}

async function handleChatToGroq() {
    if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1].content.trim() === '') {
        console.debug('No new content to send to Groq. Skipping request.');
        return;
    }

    console.debug('Sending chat to Groq...');
    try {
        const currentContext = document.getElementById('context-input').value.trim();
        const response = await sendChatToGroq(chatHistory, currentContext);

        for await (const content of processGroqResponse(response)) {
            updateAssistantReply(content);
        }

        // After processing the entire response, add it to the chat history
        chatHistory.push({
            role: 'assistant',
            content: document.getElementById('msgHistory').lastElementChild.textContent,
        });

        // Start streaming the entire response
        await startStreaming(chatHistory[chatHistory.length - 1].content);
    } catch (error) {
        console.error('Error in handleChatToGroq:', error);
        updateAssistantReply("I'm sorry, I encountered an error. Could you please try again?");
    }
}


export { initializeEventListeners };
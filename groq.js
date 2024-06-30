const WebSocket = require('ws');
const DID_API = require('./api.js');

const GROQ_API_KEY = DID_API.groqKey;
const GROQ_WEBSOCKET_URL = 'wss://api.groq.com/v1/chat/completions';

let groqSocket;

function initializeGroqWebSocket() {
    groqSocket = new WebSocket(GROQ_WEBSOCKET_URL, {
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`
        }
    });

    groqSocket.on('open', () => {
        console.log('Groq WebSocket connection established');
    });

    groqSocket.on('message', (data) => {
        const message = JSON.parse(data);
        console.log('Received message from Groq:', message);
    });

    groqSocket.on('close', () => {
        console.log('Groq WebSocket connection closed');
        // Implement reconnection logic here if needed
    });

    groqSocket.on('error', (error) => {
        console.error('Groq WebSocket error:', error);
    });
}

async function processChat(message) {
    return new Promise((resolve, reject) => {
        if (!groqSocket || groqSocket.readyState !== WebSocket.OPEN) {
            reject(new Error('Groq WebSocket is not open'));
            return;
        }

        let fullResponse = '';

        const messageHandler = (data) => {
            const response = JSON.parse(data);
            if (response.choices && response.choices[0].delta.content) {
                fullResponse += response.choices[0].delta.content;
            }
            if (response.choices && response.choices[0].finish_reason === 'stop') {
                groqSocket.removeListener('message', messageHandler);
                resolve(fullResponse);
            }
        };

        groqSocket.addEventListener('message', messageHandler);

        const request = {
            model: 'mixtral-8x7b-32768',
            messages: [{ role: 'user', content: message }],
            temperature: 0.7,
            max_tokens: 150,
            stream: true
        };

        groqSocket.send(JSON.stringify(request));
    });
}

// Initialize the Groq WebSocket connection
initializeGroqWebSocket();

module.exports = {
    processChat
};
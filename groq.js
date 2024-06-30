const WebSocket = require('ws');
const fetch = require('node-fetch');
const DID_API = require('./api.js');

const GROQ_API_KEY = DID_API.groqKey;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not set in api.js. Please set it and restart the server.');
    process.exit(1);
}

async function processChat(message) {
    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b-32768',
                messages: [{ role: 'user', content: message }],
                temperature: 0.7,
                max_tokens: 150,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error processing chat with Groq:', error);
        throw error;
    }
}

let groqSocket;

function initializeGroqWebSocket() {
    groqSocket = new WebSocket('wss://api.groq.com/v1/streaming/completions');

    groqSocket.on('open', () => {
        console.log('Groq WebSocket connection established');
        groqSocket.send(JSON.stringify({ type: 'authentication', api_key: GROQ_API_KEY }));
    });

    groqSocket.on('message', (data) => {
        const message = JSON.parse(data);
        console.log('Received message from Groq:', message);
        // Handle incoming messages from Groq
    });

    groqSocket.on('close', () => {
        console.log('Groq WebSocket connection closed');
        // Implement reconnection logic here if needed
    });

    groqSocket.on('error', (error) => {
        console.error('Groq WebSocket error:', error);
    });
}

async function sendStreamingRequest(message) {
    if (!groqSocket || groqSocket.readyState !== WebSocket.OPEN) {
        throw new Error('Groq WebSocket is not open');
    }

    return new Promise((resolve, reject) => {
        let fullResponse = '';

        const messageHandler = (data) => {
            const response = JSON.parse(data);
            if (response.type === 'chat_token') {
                fullResponse += response.token;
            } else if (response.type === 'chat_complete') {
                groqSocket.removeListener('message', messageHandler);
                resolve(fullResponse);
            } else if (response.type === 'error') {
                groqSocket.removeListener('message', messageHandler);
                reject(new Error(response.error));
            }
        };

        groqSocket.on('message', messageHandler);

        groqSocket.send(JSON.stringify({
            type: 'chat',
            messages: [{ role: 'user', content: message }],
            model: 'mixtral-8x7b-32768',
            temperature: 0.7,
            max_tokens: 150,
            stream: true
        }));
    });
}

// Initialize the Groq WebSocket connection
initializeGroqWebSocket();

module.exports = {
    processChat,
    sendStreamingRequest
};
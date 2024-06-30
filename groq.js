'use strict';

const WebSocket = require('ws');
const fetch = require('node-fetch');
const DID_API = require('./api.js');
const Logger = require('./logger.js');

const logger = new Logger('INFO');

const GROQ_API_KEY = DID_API.groqKey;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not set. Please check your api.js file.');
    process.exit(1);
}

let groqSocket;

function initializeGroq(apiKey) {
    return new Promise((resolve, reject) => {
        groqSocket = new WebSocket('wss://api.groq.com/v1/streaming/completions');

        groqSocket.on('open', () => {
            logger.log('Groq WebSocket opened');
            groqSocket.send(JSON.stringify({ type: 'authentication', api_key: apiKey }));
            resolve();
        });

        groqSocket.on('close', () => logger.log('Groq WebSocket closed'));
        groqSocket.on('error', (error) => {
            logger.error('Groq WebSocket error:', error);
            reject(error);
        });
    });
}

async function sendChatToGroq(message) {
    logger.log('Sending chat to Groq:', message);
    return new Promise((resolve, reject) => {
        if (groqSocket.readyState !== WebSocket.OPEN) {
            reject(new Error('Groq WebSocket is not open'));
            return;
        }

        groqSocket.send(JSON.stringify({
            type: 'chat',
            messages: [{ role: 'user', content: message }],
            model: 'mixtral-8x7b-32768',
            temperature: 0.7,
            max_tokens: 150,
            stream: true
        }));

        let fullResponse = '';

        const messageHandler = (event) => {
            const response = JSON.parse(event.data);
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
    });
}

function closeGroqConnection() {
    if (groqSocket && groqSocket.readyState === WebSocket.OPEN) {
        groqSocket.close();
    }
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
        logger.error('Error processing chat with Groq:', error);
        throw error;
    }
}

module.exports = {
    initializeGroq,
    sendChatToGroq,
    closeGroqConnection,
    processChat
};
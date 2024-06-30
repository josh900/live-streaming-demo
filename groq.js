import fetch from 'node-fetch';
import Logger from './logger.js';
import DID_API from './api.js';

const logger = new Logger('INFO');

const GROQ_API_KEY = DID_API.groqKey;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not set. Please check your api.js file.');
    process.exit(1);
}

export async function initializeGroq() {
  logger.log('Groq API initialized');
  return true;
}

export async function sendChatToGroq(message) {
    logger.log('Sending chat to Groq:', message);
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
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.body;
    } catch (error) {
        logger.error('Error sending chat to Groq:', error);
        throw error;
    }
}

export async function processChat(message) {
  try {
    const stream = await sendChatToGroq(message);
    let fullResponse = '';

    for await (const chunk of stream) {
      const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        const trimmedLine = line.replace(/^data: /, '');
        if (trimmedLine === '[DONE]') {
          return fullResponse.trim();
        }
        try {
          const parsed = JSON.parse(trimmedLine);
          const content = parsed.choices[0]?.delta?.content || '';
          fullResponse += content;
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      }
    }

    return fullResponse.trim();
  } catch (error) {
    logger.error('Error processing chat with Groq:', error);
    throw error;
  }
}

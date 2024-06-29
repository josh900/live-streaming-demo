import Logger from './logger.js';

const logger = new Logger('INFO');
let groqSocket;

export async function initializeGroq(apiKey) {
  logger.log('Initializing Groq');
  groqSocket = new WebSocket('wss://api.groq.com/v1/chat/completions');
  
  groqSocket.onopen = () => {
    logger.log('Groq WebSocket opened');
    groqSocket.send(JSON.stringify({ type: 'authentication', api_key: apiKey }));
  };
  
  groqSocket.onclose = () => logger.log('Groq WebSocket closed');
  groqSocket.onerror = (error) => logger.error('Groq WebSocket error:', error);
}

export async function sendChatToGroq(message) {
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
        // You can implement progressive rendering here if needed
      } else if (response.type === 'chat_complete') {
        groqSocket.removeEventListener('message', messageHandler);
        resolve(fullResponse);
      } else if (response.type === 'error') {
        groqSocket.removeEventListener('message', messageHandler);
        reject(new Error(response.error));
      }
    };

    groqSocket.addEventListener('message', messageHandler);
  });
}

// Function to close the Groq WebSocket connection
export function closeGroqConnection() {
  if (groqSocket && groqSocket.readyState === WebSocket.OPEN) {
    groqSocket.close();
  }
}

// Function to check if the Groq WebSocket is connected
export function isGroqConnected() {
  return groqSocket && groqSocket.readyState === WebSocket.OPEN;
}

// Retry mechanism for Groq connection
export async function retryGroqConnection(apiKey, maxRetries = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      await initializeGroq(apiKey);
      if (isGroqConnected()) {
        logger.log('Groq connection established successfully');
        return;
      }
    } catch (error) {
      logger.error(`Groq connection attempt ${retries + 1} failed:`, error);
    }
    retries++;
    await new Promise(resolve => setTimeout(resolve, 2000 * retries)); // Exponential backoff
  }
  throw new Error('Failed to establish Groq connection after multiple attempts');
}
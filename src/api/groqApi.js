import { fetchWithRetries } from '../utils/helpers.js';

async function sendChatToGroq(chatHistory, context) {
    console.debug('Sending chat to Groq...');
    try {
      if (!Array.isArray(chatHistory)) {
        throw new Error('chatHistory must be an array');
      }
  
      const requestBody = {
        messages: [
          {
            role: 'system',
            content: context || '',
          },
          ...chatHistory,
        ],
        model: 'llama3-8b-8192',
      };
      console.debug('Request body:', JSON.stringify(requestBody));
  
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
  
      console.debug('Groq response status:', response.status);
  
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
  
      return response;
    } catch (error) {
      console.error('Error in sendChatToGroq:', error);
      throw error;
    }
  }
  
async function* processGroqResponse(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let assistantReply = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    console.debug('Received chunk:', chunk);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data:')) {
        const data = line.substring(5).trim();
        if (data === '[DONE]') {
          return assistantReply;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content || '';
          assistantReply += content;
          yield content;
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      }
    }
  }

  return assistantReply;
}

export { sendChatToGroq, processGroqResponse };
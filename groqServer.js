import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';
import DID_API from './api.js';

const app = express();
const port = 3001;

// Import the array of Groq API keys
const { groqKeys } = DID_API;

// Select a random starting index
let currentKeyIndex = Math.floor(Math.random() * groqKeys.length);

app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
  const { messages, model } = req.body;

  // Get the current API key and update the index for the next call
  const apiKey = groqKeys[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % groqKeys.length;

  // Initialize the Groq client with the selected API key
  const groq = new Groq({ apiKey });

  try {
    const completion = await groq.chat.completions.create({
      messages,
      model,
      stream: true,
    });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    for await (const chunk of completion) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.listen(port, () => {
  console.log(`Groq server is running on port ${port}`);
});

export default app;
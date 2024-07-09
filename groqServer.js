// groqServer.js

import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';
import DID_API from './api.js';

const app = express();
const port = 3001;

const groq = new Groq({ apiKey: DID_API.groqKey });

app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
  const { messages, model } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid or missing messages array' });
  }

  if (!model) {
    return res.status(400).json({ error: 'Model not specified' });
  }

  try {
    const completion = await groq.chat.completions.create({
      messages,
      model,
      stream: true,
    });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    for await (const chunk of completion) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    console.error('Error in Groq API call:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'An error occurred while processing your request' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'An error occurred during streaming' })}\n\n`);
      res.end();
    }
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected error occurred' });
});

app.listen(port, () => {
  console.log(`Groq server is running on port ${port}`);
});
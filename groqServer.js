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

  try {
    console.log('Received chat request:', { messages, model });

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
    console.log('Chat response completed');
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'An error occurred', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Groq server is running on port ${port}`);
});

export default app;

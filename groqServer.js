const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
const port = 3001;

const GROQ_API_KEY = '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';
const groq = new Groq({ apiKey: GROQ_API_KEY });

app.use(cors());
app.use(express.json());;

app.post('/chat', async (req, res) => {
  const { messages, model } = req.body;

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
  console.log(`Server is running on port ${port}`);
});
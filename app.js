import express from 'express';
import http from 'http';
import cors from 'cors';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import DID_API from './api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = 3000;

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', express.static(__dirname, {
  setHeaders: (res, path) => {
    if (path.endsWith('.json')) {
      res.type('application/javascript');
    }
  }
}));

app.get('/', function(req, res) {
  res.sendFile(join(__dirname, 'index.html'));
});

app.get('/agents', function(req, res) {
  res.sendFile(join(__dirname, 'index-agents.html'));
});

// Proxy route for checking stream validity
app.get('/check-stream/:streamId', async (req, res) => {
  try {
    const response = await fetch(`${DID_API.url}/${DID_API.service}/streams/${req.params.streamId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 403) {
      console.log('Stream is no longer valid (403 Forbidden)');
      res.sendStatus(403);
    } else if (response.ok) {
      res.sendStatus(200);
    } else {
      res.sendStatus(response.status);
    }
  } catch (error) {
    console.error('Error checking stream validity:', error);
    res.sendStatus(500);
  }
});

// Proxy route for chat
app.post('/chat', async (req, res) => {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DID_API.groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Proxy route for starting the stream
app.post('/start-stream/:streamId', async (req, res) => {
  try {
    const response = await fetch(`${DID_API.url}/${DID_API.service}/streams/${req.params.streamId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Error starting stream:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const server = http.createServer(app);

server.listen(port, () => console.log(`Server started on port localhost:${port}`));
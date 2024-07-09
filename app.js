import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import compression from 'compression';
import multer from 'multer';
import { createOrUpdateAvatar, getAvatars } from './avatar-manager.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Groq from 'groq-sdk';
import DID_API from './api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = 3000;
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const groq = new Groq({ apiKey: DID_API.groqKey });

app.use(compression());
app.use(cors());
app.use(express.json());

app.use('/', express.static(__dirname, {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

app.get('/', function(req, res) {
  res.sendFile(join(__dirname, 'index.html'));
});

app.get('/agents', function(req, res) {
  res.sendFile(join(__dirname, 'index-agents.html'));
});

app.post('/avatar', upload.single('image'), async (req, res) => {
  try {
    const { name, voiceId } = req.body;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write('data: {"status": "processing"}\n\n');

    const avatar = await createOrUpdateAvatar(name, req.file, voiceId || 'en-US-GuyNeural');
    
    res.write('data: {"status": "completed", "avatar": ' + JSON.stringify(avatar) + '}\n\n');
    res.end();
  } catch (error) {
    console.error('Error creating/updating avatar:', error);
    res.write('data: {"status": "error", "message": "Failed to create/update avatar"}\n\n');
    res.end();
  }
});

app.get('/avatars', async (req, res) => {
  try {
    const avatars = await getAvatars();
    res.json(avatars);
  } catch (error) {
    console.error('Error getting avatars:', error);
    res.status(500).json({ error: 'Failed to get avatars' });
  }
});

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
      'Connection': 'keep-alive',
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

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    console.log('Received message:', message);
    // Handle incoming WebSocket messages here
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server started on port localhost:${port}`);
  console.log(`http://localhost:${port}`);
  console.log(`http://localhost:${port}/agents`);
});
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { createOrUpdateAvatar, getAvatars } from './avatar-manager.js';
import Groq from 'groq-sdk';
import DID_API from './api.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const groq = new Groq({ apiKey: DID_API.groqKey });

app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));


const upload = multer();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/avatars', async (req, res) => {
  try {
    const avatars = await getAvatars();
    res.json(avatars);
  } catch (error) {
    console.error('Error fetching avatars:', error);
    res.status(500).json({ error: 'Failed to fetch avatars' });
  }
});

app.get('/api.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'api.js'));
});


app.post('/avatar', upload.single('image'), async (req, res) => {
  const { name, voiceId } = req.body;
  const imageFile = req.file;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  res.write('data: {"status":"processing"}\n\n');

  try {
    const avatar = await createOrUpdateAvatar(name, imageFile, voiceId);
    res.write(`data: {"status":"completed","avatar":${JSON.stringify(avatar)}}\n\n`);
  } catch (error) {
    console.error('Error creating/updating avatar:', error);
    res.write(`data: {"status":"error","message":"Failed to create/update avatar"}\n\n`);
  }

  res.end();
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

const server = createServer(app);

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket connection established');

  ws.on('message', (message) => {
    console.log('Received message:', message);
    // Handle incoming messages
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
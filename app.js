import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import compression from 'compression';
import multer from 'multer';
import { createOrUpdateAvatar, getAvatars } from './avatar-manager.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import groqServer from './groqServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = 3000;
const upload = multer({ storage: multer.memoryStorage() });

const app = express();

app.use(compression());
app.use(cors());
app.use(express.json());

app.use(
  '/',
  express.static(__dirname, {
    setHeaders: (res, path) => {
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
    },
  }),
);

app.get('/', function (req, res) {
  res.sendFile(join(__dirname, 'index.html'));
});

app.get('/agents', function (req, res) {
  res.sendFile(join(__dirname, 'index-agents.html'));
});

app.use(
  '/chat',
  createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
  }),
);

app.post('/avatar', upload.single('image'), async (req, res) => {
  try {
    const { name, voiceId } = req.body;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('data: {"status": "processing"}\n\n');

    const avatar = await createOrUpdateAvatar(name, req.file, voiceId || 'en-US-GuyNeural');

    res.write('data: {"status": "completed", "avatar": ' + JSON.stringify(avatar) + '}\n\n');
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

app.get('/contexts', async (req, res) => {
  try {
    const contexts = await getContexts();
    if (Object.keys(contexts).length === 0) {
      // If no contexts are found, return a default context
      contexts.default = {
        name: 'Default',
        content: 'You are a helpful, harmless, and honest assistant.',
      };
    }
    res.json(contexts);
  } catch (error) {
    console.error('Error getting contexts:', error);
    res.status(500).json({ error: 'Failed to get contexts' });
  }
});

app.post('/context', async (req, res) => {
  try {
    const { name, content } = req.body;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('data: {"status": "processing"}\n\n');

    const context = await createOrUpdateContext(name, content);

    res.write('data: {"status": "completed", "context": ' + JSON.stringify(context) + '}\n\n');
    res.end();
  } catch (error) {
    console.error('Error creating/updating context:', error);
    res.write('data: {"status": "error", "message": "Failed to create/update context"}\n\n');
    res.end();
  }
});

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    console.log('Received message:', message);
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

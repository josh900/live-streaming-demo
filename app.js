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
import { readFile, writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';



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
    const { name, voiceId, id } = req.body;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('data: {"status": "processing"}\n\n');

    const avatar = await createOrUpdateAvatar(id, name, req.file, voiceId || 'en-US-AndrewNeural');

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

app.get('/contexts', async (req, res) => {
  try {
    const contexts = JSON.parse(await readFile('contexts.json', 'utf8'));
    res.json(contexts);
  } catch (error) {
    console.error('Error reading contexts:', error);
    res.status(500).json({ error: 'Failed to get contexts' });
  }
});

app.post('/context', async (req, res) => {
  try {
    const { id, name, context } = req.body;
    const contexts = JSON.parse(await readFile('contexts.json', 'utf8'));

    if (id) {
      const index = contexts.findIndex(c => c.id === id);
      if (index !== -1) {
        contexts[index] = { id, name, context };
      } else {
        throw new Error('Context not found');
      }
    } else {
      const newContext = { id: uuidv4(), name, context };
      contexts.push(newContext);
    }

    await writeFile('contexts.json', JSON.stringify(contexts, null, 2));
    res.json(id ? contexts.find(c => c.id === id) : contexts[contexts.length - 1]);
  } catch (error) {
    console.error('Error saving context:', error);
    res.status(500).json({ error: 'Failed to save context' });
  }
});

app.get('/api/avatars', async (req, res) => {
  try {
    const avatarsFile = path.join(__dirname, 'avatars.json');
    const avatarsData = await readFile(avatarsFile, 'utf8');
    const avatars = JSON.parse(avatarsData);
    res.json(avatars);
  } catch (error) {
    console.error('Error reading avatars file:', error);
    res.status(500).json({ error: 'Failed to retrieve avatars' });
  }
});

app.get('/api/contexts', async (req, res) => {
  try {
    const contextsFile = path.join(__dirname, 'contexts.json');
    const contextsData = await readFile(contextsFile, 'utf8');
    const contexts = JSON.parse(contextsData);
    const filteredContexts = contexts.map(({ id, name }) => ({ id, name }));
    res.json(filteredContexts);
  } catch (error) {
    console.error('Error reading contexts file:', error);
    res.status(500).json({ error: 'Failed to retrieve contexts' });
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


app.get('/logging', (req, res) => {
  console.log('server_logs:', req.query);
  res.end();
});

server.listen(port, () => {
  console.log(`Server started on port localhost:${port}`);
  console.log(`http://localhost:${port}`);
  console.log(`http://localhost:${port}/agents`);
});

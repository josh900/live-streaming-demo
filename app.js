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
    const { id, name, voiceId } = req.body;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write('data: {"status": "processing"}\n\n');

    let avatar;
    if (id) {
      avatar = await updateAvatar(id, name, req.file, voiceId);
    } else {
      avatar = await createAvatar(name, req.file, voiceId);
    }

    res.write(`data: {"status": "completed", "avatar": ${JSON.stringify(avatar)}}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error creating/updating avatar:', error);
    res.write('data: {"status": "error", "message": "Failed to create/update avatar"}\n\n');
    res.end();
  }
});

async function createAvatar(name, imageFile, voiceId) {
  const avatars = JSON.parse(await readFile('avatars.json', 'utf8'));
  const newAvatar = {
    id: uuidv4(),
    name,
    voiceId: voiceId || 'en-US-GuyNeural',
    imageUrl: '',
    silentVideoUrl: ''
  };

  if (imageFile) {
    const imageUrl = await uploadToS3(imageFile, `avatars/${newAvatar.id}/image.png`);
    newAvatar.imageUrl = imageUrl;
    newAvatar.silentVideoUrl = await generateSilentVideo(imageUrl, newAvatar.voiceId, newAvatar.name);
  }

  avatars.push(newAvatar);
  await writeFile('avatars.json', JSON.stringify(avatars, null, 2));
  return newAvatar;
}


async function updateAvatar(id, name, imageFile, voiceId) {
  const avatars = JSON.parse(await readFile('avatars.json', 'utf8'));
  const index = avatars.findIndex(a => a.id === id);
  if (index === -1) {
    throw new Error('Avatar not found');
  }

  const updatedAvatar = { ...avatars[index], name, voiceId };

  if (imageFile) {
    const imageUrl = await uploadToS3(imageFile, `avatars/${id}/image.png`);
    updatedAvatar.imageUrl = imageUrl;
    updatedAvatar.silentVideoUrl = await generateSilentVideo(imageUrl, voiceId, name);
  }

  avatars[index] = updatedAvatar;
  await writeFile('avatars.json', JSON.stringify(avatars, null, 2));
  return updatedAvatar;
}



app.get('/avatars', async (req, res) => {
  try {
    const avatars = JSON.parse(await readFile('avatars.json', 'utf8'));
    res.json(avatars);
  } catch (error) {
    console.error('Error reading avatars:', error);
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

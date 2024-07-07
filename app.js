const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const compression = require('compression');
const multer = require('multer');
const { createOrUpdateAvatar, getAvatars } = require('./avatar-manager.js');

const port = 3000;
const upload = multer({ storage: multer.memoryStorage() });

const app = express();

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
  res.sendFile(__dirname + '/index.html');
});

app.get('/agents', function(req, res) {
  res.sendFile(__dirname + '/index-agents.html');
});

app.use('/chat', createProxyMiddleware({ 
  target: 'http://localhost:3001', 
  changeOrigin: true 
}));

app.post('/avatar', upload.single('image'), async (req, res) => {
  try {
    const { name, voiceId } = req.body;
    const avatar = await createOrUpdateAvatar(name, req.file.buffer, voiceId);
    res.json(avatar);
  } catch (error) {
    console.error('Error creating/updating avatar:', error);
    res.status(500).json({ error: 'Failed to create/update avatar' });
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

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

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

require('./groqServer');
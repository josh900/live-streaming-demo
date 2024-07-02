const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const compression = require('compression');

const port = 3000;

const app = express();

// Use compression middleware
app.use(compression());

app.use(cors());

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

// Proxy requests to the Groq server
app.use('/chat', createProxyMiddleware({ 
  target: 'http://localhost:3001', 
  changeOrigin: true 
}));

const server = http.createServer(app);

// Set up WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    console.log('Received message:', message);
    // Handle incoming messages here
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

// Start the Groq server
require('./groqServer');
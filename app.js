const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

const port = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', async (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'transcription':
        // Handle transcription data
        console.log('Received transcription:', data.text);
        // Process transcription and send to Groq
        // Then send the response back to the client
        break;

      case 'avatar_update':
        // Handle avatar update request
        console.log('Received avatar update request:', data.imageUrl);
        // Update avatar using D-ID API
        // Send confirmation back to the client
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
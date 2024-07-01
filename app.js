const express = require('express');
const http = require('http');
const cors = require('cors');
const WebSocket = require('ws');

const port = 3000;

const app = express();
app.use(cors());

app.use('/', express.static(__dirname, {
    setHeaders: (res, path) => {
      if (path.endsWith('.json')) {
        res.type('application/javascript');
      }
    }
  }));

app.use('/', express.static(__dirname));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html')
});
app.get('/agents', function(req, res) {
    res.sendFile(__dirname + '/index-agents.html')
});

const server = http.createServer(app);

// Set up WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    console.log('Received:', message);
    // Handle incoming messages
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

server.listen(port, () => console.log(`Server started on port localhost:${port}\nhttp://localhost:${port}\nhttp://localhost:${port}/agents`));
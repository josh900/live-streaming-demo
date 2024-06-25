const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');

const port = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Add any additional routes or API endpoints here

const server = http.createServer(app);

server.listen(port, () => console.log(`Server started on port ${port}`));

// WebSocket setup for real-time communication (if needed)
// const WebSocket = require('ws');
// const wss = new WebSocket.Server({ server });
// 
// wss.on('connection', (ws) => {
//   console.log('New WebSocket connection');
//   // Handle WebSocket messages here
// });

module.exports = app;
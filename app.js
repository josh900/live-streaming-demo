const express = require('express');
const http = require('http');
const cors = require('cors');

const port = 3000;

const app = express();

// Custom CORS middleware
const corsOptions = {
  origin: ['https://avatar.skoop.digital', 'https://api.d-id.com'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Additional middleware to set CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://api.d-id.com');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/', express.static(__dirname, {
  setHeaders: (res, path) => {
    if (path.endsWith('.json')) {
      res.type('application/javascript');
    }
  }
}));

app.use('/', express.static(__dirname));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/agents', function(req, res) {
  res.sendFile(__dirname + '/index-agents.html');
});

// Handle preflight requests
app.options('*', cors(corsOptions));

const server = http.createServer(app);

server.listen(port, () => console.log(`Server started on port localhost:${port}`));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
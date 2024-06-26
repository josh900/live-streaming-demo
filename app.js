const express = require('express');
const http = require('http');
const cors = require('cors');
const fetch = require('node-fetch');

const port = 3000;
const DID_API = require('./api.js');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', express.static(__dirname, {
  setHeaders: (res, path) => {
    if (path.endsWith('.json')) {
      res.type('application/javascript');
    }
  }
}));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html')
});

app.get('/agents', function(req, res) {
  res.sendFile(__dirname + '/index-agents.html')
});

// Proxy route for checking stream validity
app.get('/check-stream/:streamId', async (req, res) => {
  try {
    const response = await fetch(`${DID_API.url}/${DID_API.service}/streams/${req.params.streamId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      res.sendStatus(200);
    } else {
      res.sendStatus(response.status);
    }
  } catch (error) {
    console.error('Error checking stream validity:', error);
    res.sendStatus(500);
  }
});

// Proxy route for starting the stream
app.post('/start-stream/:streamId', async (req, res) => {
  try {
    const response = await fetch(`${DID_API.url}/${DID_API.service}/streams/${req.params.streamId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Error starting stream:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const server = http.createServer(app);

server.listen(port, () => console.log(`Server started on port localhost:${port}`));
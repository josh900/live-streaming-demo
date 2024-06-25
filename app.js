const express = require('express');
const http = require('http');
const cors = require('cors');
const fetch = require('node-fetch');

const port = 3000;

const app = express();
app.use(cors());
app.use(express.json());

const DID_API_KEY = 'YWRtaW4xQHNrb29wLmRpZ2l0YWw:1FItMzMiqjms0QwfA9g8p';
const DID_API_URL = 'https://api.d-id.com';

// Proxy for D-ID API calls
app.use('/did-api', async (req, res) => {
  const targetUrl = `${DID_API_URL}${req.url}`;
  const method = req.method;
  const headers = {
    'Authorization': `Basic ${DID_API_KEY}`,
    'Content-Type': 'application/json',
  };
  const body = method !== 'GET' && method !== 'HEAD' ? JSON.stringify(req.body) : undefined;

  try {
    const response = await fetch(targetUrl, { method, headers, body });
    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    console.error('Error proxying request to D-ID API:', error);
    res.status(500).json({ error: 'An error occurred while proxying the request' });
  }
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

const server = http.createServer(app);

server.listen(port, () => console.log(`Server started on port localhost:${port}`));
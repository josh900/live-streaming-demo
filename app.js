const express = require('express');
const http = require('http');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const port = 3000;

const app = express();

// Configure CORS
app.use(cors({
  origin: 'https://avatar.skoop.digital',
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Proxy middleware options
const options = {
  target: 'https://api.d-id.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // remove /api prefix when forwarding to d-id API
  },
  onProxyRes: function (proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = 'https://avatar.skoop.digital';
  },
};

// Create the proxy middleware
const didProxy = createProxyMiddleware(options);

// Use the proxy for requests to /api
app.use('/api', didProxy);

app.use('/', express.static(__dirname, {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
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

const server = http.createServer(app);

server.listen(port, () => console.log(`Server started on port localhost:${port}\nhttp://localhost:${port}\nhttp://localhost:${port}/agents`));
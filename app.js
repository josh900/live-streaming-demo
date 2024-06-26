const express = require('express');
const http = require('http');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 3000;

app.use(cors({
  origin: 'https://avatar.skoop.digital',
  credentials: true
}));

app.use('/', express.static(__dirname, {
  setHeaders: (res, path) => {
    if (path.endsWith('.json')) {
      res.type('application/javascript');
    }
  }
}));

const didApiProxy = createProxyMiddleware({
  target: 'https://api.d-id.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/d-id': '', // remove /api/d-id from the beginning of the path
  },
  onProxyRes: function (proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = 'https://avatar.skoop.digital';
  },
});

app.use('/api/d-id', didApiProxy);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/agents', function(req, res) {
  res.sendFile(__dirname + '/index-agents.html');
});

const server = http.createServer(app);

server.listen(port, () => console.log(`Server started on port localhost:${port}`));
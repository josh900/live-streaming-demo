const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 3001; // Use a different port from your main server

app.use(cors());

const didApiProxy = createProxyMiddleware({
  target: 'https://api.d-id.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/d-id': '', // remove /api/d-id from the beginning of the path
  },
  onProxyRes: function (proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  },
});

app.use('/api/d-id', didApiProxy);

app.listen(port, () => {
  console.log(`Proxy server listening at http://localhost:${port}`);
});
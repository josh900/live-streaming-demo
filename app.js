// app.js

const express = require('express');
const http = require('http');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const port = process.env.PORT || 3000;

const app = express();
app.use(cors());

// Serve static files
app.use(express.static('public'));

// Proxy requests to Groq server
app.use('/chat', createProxyMiddleware({ 
  target: 'https://avatar.skoop.digital',
  changeOrigin: true
}));

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

const server = http.createServer(app);

server.listen(port, () => console.log(`Server started on http://localhost:${port}`));
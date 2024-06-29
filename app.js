import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3000;

const app = express();
app.use(cors());

app.use('/', express.static('.', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: '.' });
});

const server = http.createServer(app);

server.listen(port, () => console.log(`Server started on port ${port}\nhttp://localhost:${port}`));
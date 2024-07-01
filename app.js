import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { processChat, initializeGroq } from './groq.js';
import DID_API from './api.js';
import { handleError } from './errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 3000;

const app = express();

// Middleware
app.use(cors());
app.use(express.static(__dirname));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-agents.html'));
});

app.get('/agents', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-agents.html'));
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Initialize Groq
initializeGroq().catch(error => {
    handleError('Failed to initialize Groq', error);
    process.exit(1);
});

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received message:', data);

            switch (data.type) {
                case 'transcription':
                    // Process transcription with Groq
                    const response = await processChat(data.text);
                    ws.send(JSON.stringify({ type: 'groq_response', response }));
                    break;

                case 'avatar_update':
                    // Handle avatar update (implement D-ID API call here)
                    console.log('Avatar update requested:', data.imageUrl);
                    // Placeholder response - replace with actual D-ID API call
                    ws.send(JSON.stringify({ type: 'avatar_update_confirmation', status: 'success' }));
                    break;

                default:
                    console.log('Unknown message type:', data.type);
                    ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
            }
        } catch (error) {
            handleError('Error processing message', error);
            ws.send(JSON.stringify({ type: 'error', message: error.message }));
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
});

// Start the server
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`WebSocket server is running on ws://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
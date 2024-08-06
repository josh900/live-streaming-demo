import http from 'http';
import logger from './logger.js';

const PING_URL = 'http://ping.skoop.digital';
const PING_INTERVAL = 120000; // 2 minutes in milliseconds

function sendPing() {
  const startTime = Date.now();
  
  const req = http.get(PING_URL, (res) => {
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    logger.info(`Ping response: ${res.statusCode}, Latency: ${latency}ms`);
    
    res.on('data', () => {});
    res.on('end', () => {});
  });
  
  req.on('error', (error) => {
    logger.error(`Ping request error: ${error.message}`);
  });
}

function startPingMonitoring() {
  logger.info('Starting ping monitoring...');
  sendPing(); // Send initial ping
  setInterval(sendPing, PING_INTERVAL);
}

export default startPingMonitoring;

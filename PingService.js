import fetch from 'node-fetch';

const PING_URL = 'ping.skoop.digital';
const PING_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds

async function pingService() {
  try {
    const response = await fetch(`https://${PING_URL}`);
    if (response.ok) {
      console.log(`Ping successful: ${PING_URL}`);
    } else {
      console.error(`Ping failed: ${PING_URL}. Status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Ping error: ${PING_URL}. Error: ${error.message}`);
  }
}

export function startPingService() {
  console.log('Starting ping service...');
  pingService(); // Initial ping
  setInterval(pingService, PING_INTERVAL);
}

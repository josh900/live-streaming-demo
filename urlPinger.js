import axios from 'axios';

const PING_URL = 'ping.skoop.digital';
const PING_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds

export function startUrlPinging() {
  console.log(`Starting to ping ${PING_URL} every ${PING_INTERVAL} milliseconds.`);

  setInterval(async () => {
    try {
      await axios.get(`https://${PING_URL}`);
      console.log(`Successfully pinged ${PING_URL}`);
    } catch (error) {
      console.error(`Error pinging ${PING_URL}:`, error);
    }
  }, PING_INTERVAL);
}

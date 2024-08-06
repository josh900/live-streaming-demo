import fetch from 'node-fetch';

export function startPingService() {
  const pingUrl = 'https://ping.skoop.digital';

  async function sendPing() {
    try {
      await fetch(pingUrl);
      console.log('Ping sent to', pingUrl);
    } catch (error) {
      console.error('Error sending ping:', error);
    }
  }

  setInterval(sendPing, 120000); // Ping every 2 minutes
}

import fetch from 'node-fetch';

function startPingService() {
  setInterval(async () => {
    try {
      await fetch('https://ping.skoop.digital');
      console.log('Ping sent to ping.skoop.digital');
    } catch (error) {
      console.error('Error sending ping:', error);
    }
  }, 120000);
}

export { startPingService };

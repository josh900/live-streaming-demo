let socket;

function initializeWebSocket() {
  socket = new WebSocket(`wss://${window.location.host}`);

  socket.onopen = () => {
    console.info('WebSocket connection established');
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.debug('Received WebSocket message:', data);

    switch (data.type) {
      case 'transcription':
        window.dispatchEvent(new CustomEvent('transcription', { detail: data.text }));
        break;
      case 'assistantReply':
        window.dispatchEvent(new CustomEvent('assistantReply', { detail: data.text }));
        break;
      default:
        console.warn('Unknown WebSocket message type:', data.type);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onclose = () => {
    console.info('WebSocket connection closed');
    setTimeout(initializeWebSocket, 10000);
  };
}

function sendWebSocketMessage(message) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    console.warn('WebSocket is not open. Cannot send message.');
  }
}

export { initializeWebSocket, sendWebSocketMessage };
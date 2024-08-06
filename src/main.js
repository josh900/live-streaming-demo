import { setLogLevel } from './utils/logger.js';
import { initializeWebSocket } from './connection/websocket.js';
import { loadAvatars, populateAvatarSelect } from './avatar/avatarManager.js';
import { initializePersistentStream } from './connection/streamManager.js';
import { initializeVideoElements, playIdleVideo } from './ui/videoManager.js';
import { showLoadingSymbol, hideLoadingSymbol, showErrorMessage } from './ui/uiManager.js';
import { initializeEventListeners } from './ui/eventListeners.js';



const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
};

let connectionState = ConnectionState.DISCONNECTED;

async function initialize() {
  setLogLevel('DEBUG');
  connectionState = ConnectionState.DISCONNECTED;

  initializeEventListeners();
  initializeWebSocket();
  initializeVideoElements();

  await loadAvatars();
  populateAvatarSelect();

  playIdleVideo();

  showLoadingSymbol();
  try {
    await initializePersistentStream();
    hideLoadingSymbol();
  } catch (error) {
    console.error('Error during initialization:', error);
    hideLoadingSymbol();
    showErrorMessage('Failed to connect. Please try again.');
    connectionState = ConnectionState.DISCONNECTED;
  }

  // Set up reconnection mechanism
  window.addEventListener('online', handleOnline);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  console.info('Initialization complete');
}

function handleOnline() {
  if (connectionState === ConnectionState.DISCONNECTED) {
    console.info('Network connection restored. Attempting to reconnect...');
    backgroundReconnect();
  }
}

function handleVisibilityChange() {
  if (!document.hidden && connectionState === ConnectionState.DISCONNECTED) {
    console.info('Page became visible. Checking connection...');
    if (navigator.onLine) {
      backgroundReconnect();
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

export { ConnectionState, connectionState };
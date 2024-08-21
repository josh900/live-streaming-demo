--fm--start-1--fm--
--fm--start-1--fm--
--fm--start-1--fm--
'use strict';
import DID_API from './api.js';
import logger from './logger.js';
const { createClient, LiveTranscriptionEvents } = deepgram;
function getUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    avatarId: urlParams.get('avatar'),
    contextId: urlParams.get('context'),
    interface: urlParams.get('interface'),
    header: urlParams.get('header'),
    simple: urlParams.get('simple') === 'true'
  };
}
const deepgramClient = createClient(DID_API.deepgramKey);
const RTCPeerConnection = (
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
).bind(window);
let peerConnection;
let pcDataChannel;
let streamId;
let sessionId;
let sessionClientAnswer;
let statsIntervalId;
let videoIsPlaying;
let lastBytesReceived;
let chatHistory = [];
let inactivityTimeout;
let keepAliveInterval;
let socket;
let isInitializing = false;
let audioContext;
let streamVideoElement;
let idleVideoElement;
let deepgramConnection;
let isRecording = false;
let audioWorkletNode;
let currentUtterance = '';
let interimMessageAdded = false;
let autoSpeakMode = true;
let transitionCanvas;
let transitionCtx;
let isDebugMode = false;
let isTransitioning = false;
let lastVideoStatus = null;
let isCurrentlyStreaming = false;
let reconnectAttempts = 10;
let persistentStreamId = null;
let persistentSessionId = null;
let isPersistentStreamActive = false;
const API_RATE_LIMIT = 40; // Maximum number of calls per minute
const API_CALL_INTERVAL = 30000 / API_RATE_LIMIT; // Minimum time between API calls in milliseconds
let lastApiCallTime = 0;
const maxRetryCount = 10;
const maxDelaySec = 100;
const RECONNECTION_INTERVAL = 100000; // 25 seconds for testing, adjust as needed
let isAvatarSpeaking = false;
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 2000; // 1 second
const MAX_RECONNECT_DELAY = 90000; // 30 seconds
let autoSpeakInProgress = false;
let isPushToTalkEnabled = false;
let isPushToTalkActive = false;
let pushToTalkStartTime = 0;
const MIN_PUSH_TO_TALK_DURATION = 600; // 1 second in milliseconds
let pushToTalkTimer = null;
let contexts = [];
let currentContextId = '';
let currentAvatarId = '';
let isInitializingStream = false;
--fm--end-1--fm--
--fm--start-2--fm--
const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
};
let lastConnectionTime = Date.now();
let connectionState = ConnectionState.DISCONNECTED;
export function setLogLevel(level) {
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;
    } else if (contexts.length > 0) {
      currentContextId = contexts[0].id;
    }
  } catch (error) {
--fm--end-1--fm--
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
async function loadContexts(selectedContextId) {
  try {
    const response = await fetch('/contexts');
    contexts = await response.json();
--fm--start-2--fm--
    if (selectedContextId && contexts.some(context => context.id === selectedContextId)) {
      currentContextId = selectedContextId;

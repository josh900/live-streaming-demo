import logger from './logger.js';
import { currentAvatar } from './agents-client-api.js';

let transitionCanvas;
let transitionCtx;
let isTransitioning = false;
let lastVideoStatus = null;
let isCurrentlyStreaming = false;
let currentUtterance = '';
let interimMessageAdded = false;

function initializeTransitionCanvas() {
  const videoWrapper = document.querySelector('#video-wrapper');
  const rect = videoWrapper.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height, 550);

  transitionCanvas = document.createElement('canvas');
  transitionCanvas.width = size;
  transitionCanvas.height = size;
  transitionCtx = transitionCanvas.getContext('2d');

  Object.assign(transitionCanvas.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    maxWidth: '550px',
    maxHeight: '550px',
    zIndex: '3',
    borderRadius: '13%',
    objectFit: 'cover',
  });

  videoWrapper.appendChild(transitionCanvas);

  window.addEventListener('resize', () => {
    const videoWrapper = document.querySelector('#video-wrapper');
    const rect = videoWrapper.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height, 550);

    transitionCanvas.width = size;
    transitionCanvas.height = size;
  });
}

function smoothTransition(toStreaming, duration = 250) {
  const idleVideoElement = document.getElementById('idle-video-element');
  const streamVideoElement = document.getElementById('stream-video-element');

  if (!idleVideoElement || !streamVideoElement) {
    logger.warn('Video elements not found for transition');
    return;
  }

  if (isTransitioning) {
    logger.debug('Transition already in progress, skipping');
    return;
  }

  // Don't transition if we're already in the desired state
  if ((toStreaming && isCurrentlyStreaming) || (!toStreaming && !isCurrentlyStreaming)) {
    logger.debug('Already in desired state, skipping transition');
    return;
  }

  isTransitioning = true;
  logger.debug(`Starting smooth transition to ${toStreaming ? 'streaming' : 'idle'} state`);

  let startTime = null;

  function animate(currentTime) {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    transitionCtx.clearRect(0, 0, transitionCanvas.width, transitionCanvas.height);

    // Draw the fading out video
    transitionCtx.globalAlpha = 1 - progress;
    transitionCtx.drawImage(
      toStreaming ? idleVideoElement : streamVideoElement,
      0,
      0,
      transitionCanvas.width,
      transitionCanvas.height,
    );

    // Draw the fading in video
    transitionCtx.globalAlpha = progress;
    transitionCtx.drawImage(
      toStreaming ? streamVideoElement : idleVideoElement,
      0,
      0,
      transitionCanvas.width,
      transitionCanvas.height,
    );

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Ensure final state is set correctly
      if (toStreaming) {
        streamVideoElement.style.display = 'block';
        idleVideoElement.style.display = 'none';
      } else {
        streamVideoElement.style.display = 'none';
        idleVideoElement.style.display = 'block';
      }
      isTransitioning = false;
      isCurrentlyStreaming = toStreaming;
      transitionCanvas.style.display = 'none';
      logger.debug('Smooth transition completed');
    }
  }

  // Show the transition canvas
  transitionCanvas.style.display = 'block';

  // Start the animation
  requestAnimationFrame(animate);
}

function getVideoElements() {
  const idle = document.getElementById('idle-video-element');
  const stream = document.getElementById('stream-video-element');

  if (!idle || !stream) {
    logger.warn('Video elements not found in the DOM');
  }

  return { idle, stream };
}

function onVideoStatusChange(videoIsPlaying, stream) {
  let status = videoIsPlaying ? 'streaming' : 'empty';

  if (status === lastVideoStatus) {
    logger.debug('Video status unchanged:', status);
    return;
  }

  logger.debug('Video status changing from', lastVideoStatus, 'to', status);

  const streamVideoElement = document.getElementById('stream-video-element');
  const idleVideoElement = document.getElementById('idle-video-element');

  if (!streamVideoElement || !idleVideoElement) {
    logger.error('Video elements not found');
    return;
  }

  if (status === 'streaming') {
    setStreamVideoElement(stream);
  } else {
    smoothTransition(false);
  }

  lastVideoStatus = status;

  const streamingStatusLabel = document.getElementById('streaming-status-label');
  if (streamingStatusLabel) {
    streamingStatusLabel.innerText = status;
    streamingStatusLabel.className = 'streamingState-' + status;
  }

  logger.debug('Video status changed:', status);
}

function setStreamVideoElement(stream) {
  const streamVideoElement = document.getElementById('stream-video-element');
  if (!streamVideoElement) {
    logger.error('Stream video element not found');
    return;
  }

  logger.debug('Setting stream video element');
  if (stream instanceof MediaStream) {
    streamVideoElement.srcObject = stream;
  } else {
    logger.warn('Invalid stream provided to setStreamVideoElement');
    return;
  }

  streamVideoElement.onloadedmetadata = () => {
    logger.debug('Stream video metadata loaded');
    streamVideoElement
      .play()
      .then(() => {
        logger.debug('Stream video playback started');
        smoothTransition(true);
      })
      .catch((e) => logger.error('Error playing stream video:', e));
  };

  streamVideoElement.oncanplay = () => {
    logger.debug('Stream video can play');
  };

  streamVideoElement.onerror = (e) => {
    logger.error('Error with stream video:', e);
  };
}

function playIdleVideo() {
  const { idle: idleVideoElement } = getVideoElements();
  if (!idleVideoElement) {
    logger.error('Idle video element not found');
    return;
  }

  if (!currentAvatar || !avatars[currentAvatar]) {
    logger.warn(`No avatar selected or avatar ${currentAvatar} not found. Using default idle video.`);
    idleVideoElement.src = 'path/to/default/idle/video.mp4'; // Replace with your default video path
  } else {
    idleVideoElement.src = avatars[currentAvatar].silentVideoUrl;
  }

  idleVideoElement.loop = true;

  idleVideoElement.onloadeddata = () => {
    logger.debug(`Idle video loaded successfully for ${currentAvatar || 'default'}`);
  };

  idleVideoElement.onerror = (e) => {
    logger.error(`Error loading idle video for ${currentAvatar || 'default'}:`, e);
  };

  idleVideoElement.play().catch((e) => logger.error('Error playing idle video:', e));
}

async function prepareForStreaming() {
  if (!streamId || !sessionId) {
    throw new Error('Stream ID or Session ID is missing. Cannot prepare for streaming.');
  }

  const streamVideoElement = document.getElementById('stream-video-element');
  const idleVideoElement = document.getElementById('idle-video-element');

  if (!streamVideoElement || !idleVideoElement) {
    throw new Error('Video elements not found');
  }

  // Reset video elements
  streamVideoElement.srcObject = null;
  streamVideoElement.src = '';
  streamVideoElement.style.display = 'none';

  idleVideoElement.style.display = 'block';
  idleVideoElement.play().catch((e) => logger.error('Error playing idle video:', e));

  logger.debug('Prepared for streaming');
}

export {
  initializeTransitionCanvas,
  smoothTransition,
  getVideoElements,
  onVideoStatusChange,
  setStreamVideoElement,
  playIdleVideo,
  prepareForStreaming,
};

import Logger from './logger.js';

const logger = new Logger('DEBUG');

export function initializeAvatar() {
  logger.log('Initializing avatar');
  const videoElement = document.getElementById('video-element');
  videoElement.src = 'emma_idle.mp4';
  videoElement.loop = true;
  videoElement.muted = true;
  videoElement.play().catch(error => logger.error('Error playing idle video:', error));
}

export function updateAvatarAppearance(imageUrl) {
  logger.log('Updating avatar appearance');
  // Implementation for updating avatar appearance
  // This would involve making API calls to D-ID to update the avatar's image
}
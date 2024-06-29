// config.js
import DID_API from './api.js';

export default {
  didApi: {
    key: DID_API.key,
    url: DID_API.url,
    service: DID_API.service
  },
  groqKey: DID_API.groqKey,
  deepgramKey: DID_API.deepgramKey,
  groqServerUrl: 'https://avatar.skoop.digital/chat',
  avatarImageUrl: 'https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg',
  idleVideoUrl: 'emma_idle.mp4',
};
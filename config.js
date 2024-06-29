// config.js

const isBrowser = typeof window !== 'undefined';
const globalConfig = isBrowser && window.appConfig ? window.appConfig : {};

export default {
  DID_API: {
    key: globalConfig.DID_API_KEY || 'your_default_did_api_key_here',
    url: 'https://api.d-id.com',
    service: 'talks'
  },
  GROQ_API_KEY: globalConfig.GROQ_API_KEY || 'your_default_groq_api_key_here',
  GROQ_API_URL: 'https://api.groq.com/openai/v1/chat/completions',
  DEEPGRAM_API_KEY: globalConfig.DEEPGRAM_API_KEY || 'your_default_deepgram_api_key_here',
  idleVideoUrl: 'emma_idle.mp4',
  avatarImageUrl: 'https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg',
  voiceId: 'en-US-JennyMultilingualV2Neural',
  avatarConfig: {
    size: {
      width: 512,
      height: 512
    },
    crop: {
      x: 0,
      y: 0,
      width: 1,
      height: 1
    }
  }
};
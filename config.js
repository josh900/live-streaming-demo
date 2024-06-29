// config.js

export default {
    DID_API: {
      key: process.env.DID_API_KEY,
      url: 'https://api.d-id.com',
      service: 'talks'
    },
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_API_URL: 'https://api.groq.com/openai/v1/chat/completions',
    DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
    idleVideoUrl: 'emma_idle.mp4',
    avatarImageUrl: 'https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg',
    voiceId: 'en-US-JennyMultilingualV2Neural'
  };

  // config.js

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Use a global object for configuration if in browser
const globalConfig = isBrowser && window.appConfig ? window.appConfig : {};

export default {
  DID_API: {
    key: globalConfig.DID_API_KEY || 'YWRtaW4xQHNrb29wLmRpZ2l0YWw:1FItMzMiqjms0QwfA9g8p',
    url: 'https://api.d-id.com',
    service: 'talks'
  },
  GROQ_API_KEY: globalConfig.GROQ_API_KEY || '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',
  GROQ_API_URL: 'https://api.groq.com/openai/v1/chat/completions',
  DEEPGRAM_API_KEY: globalConfig.DEEPGRAM_API_KEY || 'ab184815a3899aea7e3add69b9d5b7bc6894dc74',
  idleVideoUrl: 'emma_idle.mp4',
  avatarImageUrl: 'https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg',
  voiceId: 'en-US-JennyMultilingualV2Neural'
};
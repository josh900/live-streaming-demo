export default {
  key: process.env.DID_API_KEY,
  url: process.env.DID_API_URL || "https://api.d-id.com",
  service: process.env.DID_API_SERVICE || "talks",
  groqKey: process.env.GROQ_API_KEY,
  deepgramKey: process.env.DEEPGRAM_API_KEY,
  awsConfig: {
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    bucketName: process.env.AWS_S3_BUCKET_NAME
  }
};
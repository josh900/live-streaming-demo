// avatar-manager.js
import DID_API from './api.js';
import AWS from 'aws-sdk';
import logger from './logger.js';

const s3 = new AWS.S3({
  accessKeyId: DID_API.awsAccessKeyId,
  secretAccessKey: DID_API.awsSecretAccessKey,
  region: DID_API.awsRegion
});

export async function createOrUpdateAvatar(avatarData) {
  try {
    // Upload image to S3
    const imageKey = `avatars/${Date.now()}-${avatarData.imageName}`;
    await uploadToS3(avatarData.imageFile, imageKey);
    const imageUrl = `https://${DID_API.awsBucketName}.s3.amazonaws.com/${imageKey}`;

    // Generate silent video
    const silentVideoUrl = await generateSilentVideo(imageUrl, avatarData.voiceId);

    // Save avatar data
    const avatar = {
      name: avatarData.name,
      imageUrl: imageUrl,
      idleVideoUrl: silentVideoUrl,
      voice: avatarData.voiceId
    };

    // Update avatars in local storage
    const avatars = JSON.parse(localStorage.getItem('avatars') || '{}');
    avatars[avatar.name] = avatar;
    localStorage.setItem('avatars', JSON.stringify(avatars));

    return avatar;
  } catch (error) {
    logger.error('Error creating/updating avatar:', error);
    throw error;
  }
}

async function uploadToS3(file, key) {
  const params = {
    Bucket: DID_API.awsBucketName,
    Key: key,
    Body: file,
    ACL: 'public-read'
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.Location);
      }
    });
  });
}

async function generateSilentVideo(imageUrl, voiceId) {
  const response = await fetch(`${DID_API.url}/${DID_API.service}/talks`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: imageUrl,
      driver_url: "bank://lively/driver-06",
      script: {
        type: "text",
        ssml: true,
        input: "<break time=\"5000ms\"/>",
        provider: {
          type: "microsoft",
          voice_id: voiceId
        }
      },
      config: {
        fluent: true,
        stitch: true,
        pad_audio: 0
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate silent video: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result_url;
}

export function getAvatars() {
  return JSON.parse(localStorage.getItem('avatars') || '{}');
}

export function deleteAvatar(avatarName) {
  const avatars = getAvatars();
  delete avatars[avatarName];
  localStorage.setItem('avatars', JSON.stringify(avatars));
}
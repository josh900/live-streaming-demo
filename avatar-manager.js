import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import DID_API from './api.js';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const s3Client = new S3Client(DID_API.awsConfig);

export async function createOrUpdateAvatar(id, name, imageFile, voiceId) {
  try {
    let avatars = await getAvatars();
    let avatar = avatars.find(a => a.id === id);
    const isNewAvatar = !avatar;
    const isImageChanged = imageFile !== undefined;

    if (isImageChanged) {
      // Crop image to 512x512 px using mode "Fill"
      const croppedImageBuffer = await sharp(imageFile.buffer).resize(512, 512, { fit: 'cover' }).toBuffer();

      // Upload image to S3
      const imageKey = `avatars/${id}/image.png`;
      await uploadToS3(imageKey, croppedImageBuffer);
      const imageUrl = `https://${DID_API.awsConfig.bucketName}.s3.${DID_API.awsConfig.region}.amazonaws.com/${imageKey}`;

      if (isNewAvatar || avatar.voiceId !== voiceId) {
        // Generate silent video only if it's a new avatar or voice changed
        const silentVideoUrl = await generateSilentVideo(imageUrl, voiceId, id);
        avatar = { id, name, imageUrl, voiceId, silentVideoUrl };
      } else {
        avatar = { ...avatar, name, imageUrl, voiceId };
      }
    } else if (isNewAvatar || (avatar && avatar.voiceId !== voiceId)) {
      // If only voice changed or it's a new avatar without image
      const silentVideoUrl = await generateSilentVideo(avatar ? avatar.imageUrl : '', voiceId, id);
      avatar = { ...(avatar || {}), id, name, voiceId, silentVideoUrl };
    } else {
      // No changes, return existing avatar
      return avatar;
    }

    // Save avatar details
    await saveAvatarDetails(id, avatar);

    console.log(`Avatar created/updated successfully:`, JSON.stringify(avatar));
    return avatar;
  } catch (error) {
    console.error(`Error creating/updating avatar:`, error);
    throw error;
  }
}

async function saveAvatarDetails(id, avatar) {
  const avatarsFile = path.join(__dirname, 'avatars.json');
  let avatars = [];

  try {
    const data = await fs.readFile(avatarsFile, 'utf8');
    avatars = JSON.parse(data);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Error reading avatars file:', err);
      throw err;
    }
  }

  const existingIndex = avatars.findIndex(a => a.id === id);
  if (existingIndex !== -1) {
    avatars[existingIndex] = avatar;
  } else {
    avatars.push(avatar);
  }

  await fs.writeFile(avatarsFile, JSON.stringify(avatars, null, 2));
}



async function uploadToS3(key, file) {
  const command = new PutObjectCommand({
    Bucket: DID_API.awsConfig.bucketName,
    Key: key,
    Body: file,
    ContentType: 'image/png',
  });

  try {
    await s3Client.send(command);
  } catch (err) {
    console.error('Error uploading file to S3:', err);
    throw err;
  }
}

async function generateSilentVideo(imageUrl, voiceId, id) {
  console.log(`Generating silent video for image: ${imageUrl}, voice: ${voiceId}`);
  const response = await fetch(`${DID_API.url}/talks`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: imageUrl,
      driver_url: 'bank://lively/driver-06',
      script: {
        type: 'text',
        ssml: true,
        input: "<break time=\"4000ms\"/><break time=\"4000ms\"/><break time=\"4000ms\"/>",
        provider: {
          type: 'microsoft',
          voice_id: voiceId,
        },
      },
      config: {
        fluent: true,
        stitch: true,
        pad_audio: 0.2,
        auto_match: true,
        align_driver: true,
        normalization_factor: 0.1,
        align_expand_factor: 0.3,
        motion_factor: 0.55,
        result_format: 'mp4'
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate silent video: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.id) {
    throw new Error('Failed to get talk ID from response');
  }

  console.log(`Silent video generation started with ID: ${data.id}`);

  // Poll for the result
  let resultUrl;
  for (let i = 0; i < 30; i++) {
    // Try for 5 minutes (30 * 10 seconds)
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds

    const statusResponse = await fetch(`${DID_API.url}/talks/${data.id}`, {
      headers: {
        Authorization: `Basic ${DID_API.key}`,
      },
    });

    if (!statusResponse.ok) {
      throw new Error(`Failed to get talk status: ${statusResponse.statusText}`);
    }

    const statusData = await statusResponse.json();

    if (statusData.status === 'done') {
      resultUrl = statusData.result_url;
      break;
    } else if (statusData.status === 'error') {
      throw new Error(`Talk generation failed: ${statusData.error.message}`);
    }
  }

  if (!resultUrl) {
    throw new Error('Timed out waiting for silent video generation');
  }

  console.log(`Silent video generated successfully: ${resultUrl}`);

  // Download the video
  const videoResponse = await fetch(resultUrl);
  if (!videoResponse.ok) {
    throw new Error(`Failed to download video: ${videoResponse.statusText}`);
  }

  // Upload to S3
  const s3Key = `avatars/${id}/silent_video.mp4`;
  await uploadToS3(s3Key, await videoResponse.buffer());

  const s3Url = `https://${DID_API.awsConfig.bucketName}.s3.${DID_API.awsConfig.region}.amazonaws.com/${s3Key}`;
  console.log(`Silent video uploaded to S3: ${s3Url}`);

  return s3Url;
}


export async function getAvatars() {
  try {
    const data = await fs.readFile(path.join(__dirname, 'avatars.json'), 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    console.error('Error reading avatars file:', err);
    return [];
  }
}
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import DID_API from './api.js';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const s3Client = new S3Client(DID_API.awsConfig);


export async function createOrUpdateAvatar(name, imageFile, voiceId) {
    try {
        // Upload image to S3
        const imageKey = `avatars/${name}/image.png`;
        await uploadToS3(imageKey, imageFile);
        const imageUrl = `https://${DID_API.awsConfig.bucketName}.s3.${DID_API.awsConfig.region}.amazonaws.com/${imageKey}`;

        // Generate silent video
        const silentVideoUrl = await generateSilentVideo(imageUrl, voiceId);

        // Save avatar details
        const avatar = { name, imageUrl, voiceId, silentVideoUrl };
        await saveAvatarDetails(avatar);

        console.log(`Avatar created/updated successfully: ${JSON.stringify(avatar)}`);
        return avatar;
    } catch (error) {
        console.error('Error in createOrUpdateAvatar:', error);
        throw error;
    }
}




async function uploadToS3(key, file) {
    const command = new PutObjectCommand({
        Bucket: DID_API.awsConfig.bucketName,
        Key: key,
        Body: file,
        ContentType: 'image/png'
    });

    try {
        await s3Client.send(command);
    } catch (err) {
        console.error("Error uploading file to S3:", err);
        throw err;
    }
}

async function generateSilentVideo(imageUrl, voiceId) {
    try {
        console.log(`Generating silent video for image: ${imageUrl}, voice: ${voiceId}`);
        const response = await fetch(`${DID_API.url}/talks`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${DID_API.key}`,
                'Content-Type': 'application/json'
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
                    pad_audio: 0,
                    driver_expressions: {
                        expressions: [
                            {
                                start_frame: 0,
                                expression: "neutral",
                                intensity: 0
                            }
                        ],
                        transition_frames: 0
                    },
                    align_driver: true,
                    align_expand_factor: 0,
                    auto_match: true,
                    motion_factor: 0,
                    normalization_factor: 0,
                    sharpen: true,
                    stitch: true,
                    result_format: "mp4"
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to generate silent video: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`Silent video generated successfully: ${data.result_url}`);
        return data.result_url;
    } catch (error) {
        console.error('Error in generateSilentVideo:', error);
        throw error;
    }
}

async function saveAvatarDetails(avatar) {
    const avatarsFile = path.join(__dirname, 'avatars.json');
    let avatars = [];

    try {
        const data = await fs.readFile(avatarsFile, 'utf8');
        avatars = JSON.parse(data);
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error("Error reading avatars file:", err);
            throw err;
        }
    }

    if (!Array.isArray(avatars)) {
        avatars = [];
    }

    const existingIndex = avatars.findIndex(a => a.name === avatar.name);
    if (existingIndex !== -1) {
        avatars[existingIndex] = avatar;
    } else {
        avatars.push(avatar);
    }

    await fs.writeFile(avatarsFile, JSON.stringify(avatars, null, 2));
}

export async function getAvatars() {
    try {
        const data = await fs.readFile(path.join(__dirname, 'avatars.json'), 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading avatars file:", err);
        return [];
    }
}


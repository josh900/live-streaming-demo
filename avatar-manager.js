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
    // Upload image to S3
    const imageKey = `avatars/${name}/image.png`;
    await uploadToS3(imageKey, imageFile);
    const imageUrl = `https://${DID_API.awsConfig.bucketName}.s3.${DID_API.awsConfig.region}.amazonaws.com/${imageKey}`;

    // Generate silent video
    const silentVideoUrl = await generateSilentVideo(imageUrl, voiceId);

    // Save avatar details
    const avatar = { name, imageUrl, voiceId, silentVideoUrl };
    await saveAvatarDetails(avatar);

    return avatar;
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
        throw new Error(`Failed to generate silent video: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.id) {
        throw new Error('Failed to get talk ID from response');
    }

    console.log(`Silent video generation started with ID: ${data.id}`);

    // Poll for the result
    let resultUrl;
    for (let i = 0; i < 30; i++) { // Try for 5 minutes (30 * 10 seconds)
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

        const statusResponse = await fetch(`${DID_API.url}/talks/${data.id}`, {
            headers: {
                'Authorization': `Basic ${DID_API.key}`,
            }
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
    return resultUrl;
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
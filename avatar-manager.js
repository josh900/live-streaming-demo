import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import DID_API from './api.js';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';


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

async function uploadToS3(key, body) {
    const command = new PutObjectCommand({
        Bucket: DID_API.awsConfig.bucketName,
        Key: key,
        Body: body,
        ContentType: 'video/mp4'
    });

    try {
        await s3Client.send(command);
    } catch (err) {
        console.error("Error uploading file to S3:", err);
        throw err;
    }
}

async function generateSilentVideo(imageUrl, voiceId) {


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
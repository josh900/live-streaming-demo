import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { execSync } from 'child_process';
import { createReadStream } from 'fs';

// Initialize the S3 client
const s3Client = new S3Client({ region: "us-east-1" }); // Replace with your AWS region

// Path to store avatars locally (temporary storage)
const AVATARS_DIR = path.join(process.cwd(), 'avatars');

// Ensure the avatars directory exists
await fs.mkdir(AVATARS_DIR, { recursive: true });

// Function to upload a file to S3
async function uploadToS3(filePath, fileName, contentType) {
    const fileStream = createReadStream(filePath);
    
    const uploadParams = {
        Bucket: "skoop-general",
        Key: `avatars/${fileName}`,
        Body: fileStream,
        ContentType: contentType,
        Tagging: "cache-control=true"
    };

    try {
        const data = await s3Client.send(new PutObjectCommand(uploadParams));
        console.log("File uploaded successfully to S3:", data);
        return `https://skoop-general.s3.amazonaws.com/avatars/${fileName}`;
    } catch (err) {
        console.error("Error uploading file to S3:", err);
        throw err;
    }
}

// Function to process and save the avatar image
async function processImage(imageFile) {
    const fileName = `${Date.now()}_${imageFile.originalname}`;
    const filePath = path.join(AVATARS_DIR, fileName);

    await sharp(imageFile.buffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .toFile(filePath);

    return { fileName, filePath };
}

// Function to generate a silent video (placeholder implementation)
async function generateSilentVideo(imagePath, outputPath) {
    // This is a placeholder. You'll need to implement the actual video generation logic.
    // For example, using ffmpeg to create a short video from the image
    const command = `ffmpeg -loop 1 -i "${imagePath}" -c:v libx264 -t 3 -pix_fmt yuv420p -vf scale=800:800 "${outputPath}"`;
    execSync(command);
}

// Main function to create or update an avatar
export async function createOrUpdateAvatar(name, imageFile, voiceId) {
    try {
        // Process and save the image
        const { fileName: imageFileName, filePath: imageFilePath } = await processImage(imageFile);

        // Upload the image to S3
        const imageUrl = await uploadToS3(imageFilePath, imageFileName, 'image/jpeg');

        // Generate a silent video
        const videoFileName = `${name}_silent.mp4`;
        const videoFilePath = path.join(AVATARS_DIR, videoFileName);
        await generateSilentVideo(imageFilePath, videoFilePath);

        // Upload the video to S3
        const videoUrl = await uploadToS3(videoFilePath, videoFileName, 'video/mp4');

        // Create the avatar object
        const avatar = {
            name,
            imageUrl,
            silentVideoUrl: videoUrl,
            voiceId
        };

        // Save the avatar data (this is a placeholder - replace with your database logic)
        await saveAvatarToDatabase(avatar);

        // Clean up local files
        await fs.unlink(imageFilePath);
        await fs.unlink(videoFilePath);

        return avatar;
    } catch (error) {
        console.error('Error in createOrUpdateAvatar:', error);
        throw error;
    }
}

// Placeholder function to save avatar to database
async function saveAvatarToDatabase(avatar) {
    // Implement your database saving logic here
    console.log('Saving avatar to database:', avatar);
    // For now, we'll just save to a local JSON file
    const avatarsFilePath = path.join(AVATARS_DIR, 'avatars.json');
    let avatars = {};
    try {
        const data = await fs.readFile(avatarsFilePath, 'utf8');
        avatars = JSON.parse(data);
    } catch (error) {
        // File doesn't exist or is invalid, start with an empty object
    }
    avatars[avatar.name] = avatar;
    await fs.writeFile(avatarsFilePath, JSON.stringify(avatars, null, 2));
}

// Function to get all avatars
export async function getAvatars() {
    const avatarsFilePath = path.join(AVATARS_DIR, 'avatars.json');
    try {
        const data = await fs.readFile(avatarsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading avatars file:', error);
        return {};
    }
}
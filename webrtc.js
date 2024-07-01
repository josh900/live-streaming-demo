import Logger from './logger.js';
import { handleError } from './errorHandler.js';

const logger = new Logger('INFO');

export async function initializeWebRTC(DID_API) {
    logger.log('Initializing WebRTC');
    try {
        const sessionResponse = await fetch(`${DID_API.url}/${DID_API.service}/streams`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${DID_API.key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg',
                output_resolution: 720,
                stream_warmup: true,
                compatibility_mode: 'auto'
            }),
        });

        if (!sessionResponse.ok) {
            throw new Error(`HTTP error! status: ${sessionResponse.status}`);
        }

        const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
        logger.log('WebRTC session created:', { newStreamId, newSessionId });
        return { newStreamId, newSessionId, offer, iceServers };
    } catch (error) {
        handleError('Error initializing WebRTC', error);
        throw error;
    }
}

export async function createPeerConnection(offer, iceServers) {
    logger.log('Creating peer connection');
    const peerConnection = new RTCPeerConnection({
        iceServers: Array.isArray(iceServers) ? iceServers : [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
        ]
    });

    peerConnection.addEventListener('icegatheringstatechange', () => {
        logger.log('ICE gathering state:', peerConnection.iceGatheringState);
    });

    peerConnection.addEventListener('iceconnectionstatechange', () => {
        logger.log('ICE connection state:', peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState === 'failed') {
            handleError('ICE connection failed', new Error('ICE connection failed'));
        }
    });

    peerConnection.addEventListener('connectionstatechange', () => {
        logger.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'failed') {
            handleError('Connection failed', new Error('Connection failed'));
        }
    });

    peerConnection.addEventListener('signalingstatechange', () => {
        logger.log('Signaling state:', peerConnection.signalingState);
    });

    peerConnection.addEventListener('icecandidateerror', (event) => {
        handleError('ICE candidate error', event);
    });

    peerConnection.addEventListener('track', (event) => {
        logger.log('Track received:', event.track.kind);
        if (event.track.kind === 'video') {
            const videoElement = document.getElementById('video-element');
            if (videoElement) {
                videoElement.srcObject = event.streams[0];
            }
        }
    });

    try {
        logger.log('Setting remote description');
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        logger.log('Remote description set successfully');

        logger.log('Creating answer');
        const answer = await peerConnection.createAnswer();
        logger.log('Answer created successfully');

        logger.log('Setting local description');
        await peerConnection.setLocalDescription(answer);
        logger.log('Local description set successfully');

        return peerConnection;
    } catch (error) {
        handleError('Error creating peer connection', error);
        throw error;
    }
}

export function addIceCandidate(peerConnection, candidate) {
    if (candidate) {
        logger.log('Adding ICE candidate');
        return peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
}

export function closePeerConnection(peerConnection) {
    if (peerConnection) {
        logger.log('Closing peer connection');
        peerConnection.close();
    }
}
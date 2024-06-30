import Logger from './logger.js';

const logger = new Logger('DEBUG');

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
                stream_warmup: true
            }),
        });

        if (!sessionResponse.ok) {
            throw new Error(`HTTP error! status: ${sessionResponse.status}`);
        }

        const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
        logger.log('WebRTC session created:', { newStreamId, newSessionId, iceServers });
        return { newStreamId, newSessionId, offer, iceServers };
    } catch (error) {
        logger.error('Error initializing WebRTC:', error);
        throw error;
    }
}

export async function createPeerConnection(offer, iceServers) {
    logger.log('Creating peer connection');
    const peerConnection = new RTCPeerConnection({
        iceServers: [
            ...iceServers,
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
        ],
        iceTransportPolicy: 'all',
        iceCandidatePoolSize: 10,
    });

    peerConnection.addEventListener('icegatheringstatechange', () => {
        logger.log('ICE gathering state:', peerConnection.iceGatheringState);
    });

    peerConnection.addEventListener('iceconnectionstatechange', () => {
        logger.log('ICE connection state:', peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState === 'failed') {
            logger.error('ICE connection failed. Attempting to restart ICE.');
            peerConnection.restartIce();
        }
    });

    peerConnection.addEventListener('connectionstatechange', () => {
        logger.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'failed') {
            logger.error('Connection failed. Attempting to recreate peer connection.');
            recreatePeerConnection(offer, iceServers);
        }
    });

    peerConnection.addEventListener('signalingstatechange', () => {
        logger.log('Signaling state:', peerConnection.signalingState);
    });

    peerConnection.addEventListener('icecandidateerror', (event) => {
        logger.error('ICE candidate error:', event);
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
        logger.error('Error creating peer connection:', error);
        throw error;
    }
}

async function recreatePeerConnection(offer, iceServers) {
    logger.log('Recreating peer connection');
    if (peerConnection) {
        peerConnection.close();
    }
    peerConnection = await createPeerConnection(offer, iceServers);
}

export function addIceCandidate(peerConnection, candidate) {
    if (candidate) {
        logger.log('Adding ICE candidate');
        return peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
            .catch(error => logger.error('Error adding ICE candidate:', error));
    }
}

export function closePeerConnection(peerConnection) {
    if (peerConnection) {
        logger.log('Closing peer connection');
        peerConnection.close();
    }
}

export async function handleNegotiationNeeded(peerConnection, DID_API, streamId, sessionId) {
    logger.log('Handling negotiation needed event');
    try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        logger.log('New offer created and set as local description');

        // Send the new offer to the D-ID API
        const response = await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${DID_API.key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                answer: peerConnection.localDescription,
                session_id: sessionId,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to send new offer to D-ID API: ${response.status}`);
        }

        logger.log('New offer sent to D-ID API successfully');
    } catch (error) {
        logger.error('Error during negotiation:', error);
    }
}

export async function setupMediaStream(peerConnection) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
        logger.log('Local media stream added to peer connection');
    } catch (error) {
        logger.error('Error setting up media stream:', error);
        throw error;
    }
}
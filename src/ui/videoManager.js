let idleVideoElement;
let streamVideoElement;

function initializeVideoElements() {
    idleVideoElement = document.getElementById('idle-video-element');
    streamVideoElement = document.getElementById('stream-video-element');

    if (idleVideoElement) idleVideoElement.setAttribute('playsinline', '');
    if (streamVideoElement) streamVideoElement.setAttribute('playsinline', '');
}

function playIdleVideo() {
    if (!idleVideoElement) {
        console.error('Idle video element not found');
        return;
    }

    idleVideoElement.style.display = 'block';
    idleVideoElement.play().catch((e) => console.error('Error playing idle video:', e));
}

function setStreamVideo(stream) {
    if (!streamVideoElement) {
        console.error('Stream video element not found');
        return;
    }

    streamVideoElement.srcObject = stream;
    streamVideoElement.style.display = 'block';
    streamVideoElement.play().catch((e) => console.error('Error playing stream video:', e));
}

function hideStreamVideo() {
    if (streamVideoElement) {
        streamVideoElement.style.display = 'none';
        streamVideoElement.srcObject = null;
    }
}

export { initializeVideoElements, playIdleVideo, setStreamVideo, hideStreamVideo };
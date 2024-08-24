import { initializePersistentStream, startRecording, stopRecording, sendChatToGroq } from './agents-client-api.js';
import { getDocument, GlobalWorkerOptions } from '/pdfjs/build/pdf.mjs';
import { PDFViewerApplication } from '/pdfjs/web/viewer.mjs';


let pdfDoc = null;
let pageNum = 1;
let avatarIntroduced = false;
const avatarPageNum = 3; // Set this to the page number where the avatar should appear

// PDF.js initialization
GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.mjs';

async function loadPDF(url) {
    try {
        pdfDoc = await getDocument(url).promise;
        renderPage(pageNum);
    } catch (error) {
        console.error('Error loading PDF:', error);
    }
}
async function renderPage(num) {
    try {
        const page = await pdfDoc.getPage(num);
        const scale = 1.5;
        const viewport = page.getViewport({ scale: scale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };

        await page.render(renderContext);

        document.getElementById('viewer').innerHTML = '';
        document.getElementById('viewer').appendChild(canvas);

        if (num === avatarPageNum && !avatarIntroduced) {
            introduceAvatar();
        }
    } catch (error) {
        console.error('Error rendering page:', error);
    }
}


async function introduceAvatar() {
    avatarIntroduced = true;
    const avatarContainer = document.getElementById('avatarContainer');
    avatarContainer.style.display = 'block';
    
    // Initialize the avatar stream
    try {
        await initializePersistentStream();
        document.getElementById('push-to-talk-button').style.display = 'block';
    } catch (error) {
        console.error('Error initializing avatar stream:', error);
    }
}


function setupCustomControls() {
    const nextButton = document.getElementById('next');
    const prevButton = document.getElementById('previous');

    nextButton.addEventListener('click', (e) => {
        if (pageNum === avatarPageNum && !avatarIntroduced) {
            e.preventDefault();
            introduceAvatar();
        } else if (pageNum < pdfDoc.numPages) {
            pageNum++;
            renderPage(pageNum);
        }
    });

    prevButton.addEventListener('click', () => {
        if (pageNum > 1) {
            pageNum--;
            renderPage(pageNum);
        }
    });
}

function morphAvatarTransition() {
    const avatarContainer = document.getElementById('avatarContainer');
    const idleVideo = document.getElementById('idle-video-element');
    
    // Start with the static image
    idleVideo.style.opacity = '0';
    avatarContainer.style.backgroundImage = 'url(image.png)';
    avatarContainer.style.backgroundSize = 'cover';
    
    // Transition to the video
    setTimeout(() => {
        avatarContainer.style.backgroundImage = 'none';
        idleVideo.style.opacity = '1';
        avatarContainer.classList.add('introduced');
    }, 1000);
}

// Event listeners
document.getElementById('push-to-talk-button').addEventListener('mousedown', startRecording);
document.getElementById('push-to-talk-button').addEventListener('mouseup', stopRecording);
document.getElementById('push-to-talk-button').addEventListener('mouseleave', stopRecording);

// Initialize the presentation
async function initPresentation() {
    await loadPDF('presentation.pdf');
    setupCustomControls();
    PDFViewerApplication.initializedPromise.then(() => {
        // Any additional setup after PDF.js is fully initialized
    });
}


// Call this function after the PDF is loaded
loadPDF('presentation.pdf').then(setupCustomControls);

initPresentation();


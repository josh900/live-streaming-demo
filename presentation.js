import { initializePersistentStream, startRecording, stopRecording, sendChatToGroq } from './agents-client-api.js';
import { getPresentationAvatar } from './avatar-manager.js';

let pdfDoc = null;
let pageNum = 1;
let avatarIntroduced = false;
const avatarPageNum = 3; // Set this to the page number where the avatar should appear

// PDF.js initialization
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.js';

function loadPDF(url) {
    pdfjsLib.getDocument(url).promise.then(function(pdf) {
        pdfDoc = pdf;
        renderPage(pageNum);
    });
}

function renderPage(num) {
    pdfDoc.getPage(num).then(function(page) {
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

        page.render(renderContext);

        document.getElementById('viewer').innerHTML = '';
        document.getElementById('viewer').appendChild(canvas);

        if (num === avatarPageNum && !avatarIntroduced) {
            introduceAvatar();
        }
    });
}

function morphAvatarTransition() {
    const avatarContainer = document.getElementById('avatarContainer');
    const idleVideo = document.getElementById('idle-video-element');
    
    // Start with the static image
    idleVideo.style.opacity = '0';
    avatarContainer.style.backgroundImage = 'url(/path/to/static/avatar/image.png)';
    avatarContainer.style.backgroundSize = 'cover';
    
    // Transition to the video
    setTimeout(() => {
        avatarContainer.style.backgroundImage = 'none';
        idleVideo.style.opacity = '1';
        avatarContainer.classList.add('introduced');
    }, 1000);
}


async function introduceAvatar() {
    avatarIntroduced = true;
    const avatarContainer = document.getElementById('avatarContainer');
    avatarContainer.style.display = 'block';
    
    const presentationAvatar = await getPresentationAvatar();
    
    // Initialize the avatar stream with the presentation avatar
    await initializePersistentStream(presentationAvatar.id, 'presentation-context');
    
    document.getElementById('push-to-talk-button').style.display = 'block';
    document.getElementById('idle-video-element').src = presentationAvatar.silentVideoUrl;
    
    // Call the morphAvatarTransition function
    morphAvatarTransition();
}


// Event listeners
document.getElementById('push-to-talk-button').addEventListener('mousedown', startRecording);
document.getElementById('push-to-talk-button').addEventListener('mouseup', stopRecording);
document.getElementById('push-to-talk-button').addEventListener('mouseleave', stopRecording);



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


// Call this function after the PDF is loaded
loadPDF('presentation.pdf').then(setupCustomControls);

import { initializePersistentStream, startRecording, stopRecording, sendChatToGroq } from './agents-client-api.js';

let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.5;
let canvas = null;
let ctx = null;
let avatarIntroduced = false;
const avatarPageNum = 3; // Set this to the page number where the avatar should appear

// PDF.js initialization
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.js';

/**
 * Get page info from document, resize canvas accordingly, and render page.
 * @param num Page number.
 */
function renderPage(num) {
  pageRendering = true;
  // Using promise to fetch the page
  pdfDoc.getPage(num).then(function(page) {
    var viewport = page.getViewport({scale: scale});
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    var renderTask = page.render(renderContext);

    // Wait for rendering to finish
    renderTask.promise.then(function() {
      pageRendering = false;
      if (pageNumPending !== null) {
        // New page rendering is pending
        renderPage(pageNumPending);
        pageNumPending = null;
      }
      if (num === avatarPageNum && !avatarIntroduced) {
        introduceAvatar();
      }
    });
  });

  // Update page counters
  document.getElementById('page_num').textContent = num;
}

/**
 * If another page rendering in progress, waits until the rendering is
 * finished. Otherwise, executes rendering immediately.
 */
function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    renderPage(num);
  }
}

/**
 * Displays previous page.
 */
function onPrevPage() {
  if (pageNum <= 1) {
    return;
  }
  pageNum--;
  queueRenderPage(pageNum);
}

/**
 * Displays next page.
 */
function onNextPage() {
  if (pageNum >= pdfDoc.numPages) {
    return;
  }
  pageNum++;
  queueRenderPage(pageNum);
}

/**
 * Asynchronously downloads PDF.
 */
pdfjsLib.getDocument('presentation.pdf').promise.then(function(pdfDoc_) {
  pdfDoc = pdfDoc_;
  document.getElementById('page_count').textContent = pdfDoc.numPages;

  // Initial/first page rendering
  renderPage(pageNum);
});

async function introduceAvatar() {
  avatarIntroduced = true;
  const avatarContainer = document.getElementById('avatarContainer');
  avatarContainer.style.display = 'block';
  
  try {
    await initializePersistentStream();
    document.getElementById('push-to-talk-button').style.display = 'block';
    morphAvatarTransition();
  } catch (error) {
    console.error('Error initializing avatar stream:', error);
  }
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
document.getElementById('prev').addEventListener('click', onPrevPage);
document.getElementById('next').addEventListener('click', onNextPage);
document.getElementById('push-to-talk-button').addEventListener('mousedown', startRecording);
document.getElementById('push-to-talk-button').addEventListener('mouseup', stopRecording);
document.getElementById('push-to-talk-button').addEventListener('mouseleave', stopRecording);

// Initialize the presentation
function initPresentation() {
  canvas = document.getElementById('pdf-render');
  ctx = canvas.getContext('2d');
}

// Call initPresentation when the document is loaded
document.addEventListener('DOMContentLoaded', initPresentation);
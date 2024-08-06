function showLoadingSymbol() {
    const loadingSymbol = document.createElement('div');
    loadingSymbol.id = 'loading-symbol';
    loadingSymbol.innerHTML = 'Connecting...';
    loadingSymbol.style.position = 'absolute';
    loadingSymbol.style.top = '50%';
    loadingSymbol.style.left = '50%';
    loadingSymbol.style.transform = 'translate(-50%, -50%)';
    loadingSymbol.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    loadingSymbol.style.color = 'white';
    loadingSymbol.style.padding = '10px';
    loadingSymbol.style.borderRadius = '5px';
    loadingSymbol.style.zIndex = '9999';
    document.body.appendChild(loadingSymbol);
  }
  
  function hideLoadingSymbol() {
    const loadingSymbol = document.getElementById('loading-symbol');
    if (loadingSymbol) {
      document.body.removeChild(loadingSymbol);
    }
  }
  
  function showErrorMessage(message) {
    const errorMessage = document.createElement('div');
    errorMessage.innerHTML = message;
    errorMessage.style.color = 'red';
    errorMessage.style.marginBottom = '10px';
    document.body.appendChild(errorMessage);
  
    const destroyButton = document.getElementById('destroy-button');
    const connectButton = document.getElementById('connect-button');
  
    if (destroyButton) destroyButton.style.display = 'inline-block';
    if (connectButton) connectButton.style.display = 'inline-block';
  }
  
  function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    toast.style.zIndex = '1000';
  
    document.body.appendChild(toast);
  
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease-out';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 500);
    }, duration);
  }
  
  function updateTranscript(text, isFinal) {
    const msgHistory = document.getElementById('msgHistory');
    let interimSpan = msgHistory.querySelector('span[data-interim]');
  
    if (isFinal) {
      if (interimSpan) {
        interimSpan.remove();
      }
      msgHistory.innerHTML += `<span><u>User:</u> ${text}</span><br>`;
      console.debug('Final transcript added to chat history:', text);
    } else {
      if (text.trim()) {
        if (!interimSpan) {
          msgHistory.innerHTML += `<span data-interim style='opacity:0.5'><u>User (interim):</u> ${text}</span><br>`;
        } else {
          interimSpan.innerHTML = `<u>User (interim):</u> ${text}`;
        }
      }
    }
    msgHistory.scrollTop = msgHistory.scrollHeight;
  }
  
  function updateAssistantReply(text) {
    document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${text}</span><br>`;
  }
  
  function toggleSimpleMode() {
    const content = document.getElementById('content');
    const videoWrapper = document.getElementById('video-wrapper');
    const simpleModeButton = document.getElementById('simple-mode-button');
    const header = document.querySelector('.header');
    const autoSpeakToggle = document.getElementById('auto-speak-toggle');
    const startButton = document.getElementById('start-button');
  
    if (content.style.display !== 'none') {
      // Entering simple mode
      content.style.display = 'none';
      document.body.appendChild(videoWrapper);
      videoWrapper.style.position = 'fixed';
      videoWrapper.style.top = '50%';
      videoWrapper.style.left = '50%';
      videoWrapper.style.transform = 'translate(-50%, -50%)';
      simpleModeButton.textContent = 'Exit';
      simpleModeButton.classList.add('simple-mode');
      header.style.position = 'fixed';
      header.style.width = '100%';
      header.style.zIndex = '1000';
  
      // Turn on auto-speak if it's not already on
      if (autoSpeakToggle.textContent.includes('Off')) {
        autoSpeakToggle.click();
      }
  
      // Start recording if it's not already recording
      if (startButton.textContent === 'Speak') {
        startButton.click();
      }
    } else {
      // Exiting simple mode
      content.style.display = 'flex';
      const leftColumn = document.getElementById('left-column');
      leftColumn.appendChild(videoWrapper);
      videoWrapper.style.position = 'relative';
      videoWrapper.style.top = 'auto';
      videoWrapper.style.left = 'auto';
      videoWrapper.style.transform = 'none';
      simpleModeButton.textContent = 'Simple Mode';
      simpleModeButton.classList.remove('simple-mode');
      header.style.position = 'static';
      header.style.width = 'auto';
  
      // Turn off auto-speak
      if (autoSpeakToggle.textContent.includes('On')) {
        autoSpeakToggle.click();
      }
  
      // Stop recording
      if (startButton.textContent === 'Stop') {
        startButton.click();
      }
    }
  }
  
  export { showLoadingSymbol, hideLoadingSymbol, showErrorMessage, showToast, updateTranscript, updateAssistantReply, toggleSimpleMode };
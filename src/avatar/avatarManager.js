import { fetchWithRetries } from '../utils/helpers.js';

let avatars = {};
let currentAvatar = '';

async function loadAvatars() {
  try {
    const response = await fetch('/avatars');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    avatars = await response.json();
    console.debug('Avatars loaded:', avatars);
  } catch (error) {
    console.error('Error loading avatars:', error);
    throw error;
  }
}

function populateAvatarSelect() {
  const avatarSelect = document.getElementById('avatar-select');
  avatarSelect.innerHTML = '';

  const createNewOption = document.createElement('option');
  createNewOption.value = 'create-new';
  createNewOption.textContent = 'Create New Avatar';
  avatarSelect.appendChild(createNewOption);

  for (const [key, value] of Object.entries(avatars)) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = value.name;
    avatarSelect.appendChild(option);
  }

  if (Object.keys(avatars).length > 0) {
    currentAvatar = Object.keys(avatars)[0];
    avatarSelect.value = currentAvatar;
  }
}

async function handleAvatarChange() {
  currentAvatar = document.getElementById('avatar-select').value;
  if (currentAvatar === 'create-new') {
    openAvatarModal();
    return;
  }

  const idleVideoElement = document.getElementById('idle-video-element');
  if (idleVideoElement) {
    idleVideoElement.src = avatars[currentAvatar].silentVideoUrl;
    try {
      await idleVideoElement.load();
      console.debug(`Idle video loaded for ${currentAvatar}`);
    } catch (error) {
      console.error(`Error loading idle video for ${currentAvatar}:`, error);
    }
  }

  const streamVideoElement = document.getElementById('stream-video-element');
  if (streamVideoElement) {
    streamVideoElement.srcObject = null;
  }

  // Emit an event to notify that the avatar has changed
  window.dispatchEvent(new CustomEvent('avatarChanged', { detail: currentAvatar }));
}

function openAvatarModal(avatarName = null) {
  const modal = document.getElementById('avatar-modal');
  const nameInput = document.getElementById('avatar-name');
  const voiceInput = document.getElementById('avatar-voice');
  const imagePreview = document.getElementById('avatar-image-preview');
  const saveButton = document.getElementById('save-avatar-button');

  if (avatarName && avatars[avatarName]) {
    nameInput.value = avatars[avatarName].name;
    voiceInput.value = avatars[avatarName].voiceId;
    imagePreview.src = avatars[avatarName].imageUrl;
    saveButton.textContent = 'Update Avatar';
  } else {
    nameInput.value = '';
    voiceInput.value = 'en-US-GuyNeural';
    imagePreview.src = '';
    saveButton.textContent = 'Create Avatar';
  }

  modal.style.display = 'block';
}

function closeAvatarModal() {
  const modal = document.getElementById('avatar-modal');
  modal.style.display = 'none';
}

async function saveAvatar() {
  const name = document.getElementById('avatar-name').value;
  const voiceId = document.getElementById('avatar-voice').value || 'en-US-GuyNeural';
  const imageFile = document.getElementById('avatar-image').files[0];

  if (!name) {
    throw new Error('Please fill in the avatar name.');
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('voiceId', voiceId);
  if (imageFile) {
    formData.append('image', imageFile);
  }

  try {
    const response = await fetch('/avatar', {
      method: 'POST',
      body: formData,
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const events = chunk.split('\n\n');

      for (const event of events) {
        if (event.startsWith('data: ')) {
          const data = JSON.parse(event.slice(6));
          if (data.status === 'completed') {
            avatars[name] = data.avatar;
            populateAvatarSelect();
            closeAvatarModal();
            return data.avatar;
          } else if (data.status === 'error') {
            throw new Error(data.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error saving avatar:', error);
    throw error;
  }
}

export { loadAvatars, populateAvatarSelect, handleAvatarChange, openAvatarModal, closeAvatarModal, saveAvatar, avatars, currentAvatar };
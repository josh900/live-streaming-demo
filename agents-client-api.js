'use strict';
import DID_API from './api.js';
import logger from './logger.js';


function togglePushToTalk() {
  isPushToTalkEnabled = !isPushToTalkEnabled;
  const pushToTalkToggle = document.getElementById('push-to-talk-toggle');
  const pushToTalkButton = document.getElementById('push-to-talk-button');
  


function handlePushToTalk(event) {
  if (event.type === 'mousedown' || event.type === 'touchstart') {
    startPushToTalkRecording();
  } else if (event.type === 'mouseup' || event.type === 'touchend') {
    stopPushToTalkRecording();
    stopPushToTalkRecording();
  }
  }
}
}
  pushToTalkToggle.textContent = `Push to Talk: ${isPushToTalkEnabled ? 'On' : 'Off'}`;
  pushToTalkToggle.textContent = `Push to Talk: ${isPushToTalkEnabled ? 'On' : 'Off'}`;
  pushToTalkButton.disabled = !isPushToTalkEnabled;
  pushToTalkButton.disabled = !isPushToTalkEnabled;
  
  
  if (isPushToTalkEnabled) {
  if (isPushToTalkEnabled) {
    initializeRecording();
    initializeRecording();
  } else {
  } else {
    stopRecording();
    stopRecording();
  }
  }
}
}
const { createClient, LiveTranscriptionEvents } = deepgram;
const { createClient, LiveTranscriptionEvents } = deepgram;




const deepgramClient = createClient(DID_API.deepgramKey);
const deepgramClient = createClient(DID_API.deepgramKey);
const deepgramClient = createClient(DID_API.deepgramKey);
const deepgramClient = createClient(DID_API.deepgramKey);




const RTCPeerConnection = (
const RTCPeerConnection = (
const RTCPeerConnection = (
const RTCPeerConnection = (
  window.RTCPeerConnection ||
  window.RTCPeerConnection ||
  window.RTCPeerConnection ||
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
  window.mozRTCPeerConnection
  window.mozRTCPeerConnection
  window.mozRTCPeerConnection
).bind(window);
).bind(window);
).bind(window);
).bind(window);




let peerConnection;
let peerConnection;
let peerConnection;
let peerConnection;
let pcDataChannel;
let pcDataChannel;
let pcDataChannel;
let pcDataChannel;
let streamId;
let streamId;
let streamId;
let streamId;
let sessionId;
let sessionId;
let sessionId;
let sessionId;
let sessionClientAnswer;
let sessionClientAnswer;
let sessionClientAnswer;
let sessionClientAnswer;
let statsIntervalId;
let statsIntervalId;
let statsIntervalId;
let statsIntervalId;
let videoIsPlaying;
let videoIsPlaying;
let videoIsPlaying;
let videoIsPlaying;
let lastBytesReceived;
let lastBytesReceived;
let lastBytesReceived;
let lastBytesReceived;
let chatHistory = [];
let chatHistory = [];
let chatHistory = [];
let chatHistory = [];
let inactivityTimeout;
let inactivityTimeout;
let inactivityTimeout;
let inactivityTimeout;
let keepAliveInterval;
let keepAliveInterval;
let keepAliveInterval;
let keepAliveInterval;
let socket;
let socket;
let socket;
let socket;
let isInitializing = false;
let isInitializing = false;
let isInitializing = false;
let isInitializing = false;
let audioContext;
let audioContext;
let audioContext;
let audioContext;
let streamVideoElement;
let streamVideoElement;
let streamVideoElement;
let streamVideoElement;
let idleVideoElement;
let idleVideoElement;
let idleVideoElement;
let idleVideoElement;
let deepgramConnection;
let deepgramConnection;
let deepgramConnection;
let deepgramConnection;
let isRecording = false;
let isRecording = false;
let isRecording = false;
let isRecording = false;
let audioWorkletNode;
let audioWorkletNode;
let audioWorkletNode;
let audioWorkletNode;
let currentUtterance = '';
let currentUtterance = '';
let currentUtterance = '';
let currentUtterance = '';
let interimMessageAdded = false;
let interimMessageAdded = false;
let interimMessageAdded = false;
let interimMessageAdded = false;
let autoSpeakMode = true;
let autoSpeakMode = true;
let autoSpeakMode = true;
let autoSpeakMode = true;
let transitionCanvas;
let transitionCanvas;
let transitionCanvas;
let transitionCanvas;
let transitionCtx;
let transitionCtx;
let transitionCtx;
let transitionCtx;
let isDebugMode = false;
let isDebugMode = false;
let isDebugMode = false;
let isDebugMode = false;
let isTransitioning = false;
let isTransitioning = false;
let isTransitioning = false;
let isTransitioning = false;
let lastVideoStatus = null;
let lastVideoStatus = null;
let lastVideoStatus = null;
let lastVideoStatus = null;
let isCurrentlyStreaming = false;
let isCurrentlyStreaming = false;
let isCurrentlyStreaming = false;
let isCurrentlyStreaming = false;
let reconnectAttempts = 10;
let reconnectAttempts = 10;
let reconnectAttempts = 10;
let reconnectAttempts = 10;
let persistentStreamId = null;
let persistentStreamId = null;
let persistentStreamId = null;
let persistentStreamId = null;
let persistentSessionId = null;
let persistentSessionId = null;
let persistentSessionId = null;
let persistentSessionId = null;
let isPersistentStreamActive = false;
let isPersistentStreamActive = false;
let isPersistentStreamActive = false;
let isPersistentStreamActive = false;
const API_RATE_LIMIT = 40; // Maximum number of calls per minute
const API_RATE_LIMIT = 40; // Maximum number of calls per minute
const API_RATE_LIMIT = 40; // Maximum number of calls per minute
const API_RATE_LIMIT = 40; // Maximum number of calls per minute
const API_CALL_INTERVAL = 30000 / API_RATE_LIMIT; // Minimum time between API calls in milliseconds
const API_CALL_INTERVAL = 30000 / API_RATE_LIMIT; // Minimum time between API calls in milliseconds
const API_CALL_INTERVAL = 30000 / API_RATE_LIMIT; // Minimum time between API calls in milliseconds
const API_CALL_INTERVAL = 30000 / API_RATE_LIMIT; // Minimum time between API calls in milliseconds
let lastApiCallTime = 0;
let lastApiCallTime = 0;
let lastApiCallTime = 0;
let lastApiCallTime = 0;
const maxRetryCount = 10;
const maxRetryCount = 10;
const maxRetryCount = 10;
const maxRetryCount = 10;
const maxDelaySec = 100;
const maxDelaySec = 100;
const maxDelaySec = 100;
const maxDelaySec = 100;
const RECONNECTION_INTERVAL = 100000; // 25 seconds for testing, adjust as needed
const RECONNECTION_INTERVAL = 100000; // 25 seconds for testing, adjust as needed
const RECONNECTION_INTERVAL = 100000; // 25 seconds for testing, adjust as needed
const RECONNECTION_INTERVAL = 100000; // 25 seconds for testing, adjust as needed
let isAvatarSpeaking = false;
let isAvatarSpeaking = false;
let isAvatarSpeaking = false;
let isAvatarSpeaking = false;
const MAX_RECONNECT_ATTEMPTS = 10;
const MAX_RECONNECT_ATTEMPTS = 10;
const MAX_RECONNECT_ATTEMPTS = 10;
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 2000; // 1 second
const INITIAL_RECONNECT_DELAY = 2000; // 1 second
const INITIAL_RECONNECT_DELAY = 2000; // 1 second
const INITIAL_RECONNECT_DELAY = 2000; // 1 second
const MAX_RECONNECT_DELAY = 90000; // 30 seconds
const MAX_RECONNECT_DELAY = 90000; // 30 seconds
const MAX_RECONNECT_DELAY = 90000; // 30 seconds
const MAX_RECONNECT_DELAY = 90000; // 30 seconds
let autoSpeakInProgress = false;
let autoSpeakInProgress = false;
let autoSpeakInProgress = false;
let autoSpeakInProgress = false;




let isPushToTalkEnabled = false;
let isPushToTalkEnabled = false;
let isPushToTalkEnabled = false;
let isPushToTalkEnabled = false;
let isPushToTalkActive = false;
let isPushToTalkActive = false;
let isPushToTalkActive = false;
let isPushToTalkActive = false;




const ConnectionState = {
const ConnectionState = {
const ConnectionState = {
const ConnectionState = {
  DISCONNECTED: 'disconnected',
  DISCONNECTED: 'disconnected',
  DISCONNECTED: 'disconnected',
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTING: 'connecting',
  CONNECTING: 'connecting',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  CONNECTED: 'connected',
  CONNECTED: 'connected',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  RECONNECTING: 'reconnecting',
  RECONNECTING: 'reconnecting',
  RECONNECTING: 'reconnecting',
};
};
};
};




let lastConnectionTime = Date.now();
let lastConnectionTime = Date.now();
let lastConnectionTime = Date.now();
let lastConnectionTime = Date.now();




let connectionState = ConnectionState.DISCONNECTED;
let connectionState = ConnectionState.DISCONNECTED;
let connectionState = ConnectionState.DISCONNECTED;
let connectionState = ConnectionState.DISCONNECTED;




export function setLogLevel(level) {
export function setLogLevel(level) {
export function setLogLevel(level) {
export function setLogLevel(level) {
  logger.setLogLevel(level);
  logger.setLogLevel(level);
  logger.setLogLevel(level);
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  isDebugMode = level === 'DEBUG';
  isDebugMode = level === 'DEBUG';
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}
}
}
}




let avatars = {};
let avatars = {};
let avatars = {};
let avatars = {};
let currentAvatar = '';
let currentAvatar = '';
let currentAvatar = '';
let currentAvatar = '';




const avatarSelect = document.getElementById('avatar-select');
const avatarSelect = document.getElementById('avatar-select');
const avatarSelect = document.getElementById('avatar-select');
const avatarSelect = document.getElementById('avatar-select');
avatarSelect.addEventListener('change', handleAvatarChange);
avatarSelect.addEventListener('change', handleAvatarChange);
avatarSelect.addEventListener('change', handleAvatarChange);
avatarSelect.addEventListener('change', handleAvatarChange);




let context = `
let context = `
let context = `
let context = `




grocery store info:
grocery store info:
grocery store info:
grocery store info:
---
---
---
---
Product,"Aisle and side (<Aisle, Left or Right>)",Est. Price,Promo price,Category
Product,"Aisle and side (<Aisle, Left or Right>)",Est. Price,Promo price,Category
Product,"Aisle and side (<Aisle, Left or Right>)",Est. Price,Promo price,Category
Product,"Aisle and side (<Aisle, Left or Right>)",Est. Price,Promo price,Category
Double Zipper Gallon Storage Bags ,16 -  R,4,,Cleaning Products
Double Zipper Gallon Storage Bags ,16 -  R,4,,Cleaning Products
Double Zipper Gallon Storage Bags ,16 -  R,4,,Cleaning Products
Double Zipper Gallon Storage Bags ,16 -  R,4,,Cleaning Products
Double Zipper Gallon Size Freezer Bags ,16 -  R,4,,Cleaning Products
Double Zipper Gallon Size Freezer Bags ,16 -  R,4,,Cleaning Products
Double Zipper Gallon Size Freezer Bags ,16 -  R,4,,Cleaning Products
Double Zipper Gallon Size Freezer Bags ,16 -  R,4,,Cleaning Products
Reclosable Colorful Assorted Square Snack Bags ,16 -  R,3,,Cleaning Products
Reclosable Colorful Assorted Square Snack Bags ,16 -  R,3,,Cleaning Products
Reclosable Colorful Assorted Square Snack Bags ,16 -  R,3,,Cleaning Products
Reclosable Colorful Assorted Square Snack Bags ,16 -  R,3,,Cleaning Products
Quart Slider Freezer Bag ,16 -  R,4,,Cleaning Products
Quart Slider Freezer Bag ,16 -  R,4,,Cleaning Products
Quart Slider Freezer Bag ,16 -  R,4,,Cleaning Products
Quart Slider Freezer Bag ,16 -  R,4,,Cleaning Products
Slider Freezer Storage Gallon Bags ,16 -  R,4,,Cleaning Products
Slider Freezer Storage Gallon Bags ,16 -  R,4,,Cleaning Products
Slider Freezer Storage Gallon Bags ,16 -  R,4,,Cleaning Products
Slider Freezer Storage Gallon Bags ,16 -  R,4,,Cleaning Products
Double Zipper Quart Storage Bags ,16 -  R,4,,Cleaning Products
Double Zipper Quart Storage Bags ,16 -  R,4,,Cleaning Products
Double Zipper Quart Storage Bags ,16 -  R,4,,Cleaning Products
Double Zipper Quart Storage Bags ,16 -  R,4,,Cleaning Products
Double Zipper Quart Freezer Bags ,16 -  R,4,,Cleaning Products
Double Zipper Quart Freezer Bags ,16 -  R,4,,Cleaning Products
Double Zipper Quart Freezer Bags ,16 -  R,4,,Cleaning Products
Double Zipper Quart Freezer Bags ,16 -  R,4,,Cleaning Products
Slider Freezer Storage Gallon Bags ,16 -  R,4,,Cleaning Products
Slider Freezer Storage Gallon Bags ,16 -  R,4,,Cleaning Products
Slider Freezer Storage Gallon Bags ,16 -  R,4,,Cleaning Products
Slider Freezer Storage Gallon Bags ,16 -  R,4,,Cleaning Products
Reclosable Colorful Assorted Sandwich Bags 40 Count ,16 -  R,2,,Cleaning Products
Reclosable Colorful Assorted Sandwich Bags 40 Count ,16 -  R,2,,Cleaning Products
Reclosable Colorful Assorted Sandwich Bags 40 Count ,16 -  R,2,,Cleaning Products
Reclosable Colorful Assorted Sandwich Bags 40 Count ,16 -  R,2,,Cleaning Products
Double Zipper Quart Storage Bags ,16 -  R,3,,Cleaning Products
Double Zipper Quart Storage Bags ,16 -  R,3,,Cleaning Products
Double Zipper Quart Storage Bags ,16 -  R,3,,Cleaning Products
Double Zipper Quart Storage Bags ,16 -  R,3,,Cleaning Products
Stand & Fill Quart Slider Storage Bag ,16 -  R,3,,Cleaning Products
Stand & Fill Quart Slider Storage Bag ,16 -  R,3,,Cleaning Products
Stand & Fill Quart Slider Storage Bag ,16 -  R,3,,Cleaning Products
Stand & Fill Quart Slider Storage Bag ,16 -  R,3,,Cleaning Products
Double Zipper Gallon Storage Bags ,16 -  R,3,,Cleaning Products
Double Zipper Gallon Storage Bags ,16 -  R,3,,Cleaning Products
Double Zipper Gallon Storage Bags ,16 -  R,3,,Cleaning Products
Double Zipper Gallon Storage Bags ,16 -  R,3,,Cleaning Products
Slider Gallon Storage Bags ,16 -  R,3,,Cleaning Products
Slider Gallon Storage Bags ,16 -  R,3,,Cleaning Products
Slider Gallon Storage Bags ,16 -  R,3,,Cleaning Products
Slider Gallon Storage Bags ,16 -  R,3,,Cleaning Products
Quart Slider Storage Bags ,16 -  R,4,,Cleaning Products
Quart Slider Storage Bags ,16 -  R,4,,Cleaning Products
Quart Slider Storage Bags ,16 -  R,4,,Cleaning Products
Quart Slider Storage Bags ,16 -  R,4,,Cleaning Products
Twist Tie Gallon Storage Bags ,16 -  R,5,,Cleaning Products
Twist Tie Gallon Storage Bags ,16 -  R,5,,Cleaning Products
Twist Tie Gallon Storage Bags ,16 -  R,5,,Cleaning Products
Twist Tie Gallon Storage Bags ,16 -  R,5,,Cleaning Products
Apple Cinnamon & Apple Strawberry Applesauce Variety Pouches ,4 -  R,7,,Snacks
Apple Cinnamon & Apple Strawberry Applesauce Variety Pouches ,4 -  R,7,,Snacks
Apple Cinnamon & Apple Strawberry Applesauce Variety Pouches ,4 -  R,7,,Snacks
Apple Cinnamon & Apple Strawberry Applesauce Variety Pouches ,4 -  R,7,,Snacks
Strawberry + Cinnamon Applesauce Pouches Variety Pack BIG Deal! ,4 -  R,12,,Snacks
Strawberry + Cinnamon Applesauce Pouches Variety Pack BIG Deal! ,4 -  R,12,,Snacks
Strawberry + Cinnamon Applesauce Pouches Variety Pack BIG Deal! ,4 -  R,12,,Snacks
Strawberry + Cinnamon Applesauce Pouches Variety Pack BIG Deal! ,4 -  R,12,,Snacks
Classic Applesauce Pouches ,4 -  R,7,,Snacks
Classic Applesauce Pouches ,4 -  R,7,,Snacks
Classic Applesauce Pouches ,4 -  R,7,,Snacks
Classic Applesauce Pouches ,4 -  R,7,,Snacks
Apple Cinnamon Applesauce Pouches ,4 -  R,7,,Snacks
Apple Cinnamon Applesauce Pouches ,4 -  R,7,,Snacks
Apple Cinnamon Applesauce Pouches ,4 -  R,7,,Snacks
Apple Cinnamon Applesauce Pouches ,4 -  R,7,,Snacks
Apple Strawberry Applesauce Pouches ,4 -  R,7,,Snacks
Apple Strawberry Applesauce Pouches ,4 -  R,7,,Snacks
Apple Strawberry Applesauce Pouches ,4 -  R,7,,Snacks
Apple Strawberry Applesauce Pouches ,4 -  R,7,,Snacks
Chunky Applesauce ,4 -  R,3,,Snacks
Chunky Applesauce ,4 -  R,3,,Snacks
Chunky Applesauce ,4 -  R,3,,Snacks
Chunky Applesauce ,4 -  R,3,,Snacks
Cherry Mixed Fruit Cups in 100% Juice ,4 -  R,5,,Canned & Packaged
Cherry Mixed Fruit Cups in 100% Juice ,4 -  R,5,,Canned & Packaged
Cherry Mixed Fruit Cups in 100% Juice ,4 -  R,5,,Canned & Packaged
Cherry Mixed Fruit Cups in 100% Juice ,4 -  R,5,,Canned & Packaged
Variety Fruit Bowls ,4 -  R,15,,Snacks
Variety Fruit Bowls ,4 -  R,15,,Snacks
Variety Fruit Bowls ,4 -  R,15,,Snacks
Variety Fruit Bowls ,4 -  R,15,,Snacks
Classic Applesauce BIG Deal! ,4 -  R,12,,Snacks
Classic Applesauce BIG Deal! ,4 -  R,12,,Snacks
Classic Applesauce BIG Deal! ,4 -  R,12,,Snacks
Classic Applesauce BIG Deal! ,4 -  R,12,,Snacks
Mandarin Orange Cups No Sugar Added ,4 -  R,5,,Canned & Packaged
Mandarin Orange Cups No Sugar Added ,4 -  R,5,,Canned & Packaged
Mandarin Orange Cups No Sugar Added ,4 -  R,5,,Canned & Packaged
Mandarin Orange Cups No Sugar Added ,4 -  R,5,,Canned & Packaged
Mandarin Orange Cups in 100% Juice Big Deal! ,4 -  R,15,,Snacks
Mandarin Orange Cups in 100% Juice Big Deal! ,4 -  R,15,,Snacks
Mandarin Orange Cups in 100% Juice Big Deal! ,4 -  R,15,,Snacks
Mandarin Orange Cups in 100% Juice Big Deal! ,4 -  R,15,,Snacks
Fruity Gems Fresh Pomegranate Arils PRODUCE,PRODUCE -  L,4,,Snacks
Fruity Gems Fresh Pomegranate Arils PRODUCE,PRODUCE -  L,4,,Snacks
Fruity Gems Fresh Pomegranate Arils PRODUCE,PRODUCE -  L,4,,Snacks
Fruity Gems Fresh Pomegranate Arils PRODUCE,PRODUCE -  L,4,,Snacks
Purified Bottled Water ,14 -  R,6,,Beverages
Purified Bottled Water ,14 -  R,6,,Beverages
Purified Bottled Water ,14 -  R,6,,Beverages
Purified Bottled Water ,14 -  R,6,,Beverages
Vitamin D Whole Milk DAIRY,DAIRY -  R,3,,Dairy
Vitamin D Whole Milk DAIRY,DAIRY -  R,3,,Dairy
Vitamin D Whole Milk DAIRY,DAIRY -  R,3,,Dairy
Vitamin D Whole Milk DAIRY,DAIRY -  R,3,,Dairy
2% Reduced Fat Milk DAIRY,DAIRY -  R,2,,Dairy
2% Reduced Fat Milk DAIRY,DAIRY -  R,2,,Dairy
2% Reduced Fat Milk DAIRY,DAIRY -  R,2,,Dairy
2% Reduced Fat Milk DAIRY,DAIRY -  R,2,,Dairy
Yellow Cling Diced Peach Cups in 100% Juice Big Deal! ,4 -  R,15,,Snacks
Yellow Cling Diced Peach Cups in 100% Juice Big Deal! ,4 -  R,15,,Snacks
Yellow Cling Diced Peach Cups in 100% Juice Big Deal! ,4 -  R,15,,Snacks
Yellow Cling Diced Peach Cups in 100% Juice Big Deal! ,4 -  R,15,,Snacks
Purified Bottled Water ,14 -  R,4,,Beverages
Purified Bottled Water ,14 -  R,4,,Beverages
Purified Bottled Water ,14 -  R,4,,Beverages
Purified Bottled Water ,14 -  R,4,,Beverages
2% Reduced Fat Milk DAIRY,DAIRY -  R,3,,Dairy
2% Reduced Fat Milk DAIRY,DAIRY -  R,3,,Dairy
2% Reduced Fat Milk DAIRY,DAIRY -  R,3,,Dairy
2% Reduced Fat Milk DAIRY,DAIRY -  R,3,,Dairy
Vitamin D Whole Milk DAIRY,DAIRY -  R,2,,Dairy
Vitamin D Whole Milk DAIRY,DAIRY -  R,2,,Dairy
Vitamin D Whole Milk DAIRY,DAIRY -  R,2,,Dairy
Vitamin D Whole Milk DAIRY,DAIRY -  R,2,,Dairy
Large White Eggs DAIRY,DAIRY -  R,2,,Dairy
Large White Eggs DAIRY,DAIRY -  R,2,,Dairy
Large White Eggs DAIRY,DAIRY -  R,2,,Dairy
Large White Eggs DAIRY,DAIRY -  R,2,,Dairy
Distilled Gallon Bottled Water ,14 -  R,2,,Beverages
Distilled Gallon Bottled Water ,14 -  R,2,,Beverages
Distilled Gallon Bottled Water ,14 -  R,2,,Beverages
Distilled Gallon Bottled Water ,14 -  R,2,,Beverages
Original Pancake Syrup SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,3,,Breakfast
Original Pancake Syrup SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,3,,Breakfast
Original Pancake Syrup SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,3,,Breakfast
Original Pancake Syrup SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,3,,Breakfast
Original Sour Cream DAIRY,DAIRY -  R,3,,Dairy
Original Sour Cream DAIRY,DAIRY -  R,3,,Dairy
Original Sour Cream DAIRY,DAIRY -  R,3,,Dairy
Original Sour Cream DAIRY,DAIRY -  R,3,,Dairy
Shredded Iceberg Lettuce Bag PRODUCE,PRODUCE -  L,3,,Produce
Shredded Iceberg Lettuce Bag PRODUCE,PRODUCE -  L,3,,Produce
Shredded Iceberg Lettuce Bag PRODUCE,PRODUCE -  L,3,,Produce
Shredded Iceberg Lettuce Bag PRODUCE,PRODUCE -  L,3,,Produce
Super Sweet Golden Whole Kernel Corn ,4 -  R,1,,Canned & Packaged
Super Sweet Golden Whole Kernel Corn ,4 -  R,1,,Canned & Packaged
Super Sweet Golden Whole Kernel Corn ,4 -  R,1,,Canned & Packaged
Super Sweet Golden Whole Kernel Corn ,4 -  R,1,,Canned & Packaged
Fresh Grape Tomatoes PRODUCE,PRODUCE -  L,3,,Produce
Fresh Grape Tomatoes PRODUCE,PRODUCE -  L,3,,Produce
Fresh Grape Tomatoes PRODUCE,PRODUCE -  L,3,,Produce
Fresh Grape Tomatoes PRODUCE,PRODUCE -  L,3,,Produce
Salted Butter Sticks DAIRY,DAIRY -  R,5,,Dairy
Salted Butter Sticks DAIRY,DAIRY -  R,5,,Dairy
Salted Butter Sticks DAIRY,DAIRY -  R,5,,Dairy
Salted Butter Sticks DAIRY,DAIRY -  R,5,,Dairy
Heavy Whipping Cream DAIRY,DAIRY -  R,4,,Dairy
Heavy Whipping Cream DAIRY,DAIRY -  R,4,,Dairy
Heavy Whipping Cream DAIRY,DAIRY -  R,4,,Dairy
Heavy Whipping Cream DAIRY,DAIRY -  R,4,,Dairy
Tender Spinach Bag PRODUCE,PRODUCE -  L,3,,Produce
Tender Spinach Bag PRODUCE,PRODUCE -  L,3,,Produce
Tender Spinach Bag PRODUCE,PRODUCE -  L,3,,Produce
Tender Spinach Bag PRODUCE,PRODUCE -  L,3,,Produce
Canned Pineapple Chunks in Pineapple Juice GROCERY,GROCERY -  R,2,,Canned & Packaged
Canned Pineapple Chunks in Pineapple Juice GROCERY,GROCERY -  R,2,,Canned & Packaged
Canned Pineapple Chunks in Pineapple Juice GROCERY,GROCERY -  R,2,,Canned & Packaged
Canned Pineapple Chunks in Pineapple Juice GROCERY,GROCERY -  R,2,,Canned & Packaged
Unsalted Butter Sticks DAIRY,DAIRY -  R,5,,Dairy
Unsalted Butter Sticks DAIRY,DAIRY -  R,5,,Dairy
Unsalted Butter Sticks DAIRY,DAIRY -  R,5,,Dairy
Unsalted Butter Sticks DAIRY,DAIRY -  R,5,,Dairy
100% Apple Juice ,13 -  R,3,,Beverages
100% Apple Juice ,13 -  R,3,,Beverages
100% Apple Juice ,13 -  R,3,,Beverages
100% Apple Juice ,13 -  R,3,,Beverages
Classic Garden Salad Bag PRODUCE,PRODUCE -  L,3,,Produce
Classic Garden Salad Bag PRODUCE,PRODUCE -  L,3,,Produce
Classic Garden Salad Bag PRODUCE,PRODUCE -  L,3,,Produce
Classic Garden Salad Bag PRODUCE,PRODUCE -  L,3,,Produce
Lean Ground Beef Chuck 80/20 MEAT,MEAT -  R,7,,Meat & Seafood
Lean Ground Beef Chuck 80/20 MEAT,MEAT -  R,7,,Meat & Seafood
Lean Ground Beef Chuck 80/20 MEAT,MEAT -  R,7,,Meat & Seafood
Lean Ground Beef Chuck 80/20 MEAT,MEAT -  R,7,,Meat & Seafood
Half & Half DAIRY,DAIRY -  R,4,,Dairy
Half & Half DAIRY,DAIRY -  R,4,,Dairy
Half & Half DAIRY,DAIRY -  R,4,,Dairy
Half & Half DAIRY,DAIRY -  R,4,,Dairy
1% Lowfat Milk DAIRY,DAIRY -  R,3,,Dairy
1% Lowfat Milk DAIRY,DAIRY -  R,3,,Dairy
1% Lowfat Milk DAIRY,DAIRY -  R,3,,Dairy
1% Lowfat Milk DAIRY,DAIRY -  R,3,,Dairy
Pure Vegetable Oil ,6 -  L,4,,Baking Goods
Pure Vegetable Oil ,6 -  L,4,,Baking Goods
Pure Vegetable Oil ,6 -  L,4,,Baking Goods
Pure Vegetable Oil ,6 -  L,4,,Baking Goods
Heavy Whipping Cream DAIRY,DAIRY -  R,6,,Dairy
Heavy Whipping Cream DAIRY,DAIRY -  R,6,,Dairy
Heavy Whipping Cream DAIRY,DAIRY -  R,6,,Dairy
Heavy Whipping Cream DAIRY,DAIRY -  R,6,,Dairy
Aluminum Foil ,16 -  R,2,,Cleaning Products
Aluminum Foil ,16 -  R,2,,Cleaning Products
Aluminum Foil ,16 -  R,2,,Cleaning Products
Aluminum Foil ,16 -  R,2,,Cleaning Products
3 lb. Lean Ground Beef Chuck 80/20 MEAT,MEAT -  R,17,,Meat & Seafood
3 lb. Lean Ground Beef Chuck 80/20 MEAT,MEAT -  R,17,,Meat & Seafood
3 lb. Lean Ground Beef Chuck 80/20 MEAT,MEAT -  R,17,,Meat & Seafood
3 lb. Lean Ground Beef Chuck 80/20 MEAT,MEAT -  R,17,,Meat & Seafood
1 lb. Lean Ground Beef Chuck Roll 80/20 MEAT,MEAT -  R,6,,Meat & Seafood
1 lb. Lean Ground Beef Chuck Roll 80/20 MEAT,MEAT -  R,6,,Meat & Seafood
1 lb. Lean Ground Beef Chuck Roll 80/20 MEAT,MEAT -  R,6,,Meat & Seafood
1 lb. Lean Ground Beef Chuck Roll 80/20 MEAT,MEAT -  R,6,,Meat & Seafood
Lean Ground Beef Chuck 80/20 Homestyle Hamburger Patties MEAT,MEAT -  R,10,,Meat & Seafood
Lean Ground Beef Chuck 80/20 Homestyle Hamburger Patties MEAT,MEAT -  R,10,,Meat & Seafood
Lean Ground Beef Chuck 80/20 Homestyle Hamburger Patties MEAT,MEAT -  R,10,,Meat & Seafood
Lean Ground Beef Chuck 80/20 Homestyle Hamburger Patties MEAT,MEAT -  R,10,,Meat & Seafood
4% Milkfat Small Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
4% Milkfat Small Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
4% Milkfat Small Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
4% Milkfat Small Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
Canned Crushed Pineapple in Pineapple Juice GROCERY,GROCERY -  L,2,,Canned & Packaged
Canned Crushed Pineapple in Pineapple Juice GROCERY,GROCERY -  L,2,,Canned & Packaged
Canned Crushed Pineapple in Pineapple Juice GROCERY,GROCERY -  L,2,,Canned & Packaged
Canned Crushed Pineapple in Pineapple Juice GROCERY,GROCERY -  L,2,,Canned & Packaged
Half & Half DAIRY,DAIRY -  R,2,,Dairy
Half & Half DAIRY,DAIRY -  R,2,,Dairy
Half & Half DAIRY,DAIRY -  R,2,,Dairy
Half & Half DAIRY,DAIRY -  R,2,,Dairy
Extra Large White Eggs DAIRY,DAIRY -  R,3,,Dairy
Extra Large White Eggs DAIRY,DAIRY -  R,3,,Dairy
Extra Large White Eggs DAIRY,DAIRY -  R,3,,Dairy
Extra Large White Eggs DAIRY,DAIRY -  R,3,,Dairy
Gallon Water ,14 -  R,2,,Beverages
Gallon Water ,14 -  R,2,,Beverages
Gallon Water ,14 -  R,2,,Beverages
Gallon Water ,14 -  R,2,,Beverages
Hardwood Smoked Sliced Bacon Packaged Meat,Packaged Meat -  R,6,,Meat & Seafood
Hardwood Smoked Sliced Bacon Packaged Meat,Packaged Meat -  R,6,,Meat & Seafood
Hardwood Smoked Sliced Bacon Packaged Meat,Packaged Meat -  R,6,,Meat & Seafood
Hardwood Smoked Sliced Bacon Packaged Meat,Packaged Meat -  R,6,,Meat & Seafood
Brand Super Sweet Corn ,8 -  R,2,,Frozen
Brand Super Sweet Corn ,8 -  R,2,,Frozen
Brand Super Sweet Corn ,8 -  R,2,,Frozen
Brand Super Sweet Corn ,8 -  R,2,,Frozen
Adorbs™ Easy Peel Seedless Mandarin Clementine Oranges in 5lb Bag PRODUCE,PRODUCE -  R,8,,Produce
Adorbs™ Easy Peel Seedless Mandarin Clementine Oranges in 5lb Bag PRODUCE,PRODUCE -  R,8,,Produce
Adorbs™ Easy Peel Seedless Mandarin Clementine Oranges in 5lb Bag PRODUCE,PRODUCE -  R,8,,Produce
Adorbs™ Easy Peel Seedless Mandarin Clementine Oranges in 5lb Bag PRODUCE,PRODUCE -  R,8,,Produce
Non-Stick Extra Virgin Olive Oil Cooking Spray SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,5,,Baking Goods
Non-Stick Extra Virgin Olive Oil Cooking Spray SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,5,,Baking Goods
Non-Stick Extra Virgin Olive Oil Cooking Spray SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,5,,Baking Goods
Non-Stick Extra Virgin Olive Oil Cooking Spray SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,5,,Baking Goods
Hamburger Dill Oval Cut Pickle Chips ,5 -  L,3,,Canned & Packaged
Hamburger Dill Oval Cut Pickle Chips ,5 -  L,3,,Canned & Packaged
Hamburger Dill Oval Cut Pickle Chips ,5 -  L,3,,Canned & Packaged
Hamburger Dill Oval Cut Pickle Chips ,5 -  L,3,,Canned & Packaged
Original Cream Cheese DAIRY,DAIRY -  R,2,,Breakfast
Original Cream Cheese DAIRY,DAIRY -  R,2,,Breakfast
Original Cream Cheese DAIRY,DAIRY -  R,2,,Breakfast
Original Cream Cheese DAIRY,DAIRY -  R,2,,Breakfast
Glimmer™ Select-A-Sheet® Paper Towels Double Rolls ,18 -  R,3,,Cleaning Products
Glimmer™ Select-A-Sheet® Paper Towels Double Rolls ,18 -  R,3,,Cleaning Products
Glimmer™ Select-A-Sheet® Paper Towels Double Rolls ,18 -  R,3,,Cleaning Products
Glimmer™ Select-A-Sheet® Paper Towels Double Rolls ,18 -  R,3,,Cleaning Products
85% Lean 15% Fat Ground Turkey MEAT,MEAT -  R,5,,Meat & Seafood
85% Lean 15% Fat Ground Turkey MEAT,MEAT -  R,5,,Meat & Seafood
85% Lean 15% Fat Ground Turkey MEAT,MEAT -  R,5,,Meat & Seafood
85% Lean 15% Fat Ground Turkey MEAT,MEAT -  R,5,,Meat & Seafood
Original Saltines Crackers ,12 -  R,2,,Snacks
Original Saltines Crackers ,12 -  R,2,,Snacks
Original Saltines Crackers ,12 -  R,2,,Snacks
Original Saltines Crackers ,12 -  R,2,,Snacks
Garlic Frozen Texas Toast ,7 -  L,3,,Frozen
Garlic Frozen Texas Toast ,7 -  L,3,,Frozen
Garlic Frozen Texas Toast ,7 -  L,3,,Frozen
Garlic Frozen Texas Toast ,7 -  L,3,,Frozen
Kosher Dill Spear Pickles ,5 -  L,3,,Canned & Packaged
Kosher Dill Spear Pickles ,5 -  L,3,,Canned & Packaged
Kosher Dill Spear Pickles ,5 -  L,3,,Canned & Packaged
Kosher Dill Spear Pickles ,5 -  L,3,,Canned & Packaged
Fat Free Skim Milk DAIRY,DAIRY -  R,3,,Dairy
Fat Free Skim Milk DAIRY,DAIRY -  R,3,,Dairy
Fat Free Skim Milk DAIRY,DAIRY -  R,3,,Dairy
Fat Free Skim Milk DAIRY,DAIRY -  R,3,,Dairy
Spring Gallon Water ,14 -  R,2,,Beverages
Spring Gallon Water ,14 -  R,2,,Beverages
Spring Gallon Water ,14 -  R,2,,Beverages
Spring Gallon Water ,14 -  R,2,,Beverages
100% Parmesan Grated Cheese ,5 -  R,4,,Dairy
100% Parmesan Grated Cheese ,5 -  R,4,,Dairy
100% Parmesan Grated Cheese ,5 -  R,4,,Dairy
100% Parmesan Grated Cheese ,5 -  R,4,,Dairy
Classic Wavy Potato Chips ,12 -  L,2,,Snacks
Classic Wavy Potato Chips ,12 -  L,2,,Snacks
Classic Wavy Potato Chips ,12 -  L,2,,Snacks
Classic Wavy Potato Chips ,12 -  L,2,,Snacks
Peanut Butter Creamy SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,3,,Condiment & Sauces
Peanut Butter Creamy SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,3,,Condiment & Sauces
Peanut Butter Creamy SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,3,,Condiment & Sauces
Peanut Butter Creamy SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,3,,Condiment & Sauces
Fresh Chicken Drumsticks MEAT,MEAT -  L,5,,Meat & Seafood
Fresh Chicken Drumsticks MEAT,MEAT -  L,5,,Meat & Seafood
Fresh Chicken Drumsticks MEAT,MEAT -  L,5,,Meat & Seafood
Fresh Chicken Drumsticks MEAT,MEAT -  L,5,,Meat & Seafood
Whole Kernel Sweet Golden Corn ,4 -  R,1,,Canned & Packaged
Whole Kernel Sweet Golden Corn ,4 -  R,1,,Canned & Packaged
Whole Kernel Sweet Golden Corn ,4 -  R,1,,Canned & Packaged
Whole Kernel Sweet Golden Corn ,4 -  R,1,,Canned & Packaged
Original Cream Cheese DAIRY,DAIRY -  R,4,,Breakfast
Original Cream Cheese DAIRY,DAIRY -  R,4,,Breakfast
Original Cream Cheese DAIRY,DAIRY -  R,4,,Breakfast
Original Cream Cheese DAIRY,DAIRY -  R,4,,Breakfast
Mexican Style Blend Shredded Cheese BIG DEAL! DAIRY,DAIRY -  R,8,,Dairy
Mexican Style Blend Shredded Cheese BIG DEAL! DAIRY,DAIRY -  R,8,,Dairy
Mexican Style Blend Shredded Cheese BIG DEAL! DAIRY,DAIRY -  R,8,,Dairy
Mexican Style Blend Shredded Cheese BIG DEAL! DAIRY,DAIRY -  R,8,,Dairy
Romaine Blend Salad Bag PRODUCE,PRODUCE -  L,4,,Produce
Romaine Blend Salad Bag PRODUCE,PRODUCE -  L,4,,Produce
Romaine Blend Salad Bag PRODUCE,PRODUCE -  L,4,,Produce
Romaine Blend Salad Bag PRODUCE,PRODUCE -  L,4,,Produce
Hass Fresh Avocados Bag PRODUCE,PRODUCE -  L,4,,Produce
Hass Fresh Avocados Bag PRODUCE,PRODUCE -  L,4,,Produce
Hass Fresh Avocados Bag PRODUCE,PRODUCE -  L,4,,Produce
Hass Fresh Avocados Bag PRODUCE,PRODUCE -  L,4,,Produce
Canned Pineapple Tidbits in Pineapple Juice GROCERY,GROCERY -  nan,2,,Canned & Packaged
Canned Pineapple Tidbits in Pineapple Juice GROCERY,GROCERY -  nan,2,,Canned & Packaged
Canned Pineapple Tidbits in Pineapple Juice GROCERY,GROCERY -  nan,2,,Canned & Packaged
Canned Pineapple Tidbits in Pineapple Juice GROCERY,GROCERY -  nan,2,,Canned & Packaged
2% Low Fat Small Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
2% Low Fat Small Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
2% Low Fat Small Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
2% Low Fat Small Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
1 lb. Ground Beef Roll 73/27 MEAT,MEAT -  R,5,,Meat & Seafood
1 lb. Ground Beef Roll 73/27 MEAT,MEAT -  R,5,,Meat & Seafood
1 lb. Ground Beef Roll 73/27 MEAT,MEAT -  R,5,,Meat & Seafood
1 lb. Ground Beef Roll 73/27 MEAT,MEAT -  R,5,,Meat & Seafood
4% Milkfat Small Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
4% Milkfat Small Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
4% Milkfat Small Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
4% Milkfat Small Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
Traditional Favorites Frozen Green Peas ,8 -  R,2,,Frozen
Traditional Favorites Frozen Green Peas ,8 -  R,2,,Frozen
Traditional Favorites Frozen Green Peas ,8 -  R,2,,Frozen
Traditional Favorites Frozen Green Peas ,8 -  R,2,,Frozen
Reduced Sodium Chicken Broth ,5 -  R,2,,Canned & Packaged
Reduced Sodium Chicken Broth ,5 -  R,2,,Canned & Packaged
Reduced Sodium Chicken Broth ,5 -  R,2,,Canned & Packaged
Reduced Sodium Chicken Broth ,5 -  R,2,,Canned & Packaged
1% Low Fat Chocolate Milk DAIRY,DAIRY -  R,3,,Dairy
1% Low Fat Chocolate Milk DAIRY,DAIRY -  R,3,,Dairy
1% Low Fat Chocolate Milk DAIRY,DAIRY -  R,3,,Dairy
1% Low Fat Chocolate Milk DAIRY,DAIRY -  R,3,,Dairy
Clamshell Seedless Green Grapes nan,nan -  nan,8,,Produce
Clamshell Seedless Green Grapes nan,nan -  nan,8,,Produce
Clamshell Seedless Green Grapes nan,nan -  nan,8,,Produce
Clamshell Seedless Green Grapes nan,nan -  nan,8,,Produce
Shredded Carrots PRODUCE,PRODUCE -  L,3,,Produce
Shredded Carrots PRODUCE,PRODUCE -  L,3,,Produce
Shredded Carrots PRODUCE,PRODUCE -  L,3,,Produce
Shredded Carrots PRODUCE,PRODUCE -  L,3,,Produce
99% Fat Free Chicken Broth ,5 -  R,2,,Canned & Packaged
99% Fat Free Chicken Broth ,5 -  R,2,,Canned & Packaged
99% Fat Free Chicken Broth ,5 -  R,2,,Canned & Packaged
99% Fat Free Chicken Broth ,5 -  R,2,,Canned & Packaged
Original Sour Cream DAIRY,DAIRY -  R,3,,Dairy
Original Sour Cream DAIRY,DAIRY -  R,3,,Dairy
Original Sour Cream DAIRY,DAIRY -  R,3,,Dairy
Original Sour Cream DAIRY,DAIRY -  R,3,,Dairy
Seasoned Hash Brown Shredded Potato Patties ,7 -  L,4,,Frozen
Seasoned Hash Brown Shredded Potato Patties ,7 -  L,4,,Frozen
Seasoned Hash Brown Shredded Potato Patties ,7 -  L,4,,Frozen
Seasoned Hash Brown Shredded Potato Patties ,7 -  L,4,,Frozen
Boneless Pork Loin Chops MEAT,MEAT -  R,10,,Meat & Seafood
Boneless Pork Loin Chops MEAT,MEAT -  R,10,,Meat & Seafood
Boneless Pork Loin Chops MEAT,MEAT -  R,10,,Meat & Seafood
Boneless Pork Loin Chops MEAT,MEAT -  R,10,,Meat & Seafood
Thick Cut Naturally Hardwood Smoked Bacon Packaged Meat,Packaged Meat -  R,6,,Meat & Seafood
Thick Cut Naturally Hardwood Smoked Bacon Packaged Meat,Packaged Meat -  R,6,,Meat & Seafood
Thick Cut Naturally Hardwood Smoked Bacon Packaged Meat,Packaged Meat -  R,6,,Meat & Seafood
Thick Cut Naturally Hardwood Smoked Bacon Packaged Meat,Packaged Meat -  R,6,,Meat & Seafood
1% Low Fat Chocolate Milk Jug DAIRY,DAIRY -  R,4,,Dairy
1% Low Fat Chocolate Milk Jug DAIRY,DAIRY -  R,4,,Dairy
1% Low Fat Chocolate Milk Jug DAIRY,DAIRY -  R,4,,Dairy
1% Low Fat Chocolate Milk Jug DAIRY,DAIRY -  R,4,,Dairy
Classic Garden Salad Bag PRODUCE,PRODUCE -  L,4,,Produce
Classic Garden Salad Bag PRODUCE,PRODUCE -  L,4,,Produce
Classic Garden Salad Bag PRODUCE,PRODUCE -  L,4,,Produce
Classic Garden Salad Bag PRODUCE,PRODUCE -  L,4,,Produce
Petite Carrots Bag PRODUCE,PRODUCE -  L,3,,Produce
Petite Carrots Bag PRODUCE,PRODUCE -  L,3,,Produce
Petite Carrots Bag PRODUCE,PRODUCE -  L,3,,Produce
Petite Carrots Bag PRODUCE,PRODUCE -  L,3,,Produce
Meal-Ready Sides Frozen Peas & Carrots ,8 -  R,2,,Frozen
Meal-Ready Sides Frozen Peas & Carrots ,8 -  R,2,,Frozen
Meal-Ready Sides Frozen Peas & Carrots ,8 -  R,2,,Frozen
Meal-Ready Sides Frozen Peas & Carrots ,8 -  R,2,,Frozen
Light Brown Sugar ,6 -  R,3,,Baking Goods
Light Brown Sugar ,6 -  R,3,,Baking Goods
Light Brown Sugar ,6 -  R,3,,Baking Goods
Light Brown Sugar ,6 -  R,3,,Baking Goods
Natural Spring Bottled Water ,14 -  R,5,,Beverages
Natural Spring Bottled Water ,14 -  R,5,,Beverages
Natural Spring Bottled Water ,14 -  R,5,,Beverages
Natural Spring Bottled Water ,14 -  R,5,,Beverages
Original Sour Cream DAIRY,DAIRY -  R,2,,Dairy
Original Sour Cream DAIRY,DAIRY -  R,2,,Dairy
Original Sour Cream DAIRY,DAIRY -  R,2,,Dairy
Original Sour Cream DAIRY,DAIRY -  R,2,,Dairy
Sliced Black Ripe Olives SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,3,,Canned & Packaged
Sliced Black Ripe Olives SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,3,,Canned & Packaged
Sliced Black Ripe Olives SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,3,,Canned & Packaged
Sliced Black Ripe Olives SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,3,,Canned & Packaged
Broccoli Florets BIG Deal! PRODUCE,PRODUCE -  L,7,,Produce
Broccoli Florets BIG Deal! PRODUCE,PRODUCE -  L,7,,Produce
Broccoli Florets BIG Deal! PRODUCE,PRODUCE -  L,7,,Produce
Broccoli Florets BIG Deal! PRODUCE,PRODUCE -  L,7,,Produce
Classic Potato Chips ,12 -  L,2,,Snacks
Classic Potato Chips ,12 -  L,2,,Snacks
Classic Potato Chips ,12 -  L,2,,Snacks
Classic Potato Chips ,12 -  L,2,,Snacks
Butter Sticks BIG DEAL! DAIRY,DAIRY -  R,8,,Dairy
Butter Sticks BIG DEAL! DAIRY,DAIRY -  R,8,,Dairy
Butter Sticks BIG DEAL! DAIRY,DAIRY -  R,8,,Dairy
Butter Sticks BIG DEAL! DAIRY,DAIRY -  R,8,,Dairy
Mexican Style Blend Shredded Cheese DAIRY,DAIRY -  R,5,,Dairy
Mexican Style Blend Shredded Cheese DAIRY,DAIRY -  R,5,,Dairy
Mexican Style Blend Shredded Cheese DAIRY,DAIRY -  R,5,,Dairy
Mexican Style Blend Shredded Cheese DAIRY,DAIRY -  R,5,,Dairy
1% Lowfat Milk DAIRY,DAIRY -  R,2,,Dairy
1% Lowfat Milk DAIRY,DAIRY -  R,2,,Dairy
1% Lowfat Milk DAIRY,DAIRY -  R,2,,Dairy
1% Lowfat Milk DAIRY,DAIRY -  R,2,,Dairy
Real Bacon Bits ,5 -  L,3,,Condiment & Sauces
Real Bacon Bits ,5 -  L,3,,Condiment & Sauces
Real Bacon Bits ,5 -  L,3,,Condiment & Sauces
Real Bacon Bits ,5 -  L,3,,Condiment & Sauces
Fat Free Skim Milk DAIRY,DAIRY -  R,2,,Dairy
Fat Free Skim Milk DAIRY,DAIRY -  R,2,,Dairy
Fat Free Skim Milk DAIRY,DAIRY -  R,2,,Dairy
Fat Free Skim Milk DAIRY,DAIRY -  R,2,,Dairy
85% Lean Fresh Ground Turkey MEAT,MEAT -  R,10,,Meat & Seafood
85% Lean Fresh Ground Turkey MEAT,MEAT -  R,10,,Meat & Seafood
85% Lean Fresh Ground Turkey MEAT,MEAT -  R,10,,Meat & Seafood
85% Lean Fresh Ground Turkey MEAT,MEAT -  R,10,,Meat & Seafood
Sweet & Mesquite BBQ Flavored Potato Chips ,12 -  L,2,,Snacks
Sweet & Mesquite BBQ Flavored Potato Chips ,12 -  L,2,,Snacks
Sweet & Mesquite BBQ Flavored Potato Chips ,12 -  L,2,,Snacks
Sweet & Mesquite BBQ Flavored Potato Chips ,12 -  L,2,,Snacks
Real Mayo ,5 -  L,4,,Condiment & Sauces
Real Mayo ,5 -  L,4,,Condiment & Sauces
Real Mayo ,5 -  L,4,,Condiment & Sauces
Real Mayo ,5 -  L,4,,Condiment & Sauces
Purified Gallon Water ,14 -  R,2,,Beverages
Purified Gallon Water ,14 -  R,2,,Beverages
Purified Gallon Water ,14 -  R,2,,Beverages
Purified Gallon Water ,14 -  R,2,,Beverages
Original Taco Seasoning SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,1,,Baking Goods
Original Taco Seasoning SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,1,,Baking Goods
Original Taco Seasoning SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,1,,Baking Goods
Original Taco Seasoning SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,1,,Baking Goods
Dutch Milk Chocolate Hot Cocoa Mix GROCERY,GROCERY -  L,3,,Beverages
Dutch Milk Chocolate Hot Cocoa Mix GROCERY,GROCERY -  L,3,,Beverages
Dutch Milk Chocolate Hot Cocoa Mix GROCERY,GROCERY -  L,3,,Beverages
Dutch Milk Chocolate Hot Cocoa Mix GROCERY,GROCERY -  L,3,,Beverages
Distilled White Vinegar ,6 -  R,4,,Baking Goods
Distilled White Vinegar ,6 -  R,4,,Baking Goods
Distilled White Vinegar ,6 -  R,4,,Baking Goods
Distilled White Vinegar ,6 -  R,4,,Baking Goods
Vine Ripe Fresh Tomatoes PRODUCE,PRODUCE -  L,4,,Produce
Vine Ripe Fresh Tomatoes PRODUCE,PRODUCE -  L,4,,Produce
Vine Ripe Fresh Tomatoes PRODUCE,PRODUCE -  L,4,,Produce
Vine Ripe Fresh Tomatoes PRODUCE,PRODUCE -  L,4,,Produce
Original Pulp Free 100% Orange Juice DAIRY,DAIRY -  R,5,,Beverages
Original Pulp Free 100% Orange Juice DAIRY,DAIRY -  R,5,,Beverages
Original Pulp Free 100% Orange Juice DAIRY,DAIRY -  R,5,,Beverages
Original Pulp Free 100% Orange Juice DAIRY,DAIRY -  R,5,,Beverages
Beef Shaved Steak MEAT,MEAT -  R,6,,Meat & Seafood
Beef Shaved Steak MEAT,MEAT -  R,6,,Meat & Seafood
Beef Shaved Steak MEAT,MEAT -  R,6,,Meat & Seafood
Beef Shaved Steak MEAT,MEAT -  R,6,,Meat & Seafood
Tomato Sauce ,4 -  R,1,,Canned & Packaged
Tomato Sauce ,4 -  R,1,,Canned & Packaged
Tomato Sauce ,4 -  R,1,,Canned & Packaged
Tomato Sauce ,4 -  R,1,,Canned & Packaged
Idaho Potatoes PRODUCE,PRODUCE -  nan,6,,Produce
Idaho Potatoes PRODUCE,PRODUCE -  nan,6,,Produce
Idaho Potatoes PRODUCE,PRODUCE -  nan,6,,Produce
Idaho Potatoes PRODUCE,PRODUCE -  nan,6,,Produce
Soft Taco Size Flour Tortillas ,4 -  L,3,,International
Soft Taco Size Flour Tortillas ,4 -  L,3,,International
Soft Taco Size Flour Tortillas ,4 -  L,3,,International
Soft Taco Size Flour Tortillas ,4 -  L,3,,International
Baker Russet Potatoes PRODUCE,PRODUCE -  nan,4,,Produce
Baker Russet Potatoes PRODUCE,PRODUCE -  nan,4,,Produce
Baker Russet Potatoes PRODUCE,PRODUCE -  nan,4,,Produce
Baker Russet Potatoes PRODUCE,PRODUCE -  nan,4,,Produce
Mozzarella Shredded Cheese BIG DEAL! DAIRY,DAIRY -  R,8,,Dairy
Mozzarella Shredded Cheese BIG DEAL! DAIRY,DAIRY -  R,8,,Dairy
Mozzarella Shredded Cheese BIG DEAL! DAIRY,DAIRY -  R,8,,Dairy
Mozzarella Shredded Cheese BIG DEAL! DAIRY,DAIRY -  R,8,,Dairy
Ultra Absorbing Power Paper Towels Double Rolls ,18 -  R,6,,Cleaning Products
Ultra Absorbing Power Paper Towels Double Rolls ,18 -  R,6,,Cleaning Products
Ultra Absorbing Power Paper Towels Double Rolls ,18 -  R,6,,Cleaning Products
Ultra Absorbing Power Paper Towels Double Rolls ,18 -  R,6,,Cleaning Products
Brand Broccoli Florets PRODUCE,PRODUCE -  L,3,,Produce
Brand Broccoli Florets PRODUCE,PRODUCE -  L,3,,Produce
Brand Broccoli Florets PRODUCE,PRODUCE -  L,3,,Produce
Brand Broccoli Florets PRODUCE,PRODUCE -  L,3,,Produce
Ultra Absorbing Power Paper Towels Double Rolls ,18 -  R,10,,Cleaning Products
Ultra Absorbing Power Paper Towels Double Rolls ,18 -  R,10,,Cleaning Products
Ultra Absorbing Power Paper Towels Double Rolls ,18 -  R,10,,Cleaning Products
Ultra Absorbing Power Paper Towels Double Rolls ,18 -  R,10,,Cleaning Products
Lean Fresh Ground Turkey MEAT,MEAT -  R,5,,Meat & Seafood
Lean Fresh Ground Turkey MEAT,MEAT -  R,5,,Meat & Seafood
Lean Fresh Ground Turkey MEAT,MEAT -  R,5,,Meat & Seafood
Lean Fresh Ground Turkey MEAT,MEAT -  R,5,,Meat & Seafood
Original White Restaurant Style Tortilla Chips ,12 -  L,3,,Snacks
Original White Restaurant Style Tortilla Chips ,12 -  L,3,,Snacks
Original White Restaurant Style Tortilla Chips ,12 -  L,3,,Snacks
Original White Restaurant Style Tortilla Chips ,12 -  L,3,,Snacks
Singles American Sliced Cheese DAIRY,DAIRY -  R,4,,Dairy
Singles American Sliced Cheese DAIRY,DAIRY -  R,4,,Dairy
Singles American Sliced Cheese DAIRY,DAIRY -  R,4,,Dairy
Singles American Sliced Cheese DAIRY,DAIRY -  R,4,,Dairy
Meal-Ready Sides Frozen Mixed Vegetables ,8 -  R,2,,Frozen
Meal-Ready Sides Frozen Mixed Vegetables ,8 -  R,2,,Frozen
Meal-Ready Sides Frozen Mixed Vegetables ,8 -  R,2,,Frozen
Meal-Ready Sides Frozen Mixed Vegetables ,8 -  R,2,,Frozen
Original Breakfast Sausage Links Packaged Meat,Packaged Meat -  R,4,,Meat & Seafood
Original Breakfast Sausage Links Packaged Meat,Packaged Meat -  R,4,,Meat & Seafood
Original Breakfast Sausage Links Packaged Meat,Packaged Meat -  R,4,,Meat & Seafood
Original Breakfast Sausage Links Packaged Meat,Packaged Meat -  R,4,,Meat & Seafood
Mild Italian Ground Sausage MEAT,MEAT -  R,6,,Meat & Seafood
Mild Italian Ground Sausage MEAT,MEAT -  R,6,,Meat & Seafood
Mild Italian Ground Sausage MEAT,MEAT -  R,6,,Meat & Seafood
Mild Italian Ground Sausage MEAT,MEAT -  R,6,,Meat & Seafood
Flour Tortillas Handmade Style Burrito Size ,4 -  L,3,,International
Flour Tortillas Handmade Style Burrito Size ,4 -  L,3,,International
Flour Tortillas Handmade Style Burrito Size ,4 -  L,3,,International
Flour Tortillas Handmade Style Burrito Size ,4 -  L,3,,International
Tater Bites ,7 -  L,4,,Frozen
Tater Bites ,7 -  L,4,,Frozen
Tater Bites ,7 -  L,4,,Frozen
Tater Bites ,7 -  L,4,,Frozen
Lactose Free 2% Reduced Fat Milk DAIRY,DAIRY -  R,4,,Dairy
Lactose Free 2% Reduced Fat Milk DAIRY,DAIRY -  R,4,,Dairy
Lactose Free 2% Reduced Fat Milk DAIRY,DAIRY -  R,4,,Dairy
Lactose Free 2% Reduced Fat Milk DAIRY,DAIRY -  R,4,,Dairy
85/15 Lean Ground Beef MEAT,MEAT -  R,8,,Meat & Seafood
85/15 Lean Ground Beef MEAT,MEAT -  R,8,,Meat & Seafood
85/15 Lean Ground Beef MEAT,MEAT -  R,8,,Meat & Seafood
85/15 Lean Ground Beef MEAT,MEAT -  R,8,,Meat & Seafood
Wild Caught Chunk Light Tuna in Water ,4 -  R,1,,Canned & Packaged
Wild Caught Chunk Light Tuna in Water ,4 -  R,1,,Canned & Packaged
Wild Caught Chunk Light Tuna in Water ,4 -  R,1,,Canned & Packaged
Wild Caught Chunk Light Tuna in Water ,4 -  R,1,,Canned & Packaged
Powdered Sugar ,6 -  R,3,,Baking Goods
Powdered Sugar ,6 -  R,3,,Baking Goods
Powdered Sugar ,6 -  R,3,,Baking Goods
Powdered Sugar ,6 -  R,3,,Baking Goods
French Vanilla Coffee Creamer DAIRY,DAIRY -  R,3,,Beverages
French Vanilla Coffee Creamer DAIRY,DAIRY -  R,3,,Beverages
French Vanilla Coffee Creamer DAIRY,DAIRY -  R,3,,Beverages
French Vanilla Coffee Creamer DAIRY,DAIRY -  R,3,,Beverages
Baby Spinach PRODUCE,PRODUCE -  L,4,,Produce
Baby Spinach PRODUCE,PRODUCE -  L,4,,Produce
Baby Spinach PRODUCE,PRODUCE -  L,4,,Produce
Baby Spinach PRODUCE,PRODUCE -  L,4,,Produce
Celebration Paper Plates ,18 -  R,4,,Cleaning Products
Celebration Paper Plates ,18 -  R,4,,Cleaning Products
Celebration Paper Plates ,18 -  R,4,,Cleaning Products
Celebration Paper Plates ,18 -  R,4,,Cleaning Products
Hardwood Smoked Sliced Bacon Packaged Meat,Packaged Meat -  R,5,,Meat & Seafood
Hardwood Smoked Sliced Bacon Packaged Meat,Packaged Meat -  R,5,,Meat & Seafood
Hardwood Smoked Sliced Bacon Packaged Meat,Packaged Meat -  R,5,,Meat & Seafood
Hardwood Smoked Sliced Bacon Packaged Meat,Packaged Meat -  R,5,,Meat & Seafood
Pure Canola Oil ,6 -  L,5,,Baking Goods
Pure Canola Oil ,6 -  L,5,,Baking Goods
Pure Canola Oil ,6 -  L,5,,Baking Goods
Pure Canola Oil ,6 -  L,5,,Baking Goods
Crinkle Cut French Fries ,7 -  L,4,,Frozen
Crinkle Cut French Fries ,7 -  L,4,,Frozen
Crinkle Cut French Fries ,7 -  L,4,,Frozen
Crinkle Cut French Fries ,7 -  L,4,,Frozen
Cheddar and Sour Cream Ripples Potato Chips ,12 -  L,2,,Snacks
Cheddar and Sour Cream Ripples Potato Chips ,12 -  L,2,,Snacks
Cheddar and Sour Cream Ripples Potato Chips ,12 -  L,2,,Snacks
Cheddar and Sour Cream Ripples Potato Chips ,12 -  L,2,,Snacks
French Onion Sour Cream Dip & Spread DAIRY,DAIRY -  R,3,,Dairy
French Onion Sour Cream Dip & Spread DAIRY,DAIRY -  R,3,,Dairy
French Onion Sour Cream Dip & Spread DAIRY,DAIRY -  R,3,,Dairy
French Onion Sour Cream Dip & Spread DAIRY,DAIRY -  R,3,,Dairy
Grade A Jumbo White Eggs DAIRY,DAIRY -  R,3,,Breakfast
Grade A Jumbo White Eggs DAIRY,DAIRY -  R,3,,Breakfast
Grade A Jumbo White Eggs DAIRY,DAIRY -  R,3,,Breakfast
Grade A Jumbo White Eggs DAIRY,DAIRY -  R,3,,Breakfast
Traditional Pork Sausage Patties Packaged Meat,Packaged Meat -  R,4,,Meat & Seafood
Traditional Pork Sausage Patties Packaged Meat,Packaged Meat -  R,4,,Meat & Seafood
Traditional Pork Sausage Patties Packaged Meat,Packaged Meat -  R,4,,Meat & Seafood
Traditional Pork Sausage Patties Packaged Meat,Packaged Meat -  R,4,,Meat & Seafood
Large White Eggs DAIRY,DAIRY -  R,2,,Breakfast
Large White Eggs DAIRY,DAIRY -  R,2,,Breakfast
Large White Eggs DAIRY,DAIRY -  R,2,,Breakfast
Large White Eggs DAIRY,DAIRY -  R,2,,Breakfast
Lightly Salted Wavy Potato Chips ,12 -  L,2,,Snacks
Lightly Salted Wavy Potato Chips ,12 -  L,2,,Snacks
Lightly Salted Wavy Potato Chips ,12 -  L,2,,Snacks
Lightly Salted Wavy Potato Chips ,12 -  L,2,,Snacks
Tater Rounds Shredded Potatoes ,7 -  L,4,,Frozen
Tater Rounds Shredded Potatoes ,7 -  L,4,,Frozen
Tater Rounds Shredded Potatoes ,7 -  L,4,,Frozen
Tater Rounds Shredded Potatoes ,7 -  L,4,,Frozen
Mozzarella String Cheese DAIRY,DAIRY -  R,6,,Dairy
Mozzarella String Cheese DAIRY,DAIRY -  R,6,,Dairy
Mozzarella String Cheese DAIRY,DAIRY -  R,6,,Dairy
Mozzarella String Cheese DAIRY,DAIRY -  R,6,,Dairy
Clamshell Seedless Red Grapes nan,nan -  nan,8,,Produce
Clamshell Seedless Red Grapes nan,nan -  nan,8,,Produce
Clamshell Seedless Red Grapes nan,nan -  nan,8,,Produce
Clamshell Seedless Red Grapes nan,nan -  nan,8,,Produce
2% Low Fat Small Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
2% Low Fat Small Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
2% Low Fat Small Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
2% Low Fat Small Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
Navel Oranges PRODUCE,PRODUCE -  nan,9,,Produce
Navel Oranges PRODUCE,PRODUCE -  nan,9,,Produce
Navel Oranges PRODUCE,PRODUCE -  nan,9,,Produce
Navel Oranges PRODUCE,PRODUCE -  nan,9,,Produce
Double Zipper Sandwich Bags ,16 -  R,3,,Cleaning Products
Double Zipper Sandwich Bags ,16 -  R,3,,Cleaning Products
Double Zipper Sandwich Bags ,16 -  R,3,,Cleaning Products
Double Zipper Sandwich Bags ,16 -  R,3,,Cleaning Products
Yellow Mustard ,5 -  L,1,,Condiment & Sauces
Yellow Mustard ,5 -  L,1,,Condiment & Sauces
Yellow Mustard ,5 -  L,1,,Condiment & Sauces
Yellow Mustard ,5 -  L,1,,Condiment & Sauces
Whipping Cream DAIRY,DAIRY -  R,4,,Dairy
Whipping Cream DAIRY,DAIRY -  R,4,,Dairy
Whipping Cream DAIRY,DAIRY -  R,4,,Dairy
Whipping Cream DAIRY,DAIRY -  R,4,,Dairy
Garlic Cheese Frozen Texas Toast ,7 -  L,3,,Frozen
Garlic Cheese Frozen Texas Toast ,7 -  L,3,,Frozen
Garlic Cheese Frozen Texas Toast ,7 -  L,3,,Frozen
Garlic Cheese Frozen Texas Toast ,7 -  L,3,,Frozen
Black Beans ,4 -  R,1,,Canned & Packaged
Black Beans ,4 -  R,1,,Canned & Packaged
Black Beans ,4 -  R,1,,Canned & Packaged
Black Beans ,4 -  R,1,,Canned & Packaged
Traditional Favorites Frozen Cut Green Beans ,8 -  R,2,,Frozen
Traditional Favorites Frozen Cut Green Beans ,8 -  R,2,,Frozen
Traditional Favorites Frozen Cut Green Beans ,8 -  R,2,,Frozen
Traditional Favorites Frozen Cut Green Beans ,8 -  R,2,,Frozen
Whole Garlic Bulbs PRODUCE,PRODUCE -  nan,2,,Produce
Whole Garlic Bulbs PRODUCE,PRODUCE -  nan,2,,Produce
Whole Garlic Bulbs PRODUCE,PRODUCE -  nan,2,,Produce
Whole Garlic Bulbs PRODUCE,PRODUCE -  nan,2,,Produce
Tomato Paste ,4 -  R,1,,Canned & Packaged
Tomato Paste ,4 -  R,1,,Canned & Packaged
Tomato Paste ,4 -  R,1,,Canned & Packaged
Tomato Paste ,4 -  R,1,,Canned & Packaged
4% Milkfat Large Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
4% Milkfat Large Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
4% Milkfat Large Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
4% Milkfat Large Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
Mild Pork Sausage Roll Packaged Meat,Packaged Meat -  R,4,,Meat & Seafood
Mild Pork Sausage Roll Packaged Meat,Packaged Meat -  R,4,,Meat & Seafood
Mild Pork Sausage Roll Packaged Meat,Packaged Meat -  R,4,,Meat & Seafood
Mild Pork Sausage Roll Packaged Meat,Packaged Meat -  R,4,,Meat & Seafood
Fruity Mighty Ice Pops GROCERY,GROCERY -  nan,3,,Frozen
Fruity Mighty Ice Pops GROCERY,GROCERY -  nan,3,,Frozen
Fruity Mighty Ice Pops GROCERY,GROCERY -  nan,3,,Frozen
Fruity Mighty Ice Pops GROCERY,GROCERY -  nan,3,,Frozen
Sweetened Condensed Milk ,6 -  L,3,,Baking Goods
Sweetened Condensed Milk ,6 -  L,3,,Baking Goods
Sweetened Condensed Milk ,6 -  L,3,,Baking Goods
Sweetened Condensed Milk ,6 -  L,3,,Baking Goods
Large White Eggs DAIRY,DAIRY -  R,10,,Dairy
Large White Eggs DAIRY,DAIRY -  R,10,,Dairy
Large White Eggs DAIRY,DAIRY -  R,10,,Dairy
Large White Eggs DAIRY,DAIRY -  R,10,,Dairy
Honey Lemon Flavor Cough Drops DRUG/GM,DRUG/GM -  nan,2,,Health
Honey Lemon Flavor Cough Drops DRUG/GM,DRUG/GM -  nan,2,,Health
Honey Lemon Flavor Cough Drops DRUG/GM,DRUG/GM -  nan,2,,Health
Honey Lemon Flavor Cough Drops DRUG/GM,DRUG/GM -  nan,2,,Health
Evaporated Milk ,6 -  L,2,,Baking Goods
Evaporated Milk ,6 -  L,2,,Baking Goods
Evaporated Milk ,6 -  L,2,,Baking Goods
Evaporated Milk ,6 -  L,2,,Baking Goods
Recipe Beginnings Frozen 3 Pepper & Onion Blend ,8 -  R,2,,Frozen
Recipe Beginnings Frozen 3 Pepper & Onion Blend ,8 -  R,2,,Frozen
Recipe Beginnings Frozen 3 Pepper & Onion Blend ,8 -  R,2,,Frozen
Recipe Beginnings Frozen 3 Pepper & Onion Blend ,8 -  R,2,,Frozen
Vanilla Caramel Coffee Creamer DAIRY,DAIRY -  R,3,,Beverages
Vanilla Caramel Coffee Creamer DAIRY,DAIRY -  R,3,,Beverages
Vanilla Caramel Coffee Creamer DAIRY,DAIRY -  R,3,,Beverages
Vanilla Caramel Coffee Creamer DAIRY,DAIRY -  R,3,,Beverages
Zesty Hot Dill Zingers ,5 -  L,3,,Canned & Packaged
Zesty Hot Dill Zingers ,5 -  L,3,,Canned & Packaged
Zesty Hot Dill Zingers ,5 -  L,3,,Canned & Packaged
Zesty Hot Dill Zingers ,5 -  L,3,,Canned & Packaged
Grapefruit Cups PRODUCE,PRODUCE -  L,2,1,Snacks
Grapefruit Cups PRODUCE,PRODUCE -  L,2,1,Snacks
Grapefruit Cups PRODUCE,PRODUCE -  L,2,1,Snacks
Grapefruit Cups PRODUCE,PRODUCE -  L,2,1,Snacks
Grapefruit Cups PRODUCE,PRODUCE -  L,2,1,Snacks
Grapefruit Cups PRODUCE,PRODUCE -  L,2,1,Snacks
Grapefruit Cups PRODUCE,PRODUCE -  L,2,1,Snacks
Grapefruit Cups PRODUCE,PRODUCE -  L,2,1,Snacks
Mandarin Oranges Fruit Cup PRODUCE,PRODUCE -  L,2,1,Snacks
Mandarin Oranges Fruit Cup PRODUCE,PRODUCE -  L,2,1,Snacks
Mandarin Oranges Fruit Cup PRODUCE,PRODUCE -  L,2,1,Snacks
Mandarin Oranges Fruit Cup PRODUCE,PRODUCE -  L,2,1,Snacks
Peach Chunks PRODUCE,PRODUCE -  L,2,1,Snacks
Peach Chunks PRODUCE,PRODUCE -  L,2,1,Snacks
Peach Chunks PRODUCE,PRODUCE -  L,2,1,Snacks
Peach Chunks PRODUCE,PRODUCE -  L,2,1,Snacks
Cherry Fruit Medley Fruit Cup PRODUCE,PRODUCE -  L,2,1,Snacks
Cherry Fruit Medley Fruit Cup PRODUCE,PRODUCE -  L,2,1,Snacks
Cherry Fruit Medley Fruit Cup PRODUCE,PRODUCE -  L,2,1,Snacks
Cherry Fruit Medley Fruit Cup PRODUCE,PRODUCE -  L,2,1,Snacks
Original Tomato Ketchup SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,2,2,Condiment & Sauces
Original Tomato Ketchup SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,2,2,Condiment & Sauces
Original Tomato Ketchup SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,2,2,Condiment & Sauces
Original Tomato Ketchup SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,2,2,Condiment & Sauces
Spaghetti Pasta ,5 -  R,2,2,"Pasta, Sauces, Grain"
Spaghetti Pasta ,5 -  R,2,2,"Pasta, Sauces, Grain"
Spaghetti Pasta ,5 -  R,2,2,"Pasta, Sauces, Grain"
Spaghetti Pasta ,5 -  R,2,2,"Pasta, Sauces, Grain"
Penne Rigate Pasta ,5 -  R,2,2,"Pasta, Sauces, Grain"
Penne Rigate Pasta ,5 -  R,2,2,"Pasta, Sauces, Grain"
Penne Rigate Pasta ,5 -  R,2,2,"Pasta, Sauces, Grain"
Penne Rigate Pasta ,5 -  R,2,2,"Pasta, Sauces, Grain"
Elbow Macaroni ,5 -  R,2,2,"Pasta, Sauces, Grain"
Elbow Macaroni ,5 -  R,2,2,"Pasta, Sauces, Grain"
Elbow Macaroni ,5 -  R,2,2,"Pasta, Sauces, Grain"
Elbow Macaroni ,5 -  R,2,2,"Pasta, Sauces, Grain"
Big K® Cola Soda Bottle ,14 -  L,2,2,Beverages
Big K® Cola Soda Bottle ,14 -  L,2,2,Beverages
Big K® Cola Soda Bottle ,14 -  L,2,2,Beverages
Big K® Cola Soda Bottle ,14 -  L,2,2,Beverages
Facial Tissue ,18 -  L,2,2,Cleaning Products
Facial Tissue ,18 -  L,2,2,Cleaning Products
Facial Tissue ,18 -  L,2,2,Cleaning Products
Facial Tissue ,18 -  L,2,2,Cleaning Products
White Hamburger Buns BACK WALL,BACK WALL -  L,2,2,Bakery
White Hamburger Buns BACK WALL,BACK WALL -  L,2,2,Bakery
White Hamburger Buns BACK WALL,BACK WALL -  L,2,2,Bakery
White Hamburger Buns BACK WALL,BACK WALL -  L,2,2,Bakery
White Hot Dog Buns BACK WALL,BACK WALL -  L,2,2,Bakery
White Hot Dog Buns BACK WALL,BACK WALL -  L,2,2,Bakery
White Hot Dog Buns BACK WALL,BACK WALL -  L,2,2,Bakery
White Hot Dog Buns BACK WALL,BACK WALL -  L,2,2,Bakery
White Bread BACK WALL,BACK WALL -  L,2,2,Bakery
White Bread BACK WALL,BACK WALL -  L,2,2,Bakery
White Bread BACK WALL,BACK WALL -  L,2,2,Bakery
White Bread BACK WALL,BACK WALL -  L,2,2,Bakery
Honey Wheat Bread BACK WALL,BACK WALL -  L,3,2,Bakery
Honey Wheat Bread BACK WALL,BACK WALL -  L,3,2,Bakery
Honey Wheat Bread BACK WALL,BACK WALL -  L,3,2,Bakery
Honey Wheat Bread BACK WALL,BACK WALL -  L,3,2,Bakery
White Bread BACK WALL,BACK WALL -  L,2,2,Bakery
White Bread BACK WALL,BACK WALL -  L,2,2,Bakery
White Bread BACK WALL,BACK WALL -  L,2,2,Bakery
White Bread BACK WALL,BACK WALL -  L,2,2,Bakery
Soft Wheat Bread BACK WALL,BACK WALL -  L,2,2,Bakery
Soft Wheat Bread BACK WALL,BACK WALL -  L,2,2,Bakery
Soft Wheat Bread BACK WALL,BACK WALL -  L,2,2,Bakery
Soft Wheat Bread BACK WALL,BACK WALL -  L,2,2,Bakery
Strawberry Applesauce Cups ,4 -  R,3,2,Snacks
Strawberry Applesauce Cups ,4 -  R,3,2,Snacks
Strawberry Applesauce Cups ,4 -  R,3,2,Snacks
Strawberry Applesauce Cups ,4 -  R,3,2,Snacks
Unsweetened Applesauce Cups ,4 -  R,3,2,Snacks
Unsweetened Applesauce Cups ,4 -  R,3,2,Snacks
Unsweetened Applesauce Cups ,4 -  R,3,2,Snacks
Unsweetened Applesauce Cups ,4 -  R,3,2,Snacks
Classic Applesauce Cups ,4 -  R,3,2,Snacks
Classic Applesauce Cups ,4 -  R,3,2,Snacks
Classic Applesauce Cups ,4 -  R,3,2,Snacks
Classic Applesauce Cups ,4 -  R,3,2,Snacks
Cinnamon Applesauce Cups ,4 -  R,3,2,Snacks
Cinnamon Applesauce Cups ,4 -  R,3,2,Snacks
Cinnamon Applesauce Cups ,4 -  R,3,2,Snacks
Cinnamon Applesauce Cups ,4 -  R,3,2,Snacks
Lean Ground Beef Chuck Roll MEAT,MEAT -  R,16,12,Meat & Seafood
Lean Ground Beef Chuck Roll MEAT,MEAT -  R,16,12,Meat & Seafood
Lean Ground Beef Chuck Roll MEAT,MEAT -  R,16,12,Meat & Seafood
Lean Ground Beef Chuck Roll MEAT,MEAT -  R,16,12,Meat & Seafood
5 lb. Ground Beef Roll 73/27 MEAT,MEAT -  R,19,18,Meat & Seafood
5 lb. Ground Beef Roll 73/27 MEAT,MEAT -  R,19,18,Meat & Seafood
5 lb. Ground Beef Roll 73/27 MEAT,MEAT -  R,19,18,Meat & Seafood
5 lb. Ground Beef Roll 73/27 MEAT,MEAT -  R,19,18,Meat & Seafood
Coleslaw Mix 16 oz PRODUCE,PRODUCE -  L,3,2,Produce
Coleslaw Mix 16 oz PRODUCE,PRODUCE -  L,3,2,Produce
Coleslaw Mix 16 oz PRODUCE,PRODUCE -  L,3,2,Produce
Coleslaw Mix 16 oz PRODUCE,PRODUCE -  L,3,2,Produce
Tri-Color Coleslaw PRODUCE,PRODUCE -  L,3,2,Produce
Tri-Color Coleslaw PRODUCE,PRODUCE -  L,3,2,Produce
Tri-Color Coleslaw PRODUCE,PRODUCE -  L,3,2,Produce
Tri-Color Coleslaw PRODUCE,PRODUCE -  L,3,2,Produce
Mexican Style Blend Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Mexican Style Blend Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Mexican Style Blend Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Mexican Style Blend Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Sharp Cheddar Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Sharp Cheddar Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Sharp Cheddar Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Sharp Cheddar Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Mozzarella Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Mozzarella Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Mozzarella Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Mozzarella Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Parmesan Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Parmesan Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Parmesan Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Parmesan Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Colby Jack Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Colby Jack Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Colby Jack Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Colby Jack Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Mild Cheddar Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Mild Cheddar Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Mild Cheddar Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Mild Cheddar Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Whole Milk Mozzarella Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Whole Milk Mozzarella Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Whole Milk Mozzarella Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Whole Milk Mozzarella Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Medium Cheddar Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Medium Cheddar Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Medium Cheddar Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Medium Cheddar Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Cheddar Jack Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Cheddar Jack Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Cheddar Jack Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Cheddar Jack Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Reduced Fat Mexican Style Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Reduced Fat Mexican Style Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Reduced Fat Mexican Style Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Reduced Fat Mexican Style Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Colby Jack Block Cheese DAIRY,DAIRY -  R,3,3,Dairy
Colby Jack Block Cheese DAIRY,DAIRY -  R,3,3,Dairy
Colby Jack Block Cheese DAIRY,DAIRY -  R,3,3,Dairy
Colby Jack Block Cheese DAIRY,DAIRY -  R,3,3,Dairy
Italian Style Blend Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Italian Style Blend Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Italian Style Blend Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Italian Style Blend Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Sharp Cheddar Block Cheese DAIRY,DAIRY -  R,3,3,Dairy
Sharp Cheddar Block Cheese DAIRY,DAIRY -  R,3,3,Dairy
Sharp Cheddar Block Cheese DAIRY,DAIRY -  R,3,3,Dairy
Sharp Cheddar Block Cheese DAIRY,DAIRY -  R,3,3,Dairy
Nacho & Taco Blend Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Nacho & Taco Blend Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Nacho & Taco Blend Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Nacho & Taco Blend Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Creamy Ranch Salad Dressing SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,3,3,Condiment & Sauces
Creamy Ranch Salad Dressing SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,3,3,Condiment & Sauces
Creamy Ranch Salad Dressing SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,3,3,Condiment & Sauces
Creamy Ranch Salad Dressing SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,3,3,Condiment & Sauces
Kosher Sandwich Slims Dill Pickles ,5 -  L,3,3,Canned & Packaged
Kosher Sandwich Slims Dill Pickles ,5 -  L,3,3,Canned & Packaged
Kosher Sandwich Slims Dill Pickles ,5 -  L,3,3,Canned & Packaged
Kosher Sandwich Slims Dill Pickles ,5 -  L,3,3,Canned & Packaged
Whole Sweet Gherkins Pickles ,5 -  L,4,3,Canned & Packaged
Whole Sweet Gherkins Pickles ,5 -  L,4,3,Canned & Packaged
Whole Sweet Gherkins Pickles ,5 -  L,4,3,Canned & Packaged
Whole Sweet Gherkins Pickles ,5 -  L,4,3,Canned & Packaged
Tropical Fruit Cups in 100% Juice ,4 -  R,3,3,Snacks
Tropical Fruit Cups in 100% Juice ,4 -  R,3,3,Snacks
Tropical Fruit Cups in 100% Juice ,4 -  R,3,3,Snacks
Tropical Fruit Cups in 100% Juice ,4 -  R,3,3,Snacks
Cherry Mixed Fruit Cups in 100% Juice ,4 -  R,3,3,Snacks
Cherry Mixed Fruit Cups in 100% Juice ,4 -  R,3,3,Snacks
Cherry Mixed Fruit Cups in 100% Juice ,4 -  R,3,3,Snacks
Cherry Mixed Fruit Cups in 100% Juice ,4 -  R,3,3,Snacks
Diced Mango Cups in 100% Juice ,4 -  R,3,3,Snacks
Diced Mango Cups in 100% Juice ,4 -  R,3,3,Snacks
Diced Mango Cups in 100% Juice ,4 -  R,3,3,Snacks
Diced Mango Cups in 100% Juice ,4 -  R,3,3,Snacks
Yellow Cling Diced Peach Cups in 100% Juice ,4 -  R,3,3,Snacks
Yellow Cling Diced Peach Cups in 100% Juice ,4 -  R,3,3,Snacks
Yellow Cling Diced Peach Cups in 100% Juice ,4 -  R,3,3,Snacks
Yellow Cling Diced Peach Cups in 100% Juice ,4 -  R,3,3,Snacks
Mandarin Orange Cups No Sugar Added ,4 -  R,3,3,Snacks
Mandarin Orange Cups No Sugar Added ,4 -  R,3,3,Snacks
Mandarin Orange Cups No Sugar Added ,4 -  R,3,3,Snacks
Mandarin Orange Cups No Sugar Added ,4 -  R,3,3,Snacks
Mandarin Orange Cups in 100% Juice ,4 -  R,3,3,Snacks
Mandarin Orange Cups in 100% Juice ,4 -  R,3,3,Snacks
Mandarin Orange Cups in 100% Juice ,4 -  R,3,3,Snacks
Mandarin Orange Cups in 100% Juice ,4 -  R,3,3,Snacks
Yellow Cling Diced Peach Cups No Sugar Added ,4 -  R,3,3,Snacks
Yellow Cling Diced Peach Cups No Sugar Added ,4 -  R,3,3,Snacks
Yellow Cling Diced Peach Cups No Sugar Added ,4 -  R,3,3,Snacks
Yellow Cling Diced Peach Cups No Sugar Added ,4 -  R,3,3,Snacks
Pineapple Tidbits Cups in 100% Pineapple Juice ,4 -  R,3,3,Snacks
Pineapple Tidbits Cups in 100% Pineapple Juice ,4 -  R,3,3,Snacks
Pineapple Tidbits Cups in 100% Pineapple Juice ,4 -  R,3,3,Snacks
Pineapple Tidbits Cups in 100% Pineapple Juice ,4 -  R,3,3,Snacks
Diced Pear Cups in 100% Juice ,4 -  R,3,3,Snacks
Diced Pear Cups in 100% Juice ,4 -  R,3,3,Snacks
Diced Pear Cups in 100% Juice ,4 -  R,3,3,Snacks
Diced Pear Cups in 100% Juice ,4 -  R,3,3,Snacks
Mixed Fruit Cups in 100% Juice ,4 -  R,3,3,Snacks
Mixed Fruit Cups in 100% Juice ,4 -  R,3,3,Snacks
Mixed Fruit Cups in 100% Juice ,4 -  R,3,3,Snacks
Mixed Fruit Cups in 100% Juice ,4 -  R,3,3,Snacks
Diced Pear Cups No Sugar Added ,4 -  R,3,3,Snacks
Diced Pear Cups No Sugar Added ,4 -  R,3,3,Snacks
Diced Pear Cups No Sugar Added ,4 -  R,3,3,Snacks
Diced Pear Cups No Sugar Added ,4 -  R,3,3,Snacks
American Sliced Cheese Singles DAIRY,DAIRY -  R,3,3,Dairy
American Sliced Cheese Singles DAIRY,DAIRY -  R,3,3,Dairy
American Sliced Cheese Singles DAIRY,DAIRY -  R,3,3,Dairy
American Sliced Cheese Singles DAIRY,DAIRY -  R,3,3,Dairy
Colby Jack Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Colby Jack Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Colby Jack Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Colby Jack Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Swiss Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Swiss Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Swiss Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Swiss Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Pepper Jack Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Pepper Jack Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Pepper Jack Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Pepper Jack Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Smoke Flavored Provolone Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Smoke Flavored Provolone Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Smoke Flavored Provolone Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Smoke Flavored Provolone Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Medium Cheddar Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Medium Cheddar Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Medium Cheddar Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Medium Cheddar Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Vanilla Ice Cream Snowboard Sandwiches GROCERY,GROCERY -  nan,3,3,Frozen
Vanilla Ice Cream Snowboard Sandwiches GROCERY,GROCERY -  nan,3,3,Frozen
Vanilla Ice Cream Snowboard Sandwiches GROCERY,GROCERY -  nan,3,3,Frozen
Vanilla Ice Cream Snowboard Sandwiches GROCERY,GROCERY -  nan,3,3,Frozen
Grade A Large White Eggs DAIRY,DAIRY -  R,3,3,Breakfast
Grade A Large White Eggs DAIRY,DAIRY -  R,3,3,Breakfast
Grade A Large White Eggs DAIRY,DAIRY -  R,3,3,Breakfast
Grade A Large White Eggs DAIRY,DAIRY -  R,3,3,Breakfast
Deluxe Vividly Vanilla Ice Cream Tub ,9 -  R,3,3,Frozen
Deluxe Vividly Vanilla Ice Cream Tub ,9 -  R,3,3,Frozen
Deluxe Vividly Vanilla Ice Cream Tub ,9 -  R,3,3,Frozen
Deluxe Vividly Vanilla Ice Cream Tub ,9 -  R,3,3,Frozen
Sliced Pepperoni MEAT,MEAT -  L,3,3,Meat & Seafood
Sliced Pepperoni MEAT,MEAT -  L,3,3,Meat & Seafood
Sliced Pepperoni MEAT,MEAT -  L,3,3,Meat & Seafood
Sliced Pepperoni MEAT,MEAT -  L,3,3,Meat & Seafood
Vanilla Ice Cream Snowboard Sandwiches ,9 -  R,3,3,Frozen
Vanilla Ice Cream Snowboard Sandwiches ,9 -  R,3,3,Frozen
Vanilla Ice Cream Snowboard Sandwiches ,9 -  R,3,3,Frozen
Vanilla Ice Cream Snowboard Sandwiches ,9 -  R,3,3,Frozen
Deluxe Cookies N' Cream Ice Cream Tub ,9 -  R,3,3,Frozen
Deluxe Cookies N' Cream Ice Cream Tub ,9 -  R,3,3,Frozen
Deluxe Cookies N' Cream Ice Cream Tub ,9 -  R,3,3,Frozen
Deluxe Cookies N' Cream Ice Cream Tub ,9 -  R,3,3,Frozen
Deluxe Artisan Vanilla Bean Ice Cream Tub ,9 -  R,3,3,Frozen
Deluxe Artisan Vanilla Bean Ice Cream Tub ,9 -  R,3,3,Frozen
Deluxe Artisan Vanilla Bean Ice Cream Tub ,9 -  R,3,3,Frozen
Deluxe Artisan Vanilla Bean Ice Cream Tub ,9 -  R,3,3,Frozen
Unsweetened Applesauce ,4 -  R,4,3,Snacks
Unsweetened Applesauce ,4 -  R,4,3,Snacks
Unsweetened Applesauce ,4 -  R,4,3,Snacks
Unsweetened Applesauce ,4 -  R,4,3,Snacks
Classic Applesauce ,4 -  R,4,3,Snacks
Classic Applesauce ,4 -  R,4,3,Snacks
Classic Applesauce ,4 -  R,4,3,Snacks
Classic Applesauce ,4 -  R,4,3,Snacks
Cinnamon Applesauce ,4 -  R,4,3,Snacks
Cinnamon Applesauce ,4 -  R,4,3,Snacks
Cinnamon Applesauce ,4 -  R,4,3,Snacks
Cinnamon Applesauce ,4 -  R,4,3,Snacks
Fruity Freezer Pops GROCERY,GROCERY -  L,4,3,Frozen
Fruity Freezer Pops GROCERY,GROCERY -  L,4,3,Frozen
Fruity Freezer Pops GROCERY,GROCERY -  L,4,3,Frozen
Fruity Freezer Pops GROCERY,GROCERY -  L,4,3,Frozen
Classic Wavy Potato Chips Family Size ,12 -  L,4,3,Snacks
Classic Wavy Potato Chips Family Size ,12 -  L,4,3,Snacks
Classic Wavy Potato Chips Family Size ,12 -  L,4,3,Snacks
Classic Wavy Potato Chips Family Size ,12 -  L,4,3,Snacks
1000 Sheets per Roll Toilet Paper ,18 -  L,4,3,Cleaning Products
1000 Sheets per Roll Toilet Paper ,18 -  L,4,3,Cleaning Products
1000 Sheets per Roll Toilet Paper ,18 -  L,4,3,Cleaning Products
1000 Sheets per Roll Toilet Paper ,18 -  L,4,3,Cleaning Products
Fully Cooked Hardwood Smoke Flavor Traditional Bacon MEAT,MEAT -  L,4,4,Meat & Seafood
Fully Cooked Hardwood Smoke Flavor Traditional Bacon MEAT,MEAT -  L,4,4,Meat & Seafood
Fully Cooked Hardwood Smoke Flavor Traditional Bacon MEAT,MEAT -  L,4,4,Meat & Seafood
Fully Cooked Hardwood Smoke Flavor Traditional Bacon MEAT,MEAT -  L,4,4,Meat & Seafood
Purified Mini Bottled Water ,14 -  R,5,4,Beverages
Purified Mini Bottled Water ,14 -  R,5,4,Beverages
Purified Mini Bottled Water ,14 -  R,5,4,Beverages
Purified Mini Bottled Water ,14 -  R,5,4,Beverages
Chicken Caesar Salad Kit For One PRODUCE,PRODUCE -  L,4,4,Deli
Chicken Caesar Salad Kit For One PRODUCE,PRODUCE -  L,4,4,Deli
Chicken Caesar Salad Kit For One PRODUCE,PRODUCE -  L,4,4,Deli
Chicken Caesar Salad Kit For One PRODUCE,PRODUCE -  L,4,4,Deli
Santa Fe Salad Bowl PRODUCE,PRODUCE -  L,4,4,Produce
Santa Fe Salad Bowl PRODUCE,PRODUCE -  L,4,4,Produce
Santa Fe Salad Bowl PRODUCE,PRODUCE -  L,4,4,Produce
Santa Fe Salad Bowl PRODUCE,PRODUCE -  L,4,4,Produce
Chef Salad Kit For One PRODUCE,PRODUCE -  L,4,4,Deli
Chef Salad Kit For One PRODUCE,PRODUCE -  L,4,4,Deli
Chef Salad Kit For One PRODUCE,PRODUCE -  L,4,4,Deli
Chef Salad Kit For One PRODUCE,PRODUCE -  L,4,4,Deli
Aluminum Foil ,16 -  R,5,4,Cleaning Products
Aluminum Foil ,16 -  R,5,4,Cleaning Products
Aluminum Foil ,16 -  R,5,4,Cleaning Products
Aluminum Foil ,16 -  R,5,4,Cleaning Products
Fresh Lemons,PRODUCE -  nan,5,4,Produce
Fresh Lemons,PRODUCE -  nan,5,4,Produce
Fresh Lemons,PRODUCE -  nan,5,4,Produce
Fresh Lemons,PRODUCE -  nan,5,4,Produce
Clover Honey Bear SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,5,4,Condiment & Sauces
Clover Honey Bear SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,5,4,Condiment & Sauces
Clover Honey Bear SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,5,4,Condiment & Sauces
Clover Honey Bear SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,5,4,Condiment & Sauces
Heavy Duty Aluminum Foil ,16 -  R,5,4,Cleaning Products
Heavy Duty Aluminum Foil ,16 -  R,5,4,Cleaning Products
Heavy Duty Aluminum Foil ,16 -  R,5,4,Cleaning Products
Heavy Duty Aluminum Foil ,16 -  R,5,4,Cleaning Products
Soft & Strong Toilet Paper Double Roll ,18 -  L,8,6,Cleaning Products
Soft & Strong Toilet Paper Double Roll ,18 -  L,8,6,Cleaning Products
Soft & Strong Toilet Paper Double Roll ,18 -  L,8,6,Cleaning Products
Soft & Strong Toilet Paper Double Roll ,18 -  L,8,6,Cleaning Products
---
---
---
---
store layout:
store layout:
store layout:
store layout:
---
---
---
---
Map Layout Description
Map Layout Description
Map Layout Description
Map Layout Description
North Section (from west to east):
North Section (from west to east):
North Section (from west to east):
North Section (from west to east):
Dairy, Alcoholic Drinks, Snacks, Fish, Soft Drinks, Cosmetics, Toys, Paper Products.
Dairy, Alcoholic Drinks, Snacks, Fish, Soft Drinks, Cosmetics, Toys, Paper Products.
Dairy, Alcoholic Drinks, Snacks, Fish, Soft Drinks, Cosmetics, Toys, Paper Products.
Dairy, Alcoholic Drinks, Snacks, Fish, Soft Drinks, Cosmetics, Toys, Paper Products.
West Section (from north to south):
West Section (from north to south):
West Section (from north to south):
West Section (from north to south):
Bakery, Frozen Food.
Bakery, Frozen Food.
Bakery, Frozen Food.
Bakery, Frozen Food.
Central Section:
Central Section:
Central Section:
Central Section:
Left Side: Poultry, Deli, Side Dish, Meat, Cheese.
Left Side: Poultry, Deli, Side Dish, Meat, Cheese.
Left Side: Poultry, Deli, Side Dish, Meat, Cheese.
Left Side: Poultry, Deli, Side Dish, Meat, Cheese.
Right Side: Fruits, Vegetables.
Right Side: Fruits, Vegetables.
Right Side: Fruits, Vegetables.
Right Side: Fruits, Vegetables.
East Section (from north to south):
East Section (from north to south):
East Section (from north to south):
East Section (from north to south):
Electronics, Detergent, Cleaning.
Electronics, Detergent, Cleaning.
Electronics, Detergent, Cleaning.
Electronics, Detergent, Cleaning.
South Section (from west to east):
South Section (from west to east):
South Section (from west to east):
South Section (from west to east):
Books & Magazines, Season, Oil & Spices.
Books & Magazines, Season, Oil & Spices.
Books & Magazines, Season, Oil & Spices.
Books & Magazines, Season, Oil & Spices.
Middle Aisles (from west to east):
Middle Aisles (from west to east):
Middle Aisles (from west to east):
Middle Aisles (from west to east):
Soft Drinks, Coffee & Tea, Chocolate, Oil & Spices, Household (multiple aisles), Pet, Textile (multiple aisles).
Soft Drinks, Coffee & Tea, Chocolate, Oil & Spices, Household (multiple aisles), Pet, Textile (multiple aisles).
Soft Drinks, Coffee & Tea, Chocolate, Oil & Spices, Household (multiple aisles), Pet, Textile (multiple aisles).
Soft Drinks, Coffee & Tea, Chocolate, Oil & Spices, Household (multiple aisles), Pet, Textile (multiple aisles).
Cashiers: Located just north of the entrance/exit.
Cashiers: Located just north of the entrance/exit.
Cashiers: Located just north of the entrance/exit.
Cashiers: Located just north of the entrance/exit.
Directions
Directions
Directions
Directions
Straight: Moving from south to north.
Straight: Moving from south to north.
Straight: Moving from south to north.
Straight: Moving from south to north.
Left: Moving from west to east(if facing north) or east to west(if facing south) depending on the current facing direction.
Left: Moving from west to east(if facing north) or east to west(if facing south) depending on the current facing direction.
Left: Moving from west to east(if facing north) or east to west(if facing south) depending on the current facing direction.
Left: Moving from west to east(if facing north) or east to west(if facing south) depending on the current facing direction.
Right: Moving from east to west(if facing south) or west to east(if facing north) depending on the current facing direction.
Right: Moving from east to west(if facing south) or west to east(if facing north) depending on the current facing direction.
Right: Moving from east to west(if facing south) or west to east(if facing north) depending on the current facing direction.
Right: Moving from east to west(if facing south) or west to east(if facing north) depending on the current facing direction.




store layout:
store layout:
store layout:
store layout:
+--------------------+--------------------+--------+-----+----------+----------+------+--------------+
+--------------------+--------------------+--------+-----+----------+----------+------+--------------+
+--------------------+--------------------+--------+-----+----------+----------+------+--------------+
+--------------------+--------------------+--------+-----+----------+----------+------+--------------+
|       DAIRY       |  ALCOHOLIC DRINKS  | SNACKS | FISH| SOFTDRINK| COSMETICS| TOYS |PAPER PRODUCTS|
|       DAIRY       |  ALCOHOLIC DRINKS  | SNACKS | FISH| SOFTDRINK| COSMETICS| TOYS |PAPER PRODUCTS|
|       DAIRY       |  ALCOHOLIC DRINKS  | SNACKS | FISH| SOFTDRINK| COSMETICS| TOYS |PAPER PRODUCTS|
|       DAIRY       |  ALCOHOLIC DRINKS  | SNACKS | FISH| SOFTDRINK| COSMETICS| TOYS |PAPER PRODUCTS|
+--------------------+--------------------+--------+-----+----------+----------+------+--------------+
+--------------------+--------------------+--------+-----+----------+----------+------+--------------+
+--------------------+--------------------+--------+-----+----------+----------+------+--------------+
+--------------------+--------------------+--------+-----+----------+----------+------+--------------+
|                    |                    |                     Racetrack aisle                     |
|                    |                    |                     Racetrack aisle                     |
|                    |                    |                     Racetrack aisle                     |
|                    |                    |                     Racetrack aisle                     |
|                    |                    |                                                          |
|                    |                    |                                                          |
|                    |                    |                                                          |
|                    |                    |                                                          |
|     POULTRY        |       FRUITS       |                                                          |
|     POULTRY        |       FRUITS       |                                                          |
|     POULTRY        |       FRUITS       |                                                          |
|     POULTRY        |       FRUITS       |                                                          |
|                    |                    |                                                          |
|                    |                    |                                                          |
|                    |                    |                                                          |
|                    |                    |                                                          |
|      DELI          |  SIDE DISH CHEESE  |                                                          |
|      DELI          |  SIDE DISH CHEESE  |                                                          |
|      DELI          |  SIDE DISH CHEESE  |                                                          |
|      DELI          |  SIDE DISH CHEESE  |                                                          |
|                    |                    |                     VEGETABLES                            |
|                    |                    |                     VEGETABLES                            |
|                    |                    |                     VEGETABLES                            |
|                    |                    |                     VEGETABLES                            |
| SIDE DISH MEAT LOAF|                    |                                                          |
| SIDE DISH MEAT LOAF|                    |                                                          |
| SIDE DISH MEAT LOAF|                    |                                                          |
| SIDE DISH MEAT LOAF|                    |                                                          |
|                    |                    |                                                          |
|                    |                    |                                                          |
|                    |                    |                                                          |
|                    |                    |                                                          |
|                    |                    |   AND                                                    |
|                    |                    |   AND                                                    |
|                    |                    |   AND                                                    |
|                    |                    |   AND                                                    |
|                    |                    |                                                          |
|                    |                    |                                                          |
|                    |                    |                                                          |
|                    |                    |                                                          |
|                    |                    |            FRUITS                                        |
|                    |                    |            FRUITS                                        |
|                    |                    |            FRUITS                                        |
|                    |                    |            FRUITS                                        |
+--------------------+--------------------+--------+-----+----------+----------+------+--------------+
+--------------------+--------------------+--------+-----+----------+----------+------+--------------+
+--------------------+--------------------+--------+-----+----------+----------+------+--------------+
+--------------------+--------------------+--------+-----+----------+----------+------+--------------+
cashiers
cashiers
cashiers
cashiers
O O O O O
O O O O O
O O O O O
O O O O O
EXIT                             ENTER
EXIT                             ENTER
EXIT                             ENTER
EXIT                             ENTER
+-----------+
+-----------+
+-----------+
+-----------+
|   BOOKS   |
|   BOOKS   |
|   BOOKS   |
|   BOOKS   |
| MAGAZINES |
| MAGAZINES |
| MAGAZINES |
| MAGAZINES |
+-----------+
+-----------+
+-----------+
+-----------+
|  SEASON   |
|  SEASON   |
|  SEASON   |
|  SEASON   |
|OIL+SPICES |
|OIL+SPICES |
|OIL+SPICES |
|OIL+SPICES |
+-----------+
+-----------+
+-----------+
+-----------+
---
---
---
---




---------
---------
---------
---------




You are a helpful, harmless, and honest grocery store assistant. Please answer the users questions briefly, be concise.
You are a helpful, harmless, and honest grocery store assistant. Please answer the users questions briefly, be concise.
You are a helpful, harmless, and honest grocery store assistant. Please answer the users questions briefly, be concise.
You are a helpful, harmless, and honest grocery store assistant. Please answer the users questions briefly, be concise.




Reply with only 1 sentence, specifically limiting your response to only the answer to the user and nothing else.
Reply with only 1 sentence, specifically limiting your response to only the answer to the user and nothing else.
Reply with only 1 sentence, specifically limiting your response to only the answer to the user and nothing else.
Reply with only 1 sentence, specifically limiting your response to only the answer to the user and nothing else.
Do not continue on to the users next question. They will provide one if needed.
Do not continue on to the users next question. They will provide one if needed.
Do not continue on to the users next question. They will provide one if needed.
Do not continue on to the users next question. They will provide one if needed.
Do not explain who you are, they understand through the context of their environment.
Do not explain who you are, they understand through the context of their environment.
Do not explain who you are, they understand through the context of their environment.
Do not explain who you are, they understand through the context of their environment.
Don't use emojis in your response.
Don't use emojis in your response.
Don't use emojis in your response.
Don't use emojis in your response.




ALWAYS respond in character,
ALWAYS respond in character,
ALWAYS respond in character,
ALWAYS respond in character,
NEVER mentioning your instructions or capabilities!!
NEVER mentioning your instructions or capabilities!!
NEVER mentioning your instructions or capabilities!!
NEVER mentioning your instructions or capabilities!!
Keep responses natural and focused solely on answering the customer's question.
Keep responses natural and focused solely on answering the customer's question.
Keep responses natural and focused solely on answering the customer's question.
Keep responses natural and focused solely on answering the customer's question.




Don't be too formal. For example, instead of saying "Hello! How can I assist you today?", say something like "Hey! how's it going. What can I help you with?"
Don't be too formal. For example, instead of saying "Hello! How can I assist you today?", say something like "Hey! how's it going. What can I help you with?"
Don't be too formal. For example, instead of saying "Hello! How can I assist you today?", say something like "Hey! how's it going. What can I help you with?"
Don't be too formal. For example, instead of saying "Hello! How can I assist you today?", say something like "Hey! how's it going. What can I help you with?"




ALWAYS respond with strict Speech Synthesis Markup Language (SSML), like:
ALWAYS respond with strict Speech Synthesis Markup Language (SSML), like:
ALWAYS respond with strict Speech Synthesis Markup Language (SSML), like:
ALWAYS respond with strict Speech Synthesis Markup Language (SSML), like:




<speak>
<speak>
<speak>
<speak>
Here are <say-as interpret-as="characters">SSML</say-as> samples.
Here are <say-as interpret-as="characters">SSML</say-as> samples.
Here are <say-as interpret-as="characters">SSML</say-as> samples.
Here are <say-as interpret-as="characters">SSML</say-as> samples.
I can pause <break time="3s"/>.
I can pause <break time="3s"/>.
I can pause <break time="3s"/>.
I can pause <break time="3s"/>.
I can speak in cardinals. Your number is <say-as interpret-as="cardinal">10</say-as>.
I can speak in cardinals. Your number is <say-as interpret-as="cardinal">10</say-as>.
I can speak in cardinals. Your number is <say-as interpret-as="cardinal">10</say-as>.
I can speak in cardinals. Your number is <say-as interpret-as="cardinal">10</say-as>.
Or I can speak in ordinals. You are <say-as interpret-as="ordinal">10</say-as> in line.
Or I can speak in ordinals. You are <say-as interpret-as="ordinal">10</say-as> in line.
Or I can speak in ordinals. You are <say-as interpret-as="ordinal">10</say-as> in line.
Or I can speak in ordinals. You are <say-as interpret-as="ordinal">10</say-as> in line.
Or I can even speak in digits. The digits for ten are <say-as interpret-as="characters">10</say-as>.
Or I can even speak in digits. The digits for ten are <say-as interpret-as="characters">10</say-as>.
Or I can even speak in digits. The digits for ten are <say-as interpret-as="characters">10</say-as>.
Or I can even speak in digits. The digits for ten are <say-as interpret-as="characters">10</say-as>.
I can also substitute phrases, like the <sub alias="World Wide Web Consortium">W3C</sub>.
I can also substitute phrases, like the <sub alias="World Wide Web Consortium">W3C</sub>.
I can also substitute phrases, like the <sub alias="World Wide Web Consortium">W3C</sub>.
I can also substitute phrases, like the <sub alias="World Wide Web Consortium">W3C</sub>.
Finally, I can speak a paragraph with two sentences.
Finally, I can speak a paragraph with two sentences.
Finally, I can speak a paragraph with two sentences.
Finally, I can speak a paragraph with two sentences.
<p><s>This is sentence one.</s><s>This is sentence two.</s></p>
<p><s>This is sentence one.</s><s>This is sentence two.</s></p>
<p><s>This is sentence one.</s><s>This is sentence two.</s></p>
<p><s>This is sentence one.</s><s>This is sentence two.</s></p>
</speak>
</speak>
</speak>
</speak>




Please provide your response to the users last message in SSML syntax.
Please provide your response to the users last message in SSML syntax.
Please provide your response to the users last message in SSML syntax.
Please provide your response to the users last message in SSML syntax.
`;
`;
`;
`;




async function prepareForStreaming() {
async function prepareForStreaming() {
async function prepareForStreaming() {
async function prepareForStreaming() {
  if (!streamId || !sessionId) {
  if (!streamId || !sessionId) {
  if (!streamId || !sessionId) {
  if (!streamId || !sessionId) {
    throw new Error('Stream ID or Session ID is missing. Cannot prepare for streaming.');
    throw new Error('Stream ID or Session ID is missing. Cannot prepare for streaming.');
    throw new Error('Stream ID or Session ID is missing. Cannot prepare for streaming.');
    throw new Error('Stream ID or Session ID is missing. Cannot prepare for streaming.');
  }
  }
  }
  }




  const streamVideoElement = document.getElementById('stream-video-element');
  const streamVideoElement = document.getElementById('stream-video-element');
  const streamVideoElement = document.getElementById('stream-video-element');
  const streamVideoElement = document.getElementById('stream-video-element');
  const idleVideoElement = document.getElementById('idle-video-element');
  const idleVideoElement = document.getElementById('idle-video-element');
  const idleVideoElement = document.getElementById('idle-video-element');
  const idleVideoElement = document.getElementById('idle-video-element');




  if (!streamVideoElement || !idleVideoElement) {
  if (!streamVideoElement || !idleVideoElement) {
  if (!streamVideoElement || !idleVideoElement) {
  if (!streamVideoElement || !idleVideoElement) {
    throw new Error('Video elements not found');
    throw new Error('Video elements not found');
    throw new Error('Video elements not found');
    throw new Error('Video elements not found');
  }
  }
  }
  }




  // Reset video elements
  // Reset video elements
  // Reset video elements
  // Reset video elements
  streamVideoElement.srcObject = null;
  streamVideoElement.srcObject = null;
  streamVideoElement.srcObject = null;
  streamVideoElement.srcObject = null;
  streamVideoElement.src = '';
  streamVideoElement.src = '';
  streamVideoElement.src = '';
  streamVideoElement.src = '';
  streamVideoElement.style.display = 'none';
  streamVideoElement.style.display = 'none';
  streamVideoElement.style.display = 'none';
  streamVideoElement.style.display = 'none';




  idleVideoElement.style.display = 'block';
  idleVideoElement.style.display = 'block';
  idleVideoElement.style.display = 'block';
  idleVideoElement.style.display = 'block';
  idleVideoElement.play().catch((e) => logger.error('Error playing idle video:', e));
  idleVideoElement.play().catch((e) => logger.error('Error playing idle video:', e));
  idleVideoElement.play().catch((e) => logger.error('Error playing idle video:', e));
  idleVideoElement.play().catch((e) => logger.error('Error playing idle video:', e));




  logger.debug('Prepared for streaming');
  logger.debug('Prepared for streaming');
  logger.debug('Prepared for streaming');
  logger.debug('Prepared for streaming');
}
}
}
}




function initializeTransitionCanvas() {
function initializeTransitionCanvas() {
function initializeTransitionCanvas() {
function initializeTransitionCanvas() {
  const videoWrapper = document.querySelector('#video-wrapper');
  const videoWrapper = document.querySelector('#video-wrapper');
  const videoWrapper = document.querySelector('#video-wrapper');
  const videoWrapper = document.querySelector('#video-wrapper');
  const rect = videoWrapper.getBoundingClientRect();
  const rect = videoWrapper.getBoundingClientRect();
  const rect = videoWrapper.getBoundingClientRect();
  const rect = videoWrapper.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height, 550);
  const size = Math.min(rect.width, rect.height, 550);
  const size = Math.min(rect.width, rect.height, 550);
  const size = Math.min(rect.width, rect.height, 550);




  transitionCanvas = document.createElement('canvas');
  transitionCanvas = document.createElement('canvas');
  transitionCanvas = document.createElement('canvas');
  transitionCanvas = document.createElement('canvas');
  transitionCanvas.width = size;
  transitionCanvas.width = size;
  transitionCanvas.width = size;
  transitionCanvas.width = size;
  transitionCanvas.height = size;
  transitionCanvas.height = size;
  transitionCanvas.height = size;
  transitionCanvas.height = size;
  transitionCtx = transitionCanvas.getContext('2d');
  transitionCtx = transitionCanvas.getContext('2d');
  transitionCtx = transitionCanvas.getContext('2d');
  transitionCtx = transitionCanvas.getContext('2d');




  Object.assign(transitionCanvas.style, {
  Object.assign(transitionCanvas.style, {
  Object.assign(transitionCanvas.style, {
  Object.assign(transitionCanvas.style, {
    position: 'absolute',
    position: 'absolute',
    position: 'absolute',
    position: 'absolute',
    top: '0',
    top: '0',
    top: '0',
    top: '0',
    left: '0',
    left: '0',
    left: '0',
    left: '0',
    width: '100%',
    width: '100%',
    width: '100%',
    width: '100%',
    height: '100%',
    height: '100%',
    height: '100%',
    height: '100%',
    maxWidth: '550px',
    maxWidth: '550px',
    maxWidth: '550px',
    maxWidth: '550px',
    maxHeight: '550px',
    maxHeight: '550px',
    maxHeight: '550px',
    maxHeight: '550px',
    zIndex: '3',
    zIndex: '3',
    zIndex: '3',
    zIndex: '3',
    borderRadius: '13%',
    borderRadius: '13%',
    borderRadius: '13%',
    borderRadius: '13%',
    objectFit: 'cover',
    objectFit: 'cover',
    objectFit: 'cover',
    objectFit: 'cover',
  });
  });
  });
  });




  videoWrapper.appendChild(transitionCanvas);
  videoWrapper.appendChild(transitionCanvas);
  videoWrapper.appendChild(transitionCanvas);
  videoWrapper.appendChild(transitionCanvas);




  window.addEventListener('resize', () => {
  window.addEventListener('resize', () => {
  window.addEventListener('resize', () => {
  window.addEventListener('resize', () => {
    const videoWrapper = document.querySelector('#video-wrapper');
    const videoWrapper = document.querySelector('#video-wrapper');
    const videoWrapper = document.querySelector('#video-wrapper');
    const videoWrapper = document.querySelector('#video-wrapper');
    const rect = videoWrapper.getBoundingClientRect();
    const rect = videoWrapper.getBoundingClientRect();
    const rect = videoWrapper.getBoundingClientRect();
    const rect = videoWrapper.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height, 550);
    const size = Math.min(rect.width, rect.height, 550);
    const size = Math.min(rect.width, rect.height, 550);
    const size = Math.min(rect.width, rect.height, 550);




    transitionCanvas.width = size;
    transitionCanvas.width = size;
    transitionCanvas.width = size;
    transitionCanvas.width = size;
    transitionCanvas.height = size;
    transitionCanvas.height = size;
    transitionCanvas.height = size;
    transitionCanvas.height = size;
  });
  });
  });
  });
}
}
}
}




function smoothTransition(toStreaming, duration = 250) {
function smoothTransition(toStreaming, duration = 250) {
function smoothTransition(toStreaming, duration = 250) {
function smoothTransition(toStreaming, duration = 250) {
  const idleVideoElement = document.getElementById('idle-video-element');
  const idleVideoElement = document.getElementById('idle-video-element');
  const idleVideoElement = document.getElementById('idle-video-element');
  const idleVideoElement = document.getElementById('idle-video-element');
  const streamVideoElement = document.getElementById('stream-video-element');
  const streamVideoElement = document.getElementById('stream-video-element');
  const streamVideoElement = document.getElementById('stream-video-element');
  const streamVideoElement = document.getElementById('stream-video-element');




  if (!idleVideoElement || !streamVideoElement) {
  if (!idleVideoElement || !streamVideoElement) {
  if (!idleVideoElement || !streamVideoElement) {
  if (!idleVideoElement || !streamVideoElement) {
    logger.warn('Video elements not found for transition');
    logger.warn('Video elements not found for transition');
    logger.warn('Video elements not found for transition');
    logger.warn('Video elements not found for transition');
    return;
    return;
    return;
    return;
  }
  }
  }
  }




  if (isTransitioning) {
  if (isTransitioning) {
  if (isTransitioning) {
  if (isTransitioning) {
    logger.debug('Transition already in progress, skipping');
    logger.debug('Transition already in progress, skipping');
    logger.debug('Transition already in progress, skipping');
    logger.debug('Transition already in progress, skipping');
    return;
    return;
    return;
    return;
  }
  }
  }
  }




  // Don't transition if we're already in the desired state
  // Don't transition if we're already in the desired state
  // Don't transition if we're already in the desired state
  // Don't transition if we're already in the desired state
  if ((toStreaming && isCurrentlyStreaming) || (!toStreaming && !isCurrentlyStreaming)) {
  if ((toStreaming && isCurrentlyStreaming) || (!toStreaming && !isCurrentlyStreaming)) {
  if ((toStreaming && isCurrentlyStreaming) || (!toStreaming && !isCurrentlyStreaming)) {
  if ((toStreaming && isCurrentlyStreaming) || (!toStreaming && !isCurrentlyStreaming)) {
    logger.debug('Already in desired state, skipping transition');
    logger.debug('Already in desired state, skipping transition');
    logger.debug('Already in desired state, skipping transition');
    logger.debug('Already in desired state, skipping transition');
    return;
    return;
    return;
    return;
  }
  }
  }
  }




  isTransitioning = true;
  isTransitioning = true;
  isTransitioning = true;
  isTransitioning = true;
  logger.debug(`Starting smooth transition to ${toStreaming ? 'streaming' : 'idle'} state`);
  logger.debug(`Starting smooth transition to ${toStreaming ? 'streaming' : 'idle'} state`);
  logger.debug(`Starting smooth transition to ${toStreaming ? 'streaming' : 'idle'} state`);
  logger.debug(`Starting smooth transition to ${toStreaming ? 'streaming' : 'idle'} state`);




  let startTime = null;
  let startTime = null;
  let startTime = null;
  let startTime = null;




  function animate(currentTime) {
  function animate(currentTime) {
  function animate(currentTime) {
  function animate(currentTime) {
    if (!startTime) startTime = currentTime;
    if (!startTime) startTime = currentTime;
    if (!startTime) startTime = currentTime;
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const elapsed = currentTime - startTime;
    const elapsed = currentTime - startTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const progress = Math.min(elapsed / duration, 1);
    const progress = Math.min(elapsed / duration, 1);
    const progress = Math.min(elapsed / duration, 1);




    transitionCtx.clearRect(0, 0, transitionCanvas.width, transitionCanvas.height);
    transitionCtx.clearRect(0, 0, transitionCanvas.width, transitionCanvas.height);
    transitionCtx.clearRect(0, 0, transitionCanvas.width, transitionCanvas.height);
    transitionCtx.clearRect(0, 0, transitionCanvas.width, transitionCanvas.height);




    // Draw the fading out video
    // Draw the fading out video
    // Draw the fading out video
    // Draw the fading out video
    transitionCtx.globalAlpha = 1 - progress;
    transitionCtx.globalAlpha = 1 - progress;
    transitionCtx.globalAlpha = 1 - progress;
    transitionCtx.globalAlpha = 1 - progress;
    transitionCtx.drawImage(
    transitionCtx.drawImage(
    transitionCtx.drawImage(
    transitionCtx.drawImage(
      toStreaming ? idleVideoElement : streamVideoElement,
      toStreaming ? idleVideoElement : streamVideoElement,
      toStreaming ? idleVideoElement : streamVideoElement,
      toStreaming ? idleVideoElement : streamVideoElement,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      transitionCanvas.width,
      transitionCanvas.width,
      transitionCanvas.width,
      transitionCanvas.width,
      transitionCanvas.height,
      transitionCanvas.height,
      transitionCanvas.height,
      transitionCanvas.height,
    );
    );
    );
    );




    // Draw the fading in video
    // Draw the fading in video
    // Draw the fading in video
    // Draw the fading in video
    transitionCtx.globalAlpha = progress;
    transitionCtx.globalAlpha = progress;
    transitionCtx.globalAlpha = progress;
    transitionCtx.globalAlpha = progress;
    transitionCtx.drawImage(
    transitionCtx.drawImage(
    transitionCtx.drawImage(
    transitionCtx.drawImage(
      toStreaming ? streamVideoElement : idleVideoElement,
      toStreaming ? streamVideoElement : idleVideoElement,
      toStreaming ? streamVideoElement : idleVideoElement,
      toStreaming ? streamVideoElement : idleVideoElement,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      transitionCanvas.width,
      transitionCanvas.width,
      transitionCanvas.width,
      transitionCanvas.width,
      transitionCanvas.height,
      transitionCanvas.height,
      transitionCanvas.height,
      transitionCanvas.height,
    );
    );
    );
    );




    if (progress < 1) {
    if (progress < 1) {
    if (progress < 1) {
    if (progress < 1) {
      requestAnimationFrame(animate);
      requestAnimationFrame(animate);
      requestAnimationFrame(animate);
      requestAnimationFrame(animate);
    } else {
    } else {
    } else {
    } else {
      // Ensure final state is set correctly
      // Ensure final state is set correctly
      // Ensure final state is set correctly
      // Ensure final state is set correctly
      if (toStreaming) {
      if (toStreaming) {
      if (toStreaming) {
      if (toStreaming) {
        streamVideoElement.style.display = 'block';
        streamVideoElement.style.display = 'block';
        streamVideoElement.style.display = 'block';
        streamVideoElement.style.display = 'block';
        idleVideoElement.style.display = 'none';
        idleVideoElement.style.display = 'none';
        idleVideoElement.style.display = 'none';
        idleVideoElement.style.display = 'none';
      } else {
      } else {
      } else {
      } else {
        streamVideoElement.style.display = 'none';
        streamVideoElement.style.display = 'none';
        streamVideoElement.style.display = 'none';
        streamVideoElement.style.display = 'none';
        idleVideoElement.style.display = 'block';
        idleVideoElement.style.display = 'block';
        idleVideoElement.style.display = 'block';
        idleVideoElement.style.display = 'block';
      }
      }
      }
      }
      isTransitioning = false;
      isTransitioning = false;
      isTransitioning = false;
      isTransitioning = false;
      isCurrentlyStreaming = toStreaming;
      isCurrentlyStreaming = toStreaming;
      isCurrentlyStreaming = toStreaming;
      isCurrentlyStreaming = toStreaming;
      transitionCanvas.style.display = 'none';
      transitionCanvas.style.display = 'none';
      transitionCanvas.style.display = 'none';
      transitionCanvas.style.display = 'none';
      logger.debug('Smooth transition completed');
      logger.debug('Smooth transition completed');
      logger.debug('Smooth transition completed');
      logger.debug('Smooth transition completed');
    }
    }
    }
    }
  }
  }
  }
  }




  // Show the transition canvas
  // Show the transition canvas
  // Show the transition canvas
  // Show the transition canvas
  transitionCanvas.style.display = 'block';
  transitionCanvas.style.display = 'block';
  transitionCanvas.style.display = 'block';
  transitionCanvas.style.display = 'block';




  // Start the animation
  // Start the animation
  // Start the animation
  // Start the animation
  requestAnimationFrame(animate);
  requestAnimationFrame(animate);
  requestAnimationFrame(animate);
  requestAnimationFrame(animate);
}
}
}
}




function getVideoElements() {
function getVideoElements() {
function getVideoElements() {
function getVideoElements() {
  const idle = document.getElementById('idle-video-element');
  const idle = document.getElementById('idle-video-element');
  const idle = document.getElementById('idle-video-element');
  const idle = document.getElementById('idle-video-element');
  const stream = document.getElementById('stream-video-element');
  const stream = document.getElementById('stream-video-element');
  const stream = document.getElementById('stream-video-element');
  const stream = document.getElementById('stream-video-element');




  if (!idle || !stream) {
  if (!idle || !stream) {
  if (!idle || !stream) {
  if (!idle || !stream) {
    logger.warn('Video elements not found in the DOM');
    logger.warn('Video elements not found in the DOM');
    logger.warn('Video elements not found in the DOM');
    logger.warn('Video elements not found in the DOM');
  }
  }
  }
  }




  return { idle, stream };
  return { idle, stream };
  return { idle, stream };
  return { idle, stream };
}
}
}
}




function getStatusLabels() {
function getStatusLabels() {
function getStatusLabels() {
function getStatusLabels() {
  return {
  return {
  return {
  return {
    peer: document.getElementById('peer-status-label'),
    peer: document.getElementById('peer-status-label'),
    peer: document.getElementById('peer-status-label'),
    peer: document.getElementById('peer-status-label'),
    ice: document.getElementById('ice-status-label'),
    ice: document.getElementById('ice-status-label'),
    ice: document.getElementById('ice-status-label'),
    ice: document.getElementById('ice-status-label'),
    iceGathering: document.getElementById('ice-gathering-status-label'),
    iceGathering: document.getElementById('ice-gathering-status-label'),
    iceGathering: document.getElementById('ice-gathering-status-label'),
    iceGathering: document.getElementById('ice-gathering-status-label'),
    signaling: document.getElementById('signaling-status-label'),
    signaling: document.getElementById('signaling-status-label'),
    signaling: document.getElementById('signaling-status-label'),
    signaling: document.getElementById('signaling-status-label'),
    streaming: document.getElementById('streaming-status-label'),
    streaming: document.getElementById('streaming-status-label'),
    streaming: document.getElementById('streaming-status-label'),
    streaming: document.getElementById('streaming-status-label'),
  };
  };
  };
  };
}
}
}
}




function initializeWebSocket() {
function initializeWebSocket() {
function initializeWebSocket() {
function initializeWebSocket() {
  socket = new WebSocket(`wss://${window.location.host}`);
  socket = new WebSocket(`wss://${window.location.host}`);
  socket = new WebSocket(`wss://${window.location.host}`);
  socket = new WebSocket(`wss://${window.location.host}`);




  socket.onopen = () => {
  socket.onopen = () => {
  socket.onopen = () => {
  socket.onopen = () => {
    logger.info('WebSocket connection established');
    logger.info('WebSocket connection established');
    logger.info('WebSocket connection established');
    logger.info('WebSocket connection established');
  };
  };
  };
  };




  socket.onmessage = (event) => {
  socket.onmessage = (event) => {
  socket.onmessage = (event) => {
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const data = JSON.parse(event.data);
    const data = JSON.parse(event.data);
    const data = JSON.parse(event.data);
    logger.debug('Received WebSocket message:', data);
    logger.debug('Received WebSocket message:', data);
    logger.debug('Received WebSocket message:', data);
    logger.debug('Received WebSocket message:', data);




    switch (data.type) {
    switch (data.type) {
    switch (data.type) {
    switch (data.type) {
      case 'transcription':
      case 'transcription':
      case 'transcription':
      case 'transcription':
        updateTranscription(data.text);
        updateTranscription(data.text);
        updateTranscription(data.text);
        updateTranscription(data.text);
        break;
        break;
        break;
        break;
      case 'assistantReply':
      case 'assistantReply':
      case 'assistantReply':
      case 'assistantReply':
        updateAssistantReply(data.text);
        updateAssistantReply(data.text);
        updateAssistantReply(data.text);
        updateAssistantReply(data.text);
        break;
        break;
        break;
        break;
      default:
      default:
      default:
      default:
        logger.warn('Unknown WebSocket message type:', data.type);
        logger.warn('Unknown WebSocket message type:', data.type);
        logger.warn('Unknown WebSocket message type:', data.type);
        logger.warn('Unknown WebSocket message type:', data.type);
    }
    }
    }
    }
  };
  };
  };
  };




  socket.onerror = (error) => {
  socket.onerror = (error) => {
  socket.onerror = (error) => {
  socket.onerror = (error) => {
    logger.error('WebSocket error:', error);
    logger.error('WebSocket error:', error);
    logger.error('WebSocket error:', error);
    logger.error('WebSocket error:', error);
  };
  };
  };
  };




  socket.onclose = () => {
  socket.onclose = () => {
  socket.onclose = () => {
  socket.onclose = () => {
    logger.info('WebSocket connection closed');
    logger.info('WebSocket connection closed');
    logger.info('WebSocket connection closed');
    logger.info('WebSocket connection closed');
    setTimeout(initializeWebSocket, 10000);
    setTimeout(initializeWebSocket, 10000);
    setTimeout(initializeWebSocket, 10000);
    setTimeout(initializeWebSocket, 10000);
  };
  };
  };
  };
}
}
}
}




function updateTranscript(text, isFinal) {
function updateTranscript(text, isFinal) {
function updateTranscript(text, isFinal) {
function updateTranscript(text, isFinal) {
  const msgHistory = document.getElementById('msgHistory');
  const msgHistory = document.getElementById('msgHistory');
  const msgHistory = document.getElementById('msgHistory');
  const msgHistory = document.getElementById('msgHistory');
  let interimSpan = msgHistory.querySelector('span[data-interim]');
  let interimSpan = msgHistory.querySelector('span[data-interim]');
  let interimSpan = msgHistory.querySelector('span[data-interim]');
  let interimSpan = msgHistory.querySelector('span[data-interim]');




  if (isFinal) {
  if (isFinal) {
  if (isFinal) {
  if (isFinal) {
    if (interimSpan) {
    if (interimSpan) {
    if (interimSpan) {
    if (interimSpan) {
      interimSpan.remove();
      interimSpan.remove();
      interimSpan.remove();
      interimSpan.remove();
    }
    }
    }
    }
    msgHistory.innerHTML += `<span><u>User:</u> ${text}</span><br>`;
    msgHistory.innerHTML += `<span><u>User:</u> ${text}</span><br>`;
    msgHistory.innerHTML += `<span><u>User:</u> ${text}</span><br>`;
    msgHistory.innerHTML += `<span><u>User:</u> ${text}</span><br>`;
    logger.debug('Final transcript added to chat history:', text);
    logger.debug('Final transcript added to chat history:', text);
    logger.debug('Final transcript added to chat history:', text);
    logger.debug('Final transcript added to chat history:', text);
    interimMessageAdded = false;
    interimMessageAdded = false;
    interimMessageAdded = false;
    interimMessageAdded = false;
  } else {
  } else {
  } else {
  } else {
    if (text.trim()) {
    if (text.trim()) {
    if (text.trim()) {
    if (text.trim()) {
      if (!interimMessageAdded) {
      if (!interimMessageAdded) {
      if (!interimMessageAdded) {
      if (!interimMessageAdded) {
        msgHistory.innerHTML += `<span data-interim style='opacity:0.5'><u>User (interim):</u> ${text}</span><br>`;
        msgHistory.innerHTML += `<span data-interim style='opacity:0.5'><u>User (interim):</u> ${text}</span><br>`;
        msgHistory.innerHTML += `<span data-interim style='opacity:0.5'><u>User (interim):</u> ${text}</span><br>`;
        msgHistory.innerHTML += `<span data-interim style='opacity:0.5'><u>User (interim):</u> ${text}</span><br>`;
        interimMessageAdded = true;
        interimMessageAdded = true;
        interimMessageAdded = true;
        interimMessageAdded = true;
      } else if (interimSpan) {
      } else if (interimSpan) {
      } else if (interimSpan) {
      } else if (interimSpan) {
        interimSpan.innerHTML = `<u>User (interim):</u> ${text}`;
        interimSpan.innerHTML = `<u>User (interim):</u> ${text}`;
        interimSpan.innerHTML = `<u>User (interim):</u> ${text}`;
        interimSpan.innerHTML = `<u>User (interim):</u> ${text}`;
      }
      }
      }
      }
    }
    }
    }
    }
  }
  }
  }
  }
  msgHistory.scrollTop = msgHistory.scrollHeight;
  msgHistory.scrollTop = msgHistory.scrollHeight;
  msgHistory.scrollTop = msgHistory.scrollHeight;
  msgHistory.scrollTop = msgHistory.scrollHeight;
}
}
}
}




function handleTextInput(text) {
function handleTextInput(text) {
function handleTextInput(text) {
function handleTextInput(text) {
  if (text.trim() === '') return;
  if (text.trim() === '') return;
  if (text.trim() === '') return;
  if (text.trim() === '') return;




  const textInput = document.getElementById('text-input');
  const textInput = document.getElementById('text-input');
  const textInput = document.getElementById('text-input');
  const textInput = document.getElementById('text-input');
  textInput.value = '';
  textInput.value = '';
  textInput.value = '';
  textInput.value = '';




  updateTranscript(text, true);
  updateTranscript(text, true);
  updateTranscript(text, true);
  updateTranscript(text, true);




  chatHistory.push({
  chatHistory.push({
  chatHistory.push({
  chatHistory.push({
    role: 'user',
    role: 'user',
    role: 'user',
    role: 'user',
    content: text,
    content: text,
    content: text,
    content: text,
  });
  });
  });
  });




  sendChatToGroq();
  sendChatToGroq();
  sendChatToGroq();
  sendChatToGroq();
}
}
}
}




function updateAssistantReply(text) {
function updateAssistantReply(text) {
function updateAssistantReply(text) {
function updateAssistantReply(text) {
  document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${text}</span><br>`;
  document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${text}</span><br>`;
  document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${text}</span><br>`;
  document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${text}</span><br>`;
}
}
}
}




async function initializePersistentStream() {
async function initializePersistentStream() {
async function initializePersistentStream() {
async function initializePersistentStream() {
  logger.info('Initializing persistent stream...');
  logger.info('Initializing persistent stream...');
  logger.info('Initializing persistent stream...');
  logger.info('Initializing persistent stream...');
  connectionState = ConnectionState.CONNECTING;
  connectionState = ConnectionState.CONNECTING;
  connectionState = ConnectionState.CONNECTING;
  connectionState = ConnectionState.CONNECTING;




  try {
  try {
  try {
  try {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
      method: 'POST',
      method: 'POST',
      method: 'POST',
      method: 'POST',
      headers: {
      headers: {
      headers: {
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        Authorization: `Basic ${DID_API.key}`,
        Authorization: `Basic ${DID_API.key}`,
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
        'Content-Type': 'application/json',
        'Content-Type': 'application/json',
        'Content-Type': 'application/json',
      },
      },
      },
      },
      body: JSON.stringify({
      body: JSON.stringify({
      body: JSON.stringify({
      body: JSON.stringify({
        source_url: avatars[currentAvatar].imageUrl,
        source_url: avatars[currentAvatar].imageUrl,
        source_url: avatars[currentAvatar].imageUrl,
        source_url: avatars[currentAvatar].imageUrl,
        driver_url: 'bank://lively/driver-06',
        driver_url: 'bank://lively/driver-06',
        driver_url: 'bank://lively/driver-06',
        driver_url: 'bank://lively/driver-06',
        output_resolution: 512,
        output_resolution: 512,
        output_resolution: 512,
        output_resolution: 512,
        stream_warmup: true,
        stream_warmup: true,
        stream_warmup: true,
        stream_warmup: true,
        config: {
        config: {
        config: {
        config: {
          stitch: true,
          stitch: true,
          stitch: true,
          stitch: true,
          fluent: true,
          fluent: true,
          fluent: true,
          fluent: true,
          auto_match: true,
          auto_match: true,
          auto_match: true,
          auto_match: true,
          pad_audio: 0.5,
          pad_audio: 0.5,
          pad_audio: 0.5,
          pad_audio: 0.5,
          normalization_factor: 0.1,
          normalization_factor: 0.1,
          normalization_factor: 0.1,
          normalization_factor: 0.1,
          align_driver: true,
          align_driver: true,
          align_driver: true,
          align_driver: true,
          motion_factor: 0.55,
          motion_factor: 0.55,
          motion_factor: 0.55,
          motion_factor: 0.55,
          align_expand_factor: 0.3,
          align_expand_factor: 0.3,
          align_expand_factor: 0.3,
          align_expand_factor: 0.3,
          driver_expressions: {
          driver_expressions: {
          driver_expressions: {
          driver_expressions: {
            expressions: [
            expressions: [
            expressions: [
            expressions: [
              {
              {
              {
              {
                start_frame: 0,
                start_frame: 0,
                start_frame: 0,
                start_frame: 0,
                expression: 'neutral',
                expression: 'neutral',
                expression: 'neutral',
                expression: 'neutral',
                intensity: 0.5,
                intensity: 0.5,
                intensity: 0.5,
                intensity: 0.5,
              },
              },
              },
              },
            ],
            ],
            ],
            ],
          },
          },
          },
          },
        },
        },
        },
        },
      }),
      }),
      }),
      }),
    });
    });
    });
    });




    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();




    persistentStreamId = newStreamId;
    persistentStreamId = newStreamId;
    persistentStreamId = newStreamId;
    persistentStreamId = newStreamId;
    persistentSessionId = newSessionId;
    persistentSessionId = newSessionId;
    persistentSessionId = newSessionId;
    persistentSessionId = newSessionId;




    logger.info('Persistent stream created:', { persistentStreamId, persistentSessionId });
    logger.info('Persistent stream created:', { persistentStreamId, persistentSessionId });
    logger.info('Persistent stream created:', { persistentStreamId, persistentSessionId });
    logger.info('Persistent stream created:', { persistentStreamId, persistentSessionId });




    try {
    try {
    try {
    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
    } catch (e) {
    } catch (e) {
    } catch (e) {
      logger.error('Error during streaming setup:', e);
      logger.error('Error during streaming setup:', e);
      logger.error('Error during streaming setup:', e);
      logger.error('Error during streaming setup:', e);
      stopAllStreams();
      stopAllStreams();
      stopAllStreams();
      stopAllStreams();
      closePC();
      closePC();
      closePC();
      closePC();
      throw e;
      throw e;
      throw e;
      throw e;
    }
    }
    }
    }




    await new Promise((resolve) => setTimeout(resolve, 1000));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await new Promise((resolve) => setTimeout(resolve, 1000));




    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}/sdp`, {
    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}/sdp`, {
    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}/sdp`, {
    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}/sdp`, {
      method: 'POST',
      method: 'POST',
      method: 'POST',
      method: 'POST',
      headers: {
      headers: {
      headers: {
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        Authorization: `Basic ${DID_API.key}`,
        Authorization: `Basic ${DID_API.key}`,
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
        'Content-Type': 'application/json',
        'Content-Type': 'application/json',
        'Content-Type': 'application/json',
      },
      },
      },
      },
      body: JSON.stringify({
      body: JSON.stringify({
      body: JSON.stringify({
      body: JSON.stringify({
        answer: sessionClientAnswer,
        answer: sessionClientAnswer,
        answer: sessionClientAnswer,
        answer: sessionClientAnswer,
        session_id: persistentSessionId,
        session_id: persistentSessionId,
        session_id: persistentSessionId,
        session_id: persistentSessionId,
      }),
      }),
      }),
      }),
    });
    });
    });
    });




    if (!sdpResponse.ok) {
    if (!sdpResponse.ok) {
    if (!sdpResponse.ok) {
    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }
    }
    }
    }
    isPersistentStreamActive = true;
    isPersistentStreamActive = true;
    isPersistentStreamActive = true;
    isPersistentStreamActive = true;
    startKeepAlive();
    startKeepAlive();
    startKeepAlive();
    startKeepAlive();
    lastConnectionTime = Date.now(); // Update the last connection time
    lastConnectionTime = Date.now(); // Update the last connection time
    lastConnectionTime = Date.now(); // Update the last connection time
    lastConnectionTime = Date.now(); // Update the last connection time
    logger.info('Persistent stream initialized successfully');
    logger.info('Persistent stream initialized successfully');
    logger.info('Persistent stream initialized successfully');
    logger.info('Persistent stream initialized successfully');
    connectionState = ConnectionState.CONNECTED;
    connectionState = ConnectionState.CONNECTED;
    connectionState = ConnectionState.CONNECTED;
    connectionState = ConnectionState.CONNECTED;
  } catch (error) {
  } catch (error) {
  } catch (error) {
  } catch (error) {
    logger.error('Failed to initialize persistent stream:', error);
    logger.error('Failed to initialize persistent stream:', error);
    logger.error('Failed to initialize persistent stream:', error);
    logger.error('Failed to initialize persistent stream:', error);
    isPersistentStreamActive = false;
    isPersistentStreamActive = false;
    isPersistentStreamActive = false;
    isPersistentStreamActive = false;
    persistentStreamId = null;
    persistentStreamId = null;
    persistentStreamId = null;
    persistentStreamId = null;
    persistentSessionId = null;
    persistentSessionId = null;
    persistentSessionId = null;
    persistentSessionId = null;
    connectionState = ConnectionState.DISCONNECTED;
    connectionState = ConnectionState.DISCONNECTED;
    connectionState = ConnectionState.DISCONNECTED;
    connectionState = ConnectionState.DISCONNECTED;
    throw error;
    throw error;
    throw error;
    throw error;
  }
  }
  }
  }
}
}
}
}




function shouldReconnect() {
function shouldReconnect() {
function shouldReconnect() {
function shouldReconnect() {
  const timeSinceLastConnection = Date.now() - lastConnectionTime;
  const timeSinceLastConnection = Date.now() - lastConnectionTime;
  const timeSinceLastConnection = Date.now() - lastConnectionTime;
  const timeSinceLastConnection = Date.now() - lastConnectionTime;
  return timeSinceLastConnection > RECONNECTION_INTERVAL * 0.9;
  return timeSinceLastConnection > RECONNECTION_INTERVAL * 0.9;
  return timeSinceLastConnection > RECONNECTION_INTERVAL * 0.9;
  return timeSinceLastConnection > RECONNECTION_INTERVAL * 0.9;
}
}
}
}




function scheduleReconnect() {
function scheduleReconnect() {
function scheduleReconnect() {
function scheduleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    logger.error('Max reconnection attempts reached. Please refresh the page.');
    logger.error('Max reconnection attempts reached. Please refresh the page.');
    logger.error('Max reconnection attempts reached. Please refresh the page.');
    logger.error('Max reconnection attempts reached. Please refresh the page.');
    showErrorMessage('Failed to reconnect after multiple attempts. Please refresh the page.');
    showErrorMessage('Failed to reconnect after multiple attempts. Please refresh the page.');
    showErrorMessage('Failed to reconnect after multiple attempts. Please refresh the page.');
    showErrorMessage('Failed to reconnect after multiple attempts. Please refresh the page.');
    return;
    return;
    return;
    return;
  }
  }
  }
  }




  const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  logger.debug(`Scheduling reconnection attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
  logger.debug(`Scheduling reconnection attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
  logger.debug(`Scheduling reconnection attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
  logger.debug(`Scheduling reconnection attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
  setTimeout(backgroundReconnect, delay);
  setTimeout(backgroundReconnect, delay);
  setTimeout(backgroundReconnect, delay);
  setTimeout(backgroundReconnect, delay);
  reconnectAttempts++;
  reconnectAttempts++;
  reconnectAttempts++;
  reconnectAttempts++;
}
}
}
}




function startKeepAlive() {
function startKeepAlive() {
function startKeepAlive() {
function startKeepAlive() {
  if (keepAliveInterval) {
  if (keepAliveInterval) {
  if (keepAliveInterval) {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    clearInterval(keepAliveInterval);
    clearInterval(keepAliveInterval);
    clearInterval(keepAliveInterval);
  }
  }
  }
  }




  keepAliveInterval = setInterval(() => {
  keepAliveInterval = setInterval(() => {
  keepAliveInterval = setInterval(() => {
  keepAliveInterval = setInterval(() => {
    if (isPersistentStreamActive && peerConnection && peerConnection.connectionState === 'connected' && pcDataChannel) {
    if (isPersistentStreamActive && peerConnection && peerConnection.connectionState === 'connected' && pcDataChannel) {
    if (isPersistentStreamActive && peerConnection && peerConnection.connectionState === 'connected' && pcDataChannel) {
    if (isPersistentStreamActive && peerConnection && peerConnection.connectionState === 'connected' && pcDataChannel) {
      try {
      try {
      try {
      try {
        const keepAliveMessage = JSON.stringify({ type: 'KeepAlive' });
        const keepAliveMessage = JSON.stringify({ type: 'KeepAlive' });
        const keepAliveMessage = JSON.stringify({ type: 'KeepAlive' });
        const keepAliveMessage = JSON.stringify({ type: 'KeepAlive' });
        if (pcDataChannel.readyState === 'open') {
        if (pcDataChannel.readyState === 'open') {
        if (pcDataChannel.readyState === 'open') {
        if (pcDataChannel.readyState === 'open') {
          pcDataChannel.send(keepAliveMessage);
          pcDataChannel.send(keepAliveMessage);
          pcDataChannel.send(keepAliveMessage);
          pcDataChannel.send(keepAliveMessage);
          logger.debug('Keepalive message sent successfully');
          logger.debug('Keepalive message sent successfully');
          logger.debug('Keepalive message sent successfully');
          logger.debug('Keepalive message sent successfully');
        } else {
        } else {
        } else {
        } else {
          logger.warn('Data channel is not open. Current state:', pcDataChannel.readyState);
          logger.warn('Data channel is not open. Current state:', pcDataChannel.readyState);
          logger.warn('Data channel is not open. Current state:', pcDataChannel.readyState);
          logger.warn('Data channel is not open. Current state:', pcDataChannel.readyState);
        }
        }
        }
        }
      } catch (error) {
      } catch (error) {
      } catch (error) {
      } catch (error) {
        logger.warn('Error sending keepalive message:', error);
        logger.warn('Error sending keepalive message:', error);
        logger.warn('Error sending keepalive message:', error);
        logger.warn('Error sending keepalive message:', error);
      }
      }
      }
      }
    } else {
    } else {
    } else {
    } else {
      logger.debug(
      logger.debug(
      logger.debug(
      logger.debug(
        'Conditions not met for sending keepalive. isPersistentStreamActive:',
        'Conditions not met for sending keepalive. isPersistentStreamActive:',
        'Conditions not met for sending keepalive. isPersistentStreamActive:',
        'Conditions not met for sending keepalive. isPersistentStreamActive:',
        isPersistentStreamActive,
        isPersistentStreamActive,
        isPersistentStreamActive,
        isPersistentStreamActive,
        'peerConnection state:',
        'peerConnection state:',
        'peerConnection state:',
        'peerConnection state:',
        peerConnection ? peerConnection.connectionState : 'null',
        peerConnection ? peerConnection.connectionState : 'null',
        peerConnection ? peerConnection.connectionState : 'null',
        peerConnection ? peerConnection.connectionState : 'null',
        'pcDataChannel:',
        'pcDataChannel:',
        'pcDataChannel:',
        'pcDataChannel:',
        pcDataChannel ? 'exists' : 'null',
        pcDataChannel ? 'exists' : 'null',
        pcDataChannel ? 'exists' : 'null',
        pcDataChannel ? 'exists' : 'null',
      );
      );
      );
      );
    }
    }
    }
    }
  }, 30000); // Send keepalive every 30 seconds
  }, 30000); // Send keepalive every 30 seconds
  }, 30000); // Send keepalive every 30 seconds
  }, 30000); // Send keepalive every 30 seconds
}
}
}
}




async function destroyPersistentStream() {
async function destroyPersistentStream() {
async function destroyPersistentStream() {
async function destroyPersistentStream() {
  if (persistentStreamId) {
  if (persistentStreamId) {
  if (persistentStreamId) {
  if (persistentStreamId) {
    try {
    try {
    try {
    try {
      await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}`, {
      await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}`, {
      await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}`, {
      await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}`, {
        method: 'DELETE',
        method: 'DELETE',
        method: 'DELETE',
        method: 'DELETE',
        headers: {
        headers: {
        headers: {
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          Authorization: `Basic ${DID_API.key}`,
          Authorization: `Basic ${DID_API.key}`,
          Authorization: `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
          'Content-Type': 'application/json',
          'Content-Type': 'application/json',
          'Content-Type': 'application/json',
        },
        },
        },
        },
        body: JSON.stringify({ session_id: persistentSessionId }),
        body: JSON.stringify({ session_id: persistentSessionId }),
        body: JSON.stringify({ session_id: persistentSessionId }),
        body: JSON.stringify({ session_id: persistentSessionId }),
      });
      });
      });
      });




      logger.debug('Persistent stream destroyed successfully');
      logger.debug('Persistent stream destroyed successfully');
      logger.debug('Persistent stream destroyed successfully');
      logger.debug('Persistent stream destroyed successfully');
    } catch (error) {
    } catch (error) {
    } catch (error) {
    } catch (error) {
      logger.error('Error destroying persistent stream:', error);
      logger.error('Error destroying persistent stream:', error);
      logger.error('Error destroying persistent stream:', error);
      logger.error('Error destroying persistent stream:', error);
    } finally {
    } finally {
    } finally {
    } finally {
      stopAllStreams();
      stopAllStreams();
      stopAllStreams();
      stopAllStreams();
      closePC();
      closePC();
      closePC();
      closePC();
      persistentStreamId = null;
      persistentStreamId = null;
      persistentStreamId = null;
      persistentStreamId = null;
      persistentSessionId = null;
      persistentSessionId = null;
      persistentSessionId = null;
      persistentSessionId = null;
      isPersistentStreamActive = false;
      isPersistentStreamActive = false;
      isPersistentStreamActive = false;
      isPersistentStreamActive = false;
      if (keepAliveInterval) {
      if (keepAliveInterval) {
      if (keepAliveInterval) {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        clearInterval(keepAliveInterval);
        clearInterval(keepAliveInterval);
        clearInterval(keepAliveInterval);
      }
      }
      }
      }
      connectionState = ConnectionState.DISCONNECTED;
      connectionState = ConnectionState.DISCONNECTED;
      connectionState = ConnectionState.DISCONNECTED;
      connectionState = ConnectionState.DISCONNECTED;
    }
    }
    }
    }
  }
  }
  }
  }
}
}
}
}




async function reinitializePersistentStream() {
async function reinitializePersistentStream() {
async function reinitializePersistentStream() {
async function reinitializePersistentStream() {
  logger.info('Reinitializing persistent stream...');
  logger.info('Reinitializing persistent stream...');
  logger.info('Reinitializing persistent stream...');
  logger.info('Reinitializing persistent stream...');
  await destroyPersistentStream();
  await destroyPersistentStream();
  await destroyPersistentStream();
  await destroyPersistentStream();
  await initializePersistentStream();
  await initializePersistentStream();
  await initializePersistentStream();
  await initializePersistentStream();
}
}
}
}




async function createNewPersistentStream() {
async function createNewPersistentStream() {
async function createNewPersistentStream() {
async function createNewPersistentStream() {
  logger.debug('Creating new persistent stream...');
  logger.debug('Creating new persistent stream...');
  logger.debug('Creating new persistent stream...');
  logger.debug('Creating new persistent stream...');




  try {
  try {
  try {
  try {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
      method: 'POST',
      method: 'POST',
      method: 'POST',
      method: 'POST',
      headers: {
      headers: {
      headers: {
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        Authorization: `Basic ${DID_API.key}`,
        Authorization: `Basic ${DID_API.key}`,
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
        'Content-Type': 'application/json',
        'Content-Type': 'application/json',
        'Content-Type': 'application/json',
      },
      },
      },
      },
      body: JSON.stringify({
      body: JSON.stringify({
      body: JSON.stringify({
      body: JSON.stringify({
        source_url: avatars[currentAvatar].imageUrl,
        source_url: avatars[currentAvatar].imageUrl,
        source_url: avatars[currentAvatar].imageUrl,
        source_url: avatars[currentAvatar].imageUrl,
        driver_url: 'bank://lively/driver-06',
        driver_url: 'bank://lively/driver-06',
        driver_url: 'bank://lively/driver-06',
        driver_url: 'bank://lively/driver-06',
        output_resolution: 512,
        output_resolution: 512,
        output_resolution: 512,
        output_resolution: 512,
        stream_warmup: true,
        stream_warmup: true,
        stream_warmup: true,
        stream_warmup: true,
        config: {
        config: {
        config: {
        config: {
          stitch: true,
          stitch: true,
          stitch: true,
          stitch: true,
          fluent: true,
          fluent: true,
          fluent: true,
          fluent: true,
          auto_match: true,
          auto_match: true,
          auto_match: true,
          auto_match: true,
          pad_audio: 0.5,
          pad_audio: 0.5,
          pad_audio: 0.5,
          pad_audio: 0.5,
          normalization_factor: 0.1,
          normalization_factor: 0.1,
          normalization_factor: 0.1,
          normalization_factor: 0.1,
          align_driver: true,
          align_driver: true,
          align_driver: true,
          align_driver: true,
          motion_factor: 0.55,
          motion_factor: 0.55,
          motion_factor: 0.55,
          motion_factor: 0.55,
          align_expand_factor: 0.3,
          align_expand_factor: 0.3,
          align_expand_factor: 0.3,
          align_expand_factor: 0.3,
          driver_expressions: {
          driver_expressions: {
          driver_expressions: {
          driver_expressions: {
            expressions: [
            expressions: [
            expressions: [
            expressions: [
              {
              {
              {
              {
                start_frame: 0,
                start_frame: 0,
                start_frame: 0,
                start_frame: 0,
                expression: 'neutral',
                expression: 'neutral',
                expression: 'neutral',
                expression: 'neutral',
                intensity: 0.5,
                intensity: 0.5,
                intensity: 0.5,
                intensity: 0.5,
              },
              },
              },
              },
            ],
            ],
            ],
            ],
          },
          },
          },
          },
        },
        },
        },
        },
      }),
      }),
      }),
      }),
    });
    });
    });
    });




    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();




    logger.debug('New stream created:', { newStreamId, newSessionId });
    logger.debug('New stream created:', { newStreamId, newSessionId });
    logger.debug('New stream created:', { newStreamId, newSessionId });
    logger.debug('New stream created:', { newStreamId, newSessionId });




    const newSessionClientAnswer = await createPeerConnection(offer, iceServers);
    const newSessionClientAnswer = await createPeerConnection(offer, iceServers);
    const newSessionClientAnswer = await createPeerConnection(offer, iceServers);
    const newSessionClientAnswer = await createPeerConnection(offer, iceServers);




    await new Promise((resolve) => setTimeout(resolve, 1000));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await new Promise((resolve) => setTimeout(resolve, 1000));




    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${newStreamId}/sdp`, {
    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${newStreamId}/sdp`, {
    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${newStreamId}/sdp`, {
    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${newStreamId}/sdp`, {
      method: 'POST',
      method: 'POST',
      method: 'POST',
      method: 'POST',
      headers: {
      headers: {
      headers: {
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        Authorization: `Basic ${DID_API.key}`,
        Authorization: `Basic ${DID_API.key}`,
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
        'Content-Type': 'application/json',
        'Content-Type': 'application/json',
        'Content-Type': 'application/json',
      },
      },
      },
      },
      body: JSON.stringify({
      body: JSON.stringify({
      body: JSON.stringify({
      body: JSON.stringify({
        answer: newSessionClientAnswer,
        answer: newSessionClientAnswer,
        answer: newSessionClientAnswer,
        answer: newSessionClientAnswer,
        session_id: newSessionId,
        session_id: newSessionId,
        session_id: newSessionId,
        session_id: newSessionId,
      }),
      }),
      }),
      }),
    });
    });
    });
    });




    if (!sdpResponse.ok) {
    if (!sdpResponse.ok) {
    if (!sdpResponse.ok) {
    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }
    }
    }
    }




    return { streamId: newStreamId, sessionId: newSessionId };
    return { streamId: newStreamId, sessionId: newSessionId };
    return { streamId: newStreamId, sessionId: newSessionId };
    return { streamId: newStreamId, sessionId: newSessionId };
  } catch (error) {
  } catch (error) {
  } catch (error) {
  } catch (error) {
    logger.error('Error creating new persistent stream:', error);
    logger.error('Error creating new persistent stream:', error);
    logger.error('Error creating new persistent stream:', error);
    logger.error('Error creating new persistent stream:', error);
    return null;
    return null;
    return null;
    return null;
  }
  }
  }
  }
}
}
}
}




async function backgroundReconnect() {
async function backgroundReconnect() {
async function backgroundReconnect() {
async function backgroundReconnect() {
  if (connectionState === ConnectionState.RECONNECTING) {
  if (connectionState === ConnectionState.RECONNECTING) {
  if (connectionState === ConnectionState.RECONNECTING) {
  if (connectionState === ConnectionState.RECONNECTING) {
    logger.debug('Background reconnection already in progress. Skipping.');
    logger.debug('Background reconnection already in progress. Skipping.');
    logger.debug('Background reconnection already in progress. Skipping.');
    logger.debug('Background reconnection already in progress. Skipping.');
    return;
    return;
    return;
    return;
  }
  }
  }
  }




  connectionState = ConnectionState.RECONNECTING;
  connectionState = ConnectionState.RECONNECTING;
  connectionState = ConnectionState.RECONNECTING;
  connectionState = ConnectionState.RECONNECTING;
  logger.debug('Starting background reconnection process...');
  logger.debug('Starting background reconnection process...');
  logger.debug('Starting background reconnection process...');
  logger.debug('Starting background reconnection process...');




  try {
  try {
  try {
  try {
    await destroyPersistentStream();
    await destroyPersistentStream();
    await destroyPersistentStream();
    await destroyPersistentStream();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await initializePersistentStream();
    await initializePersistentStream();
    await initializePersistentStream();
    await initializePersistentStream();
    lastConnectionTime = Date.now(); // Update the last connection time
    lastConnectionTime = Date.now(); // Update the last connection time
    lastConnectionTime = Date.now(); // Update the last connection time
    lastConnectionTime = Date.now(); // Update the last connection time
    logger.info('Background reconnection completed successfully');
    logger.info('Background reconnection completed successfully');
    logger.info('Background reconnection completed successfully');
    logger.info('Background reconnection completed successfully');
    connectionState = ConnectionState.CONNECTED;
    connectionState = ConnectionState.CONNECTED;
    connectionState = ConnectionState.CONNECTED;
    connectionState = ConnectionState.CONNECTED;
    reconnectAttempts = 0;
    reconnectAttempts = 0;
    reconnectAttempts = 0;
    reconnectAttempts = 0;
  } catch (error) {
  } catch (error) {
  } catch (error) {
  } catch (error) {
    logger.error('Error during background reconnection:', error);
    logger.error('Error during background reconnection:', error);
    logger.error('Error during background reconnection:', error);
    logger.error('Error during background reconnection:', error);
    connectionState = ConnectionState.DISCONNECTED;
    connectionState = ConnectionState.DISCONNECTED;
    connectionState = ConnectionState.DISCONNECTED;
    connectionState = ConnectionState.DISCONNECTED;
    scheduleReconnect();
    scheduleReconnect();
    scheduleReconnect();
    scheduleReconnect();
  }
  }
  }
  }
}
}
}
}




function waitForIdleState() {
function waitForIdleState() {
function waitForIdleState() {
function waitForIdleState() {
  return new Promise((resolve) => {
  return new Promise((resolve) => {
  return new Promise((resolve) => {
  return new Promise((resolve) => {
    const checkIdleState = () => {
    const checkIdleState = () => {
    const checkIdleState = () => {
    const checkIdleState = () => {
      if (!isAvatarSpeaking) {
      if (!isAvatarSpeaking) {
      if (!isAvatarSpeaking) {
      if (!isAvatarSpeaking) {
        resolve();
        resolve();
        resolve();
        resolve();
      } else {
      } else {
      } else {
      } else {
        setTimeout(checkIdleState, 500); // Check every 500ms
        setTimeout(checkIdleState, 500); // Check every 500ms
        setTimeout(checkIdleState, 500); // Check every 500ms
        setTimeout(checkIdleState, 500); // Check every 500ms
      }
      }
      }
      }
    };
    };
    };
    };
    checkIdleState();
    checkIdleState();
    checkIdleState();
    checkIdleState();
  });
  });
  });
  });
}
}
}
}




async function switchToNewStream(newStreamData) {
async function switchToNewStream(newStreamData) {
async function switchToNewStream(newStreamData) {
async function switchToNewStream(newStreamData) {
  logger.debug('Switching to new stream...');
  logger.debug('Switching to new stream...');
  logger.debug('Switching to new stream...');
  logger.debug('Switching to new stream...');




  try {
  try {
  try {
  try {
    connectionState = ConnectionState.RECONNECTING;
    connectionState = ConnectionState.RECONNECTING;
    connectionState = ConnectionState.RECONNECTING;
    connectionState = ConnectionState.RECONNECTING;




    // Quickly switch the video source to the new stream
    // Quickly switch the video source to the new stream
    // Quickly switch the video source to the new stream
    // Quickly switch the video source to the new stream
    if (streamVideoElement) {
    if (streamVideoElement) {
    if (streamVideoElement) {
    if (streamVideoElement) {
      // Instead of directly setting src, we need to update the WebRTC connection
      // Instead of directly setting src, we need to update the WebRTC connection
      // Instead of directly setting src, we need to update the WebRTC connection
      // Instead of directly setting src, we need to update the WebRTC connection
      await updateWebRTCConnection(newStreamData);
      await updateWebRTCConnection(newStreamData);
      await updateWebRTCConnection(newStreamData);
      await updateWebRTCConnection(newStreamData);
    }
    }
    }
    }




    // Update global variables
    // Update global variables
    // Update global variables
    // Update global variables
    persistentStreamId = newStreamData.streamId;
    persistentStreamId = newStreamData.streamId;
    persistentStreamId = newStreamData.streamId;
    persistentStreamId = newStreamData.streamId;
    persistentSessionId = newStreamData.sessionId;
    persistentSessionId = newStreamData.sessionId;
    persistentSessionId = newStreamData.sessionId;
    persistentSessionId = newStreamData.sessionId;




    // Clean up the old stream
    // Clean up the old stream
    // Clean up the old stream
    // Clean up the old stream
    await cleanupOldStream();
    await cleanupOldStream();
    await cleanupOldStream();
    await cleanupOldStream();




    connectionState = ConnectionState.CONNECTED;
    connectionState = ConnectionState.CONNECTED;
    connectionState = ConnectionState.CONNECTED;
    connectionState = ConnectionState.CONNECTED;
    logger.debug('Successfully switched to new stream');
    logger.debug('Successfully switched to new stream');
    logger.debug('Successfully switched to new stream');
    logger.debug('Successfully switched to new stream');
  } catch (error) {
  } catch (error) {
  } catch (error) {
  } catch (error) {
    logger.error('Error switching to new stream:', error);
    logger.error('Error switching to new stream:', error);
    logger.error('Error switching to new stream:', error);
    logger.error('Error switching to new stream:', error);
    connectionState = ConnectionState.DISCONNECTED;
    connectionState = ConnectionState.DISCONNECTED;
    connectionState = ConnectionState.DISCONNECTED;
    connectionState = ConnectionState.DISCONNECTED;
    throw error;
    throw error;
    throw error;
    throw error;
  }
  }
  }
  }
}
}
}
}




async function updateWebRTCConnection(newStreamData) {
async function updateWebRTCConnection(newStreamData) {
async function updateWebRTCConnection(newStreamData) {
async function updateWebRTCConnection(newStreamData) {
  logger.debug('Updating WebRTC connection...');
  logger.debug('Updating WebRTC connection...');
  logger.debug('Updating WebRTC connection...');
  logger.debug('Updating WebRTC connection...');




  try {
  try {
  try {
  try {
    const offer = await fetchStreamOffer(newStreamData.streamId);
    const offer = await fetchStreamOffer(newStreamData.streamId);
    const offer = await fetchStreamOffer(newStreamData.streamId);
    const offer = await fetchStreamOffer(newStreamData.streamId);
    const iceServers = await fetchIceServers();
    const iceServers = await fetchIceServers();
    const iceServers = await fetchIceServers();
    const iceServers = await fetchIceServers();




    const newSessionClientAnswer = await createPeerConnection(offer, iceServers);
    const newSessionClientAnswer = await createPeerConnection(offer, iceServers);
    const newSessionClientAnswer = await createPeerConnection(offer, iceServers);
    const newSessionClientAnswer = await createPeerConnection(offer, iceServers);




    await sendSDPAnswer(newStreamData.streamId, newStreamData.sessionId, newSessionClientAnswer);
    await sendSDPAnswer(newStreamData.streamId, newStreamData.sessionId, newSessionClientAnswer);
    await sendSDPAnswer(newStreamData.streamId, newStreamData.sessionId, newSessionClientAnswer);
    await sendSDPAnswer(newStreamData.streamId, newStreamData.sessionId, newSessionClientAnswer);




    logger.debug('WebRTC connection updated successfully');
    logger.debug('WebRTC connection updated successfully');
    logger.debug('WebRTC connection updated successfully');
    logger.debug('WebRTC connection updated successfully');
  } catch (error) {
  } catch (error) {
  } catch (error) {
  } catch (error) {
    logger.error('Error updating WebRTC connection:', error);
    logger.error('Error updating WebRTC connection:', error);
    logger.error('Error updating WebRTC connection:', error);
    logger.error('Error updating WebRTC connection:', error);
    throw error;
    throw error;
    throw error;
    throw error;
  }
  }
  }
  }
}
}
}
}




async function fetchStreamOffer(streamId) {
async function fetchStreamOffer(streamId) {
async function fetchStreamOffer(streamId) {
async function fetchStreamOffer(streamId) {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/offer`, {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/offer`, {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/offer`, {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/offer`, {
    method: 'GET',
    method: 'GET',
    method: 'GET',
    method: 'GET',
    headers: {
    headers: {
    headers: {
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      Authorization: `Basic ${DID_API.key}`,
      Authorization: `Basic ${DID_API.key}`,
      Authorization: `Basic ${DID_API.key}`,
    },
    },
    },
    },
  });
  });
  });
  });
  const data = await response.json();
  const data = await response.json();
  const data = await response.json();
  const data = await response.json();
  return data.offer;
  return data.offer;
  return data.offer;
  return data.offer;
}
}
}
}




async function fetchIceServers() {
async function fetchIceServers() {
async function fetchIceServers() {
async function fetchIceServers() {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/ice_servers`, {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/ice_servers`, {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/ice_servers`, {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/ice_servers`, {
    method: 'GET',
    method: 'GET',
    method: 'GET',
    method: 'GET',
    headers: {
    headers: {
    headers: {
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      Authorization: `Basic ${DID_API.key}`,
      Authorization: `Basic ${DID_API.key}`,
      Authorization: `Basic ${DID_API.key}`,
    },
    },
    },
    },
  });
  });
  });
  });
  const data = await response.json();
  const data = await response.json();
  const data = await response.json();
  const data = await response.json();
  return data.ice_servers;
  return data.ice_servers;
  return data.ice_servers;
  return data.ice_servers;
}
}
}
}




async function sendSDPAnswer(streamId, sessionId, answer) {
async function sendSDPAnswer(streamId, sessionId, answer) {
async function sendSDPAnswer(streamId, sessionId, answer) {
async function sendSDPAnswer(streamId, sessionId, answer) {
  await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, {
  await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, {
  await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, {
  await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, {
    method: 'POST',
    method: 'POST',
    method: 'POST',
    method: 'POST',
    headers: {
    headers: {
    headers: {
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      Authorization: `Basic ${DID_API.key}`,
      Authorization: `Basic ${DID_API.key}`,
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
      'Content-Type': 'application/json',
      'Content-Type': 'application/json',
      'Content-Type': 'application/json',
    },
    },
    },
    },
    body: JSON.stringify({
    body: JSON.stringify({
    body: JSON.stringify({
    body: JSON.stringify({
      answer,
      answer,
      answer,
      answer,
      session_id: sessionId,
      session_id: sessionId,
      session_id: sessionId,
      session_id: sessionId,
    }),
    }),
    }),
    }),
  });
  });
  });
  });
}
}
}
}




async function initialize() {
async function initialize() {
function initialize() {
  setLogLevel('DEBUG');
  connectionState = ConnectionState.DISCONNECTED;

  const { idle, stream } = getVideoElements();
  idleVideoElement = idle;
  streamVideoElement = stream;

  if (idleVideoElement) idleVideoElement.setAttribute('playsinline', '');
  if (streamVideoElement) streamVideoElement.setAttribute('playsinline', '');

  initializeTransitionCanvas();

  loadAvatars().then(() => {
    populateAvatarSelect();
  });

  const contextInput = document.getElementById('context-input');
  contextInput.value = context.trim();
  contextInput.addEventListener('input', () => {
    if (!contextInput.value.includes('Original Context:')) {
      context = contextInput.value.trim();
    }
  });

  const pushToTalkToggle = document.getElementById('push-to-talk-toggle');
  pushToTalkToggle.addEventListener('click', togglePushToTalk);

  const pushToTalkButton = document.getElementById('push-to-talk-button');
  pushToTalkButton.addEventListener('mousedown', handlePushToTalk);
  pushToTalkButton.addEventListener('mouseup', handlePushToTalk);
  pushToTalkButton.addEventListener('touchstart', handlePushToTalk);
  pushToTalkButton.addEventListener('touchend', handlePushToTalk);
}
async function initialize() {
  setLogLevel('DEBUG');
  setLogLevel('DEBUG');
  connectionState = ConnectionState.DISCONNECTED;
  connectionState = ConnectionState.DISCONNECTED;


  const { idle, stream } = getVideoElements();
  const { idle, stream } = getVideoElements();
  idleVideoElement = idle;
  idleVideoElement = idle;
  streamVideoElement = stream;
  streamVideoElement = stream;


  if (idleVideoElement) idleVideoElement.setAttribute('playsinline', '');
  if (idleVideoElement) idleVideoElement.setAttribute('playsinline', '');
  if (streamVideoElement) streamVideoElement.setAttribute('playsinline', '');
  if (streamVideoElement) streamVideoElement.setAttribute('playsinline', '');


  initializeTransitionCanvas();
  initializeTransitionCanvas();


  await loadAvatars();
  await loadAvatars();
  populateAvatarSelect();
  populateAvatarSelect();


  const contextInput = document.getElementById('context-input');
  const contextInput = document.getElementById('context-input');
  contextInput.value = context.trim();
  contextInput.value = context.trim();
  contextInput.addEventListener('input', () => {
  contextInput.addEventListener('input', () => {
    if (!contextInput.value.includes('Original Context:')) {
    if (!contextInput.value.includes('Original Context:')) {
      context = contextInput.value.trim();
      context = contextInput.value.trim();
    }
    }
  });
  });


  const sendTextButton = document.getElementById('send-text-button');
  const sendTextButton = document.getElementById('send-text-button');
  const textInput = document.getElementById('text-input');
  const textInput = document.getElementById('text-input');
  const replaceContextButton = document.getElementById('replace-context-button');
  const replaceContextButton = document.getElementById('replace-context-button');
  const autoSpeakToggle = document.getElementById('auto-speak-toggle');
  const autoSpeakToggle = document.getElementById('auto-speak-toggle');
  const editAvatarButton = document.getElementById('edit-avatar-button');
  const editAvatarButton = document.getElementById('edit-avatar-button');


  sendTextButton.addEventListener('click', () => handleTextInput(textInput.value));
  sendTextButton.addEventListener('click', () => handleTextInput(textInput.value));
  textInput.addEventListener('keypress', (event) => {
  textInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') handleTextInput(textInput.value);
    if (event.key === 'Enter') handleTextInput(textInput.value);
  });
  });
  replaceContextButton.addEventListener('click', () => updateContext('replace'));
  replaceContextButton.addEventListener('click', () => updateContext('replace'));
  autoSpeakToggle.addEventListener('click', toggleAutoSpeak);
  autoSpeakToggle.addEventListener('click', toggleAutoSpeak);
  editAvatarButton.addEventListener('click', () => openAvatarModal(currentAvatar));
  editAvatarButton.addEventListener('click', () => openAvatarModal(currentAvatar));


  initializeWebSocket();
  initializeWebSocket();
  playIdleVideo();
  playIdleVideo();


  showLoadingSymbol();
  showLoadingSymbol();
  try {
  try {
    await initializePersistentStream();
    await initializePersistentStream();
    startConnectionHealthCheck();
    startConnectionHealthCheck();
    hideLoadingSymbol();
    hideLoadingSymbol();
  } catch (error) {
  } catch (error) {
    logger.error('Error during initialization:', error);
    logger.error('Error during initialization:', error);
    hideLoadingSymbol();
    hideLoadingSymbol();
    showErrorMessage('Failed to connect. Please try again.');
    showErrorMessage('Failed to connect. Please try again.');
    connectionState = ConnectionState.DISCONNECTED;
    connectionState = ConnectionState.DISCONNECTED;
  }
  }


  // Set up reconnection mechanism
  // Set up reconnection mechanism
  window.addEventListener('online', async () => {
  window.addEventListener('online', async () => {
    if (connectionState === ConnectionState.DISCONNECTED) {
    if (connectionState === ConnectionState.DISCONNECTED) {
      logger.info('Network connection restored. Attempting to reconnect...');
      logger.info('Network connection restored. Attempting to reconnect...');
      try {
      try {
        await backgroundReconnect();
        await backgroundReconnect();
      } catch (error) {
      } catch (error) {
        logger.error('Failed to reconnect after network restoration:', error);
        logger.error('Failed to reconnect after network restoration:', error);
      }
      }
    }
    }
  });
  });


  // Handle visibility change
  // Handle visibility change
  document.addEventListener('visibilitychange', () => {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && connectionState === ConnectionState.DISCONNECTED) {
    if (!document.hidden && connectionState === ConnectionState.DISCONNECTED) {
      logger.info('Page became visible. Checking connection...');
      logger.info('Page became visible. Checking connection...');
      if (navigator.onLine) {
      if (navigator.onLine) {
        backgroundReconnect();
        backgroundReconnect();
      }
      }
    }
    }
  });
  });


  logger.info('Initialization complete');
  logger.info('Initialization complete');
}
}


async function handleAvatarChange() {
async function handleAvatarChange() {
  currentAvatar = avatarSelect.value;
  currentAvatar = avatarSelect.value;
  if (currentAvatar === 'create-new') {
  if (currentAvatar === 'create-new') {
    openAvatarModal();
    openAvatarModal();
    return;
    return;
  }
  }


  const idleVideoElement = document.getElementById('idle-video-element');
  const idleVideoElement = document.getElementById('idle-video-element');
  if (idleVideoElement) {
  if (idleVideoElement) {
    idleVideoElement.src = avatars[currentAvatar].silentVideoUrl;
    idleVideoElement.src = avatars[currentAvatar].silentVideoUrl;
    try {
    try {
      await idleVideoElement.load();
      await idleVideoElement.load();
      logger.debug(`Idle video loaded for ${currentAvatar}`);
      logger.debug(`Idle video loaded for ${currentAvatar}`);
    } catch (error) {
    } catch (error) {
      logger.error(`Error loading idle video for ${currentAvatar}:`, error);
      logger.error(`Error loading idle video for ${currentAvatar}:`, error);
    }
    }
  }
  }


  const streamVideoElement = document.getElementById('stream-video-element');
  const streamVideoElement = document.getElementById('stream-video-element');
  if (streamVideoElement) {
  if (streamVideoElement) {
    streamVideoElement.srcObject = null;
    streamVideoElement.srcObject = null;
  }
  }


  await stopRecording();
  await stopRecording();
  currentUtterance = '';
  currentUtterance = '';
  interimMessageAdded = false;
  interimMessageAdded = false;
  const msgHistory = document.getElementById('msgHistory');
  const msgHistory = document.getElementById('msgHistory');
  msgHistory.innerHTML = '';
  msgHistory.innerHTML = '';
  chatHistory = [];
  chatHistory = [];


  await destroyPersistentStream();
  await destroyPersistentStream();
  await initializePersistentStream();
  await initializePersistentStream();
}
}


async function loadAvatars() {
async function loadAvatars() {
  try {
  try {
    const response = await fetch('/avatars');
    const response = await fetch('/avatars');
    if (!response.ok) {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    }
    avatars = await response.json();
    avatars = await response.json();
    logger.debug('Avatars loaded:', avatars);
    logger.debug('Avatars loaded:', avatars);
  } catch (error) {
  } catch (error) {
    logger.error('Error loading avatars:', error);
    logger.error('Error loading avatars:', error);
    showErrorMessage('Failed to load avatars. Please try again.');
    showErrorMessage('Failed to load avatars. Please try again.');
  }
  }
}
}


function populateAvatarSelect() {
function populateAvatarSelect() {
  const avatarSelect = document.getElementById('avatar-select');
  const avatarSelect = document.getElementById('avatar-select');
  avatarSelect.innerHTML = '';
  avatarSelect.innerHTML = '';


  const createNewOption = document.createElement('option');
  const createNewOption = document.createElement('option');
  createNewOption.value = 'create-new';
  createNewOption.value = 'create-new';
  createNewOption.textContent = 'Create New Avatar';
  createNewOption.textContent = 'Create New Avatar';
  avatarSelect.appendChild(createNewOption);
  avatarSelect.appendChild(createNewOption);


  for (const [key, value] of Object.entries(avatars)) {
  for (const [key, value] of Object.entries(avatars)) {
    const option = document.createElement('option');
    const option = document.createElement('option');
    option.value = key;
    option.value = key;
    option.textContent = value.name;
    option.textContent = value.name;
    avatarSelect.appendChild(option);
    avatarSelect.appendChild(option);
  }
  }


  if (Object.keys(avatars).length > 0) {
  if (Object.keys(avatars).length > 0) {
    currentAvatar = Object.keys(avatars)[0];
    currentAvatar = Object.keys(avatars)[0];
    avatarSelect.value = currentAvatar;
    avatarSelect.value = currentAvatar;
  }
  }
}
}


function openAvatarModal(avatarName = null) {
function openAvatarModal(avatarName = null) {
  const modal = document.getElementById('avatar-modal');
  const modal = document.getElementById('avatar-modal');
  const nameInput = document.getElementById('avatar-name');
  const nameInput = document.getElementById('avatar-name');
  const voiceInput = document.getElementById('avatar-voice');
  const voiceInput = document.getElementById('avatar-voice');
  const imagePreview = document.getElementById('avatar-image-preview');
  const imagePreview = document.getElementById('avatar-image-preview');
  const saveButton = document.getElementById('save-avatar-button');
  const saveButton = document.getElementById('save-avatar-button');


  if (avatarName && avatars[avatarName]) {
  if (avatarName && avatars[avatarName]) {
    nameInput.value = avatars[avatarName].name;
    nameInput.value = avatars[avatarName].name;
    voiceInput.value = avatars[avatarName].voiceId;
    voiceInput.value = avatars[avatarName].voiceId;
    imagePreview.src = avatars[avatarName].imageUrl;
    imagePreview.src = avatars[avatarName].imageUrl;
    saveButton.textContent = 'Update Avatar';
    saveButton.textContent = 'Update Avatar';
  } else {
  } else {
    nameInput.value = '';
    nameInput.value = '';
    voiceInput.value = 'en-US-GuyNeural';
    voiceInput.value = 'en-US-GuyNeural';
    imagePreview.src = '';
    imagePreview.src = '';
    saveButton.textContent = 'Create Avatar';
    saveButton.textContent = 'Create Avatar';
  }
  }


  modal.style.display = 'block';
  modal.style.display = 'block';
}
}


function closeAvatarModal() {
function closeAvatarModal() {
  const modal = document.getElementById('avatar-modal');
  const modal = document.getElementById('avatar-modal');
  modal.style.display = 'none';
  modal.style.display = 'none';
}
}


async function saveAvatar() {
async function saveAvatar() {
  const name = document.getElementById('avatar-name').value;
  const name = document.getElementById('avatar-name').value;
  const voiceId = document.getElementById('avatar-voice').value || 'en-US-GuyNeural';
  const voiceId = document.getElementById('avatar-voice').value || 'en-US-GuyNeural';
  const imageFile = document.getElementById('avatar-image').files[0];
  const imageFile = document.getElementById('avatar-image').files[0];


  if (!name) {
  if (!name) {
    showErrorMessage('Please fill in the avatar name.');
    showErrorMessage('Please fill in the avatar name.');
    return;
    return;
  }
  }


  const formData = new FormData();
  const formData = new FormData();
  formData.append('name', name);
  formData.append('name', name);
  formData.append('voiceId', voiceId);
  formData.append('voiceId', voiceId);
  if (imageFile) {
  if (imageFile) {
    formData.append('image', imageFile);
    formData.append('image', imageFile);
  }
  }


  showToast('Saving avatar...', 0);
  showToast('Saving avatar...', 0);


  try {
  try {
    const response = await fetch('/avatar', {
    const response = await fetch('/avatar', {
      method: 'POST',
      method: 'POST',
      body: formData,
      body: formData,
    });
    });


    const reader = response.body.getReader();
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const decoder = new TextDecoder();


    while (true) {
    while (true) {
      const { done, value } = await reader.read();
      const { done, value } = await reader.read();
      if (done) break;
      if (done) break;


      const chunk = decoder.decode(value);
      const chunk = decoder.decode(value);
      const events = chunk.split('\n\n');
      const events = chunk.split('\n\n');


      for (const event of events) {
      for (const event of events) {
        if (event.startsWith('data: ')) {
        if (event.startsWith('data: ')) {
          const data = JSON.parse(event.slice(6));
          const data = JSON.parse(event.slice(6));
          if (data.status === 'processing') {
          if (data.status === 'processing') {
            showToast('Processing avatar...', 0);
            showToast('Processing avatar...', 0);
          } else if (data.status === 'completed') {
          } else if (data.status === 'completed') {
            avatars[name] = data.avatar;
            avatars[name] = data.avatar;
            populateAvatarSelect();
            populateAvatarSelect();
            closeAvatarModal();
            closeAvatarModal();
            showToast('Avatar created successfully!', 3000);
            showToast('Avatar created successfully!', 3000);
          } else if (data.status === 'error') {
          } else if (data.status === 'error') {
            showErrorMessage(data.message);
            showErrorMessage(data.message);
          }
          }
        }
        }
      }
      }
    }
    }
  } catch (error) {
  } catch (error) {
    console.error('Error saving avatar:', error);
    console.error('Error saving avatar:', error);
    showErrorMessage('Failed to save avatar. Please try again.');
    showErrorMessage('Failed to save avatar. Please try again.');
  }
  }
}
}


function updateContext(action) {
function updateContext(action) {
  const contextInput = document.getElementById('context-input');
  const contextInput = document.getElementById('context-input');
  const newContext = contextInput.value.trim();
  const newContext = contextInput.value.trim();


  if (newContext) {
  if (newContext) {
    const originalContext = context;
    const originalContext = context;
    if (action === 'append') {
    if (action === 'append') {
      context += '\n' + newContext;
      context += '\n' + newContext;
    } else if (action === 'replace') {
    } else if (action === 'replace') {
      context = newContext;
      context = newContext;
    }
    }
    logger.debug('Context updated:', context);
    logger.debug('Context updated:', context);
    showToast('Context saved successfully');
    showToast('Context saved successfully');


    displayBothContexts(originalContext, context);
    displayBothContexts(originalContext, context);
  } else {
  } else {
    showToast('Please enter some text before updating the context');
    showToast('Please enter some text before updating the context');
  }
  }
}
}


function displayBothContexts(original, updated) {
function displayBothContexts(original, updated) {
  const contextInput = document.getElementById('context-input');
  const contextInput = document.getElementById('context-input');
  contextInput.value = `Original Context:\n${original}\n\nNew Context:\n${updated}`;
  contextInput.value = `Original Context:\n${original}\n\nNew Context:\n${updated}`;


  setTimeout(() => {
  setTimeout(() => {
    contextInput.value = updated;
    contextInput.value = updated;
  }, 3000);
  }, 3000);
}
}


function showToast(message) {
function showToast(message) {
  const toast = document.createElement('div');
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.transform = 'translateX(-50%)';
  toast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  toast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  toast.style.color = 'white';
  toast.style.color = 'white';
  toast.style.padding = '10px 20px';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '5px';
  toast.style.borderRadius = '5px';
  toast.style.zIndex = '1000';
  toast.style.zIndex = '1000';


  document.body.appendChild(toast);
  document.body.appendChild(toast);


  setTimeout(() => {
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease-out';
    toast.style.transition = 'opacity 0.5s ease-out';
    setTimeout(() => {
    setTimeout(() => {
      document.body.removeChild(toast);
      document.body.removeChild(toast);
    }, 500);
    }, 500);
  }, 3000);
  }, 3000);
}
}


if (document.readyState === 'loading') {
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
  document.addEventListener('DOMContentLoaded', initialize);
} else {
} else {
  initialize();
  initialize();
}
}


function showLoadingSymbol() {
function showLoadingSymbol() {
  const loadingSymbol = document.createElement('div');
  const loadingSymbol = document.createElement('div');
  loadingSymbol.id = 'loading-symbol';
  loadingSymbol.id = 'loading-symbol';
  loadingSymbol.innerHTML = 'Connecting...';
  loadingSymbol.innerHTML = 'Connecting...';
  loadingSymbol.style.position = 'absolute';
  loadingSymbol.style.position = 'absolute';
  loadingSymbol.style.top = '50%';
  loadingSymbol.style.top = '50%';
  loadingSymbol.style.left = '50%';
  loadingSymbol.style.left = '50%';
  loadingSymbol.style.transform = 'translate(-50%, -50%)';
  loadingSymbol.style.transform = 'translate(-50%, -50%)';
  loadingSymbol.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  loadingSymbol.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  loadingSymbol.style.color = 'white';
  loadingSymbol.style.color = 'white';
  loadingSymbol.style.padding = '10px';
  loadingSymbol.style.padding = '10px';
  loadingSymbol.style.borderRadius = '5px';
  loadingSymbol.style.borderRadius = '5px';
  loadingSymbol.style.zIndex = '9999';
  loadingSymbol.style.zIndex = '9999';
  document.body.appendChild(loadingSymbol);
  document.body.appendChild(loadingSymbol);
}
}


function hideLoadingSymbol() {
function hideLoadingSymbol() {
  const loadingSymbol = document.getElementById('loading-symbol');
  const loadingSymbol = document.getElementById('loading-symbol');
  if (loadingSymbol) {
  if (loadingSymbol) {
    document.body.removeChild(loadingSymbol);
    document.body.removeChild(loadingSymbol);
  }
  }
}
}


function showErrorMessage(message) {
function showErrorMessage(message) {
  const errorMessage = document.createElement('div');
  const errorMessage = document.createElement('div');
  errorMessage.innerHTML = message;
  errorMessage.innerHTML = message;
  errorMessage.style.color = 'red';
  errorMessage.style.color = 'red';
  errorMessage.style.marginBottom = '10px';
  errorMessage.style.marginBottom = '10px';
  document.body.appendChild(errorMessage);
  document.body.appendChild(errorMessage);


  const destroyButton = document.getElementById('destroy-button');
  const destroyButton = document.getElementById('destroy-button');
  const connectButton = document.getElementById('connect-button');
  const connectButton = document.getElementById('connect-button');
  connectButton.onclick = initializePersistentStream;
  connectButton.onclick = initializePersistentStream;


  if (destroyButton) destroyButton.style.display = 'inline-block';
  if (destroyButton) destroyButton.style.display = 'inline-block';
  destroyButton.onclick = destroyPersistentStream;
  destroyButton.onclick = destroyPersistentStream;


  if (connectButton) connectButton.style.display = 'inline-block';
  if (connectButton) connectButton.style.display = 'inline-block';
}
}


async function createPeerConnection(offer, iceServers) {
async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({ iceServers });
    peerConnection = new RTCPeerConnection({ iceServers });
    pcDataChannel = peerConnection.createDataChannel('JanusDataChannel');
    pcDataChannel = peerConnection.createDataChannel('JanusDataChannel');
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);
    peerConnection.addEventListener('track', onTrack, true);


    pcDataChannel.onopen = () => {
    pcDataChannel.onopen = () => {
      logger.debug('Data channel opened');
      logger.debug('Data channel opened');
    };
    };
    pcDataChannel.onclose = () => {
    pcDataChannel.onclose = () => {
      logger.debug('Data channel closed');
      logger.debug('Data channel closed');
    };
    };
    pcDataChannel.onerror = (error) => {
    pcDataChannel.onerror = (error) => {
      logger.error('Data channel error:', error);
      logger.error('Data channel error:', error);
    };
    };
    pcDataChannel.onmessage = onStreamEvent;
    pcDataChannel.onmessage = onStreamEvent;
  }
  }


  await peerConnection.setRemoteDescription(offer);
  await peerConnection.setRemoteDescription(offer);
  logger.debug('Set remote SDP');
  logger.debug('Set remote SDP');


  const sessionClientAnswer = await peerConnection.createAnswer();
  const sessionClientAnswer = await peerConnection.createAnswer();
  logger.debug('Created local SDP');
  logger.debug('Created local SDP');


  await peerConnection.setLocalDescription(sessionClientAnswer);
  await peerConnection.setLocalDescription(sessionClientAnswer);
  logger.debug('Set local SDP');
  logger.debug('Set local SDP');


  return sessionClientAnswer;
  return sessionClientAnswer;
}
}


function onIceGatheringStateChange() {
function onIceGatheringStateChange() {
  const { iceGathering: iceGatheringStatusLabel } = getStatusLabels();
  const { iceGathering: iceGatheringStatusLabel } = getStatusLabels();
  if (iceGatheringStatusLabel) {
  if (iceGatheringStatusLabel) {
    iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
    iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
    iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
    iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
  }
  }
  logger.debug('ICE gathering state changed:', peerConnection.iceGatheringState);
  logger.debug('ICE gathering state changed:', peerConnection.iceGatheringState);
}
}


function onIceCandidate(event) {
function onIceCandidate(event) {
  if (event.candidate && persistentStreamId && persistentSessionId) {
  if (event.candidate && persistentStreamId && persistentSessionId) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;
    logger.debug('New ICE candidate:', candidate);
    logger.debug('New ICE candidate:', candidate);


    fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}/ice`, {
    fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}/ice`, {
      method: 'POST',
      method: 'POST',
      headers: {
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
        'Content-Type': 'application/json',
      },
      },
      body: JSON.stringify({
      body: JSON.stringify({
        candidate,
        candidate,
        sdpMid,
        sdpMid,
        sdpMLineIndex,
        sdpMLineIndex,
        session_id: persistentSessionId,
        session_id: persistentSessionId,
      }),
      }),
    }).catch((error) => {
    }).catch((error) => {
      logger.error('Error sending ICE candidate:', error);
      logger.error('Error sending ICE candidate:', error);
    });
    });
  }
  }
}
}


function onIceConnectionStateChange() {
function onIceConnectionStateChange() {
  const { ice: iceStatusLabel } = getStatusLabels();
  const { ice: iceStatusLabel } = getStatusLabels();
  if (iceStatusLabel) {
  if (iceStatusLabel) {
    iceStatusLabel.innerText = peerConnection.iceConnectionState;
    iceStatusLabel.innerText = peerConnection.iceConnectionState;
    iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
    iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
  }
  }
  logger.debug('ICE connection state changed:', peerConnection.iceConnectionState);
  logger.debug('ICE connection state changed:', peerConnection.iceConnectionState);


  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    stopAllStreams();
    closePC();
    closePC();
    showErrorMessage('Connection lost. Please try again.');
    showErrorMessage('Connection lost. Please try again.');
  }
  }
}
}


async function attemptReconnect() {
async function attemptReconnect() {
  logger.debug('Attempting to reconnect...');
  logger.debug('Attempting to reconnect...');
  try {
  try {
    await reinitializeConnection();
    await reinitializeConnection();
    logger.debug('Reconnection successful');
    logger.debug('Reconnection successful');
    reconnectAttempts = 0;
    reconnectAttempts = 0;
  } catch (error) {
  } catch (error) {
    logger.error('Reconnection attempt failed:', error);
    logger.error('Reconnection attempt failed:', error);
    scheduleReconnect();
    scheduleReconnect();
  }
  }
}
}


function onConnectionStateChange() {
function onConnectionStateChange() {
  const { peer: peerStatusLabel } = getStatusLabels();
  const { peer: peerStatusLabel } = getStatusLabels();
  if (peerStatusLabel) {
  if (peerStatusLabel) {
    peerStatusLabel.innerText = peerConnection.connectionState;
    peerStatusLabel.innerText = peerConnection.connectionState;
    peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
    peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
  }
  }
  logger.debug('Peer connection state changed:', peerConnection.connectionState);
  logger.debug('Peer connection state changed:', peerConnection.connectionState);


  if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
  if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
    logger.warn('Peer connection failed or disconnected. Attempting to reconnect...');
    logger.warn('Peer connection failed or disconnected. Attempting to reconnect...');
    connectionState = ConnectionState.DISCONNECTED;
    connectionState = ConnectionState.DISCONNECTED;
    backgroundReconnect();
    backgroundReconnect();
  } else if (peerConnection.connectionState === 'connected') {
  } else if (peerConnection.connectionState === 'connected') {
    logger.debug('Peer connection established successfully');
    logger.debug('Peer connection established successfully');
    connectionState = ConnectionState.CONNECTED;
    connectionState = ConnectionState.CONNECTED;
    reconnectAttempts = 0;
    reconnectAttempts = 0;
  }
  }
}
}


function startConnectionHealthCheck() {
function startConnectionHealthCheck() {
  setInterval(() => {
  setInterval(() => {
    if (peerConnection) {
    if (peerConnection) {
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        logger.warn('Connection health check detected disconnected state. Attempting to reconnect...');
        logger.warn('Connection health check detected disconnected state. Attempting to reconnect...');
        connectionState = ConnectionState.DISCONNECTED;
        connectionState = ConnectionState.DISCONNECTED;
        backgroundReconnect();
        backgroundReconnect();
      } else if (peerConnection.connectionState === 'connected') {
      } else if (peerConnection.connectionState === 'connected') {
        const timeSinceLastConnection = Date.now() - lastConnectionTime;
        const timeSinceLastConnection = Date.now() - lastConnectionTime;
        if (timeSinceLastConnection > RECONNECTION_INTERVAL * 0.9) {
        if (timeSinceLastConnection > RECONNECTION_INTERVAL * 0.9) {
          logger.info('Approaching reconnection threshold. Initiating background reconnect.');
          logger.info('Approaching reconnection threshold. Initiating background reconnect.');
          backgroundReconnect();
          backgroundReconnect();
        }
        }
      }
      }
    }
    }
  }, 30000); // Check every 30 seconds
  }, 30000); // Check every 30 seconds
}
}


function onSignalingStateChange() {
function onSignalingStateChange() {
  const { signaling: signalingStatusLabel } = getStatusLabels();
  const { signaling: signalingStatusLabel } = getStatusLabels();
  if (signalingStatusLabel) {
  if (signalingStatusLabel) {
    signalingStatusLabel.innerText = peerConnection.signalingState;
    signalingStatusLabel.innerText = peerConnection.signalingState;
    signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
    signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
  }
  }
  logger.debug('Signaling state changed:', peerConnection.signalingState);
  logger.debug('Signaling state changed:', peerConnection.signalingState);
}
}


function onVideoStatusChange(videoIsPlaying, stream) {
function onVideoStatusChange(videoIsPlaying, stream) {
  let status = videoIsPlaying ? 'streaming' : 'empty';
  let status = videoIsPlaying ? 'streaming' : 'empty';


  if (status === lastVideoStatus) {
  if (status === lastVideoStatus) {
    logger.debug('Video status unchanged:', status);
    logger.debug('Video status unchanged:', status);
    return;
    return;
  }
  }


  logger.debug('Video status changing from', lastVideoStatus, 'to', status);
  logger.debug('Video status changing from', lastVideoStatus, 'to', status);


  const streamVideoElement = document.getElementById('stream-video-element');
  const streamVideoElement = document.getElementById('stream-video-element');
  const idleVideoElement = document.getElementById('idle-video-element');
  const idleVideoElement = document.getElementById('idle-video-element');


  if (!streamVideoElement || !idleVideoElement) {
  if (!streamVideoElement || !idleVideoElement) {
    logger.error('Video elements not found');
    logger.error('Video elements not found');
    return;
    return;
  }
  }


  if (status === 'streaming') {
  if (status === 'streaming') {
    setStreamVideoElement(stream);
    setStreamVideoElement(stream);
  } else {
  } else {
    smoothTransition(false);
    smoothTransition(false);
  }
  }


  lastVideoStatus = status;
  lastVideoStatus = status;


  const streamingStatusLabel = document.getElementById('streaming-status-label');
  const streamingStatusLabel = document.getElementById('streaming-status-label');
  if (streamingStatusLabel) {
  if (streamingStatusLabel) {
    streamingStatusLabel.innerText = status;
    streamingStatusLabel.innerText = status;
    streamingStatusLabel.className = 'streamingState-' + status;
    streamingStatusLabel.className = 'streamingState-' + status;
  }
  }


  logger.debug('Video status changed:', status);
  logger.debug('Video status changed:', status);
}
}


function setStreamVideoElement(stream) {
function setStreamVideoElement(stream) {
  const streamVideoElement = document.getElementById('stream-video-element');
  const streamVideoElement = document.getElementById('stream-video-element');
  if (!streamVideoElement) {
  if (!streamVideoElement) {
    logger.error('Stream video element not found');
    logger.error('Stream video element not found');
    return;
    return;
  }
  }


  logger.debug('Setting stream video element');
  logger.debug('Setting stream video element');
  if (stream instanceof MediaStream) {
  if (stream instanceof MediaStream) {
    streamVideoElement.srcObject = stream;
    streamVideoElement.srcObject = stream;
  } else {
  } else {
    logger.warn('Invalid stream provided to setStreamVideoElement');
    logger.warn('Invalid stream provided to setStreamVideoElement');
    return;
    return;
  }
  }


  streamVideoElement.onloadedmetadata = () => {
  streamVideoElement.onloadedmetadata = () => {
    logger.debug('Stream video metadata loaded');
    logger.debug('Stream video metadata loaded');
    streamVideoElement
    streamVideoElement
      .play()
      .play()
      .then(() => {
      .then(() => {
        logger.debug('Stream video playback started');
        logger.debug('Stream video playback started');
        smoothTransition(true);
        smoothTransition(true);
      })
      })
      .catch((e) => logger.error('Error playing stream video:', e));
      .catch((e) => logger.error('Error playing stream video:', e));
  };
  };


  streamVideoElement.oncanplay = () => {
  streamVideoElement.oncanplay = () => {
    logger.debug('Stream video can play');
    logger.debug('Stream video can play');
  };
  };


  streamVideoElement.onerror = (e) => {
  streamVideoElement.onerror = (e) => {
    logger.error('Error with stream video:', e);
    logger.error('Error with stream video:', e);
  };
  };
}
}


function onStreamEvent(message) {
function onStreamEvent(message) {
  if (pcDataChannel.readyState === 'open') {
  if (pcDataChannel.readyState === 'open') {
    let status;
    let status;
    const [event, _] = message.data.split(':');
    const [event, _] = message.data.split(':');


    switch (event) {
    switch (event) {
      case 'stream/started':
      case 'stream/started':
        status = 'started';
        status = 'started';
        break;
        break;
      case 'stream/done':
      case 'stream/done':
        status = 'done';
        status = 'done';
        break;
        break;
      case 'stream/ready':
      case 'stream/ready':
        status = 'ready';
        status = 'ready';
        break;
        break;
      case 'stream/error':
      case 'stream/error':
        status = 'error';
        status = 'error';
        break;
        break;
      default:
      default:
        status = 'dont-care';
        status = 'dont-care';
        break;
        break;
    }
    }


    // Set stream ready after a short delay, adjusting for potential timing differences between data and stream channels
    // Set stream ready after a short delay, adjusting for potential timing differences between data and stream channels
    if (status === 'ready') {
    if (status === 'ready') {
      setTimeout(() => {
      setTimeout(() => {
        console.log('stream/ready');
        console.log('stream/ready');
        isStreamReady = true;
        isStreamReady = true;
        const streamEventLabel = document.getElementById('stream-event-label');
        const streamEventLabel = document.getElementById('stream-event-label');
        if (streamEventLabel) {
        if (streamEventLabel) {
          streamEventLabel.innerText = 'ready';
          streamEventLabel.innerText = 'ready';
          streamEventLabel.className = 'streamEvent-ready';
          streamEventLabel.className = 'streamEvent-ready';
        }
        }
      }, 1000);
      }, 1000);
    } else {
    } else {
      console.log(event);
      console.log(event);
      const streamEventLabel = document.getElementById('stream-event-label');
      const streamEventLabel = document.getElementById('stream-event-label');
      if (streamEventLabel) {
      if (streamEventLabel) {
        streamEventLabel.innerText = status === 'dont-care' ? event : status;
        streamEventLabel.innerText = status === 'dont-care' ? event : status;
        streamEventLabel.className = 'streamEvent-' + status;
        streamEventLabel.className = 'streamEvent-' + status;
      }
      }
    }
    }
  }
  }
}
}


function onTrack(event) {
function onTrack(event) {
  logger.debug('onTrack event:', event);
  logger.debug('onTrack event:', event);
  if (!event.track) {
  if (!event.track) {
    logger.warn('No track in onTrack event');
    logger.warn('No track in onTrack event');
    return;
    return;
  }
  }


  if (statsIntervalId) {
  if (statsIntervalId) {
    clearInterval(statsIntervalId);
    clearInterval(statsIntervalId);
  }
  }


  statsIntervalId = setInterval(async () => {
  statsIntervalId = setInterval(async () => {
    if (peerConnection && peerConnection.connectionState === 'connected') {
    if (peerConnection && peerConnection.connectionState === 'connected') {
      try {
      try {
        const stats = await peerConnection.getStats(event.track);
        const stats = await peerConnection.getStats(event.track);
        let videoStatsFound = false;
        let videoStatsFound = false;
        stats.forEach((report) => {
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            videoStatsFound = true;
            videoStatsFound = true;
            const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived;
            const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived;


            // logger.debug('Video stats:', {
            // logger.debug('Video stats:', {
            //  bytesReceived: report.bytesReceived,
            //  bytesReceived: report.bytesReceived,
            //  lastBytesReceived,
            //  lastBytesReceived,
            //  videoIsPlaying,
            //  videoIsPlaying,
            //  videoStatusChanged
            //  videoStatusChanged
            // });
            // });


            if (videoStatusChanged) {
            if (videoStatusChanged) {
              videoIsPlaying = report.bytesReceived > lastBytesReceived;
              videoIsPlaying = report.bytesReceived > lastBytesReceived;
              logger.debug('Video status changed:', videoIsPlaying);
              logger.debug('Video status changed:', videoIsPlaying);
              onVideoStatusChange(videoIsPlaying, event.streams[0]);
              onVideoStatusChange(videoIsPlaying, event.streams[0]);
            }
            }
            lastBytesReceived = report.bytesReceived;
            lastBytesReceived = report.bytesReceived;
          }
          }
        });
        });
        if (!videoStatsFound) {
        if (!videoStatsFound) {
          logger.debug('No video stats found yet.');
          logger.debug('No video stats found yet.');
        }
        }
      } catch (error) {
      } catch (error) {
        logger.error('Error getting stats:', error);
        logger.error('Error getting stats:', error);
      }
      }
    } else {
    } else {
      logger.debug('Peer connection not ready for stats.');
      logger.debug('Peer connection not ready for stats.');
    }
    }
  }, 250); // Check every 500ms
  }, 250); // Check every 500ms


  if (event.streams && event.streams.length > 0) {
  if (event.streams && event.streams.length > 0) {
    const stream = event.streams[0];
    const stream = event.streams[0];
    if (stream.getVideoTracks().length > 0) {
    if (stream.getVideoTracks().length > 0) {
      logger.debug('Setting stream video element with track:', event.track.id);
      logger.debug('Setting stream video element with track:', event.track.id);
      setStreamVideoElement(stream);
      setStreamVideoElement(stream);
    } else {
    } else {
      logger.warn('Stream does not contain any video tracks');
      logger.warn('Stream does not contain any video tracks');
    }
    }
  } else {
  } else {
    logger.warn('No streams found in onTrack event');
    logger.warn('No streams found in onTrack event');
  }
  }


  if (isDebugMode) {
  if (isDebugMode) {
    // downloadStreamVideo(event.streams[0]);
    // downloadStreamVideo(event.streams[0]);
  }
  }
}
}


function playIdleVideo() {
function playIdleVideo() {
  const { idle: idleVideoElement } = getVideoElements();
  const { idle: idleVideoElement } = getVideoElements();
  if (!idleVideoElement) {
  if (!idleVideoElement) {
    logger.error('Idle video element not found');
    logger.error('Idle video element not found');
    return;
    return;
  }
  }


  if (!currentAvatar || !avatars[currentAvatar]) {
  if (!currentAvatar || !avatars[currentAvatar]) {
    logger.warn(`No avatar selected or avatar ${currentAvatar} not found. Using default idle video.`);
    logger.warn(`No avatar selected or avatar ${currentAvatar} not found. Using default idle video.`);
    idleVideoElement.src = 'path/to/default/idle/video.mp4'; // Replace with your default video path
    idleVideoElement.src = 'path/to/default/idle/video.mp4'; // Replace with your default video path
  } else {
  } else {
    idleVideoElement.src = avatars[currentAvatar].silentVideoUrl;
    idleVideoElement.src = avatars[currentAvatar].silentVideoUrl;
  }
  }


  idleVideoElement.loop = true;
  idleVideoElement.loop = true;


  idleVideoElement.onloadeddata = () => {
  idleVideoElement.onloadeddata = () => {
    logger.debug(`Idle video loaded successfully for ${currentAvatar || 'default'}`);
    logger.debug(`Idle video loaded successfully for ${currentAvatar || 'default'}`);
  };
  };


  idleVideoElement.onerror = (e) => {
  idleVideoElement.onerror = (e) => {
    logger.error(`Error loading idle video for ${currentAvatar || 'default'}:`, e);
    logger.error(`Error loading idle video for ${currentAvatar || 'default'}:`, e);
  };
  };


  idleVideoElement.play().catch((e) => logger.error('Error playing idle video:', e));
  idleVideoElement.play().catch((e) => logger.error('Error playing idle video:', e));
}
}


function stopAllStreams() {
function stopAllStreams() {
  if (streamVideoElement && streamVideoElement.srcObject) {
  if (streamVideoElement && streamVideoElement.srcObject) {
    logger.debug('Stopping video streams');
    logger.debug('Stopping video streams');
    streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    streamVideoElement.srcObject = null;
    streamVideoElement.srcObject = null;
  }
  }
}
}


function closePC(pc = peerConnection) {
function closePC(pc = peerConnection) {
  if (!pc) return;
  if (!pc) return;
  logger.debug('Stopping peer connection');
  logger.debug('Stopping peer connection');
  pc.close();
  pc.close();
  pc.removeEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
  pc.removeEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
  pc.removeEventListener('icecandidate', onIceCandidate, true);
  pc.removeEventListener('icecandidate', onIceCandidate, true);
  pc.removeEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
  pc.removeEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
  pc.removeEventListener('connectionstatechange', onConnectionStateChange, true);
  pc.removeEventListener('connectionstatechange', onConnectionStateChange, true);
  pc.removeEventListener('signalingstatechange', onSignalingStateChange, true);
  pc.removeEventListener('signalingstatechange', onSignalingStateChange, true);
  pc.removeEventListener('track', onTrack, true);
  pc.removeEventListener('track', onTrack, true);
  clearInterval(statsIntervalId);
  clearInterval(statsIntervalId);
  const labels = getStatusLabels();
  const labels = getStatusLabels();
  if (labels.iceGathering) labels.iceGathering.innerText = '';
  if (labels.iceGathering) labels.iceGathering.innerText = '';
  if (labels.signaling) labels.signaling.innerText = '';
  if (labels.signaling) labels.signaling.innerText = '';
  if (labels.ice) labels.ice.innerText = '';
  if (labels.ice) labels.ice.innerText = '';
  if (labels.peer) labels.peer.innerText = '';
  if (labels.peer) labels.peer.innerText = '';
  logger.debug('Stopped peer connection');
  logger.debug('Stopped peer connection');
  if (pc === peerConnection) {
  if (pc === peerConnection) {
    peerConnection = null;
    peerConnection = null;
  }
  }
}
}


async function fetchWithRetries(url, options, retries = 0, delayMs = 1000) {
async function fetchWithRetries(url, options, retries = 0, delayMs = 1000) {
  try {
  try {
    const now = Date.now();
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallTime;
    const timeSinceLastCall = now - lastApiCallTime;


    if (timeSinceLastCall < API_CALL_INTERVAL) {
    if (timeSinceLastCall < API_CALL_INTERVAL) {
      await new Promise((resolve) => setTimeout(resolve, API_CALL_INTERVAL - timeSinceLastCall));
      await new Promise((resolve) => setTimeout(resolve, API_CALL_INTERVAL - timeSinceLastCall));
    }
    }


    lastApiCallTime = Date.now();
    lastApiCallTime = Date.now();


    const response = await fetch(url, options);
    const response = await fetch(url, options);
    if (!response.ok) {
    if (!response.ok) {
      if (response.status === 429) {
      if (response.status === 429) {
        // If rate limited, wait for a longer time before retrying
        // If rate limited, wait for a longer time before retrying
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        logger.warn(`Rate limited. Retrying after ${retryAfter} seconds.`);
        logger.warn(`Rate limited. Retrying after ${retryAfter} seconds.`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        return fetchWithRetries(url, options, retries, delayMs);
        return fetchWithRetries(url, options, retries, delayMs);
      }
      }
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }
    }
    return response;
    return response;
  } catch (err) {
  } catch (err) {
    if (retries < maxRetryCount) {
    if (retries < maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) * delayMs + Math.random() * 1000, maxDelaySec * 1000);
      const delay = Math.min(Math.pow(2, retries) * delayMs + Math.random() * 1000, maxDelaySec * 1000);
      logger.warn(`Request failed, retrying ${retries + 1}/${maxRetryCount} in ${delay}ms. Error: ${err.message}`);
      logger.warn(`Request failed, retrying ${retries + 1}/${maxRetryCount} in ${delay}ms. Error: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetries(url, options, retries + 1, delayMs);
      return fetchWithRetries(url, options, retries + 1, delayMs);
    } else {
    } else {
      throw err;
      throw err;
    }
    }
  }
  }
}
}


async function initializeConnection() {
async function initializeConnection() {
  if (isInitializing) {
  if (isInitializing) {
    logger.warn('Connection initialization already in progress. Skipping initialize.');
    logger.warn('Connection initialization already in progress. Skipping initialize.');
    return;
    return;
  }
  }


  isInitializing = true;
  isInitializing = true;
  logger.info('Initializing connection...');
  logger.info('Initializing connection...');


  try {
  try {
    stopAllStreams();
    stopAllStreams();
    closePC();
    closePC();


    if (!currentAvatar || !avatars[currentAvatar]) {
    if (!currentAvatar || !avatars[currentAvatar]) {
      throw new Error('No avatar selected or avatar not found');
      throw new Error('No avatar selected or avatar not found');
    }
    }


    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
      method: 'POST',
      method: 'POST',
      headers: {
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
        'Content-Type': 'application/json',
      },
      },
      body: JSON.stringify({
      body: JSON.stringify({
        source_url: avatars[currentAvatar].imageUrl,
        source_url: avatars[currentAvatar].imageUrl,
        driver_url: 'bank://lively/driver-06',
        driver_url: 'bank://lively/driver-06',
        output_resolution: 512,
        output_resolution: 512,
        stream_warmup: true,
        stream_warmup: true,
        config: {
        config: {
          stitch: true,
          stitch: true,
          fluent: true,
          fluent: true,
          auto_match: true,
          auto_match: true,
          pad_audio: 0.5,
          pad_audio: 0.5,
          normalization_factor: 0.1,
          normalization_factor: 0.1,
          align_driver: true,
          align_driver: true,
          motion_factor: 0.55,
          motion_factor: 0.55,
          align_expand_factor: 0.3,
          align_expand_factor: 0.3,
          driver_expressions: {
          driver_expressions: {
            expressions: [
            expressions: [
              {
              {
                start_frame: 0,
                start_frame: 0,
                expression: 'neutral',
                expression: 'neutral',
                intensity: 0.5,
                intensity: 0.5,
              },
              },
            ],
            ],
          },
          },
        },
        },
      }),
      }),
    });
    });


    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();


    if (!newStreamId || !newSessionId) {
    if (!newStreamId || !newSessionId) {
      throw new Error('Failed to get valid stream ID or session ID from API');
      throw new Error('Failed to get valid stream ID or session ID from API');
    }
    }


    streamId = newStreamId;
    streamId = newStreamId;
    sessionId = newSessionId;
    sessionId = newSessionId;
    logger.info('Stream created:', { streamId, sessionId });
    logger.info('Stream created:', { streamId, sessionId });


    try {
    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
    } catch (e) {
      logger.error('Error during streaming setup:', e);
      logger.error('Error during streaming setup:', e);
      stopAllStreams();
      stopAllStreams();
      closePC();
      closePC();
      throw e;
      throw e;
    }
    }


    await new Promise((resolve) => setTimeout(resolve, 6000));
    await new Promise((resolve) => setTimeout(resolve, 6000));


    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, {
    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, {
      method: 'POST',
      method: 'POST',
      headers: {
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
        'Content-Type': 'application/json',
      },
      },
      body: JSON.stringify({
      body: JSON.stringify({
        answer: sessionClientAnswer,
        answer: sessionClientAnswer,
        session_id: sessionId,
        session_id: sessionId,
      }),
      }),
    });
    });


    if (!sdpResponse.ok) {
    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }
    }


    logger.info('Connection initialized successfully');
    logger.info('Connection initialized successfully');
  } catch (error) {
  } catch (error) {
    logger.error('Failed to initialize connection:', error);
    logger.error('Failed to initialize connection:', error);
    throw error;
    throw error;
  } finally {
  } finally {
    isInitializing = false;
    isInitializing = false;
  }
  }
}
}


async function startStreaming(assistantReply) {
async function startStreaming(assistantReply) {
  try {
  try {
    logger.debug('Starting streaming with reply:', assistantReply);
    logger.debug('Starting streaming with reply:', assistantReply);
    if (!persistentStreamId || !persistentSessionId) {
    if (!persistentStreamId || !persistentSessionId) {
      logger.error('Persistent stream not initialized. Cannot start streaming.');
      logger.error('Persistent stream not initialized. Cannot start streaming.');
      await initializePersistentStream();
      await initializePersistentStream();
    }
    }


    if (!currentAvatar || !avatars[currentAvatar]) {
    if (!currentAvatar || !avatars[currentAvatar]) {
      logger.error('No avatar selected or avatar not found. Cannot start streaming.');
      logger.error('No avatar selected or avatar not found. Cannot start streaming.');
      return;
      return;
    }
    }


    const streamVideoElement = document.getElementById('stream-video-element');
    const streamVideoElement = document.getElementById('stream-video-element');
    const idleVideoElement = document.getElementById('idle-video-element');
    const idleVideoElement = document.getElementById('idle-video-element');


    if (!streamVideoElement || !idleVideoElement) {
    if (!streamVideoElement || !idleVideoElement) {
      logger.error('Video elements not found');
      logger.error('Video elements not found');
      return;
      return;
    }
    }


    // Remove outer <speak> tags if present
    // Remove outer <speak> tags if present
    let ssmlContent = assistantReply.trim();
    let ssmlContent = assistantReply.trim();
    if (ssmlContent.startsWith('<speak>') && ssmlContent.endsWith('</speak>')) {
    if (ssmlContent.startsWith('<speak>') && ssmlContent.endsWith('</speak>')) {
      ssmlContent = ssmlContent.slice(7, -8).trim();
      ssmlContent = ssmlContent.slice(7, -8).trim();
    }
    }


    // Split the SSML content into chunks, respecting SSML tags
    // Split the SSML content into chunks, respecting SSML tags
    const chunks = ssmlContent.match(/(?:<[^>]+>|[^<]+)+/g) || [];
    const chunks = ssmlContent.match(/(?:<[^>]+>|[^<]+)+/g) || [];


    logger.debug('Chunks', chunks);
    logger.debug('Chunks', chunks);


    for (let i = 0; i < chunks.length; i++) {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim();
      const chunk = chunks[i].trim();
      if (chunk.length === 0) continue;
      if (chunk.length === 0) continue;


      isAvatarSpeaking = true;
      isAvatarSpeaking = true;
      const playResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}`, {
      const playResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}`, {
        method: 'POST',
        method: 'POST',
        headers: {
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          Authorization: `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
          'Content-Type': 'application/json',
        },
        },
        body: JSON.stringify({
        body: JSON.stringify({
          script: {
          script: {
            type: 'text',
            type: 'text',
            input: chunk, // Send the chunk without additional <speak> tags
            input: chunk, // Send the chunk without additional <speak> tags
            ssml: true,
            ssml: true,
            provider: {
            provider: {
              type: 'microsoft',
              type: 'microsoft',
              voice_id: avatars[currentAvatar].voiceId,
              voice_id: avatars[currentAvatar].voiceId,
            },
            },
          },
          },
          session_id: persistentSessionId,
          session_id: persistentSessionId,
          driver_url: 'bank://lively/driver-06',
          driver_url: 'bank://lively/driver-06',
          output_resolution: 512,
          output_resolution: 512,
          stream_warmup: true,
          stream_warmup: true,
          config: {
          config: {
            fluent: true,
            fluent: true,
            stitch: true,
            stitch: true,
            pad_audio: 0.5,
            pad_audio: 0.5,
            auto_match: true,
            auto_match: true,
            align_driver: true,
            align_driver: true,
            normalization_factor: 0.1,
            normalization_factor: 0.1,
            align_expand_factor: 0.3,
            align_expand_factor: 0.3,
            motion_factor: 0.55,
            motion_factor: 0.55,
            result_format: 'mp4',
            result_format: 'mp4',
            driver_expressions: {
            driver_expressions: {
              expressions: [
              expressions: [
                {
                {
                  start_frame: 0,
                  start_frame: 0,
                  expression: 'neutral',
                  expression: 'neutral',
                  intensity: 0.5,
                  intensity: 0.5,
                },
                },
              ],
              ],
            },
            },
          },
          },
        }),
        }),
      });
      });


      if (!playResponse.ok) {
      if (!playResponse.ok) {
        throw new Error(`HTTP error! status: ${playResponse.status}`);
        throw new Error(`HTTP error! status: ${playResponse.status}`);
      }
      }


      const playResponseData = await playResponse.json();
      const playResponseData = await playResponse.json();
      logger.debug('Streaming response:', playResponseData);
      logger.debug('Streaming response:', playResponseData);


      if (playResponseData.status === 'started') {
      if (playResponseData.status === 'started') {
        logger.debug('Stream chunk started successfully');
        logger.debug('Stream chunk started successfully');


        if (playResponseData.result_url) {
        if (playResponseData.result_url) {
          // Wait for the video to be ready before transitioning
          // Wait for the video to be ready before transitioning
          await new Promise((resolve) => {
          await new Promise((resolve) => {
            streamVideoElement.src = playResponseData.result_url;
            streamVideoElement.src = playResponseData.result_url;
            streamVideoElement.oncanplay = resolve;
            streamVideoElement.oncanplay = resolve;
          });
          });


          // Perform the transition
          // Perform the transition
          smoothTransition(true);
          smoothTransition(true);


          await new Promise((resolve) => {
          await new Promise((resolve) => {
            streamVideoElement.onended = resolve;
            streamVideoElement.onended = resolve;
          });
          });
        } else {
        } else {
          logger.debug('No result_url in playResponseData. Waiting for next chunk.');
          logger.debug('No result_url in playResponseData. Waiting for next chunk.');
        }
        }
      } else {
      } else {
        logger.warn('Unexpected response status:', playResponseData.status);
        logger.warn('Unexpected response status:', playResponseData.status);
      }
      }
    }
    }


    isAvatarSpeaking = false;
    isAvatarSpeaking = false;
    smoothTransition(false);
    smoothTransition(false);


    // Check if we need to reconnect
    // Check if we need to reconnect
    if (shouldReconnect()) {
    if (shouldReconnect()) {
      logger.info('Approaching reconnection threshold. Initiating background reconnect.');
      logger.info('Approaching reconnection threshold. Initiating background reconnect.');
      await backgroundReconnect();
      await backgroundReconnect();
    }
    }
  } catch (error) {
  } catch (error) {
    logger.error('Error during streaming:', error);
    logger.error('Error during streaming:', error);
    if (error.message.includes('HTTP error! status: 404') || error.message.includes('missing or invalid session_id')) {
    if (error.message.includes('HTTP error! status: 404') || error.message.includes('missing or invalid session_id')) {
      logger.warn('Stream not found or invalid session. Attempting to reinitialize persistent stream.');
      logger.warn('Stream not found or invalid session. Attempting to reinitialize persistent stream.');
      await reinitializePersistentStream();
      await reinitializePersistentStream();
    }
    }
  }
  }
}
}


export function toggleSimpleMode() {
export function toggleSimpleMode() {
  const content = document.getElementById('content');
  const content = document.getElementById('content');
  const videoWrapper = document.getElementById('video-wrapper');
  const videoWrapper = document.getElementById('video-wrapper');
  const simpleModeButton = document.getElementById('simple-mode-button');
  const simpleModeButton = document.getElementById('simple-mode-button');
  const header = document.querySelector('.header');
  const header = document.querySelector('.header');
  const autoSpeakToggle = document.getElementById('auto-speak-toggle');
  const autoSpeakToggle = document.getElementById('auto-speak-toggle');
  const startButton = document.getElementById('start-button');
  const startButton = document.getElementById('start-button');


  if (content.style.display !== 'none') {
  if (content.style.display !== 'none') {
    // Entering simple mode
    // Entering simple mode
    content.style.display = 'none';
    content.style.display = 'none';
    document.body.appendChild(videoWrapper);
    document.body.appendChild(videoWrapper);
    videoWrapper.style.position = 'fixed';
    videoWrapper.style.position = 'fixed';
    videoWrapper.style.top = '50%';
    videoWrapper.style.top = '50%';
    videoWrapper.style.left = '50%';
    videoWrapper.style.left = '50%';
    videoWrapper.style.transform = 'translate(-50%, -50%)';
    videoWrapper.style.transform = 'translate(-50%, -50%)';
    simpleModeButton.textContent = 'Exit';
    simpleModeButton.textContent = 'Exit';
    simpleModeButton.classList.add('simple-mode');
    simpleModeButton.classList.add('simple-mode');
    header.style.position = 'fixed';
    header.style.position = 'fixed';
    header.style.width = '100%';
    header.style.width = '100%';
    header.style.zIndex = '1000';
    header.style.zIndex = '1000';


    // Turn on auto-speak if it's not already on
    // Turn on auto-speak if it's not already on
    if (autoSpeakToggle.textContent.includes('Off')) {
    if (autoSpeakToggle.textContent.includes('Off')) {
      autoSpeakToggle.click();
      autoSpeakToggle.click();
    }
    }


    // Start recording if it's not already recording
    // Start recording if it's not already recording
    if (startButton.textContent === 'Speak') {
    if (startButton.textContent === 'Speak') {
      startButton.click();
      startButton.click();
    }
    }
  } else {
  } else {
    // Exiting simple mode
    // Exiting simple mode
    content.style.display = 'flex';
    content.style.display = 'flex';
    const leftColumn = document.getElementById('left-column');
    const leftColumn = document.getElementById('left-column');
    leftColumn.appendChild(videoWrapper);
    leftColumn.appendChild(videoWrapper);
    videoWrapper.style.position = 'relative';
    videoWrapper.style.position = 'relative';
    videoWrapper.style.top = 'auto';
    videoWrapper.style.top = 'auto';
    videoWrapper.style.left = 'auto';
    videoWrapper.style.left = 'auto';
    videoWrapper.style.transform = 'none';
    videoWrapper.style.transform = 'none';
    simpleModeButton.textContent = 'Simple Mode';
    simpleModeButton.textContent = 'Simple Mode';
    simpleModeButton.classList.remove('simple-mode');
    simpleModeButton.classList.remove('simple-mode');
    header.style.position = 'static';
    header.style.position = 'static';
    header.style.width = 'auto';
    header.style.width = 'auto';


    // Turn off auto-speak
    // Turn off auto-speak
    if (autoSpeakToggle.textContent.includes('On')) {
    if (autoSpeakToggle.textContent.includes('On')) {
      autoSpeakToggle.click();
      autoSpeakToggle.click();
    }
    }


    // Stop recording
    // Stop recording
    if (startButton.textContent === 'Stop') {
    if (startButton.textContent === 'Stop') {
      startButton.click();
      startButton.click();
    }
    }
  }
  }
}
}


function startSendingAudioData() {
function startSendingAudioData() {
  logger.debug('Starting to send audio data...');
  logger.debug('Starting to send audio data...');


  let packetCount = 0;
  let packetCount = 0;
  let totalBytesSent = 0;
  let totalBytesSent = 0;


  audioWorkletNode.port.onmessage = (event) => {
  audioWorkletNode.port.onmessage = (event) => {
    const audioData = event.data;
    const audioData = event.data;


    if (!(audioData instanceof ArrayBuffer)) {
    if (!(audioData instanceof ArrayBuffer)) {
      logger.warn('Received non-ArrayBuffer data from AudioWorklet:', typeof audioData);
      logger.warn('Received non-ArrayBuffer data from AudioWorklet:', typeof audioData);
      return;
      return;
    }
    }


    if (deepgramConnection && deepgramConnection.getReadyState() === WebSocket.OPEN) {
    if (deepgramConnection && deepgramConnection.getReadyState() === WebSocket.OPEN) {
      try {
      try {
        deepgramConnection.send(audioData);
        deepgramConnection.send(audioData);
        packetCount++;
        packetCount++;
        totalBytesSent += audioData.byteLength;
        totalBytesSent += audioData.byteLength;


        if (packetCount % 100 === 0) {
        if (packetCount % 100 === 0) {
          logger.debug(`Sent ${packetCount} audio packets to Deepgram. Total bytes: ${totalBytesSent}`);
          logger.debug(`Sent ${packetCount} audio packets to Deepgram. Total bytes: ${totalBytesSent}`);
        }
        }
      } catch (error) {
      } catch (error) {
        logger.error('Error sending audio data to Deepgram:', error);
        logger.error('Error sending audio data to Deepgram:', error);
      }
      }
    } else {
    } else {
      logger.warn(
      logger.warn(
        'Deepgram connection not open, cannot send audio data. ReadyState:',
        'Deepgram connection not open, cannot send audio data. ReadyState:',
        deepgramConnection ? deepgramConnection.getReadyState() : 'undefined',
        deepgramConnection ? deepgramConnection.getReadyState() : 'undefined',
      );
      );
    }
    }
  };
  };


  logger.debug('Audio data sending setup complete');
  logger.debug('Audio data sending setup complete');
}
}


function handleTranscription(data) {
function handleTranscription(data) {
  if (!isRecording) return;
  if (!isRecording) return;


  const transcript = data.channel.alternatives[0].transcript;
  const transcript = data.channel.alternatives[0].transcript;
  if (data.is_final) {
  if (data.is_final) {
    logger.debug('Final transcript:', transcript);
    logger.debug('Final transcript:', transcript);
    if (transcript.trim()) {
    if (transcript.trim()) {
      currentUtterance += transcript + ' ';
      currentUtterance += transcript + ' ';
      updateTranscript(currentUtterance.trim(), true);
      updateTranscript(currentUtterance.trim(), true);
      chatHistory.push({
      chatHistory.push({
        role: 'user',
        role: 'user',
        content: currentUtterance.trim(),
        content: currentUtterance.trim(),
      });
      });
      sendChatToGroq();
      sendChatToGroq();
    }
    }
    currentUtterance = '';
    currentUtterance = '';
    interimMessageAdded = false;
    interimMessageAdded = false;
  } else {
  } else {
    logger.debug('Interim transcript:', transcript);
    logger.debug('Interim transcript:', transcript);
    updateTranscript(currentUtterance + transcript, false);
    updateTranscript(currentUtterance + transcript, false);
  }
  }
}
}


async function startRecording() {
async function startRecording() {
  if (isRecording) {
  if (isRecording) {
    logger.warn('Recording is already in progress. Stopping current recording.');
    logger.warn('Recording is already in progress. Stopping current recording.');
    await stopRecording();
    await stopRecording();
    return;
    return;
  }
  }


  logger.debug('Starting recording process...');
  logger.debug('Starting recording process...');


  currentUtterance = '';
  currentUtterance = '';
  interimMessageAdded = false;
  interimMessageAdded = false;


  try {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    logger.info('Microphone stream obtained');
    logger.info('Microphone stream obtained');


    audioContext = new AudioContext();
    audioContext = new AudioContext();
    logger.debug('Audio context created. Sample rate:', audioContext.sampleRate);
    logger.debug('Audio context created. Sample rate:', audioContext.sampleRate);


    await audioContext.audioWorklet.addModule('audio-processor.js');
    await audioContext.audioWorklet.addModule('audio-processor.js');
    logger.debug('Audio worklet module added successfully');
    logger.debug('Audio worklet module added successfully');


    const source = audioContext.createMediaStreamSource(stream);
    const source = audioContext.createMediaStreamSource(stream);
    logger.debug('Media stream source created');
    logger.debug('Media stream source created');


    audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
    audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
    logger.debug('Audio worklet node created');
    logger.debug('Audio worklet node created');


    source.connect(audioWorkletNode);
    source.connect(audioWorkletNode);
    logger.debug('Media stream source connected to audio worklet node');
    logger.debug('Media stream source connected to audio worklet node');


    const deepgramOptions = {
    const deepgramOptions = {
      model: 'nova-2',
      model: 'nova-2',
      language: 'en-US',
      language: 'en-US',
      smart_format: true,
      smart_format: true,
      interim_results: true,
      interim_results: true,
      utterance_end_ms: 2500,
      utterance_end_ms: 2500,
      punctuate: true,
      punctuate: true,
      // endpointing: 300,
      // endpointing: 300,
      vad_events: true,
      vad_events: true,
      encoding: 'linear16',
      encoding: 'linear16',
      sample_rate: audioContext.sampleRate,
      sample_rate: audioContext.sampleRate,
    };
    };


    logger.debug('Creating Deepgram connection with options:', deepgramOptions);
    logger.debug('Creating Deepgram connection with options:', deepgramOptions);


    deepgramConnection = await deepgramClient.listen.live(deepgramOptions);
    deepgramConnection = await deepgramClient.listen.live(deepgramOptions);


    deepgramConnection.addListener(LiveTranscriptionEvents.Open, () => {
    deepgramConnection.addListener(LiveTranscriptionEvents.Open, () => {
      logger.debug('Deepgram WebSocket Connection opened');
      logger.debug('Deepgram WebSocket Connection opened');
      startSendingAudioData();
      startSendingAudioData();
    });
    });


    deepgramConnection.addListener(LiveTranscriptionEvents.Close, () => {
    deepgramConnection.addListener(LiveTranscriptionEvents.Close, () => {
      logger.debug('Deepgram WebSocket connection closed');
      logger.debug('Deepgram WebSocket connection closed');
    });
    });


    deepgramConnection.addListener(LiveTranscriptionEvents.Transcript, (data) => {
    deepgramConnection.addListener(LiveTranscriptionEvents.Transcript, (data) => {
      logger.debug('Received transcription:', JSON.stringify(data));
      logger.debug('Received transcription:', JSON.stringify(data));
      handleTranscription(data);
      handleTranscription(data);
    });
    });


    deepgramConnection.addListener(LiveTranscriptionEvents.UtteranceEnd, (data) => {
    deepgramConnection.addListener(LiveTranscriptionEvents.UtteranceEnd, (data) => {
      logger.debug('Utterance end event received:', data);
      logger.debug('Utterance end event received:', data);
      handleUtteranceEnd(data);
      handleUtteranceEnd(data);
    });
    });


    deepgramConnection.addListener(LiveTranscriptionEvents.Error, (err) => {
    deepgramConnection.addListener(LiveTranscriptionEvents.Error, (err) => {
      logger.error('Deepgram error:', err);
      logger.error('Deepgram error:', err);
      handleDeepgramError(err);
      handleDeepgramError(err);
    });
    });


    deepgramConnection.addListener(LiveTranscriptionEvents.Warning, (warning) => {
    deepgramConnection.addListener(LiveTranscriptionEvents.Warning, (warning) => {
      logger.warn('Deepgram warning:', warning);
      logger.warn('Deepgram warning:', warning);
    });
    });


    isRecording = true;
    isRecording = true;
    if (autoSpeakMode) {
    if (autoSpeakMode) {
      autoSpeakInProgress = true;
      autoSpeakInProgress = true;
    }
    }
    const startButton = document.getElementById('start-button');
    const startButton = document.getElementById('start-button');
    startButton.textContent = 'Stop';
    startButton.textContent = 'Stop';


    logger.debug('Recording and transcription started successfully');
    logger.debug('Recording and transcription started successfully');
  } catch (error) {
  } catch (error) {
    logger.error('Error starting recording:', error);
    logger.error('Error starting recording:', error);
    isRecording = false;
    isRecording = false;
    const startButton = document.getElementById('start-button');
    const startButton = document.getElementById('start-button');
    startButton.textContent = 'Speak';
    startButton.textContent = 'Speak';
    showErrorMessage('Failed to start recording. Please try again.');
    showErrorMessage('Failed to start recording. Please try again.');
    throw error;
    throw error;
  }
  }
}
}


function handleDeepgramError(err) {
function handleDeepgramError(err) {
  logger.error('Deepgram error:', err);
  logger.error('Deepgram error:', err);
  isRecording = false;
  isRecording = false;
  const startButton = document.getElementById('start-button');
  const startButton = document.getElementById('start-button');
  startButton.textContent = 'Speak';
  startButton.textContent = 'Speak';


  // Attempt to close the connection and clean up
  // Attempt to close the connection and clean up
  if (deepgramConnection) {
  if (deepgramConnection) {
    try {
    try {
      deepgramConnection.finish();
      deepgramConnection.finish();
    } catch (closeError) {
    } catch (closeError) {
      logger.warn('Error while closing Deepgram connection:', closeError);
      logger.warn('Error while closing Deepgram connection:', closeError);
    }
    }
  }
  }


  if (audioContext) {
  if (audioContext) {
    audioContext.close().catch((closeError) => {
    audioContext.close().catch((closeError) => {
      logger.warn('Error while closing AudioContext:', closeError);
      logger.warn('Error while closing AudioContext:', closeError);
    });
    });
  }
  }
}
}


function handleUtteranceEnd(data) {
function handleUtteranceEnd(data) {
  if (!isRecording) return;
  if (!isRecording) return;


  logger.debug('Utterance end detected:', data);
  logger.debug('Utterance end detected:', data);
  if (currentUtterance.trim()) {
  if (currentUtterance.trim()) {
    updateTranscript(currentUtterance.trim(), true);
    updateTranscript(currentUtterance.trim(), true);
    chatHistory.push({
    chatHistory.push({
      role: 'user',
      role: 'user',
      content: currentUtterance.trim(),
      content: currentUtterance.trim(),
    });
    });
    sendChatToGroq();
    sendChatToGroq();
    currentUtterance = '';
    currentUtterance = '';
    interimMessageAdded = false;
    interimMessageAdded = false;
  }
  }
}
}


async function stopRecording() {
async function stopRecording() {
  if (isRecording) {
  if (isRecording) {
    logger.info('Stopping recording...');
    logger.info('Stopping recording...');


    if (audioContext) {
    if (audioContext) {
      await audioContext.close();
      await audioContext.close();
      logger.debug('AudioContext closed');
      logger.debug('AudioContext closed');
    }
    }


    if (deepgramConnection) {
    if (deepgramConnection) {
      deepgramConnection.finish();
      deepgramConnection.finish();
      logger.debug('Deepgram connection finished');
      logger.debug('Deepgram connection finished');
    }
    }


    isRecording = false;
    isRecording = false;
    autoSpeakInProgress = false;
    autoSpeakInProgress = false;
    const startButton = document.getElementById('start-button');
    const startButton = document.getElementById('start-button');
    startButton.textContent = 'Speak';
    startButton.textContent = 'Speak';


    logger.debug('Recording and transcription stopped');
    logger.debug('Recording and transcription stopped');
  }
  }
}
}


async function sendChatToGroq() {
async function sendChatToGroq() {
  if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1].content.trim() === '') {
  if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1].content.trim() === '') {
    logger.debug('No new content to send to Groq. Skipping request.');
    logger.debug('No new content to send to Groq. Skipping request.');
    return;
    return;
  }
  }


  logger.debug('Sending chat to Groq...');
  logger.debug('Sending chat to Groq...');
  try {
  try {
    const startTime = Date.now();
    const startTime = Date.now();
    const currentContext = document.getElementById('context-input').value.trim();
    const currentContext = document.getElementById('context-input').value.trim();
    const requestBody = {
    const requestBody = {
      messages: [
      messages: [
        {
        {
          role: 'system',
          role: 'system',
          content: currentContext || context,
          content: currentContext || context,
        },
        },
        ...chatHistory,
        ...chatHistory,
      ],
      ],
      model: 'llama3-8b-8192',
      model: 'llama3-8b-8192',
    };
    };
    logger.debug('Request body:', JSON.stringify(requestBody));
    logger.debug('Request body:', JSON.stringify(requestBody));


    const response = await fetch('/chat', {
    const response = await fetch('/chat', {
      method: 'POST',
      method: 'POST',
      headers: {
      headers: {
        'Content-Type': 'application/json',
        'Content-Type': 'application/json',
      },
      },
      body: JSON.stringify(requestBody),
      body: JSON.stringify(requestBody),
    });
    });


    logger.debug('Groq response status:', response.status);
    logger.debug('Groq response status:', response.status);


    if (!response.ok) {
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
      throw new Error(`HTTP error ${response.status}`);
    }
    }


    const reader = response.body.getReader();
    const reader = response.body.getReader();
    let assistantReply = '';
    let assistantReply = '';
    let done = false;
    let done = false;


    const msgHistory = document.getElementById('msgHistory');
    const msgHistory = document.getElementById('msgHistory');
    const assistantSpan = document.createElement('span');
    const assistantSpan = document.createElement('span');
    assistantSpan.innerHTML = '<u>Assistant:</u> ';
    assistantSpan.innerHTML = '<u>Assistant:</u> ';
    msgHistory.appendChild(assistantSpan);
    msgHistory.appendChild(assistantSpan);
    msgHistory.appendChild(document.createElement('br'));
    msgHistory.appendChild(document.createElement('br'));


    while (!done) {
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      done = readerDone;


      if (value) {
      if (value) {
        const chunk = new TextDecoder().decode(value);
        const chunk = new TextDecoder().decode(value);
        logger.debug('Received chunk:', chunk);
        logger.debug('Received chunk:', chunk);
        const lines = chunk.split('\n');
        const lines = chunk.split('\n');


        for (const line of lines) {
        for (const line of lines) {
          if (line.startsWith('data:')) {
          if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            const data = line.substring(5).trim();
            if (data === '[DONE]') {
            if (data === '[DONE]') {
              done = true;
              done = true;
              break;
              break;
            }
            }


            try {
            try {
              const parsed = JSON.parse(data);
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              const content = parsed.choices[0]?.delta?.content || '';
              assistantReply += content;
              assistantReply += content;
              assistantSpan.innerHTML += content;
              assistantSpan.innerHTML += content;
              logger.debug('Parsed content:', content);
              logger.debug('Parsed content:', content);
            } catch (error) {
            } catch (error) {
              logger.error('Error parsing JSON:', error);
              logger.error('Error parsing JSON:', error);
            }
            }
          }
          }
        }
        }


        msgHistory.scrollTop = msgHistory.scrollHeight;
        msgHistory.scrollTop = msgHistory.scrollHeight;
      }
      }
    }
    }


    const endTime = Date.now();
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    const processingTime = endTime - startTime;
    logger.debug(`Groq processing completed in ${processingTime}ms`);
    logger.debug(`Groq processing completed in ${processingTime}ms`);


    chatHistory.push({
    chatHistory.push({
      role: 'assistant',
      role: 'assistant',
      content: assistantReply,
      content: assistantReply,
    });
    });


    logger.debug('Assistant reply:', assistantReply);
    logger.debug('Assistant reply:', assistantReply);


    // Start streaming the entire response
    // Start streaming the entire response
    await startStreaming(assistantReply);
    await startStreaming(assistantReply);
  } catch (error) {
  } catch (error) {
    logger.error('Error in sendChatToGroq:', error);
    logger.error('Error in sendChatToGroq:', error);
    const msgHistory = document.getElementById('msgHistory');
    const msgHistory = document.getElementById('msgHistory');
    msgHistory.innerHTML += `<span><u>Assistant:</u> I'm sorry, I encountered an error. Could you please try again?</span><br>`;
    msgHistory.innerHTML += `<span><u>Assistant:</u> I'm sorry, I encountered an error. Could you please try again?</span><br>`;
    msgHistory.scrollTop = msgHistory.scrollHeight;
    msgHistory.scrollTop = msgHistory.scrollHeight;
  }
  }
}
}


function toggleAutoSpeak() {
  autoSpeakMode = !autoSpeakMode;
  const toggleButton = document.getElementById('auto-speak-toggle');
  const startButton = document.getElementById('start-button');
  const pushToTalkToggle = document.getElementById('push-to-talk-toggle');
  const pushToTalkButton = document.getElementById('push-to-talk-button');
  
  toggleButton.textContent = `Auto-Speak: ${autoSpeakMode ? 'On' : 'Off'}`;
  
  if (autoSpeakMode) {
    startButton.textContent = 'Stop';
    pushToTalkToggle.disabled = true;
    pushToTalkButton.disabled = true;
    isPushToTalkEnabled = false;
    if (!isRecording) {
      startRecording();
    }
  } else {
    startButton.textContent = isRecording ? 'Stop' : 'Speak';
    pushToTalkToggle.disabled = false;
    pushToTalkButton.disabled = !isPushToTalkEnabled;
    if (isRecording) {
      stopRecording();
    }
  }
}
function toggleAutoSpeak() {
  autoSpeakMode = !autoSpeakMode;
  const toggleButton = document.getElementById('auto-speak-toggle');
  const startButton = document.getElementById('start-button');
  toggleButton.textContent = `Auto-Speak: ${autoSpeakMode ? 'On' : 'Off'}`;
  if (autoSpeakMode) {
    startButton.textContent = 'Stop';
    if (!isRecording) {
      startRecording();
    }
  } else {
    startButton.textContent = isRecording ? 'Stop' : 'Speak';
    if (isRecording) {
      stopRecording();
    }
  }
}

async function reinitializeConnection() {
  if (connectionState === ConnectionState.RECONNECTING) {
    logger.warn('Connection reinitialization already in progress. Skipping reinitialize.');
    return;
  }

  connectionState = ConnectionState.RECONNECTING;
  logger.debug('Reinitializing connection...');

  try {
    await destroyPersistentStream();
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second

    stopAllStreams();
    closePC();

    clearInterval(statsIntervalId);
    clearTimeout(inactivityTimeout);
    clearInterval(keepAliveInterval);

    streamId = null;
    sessionId = null;
    peerConnection = null;
    lastBytesReceived = 0;
    videoIsPlaying = false;

    currentUtterance = '';
    interimMessageAdded = false;

    const msgHistory = document.getElementById('msgHistory');
    msgHistory.innerHTML = '';
    chatHistory = [];

    // Reset video elements
    const streamVideoElement = document.getElementById('stream-video-element');
    const idleVideoElement = document.getElementById('idle-video-element');
    if (streamVideoElement) streamVideoElement.srcObject = null;
    if (idleVideoElement) idleVideoElement.style.display = 'block';

    // Add a delay before initializing to avoid rapid successive calls
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await initializePersistentStream();

    if (!persistentStreamId || !persistentSessionId) {
      throw new Error('Persistent Stream ID or Session ID is missing after initialization');
    }

    await prepareForStreaming();

    logger.info('Connection reinitialized successfully');
    logger.debug(`New Persistent Stream ID: ${persistentStreamId}, New Persistent Session ID: ${persistentSessionId}`);
    reconnectAttempts = 0; // Reset reconnect attempts on successful connection
    connectionState = ConnectionState.CONNECTED;
  } catch (error) {
    logger.error('Error during reinitialization:', error);
    showErrorMessage('Failed to reconnect. Please refresh the page.');
    connectionState = ConnectionState.DISCONNECTED;
  }
}

async function cleanupOldStream() {
  logger.debug('Cleaning up old stream...');

  try {
    if (peerConnection) {
      peerConnection.close();
    }

    if (pcDataChannel) {
      pcDataChannel.close();
    }

    // Stop all tracks in the streamVideoElement
    if (streamVideoElement && streamVideoElement.srcObject) {
      streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    }

    // Clear any ongoing intervals or timeouts
    clearInterval(statsIntervalId);
    clearTimeout(inactivityTimeout);
    clearInterval(keepAliveInterval);

    logger.debug('Old stream cleaned up successfully');
  } catch (error) {
    logger.error('Error cleaning up old stream:', error);
  }
}

const connectButton = document.getElementById('connect-button');
connectButton.onclick = initializeConnection;

const destroyButton = document.getElementById('destroy-button');
destroyButton.onclick = async () => {
  try {
    await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    logger.debug('Stream destroyed successfully');
  } catch (error) {
    logger.error('Error destroying stream:', error);
  } finally {
    stopAllStreams();
    closePC();
  }
};

const startButton = document.getElementById('start-button');

startButton.onclick = async () => {
  logger.info('Start button clicked. Current state:', isRecording ? 'Recording' : 'Not recording');
  if (!isRecording) {
    try {
      await startRecording();
    } catch (error) {
      logger.error('Failed to start recording:', error);
      showErrorMessage('Failed to start recording. Please try again.');
    }
  } else {
    await stopRecording();
  }
};

const saveAvatarButton = document.getElementById('save-avatar-button');
saveAvatarButton.onclick = saveAvatar;

const avatarImageInput = document.getElementById('avatar-image');
avatarImageInput.onchange = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('avatar-image-preview').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Export functions and variables that need to be accessed from other modules
export {
  initialize,
  handleAvatarChange,
  openAvatarModal,
  closeAvatarModal,
  saveAvatar,
  updateContext,
  handleTextInput,
  toggleAutoSpeak,
  initializePersistentStream,
  destroyPersistentStream,
};

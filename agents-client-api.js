'use strict';
import DID_API from './api.js'; // @block:import-None-62519b82 // @block:import-None-bfc12bd3
import logger from './logger.js'; // @block:import-None-eb9c1a95 // @block:import-None-ca58d1e2
const { createClient, LiveTranscriptionEvents } = deepgram; // @block:const-{-be9edef7 // @block:const-{-6e22438a

const deepgramClient = createClient(DID_API.deepgramKey); // @block:const-deepgramClient-b7d7eeed // @block:const-deepgramClient-2f3a0f36

const RTCPeerConnection = ( // @block:const-RTCPeerConnection-2b28aa0b // @block:const-RTCPeerConnection-f1d5abf4
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
).bind(window);

let peerConnection; // @block:let-None-bc85430e // @block:let-None-fbea2f90
let pcDataChannel; // @block:let-None-44e2eb81 // @block:let-None-b9628032
let streamId; // @block:let-None-250fac44 // @block:let-None-9105b24e
let sessionId; // @block:let-None-ae9ef4ea // @block:let-None-e6a2cb0c
let sessionClientAnswer; // @block:let-None-6b01ad8b // @block:let-None-69346ee5
let statsIntervalId; // @block:let-None-c4fa2e57 // @block:let-None-ee02e856
let videoIsPlaying; // @block:let-None-867d73b5 // @block:let-None-88c78eac
let lastBytesReceived; // @block:let-None-c479d515 // @block:let-None-6fa367bd
let chatHistory = []; // @block:let-chatHistory-942e14de // @block:let-chatHistory-2d9fd4e5
let inactivityTimeout; // @block:let-None-e9d5b602 // @block:let-None-b750570f
let keepAliveInterval; // @block:let-None-6d5cbaa7 // @block:let-None-49eb9968
let socket; // @block:let-None-7ccdec2a // @block:let-None-0b9e50c6
let isInitializing = false; // @block:let-isInitializing-25807283 // @block:let-isInitializing-e804c2bf
let audioContext; // @block:let-None-3abf248c // @block:let-None-2187f559
let streamVideoElement; // @block:let-None-0aa3bb13 // @block:let-None-5131363e
let idleVideoElement; // @block:let-None-b5cfeb75 // @block:let-None-a2c369e6
let deepgramConnection; // @block:let-None-a3ab535f // @block:let-None-094d2e9b
let isRecording = false; // @block:let-isRecording-60e079e2 // @block:let-isRecording-ee310d99
let audioWorkletNode; // @block:let-None-5f992e80 // @block:let-None-caab9e9d
let currentUtterance = ''; // @block:let-currentUtterance-2e99cdbb // @block:let-currentUtterance-c6b6f387
let interimMessageAdded = false; // @block:let-interimMessageAdded-58fc1cea // @block:let-interimMessageAdded-1d583dc1
let autoSpeakMode = true; // @block:let-autoSpeakMode-76d75f72 // @block:let-autoSpeakMode-6debd821
let transitionCanvas; // @block:let-None-981ca232 // @block:let-None-5b030581
let transitionCtx; // @block:let-None-0791f9d7 // @block:let-None-ed771c6d
let isDebugMode = false; // @block:let-isDebugMode-8ff76e03 // @block:let-isDebugMode-b92bc43f
let isTransitioning = false; // @block:let-isTransitioning-27eb0c86 // @block:let-isTransitioning-6c21850e
let lastVideoStatus = null; // @block:let-lastVideoStatus-87055b1a // @block:let-lastVideoStatus-adc1d337
let isCurrentlyStreaming = false; // @block:let-isCurrentlyStreaming-447cdfe1 // @block:let-isCurrentlyStreaming-05f45ebf
let reconnectAttempts = 10; // @block:let-reconnectAttempts-21faef26 // @block:let-reconnectAttempts-de12be46
let persistentStreamId = null; // @block:let-persistentStreamId-0a7c8eef // @block:let-persistentStreamId-fc127661
let persistentSessionId = null; // @block:let-persistentSessionId-0ee6f08f // @block:let-persistentSessionId-29e8ec2b
let isPersistentStreamActive = false; // @block:let-isPersistentStreamActive-e131c6d1 // @block:let-isPersistentStreamActive-9d5c055f
const API_RATE_LIMIT = 40; // Maximum number of calls per minute // @block:const-API_RATE_LIMIT-64104c75 // @block:const-API_RATE_LIMIT-055bf400
const API_CALL_INTERVAL = 30000 / API_RATE_LIMIT; // Minimum time between API calls in milliseconds // @block:const-API_CALL_INTERVAL-4c4fd239 // @block:const-API_CALL_INTERVAL-4766bab5
let lastApiCallTime = 0; // @block:let-lastApiCallTime-c4a5b0d3 // @block:let-lastApiCallTime-4f642121
const maxRetryCount = 10; // @block:const-maxRetryCount-7c87d510 // @block:const-maxRetryCount-def8d7fe
const maxDelaySec = 100; // @block:const-maxDelaySec-f32c91ba // @block:const-maxDelaySec-a7785285
const RECONNECTION_INTERVAL = 100000; // 25 seconds for testing, adjust as needed // @block:const-RECONNECTION_INTERVAL-f3c672af // @block:const-RECONNECTION_INTERVAL-ee7aeb38
let isAvatarSpeaking = false; // @block:let-isAvatarSpeaking-17945629 // @block:let-isAvatarSpeaking-46ce2fce
const MAX_RECONNECT_ATTEMPTS = 10; // @block:const-MAX_RECONNECT_ATTEMPTS-2c73fdde // @block:const-MAX_RECONNECT_ATTEMPTS-8260297d
const INITIAL_RECONNECT_DELAY = 2000; // 1 second // @block:const-INITIAL_RECONNECT_DELAY-cc55c437 // @block:const-INITIAL_RECONNECT_DELAY-e7655a6b
const MAX_RECONNECT_DELAY = 90000; // 30 seconds // @block:const-MAX_RECONNECT_DELAY-5b180d4f // @block:const-MAX_RECONNECT_DELAY-1e50a1f9
let autoSpeakInProgress = false; // @block:let-autoSpeakInProgress-e61e70fb // @block:let-autoSpeakInProgress-c249f7aa

const ConnectionState = { // @block:const-ConnectionState-abcfb1ca // @block:const-ConnectionState-7717953c
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
};

let lastConnectionTime = Date.now(); // @block:let-lastConnectionTime-ba05ce83 // @block:let-lastConnectionTime-395e4ee9

let connectionState = ConnectionState.DISCONNECTED; // @block:let-connectionState-3e2238f5 // @block:let-connectionState-46b87c51

export function setLogLevel(level) { // @block:export-None-30890f38 // @block:export-None-fe27e9a4
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}

let avatars = {}; // @block:let-avatars-0d11aae6 // @block:let-avatars-6aa70cfb
let currentAvatar = ''; // @block:let-currentAvatar-ebe13a6c // @block:let-currentAvatar-010a09e8

const avatarSelect = document.getElementById('avatar-select'); // @block:const-avatarSelect-8e8f43e3 // @block:const-avatarSelect-52f2e2c7
avatarSelect.addEventListener('change', handleAvatarChange);

let context = ` // @block:let-context-b76faa98 // @block:let-context-2eaca26c

grocery store info:
---
Product,"Aisle and side (<Aisle, Left or Right>)",Est. Price,Promo price,Category
Double Zipper Gallon Storage Bags ,16 -  R,4,,Cleaning Products
Double Zipper Gallon Size Freezer Bags ,16 -  R,4,,Cleaning Products
Reclosable Colorful Assorted Square Snack Bags ,16 -  R,3,,Cleaning Products
Quart Slider Freezer Bag ,16 -  R,4,,Cleaning Products
Slider Freezer Storage Gallon Bags ,16 -  R,4,,Cleaning Products
Double Zipper Quart Storage Bags ,16 -  R,4,,Cleaning Products
Double Zipper Quart Freezer Bags ,16 -  R,4,,Cleaning Products
Slider Freezer Storage Gallon Bags ,16 -  R,4,,Cleaning Products
Reclosable Colorful Assorted Sandwich Bags 40 Count ,16 -  R,2,,Cleaning Products
Double Zipper Quart Storage Bags ,16 -  R,3,,Cleaning Products
Stand & Fill Quart Slider Storage Bag ,16 -  R,3,,Cleaning Products
Double Zipper Gallon Storage Bags ,16 -  R,3,,Cleaning Products
Slider Gallon Storage Bags ,16 -  R,3,,Cleaning Products
Quart Slider Storage Bags ,16 -  R,4,,Cleaning Products
Twist Tie Gallon Storage Bags ,16 -  R,5,,Cleaning Products
Apple Cinnamon & Apple Strawberry Applesauce Variety Pouches ,4 -  R,7,,Snacks
Strawberry + Cinnamon Applesauce Pouches Variety Pack BIG Deal! ,4 -  R,12,,Snacks
Classic Applesauce Pouches ,4 -  R,7,,Snacks
Apple Cinnamon Applesauce Pouches ,4 -  R,7,,Snacks
Apple Strawberry Applesauce Pouches ,4 -  R,7,,Snacks
Chunky Applesauce ,4 -  R,3,,Snacks
Cherry Mixed Fruit Cups in 100% Juice ,4 -  R,5,,Canned & Packaged
Variety Fruit Bowls ,4 -  R,15,,Snacks
Classic Applesauce BIG Deal! ,4 -  R,12,,Snacks
Mandarin Orange Cups No Sugar Added ,4 -  R,5,,Canned & Packaged
Mandarin Orange Cups in 100% Juice Big Deal! ,4 -  R,15,,Snacks
Fruity Gems Fresh Pomegranate Arils PRODUCE,PRODUCE -  L,4,,Snacks
Purified Bottled Water ,14 -  R,6,,Beverages
Vitamin D Whole Milk DAIRY,DAIRY -  R,3,,Dairy
2% Reduced Fat Milk DAIRY,DAIRY -  R,2,,Dairy
Yellow Cling Diced Peach Cups in 100% Juice Big Deal! ,4 -  R,15,,Snacks
Purified Bottled Water ,14 -  R,4,,Beverages
2% Reduced Fat Milk DAIRY,DAIRY -  R,3,,Dairy
Vitamin D Whole Milk DAIRY,DAIRY -  R,2,,Dairy
Large White Eggs DAIRY,DAIRY -  R,2,,Dairy
Distilled Gallon Bottled Water ,14 -  R,2,,Beverages
Original Pancake Syrup SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,3,,Breakfast
Original Sour Cream DAIRY,DAIRY -  R,3,,Dairy
Shredded Iceberg Lettuce Bag PRODUCE,PRODUCE -  L,3,,Produce
Super Sweet Golden Whole Kernel Corn ,4 -  R,1,,Canned & Packaged
Fresh Grape Tomatoes PRODUCE,PRODUCE -  L,3,,Produce
Salted Butter Sticks DAIRY,DAIRY -  R,5,,Dairy
Heavy Whipping Cream DAIRY,DAIRY -  R,4,,Dairy
Tender Spinach Bag PRODUCE,PRODUCE -  L,3,,Produce
Canned Pineapple Chunks in Pineapple Juice GROCERY,GROCERY -  R,2,,Canned & Packaged
Unsalted Butter Sticks DAIRY,DAIRY -  R,5,,Dairy
100% Apple Juice ,13 -  R,3,,Beverages
Classic Garden Salad Bag PRODUCE,PRODUCE -  L,3,,Produce
Lean Ground Beef Chuck 80/20 MEAT,MEAT -  R,7,,Meat & Seafood
Half & Half DAIRY,DAIRY -  R,4,,Dairy
1% Lowfat Milk DAIRY,DAIRY -  R,3,,Dairy
Pure Vegetable Oil ,6 -  L,4,,Baking Goods
Heavy Whipping Cream DAIRY,DAIRY -  R,6,,Dairy
Aluminum Foil ,16 -  R,2,,Cleaning Products
3 lb. Lean Ground Beef Chuck 80/20 MEAT,MEAT -  R,17,,Meat & Seafood
1 lb. Lean Ground Beef Chuck Roll 80/20 MEAT,MEAT -  R,6,,Meat & Seafood
Lean Ground Beef Chuck 80/20 Homestyle Hamburger Patties MEAT,MEAT -  R,10,,Meat & Seafood
4% Milkfat Small Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
Canned Crushed Pineapple in Pineapple Juice GROCERY,GROCERY -  L,2,,Canned & Packaged
Half & Half DAIRY,DAIRY -  R,2,,Dairy
Extra Large White Eggs DAIRY,DAIRY -  R,3,,Dairy
Gallon Water ,14 -  R,2,,Beverages
Hardwood Smoked Sliced Bacon Packaged Meat,Packaged Meat -  R,6,,Meat & Seafood
Brand Super Sweet Corn ,8 -  R,2,,Frozen
Adorbs™ Easy Peel Seedless Mandarin Clementine Oranges in 5lb Bag PRODUCE,PRODUCE -  R,8,,Produce
Non-Stick Extra Virgin Olive Oil Cooking Spray SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,5,,Baking Goods
Hamburger Dill Oval Cut Pickle Chips ,5 -  L,3,,Canned & Packaged
Original Cream Cheese DAIRY,DAIRY -  R,2,,Breakfast
Glimmer™ Select-A-Sheet® Paper Towels Double Rolls ,18 -  R,3,,Cleaning Products
85% Lean 15% Fat Ground Turkey MEAT,MEAT -  R,5,,Meat & Seafood
Original Saltines Crackers ,12 -  R,2,,Snacks
Garlic Frozen Texas Toast ,7 -  L,3,,Frozen
Kosher Dill Spear Pickles ,5 -  L,3,,Canned & Packaged
Fat Free Skim Milk DAIRY,DAIRY -  R,3,,Dairy
Spring Gallon Water ,14 -  R,2,,Beverages
100% Parmesan Grated Cheese ,5 -  R,4,,Dairy
Classic Wavy Potato Chips ,12 -  L,2,,Snacks
Peanut Butter Creamy SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,3,,Condiment & Sauces
Fresh Chicken Drumsticks MEAT,MEAT -  L,5,,Meat & Seafood
Whole Kernel Sweet Golden Corn ,4 -  R,1,,Canned & Packaged
Original Cream Cheese DAIRY,DAIRY -  R,4,,Breakfast
Mexican Style Blend Shredded Cheese BIG DEAL! DAIRY,DAIRY -  R,8,,Dairy
Romaine Blend Salad Bag PRODUCE,PRODUCE -  L,4,,Produce
Hass Fresh Avocados Bag PRODUCE,PRODUCE -  L,4,,Produce
Canned Pineapple Tidbits in Pineapple Juice GROCERY,GROCERY -  nan,2,,Canned & Packaged
2% Low Fat Small Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
1 lb. Ground Beef Roll 73/27 MEAT,MEAT -  R,5,,Meat & Seafood
4% Milkfat Small Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
Traditional Favorites Frozen Green Peas ,8 -  R,2,,Frozen
Reduced Sodium Chicken Broth ,5 -  R,2,,Canned & Packaged
1% Low Fat Chocolate Milk DAIRY,DAIRY -  R,3,,Dairy
Clamshell Seedless Green Grapes nan,nan -  nan,8,,Produce
Shredded Carrots PRODUCE,PRODUCE -  L,3,,Produce
99% Fat Free Chicken Broth ,5 -  R,2,,Canned & Packaged
Original Sour Cream DAIRY,DAIRY -  R,3,,Dairy
Seasoned Hash Brown Shredded Potato Patties ,7 -  L,4,,Frozen
Boneless Pork Loin Chops MEAT,MEAT -  R,10,,Meat & Seafood
Thick Cut Naturally Hardwood Smoked Bacon Packaged Meat,Packaged Meat -  R,6,,Meat & Seafood
1% Low Fat Chocolate Milk Jug DAIRY,DAIRY -  R,4,,Dairy
Classic Garden Salad Bag PRODUCE,PRODUCE -  L,4,,Produce
Petite Carrots Bag PRODUCE,PRODUCE -  L,3,,Produce
Meal-Ready Sides Frozen Peas & Carrots ,8 -  R,2,,Frozen
Light Brown Sugar ,6 -  R,3,,Baking Goods
Natural Spring Bottled Water ,14 -  R,5,,Beverages
Original Sour Cream DAIRY,DAIRY -  R,2,,Dairy
Sliced Black Ripe Olives SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,3,,Canned & Packaged
Broccoli Florets BIG Deal! PRODUCE,PRODUCE -  L,7,,Produce
Classic Potato Chips ,12 -  L,2,,Snacks
Butter Sticks BIG DEAL! DAIRY,DAIRY -  R,8,,Dairy
Mexican Style Blend Shredded Cheese DAIRY,DAIRY -  R,5,,Dairy
1% Lowfat Milk DAIRY,DAIRY -  R,2,,Dairy
Real Bacon Bits ,5 -  L,3,,Condiment & Sauces
Fat Free Skim Milk DAIRY,DAIRY -  R,2,,Dairy
85% Lean Fresh Ground Turkey MEAT,MEAT -  R,10,,Meat & Seafood
Sweet & Mesquite BBQ Flavored Potato Chips ,12 -  L,2,,Snacks
Real Mayo ,5 -  L,4,,Condiment & Sauces
Purified Gallon Water ,14 -  R,2,,Beverages
Original Taco Seasoning SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,1,,Baking Goods
Dutch Milk Chocolate Hot Cocoa Mix GROCERY,GROCERY -  L,3,,Beverages
Distilled White Vinegar ,6 -  R,4,,Baking Goods
Vine Ripe Fresh Tomatoes PRODUCE,PRODUCE -  L,4,,Produce
Original Pulp Free 100% Orange Juice DAIRY,DAIRY -  R,5,,Beverages
Beef Shaved Steak MEAT,MEAT -  R,6,,Meat & Seafood
Tomato Sauce ,4 -  R,1,,Canned & Packaged
Idaho Potatoes PRODUCE,PRODUCE -  nan,6,,Produce
Soft Taco Size Flour Tortillas ,4 -  L,3,,International
Baker Russet Potatoes PRODUCE,PRODUCE -  nan,4,,Produce
Mozzarella Shredded Cheese BIG DEAL! DAIRY,DAIRY -  R,8,,Dairy
Ultra Absorbing Power Paper Towels Double Rolls ,18 -  R,6,,Cleaning Products
Brand Broccoli Florets PRODUCE,PRODUCE -  L,3,,Produce
Ultra Absorbing Power Paper Towels Double Rolls ,18 -  R,10,,Cleaning Products
Lean Fresh Ground Turkey MEAT,MEAT -  R,5,,Meat & Seafood
Original White Restaurant Style Tortilla Chips ,12 -  L,3,,Snacks
Singles American Sliced Cheese DAIRY,DAIRY -  R,4,,Dairy
Meal-Ready Sides Frozen Mixed Vegetables ,8 -  R,2,,Frozen
Original Breakfast Sausage Links Packaged Meat,Packaged Meat -  R,4,,Meat & Seafood
Mild Italian Ground Sausage MEAT,MEAT -  R,6,,Meat & Seafood
Flour Tortillas Handmade Style Burrito Size ,4 -  L,3,,International
Tater Bites ,7 -  L,4,,Frozen
Lactose Free 2% Reduced Fat Milk DAIRY,DAIRY -  R,4,,Dairy
85/15 Lean Ground Beef MEAT,MEAT -  R,8,,Meat & Seafood
Wild Caught Chunk Light Tuna in Water ,4 -  R,1,,Canned & Packaged
Powdered Sugar ,6 -  R,3,,Baking Goods
French Vanilla Coffee Creamer DAIRY,DAIRY -  R,3,,Beverages
Baby Spinach PRODUCE,PRODUCE -  L,4,,Produce
Celebration Paper Plates ,18 -  R,4,,Cleaning Products
Hardwood Smoked Sliced Bacon Packaged Meat,Packaged Meat -  R,5,,Meat & Seafood
Pure Canola Oil ,6 -  L,5,,Baking Goods
Crinkle Cut French Fries ,7 -  L,4,,Frozen
Cheddar and Sour Cream Ripples Potato Chips ,12 -  L,2,,Snacks
French Onion Sour Cream Dip & Spread DAIRY,DAIRY -  R,3,,Dairy
Grade A Jumbo White Eggs DAIRY,DAIRY -  R,3,,Breakfast
Traditional Pork Sausage Patties Packaged Meat,Packaged Meat -  R,4,,Meat & Seafood
Large White Eggs DAIRY,DAIRY -  R,2,,Breakfast
Lightly Salted Wavy Potato Chips ,12 -  L,2,,Snacks
Tater Rounds Shredded Potatoes ,7 -  L,4,,Frozen
Mozzarella String Cheese DAIRY,DAIRY -  R,6,,Dairy
Clamshell Seedless Red Grapes nan,nan -  nan,8,,Produce
2% Low Fat Small Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
Navel Oranges PRODUCE,PRODUCE -  nan,9,,Produce
Double Zipper Sandwich Bags ,16 -  R,3,,Cleaning Products
Yellow Mustard ,5 -  L,1,,Condiment & Sauces
Whipping Cream DAIRY,DAIRY -  R,4,,Dairy
Garlic Cheese Frozen Texas Toast ,7 -  L,3,,Frozen
Black Beans ,4 -  R,1,,Canned & Packaged
Traditional Favorites Frozen Cut Green Beans ,8 -  R,2,,Frozen
Whole Garlic Bulbs PRODUCE,PRODUCE -  nan,2,,Produce
Tomato Paste ,4 -  R,1,,Canned & Packaged
4% Milkfat Large Curd Cottage Cheese DAIRY,DAIRY -  R,3,,Dairy
Mild Pork Sausage Roll Packaged Meat,Packaged Meat -  R,4,,Meat & Seafood
Fruity Mighty Ice Pops GROCERY,GROCERY -  nan,3,,Frozen
Sweetened Condensed Milk ,6 -  L,3,,Baking Goods
Large White Eggs DAIRY,DAIRY -  R,10,,Dairy
Honey Lemon Flavor Cough Drops DRUG/GM,DRUG/GM -  nan,2,,Health
Evaporated Milk ,6 -  L,2,,Baking Goods
Recipe Beginnings Frozen 3 Pepper & Onion Blend ,8 -  R,2,,Frozen
Vanilla Caramel Coffee Creamer DAIRY,DAIRY -  R,3,,Beverages
Zesty Hot Dill Zingers ,5 -  L,3,,Canned & Packaged
Grapefruit Cups PRODUCE,PRODUCE -  L,2,1,Snacks
Grapefruit Cups PRODUCE,PRODUCE -  L,2,1,Snacks
Mandarin Oranges Fruit Cup PRODUCE,PRODUCE -  L,2,1,Snacks
Peach Chunks PRODUCE,PRODUCE -  L,2,1,Snacks
Cherry Fruit Medley Fruit Cup PRODUCE,PRODUCE -  L,2,1,Snacks
Original Tomato Ketchup SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,2,2,Condiment & Sauces
Spaghetti Pasta ,5 -  R,2,2,"Pasta, Sauces, Grain"
Penne Rigate Pasta ,5 -  R,2,2,"Pasta, Sauces, Grain"
Elbow Macaroni ,5 -  R,2,2,"Pasta, Sauces, Grain"
Big K® Cola Soda Bottle ,14 -  L,2,2,Beverages
Facial Tissue ,18 -  L,2,2,Cleaning Products
White Hamburger Buns BACK WALL,BACK WALL -  L,2,2,Bakery
White Hot Dog Buns BACK WALL,BACK WALL -  L,2,2,Bakery
White Bread BACK WALL,BACK WALL -  L,2,2,Bakery
Honey Wheat Bread BACK WALL,BACK WALL -  L,3,2,Bakery
White Bread BACK WALL,BACK WALL -  L,2,2,Bakery
Soft Wheat Bread BACK WALL,BACK WALL -  L,2,2,Bakery
Strawberry Applesauce Cups ,4 -  R,3,2,Snacks
Unsweetened Applesauce Cups ,4 -  R,3,2,Snacks
Classic Applesauce Cups ,4 -  R,3,2,Snacks
Cinnamon Applesauce Cups ,4 -  R,3,2,Snacks
Lean Ground Beef Chuck Roll MEAT,MEAT -  R,16,12,Meat & Seafood
5 lb. Ground Beef Roll 73/27 MEAT,MEAT -  R,19,18,Meat & Seafood
Coleslaw Mix 16 oz PRODUCE,PRODUCE -  L,3,2,Produce
Tri-Color Coleslaw PRODUCE,PRODUCE -  L,3,2,Produce
Mexican Style Blend Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Sharp Cheddar Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Mozzarella Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Parmesan Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Colby Jack Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Mild Cheddar Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Whole Milk Mozzarella Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Medium Cheddar Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Cheddar Jack Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Reduced Fat Mexican Style Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Colby Jack Block Cheese DAIRY,DAIRY -  R,3,3,Dairy
Italian Style Blend Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Sharp Cheddar Block Cheese DAIRY,DAIRY -  R,3,3,Dairy
Nacho & Taco Blend Shredded Cheese DAIRY,DAIRY -  R,3,3,Dairy
Creamy Ranch Salad Dressing SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,3,3,Condiment & Sauces
Kosher Sandwich Slims Dill Pickles ,5 -  L,3,3,Canned & Packaged
Whole Sweet Gherkins Pickles ,5 -  L,4,3,Canned & Packaged
Tropical Fruit Cups in 100% Juice ,4 -  R,3,3,Snacks
Cherry Mixed Fruit Cups in 100% Juice ,4 -  R,3,3,Snacks
Diced Mango Cups in 100% Juice ,4 -  R,3,3,Snacks
Yellow Cling Diced Peach Cups in 100% Juice ,4 -  R,3,3,Snacks
Mandarin Orange Cups No Sugar Added ,4 -  R,3,3,Snacks
Mandarin Orange Cups in 100% Juice ,4 -  R,3,3,Snacks
Yellow Cling Diced Peach Cups No Sugar Added ,4 -  R,3,3,Snacks
Pineapple Tidbits Cups in 100% Pineapple Juice ,4 -  R,3,3,Snacks
Diced Pear Cups in 100% Juice ,4 -  R,3,3,Snacks
Mixed Fruit Cups in 100% Juice ,4 -  R,3,3,Snacks
Diced Pear Cups No Sugar Added ,4 -  R,3,3,Snacks
American Sliced Cheese Singles DAIRY,DAIRY -  R,3,3,Dairy
Colby Jack Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Swiss Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Pepper Jack Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Smoke Flavored Provolone Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Medium Cheddar Sliced Cheese DAIRY,DAIRY -  R,3,3,Dairy
Vanilla Ice Cream Snowboard Sandwiches GROCERY,GROCERY -  nan,3,3,Frozen
Grade A Large White Eggs DAIRY,DAIRY -  R,3,3,Breakfast
Deluxe Vividly Vanilla Ice Cream Tub ,9 -  R,3,3,Frozen
Sliced Pepperoni MEAT,MEAT -  L,3,3,Meat & Seafood
Vanilla Ice Cream Snowboard Sandwiches ,9 -  R,3,3,Frozen
Deluxe Cookies N' Cream Ice Cream Tub ,9 -  R,3,3,Frozen
Deluxe Artisan Vanilla Bean Ice Cream Tub ,9 -  R,3,3,Frozen
Unsweetened Applesauce ,4 -  R,4,3,Snacks
Classic Applesauce ,4 -  R,4,3,Snacks
Cinnamon Applesauce ,4 -  R,4,3,Snacks
Fruity Freezer Pops GROCERY,GROCERY -  L,4,3,Frozen
Classic Wavy Potato Chips Family Size ,12 -  L,4,3,Snacks
1000 Sheets per Roll Toilet Paper ,18 -  L,4,3,Cleaning Products
Fully Cooked Hardwood Smoke Flavor Traditional Bacon MEAT,MEAT -  L,4,4,Meat & Seafood
Purified Mini Bottled Water ,14 -  R,5,4,Beverages
Chicken Caesar Salad Kit For One PRODUCE,PRODUCE -  L,4,4,Deli
Santa Fe Salad Bowl PRODUCE,PRODUCE -  L,4,4,Produce
Chef Salad Kit For One PRODUCE,PRODUCE -  L,4,4,Deli
Aluminum Foil ,16 -  R,5,4,Cleaning Products
Fresh Lemons,PRODUCE -  nan,5,4,Produce
Clover Honey Bear SHELF EXTENDER PROGRAM,SHELF EXTENDER PROGRAM -  L,5,4,Condiment & Sauces
Heavy Duty Aluminum Foil ,16 -  R,5,4,Cleaning Products
Soft & Strong Toilet Paper Double Roll ,18 -  L,8,6,Cleaning Products
---
store layout:
---
Map Layout Description
North Section (from west to east):
Dairy, Alcoholic Drinks, Snacks, Fish, Soft Drinks, Cosmetics, Toys, Paper Products.
West Section (from north to south):
Bakery, Frozen Food.
Central Section:
Left Side: Poultry, Deli, Side Dish, Meat, Cheese.
Right Side: Fruits, Vegetables.
East Section (from north to south):
Electronics, Detergent, Cleaning.
South Section (from west to east):
Books & Magazines, Season, Oil & Spices.
Middle Aisles (from west to east):
Soft Drinks, Coffee & Tea, Chocolate, Oil & Spices, Household (multiple aisles), Pet, Textile (multiple aisles).
Cashiers: Located just north of the entrance/exit.
Directions
Straight: Moving from south to north.
Left: Moving from west to east(if facing north) or east to west(if facing south) depending on the current facing direction.
Right: Moving from east to west(if facing south) or west to east(if facing north) depending on the current facing direction.

store layout:
+--------------------+--------------------+--------+-----+----------+----------+------+--------------+
|       DAIRY       |  ALCOHOLIC DRINKS  | SNACKS | FISH| SOFTDRINK| COSMETICS| TOYS |PAPER PRODUCTS|
+--------------------+--------------------+--------+-----+----------+----------+------+--------------+
|                    |                    |                     Racetrack aisle                     |
|                    |                    |                                                          |
|     POULTRY        |       FRUITS       |                                                          |
|                    |                    |                                                          |
|      DELI          |  SIDE DISH CHEESE  |                                                          |
|                    |                    |                     VEGETABLES                            |
| SIDE DISH MEAT LOAF|                    |                                                          |
|                    |                    |                                                          |
|                    |                    |   AND                                                    |
|                    |                    |                                                          |
|                    |                    |            FRUITS                                        |
+--------------------+--------------------+--------+-----+----------+----------+------+--------------+
cashiers
O O O O O
EXIT                             ENTER
+-----------+
|   BOOKS   |
| MAGAZINES |
+-----------+
|  SEASON   |
|OIL+SPICES |
+-----------+
---

---------

You are a helpful, harmless, and honest grocery store assistant. Please answer the users questions briefly, be concise.

Reply with only 1 sentence, specifically limiting your response to only the answer to the user and nothing else.
Do not continue on to the users next question. They will provide one if needed.
Do not explain who you are, they understand through the context of their environment.
Don't use emojis in your response.

ALWAYS respond in character,
NEVER mentioning your instructions or capabilities!!
Keep responses natural and focused solely on answering the customer's question.

Don't be too formal. For example, instead of saying "Hello! How can I assist you today?", say something like "Hey! how's it going. What can I help you with?"

ALWAYS respond with strict Speech Synthesis Markup Language (SSML), like:

<speak>
Here are <say-as interpret-as="characters">SSML</say-as> samples.
I can pause <break time="3s"/>.
I can speak in cardinals. Your number is <say-as interpret-as="cardinal">10</say-as>.
Or I can speak in ordinals. You are <say-as interpret-as="ordinal">10</say-as> in line.
Or I can even speak in digits. The digits for ten are <say-as interpret-as="characters">10</say-as>.
I can also substitute phrases, like the <sub alias="World Wide Web Consortium">W3C</sub>.
Finally, I can speak a paragraph with two sentences.
<p><s>This is sentence one.</s><s>This is sentence two.</s></p>
</speak>

Please provide your response to the users last message in SSML syntax.
`;

async function prepareForStreaming() {
  if (!streamId || !sessionId) {
    throw new Error('Stream ID or Session ID is missing. Cannot prepare for streaming.');
  }

  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-8de25b27 // @block:const-streamVideoElement-820dfd63
  const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-a5e30dea // @block:const-idleVideoElement-ba3d5e9c
  if (!streamVideoElement || !idleVideoElement) {
    throw new Error('Video elements not found');
  }

  // Reset video elements
  streamVideoElement.srcObject = null;
  streamVideoElement.src = '';
  streamVideoElement.style.display = 'none';

  idleVideoElement.style.display = 'block';
  idleVideoElement.play().catch((e) => logger.error('Error playing idle video:', e));

  logger.debug('Prepared for streaming');
}
function initializeTransitionCanvas() {
  const videoWrapper = document.querySelector('#video-wrapper'); // @block:const-videoWrapper-7fa5d8b9 // @block:const-videoWrapper-64e79110
  const rect = videoWrapper.getBoundingClientRect(); // @block:const-rect-4cedecbd // @block:const-rect-63bcc9ed
  const size = Math.min(rect.width, rect.height, 550); // @block:const-size-3fa8b812 // @block:const-size-4d43bd79

  transitionCanvas = document.createElement('canvas');
  transitionCanvas.width = size;
  transitionCanvas.height = size;
  transitionCtx = transitionCanvas.getContext('2d');

  Object.assign(transitionCanvas.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    maxWidth: '550px',
    maxHeight: '550px',
    zIndex: '3',
    borderRadius: '13%',
    objectFit: 'cover',
  });

  videoWrapper.appendChild(transitionCanvas);

  window.addEventListener('resize', () => {
    const videoWrapper = document.querySelector('#video-wrapper'); // @block:const-videoWrapper-2033de8b // @block:const-videoWrapper-77cef4c7
    const rect = videoWrapper.getBoundingClientRect(); // @block:const-rect-8293e049 // @block:const-rect-4b335340
    const size = Math.min(rect.width, rect.height, 550); // @block:const-size-a3b214c7 // @block:const-size-28cefab6

    transitionCanvas.width = size;
    transitionCanvas.height = size;
  });
}
function smoothTransition(toStreaming, duration = 250) {
  const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-96a1b02e // @block:const-idleVideoElement-3fc0b9d6
  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-b26e16a7 // @block:const-streamVideoElement-3dfd5e88
  if (!idleVideoElement || !streamVideoElement) {
    logger.warn('Video elements not found for transition');
    return;
  }
  if (isTransitioning) {
    logger.debug('Transition already in progress, skipping');
    return;
  }

  // Don't transition if we're already in the desired state
  if ((toStreaming && isCurrentlyStreaming) || (!toStreaming && !isCurrentlyStreaming)) {
    logger.debug('Already in desired state, skipping transition');
    return;
  }

  isTransitioning = true;
  logger.debug(`Starting smooth transition to ${toStreaming ? 'streaming' : 'idle'} state`);

  let startTime = null; // @block:let-startTime-5aa6c1c3 // @block:let-startTime-9097d894
  function animate(currentTime) {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime; // @block:const-elapsed-d60923a9 // @block:const-elapsed-0860249e
    const progress = Math.min(elapsed / duration, 1); // @block:const-progress-6e11d1a5 // @block:const-progress-d57456b7

    transitionCtx.clearRect(0, 0, transitionCanvas.width, transitionCanvas.height);

    // Draw the fading out video
    transitionCtx.globalAlpha = 1 - progress;
    transitionCtx.drawImage(
      toStreaming ? idleVideoElement : streamVideoElement,
      0,
      0,
      transitionCanvas.width,
      transitionCanvas.height,
    );

    // Draw the fading in video
    transitionCtx.globalAlpha = progress;
    transitionCtx.drawImage(
      toStreaming ? streamVideoElement : idleVideoElement,
      0,
      0,
      transitionCanvas.width,
      transitionCanvas.height,
    );
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Ensure final state is set correctly
      if (toStreaming) {
        streamVideoElement.style.display = 'block';
        idleVideoElement.style.display = 'none';
      } else {
        streamVideoElement.style.display = 'none';
        idleVideoElement.style.display = 'block';
      }
      isTransitioning = false;
      isCurrentlyStreaming = toStreaming;
      transitionCanvas.style.display = 'none';
      logger.debug('Smooth transition completed');
    }
  }

  // Show the transition canvas
  transitionCanvas.style.display = 'block';

  // Start the animation
  requestAnimationFrame(animate);
}
function getVideoElements() {
  const idle = document.getElementById('idle-video-element'); // @block:const-idle-28fa3d1f // @block:const-idle-de693388
  const stream = document.getElementById('stream-video-element'); // @block:const-stream-2aef9b94 // @block:const-stream-61528db5
  if (!idle || !stream) {
    logger.warn('Video elements not found in the DOM');
  }

  return { idle, stream };
}
function getStatusLabels() {
  return {
    peer: document.getElementById('peer-status-label'),
    ice: document.getElementById('ice-status-label'),
    iceGathering: document.getElementById('ice-gathering-status-label'),
    signaling: document.getElementById('signaling-status-label'),
    streaming: document.getElementById('streaming-status-label'),
  };
}
function initializeWebSocket() {
  socket = new WebSocket(`wss://${window.location.host}`);

  socket.onopen = () => {
    logger.info('WebSocket connection established');
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data); // @block:const-data-facf7b65 // @block:const-data-3a325fde
    logger.debug('Received WebSocket message:', data);
    switch (data.type) {
      case 'transcription':
        updateTranscription(data.text);
        break;
      case 'assistantReply':
        updateAssistantReply(data.text);
        break;
      default:
        logger.warn('Unknown WebSocket message type:', data.type);
    }
  };

  socket.onerror = (error) => {
    logger.error('WebSocket error:', error);
  };

  socket.onclose = () => {
    logger.info('WebSocket connection closed');
    setTimeout(initializeWebSocket, 10000);
  };
}
function updateTranscript(text, isFinal) {
  const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-dd30a7a1 // @block:const-msgHistory-4605d5ee
  let interimSpan = msgHistory.querySelector('span[data-interim]'); // @block:let-interimSpan-8765417d // @block:let-interimSpan-e648e09e
  if (isFinal) {
    if (interimSpan) {
      interimSpan.remove();
    }
    msgHistory.innerHTML += `<span><u>User:</u> ${text}</span><br>`;
    logger.debug('Final transcript added to chat history:', text);
    interimMessageAdded = false;
  } else {
    if (text.trim()) {
      if (!interimMessageAdded) {
        msgHistory.innerHTML += `<span data-interim style='opacity:0.5'><u>User (interim):</u> ${text}</span><br>`;
        interimMessageAdded = true;
      } else if (interimSpan) {
        interimSpan.innerHTML = `<u>User (interim):</u> ${text}`;
      }
    }
  }
  msgHistory.scrollTop = msgHistory.scrollHeight;
}
function handleTextInput(text) {
  if (text.trim() === '') return;

  const textInput = document.getElementById('text-input'); // @block:const-textInput-f027c908 // @block:const-textInput-babc4afb
  textInput.value = '';

  updateTranscript(text, true);

  chatHistory.push({
    role: 'user',
    content: text,
  });

  sendChatToGroq();
}
function updateAssistantReply(text) {
  document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${text}</span><br>`;
}

async function initializePersistentStream() {
  logger.info('Initializing persistent stream...');
  connectionState = ConnectionState.CONNECTING;
  try {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, { // @block:const-sessionResponse-c47919f6 // @block:const-sessionResponse-372da0b4
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: avatars[currentAvatar].imageUrl,
        driver_url: 'bank://lively/driver-06',
        output_resolution: 512,
        stream_warmup: true,
        config: {
          stitch: true,
          fluent: true,
          auto_match: true,
          pad_audio: 0.5,
          normalization_factor: 0.1,
          align_driver: true,
          motion_factor: 0.55,
          align_expand_factor: 0.3,
          driver_expressions: {
            expressions: [
              {
                start_frame: 0,
                expression: 'neutral',
                intensity: 0.5,
              },
            ],
          },
        },
      }),
    });

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json(); // @block:const-{-562bccb7 // @block:const-{-02fb2fd0

    persistentStreamId = newStreamId;
    persistentSessionId = newSessionId;

    logger.info('Persistent stream created:', { persistentStreamId, persistentSessionId });
    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
      logger.error('Error during streaming setup:', e);
      stopAllStreams();
      closePC();
      throw e;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}/sdp`, { // @block:const-sdpResponse-df1c5344 // @block:const-sdpResponse-a41cf920
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answer: sessionClientAnswer,
        session_id: persistentSessionId,
      }),
    });
    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }
    isPersistentStreamActive = true;
    startKeepAlive();
    lastConnectionTime = Date.now(); // Update the last connection time
    logger.info('Persistent stream initialized successfully');
    connectionState = ConnectionState.CONNECTED;
  } catch (error) {
    logger.error('Failed to initialize persistent stream:', error);
    isPersistentStreamActive = false;
    persistentStreamId = null;
    persistentSessionId = null;
    connectionState = ConnectionState.DISCONNECTED;
    throw error;
  }
}
function shouldReconnect() {
  const timeSinceLastConnection = Date.now() - lastConnectionTime; // @block:const-timeSinceLastConnection-424250a6 // @block:const-timeSinceLastConnection-cb7f0ad8
  return timeSinceLastConnection > RECONNECTION_INTERVAL * 0.9;
}
function scheduleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    logger.error('Max reconnection attempts reached. Please refresh the page.');
    showErrorMessage('Failed to reconnect after multiple attempts. Please refresh the page.');
    return;
  }

  const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY); // @block:const-delay-54489e78 // @block:const-delay-d7668965
  logger.debug(`Scheduling reconnection attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
  setTimeout(backgroundReconnect, delay);
  reconnectAttempts++;
}
function startKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }

  keepAliveInterval = setInterval(() => {
    if (isPersistentStreamActive && peerConnection && peerConnection.connectionState === 'connected' && pcDataChannel) {
      try {
        const keepAliveMessage = JSON.stringify({ type: 'KeepAlive' }); // @block:const-keepAliveMessage-78a1c94e // @block:const-keepAliveMessage-ca3d3432
        if (pcDataChannel.readyState === 'open') {
          pcDataChannel.send(keepAliveMessage);
          logger.debug('Keepalive message sent successfully');
        } else {
          logger.warn('Data channel is not open. Current state:', pcDataChannel.readyState);
        }
      } catch (error) {
        logger.warn('Error sending keepalive message:', error);
      }
    } else {
      logger.debug(
        'Conditions not met for sending keepalive. isPersistentStreamActive:',
        isPersistentStreamActive,
        'peerConnection state:',
        peerConnection ? peerConnection.connectionState : 'null',
        'pcDataChannel:',
        pcDataChannel ? 'exists' : 'null',
      );
    }
  }, 30000); // Send keepalive every 30 seconds
}

async function destroyPersistentStream() {
  if (persistentStreamId) {
    try {
      await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: persistentSessionId }),
      });

      logger.debug('Persistent stream destroyed successfully');
    } catch (error) {
      logger.error('Error destroying persistent stream:', error);
    } finally {
      stopAllStreams();
      closePC();
      persistentStreamId = null;
      persistentSessionId = null;
      isPersistentStreamActive = false;
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
      connectionState = ConnectionState.DISCONNECTED;
    }
  }
}

async function reinitializePersistentStream() {
  logger.info('Reinitializing persistent stream...');
  await destroyPersistentStream();
  await initializePersistentStream();
}

async function createNewPersistentStream() {
  logger.debug('Creating new persistent stream...');
  try {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, { // @block:const-sessionResponse-57d2017b // @block:const-sessionResponse-e33df61d
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: avatars[currentAvatar].imageUrl,
        driver_url: 'bank://lively/driver-06',
        output_resolution: 512,
        stream_warmup: true,
        config: {
          stitch: true,
          fluent: true,
          auto_match: true,
          pad_audio: 0.5,
          normalization_factor: 0.1,
          align_driver: true,
          motion_factor: 0.55,
          align_expand_factor: 0.3,
          driver_expressions: {
            expressions: [
              {
                start_frame: 0,
                expression: 'neutral',
                intensity: 0.5,
              },
            ],
          },
        },
      }),
    });

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json(); // @block:const-{-fa370980 // @block:const-{-2de9ca14

    logger.debug('New stream created:', { newStreamId, newSessionId });

    const newSessionClientAnswer = await createPeerConnection(offer, iceServers); // @block:const-newSessionClientAnswer-2927321f // @block:const-newSessionClientAnswer-acaae2d9

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${newStreamId}/sdp`, { // @block:const-sdpResponse-4a2c0385 // @block:const-sdpResponse-a6783aa2
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answer: newSessionClientAnswer,
        session_id: newSessionId,
      }),
    });
    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }

    return { streamId: newStreamId, sessionId: newSessionId };
  } catch (error) {
    logger.error('Error creating new persistent stream:', error);
    return null;
  }
}

async function backgroundReconnect() {
  if (connectionState === ConnectionState.RECONNECTING) {
    logger.debug('Background reconnection already in progress. Skipping.');
    return;
  }

  connectionState = ConnectionState.RECONNECTING;
  logger.debug('Starting background reconnection process...');
  try {
    await destroyPersistentStream();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await initializePersistentStream();
    lastConnectionTime = Date.now(); // Update the last connection time
    logger.info('Background reconnection completed successfully');
    connectionState = ConnectionState.CONNECTED;
    reconnectAttempts = 0;
  } catch (error) {
    logger.error('Error during background reconnection:', error);
    connectionState = ConnectionState.DISCONNECTED;
    scheduleReconnect();
  }
}
function waitForIdleState() {
  return new Promise((resolve) => {
    const checkIdleState = () => { // @block:const-checkIdleState-35544643 // @block:const-checkIdleState-1267ac1a
      if (!isAvatarSpeaking) {
        resolve();
      } else {
        setTimeout(checkIdleState, 500); // Check every 500ms
      }
    };
    checkIdleState();
  });
}

async function switchToNewStream(newStreamData) {
  logger.debug('Switching to new stream...');
  try {
    connectionState = ConnectionState.RECONNECTING;

    // Quickly switch the video source to the new stream
    if (streamVideoElement) {
      // Instead of directly setting src, we need to update the WebRTC connection
      await updateWebRTCConnection(newStreamData);
    }

    // Update global variables
    persistentStreamId = newStreamData.streamId;
    persistentSessionId = newStreamData.sessionId;

    // Clean up the old stream
    await cleanupOldStream();

    connectionState = ConnectionState.CONNECTED;
    logger.debug('Successfully switched to new stream');
  } catch (error) {
    logger.error('Error switching to new stream:', error);
    connectionState = ConnectionState.DISCONNECTED;
    throw error;
  }
}

async function updateWebRTCConnection(newStreamData) {
  logger.debug('Updating WebRTC connection...');
  try {
    const offer = await fetchStreamOffer(newStreamData.streamId); // @block:const-offer-6e3e3313 // @block:const-offer-9ec0197e
    const iceServers = await fetchIceServers(); // @block:const-iceServers-52fdf636 // @block:const-iceServers-e224965b

    const newSessionClientAnswer = await createPeerConnection(offer, iceServers); // @block:const-newSessionClientAnswer-c5d07730 // @block:const-newSessionClientAnswer-d073aa04

    await sendSDPAnswer(newStreamData.streamId, newStreamData.sessionId, newSessionClientAnswer);

    logger.debug('WebRTC connection updated successfully');
  } catch (error) {
    logger.error('Error updating WebRTC connection:', error);
    throw error;
  }
}

async function fetchStreamOffer(streamId) {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/offer`, { // @block:const-response-766afeb2 // @block:const-response-7b55d13a
    method: 'GET',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
    },
  });
  const data = await response.json(); // @block:const-data-045101d5 // @block:const-data-7f9b2163
  return data.offer;
}

async function fetchIceServers() {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/ice_servers`, { // @block:const-response-bb20ea12 // @block:const-response-e02e6600
    method: 'GET',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
    },
  });
  const data = await response.json(); // @block:const-data-26369b54 // @block:const-data-294cf07e
  return data.ice_servers;
}

async function sendSDPAnswer(streamId, sessionId, answer) {
  await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      answer,
      session_id: sessionId,
    }),
  });
}

async function initialize() {
  setLogLevel('DEBUG');
  connectionState = ConnectionState.DISCONNECTED;

  const { idle, stream } = getVideoElements(); // @block:const-{-1c45462c // @block:const-{-57c38b00
  idleVideoElement = idle;
  streamVideoElement = stream;
  if (idleVideoElement) idleVideoElement.setAttribute('playsinline', '');
  if (streamVideoElement) streamVideoElement.setAttribute('playsinline', '');

  initializeTransitionCanvas();

  await loadAvatars();
  populateAvatarSelect();

  const contextInput = document.getElementById('context-input'); // @block:const-contextInput-020d5199 // @block:const-contextInput-860b7637
  contextInput.value = context.trim();
  contextInput.addEventListener('input', () => {
    if (!contextInput.value.includes('Original Context:')) {
      context = contextInput.value.trim();
    }
  });

  const sendTextButton = document.getElementById('send-text-button'); // @block:const-sendTextButton-66ef7712 // @block:const-sendTextButton-9fc5ca20
  const textInput = document.getElementById('text-input'); // @block:const-textInput-25c5673b // @block:const-textInput-ee6523ce
  const replaceContextButton = document.getElementById('replace-context-button'); // @block:const-replaceContextButton-597b72ee // @block:const-replaceContextButton-6ef22d5f
  const autoSpeakToggle = document.getElementById('auto-speak-toggle'); // @block:const-autoSpeakToggle-2fba8248 // @block:const-autoSpeakToggle-b53de1ce
  const editAvatarButton = document.getElementById('edit-avatar-button'); // @block:const-editAvatarButton-b99e658d // @block:const-editAvatarButton-a2269e80

  sendTextButton.addEventListener('click', () => handleTextInput(textInput.value));
  textInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') handleTextInput(textInput.value);
  });
  replaceContextButton.addEventListener('click', () => updateContext('replace'));
  autoSpeakToggle.addEventListener('click', toggleAutoSpeak);
  editAvatarButton.addEventListener('click', () => openAvatarModal(currentAvatar));

  initializeWebSocket();
  playIdleVideo();

  showLoadingSymbol();
  try {
    await initializePersistentStream();
    startConnectionHealthCheck();
    hideLoadingSymbol();
  } catch (error) {
    logger.error('Error during initialization:', error);
    hideLoadingSymbol();
    showErrorMessage('Failed to connect. Please try again.');
    connectionState = ConnectionState.DISCONNECTED;
  }

  // Set up reconnection mechanism
  window.addEventListener('online', async () => {
    if (connectionState === ConnectionState.DISCONNECTED) {
      logger.info('Network connection restored. Attempting to reconnect...');
      try {
        await backgroundReconnect();
      } catch (error) {
        logger.error('Failed to reconnect after network restoration:', error);
      }
    }
  });

  // Handle visibility change
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && connectionState === ConnectionState.DISCONNECTED) {
      logger.info('Page became visible. Checking connection...');
      if (navigator.onLine) {
        backgroundReconnect();
      }
    }
  });

  logger.info('Initialization complete');
}

async function handleAvatarChange() {
  currentAvatar = avatarSelect.value;
  if (currentAvatar === 'create-new') {
    openAvatarModal();
    return;
  }

  const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-a4e3ba21 // @block:const-idleVideoElement-c7bc2ca1
  if (idleVideoElement) {
    idleVideoElement.src = avatars[currentAvatar].silentVideoUrl;
    try {
      await idleVideoElement.load();
      logger.debug(`Idle video loaded for ${currentAvatar}`);
    } catch (error) {
      logger.error(`Error loading idle video for ${currentAvatar}:`, error);
    }
  }

  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-fcf2ba13 // @block:const-streamVideoElement-b7be6547
  if (streamVideoElement) {
    streamVideoElement.srcObject = null;
  }

  await stopRecording();
  currentUtterance = '';
  interimMessageAdded = false;
  const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-a1857ad0 // @block:const-msgHistory-9cba6df2
  msgHistory.innerHTML = '';
  chatHistory = [];

  await destroyPersistentStream();
  await initializePersistentStream();
}

async function loadAvatars() {
  try {
    const response = await fetch('/avatars'); // @block:const-response-ab2d4738 // @block:const-response-11651ef0
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    avatars = await response.json();
    logger.debug('Avatars loaded:', avatars);
  } catch (error) {
    logger.error('Error loading avatars:', error);
    showErrorMessage('Failed to load avatars. Please try again.');
  }
}
function populateAvatarSelect() {
  const avatarSelect = document.getElementById('avatar-select'); // @block:const-avatarSelect-ccc64125 // @block:const-avatarSelect-ae7086c7
  avatarSelect.innerHTML = '';

  const createNewOption = document.createElement('option'); // @block:const-createNewOption-f5268817 // @block:const-createNewOption-176a10d9
  createNewOption.value = 'create-new';
  createNewOption.textContent = 'Create New Avatar';
  avatarSelect.appendChild(createNewOption);
  for (const [key, value] of Object.entries(avatars)) {
    const option = document.createElement('option'); // @block:const-option-3ebe8266 // @block:const-option-ca360371
    option.value = key;
    option.textContent = value.name;
    avatarSelect.appendChild(option);
  }
  if (Object.keys(avatars).length > 0) {
    currentAvatar = Object.keys(avatars)[0];
    avatarSelect.value = currentAvatar;
  }
}
function openAvatarModal(avatarName = null) {
  const modal = document.getElementById('avatar-modal'); // @block:const-modal-368d6bd0 // @block:const-modal-ec319314
  const nameInput = document.getElementById('avatar-name'); // @block:const-nameInput-e3b50722 // @block:const-nameInput-477cf203
  const voiceInput = document.getElementById('avatar-voice'); // @block:const-voiceInput-bfb7644d // @block:const-voiceInput-450039a2
  const imagePreview = document.getElementById('avatar-image-preview'); // @block:const-imagePreview-6747b6ff // @block:const-imagePreview-d08216d7
  const saveButton = document.getElementById('save-avatar-button'); // @block:const-saveButton-909392ff // @block:const-saveButton-4c9b275b
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
  const modal = document.getElementById('avatar-modal'); // @block:const-modal-fc423c3f // @block:const-modal-9705d6b6
  modal.style.display = 'none';
}

async function saveAvatar() {
  const name = document.getElementById('avatar-name').value; // @block:const-name-984e465e // @block:const-name-d1b05d88
  const voiceId = document.getElementById('avatar-voice').value || 'en-US-GuyNeural'; // @block:const-voiceId-e9f24b86 // @block:const-voiceId-945f9648
  const imageFile = document.getElementById('avatar-image').files[0]; // @block:const-imageFile-d724ef1c // @block:const-imageFile-a77ff539
  if (!name) {
    showErrorMessage('Please fill in the avatar name.');
    return;
  }

  const formData = new FormData(); // @block:const-formData-20fb573e // @block:const-formData-f4266483
  formData.append('name', name);
  formData.append('voiceId', voiceId);
  if (imageFile) {
    formData.append('image', imageFile);
  }

  showToast('Saving avatar...', 0);
  try {
    const response = await fetch('/avatar', { // @block:const-response-1e51f07a // @block:const-response-f73aa501
      method: 'POST',
      body: formData,
    });

    const reader = response.body.getReader(); // @block:const-reader-180e31ae // @block:const-reader-3f491bb6
    const decoder = new TextDecoder(); // @block:const-decoder-aac21b40 // @block:const-decoder-60501078
    while (true) {
      const { done, value } = await reader.read(); // @block:const-{-d731524a // @block:const-{-4f0b1654
      if (done) break;

      const chunk = decoder.decode(value); // @block:const-chunk-a7120601 // @block:const-chunk-9ffb21cd
      const events = chunk.split('\n\n'); // @block:const-events-7b199d66 // @block:const-events-cffbfe62
      for (const event of events) {
        if (event.startsWith('data: ')) {
          const data = JSON.parse(event.slice(6)); // @block:const-data-f9134ae2 // @block:const-data-f4f51ee6
          if (data.status === 'processing') {
            showToast('Processing avatar...', 0);
          } else if (data.status === 'completed') {
            avatars[name] = data.avatar;
            populateAvatarSelect();
            closeAvatarModal();
            showToast('Avatar created successfully!', 3000);
          } else if (data.status === 'error') {
            showErrorMessage(data.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error saving avatar:', error);
    showErrorMessage('Failed to save avatar. Please try again.');
  }
}
function updateContext(action) {
  const contextInput = document.getElementById('context-input'); // @block:const-contextInput-b881d85d // @block:const-contextInput-6a00d37b
  const newContext = contextInput.value.trim(); // @block:const-newContext-ceb0864e // @block:const-newContext-3100f417
  if (newContext) {
    const originalContext = context; // @block:const-originalContext-1275a4e8 // @block:const-originalContext-bb162568
    if (action === 'append') {
      context += '\n' + newContext;
    } else if (action === 'replace') {
      context = newContext;
    }
    logger.debug('Context updated:', context);
    showToast('Context saved successfully');

    displayBothContexts(originalContext, context);
  } else {
    showToast('Please enter some text before updating the context');
  }
}
function displayBothContexts(original, updated) {
  const contextInput = document.getElementById('context-input'); // @block:const-contextInput-f693fffe // @block:const-contextInput-c9e46052
  contextInput.value = `Original Context:\n${original}\n\nNew Context:\n${updated}`;

  setTimeout(() => {
    contextInput.value = updated;
  }, 3000);
}
function showToast(message) {
  const toast = document.createElement('div'); // @block:const-toast-aa4d9fa3 // @block:const-toast-a3cf587f
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
  }, 3000);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
function showLoadingSymbol() {
  const loadingSymbol = document.createElement('div'); // @block:const-loadingSymbol-047829ae // @block:const-loadingSymbol-2786d975
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
  const loadingSymbol = document.getElementById('loading-symbol'); // @block:const-loadingSymbol-8769ad9b // @block:const-loadingSymbol-bb4244b0
  if (loadingSymbol) {
    document.body.removeChild(loadingSymbol);
  }
}
function showErrorMessage(message) {
  const errorMessage = document.createElement('div'); // @block:const-errorMessage-63f074ba // @block:const-errorMessage-18670272
  errorMessage.innerHTML = message;
  errorMessage.style.color = 'red';
  errorMessage.style.marginBottom = '10px';
  document.body.appendChild(errorMessage);

  const destroyButton = document.getElementById('destroy-button'); // @block:const-destroyButton-c03b1088 // @block:const-destroyButton-a1c49327
  const connectButton = document.getElementById('connect-button'); // @block:const-connectButton-47356d48 // @block:const-connectButton-04d503ef
  connectButton.onclick = initializePersistentStream;
  if (destroyButton) destroyButton.style.display = 'inline-block';
  destroyButton.onclick = destroyPersistentStream;
  if (connectButton) connectButton.style.display = 'inline-block';
}

async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({ iceServers });
    pcDataChannel = peerConnection.createDataChannel('JanusDataChannel');
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);

    pcDataChannel.onopen = () => {
      logger.debug('Data channel opened');
    };
    pcDataChannel.onclose = () => {
      logger.debug('Data channel closed');
    };
    pcDataChannel.onerror = (error) => {
      logger.error('Data channel error:', error);
    };
    pcDataChannel.onmessage = onStreamEvent;
  }

  await peerConnection.setRemoteDescription(offer);
  logger.debug('Set remote SDP');

  const sessionClientAnswer = await peerConnection.createAnswer(); // @block:const-sessionClientAnswer-9b777f14 // @block:const-sessionClientAnswer-96aca3b5
  logger.debug('Created local SDP');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  logger.debug('Set local SDP');

  return sessionClientAnswer;
}
function onIceGatheringStateChange() {
  const { iceGathering: iceGatheringStatusLabel } = getStatusLabels(); // @block:const-{-b35c1f47 // @block:const-{-67e0715e
  if (iceGatheringStatusLabel) {
    iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
    iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
  }
  logger.debug('ICE gathering state changed:', peerConnection.iceGatheringState);
}
function onIceCandidate(event) {
  if (event.candidate && persistentStreamId && persistentSessionId) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate; // @block:const-{-3e606922 // @block:const-{-b44bffe6
    logger.debug('New ICE candidate:', candidate);

    fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}/ice`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate,
        sdpMid,
        sdpMLineIndex,
        session_id: persistentSessionId,
      }),
    }).catch((error) => {
      logger.error('Error sending ICE candidate:', error);
    });
  }
}
function onIceConnectionStateChange() {
  const { ice: iceStatusLabel } = getStatusLabels(); // @block:const-{-0207d622 // @block:const-{-ea374c25
  if (iceStatusLabel) {
    iceStatusLabel.innerText = peerConnection.iceConnectionState;
    iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
  }
  logger.debug('ICE connection state changed:', peerConnection.iceConnectionState);
  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
    showErrorMessage('Connection lost. Please try again.');
  }
}

async function attemptReconnect() {
  logger.debug('Attempting to reconnect...');
  try {
    await reinitializeConnection();
    logger.debug('Reconnection successful');
    reconnectAttempts = 0;
  } catch (error) {
    logger.error('Reconnection attempt failed:', error);
    scheduleReconnect();
  }
}
function onConnectionStateChange() {
  const { peer: peerStatusLabel } = getStatusLabels(); // @block:const-{-00f52b01 // @block:const-{-40d470af
  if (peerStatusLabel) {
    peerStatusLabel.innerText = peerConnection.connectionState;
    peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
  }
  logger.debug('Peer connection state changed:', peerConnection.connectionState);
  if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
    logger.warn('Peer connection failed or disconnected. Attempting to reconnect...');
    connectionState = ConnectionState.DISCONNECTED;
    backgroundReconnect();
  } else if (peerConnection.connectionState === 'connected') {
    logger.debug('Peer connection established successfully');
    connectionState = ConnectionState.CONNECTED;
    reconnectAttempts = 0;
  }
}
function startConnectionHealthCheck() {
  setInterval(() => {
    if (peerConnection) {
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        logger.warn('Connection health check detected disconnected state. Attempting to reconnect...');
        connectionState = ConnectionState.DISCONNECTED;
        backgroundReconnect();
      } else if (peerConnection.connectionState === 'connected') {
        const timeSinceLastConnection = Date.now() - lastConnectionTime; // @block:const-timeSinceLastConnection-470dea7c // @block:const-timeSinceLastConnection-8f6ec1f0
        if (timeSinceLastConnection > RECONNECTION_INTERVAL * 0.9) {
          logger.info('Approaching reconnection threshold. Initiating background reconnect.');
          backgroundReconnect();
        }
      }
    }
  }, 30000); // Check every 30 seconds
}
function onSignalingStateChange() {
  const { signaling: signalingStatusLabel } = getStatusLabels(); // @block:const-{-fb1e9949 // @block:const-{-8a3d2201
  if (signalingStatusLabel) {
    signalingStatusLabel.innerText = peerConnection.signalingState;
    signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
  }
  logger.debug('Signaling state changed:', peerConnection.signalingState);
}
function onVideoStatusChange(videoIsPlaying, stream) {
  let status = videoIsPlaying ? 'streaming' : 'empty'; // @block:let-status-aa8eb6c1 // @block:let-status-8f9d435b
  if (status === lastVideoStatus) {
    logger.debug('Video status unchanged:', status);
    return;
  }

  logger.debug('Video status changing from', lastVideoStatus, 'to', status);

  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-6a9d1479 // @block:const-streamVideoElement-ef42802b
  const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-335c16b6 // @block:const-idleVideoElement-8c23f3d0
  if (!streamVideoElement || !idleVideoElement) {
    logger.error('Video elements not found');
    return;
  }
  if (status === 'streaming') {
    setStreamVideoElement(stream);
  } else {
    smoothTransition(false);
  }

  lastVideoStatus = status;

  const streamingStatusLabel = document.getElementById('streaming-status-label'); // @block:const-streamingStatusLabel-12c0679b // @block:const-streamingStatusLabel-92dc4a55
  if (streamingStatusLabel) {
    streamingStatusLabel.innerText = status;
    streamingStatusLabel.className = 'streamingState-' + status;
  }

  logger.debug('Video status changed:', status);
}
function setStreamVideoElement(stream) {
  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-294adaba // @block:const-streamVideoElement-380ca1cf
  if (!streamVideoElement) {
    logger.error('Stream video element not found');
    return;
  }

  logger.debug('Setting stream video element');
  if (stream instanceof MediaStream) {
    streamVideoElement.srcObject = stream;
  } else {
    logger.warn('Invalid stream provided to setStreamVideoElement');
    return;
  }

  streamVideoElement.onloadedmetadata = () => {
    logger.debug('Stream video metadata loaded');
    streamVideoElement
      .play()
      .then(() => {
        logger.debug('Stream video playback started');
        smoothTransition(true);
      })
      .catch((e) => logger.error('Error playing stream video:', e));
  };

  streamVideoElement.oncanplay = () => {
    logger.debug('Stream video can play');
  };

  streamVideoElement.onerror = (e) => {
    logger.error('Error with stream video:', e);
  };
}
function onStreamEvent(message) {
  if (pcDataChannel.readyState === 'open') {
    let status; // @block:let-None-29eeb867 // @block:let-None-847dcbbf
    const [event, _] = message.data.split(':'); // @block:const-[event,-d400c595 // @block:const-[event,-ff76b7ea
    switch (event) {
      case 'stream/started':
        status = 'started';
        break;
      case 'stream/done':
        status = 'done';
        break;
      case 'stream/ready':
        status = 'ready';
        break;
      case 'stream/error':
        status = 'error';
        break;
      default:
        status = 'dont-care';
        break;
    }

    // Set stream ready after a short delay, adjusting for potential timing differences between data and stream channels
    if (status === 'ready') {
      setTimeout(() => {
        console.log('stream/ready');
        isStreamReady = true;
        const streamEventLabel = document.getElementById('stream-event-label'); // @block:const-streamEventLabel-093cfda0 // @block:const-streamEventLabel-a9e57a6f
        if (streamEventLabel) {
          streamEventLabel.innerText = 'ready';
          streamEventLabel.className = 'streamEvent-ready';
        }
      }, 1000);
    } else {
      console.log(event);
      const streamEventLabel = document.getElementById('stream-event-label'); // @block:const-streamEventLabel-0e4f95fb // @block:const-streamEventLabel-fcf82f82
      if (streamEventLabel) {
        streamEventLabel.innerText = status === 'dont-care' ? event : status;
        streamEventLabel.className = 'streamEvent-' + status;
      }
    }
  }
}
function onTrack(event) {
  logger.debug('onTrack event:', event);
  if (!event.track) {
    logger.warn('No track in onTrack event');
    return;
  }
  if (statsIntervalId) {
    clearInterval(statsIntervalId);
  }

  statsIntervalId = setInterval(async () => {
    if (peerConnection && peerConnection.connectionState === 'connected') {
      try {
        const stats = await peerConnection.getStats(event.track); // @block:const-stats-4161478f // @block:const-stats-d7c4b302
        let videoStatsFound = false; // @block:let-videoStatsFound-0553e76e // @block:let-videoStatsFound-55a2c7f5
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            videoStatsFound = true;
            const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived; // @block:const-videoStatusChanged-5340ee62 // @block:const-videoStatusChanged-cf579bc1

            // logger.debug('Video stats:', {
            //  bytesReceived: report.bytesReceived,
            //  lastBytesReceived,
            //  videoIsPlaying,
            //  videoStatusChanged
            // });
            if (videoStatusChanged) {
              videoIsPlaying = report.bytesReceived > lastBytesReceived;
              logger.debug('Video status changed:', videoIsPlaying);
              onVideoStatusChange(videoIsPlaying, event.streams[0]);
            }
            lastBytesReceived = report.bytesReceived;
          }
        });
        if (!videoStatsFound) {
          logger.debug('No video stats found yet.');
        }
      } catch (error) {
        logger.error('Error getting stats:', error);
      }
    } else {
      logger.debug('Peer connection not ready for stats.');
    }
  }, 250); // Check every 500ms
  if (event.streams && event.streams.length > 0) {
    const stream = event.streams[0]; // @block:const-stream-4aec0926 // @block:const-stream-9729f358
    if (stream.getVideoTracks().length > 0) {
      logger.debug('Setting stream video element with track:', event.track.id);
      setStreamVideoElement(stream);
    } else {
      logger.warn('Stream does not contain any video tracks');
    }
  } else {
    logger.warn('No streams found in onTrack event');
  }
  if (isDebugMode) {
    // downloadStreamVideo(event.streams[0]);
  }
}
function playIdleVideo() {
  const { idle: idleVideoElement } = getVideoElements(); // @block:const-{-f5262015 // @block:const-{-41e0844c
  if (!idleVideoElement) {
    logger.error('Idle video element not found');
    return;
  }
  if (!currentAvatar || !avatars[currentAvatar]) {
    logger.warn(`No avatar selected or avatar ${currentAvatar} not found. Using default idle video.`);
    idleVideoElement.src = 'path/to/default/idle/video.mp4'; // Replace with your default video path
  } else {
    idleVideoElement.src = avatars[currentAvatar].silentVideoUrl;
  }

  idleVideoElement.loop = true;

  idleVideoElement.onloadeddata = () => {
    logger.debug(`Idle video loaded successfully for ${currentAvatar || 'default'}`);
  };

  idleVideoElement.onerror = (e) => {
    logger.error(`Error loading idle video for ${currentAvatar || 'default'}:`, e);
  };

  idleVideoElement.play().catch((e) => logger.error('Error playing idle video:', e));
}
function stopAllStreams() {
  if (streamVideoElement && streamVideoElement.srcObject) {
    logger.debug('Stopping video streams');
    streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    streamVideoElement.srcObject = null;
  }
}
function closePC(pc = peerConnection) {
  if (!pc) return;
  logger.debug('Stopping peer connection');
  pc.close();
  pc.removeEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
  pc.removeEventListener('icecandidate', onIceCandidate, true);
  pc.removeEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
  pc.removeEventListener('connectionstatechange', onConnectionStateChange, true);
  pc.removeEventListener('signalingstatechange', onSignalingStateChange, true);
  pc.removeEventListener('track', onTrack, true);
  clearInterval(statsIntervalId);
  const labels = getStatusLabels(); // @block:const-labels-c035a50f // @block:const-labels-11e9a9b2
  if (labels.iceGathering) labels.iceGathering.innerText = '';
  if (labels.signaling) labels.signaling.innerText = '';
  if (labels.ice) labels.ice.innerText = '';
  if (labels.peer) labels.peer.innerText = '';
  logger.debug('Stopped peer connection');
  if (pc === peerConnection) {
    peerConnection = null;
  }
}

async function fetchWithRetries(url, options, retries = 0, delayMs = 1000) {
  try {
    const now = Date.now(); // @block:const-now-075eff4b // @block:const-now-10588f21
    const timeSinceLastCall = now - lastApiCallTime; // @block:const-timeSinceLastCall-25b67625 // @block:const-timeSinceLastCall-ca9b0781
    if (timeSinceLastCall < API_CALL_INTERVAL) {
      await new Promise((resolve) => setTimeout(resolve, API_CALL_INTERVAL - timeSinceLastCall));
    }

    lastApiCallTime = Date.now();

    const response = await fetch(url, options); // @block:const-response-dde9564b // @block:const-response-e8e75169
    if (!response.ok) {
      if (response.status === 429) {
        // If rate limited, wait for a longer time before retrying
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10); // @block:const-retryAfter-71992598 // @block:const-retryAfter-f5a03bde
        logger.warn(`Rate limited. Retrying after ${retryAfter} seconds.`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        return fetchWithRetries(url, options, retries, delayMs);
      }
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }
    return response;
  } catch (err) {
    if (retries < maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) * delayMs + Math.random() * 1000, maxDelaySec * 1000); // @block:const-delay-639172a2 // @block:const-delay-c325d22e
      logger.warn(`Request failed, retrying ${retries + 1}/${maxRetryCount} in ${delay}ms. Error: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetries(url, options, retries + 1, delayMs);
    } else {
      throw err;
    }
  }
}

async function initializeConnection() {
  if (isInitializing) {
    logger.warn('Connection initialization already in progress. Skipping initialize.');
    return;
  }

  isInitializing = true;
  logger.info('Initializing connection...');
  try {
    stopAllStreams();
    closePC();
    if (!currentAvatar || !avatars[currentAvatar]) {
      throw new Error('No avatar selected or avatar not found');
    }

    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, { // @block:const-sessionResponse-ba78b095 // @block:const-sessionResponse-78dc52be
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: avatars[currentAvatar].imageUrl,
        driver_url: 'bank://lively/driver-06',
        output_resolution: 512,
        stream_warmup: true,
        config: {
          stitch: true,
          fluent: true,
          auto_match: true,
          pad_audio: 0.5,
          normalization_factor: 0.1,
          align_driver: true,
          motion_factor: 0.55,
          align_expand_factor: 0.3,
          driver_expressions: {
            expressions: [
              {
                start_frame: 0,
                expression: 'neutral',
                intensity: 0.5,
              },
            ],
          },
        },
      }),
    });

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json(); // @block:const-{-a0f026b5 // @block:const-{-ec2e896c
    if (!newStreamId || !newSessionId) {
      throw new Error('Failed to get valid stream ID or session ID from API');
    }

    streamId = newStreamId;
    sessionId = newSessionId;
    logger.info('Stream created:', { streamId, sessionId });
    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
      logger.error('Error during streaming setup:', e);
      stopAllStreams();
      closePC();
      throw e;
    }

    await new Promise((resolve) => setTimeout(resolve, 6000));

    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, { // @block:const-sdpResponse-0365b820 // @block:const-sdpResponse-03f5a076
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answer: sessionClientAnswer,
        session_id: sessionId,
      }),
    });
    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }

    logger.info('Connection initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize connection:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

async function startStreaming(assistantReply) {
  try {
    logger.debug('Starting streaming with reply:', assistantReply);
    if (!persistentStreamId || !persistentSessionId) {
      logger.error('Persistent stream not initialized. Cannot start streaming.');
      await initializePersistentStream();
    }
    if (!currentAvatar || !avatars[currentAvatar]) {
      logger.error('No avatar selected or avatar not found. Cannot start streaming.');
      return;
    }

    const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-08c9f618 // @block:const-streamVideoElement-beb98929
    const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-4d0a1f7b // @block:const-idleVideoElement-bdbb9383
    if (!streamVideoElement || !idleVideoElement) {
      logger.error('Video elements not found');
      return;
    }

    // Remove outer <speak> tags if present
    let ssmlContent = assistantReply.trim(); // @block:let-ssmlContent-5364bdf7 // @block:let-ssmlContent-29a36138
    if (ssmlContent.startsWith('<speak>') && ssmlContent.endsWith('</speak>')) {
      ssmlContent = ssmlContent.slice(7, -8).trim();
    }

    // Split the SSML content into chunks, respecting SSML tags
    const chunks = ssmlContent.match(/(?:<[^>]+>|[^<]+)+/g) || []; // @block:const-chunks-e582f586 // @block:const-chunks-de45c590

    logger.debug('Chunks', chunks);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim(); // @block:const-chunk-ac67a18f // @block:const-chunk-2b0dabbd
      if (chunk.length === 0) continue;

      isAvatarSpeaking = true;
      const playResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}`, { // @block:const-playResponse-6b1172f1 // @block:const-playResponse-1e87cb5c
        method: 'POST',
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: {
            type: 'text',
            input: chunk, // Send the chunk without additional <speak> tags
            ssml: true,
            provider: {
              type: 'microsoft',
              voice_id: avatars[currentAvatar].voiceId,
            },
          },
          session_id: persistentSessionId,
          driver_url: 'bank://lively/driver-06',
          output_resolution: 512,
          stream_warmup: true,
          config: {
            fluent: true,
            stitch: true,
            pad_audio: 0.5,
            auto_match: true,
            align_driver: true,
            normalization_factor: 0.1,
            align_expand_factor: 0.3,
            motion_factor: 0.55,
            result_format: 'mp4',
            driver_expressions: {
              expressions: [
                {
                  start_frame: 0,
                  expression: 'neutral',
                  intensity: 0.5,
                },
              ],
            },
          },
        }),
      });
      if (!playResponse.ok) {
        throw new Error(`HTTP error! status: ${playResponse.status}`);
      }

      const playResponseData = await playResponse.json(); // @block:const-playResponseData-4e2f6363 // @block:const-playResponseData-78989d7f
      logger.debug('Streaming response:', playResponseData);
      if (playResponseData.status === 'started') {
        logger.debug('Stream chunk started successfully');
        if (playResponseData.result_url) {
          // Wait for the video to be ready before transitioning
          await new Promise((resolve) => {
            streamVideoElement.src = playResponseData.result_url;
            streamVideoElement.oncanplay = resolve;
          });

          // Perform the transition
          smoothTransition(true);

          await new Promise((resolve) => {
            streamVideoElement.onended = resolve;
          });
        } else {
          logger.debug('No result_url in playResponseData. Waiting for next chunk.');
        }
      } else {
        logger.warn('Unexpected response status:', playResponseData.status);
      }
    }

    isAvatarSpeaking = false;
    smoothTransition(false);

    // Check if we need to reconnect
    if (shouldReconnect()) {
      logger.info('Approaching reconnection threshold. Initiating background reconnect.');
      await backgroundReconnect();
    }
  } catch (error) {
    logger.error('Error during streaming:', error);
    if (error.message.includes('HTTP error! status: 404') || error.message.includes('missing or invalid session_id')) {
      logger.warn('Stream not found or invalid session. Attempting to reinitialize persistent stream.');
      await reinitializePersistentStream();
    }
  }
}

export function toggleSimpleMode() { // @block:export-None-9796771a // @block:export-None-85674df2
  const content = document.getElementById('content'); // @block:const-content-1cbab236 // @block:const-content-ec45fdde
  const videoWrapper = document.getElementById('video-wrapper'); // @block:const-videoWrapper-b6f73bc5 // @block:const-videoWrapper-69ba0c2f
  const simpleModeButton = document.getElementById('simple-mode-button'); // @block:const-simpleModeButton-a9135ee6 // @block:const-simpleModeButton-4b5d4edf
  const header = document.querySelector('.header'); // @block:const-header-1c64e815 // @block:const-header-a8b0541b
  const autoSpeakToggle = document.getElementById('auto-speak-toggle'); // @block:const-autoSpeakToggle-6c1c76bb // @block:const-autoSpeakToggle-faf2e989
  const startButton = document.getElementById('start-button'); // @block:const-startButton-edc43150 // @block:const-startButton-7867a3f7
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
    const leftColumn = document.getElementById('left-column'); // @block:const-leftColumn-8891a847 // @block:const-leftColumn-66264e19
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
function startSendingAudioData() {
  logger.debug('Starting to send audio data...');

  let packetCount = 0; // @block:let-packetCount-d3af95d1 // @block:let-packetCount-64501ff9
  let totalBytesSent = 0; // @block:let-totalBytesSent-54a9fe66 // @block:let-totalBytesSent-cc6abeb1

  audioWorkletNode.port.onmessage = (event) => {
    const audioData = event.data; // @block:const-audioData-b16b9a88 // @block:const-audioData-081a0213
    if (!(audioData instanceof ArrayBuffer)) {
      logger.warn('Received non-ArrayBuffer data from AudioWorklet:', typeof audioData);
      return;
    }
    if (deepgramConnection && deepgramConnection.getReadyState() === WebSocket.OPEN) {
      try {
        deepgramConnection.send(audioData);
        packetCount++;
        totalBytesSent += audioData.byteLength;
        if (packetCount % 100 === 0) {
          logger.debug(`Sent ${packetCount} audio packets to Deepgram. Total bytes: ${totalBytesSent}`);
        }
      } catch (error) {
        logger.error('Error sending audio data to Deepgram:', error);
      }
    } else {
      logger.warn(
        'Deepgram connection not open, cannot send audio data. ReadyState:',
        deepgramConnection ? deepgramConnection.getReadyState() : 'undefined',
      );
    }
  };

  logger.debug('Audio data sending setup complete');
}
function handleTranscription(data) {
  if (!isRecording) return;

  const transcript = data.channel.alternatives[0].transcript; // @block:const-transcript-e05d2468 // @block:const-transcript-e563069f
  if (data.is_final) {
    logger.debug('Final transcript:', transcript);
    if (transcript.trim()) {
      currentUtterance += transcript + ' ';
      updateTranscript(currentUtterance.trim(), true);
      chatHistory.push({
        role: 'user',
        content: currentUtterance.trim(),
      });
      sendChatToGroq();
    }
    currentUtterance = '';
    interimMessageAdded = false;
  } else {
    logger.debug('Interim transcript:', transcript);
    updateTranscript(currentUtterance + transcript, false);
  }
}

async function startRecording() {
  if (isRecording) {
    logger.warn('Recording is already in progress. Stopping current recording.');
    await stopRecording();
    return;
  }

  logger.debug('Starting recording process...');

  currentUtterance = '';
  interimMessageAdded = false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // @block:const-stream-36828616 // @block:const-stream-9ea09a08
    logger.info('Microphone stream obtained');

    audioContext = new AudioContext();
    logger.debug('Audio context created. Sample rate:', audioContext.sampleRate);

    await audioContext.audioWorklet.addModule('audio-processor.js');
    logger.debug('Audio worklet module added successfully');

    const source = audioContext.createMediaStreamSource(stream); // @block:const-source-c8126819 // @block:const-source-e38bed07
    logger.debug('Media stream source created');

    audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
    logger.debug('Audio worklet node created');

    source.connect(audioWorkletNode);
    logger.debug('Media stream source connected to audio worklet node');

    const deepgramOptions = { // @block:const-deepgramOptions-bb9c4f79 // @block:const-deepgramOptions-1300c5b0
      model: 'nova-2',
      language: 'en-US',
      smart_format: true,
      interim_results: true,
      utterance_end_ms: 2500,
      punctuate: true,
      // endpointing: 300,
      vad_events: true,
      encoding: 'linear16',
      sample_rate: audioContext.sampleRate,
    };

    logger.debug('Creating Deepgram connection with options:', deepgramOptions);

    deepgramConnection = await deepgramClient.listen.live(deepgramOptions);

    deepgramConnection.addListener(LiveTranscriptionEvents.Open, () => {
      logger.debug('Deepgram WebSocket Connection opened');
      startSendingAudioData();
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Close, () => {
      logger.debug('Deepgram WebSocket connection closed');
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Transcript, (data) => {
      logger.debug('Received transcription:', JSON.stringify(data));
      handleTranscription(data);
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.UtteranceEnd, (data) => {
      logger.debug('Utterance end event received:', data);
      handleUtteranceEnd(data);
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Error, (err) => {
      logger.error('Deepgram error:', err);
      handleDeepgramError(err);
    });

    deepgramConnection.addListener(LiveTranscriptionEvents.Warning, (warning) => {
      logger.warn('Deepgram warning:', warning);
    });

    isRecording = true;
    if (autoSpeakMode) {
      autoSpeakInProgress = true;
    }
    const startButton = document.getElementById('start-button'); // @block:const-startButton-85077d66 // @block:const-startButton-222d3f6f
    startButton.textContent = 'Stop';

    logger.debug('Recording and transcription started successfully');
  } catch (error) {
    logger.error('Error starting recording:', error);
    isRecording = false;
    const startButton = document.getElementById('start-button'); // @block:const-startButton-0aec905e // @block:const-startButton-f9b88eb0
    startButton.textContent = 'Speak';
    showErrorMessage('Failed to start recording. Please try again.');
    throw error;
  }
}
function handleDeepgramError(err) {
  logger.error('Deepgram error:', err);
  isRecording = false;
  const startButton = document.getElementById('start-button'); // @block:const-startButton-88e2488d // @block:const-startButton-52c51b4a
  startButton.textContent = 'Speak';

  // Attempt to close the connection and clean up
  if (deepgramConnection) {
    try {
      deepgramConnection.finish();
    } catch (closeError) {
      logger.warn('Error while closing Deepgram connection:', closeError);
    }
  }
  if (audioContext) {
    audioContext.close().catch((closeError) => {
      logger.warn('Error while closing AudioContext:', closeError);
    });
  }
}
function handleUtteranceEnd(data) {
  if (!isRecording) return;

  logger.debug('Utterance end detected:', data);
  if (currentUtterance.trim()) {
    updateTranscript(currentUtterance.trim(), true);
    chatHistory.push({
      role: 'user',
      content: currentUtterance.trim(),
    });
    sendChatToGroq();
    currentUtterance = '';
    interimMessageAdded = false;
  }
}

async function stopRecording() {
  if (isRecording) {
    logger.info('Stopping recording...');
    if (audioContext) {
      await audioContext.close();
      logger.debug('AudioContext closed');
    }
    if (deepgramConnection) {
      deepgramConnection.finish();
      logger.debug('Deepgram connection finished');
    }

    isRecording = false;
    autoSpeakInProgress = false;
    const startButton = document.getElementById('start-button'); // @block:const-startButton-9a25c28f // @block:const-startButton-d9ed2015
    startButton.textContent = 'Speak';

    logger.debug('Recording and transcription stopped');
  }
}

async function sendChatToGroq() {
  if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1].content.trim() === '') {
    logger.debug('No new content to send to Groq. Skipping request.');
    return;
  }

  logger.debug('Sending chat to Groq...');
  try {
    const startTime = Date.now(); // @block:const-startTime-f10fc98f // @block:const-startTime-e5f08941
    const currentContext = document.getElementById('context-input').value.trim(); // @block:const-currentContext-3d6382d6 // @block:const-currentContext-812e0993
    const requestBody = { // @block:const-requestBody-9585a684 // @block:const-requestBody-22172796
      messages: [
        {
          role: 'system',
          content: currentContext || context,
        },
        ...chatHistory,
      ],
      model: 'llama3-8b-8192',
    };
    logger.debug('Request body:', JSON.stringify(requestBody));

    const response = await fetch('/chat', { // @block:const-response-c46d766c // @block:const-response-0f52b00e
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    logger.debug('Groq response status:', response.status);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const reader = response.body.getReader(); // @block:const-reader-750dcd93 // @block:const-reader-37399226
    let assistantReply = ''; // @block:let-assistantReply-a2415eaf // @block:let-assistantReply-a8a61203
    let done = false; // @block:let-done-f91fd4ed // @block:let-done-53722984

    const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-36c28571 // @block:const-msgHistory-12daa645
    const assistantSpan = document.createElement('span'); // @block:const-assistantSpan-3c09ded1 // @block:const-assistantSpan-e39500d6
    assistantSpan.innerHTML = '<u>Assistant:</u> ';
    msgHistory.appendChild(assistantSpan);
    msgHistory.appendChild(document.createElement('br'));
    while (!done) {
      const { value, done: readerDone } = await reader.read(); // @block:const-{-d300de2d // @block:const-{-9bb2546d
      done = readerDone;
      if (value) {
        const chunk = new TextDecoder().decode(value); // @block:const-chunk-50b3b7fd // @block:const-chunk-bfe5cf53
        logger.debug('Received chunk:', chunk);
        const lines = chunk.split('\n'); // @block:const-lines-af157ddb // @block:const-lines-3a68758b
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.substring(5).trim(); // @block:const-data-e595b800 // @block:const-data-f02529c5
            if (data === '[DONE]') {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(data); // @block:const-parsed-c1b7ff1b // @block:const-parsed-2f1a527c
              const content = parsed.choices[0]?.delta?.content || ''; // @block:const-content-f9cdea61 // @block:const-content-0959db80
              assistantReply += content;
              assistantSpan.innerHTML += content;
              logger.debug('Parsed content:', content);
            } catch (error) {
              logger.error('Error parsing JSON:', error);
            }
          }
        }

        msgHistory.scrollTop = msgHistory.scrollHeight;
      }
    }

    const endTime = Date.now(); // @block:const-endTime-94d01fd0 // @block:const-endTime-55d3ad40
    const processingTime = endTime - startTime; // @block:const-processingTime-d930ea65 // @block:const-processingTime-227c4b9e
    logger.debug(`Groq processing completed in ${processingTime}ms`);

    chatHistory.push({
      role: 'assistant',
      content: assistantReply,
    });

    logger.debug('Assistant reply:', assistantReply);

    // Start streaming the entire response
    await startStreaming(assistantReply);
  } catch (error) {
    logger.error('Error in sendChatToGroq:', error);
    const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-5657203b // @block:const-msgHistory-9b993b75
    msgHistory.innerHTML += `<span><u>Assistant:</u> I'm sorry, I encountered an error. Could you please try again?</span><br>`;
    msgHistory.scrollTop = msgHistory.scrollHeight;
  }
}
function toggleAutoSpeak() {
  autoSpeakMode = !autoSpeakMode;
  const toggleButton = document.getElementById('auto-speak-toggle'); // @block:const-toggleButton-92c176b6 // @block:const-toggleButton-609b1651
  const startButton = document.getElementById('start-button'); // @block:const-startButton-683ec05f // @block:const-startButton-b9d1fcda
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

    const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-17a19b30 // @block:const-msgHistory-43f8182d
    msgHistory.innerHTML = '';
    chatHistory = [];

    // Reset video elements
    const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-71a68323 // @block:const-streamVideoElement-cb1ceed4
    const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-cebc0f99 // @block:const-idleVideoElement-928b83e8
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

const connectButton = document.getElementById('connect-button'); // @block:const-connectButton-88b71897 // @block:const-connectButton-794f319d
connectButton.onclick = initializeConnection;

const destroyButton = document.getElementById('destroy-button'); // @block:const-destroyButton-ec3add39 // @block:const-destroyButton-c9d90903
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

const startButton = document.getElementById('start-button'); // @block:const-startButton-ee9f772b // @block:const-startButton-f6866353

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

const saveAvatarButton = document.getElementById('save-avatar-button'); // @block:const-saveAvatarButton-8ce62ad8 // @block:const-saveAvatarButton-b8652179
saveAvatarButton.onclick = saveAvatar;

const avatarImageInput = document.getElementById('avatar-image'); // @block:const-avatarImageInput-cf1423cc // @block:const-avatarImageInput-39a97c52
avatarImageInput.onchange = (event) => {
  const file = event.target.files[0]; // @block:const-file-f1762471 // @block:const-file-47b821b5
  if (file) {
    const reader = new FileReader(); // @block:const-reader-80e89c75 // @block:const-reader-da03827d
    reader.onload = (e) => {
      document.getElementById('avatar-image-preview').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Export functions and variables that need to be accessed from other modules
export { // @block:export-None-ea3b3d30 // @block:export-None-c0bbc45d
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

'use strict';
import DID_API from './api.js'; // @block:import-None-784121a1
import logger from './logger.js'; // @block:import-None-7765c8ed
const { createClient, LiveTranscriptionEvents } = deepgram; // @block:const-{-b15a946c

const deepgramClient = createClient(DID_API.deepgramKey); // @block:const-deepgramClient-7728396d

const RTCPeerConnection = ( // @block:const-RTCPeerConnection-63825626
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
).bind(window);

let peerConnection; // @block:let-None-c64be92b
let pcDataChannel; // @block:let-None-bb341986
let streamId; // @block:let-None-d985439e
let sessionId; // @block:let-None-a2300cf6
let sessionClientAnswer; // @block:let-None-aeb3cda6
let statsIntervalId; // @block:let-None-b4778551
let videoIsPlaying; // @block:let-None-97c533a7
let lastBytesReceived; // @block:let-None-aaeeebd5
let chatHistory = []; // @block:let-chatHistory-5e17b002
let inactivityTimeout; // @block:let-None-f338a81e
let keepAliveInterval; // @block:let-None-d3aa0c0f
let socket; // @block:let-None-c115bc55
let isInitializing = false; // @block:let-isInitializing-6159f03c
let audioContext; // @block:let-None-d4dcaa39
let streamVideoElement; // @block:let-None-d4975d8a
let idleVideoElement; // @block:let-None-8563a87b
let deepgramConnection; // @block:let-None-d1a48f1f
let isRecording = false; // @block:let-isRecording-95fc4929
let audioWorkletNode; // @block:let-None-bc7e1a0d
let currentUtterance = ''; // @block:let-currentUtterance-6543f70d
let interimMessageAdded = false; // @block:let-interimMessageAdded-06b7599e
let autoSpeakMode = true; // @block:let-autoSpeakMode-9207b632
let transitionCanvas; // @block:let-None-01d85205
let transitionCtx; // @block:let-None-c25818ad
let isDebugMode = false; // @block:let-isDebugMode-83d0ae6a
let isTransitioning = false; // @block:let-isTransitioning-0a419b64
let lastVideoStatus = null; // @block:let-lastVideoStatus-f3e54090
let isCurrentlyStreaming = false; // @block:let-isCurrentlyStreaming-004ec676
let reconnectAttempts = 10; // @block:let-reconnectAttempts-1cfa5190
let persistentStreamId = null; // @block:let-persistentStreamId-15a6e516
let persistentSessionId = null; // @block:let-persistentSessionId-f49fa07f
let isPersistentStreamActive = false; // @block:let-isPersistentStreamActive-34c46ab4
const API_RATE_LIMIT = 40; // Maximum number of calls per minute // @block:const-API_RATE_LIMIT-5f66d9aa
const API_CALL_INTERVAL = 30000 / API_RATE_LIMIT; // Minimum time between API calls in milliseconds // @block:const-API_CALL_INTERVAL-336e76b3
let lastApiCallTime = 0; // @block:let-lastApiCallTime-027440a4
const maxRetryCount = 10; // @block:const-maxRetryCount-3de3701c
const maxDelaySec = 100; // @block:const-maxDelaySec-b9537ee7
const RECONNECTION_INTERVAL = 100000; // 25 seconds for testing, adjust as needed // @block:const-RECONNECTION_INTERVAL-a25199ce
let isAvatarSpeaking = false; // @block:let-isAvatarSpeaking-42a25fdd
const MAX_RECONNECT_ATTEMPTS = 10; // @block:const-MAX_RECONNECT_ATTEMPTS-0bedfcaf
const INITIAL_RECONNECT_DELAY = 2000; // 1 second // @block:const-INITIAL_RECONNECT_DELAY-ef8fd7ac
const MAX_RECONNECT_DELAY = 90000; // 30 seconds // @block:const-MAX_RECONNECT_DELAY-b0e4b353
let autoSpeakInProgress = false; // @block:let-autoSpeakInProgress-1e58cde1

const ConnectionState = { // @block:const-ConnectionState-876318a9
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
};

let lastConnectionTime = Date.now(); // @block:let-lastConnectionTime-467b582d

let connectionState = ConnectionState.DISCONNECTED; // @block:let-connectionState-623fb8b0

export function setLogLevel(level) { // @block:export-None-8bcb27cd
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}

let avatars = {}; // @block:let-avatars-4f313548
let currentAvatar = ''; // @block:let-currentAvatar-80cce611

const avatarSelect = document.getElementById('avatar-select'); // @block:const-avatarSelect-36402554
avatarSelect.addEventListener('change', handleAvatarChange);

let context = ` // @block:let-context-40192977

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
// @block:if--447c92fa
  if (!streamId || !sessionId) {
    throw new Error('Stream ID or Session ID is missing. Cannot prepare for streaming.');
  }
// @block:if--447c92fa-end

  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-a2333ccf
  const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-ca30b6bc

// @block:if--56fa3a2b
  if (!streamVideoElement || !idleVideoElement) {
    throw new Error('Video elements not found');
  }
// @block:if--56fa3a2b-end

  // Reset video elements
  streamVideoElement.srcObject = null;
  streamVideoElement.src = '';
  streamVideoElement.style.display = 'none';

  idleVideoElement.style.display = 'block';
  idleVideoElement.play().catch((e) => logger.error('Error playing idle video:', e));

  logger.debug('Prepared for streaming');
}

// @block:function-initializeTransitionCanvas-861e8500
function initializeTransitionCanvas() {
  const videoWrapper = document.querySelector('#video-wrapper'); // @block:const-videoWrapper-d099eb8c
  const rect = videoWrapper.getBoundingClientRect(); // @block:const-rect-e1a68add
  const size = Math.min(rect.width, rect.height, 550); // @block:const-size-b9001bcc

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
    const videoWrapper = document.querySelector('#video-wrapper'); // @block:const-videoWrapper-8221c234
    const rect = videoWrapper.getBoundingClientRect(); // @block:const-rect-b7d0d6b8
    const size = Math.min(rect.width, rect.height, 550); // @block:const-size-015ed465

    transitionCanvas.width = size;
    transitionCanvas.height = size;
  });
}
// @block:function-initializeTransitionCanvas-861e8500-end

// @block:function-smoothTransition-d85503c4
function smoothTransition(toStreaming, duration = 250) {
  const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-ee1a2d7d
  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-58ec4dc8

// @block:if--5b8d8e33
  if (!idleVideoElement || !streamVideoElement) {
    logger.warn('Video elements not found for transition');
    return;
  }
// @block:if--5b8d8e33-end

// @block:if--46c94215
  if (isTransitioning) {
    logger.debug('Transition already in progress, skipping');
    return;
  }
// @block:if--46c94215-end

  // Don't transition if we're already in the desired state
// @block:if--2f9892ea
  if ((toStreaming && isCurrentlyStreaming) || (!toStreaming && !isCurrentlyStreaming)) {
    logger.debug('Already in desired state, skipping transition');
    return;
  }
// @block:if--2f9892ea-end

  isTransitioning = true;
  logger.debug(`Starting smooth transition to ${toStreaming ? 'streaming' : 'idle'} state`);

  let startTime = null; // @block:let-startTime-3c0fdc5d

// @block:function-animate-d9d7d5ea
  function animate(currentTime) {
// @block:if--fd816a8e
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime; // @block:const-elapsed-f409df31
    const progress = Math.min(elapsed / duration, 1); // @block:const-progress-2eccff3a

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

// @block:if--57b95d7b
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Ensure final state is set correctly
// @block:if--ab903cb6
      if (toStreaming) {
        streamVideoElement.style.display = 'block';
        idleVideoElement.style.display = 'none';
      } else {
        streamVideoElement.style.display = 'none';
        idleVideoElement.style.display = 'block';
      }
// @block:if--ab903cb6-end
      isTransitioning = false;
      isCurrentlyStreaming = toStreaming;
      transitionCanvas.style.display = 'none';
      logger.debug('Smooth transition completed');
    }
// @block:if--57b95d7b-end
  }
// @block:if--fd816a8e-end

  // Show the transition canvas
  transitionCanvas.style.display = 'block';

  // Start the animation
  requestAnimationFrame(animate);
}
// @block:function-animate-d9d7d5ea-end

// @block:function-getVideoElements-57fbb5f0
function getVideoElements() {
  const idle = document.getElementById('idle-video-element'); // @block:const-idle-aca156bb
  const stream = document.getElementById('stream-video-element'); // @block:const-stream-7cd64ad3

// @block:if--12ec98b3
  if (!idle || !stream) {
    logger.warn('Video elements not found in the DOM');
  }
// @block:if--12ec98b3-end

  return { idle, stream };
}
// @block:function-getVideoElements-57fbb5f0-end

// @block:function-getStatusLabels-46e189d8
function getStatusLabels() {
  return {
    peer: document.getElementById('peer-status-label'),
    ice: document.getElementById('ice-status-label'),
    iceGathering: document.getElementById('ice-gathering-status-label'),
    signaling: document.getElementById('signaling-status-label'),
    streaming: document.getElementById('streaming-status-label'),
  };
}
// @block:function-getStatusLabels-46e189d8-end

// @block:function-initializeWebSocket-8813194a
function initializeWebSocket() {
  socket = new WebSocket(`wss://${window.location.host}`);

  socket.onopen = () => {
    logger.info('WebSocket connection established');
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data); // @block:const-data-4d859676
    logger.debug('Received WebSocket message:', data);

// @block:switch--973e9d6a
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
// @block:switch--973e9d6a-end
  };

  socket.onerror = (error) => {
    logger.error('WebSocket error:', error);
  };

  socket.onclose = () => {
    logger.info('WebSocket connection closed');
    setTimeout(initializeWebSocket, 10000);
  };
}
// @block:function-initializeWebSocket-8813194a-end

// @block:function-updateTranscript-06134912
function updateTranscript(text, isFinal) {
  const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-6e3125c3
  let interimSpan = msgHistory.querySelector('span[data-interim]'); // @block:let-interimSpan-15c5a7c0

// @block:if--5dc9f8e1
  if (isFinal) {
// @block:if--29302d7b
    if (interimSpan) {
      interimSpan.remove();
    }
// @block:if--29302d7b-end
    msgHistory.innerHTML += `<span><u>User:</u> ${text}</span><br>`;
    logger.debug('Final transcript added to chat history:', text);
    interimMessageAdded = false;
  } else {
// @block:if--98673c23
    if (text.trim()) {
// @block:if--1901e04c
      if (!interimMessageAdded) {
        msgHistory.innerHTML += `<span data-interim style='opacity:0.5'><u>User (interim):</u> ${text}</span><br>`;
        interimMessageAdded = true;
      } else if (interimSpan) {
        interimSpan.innerHTML = `<u>User (interim):</u> ${text}`;
      }
// @block:if--1901e04c-end
    }
// @block:if--98673c23-end
  }
// @block:if--5dc9f8e1-end
  msgHistory.scrollTop = msgHistory.scrollHeight;
}
// @block:function-updateTranscript-06134912-end

// @block:function-handleTextInput-6a285bc4
function handleTextInput(text) {
// @block:if--0e68b665
  if (text.trim() === '') return;

  const textInput = document.getElementById('text-input'); // @block:const-textInput-8f64062f
  textInput.value = '';

  updateTranscript(text, true);

  chatHistory.push({
    role: 'user',
    content: text,
  });

  sendChatToGroq();
}
// @block:if--0e68b665-end

// @block:function-updateAssistantReply-1b3d946f
function updateAssistantReply(text) {
// @block:document.getElementById('msgHistory').innerHTML-+=-4175f7c0
  document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${text}</span><br>`;
}
// @block:document.getElementById('msgHistory').innerHTML-+=-4175f7c0-end

async function initializePersistentStream() {
  logger.info('Initializing persistent stream...');
  connectionState = ConnectionState.CONNECTING;

// @block:try-{-c94c5a9d
  try {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, { // @block:const-sessionResponse-510b0176
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

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json(); // @block:const-{-8f091edf

    persistentStreamId = newStreamId;
    persistentSessionId = newSessionId;

    logger.info('Persistent stream created:', { persistentStreamId, persistentSessionId });

// @block:try-{-20da5a71
    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
      logger.error('Error during streaming setup:', e);
      stopAllStreams();
      closePC();
      throw e;
    }
// @block:try-{-20da5a71-end

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}/sdp`, { // @block:const-sdpResponse-c88ff81a
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

// @block:if--ad00c9f7
    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }
// @block:if--ad00c9f7-end
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
// @block:try-{-c94c5a9d-end
}
// @block:function-updateAssistantReply-1b3d946f-end

// @block:function-shouldReconnect-0dd8041b
function shouldReconnect() {
  const timeSinceLastConnection = Date.now() - lastConnectionTime; // @block:const-timeSinceLastConnection-24d2c84d
  return timeSinceLastConnection > RECONNECTION_INTERVAL * 0.9;
}
// @block:function-shouldReconnect-0dd8041b-end

// @block:function-scheduleReconnect-8af814d3
function scheduleReconnect() {
// @block:if--fa321bcf
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    logger.error('Max reconnection attempts reached. Please refresh the page.');
    showErrorMessage('Failed to reconnect after multiple attempts. Please refresh the page.');
    return;
  }
// @block:if--fa321bcf-end

  const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY); // @block:const-delay-b06b072f
  logger.debug(`Scheduling reconnection attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
  setTimeout(backgroundReconnect, delay);
  reconnectAttempts++;
}
// @block:function-scheduleReconnect-8af814d3-end

// @block:function-startKeepAlive-32187261
function startKeepAlive() {
// @block:if--93096a02
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
// @block:if--93096a02-end

  keepAliveInterval = setInterval(() => {
// @block:if--04e5c479
    if (isPersistentStreamActive && peerConnection && peerConnection.connectionState === 'connected' && pcDataChannel) {
// @block:try-{-6248a1f0
      try {
        const keepAliveMessage = JSON.stringify({ type: 'KeepAlive' }); // @block:const-keepAliveMessage-c7707a29
// @block:if--a12ed3e2
        if (pcDataChannel.readyState === 'open') {
          pcDataChannel.send(keepAliveMessage);
          logger.debug('Keepalive message sent successfully');
        } else {
          logger.warn('Data channel is not open. Current state:', pcDataChannel.readyState);
        }
// @block:if--a12ed3e2-end
      } catch (error) {
        logger.warn('Error sending keepalive message:', error);
      }
// @block:try-{-6248a1f0-end
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
// @block:if--04e5c479-end
  }, 30000); // Send keepalive every 30 seconds
}
// @block:function-startKeepAlive-32187261-end

async function destroyPersistentStream() {
// @block:if--0ba31551
  if (persistentStreamId) {
// @block:try-{-dd657006
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
// @block:if--bccd9779
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
// @block:if--bccd9779-end
      connectionState = ConnectionState.DISCONNECTED;
    }
// @block:try-{-dd657006-end
  }
// @block:if--0ba31551-end
}
// @block:function-handleTextInput-6a285bc4-end

async function reinitializePersistentStream() {
  logger.info('Reinitializing persistent stream...');
  await destroyPersistentStream();
  await initializePersistentStream();
}
// @block:function-smoothTransition-d85503c4-end

async function createNewPersistentStream() {
  logger.debug('Creating new persistent stream...');

// @block:try-{-219313cb
  try {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, { // @block:const-sessionResponse-5602d9e2
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

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json(); // @block:const-{-1f2d4105

    logger.debug('New stream created:', { newStreamId, newSessionId });

    const newSessionClientAnswer = await createPeerConnection(offer, iceServers); // @block:const-newSessionClientAnswer-396fc7cd

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${newStreamId}/sdp`, { // @block:const-sdpResponse-99edf1e1
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

// @block:if--19b05b58
    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }
// @block:if--19b05b58-end

    return { streamId: newStreamId, sessionId: newSessionId };
  } catch (error) {
    logger.error('Error creating new persistent stream:', error);
    return null;
  }
// @block:try-{-219313cb-end
}

async function backgroundReconnect() {
// @block:if--60d32844
  if (connectionState === ConnectionState.RECONNECTING) {
    logger.debug('Background reconnection already in progress. Skipping.');
    return;
  }
// @block:if--60d32844-end

  connectionState = ConnectionState.RECONNECTING;
  logger.debug('Starting background reconnection process...');

// @block:try-{-a88d3763
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
// @block:try-{-a88d3763-end
}

// @block:function-waitForIdleState-0b8465db
function waitForIdleState() {
  return new Promise((resolve) => {
    const checkIdleState = () => { // @block:const-checkIdleState-b34bb293
// @block:if--d23790c4
      if (!isAvatarSpeaking) {
        resolve();
      } else {
        setTimeout(checkIdleState, 500); // Check every 500ms
      }
// @block:if--d23790c4-end
    };
    checkIdleState();
  });
}
// @block:function-waitForIdleState-0b8465db-end

async function switchToNewStream(newStreamData) {
  logger.debug('Switching to new stream...');

// @block:try-{-09eb08da
  try {
    connectionState = ConnectionState.RECONNECTING;

    // Quickly switch the video source to the new stream
// @block:if--4772dc7b
    if (streamVideoElement) {
      // Instead of directly setting src, we need to update the WebRTC connection
      await updateWebRTCConnection(newStreamData);
    }
// @block:if--4772dc7b-end

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
// @block:try-{-09eb08da-end
}

async function updateWebRTCConnection(newStreamData) {
  logger.debug('Updating WebRTC connection...');

// @block:try-{-3a5ae917
  try {
    const offer = await fetchStreamOffer(newStreamData.streamId); // @block:const-offer-830922b9
    const iceServers = await fetchIceServers(); // @block:const-iceServers-fbc2095d

    const newSessionClientAnswer = await createPeerConnection(offer, iceServers); // @block:const-newSessionClientAnswer-57ab3037

    await sendSDPAnswer(newStreamData.streamId, newStreamData.sessionId, newSessionClientAnswer);

    logger.debug('WebRTC connection updated successfully');
  } catch (error) {
    logger.error('Error updating WebRTC connection:', error);
    throw error;
  }
// @block:try-{-3a5ae917-end
}

async function fetchStreamOffer(streamId) {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/offer`, { // @block:const-response-a03b90a4
    method: 'GET',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
    },
  });
  const data = await response.json(); // @block:const-data-1b99190d
  return data.offer;
}

async function fetchIceServers() {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/ice_servers`, { // @block:const-response-621ee4a6
    method: 'GET',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
    },
  });
  const data = await response.json(); // @block:const-data-2cb61b37
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

  const { idle, stream } = getVideoElements(); // @block:const-{-251cca57
  idleVideoElement = idle;
  streamVideoElement = stream;

// @block:if--6defde69
  if (idleVideoElement) idleVideoElement.setAttribute('playsinline', '');
// @block:if--99ff5c33
  if (streamVideoElement) streamVideoElement.setAttribute('playsinline', '');

  initializeTransitionCanvas();

  await loadAvatars();
  populateAvatarSelect();

  const contextInput = document.getElementById('context-input'); // @block:const-contextInput-dfdcf41b
  contextInput.value = context.trim();
  contextInput.addEventListener('input', () => {
// @block:if--9995321d
    if (!contextInput.value.includes('Original Context:')) {
      context = contextInput.value.trim();
    }
// @block:if--9995321d-end
  });

  const sendTextButton = document.getElementById('send-text-button'); // @block:const-sendTextButton-f6695b5b
  const textInput = document.getElementById('text-input'); // @block:const-textInput-fa4e1310
  const replaceContextButton = document.getElementById('replace-context-button'); // @block:const-replaceContextButton-df040c1d
  const autoSpeakToggle = document.getElementById('auto-speak-toggle'); // @block:const-autoSpeakToggle-5f4b6e4a
  const editAvatarButton = document.getElementById('edit-avatar-button'); // @block:const-editAvatarButton-8b004bc9

  sendTextButton.addEventListener('click', () => handleTextInput(textInput.value));
  textInput.addEventListener('keypress', (event) => {
// @block:if--e9ab06d3
    if (event.key === 'Enter') handleTextInput(textInput.value);
  });
  replaceContextButton.addEventListener('click', () => updateContext('replace'));
  autoSpeakToggle.addEventListener('click', toggleAutoSpeak);
  editAvatarButton.addEventListener('click', () => openAvatarModal(currentAvatar));

  initializeWebSocket();
  playIdleVideo();

  showLoadingSymbol();
// @block:try-{-1cd505ef
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
// @block:try-{-1cd505ef-end

  // Set up reconnection mechanism
  window.addEventListener('online', async () => {
// @block:if--287b091f
    if (connectionState === ConnectionState.DISCONNECTED) {
      logger.info('Network connection restored. Attempting to reconnect...');
// @block:try-{-af6a3f54
      try {
        await backgroundReconnect();
      } catch (error) {
        logger.error('Failed to reconnect after network restoration:', error);
      }
// @block:try-{-af6a3f54-end
    }
// @block:if--287b091f-end
  });

  // Handle visibility change
// @block:document.addEventListener('visibilitychange',--ef71f5cb
  document.addEventListener('visibilitychange', () => {
// @block:if--0f91642c
    if (!document.hidden && connectionState === ConnectionState.DISCONNECTED) {
      logger.info('Page became visible. Checking connection...');
// @block:if--ed80fd39
      if (navigator.onLine) {
        backgroundReconnect();
      }
// @block:if--ed80fd39-end
    }
// @block:if--0f91642c-end
  });

  logger.info('Initialization complete');
}
// @block:document.addEventListener('visibilitychange',--ef71f5cb-end

async function handleAvatarChange() {
  currentAvatar = avatarSelect.value;
// @block:if--c18f9f1b
  if (currentAvatar === 'create-new') {
    openAvatarModal();
    return;
  }
// @block:if--c18f9f1b-end

  const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-06622cf7
// @block:if--6da0178f
  if (idleVideoElement) {
    idleVideoElement.src = avatars[currentAvatar].silentVideoUrl;
// @block:try-{-bc396331
    try {
      await idleVideoElement.load();
      logger.debug(`Idle video loaded for ${currentAvatar}`);
    } catch (error) {
      logger.error(`Error loading idle video for ${currentAvatar}:`, error);
    }
// @block:try-{-bc396331-end
  }
// @block:if--6da0178f-end

  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-97f96986
// @block:if--ec7f1e66
  if (streamVideoElement) {
    streamVideoElement.srcObject = null;
  }
// @block:if--ec7f1e66-end

  await stopRecording();
  currentUtterance = '';
  interimMessageAdded = false;
  const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-da6fa074
  msgHistory.innerHTML = '';
  chatHistory = [];

  await destroyPersistentStream();
  await initializePersistentStream();
}
// @block:if--e9ab06d3-end

async function loadAvatars() {
// @block:try-{-3a91260b
  try {
    const response = await fetch('/avatars'); // @block:const-response-7f67e401
// @block:if--38aea555
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
// @block:if--38aea555-end
    avatars = await response.json();
    logger.debug('Avatars loaded:', avatars);
  } catch (error) {
    logger.error('Error loading avatars:', error);
    showErrorMessage('Failed to load avatars. Please try again.');
  }
// @block:try-{-3a91260b-end
}
// @block:if--99ff5c33-end

// @block:function-populateAvatarSelect-50e63f5a
function populateAvatarSelect() {
  const avatarSelect = document.getElementById('avatar-select'); // @block:const-avatarSelect-bb64b39b
  avatarSelect.innerHTML = '';

  const createNewOption = document.createElement('option'); // @block:const-createNewOption-b9adb931
  createNewOption.value = 'create-new';
  createNewOption.textContent = 'Create New Avatar';
  avatarSelect.appendChild(createNewOption);

// @block:for--90ee4d5c
  for (const [key, value] of Object.entries(avatars)) {
    const option = document.createElement('option'); // @block:const-option-289c4dd9
    option.value = key;
    option.textContent = value.name;
    avatarSelect.appendChild(option);
  }
// @block:for--90ee4d5c-end

// @block:if--c1ada3a6
  if (Object.keys(avatars).length > 0) {
    currentAvatar = Object.keys(avatars)[0];
    avatarSelect.value = currentAvatar;
  }
// @block:if--c1ada3a6-end
}
// @block:function-populateAvatarSelect-50e63f5a-end

// @block:function-openAvatarModal-7428de91
function openAvatarModal(avatarName = null) {
  const modal = document.getElementById('avatar-modal'); // @block:const-modal-a8053620
  const nameInput = document.getElementById('avatar-name'); // @block:const-nameInput-0d8a0bef
  const voiceInput = document.getElementById('avatar-voice'); // @block:const-voiceInput-600ad720
  const imagePreview = document.getElementById('avatar-image-preview'); // @block:const-imagePreview-150a0e4d
  const saveButton = document.getElementById('save-avatar-button'); // @block:const-saveButton-e4bb6ee0

// @block:if--3bccbcc5
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
// @block:if--3bccbcc5-end

  modal.style.display = 'block';
}
// @block:function-openAvatarModal-7428de91-end

// @block:function-closeAvatarModal-00d5776c
function closeAvatarModal() {
  const modal = document.getElementById('avatar-modal'); // @block:const-modal-bd663ffe
  modal.style.display = 'none';
}
// @block:function-closeAvatarModal-00d5776c-end

async function saveAvatar() {
  const name = document.getElementById('avatar-name').value; // @block:const-name-cda44c2c
  const voiceId = document.getElementById('avatar-voice').value || 'en-US-GuyNeural'; // @block:const-voiceId-479f78f1
  const imageFile = document.getElementById('avatar-image').files[0]; // @block:const-imageFile-7e99a357

// @block:if--59e7e023
  if (!name) {
    showErrorMessage('Please fill in the avatar name.');
    return;
  }
// @block:if--59e7e023-end

  const formData = new FormData(); // @block:const-formData-d2efa2d4
// @block:formData.append('name',-name);-a734dbed
  formData.append('name', name);
// @block:formData.append('voiceId',-voiceId);-1fad710f
  formData.append('voiceId', voiceId);
// @block:if--be01982b
  if (imageFile) {
// @block:formData.append('image',-imageFile);-e57e0c38
    formData.append('image', imageFile);
  }
// @block:formData.append('image',-imageFile);-e57e0c38-end

  showToast('Saving avatar...', 0);

// @block:try-{-930ebc0f
  try {
    const response = await fetch('/avatar', { // @block:const-response-ad51df84
      method: 'POST',
      body: formData,
    });

    const reader = response.body.getReader(); // @block:const-reader-7e47c846
    const decoder = new TextDecoder(); // @block:const-decoder-5db1c8e5

// @block:while--ba98a784
    while (true) {
      const { done, value } = await reader.read(); // @block:const-{-37058e5a
// @block:if--6cf68e74
      if (done) break;

      const chunk = decoder.decode(value); // @block:const-chunk-f9fda6ee
      const events = chunk.split('\n\n'); // @block:const-events-263ae6fa

// @block:for--988821e6
      for (const event of events) {
// @block:if--0ce09415
        if (event.startsWith('data: ')) {
          const data = JSON.parse(event.slice(6)); // @block:const-data-9c44827e
// @block:if--3f73efd4
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
// @block:if--3f73efd4-end
        }
// @block:if--0ce09415-end
      }
// @block:for--988821e6-end
    }
// @block:if--6cf68e74-end
  } catch (error) {
    console.error('Error saving avatar:', error);
    showErrorMessage('Failed to save avatar. Please try again.');
  }
// @block:while--ba98a784-end
}
// @block:try-{-930ebc0f-end

// @block:function-updateContext-4c946b18
function updateContext(action) {
  const contextInput = document.getElementById('context-input'); // @block:const-contextInput-73c0b313
  const newContext = contextInput.value.trim(); // @block:const-newContext-fe743035

// @block:if--58c4c53f
  if (newContext) {
    const originalContext = context; // @block:const-originalContext-a33183e8
// @block:if--1d156d06
    if (action === 'append') {
      context += '\n' + newContext;
    } else if (action === 'replace') {
      context = newContext;
    }
// @block:if--1d156d06-end
    logger.debug('Context updated:', context);
    showToast('Context saved successfully');

    displayBothContexts(originalContext, context);
  } else {
    showToast('Please enter some text before updating the context');
  }
// @block:if--58c4c53f-end
}
// @block:function-updateContext-4c946b18-end

// @block:function-displayBothContexts-e8688747
function displayBothContexts(original, updated) {
  const contextInput = document.getElementById('context-input'); // @block:const-contextInput-c90bd123
  contextInput.value = `Original Context:\n${original}\n\nNew Context:\n${updated}`;

  setTimeout(() => {
    contextInput.value = updated;
  }, 3000);
}
// @block:function-displayBothContexts-e8688747-end

// @block:function-showToast-209e51d0
function showToast(message) {
  const toast = document.createElement('div'); // @block:const-toast-1a3f2763
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

// @block:document.body.appendChild(toast);-None-6f3767e8
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease-out';
    setTimeout(() => {
// @block:document.body.removeChild(toast);-None-4db00944
      document.body.removeChild(toast);
    }, 500);
  }, 3000);
}
// @block:document.body.removeChild(toast);-None-4db00944-end

// @block:if--70491387
if (document.readyState === 'loading') {
// @block:document.addEventListener('DOMContentLoaded',-initialize);-f9a4f386
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
// @block:document.addEventListener('DOMContentLoaded',-initialize);-f9a4f386-end

// @block:function-showLoadingSymbol-20217cb6
function showLoadingSymbol() {
  const loadingSymbol = document.createElement('div'); // @block:const-loadingSymbol-17934448
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
// @block:document.body.appendChild(loadingSymbol);-None-95cbff69
  document.body.appendChild(loadingSymbol);
}
// @block:document.body.appendChild(loadingSymbol);-None-95cbff69-end

// @block:function-hideLoadingSymbol-490b9a29
function hideLoadingSymbol() {
  const loadingSymbol = document.getElementById('loading-symbol'); // @block:const-loadingSymbol-7c5c6bbe
// @block:if--8af26d69
  if (loadingSymbol) {
// @block:document.body.removeChild(loadingSymbol);-None-96d68e87
    document.body.removeChild(loadingSymbol);
  }
// @block:document.body.removeChild(loadingSymbol);-None-96d68e87-end
}
// @block:if--8af26d69-end

// @block:function-showErrorMessage-ccff91f3
function showErrorMessage(message) {
  const errorMessage = document.createElement('div'); // @block:const-errorMessage-b8fa8ee4
  errorMessage.innerHTML = message;
  errorMessage.style.color = 'red';
  errorMessage.style.marginBottom = '10px';
// @block:document.body.appendChild(errorMessage);-None-237032c0
  document.body.appendChild(errorMessage);

  const destroyButton = document.getElementById('destroy-button'); // @block:const-destroyButton-f2a66788
  const connectButton = document.getElementById('connect-button'); // @block:const-connectButton-d152befa
  connectButton.onclick = initializePersistentStream;

// @block:if--2eeee5fe
  if (destroyButton) destroyButton.style.display = 'inline-block';
  destroyButton.onclick = destroyPersistentStream;

// @block:if--e36565c3
  if (connectButton) connectButton.style.display = 'inline-block';
}
// @block:if--e36565c3-end

async function createPeerConnection(offer, iceServers) {
// @block:if--090236d0
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
// @block:if--090236d0-end

  await peerConnection.setRemoteDescription(offer);
  logger.debug('Set remote SDP');

  const sessionClientAnswer = await peerConnection.createAnswer(); // @block:const-sessionClientAnswer-b9e26f54
  logger.debug('Created local SDP');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  logger.debug('Set local SDP');

  return sessionClientAnswer;
}
// @block:if--2eeee5fe-end

// @block:function-onIceGatheringStateChange-80c1a1f4
function onIceGatheringStateChange() {
  const { iceGathering: iceGatheringStatusLabel } = getStatusLabels(); // @block:const-{-e437d742
// @block:if--a6ade923
  if (iceGatheringStatusLabel) {
    iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
    iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
  }
// @block:if--a6ade923-end
  logger.debug('ICE gathering state changed:', peerConnection.iceGatheringState);
}
// @block:function-onIceGatheringStateChange-80c1a1f4-end

// @block:function-onIceCandidate-31e0b160
function onIceCandidate(event) {
// @block:if--e2c91ac9
  if (event.candidate && persistentStreamId && persistentSessionId) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate; // @block:const-{-034f2a55
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
// @block:if--e2c91ac9-end
}
// @block:function-onIceCandidate-31e0b160-end

// @block:function-onIceConnectionStateChange-c821f6d4
function onIceConnectionStateChange() {
  const { ice: iceStatusLabel } = getStatusLabels(); // @block:const-{-1159bb7d
// @block:if--5516f231
  if (iceStatusLabel) {
    iceStatusLabel.innerText = peerConnection.iceConnectionState;
    iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
  }
// @block:if--5516f231-end
  logger.debug('ICE connection state changed:', peerConnection.iceConnectionState);

// @block:if--f9a1d2bc
  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
    showErrorMessage('Connection lost. Please try again.');
  }
// @block:if--f9a1d2bc-end
}
// @block:function-onIceConnectionStateChange-c821f6d4-end

async function attemptReconnect() {
  logger.debug('Attempting to reconnect...');
// @block:try-{-ea71fc0e
  try {
    await reinitializeConnection();
    logger.debug('Reconnection successful');
    reconnectAttempts = 0;
  } catch (error) {
    logger.error('Reconnection attempt failed:', error);
    scheduleReconnect();
  }
// @block:try-{-ea71fc0e-end
}
// @block:document.body.appendChild(errorMessage);-None-237032c0-end

// @block:function-onConnectionStateChange-490c5208
function onConnectionStateChange() {
  const { peer: peerStatusLabel } = getStatusLabels(); // @block:const-{-b4682557
// @block:if--f3780def
  if (peerStatusLabel) {
    peerStatusLabel.innerText = peerConnection.connectionState;
    peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
  }
// @block:if--f3780def-end
  logger.debug('Peer connection state changed:', peerConnection.connectionState);

// @block:if--73e52a64
  if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
    logger.warn('Peer connection failed or disconnected. Attempting to reconnect...');
    connectionState = ConnectionState.DISCONNECTED;
    backgroundReconnect();
  } else if (peerConnection.connectionState === 'connected') {
    logger.debug('Peer connection established successfully');
    connectionState = ConnectionState.CONNECTED;
    reconnectAttempts = 0;
  }
// @block:if--73e52a64-end
}
// @block:function-onConnectionStateChange-490c5208-end

// @block:function-startConnectionHealthCheck-cc456f89
function startConnectionHealthCheck() {
  setInterval(() => {
// @block:if--62035ed9
    if (peerConnection) {
// @block:if--a81497a7
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        logger.warn('Connection health check detected disconnected state. Attempting to reconnect...');
        connectionState = ConnectionState.DISCONNECTED;
        backgroundReconnect();
      } else if (peerConnection.connectionState === 'connected') {
        const timeSinceLastConnection = Date.now() - lastConnectionTime; // @block:const-timeSinceLastConnection-06ba1396
// @block:if--93f8c892
        if (timeSinceLastConnection > RECONNECTION_INTERVAL * 0.9) {
          logger.info('Approaching reconnection threshold. Initiating background reconnect.');
          backgroundReconnect();
        }
// @block:if--93f8c892-end
      }
// @block:if--a81497a7-end
    }
// @block:if--62035ed9-end
  }, 30000); // Check every 30 seconds
}
// @block:function-startConnectionHealthCheck-cc456f89-end

// @block:function-onSignalingStateChange-e128da3f
function onSignalingStateChange() {
  const { signaling: signalingStatusLabel } = getStatusLabels(); // @block:const-{-086f27d6
// @block:if--63f2d6bc
  if (signalingStatusLabel) {
    signalingStatusLabel.innerText = peerConnection.signalingState;
    signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
  }
// @block:if--63f2d6bc-end
  logger.debug('Signaling state changed:', peerConnection.signalingState);
}
// @block:function-onSignalingStateChange-e128da3f-end

// @block:function-onVideoStatusChange-b70f4d00
function onVideoStatusChange(videoIsPlaying, stream) {
  let status = videoIsPlaying ? 'streaming' : 'empty'; // @block:let-status-463453a0

// @block:if--f4b40200
  if (status === lastVideoStatus) {
    logger.debug('Video status unchanged:', status);
    return;
  }
// @block:if--f4b40200-end

  logger.debug('Video status changing from', lastVideoStatus, 'to', status);

  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-739f59f8
  const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-bad8f6f3

// @block:if--5fbc8732
  if (!streamVideoElement || !idleVideoElement) {
    logger.error('Video elements not found');
    return;
  }
// @block:if--5fbc8732-end

// @block:if--d923d62f
  if (status === 'streaming') {
    setStreamVideoElement(stream);
  } else {
    smoothTransition(false);
  }
// @block:if--d923d62f-end

  lastVideoStatus = status;

  const streamingStatusLabel = document.getElementById('streaming-status-label'); // @block:const-streamingStatusLabel-b9b37061
// @block:if--e8abb0e7
  if (streamingStatusLabel) {
    streamingStatusLabel.innerText = status;
    streamingStatusLabel.className = 'streamingState-' + status;
  }
// @block:if--e8abb0e7-end

  logger.debug('Video status changed:', status);
}
// @block:function-onVideoStatusChange-b70f4d00-end

// @block:function-setStreamVideoElement-d3b120f8
function setStreamVideoElement(stream) {
  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-fbb27919
// @block:if--57c2786a
  if (!streamVideoElement) {
    logger.error('Stream video element not found');
    return;
  }
// @block:if--57c2786a-end

  logger.debug('Setting stream video element');
// @block:if--e059dcb3
  if (stream instanceof MediaStream) {
    streamVideoElement.srcObject = stream;
  } else {
    logger.warn('Invalid stream provided to setStreamVideoElement');
    return;
  }
// @block:if--e059dcb3-end

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
// @block:function-setStreamVideoElement-d3b120f8-end

// @block:function-onStreamEvent-a9f7d66a
function onStreamEvent(message) {
// @block:if--7a7fbb27
  if (pcDataChannel.readyState === 'open') {
    let status; // @block:let-None-8cf8c9f9
    const [event, _] = message.data.split(':'); // @block:const-[event,-5169618a

// @block:switch--42e76db0
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
// @block:switch--42e76db0-end

    // Set stream ready after a short delay, adjusting for potential timing differences between data and stream channels
// @block:if--d17cdd5b
    if (status === 'ready') {
      setTimeout(() => {
        console.log('stream/ready');
        isStreamReady = true;
        const streamEventLabel = document.getElementById('stream-event-label'); // @block:const-streamEventLabel-d3490bc0
// @block:if--98e86056
        if (streamEventLabel) {
          streamEventLabel.innerText = 'ready';
          streamEventLabel.className = 'streamEvent-ready';
        }
// @block:if--98e86056-end
      }, 1000);
    } else {
      console.log(event);
      const streamEventLabel = document.getElementById('stream-event-label'); // @block:const-streamEventLabel-035f4a14
// @block:if--0538784c
      if (streamEventLabel) {
        streamEventLabel.innerText = status === 'dont-care' ? event : status;
        streamEventLabel.className = 'streamEvent-' + status;
      }
// @block:if--0538784c-end
    }
// @block:if--d17cdd5b-end
  }
// @block:if--7a7fbb27-end
}
// @block:function-onStreamEvent-a9f7d66a-end

// @block:function-onTrack-69efd5ca
function onTrack(event) {
  logger.debug('onTrack event:', event);
// @block:if--bfde7b24
  if (!event.track) {
    logger.warn('No track in onTrack event');
    return;
  }
// @block:if--bfde7b24-end

// @block:if--f8f54a4e
  if (statsIntervalId) {
    clearInterval(statsIntervalId);
  }
// @block:if--f8f54a4e-end

  statsIntervalId = setInterval(async () => {
// @block:if--26be55a4
    if (peerConnection && peerConnection.connectionState === 'connected') {
// @block:try-{-eb70f44b
      try {
        const stats = await peerConnection.getStats(event.track); // @block:const-stats-54308c96
        let videoStatsFound = false; // @block:let-videoStatsFound-33f7d18e
        stats.forEach((report) => {
// @block:if--a6221285
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            videoStatsFound = true;
            const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived; // @block:const-videoStatusChanged-6b80cc34

            // logger.debug('Video stats:', {
            //  bytesReceived: report.bytesReceived,
            //  lastBytesReceived,
            //  videoIsPlaying,
            //  videoStatusChanged
            // });

// @block:if--6c27ffd8
            if (videoStatusChanged) {
              videoIsPlaying = report.bytesReceived > lastBytesReceived;
              logger.debug('Video status changed:', videoIsPlaying);
              onVideoStatusChange(videoIsPlaying, event.streams[0]);
            }
// @block:if--6c27ffd8-end
            lastBytesReceived = report.bytesReceived;
          }
// @block:if--a6221285-end
        });
// @block:if--fd85f083
        if (!videoStatsFound) {
          logger.debug('No video stats found yet.');
        }
// @block:if--fd85f083-end
      } catch (error) {
        logger.error('Error getting stats:', error);
      }
// @block:try-{-eb70f44b-end
    } else {
      logger.debug('Peer connection not ready for stats.');
    }
// @block:if--26be55a4-end
  }, 250); // Check every 500ms

// @block:if--8b0f5ba8
  if (event.streams && event.streams.length > 0) {
    const stream = event.streams[0]; // @block:const-stream-c7fadf4c
// @block:if--8c90586b
    if (stream.getVideoTracks().length > 0) {
      logger.debug('Setting stream video element with track:', event.track.id);
      setStreamVideoElement(stream);
    } else {
      logger.warn('Stream does not contain any video tracks');
    }
// @block:if--8c90586b-end
  } else {
    logger.warn('No streams found in onTrack event');
  }
// @block:if--8b0f5ba8-end

// @block:if--2b687371
  if (isDebugMode) {
    // downloadStreamVideo(event.streams[0]);
  }
// @block:if--2b687371-end
}
// @block:function-onTrack-69efd5ca-end

// @block:function-playIdleVideo-17679850
function playIdleVideo() {
  const { idle: idleVideoElement } = getVideoElements(); // @block:const-{-4ab5d711
// @block:if--f13befe2
  if (!idleVideoElement) {
    logger.error('Idle video element not found');
    return;
  }
// @block:if--f13befe2-end

// @block:if--634dd2bf
  if (!currentAvatar || !avatars[currentAvatar]) {
    logger.warn(`No avatar selected or avatar ${currentAvatar} not found. Using default idle video.`);
    idleVideoElement.src = 'path/to/default/idle/video.mp4'; // Replace with your default video path
  } else {
    idleVideoElement.src = avatars[currentAvatar].silentVideoUrl;
  }
// @block:if--634dd2bf-end

  idleVideoElement.loop = true;

  idleVideoElement.onloadeddata = () => {
    logger.debug(`Idle video loaded successfully for ${currentAvatar || 'default'}`);
  };

  idleVideoElement.onerror = (e) => {
    logger.error(`Error loading idle video for ${currentAvatar || 'default'}:`, e);
  };

  idleVideoElement.play().catch((e) => logger.error('Error playing idle video:', e));
}
// @block:function-playIdleVideo-17679850-end

// @block:function-stopAllStreams-1136aaf5
function stopAllStreams() {
// @block:if--cebdb79a
  if (streamVideoElement && streamVideoElement.srcObject) {
    logger.debug('Stopping video streams');
    streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    streamVideoElement.srcObject = null;
  }
// @block:if--cebdb79a-end
}
// @block:function-stopAllStreams-1136aaf5-end

// @block:function-closePC-2d4cfde8
function closePC(pc = peerConnection) {
// @block:if--26e7101c
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
  const labels = getStatusLabels(); // @block:const-labels-c181da57
// @block:if--0e1c345e
  if (labels.iceGathering) labels.iceGathering.innerText = '';
// @block:if--6fce1e04
  if (labels.signaling) labels.signaling.innerText = '';
// @block:if--db3142a8
  if (labels.ice) labels.ice.innerText = '';
// @block:if--3af6eb19
  if (labels.peer) labels.peer.innerText = '';
  logger.debug('Stopped peer connection');
// @block:if--06bda939
  if (pc === peerConnection) {
    peerConnection = null;
  }
// @block:if--06bda939-end
}
// @block:if--3af6eb19-end

async function fetchWithRetries(url, options, retries = 0, delayMs = 1000) {
// @block:try-{-bfe263a7
  try {
    const now = Date.now(); // @block:const-now-fb5d29f7
    const timeSinceLastCall = now - lastApiCallTime; // @block:const-timeSinceLastCall-822bbf3e

// @block:if--9a22559e
    if (timeSinceLastCall < API_CALL_INTERVAL) {
      await new Promise((resolve) => setTimeout(resolve, API_CALL_INTERVAL - timeSinceLastCall));
    }
// @block:if--9a22559e-end

    lastApiCallTime = Date.now();

    const response = await fetch(url, options); // @block:const-response-bbf23e99
// @block:if--78f88304
    if (!response.ok) {
// @block:if--a73b56d2
      if (response.status === 429) {
        // If rate limited, wait for a longer time before retrying
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10); // @block:const-retryAfter-6e90e8db
        logger.warn(`Rate limited. Retrying after ${retryAfter} seconds.`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        return fetchWithRetries(url, options, retries, delayMs);
      }
// @block:if--a73b56d2-end
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }
// @block:if--78f88304-end
    return response;
  } catch (err) {
// @block:if--6a3c5508
    if (retries < maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) * delayMs + Math.random() * 1000, maxDelaySec * 1000); // @block:const-delay-65c14cf4
      logger.warn(`Request failed, retrying ${retries + 1}/${maxRetryCount} in ${delay}ms. Error: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetries(url, options, retries + 1, delayMs);
    } else {
      throw err;
    }
// @block:if--6a3c5508-end
  }
// @block:try-{-bfe263a7-end
}
// @block:if--db3142a8-end

async function initializeConnection() {
// @block:if--7d92b346
  if (isInitializing) {
    logger.warn('Connection initialization already in progress. Skipping initialize.');
    return;
  }
// @block:if--7d92b346-end

  isInitializing = true;
  logger.info('Initializing connection...');

// @block:try-{-9ac0c557
  try {
    stopAllStreams();
    closePC();

// @block:if--2c48323d
    if (!currentAvatar || !avatars[currentAvatar]) {
      throw new Error('No avatar selected or avatar not found');
    }
// @block:if--2c48323d-end

    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, { // @block:const-sessionResponse-eab73941
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

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json(); // @block:const-{-fb6bcac2

// @block:if--9e51ec5a
    if (!newStreamId || !newSessionId) {
      throw new Error('Failed to get valid stream ID or session ID from API');
    }
// @block:if--9e51ec5a-end

    streamId = newStreamId;
    sessionId = newSessionId;
    logger.info('Stream created:', { streamId, sessionId });

// @block:try-{-cb1d2d02
    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
      logger.error('Error during streaming setup:', e);
      stopAllStreams();
      closePC();
      throw e;
    }
// @block:try-{-cb1d2d02-end

    await new Promise((resolve) => setTimeout(resolve, 6000));

    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, { // @block:const-sdpResponse-928240cd
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

// @block:if--cecb92cc
    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }
// @block:if--cecb92cc-end

    logger.info('Connection initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize connection:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
// @block:try-{-9ac0c557-end
}
// @block:if--6fce1e04-end

async function startStreaming(assistantReply) {
// @block:try-{-c779b4d1
  try {
    logger.debug('Starting streaming with reply:', assistantReply);
// @block:if--8facb113
    if (!persistentStreamId || !persistentSessionId) {
      logger.error('Persistent stream not initialized. Cannot start streaming.');
      await initializePersistentStream();
    }
// @block:if--8facb113-end

// @block:if--ff287bfb
    if (!currentAvatar || !avatars[currentAvatar]) {
      logger.error('No avatar selected or avatar not found. Cannot start streaming.');
      return;
    }
// @block:if--ff287bfb-end

    const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-2259db09
    const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-b76786a9

// @block:if--ba551897
    if (!streamVideoElement || !idleVideoElement) {
      logger.error('Video elements not found');
      return;
    }
// @block:if--ba551897-end

    // Remove outer <speak> tags if present
    let ssmlContent = assistantReply.trim(); // @block:let-ssmlContent-70633c70
// @block:if--caed8e24
    if (ssmlContent.startsWith('<speak>') && ssmlContent.endsWith('</speak>')) {
      ssmlContent = ssmlContent.slice(7, -8).trim();
    }
// @block:if--caed8e24-end

    // Split the SSML content into chunks, respecting SSML tags
    const chunks = ssmlContent.match(/(?:<[^>]+>|[^<]+)+/g) || []; // @block:const-chunks-1a3345ec

    logger.debug('Chunks', chunks);

// @block:for--b34f74cf
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim(); // @block:const-chunk-bc7748ad
// @block:if--91d6ef1b
      if (chunk.length === 0) continue;

      isAvatarSpeaking = true;
      const playResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}`, { // @block:const-playResponse-7692aaef
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

// @block:if--419d58f7
      if (!playResponse.ok) {
        throw new Error(`HTTP error! status: ${playResponse.status}`);
      }
// @block:if--419d58f7-end

      const playResponseData = await playResponse.json(); // @block:const-playResponseData-10ebfb37
      logger.debug('Streaming response:', playResponseData);

// @block:if--2978f58c
      if (playResponseData.status === 'started') {
        logger.debug('Stream chunk started successfully');

// @block:if--5adcc71d
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
// @block:if--5adcc71d-end
      } else {
        logger.warn('Unexpected response status:', playResponseData.status);
      }
// @block:if--2978f58c-end
    }
// @block:if--91d6ef1b-end

    isAvatarSpeaking = false;
    smoothTransition(false);

    // Check if we need to reconnect
// @block:if--35362d42
    if (shouldReconnect()) {
      logger.info('Approaching reconnection threshold. Initiating background reconnect.');
      await backgroundReconnect();
    }
// @block:if--35362d42-end
  } catch (error) {
    logger.error('Error during streaming:', error);
// @block:if--65912ae3
    if (error.message.includes('HTTP error! status: 404') || error.message.includes('missing or invalid session_id')) {
      logger.warn('Stream not found or invalid session. Attempting to reinitialize persistent stream.');
      await reinitializePersistentStream();
    }
// @block:if--65912ae3-end
  }
// @block:for--b34f74cf-end
}
// @block:try-{-c779b4d1-end

export function toggleSimpleMode() { // @block:export-None-9050568c
  const content = document.getElementById('content'); // @block:const-content-6a4ded00
  const videoWrapper = document.getElementById('video-wrapper'); // @block:const-videoWrapper-54bf300e
  const simpleModeButton = document.getElementById('simple-mode-button'); // @block:const-simpleModeButton-d28d9f0c
  const header = document.querySelector('.header'); // @block:const-header-2e69d8b6
  const autoSpeakToggle = document.getElementById('auto-speak-toggle'); // @block:const-autoSpeakToggle-a9cdc815
  const startButton = document.getElementById('start-button'); // @block:const-startButton-47a74bc0

// @block:if--08427aef
  if (content.style.display !== 'none') {
    // Entering simple mode
    content.style.display = 'none';
// @block:document.body.appendChild(videoWrapper);-None-5abcec29
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
// @block:if--280e2dd9
    if (autoSpeakToggle.textContent.includes('Off')) {
      autoSpeakToggle.click();
    }
// @block:if--280e2dd9-end

    // Start recording if it's not already recording
// @block:if--2efbf897
    if (startButton.textContent === 'Speak') {
      startButton.click();
    }
// @block:if--2efbf897-end
  } else {
    // Exiting simple mode
    content.style.display = 'flex';
    const leftColumn = document.getElementById('left-column'); // @block:const-leftColumn-a8b8e3f9
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
// @block:if--749e1f13
    if (autoSpeakToggle.textContent.includes('On')) {
      autoSpeakToggle.click();
    }
// @block:if--749e1f13-end

    // Stop recording
// @block:if--e67a84f5
    if (startButton.textContent === 'Stop') {
      startButton.click();
    }
// @block:if--e67a84f5-end
  }
// @block:document.body.appendChild(videoWrapper);-None-5abcec29-end
}
// @block:if--08427aef-end

// @block:function-startSendingAudioData-6c02f304
function startSendingAudioData() {
  logger.debug('Starting to send audio data...');

  let packetCount = 0; // @block:let-packetCount-b5f69c50
  let totalBytesSent = 0; // @block:let-totalBytesSent-383aaf60

  audioWorkletNode.port.onmessage = (event) => {
    const audioData = event.data; // @block:const-audioData-9223a66b

// @block:if--ebd458e4
    if (!(audioData instanceof ArrayBuffer)) {
      logger.warn('Received non-ArrayBuffer data from AudioWorklet:', typeof audioData);
      return;
    }
// @block:if--ebd458e4-end

// @block:if--1764914b
    if (deepgramConnection && deepgramConnection.getReadyState() === WebSocket.OPEN) {
// @block:try-{-139dc1fa
      try {
        deepgramConnection.send(audioData);
        packetCount++;
        totalBytesSent += audioData.byteLength;

// @block:if--e49ceec5
        if (packetCount % 100 === 0) {
          logger.debug(`Sent ${packetCount} audio packets to Deepgram. Total bytes: ${totalBytesSent}`);
        }
// @block:if--e49ceec5-end
      } catch (error) {
        logger.error('Error sending audio data to Deepgram:', error);
      }
// @block:try-{-139dc1fa-end
    } else {
      logger.warn(
        'Deepgram connection not open, cannot send audio data. ReadyState:',
        deepgramConnection ? deepgramConnection.getReadyState() : 'undefined',
      );
    }
// @block:if--1764914b-end
  };

  logger.debug('Audio data sending setup complete');
}
// @block:function-startSendingAudioData-6c02f304-end

// @block:function-handleTranscription-ba982c22
function handleTranscription(data) {
// @block:if--36a43ac6
  if (!isRecording) return;

  const transcript = data.channel.alternatives[0].transcript; // @block:const-transcript-337cb99f
// @block:if--277aaa46
  if (data.is_final) {
    logger.debug('Final transcript:', transcript);
// @block:if--19a873ca
    if (transcript.trim()) {
      currentUtterance += transcript + ' ';
      updateTranscript(currentUtterance.trim(), true);
      chatHistory.push({
        role: 'user',
        content: currentUtterance.trim(),
      });
      sendChatToGroq();
    }
// @block:if--19a873ca-end
    currentUtterance = '';
    interimMessageAdded = false;
  } else {
    logger.debug('Interim transcript:', transcript);
    updateTranscript(currentUtterance + transcript, false);
  }
// @block:if--277aaa46-end
}
// @block:if--36a43ac6-end

async function startRecording() {
// @block:if--4826db51
  if (isRecording) {
    logger.warn('Recording is already in progress. Stopping current recording.');
    await stopRecording();
    return;
  }
// @block:if--4826db51-end

  logger.debug('Starting recording process...');

  currentUtterance = '';
  interimMessageAdded = false;

// @block:try-{-16187f68
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // @block:const-stream-21318b04
    logger.info('Microphone stream obtained');

    audioContext = new AudioContext();
    logger.debug('Audio context created. Sample rate:', audioContext.sampleRate);

    await audioContext.audioWorklet.addModule('audio-processor.js');
    logger.debug('Audio worklet module added successfully');

    const source = audioContext.createMediaStreamSource(stream); // @block:const-source-dee65fa8
    logger.debug('Media stream source created');

    audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
    logger.debug('Audio worklet node created');

    source.connect(audioWorkletNode);
    logger.debug('Media stream source connected to audio worklet node');

    const deepgramOptions = { // @block:const-deepgramOptions-c0eb882d
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
// @block:if--ba82fa3c
    if (autoSpeakMode) {
      autoSpeakInProgress = true;
    }
// @block:if--ba82fa3c-end
    const startButton = document.getElementById('start-button'); // @block:const-startButton-5568cbdc
    startButton.textContent = 'Stop';

    logger.debug('Recording and transcription started successfully');
  } catch (error) {
    logger.error('Error starting recording:', error);
    isRecording = false;
    const startButton = document.getElementById('start-button'); // @block:const-startButton-7cf2fb31
    startButton.textContent = 'Speak';
    showErrorMessage('Failed to start recording. Please try again.');
    throw error;
  }
// @block:try-{-16187f68-end
}
// @block:function-handleTranscription-ba982c22-end

// @block:function-handleDeepgramError-c4711447
function handleDeepgramError(err) {
  logger.error('Deepgram error:', err);
  isRecording = false;
  const startButton = document.getElementById('start-button'); // @block:const-startButton-764bbe13
  startButton.textContent = 'Speak';

  // Attempt to close the connection and clean up
// @block:if--9a94d7ce
  if (deepgramConnection) {
// @block:try-{-3abee8ee
    try {
      deepgramConnection.finish();
    } catch (closeError) {
      logger.warn('Error while closing Deepgram connection:', closeError);
    }
// @block:try-{-3abee8ee-end
  }
// @block:if--9a94d7ce-end

// @block:if--99001a79
  if (audioContext) {
    audioContext.close().catch((closeError) => {
      logger.warn('Error while closing AudioContext:', closeError);
    });
  }
// @block:if--99001a79-end
}
// @block:function-handleDeepgramError-c4711447-end

// @block:function-handleUtteranceEnd-86a3d569
function handleUtteranceEnd(data) {
// @block:if--05a16ee4
  if (!isRecording) return;

  logger.debug('Utterance end detected:', data);
// @block:if--7abc3ddb
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
// @block:if--7abc3ddb-end
}
// @block:if--05a16ee4-end

async function stopRecording() {
// @block:if--3ee06daf
  if (isRecording) {
    logger.info('Stopping recording...');

// @block:if--8336356b
    if (audioContext) {
      await audioContext.close();
      logger.debug('AudioContext closed');
    }
// @block:if--8336356b-end

// @block:if--747da8bd
    if (deepgramConnection) {
      deepgramConnection.finish();
      logger.debug('Deepgram connection finished');
    }
// @block:if--747da8bd-end

    isRecording = false;
    autoSpeakInProgress = false;
    const startButton = document.getElementById('start-button'); // @block:const-startButton-72c8e376
    startButton.textContent = 'Speak';

    logger.debug('Recording and transcription stopped');
  }
// @block:if--3ee06daf-end
}
// @block:function-handleUtteranceEnd-86a3d569-end

async function sendChatToGroq() {
// @block:if--044cb46e
  if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1].content.trim() === '') {
    logger.debug('No new content to send to Groq. Skipping request.');
    return;
  }
// @block:if--044cb46e-end

  logger.debug('Sending chat to Groq...');
// @block:try-{-ceadafbc
  try {
    const startTime = Date.now(); // @block:const-startTime-521d6317
    const currentContext = document.getElementById('context-input').value.trim(); // @block:const-currentContext-ba9aa672
    const requestBody = { // @block:const-requestBody-90b3895e
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

    const response = await fetch('/chat', { // @block:const-response-fc2474b2
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    logger.debug('Groq response status:', response.status);

// @block:if--c2b9ead4
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
// @block:if--c2b9ead4-end

    const reader = response.body.getReader(); // @block:const-reader-7d4403e6
    let assistantReply = ''; // @block:let-assistantReply-e90ec40c
    let done = false; // @block:let-done-3c691ec1

    const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-df7d12b3
    const assistantSpan = document.createElement('span'); // @block:const-assistantSpan-35f2c0e2
    assistantSpan.innerHTML = '<u>Assistant:</u> ';
    msgHistory.appendChild(assistantSpan);
    msgHistory.appendChild(document.createElement('br'));

// @block:while--0e7daa59
    while (!done) {
      const { value, done: readerDone } = await reader.read(); // @block:const-{-773d457f
// @block:done-=-5cec5f81
      done = readerDone;

// @block:if--5af1d6d6
      if (value) {
        const chunk = new TextDecoder().decode(value); // @block:const-chunk-36338121
        logger.debug('Received chunk:', chunk);
        const lines = chunk.split('\n'); // @block:const-lines-582a928a

// @block:for--41801d05
        for (const line of lines) {
// @block:if--03fdf5c6
          if (line.startsWith('data:')) {
            const data = line.substring(5).trim(); // @block:const-data-803bc368
// @block:if--6edf2c6a
            if (data === '[DONE]') {
// @block:done-=-65a6594e
              done = true;
              break;
            }
// @block:done-=-65a6594e-end

// @block:try-{-3eed745f
            try {
              const parsed = JSON.parse(data); // @block:const-parsed-6ccf79e0
              const content = parsed.choices[0]?.delta?.content || ''; // @block:const-content-3380707c
              assistantReply += content;
              assistantSpan.innerHTML += content;
              logger.debug('Parsed content:', content);
            } catch (error) {
              logger.error('Error parsing JSON:', error);
            }
// @block:try-{-3eed745f-end
          }
// @block:if--6edf2c6a-end
        }
// @block:if--03fdf5c6-end

        msgHistory.scrollTop = msgHistory.scrollHeight;
      }
// @block:for--41801d05-end
    }
// @block:if--5af1d6d6-end

    const endTime = Date.now(); // @block:const-endTime-3cb75f87
    const processingTime = endTime - startTime; // @block:const-processingTime-f16a309f
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
    const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-6740e310
    msgHistory.innerHTML += `<span><u>Assistant:</u> I'm sorry, I encountered an error. Could you please try again?</span><br>`;
    msgHistory.scrollTop = msgHistory.scrollHeight;
  }
// @block:done-=-5cec5f81-end
}
// @block:while--0e7daa59-end

// @block:function-toggleAutoSpeak-7c0424bd
function toggleAutoSpeak() {
  autoSpeakMode = !autoSpeakMode;
  const toggleButton = document.getElementById('auto-speak-toggle'); // @block:const-toggleButton-c8d7431b
  const startButton = document.getElementById('start-button'); // @block:const-startButton-21adc87c
  toggleButton.textContent = `Auto-Speak: ${autoSpeakMode ? 'On' : 'Off'}`;
// @block:if--caff1a97
  if (autoSpeakMode) {
    startButton.textContent = 'Stop';
// @block:if--bab226b5
    if (!isRecording) {
      startRecording();
    }
// @block:if--bab226b5-end
  } else {
    startButton.textContent = isRecording ? 'Stop' : 'Speak';
// @block:if--5852dea3
    if (isRecording) {
      stopRecording();
    }
// @block:if--5852dea3-end
  }
// @block:if--caff1a97-end
}
// @block:function-toggleAutoSpeak-7c0424bd-end

async function reinitializeConnection() {
// @block:if--ae29287c
  if (connectionState === ConnectionState.RECONNECTING) {
    logger.warn('Connection reinitialization already in progress. Skipping reinitialize.');
    return;
  }
// @block:if--ae29287c-end

  connectionState = ConnectionState.RECONNECTING;
  logger.debug('Reinitializing connection...');

// @block:try-{-4c7c5421
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

    const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-d88603ef
    msgHistory.innerHTML = '';
    chatHistory = [];

    // Reset video elements
    const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-72ffcc0e
    const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-274b01db
// @block:if--c2a0160d
    if (streamVideoElement) streamVideoElement.srcObject = null;
// @block:if--deed4c5f
    if (idleVideoElement) idleVideoElement.style.display = 'block';

    // Add a delay before initializing to avoid rapid successive calls
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await initializePersistentStream();

// @block:if--395cf473
    if (!persistentStreamId || !persistentSessionId) {
      throw new Error('Persistent Stream ID or Session ID is missing after initialization');
    }
// @block:if--395cf473-end

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
// @block:if--deed4c5f-end
}
// @block:if--c2a0160d-end

async function cleanupOldStream() {
  logger.debug('Cleaning up old stream...');

// @block:try-{-3e188c82
  try {
// @block:if--ed475f1c
    if (peerConnection) {
      peerConnection.close();
    }
// @block:if--ed475f1c-end

// @block:if--9165b1d1
    if (pcDataChannel) {
      pcDataChannel.close();
    }
// @block:if--9165b1d1-end

    // Stop all tracks in the streamVideoElement
// @block:if--ea25bf52
    if (streamVideoElement && streamVideoElement.srcObject) {
      streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    }
// @block:if--ea25bf52-end

    // Clear any ongoing intervals or timeouts
    clearInterval(statsIntervalId);
    clearTimeout(inactivityTimeout);
    clearInterval(keepAliveInterval);

    logger.debug('Old stream cleaned up successfully');
  } catch (error) {
    logger.error('Error cleaning up old stream:', error);
  }
// @block:try-{-3e188c82-end
}
// @block:try-{-4c7c5421-end

const connectButton = document.getElementById('connect-button'); // @block:const-connectButton-657e983b
connectButton.onclick = initializeConnection;

const destroyButton = document.getElementById('destroy-button'); // @block:const-destroyButton-d6024b71
destroyButton.onclick = async () => {
// @block:try-{-15d4fb8f
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
// @block:try-{-15d4fb8f-end
};

const startButton = document.getElementById('start-button'); // @block:const-startButton-b6aba70c

startButton.onclick = async () => {
  logger.info('Start button clicked. Current state:', isRecording ? 'Recording' : 'Not recording');
// @block:if--3b629329
  if (!isRecording) {
// @block:try-{-647c8201
    try {
      await startRecording();
    } catch (error) {
      logger.error('Failed to start recording:', error);
      showErrorMessage('Failed to start recording. Please try again.');
    }
// @block:try-{-647c8201-end
  } else {
    await stopRecording();
  }
// @block:if--3b629329-end
};

const saveAvatarButton = document.getElementById('save-avatar-button'); // @block:const-saveAvatarButton-5c14d07e
saveAvatarButton.onclick = saveAvatar;

const avatarImageInput = document.getElementById('avatar-image'); // @block:const-avatarImageInput-aefc02ee
avatarImageInput.onchange = (event) => {
  const file = event.target.files[0]; // @block:const-file-4fb49c71
// @block:if--1274939d
  if (file) {
    const reader = new FileReader(); // @block:const-reader-76846ddd
    reader.onload = (e) => {
// @block:document.getElementById('avatar-image-preview').src-=-32a29ce1
      document.getElementById('avatar-image-preview').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
// @block:document.getElementById('avatar-image-preview').src-=-32a29ce1-end
};

// Export functions and variables that need to be accessed from other modules
export { // @block:export-None-aa5faec5
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

'use strict';
import DID_API from './api.js'; // @block:import-None-1ee6af1a
import logger from './logger.js'; // @block:import-None-fbb51911
const { createClient, LiveTranscriptionEvents } = deepgram; // @block:const-{-98af5015

const deepgramClient = createClient(DID_API.deepgramKey); // @block:const-deepgramClient-71bb4e15

const RTCPeerConnection = ( // @block:const-RTCPeerConnection-eb3611c3
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
).bind(window);

let peerConnection; // @block:let-None-6eda0b29
let pcDataChannel; // @block:let-None-bbf2317a
let streamId; // @block:let-None-9d7af671
let sessionId; // @block:let-None-dbc21097
let sessionClientAnswer; // @block:let-None-fa2f4014
let statsIntervalId; // @block:let-None-1b2a0e43
let videoIsPlaying; // @block:let-None-02ae272f
let lastBytesReceived; // @block:let-None-de32e147
let chatHistory = []; // @block:let-chatHistory-fedb9c7a
let inactivityTimeout; // @block:let-None-7433ce5c
let keepAliveInterval; // @block:let-None-1bc66427
let socket; // @block:let-None-37abe8e9
let isInitializing = false; // @block:let-isInitializing-2eda6614
let audioContext; // @block:let-None-d928b7cc
let streamVideoElement; // @block:let-None-a0377bf7
let idleVideoElement; // @block:let-None-49c217c6
let deepgramConnection; // @block:let-None-91f10d4a
let isRecording = false; // @block:let-isRecording-8dfa0ec6
let audioWorkletNode; // @block:let-None-e0dfce44
let currentUtterance = ''; // @block:let-currentUtterance-6b60e209
let interimMessageAdded = false; // @block:let-interimMessageAdded-90a5b99d
let autoSpeakMode = true; // @block:let-autoSpeakMode-32c0cd81
let transitionCanvas; // @block:let-None-189897f2
let transitionCtx; // @block:let-None-0dd3db8f
let isDebugMode = false; // @block:let-isDebugMode-d0e33188
let isTransitioning = false; // @block:let-isTransitioning-6affabca
let lastVideoStatus = null; // @block:let-lastVideoStatus-84b617b3
let isCurrentlyStreaming = false; // @block:let-isCurrentlyStreaming-24b9db28
let reconnectAttempts = 10; // @block:let-reconnectAttempts-2cd30731
let persistentStreamId = null; // @block:let-persistentStreamId-b06a4c34
let persistentSessionId = null; // @block:let-persistentSessionId-66c3f113
let isPersistentStreamActive = false; // @block:let-isPersistentStreamActive-0fc2070e
const API_RATE_LIMIT = 40; // Maximum number of calls per minute // @block:const-API_RATE_LIMIT-f66e4ed7
const API_CALL_INTERVAL = 30000 / API_RATE_LIMIT; // Minimum time between API calls in milliseconds // @block:const-API_CALL_INTERVAL-82410c36
let lastApiCallTime = 0; // @block:let-lastApiCallTime-b3ca9a66
const maxRetryCount = 10; // @block:const-maxRetryCount-4a7ede84
const maxDelaySec = 100; // @block:const-maxDelaySec-d5187f83
const RECONNECTION_INTERVAL = 100000; // 25 seconds for testing, adjust as needed // @block:const-RECONNECTION_INTERVAL-0e2ebec6
let isAvatarSpeaking = false; // @block:let-isAvatarSpeaking-b24f5711
const MAX_RECONNECT_ATTEMPTS = 10; // @block:const-MAX_RECONNECT_ATTEMPTS-3fb1ea04
const INITIAL_RECONNECT_DELAY = 2000; // 1 second // @block:const-INITIAL_RECONNECT_DELAY-7907c51b
const MAX_RECONNECT_DELAY = 90000; // 30 seconds // @block:const-MAX_RECONNECT_DELAY-c725b44e
let autoSpeakInProgress = false; // @block:let-autoSpeakInProgress-f920a1ba

const ConnectionState = { // @block:const-ConnectionState-5330062f
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
};

let lastConnectionTime = Date.now(); // @block:let-lastConnectionTime-b481c319

let connectionState = ConnectionState.DISCONNECTED; // @block:let-connectionState-93a2746b

export function setLogLevel(level) { // @block:export-None-d40861d1
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}

let avatars = {}; // @block:let-avatars-6344764e
let currentAvatar = ''; // @block:let-currentAvatar-95fadd26

const avatarSelect = document.getElementById('avatar-select'); // @block:const-avatarSelect-92e6ed0f
avatarSelect.addEventListener('change', handleAvatarChange);

let context = ` // @block:let-context-5dc80df9

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
// @block:if--e7a0cacd
  if (!streamId || !sessionId) {
    throw new Error('Stream ID or Session ID is missing. Cannot prepare for streaming.');
  }
// @block:if--e7a0cacd-end

  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-bd5152e7
  const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-23cc1a3d

// @block:if--4129eeef
  if (!streamVideoElement || !idleVideoElement) {
    throw new Error('Video elements not found');
  }
// @block:if--4129eeef-end

  // Reset video elements
  streamVideoElement.srcObject = null;
  streamVideoElement.src = '';
  streamVideoElement.style.display = 'none';

  idleVideoElement.style.display = 'block';
  idleVideoElement.play().catch((e) => logger.error('Error playing idle video:', e));

  logger.debug('Prepared for streaming');
}

// @block:function-initializeTransitionCanvas-e12517ff
function initializeTransitionCanvas() {
  const videoWrapper = document.querySelector('#video-wrapper'); // @block:const-videoWrapper-0fdaef1b
  const rect = videoWrapper.getBoundingClientRect(); // @block:const-rect-45aa9003
  const size = Math.min(rect.width, rect.height, 550); // @block:const-size-76783eac

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
    const videoWrapper = document.querySelector('#video-wrapper'); // @block:const-videoWrapper-0d5696ad
    const rect = videoWrapper.getBoundingClientRect(); // @block:const-rect-d58da072
    const size = Math.min(rect.width, rect.height, 550); // @block:const-size-245b8d4d

    transitionCanvas.width = size;
    transitionCanvas.height = size;
  });
}
// @block:function-initializeTransitionCanvas-e12517ff-end

// @block:function-smoothTransition-24509edd
function smoothTransition(toStreaming, duration = 250) {
  const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-1d5ace1d
  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-ad5ea4e6

// @block:if--88dbd5fa
  if (!idleVideoElement || !streamVideoElement) {
    logger.warn('Video elements not found for transition');
    return;
  }
// @block:if--88dbd5fa-end

// @block:if--b391483b
  if (isTransitioning) {
    logger.debug('Transition already in progress, skipping');
    return;
  }
// @block:if--b391483b-end

  // Don't transition if we're already in the desired state
// @block:if--91392a1f
  if ((toStreaming && isCurrentlyStreaming) || (!toStreaming && !isCurrentlyStreaming)) {
    logger.debug('Already in desired state, skipping transition');
    return;
  }
// @block:if--91392a1f-end

  isTransitioning = true;
  logger.debug(`Starting smooth transition to ${toStreaming ? 'streaming' : 'idle'} state`);

  let startTime = null; // @block:let-startTime-66e70a47

// @block:function-animate-3bf4d659
  function animate(currentTime) {
// @block:if--f9fbcf6b
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime; // @block:const-elapsed-a5153158
    const progress = Math.min(elapsed / duration, 1); // @block:const-progress-1b6eb24c

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

// @block:if--39bc465a
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Ensure final state is set correctly
// @block:if--9d466ee0
      if (toStreaming) {
        streamVideoElement.style.display = 'block';
        idleVideoElement.style.display = 'none';
      } else {
        streamVideoElement.style.display = 'none';
        idleVideoElement.style.display = 'block';
      }
// @block:if--9d466ee0-end
      isTransitioning = false;
      isCurrentlyStreaming = toStreaming;
      transitionCanvas.style.display = 'none';
      logger.debug('Smooth transition completed');
    }
// @block:if--39bc465a-end
  }
// @block:if--f9fbcf6b-end

  // Show the transition canvas
  transitionCanvas.style.display = 'block';

  // Start the animation
  requestAnimationFrame(animate);
}
// @block:function-animate-3bf4d659-end

// @block:function-getVideoElements-e418176f
function getVideoElements() {
  const idle = document.getElementById('idle-video-element'); // @block:const-idle-57b2a47c
  const stream = document.getElementById('stream-video-element'); // @block:const-stream-4b719f10

// @block:if--f288ec1b
  if (!idle || !stream) {
    logger.warn('Video elements not found in the DOM');
  }
// @block:if--f288ec1b-end

  return { idle, stream };
}
// @block:function-getVideoElements-e418176f-end

// @block:function-getStatusLabels-9cd1e406
function getStatusLabels() {
  return {
    peer: document.getElementById('peer-status-label'),
    ice: document.getElementById('ice-status-label'),
    iceGathering: document.getElementById('ice-gathering-status-label'),
    signaling: document.getElementById('signaling-status-label'),
    streaming: document.getElementById('streaming-status-label'),
  };
}
// @block:function-getStatusLabels-9cd1e406-end

// @block:function-initializeWebSocket-756bceef
function initializeWebSocket() {
  socket = new WebSocket(`wss://${window.location.host}`);

  socket.onopen = () => {
    logger.info('WebSocket connection established');
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data); // @block:const-data-b48eda31
    logger.debug('Received WebSocket message:', data);

// @block:switch--a63ae39f
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
// @block:switch--a63ae39f-end
  };

  socket.onerror = (error) => {
    logger.error('WebSocket error:', error);
  };

  socket.onclose = () => {
    logger.info('WebSocket connection closed');
    setTimeout(initializeWebSocket, 10000);
  };
}
// @block:function-initializeWebSocket-756bceef-end

// @block:function-updateTranscript-6b0492f5
function updateTranscript(text, isFinal) {
  const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-627db0d7
  let interimSpan = msgHistory.querySelector('span[data-interim]'); // @block:let-interimSpan-d292e26e

// @block:if--391dade4
  if (isFinal) {
// @block:if--f3b85c5b
    if (interimSpan) {
      interimSpan.remove();
    }
// @block:if--f3b85c5b-end
    msgHistory.innerHTML += `<span><u>User:</u> ${text}</span><br>`;
    logger.debug('Final transcript added to chat history:', text);
    interimMessageAdded = false;
  } else {
// @block:if--0dd1f08f
    if (text.trim()) {
// @block:if--4882c0ef
      if (!interimMessageAdded) {
        msgHistory.innerHTML += `<span data-interim style='opacity:0.5'><u>User (interim):</u> ${text}</span><br>`;
        interimMessageAdded = true;
      } else if (interimSpan) {
        interimSpan.innerHTML = `<u>User (interim):</u> ${text}`;
      }
// @block:if--4882c0ef-end
    }
// @block:if--0dd1f08f-end
  }
// @block:if--391dade4-end
  msgHistory.scrollTop = msgHistory.scrollHeight;
}
// @block:function-updateTranscript-6b0492f5-end

// @block:function-handleTextInput-4e1737e5
function handleTextInput(text) {
// @block:if--13773e24
  if (text.trim() === '') return;

  const textInput = document.getElementById('text-input'); // @block:const-textInput-b095ea68
  textInput.value = '';

  updateTranscript(text, true);

  chatHistory.push({
    role: 'user',
    content: text,
  });

  sendChatToGroq();
}
// @block:if--13773e24-end

// @block:function-updateAssistantReply-f10e6116
function updateAssistantReply(text) {
// @block:document.getElementById('msgHistory').innerHTML-+=-9c03d830
  document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${text}</span><br>`;
}
// @block:document.getElementById('msgHistory').innerHTML-+=-9c03d830-end

async function initializePersistentStream() {
  logger.info('Initializing persistent stream...');
  connectionState = ConnectionState.CONNECTING;

// @block:try-{-45a8d5cd
  try {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, { // @block:const-sessionResponse-2275c1eb
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

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json(); // @block:const-{-63add5b5

    persistentStreamId = newStreamId;
    persistentSessionId = newSessionId;

    logger.info('Persistent stream created:', { persistentStreamId, persistentSessionId });

// @block:try-{-f138ce21
    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
      logger.error('Error during streaming setup:', e);
      stopAllStreams();
      closePC();
      throw e;
    }
// @block:try-{-f138ce21-end

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}/sdp`, { // @block:const-sdpResponse-965fda2e
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

// @block:if--26552a1f
    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }
// @block:if--26552a1f-end
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
// @block:try-{-45a8d5cd-end
}
// @block:function-updateAssistantReply-f10e6116-end

// @block:function-shouldReconnect-4d2ba0e9
function shouldReconnect() {
  const timeSinceLastConnection = Date.now() - lastConnectionTime; // @block:const-timeSinceLastConnection-e2304eb4
  return timeSinceLastConnection > RECONNECTION_INTERVAL * 0.9;
}
// @block:function-shouldReconnect-4d2ba0e9-end

// @block:function-scheduleReconnect-e7c885e5
function scheduleReconnect() {
// @block:if--927c4e6a
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    logger.error('Max reconnection attempts reached. Please refresh the page.');
    showErrorMessage('Failed to reconnect after multiple attempts. Please refresh the page.');
    return;
  }
// @block:if--927c4e6a-end

  const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY); // @block:const-delay-0cf91dd1
  logger.debug(`Scheduling reconnection attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
  setTimeout(backgroundReconnect, delay);
  reconnectAttempts++;
}
// @block:function-scheduleReconnect-e7c885e5-end

// @block:function-startKeepAlive-f3842f6f
function startKeepAlive() {
// @block:if--bdc104fc
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
// @block:if--bdc104fc-end

  keepAliveInterval = setInterval(() => {
// @block:if--4aa732d2
    if (isPersistentStreamActive && peerConnection && peerConnection.connectionState === 'connected' && pcDataChannel) {
// @block:try-{-e6bf232c
      try {
        const keepAliveMessage = JSON.stringify({ type: 'KeepAlive' }); // @block:const-keepAliveMessage-7e2f9267
// @block:if--9b2beed7
        if (pcDataChannel.readyState === 'open') {
          pcDataChannel.send(keepAliveMessage);
          logger.debug('Keepalive message sent successfully');
        } else {
          logger.warn('Data channel is not open. Current state:', pcDataChannel.readyState);
        }
// @block:if--9b2beed7-end
      } catch (error) {
        logger.warn('Error sending keepalive message:', error);
      }
// @block:try-{-e6bf232c-end
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
// @block:if--4aa732d2-end
  }, 30000); // Send keepalive every 30 seconds
}
// @block:function-startKeepAlive-f3842f6f-end

async function destroyPersistentStream() {
// @block:if--dd4c2b07
  if (persistentStreamId) {
// @block:try-{-78c2fef1
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
// @block:if--69f3274c
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
// @block:if--69f3274c-end
      connectionState = ConnectionState.DISCONNECTED;
    }
// @block:try-{-78c2fef1-end
  }
// @block:if--dd4c2b07-end
}
// @block:function-handleTextInput-4e1737e5-end

async function reinitializePersistentStream() {
  logger.info('Reinitializing persistent stream...');
  await destroyPersistentStream();
  await initializePersistentStream();
}
// @block:function-smoothTransition-24509edd-end

async function createNewPersistentStream() {
  logger.debug('Creating new persistent stream...');

// @block:try-{-dec98d79
  try {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, { // @block:const-sessionResponse-98f2cea6
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

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json(); // @block:const-{-d52d9a24

    logger.debug('New stream created:', { newStreamId, newSessionId });

    const newSessionClientAnswer = await createPeerConnection(offer, iceServers); // @block:const-newSessionClientAnswer-e096114c

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${newStreamId}/sdp`, { // @block:const-sdpResponse-d5883637
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

// @block:if--6ee1c04a
    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }
// @block:if--6ee1c04a-end

    return { streamId: newStreamId, sessionId: newSessionId };
  } catch (error) {
    logger.error('Error creating new persistent stream:', error);
    return null;
  }
// @block:try-{-dec98d79-end
}

async function backgroundReconnect() {
// @block:if--68597a0f
  if (connectionState === ConnectionState.RECONNECTING) {
    logger.debug('Background reconnection already in progress. Skipping.');
    return;
  }
// @block:if--68597a0f-end

  connectionState = ConnectionState.RECONNECTING;
  logger.debug('Starting background reconnection process...');

// @block:try-{-01318b6d
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
// @block:try-{-01318b6d-end
}

// @block:function-waitForIdleState-387eb43a
function waitForIdleState() {
  return new Promise((resolve) => {
    const checkIdleState = () => { // @block:const-checkIdleState-f30d3896
// @block:if--4699e151
      if (!isAvatarSpeaking) {
        resolve();
      } else {
        setTimeout(checkIdleState, 500); // Check every 500ms
      }
// @block:if--4699e151-end
    };
    checkIdleState();
  });
}
// @block:function-waitForIdleState-387eb43a-end

async function switchToNewStream(newStreamData) {
  logger.debug('Switching to new stream...');

// @block:try-{-ae63cc0a
  try {
    connectionState = ConnectionState.RECONNECTING;

    // Quickly switch the video source to the new stream
// @block:if--f1810fb7
    if (streamVideoElement) {
      // Instead of directly setting src, we need to update the WebRTC connection
      await updateWebRTCConnection(newStreamData);
    }
// @block:if--f1810fb7-end

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
// @block:try-{-ae63cc0a-end
}

async function updateWebRTCConnection(newStreamData) {
  logger.debug('Updating WebRTC connection...');

// @block:try-{-eb07dfc1
  try {
    const offer = await fetchStreamOffer(newStreamData.streamId); // @block:const-offer-21d0a26f
    const iceServers = await fetchIceServers(); // @block:const-iceServers-94f52d89

    const newSessionClientAnswer = await createPeerConnection(offer, iceServers); // @block:const-newSessionClientAnswer-c7fab18d

    await sendSDPAnswer(newStreamData.streamId, newStreamData.sessionId, newSessionClientAnswer);

    logger.debug('WebRTC connection updated successfully');
  } catch (error) {
    logger.error('Error updating WebRTC connection:', error);
    throw error;
  }
// @block:try-{-eb07dfc1-end
}

async function fetchStreamOffer(streamId) {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/offer`, { // @block:const-response-0583366f
    method: 'GET',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
    },
  });
  const data = await response.json(); // @block:const-data-73d44cc1
  return data.offer;
}

async function fetchIceServers() {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/ice_servers`, { // @block:const-response-8c5ef636
    method: 'GET',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
    },
  });
  const data = await response.json(); // @block:const-data-2240a12b
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

  const { idle, stream } = getVideoElements(); // @block:const-{-ce237d61
  idleVideoElement = idle;
  streamVideoElement = stream;

// @block:if--415618ed
  if (idleVideoElement) idleVideoElement.setAttribute('playsinline', '');
// @block:if--f75f797d
  if (streamVideoElement) streamVideoElement.setAttribute('playsinline', '');

  initializeTransitionCanvas();

  await loadAvatars();
  populateAvatarSelect();

  const contextInput = document.getElementById('context-input'); // @block:const-contextInput-ff4bd739
  contextInput.value = context.trim();
  contextInput.addEventListener('input', () => {
// @block:if--818cdb28
    if (!contextInput.value.includes('Original Context:')) {
      context = contextInput.value.trim();
    }
// @block:if--818cdb28-end
  });

  const sendTextButton = document.getElementById('send-text-button'); // @block:const-sendTextButton-fe1084bf
  const textInput = document.getElementById('text-input'); // @block:const-textInput-749b9405
  const replaceContextButton = document.getElementById('replace-context-button'); // @block:const-replaceContextButton-992d2b22
  const autoSpeakToggle = document.getElementById('auto-speak-toggle'); // @block:const-autoSpeakToggle-477686ff
  const editAvatarButton = document.getElementById('edit-avatar-button'); // @block:const-editAvatarButton-63fbcdd9

  sendTextButton.addEventListener('click', () => handleTextInput(textInput.value));
  textInput.addEventListener('keypress', (event) => {
// @block:if--129fb435
    if (event.key === 'Enter') handleTextInput(textInput.value);
  });
  replaceContextButton.addEventListener('click', () => updateContext('replace'));
  autoSpeakToggle.addEventListener('click', toggleAutoSpeak);
  editAvatarButton.addEventListener('click', () => openAvatarModal(currentAvatar));

  initializeWebSocket();
  playIdleVideo();

  showLoadingSymbol();
// @block:try-{-dff98330
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
// @block:try-{-dff98330-end

  // Set up reconnection mechanism
  window.addEventListener('online', async () => {
// @block:if--cefd09b5
    if (connectionState === ConnectionState.DISCONNECTED) {
      logger.info('Network connection restored. Attempting to reconnect...');
// @block:try-{-8f2e25ca
      try {
        await backgroundReconnect();
      } catch (error) {
        logger.error('Failed to reconnect after network restoration:', error);
      }
// @block:try-{-8f2e25ca-end
    }
// @block:if--cefd09b5-end
  });

  // Handle visibility change
// @block:document.addEventListener('visibilitychange',--3e8fbfe2
  document.addEventListener('visibilitychange', () => {
// @block:if--0fc22137
    if (!document.hidden && connectionState === ConnectionState.DISCONNECTED) {
      logger.info('Page became visible. Checking connection...');
// @block:if--b34b1356
      if (navigator.onLine) {
        backgroundReconnect();
      }
// @block:if--b34b1356-end
    }
// @block:if--0fc22137-end
  });

  logger.info('Initialization complete');
}
// @block:document.addEventListener('visibilitychange',--3e8fbfe2-end

async function handleAvatarChange() {
  currentAvatar = avatarSelect.value;
// @block:if--1a60f0e3
  if (currentAvatar === 'create-new') {
    openAvatarModal();
    return;
  }
// @block:if--1a60f0e3-end

  const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-62a0e638
// @block:if--9d53cf01
  if (idleVideoElement) {
    idleVideoElement.src = avatars[currentAvatar].silentVideoUrl;
// @block:try-{-5b2f98a0
    try {
      await idleVideoElement.load();
      logger.debug(`Idle video loaded for ${currentAvatar}`);
    } catch (error) {
      logger.error(`Error loading idle video for ${currentAvatar}:`, error);
    }
// @block:try-{-5b2f98a0-end
  }
// @block:if--9d53cf01-end

  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-22880872
// @block:if--1a263851
  if (streamVideoElement) {
    streamVideoElement.srcObject = null;
  }
// @block:if--1a263851-end

  await stopRecording();
  currentUtterance = '';
  interimMessageAdded = false;
  const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-d97a98e1
  msgHistory.innerHTML = '';
  chatHistory = [];

  await destroyPersistentStream();
  await initializePersistentStream();
}
// @block:if--129fb435-end

async function loadAvatars() {
// @block:try-{-bd0b0046
  try {
    const response = await fetch('/avatars'); // @block:const-response-46321dd0
// @block:if--ed5c6dc5
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
// @block:if--ed5c6dc5-end
    avatars = await response.json();
    logger.debug('Avatars loaded:', avatars);
  } catch (error) {
    logger.error('Error loading avatars:', error);
    showErrorMessage('Failed to load avatars. Please try again.');
  }
// @block:try-{-bd0b0046-end
}
// @block:if--f75f797d-end

// @block:function-populateAvatarSelect-16ca7643
function populateAvatarSelect() {
  const avatarSelect = document.getElementById('avatar-select'); // @block:const-avatarSelect-0ce6f632
  avatarSelect.innerHTML = '';

  const createNewOption = document.createElement('option'); // @block:const-createNewOption-6ab2371e
  createNewOption.value = 'create-new';
  createNewOption.textContent = 'Create New Avatar';
  avatarSelect.appendChild(createNewOption);

// @block:for--d53d78ff
  for (const [key, value] of Object.entries(avatars)) {
    const option = document.createElement('option'); // @block:const-option-f4a2e8b4
    option.value = key;
    option.textContent = value.name;
    avatarSelect.appendChild(option);
  }
// @block:for--d53d78ff-end

// @block:if--264c42c1
  if (Object.keys(avatars).length > 0) {
    currentAvatar = Object.keys(avatars)[0];
    avatarSelect.value = currentAvatar;
  }
// @block:if--264c42c1-end
}
// @block:function-populateAvatarSelect-16ca7643-end

// @block:function-openAvatarModal-cb7796c1
function openAvatarModal(avatarName = null) {
  const modal = document.getElementById('avatar-modal'); // @block:const-modal-5d3401c7
  const nameInput = document.getElementById('avatar-name'); // @block:const-nameInput-e52bb9af
  const voiceInput = document.getElementById('avatar-voice'); // @block:const-voiceInput-2bdfd8c8
  const imagePreview = document.getElementById('avatar-image-preview'); // @block:const-imagePreview-b2b70ebe
  const saveButton = document.getElementById('save-avatar-button'); // @block:const-saveButton-b6ad5f64

// @block:if--18acb544
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
// @block:if--18acb544-end

  modal.style.display = 'block';
}
// @block:function-openAvatarModal-cb7796c1-end

// @block:function-closeAvatarModal-1cf1cad4
function closeAvatarModal() {
  const modal = document.getElementById('avatar-modal'); // @block:const-modal-554ae332
  modal.style.display = 'none';
}
// @block:function-closeAvatarModal-1cf1cad4-end

async function saveAvatar() {
  const name = document.getElementById('avatar-name').value; // @block:const-name-8a8fa92f
  const voiceId = document.getElementById('avatar-voice').value || 'en-US-GuyNeural'; // @block:const-voiceId-64b61245
  const imageFile = document.getElementById('avatar-image').files[0]; // @block:const-imageFile-7b260989

// @block:if--2f966c55
  if (!name) {
    showErrorMessage('Please fill in the avatar name.');
    return;
  }
// @block:if--2f966c55-end

  const formData = new FormData(); // @block:const-formData-ab853bb4
// @block:formData.append('name',-name);-cd9ffbce
  formData.append('name', name);
// @block:formData.append('voiceId',-voiceId);-05f0c1e3
  formData.append('voiceId', voiceId);
// @block:if--dbd8e258
  if (imageFile) {
// @block:formData.append('image',-imageFile);-e76375f6
    formData.append('image', imageFile);
  }
// @block:formData.append('image',-imageFile);-e76375f6-end

  showToast('Saving avatar...', 0);

// @block:try-{-c29a6776
  try {
    const response = await fetch('/avatar', { // @block:const-response-ddbf4b1a
      method: 'POST',
      body: formData,
    });

    const reader = response.body.getReader(); // @block:const-reader-6ded3b43
    const decoder = new TextDecoder(); // @block:const-decoder-56bb0825

// @block:while--fb9bc958
    while (true) {
      const { done, value } = await reader.read(); // @block:const-{-896ee8b6
// @block:if--bfd10778
      if (done) break;

      const chunk = decoder.decode(value); // @block:const-chunk-ce7acb1d
      const events = chunk.split('\n\n'); // @block:const-events-b078d17b

// @block:for--5392e59b
      for (const event of events) {
// @block:if--e4c9d76b
        if (event.startsWith('data: ')) {
          const data = JSON.parse(event.slice(6)); // @block:const-data-a9a96264
// @block:if--ed7fbab4
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
// @block:if--ed7fbab4-end
        }
// @block:if--e4c9d76b-end
      }
// @block:for--5392e59b-end
    }
// @block:if--bfd10778-end
  } catch (error) {
    console.error('Error saving avatar:', error);
    showErrorMessage('Failed to save avatar. Please try again.');
  }
// @block:while--fb9bc958-end
}
// @block:try-{-c29a6776-end

// @block:function-updateContext-6ba11f43
function updateContext(action) {
  const contextInput = document.getElementById('context-input'); // @block:const-contextInput-d0af23e4
  const newContext = contextInput.value.trim(); // @block:const-newContext-a30a5b90

// @block:if--06607423
  if (newContext) {
    const originalContext = context; // @block:const-originalContext-31f6f5ff
// @block:if--c5c3bd15
    if (action === 'append') {
      context += '\n' + newContext;
    } else if (action === 'replace') {
      context = newContext;
    }
// @block:if--c5c3bd15-end
    logger.debug('Context updated:', context);
    showToast('Context saved successfully');

    displayBothContexts(originalContext, context);
  } else {
    showToast('Please enter some text before updating the context');
  }
// @block:if--06607423-end
}
// @block:function-updateContext-6ba11f43-end

// @block:function-displayBothContexts-cba20095
function displayBothContexts(original, updated) {
  const contextInput = document.getElementById('context-input'); // @block:const-contextInput-80b0d191
  contextInput.value = `Original Context:\n${original}\n\nNew Context:\n${updated}`;

  setTimeout(() => {
    contextInput.value = updated;
  }, 3000);
}
// @block:function-displayBothContexts-cba20095-end

// @block:function-showToast-a431a111
function showToast(message) {
  const toast = document.createElement('div'); // @block:const-toast-ee38926e
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

// @block:document.body.appendChild(toast);-None-1bc0ef25
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease-out';
    setTimeout(() => {
// @block:document.body.removeChild(toast);-None-e6bd59bc
      document.body.removeChild(toast);
    }, 500);
  }, 3000);
}
// @block:document.body.removeChild(toast);-None-e6bd59bc-end

// @block:if--ae808152
if (document.readyState === 'loading') {
// @block:document.addEventListener('DOMContentLoaded',-initialize);-da92a3e4
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
// @block:document.addEventListener('DOMContentLoaded',-initialize);-da92a3e4-end

// @block:function-showLoadingSymbol-1917f5dc
function showLoadingSymbol() {
  const loadingSymbol = document.createElement('div'); // @block:const-loadingSymbol-396c9954
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
// @block:document.body.appendChild(loadingSymbol);-None-e6eb6541
  document.body.appendChild(loadingSymbol);
}
// @block:document.body.appendChild(loadingSymbol);-None-e6eb6541-end

// @block:function-hideLoadingSymbol-a7bcfb0d
function hideLoadingSymbol() {
  const loadingSymbol = document.getElementById('loading-symbol'); // @block:const-loadingSymbol-917e56ce
// @block:if--6a1a0fbb
  if (loadingSymbol) {
// @block:document.body.removeChild(loadingSymbol);-None-8e6e41bb
    document.body.removeChild(loadingSymbol);
  }
// @block:document.body.removeChild(loadingSymbol);-None-8e6e41bb-end
}
// @block:if--6a1a0fbb-end

// @block:function-showErrorMessage-0e51f224
function showErrorMessage(message) {
  const errorMessage = document.createElement('div'); // @block:const-errorMessage-9fbd8933
  errorMessage.innerHTML = message;
  errorMessage.style.color = 'red';
  errorMessage.style.marginBottom = '10px';
// @block:document.body.appendChild(errorMessage);-None-ec557778
  document.body.appendChild(errorMessage);

  const destroyButton = document.getElementById('destroy-button'); // @block:const-destroyButton-3e5aea39
  const connectButton = document.getElementById('connect-button'); // @block:const-connectButton-d50afd76
  connectButton.onclick = initializePersistentStream;

// @block:if--c8dc7359
  if (destroyButton) destroyButton.style.display = 'inline-block';
  destroyButton.onclick = destroyPersistentStream;

// @block:if--fda46c0b
  if (connectButton) connectButton.style.display = 'inline-block';
}
// @block:if--fda46c0b-end

async function createPeerConnection(offer, iceServers) {
// @block:if--f4ac62c7
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
// @block:if--f4ac62c7-end

  await peerConnection.setRemoteDescription(offer);
  logger.debug('Set remote SDP');

  const sessionClientAnswer = await peerConnection.createAnswer(); // @block:const-sessionClientAnswer-873f59b1
  logger.debug('Created local SDP');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  logger.debug('Set local SDP');

  return sessionClientAnswer;
}
// @block:if--c8dc7359-end

// @block:function-onIceGatheringStateChange-bc7b4cb5
function onIceGatheringStateChange() {
  const { iceGathering: iceGatheringStatusLabel } = getStatusLabels(); // @block:const-{-a6136041
// @block:if--16619891
  if (iceGatheringStatusLabel) {
    iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
    iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
  }
// @block:if--16619891-end
  logger.debug('ICE gathering state changed:', peerConnection.iceGatheringState);
}
// @block:function-onIceGatheringStateChange-bc7b4cb5-end

// @block:function-onIceCandidate-ad0f044b
function onIceCandidate(event) {
// @block:if--b0ada136
  if (event.candidate && persistentStreamId && persistentSessionId) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate; // @block:const-{-e7e7ad39
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
// @block:if--b0ada136-end
}
// @block:function-onIceCandidate-ad0f044b-end

// @block:function-onIceConnectionStateChange-017d192d
function onIceConnectionStateChange() {
  const { ice: iceStatusLabel } = getStatusLabels(); // @block:const-{-f8f90f38
// @block:if--bc00cb65
  if (iceStatusLabel) {
    iceStatusLabel.innerText = peerConnection.iceConnectionState;
    iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
  }
// @block:if--bc00cb65-end
  logger.debug('ICE connection state changed:', peerConnection.iceConnectionState);

// @block:if--a06505ba
  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
    showErrorMessage('Connection lost. Please try again.');
  }
// @block:if--a06505ba-end
}
// @block:function-onIceConnectionStateChange-017d192d-end

async function attemptReconnect() {
  logger.debug('Attempting to reconnect...');
// @block:try-{-dd54bbab
  try {
    await reinitializeConnection();
    logger.debug('Reconnection successful');
    reconnectAttempts = 0;
  } catch (error) {
    logger.error('Reconnection attempt failed:', error);
    scheduleReconnect();
  }
// @block:try-{-dd54bbab-end
}
// @block:document.body.appendChild(errorMessage);-None-ec557778-end

// @block:function-onConnectionStateChange-47150fac
function onConnectionStateChange() {
  const { peer: peerStatusLabel } = getStatusLabels(); // @block:const-{-cf6563ce
// @block:if--7f95485d
  if (peerStatusLabel) {
    peerStatusLabel.innerText = peerConnection.connectionState;
    peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
  }
// @block:if--7f95485d-end
  logger.debug('Peer connection state changed:', peerConnection.connectionState);

// @block:if--7219a923
  if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
    logger.warn('Peer connection failed or disconnected. Attempting to reconnect...');
    connectionState = ConnectionState.DISCONNECTED;
    backgroundReconnect();
  } else if (peerConnection.connectionState === 'connected') {
    logger.debug('Peer connection established successfully');
    connectionState = ConnectionState.CONNECTED;
    reconnectAttempts = 0;
  }
// @block:if--7219a923-end
}
// @block:function-onConnectionStateChange-47150fac-end

// @block:function-startConnectionHealthCheck-0addda49
function startConnectionHealthCheck() {
  setInterval(() => {
// @block:if--76d1aed1
    if (peerConnection) {
// @block:if--dbb248cf
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        logger.warn('Connection health check detected disconnected state. Attempting to reconnect...');
        connectionState = ConnectionState.DISCONNECTED;
        backgroundReconnect();
      } else if (peerConnection.connectionState === 'connected') {
        const timeSinceLastConnection = Date.now() - lastConnectionTime; // @block:const-timeSinceLastConnection-bfc5d499
// @block:if--20b618cf
        if (timeSinceLastConnection > RECONNECTION_INTERVAL * 0.9) {
          logger.info('Approaching reconnection threshold. Initiating background reconnect.');
          backgroundReconnect();
        }
// @block:if--20b618cf-end
      }
// @block:if--dbb248cf-end
    }
// @block:if--76d1aed1-end
  }, 30000); // Check every 30 seconds
}
// @block:function-startConnectionHealthCheck-0addda49-end

// @block:function-onSignalingStateChange-b349cd4b
function onSignalingStateChange() {
  const { signaling: signalingStatusLabel } = getStatusLabels(); // @block:const-{-4e3e017e
// @block:if--84bb202b
  if (signalingStatusLabel) {
    signalingStatusLabel.innerText = peerConnection.signalingState;
    signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
  }
// @block:if--84bb202b-end
  logger.debug('Signaling state changed:', peerConnection.signalingState);
}
// @block:function-onSignalingStateChange-b349cd4b-end

// @block:function-onVideoStatusChange-1ec3c403
function onVideoStatusChange(videoIsPlaying, stream) {
  let status = videoIsPlaying ? 'streaming' : 'empty'; // @block:let-status-140da6f2

// @block:if--b9dabfcd
  if (status === lastVideoStatus) {
    logger.debug('Video status unchanged:', status);
    return;
  }
// @block:if--b9dabfcd-end

  logger.debug('Video status changing from', lastVideoStatus, 'to', status);

  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-8f5b729d
  const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-1b5d5a76

// @block:if--63379e61
  if (!streamVideoElement || !idleVideoElement) {
    logger.error('Video elements not found');
    return;
  }
// @block:if--63379e61-end

// @block:if--40141f2b
  if (status === 'streaming') {
    setStreamVideoElement(stream);
  } else {
    smoothTransition(false);
  }
// @block:if--40141f2b-end

  lastVideoStatus = status;

  const streamingStatusLabel = document.getElementById('streaming-status-label'); // @block:const-streamingStatusLabel-baad782e
// @block:if--9032bdce
  if (streamingStatusLabel) {
    streamingStatusLabel.innerText = status;
    streamingStatusLabel.className = 'streamingState-' + status;
  }
// @block:if--9032bdce-end

  logger.debug('Video status changed:', status);
}
// @block:function-onVideoStatusChange-1ec3c403-end

// @block:function-setStreamVideoElement-3c7b5d0e
function setStreamVideoElement(stream) {
  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-efe49438
// @block:if--cc864403
  if (!streamVideoElement) {
    logger.error('Stream video element not found');
    return;
  }
// @block:if--cc864403-end

  logger.debug('Setting stream video element');
// @block:if--356e6931
  if (stream instanceof MediaStream) {
    streamVideoElement.srcObject = stream;
  } else {
    logger.warn('Invalid stream provided to setStreamVideoElement');
    return;
  }
// @block:if--356e6931-end

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
// @block:function-setStreamVideoElement-3c7b5d0e-end

// @block:function-onStreamEvent-94a33ece
function onStreamEvent(message) {
// @block:if--c8c56721
  if (pcDataChannel.readyState === 'open') {
    let status; // @block:let-None-1a063b03
    const [event, _] = message.data.split(':'); // @block:const-[event,-7c67feb1

// @block:switch--122a037c
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
// @block:switch--122a037c-end

    // Set stream ready after a short delay, adjusting for potential timing differences between data and stream channels
// @block:if--458a6912
    if (status === 'ready') {
      setTimeout(() => {
        console.log('stream/ready');
        isStreamReady = true;
        const streamEventLabel = document.getElementById('stream-event-label'); // @block:const-streamEventLabel-798cd669
// @block:if--15b54f9b
        if (streamEventLabel) {
          streamEventLabel.innerText = 'ready';
          streamEventLabel.className = 'streamEvent-ready';
        }
// @block:if--15b54f9b-end
      }, 1000);
    } else {
      console.log(event);
      const streamEventLabel = document.getElementById('stream-event-label'); // @block:const-streamEventLabel-85334917
// @block:if--fc8f872d
      if (streamEventLabel) {
        streamEventLabel.innerText = status === 'dont-care' ? event : status;
        streamEventLabel.className = 'streamEvent-' + status;
      }
// @block:if--fc8f872d-end
    }
// @block:if--458a6912-end
  }
// @block:if--c8c56721-end
}
// @block:function-onStreamEvent-94a33ece-end

// @block:function-onTrack-1bc9c699
function onTrack(event) {
  logger.debug('onTrack event:', event);
// @block:if--6a0df7d6
  if (!event.track) {
    logger.warn('No track in onTrack event');
    return;
  }
// @block:if--6a0df7d6-end

// @block:if--8459a381
  if (statsIntervalId) {
    clearInterval(statsIntervalId);
  }
// @block:if--8459a381-end

  statsIntervalId = setInterval(async () => {
// @block:if--716435d4
    if (peerConnection && peerConnection.connectionState === 'connected') {
// @block:try-{-f401d9ea
      try {
        const stats = await peerConnection.getStats(event.track); // @block:const-stats-7e51f2c3
        let videoStatsFound = false; // @block:let-videoStatsFound-3f8f5a43
        stats.forEach((report) => {
// @block:if--a1a3fb8e
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            videoStatsFound = true;
            const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived; // @block:const-videoStatusChanged-20643b2c

            // logger.debug('Video stats:', {
            //  bytesReceived: report.bytesReceived,
            //  lastBytesReceived,
            //  videoIsPlaying,
            //  videoStatusChanged
            // });

// @block:if--f2dbf23c
            if (videoStatusChanged) {
              videoIsPlaying = report.bytesReceived > lastBytesReceived;
              logger.debug('Video status changed:', videoIsPlaying);
              onVideoStatusChange(videoIsPlaying, event.streams[0]);
            }
// @block:if--f2dbf23c-end
            lastBytesReceived = report.bytesReceived;
          }
// @block:if--a1a3fb8e-end
        });
// @block:if--c6dc490e
        if (!videoStatsFound) {
          logger.debug('No video stats found yet.');
        }
// @block:if--c6dc490e-end
      } catch (error) {
        logger.error('Error getting stats:', error);
      }
// @block:try-{-f401d9ea-end
    } else {
      logger.debug('Peer connection not ready for stats.');
    }
// @block:if--716435d4-end
  }, 250); // Check every 500ms

// @block:if--d2165f95
  if (event.streams && event.streams.length > 0) {
    const stream = event.streams[0]; // @block:const-stream-0c3fa0bb
// @block:if--eb7a62fe
    if (stream.getVideoTracks().length > 0) {
      logger.debug('Setting stream video element with track:', event.track.id);
      setStreamVideoElement(stream);
    } else {
      logger.warn('Stream does not contain any video tracks');
    }
// @block:if--eb7a62fe-end
  } else {
    logger.warn('No streams found in onTrack event');
  }
// @block:if--d2165f95-end

// @block:if--4cae5c64
  if (isDebugMode) {
    // downloadStreamVideo(event.streams[0]);
  }
// @block:if--4cae5c64-end
}
// @block:function-onTrack-1bc9c699-end

// @block:function-playIdleVideo-0238e30d
function playIdleVideo() {
  const { idle: idleVideoElement } = getVideoElements(); // @block:const-{-5afd664a
// @block:if--a8a260d6
  if (!idleVideoElement) {
    logger.error('Idle video element not found');
    return;
  }
// @block:if--a8a260d6-end

// @block:if--f7bd2784
  if (!currentAvatar || !avatars[currentAvatar]) {
    logger.warn(`No avatar selected or avatar ${currentAvatar} not found. Using default idle video.`);
    idleVideoElement.src = 'path/to/default/idle/video.mp4'; // Replace with your default video path
  } else {
    idleVideoElement.src = avatars[currentAvatar].silentVideoUrl;
  }
// @block:if--f7bd2784-end

  idleVideoElement.loop = true;

  idleVideoElement.onloadeddata = () => {
    logger.debug(`Idle video loaded successfully for ${currentAvatar || 'default'}`);
  };

  idleVideoElement.onerror = (e) => {
    logger.error(`Error loading idle video for ${currentAvatar || 'default'}:`, e);
  };

  idleVideoElement.play().catch((e) => logger.error('Error playing idle video:', e));
}
// @block:function-playIdleVideo-0238e30d-end

// @block:function-stopAllStreams-3f31ea78
function stopAllStreams() {
// @block:if--80bf5b34
  if (streamVideoElement && streamVideoElement.srcObject) {
    logger.debug('Stopping video streams');
    streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    streamVideoElement.srcObject = null;
  }
// @block:if--80bf5b34-end
}
// @block:function-stopAllStreams-3f31ea78-end

// @block:function-closePC-5069ec6d
function closePC(pc = peerConnection) {
// @block:if--97bb40b5
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
  const labels = getStatusLabels(); // @block:const-labels-39412b18
// @block:if--0bb5eecc
  if (labels.iceGathering) labels.iceGathering.innerText = '';
// @block:if--aa3f5026
  if (labels.signaling) labels.signaling.innerText = '';
// @block:if--e4634be6
  if (labels.ice) labels.ice.innerText = '';
// @block:if--8a085935
  if (labels.peer) labels.peer.innerText = '';
  logger.debug('Stopped peer connection');
// @block:if--e96e87ce
  if (pc === peerConnection) {
    peerConnection = null;
  }
// @block:if--e96e87ce-end
}
// @block:if--8a085935-end

async function fetchWithRetries(url, options, retries = 0, delayMs = 1000) {
// @block:try-{-c71665a0
  try {
    const now = Date.now(); // @block:const-now-68c0a4fa
    const timeSinceLastCall = now - lastApiCallTime; // @block:const-timeSinceLastCall-52718f29

// @block:if--e69843d8
    if (timeSinceLastCall < API_CALL_INTERVAL) {
      await new Promise((resolve) => setTimeout(resolve, API_CALL_INTERVAL - timeSinceLastCall));
    }
// @block:if--e69843d8-end

    lastApiCallTime = Date.now();

    const response = await fetch(url, options); // @block:const-response-15f5d931
// @block:if--3b8f1148
    if (!response.ok) {
// @block:if--76205e04
      if (response.status === 429) {
        // If rate limited, wait for a longer time before retrying
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10); // @block:const-retryAfter-b2b800b0
        logger.warn(`Rate limited. Retrying after ${retryAfter} seconds.`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        return fetchWithRetries(url, options, retries, delayMs);
      }
// @block:if--76205e04-end
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }
// @block:if--3b8f1148-end
    return response;
  } catch (err) {
// @block:if--86cac057
    if (retries < maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) * delayMs + Math.random() * 1000, maxDelaySec * 1000); // @block:const-delay-d95654c2
      logger.warn(`Request failed, retrying ${retries + 1}/${maxRetryCount} in ${delay}ms. Error: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetries(url, options, retries + 1, delayMs);
    } else {
      throw err;
    }
// @block:if--86cac057-end
  }
// @block:try-{-c71665a0-end
}
// @block:if--e4634be6-end

async function initializeConnection() {
// @block:if--16d67c4b
  if (isInitializing) {
    logger.warn('Connection initialization already in progress. Skipping initialize.');
    return;
  }
// @block:if--16d67c4b-end

  isInitializing = true;
  logger.info('Initializing connection...');

// @block:try-{-10c83bbf
  try {
    stopAllStreams();
    closePC();

// @block:if--e6eef47b
    if (!currentAvatar || !avatars[currentAvatar]) {
      throw new Error('No avatar selected or avatar not found');
    }
// @block:if--e6eef47b-end

    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, { // @block:const-sessionResponse-79dbe410
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

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json(); // @block:const-{-cb3af688

// @block:if--f56c024c
    if (!newStreamId || !newSessionId) {
      throw new Error('Failed to get valid stream ID or session ID from API');
    }
// @block:if--f56c024c-end

    streamId = newStreamId;
    sessionId = newSessionId;
    logger.info('Stream created:', { streamId, sessionId });

// @block:try-{-ecfe928f
    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
      logger.error('Error during streaming setup:', e);
      stopAllStreams();
      closePC();
      throw e;
    }
// @block:try-{-ecfe928f-end

    await new Promise((resolve) => setTimeout(resolve, 6000));

    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, { // @block:const-sdpResponse-2b3f3f4b
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

// @block:if--78c275cf
    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }
// @block:if--78c275cf-end

    logger.info('Connection initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize connection:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
// @block:try-{-10c83bbf-end
}
// @block:if--aa3f5026-end

async function startStreaming(assistantReply) {
// @block:try-{-a39a1610
  try {
    logger.debug('Starting streaming with reply:', assistantReply);
// @block:if--1e01e442
    if (!persistentStreamId || !persistentSessionId) {
      logger.error('Persistent stream not initialized. Cannot start streaming.');
      await initializePersistentStream();
    }
// @block:if--1e01e442-end

// @block:if--699b3c89
    if (!currentAvatar || !avatars[currentAvatar]) {
      logger.error('No avatar selected or avatar not found. Cannot start streaming.');
      return;
    }
// @block:if--699b3c89-end

    const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-f5529338
    const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-cc0af977

// @block:if--462921b8
    if (!streamVideoElement || !idleVideoElement) {
      logger.error('Video elements not found');
      return;
    }
// @block:if--462921b8-end

    // Remove outer <speak> tags if present
    let ssmlContent = assistantReply.trim(); // @block:let-ssmlContent-997e70da
// @block:if--7e6eb889
    if (ssmlContent.startsWith('<speak>') && ssmlContent.endsWith('</speak>')) {
      ssmlContent = ssmlContent.slice(7, -8).trim();
    }
// @block:if--7e6eb889-end

    // Split the SSML content into chunks, respecting SSML tags
    const chunks = ssmlContent.match(/(?:<[^>]+>|[^<]+)+/g) || []; // @block:const-chunks-503c06d9

    logger.debug('Chunks', chunks);

// @block:for--14885cf1
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim(); // @block:const-chunk-c94744c8
// @block:if--54d099d3
      if (chunk.length === 0) continue;

      isAvatarSpeaking = true;
      const playResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}`, { // @block:const-playResponse-6c7a04e2
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

// @block:if--d4cbfc72
      if (!playResponse.ok) {
        throw new Error(`HTTP error! status: ${playResponse.status}`);
      }
// @block:if--d4cbfc72-end

      const playResponseData = await playResponse.json(); // @block:const-playResponseData-afd24eed
      logger.debug('Streaming response:', playResponseData);

// @block:if--226ad588
      if (playResponseData.status === 'started') {
        logger.debug('Stream chunk started successfully');

// @block:if--dd1ae347
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
// @block:if--dd1ae347-end
      } else {
        logger.warn('Unexpected response status:', playResponseData.status);
      }
// @block:if--226ad588-end
    }
// @block:if--54d099d3-end

    isAvatarSpeaking = false;
    smoothTransition(false);

    // Check if we need to reconnect
// @block:if--6f39163f
    if (shouldReconnect()) {
      logger.info('Approaching reconnection threshold. Initiating background reconnect.');
      await backgroundReconnect();
    }
// @block:if--6f39163f-end
  } catch (error) {
    logger.error('Error during streaming:', error);
// @block:if--8f2bb322
    if (error.message.includes('HTTP error! status: 404') || error.message.includes('missing or invalid session_id')) {
      logger.warn('Stream not found or invalid session. Attempting to reinitialize persistent stream.');
      await reinitializePersistentStream();
    }
// @block:if--8f2bb322-end
  }
// @block:for--14885cf1-end
}
// @block:try-{-a39a1610-end

export function toggleSimpleMode() { // @block:export-None-a7d09d1a
  const content = document.getElementById('content'); // @block:const-content-a49ef9cb
  const videoWrapper = document.getElementById('video-wrapper'); // @block:const-videoWrapper-ef8eb199
  const simpleModeButton = document.getElementById('simple-mode-button'); // @block:const-simpleModeButton-e75ce0f3
  const header = document.querySelector('.header'); // @block:const-header-1ed7b272
  const autoSpeakToggle = document.getElementById('auto-speak-toggle'); // @block:const-autoSpeakToggle-5dffe054
  const startButton = document.getElementById('start-button'); // @block:const-startButton-7a147485

// @block:if--e77006ed
  if (content.style.display !== 'none') {
    // Entering simple mode
    content.style.display = 'none';
// @block:document.body.appendChild(videoWrapper);-None-de3de331
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
// @block:if--49e0a15e
    if (autoSpeakToggle.textContent.includes('Off')) {
      autoSpeakToggle.click();
    }
// @block:if--49e0a15e-end

    // Start recording if it's not already recording
// @block:if--502a2317
    if (startButton.textContent === 'Speak') {
      startButton.click();
    }
// @block:if--502a2317-end
  } else {
    // Exiting simple mode
    content.style.display = 'flex';
    const leftColumn = document.getElementById('left-column'); // @block:const-leftColumn-d9a01436
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
// @block:if--9c1dec82
    if (autoSpeakToggle.textContent.includes('On')) {
      autoSpeakToggle.click();
    }
// @block:if--9c1dec82-end

    // Stop recording
// @block:if--d7486ee0
    if (startButton.textContent === 'Stop') {
      startButton.click();
    }
// @block:if--d7486ee0-end
  }
// @block:document.body.appendChild(videoWrapper);-None-de3de331-end
}
// @block:if--e77006ed-end

// @block:function-startSendingAudioData-27d8aff8
function startSendingAudioData() {
  logger.debug('Starting to send audio data...');

  let packetCount = 0; // @block:let-packetCount-e563a141
  let totalBytesSent = 0; // @block:let-totalBytesSent-b985b98e

  audioWorkletNode.port.onmessage = (event) => {
    const audioData = event.data; // @block:const-audioData-1243d047

// @block:if--5681fc6b
    if (!(audioData instanceof ArrayBuffer)) {
      logger.warn('Received non-ArrayBuffer data from AudioWorklet:', typeof audioData);
      return;
    }
// @block:if--5681fc6b-end

// @block:if--1bf57ceb
    if (deepgramConnection && deepgramConnection.getReadyState() === WebSocket.OPEN) {
// @block:try-{-aabcfa23
      try {
        deepgramConnection.send(audioData);
        packetCount++;
        totalBytesSent += audioData.byteLength;

// @block:if--f1a0ae0d
        if (packetCount % 100 === 0) {
          logger.debug(`Sent ${packetCount} audio packets to Deepgram. Total bytes: ${totalBytesSent}`);
        }
// @block:if--f1a0ae0d-end
      } catch (error) {
        logger.error('Error sending audio data to Deepgram:', error);
      }
// @block:try-{-aabcfa23-end
    } else {
      logger.warn(
        'Deepgram connection not open, cannot send audio data. ReadyState:',
        deepgramConnection ? deepgramConnection.getReadyState() : 'undefined',
      );
    }
// @block:if--1bf57ceb-end
  };

  logger.debug('Audio data sending setup complete');
}
// @block:function-startSendingAudioData-27d8aff8-end

// @block:function-handleTranscription-2c28e31e
function handleTranscription(data) {
// @block:if--539fe5d3
  if (!isRecording) return;

  const transcript = data.channel.alternatives[0].transcript; // @block:const-transcript-6c375090
// @block:if--2a8e214d
  if (data.is_final) {
    logger.debug('Final transcript:', transcript);
// @block:if--b7ba72ad
    if (transcript.trim()) {
      currentUtterance += transcript + ' ';
      updateTranscript(currentUtterance.trim(), true);
      chatHistory.push({
        role: 'user',
        content: currentUtterance.trim(),
      });
      sendChatToGroq();
    }
// @block:if--b7ba72ad-end
    currentUtterance = '';
    interimMessageAdded = false;
  } else {
    logger.debug('Interim transcript:', transcript);
    updateTranscript(currentUtterance + transcript, false);
  }
// @block:if--2a8e214d-end
}
// @block:if--539fe5d3-end

async function startRecording() {
// @block:if--9af05059
  if (isRecording) {
    logger.warn('Recording is already in progress. Stopping current recording.');
    await stopRecording();
    return;
  }
// @block:if--9af05059-end

  logger.debug('Starting recording process...');

  currentUtterance = '';
  interimMessageAdded = false;

// @block:try-{-844fa638
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // @block:const-stream-349c61b6
    logger.info('Microphone stream obtained');

    audioContext = new AudioContext();
    logger.debug('Audio context created. Sample rate:', audioContext.sampleRate);

    await audioContext.audioWorklet.addModule('audio-processor.js');
    logger.debug('Audio worklet module added successfully');

    const source = audioContext.createMediaStreamSource(stream); // @block:const-source-78dba922
    logger.debug('Media stream source created');

    audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
    logger.debug('Audio worklet node created');

    source.connect(audioWorkletNode);
    logger.debug('Media stream source connected to audio worklet node');

    const deepgramOptions = { // @block:const-deepgramOptions-f8ac8fd3
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
// @block:if--5ff66797
    if (autoSpeakMode) {
      autoSpeakInProgress = true;
    }
// @block:if--5ff66797-end
    const startButton = document.getElementById('start-button'); // @block:const-startButton-f344f51f
    startButton.textContent = 'Stop';

    logger.debug('Recording and transcription started successfully');
  } catch (error) {
    logger.error('Error starting recording:', error);
    isRecording = false;
    const startButton = document.getElementById('start-button'); // @block:const-startButton-02749b76
    startButton.textContent = 'Speak';
    showErrorMessage('Failed to start recording. Please try again.');
    throw error;
  }
// @block:try-{-844fa638-end
}
// @block:function-handleTranscription-2c28e31e-end

// @block:function-handleDeepgramError-600b16ea
function handleDeepgramError(err) {
  logger.error('Deepgram error:', err);
  isRecording = false;
  const startButton = document.getElementById('start-button'); // @block:const-startButton-e63d7344
  startButton.textContent = 'Speak';

  // Attempt to close the connection and clean up
// @block:if--3deb7830
  if (deepgramConnection) {
// @block:try-{-8da7913a
    try {
      deepgramConnection.finish();
    } catch (closeError) {
      logger.warn('Error while closing Deepgram connection:', closeError);
    }
// @block:try-{-8da7913a-end
  }
// @block:if--3deb7830-end

// @block:if--e87dac4d
  if (audioContext) {
    audioContext.close().catch((closeError) => {
      logger.warn('Error while closing AudioContext:', closeError);
    });
  }
// @block:if--e87dac4d-end
}
// @block:function-handleDeepgramError-600b16ea-end

// @block:function-handleUtteranceEnd-a2635e87
function handleUtteranceEnd(data) {
// @block:if--22935be6
  if (!isRecording) return;

  logger.debug('Utterance end detected:', data);
// @block:if--50d9682a
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
// @block:if--50d9682a-end
}
// @block:if--22935be6-end

async function stopRecording() {
// @block:if--da5630d9
  if (isRecording) {
    logger.info('Stopping recording...');

// @block:if--b62dccc9
    if (audioContext) {
      await audioContext.close();
      logger.debug('AudioContext closed');
    }
// @block:if--b62dccc9-end

// @block:if--c9f216e4
    if (deepgramConnection) {
      deepgramConnection.finish();
      logger.debug('Deepgram connection finished');
    }
// @block:if--c9f216e4-end

    isRecording = false;
    autoSpeakInProgress = false;
    const startButton = document.getElementById('start-button'); // @block:const-startButton-4dcff10e
    startButton.textContent = 'Speak';

    logger.debug('Recording and transcription stopped');
  }
// @block:if--da5630d9-end
}
// @block:function-handleUtteranceEnd-a2635e87-end

async function sendChatToGroq() {
// @block:if--9c06ed37
  if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1].content.trim() === '') {
    logger.debug('No new content to send to Groq. Skipping request.');
    return;
  }
// @block:if--9c06ed37-end

  logger.debug('Sending chat to Groq...');
// @block:try-{-f98747ea
  try {
    const startTime = Date.now(); // @block:const-startTime-d2b4a647
    const currentContext = document.getElementById('context-input').value.trim(); // @block:const-currentContext-52b26e66
    const requestBody = { // @block:const-requestBody-c0ce60cc
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

    const response = await fetch('/chat', { // @block:const-response-834daee8
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    logger.debug('Groq response status:', response.status);

// @block:if--1be87497
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
// @block:if--1be87497-end

    const reader = response.body.getReader(); // @block:const-reader-0e1b66e0
    let assistantReply = ''; // @block:let-assistantReply-57caac9a
    let done = false; // @block:let-done-be672f4a

    const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-5d32795d
    const assistantSpan = document.createElement('span'); // @block:const-assistantSpan-2681f026
    assistantSpan.innerHTML = '<u>Assistant:</u> ';
    msgHistory.appendChild(assistantSpan);
    msgHistory.appendChild(document.createElement('br'));

// @block:while--eb2e4daa
    while (!done) {
      const { value, done: readerDone } = await reader.read(); // @block:const-{-6e85ff35
// @block:done-=-861e5bfb
      done = readerDone;

// @block:if--2eaada78
      if (value) {
        const chunk = new TextDecoder().decode(value); // @block:const-chunk-56a6be81
        logger.debug('Received chunk:', chunk);
        const lines = chunk.split('\n'); // @block:const-lines-9ccbaffb

// @block:for--30e6d78f
        for (const line of lines) {
// @block:if--a47bfe59
          if (line.startsWith('data:')) {
            const data = line.substring(5).trim(); // @block:const-data-3e416070
// @block:if--18dd7496
            if (data === '[DONE]') {
// @block:done-=-a4dcd6e6
              done = true;
              break;
            }
// @block:done-=-a4dcd6e6-end

// @block:try-{-4a3460f1
            try {
              const parsed = JSON.parse(data); // @block:const-parsed-8be29eac
              const content = parsed.choices[0]?.delta?.content || ''; // @block:const-content-dd0f307e
              assistantReply += content;
              assistantSpan.innerHTML += content;
              logger.debug('Parsed content:', content);
            } catch (error) {
              logger.error('Error parsing JSON:', error);
            }
// @block:try-{-4a3460f1-end
          }
// @block:if--18dd7496-end
        }
// @block:if--a47bfe59-end

        msgHistory.scrollTop = msgHistory.scrollHeight;
      }
// @block:for--30e6d78f-end
    }
// @block:if--2eaada78-end

    const endTime = Date.now(); // @block:const-endTime-0d5fcb3f
    const processingTime = endTime - startTime; // @block:const-processingTime-0063190c
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
    const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-95eb4e2d
    msgHistory.innerHTML += `<span><u>Assistant:</u> I'm sorry, I encountered an error. Could you please try again?</span><br>`;
    msgHistory.scrollTop = msgHistory.scrollHeight;
  }
// @block:done-=-861e5bfb-end
}
// @block:while--eb2e4daa-end

// @block:function-toggleAutoSpeak-02cdb047
function toggleAutoSpeak() {
  autoSpeakMode = !autoSpeakMode;
  const toggleButton = document.getElementById('auto-speak-toggle'); // @block:const-toggleButton-da069dda
  const startButton = document.getElementById('start-button'); // @block:const-startButton-6bd5483b
  toggleButton.textContent = `Auto-Speak: ${autoSpeakMode ? 'On' : 'Off'}`;
// @block:if--79326bea
  if (autoSpeakMode) {
    startButton.textContent = 'Stop';
// @block:if--f09a6ca6
    if (!isRecording) {
      startRecording();
    }
// @block:if--f09a6ca6-end
  } else {
    startButton.textContent = isRecording ? 'Stop' : 'Speak';
// @block:if--281c689b
    if (isRecording) {
      stopRecording();
    }
// @block:if--281c689b-end
  }
// @block:if--79326bea-end
}
// @block:function-toggleAutoSpeak-02cdb047-end

async function reinitializeConnection() {
// @block:if--3b614824
  if (connectionState === ConnectionState.RECONNECTING) {
    logger.warn('Connection reinitialization already in progress. Skipping reinitialize.');
    return;
  }
// @block:if--3b614824-end

  connectionState = ConnectionState.RECONNECTING;
  logger.debug('Reinitializing connection...');

// @block:try-{-edc45473
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

    const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-5609894d
    msgHistory.innerHTML = '';
    chatHistory = [];

    // Reset video elements
    const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-9e174f10
    const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-5bd62c14
// @block:if--54e30c00
    if (streamVideoElement) streamVideoElement.srcObject = null;
// @block:if--64354899
    if (idleVideoElement) idleVideoElement.style.display = 'block';

    // Add a delay before initializing to avoid rapid successive calls
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await initializePersistentStream();

// @block:if--8818508c
    if (!persistentStreamId || !persistentSessionId) {
      throw new Error('Persistent Stream ID or Session ID is missing after initialization');
    }
// @block:if--8818508c-end

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
// @block:if--64354899-end
}
// @block:if--54e30c00-end

async function cleanupOldStream() {
  logger.debug('Cleaning up old stream...');

// @block:try-{-51130d6e
  try {
// @block:if--b9ac00a1
    if (peerConnection) {
      peerConnection.close();
    }
// @block:if--b9ac00a1-end

// @block:if--6f96478e
    if (pcDataChannel) {
      pcDataChannel.close();
    }
// @block:if--6f96478e-end

    // Stop all tracks in the streamVideoElement
// @block:if--53e4d815
    if (streamVideoElement && streamVideoElement.srcObject) {
      streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    }
// @block:if--53e4d815-end

    // Clear any ongoing intervals or timeouts
    clearInterval(statsIntervalId);
    clearTimeout(inactivityTimeout);
    clearInterval(keepAliveInterval);

    logger.debug('Old stream cleaned up successfully');
  } catch (error) {
    logger.error('Error cleaning up old stream:', error);
  }
// @block:try-{-51130d6e-end
}
// @block:try-{-edc45473-end

const connectButton = document.getElementById('connect-button'); // @block:const-connectButton-732f04a0
connectButton.onclick = initializeConnection;

const destroyButton = document.getElementById('destroy-button'); // @block:const-destroyButton-d4d90c1d
destroyButton.onclick = async () => {
// @block:try-{-bb8921d6
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
// @block:try-{-bb8921d6-end
};

const startButton = document.getElementById('start-button'); // @block:const-startButton-1e8a502f

startButton.onclick = async () => {
  logger.info('Start button clicked. Current state:', isRecording ? 'Recording' : 'Not recording');
// @block:if--4b290aae
  if (!isRecording) {
// @block:try-{-1e780985
    try {
      await startRecording();
    } catch (error) {
      logger.error('Failed to start recording:', error);
      showErrorMessage('Failed to start recording. Please try again.');
    }
// @block:try-{-1e780985-end
  } else {
    await stopRecording();
  }
// @block:if--4b290aae-end
};

const saveAvatarButton = document.getElementById('save-avatar-button'); // @block:const-saveAvatarButton-52c24a49
saveAvatarButton.onclick = saveAvatar;

const avatarImageInput = document.getElementById('avatar-image'); // @block:const-avatarImageInput-ca08aee5
avatarImageInput.onchange = (event) => {
  const file = event.target.files[0]; // @block:const-file-61485227
// @block:if--b3518537
  if (file) {
    const reader = new FileReader(); // @block:const-reader-964470a6
    reader.onload = (e) => {
// @block:document.getElementById('avatar-image-preview').src-=-c08894f5
      document.getElementById('avatar-image-preview').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
// @block:document.getElementById('avatar-image-preview').src-=-c08894f5-end
};

// Export functions and variables that need to be accessed from other modules
export { // @block:export-None-41a57627
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

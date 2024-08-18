'use strict';
import DID_API from './api.js'; // @block:import-None-ad008c67
import logger from './logger.js'; // @block:import-None-e4cc516d
const { createClient, LiveTranscriptionEvents } = deepgram; // @block:const-{-027be88a

const deepgramClient = createClient(DID_API.deepgramKey); // @block:const-deepgramClient-f2e7ded9

const RTCPeerConnection = ( // @block:const-RTCPeerConnection-4ddd83f2
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
).bind(window);

let peerConnection; // @block:let-None-12c9ddec
let pcDataChannel; // @block:let-None-e20824c5
let streamId; // @block:let-None-2ede47d2
let sessionId; // @block:let-None-2564fc7c
let sessionClientAnswer; // @block:let-None-603ea2a7
let statsIntervalId; // @block:let-None-754050ef
let videoIsPlaying; // @block:let-None-1874fbaf
let lastBytesReceived; // @block:let-None-53f6a22b
let chatHistory = []; // @block:let-chatHistory-981035a7
let inactivityTimeout; // @block:let-None-d772837d
let keepAliveInterval; // @block:let-None-9834f2d3
let socket; // @block:let-None-0d63b6d9
let isInitializing = false; // @block:let-isInitializing-62365b97
let audioContext; // @block:let-None-fe75056a
let streamVideoElement; // @block:let-None-12e47e9a
let idleVideoElement; // @block:let-None-121fbbaf
let deepgramConnection; // @block:let-None-676c1bba
let isRecording = false; // @block:let-isRecording-7bb61f44
let audioWorkletNode; // @block:let-None-2809a7a2
let currentUtterance = ''; // @block:let-currentUtterance-9dd618dc
let interimMessageAdded = false; // @block:let-interimMessageAdded-710479ab
let autoSpeakMode = true; // @block:let-autoSpeakMode-4566e3f5
let transitionCanvas; // @block:let-None-2a330a2d
let transitionCtx; // @block:let-None-a5c8e5ee
let isDebugMode = false; // @block:let-isDebugMode-e13816f8
let isTransitioning = false; // @block:let-isTransitioning-fe0522cb
let lastVideoStatus = null; // @block:let-lastVideoStatus-bd1c6873
let isCurrentlyStreaming = false; // @block:let-isCurrentlyStreaming-3afaf8b8
let reconnectAttempts = 10; // @block:let-reconnectAttempts-cdd1cbf8
let persistentStreamId = null; // @block:let-persistentStreamId-5c1f3ed6
let persistentSessionId = null; // @block:let-persistentSessionId-c8a1cd1f
let isPersistentStreamActive = false; // @block:let-isPersistentStreamActive-2a8faa45
const API_RATE_LIMIT = 40; // Maximum number of calls per minute // @block:const-API_RATE_LIMIT-51bcf24f
const API_CALL_INTERVAL = 30000 / API_RATE_LIMIT; // Minimum time between API calls in milliseconds // @block:const-API_CALL_INTERVAL-1896a2c2
let lastApiCallTime = 0; // @block:let-lastApiCallTime-ccf06f49
const maxRetryCount = 10; // @block:const-maxRetryCount-0a526f22
const maxDelaySec = 100; // @block:const-maxDelaySec-68bb0670
const RECONNECTION_INTERVAL = 100000; // 25 seconds for testing, adjust as needed // @block:const-RECONNECTION_INTERVAL-62bcf2d0
let isAvatarSpeaking = false; // @block:let-isAvatarSpeaking-9ee418ef
const MAX_RECONNECT_ATTEMPTS = 10; // @block:const-MAX_RECONNECT_ATTEMPTS-550799cc
const INITIAL_RECONNECT_DELAY = 2000; // 1 second // @block:const-INITIAL_RECONNECT_DELAY-f648b86e
const MAX_RECONNECT_DELAY = 90000; // 30 seconds // @block:const-MAX_RECONNECT_DELAY-e3b485aa
let autoSpeakInProgress = false; // @block:let-autoSpeakInProgress-63bdff9d

const ConnectionState = { // @block:const-ConnectionState-81aea2b7
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
};

let lastConnectionTime = Date.now(); // @block:let-lastConnectionTime-4b911691

let connectionState = ConnectionState.DISCONNECTED; // @block:let-connectionState-6a0c6938

export function setLogLevel(level) { // @block:export-None-c01d2be8
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}

let avatars = {}; // @block:let-avatars-b48c77cd
let currentAvatar = ''; // @block:let-currentAvatar-e81264e6

const avatarSelect = document.getElementById('avatar-select'); // @block:const-avatarSelect-9f83217b
avatarSelect.addEventListener('change', handleAvatarChange);

let context = ` // @block:let-context-7a4d9924

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
// @block:if--28eb816b
  if (!streamId || !sessionId) {
    throw new Error('Stream ID or Session ID is missing. Cannot prepare for streaming.');
  }
// @block:if--28eb816b-end

  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-107d7bc2
  const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-c382e42b

// @block:if--7232e004
  if (!streamVideoElement || !idleVideoElement) {
    throw new Error('Video elements not found');
  }
// @block:if--7232e004-end

  // Reset video elements
  streamVideoElement.srcObject = null;
  streamVideoElement.src = '';
  streamVideoElement.style.display = 'none';

  idleVideoElement.style.display = 'block';
  idleVideoElement.play().catch((e) => logger.error('Error playing idle video:', e));

  logger.debug('Prepared for streaming');
}

// @block:function-initializeTransitionCanvas-784cf126
function initializeTransitionCanvas() {
  const videoWrapper = document.querySelector('#video-wrapper'); // @block:const-videoWrapper-aea71e18
  const rect = videoWrapper.getBoundingClientRect(); // @block:const-rect-2331e3f5
  const size = Math.min(rect.width, rect.height, 550); // @block:const-size-f51516fe

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
    const videoWrapper = document.querySelector('#video-wrapper'); // @block:const-videoWrapper-bbc3e910
    const rect = videoWrapper.getBoundingClientRect(); // @block:const-rect-de10aeb8
    const size = Math.min(rect.width, rect.height, 550); // @block:const-size-b990b48a

    transitionCanvas.width = size;
    transitionCanvas.height = size;
  });
}
// @block:function-initializeTransitionCanvas-784cf126-end

// @block:function-smoothTransition-e79848f8
function smoothTransition(toStreaming, duration = 250) {
  const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-ada1eb67
  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-2cc7c2f7

// @block:if--ba628861
  if (!idleVideoElement || !streamVideoElement) {
    logger.warn('Video elements not found for transition');
    return;
  }
// @block:if--ba628861-end

// @block:if--a0efa830
  if (isTransitioning) {
    logger.debug('Transition already in progress, skipping');
    return;
  }
// @block:if--a0efa830-end

  // Don't transition if we're already in the desired state
// @block:if--a5f74984
  if ((toStreaming && isCurrentlyStreaming) || (!toStreaming && !isCurrentlyStreaming)) {
    logger.debug('Already in desired state, skipping transition');
    return;
  }
// @block:if--a5f74984-end

  isTransitioning = true;
  logger.debug(`Starting smooth transition to ${toStreaming ? 'streaming' : 'idle'} state`);

  let startTime = null; // @block:let-startTime-5935d2a2

// @block:function-animate-96622fe2
  function animate(currentTime) {
// @block:if--ce852271
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime; // @block:const-elapsed-84063803
    const progress = Math.min(elapsed / duration, 1); // @block:const-progress-a38678c4

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

// @block:if--2941bd3c
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Ensure final state is set correctly
// @block:if--a85354b5
      if (toStreaming) {
        streamVideoElement.style.display = 'block';
        idleVideoElement.style.display = 'none';
      } else {
        streamVideoElement.style.display = 'none';
        idleVideoElement.style.display = 'block';
      }
// @block:if--a85354b5-end
      isTransitioning = false;
      isCurrentlyStreaming = toStreaming;
      transitionCanvas.style.display = 'none';
      logger.debug('Smooth transition completed');
    }
// @block:if--2941bd3c-end
  }
// @block:if--ce852271-end

  // Show the transition canvas
  transitionCanvas.style.display = 'block';

  // Start the animation
  requestAnimationFrame(animate);
}
// @block:function-animate-96622fe2-end

// @block:function-getVideoElements-8fe9bae4
function getVideoElements() {
  const idle = document.getElementById('idle-video-element'); // @block:const-idle-32a9a6ef
  const stream = document.getElementById('stream-video-element'); // @block:const-stream-ba7f6403

// @block:if--5b3b4856
  if (!idle || !stream) {
    logger.warn('Video elements not found in the DOM');
  }
// @block:if--5b3b4856-end

  return { idle, stream };
}
// @block:function-getVideoElements-8fe9bae4-end

// @block:function-getStatusLabels-1e445808
function getStatusLabels() {
  return {
    peer: document.getElementById('peer-status-label'),
    ice: document.getElementById('ice-status-label'),
    iceGathering: document.getElementById('ice-gathering-status-label'),
    signaling: document.getElementById('signaling-status-label'),
    streaming: document.getElementById('streaming-status-label'),
  };
}
// @block:function-getStatusLabels-1e445808-end

// @block:function-initializeWebSocket-a23343df
function initializeWebSocket() {
  socket = new WebSocket(`wss://${window.location.host}`);

  socket.onopen = () => {
    logger.info('WebSocket connection established');
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data); // @block:const-data-c523d3ca
    logger.debug('Received WebSocket message:', data);

// @block:switch--6e16bc50
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
// @block:switch--6e16bc50-end
  };

  socket.onerror = (error) => {
    logger.error('WebSocket error:', error);
  };

  socket.onclose = () => {
    logger.info('WebSocket connection closed');
    setTimeout(initializeWebSocket, 10000);
  };
}
// @block:function-initializeWebSocket-a23343df-end

// @block:function-updateTranscript-ab473dd8
function updateTranscript(text, isFinal) {
  const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-9b5fe78e
  let interimSpan = msgHistory.querySelector('span[data-interim]'); // @block:let-interimSpan-362eb981

// @block:if--ec0e595c
  if (isFinal) {
// @block:if--6ef646d2
    if (interimSpan) {
      interimSpan.remove();
    }
// @block:if--6ef646d2-end
    msgHistory.innerHTML += `<span><u>User:</u> ${text}</span><br>`;
    logger.debug('Final transcript added to chat history:', text);
    interimMessageAdded = false;
  } else {
// @block:if--9f5b69a9
    if (text.trim()) {
// @block:if--464fe6f8
      if (!interimMessageAdded) {
        msgHistory.innerHTML += `<span data-interim style='opacity:0.5'><u>User (interim):</u> ${text}</span><br>`;
        interimMessageAdded = true;
      } else if (interimSpan) {
        interimSpan.innerHTML = `<u>User (interim):</u> ${text}`;
      }
// @block:if--464fe6f8-end
    }
// @block:if--9f5b69a9-end
  }
// @block:if--ec0e595c-end
  msgHistory.scrollTop = msgHistory.scrollHeight;
}
// @block:function-updateTranscript-ab473dd8-end

// @block:function-handleTextInput-c98915c6
function handleTextInput(text) {
// @block:if--c0490fe2
  if (text.trim() === '') return;

  const textInput = document.getElementById('text-input'); // @block:const-textInput-8bac208c
  textInput.value = '';

  updateTranscript(text, true);

  chatHistory.push({
    role: 'user',
    content: text,
  });

  sendChatToGroq();
}
// @block:if--c0490fe2-end

// @block:function-updateAssistantReply-781cd98d
function updateAssistantReply(text) {
// @block:document.getElementById('msgHistory').innerHTML-+=-26a056a9
  document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${text}</span><br>`;
}
// @block:document.getElementById('msgHistory').innerHTML-+=-26a056a9-end

async function initializePersistentStream() {
  logger.info('Initializing persistent stream...');
  connectionState = ConnectionState.CONNECTING;

// @block:try-{-0bd008ad
  try {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, { // @block:const-sessionResponse-3ede0141
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

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json(); // @block:const-{-4969c501

    persistentStreamId = newStreamId;
    persistentSessionId = newSessionId;

    logger.info('Persistent stream created:', { persistentStreamId, persistentSessionId });

// @block:try-{-0a480c4f
    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
      logger.error('Error during streaming setup:', e);
      stopAllStreams();
      closePC();
      throw e;
    }
// @block:try-{-0a480c4f-end

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}/sdp`, { // @block:const-sdpResponse-8988e08d
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

// @block:if--54d6a0f5
    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }
// @block:if--54d6a0f5-end
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
// @block:try-{-0bd008ad-end
}
// @block:function-updateAssistantReply-781cd98d-end

// @block:function-shouldReconnect-66e5bac1
function shouldReconnect() {
  const timeSinceLastConnection = Date.now() - lastConnectionTime; // @block:const-timeSinceLastConnection-f29fc890
  return timeSinceLastConnection > RECONNECTION_INTERVAL * 0.9;
}
// @block:function-shouldReconnect-66e5bac1-end

// @block:function-scheduleReconnect-7746146e
function scheduleReconnect() {
// @block:if--70922e25
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    logger.error('Max reconnection attempts reached. Please refresh the page.');
    showErrorMessage('Failed to reconnect after multiple attempts. Please refresh the page.');
    return;
  }
// @block:if--70922e25-end

  const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY); // @block:const-delay-620ab036
  logger.debug(`Scheduling reconnection attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
  setTimeout(backgroundReconnect, delay);
  reconnectAttempts++;
}
// @block:function-scheduleReconnect-7746146e-end

// @block:function-startKeepAlive-74fae91e
function startKeepAlive() {
// @block:if--c4fee447
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
// @block:if--c4fee447-end

  keepAliveInterval = setInterval(() => {
// @block:if--d5530c8c
    if (isPersistentStreamActive && peerConnection && peerConnection.connectionState === 'connected' && pcDataChannel) {
// @block:try-{-1caba4cf
      try {
        const keepAliveMessage = JSON.stringify({ type: 'KeepAlive' }); // @block:const-keepAliveMessage-6c437e46
// @block:if--0cbd18a6
        if (pcDataChannel.readyState === 'open') {
          pcDataChannel.send(keepAliveMessage);
          logger.debug('Keepalive message sent successfully');
        } else {
          logger.warn('Data channel is not open. Current state:', pcDataChannel.readyState);
        }
// @block:if--0cbd18a6-end
      } catch (error) {
        logger.warn('Error sending keepalive message:', error);
      }
// @block:try-{-1caba4cf-end
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
// @block:if--d5530c8c-end
  }, 30000); // Send keepalive every 30 seconds
}
// @block:function-startKeepAlive-74fae91e-end

async function destroyPersistentStream() {
// @block:if--ebcf3c0c
  if (persistentStreamId) {
// @block:try-{-8b8eb701
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
// @block:if--7eeee348
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
// @block:if--7eeee348-end
      connectionState = ConnectionState.DISCONNECTED;
    }
// @block:try-{-8b8eb701-end
  }
// @block:if--ebcf3c0c-end
}
// @block:function-handleTextInput-c98915c6-end

async function reinitializePersistentStream() {
  logger.info('Reinitializing persistent stream...');
  await destroyPersistentStream();
  await initializePersistentStream();
}
// @block:function-smoothTransition-e79848f8-end

async function createNewPersistentStream() {
  logger.debug('Creating new persistent stream...');

// @block:try-{-54983c38
  try {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, { // @block:const-sessionResponse-de457640
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

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json(); // @block:const-{-742e08cc

    logger.debug('New stream created:', { newStreamId, newSessionId });

    const newSessionClientAnswer = await createPeerConnection(offer, iceServers); // @block:const-newSessionClientAnswer-ce413740

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${newStreamId}/sdp`, { // @block:const-sdpResponse-efe0ea80
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

// @block:if--ebcd01de
    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }
// @block:if--ebcd01de-end

    return { streamId: newStreamId, sessionId: newSessionId };
  } catch (error) {
    logger.error('Error creating new persistent stream:', error);
    return null;
  }
// @block:try-{-54983c38-end
}

async function backgroundReconnect() {
// @block:if--9787f435
  if (connectionState === ConnectionState.RECONNECTING) {
    logger.debug('Background reconnection already in progress. Skipping.');
    return;
  }
// @block:if--9787f435-end

  connectionState = ConnectionState.RECONNECTING;
  logger.debug('Starting background reconnection process...');

// @block:try-{-f015024b
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
// @block:try-{-f015024b-end
}

// @block:function-waitForIdleState-eba46261
function waitForIdleState() {
  return new Promise((resolve) => {
    const checkIdleState = () => { // @block:const-checkIdleState-9deefe34
// @block:if--146ca637
      if (!isAvatarSpeaking) {
        resolve();
      } else {
        setTimeout(checkIdleState, 500); // Check every 500ms
      }
// @block:if--146ca637-end
    };
    checkIdleState();
  });
}
// @block:function-waitForIdleState-eba46261-end

async function switchToNewStream(newStreamData) {
  logger.debug('Switching to new stream...');

// @block:try-{-6cb40a61
  try {
    connectionState = ConnectionState.RECONNECTING;

    // Quickly switch the video source to the new stream
// @block:if--c3697795
    if (streamVideoElement) {
      // Instead of directly setting src, we need to update the WebRTC connection
      await updateWebRTCConnection(newStreamData);
    }
// @block:if--c3697795-end

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
// @block:try-{-6cb40a61-end
}

async function updateWebRTCConnection(newStreamData) {
  logger.debug('Updating WebRTC connection...');

// @block:try-{-6a969b5b
  try {
    const offer = await fetchStreamOffer(newStreamData.streamId); // @block:const-offer-3b285f6e
    const iceServers = await fetchIceServers(); // @block:const-iceServers-c2aa94fb

    const newSessionClientAnswer = await createPeerConnection(offer, iceServers); // @block:const-newSessionClientAnswer-a73261ff

    await sendSDPAnswer(newStreamData.streamId, newStreamData.sessionId, newSessionClientAnswer);

    logger.debug('WebRTC connection updated successfully');
  } catch (error) {
    logger.error('Error updating WebRTC connection:', error);
    throw error;
  }
// @block:try-{-6a969b5b-end
}

async function fetchStreamOffer(streamId) {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/offer`, { // @block:const-response-e76184cc
    method: 'GET',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
    },
  });
  const data = await response.json(); // @block:const-data-630ae88c
  return data.offer;
}

async function fetchIceServers() {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/ice_servers`, { // @block:const-response-544242ef
    method: 'GET',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
    },
  });
  const data = await response.json(); // @block:const-data-c4ed791a
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

  const { idle, stream } = getVideoElements(); // @block:const-{-697c9f32
  idleVideoElement = idle;
  streamVideoElement = stream;

// @block:if--0794bfe0
  if (idleVideoElement) idleVideoElement.setAttribute('playsinline', '');
// @block:if--bfef274f
  if (streamVideoElement) streamVideoElement.setAttribute('playsinline', '');

  initializeTransitionCanvas();

  await loadAvatars();
  populateAvatarSelect();

  const contextInput = document.getElementById('context-input'); // @block:const-contextInput-86b3c9cd
  contextInput.value = context.trim();
  contextInput.addEventListener('input', () => {
// @block:if--e284310d
    if (!contextInput.value.includes('Original Context:')) {
      context = contextInput.value.trim();
    }
// @block:if--e284310d-end
  });

  const sendTextButton = document.getElementById('send-text-button'); // @block:const-sendTextButton-a3aba74e
  const textInput = document.getElementById('text-input'); // @block:const-textInput-59a66b01
  const replaceContextButton = document.getElementById('replace-context-button'); // @block:const-replaceContextButton-58d4cf2d
  const autoSpeakToggle = document.getElementById('auto-speak-toggle'); // @block:const-autoSpeakToggle-9254b419
  const editAvatarButton = document.getElementById('edit-avatar-button'); // @block:const-editAvatarButton-1e65358e

  sendTextButton.addEventListener('click', () => handleTextInput(textInput.value));
  textInput.addEventListener('keypress', (event) => {
// @block:if--25022869
    if (event.key === 'Enter') handleTextInput(textInput.value);
  });
  replaceContextButton.addEventListener('click', () => updateContext('replace'));
  autoSpeakToggle.addEventListener('click', toggleAutoSpeak);
  editAvatarButton.addEventListener('click', () => openAvatarModal(currentAvatar));

  initializeWebSocket();
  playIdleVideo();

  showLoadingSymbol();
// @block:try-{-5ff29a93
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
// @block:try-{-5ff29a93-end

  // Set up reconnection mechanism
  window.addEventListener('online', async () => {
// @block:if--a9a5b984
    if (connectionState === ConnectionState.DISCONNECTED) {
      logger.info('Network connection restored. Attempting to reconnect...');
// @block:try-{-267bbf56
      try {
        await backgroundReconnect();
      } catch (error) {
        logger.error('Failed to reconnect after network restoration:', error);
      }
// @block:try-{-267bbf56-end
    }
// @block:if--a9a5b984-end
  });

  // Handle visibility change
// @block:document.addEventListener('visibilitychange',--980b1a6a
  document.addEventListener('visibilitychange', () => {
// @block:if--9845f570
    if (!document.hidden && connectionState === ConnectionState.DISCONNECTED) {
      logger.info('Page became visible. Checking connection...');
// @block:if--ff65024c
      if (navigator.onLine) {
        backgroundReconnect();
      }
// @block:if--ff65024c-end
    }
// @block:if--9845f570-end
  });

  logger.info('Initialization complete');
}
// @block:document.addEventListener('visibilitychange',--980b1a6a-end

async function handleAvatarChange() {
  currentAvatar = avatarSelect.value;
// @block:if--dc374b04
  if (currentAvatar === 'create-new') {
    openAvatarModal();
    return;
  }
// @block:if--dc374b04-end

  const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-a5c7c5a4
// @block:if--fa84aff6
  if (idleVideoElement) {
    idleVideoElement.src = avatars[currentAvatar].silentVideoUrl;
// @block:try-{-a66241ad
    try {
      await idleVideoElement.load();
      logger.debug(`Idle video loaded for ${currentAvatar}`);
    } catch (error) {
      logger.error(`Error loading idle video for ${currentAvatar}:`, error);
    }
// @block:try-{-a66241ad-end
  }
// @block:if--fa84aff6-end

  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-c8fc32d7
// @block:if--080290e2
  if (streamVideoElement) {
    streamVideoElement.srcObject = null;
  }
// @block:if--080290e2-end

  await stopRecording();
  currentUtterance = '';
  interimMessageAdded = false;
  const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-3d658f9d
  msgHistory.innerHTML = '';
  chatHistory = [];

  await destroyPersistentStream();
  await initializePersistentStream();
}
// @block:if--25022869-end

async function loadAvatars() {
// @block:try-{-eeea92f9
  try {
    const response = await fetch('/avatars'); // @block:const-response-b8440053
// @block:if--32f51c2f
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
// @block:if--32f51c2f-end
    avatars = await response.json();
    logger.debug('Avatars loaded:', avatars);
  } catch (error) {
    logger.error('Error loading avatars:', error);
    showErrorMessage('Failed to load avatars. Please try again.');
  }
// @block:try-{-eeea92f9-end
}
// @block:if--bfef274f-end

// @block:function-populateAvatarSelect-8ca31589
function populateAvatarSelect() {
  const avatarSelect = document.getElementById('avatar-select'); // @block:const-avatarSelect-ecfeedf8
  avatarSelect.innerHTML = '';

  const createNewOption = document.createElement('option'); // @block:const-createNewOption-31cbb062
  createNewOption.value = 'create-new';
  createNewOption.textContent = 'Create New Avatar';
  avatarSelect.appendChild(createNewOption);

// @block:for--944c5074
  for (const [key, value] of Object.entries(avatars)) {
    const option = document.createElement('option'); // @block:const-option-07c76414
    option.value = key;
    option.textContent = value.name;
    avatarSelect.appendChild(option);
  }
// @block:for--944c5074-end

// @block:if--ee2fc499
  if (Object.keys(avatars).length > 0) {
    currentAvatar = Object.keys(avatars)[0];
    avatarSelect.value = currentAvatar;
  }
// @block:if--ee2fc499-end
}
// @block:function-populateAvatarSelect-8ca31589-end

// @block:function-openAvatarModal-d317b6f7
function openAvatarModal(avatarName = null) {
  const modal = document.getElementById('avatar-modal'); // @block:const-modal-063c0943
  const nameInput = document.getElementById('avatar-name'); // @block:const-nameInput-1bbf854f
  const voiceInput = document.getElementById('avatar-voice'); // @block:const-voiceInput-cbfc199a
  const imagePreview = document.getElementById('avatar-image-preview'); // @block:const-imagePreview-209dd963
  const saveButton = document.getElementById('save-avatar-button'); // @block:const-saveButton-3fa96526

// @block:if--ac266751
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
// @block:if--ac266751-end

  modal.style.display = 'block';
}
// @block:function-openAvatarModal-d317b6f7-end

// @block:function-closeAvatarModal-74b36f0b
function closeAvatarModal() {
  const modal = document.getElementById('avatar-modal'); // @block:const-modal-522883ec
  modal.style.display = 'none';
}
// @block:function-closeAvatarModal-74b36f0b-end

async function saveAvatar() {
  const name = document.getElementById('avatar-name').value; // @block:const-name-f1f1d004
  const voiceId = document.getElementById('avatar-voice').value || 'en-US-GuyNeural'; // @block:const-voiceId-26d3c8d6
  const imageFile = document.getElementById('avatar-image').files[0]; // @block:const-imageFile-7516fefa

// @block:if--55df3d3d
  if (!name) {
    showErrorMessage('Please fill in the avatar name.');
    return;
  }
// @block:if--55df3d3d-end

  const formData = new FormData(); // @block:const-formData-81df5aaf
// @block:formData.append('name',-name);-1a42645a
  formData.append('name', name);
// @block:formData.append('voiceId',-voiceId);-17d84d5c
  formData.append('voiceId', voiceId);
// @block:if--4d7f42f0
  if (imageFile) {
// @block:formData.append('image',-imageFile);-05e28304
    formData.append('image', imageFile);
  }
// @block:formData.append('image',-imageFile);-05e28304-end

  showToast('Saving avatar...', 0);

// @block:try-{-bed93fe6
  try {
    const response = await fetch('/avatar', { // @block:const-response-c7e8f3ea
      method: 'POST',
      body: formData,
    });

    const reader = response.body.getReader(); // @block:const-reader-9269009c
    const decoder = new TextDecoder(); // @block:const-decoder-6c6fd200

// @block:while--1f3a1b6e
    while (true) {
      const { done, value } = await reader.read(); // @block:const-{-14cd808d
// @block:if--99cb76d6
      if (done) break;

      const chunk = decoder.decode(value); // @block:const-chunk-9751d2df
      const events = chunk.split('\n\n'); // @block:const-events-400f14c7

// @block:for--8b8832ee
      for (const event of events) {
// @block:if--df46a3af
        if (event.startsWith('data: ')) {
          const data = JSON.parse(event.slice(6)); // @block:const-data-d95bdea4
// @block:if--58d5d8c9
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
// @block:if--58d5d8c9-end
        }
// @block:if--df46a3af-end
      }
// @block:for--8b8832ee-end
    }
// @block:if--99cb76d6-end
  } catch (error) {
    console.error('Error saving avatar:', error);
    showErrorMessage('Failed to save avatar. Please try again.');
  }
// @block:while--1f3a1b6e-end
}
// @block:try-{-bed93fe6-end

// @block:function-updateContext-29c62c7c
function updateContext(action) {
  const contextInput = document.getElementById('context-input'); // @block:const-contextInput-39df70cb
  const newContext = contextInput.value.trim(); // @block:const-newContext-cfc3a6f4

// @block:if--35cec33a
  if (newContext) {
    const originalContext = context; // @block:const-originalContext-59cca781
// @block:if--0da6d05d
    if (action === 'append') {
      context += '\n' + newContext;
    } else if (action === 'replace') {
      context = newContext;
    }
// @block:if--0da6d05d-end
    logger.debug('Context updated:', context);
    showToast('Context saved successfully');

    displayBothContexts(originalContext, context);
  } else {
    showToast('Please enter some text before updating the context');
  }
// @block:if--35cec33a-end
}
// @block:function-updateContext-29c62c7c-end

// @block:function-displayBothContexts-aca91ce9
function displayBothContexts(original, updated) {
  const contextInput = document.getElementById('context-input'); // @block:const-contextInput-3ef6a6ba
  contextInput.value = `Original Context:\n${original}\n\nNew Context:\n${updated}`;

  setTimeout(() => {
    contextInput.value = updated;
  }, 3000);
}
// @block:function-displayBothContexts-aca91ce9-end

// @block:function-showToast-84662447
function showToast(message) {
  const toast = document.createElement('div'); // @block:const-toast-6f82e7c8
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

// @block:document.body.appendChild(toast);-None-7116da8e
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease-out';
    setTimeout(() => {
// @block:document.body.removeChild(toast);-None-d786ce0a
      document.body.removeChild(toast);
    }, 500);
  }, 3000);
}
// @block:document.body.removeChild(toast);-None-d786ce0a-end

// @block:if--c1e6a4da
if (document.readyState === 'loading') {
// @block:document.addEventListener('DOMContentLoaded',-initialize);-ce789501
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
// @block:document.addEventListener('DOMContentLoaded',-initialize);-ce789501-end

// @block:function-showLoadingSymbol-a1b27e2b
function showLoadingSymbol() {
  const loadingSymbol = document.createElement('div'); // @block:const-loadingSymbol-d2d13efa
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
// @block:document.body.appendChild(loadingSymbol);-None-11a7dfd1
  document.body.appendChild(loadingSymbol);
}
// @block:document.body.appendChild(loadingSymbol);-None-11a7dfd1-end

// @block:function-hideLoadingSymbol-ada27a9f
function hideLoadingSymbol() {
  const loadingSymbol = document.getElementById('loading-symbol'); // @block:const-loadingSymbol-5e2df909
// @block:if--ac3a4f20
  if (loadingSymbol) {
// @block:document.body.removeChild(loadingSymbol);-None-99f85dc1
    document.body.removeChild(loadingSymbol);
  }
// @block:document.body.removeChild(loadingSymbol);-None-99f85dc1-end
}
// @block:if--ac3a4f20-end

// @block:function-showErrorMessage-a56ef9ed
function showErrorMessage(message) {
  const errorMessage = document.createElement('div'); // @block:const-errorMessage-dfeb1c8e
  errorMessage.innerHTML = message;
  errorMessage.style.color = 'red';
  errorMessage.style.marginBottom = '10px';
// @block:document.body.appendChild(errorMessage);-None-1414c603
  document.body.appendChild(errorMessage);

  const destroyButton = document.getElementById('destroy-button'); // @block:const-destroyButton-3b16163f
  const connectButton = document.getElementById('connect-button'); // @block:const-connectButton-74209373
  connectButton.onclick = initializePersistentStream;

// @block:if--a52f73bd
  if (destroyButton) destroyButton.style.display = 'inline-block';
  destroyButton.onclick = destroyPersistentStream;

// @block:if--a14f9185
  if (connectButton) connectButton.style.display = 'inline-block';
}
// @block:if--a14f9185-end

async function createPeerConnection(offer, iceServers) {
// @block:if--adf0878c
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
// @block:if--adf0878c-end

  await peerConnection.setRemoteDescription(offer);
  logger.debug('Set remote SDP');

  const sessionClientAnswer = await peerConnection.createAnswer(); // @block:const-sessionClientAnswer-f1998780
  logger.debug('Created local SDP');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  logger.debug('Set local SDP');

  return sessionClientAnswer;
}
// @block:if--a52f73bd-end

// @block:function-onIceGatheringStateChange-a41b4cb7
function onIceGatheringStateChange() {
  const { iceGathering: iceGatheringStatusLabel } = getStatusLabels(); // @block:const-{-15dbce11
// @block:if--24031f81
  if (iceGatheringStatusLabel) {
    iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
    iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
  }
// @block:if--24031f81-end
  logger.debug('ICE gathering state changed:', peerConnection.iceGatheringState);
}
// @block:function-onIceGatheringStateChange-a41b4cb7-end

// @block:function-onIceCandidate-b52146f4
function onIceCandidate(event) {
// @block:if--4c4b2591
  if (event.candidate && persistentStreamId && persistentSessionId) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate; // @block:const-{-9538c7b6
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
// @block:if--4c4b2591-end
}
// @block:function-onIceCandidate-b52146f4-end

// @block:function-onIceConnectionStateChange-544434a2
function onIceConnectionStateChange() {
  const { ice: iceStatusLabel } = getStatusLabels(); // @block:const-{-285b470d
// @block:if--98824f8b
  if (iceStatusLabel) {
    iceStatusLabel.innerText = peerConnection.iceConnectionState;
    iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
  }
// @block:if--98824f8b-end
  logger.debug('ICE connection state changed:', peerConnection.iceConnectionState);

// @block:if--01f74194
  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
    showErrorMessage('Connection lost. Please try again.');
  }
// @block:if--01f74194-end
}
// @block:function-onIceConnectionStateChange-544434a2-end

async function attemptReconnect() {
  logger.debug('Attempting to reconnect...');
// @block:try-{-f2f0cd74
  try {
    await reinitializeConnection();
    logger.debug('Reconnection successful');
    reconnectAttempts = 0;
  } catch (error) {
    logger.error('Reconnection attempt failed:', error);
    scheduleReconnect();
  }
// @block:try-{-f2f0cd74-end
}
// @block:document.body.appendChild(errorMessage);-None-1414c603-end

// @block:function-onConnectionStateChange-b00b4aab
function onConnectionStateChange() {
  const { peer: peerStatusLabel } = getStatusLabels(); // @block:const-{-933e8f74
// @block:if--f72176c7
  if (peerStatusLabel) {
    peerStatusLabel.innerText = peerConnection.connectionState;
    peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
  }
// @block:if--f72176c7-end
  logger.debug('Peer connection state changed:', peerConnection.connectionState);

// @block:if--f40ba79a
  if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
    logger.warn('Peer connection failed or disconnected. Attempting to reconnect...');
    connectionState = ConnectionState.DISCONNECTED;
    backgroundReconnect();
  } else if (peerConnection.connectionState === 'connected') {
    logger.debug('Peer connection established successfully');
    connectionState = ConnectionState.CONNECTED;
    reconnectAttempts = 0;
  }
// @block:if--f40ba79a-end
}
// @block:function-onConnectionStateChange-b00b4aab-end

// @block:function-startConnectionHealthCheck-84a65cf3
function startConnectionHealthCheck() {
  setInterval(() => {
// @block:if--8cdfea57
    if (peerConnection) {
// @block:if--8417499a
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        logger.warn('Connection health check detected disconnected state. Attempting to reconnect...');
        connectionState = ConnectionState.DISCONNECTED;
        backgroundReconnect();
      } else if (peerConnection.connectionState === 'connected') {
        const timeSinceLastConnection = Date.now() - lastConnectionTime; // @block:const-timeSinceLastConnection-fe6fa005
// @block:if--198f5abe
        if (timeSinceLastConnection > RECONNECTION_INTERVAL * 0.9) {
          logger.info('Approaching reconnection threshold. Initiating background reconnect.');
          backgroundReconnect();
        }
// @block:if--198f5abe-end
      }
// @block:if--8417499a-end
    }
// @block:if--8cdfea57-end
  }, 30000); // Check every 30 seconds
}
// @block:function-startConnectionHealthCheck-84a65cf3-end

// @block:function-onSignalingStateChange-41353efc
function onSignalingStateChange() {
  const { signaling: signalingStatusLabel } = getStatusLabels(); // @block:const-{-1d9f22cb
// @block:if--a196be5d
  if (signalingStatusLabel) {
    signalingStatusLabel.innerText = peerConnection.signalingState;
    signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
  }
// @block:if--a196be5d-end
  logger.debug('Signaling state changed:', peerConnection.signalingState);
}
// @block:function-onSignalingStateChange-41353efc-end

// @block:function-onVideoStatusChange-6cce180f
function onVideoStatusChange(videoIsPlaying, stream) {
  let status = videoIsPlaying ? 'streaming' : 'empty'; // @block:let-status-0d66f62a

// @block:if--c0d579cb
  if (status === lastVideoStatus) {
    logger.debug('Video status unchanged:', status);
    return;
  }
// @block:if--c0d579cb-end

  logger.debug('Video status changing from', lastVideoStatus, 'to', status);

  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-2dc4630d
  const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-58d811b6

// @block:if--19069839
  if (!streamVideoElement || !idleVideoElement) {
    logger.error('Video elements not found');
    return;
  }
// @block:if--19069839-end

// @block:if--cad4cd72
  if (status === 'streaming') {
    setStreamVideoElement(stream);
  } else {
    smoothTransition(false);
  }
// @block:if--cad4cd72-end

  lastVideoStatus = status;

  const streamingStatusLabel = document.getElementById('streaming-status-label'); // @block:const-streamingStatusLabel-ad6215bd
// @block:if--19b3f9bd
  if (streamingStatusLabel) {
    streamingStatusLabel.innerText = status;
    streamingStatusLabel.className = 'streamingState-' + status;
  }
// @block:if--19b3f9bd-end

  logger.debug('Video status changed:', status);
}
// @block:function-onVideoStatusChange-6cce180f-end

// @block:function-setStreamVideoElement-931c3ee8
function setStreamVideoElement(stream) {
  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-c5b4d2a9
// @block:if--c9fe7cf7
  if (!streamVideoElement) {
    logger.error('Stream video element not found');
    return;
  }
// @block:if--c9fe7cf7-end

  logger.debug('Setting stream video element');
// @block:if--4ce37ca0
  if (stream instanceof MediaStream) {
    streamVideoElement.srcObject = stream;
  } else {
    logger.warn('Invalid stream provided to setStreamVideoElement');
    return;
  }
// @block:if--4ce37ca0-end

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
// @block:function-setStreamVideoElement-931c3ee8-end

// @block:function-onStreamEvent-f12fb63c
function onStreamEvent(message) {
// @block:if--c0b868b5
  if (pcDataChannel.readyState === 'open') {
    let status; // @block:let-None-9f16dc86
    const [event, _] = message.data.split(':'); // @block:const-[event,-25d2aa77

// @block:switch--6788b975
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
// @block:switch--6788b975-end

    // Set stream ready after a short delay, adjusting for potential timing differences between data and stream channels
// @block:if--8d058cb4
    if (status === 'ready') {
      setTimeout(() => {
        console.log('stream/ready');
        isStreamReady = true;
        const streamEventLabel = document.getElementById('stream-event-label'); // @block:const-streamEventLabel-f82a3741
// @block:if--81a5924f
        if (streamEventLabel) {
          streamEventLabel.innerText = 'ready';
          streamEventLabel.className = 'streamEvent-ready';
        }
// @block:if--81a5924f-end
      }, 1000);
    } else {
      console.log(event);
      const streamEventLabel = document.getElementById('stream-event-label'); // @block:const-streamEventLabel-b07dd2a3
// @block:if--50dfadd8
      if (streamEventLabel) {
        streamEventLabel.innerText = status === 'dont-care' ? event : status;
        streamEventLabel.className = 'streamEvent-' + status;
      }
// @block:if--50dfadd8-end
    }
// @block:if--8d058cb4-end
  }
// @block:if--c0b868b5-end
}
// @block:function-onStreamEvent-f12fb63c-end

// @block:function-onTrack-16121e16
function onTrack(event) {
  logger.debug('onTrack event:', event);
// @block:if--9f361b85
  if (!event.track) {
    logger.warn('No track in onTrack event');
    return;
  }
// @block:if--9f361b85-end

// @block:if--90b9ba09
  if (statsIntervalId) {
    clearInterval(statsIntervalId);
  }
// @block:if--90b9ba09-end

  statsIntervalId = setInterval(async () => {
// @block:if--a5b6551f
    if (peerConnection && peerConnection.connectionState === 'connected') {
// @block:try-{-66be0312
      try {
        const stats = await peerConnection.getStats(event.track); // @block:const-stats-ab6d1c83
        let videoStatsFound = false; // @block:let-videoStatsFound-e6032043
        stats.forEach((report) => {
// @block:if--cec45ee2
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            videoStatsFound = true;
            const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived; // @block:const-videoStatusChanged-d77736d4

            // logger.debug('Video stats:', {
            //  bytesReceived: report.bytesReceived,
            //  lastBytesReceived,
            //  videoIsPlaying,
            //  videoStatusChanged
            // });

// @block:if--fd0fe338
            if (videoStatusChanged) {
              videoIsPlaying = report.bytesReceived > lastBytesReceived;
              logger.debug('Video status changed:', videoIsPlaying);
              onVideoStatusChange(videoIsPlaying, event.streams[0]);
            }
// @block:if--fd0fe338-end
            lastBytesReceived = report.bytesReceived;
          }
// @block:if--cec45ee2-end
        });
// @block:if--9276b17b
        if (!videoStatsFound) {
          logger.debug('No video stats found yet.');
        }
// @block:if--9276b17b-end
      } catch (error) {
        logger.error('Error getting stats:', error);
      }
// @block:try-{-66be0312-end
    } else {
      logger.debug('Peer connection not ready for stats.');
    }
// @block:if--a5b6551f-end
  }, 250); // Check every 500ms

// @block:if--7301735f
  if (event.streams && event.streams.length > 0) {
    const stream = event.streams[0]; // @block:const-stream-896ae491
// @block:if--cb6ab76b
    if (stream.getVideoTracks().length > 0) {
      logger.debug('Setting stream video element with track:', event.track.id);
      setStreamVideoElement(stream);
    } else {
      logger.warn('Stream does not contain any video tracks');
    }
// @block:if--cb6ab76b-end
  } else {
    logger.warn('No streams found in onTrack event');
  }
// @block:if--7301735f-end

// @block:if--f66323f6
  if (isDebugMode) {
    // downloadStreamVideo(event.streams[0]);
  }
// @block:if--f66323f6-end
}
// @block:function-onTrack-16121e16-end

// @block:function-playIdleVideo-458bc11c
function playIdleVideo() {
  const { idle: idleVideoElement } = getVideoElements(); // @block:const-{-32e363a6
// @block:if--74f09c2b
  if (!idleVideoElement) {
    logger.error('Idle video element not found');
    return;
  }
// @block:if--74f09c2b-end

// @block:if--4380a4f3
  if (!currentAvatar || !avatars[currentAvatar]) {
    logger.warn(`No avatar selected or avatar ${currentAvatar} not found. Using default idle video.`);
    idleVideoElement.src = 'path/to/default/idle/video.mp4'; // Replace with your default video path
  } else {
    idleVideoElement.src = avatars[currentAvatar].silentVideoUrl;
  }
// @block:if--4380a4f3-end

  idleVideoElement.loop = true;

  idleVideoElement.onloadeddata = () => {
    logger.debug(`Idle video loaded successfully for ${currentAvatar || 'default'}`);
  };

  idleVideoElement.onerror = (e) => {
    logger.error(`Error loading idle video for ${currentAvatar || 'default'}:`, e);
  };

  idleVideoElement.play().catch((e) => logger.error('Error playing idle video:', e));
}
// @block:function-playIdleVideo-458bc11c-end

// @block:function-stopAllStreams-8dd2c31b
function stopAllStreams() {
// @block:if--e4152e5e
  if (streamVideoElement && streamVideoElement.srcObject) {
    logger.debug('Stopping video streams');
    streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    streamVideoElement.srcObject = null;
  }
// @block:if--e4152e5e-end
}
// @block:function-stopAllStreams-8dd2c31b-end

// @block:function-closePC-28ee36b5
function closePC(pc = peerConnection) {
// @block:if--99f11aab
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
  const labels = getStatusLabels(); // @block:const-labels-a1b9f831
// @block:if--4e50482f
  if (labels.iceGathering) labels.iceGathering.innerText = '';
// @block:if--9c3a94ec
  if (labels.signaling) labels.signaling.innerText = '';
// @block:if--bbab5e88
  if (labels.ice) labels.ice.innerText = '';
// @block:if--f9aee211
  if (labels.peer) labels.peer.innerText = '';
  logger.debug('Stopped peer connection');
// @block:if--f79cc8cc
  if (pc === peerConnection) {
    peerConnection = null;
  }
// @block:if--f79cc8cc-end
}
// @block:if--f9aee211-end

async function fetchWithRetries(url, options, retries = 0, delayMs = 1000) {
// @block:try-{-423c9f7f
  try {
    const now = Date.now(); // @block:const-now-b5f5710f
    const timeSinceLastCall = now - lastApiCallTime; // @block:const-timeSinceLastCall-187d24e4

// @block:if--564b81e6
    if (timeSinceLastCall < API_CALL_INTERVAL) {
      await new Promise((resolve) => setTimeout(resolve, API_CALL_INTERVAL - timeSinceLastCall));
    }
// @block:if--564b81e6-end

    lastApiCallTime = Date.now();

    const response = await fetch(url, options); // @block:const-response-f369dd39
// @block:if--7eb58678
    if (!response.ok) {
// @block:if--a5755139
      if (response.status === 429) {
        // If rate limited, wait for a longer time before retrying
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10); // @block:const-retryAfter-37176cba
        logger.warn(`Rate limited. Retrying after ${retryAfter} seconds.`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        return fetchWithRetries(url, options, retries, delayMs);
      }
// @block:if--a5755139-end
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }
// @block:if--7eb58678-end
    return response;
  } catch (err) {
// @block:if--19f9bd45
    if (retries < maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) * delayMs + Math.random() * 1000, maxDelaySec * 1000); // @block:const-delay-3b99d764
      logger.warn(`Request failed, retrying ${retries + 1}/${maxRetryCount} in ${delay}ms. Error: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetries(url, options, retries + 1, delayMs);
    } else {
      throw err;
    }
// @block:if--19f9bd45-end
  }
// @block:try-{-423c9f7f-end
}
// @block:if--bbab5e88-end

async function initializeConnection() {
// @block:if--3d0a08ba
  if (isInitializing) {
    logger.warn('Connection initialization already in progress. Skipping initialize.');
    return;
  }
// @block:if--3d0a08ba-end

  isInitializing = true;
  logger.info('Initializing connection...');

// @block:try-{-fa252588
  try {
    stopAllStreams();
    closePC();

// @block:if--9e29c983
    if (!currentAvatar || !avatars[currentAvatar]) {
      throw new Error('No avatar selected or avatar not found');
    }
// @block:if--9e29c983-end

    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, { // @block:const-sessionResponse-41fbcfc0
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

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json(); // @block:const-{-0a21fe42

// @block:if--8cdc2fa1
    if (!newStreamId || !newSessionId) {
      throw new Error('Failed to get valid stream ID or session ID from API');
    }
// @block:if--8cdc2fa1-end

    streamId = newStreamId;
    sessionId = newSessionId;
    logger.info('Stream created:', { streamId, sessionId });

// @block:try-{-09d5f585
    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
      logger.error('Error during streaming setup:', e);
      stopAllStreams();
      closePC();
      throw e;
    }
// @block:try-{-09d5f585-end

    await new Promise((resolve) => setTimeout(resolve, 6000));

    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, { // @block:const-sdpResponse-956035c2
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

// @block:if--4703d0cc
    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }
// @block:if--4703d0cc-end

    logger.info('Connection initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize connection:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
// @block:try-{-fa252588-end
}
// @block:if--9c3a94ec-end

async function startStreaming(assistantReply) {
// @block:try-{-5ad05001
  try {
    logger.debug('Starting streaming with reply:', assistantReply);
// @block:if--33f73a47
    if (!persistentStreamId || !persistentSessionId) {
      logger.error('Persistent stream not initialized. Cannot start streaming.');
      await initializePersistentStream();
    }
// @block:if--33f73a47-end

// @block:if--33584740
    if (!currentAvatar || !avatars[currentAvatar]) {
      logger.error('No avatar selected or avatar not found. Cannot start streaming.');
      return;
    }
// @block:if--33584740-end

    const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-f30ab73e
    const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-6e11f78e

// @block:if--c9eaaf45
    if (!streamVideoElement || !idleVideoElement) {
      logger.error('Video elements not found');
      return;
    }
// @block:if--c9eaaf45-end

    // Remove outer <speak> tags if present
    let ssmlContent = assistantReply.trim(); // @block:let-ssmlContent-c4922a1e
// @block:if--5b709cba
    if (ssmlContent.startsWith('<speak>') && ssmlContent.endsWith('</speak>')) {
      ssmlContent = ssmlContent.slice(7, -8).trim();
    }
// @block:if--5b709cba-end

    // Split the SSML content into chunks, respecting SSML tags
    const chunks = ssmlContent.match(/(?:<[^>]+>|[^<]+)+/g) || []; // @block:const-chunks-2d11c234

    logger.debug('Chunks', chunks);

// @block:for--9a766159
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim(); // @block:const-chunk-540ac761
// @block:if--9b16fb85
      if (chunk.length === 0) continue;

      isAvatarSpeaking = true;
      const playResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}`, { // @block:const-playResponse-66b996f3
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

// @block:if--0bfb5354
      if (!playResponse.ok) {
        throw new Error(`HTTP error! status: ${playResponse.status}`);
      }
// @block:if--0bfb5354-end

      const playResponseData = await playResponse.json(); // @block:const-playResponseData-0320468d
      logger.debug('Streaming response:', playResponseData);

// @block:if--150707f0
      if (playResponseData.status === 'started') {
        logger.debug('Stream chunk started successfully');

// @block:if--cf637c6b
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
// @block:if--cf637c6b-end
      } else {
        logger.warn('Unexpected response status:', playResponseData.status);
      }
// @block:if--150707f0-end
    }
// @block:if--9b16fb85-end

    isAvatarSpeaking = false;
    smoothTransition(false);

    // Check if we need to reconnect
// @block:if--4df469d6
    if (shouldReconnect()) {
      logger.info('Approaching reconnection threshold. Initiating background reconnect.');
      await backgroundReconnect();
    }
// @block:if--4df469d6-end
  } catch (error) {
    logger.error('Error during streaming:', error);
// @block:if--f91deeb4
    if (error.message.includes('HTTP error! status: 404') || error.message.includes('missing or invalid session_id')) {
      logger.warn('Stream not found or invalid session. Attempting to reinitialize persistent stream.');
      await reinitializePersistentStream();
    }
// @block:if--f91deeb4-end
  }
// @block:for--9a766159-end
}
// @block:try-{-5ad05001-end

export function toggleSimpleMode() { // @block:export-None-16b0ac8f
  const content = document.getElementById('content'); // @block:const-content-8e23e11d
  const videoWrapper = document.getElementById('video-wrapper'); // @block:const-videoWrapper-53300b7e
  const simpleModeButton = document.getElementById('simple-mode-button'); // @block:const-simpleModeButton-055433f8
  const header = document.querySelector('.header'); // @block:const-header-2669ae57
  const autoSpeakToggle = document.getElementById('auto-speak-toggle'); // @block:const-autoSpeakToggle-2e714501
  const startButton = document.getElementById('start-button'); // @block:const-startButton-81ebfed9

// @block:if--e1be2f45
  if (content.style.display !== 'none') {
    // Entering simple mode
    content.style.display = 'none';
// @block:document.body.appendChild(videoWrapper);-None-6d94fd51
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
// @block:if--de9e5284
    if (autoSpeakToggle.textContent.includes('Off')) {
      autoSpeakToggle.click();
    }
// @block:if--de9e5284-end

    // Start recording if it's not already recording
// @block:if--3ff06c4b
    if (startButton.textContent === 'Speak') {
      startButton.click();
    }
// @block:if--3ff06c4b-end
  } else {
    // Exiting simple mode
    content.style.display = 'flex';
    const leftColumn = document.getElementById('left-column'); // @block:const-leftColumn-b3a824b5
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
// @block:if--a23a2dcc
    if (autoSpeakToggle.textContent.includes('On')) {
      autoSpeakToggle.click();
    }
// @block:if--a23a2dcc-end

    // Stop recording
// @block:if--2c464bbf
    if (startButton.textContent === 'Stop') {
      startButton.click();
    }
// @block:if--2c464bbf-end
  }
// @block:document.body.appendChild(videoWrapper);-None-6d94fd51-end
}
// @block:if--e1be2f45-end

// @block:function-startSendingAudioData-70fdd534
function startSendingAudioData() {
  logger.debug('Starting to send audio data...');

  let packetCount = 0; // @block:let-packetCount-82acbf52
  let totalBytesSent = 0; // @block:let-totalBytesSent-ef0b40c7

  audioWorkletNode.port.onmessage = (event) => {
    const audioData = event.data; // @block:const-audioData-b333d571

// @block:if--0df6db9b
    if (!(audioData instanceof ArrayBuffer)) {
      logger.warn('Received non-ArrayBuffer data from AudioWorklet:', typeof audioData);
      return;
    }
// @block:if--0df6db9b-end

// @block:if--2018bb2f
    if (deepgramConnection && deepgramConnection.getReadyState() === WebSocket.OPEN) {
// @block:try-{-b0c9b745
      try {
        deepgramConnection.send(audioData);
        packetCount++;
        totalBytesSent += audioData.byteLength;

// @block:if--a809045e
        if (packetCount % 100 === 0) {
          logger.debug(`Sent ${packetCount} audio packets to Deepgram. Total bytes: ${totalBytesSent}`);
        }
// @block:if--a809045e-end
      } catch (error) {
        logger.error('Error sending audio data to Deepgram:', error);
      }
// @block:try-{-b0c9b745-end
    } else {
      logger.warn(
        'Deepgram connection not open, cannot send audio data. ReadyState:',
        deepgramConnection ? deepgramConnection.getReadyState() : 'undefined',
      );
    }
// @block:if--2018bb2f-end
  };

  logger.debug('Audio data sending setup complete');
}
// @block:function-startSendingAudioData-70fdd534-end

// @block:function-handleTranscription-d8560be7
function handleTranscription(data) {
// @block:if--c02cd564
  if (!isRecording) return;

  const transcript = data.channel.alternatives[0].transcript; // @block:const-transcript-235e5705
// @block:if--499e3213
  if (data.is_final) {
    logger.debug('Final transcript:', transcript);
// @block:if--658ecd97
    if (transcript.trim()) {
      currentUtterance += transcript + ' ';
      updateTranscript(currentUtterance.trim(), true);
      chatHistory.push({
        role: 'user',
        content: currentUtterance.trim(),
      });
      sendChatToGroq();
    }
// @block:if--658ecd97-end
    currentUtterance = '';
    interimMessageAdded = false;
  } else {
    logger.debug('Interim transcript:', transcript);
    updateTranscript(currentUtterance + transcript, false);
  }
// @block:if--499e3213-end
}
// @block:if--c02cd564-end

async function startRecording() {
// @block:if--ebef8a91
  if (isRecording) {
    logger.warn('Recording is already in progress. Stopping current recording.');
    await stopRecording();
    return;
  }
// @block:if--ebef8a91-end

  logger.debug('Starting recording process...');

  currentUtterance = '';
  interimMessageAdded = false;

// @block:try-{-ff6cc97e
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // @block:const-stream-fea44ebd
    logger.info('Microphone stream obtained');

    audioContext = new AudioContext();
    logger.debug('Audio context created. Sample rate:', audioContext.sampleRate);

    await audioContext.audioWorklet.addModule('audio-processor.js');
    logger.debug('Audio worklet module added successfully');

    const source = audioContext.createMediaStreamSource(stream); // @block:const-source-5fb9cfd1
    logger.debug('Media stream source created');

    audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
    logger.debug('Audio worklet node created');

    source.connect(audioWorkletNode);
    logger.debug('Media stream source connected to audio worklet node');

    const deepgramOptions = { // @block:const-deepgramOptions-b815d0ea
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
// @block:if--067861f6
    if (autoSpeakMode) {
      autoSpeakInProgress = true;
    }
// @block:if--067861f6-end
    const startButton = document.getElementById('start-button'); // @block:const-startButton-36faca58
    startButton.textContent = 'Stop';

    logger.debug('Recording and transcription started successfully');
  } catch (error) {
    logger.error('Error starting recording:', error);
    isRecording = false;
    const startButton = document.getElementById('start-button'); // @block:const-startButton-7e1a61a7
    startButton.textContent = 'Speak';
    showErrorMessage('Failed to start recording. Please try again.');
    throw error;
  }
// @block:try-{-ff6cc97e-end
}
// @block:function-handleTranscription-d8560be7-end

// @block:function-handleDeepgramError-ce21e126
function handleDeepgramError(err) {
  logger.error('Deepgram error:', err);
  isRecording = false;
  const startButton = document.getElementById('start-button'); // @block:const-startButton-8adaf387
  startButton.textContent = 'Speak';

  // Attempt to close the connection and clean up
// @block:if--46be7d59
  if (deepgramConnection) {
// @block:try-{-32e3d88c
    try {
      deepgramConnection.finish();
    } catch (closeError) {
      logger.warn('Error while closing Deepgram connection:', closeError);
    }
// @block:try-{-32e3d88c-end
  }
// @block:if--46be7d59-end

// @block:if--c84dbcb6
  if (audioContext) {
    audioContext.close().catch((closeError) => {
      logger.warn('Error while closing AudioContext:', closeError);
    });
  }
// @block:if--c84dbcb6-end
}
// @block:function-handleDeepgramError-ce21e126-end

// @block:function-handleUtteranceEnd-d15a2ee9
function handleUtteranceEnd(data) {
// @block:if--4fde0320
  if (!isRecording) return;

  logger.debug('Utterance end detected:', data);
// @block:if--6c133f69
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
// @block:if--6c133f69-end
}
// @block:if--4fde0320-end

async function stopRecording() {
// @block:if--59bbaaa5
  if (isRecording) {
    logger.info('Stopping recording...');

// @block:if--dd573872
    if (audioContext) {
      await audioContext.close();
      logger.debug('AudioContext closed');
    }
// @block:if--dd573872-end

// @block:if--044b1927
    if (deepgramConnection) {
      deepgramConnection.finish();
      logger.debug('Deepgram connection finished');
    }
// @block:if--044b1927-end

    isRecording = false;
    autoSpeakInProgress = false;
    const startButton = document.getElementById('start-button'); // @block:const-startButton-9bb17585
    startButton.textContent = 'Speak';

    logger.debug('Recording and transcription stopped');
  }
// @block:if--59bbaaa5-end
}
// @block:function-handleUtteranceEnd-d15a2ee9-end

async function sendChatToGroq() {
// @block:if--398729df
  if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1].content.trim() === '') {
    logger.debug('No new content to send to Groq. Skipping request.');
    return;
  }
// @block:if--398729df-end

  logger.debug('Sending chat to Groq...');
// @block:try-{-1059cbaa
  try {
    const startTime = Date.now(); // @block:const-startTime-46554abd
    const currentContext = document.getElementById('context-input').value.trim(); // @block:const-currentContext-f753f8c4
    const requestBody = { // @block:const-requestBody-98ef64fb
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

    const response = await fetch('/chat', { // @block:const-response-25e8b507
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    logger.debug('Groq response status:', response.status);

// @block:if--9de1b894
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
// @block:if--9de1b894-end

    const reader = response.body.getReader(); // @block:const-reader-5a6a7b54
    let assistantReply = ''; // @block:let-assistantReply-b6ae69f9
    let done = false; // @block:let-done-50d090f9

    const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-999df136
    const assistantSpan = document.createElement('span'); // @block:const-assistantSpan-afef225f
    assistantSpan.innerHTML = '<u>Assistant:</u> ';
    msgHistory.appendChild(assistantSpan);
    msgHistory.appendChild(document.createElement('br'));

// @block:while--d96d39af
    while (!done) {
      const { value, done: readerDone } = await reader.read(); // @block:const-{-394db520
// @block:done-=-f8248efe
      done = readerDone;

// @block:if--e6a70926
      if (value) {
        const chunk = new TextDecoder().decode(value); // @block:const-chunk-d21f7085
        logger.debug('Received chunk:', chunk);
        const lines = chunk.split('\n'); // @block:const-lines-5a78180a

// @block:for--ff0f7760
        for (const line of lines) {
// @block:if--f5aaf3c0
          if (line.startsWith('data:')) {
            const data = line.substring(5).trim(); // @block:const-data-253a96a6
// @block:if--ae27b3ee
            if (data === '[DONE]') {
// @block:done-=-55361aea
              done = true;
              break;
            }
// @block:done-=-55361aea-end

// @block:try-{-2d24c825
            try {
              const parsed = JSON.parse(data); // @block:const-parsed-9758d812
              const content = parsed.choices[0]?.delta?.content || ''; // @block:const-content-9d30b9cc
              assistantReply += content;
              assistantSpan.innerHTML += content;
              logger.debug('Parsed content:', content);
            } catch (error) {
              logger.error('Error parsing JSON:', error);
            }
// @block:try-{-2d24c825-end
          }
// @block:if--ae27b3ee-end
        }
// @block:if--f5aaf3c0-end

        msgHistory.scrollTop = msgHistory.scrollHeight;
      }
// @block:for--ff0f7760-end
    }
// @block:if--e6a70926-end

    const endTime = Date.now(); // @block:const-endTime-a6a2ccbb
    const processingTime = endTime - startTime; // @block:const-processingTime-08435754
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
    const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-406b4048
    msgHistory.innerHTML += `<span><u>Assistant:</u> I'm sorry, I encountered an error. Could you please try again?</span><br>`;
    msgHistory.scrollTop = msgHistory.scrollHeight;
  }
// @block:done-=-f8248efe-end
}
// @block:while--d96d39af-end

// @block:function-toggleAutoSpeak-72532e28
function toggleAutoSpeak() {
  autoSpeakMode = !autoSpeakMode;
  const toggleButton = document.getElementById('auto-speak-toggle'); // @block:const-toggleButton-26ca0af0
  const startButton = document.getElementById('start-button'); // @block:const-startButton-0f620dd8
  toggleButton.textContent = `Auto-Speak: ${autoSpeakMode ? 'On' : 'Off'}`;
// @block:if--667ade28
  if (autoSpeakMode) {
    startButton.textContent = 'Stop';
// @block:if--6574830d
    if (!isRecording) {
      startRecording();
    }
// @block:if--6574830d-end
  } else {
    startButton.textContent = isRecording ? 'Stop' : 'Speak';
// @block:if--61728fa0
    if (isRecording) {
      stopRecording();
    }
// @block:if--61728fa0-end
  }
// @block:if--667ade28-end
}
// @block:function-toggleAutoSpeak-72532e28-end

async function reinitializeConnection() {
// @block:if--213180db
  if (connectionState === ConnectionState.RECONNECTING) {
    logger.warn('Connection reinitialization already in progress. Skipping reinitialize.');
    return;
  }
// @block:if--213180db-end

  connectionState = ConnectionState.RECONNECTING;
  logger.debug('Reinitializing connection...');

// @block:try-{-1e4628d0
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

    const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-ca3cad1f
    msgHistory.innerHTML = '';
    chatHistory = [];

    // Reset video elements
    const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-f9fa4898
    const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-f093905b
// @block:if--81d769ba
    if (streamVideoElement) streamVideoElement.srcObject = null;
// @block:if--2f9b1993
    if (idleVideoElement) idleVideoElement.style.display = 'block';

    // Add a delay before initializing to avoid rapid successive calls
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await initializePersistentStream();

// @block:if--cbe9f98a
    if (!persistentStreamId || !persistentSessionId) {
      throw new Error('Persistent Stream ID or Session ID is missing after initialization');
    }
// @block:if--cbe9f98a-end

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
// @block:if--2f9b1993-end
}
// @block:if--81d769ba-end

async function cleanupOldStream() {
  logger.debug('Cleaning up old stream...');

// @block:try-{-e0e97bbb
  try {
// @block:if--30cfcca5
    if (peerConnection) {
      peerConnection.close();
    }
// @block:if--30cfcca5-end

// @block:if--71f4a7ca
    if (pcDataChannel) {
      pcDataChannel.close();
    }
// @block:if--71f4a7ca-end

    // Stop all tracks in the streamVideoElement
// @block:if--efbf608f
    if (streamVideoElement && streamVideoElement.srcObject) {
      streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    }
// @block:if--efbf608f-end

    // Clear any ongoing intervals or timeouts
    clearInterval(statsIntervalId);
    clearTimeout(inactivityTimeout);
    clearInterval(keepAliveInterval);

    logger.debug('Old stream cleaned up successfully');
  } catch (error) {
    logger.error('Error cleaning up old stream:', error);
  }
// @block:try-{-e0e97bbb-end
}
// @block:try-{-1e4628d0-end

const connectButton = document.getElementById('connect-button'); // @block:const-connectButton-63ecc900
connectButton.onclick = initializeConnection;

const destroyButton = document.getElementById('destroy-button'); // @block:const-destroyButton-7ea4a0c5
destroyButton.onclick = async () => {
// @block:try-{-e3873d56
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
// @block:try-{-e3873d56-end
};

const startButton = document.getElementById('start-button'); // @block:const-startButton-87cfc416

startButton.onclick = async () => {
  logger.info('Start button clicked. Current state:', isRecording ? 'Recording' : 'Not recording');
// @block:if--f68daae7
  if (!isRecording) {
// @block:try-{-301d2f4c
    try {
      await startRecording();
    } catch (error) {
      logger.error('Failed to start recording:', error);
      showErrorMessage('Failed to start recording. Please try again.');
    }
// @block:try-{-301d2f4c-end
  } else {
    await stopRecording();
  }
// @block:if--f68daae7-end
};

const saveAvatarButton = document.getElementById('save-avatar-button'); // @block:const-saveAvatarButton-ca9ef367
saveAvatarButton.onclick = saveAvatar;

const avatarImageInput = document.getElementById('avatar-image'); // @block:const-avatarImageInput-8a64a694
avatarImageInput.onchange = (event) => {
  const file = event.target.files[0]; // @block:const-file-02899e24
// @block:if--f07eb728
  if (file) {
    const reader = new FileReader(); // @block:const-reader-d9327cc1
    reader.onload = (e) => {
// @block:document.getElementById('avatar-image-preview').src-=-55ea3097
      document.getElementById('avatar-image-preview').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
// @block:document.getElementById('avatar-image-preview').src-=-55ea3097-end
};

// Export functions and variables that need to be accessed from other modules
export { // @block:export-None-51e302b2
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

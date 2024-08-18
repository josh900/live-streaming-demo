'use strict';
import DID_API from './api.js'; // @block:import-None-9e1740bb
import logger from './logger.js'; // @block:import-None-d61d80f1
const { createClient, LiveTranscriptionEvents } = deepgram; // @block:const-{-f2f8aba1

const deepgramClient = createClient(DID_API.deepgramKey); // @block:const-deepgramClient-cfe23a58

const RTCPeerConnection = ( // @block:const-RTCPeerConnection-943b62a1
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
).bind(window);

let peerConnection; // @block:let-None-cb413238
let pcDataChannel; // @block:let-None-dc7182bc
let streamId; // @block:let-None-ac1a6b07
let sessionId; // @block:let-None-f6a9d848
let sessionClientAnswer; // @block:let-None-9ba981ef
let statsIntervalId; // @block:let-None-4d5003e8
let videoIsPlaying; // @block:let-None-b8e20af7
let lastBytesReceived; // @block:let-None-34b3b269
let chatHistory = []; // @block:let-chatHistory-eaa1f95e
let inactivityTimeout; // @block:let-None-8b608bc4
let keepAliveInterval; // @block:let-None-1147bd30
let socket; // @block:let-None-54339c3a
let isInitializing = false; // @block:let-isInitializing-71b9e92f
let audioContext; // @block:let-None-9949e569
let streamVideoElement; // @block:let-None-5f5314a3
let idleVideoElement; // @block:let-None-bddd1e4c
let deepgramConnection; // @block:let-None-d20647e4
let isRecording = false; // @block:let-isRecording-55f94496
let audioWorkletNode; // @block:let-None-2a53c847
let currentUtterance = ''; // @block:let-currentUtterance-ac3f7dca
let interimMessageAdded = false; // @block:let-interimMessageAdded-a6f28497
let autoSpeakMode = true; // @block:let-autoSpeakMode-5bc40574
let transitionCanvas; // @block:let-None-5471bda5
let transitionCtx; // @block:let-None-dd087b01
let isDebugMode = false; // @block:let-isDebugMode-a5233b57
let isTransitioning = false; // @block:let-isTransitioning-d9e52eda
let lastVideoStatus = null; // @block:let-lastVideoStatus-17fbcdf5
let isCurrentlyStreaming = false; // @block:let-isCurrentlyStreaming-7a3a676e
let reconnectAttempts = 10; // @block:let-reconnectAttempts-af45436d
let persistentStreamId = null; // @block:let-persistentStreamId-e263c6ce
let persistentSessionId = null; // @block:let-persistentSessionId-00bc4079
let isPersistentStreamActive = false; // @block:let-isPersistentStreamActive-cb4a4e3f
const API_RATE_LIMIT = 40; // Maximum number of calls per minute // @block:const-API_RATE_LIMIT-40d6310c
const API_CALL_INTERVAL = 30000 / API_RATE_LIMIT; // Minimum time between API calls in milliseconds // @block:const-API_CALL_INTERVAL-88205b0c
let lastApiCallTime = 0; // @block:let-lastApiCallTime-87fc08fe
const maxRetryCount = 10; // @block:const-maxRetryCount-36a2f8b0
const maxDelaySec = 100; // @block:const-maxDelaySec-1c9a49c9
const RECONNECTION_INTERVAL = 100000; // 25 seconds for testing, adjust as needed // @block:const-RECONNECTION_INTERVAL-28c8cca4
let isAvatarSpeaking = false; // @block:let-isAvatarSpeaking-4a0c0c82
const MAX_RECONNECT_ATTEMPTS = 10; // @block:const-MAX_RECONNECT_ATTEMPTS-a0e671d1
const INITIAL_RECONNECT_DELAY = 2000; // 1 second // @block:const-INITIAL_RECONNECT_DELAY-86bdc6c1
const MAX_RECONNECT_DELAY = 90000; // 30 seconds // @block:const-MAX_RECONNECT_DELAY-439553cc
let autoSpeakInProgress = false; // @block:let-autoSpeakInProgress-e27a3029

const ConnectionState = { // @block:const-ConnectionState-1c8f1903
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
};

let lastConnectionTime = Date.now(); // @block:let-lastConnectionTime-a4434906

let connectionState = ConnectionState.DISCONNECTED; // @block:let-connectionState-c6353103

export function setLogLevel(level) { // @block:export-None-84262ff4
  logger.setLogLevel(level);
  isDebugMode = level === 'DEBUG';
  logger.debug(`Log level set to ${level}. Debug mode is ${isDebugMode ? 'enabled' : 'disabled'}.`);
}

let avatars = {}; // @block:let-avatars-c2036f0a
let currentAvatar = ''; // @block:let-currentAvatar-aad59cc4

const avatarSelect = document.getElementById('avatar-select'); // @block:const-avatarSelect-83174b82
avatarSelect.addEventListener('change', handleAvatarChange);

let context = ` // @block:let-context-b9052395

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
// @block:if--f4cab22b
  if (!streamId || !sessionId) {
    throw new Error('Stream ID or Session ID is missing. Cannot prepare for streaming.');
  }
// @block:if--f4cab22b-end

  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-6edfa4f9
  const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-78286449

// @block:if--b8160d29
  if (!streamVideoElement || !idleVideoElement) {
    throw new Error('Video elements not found');
  }
// @block:if--b8160d29-end

  // Reset video elements
  streamVideoElement.srcObject = null;
  streamVideoElement.src = '';
  streamVideoElement.style.display = 'none';

  idleVideoElement.style.display = 'block';
  idleVideoElement.play().catch((e) => logger.error('Error playing idle video:', e));

  logger.debug('Prepared for streaming');
}

// @block:function-initializeTransitionCanvas-c1960839
function initializeTransitionCanvas() {
  const videoWrapper = document.querySelector('#video-wrapper'); // @block:const-videoWrapper-64017ac6
  const rect = videoWrapper.getBoundingClientRect(); // @block:const-rect-1dcd46b6
  const size = Math.min(rect.width, rect.height, 550); // @block:const-size-526bda78

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
    const videoWrapper = document.querySelector('#video-wrapper'); // @block:const-videoWrapper-f0c81717
    const rect = videoWrapper.getBoundingClientRect(); // @block:const-rect-0a1a33e2
    const size = Math.min(rect.width, rect.height, 550); // @block:const-size-ef2efcc2

    transitionCanvas.width = size;
    transitionCanvas.height = size;
  });
}
// @block:function-initializeTransitionCanvas-c1960839-end

// @block:function-smoothTransition-2b6d7298
function smoothTransition(toStreaming, duration = 250) {
  const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-53af6c08
  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-0ff978ea

// @block:if--751d3422
  if (!idleVideoElement || !streamVideoElement) {
    logger.warn('Video elements not found for transition');
    return;
  }
// @block:if--751d3422-end

// @block:if--60a14fb2
  if (isTransitioning) {
    logger.debug('Transition already in progress, skipping');
    return;
  }
// @block:if--60a14fb2-end

  // Don't transition if we're already in the desired state
// @block:if--ae2d4a47
  if ((toStreaming && isCurrentlyStreaming) || (!toStreaming && !isCurrentlyStreaming)) {
    logger.debug('Already in desired state, skipping transition');
    return;
  }
// @block:if--ae2d4a47-end

  isTransitioning = true;
  logger.debug(`Starting smooth transition to ${toStreaming ? 'streaming' : 'idle'} state`);

  let startTime = null; // @block:let-startTime-d53cb8c0

// @block:function-animate-5fa6a131
  function animate(currentTime) {
// @block:if--25e69bf4
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime; // @block:const-elapsed-6282c30a
    const progress = Math.min(elapsed / duration, 1); // @block:const-progress-82faef0f

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

// @block:if--ae543401
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Ensure final state is set correctly
// @block:if--7dd2d436
      if (toStreaming) {
        streamVideoElement.style.display = 'block';
        idleVideoElement.style.display = 'none';
      } else {
        streamVideoElement.style.display = 'none';
        idleVideoElement.style.display = 'block';
      }
// @block:if--7dd2d436-end
      isTransitioning = false;
      isCurrentlyStreaming = toStreaming;
      transitionCanvas.style.display = 'none';
      logger.debug('Smooth transition completed');
    }
// @block:if--ae543401-end
  }
// @block:if--25e69bf4-end

  // Show the transition canvas
  transitionCanvas.style.display = 'block';

  // Start the animation
  requestAnimationFrame(animate);
}
// @block:function-animate-5fa6a131-end

// @block:function-getVideoElements-568dbd7b
function getVideoElements() {
  const idle = document.getElementById('idle-video-element'); // @block:const-idle-e15197c9
  const stream = document.getElementById('stream-video-element'); // @block:const-stream-9066058c

// @block:if--eb187c59
  if (!idle || !stream) {
    logger.warn('Video elements not found in the DOM');
  }
// @block:if--eb187c59-end

  return { idle, stream };
}
// @block:function-getVideoElements-568dbd7b-end

// @block:function-getStatusLabels-08e259b3
function getStatusLabels() {
  return {
    peer: document.getElementById('peer-status-label'),
    ice: document.getElementById('ice-status-label'),
    iceGathering: document.getElementById('ice-gathering-status-label'),
    signaling: document.getElementById('signaling-status-label'),
    streaming: document.getElementById('streaming-status-label'),
  };
}
// @block:function-getStatusLabels-08e259b3-end

// @block:function-initializeWebSocket-6be57bcb
function initializeWebSocket() {
  socket = new WebSocket(`wss://${window.location.host}`);

  socket.onopen = () => {
    logger.info('WebSocket connection established');
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data); // @block:const-data-299194fa
    logger.debug('Received WebSocket message:', data);

// @block:switch--67f38cdf
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
// @block:switch--67f38cdf-end
  };

  socket.onerror = (error) => {
    logger.error('WebSocket error:', error);
  };

  socket.onclose = () => {
    logger.info('WebSocket connection closed');
    setTimeout(initializeWebSocket, 10000);
  };
}
// @block:function-initializeWebSocket-6be57bcb-end

// @block:function-updateTranscript-0c934226
function updateTranscript(text, isFinal) {
  const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-9102e4b1
  let interimSpan = msgHistory.querySelector('span[data-interim]'); // @block:let-interimSpan-f99fbf31

// @block:if--6c44f39b
  if (isFinal) {
// @block:if--15c63423
    if (interimSpan) {
      interimSpan.remove();
    }
// @block:if--15c63423-end
    msgHistory.innerHTML += `<span><u>User:</u> ${text}</span><br>`;
    logger.debug('Final transcript added to chat history:', text);
    interimMessageAdded = false;
  } else {
// @block:if--0797a7c9
    if (text.trim()) {
// @block:if--8b235449
      if (!interimMessageAdded) {
        msgHistory.innerHTML += `<span data-interim style='opacity:0.5'><u>User (interim):</u> ${text}</span><br>`;
        interimMessageAdded = true;
      } else if (interimSpan) {
        interimSpan.innerHTML = `<u>User (interim):</u> ${text}`;
      }
// @block:if--8b235449-end
    }
// @block:if--0797a7c9-end
  }
// @block:if--6c44f39b-end
  msgHistory.scrollTop = msgHistory.scrollHeight;
}
// @block:function-updateTranscript-0c934226-end

// @block:function-handleTextInput-303682ee
function handleTextInput(text) {
// @block:if--4aff0cb3
  if (text.trim() === '') return;

  const textInput = document.getElementById('text-input'); // @block:const-textInput-8dd42843
  textInput.value = '';

  updateTranscript(text, true);

  chatHistory.push({
    role: 'user',
    content: text,
  });

  sendChatToGroq();
}
// @block:if--4aff0cb3-end

// @block:function-updateAssistantReply-1bb4e58a
function updateAssistantReply(text) {
// @block:document.getElementById('msgHistory').innerHTML-+=-693a891a
  document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${text}</span><br>`;
}
// @block:document.getElementById('msgHistory').innerHTML-+=-693a891a-end

async function initializePersistentStream() {
  logger.info('Initializing persistent stream...');
  connectionState = ConnectionState.CONNECTING;

// @block:try-{-b67f4d10
  try {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, { // @block:const-sessionResponse-ddb04458
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

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json(); // @block:const-{-cc91a8f9

    persistentStreamId = newStreamId;
    persistentSessionId = newSessionId;

    logger.info('Persistent stream created:', { persistentStreamId, persistentSessionId });

// @block:try-{-d269a251
    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
      logger.error('Error during streaming setup:', e);
      stopAllStreams();
      closePC();
      throw e;
    }
// @block:try-{-d269a251-end

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}/sdp`, { // @block:const-sdpResponse-14b3972c
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

// @block:if--2aedff45
    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }
// @block:if--2aedff45-end
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
// @block:try-{-b67f4d10-end
}
// @block:function-updateAssistantReply-1bb4e58a-end

// @block:function-shouldReconnect-4986ce1f
function shouldReconnect() {
  const timeSinceLastConnection = Date.now() - lastConnectionTime; // @block:const-timeSinceLastConnection-647184d3
  return timeSinceLastConnection > RECONNECTION_INTERVAL * 0.9;
}
// @block:function-shouldReconnect-4986ce1f-end

// @block:function-scheduleReconnect-bea9f5f5
function scheduleReconnect() {
// @block:if--bbb8980d
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    logger.error('Max reconnection attempts reached. Please refresh the page.');
    showErrorMessage('Failed to reconnect after multiple attempts. Please refresh the page.');
    return;
  }
// @block:if--bbb8980d-end

  const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY); // @block:const-delay-b6aa6c70
  logger.debug(`Scheduling reconnection attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
  setTimeout(backgroundReconnect, delay);
  reconnectAttempts++;
}
// @block:function-scheduleReconnect-bea9f5f5-end

// @block:function-startKeepAlive-8c82ba0f
function startKeepAlive() {
// @block:if--db0335b1
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
// @block:if--db0335b1-end

  keepAliveInterval = setInterval(() => {
// @block:if--c449cb61
    if (isPersistentStreamActive && peerConnection && peerConnection.connectionState === 'connected' && pcDataChannel) {
// @block:try-{-e47c825f
      try {
        const keepAliveMessage = JSON.stringify({ type: 'KeepAlive' }); // @block:const-keepAliveMessage-9db91453
// @block:if--6ee63f81
        if (pcDataChannel.readyState === 'open') {
          pcDataChannel.send(keepAliveMessage);
          logger.debug('Keepalive message sent successfully');
        } else {
          logger.warn('Data channel is not open. Current state:', pcDataChannel.readyState);
        }
// @block:if--6ee63f81-end
      } catch (error) {
        logger.warn('Error sending keepalive message:', error);
      }
// @block:try-{-e47c825f-end
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
// @block:if--c449cb61-end
  }, 30000); // Send keepalive every 30 seconds
}
// @block:function-startKeepAlive-8c82ba0f-end

async function destroyPersistentStream() {
// @block:if--63b13fec
  if (persistentStreamId) {
// @block:try-{-5b8b67dd
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
// @block:if--c9a73dd1
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
// @block:if--c9a73dd1-end
      connectionState = ConnectionState.DISCONNECTED;
    }
// @block:try-{-5b8b67dd-end
  }
// @block:if--63b13fec-end
}
// @block:function-handleTextInput-303682ee-end

async function reinitializePersistentStream() {
  logger.info('Reinitializing persistent stream...');
  await destroyPersistentStream();
  await initializePersistentStream();
}
// @block:function-smoothTransition-2b6d7298-end

async function createNewPersistentStream() {
  logger.debug('Creating new persistent stream...');

// @block:try-{-5c3ad87e
  try {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, { // @block:const-sessionResponse-0a63d104
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

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json(); // @block:const-{-824d730c

    logger.debug('New stream created:', { newStreamId, newSessionId });

    const newSessionClientAnswer = await createPeerConnection(offer, iceServers); // @block:const-newSessionClientAnswer-58d11f1e

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${newStreamId}/sdp`, { // @block:const-sdpResponse-3c49bd68
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

// @block:if--c9b290f9
    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }
// @block:if--c9b290f9-end

    return { streamId: newStreamId, sessionId: newSessionId };
  } catch (error) {
    logger.error('Error creating new persistent stream:', error);
    return null;
  }
// @block:try-{-5c3ad87e-end
}

async function backgroundReconnect() {
// @block:if--ed1a85fb
  if (connectionState === ConnectionState.RECONNECTING) {
    logger.debug('Background reconnection already in progress. Skipping.');
    return;
  }
// @block:if--ed1a85fb-end

  connectionState = ConnectionState.RECONNECTING;
  logger.debug('Starting background reconnection process...');

// @block:try-{-17da1e9c
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
// @block:try-{-17da1e9c-end
}

// @block:function-waitForIdleState-d0279ea4
function waitForIdleState() {
  return new Promise((resolve) => {
    const checkIdleState = () => { // @block:const-checkIdleState-63305523
// @block:if--0e6afed6
      if (!isAvatarSpeaking) {
        resolve();
      } else {
        setTimeout(checkIdleState, 500); // Check every 500ms
      }
// @block:if--0e6afed6-end
    };
    checkIdleState();
  });
}
// @block:function-waitForIdleState-d0279ea4-end

async function switchToNewStream(newStreamData) {
  logger.debug('Switching to new stream...');

// @block:try-{-db9b84d3
  try {
    connectionState = ConnectionState.RECONNECTING;

    // Quickly switch the video source to the new stream
// @block:if--28c9a9e2
    if (streamVideoElement) {
      // Instead of directly setting src, we need to update the WebRTC connection
      await updateWebRTCConnection(newStreamData);
    }
// @block:if--28c9a9e2-end

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
// @block:try-{-db9b84d3-end
}

async function updateWebRTCConnection(newStreamData) {
  logger.debug('Updating WebRTC connection...');

// @block:try-{-e2b987e2
  try {
    const offer = await fetchStreamOffer(newStreamData.streamId); // @block:const-offer-61dbf8de
    const iceServers = await fetchIceServers(); // @block:const-iceServers-a3d598c9

    const newSessionClientAnswer = await createPeerConnection(offer, iceServers); // @block:const-newSessionClientAnswer-4f133afc

    await sendSDPAnswer(newStreamData.streamId, newStreamData.sessionId, newSessionClientAnswer);

    logger.debug('WebRTC connection updated successfully');
  } catch (error) {
    logger.error('Error updating WebRTC connection:', error);
    throw error;
  }
// @block:try-{-e2b987e2-end
}

async function fetchStreamOffer(streamId) {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/offer`, { // @block:const-response-36b78ef9
    method: 'GET',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
    },
  });
  const data = await response.json(); // @block:const-data-3af02cc1
  return data.offer;
}

async function fetchIceServers() {
  const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/ice_servers`, { // @block:const-response-4f9dd09b
    method: 'GET',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
    },
  });
  const data = await response.json(); // @block:const-data-a957a1b8
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

  const { idle, stream } = getVideoElements(); // @block:const-{-e1d92208
  idleVideoElement = idle;
  streamVideoElement = stream;

// @block:if--db71519a
  if (idleVideoElement) idleVideoElement.setAttribute('playsinline', '');
// @block:if--d06b739c
  if (streamVideoElement) streamVideoElement.setAttribute('playsinline', '');

  initializeTransitionCanvas();

  await loadAvatars();
  populateAvatarSelect();

  const contextInput = document.getElementById('context-input'); // @block:const-contextInput-7da6492a
  contextInput.value = context.trim();
  contextInput.addEventListener('input', () => {
// @block:if--53aa879a
    if (!contextInput.value.includes('Original Context:')) {
      context = contextInput.value.trim();
    }
// @block:if--53aa879a-end
  });

  const sendTextButton = document.getElementById('send-text-button'); // @block:const-sendTextButton-69507816
  const textInput = document.getElementById('text-input'); // @block:const-textInput-62f9a7a0
  const replaceContextButton = document.getElementById('replace-context-button'); // @block:const-replaceContextButton-191bf5cf
  const autoSpeakToggle = document.getElementById('auto-speak-toggle'); // @block:const-autoSpeakToggle-93990156
  const editAvatarButton = document.getElementById('edit-avatar-button'); // @block:const-editAvatarButton-b7354c05

  sendTextButton.addEventListener('click', () => handleTextInput(textInput.value));
  textInput.addEventListener('keypress', (event) => {
// @block:if--8005d26e
    if (event.key === 'Enter') handleTextInput(textInput.value);
  });
  replaceContextButton.addEventListener('click', () => updateContext('replace'));
  autoSpeakToggle.addEventListener('click', toggleAutoSpeak);
  editAvatarButton.addEventListener('click', () => openAvatarModal(currentAvatar));

  initializeWebSocket();
  playIdleVideo();

  showLoadingSymbol();
// @block:try-{-39885268
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
// @block:try-{-39885268-end

  // Set up reconnection mechanism
  window.addEventListener('online', async () => {
// @block:if--fe64ba60
    if (connectionState === ConnectionState.DISCONNECTED) {
      logger.info('Network connection restored. Attempting to reconnect...');
// @block:try-{-9f10ad87
      try {
        await backgroundReconnect();
      } catch (error) {
        logger.error('Failed to reconnect after network restoration:', error);
      }
// @block:try-{-9f10ad87-end
    }
// @block:if--fe64ba60-end
  });

  // Handle visibility change
// @block:document.addEventListener('visibilitychange',--a6d15058
  document.addEventListener('visibilitychange', () => {
// @block:if--050e2cf8
    if (!document.hidden && connectionState === ConnectionState.DISCONNECTED) {
      logger.info('Page became visible. Checking connection...');
// @block:if--afc62f99
      if (navigator.onLine) {
        backgroundReconnect();
      }
// @block:if--afc62f99-end
    }
// @block:if--050e2cf8-end
  });

  logger.info('Initialization complete');
}
// @block:document.addEventListener('visibilitychange',--a6d15058-end

async function handleAvatarChange() {
  currentAvatar = avatarSelect.value;
// @block:if--ba502eaa
  if (currentAvatar === 'create-new') {
    openAvatarModal();
    return;
  }
// @block:if--ba502eaa-end

  const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-38d2733e
// @block:if--c79c3fd0
  if (idleVideoElement) {
    idleVideoElement.src = avatars[currentAvatar].silentVideoUrl;
// @block:try-{-9209beb4
    try {
      await idleVideoElement.load();
      logger.debug(`Idle video loaded for ${currentAvatar}`);
    } catch (error) {
      logger.error(`Error loading idle video for ${currentAvatar}:`, error);
    }
// @block:try-{-9209beb4-end
  }
// @block:if--c79c3fd0-end

  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-efc6bdb4
// @block:if--f74ae143
  if (streamVideoElement) {
    streamVideoElement.srcObject = null;
  }
// @block:if--f74ae143-end

  await stopRecording();
  currentUtterance = '';
  interimMessageAdded = false;
  const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-346a1382
  msgHistory.innerHTML = '';
  chatHistory = [];

  await destroyPersistentStream();
  await initializePersistentStream();
}
// @block:if--8005d26e-end

async function loadAvatars() {
// @block:try-{-1e7ea049
  try {
    const response = await fetch('/avatars'); // @block:const-response-9b75d1bc
// @block:if--1a839d45
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
// @block:if--1a839d45-end
    avatars = await response.json();
    logger.debug('Avatars loaded:', avatars);
  } catch (error) {
    logger.error('Error loading avatars:', error);
    showErrorMessage('Failed to load avatars. Please try again.');
  }
// @block:try-{-1e7ea049-end
}
// @block:if--d06b739c-end

// @block:function-populateAvatarSelect-e8b2bfbe
function populateAvatarSelect() {
  const avatarSelect = document.getElementById('avatar-select'); // @block:const-avatarSelect-570fbfa5
  avatarSelect.innerHTML = '';

  const createNewOption = document.createElement('option'); // @block:const-createNewOption-2c719808
  createNewOption.value = 'create-new';
  createNewOption.textContent = 'Create New Avatar';
  avatarSelect.appendChild(createNewOption);

// @block:for--88cb1dea
  for (const [key, value] of Object.entries(avatars)) {
    const option = document.createElement('option'); // @block:const-option-90005120
    option.value = key;
    option.textContent = value.name;
    avatarSelect.appendChild(option);
  }
// @block:for--88cb1dea-end

// @block:if--2d525d3b
  if (Object.keys(avatars).length > 0) {
    currentAvatar = Object.keys(avatars)[0];
    avatarSelect.value = currentAvatar;
  }
// @block:if--2d525d3b-end
}
// @block:function-populateAvatarSelect-e8b2bfbe-end

// @block:function-openAvatarModal-a6747aa4
function openAvatarModal(avatarName = null) {
  const modal = document.getElementById('avatar-modal'); // @block:const-modal-99b97a26
  const nameInput = document.getElementById('avatar-name'); // @block:const-nameInput-f9d68290
  const voiceInput = document.getElementById('avatar-voice'); // @block:const-voiceInput-33f8893d
  const imagePreview = document.getElementById('avatar-image-preview'); // @block:const-imagePreview-51abd18b
  const saveButton = document.getElementById('save-avatar-button'); // @block:const-saveButton-749bd932

// @block:if--843a9967
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
// @block:if--843a9967-end

  modal.style.display = 'block';
}
// @block:function-openAvatarModal-a6747aa4-end

// @block:function-closeAvatarModal-5d4ad84a
function closeAvatarModal() {
  const modal = document.getElementById('avatar-modal'); // @block:const-modal-c096171a
  modal.style.display = 'none';
}
// @block:function-closeAvatarModal-5d4ad84a-end

async function saveAvatar() {
  const name = document.getElementById('avatar-name').value; // @block:const-name-e452ea02
  const voiceId = document.getElementById('avatar-voice').value || 'en-US-GuyNeural'; // @block:const-voiceId-b17c062c
  const imageFile = document.getElementById('avatar-image').files[0]; // @block:const-imageFile-47a311e3

// @block:if--5b411980
  if (!name) {
    showErrorMessage('Please fill in the avatar name.');
    return;
  }
// @block:if--5b411980-end

  const formData = new FormData(); // @block:const-formData-29e7bf05
// @block:formData.append('name',-name);-426a8740
  formData.append('name', name);
// @block:formData.append('voiceId',-voiceId);-ad3054bb
  formData.append('voiceId', voiceId);
// @block:if--c0e29b47
  if (imageFile) {
// @block:formData.append('image',-imageFile);-d1f71de1
    formData.append('image', imageFile);
  }
// @block:formData.append('image',-imageFile);-d1f71de1-end

  showToast('Saving avatar...', 0);

// @block:try-{-d6a0bf1c
  try {
    const response = await fetch('/avatar', { // @block:const-response-7e7fa321
      method: 'POST',
      body: formData,
    });

    const reader = response.body.getReader(); // @block:const-reader-58b71dab
    const decoder = new TextDecoder(); // @block:const-decoder-f0231a34

// @block:while--6188cb96
    while (true) {
      const { done, value } = await reader.read(); // @block:const-{-b42ea599
// @block:if--38f1c77e
      if (done) break;

      const chunk = decoder.decode(value); // @block:const-chunk-b6e5fda3
      const events = chunk.split('\n\n'); // @block:const-events-56878a19

// @block:for--ed1e8821
      for (const event of events) {
// @block:if--9620c161
        if (event.startsWith('data: ')) {
          const data = JSON.parse(event.slice(6)); // @block:const-data-3d425a16
// @block:if--f76eef67
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
// @block:if--f76eef67-end
        }
// @block:if--9620c161-end
      }
// @block:for--ed1e8821-end
    }
// @block:if--38f1c77e-end
  } catch (error) {
    console.error('Error saving avatar:', error);
    showErrorMessage('Failed to save avatar. Please try again.');
  }
// @block:while--6188cb96-end
}
// @block:try-{-d6a0bf1c-end

// @block:function-updateContext-8a6b9a06
function updateContext(action) {
  const contextInput = document.getElementById('context-input'); // @block:const-contextInput-cf0246fc
  const newContext = contextInput.value.trim(); // @block:const-newContext-444af6e2

// @block:if--89eeb4de
  if (newContext) {
    const originalContext = context; // @block:const-originalContext-0a9f53fe
// @block:if--1fb17224
    if (action === 'append') {
      context += '\n' + newContext;
    } else if (action === 'replace') {
      context = newContext;
    }
// @block:if--1fb17224-end
    logger.debug('Context updated:', context);
    showToast('Context saved successfully');

    displayBothContexts(originalContext, context);
  } else {
    showToast('Please enter some text before updating the context');
  }
// @block:if--89eeb4de-end
}
// @block:function-updateContext-8a6b9a06-end

// @block:function-displayBothContexts-a53300ca
function displayBothContexts(original, updated) {
  const contextInput = document.getElementById('context-input'); // @block:const-contextInput-cddce1de
  contextInput.value = `Original Context:\n${original}\n\nNew Context:\n${updated}`;

  setTimeout(() => {
    contextInput.value = updated;
  }, 3000);
}
// @block:function-displayBothContexts-a53300ca-end

// @block:function-showToast-8028ec62
function showToast(message) {
  const toast = document.createElement('div'); // @block:const-toast-83f3cd07
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

// @block:document.body.appendChild(toast);-None-71b647e5
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease-out';
    setTimeout(() => {
// @block:document.body.removeChild(toast);-None-a070bd64
      document.body.removeChild(toast);
    }, 500);
  }, 3000);
}
// @block:document.body.removeChild(toast);-None-a070bd64-end

// @block:if--ed9b1d2c
if (document.readyState === 'loading') {
// @block:document.addEventListener('DOMContentLoaded',-initialize);-f7f2fa61
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
// @block:document.addEventListener('DOMContentLoaded',-initialize);-f7f2fa61-end

// @block:function-showLoadingSymbol-f42dc037
function showLoadingSymbol() {
  const loadingSymbol = document.createElement('div'); // @block:const-loadingSymbol-e7d7fee3
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
// @block:document.body.appendChild(loadingSymbol);-None-08a3dd9e
  document.body.appendChild(loadingSymbol);
}
// @block:document.body.appendChild(loadingSymbol);-None-08a3dd9e-end

// @block:function-hideLoadingSymbol-b3491429
function hideLoadingSymbol() {
  const loadingSymbol = document.getElementById('loading-symbol'); // @block:const-loadingSymbol-568b3ba4
// @block:if--419f3e03
  if (loadingSymbol) {
// @block:document.body.removeChild(loadingSymbol);-None-1bb7ae19
    document.body.removeChild(loadingSymbol);
  }
// @block:document.body.removeChild(loadingSymbol);-None-1bb7ae19-end
}
// @block:if--419f3e03-end

// @block:function-showErrorMessage-102d5da3
function showErrorMessage(message) {
  const errorMessage = document.createElement('div'); // @block:const-errorMessage-79b1cfec
  errorMessage.innerHTML = message;
  errorMessage.style.color = 'red';
  errorMessage.style.marginBottom = '10px';
// @block:document.body.appendChild(errorMessage);-None-98d5b9a3
  document.body.appendChild(errorMessage);

  const destroyButton = document.getElementById('destroy-button'); // @block:const-destroyButton-3e0c58a7
  const connectButton = document.getElementById('connect-button'); // @block:const-connectButton-784bf249
  connectButton.onclick = initializePersistentStream;

// @block:if--fc305db8
  if (destroyButton) destroyButton.style.display = 'inline-block';
  destroyButton.onclick = destroyPersistentStream;

// @block:if--1357b42e
  if (connectButton) connectButton.style.display = 'inline-block';
}
// @block:if--1357b42e-end

async function createPeerConnection(offer, iceServers) {
// @block:if--f6aaef3b
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
// @block:if--f6aaef3b-end

  await peerConnection.setRemoteDescription(offer);
  logger.debug('Set remote SDP');

  const sessionClientAnswer = await peerConnection.createAnswer(); // @block:const-sessionClientAnswer-29d7bb93
  logger.debug('Created local SDP');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  logger.debug('Set local SDP');

  return sessionClientAnswer;
}
// @block:if--fc305db8-end

// @block:function-onIceGatheringStateChange-a19eca85
function onIceGatheringStateChange() {
  const { iceGathering: iceGatheringStatusLabel } = getStatusLabels(); // @block:const-{-2092bbb7
// @block:if--dd87c04c
  if (iceGatheringStatusLabel) {
    iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
    iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
  }
// @block:if--dd87c04c-end
  logger.debug('ICE gathering state changed:', peerConnection.iceGatheringState);
}
// @block:function-onIceGatheringStateChange-a19eca85-end

// @block:function-onIceCandidate-8af92e4f
function onIceCandidate(event) {
// @block:if--1533efc7
  if (event.candidate && persistentStreamId && persistentSessionId) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate; // @block:const-{-89d78224
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
// @block:if--1533efc7-end
}
// @block:function-onIceCandidate-8af92e4f-end

// @block:function-onIceConnectionStateChange-ebfde1bc
function onIceConnectionStateChange() {
  const { ice: iceStatusLabel } = getStatusLabels(); // @block:const-{-07d0b916
// @block:if--c72f60f7
  if (iceStatusLabel) {
    iceStatusLabel.innerText = peerConnection.iceConnectionState;
    iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
  }
// @block:if--c72f60f7-end
  logger.debug('ICE connection state changed:', peerConnection.iceConnectionState);

// @block:if--a8b3c7d7
  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
    showErrorMessage('Connection lost. Please try again.');
  }
// @block:if--a8b3c7d7-end
}
// @block:function-onIceConnectionStateChange-ebfde1bc-end

async function attemptReconnect() {
  logger.debug('Attempting to reconnect...');
// @block:try-{-34f6fea6
  try {
    await reinitializeConnection();
    logger.debug('Reconnection successful');
    reconnectAttempts = 0;
  } catch (error) {
    logger.error('Reconnection attempt failed:', error);
    scheduleReconnect();
  }
// @block:try-{-34f6fea6-end
}
// @block:document.body.appendChild(errorMessage);-None-98d5b9a3-end

// @block:function-onConnectionStateChange-d2d594bf
function onConnectionStateChange() {
  const { peer: peerStatusLabel } = getStatusLabels(); // @block:const-{-b79a0a87
// @block:if--7503c393
  if (peerStatusLabel) {
    peerStatusLabel.innerText = peerConnection.connectionState;
    peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
  }
// @block:if--7503c393-end
  logger.debug('Peer connection state changed:', peerConnection.connectionState);

// @block:if--1ce020dc
  if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
    logger.warn('Peer connection failed or disconnected. Attempting to reconnect...');
    connectionState = ConnectionState.DISCONNECTED;
    backgroundReconnect();
  } else if (peerConnection.connectionState === 'connected') {
    logger.debug('Peer connection established successfully');
    connectionState = ConnectionState.CONNECTED;
    reconnectAttempts = 0;
  }
// @block:if--1ce020dc-end
}
// @block:function-onConnectionStateChange-d2d594bf-end

// @block:function-startConnectionHealthCheck-600561a3
function startConnectionHealthCheck() {
  setInterval(() => {
// @block:if--6bbbaa25
    if (peerConnection) {
// @block:if--c64366e0
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        logger.warn('Connection health check detected disconnected state. Attempting to reconnect...');
        connectionState = ConnectionState.DISCONNECTED;
        backgroundReconnect();
      } else if (peerConnection.connectionState === 'connected') {
        const timeSinceLastConnection = Date.now() - lastConnectionTime; // @block:const-timeSinceLastConnection-10ffe33e
// @block:if--cd1ed765
        if (timeSinceLastConnection > RECONNECTION_INTERVAL * 0.9) {
          logger.info('Approaching reconnection threshold. Initiating background reconnect.');
          backgroundReconnect();
        }
// @block:if--cd1ed765-end
      }
// @block:if--c64366e0-end
    }
// @block:if--6bbbaa25-end
  }, 30000); // Check every 30 seconds
}
// @block:function-startConnectionHealthCheck-600561a3-end

// @block:function-onSignalingStateChange-9dca7107
function onSignalingStateChange() {
  const { signaling: signalingStatusLabel } = getStatusLabels(); // @block:const-{-5aea96b7
// @block:if--de6accac
  if (signalingStatusLabel) {
    signalingStatusLabel.innerText = peerConnection.signalingState;
    signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
  }
// @block:if--de6accac-end
  logger.debug('Signaling state changed:', peerConnection.signalingState);
}
// @block:function-onSignalingStateChange-9dca7107-end

// @block:function-onVideoStatusChange-883230cd
function onVideoStatusChange(videoIsPlaying, stream) {
  let status = videoIsPlaying ? 'streaming' : 'empty'; // @block:let-status-763c5433

// @block:if--3f177228
  if (status === lastVideoStatus) {
    logger.debug('Video status unchanged:', status);
    return;
  }
// @block:if--3f177228-end

  logger.debug('Video status changing from', lastVideoStatus, 'to', status);

  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-dc0a1cef
  const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-a7754c68

// @block:if--2e314c67
  if (!streamVideoElement || !idleVideoElement) {
    logger.error('Video elements not found');
    return;
  }
// @block:if--2e314c67-end

// @block:if--e3785060
  if (status === 'streaming') {
    setStreamVideoElement(stream);
  } else {
    smoothTransition(false);
  }
// @block:if--e3785060-end

  lastVideoStatus = status;

  const streamingStatusLabel = document.getElementById('streaming-status-label'); // @block:const-streamingStatusLabel-8def3a46
// @block:if--4d290c58
  if (streamingStatusLabel) {
    streamingStatusLabel.innerText = status;
    streamingStatusLabel.className = 'streamingState-' + status;
  }
// @block:if--4d290c58-end

  logger.debug('Video status changed:', status);
}
// @block:function-onVideoStatusChange-883230cd-end

// @block:function-setStreamVideoElement-5d8948d4
function setStreamVideoElement(stream) {
  const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-22e7c56a
// @block:if--5eaaf2f7
  if (!streamVideoElement) {
    logger.error('Stream video element not found');
    return;
  }
// @block:if--5eaaf2f7-end

  logger.debug('Setting stream video element');
// @block:if--83610f43
  if (stream instanceof MediaStream) {
    streamVideoElement.srcObject = stream;
  } else {
    logger.warn('Invalid stream provided to setStreamVideoElement');
    return;
  }
// @block:if--83610f43-end

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
// @block:function-setStreamVideoElement-5d8948d4-end

// @block:function-onStreamEvent-56e65405
function onStreamEvent(message) {
// @block:if--3e6f80a2
  if (pcDataChannel.readyState === 'open') {
    let status; // @block:let-None-a2ca8df9
    const [event, _] = message.data.split(':'); // @block:const-[event,-3d52e20c

// @block:switch--faa654d2
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
// @block:switch--faa654d2-end

    // Set stream ready after a short delay, adjusting for potential timing differences between data and stream channels
// @block:if--b3189351
    if (status === 'ready') {
      setTimeout(() => {
        console.log('stream/ready');
        isStreamReady = true;
        const streamEventLabel = document.getElementById('stream-event-label'); // @block:const-streamEventLabel-b47235c7
// @block:if--4df51154
        if (streamEventLabel) {
          streamEventLabel.innerText = 'ready';
          streamEventLabel.className = 'streamEvent-ready';
        }
// @block:if--4df51154-end
      }, 1000);
    } else {
      console.log(event);
      const streamEventLabel = document.getElementById('stream-event-label'); // @block:const-streamEventLabel-ef9f27d8
// @block:if--9967ee7a
      if (streamEventLabel) {
        streamEventLabel.innerText = status === 'dont-care' ? event : status;
        streamEventLabel.className = 'streamEvent-' + status;
      }
// @block:if--9967ee7a-end
    }
// @block:if--b3189351-end
  }
// @block:if--3e6f80a2-end
}
// @block:function-onStreamEvent-56e65405-end

// @block:function-onTrack-4ff2e55a
function onTrack(event) {
  logger.debug('onTrack event:', event);
// @block:if--f917258c
  if (!event.track) {
    logger.warn('No track in onTrack event');
    return;
  }
// @block:if--f917258c-end

// @block:if--5f68ffb0
  if (statsIntervalId) {
    clearInterval(statsIntervalId);
  }
// @block:if--5f68ffb0-end

  statsIntervalId = setInterval(async () => {
// @block:if--3c97ad5c
    if (peerConnection && peerConnection.connectionState === 'connected') {
// @block:try-{-0bfa560c
      try {
        const stats = await peerConnection.getStats(event.track); // @block:const-stats-2c7ec75e
        let videoStatsFound = false; // @block:let-videoStatsFound-d2b8f01f
        stats.forEach((report) => {
// @block:if--0977d31f
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            videoStatsFound = true;
            const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived; // @block:const-videoStatusChanged-4edaae23

            // logger.debug('Video stats:', {
            //  bytesReceived: report.bytesReceived,
            //  lastBytesReceived,
            //  videoIsPlaying,
            //  videoStatusChanged
            // });

// @block:if--99a4a8f9
            if (videoStatusChanged) {
              videoIsPlaying = report.bytesReceived > lastBytesReceived;
              logger.debug('Video status changed:', videoIsPlaying);
              onVideoStatusChange(videoIsPlaying, event.streams[0]);
            }
// @block:if--99a4a8f9-end
            lastBytesReceived = report.bytesReceived;
          }
// @block:if--0977d31f-end
        });
// @block:if--11460533
        if (!videoStatsFound) {
          logger.debug('No video stats found yet.');
        }
// @block:if--11460533-end
      } catch (error) {
        logger.error('Error getting stats:', error);
      }
// @block:try-{-0bfa560c-end
    } else {
      logger.debug('Peer connection not ready for stats.');
    }
// @block:if--3c97ad5c-end
  }, 250); // Check every 500ms

// @block:if--7e1074ac
  if (event.streams && event.streams.length > 0) {
    const stream = event.streams[0]; // @block:const-stream-3348c648
// @block:if--244de0a4
    if (stream.getVideoTracks().length > 0) {
      logger.debug('Setting stream video element with track:', event.track.id);
      setStreamVideoElement(stream);
    } else {
      logger.warn('Stream does not contain any video tracks');
    }
// @block:if--244de0a4-end
  } else {
    logger.warn('No streams found in onTrack event');
  }
// @block:if--7e1074ac-end

// @block:if--422c10f0
  if (isDebugMode) {
    // downloadStreamVideo(event.streams[0]);
  }
// @block:if--422c10f0-end
}
// @block:function-onTrack-4ff2e55a-end

// @block:function-playIdleVideo-24245ddd
function playIdleVideo() {
  const { idle: idleVideoElement } = getVideoElements(); // @block:const-{-6fe309b7
// @block:if--5f34dde9
  if (!idleVideoElement) {
    logger.error('Idle video element not found');
    return;
  }
// @block:if--5f34dde9-end

// @block:if--2708c5e2
  if (!currentAvatar || !avatars[currentAvatar]) {
    logger.warn(`No avatar selected or avatar ${currentAvatar} not found. Using default idle video.`);
    idleVideoElement.src = 'path/to/default/idle/video.mp4'; // Replace with your default video path
  } else {
    idleVideoElement.src = avatars[currentAvatar].silentVideoUrl;
  }
// @block:if--2708c5e2-end

  idleVideoElement.loop = true;

  idleVideoElement.onloadeddata = () => {
    logger.debug(`Idle video loaded successfully for ${currentAvatar || 'default'}`);
  };

  idleVideoElement.onerror = (e) => {
    logger.error(`Error loading idle video for ${currentAvatar || 'default'}:`, e);
  };

  idleVideoElement.play().catch((e) => logger.error('Error playing idle video:', e));
}
// @block:function-playIdleVideo-24245ddd-end

// @block:function-stopAllStreams-02d081f6
function stopAllStreams() {
// @block:if--fc4023e2
  if (streamVideoElement && streamVideoElement.srcObject) {
    logger.debug('Stopping video streams');
    streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    streamVideoElement.srcObject = null;
  }
// @block:if--fc4023e2-end
}
// @block:function-stopAllStreams-02d081f6-end

// @block:function-closePC-049973e0
function closePC(pc = peerConnection) {
// @block:if--30bd1d6e
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
  const labels = getStatusLabels(); // @block:const-labels-9dbb7c68
// @block:if--62c55fbe
  if (labels.iceGathering) labels.iceGathering.innerText = '';
// @block:if--d4b4703c
  if (labels.signaling) labels.signaling.innerText = '';
// @block:if--b0b90cfc
  if (labels.ice) labels.ice.innerText = '';
// @block:if--8e78df6f
  if (labels.peer) labels.peer.innerText = '';
  logger.debug('Stopped peer connection');
// @block:if--a933c3d6
  if (pc === peerConnection) {
    peerConnection = null;
  }
// @block:if--a933c3d6-end
}
// @block:if--8e78df6f-end

async function fetchWithRetries(url, options, retries = 0, delayMs = 1000) {
// @block:try-{-5bcca0ca
  try {
    const now = Date.now(); // @block:const-now-d8f7defd
    const timeSinceLastCall = now - lastApiCallTime; // @block:const-timeSinceLastCall-430f65cc

// @block:if--74ffd33b
    if (timeSinceLastCall < API_CALL_INTERVAL) {
      await new Promise((resolve) => setTimeout(resolve, API_CALL_INTERVAL - timeSinceLastCall));
    }
// @block:if--74ffd33b-end

    lastApiCallTime = Date.now();

    const response = await fetch(url, options); // @block:const-response-58a0a263
// @block:if--509a2cf8
    if (!response.ok) {
// @block:if--ca37045b
      if (response.status === 429) {
        // If rate limited, wait for a longer time before retrying
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10); // @block:const-retryAfter-ddb19875
        logger.warn(`Rate limited. Retrying after ${retryAfter} seconds.`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        return fetchWithRetries(url, options, retries, delayMs);
      }
// @block:if--ca37045b-end
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }
// @block:if--509a2cf8-end
    return response;
  } catch (err) {
// @block:if--74bee949
    if (retries < maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) * delayMs + Math.random() * 1000, maxDelaySec * 1000); // @block:const-delay-ced95541
      logger.warn(`Request failed, retrying ${retries + 1}/${maxRetryCount} in ${delay}ms. Error: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetries(url, options, retries + 1, delayMs);
    } else {
      throw err;
    }
// @block:if--74bee949-end
  }
// @block:try-{-5bcca0ca-end
}
// @block:if--b0b90cfc-end

async function initializeConnection() {
// @block:if--2aa1762c
  if (isInitializing) {
    logger.warn('Connection initialization already in progress. Skipping initialize.');
    return;
  }
// @block:if--2aa1762c-end

  isInitializing = true;
  logger.info('Initializing connection...');

// @block:try-{-f5855884
  try {
    stopAllStreams();
    closePC();

// @block:if--6825fd2b
    if (!currentAvatar || !avatars[currentAvatar]) {
      throw new Error('No avatar selected or avatar not found');
    }
// @block:if--6825fd2b-end

    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, { // @block:const-sessionResponse-1baa1c5e
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

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json(); // @block:const-{-befc3123

// @block:if--4e49227d
    if (!newStreamId || !newSessionId) {
      throw new Error('Failed to get valid stream ID or session ID from API');
    }
// @block:if--4e49227d-end

    streamId = newStreamId;
    sessionId = newSessionId;
    logger.info('Stream created:', { streamId, sessionId });

// @block:try-{-f9c6ec67
    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
      logger.error('Error during streaming setup:', e);
      stopAllStreams();
      closePC();
      throw e;
    }
// @block:try-{-f9c6ec67-end

    await new Promise((resolve) => setTimeout(resolve, 6000));

    const sdpResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, { // @block:const-sdpResponse-82de5796
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

// @block:if--29e882d4
    if (!sdpResponse.ok) {
      throw new Error(`Failed to set SDP: ${sdpResponse.status} ${sdpResponse.statusText}`);
    }
// @block:if--29e882d4-end

    logger.info('Connection initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize connection:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
// @block:try-{-f5855884-end
}
// @block:if--d4b4703c-end

async function startStreaming(assistantReply) {
// @block:try-{-52a32150
  try {
    logger.debug('Starting streaming with reply:', assistantReply);
// @block:if--dbffaf61
    if (!persistentStreamId || !persistentSessionId) {
      logger.error('Persistent stream not initialized. Cannot start streaming.');
      await initializePersistentStream();
    }
// @block:if--dbffaf61-end

// @block:if--2e007323
    if (!currentAvatar || !avatars[currentAvatar]) {
      logger.error('No avatar selected or avatar not found. Cannot start streaming.');
      return;
    }
// @block:if--2e007323-end

    const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-85d96ba3
    const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-728eeb93

// @block:if--ed13102a
    if (!streamVideoElement || !idleVideoElement) {
      logger.error('Video elements not found');
      return;
    }
// @block:if--ed13102a-end

    // Remove outer <speak> tags if present
    let ssmlContent = assistantReply.trim(); // @block:let-ssmlContent-d2abb978
// @block:if--6a2d8117
    if (ssmlContent.startsWith('<speak>') && ssmlContent.endsWith('</speak>')) {
      ssmlContent = ssmlContent.slice(7, -8).trim();
    }
// @block:if--6a2d8117-end

    // Split the SSML content into chunks, respecting SSML tags
    const chunks = ssmlContent.match(/(?:<[^>]+>|[^<]+)+/g) || []; // @block:const-chunks-3507ba6d

    logger.debug('Chunks', chunks);

// @block:for--a6797f05
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim(); // @block:const-chunk-d4049bf8
// @block:if--f1ff4a7e
      if (chunk.length === 0) continue;

      isAvatarSpeaking = true;
      const playResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${persistentStreamId}`, { // @block:const-playResponse-8d4f553f
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

// @block:if--fb3838d0
      if (!playResponse.ok) {
        throw new Error(`HTTP error! status: ${playResponse.status}`);
      }
// @block:if--fb3838d0-end

      const playResponseData = await playResponse.json(); // @block:const-playResponseData-9cbb2b8c
      logger.debug('Streaming response:', playResponseData);

// @block:if--e9b372f5
      if (playResponseData.status === 'started') {
        logger.debug('Stream chunk started successfully');

// @block:if--2777d6d3
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
// @block:if--2777d6d3-end
      } else {
        logger.warn('Unexpected response status:', playResponseData.status);
      }
// @block:if--e9b372f5-end
    }
// @block:if--f1ff4a7e-end

    isAvatarSpeaking = false;
    smoothTransition(false);

    // Check if we need to reconnect
// @block:if--4a756fc7
    if (shouldReconnect()) {
      logger.info('Approaching reconnection threshold. Initiating background reconnect.');
      await backgroundReconnect();
    }
// @block:if--4a756fc7-end
  } catch (error) {
    logger.error('Error during streaming:', error);
// @block:if--88af0506
    if (error.message.includes('HTTP error! status: 404') || error.message.includes('missing or invalid session_id')) {
      logger.warn('Stream not found or invalid session. Attempting to reinitialize persistent stream.');
      await reinitializePersistentStream();
    }
// @block:if--88af0506-end
  }
// @block:for--a6797f05-end
}
// @block:try-{-52a32150-end

export function toggleSimpleMode() { // @block:export-None-4c03e4ad
  const content = document.getElementById('content'); // @block:const-content-f4d109a3
  const videoWrapper = document.getElementById('video-wrapper'); // @block:const-videoWrapper-ac831702
  const simpleModeButton = document.getElementById('simple-mode-button'); // @block:const-simpleModeButton-a10754b2
  const header = document.querySelector('.header'); // @block:const-header-526dd79e
  const autoSpeakToggle = document.getElementById('auto-speak-toggle'); // @block:const-autoSpeakToggle-371b8c09
  const startButton = document.getElementById('start-button'); // @block:const-startButton-087ba8e9

// @block:if--7766cae8
  if (content.style.display !== 'none') {
    // Entering simple mode
    content.style.display = 'none';
// @block:document.body.appendChild(videoWrapper);-None-dc28d36a
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
// @block:if--acdef93f
    if (autoSpeakToggle.textContent.includes('Off')) {
      autoSpeakToggle.click();
    }
// @block:if--acdef93f-end

    // Start recording if it's not already recording
// @block:if--190d9125
    if (startButton.textContent === 'Speak') {
      startButton.click();
    }
// @block:if--190d9125-end
  } else {
    // Exiting simple mode
    content.style.display = 'flex';
    const leftColumn = document.getElementById('left-column'); // @block:const-leftColumn-2f441a3e
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
// @block:if--02a651b5
    if (autoSpeakToggle.textContent.includes('On')) {
      autoSpeakToggle.click();
    }
// @block:if--02a651b5-end

    // Stop recording
// @block:if--2d9457e9
    if (startButton.textContent === 'Stop') {
      startButton.click();
    }
// @block:if--2d9457e9-end
  }
// @block:document.body.appendChild(videoWrapper);-None-dc28d36a-end
}
// @block:if--7766cae8-end

// @block:function-startSendingAudioData-5094ad1a
function startSendingAudioData() {
  logger.debug('Starting to send audio data...');

  let packetCount = 0; // @block:let-packetCount-1ea38ae6
  let totalBytesSent = 0; // @block:let-totalBytesSent-1818f029

  audioWorkletNode.port.onmessage = (event) => {
    const audioData = event.data; // @block:const-audioData-afb89282

// @block:if--480ff8a6
    if (!(audioData instanceof ArrayBuffer)) {
      logger.warn('Received non-ArrayBuffer data from AudioWorklet:', typeof audioData);
      return;
    }
// @block:if--480ff8a6-end

// @block:if--781f5eda
    if (deepgramConnection && deepgramConnection.getReadyState() === WebSocket.OPEN) {
// @block:try-{-47db7236
      try {
        deepgramConnection.send(audioData);
        packetCount++;
        totalBytesSent += audioData.byteLength;

// @block:if--2cdeca00
        if (packetCount % 100 === 0) {
          logger.debug(`Sent ${packetCount} audio packets to Deepgram. Total bytes: ${totalBytesSent}`);
        }
// @block:if--2cdeca00-end
      } catch (error) {
        logger.error('Error sending audio data to Deepgram:', error);
      }
// @block:try-{-47db7236-end
    } else {
      logger.warn(
        'Deepgram connection not open, cannot send audio data. ReadyState:',
        deepgramConnection ? deepgramConnection.getReadyState() : 'undefined',
      );
    }
// @block:if--781f5eda-end
  };

  logger.debug('Audio data sending setup complete');
}
// @block:function-startSendingAudioData-5094ad1a-end

// @block:function-handleTranscription-eee1e21d
function handleTranscription(data) {
// @block:if--705c4e0c
  if (!isRecording) return;

  const transcript = data.channel.alternatives[0].transcript; // @block:const-transcript-faa3a2d3
// @block:if--ce200b54
  if (data.is_final) {
    logger.debug('Final transcript:', transcript);
// @block:if--edf9a4de
    if (transcript.trim()) {
      currentUtterance += transcript + ' ';
      updateTranscript(currentUtterance.trim(), true);
      chatHistory.push({
        role: 'user',
        content: currentUtterance.trim(),
      });
      sendChatToGroq();
    }
// @block:if--edf9a4de-end
    currentUtterance = '';
    interimMessageAdded = false;
  } else {
    logger.debug('Interim transcript:', transcript);
    updateTranscript(currentUtterance + transcript, false);
  }
// @block:if--ce200b54-end
}
// @block:if--705c4e0c-end

async function startRecording() {
// @block:if--307129cd
  if (isRecording) {
    logger.warn('Recording is already in progress. Stopping current recording.');
    await stopRecording();
    return;
  }
// @block:if--307129cd-end

  logger.debug('Starting recording process...');

  currentUtterance = '';
  interimMessageAdded = false;

// @block:try-{-2d04e7d1
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // @block:const-stream-72e8d42e
    logger.info('Microphone stream obtained');

    audioContext = new AudioContext();
    logger.debug('Audio context created. Sample rate:', audioContext.sampleRate);

    await audioContext.audioWorklet.addModule('audio-processor.js');
    logger.debug('Audio worklet module added successfully');

    const source = audioContext.createMediaStreamSource(stream); // @block:const-source-d4302533
    logger.debug('Media stream source created');

    audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
    logger.debug('Audio worklet node created');

    source.connect(audioWorkletNode);
    logger.debug('Media stream source connected to audio worklet node');

    const deepgramOptions = { // @block:const-deepgramOptions-5f45d79f
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
// @block:if--f21358b8
    if (autoSpeakMode) {
      autoSpeakInProgress = true;
    }
// @block:if--f21358b8-end
    const startButton = document.getElementById('start-button'); // @block:const-startButton-666993f2
    startButton.textContent = 'Stop';

    logger.debug('Recording and transcription started successfully');
  } catch (error) {
    logger.error('Error starting recording:', error);
    isRecording = false;
    const startButton = document.getElementById('start-button'); // @block:const-startButton-7d6ae6f3
    startButton.textContent = 'Speak';
    showErrorMessage('Failed to start recording. Please try again.');
    throw error;
  }
// @block:try-{-2d04e7d1-end
}
// @block:function-handleTranscription-eee1e21d-end

// @block:function-handleDeepgramError-718ac582
function handleDeepgramError(err) {
  logger.error('Deepgram error:', err);
  isRecording = false;
  const startButton = document.getElementById('start-button'); // @block:const-startButton-4c71e4d1
  startButton.textContent = 'Speak';

  // Attempt to close the connection and clean up
// @block:if--5d41d2ab
  if (deepgramConnection) {
// @block:try-{-3a341e1a
    try {
      deepgramConnection.finish();
    } catch (closeError) {
      logger.warn('Error while closing Deepgram connection:', closeError);
    }
// @block:try-{-3a341e1a-end
  }
// @block:if--5d41d2ab-end

// @block:if--c20f9af4
  if (audioContext) {
    audioContext.close().catch((closeError) => {
      logger.warn('Error while closing AudioContext:', closeError);
    });
  }
// @block:if--c20f9af4-end
}
// @block:function-handleDeepgramError-718ac582-end

// @block:function-handleUtteranceEnd-e3d2adf5
function handleUtteranceEnd(data) {
// @block:if--2176d497
  if (!isRecording) return;

  logger.debug('Utterance end detected:', data);
// @block:if--d5039430
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
// @block:if--d5039430-end
}
// @block:if--2176d497-end

async function stopRecording() {
// @block:if--ba05e789
  if (isRecording) {
    logger.info('Stopping recording...');

// @block:if--383c1f09
    if (audioContext) {
      await audioContext.close();
      logger.debug('AudioContext closed');
    }
// @block:if--383c1f09-end

// @block:if--1546d85a
    if (deepgramConnection) {
      deepgramConnection.finish();
      logger.debug('Deepgram connection finished');
    }
// @block:if--1546d85a-end

    isRecording = false;
    autoSpeakInProgress = false;
    const startButton = document.getElementById('start-button'); // @block:const-startButton-0d1c2471
    startButton.textContent = 'Speak';

    logger.debug('Recording and transcription stopped');
  }
// @block:if--ba05e789-end
}
// @block:function-handleUtteranceEnd-e3d2adf5-end

async function sendChatToGroq() {
// @block:if--10508c0f
  if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1].content.trim() === '') {
    logger.debug('No new content to send to Groq. Skipping request.');
    return;
  }
// @block:if--10508c0f-end

  logger.debug('Sending chat to Groq...');
// @block:try-{-73d5b2f0
  try {
    const startTime = Date.now(); // @block:const-startTime-94aac8b0
    const currentContext = document.getElementById('context-input').value.trim(); // @block:const-currentContext-5c9cdf09
    const requestBody = { // @block:const-requestBody-1a82608e
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

    const response = await fetch('/chat', { // @block:const-response-5f013c8b
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    logger.debug('Groq response status:', response.status);

// @block:if--b9045f90
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
// @block:if--b9045f90-end

    const reader = response.body.getReader(); // @block:const-reader-be8a4ed7
    let assistantReply = ''; // @block:let-assistantReply-4908fb81
    let done = false; // @block:let-done-14271747

    const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-0b5e9b60
    const assistantSpan = document.createElement('span'); // @block:const-assistantSpan-c0da2573
    assistantSpan.innerHTML = '<u>Assistant:</u> ';
    msgHistory.appendChild(assistantSpan);
    msgHistory.appendChild(document.createElement('br'));

// @block:while--21d95dde
    while (!done) {
      const { value, done: readerDone } = await reader.read(); // @block:const-{-1854f1c4
// @block:done-=-1351f190
      done = readerDone;

// @block:if--34c0a0f2
      if (value) {
        const chunk = new TextDecoder().decode(value); // @block:const-chunk-df77c3a8
        logger.debug('Received chunk:', chunk);
        const lines = chunk.split('\n'); // @block:const-lines-9ffa8adb

// @block:for--f3091701
        for (const line of lines) {
// @block:if--7c6b9f65
          if (line.startsWith('data:')) {
            const data = line.substring(5).trim(); // @block:const-data-4cf23e00
// @block:if--a1e7b8c3
            if (data === '[DONE]') {
// @block:done-=-8e50946f
              done = true;
              break;
            }
// @block:done-=-8e50946f-end

// @block:try-{-244f14cd
            try {
              const parsed = JSON.parse(data); // @block:const-parsed-be3844f2
              const content = parsed.choices[0]?.delta?.content || ''; // @block:const-content-8af98ab5
              assistantReply += content;
              assistantSpan.innerHTML += content;
              logger.debug('Parsed content:', content);
            } catch (error) {
              logger.error('Error parsing JSON:', error);
            }
// @block:try-{-244f14cd-end
          }
// @block:if--a1e7b8c3-end
        }
// @block:if--7c6b9f65-end

        msgHistory.scrollTop = msgHistory.scrollHeight;
      }
// @block:for--f3091701-end
    }
// @block:if--34c0a0f2-end

    const endTime = Date.now(); // @block:const-endTime-3ea70baa
    const processingTime = endTime - startTime; // @block:const-processingTime-4a50a630
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
    const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-7ba16692
    msgHistory.innerHTML += `<span><u>Assistant:</u> I'm sorry, I encountered an error. Could you please try again?</span><br>`;
    msgHistory.scrollTop = msgHistory.scrollHeight;
  }
// @block:done-=-1351f190-end
}
// @block:while--21d95dde-end

// @block:function-toggleAutoSpeak-1eef06fc
function toggleAutoSpeak() {
  autoSpeakMode = !autoSpeakMode;
  const toggleButton = document.getElementById('auto-speak-toggle'); // @block:const-toggleButton-6584fd90
  const startButton = document.getElementById('start-button'); // @block:const-startButton-651bc2f0
  toggleButton.textContent = `Auto-Speak: ${autoSpeakMode ? 'On' : 'Off'}`;
// @block:if--71186183
  if (autoSpeakMode) {
    startButton.textContent = 'Stop';
// @block:if--8b0c080c
    if (!isRecording) {
      startRecording();
    }
// @block:if--8b0c080c-end
  } else {
    startButton.textContent = isRecording ? 'Stop' : 'Speak';
// @block:if--34a9408f
    if (isRecording) {
      stopRecording();
    }
// @block:if--34a9408f-end
  }
// @block:if--71186183-end
}
// @block:function-toggleAutoSpeak-1eef06fc-end

async function reinitializeConnection() {
// @block:if--be6973c4
  if (connectionState === ConnectionState.RECONNECTING) {
    logger.warn('Connection reinitialization already in progress. Skipping reinitialize.');
    return;
  }
// @block:if--be6973c4-end

  connectionState = ConnectionState.RECONNECTING;
  logger.debug('Reinitializing connection...');

// @block:try-{-b02b1380
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

    const msgHistory = document.getElementById('msgHistory'); // @block:const-msgHistory-980f3182
    msgHistory.innerHTML = '';
    chatHistory = [];

    // Reset video elements
    const streamVideoElement = document.getElementById('stream-video-element'); // @block:const-streamVideoElement-bd75032d
    const idleVideoElement = document.getElementById('idle-video-element'); // @block:const-idleVideoElement-b24e5ebd
// @block:if--eca784df
    if (streamVideoElement) streamVideoElement.srcObject = null;
// @block:if--f9260a4e
    if (idleVideoElement) idleVideoElement.style.display = 'block';

    // Add a delay before initializing to avoid rapid successive calls
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await initializePersistentStream();

// @block:if--76723393
    if (!persistentStreamId || !persistentSessionId) {
      throw new Error('Persistent Stream ID or Session ID is missing after initialization');
    }
// @block:if--76723393-end

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
// @block:if--f9260a4e-end
}
// @block:if--eca784df-end

async function cleanupOldStream() {
  logger.debug('Cleaning up old stream...');

// @block:try-{-3e5c2515
  try {
// @block:if--a3dbb631
    if (peerConnection) {
      peerConnection.close();
    }
// @block:if--a3dbb631-end

// @block:if--fad6ee7f
    if (pcDataChannel) {
      pcDataChannel.close();
    }
// @block:if--fad6ee7f-end

    // Stop all tracks in the streamVideoElement
// @block:if--eee6501e
    if (streamVideoElement && streamVideoElement.srcObject) {
      streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    }
// @block:if--eee6501e-end

    // Clear any ongoing intervals or timeouts
    clearInterval(statsIntervalId);
    clearTimeout(inactivityTimeout);
    clearInterval(keepAliveInterval);

    logger.debug('Old stream cleaned up successfully');
  } catch (error) {
    logger.error('Error cleaning up old stream:', error);
  }
// @block:try-{-3e5c2515-end
}
// @block:try-{-b02b1380-end

const connectButton = document.getElementById('connect-button'); // @block:const-connectButton-ceb25d89
connectButton.onclick = initializeConnection;

const destroyButton = document.getElementById('destroy-button'); // @block:const-destroyButton-a31715f7
destroyButton.onclick = async () => {
// @block:try-{-668df327
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
// @block:try-{-668df327-end
};

const startButton = document.getElementById('start-button'); // @block:const-startButton-92fefc8d

startButton.onclick = async () => {
  logger.info('Start button clicked. Current state:', isRecording ? 'Recording' : 'Not recording');
// @block:if--cd2f577b
  if (!isRecording) {
// @block:try-{-6c91a2d3
    try {
      await startRecording();
    } catch (error) {
      logger.error('Failed to start recording:', error);
      showErrorMessage('Failed to start recording. Please try again.');
    }
// @block:try-{-6c91a2d3-end
  } else {
    await stopRecording();
  }
// @block:if--cd2f577b-end
};

const saveAvatarButton = document.getElementById('save-avatar-button'); // @block:const-saveAvatarButton-d5f443db
saveAvatarButton.onclick = saveAvatar;

const avatarImageInput = document.getElementById('avatar-image'); // @block:const-avatarImageInput-859ea1d0
avatarImageInput.onchange = (event) => {
  const file = event.target.files[0]; // @block:const-file-146b6a78
// @block:if--132c1673
  if (file) {
    const reader = new FileReader(); // @block:const-reader-4956399d
    reader.onload = (e) => {
// @block:document.getElementById('avatar-image-preview').src-=-75ecbbdd
      document.getElementById('avatar-image-preview').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
// @block:document.getElementById('avatar-image-preview').src-=-75ecbbdd-end
};

// Export functions and variables that need to be accessed from other modules
export { // @block:export-None-6905d414
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

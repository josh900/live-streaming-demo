'use strict';
import DID_API from './api.js';

const GROQ_API_KEY = DID_API.groqKey;
const DEEPGRAM_API_KEY = DID_API.deepgramKey;

if (DID_API.key == '🤫') alert('Please put your api key inside ./api.json and restart..');

const RTCPeerConnection = (
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
).bind(window);

let peerConnection;
let streamId;
let sessionId;
let sessionClientAnswer;
let statsIntervalId;
let videoIsPlaying;
let lastBytesReceived;
let chatHistory = [];
let mediaRecorder;
let deepgramSocket;
let transcript = '';
let inactivityTimeout;
let transcriptionTimer;

const context = `


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
Prompt:
Customer is at the "ENTER" and wants to find the "Fruits" aisle. Guide the customer with step-by-step directions using map references and directional guidance.


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


You are a helpful, harmless, and honest assistant. Please answer the users questions briefly, be concise, not more than 1 sentance unless absolutely needed.



`;

const videoElement = document.getElementById('video-element');
videoElement.setAttribute('playsinline', '');
const peerStatusLabel = document.getElementById('peer-status-label');
const iceStatusLabel = document.getElementById('ice-status-label');
const iceGatheringStatusLabel = document.getElementById('ice-gathering-status-label');
const signalingStatusLabel = document.getElementById('signaling-status-label');
const streamingStatusLabel = document.getElementById('streaming-status-label');

window.onload = async (event) => {
  playIdleVideo();

  // Show loading symbol
  const loadingSymbol = document.createElement('div');
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

  try {
    await connectButton.onclick();
    // Remove loading symbol
    document.body.removeChild(loadingSymbol);
  } catch (error) {
    console.error('Error during auto-initialization:', error);
    // Remove loading symbol and show error message
    document.body.removeChild(loadingSymbol);
    showErrorMessage('Failed to connect. Please try again.');
  }
};

function showErrorMessage(message) {
  const errorMessage = document.createElement('div');
  errorMessage.innerHTML = message;
  errorMessage.style.color = 'red';
  errorMessage.style.marginBottom = '10px';
  document.body.appendChild(errorMessage);

  // Show destroy and connect buttons
  destroyButton.style.display = 'inline-block';
  connectButton.style.display = 'inline-block';
}

async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({ iceServers });
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);
  }

  await peerConnection.setRemoteDescription(offer);
  console.log('set remote sdp OK');

  const sessionClientAnswer = await peerConnection.createAnswer();
  console.log('create local sdp OK');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  console.log('set local sdp OK');

  return sessionClientAnswer;
}

function onIceGatheringStateChange() {
  iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
  iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
}

function onIceCandidate(event) {
  if (event.candidate) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;

    // WEBRTC API CALL 3 - Submit network information
    fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/ice`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate,
        sdpMid,
        sdpMLineIndex,
        session_id: sessionId,
      }),
    });
  }
}

function onIceConnectionStateChange() {
  iceStatusLabel.innerText = peerConnection.iceConnectionState;
  iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;

  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
    showErrorMessage('Connection lost. Please try again.');
  }
}

function onConnectionStateChange() {
  // not supported in firefox
  peerStatusLabel.innerText = peerConnection.connectionState;
  peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
}

function onSignalingStateChange() {
  signalingStatusLabel.innerText = peerConnection.signalingState;
  signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
}

function onVideoStatusChange(videoIsPlaying, stream) {
  let status;
  if (videoIsPlaying) {
    status = 'streaming';
    const remoteStream = stream;
    setVideoElement(remoteStream);
  } else {
    status = 'empty';
    playIdleVideo();
  }
  streamingStatusLabel.innerText = status;
  streamingStatusLabel.className = 'streamingState-' + status;
}

function onTrack(event) {
  console.log('Received track:', event.track.kind);
  if (!event.track) return;

  statsIntervalId = setInterval(async () => {
    if (peerConnection && event.track) {
      const stats = await peerConnection.getStats(event.track);
      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
          const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived;

          if (videoStatusChanged) {
            videoIsPlaying = report.bytesReceived > lastBytesReceived;
            onVideoStatusChange(videoIsPlaying, event.streams[0]);
          }
          lastBytesReceived = report.bytesReceived;
        }
      });
    }
  }, 300);
}

function setVideoElement(stream) {
  if (!stream) return;
  console.log('Setting video element with stream:', stream.id);
  // Add Animation Class
  videoElement.classList.add("animated");

  // Removing browsers' autoplay's 'Mute' Requirement
  videoElement.muted = false;

  videoElement.srcObject = stream;
  videoElement.loop = false;

  // Remove Animation Class after it's completed
  setTimeout(() => {
    videoElement.classList.remove("animated");
  }, 300);

  // safari hotfix
  if (videoElement.paused) {
    videoElement
      .play()
      .then((_) => { console.log('Video playback started'); })
      .catch((e) => { console.error('Error playing video:', e); });
  }
}

function playIdleVideo() {
  console.log('Playing idle video');
  // Add Animation Class
  videoElement.classList.toggle("animated");

  videoElement.srcObject = undefined;
  videoElement.src = 'emma_idle.mp4';
  videoElement.loop = true;

  // Remove Animation Class after it's completed
  setTimeout(() => {
    videoElement.classList.remove("animated");
  }, 300);
}

function stopAllStreams() {
  if (videoElement.srcObject) {
    console.log('stopping video streams');
    videoElement.srcObject.getTracks().forEach((track) => track.stop());
    videoElement.srcObject = null;
  }
}

function closePC(pc = peerConnection) {
  if (!pc) return;
  console.log('stopping peer connection');
  pc.close();
  pc.removeEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
  pc.removeEventListener('icecandidate', onIceCandidate, true);
  pc.removeEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
  pc.removeEventListener('connectionstatechange', onConnectionStateChange, true);
  pc.removeEventListener('signalingstatechange', onSignalingStateChange, true);
  pc.removeEventListener('track', onTrack, true);
  clearInterval(statsIntervalId);
  iceGatheringStatusLabel.innerText = '';
  signalingStatusLabel.innerText = '';
  iceStatusLabel.innerText = '';
  peerStatusLabel.innerText = '';
  console.log('stopped peer connection');
  if (pc === peerConnection) {
    peerConnection = null;
  }
}

const maxRetryCount = 2;
const maxDelaySec = 2;

async function fetchWithRetries(url, options, retries = 1) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries <= maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 500;

      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(`Request failed, retrying ${retries}/${maxRetryCount}. Error ${err}`);
      return fetchWithRetries(url, options, retries + 1);
    } else {
      throw new Error(`Max retries exceeded. error: ${err}`);
    }
  }
}

const connectButton = document.getElementById('connect-button');
connectButton.onclick = async () => {
  console.log('Connect button clicked');

  if (peerConnection && peerConnection.connectionState === 'connected') {
    console.log('Already connected, skipping connection process');
    return;
  }
  stopAllStreams();
  closePC();

  // WEBRTC API CALL 1 - Create a new stream
  const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg'
    }),
  });

  const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
  streamId = newStreamId;
  sessionId = newSessionId;
  console.log('New stream created:', streamId);
  try {
    sessionClientAnswer = await createPeerConnection(offer, iceServers);
  } catch (e) {
    console.log('error during streaming setup', e);
    stopAllStreams();
    closePC();
    return;
  }

  // WEBRTC API CALL 2 - Start a stream
  const sdpResponse = await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, {
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
  console.log('SDP response status:', sdpResponse.status);
};

async function startStreaming(assistantReply) {
  console.log('Starting streaming with reply:', assistantReply);
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const playResponse = await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: {
            type: 'text',
            input: assistantReply,
          },
          config: {
            fluent: true,
            pad_audio: 0,
          },
          session_id: sessionId,  // Ensure this is the correct session ID, not a cookie value
        }),
      });

      console.log('Play response status:', playResponse.status);
      
      if (playResponse.ok) {
        console.log('Streaming started successfully');
        return;
      } else {
        const errorData = await playResponse.json();
        console.error('Error in play response:', errorData);
        
        if (playResponse.status === 500) {
          retryCount++;
          console.log(`Retrying... Attempt ${retryCount} of ${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
        } else {
          throw new Error(`HTTP error ${playResponse.status}`);
        }
      }
    } catch (error) {
      console.error('Error during streaming:', error);
      retryCount++;
      if (retryCount >= maxRetries) {
        console.error('Max retries reached. Unable to start streaming.');
        if (isRecording) {
          await reinitializeConnection();
        }
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
    }
  }
}



async function startRecording() {
  console.log('Starting recording');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  deepgramSocket = new WebSocket('wss://api.deepgram.com/v1/listen', [
    'token',
    DEEPGRAM_API_KEY,
  ]);

  deepgramSocket.onopen = () => {
    console.log('Deepgram WebSocket connection opened');
    mediaRecorder.addEventListener('dataavailable', async (event) => {
      if (event.data.size > 0 && deepgramSocket.readyState === 1) {
        deepgramSocket.send(event.data);
      }
    });
    mediaRecorder.start(1000);

    // Send KeepAlive message every 3 seconds
    setInterval(() => {
      if (deepgramSocket.readyState === 1) {
        const keepAliveMsg = JSON.stringify({ type: "KeepAlive" });
        deepgramSocket.send(keepAliveMsg);
        console.log("Sent KeepAlive message to Deepgram");
      }
    }, 3000);

    // Start transcription timer
    transcriptionTimer = setInterval(() => {
      if (transcript.trim() !== '') {
        document.getElementById('msgHistory').innerHTML += `<span style='opacity:0.5'><u>User:</u> ${transcript}</span><br>`;
        chatHistory.push({
          role: 'user',
          content: transcript,
        });
        sendChatToGroq();
        transcript = '';
      }
    }, 5000); // Send transcription every 5 seconds
  };

  deepgramSocket.onmessage = (message) => {
    const received = JSON.parse(message.data);
    const partialTranscript = received.channel.alternatives[0].transcript;

    if (partialTranscript) {
      transcript += partialTranscript;
      document.getElementById('msgHistory').innerHTML = document.getElementById('msgHistory').innerHTML.replace(/<span style='opacity:0.5'><u>User \(interim\):<\/u>.*<\/span><br>/, `<span style='opacity:0.5'><u>User (interim):</u> ${transcript}</span><br>`);
    }
  };

  deepgramSocket.onclose = async () => {
    console.log('Deepgram WebSocket connection closed');
    if (isRecording) {
      await reinitializeConnection();
    }
  };

  // Start inactivity timeout
  inactivityTimeout = setTimeout(() => {
    if (isRecording) {
      console.log('Inactivity timeout reached. Stopping recording.');
      startButton.click();
    }
  }, 45000); // 45 seconds
}

async function stopRecording() {
  console.log('Stopping recording');
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    const closeMsg = JSON.stringify({ type: "CloseStream" });
    deepgramSocket.send(closeMsg);
    deepgramSocket.close();
    mediaRecorder = null;
  }

  // Clear transcription timer
  clearInterval(transcriptionTimer);

  // Clear inactivity timeout
  clearTimeout(inactivityTimeout);
}

async function sendChatToGroq() {
  console.log('Sending chat to Groq');
  try {
    const response = await fetch('https://avatar.skoop.digital/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: context,
          },
          ...chatHistory,
        ],
        model: 'mixtral-8x7b-32768',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const reader = response.body.getReader();
    let assistantReply = '';
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;

      if (value) {
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            if (data === '[DONE]') {
              done = true;
              break;
            }

            const parsed = JSON.parse(data);
            assistantReply += parsed.choices[0]?.delta?.content || '';
          }
        }
      }
    }

    console.log('Assistant reply:', assistantReply);

    // Add assistant reply to chat history
    chatHistory.push({
      role: 'assistant',
      content: assistantReply,
    });

    // Append the complete assistant reply to the chat history element
    document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${assistantReply}</span><br>`;

    // Reset inactivity timeout
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
      if (isRecording) {
        console.log('Inactivity timeout reached. Stopping recording.');
        startButton.click();
      }
    }, 45000); // 45 seconds

    // Initiate streaming
    await startStreaming(assistantReply);
  } catch (error) {
    console.error('Error in sendChatToGroq:', error);
    if (isRecording) {
      await reinitializeConnection();
    }
  }
}

async function reinitializeConnection() {
  console.log('Reinitializing connection...');
  stopAllStreams();
  closePC();

  // Clear transcription timer
  clearInterval(transcriptionTimer);

  // Clear inactivity timeout
  clearTimeout(inactivityTimeout);

  // Reset transcription state
  transcript = '';
  chatHistory = chatHistory.slice(0, -1); // Remove the last incomplete transcription from the chat history

  // Update UI to remove the incomplete transcription
  const msgHistory = document.getElementById('msgHistory');
  msgHistory.innerHTML = msgHistory.innerHTML.slice(0, msgHistory.innerHTML.lastIndexOf('<span style=\'opacity:0.5\'><u>User:</u>'));

  await connectButton.onclick();
  await startRecording();
}

const destroyButton = document.getElementById('destroy-button');
destroyButton.onclick = async () => {
  console.log('Destroy button clicked');
  await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  stopAllStreams();
  closePC();
};

const startButton = document.getElementById('start-button');
let isRecording = false;

startButton.onclick = async () => {
  console.log('Start/Stop button clicked');
  if (!isRecording) {
    startButton.textContent = 'Stop';
    await startRecording();
  } else {
    startButton.textContent = 'Speak';
    await stopRecording();
  }
  isRecording = !isRecording;
};
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, get, onValue, push } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD1lL-CxLSZi57XhdyHUzXoBOiqeOjKGmI",
  authDomain: "linossongguess.firebaseapp.com",
  databaseURL: "https://linossongguess-default-rtdb.firebaseio.com",
  projectId: "linossongguess",
  storageBucket: "linossongguess.firebasestorage.app",
  messagingSenderId: "372314781087",
  appId: "1:372314781087:web:2fc03cb1d8a23bf86539aa",
  measurementId: "G-Z0H125Z2S8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const debugLog = (msg) => {
  console.log(msg);
  const logElem = document.getElementById('debugLog');
  logElem.textContent += `\n${new Date().toLocaleTimeString()} - ${msg}`;
  logElem.scrollTop = logElem.scrollHeight;
};

debugLog("Firebase initialized.");

// DOM elements
const createRoomBtn = document.getElementById('createRoom');
const joinRoomBtn = document.getElementById('joinRoom');
const joinConfirmBtn = document.getElementById('joinConfirm');
const joinContainer = document.getElementById('joinContainer');
const gameContainer = document.getElementById('gameContainer');
const roomCodeDisplay = document.getElementById('roomCodeDisplay');
const roomCodeInput = document.getElementById('roomCodeInput');

// Generate a random room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

// Create a new game room
async function createRoom() {
  debugLog("Creating room...");
  const roomCode = generateRoomCode();

  try {
    const roomRef = ref(db, 'rooms/' + roomCode);
    await set(roomRef, {
      createdAt: Date.now(),
      players: [],
      currentSong: null
    });

    debugLog(`Room created: ${roomCode}`);
    showGameScreen(roomCode);
  } catch (err) {
    debugLog("Error creating room: " + err.message);
  }
}

// Join a room
async function joinRoom() {
  const code = roomCodeInput.value.trim().toUpperCase();
  if (!code) return alert("Please enter a room code.");

  debugLog(`Joining room: ${code}`);
  const roomRef = ref(db, 'rooms/' + code);
  const snapshot = await get(roomRef);

  if (snapshot.exists()) {
    debugLog("Room found, joining...");
    showGameScreen(code);
  } else {
    debugLog("Room not found!");
    alert("Room not found!");
  }
}

function showGameScreen(code) {
  document.querySelector('.button-container').style.display = 'none';
  joinContainer.style.display = 'none';
  gameContainer.style.display = 'block';
  roomCodeDisplay.textContent = `Room Code: ${code}`;
}

// Button bindings
createRoomBtn.onclick = createRoom;
joinRoomBtn.onclick = () => {
  joinContainer.style.display = 'block';
  debugLog("Join input shown.");
};
joinConfirmBtn.onclick = joinRoom;

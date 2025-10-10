// === CONFIGURE FIREBASE ===
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// === DOM ELEMENTS ===
const usernameInput = document.getElementById("username");
const roomCodeInput = document.getElementById("roomCodeInput");
const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");
const setupDiv = document.getElementById("setup");
const gameDiv = document.getElementById("game");
const roomHeader = document.getElementById("roomHeader");
const playersDiv = document.getElementById("players");
const phaseText = document.getElementById("phase");
const pickSongBtn = document.getElementById("pickSongBtn");
const playBtn = document.getElementById("playBtn");
const songArea = document.getElementById("songArea");

let roomCode = null;
let username = null;
let currentSong = null;

// === HELPER FUNCTIONS ===
function generateCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function showGameUI() {
  setupDiv.classList.add("hidden");
  gameDiv.classList.remove("hidden");
  roomHeader.textContent = `Room Code: ${roomCode}`;
}

function updateRoom(data) {
  if (!data) return;
  const { host, phase, players, currentSong } = data;

  phaseText.textContent = `Phase: ${phase}`;
  playersDiv.innerHTML = "<h3>Players</h3>";

  for (let p in players) {
    const score = players[p].score ?? 0;
    playersDiv.innerHTML += `<div>${p}: ${score}</div>`;
  }

  if (currentSong && currentSong.name) {
    songArea.innerHTML = `
      <h3>${currentSong.name}</h3>
      <p>${currentSong.artist}</p>
      <audio id="preview" src="${currentSong.preview}" controls></audio>
    `;
  } else {
    songArea.innerHTML = "<p>No song selected yet.</p>";
  }
}

// === CREATE ROOM ===
createBtn.onclick = async () => {
  username = usernameInput.value.trim();
  if (!username) return alert("Enter your name!");

  roomCode = generateCode();
  const roomRef = db.ref("rooms/" + roomCode);

  await roomRef.set({
    host: username,
    phase: "waiting",
    players: { [username]: { score: 0 } }
  });

  listenToRoom(roomCode);
  showGameUI();
};

// === JOIN ROOM ===
joinBtn.onclick = async () => {
  username = usernameInput.value.trim();
  if (!username) return alert("Enter your name!");

  const code = roomCodeInput.value.trim().toUpperCase();
  if (!code) return alert("Enter a room code!");
  roomCode = code;

  const roomRef = db.ref("rooms/" + roomCode);
  const snapshot = await roomRef.get();

  if (!snapshot.exists()) return alert("Room not found!");
  await roomRef.child("players").child(username).set({ score: 0 });

  listenToRoom(roomCode);
  showGameUI();
};

// === LISTEN TO ROOM CHANGES ===
function listenToRoom(code) {
  const roomRef = db.ref("rooms/" + code);
  roomRef.on("value", (snap) => {
    const data = snap.val();
    updateRoom(data);
  });
}

// === PICK RANDOM SONG ===
pickSongBtn.onclick = async () => {
  const randomQuery = ["love", "party", "sad", "happy", "summer", "dance"][Math.floor(Math.random()*6)];
  const token = await getSpotifyToken();
  const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${randomQuery}&type=track&limit=1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json = await searchRes.json();
  const track = json.tracks.items[0];

  if (!track || !track.preview_url) return alert("Couldn't get preview!");

  currentSong = {
    id: track.id,
    name: track.name,
    artist: track.artists[0].name,
    preview: track.preview_url
  };

  await db.ref(`rooms/${roomCode}/currentSong`).set(currentSong);
  await db.ref(`rooms/${roomCode}/phase`).set("guessing");
};

// === PLAY PREVIEW ===
playBtn.onclick = () => {
  const audio = document.getElementById("preview");
  if (audio) audio.play();
};

// === SPOTIFY TOKEN (Client Credentials flow via public proxy for dev) ===
async function getSpotifyToken() {
  // ⚠️ For testing only. This uses Spotify's public token endpoint
  // Replace client_id and client_secret with yours later
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        btoa("YOUR_CLIENT_ID" + ":" + "YOUR_CLIENT_SECRET")
    },
    body: "grant_type=client_credentials"
  });
  const data = await res.json();
  return data.access_token;
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let lanes = 4;        // default lanes
let level = 1;        // default Easy
let muted = false;
let paused = false;
let lives = 3;        // start with 3 lives
let flyovers = 3;     // start with 3 flyover bonuses
let highScores = JSON.parse(localStorage.getItem("f1scores")) || [];

let player, enemies, score, roadOffset = 0;
let running = false;
let lastTime = 0;
let lifeTimer, flyoverTimer;
let flying = false;
let flyStart = 0;

function startGame() {
  hideAllScreens();
  canvas.classList.remove("hidden");

  canvas.width = 240;
  canvas.height = 320;

  lanes = parseInt(document.getElementById("laneSelect").value || 4);
  if (lanes < 4) lanes = 4;
  if (lanes > 8) lanes = 8;
  level = parseInt(document.getElementById("levelSelect").value || 1);

  player = { lane: Math.floor(lanes / 2), y: 250, width: 18, height: 32 };
  enemies = [];
  score = 0;
  lives = 3;
  flyovers = 3;
  paused = false;
  roadOffset = 0;
  running = true;
  lastTime = performance.now();

  if (!muted) playSound("start");

  clearInterval(lifeTimer);
  lifeTimer = setInterval(() => {
    if (running && lives < 5) lives++;
  }, 30000);

  clearInterval(flyoverTimer);
  flyoverTimer = setInterval(() => {
    if (running && flyovers < 5) flyovers++;
  }, 15000);

  requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
  if (!running) return;
  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  updateGame(delta, timestamp);
  requestAnimationFrame(gameLoop);
}

function updateGame(delta, timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  roadOffset += 40 * delta;
  const laneWidth = canvas.width / lanes;
  ctx.strokeStyle = "#555";
  for (let i = 1; i < lanes; i++) {
    for (let y = -20; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(i * laneWidth, y + (roadOffset % 40));
      ctx.lineTo(i * laneWidth, y + 20 + (roadOffset % 40));
      ctx.stroke();
    }
  }

  if (flying && timestamp - flyStart > 2000) flying = false;
  drawCar(player.lane * laneWidth + laneWidth/2 - player.width/2, player.y, flying ? "yellow" : "cyan");

  if (!paused) {
    const spawnRate = {1:0.01, 2:0.02, 3:0.03}[level] || 0.01;
    if (Math.random() < spawnRate) {
      enemies.push({ lane: Math.floor(Math.random() * lanes), y: -40, width: 18, height: 32 });
    }

    const enemySpeed = {1:25, 2:50, 3:75}[level] || 25;

    for (let e of enemies) {
      e.y += enemySpeed * delta;
      drawCar(e.lane * laneWidth + laneWidth/2 - e.width/2, e.y, "red");

      if (!flying && e.lane === player.lane && e.y + e.height > player.y && e.y < player.y + player.height) {
        lives--;
        if (!muted) playSound("crash");
        enemies = enemies.filter(en => en !== e);
        if (lives <= 0) {
          endGame();
          return;
        }
      }
    }
    enemies = enemies.filter(e => e.y < canvas.height);
    score++;
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "20px Segoe UI";
    ctx.fillText("Paused", 90, 160);
  }

  ctx.fillStyle = "#fff";
  ctx.font = "12px Segoe UI";
  ctx.fillText("Score: " + score, 10, 20);
  ctx.fillText("Lives: " + lives, 180, 20);
  ctx.fillText("Flyovers: " + flyovers, 90, 20);
}

function drawCar(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 18, 32);
  ctx.fillStyle = "#88f";
  ctx.fillRect(x+3, y+6, 12, 6);
  ctx.fillStyle = "#000";
  ctx.fillRect(x-3, y+4, 3, 6);
  ctx.fillRect(x+18, y+4, 3, 6);
  ctx.fillRect(x-3, y+22, 3, 6);
  ctx.fillRect(x+18, y+22, 3, 6);
}

function endGame() {
  running = false;
  clearInterval(lifeTimer);
  clearInterval(flyoverTimer);
  highScores.push(score);
  highScores.sort((a,b) => b-a);
  highScores = highScores.slice(0,5);
  localStorage.setItem("f1scores", JSON.stringify(highScores));
  alert("Game Over! Final Score: " + score);
  backToMenu();
}

function showSettings() { hideAllScreens(); document.getElementById("settings").classList.remove("hidden"); }
function showHighScores() { 
  hideAllScreens(); 
  document.getElementById("highscores").classList.remove("hidden"); 
  const list = document.getElementById("scoreList");
  list.innerHTML = "";
  highScores.forEach(s => { const li = document.createElement("li"); li.textContent = s; list.appendChild(li); });
}
function showHelp() { hideAllScreens(); document.getElementById("help").classList.remove("hidden"); }
function showAbout() { hideAllScreens(); document.getElementById("about").classList.remove("hidden"); }
function backToMenu() { hideAllScreens(); document.getElementById("menu").classList.remove("hidden"); }
function hideAllScreens() { document.querySelectorAll(".screen").forEach(el => el.classList.add("hidden")); canvas.classList.add("hidden"); }
function toggleMute() { muted = !muted; }

function playSound(type) {
  if (muted) return;
  const ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = ctxAudio.createOscillator();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(type === "start" ? 440 : 220, ctxAudio.currentTime);
  oscillator.connect(ctxAudio.destination);
  oscillator.start();
  oscillator.stop(ctxAudio.currentTime + 0.2);
}

document.addEventListener("keydown", e => {
  if (canvas.classList.contains("hidden")) return;

  if (["0","2","4","6","8","5","1"].includes(e.key)) e.preventDefault();

  const laneWidth = canvas.width / lanes;
  if (e.key === "4" && player.lane > 0) player.lane--;
  if (e.key === "6" && player.lane < lanes-1) player.lane++;
  if (e.key === "2" && player.y > 0) player.y -= 10;
  if (e.key === "8") {
    player.y += 10;
    if (player.y > canvas.height - player.height) {
      player.y = canvas.height - player.height;
    }
  }

  if (e.key === "5") paused = !paused;
  if (e.key === "1") {
    running = false;
    clearInterval(lifeTimer);
    clearInterval(flyoverTimer);
    backToMenu();
  }

  // Flyover ability
  if (e.key === "0" && flyovers > 0 && !flying) {
    flyovers--;
    flying = true;
    flyStart = performance.now();
  }
});

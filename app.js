const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let lanes = 3;
let level = 2;
let muted = false;
let paused = false;
let lives = 3;
let highScores = JSON.parse(localStorage.getItem("f1scores")) || [];

let player, enemies, score, gameInterval, roadOffset = 0;

function startGame() {
  hideAllScreens();
  canvas.classList.remove("hidden");

  // Strict 240x320
  canvas.width = 240;
  canvas.height = 320;

  lanes = parseInt(document.getElementById("laneSelect").value);
  level = parseInt(document.getElementById("levelSelect").value);

  player = { lane: Math.floor(lanes / 2), y: 250, width: 28, height: 50 };
  enemies = [];
  score = 0;
  lives = 3;
  paused = false;
  roadOffset = 0;

  if (!muted) playSound("start");

  clearInterval(gameInterval);
  gameInterval = setInterval(updateGame, 1000 / 30);
}

function updateGame() {
  if (paused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Road theme: moving lane markers
  roadOffset += 4;
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

  // Draw player
  drawCar(player.lane * laneWidth + laneWidth/2 - player.width/2, player.y, "cyan");

  // Spawn enemies
  if (Math.random() < 0.03 * level) {
    enemies.push({
      lane: Math.floor(Math.random() * lanes),
      y: -60,
      width: 28,
      height: 50
    });
  }

  // Move enemies
  for (let e of enemies) {
    e.y += 2 + level;
    drawCar(e.lane * laneWidth + laneWidth/2 - e.width/2, e.y, "red");

    if (e.lane === player.lane && e.y + e.height > player.y && e.y < player.y + player.height) {
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

  // HUD: Score + Lives
  ctx.fillStyle = "#fff";
  ctx.font = "12px Segoe UI";
  ctx.fillText("Score: " + score, 10, 20);
  ctx.fillText("Lives: " + lives, 180, 20);

  score++;
}

function drawCar(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 28, 50);
  ctx.fillStyle = "#88f";
  ctx.fillRect(x+4, y+10, 20, 10);
  ctx.fillStyle = "#000";
  ctx.fillRect(x-4, y+5, 4, 10);
  ctx.fillRect(x+28, y+5, 4, 10);
  ctx.fillRect(x-4, y+35, 4, 10);
  ctx.fillRect(x+28, y+35, 4, 10);
}

function endGame() {
  clearInterval(gameInterval);
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

// Keypad controls (T9)
document.addEventListener("keydown", e => {
  const laneWidth = canvas.width / lanes;
  if (e.key === "4" && player.lane > 0) player.lane--;
  if (e.key === "6" && player.lane < lanes-1) player.lane++;
  if (e.key === "2" && player.y > 0) player.y -= 10;
  if (e.key === "8" && player.y < canvas.height - player.height) player.y += 10;

  // Pause/Play
  if (e.key === "5") paused = !paused;

  // Back to Menu
  if (e.key === "1") {
    clearInterval(gameInterval);
    backToMenu();
  }
});


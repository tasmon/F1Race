const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let lanes = 3;
let level = 1;
let muted = false;
let highScores = JSON.parse(localStorage.getItem("f1scores")) || [];

let player, enemies, score, gameInterval;

function startGame() {
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("settings").classList.add("hidden");
  document.getElementById("highscores").classList.add("hidden");
  canvas.classList.remove("hidden");

  lanes = parseInt(document.getElementById("laneSelect").value);
  level = parseInt(document.getElementById("levelSelect").value);

  player = { lane: Math.floor(lanes / 2), y: 280, width: 30, height: 30 };
  enemies = [];
  score = 0;

  if (!muted) playSound("start");

  clearInterval(gameInterval);
  gameInterval = setInterval(updateGame, 1000 / 30);
}

function updateGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw lanes
  const laneWidth = canvas.width / lanes;
  ctx.strokeStyle = "#555";
  for (let i = 1; i < lanes; i++) {
    ctx.beginPath();
    ctx.moveTo(i * laneWidth, 0);
    ctx.lineTo(i * laneWidth, canvas.height);
    ctx.stroke();
  }

  // Draw player
  ctx.fillStyle = "cyan";
  ctx.fillRect(player.lane * laneWidth + laneWidth/2 - player.width/2, player.y, player.width, player.height);

  // Spawn enemies
  if (Math.random() < 0.03 * level) {
    enemies.push({
      lane: Math.floor(Math.random() * lanes),
      y: -30,
      width: 30,
      height: 30
    });
  }

  // Move enemies
  for (let e of enemies) {
    e.y += 2 + level;
    ctx.fillStyle = "red";
    ctx.fillRect(e.lane * laneWidth + laneWidth/2 - e.width/2, e.y, e.width, e.height);

    // Collision
    if (e.lane === player.lane && e.y + e.height > player.y && e.y < player.y + player.height) {
      endGame();
      return;
    }
  }

  enemies = enemies.filter(e => e.y < canvas.height);

  // Score
  score++;
  ctx.fillStyle = "#fff";
  ctx.fillText("Score: " + score, 10, 20);
}

function endGame() {
  clearInterval(gameInterval);
  if (!muted) playSound("crash");
  highScores.push(score);
  highScores.sort((a,b) => b-a);
  highScores = highScores.slice(0,5);
  localStorage.setItem("f1scores", JSON.stringify(highScores));
  alert("Game Over! Score: " + score);
  backToMenu();
}

function showSettings() {
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("settings").classList.remove("hidden");
}

function showHighScores() {
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("highscores").classList.remove("hidden");
  const list = document.getElementById("scoreList");
  list.innerHTML = "";
  highScores.forEach(s => {
    const li = document.createElement("li");
    li.textContent = s;
    list.appendChild(li);
  });
}

function backToMenu() {
  canvas.classList.add("hidden");
  document.getElementById("settings").classList.add("hidden");
  document.getElementById("highscores").classList.add("hidden");
  document.getElementById("menu").classList.remove("hidden");
}

function toggleMute() {
  muted = !muted;
}

function playSound(type) {
  const audio = new Audio();
  if (type === "start") audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEA...";
  if (type === "crash") audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEA...";
  audio.play();
}

// Keypad controls (T9: 2=up, 4=left, 6=right, 8=down)
document.addEventListener("keydown", e => {
  const laneWidth = canvas.width / lanes;
  if (e.key === "4" && player.lane > 0) player.lane--;
  if (e.key === "6" && player.lane < lanes-1) player.lane++;
  if (e.key === "2" && player.y > 0) player.y -= 10;
  if (e.key === "8" && player.y < canvas.height - player.height) player.y += 10;
});


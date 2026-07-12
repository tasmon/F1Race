let board = [];
let currentPlayer = 'red';
let mode = 'player';
let difficulty = 'easy';
let cursor = {row: 0, col: 0};
const rows = 6, cols = 7;
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const cellW = canvas.width / cols;
const cellH = canvas.height / rows;

// Show only one page at a time
function showSection(id) {
  document.querySelectorAll('.page').forEach(sec => sec.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// Difficulty selection page
function selectDifficulty() {
  showSection('difficulty');
}

// Start game
function startGame(selectedMode, level='easy') {
  mode = selectedMode;
  difficulty = level;
  board = Array(rows).fill().map(() => Array(cols).fill(null));
  cursor = {row: 0, col: 0};
  currentPlayer = 'red';
  renderBoard();
  document.getElementById('status').textContent = currentPlayer.toUpperCase() + "'s turn";
  showSection('gamePage');
}

// Render board on canvas
function renderBoard() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for (let r=0;r<rows;r++) {
    for (let c=0;c<cols;c++) {
      ctx.beginPath();
      ctx.arc(c*cellW+cellW/2, r*cellH+cellH/2, Math.min(cellW,cellH)/2-2, 0, 2*Math.PI);
      ctx.fillStyle = board[r][c] ? board[r][c] : "#ddd";
      ctx.fill();
      if (cursor.row===r && cursor.col===c) {
        ctx.strokeStyle = "#6200ea";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }
}

// Make a move in column
function makeMove(col) {
  for (let r = rows-1; r >= 0; r--) {
    if (!board[r][col]) {
      board[r][col] = currentPlayer;
      break;
    }
  }
  if (checkWin(board)) {
    document.getElementById('status').textContent = currentPlayer.toUpperCase() + " wins!";
    return;
  }
  currentPlayer = currentPlayer === 'red' ? 'yellow' : 'red';
  document.getElementById('status').textContent = currentPlayer.toUpperCase() + "'s turn";
  renderBoard();
  if (mode === 'computer' && currentPlayer === 'yellow') {
    computerMove();
  }
}

// Computer AI
function computerMove() {
  let col;
  if (difficulty === 'easy') {
    do { col = Math.floor(Math.random()*cols); } while (board[0][col]);
  } else if (difficulty === 'medium') {
    const preferred = [3,2,4,1,5,0,6];
    for (let c of preferred) {
      if (!board[0][c]) { col = c; break; }
    }
  } else {
    col = findBestMove();
  }
  makeMove(col);
}

// Hard AI: win or block
function findBestMove() {
  // try winning move
  for (let c=0;c<cols;c++) {
    let temp = board.map(r=>[...r]);
    for (let r=rows-1;r>=0;r--) {
      if (!temp[r][c]) {
        temp[r][c] = 'yellow';
        if (checkWin(temp)) return c;
        break;
      }
    }
  }
  // block opponent
  for (let c=0;c<cols;c++) {
    let temp = board.map(r=>[...r]);
    for (let r=rows-1;r>=0;r--) {
      if (!temp[r][c]) {
        temp[r][c] = 'red';
        if (checkWin(temp)) return c;
        break;
      }
    }
  }
  // fallback random
  let col;
  do { col = Math.floor(Math.random()*cols); } while (board[0][col]);
  return col;
}

// Check win
function checkWin(b) {
  for (let r=0;r<rows;r++) {
    for (let c=0;c<cols;c++) {
      const p = b[r][c];
      if (p &&
        ((c<=3 && p===b[r][c+1] && p===b[r][c+2] && p===b[r][c+3]) ||
         (r<=2 && p===b[r+1][c] && p===b[r+2][c] && p===b[r+3][c]) ||
         (r<=2 && c<=3 && p===b[r+1][c+1] && p===

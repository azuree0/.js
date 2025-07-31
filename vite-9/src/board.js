let board = [];
let currentPlayer = 'black';

export function initBoard(size) {
  board = Array(size).fill().map(() => Array(size).fill(null));
}

export function placeStone(x, y, ctx, cellSize) {
  if (x < 0 || x >= 9 || y < 0 || y >= 9 || board[y][x]) return; // Invalid move

  // Place stone
  board[y][x] = currentPlayer;
  drawStone(x, y, ctx, currentPlayer, cellSize);

  // Switch player
  currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
}

function drawStone(x, y, ctx, color, cellSize) {
  ctx.beginPath();
  ctx.arc(
    x * cellSize + cellSize / 2,
    y * cellSize + cellSize / 2,
    cellSize / 2 - 5,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.stroke();
}
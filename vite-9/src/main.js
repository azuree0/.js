import { initBoard, placeStone } from './board.js';
import './index.css';

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const gridSize = 9;
const cellSize = canvas.width / gridSize;

// Initialize the game board
initBoard(gridSize);

// Draw the 9x9 grid
function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;

  // Draw grid lines
  for (let i = 0; i < gridSize; i++) {
    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(i * cellSize + cellSize / 2, cellSize / 2);
    ctx.lineTo(i * cellSize + cellSize / 2, canvas.height - cellSize / 2);
    ctx.stroke();

    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(cellSize / 2, i * cellSize + cellSize / 2);
    ctx.lineTo(canvas.width - cellSize / 2, i * cellSize + cellSize / 2);
    ctx.stroke();
  }
}

// Handle click events for stone placement
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / cellSize);
  const y = Math.floor((e.clientY - rect.top) / cellSize);
  placeStone(x, y, ctx, cellSize);
});

// Initial draw
drawBoard();
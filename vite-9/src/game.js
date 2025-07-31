const boardSize = 9;
let board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
let currentPlayer = 'black';
const statusElement = document.getElementById('status');

export function initGame(boardElement) {
  boardElement.innerHTML = '';
  boardElement.style.display = 'grid';
  boardElement.style.gridTemplateColumns = `repeat(${boardSize}, 50px)`;

  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = x;
      cell.dataset.y = y;
      boardElement.appendChild(cell);
    }
  }
}

export function placeStone(x, y) {
  if (x < 0 || x >= boardSize || y < 0 || y >= boardSize || board[y][x]) {
    return; // Invalid move
  }

  board[y][x] = currentPlayer;
  updateBoard();
  checkCaptures(x, y);
  currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
  statusElement.textContent = `Turn: ${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}`;
}

function updateBoard() {
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    cell.className = 'cell';
    if (board[y][x]) {
      cell.classList.add(board[y][x]);
    }
  });
}

function checkCaptures(x, y) {
  const opponent = currentPlayer === 'black' ? 'white' : 'black';
  const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize && board[ny][nx] === opponent) {
      if (!hasLiberties(nx, ny, opponent)) {
        removeGroup(nx, ny, opponent);
      }
    }
  }
}

function hasLiberties(x, y, player, visited = new Set()) {
  if (x < 0 || x >= boardSize || y < 0 || y >= boardSize || visited.has(`${x},${y}`)) {
    return false;
  }
  if (!board[y][x]) {
    return true; // Empty space (liberty)
  }
  if (board[y][x] !== player) {
    return false;
  }

  visited.add(`${x},${y}`);
  const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  for (const [dx, dy] of directions) {
    if (hasLiberties(x + dx, y + dy, player, visited)) {
      return true;
    }
  }
  return false;
}

function removeGroup(x, y, player, visited = new Set()) {
  if (x < 0 || x >= boardSize || y < 0 || y < boardSize || visited.has(`${x},${y}`) || board[y][x] !== player) {
    return;
  }

  visited.add(`${x},${y}`);
  board[y][x] = null;
  const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  for (const [dx, dy] of directions) {
    removeGroup(x + dx, y + dy, player, visited);
  }
}
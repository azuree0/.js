import React, { useState } from 'react';
import Board from './Board';

const initializeBoard = () => Array(9).fill().map(() => Array(9).fill(null));

function Game() {
  const [board, setBoard] = useState(initializeBoard());
  const [currentPlayer, setCurrentPlayer] = useState('black');
  const [koPoint, setKoPoint] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [passCount, setPassCount] = useState(0);
  const [captured, setCaptured] = useState({ black: 0, white: 0 });

  const getGroup = (x, y, color, board, visited) => {
    const group = [];
    const stack = [[x, y]];
    visited[x][y] = true;

    while (stack.length) {
      const [cx, cy] = stack.pop();
      group.push([cx, cy]);
      const neighbors = [
        [cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]
      ];
      for (const [nx, ny] of neighbors) {
        if (
          nx >= 0 && nx < 9 && ny >= 0 && ny < 9 &&
          !visited[nx][ny] && board[nx][ny] === color
        ) {
          stack.push([nx, ny]);
          visited[nx][ny] = true;
        }
      }
    }
    return group;
  };

  const countLiberties = (group, board) => {
    const liberties = new Set();
    for (const [x, y] of group) {
      const neighbors = [
        [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
      ];
      for (const [nx, ny] of neighbors) {
        if (
          nx >= 0 && nx < 9 && ny >= 0 && ny < 9 &&
          board[nx][ny] === null
        ) {
          liberties.add(`${nx},${ny}`);
        }
      }
    }
    return liberties.size;
  };

  const handleMove = (x, y) => {
    if (gameOver || board[x][y] !== null || (koPoint && koPoint.x === x && koPoint.y === y)) {
      return;
    }

    const newBoard = board.map(row => [...row]);
    newBoard[x][y] = currentPlayer;

    let capturedStones = [];
    const opponent = currentPlayer === 'black' ? 'white' : 'black';
    const neighbors = [
      [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
    ];

    for (const [nx, ny] of neighbors) {
      if (
        nx >= 0 && nx < 9 && ny >= 0 && ny < 9 &&
        newBoard[nx][ny] === opponent
      ) {
        const visited = Array(9).fill().map(() => Array(9).fill(false));
        const group = getGroup(nx, ny, opponent, newBoard, visited);
        if (countLiberties(group, newBoard) === 0) {
          capturedStones.push(...group);
        }
      }
    }

    const visited = Array(9).fill().map(() => Array(9).fill(false));
    const playerGroup = getGroup(x, y, currentPlayer, newBoard, visited);
    if (countLiberties(playerGroup, newBoard) === 0) {
      return; // Suicide move is invalid
    }

    for (const [cx, cy] of capturedStones) {
      newBoard[cx][cy] = null;
    }

    let newKoPoint = null;
    if (
      capturedStones.length === 1 &&
      playerGroup.length === 1 &&
      countLiberties(playerGroup, newBoard) === 1
    ) {
      const [capturedX, capturedY] = capturedStones[0];
      newKoPoint = { x: capturedX, y: capturedY };
    }

    setBoard(newBoard);
    setCaptured(prev => ({
      ...prev,
      [opponent]: prev[opponent] + capturedStones.length
    }));
    setKoPoint(newKoPoint);
    setCurrentPlayer(opponent);
    setPassCount(0);
  };

  const handlePass = () => {
    if (gameOver) return;
    setPassCount(prev => prev + 1);
    setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black');
    setKoPoint(null);
    if (passCount + 1 >= 2) {
      setGameOver(true);
    }
  };

  return (
    <div className="game">
      <Board board={board} onMove={handleMove} />
      <div className="game-info">
        <p>Current Player: {currentPlayer}</p>
        <p>Captured by Black: {captured.white}</p>
        <p>Captured by White: {captured.black}</p>
        <button onClick={handlePass}>Pass</button>
        {gameOver && <p>Game Over! Calculate score manually.</p>}
      </div>
    </div>
  );
}

export default Game;
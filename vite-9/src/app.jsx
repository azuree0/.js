import React, { useEffect, useRef } from 'react';
import * as p5 from 'p5';

const App = () => {
  const sketchRef = useRef();

  useEffect(() => {
    const sketch = (p) => {
      let board = Array(9).fill().map(() => Array(9).fill(0)); // 0: empty, 1: black, 2: white
      let currentPlayer = 1; // 1: black, 2: white
      let lastMove = null; // Track last move for ko rule
      let consecutivePasses = 0;
      let gameOver = false;
      let blackCaptures = 0;
      let whiteCaptures = 0;

      p.setup = () => {
        p.createCanvas(400, 400);
        p.background(255);
      };

      p.draw = () => {
        p.background(255); // White background
        drawBoard();
        drawHoshiPoints();
        drawStones();
        if (gameOver) {
          displayScore();
        }
      };

      const drawBoard = () => {
        p.stroke(0); // Black grid lines
        p.strokeWeight(2);
        const cellSize = p.width / 9;
        for (let i = 0; i <= 9; i++) { // Include i=9 for east and south borders
          let pos = i * cellSize;
          // Draw vertical lines, including east border at i=9
          p.line(pos, 0, pos, p.height);
          // Draw horizontal lines, including south border at i=9
          p.line(0, pos, p.width, pos);
        }
      };

      const drawHoshiPoints = () => {
        const hoshiPoints = [
          [2, 2], [2, 6], [4, 4], [6, 2], [6, 6] // 3-3, 3-7, 5-5 (tengen), 7-3, 7-7
        ];
        p.fill(0);
        p.noStroke();
        const cellSize = p.width / 9;
        hoshiPoints.forEach(([x, y]) => {
          // Only draw hoshi if no stone is present
          if (board[x][y] === 0) {
            p.circle((x + 0.5) * cellSize, (y + 0.5) * cellSize, 8);
          }
        });
      };

      const drawStones = () => {
        const cellSize = p.width / 9;
        for (let x = 0; x < 9; x++) {
          for (let y = 0; y < 9; y++) {
            if (board[x][y] === 1) {
              p.fill(0); // Black stones
              p.noStroke();
              p.circle((x + 0.5) * cellSize, (y + 0.5) * cellSize, cellSize * 0.8);
            } else if (board[x][y] === 2) {
              p.fill(255); // White stones
              p.stroke(0);
              p.strokeWeight(1);
              // Larger radius to ensure hoshi dot is covered
              p.circle((x + 0.5) * cellSize, (y + 0.5) * cellSize, cellSize * 0.9);
            }
          }
        }
      };

      const getBoardIndex = (pixel) => Math.floor(pixel / (p.width / 9));

      const isValidMove = (x, y) => {
        if (x < 0 || x >= 9 || y < 0 || y >= 9 || board[x][y] !== 0) return false;

        // Check for suicide
        let tempBoard = board.map(row => [...row]);
        tempBoard[x][y] = currentPlayer;
        if (!hasLiberties(tempBoard, x, y, currentPlayer)) {
          // Check if move captures opponent stones
          let captures = false;
          for (let [nx, ny] of getNeighbors(x, y)) {
            if (tempBoard[nx]?.[ny] === 3 - currentPlayer) {
              if (!hasLiberties(tempBoard, nx, ny, 3 - currentPlayer)) {
                captures = true;
                break;
              }
            }
          }
          if (!captures) return false; // Suicide move
        }

        // Check ko rule
        if (lastMove) {
          let tempBoardAfterCaptures = captureStones(tempBoard, x, y);
          let isKo = true;
          for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
              if (tempBoardAfterCaptures[i][j] !== lastMove[i][j]) {
                isKo = false;
                break;
              }
            }
            if (!isKo) break;
          }
          if (isKo) return false;
        }

        return true;
      };

      const getNeighbors = (x, y) => [
        [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
      ];

      const hasLiberties = (tempBoard, x, y, player) => {
        let visited = new Set();
        let stack = [[x, y]];
        while (stack.length) {
          let [cx, cy] = stack.pop();
          let key = `${cx},${cy}`;
          if (visited.has(key)) continue;
          visited.add(key);
          for (let [nx, ny] of getNeighbors(cx, cy)) {
            if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9) {
              if (tempBoard[nx][ny] === 0) return true;
              if (tempBoard[nx][ny] === player && !visited.has(`${nx},${ny}`)) {
                stack.push([nx, ny]);
              }
            }
          }
        }
        return false;
      };

      const captureStones = (tempBoard, x, y) => {
        let newBoard = tempBoard.map(row => [...row]);
        for (let [nx, ny] of getNeighbors(x, y)) {
          if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9 && newBoard[nx][ny] === 3 - currentPlayer) {
            if (!hasLiberties(newBoard, nx, ny, 3 - currentPlayer)) {
              removeGroup(newBoard, nx, ny, 3 - currentPlayer);
            }
          }
        }
        return newBoard;
      };

      const removeGroup = (tempBoard, x, y, player) => {
        let stack = [[x, y]];
        while (stack.length) {
          let [cx, cy] = stack.pop();
          if (tempBoard[cx][cy] !== player) continue;
          if (player === 1) whiteCaptures++;
          else blackCaptures++;
          tempBoard[cx][cy] = 0;
          for (let [nx, ny] of getNeighbors(cx, cy)) {
            if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9 && tempBoard[nx][ny] === player) {
              stack.push([nx, ny]);
            }
          }
        }
      };

      const calculateScore = () => {
        let blackTerritory = 0;
        let whiteTerritory = 0;
        let visited = new Set();
        for (let x = 0; x < 9; x++) {
          for (let y = 0; y < 9; y++) {
            if (board[x][y] === 0 && !visited.has(`${x},${y}`)) {
              let territory = floodFill(x, y, visited);
              if (territory.owner === 1) blackTerritory += territory.count;
              else if (territory.owner === 2) whiteTerritory += territory.count;
            }
          }
        }
        let blackScore = blackTerritory + blackCaptures;
        let whiteScore = whiteTerritory + whiteCaptures + 6.5; // Komi for White
        return { blackScore, whiteScore };
      };

      const floodFill = (x, y, visited) => {
        let count = 0;
        let owner = null;
        let stack = [[x, y]];
        let points = [];
        while (stack.length) {
          let [cx, cy] = stack.pop();
          let key = `${cx},${cy}`;
          if (visited.has(key) || cx < 0 || cx >= 9 || cy < 0 || cy >= 9) continue;
          if (board[cx][cy] !== 0) {
            if (owner === null) owner = board[cx][cy];
            else if (owner !== board[cx][cy]) owner = 0; // Neutral if surrounded by both
            continue;
          }
          visited.add(key);
          points.push([cx, cy]);
          count++;
          for (let [nx, ny] of getNeighbors(cx, cy)) {
            stack.push([nx, ny]);
          }
        }
        return { count, owner, points };
      };

      const displayScore = () => {
        let { blackScore, whiteScore } = calculateScore();
        p.fill(0);
        p.textSize(20);
        p.textAlign(p.CENTER);
        p.text(`Game Over\nBlack: ${blackScore}\nWhite: ${whiteScore}\n${blackScore > whiteScore ? 'Black Wins!' : 'White Wins!'}`, p.width / 2, p.height / 2);
      };

      p.mousePressed = () => {
        if (gameOver) return;
        let x = getBoardIndex(p.mouseX);
        let y = getBoardIndex(p.mouseY);
        if (isValidMove(x, y)) {
          board[x][y] = currentPlayer;
          board = captureStones(board, x, y);
          lastMove = board.map(row => [...row]);
          consecutivePasses = 0;
          currentPlayer = 3 - currentPlayer; // Switch player
        }
      };

      p.keyPressed = () => {
        if (p.key === 'p' || p.key === 'P') {
          consecutivePasses++;
          currentPlayer = 3 - currentPlayer;
          if (consecutivePasses >= 2) {
            gameOver = true;
          }
        }
      };
    };

    const p5Instance = new p5(sketch, sketchRef.current);
    return () => p5Instance.remove();
  }, []);

  return (
    <div className="game-container">
      <div ref={sketchRef}></div>
    </div>
  );
};

export default App;
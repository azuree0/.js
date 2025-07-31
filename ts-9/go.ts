import * as readline from 'readline';

// Define types
type Player = 'black' | 'white';
type BoardPoint = 'empty' | 'black' | 'white';
type Position = { row: number; col: number };

interface GameState {
  board: BoardPoint[][];
  currentPlayer: Player;
  previousBoard: BoardPoint[][] | null;
  blackCaptures: number;
  whiteCaptures: number;
  consecutivePasses: number;
  gameOver: boolean;
}

function copyBoard(board: BoardPoint[][]): BoardPoint[][] {
  return board.map(row => [...row]);
}

class GoGame {
  private state: GameState;

  constructor() {
    const board: BoardPoint[][] = Array(9)
      .fill(null)
      .map(() => Array(9).fill('empty'));
    this.state = {
      board,
      currentPlayer: 'black',
      previousBoard: null,
      blackCaptures: 0,
      whiteCaptures: 0,
      consecutivePasses: 0,
      gameOver: false,
    };
  }

  printBoard(): string {
    let output = '  A B C D E F G H I\n';
    this.state.board.forEach((row, i) => {
      output += `${9 - i} `;
      row.forEach(point => {
        output += point === 'empty' ? '· ' : point === 'black' ? '⚫ ' : '⚪ ';
      });
      output += `${9 - i}\n`;
    });
    output += '  A B C D E F G H I\n';
    output += `Black captures: ${this.state.blackCaptures}, White captures: ${this.state.whiteCaptures}\n`;
    output += `Current player: ${this.state.currentPlayer}\n`;
    return output;
  }

  private isValidPosition(pos: Position): boolean {
    return pos.row >= 0 && pos.row < 9 && pos.col >= 0 && pos.col < 9;
  }

  private getNeighbors(pos: Position): Position[] {
    const { row, col } = pos;
    const neighbors: Position[] = [
      { row: row - 1, col },
      { row: row + 1, col },
      { row, col: col - 1 },
      { row, col: col + 1 },
    ];
    return neighbors.filter(neighbor => this.isValidPosition(neighbor));
  }

  private getGroup(pos: Position, visited: Set<string> = new Set()): Position[] {
    const key = `${pos.row},${pos.col}`;
    if (visited.has(key) || !this.isValidPosition(pos)) return [];
    const point = this.state.board[pos.row][pos.col];
    if (point === 'empty') return [];

    visited.add(key);
    const group: Position[] = [pos];
    for (const neighbor of this.getNeighbors(pos)) {
      if (!visited.has(`${neighbor.row},${neighbor.col}`) &&
          this.state.board[neighbor.row][neighbor.col] === point) {
        group.push(...this.getGroup(neighbor, visited));
      }
    }
    return group;
  }

  private countLiberties(group: Position[]): number {
    const visited = new Set<string>();
    let liberties = 0;
    for (const pos of group) {
      for (const neighbor of this.getNeighbors(pos)) {
        const key = `${neighbor.row},${neighbor.col}`;
        if (!visited.has(key) && this.state.board[neighbor.row][neighbor.col] === 'empty') {
          liberties++;
          visited.add(key);
        }
      }
    }
    return liberties;
  }

private isValidMove(pos: Position): boolean {
  if (!this.isValidPosition(pos) || this.state.board[pos.row][pos.col] !== 'empty') {
    return false;
  }

  const opponent = this.state.currentPlayer === 'black' ? 'white' : 'black';
  const testBoard = copyBoard(this.state.board);
  testBoard[pos.row][pos.col] = this.state.currentPlayer;

  // Check for ko rule
  const boardStr = JSON.stringify(testBoard);
  if (this.state.previousBoard && boardStr === JSON.stringify(this.state.previousBoard)) {
    return false;
  }

  // Temporarily place the stone to check liberties and captures
  this.state.board[pos.row][pos.col] = this.state.currentPlayer;

  // Check if the move creates a group with liberties
  const group = this.getGroup(pos);
  const hasLiberties = this.countLiberties(group) > 0;

  // Check if the move captures opponent stones
  let captures = false;
  for (const neighbor of this.getNeighbors(pos)) {
    if (this.state.board[neighbor.row][neighbor.col] === opponent) {
      const opponentGroup = this.getGroup(neighbor);
      if (this.countLiberties(opponentGroup) === 0) {
        captures = true;
      }
    }
  }

  // Revert the temporary move
  this.state.board[pos.row][pos.col] = 'empty';

  // Move is valid if it has liberties or results in captures
  return hasLiberties || captures;
}

  private captureStones(pos: Position): number {
    const opponent = this.state.currentPlayer === 'black' ? 'white' : 'black';
    let captured = 0;
    for (const neighbor of this.getNeighbors(pos)) {
      if (this.state.board[neighbor.row][neighbor.col] === opponent) {
        const group = this.getGroup(neighbor);
        if (this.countLiberties(group) === 0) {
          for (const stone of group) {
            this.state.board[stone.row][stone.col] = 'empty';
            captured++;
          }
        }
      }
    }
    return captured;
  }

  placeStone(row: number, col: number): boolean {
    if (this.state.gameOver) {
      console.error('Game is over.');
      return false;
    }

    const pos: Position = { row, col };
    if (!this.isValidMove(pos)) {
      console.error('Invalid move.');
      return false;
    }

    this.state.previousBoard = copyBoard(this.state.board);
    this.state.board[pos.row][pos.col] = this.state.currentPlayer;
    const captures = this.captureStones(pos);
    if (this.state.currentPlayer === 'black') {
      this.state.blackCaptures += captures;
    } else {
      this.state.whiteCaptures += captures;
    }
    this.state.consecutivePasses = 0;
    this.state.currentPlayer = this.state.currentPlayer === 'black' ? 'white' : 'black';
    return true;
  }

  pass(): void {
    if (this.state.gameOver) {
      console.error('Game is over.');
      return;
    }
    this.state.consecutivePasses++;
    this.state.previousBoard = copyBoard(this.state.board);
    this.state.currentPlayer = this.state.currentPlayer === 'black' ? 'white' : 'black';
    if (this.state.consecutivePasses >= 2) {
      this.state.gameOver = true;
      console.log('Game over. Both players passed.');
      this.calculateScore();
    }
  }

  private calculateScore(): void {
    let blackTerritory = 0;
    let whiteTerritory = 0;
    const visited = new Set<string>();

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const key = `${row},${col}`;
        if (visited.has(key) || this.state.board[row][col] !== 'empty') continue;

        const emptyGroup: Position[] = [];
        const queue: Position[] = [{ row, col }];
        let bordersBlack = false;
        let bordersWhite = false;
        visited.add(key);

        while (queue.length > 0) {
          const pos = queue.shift()!;
          emptyGroup.push(pos);
          for (const neighbor of this.getNeighbors(pos)) {
            const nKey = `${neighbor.row},${neighbor.col}`;
            if (visited.has(nKey)) continue;
            const point = this.state.board[neighbor.row][neighbor.col];
            if (point === 'empty') {
              queue.push(neighbor);
              visited.add(nKey);
            } else if (point === 'black') {
              bordersBlack = true;
            } else if (point === 'white') {
              bordersWhite = true;
            }
          }
        }

        if (bordersBlack && !bordersWhite) {
          blackTerritory += emptyGroup.length;
        } else if (bordersWhite && !bordersBlack) {
          whiteTerritory += emptyGroup.length;
        }
      }
    }

    const blackScore = blackTerritory + this.state.blackCaptures;
    const whiteScore = whiteTerritory + this.state.whiteCaptures + 6.5;
    console.log(`Black score: ${blackScore} (Territory: ${blackTerritory}, Captures: ${this.state.blackCaptures})`);
    console.log(`White score: ${whiteScore} (Territory: ${whiteTerritory}, Captures: ${this.state.whiteCaptures}, Komi: 6.5)`);
  }

  isGameOver(): boolean {
    return this.state.gameOver;
  }
}

async function main() {
  console.log('Starting Go game...');
  const game = new GoGame();
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const playTurn = () => {
    console.log(game.printBoard());
    readline.question(`${game.isGameOver() ? 'Game over. ' : ''}Enter move (e.g., A1 or 'pass'): `, (input: string) => {
      if (game.isGameOver()) {
        readline.close();
        return;
      }

      if (input.toLowerCase() === 'pass') {
        game.pass();
        playTurn();
        return;
      }

      const match = input.match(/^([A-I])([1-9])$/i);
      if (!match) {
        console.error('Invalid input. Use format like A1 or "pass".');
        playTurn();
        return;
      }

      const col = match[1].toUpperCase().charCodeAt(0) - 65; // A=0, B=1, etc.
      const row = 9 - parseInt(match[2]); // 1 at bottom (row 8), 9 at top (row 0)
      if (game.placeStone(row, col)) {
        playTurn();
      } else {
        playTurn();
      }
    });
  };

  playTurn();
}

main().catch(console.error);
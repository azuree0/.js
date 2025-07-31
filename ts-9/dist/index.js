"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Utility to create a deep copy of the board
function copyBoard(board) {
    return board.map(row => [...row]);
}
// Main Go game class
class GoGame {
    constructor() {
        // Initialize 9x9 board with empty points
        const board = Array(9)
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
    // Display the board in black-and-white ASCII format
    printBoard() {
        let output = '  ' + Array(9).fill(null).map((_, i) => String.fromCharCode(65 + i)).join(' ') + '\n';
        this.state.board.forEach((row, i) => {
            output += `${9 - i} `;
            row.forEach(point => {
                output += point === 'empty' ? '· ' : point === 'black' ? '⚫ ' : '⚪ ';
            });
            output += `${9 - i}\n`;
        });
        output += '  ' + Array(9).fill(null).map((_, i) => String.fromCharCode(65 + i)).join(' ') + '\n';
        output += `Black captures: ${this.state.blackCaptures}, White captures: ${this.state.whiteCaptures}\n`;
        output += `Current player: ${this.state.currentPlayer}\n`;
        return output;
    }
    // Check if a position is valid
    isValidPosition(pos) {
        return pos.row >= 0 && pos.row < 9 && pos.col >= 0 && pos.col < 9;
    }
    // Get adjacent positions
    getNeighbors(pos) {
        const { row, col } = pos;
        const neighbors = [
            { row: row - 1, col },
            { row: row + 1, col },
            { row, col: col - 1 },
            { row, col: col + 1 },
        ];
        return neighbors.filter(neighbor => this.isValidPosition(neighbor));
    }
    // Find group of connected stones
    getGroup(pos, visited = new Set()) {
        const key = `${pos.row},${pos.col}`;
        if (visited.has(key) || !this.isValidPosition(pos))
            return [];
        const point = this.state.board[pos.row][pos.col];
        if (point === 'empty')
            return [];
        visited.add(key);
        const group = [pos];
        const neighbors = this.getNeighbors(pos);
        for (const neighbor of neighbors) {
            if (!visited.has(`${neighbor.row},${neighbor.col}`)) {
                const neighborPoint = this.state.board[neighbor.row][neighbor.col];
                if (neighborPoint === point) {
                    group.push(...this.getGroup(neighbor, visited));
                }
            }
        }
        return group;
    }
    // Count liberties of a group
    countLiberties(group) {
        const visited = new Set();
        let liberties = 0;
        for (const pos of group) {
            const neighbors = this.getNeighbors(pos);
            for (const neighbor of neighbors) {
                const key = `${neighbor.row},${neighbor.col}`;
                if (!visited.has(key) && this.state.board[neighbor.row][neighbor.col] === 'empty') {
                    liberties++;
                    visited.add(key);
                }
            }
        }
        return liberties;
    }
    // Check if a move is valid
    isValidMove(pos) {
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
        // Check if move creates a group with liberties or captures opponent stones
        const group = this.getGroup(pos);
        if (this.countLiberties(group) > 0) {
            return true;
        }
        // Check if move captures opponent stones
        let captures = false;
        for (const neighbor of this.getNeighbors(pos)) {
            const neighborPoint = this.state.board[neighbor.row][neighbor.col];
            if (neighborPoint === opponent) {
                const opponentGroup = this.getGroup(neighbor);
                const opponentLiberties = this.countLiberties(opponentGroup);
                if (opponentLiberties === 1) { // Move would reduce liberties to 0
                    captures = true;
                }
            }
        }
        return captures;
    }
    // Capture opponent stones
    captureStones(pos) {
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
    // Place a stone
    placeStone(row, col) {
        if (this.state.gameOver) {
            console.error('Game is over.');
            return false;
        }
        const pos = { row, col };
        if (!this.isValidMove(pos)) {
            console.error('Invalid move.');
            return false;
        }
        // Store current board for ko rule
        this.state.previousBoard = copyBoard(this.state.board);
        // Place stone
        this.state.board[pos.row][pos.col] = this.state.currentPlayer;
        // Capture opponent stones
        const captures = this.captureStones(pos);
        if (this.state.currentPlayer === 'black') {
            this.state.blackCaptures += captures;
        }
        else {
            this.state.whiteCaptures += captures;
        }
        // Reset consecutive passes
        this.state.consecutivePasses = 0;
        // Switch player
        this.state.currentPlayer = this.state.currentPlayer === 'black' ? 'white' : 'black';
        return true;
    }
    // Pass turn
    pass() {
        if (this.state.gameOver) {
            console.error('Game is over.');
            return;
        }
        this.state.consecutivePasses++;
        this.state.currentPlayer = this.state.currentPlayer === 'black' ? 'white' : 'black';
        this.state.previousBoard = copyBoard(this.state.board); // Update for ko rule
        if (this.state.consecutivePasses >= 2) {
            this.state.gameOver = true;
            console.log('Game over. Both players passed.');
            this.calculateScore();
        }
    }
    // Simplified scoring (territory + captures)
    calculateScore() {
        let blackTerritory = 0;
        let whiteTerritory = 0;
        const visited = new Set();
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const key = `${row},${col}`;
                if (visited.has(key) || this.state.board[row][col] !== 'empty')
                    continue;
                const emptyGroup = [];
                const queue = [{ row, col }];
                let bordersBlack = false;
                let bordersWhite = false;
                visited.add(key);
                // Flood fill to find empty group
                while (queue.length > 0) {
                    const pos = queue.shift();
                    emptyGroup.push(pos);
                    const neighbors = this.getNeighbors(pos);
                    for (const neighbor of neighbors) {
                        const nKey = `${neighbor.row},${neighbor.col}`;
                        if (visited.has(nKey))
                            continue;
                        const point = this.state.board[neighbor.row][neighbor.col];
                        if (point === 'empty') {
                            queue.push(neighbor);
                            visited.add(nKey);
                        }
                        else if (point === 'black') {
                            bordersBlack = true;
                        }
                        else if (point === 'white') {
                            bordersWhite = true;
                        }
                    }
                }
                // Assign territory
                if (bordersBlack && !bordersWhite) {
                    blackTerritory += emptyGroup.length;
                }
                else if (bordersWhite && !bordersBlack) {
                    whiteTerritory += emptyGroup.length;
                }
            }
        }
        const blackScore = blackTerritory + this.state.blackCaptures;
        const whiteScore = whiteTerritory + this.state.whiteCaptures + 6.5; // Komi for white
        console.log(`Black score: ${blackScore} (Territory: ${blackTerritory}, Captures: ${this.state.blackCaptures})`);
        console.log(`White score: ${whiteScore} (Territory: ${whiteTerritory}, Captures: ${this.state.whiteCaptures}, Komi: 6.5)`);
    }
    // Get game state
    isGameOver() {
        return this.state.gameOver;
    }
}
// CLI interface for playing the game
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const game = new GoGame();
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        const playTurn = () => {
            console.log(game.printBoard());
            readline.question(`${game.isGameOver() ? 'Game over. ' : ''}Enter move (e.g., A1 or 'pass'): `, (input) => {
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
                }
                else {
                    playTurn();
                }
            });
        };
        playTurn();
    });
}
main().catch(console.error);

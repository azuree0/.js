import React from 'react';

function Board({ board, onMove }) {
  return (
    <div className="board">
      {board.map((row, x) => (
        <div key={x} className="board-row">
          {row.map((cell, y) => (
            <div
              key={`${x}-${y}`}
              className="intersection"
              onClick={() => onMove(x, y)}
            >
              <div className={`stone ${cell || ''}`} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Board;
import React, { useState, useRef } from "react";
import { Password2DEngine } from "@password2d/core";

interface Password2DGridProps {
  engine: Password2DEngine;
  grid: string[][];
  masked: boolean;
  onChange?: () => void;
}

export const Password2DGrid: React.FC<Password2DGridProps> = ({
  engine,
  grid,
  masked,
  onChange,
}) => {
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(
    null
  );

  const cellRefs = useRef<(HTMLDivElement | null)[][]>(
    Array.from({ length: engine.rows }, () => Array(engine.cols).fill(null))
  );

  /** Focus a given cell by coordinates */
  const focusCell = (r: number, c: number) => {
    if (r >= 0 && r < engine.rows && c >= 0 && c < engine.cols) {
      const cell = cellRefs.current[r][c];
      cell?.focus();
      setFocusedCell({ row: r, col: c });
    }
  };

  /** Handle user input in a cell */
  const handleInput = (
    e: React.FormEvent<HTMLDivElement>,
    r: number,
    c: number
  ) => {
    const text = e.currentTarget.innerText;
    if (text.length > 0) {
      const char = text.slice(-1);
      const next = engine.addChar(r, c, char);
      onChange?.();
      if (next) focusCell(next.row, next.col);
    } else {
      engine.deleteChar(r, c);
      onChange?.();
    }
  };

  /** Handle keyboard navigation */
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    r: number,
    c: number
  ) => {
    switch (e.key) {
      case "Backspace":
        e.preventDefault();
        engine.deleteChar(r, c);
        onChange?.();
        focusCell(r, c);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusCell(r - 1, c);
        break;
      case "ArrowDown":
        e.preventDefault();
        focusCell(r + 1, c);
        break;
      case "ArrowLeft":
        e.preventDefault();
        focusCell(r, c - 1);
        break;
      case "ArrowRight":
        e.preventDefault();
        focusCell(r, c + 1);
        break;
    }
  };

  return (
    <div className="space-y-2">
      <div role="group" aria-label="2D password grid">
        {grid.map((row, r) => (
          <div key={r} className="flex space-x-1">
            {row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                ref={(el) => (cellRefs.current[r][c] = el)}
                role="textbox"
                aria-label={`Password cell at row ${r + 1}, column ${c + 1}`}
                contentEditable
                suppressContentEditableWarning
                tabIndex={0}
                onFocus={() => setFocusedCell({ row: r, col: c })}
                onInput={(e) => handleInput(e, r, c)}
                onKeyDown={(e) => handleKeyDown(e, r, c)}
                className={`border border-gray-400 rounded flex items-center justify-center
                            text-lg cursor-text focus:outline-none focus:ring-2 focus:ring-cyan-500
                            w-10 h-10 select-none
                            ${
                              focusedCell?.row === r && focusedCell?.col === c
                                ? "ring-cyan-500"
                                : ""
                            }`}
              >
                {masked ? "•".repeat(cell.length) : cell}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex space-x-4 text-sm mt-1">
        <button
          type="button"
          onClick={() => {
            engine.toggleMask();
            onChange?.();
          }}
          aria-label={masked ? "Show password grid" : "Hide password grid"}
          className="text-cyan-600 hover:underline"
        >
          {masked ? "Show" : "Hide"}
        </button>

        <button
          type="button"
          onClick={() => {
            engine.reset();
            onChange?.();
          }}
          className="text-gray-600 hover:underline"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

import React, { useRef, useState, useEffect } from "react";
import { Password2DEngine } from "@password2d/core";

interface Password2DGridProps {
  engine: Password2DEngine;
  masked: boolean;
  onChange?: () => void;
}

export const Password2DGrid: React.FC<Password2DGridProps> = ({
  engine,
  masked,
  onChange,
}) => {
  const [focused, setFocused] = useState<{ row: number; col: number } | null>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[][]>(
    Array.from({ length: engine.rows }, () => Array(engine.cols).fill(null))
  );
  const suppressInput = useRef(false);

  const focusCell = (r: number, c: number) => {
    if (r < 0 || c < 0 || r >= engine.rows || c >= engine.cols) return;
    const el = cellRefs.current[r][c];
    if (el) {
      el.focus();
      setFocused({ row: r, col: c });
    }
  };

  useEffect(() => {
    if (focused) {
      const el = cellRefs.current[focused.row]?.[focused.col];
      if (el && document.activeElement !== el) el.focus();
    }
  }, [focused]);

  const syncVisuals = () => {
    suppressInput.current = true;
    for (let r = 0; r < engine.rows; r++) {
      for (let c = 0; c < engine.cols; c++) {
        const el = cellRefs.current[r][c];
        if (el) {
          const v = engine.grid[r][c];
          el.textContent = masked ? "•".repeat(v.length) : v;
        }
      }
    }
    suppressInput.current = false;
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>, r: number, c: number) => {
    if (suppressInput.current) return;
    const el = e.currentTarget;
    const typed = el.innerText || "";

    // Ignore visual mask characters
    if (typed.includes("•")) {
      //requestAnimationFrame(syncVisuals);
      // Slight delay: let the browser finish adding next key before resyncing visuals
      setTimeout(syncVisuals, 30);
      return;
    }

    const current = engine.grid[r][c] || "";
    let appended = "";

    if (typed.length > current.length) {
      appended = typed.slice(current.length);
    }

    if (appended) {
      let pos = { row: r, col: c };
      for (const ch of appended) {
        const next = engine.addChar(pos.row, pos.col, ch);
        if (!next) break;
        pos = next;
      }
      onChange?.();
      requestAnimationFrame(syncVisuals);
      focusCell(pos.row, pos.col);
    } else if (typed.length < current.length) {
      // Possibly user deleted all — delegate to keyDown handling next frame
      requestAnimationFrame(syncVisuals);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, r: number, c: number) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      engine.deleteChar(r, c);
      onChange?.();
      requestAnimationFrame(syncVisuals);
      focusCell(r, c);
      return;
    }

    switch (e.key) {
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
      case "Tab":
        e.preventDefault();
        const next = engine.moveToNextCell(r, c);
        if (next) focusCell(next.row, next.col);
        break;
    }
  };

  const baseClass =
    engine.className ||
    `border border-gray-400 rounded flex items-center justify-center text-lg cursor-text focus:outline-none focus:ring-2 focus:ring-cyan-500 select-none bg-white overflow-hidden text-center ${engine.cellSize ?? "w-12 h-12"}`;
  const activeClass = engine.activeCellClassName || "ring-cyan-500 border-cyan-500";

  return (
    <div className="space-y-2">
      <div role="group" aria-label="2D password grid">
        {engine.grid.map((row, r) => (
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
                onFocus={() => setFocused({ row: r, col: c })}
                onInput={(e) => handleInput(e, r, c)}
                onKeyDown={(e) => handleKeyDown(e, r, c)}
                className={`${baseClass} ${
                  focused?.row === r && focused?.col === c ? activeClass : ""
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
            requestAnimationFrame(syncVisuals);
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
            requestAnimationFrame(syncVisuals);
            focusCell(0, 0);
          }}
          className="text-gray-600 hover:underline"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

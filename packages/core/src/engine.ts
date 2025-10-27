export interface Password2DOptions {
  rows?: number;
  cols?: number;
  maxCharsPerCell?: number;
  coordinateMode?: "xy" | "yx";
  masked?: boolean;
  className?: string;
  activeCellClassName?: string;
  cellSize?: string;
}

export interface CellPosition {
  row: number;
  col: number;
}

export class Password2DEngine {
  rows: number;
  cols: number;
  maxCharsPerCell: number;
  coordinateMode: "xy" | "yx";
  masked: boolean;
  grid: string[][];
  cursor: CellPosition;
  className?: string;
  activeCellClassName?: string;
  cellSize?: string;

  constructor({
    rows = 2,
    cols = 8,
    maxCharsPerCell = 3,
    coordinateMode = "xy",
    masked = true,
    className,
    activeCellClassName,
    cellSize = "w-12 h-12",
  }: Password2DOptions = {}) {
    this.rows = rows;
    this.cols = cols;
    this.maxCharsPerCell = maxCharsPerCell;
    this.coordinateMode = coordinateMode;
    this.masked = masked;
    this.className = className;
    this.activeCellClassName = activeCellClassName;
    this.cellSize = cellSize;
    this.grid = Array.from({ length: rows }, () => Array(cols).fill(""));
    this.cursor = { row: 0, col: 0 };
  }

 /** Add a character to the current cell, auto-move when full */
addChar(row: number, col: number, char: string): CellPosition | null {
  if (this.isInvalidCell(row, col)) return null;

  let cell = this.grid[row][col] || "";
  if (cell.length >= this.maxCharsPerCell) {
    // cell full — move first
    return this.moveToNextCell(row, col);
  }

  // enforce single character at a time (strip mask dots)
  if (char === "•" || !char.trim()) return { row, col };

  // append
  cell += char;
  this.grid[row][col] = cell.slice(0, this.maxCharsPerCell);

  // if cell reached max → move to next
  if (this.grid[row][col].length >= this.maxCharsPerCell) {
    this.cursor = { row, col };
    return this.moveToNextCell(row, col);
  }

  this.cursor = { row, col };
  return { row, col };
}

  deleteChar(row: number, col: number) {
    if (this.isInvalidCell(row, col)) return;
    this.grid[row][col] = (this.grid[row][col] || "").slice(0, -1);
  }

  reset() {
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(""));
    this.cursor = { row: 0, col: 0 };
  }

  toggleMask() {
    this.masked = !this.masked;
  }

  getFlattened(): string {
    return this.grid
      .map((row, y) =>
        row
          .map((val, x) => {
            if (!val) return "";
            return this.coordinateMode === "yx"
              ? `(${y},${x})${val}`
              : `(${x},${y})${val}`;
          })
          .join("")
      )
      .join("");
  }

  getMaskedGrid(): string[][] {
    return this.masked
      ? this.grid.map((row) => row.map((val) => "•".repeat(val.length)))
      : this.grid;
  }

  clone(): Password2DEngine {
    const clone = new Password2DEngine({
      rows: this.rows,
      cols: this.cols,
      maxCharsPerCell: this.maxCharsPerCell,
      coordinateMode: this.coordinateMode,
      masked: this.masked,
      className: this.className,
      activeCellClassName: this.activeCellClassName,
    });
    clone.grid = this.grid.map((r) => [...r]);
    clone.cursor = { ...this.cursor };
    return clone;
  }

  moveToNextCell(row = this.cursor.row, col = this.cursor.col): CellPosition {
    col++;
    if (col >= this.cols) {
      col = 0;
      row++;
    }
    if (row >= this.rows) {
      row = this.rows - 1;
      col = this.cols - 1;
    }
    this.cursor = { row, col };
    return this.cursor;
  }

  moveToPrevCell(row = this.cursor.row, col = this.cursor.col): CellPosition {
    col--;
    if (col < 0) {
      row--;
      col = this.cols - 1;
    }
    if (row < 0) {
      row = 0;
      col = 0;
    }
    this.cursor = { row, col };
    return this.cursor;
  }

  private isInvalidCell(row: number, col: number): boolean {
    return row < 0 || col < 0 || row >= this.rows || col >= this.cols;
  }
}

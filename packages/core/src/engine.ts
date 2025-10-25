export interface Password2DOptions {
  rows?: number;
  cols?: number;
  maxCharsPerCell?: number;
  coordinateMode?: "xy" | "yx";
  masked?: boolean;
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
  cursor: CellPosition; // NEW: track active position

  constructor({
    rows = 2,
    cols = 8,
    maxCharsPerCell = 3,
    coordinateMode = "xy",
    masked = true,
  }: Password2DOptions = {}) {
    this.rows = rows;
    this.cols = cols;
    this.maxCharsPerCell = maxCharsPerCell;
    this.coordinateMode = coordinateMode;
    this.masked = masked;
    this.grid = Array.from({ length: rows }, () => Array(cols).fill(""));
    this.cursor = { row: 0, col: 0 };
  }

  /** Add a character to the current cell, auto-move when full */
  addChar(row: number, col: number, char: string): CellPosition | null {
    if (this.isInvalidCell(row, col)) return null;

    const cell = this.grid[row][col] || "";
    // If already full, move to next cell before writing
    if (cell.length >= this.maxCharsPerCell) {
      return this.moveToNextCell(row, col);
    }

    this.grid[row][col] = cell + char;

    // When reaching max chars → move automatically
    if (this.grid[row][col].length >= this.maxCharsPerCell) {
      this.cursor = { row, col };
      return this.moveToNextCell(row, col);
    }

    return { row, col };
  }

  /** Delete one character from a cell */
  deleteChar(row: number, col: number) {
    if (this.isInvalidCell(row, col)) return;
    this.grid[row][col] = (this.grid[row][col] || "").slice(0, -1);
  }

  /** Reset entire grid */
  reset() {
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(""));
    this.cursor = { row: 0, col: 0 };
  }

  /** Toggle mask visibility */
  toggleMask() {
    this.masked = !this.masked;
  }

  /** Flatten grid into (x,y)character format */
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

  /** Get masked or unmasked grid */
  getMaskedGrid(): string[][] {
    return this.masked
      ? this.grid.map((row) => row.map((val) => "•".repeat(val.length)))
      : this.grid;
  }

  /** Clone instance deeply */
  clone(): Password2DEngine {
    const clone = new Password2DEngine({
      rows: this.rows,
      cols: this.cols,
      maxCharsPerCell: this.maxCharsPerCell,
      coordinateMode: this.coordinateMode,
      masked: this.masked,
    });
    clone.grid = this.grid.map((r) => [...r]);
    clone.cursor = { ...this.cursor };
    return clone;
  }

  /** Move to next logical cell (right → down) */
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

  /** Move to previous logical cell (left ← up) */
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

  /** Utility: check cell validity */
  private isInvalidCell(row: number, col: number): boolean {
    return row < 0 || col < 0 || row >= this.rows || col >= this.cols;
  }
}

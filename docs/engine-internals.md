Engine internals
================

This document describes the implementation details of the core engine (`packages/core/src/engine.ts`). The content below is taken from the source code and reflects current behavior precisely.

Key types (extracted from source)

```ts
export interface Password2DOptions {
  rows?: number;
  cols?: number;
  maxCharsPerCell?: number;
  coordinateMode?: "xy" | "yx";
  masked?: boolean;
  className?: string;
  activeCellClassName?: string;
  cellSize?: string;
  showHideButtonClassName?: string;
  resetButtonClassName?: string;
  showText?: string;
  hideText?: string;
  resetText?: string;
  showAriaLabel?: string;
  hideAriaLabel?: string;
}

export interface CellPosition { row: number; col: number }

export class Password2DEngine { /* ... */ }
```

Constructor & core state

- Default options (from constructor): `rows = 2`, `cols = 8`, `maxCharsPerCell = 3`, `coordinateMode = "xy"`, `masked = true`, and defaults for UI text/aria.
- Internal state:
  - `grid: string[][]` — rows × cols of cell strings (initially empty strings)
  - `cursor: CellPosition` — current focused cell (initially `{row:0,col:0}`)
  - configuration fields like `rows`, `cols`, `maxCharsPerCell`, `coordinateMode`, and `masked`.

Key algorithms and methods

- addChar(row: number, col: number, char: string): CellPosition | null
  - If the cell coordinates are invalid, returns `null`.
  - If the cell is already at capacity (`cell.length >= maxCharsPerCell`), it immediately calls `moveToNextCell` and returns that position instead (no change to the full cell's content).
  - Strips mask dots (`•`) and ignores whitespace-only input.
  - Appends a character and limits the stored string to `maxCharsPerCell`.
  - If after appending the cell reaches `maxCharsPerCell`, it updates `cursor` and returns the result of `moveToNextCell` (so callers can move focus).
  - Otherwise returns the current `{row,col}` where the character was added.

Excerpt (from source):

```ts
addChar(row: number, col: number, char: string): CellPosition | null {
  if (this.isInvalidCell(row, col)) return null;

  let cell = this.grid[row][col] || "";
  if (cell.length >= this.maxCharsPerCell) {
    return this.moveToNextCell(row, col);
  }

  if (char === "•" || !char.trim()) return { row, col };

  cell += char;
  this.grid[row][col] = cell.slice(0, this.maxCharsPerCell);

  if (this.grid[row][col].length >= this.maxCharsPerCell) {
    this.cursor = { row, col };
    return this.moveToNextCell(row, col);
  }

  this.cursor = { row, col };
  return { row, col };
}
```

- deleteChar(row: number, col: number)
  - If the cell coordinates are invalid, it no-ops.
  - Otherwise slices off the last character of the string in the cell (backspace semantics on a per-cell basis).

```ts
deleteChar(row: number, col: number) {
  if (this.isInvalidCell(row, col)) return;
  this.grid[row][col] = (this.grid[row][col] || "").slice(0, -1);
}
```

- reset()
  - Resets `grid` to empty strings and `cursor` to `{0,0}`.

- toggleMask()
  - Toggles the `masked` boolean flag.

- getFlattened(): string
  - Produces an encoded string representing occupied cells and their coordinates.
  - The format depends on `coordinateMode`:
    - If `coordinateMode === "xy"` (default), each non-empty cell at row `y`, column `x` becomes the token `(${x},${y})${val}`.
    - If `coordinateMode === "yx"`, tokens are `(${y},${x})${val}`.
  - Tokens are concatenated left-to-right, top-to-bottom (row-major order).

Excerpt (from source):

```ts
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
```

- getMaskedGrid(): string[][]
  - When `masked` is true returns a grid of the same shape with each cell replaced by `•` repeated the length of the real text. When `masked` is false returns the raw `grid`.

- clone()
  - Returns a new `Password2DEngine` instance with identical options and a shallow copy of `grid` and `cursor`.

- moveToNextCell / moveToPrevCell
  - `moveToNextCell` increments column; wraps to next row when column >= cols; clamps to last cell when beyond last row.
  - `moveToPrevCell` decrements column; wraps to previous row's last column when col < 0; clamps to first cell when beyond first row.

Edge cases and behaviors

- Overflow behavior: attempting to `addChar` when a cell is full returns the next position (via `moveToNextCell`) and does not append into a full cell.
- Invalid cell coordinates: `addChar` returns `null`, `deleteChar` is a no-op when given an invalid cell.
- Delete behavior: `deleteChar` removes the last character of a cell. There is no built-in automatic move-to-previous-cell on delete — adapters implement UX around backspace navigation.
- Cell boundaries: `moveToNextCell` clamps to the final cell when callers try to advance past the last cell; `moveToPrevCell` clamps to `(0,0)` when moving backwards past the first cell.

Example flow — typing the letters "HELLO" into a 3×8 grid with `maxCharsPerCell = 3`

Assumptions:
- `rows = 3`, `cols = 8`, `maxCharsPerCell = 3`, `coordinateMode = 'xy'`.

Initial grid (3 rows × 8 cols): every cell is `""` and cursor is `{0,0}`.

Type sequence: H, E, L, L, O

1) addChar(0,0,'H')
   - cell[0][0] becomes `"H"`, cursor `{0,0}`, returns `{0,0}`
2) addChar(0,0,'E')
   - cell[0][0] becomes `"HE"`, cursor `{0,0}`, returns `{0,0}`
3) addChar(0,0,'L')
   - cell[0][0] becomes `"HEL"` (reaches max), cursor updated then `moveToNextCell` returns `{1,0}`
4) addChar(0,1,'L')
   - cell[0][1] becomes `"L"`, cursor `{1,0}`
5) addChar(0,1,'O')
   - cell[0][1] becomes `"LO"`, cursor `{1,0}`

Grid after sequence (showing non-empty cells):

- row 0: ["HEL", "LO", "", "", "", "", "", ""]
- row 1: ["", "", "", "", "", "", "", ""]
- row 2: ["", "", "", "", "", "", "", ""]

Flattened (default `coordinateMode = 'xy'`):

`(0,0)HEL(1,0)LO`

Security implications of flattening

- The `getFlattened()` encoding includes coordinates `(col,row)` (default) and the cell's value. This increases the effective search space because the same set of characters arranged in different cells (and coordinates) produce different flattened strings.
- That said, the flattened string should be treated as the password equivalent by the backend: it must be hashed and stored with a secure algorithm (bcrypt, Argon2) and salted.

Implementation invariants and notes

- The engine is intentionally small and deterministic — it does not manage DOM, composition events, or browser quirks. Adapters implement the UX surrounding cursor/focus, composition, and visual masking.

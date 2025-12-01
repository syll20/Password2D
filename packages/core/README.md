````md
# @password2d/core  
Pure TypeScript engine for multi-dimensional passwords.

`@password2d/core` provides the low-level logic that powers all Password2D framework integrations (React, Vue, Angular, Vanilla JS).

No UI. No DOM. Pure deterministic logic.

---

## Features

- 2D password grid engine  
- Configure rows, columns, max chars per cell  
- Auto-advance cursor logic  
- Per-cell delete & navigation  
- Mask/unmask toggle  
- Flattened password output: `(x,y)characters`  
- Pure TypeScript, no dependencies  
- Easily wrapped into any front-end framework  

---

## Installation

```bash
npm install @password2d/core
````

---

## Usage

```ts
import { Password2DEngine } from "@password2d/core";

const engine = new Password2DEngine({
  rows: 2,
  cols: 8,
  maxCharsPerCell: 2,
});

engine.addChar(0, 0, "A");
engine.addChar(0, 0, "B");
engine.addChar(0, 1, "!");
engine.deleteChar(0, 1);

console.log(engine.getFlattened());
// Outputs: (0,0)AB
```

---

## Options

```ts
interface Password2DOptions {
  rows?: number;
  cols?: number;
  maxCharsPerCell?: number;
  coordinateMode?: "xy" | "yx";
  masked?: boolean;
}
```

---

## Key Methods

| Method              | Description                     |
| ------------------- | ------------------------------- |
| `addChar(r,c,char)` | Adds a char, returns next cell  |
| `deleteChar(r,c)`   | Deletes one char                |
| `moveToNextCell()`  | Moves cursor logically          |
| `moveToPrevCell()`  | Reverse navigation              |
| `getFlattened()`    | Returns backend password string |
| `getMaskedGrid()`   | Returns masked mirror grid      |
| `toggleMask()`      | Toggle masking mode             |
| `reset()`           | Reset whole grid                |


---

## Documentation

See full technical docs in the main repository:

[https://github.com/syll20/password2d](https://github.com/syll20/password2d)

---

##  License

MIT

````

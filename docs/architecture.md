Architecture
============

This project is a small monorepo implementing a 2D password input system. It consists of a framework-agnostic core engine and lightweight UI adapters for React, Vue, Angular, and Vanilla JavaScript.

Mermaid diagram (component relationships):

```mermaid
graph LR
  Core["@password2d/core (engine)"]
  React["@password2d/react (hook + Grid)"]
  Vue["@password2d/vue (composable + Grid)"]n+  Angular["@password2d/angular (component)"]
  Vanilla["vanilla (class)"]

  Core --> React
  Core --> Vue
  Core --> Angular
  Core --> Vanilla

  React --> App["consumer app (Login/Register)"]
  Vue --> App
  Angular --> App
  Vanilla --> App
```

High-level description
- Core (`packages/core`) contains the `Password2DEngine` class — the canonical implementation of grid state, cursor, masking and serialization (flattening).
- Framework adapters wrap a single `Password2DEngine` instance and provide UI, binding, and accessible interactions.
- Build and publish pipeline: each package provides `build` scripts in its `package.json`. The framework packages include `prepack`/`pretest` helpers that build core and embed a copy of core into `node_modules` during pack to make publishing reproducible.

How state flows (user input → engine → flattened password → backend)

1. The UI adapters render a grid of editable cells. Each cell maps to a string value stored in `engine.grid[row][col]`.
2. On user input (typing, paste, deletion), the UI calls `engine.addChar`, `engine.deleteChar`, or navigation methods.
3. The engine updates in-memory state: `grid` and `cursor`.
4. The adapter calls `engine.getFlattened()` when it needs to obtain the encoded password to send to a backend.
5. Backend receives flattened string (e.g. `(col,row)value` tokens) and should treat it like a password: hash + verify.

Separation of concerns
- Engine: all logic about character placement, cell capacity, cursor movement, masking, flattening, cloning and reset.
- UI adapters: only responsible for DOM/virtual DOM rendering, input handling, masking visuals and accessibility glue.
- Build: package-level build scripts generate `dist` artifacts for publishing.

Dependency graph

- `packages/core` is the foundation — exported types and `Password2DEngine`.
- `packages/react`, `packages/vue`, `packages/angular`, and `packages/vanilla` depend on `@password2d/core` at runtime and during their build phases. The packages provide adapters that instantiate and use the engine directly.

Notes on packaging
- The framework packages include `prepack` scripts that build core (`npm --prefix ../core run build`) and copy the resulting `core/dist` into `node_modules/@password2d/core` to create a bundled experience for publishing.

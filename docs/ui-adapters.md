UI adapters (React, Vue, Angular, Vanilla)
==========================================

This document describes how each framework wraps the `Password2DEngine` and how UI sync, masking, focus, and accessibility are handled. Examples are taken directly from the implementation in `packages/*/src`.

Shared concepts across adapters

- Each adapter instantiates (or receives) a `Password2DEngine` instance and reads/writes `engine.grid`, `engine.masked` and `engine.cursor`.
- UI adapters avoid relying purely on contentEditable inner text for state and instead call engine APIs (`addChar`, `deleteChar`, `moveToNextCell`, `getFlattened`, `reset`, `toggleMask`) on input events.
- Masking: adapters render either the raw `cell` or a masking string of `•` repeated to the cell's length.
- Accessibility: cells are rendered with `role="textbox"` and `aria-label` describing row/column.

React
-----

Files: `packages/react/src/usePassword2D.tsx` and `packages/react/src/Password2DGrid.tsx`.

- Hook: `usePassword2D(options?: Password2DOptions)` returns a tuple: `[flattened, GridComponent, engine]` where `GridComponent` renders the grid and wires `onChange` to update the hook's internal state. Excerpt:

```tsx
export function usePassword2D(options: Password2DOptions = {}) {
  const [engine] = useState(() => new Password2DEngine(options));
  const [masked, setMasked] = useState(engine.masked);
  const GridComponent = useMemo(() => function Grid() {
    return (
      <Password2DGrid engine={engine} masked={masked} onChange={() => { setMasked(engine.masked); }} />
    );
  }, [engine, masked]);

  return [engine.getFlattened(), GridComponent, engine] as const;
}
```

- Component: `Password2DGrid` uses `contentEditable` divs for cells, maintains `cellRefs`, `focused` state, and `suppressInput` flags. Key behaviors:
  - `handleInput` strips visual mask characters (`•`) from `innerText` and computes appended characters to call `engine.addChar` per character.
  - `handleKeyDown` intercepts printable characters and `Backspace` to call engine methods directly and manage focus/navigations.
  - `syncVisuals()` writes masked/unmasked text content to each cell and temporarily sets `suppressInput` to avoid recursion.

Props/config options (exposed via `Password2DEngine` options passed into the hook):
- `rows`, `cols`, `maxCharsPerCell`, `coordinateMode`, `masked`, `className`, `activeCellClassName`, `cellSize`, `showHideButtonClassName`, `resetButtonClassName`, `showText`, `hideText`, `resetText`, `showAriaLabel`, `hideAriaLabel`.

Example usage (React login form)

```tsx
const [encoded, Grid, engine] = usePassword2D({ rows: 3, cols: 8 });

function onSubmit() {
  const token = encoded; // send to backend
}

<form onSubmit={onSubmit}>
  <Grid />
  <button type="submit">Login</button>
</form>
```

Accessibility considerations
- Each cell uses `role="textbox"` and `aria-label` describing row/column.
- Keyboard navigation handled for arrows and Tab; adapters ensure focus is moved programmatically when the engine changes cursor.

Vue
----

Files: `packages/vue/src/usePassword2D.ts` and `packages/vue/src/Password2DGrid.vue`.

- Composable: `usePassword2D(options)` returns `[encoded, PasswordGridComponent]` where `encoded` is a `ref` linked to `engine.getFlattened()` and `PasswordGridComponent` is a small `defineComponent` wrapper that renders the `Password2DGrid.vue` component.
- The Vue component mirrors the React component logic: `contenteditable` cells, `suppressInput`, `isComposing`, `syncVisuals()`, and onChange handlers.

Angular
-------

Files: `packages/angular/...` (component wrapper located under `packages/angular/src/password2d-grid.component.ts`).

- Angular adapter follows the same pattern: it wraps `Password2DEngine`, maps events into engine methods and exposes an Angular component that projects the grid into the template. (See `packages/angular` for build packaging and `ng-packagr` configuration.)

Vanilla JS
-----------

Files: `packages/vanilla/src/Password2D.ts`.

- This class implements the same behavior using `HTMLElement` primitives:
  - Constructor accepts `container: HTMLElement` and `options: Password2DOptions`.
  - Public API: `on(event, cb)`, a `value` getter returning `engine.getFlattened()`, and `destroy()`.
  - Event handling logic matches framework adapters (input, keydown, paste, composition) and emits `'change'` events to listeners.

Differences among frameworks
- React: provides a hook `usePassword2D` which returns a component to embed; it favors functional component idioms (refs, state, effect). The hook returns `[flattened, GridComponent, engine]`.
- Vue: provides a composable `usePassword2D` returning `[encodedRef, Component]` and uses `ref/compute` for the masked state.
- Angular: standard component-based wrapper (built with `ng-packagr`), maintains compatibility via peer dependencies.
- Vanilla: class-based, easiest to drop into plain HTML pages; exposes `on('change', cb)` for change notification.

Accessibility
- Cells use `role="textbox"` and `aria-label` with row/col indexes.
- Buttons expose `aria-label` text via `engine.showAriaLabel`/`hideAriaLabel`.
- Keyboard navigation and focus management are implemented in all adapters, but integrators should test with screen readers for their target browsers.

Notes for integrators
- Always obtain the flattened value with `engine.getFlattened()` and send to backend via secure transport (HTTPS).
- Use the hook/composable APIs to get a stable `engine` instance (the adapters are designed to use a single engine instance for a grid).

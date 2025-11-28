```md
# @password2d/vue  
Vue 3 component + composable for Password2D.

Includes:

- `<Password2DGrid />` component  
- `usePassword2D()` composable  
- Masking / unmasking  
- Auto-advance between cells  
- Backend-friendly flattened password string  

---

## Installation

```bash
npm install @password2d/vue
````

Automatically installs:

```
@password2d/core
```

---

## Quick Start

```vue
<script setup lang="ts">
import { usePassword2D } from "@password2d/vue";

const { password, Grid } = usePassword2D({
  rows: 3,
  cols: 8,
});
</script>

<template>
  <Grid />
  <button @click="submit">Login</button>
</template>
```

---

## Composable API

```ts
const { password, Grid } = usePassword2D(options);
```

### Options

Same as React:

```ts
{
  rows?: number;
  cols?: number;
  maxCharsPerCell?: number;
  masked?: boolean;
  className?: string;
  activeCellClassName?: string;
  cellSize?: string;
}
```

---

## Example — Register Form

```vue
<script setup lang="ts">
import { usePassword2D } from "@password2d/vue";

const pw1 = usePassword2D();
const pw2 = usePassword2D();

function submit() {
  if (pw1.password.value !== pw2.password.value) {
    alert("Passwords do not match!");
    return;
  }
  post("/register", { password: pw1.password.value });
}
</script>

<template>
  <pw1.Grid />
  <pw2.Grid />
  <button @click="submit">Register</button>
</template>
```

---

## Documentation

See full docs + engine internals:

[https://github.com/password2d/password2d](https://github.com/password2d/password2d)

---

## License

MIT

````
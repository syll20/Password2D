```md
# @password2d/react  
React hook + component for Password2D.

This package provides the official React integration for Password2D via:

- `usePassword2D()` hook  
- `<Password2DGrid />` component  
- Full keyboard navigation  
- Masking/unmasking  
- Auto-advance between cells  
- Integration-ready for login/register pages  

---

## Installation

```bash
npm install @password2d/react
````

This automatically installs:

```
@password2d/core
```

---

## 🚀 Quick Start

```tsx
import { usePassword2D } from "@password2d/react";

export default function Login() {
  const [password, Grid] = usePassword2D({
    rows: 3,
    cols: 8,
    maxCharsPerCell: 2,
  });

  const submit = () => {
    post("/login", { password });
  };

  return (
    <>
      <Grid />
      <button onClick={submit}>Login</button>
    </>
  );
}
```

---

## Hook API: usePassword2D

```ts
const [password, Grid] = usePassword2D(options);
```

### **Options**

```ts
interface Password2DOptions {
  rows?: number;
  cols?: number;
  maxCharsPerCell?: number;
  masked?: boolean;
  className?: string;
  activeCellClassName?: string;
  cellSize?: string; // tailwind-friendly size like "w-10 h-10"
}
```

---

## Integration Example — Register Form

```tsx
const [password, Grid] = usePassword2D();
const [confirmPassword, ConfirmGrid] = usePassword2D();

const submit = () => {
  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }
  post("/register", { password });
};

return (
  <form onSubmit={submit}>
    <Grid />
    <ConfirmGrid />
    <button>Register</button>
  </form>
);
```

---

## Styling

By default the grid uses Tailwind-compatible classes.

Override globally:

```tsx
usePassword2D({
  className: "bg-gray-100 rounded-md p-2",
  activeCellClassName: "ring-2 ring-indigo-500",
  cellSize: "w-12 h-12",
});
```

---

## Documentation

Full documentation and core engine details:

[https://github.com/syll20/password2d](https://github.com/syll20/password2d)

---

## License

MIT

````

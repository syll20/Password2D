```md
# @password2d/angular  
Angular 14+ standalone component for Password2D authentication.

Features:

- `<password2d-grid>` Angular standalone component  
- Auto-advancing cells  
- Masking/unmasking  
- Full keyboard navigation  
- Works in reactive + template-driven forms  
- Produces a backend-ready flattened password string  

---

## Installation

```bash
npm install @password2d/angular
````

(Installs `@password2d/core` automatically.)

---

## 🚀 Quick Usage (Reactive Forms)

```ts
import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { usePassword2D } from '@password2d/angular';

@Component({
  selector: 'app-login',
  template: `
    <password2d-grid [engine]="pw.engine"></password2d-grid>
    <button (click)="submit()">Login</button>
  `,
  standalone: true,
})
export class LoginComponent {
  pw = usePassword2D({ rows: 3, cols: 8 });

  submit() {
    this.http.post("/login", { password: this.pw.password() }).subscribe();
  }
}
```

---

## Component Inputs

| Input                 | Type             | Description              |
| --------------------- | ---------------- | ------------------------ |
| `engine`              | Password2DEngine | Required engine instance |
| `className`           | string           | Optional styling class   |
| `activeCellClassName` | string           | Active focused cell      |
| `cellSize`            | string           | Tailwind-compatible size |

---

## Register Example (Two Grids)

```html
<password2d-grid [engine]="pw1.engine"></password2d-grid>
<password2d-grid [engine]="pw2.engine"></password2d-grid>
<button (click)="submit()">Register</button>
```

```ts
pw1 = usePassword2D();
pw2 = usePassword2D();

submit() {
  if (pw1.password() !== pw2.password()) {
    alert("Passwords must match");
    return;
  }
  this.http.post("/register", { password: pw1.password() }).subscribe();
}
```

---

## Documentation

Full docs available in the main repo:

[https://github.com/password2d/password2d](https://github.com/password2d/password2d)

---

## License

MIT

```

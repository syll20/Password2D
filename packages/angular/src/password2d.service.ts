import { Injectable, signal, computed } from "@angular/core";
import { Password2DEngine, Password2DOptions } from "@password2d/core";

@Injectable({ providedIn: "root" })
export class Password2DService {
  private engine!: Password2DEngine;
  grid = signal<string[][]>([]);
  masked = signal(true);
  flattened = computed(() => this.engine?.getFlattened() ?? "");

  init(options?: Password2DOptions) {
    this.engine = new Password2DEngine(options);
    this.grid.set(this.engine.getMaskedGrid());
    this.masked.set(this.engine.masked);
  }

  addChar(row: number, col: number, char: string) {
    this.engine.addChar(row, col, char);
    this.grid.set(this.engine.getMaskedGrid());
  }

  deleteChar(row: number, col: number) {
    this.engine.deleteChar(row, col);
    this.grid.set(this.engine.getMaskedGrid());
  }

  toggleMask() {
    this.engine.toggleMask();
    this.grid.set(this.engine.getMaskedGrid());
    this.masked.set(this.engine.masked);
  }

  reset() {
    this.engine.reset();
    this.grid.set(this.engine.getMaskedGrid());
  }
}

import { CommonModule } from "@angular/common";
import { Component, Input, Output, EventEmitter, ElementRef, ViewChildren, QueryList, OnInit } from "@angular/core";
import { Password2DEngine, Password2DOptions } from "@password2d/core";

@Component({
  selector: "password2d-grid",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-2">
      <div role="group" aria-label="2D password grid">
        <div *ngFor="let row of grid(); let r = index; trackBy: trackByRow" class="flex space-x-1">
          <div
            *ngFor="let cell of row; let c = index; trackBy: trackByCell"
            tabindex="0"
            class="border border-gray-400 rounded flex items-center justify-center
                   text-lg cursor-text focus:outline-none focus:ring-2 focus:ring-cyan-500
                   w-14 h-14 select-none"
            (keydown)="onKeyDown($event, r, c)"
            #gridCell
          >
            {{ cell }}
          </div>
        </div>
      </div>

      <div class="flex space-x-4 text-sm mt-1">
        <button type="button" (click)="toggleMask()" class="text-cyan-600 hover:underline">
          {{ masked() ? 'Show' : 'Hide' }}
        </button>
        <button type="button" (click)="reset()" class="text-gray-600 hover:underline">
          Reset
        </button>
      </div>
    </div>
  `,
})
export class Password2DGridComponent implements OnInit {
  @Input() options: Password2DOptions = {};
  @Output() passwordChange = new EventEmitter<string>();
  @ViewChildren('gridCell') gridCells!: QueryList<ElementRef>;

  private ROWS: number = 2;
  private COLS: number = 8;

  engine!: Password2DEngine;

  constructor() { }

  ngOnInit() {
    // Clone options to avoid mutating shared input object
    const opts: Password2DOptions = { ...this.options };
    // Ensure maxCharsPerCell defaults to 1 if not specified
    if (opts.maxCharsPerCell === undefined) {
      opts.maxCharsPerCell = 1;
    }
    this.engine = new Password2DEngine(opts);
    this.ROWS = opts.rows ?? 2;
    this.COLS = opts.cols ?? 8;
  }

  grid(): string[][] {
    return this.engine.getMaskedGrid();
  }

  masked(): boolean {
    return this.engine.masked;
  }

  flattened(): string {
    return this.engine.getFlattened();
  }

  onKeyDown(event: KeyboardEvent, row: number, col: number) {
    if (event.key === "Backspace") {
      event.preventDefault();
      this.engine.deleteChar(row, col);
      this.passwordChange.emit(this.flattened());
    } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();

      let nextRow = row;
      let nextCol = col;

      if (event.key === "ArrowUp") {
        nextRow = Math.max(0, row - 1);
      } else if (event.key === "ArrowDown") {
        nextRow = Math.min(this.ROWS - 1, row + 1);
      } else if (event.key === "ArrowLeft") {
        nextCol = Math.max(0, col - 1);
      } else if (event.key === "ArrowRight") {
        nextCol = Math.min(this.COLS - 1, col + 1);
      }

      const nextIndex = nextRow * this.COLS + nextCol;
      if (this.gridCells && this.gridCells.length > nextIndex) {
        this.gridCells.toArray()[nextIndex].nativeElement.focus();
      }
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const nextPosition = this.engine.addChar(row, col, event.key);
      this.passwordChange.emit(this.flattened());
      if (nextPosition) {
        const nextIndex = nextPosition.row * this.COLS + nextPosition.col;
        if (this.gridCells && this.gridCells.length > nextIndex) {
          this.gridCells.toArray()[nextIndex].nativeElement.focus();
        }
      }
    }
  }

  // Store last focused cell index to restore after mask toggle
  private lastFocusedIndex: number | null = null;

  toggleMask() {
    // Capture currently focused cell index
    const active = this.gridCells.find((_, i) => _.nativeElement === document.activeElement);
    this.lastFocusedIndex = active ? this.gridCells.toArray().indexOf(active) : null;
    this.engine.toggleMask();
    // After view updates, restore focus if we had a focused cell
    setTimeout(() => {
      if (this.lastFocusedIndex !== null && this.gridCells && this.gridCells.length > this.lastFocusedIndex) {
        this.gridCells.toArray()[this.lastFocusedIndex].nativeElement.focus();
      }
    }, 0);
  }


  reset() {
    this.engine.reset();
    this.passwordChange.emit("");
  }

  trackByRow(index: number, item: string[]): number {
    return index;
  }

  trackByCell(index: number, item: string): number {
    return index;
  }
}

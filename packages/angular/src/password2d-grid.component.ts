import { CommonModule } from "@angular/common";
import { Component, Input, Output, EventEmitter, signal } from "@angular/core";
import { Password2DService } from "./password2d.service";
import { Password2DOptions } from "@password2d/core";

@Component({
  selector: "password2d-grid",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-2">
      <div role="group" aria-label="2D password grid">
        <div *ngFor="let row of service.grid(); let r = index" class="flex space-x-1">
          <div
            *ngFor="let cell of row; let c = index"
            tabindex="0"
            contenteditable="true"
            class="border border-gray-400 rounded flex items-center justify-center
                   text-lg cursor-text focus:outline-none focus:ring-2 focus:ring-cyan-500
                   w-10 h-10 select-none"
            (input)="onInput($event, r, c)"
            (keydown)="onKeyDown($event, r, c)"
          >
            {{ cell }}
          </div>
        </div>
      </div>

      <div class="flex space-x-4 text-sm mt-1">
        <button type="button" (click)="toggleMask()" class="text-cyan-600 hover:underline">
          {{ service.masked() ? 'Show' : 'Hide' }}
        </button>
        <button type="button" (click)="reset()" class="text-gray-600 hover:underline">
          Reset
        </button>
      </div>
    </div>
  `,
})
export class Password2DGridComponent {
  @Input() options: Password2DOptions = {};
  @Output() passwordChange = new EventEmitter<string>();

  constructor(public service: Password2DService) {}

  ngOnInit() {
    this.service.init(this.options);
  }

  onInput(event: Event, row: number, col: number) {
    const text = (event.target as HTMLElement).innerText;
    if (text.length > 0) {
      const char = text.slice(-1);
      this.service.addChar(row, col, char);
    }
    this.passwordChange.emit(this.service.flattened());
  }

  onKeyDown(event: KeyboardEvent, row: number, col: number) {
    if (event.key === "Backspace") {
      event.preventDefault();
      this.service.deleteChar(row, col);
      this.passwordChange.emit(this.service.flattened());
    }
  }

  toggleMask() {
    this.service.toggleMask();
  }

  reset() {
    this.service.reset();
    this.passwordChange.emit("");
  }
}

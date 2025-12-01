import { Password2DEngine, Password2DOptions, CellPosition } from "@password2d/core";

export class Password2D {
    private engine: Password2DEngine;
    private container: HTMLElement;
    private cellRefs: (HTMLDivElement | null)[][];
    private listeners: { [key: string]: Function[] } = {};
    private focused: CellPosition | null = null;
    private isComposing: boolean = false;

    constructor(container: HTMLElement, options: Password2DOptions = {}) {
        this.container = container;
        this.engine = new Password2DEngine(options);
        this.cellRefs = Array.from({ length: this.engine.rows }, () =>
            Array(this.engine.cols).fill(null)
        );
        this.render();
    }

    /**
     * Subscribe to an event.
     * Supported events: 'change'
     */
    on(event: string, callback: Function) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    /**
     * Trigger an event.
     */
    private emit(event: string, ...args: any[]) {
        if (this.listeners[event]) {
            this.listeners[event].forEach((cb) => cb(...args));
        }
    }

    /**
     * Get the current value of the grid (concatenated string).
     */
    get value(): string {
        return this.engine.getFlattened();
    }

    /**
     * Render the grid into the container.
     */
    private render() {
        this.container.innerHTML = "";
        this.container.className = "space-y-2"; // Basic container styling

        // Grid Container
        const gridContainer = document.createElement("div");
        gridContainer.setAttribute("role", "group");
        gridContainer.setAttribute("aria-label", "2D password grid");

        // Styles
        const defaultBaseWithoutSize =
            "border border-gray-400 rounded flex items-center justify-center text-lg cursor-text focus:outline-none focus:ring-2 focus:ring-cyan-500 select-none bg-white overflow-hidden text-center";

        const providedBase = this.engine.className && this.engine.className.toString().trim()
            ? this.engine.className.toString().trim()
            : defaultBaseWithoutSize;

        const sizeClass = this.engine.cellSize && this.engine.cellSize.toString().trim()
            ? this.engine.cellSize.toString().trim()
            : "w-12 h-12";

        const baseClass = `${providedBase} ${sizeClass}`;

        const activeClass =
            this.engine.activeCellClassName && this.engine.activeCellClassName.toString().trim()
                ? this.engine.activeCellClassName.toString().trim()
                : "ring-cyan-500 border-cyan-500";

        // Build Grid
        this.engine.grid.forEach((row, r) => {
            const rowDiv = document.createElement("div");
            rowDiv.className = "flex space-x-1";

            row.forEach((_, c) => {
                const cellDiv = document.createElement("div");
                this.cellRefs[r][c] = cellDiv;

                cellDiv.setAttribute("role", "textbox");
                cellDiv.setAttribute("aria-label", `Password cell at row ${r + 1}, column ${c + 1}`);
                cellDiv.contentEditable = "true";
                cellDiv.tabIndex = 0;
                cellDiv.className = baseClass;

                // Event Listeners
                cellDiv.addEventListener("focus", () => {
                    this.focused = { row: r, col: c };
                    this.updateActiveClasses(activeClass, baseClass);
                });

                cellDiv.addEventListener("input", (e) => this.handleInput(e, r, c));
                cellDiv.addEventListener("compositionstart", () => (this.isComposing = true));
                cellDiv.addEventListener("compositionend", () => (this.isComposing = false));
                cellDiv.addEventListener("keydown", (e) => this.handleKeyDown(e, r, c));
                cellDiv.addEventListener("paste", (e) => this.handlePaste(e, r, c));

                rowDiv.appendChild(cellDiv);
            });
            gridContainer.appendChild(rowDiv);
        });

        this.container.appendChild(gridContainer);

        // Controls
        const controlsDiv = document.createElement("div");
        controlsDiv.className = "flex space-x-4 text-sm mt-1";

        // Show/Hide Button
        const showHideBtn = document.createElement("button");
        showHideBtn.type = "button";
        showHideBtn.className = this.engine.showHideButtonClassName && this.engine.showHideButtonClassName.toString().trim()
            ? this.engine.showHideButtonClassName.toString().trim()
            : "text-cyan-600 hover:underline";
        showHideBtn.textContent = this.engine.masked ? (this.engine.showText ?? "Show") : (this.engine.hideText ?? "Hide");
        showHideBtn.onclick = () => {
            this.engine.toggleMask();
            this.emit("change");
            this.syncVisuals();
            // Update button text
            showHideBtn.textContent = this.engine.masked ? (this.engine.showText ?? "Show") : (this.engine.hideText ?? "Hide");
            showHideBtn.setAttribute("aria-label", this.engine.masked
                ? (this.engine.showAriaLabel ?? this.engine.showText ?? "Show password grid")
                : (this.engine.hideAriaLabel ?? this.engine.hideText ?? "Hide password grid")
            );
        };
        controlsDiv.appendChild(showHideBtn);

        // Reset Button
        const resetBtn = document.createElement("button");
        resetBtn.type = "button";
        resetBtn.className = this.engine.resetButtonClassName && this.engine.resetButtonClassName.toString().trim()
            ? this.engine.resetButtonClassName.toString().trim()
            : "text-gray-600 hover:underline";
        resetBtn.textContent = this.engine.resetText ?? "Reset";
        resetBtn.onclick = () => {
            this.engine.reset();
            this.emit("change");
            this.syncVisuals();
            this.focusCell(0, 0);
        };
        controlsDiv.appendChild(resetBtn);

        this.container.appendChild(controlsDiv);

        // Initial sync
        this.syncVisuals();
    }

    private updateActiveClasses(activeClass: string, baseClass: string) {
        for (let r = 0; r < this.engine.rows; r++) {
            for (let c = 0; c < this.engine.cols; c++) {
                const el = this.cellRefs[r][c];
                if (el) {
                    if (this.focused && this.focused.row === r && this.focused.col === c) {
                        el.className = `${baseClass} ${activeClass}`;
                    } else {
                        el.className = baseClass;
                    }
                }
            }
        }
    }

    private syncVisuals() {
        for (let r = 0; r < this.engine.rows; r++) {
            for (let c = 0; c < this.engine.cols; c++) {
                const el = this.cellRefs[r][c];
                if (el) {
                    const v = this.engine.grid[r][c];
                    el.textContent = this.engine.masked ? "•".repeat(v.length) : v;
                }
            }
        }
    }

    private focusCell(r: number, c: number) {
        if (r < 0 || c < 0 || r >= this.engine.rows || c >= this.engine.cols) return;
        const el = this.cellRefs[r][c];
        if (el) {
            el.focus();
            this.focused = { row: r, col: c };
            // Re-apply classes to show focus ring
            const defaultBaseWithoutSize =
                "border border-gray-400 rounded flex items-center justify-center text-lg cursor-text focus:outline-none focus:ring-2 focus:ring-cyan-500 select-none bg-white overflow-hidden text-center";

            const providedBase = this.engine.className && this.engine.className.toString().trim()
                ? this.engine.className.toString().trim()
                : defaultBaseWithoutSize;

            const sizeClass = this.engine.cellSize && this.engine.cellSize.toString().trim()
                ? this.engine.cellSize.toString().trim()
                : "w-12 h-12";

            const baseClass = `${providedBase} ${sizeClass}`;

            const activeClass =
                this.engine.activeCellClassName && this.engine.activeCellClassName.toString().trim()
                    ? this.engine.activeCellClassName.toString().trim()
                    : "ring-cyan-500 border-cyan-500";

            this.updateActiveClasses(activeClass, baseClass);
        }
    }

    private handleInput(e: Event, r: number, c: number) {
        const el = e.target as HTMLDivElement;
        const rawTyped = el.innerText || "";
        const typed = rawTyped.replace(/•/g, "");

        if (rawTyped.includes("•")) {
            setTimeout(() => this.syncVisuals(), 30);
        }

        const current = this.engine.grid[r][c] || "";
        let appended = "";

        if (typed.length > current.length) {
            appended = typed.slice(current.length);
        }

        if (appended) {
            let pos = { row: r, col: c };
            for (const ch of appended) {
                const next = this.engine.addChar(pos.row, pos.col, ch);
                if (!next) break;
                pos = next;
            }
            this.emit("change");
            requestAnimationFrame(() => this.syncVisuals());
            this.focusCell(pos.row, pos.col);
        } else if (typed.length < current.length) {
            requestAnimationFrame(() => this.syncVisuals());
        }
    }

    private handleKeyDown(e: KeyboardEvent, r: number, c: number) {
        if (e.key === "Backspace") {
            e.preventDefault();
            this.engine.deleteChar(r, c);
            this.emit("change");
            requestAnimationFrame(() => this.syncVisuals());
            this.focusCell(r, c);
            return;
        }

        if (this.isComposing) return;

        const isPrintable = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
        if (isPrintable) {
            e.preventDefault();
            let pos = { row: r, col: c };
            for (const ch of e.key) {
                const next = this.engine.addChar(pos.row, pos.col, ch);
                if (!next) break;
                pos = next;
            }
            this.emit("change");
            requestAnimationFrame(() => this.syncVisuals());
            this.focusCell(pos.row, pos.col);
            return;
        }

        switch (e.key) {
            case "ArrowUp":
                e.preventDefault();
                this.focusCell(r - 1, c);
                break;
            case "ArrowDown":
                e.preventDefault();
                this.focusCell(r + 1, c);
                break;
            case "ArrowLeft":
                e.preventDefault();
                this.focusCell(r, c - 1);
                break;
            case "ArrowRight":
            case "Tab":
                e.preventDefault();
                if (e.shiftKey) {
                    const prev = this.engine.moveToPrevCell(r, c);
                    if (prev) this.focusCell(prev.row, prev.col);
                } else {
                    const next = this.engine.moveToNextCell(r, c);
                    if (next) this.focusCell(next.row, next.col);
                }
                break;
        }
    }

    private handlePaste(e: ClipboardEvent, r: number, c: number) {
        e.preventDefault();
        const text = e.clipboardData?.getData("text") || "";
        if (!text) return;
        let pos = { row: r, col: c };
        for (const ch of text) {
            const next = this.engine.addChar(pos.row, pos.col, ch);
            if (!next) break;
            pos = next;
        }
        this.emit("change");
        requestAnimationFrame(() => this.syncVisuals());
        this.focusCell(pos.row, pos.col);
    }

    destroy() {
        this.container.innerHTML = "";
        this.listeners = {};
    }
}

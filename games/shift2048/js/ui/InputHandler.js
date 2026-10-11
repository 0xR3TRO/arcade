/**
 * InputHandler — Keyboard, touch, and pointer input.
 */
export class InputHandler {
    constructor(bus, gridEl) {
        this.bus = bus;
        this.gridEl = gridEl;
        this.enabled = true;
        this._bindKeyboard();
        this._bindTouch();
        this._bindPointer();
    }

    enable() {
        this.enabled = true;
    }
    disable() {
        this.enabled = false;
    }

    _emit(dir) {
        if (this.enabled) this.bus.emit("input:move", dir);
    }

    _bindKeyboard() {
        const map = {
            ArrowLeft: "left",
            ArrowRight: "right",
            ArrowUp: "up",
            ArrowDown: "down",
            a: "left",
            d: "right",
            w: "up",
            s: "down",
            A: "left",
            D: "right",
            W: "up",
            S: "down",
        };
        document.addEventListener("keydown", (e) => {
            const dir = map[e.key];
            if (dir) {
                e.preventDefault();
                this._emit(dir);
            }
        });
    }

    _bindTouch() {
        const THRESH = 30;
        let x0, y0;
        this.gridEl.addEventListener(
            "touchstart",
            (e) => {
                const t = e.touches[0];
                x0 = t.clientX;
                y0 = t.clientY;
            },
            { passive: true },
        );

        this.gridEl.addEventListener(
            "touchend",
            (e) => {
                if (x0 == null) return;
                const t = e.changedTouches[0];
                const dx = t.clientX - x0,
                    dy = t.clientY - y0;
                const ax = Math.abs(dx),
                    ay = Math.abs(dy);
                if (Math.max(ax, ay) < THRESH) return;
                this._emit(
                    ax > ay
                        ? dx > 0
                            ? "right"
                            : "left"
                        : dy > 0
                          ? "down"
                          : "up",
                );
                x0 = y0 = null;
            },
            { passive: true },
        );
    }

    _bindPointer() {
        const THRESH = 30;
        let down = false,
            px,
            py;
        this.gridEl.addEventListener("pointerdown", (e) => {
            if (e.pointerType === "touch") return;
            down = true;
            px = e.clientX;
            py = e.clientY;
        });
        this.gridEl.addEventListener("pointerup", (e) => {
            if (!down) return;
            down = false;
            const dx = e.clientX - px,
                dy = e.clientY - py;
            const ax = Math.abs(dx),
                ay = Math.abs(dy);
            if (Math.max(ax, ay) < THRESH) return;
            this._emit(
                ax > ay ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up",
            );
        });
    }
}

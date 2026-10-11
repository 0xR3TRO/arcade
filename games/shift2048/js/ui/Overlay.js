/**
 * Overlay — Win, Game Over, and mode-selection overlays.
 */
export class Overlay {
    constructor(bus) {
        this.bus = bus;
        this.$win = document.getElementById("overlay-win");
        this.$over = document.getElementById("overlay-over");
        this.$finalScore = document.getElementById("final-score-text");

        bus.on("game:win", ({ score }) => {
            this.$win.classList.add("show");
        });

        bus.on("game:over", ({ score }) => {
            this.$finalScore.textContent = `Final Score: ${score}`;
            this.$over.classList.add("show");
        });

        bus.on("game:start", () => this.hideAll());
        bus.on("game:restored", () => this.hideAll());
        bus.on("game:continued", () => this.hideAll());
        bus.on("game:undo", () => this.hideAll());
    }

    hideAll() {
        this.$win.classList.remove("show");
        this.$over.classList.remove("show");
    }
}

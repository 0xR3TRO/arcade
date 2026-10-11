// src/ui/controls.js — Keyboard and touch controls

export const Controls = {
    game: null,

    init(game) {
        this.game = game;
        this._bindKeyboard();
        this._bindTouch();
        this._bindButtons();
    },

    _bindKeyboard() {
        document.addEventListener("keydown", (e) => {
            if (this.game.state === "menu") return;

            const { Snake } = this._getSnakeModule();

            switch (e.key) {
                case "ArrowUp":
                case "w":
                case "W":
                    e.preventDefault();
                    if (this.game.state === "playing")
                        Snake.setDirection(0, -1);
                    break;
                case "ArrowDown":
                case "s":
                case "S":
                    e.preventDefault();
                    if (this.game.state === "playing") Snake.setDirection(0, 1);
                    break;
                case "ArrowLeft":
                case "a":
                case "A":
                    e.preventDefault();
                    if (this.game.state === "playing")
                        Snake.setDirection(-1, 0);
                    break;
                case "ArrowRight":
                case "d":
                case "D":
                    e.preventDefault();
                    if (this.game.state === "playing") Snake.setDirection(1, 0);
                    break;
                case "Escape":
                case "p":
                case "P":
                    e.preventDefault();
                    this.game.togglePause();
                    break;
            }
        });
    },

    _bindTouch() {
        const btns = {
            "touch-up": [0, -1],
            "touch-down": [0, 1],
            "touch-left": [-1, 0],
            "touch-right": [1, 0],
        };

        for (const [id, dir] of Object.entries(btns)) {
            const el = document.getElementById(id);
            if (!el) continue;
            el.addEventListener(
                "touchstart",
                (e) => {
                    e.preventDefault();
                    if (this.game.state === "playing") {
                        const { Snake } = this._getSnakeModule();
                        Snake.setDirection(dir[0], dir[1]);
                    }
                },
                { passive: false },
            );
            el.addEventListener("click", () => {
                if (this.game.state === "playing") {
                    const { Snake } = this._getSnakeModule();
                    Snake.setDirection(dir[0], dir[1]);
                }
            });
        }
    },

    _bindButtons() {
        document.getElementById("btn-pause")?.addEventListener("click", () => {
            this.game.togglePause();
        });
        document
            .getElementById("btn-restart")
            ?.addEventListener("click", () => {
                this.game.resetGame();
            });
    },

    _getSnakeModule() {
        // Use the globally exposed Snake reference from game-loop
        return { Snake: window.__serpentRush_Snake };
    },
};

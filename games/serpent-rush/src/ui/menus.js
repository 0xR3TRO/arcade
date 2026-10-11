// src/ui/menus.js — Start screen, pause overlay, game over screen

export const Menus = {
    game: null,
    startScreen: null,
    pauseScreen: null,
    gameOverScreen: null,
    settingsPanel: null,

    init(game) {
        this.game = game;
        this.startScreen = document.getElementById("screen-start");
        this.pauseScreen = document.getElementById("screen-pause");
        this.gameOverScreen = document.getElementById("screen-gameover");
        this.settingsPanel = document.getElementById("settings-panel");

        // Start screen — play buttons
        document.getElementById("btn-play")?.addEventListener("click", () => {
            const select = document.getElementById("mode-select");
            this.game.startGame(select ? select.value : "classic");
        });

        // Pause screen
        document.getElementById("btn-resume")?.addEventListener("click", () => {
            this.game.resumeGame();
        });
        document
            .getElementById("btn-quit-pause")
            ?.addEventListener("click", () => {
                this.game.resetGame();
            });

        // Game over screen
        document
            .getElementById("btn-playagain")
            ?.addEventListener("click", () => {
                const select = document.getElementById("mode-select");
                this.game.startGame(select ? select.value : "classic");
            });
        document
            .getElementById("btn-quit-gameover")
            ?.addEventListener("click", () => {
                this.game.resetGame();
            });

        // Settings toggle
        document
            .getElementById("btn-settings")
            ?.addEventListener("click", () => {
                this.toggleSettings();
            });
        document
            .getElementById("btn-close-settings")
            ?.addEventListener("click", () => {
                this.toggleSettings();
            });

        // Theme selector
        document
            .getElementById("theme-select")
            ?.addEventListener("change", (e) => {
                this.game.setTheme(e.target.value);
            });
    },

    showStart(modes) {
        this.hideAll();

        // Populate mode selector
        const select = document.getElementById("mode-select");
        if (select) {
            select.innerHTML = "";
            for (const [key, mode] of Object.entries(modes)) {
                const opt = document.createElement("option");
                opt.value = key;
                opt.textContent = mode.name;
                select.appendChild(opt);
            }
        }

        if (this.startScreen) {
            this.startScreen.classList.add("active");
        }
    },

    showPause() {
        if (this.pauseScreen) {
            this.pauseScreen.classList.add("active");
        }
    },

    showGameOver(score, highScore) {
        if (this.gameOverScreen) {
            const scoreEl = document.getElementById("gameover-score");
            const highEl = document.getElementById("gameover-highscore");
            if (scoreEl) scoreEl.textContent = score;
            if (highEl) highEl.textContent = highScore;
            this.gameOverScreen.classList.add("active");
        }
    },

    hideAll() {
        [this.startScreen, this.pauseScreen, this.gameOverScreen].forEach(
            (el) => {
                if (el) el.classList.remove("active");
            },
        );
    },

    toggleSettings() {
        if (this.settingsPanel) {
            this.settingsPanel.classList.toggle("active");
        }
    },
};

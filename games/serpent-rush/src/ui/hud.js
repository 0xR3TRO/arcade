// src/ui/hud.js — HUD: score, high score, mode, speed level, timer

export const HUD = {
    scoreEl: null,
    highScoreEl: null,
    modeEl: null,
    levelEl: null,
    timerEl: null,

    init() {
        this.scoreEl = document.getElementById("hud-score");
        this.highScoreEl = document.getElementById("hud-highscore");
        this.modeEl = document.getElementById("hud-mode");
        this.levelEl = document.getElementById("hud-level");
        this.timerEl = document.getElementById("hud-timer");
    },

    update(score, highScore, modeName, level) {
        if (this.scoreEl) this.scoreEl.textContent = score;
        if (this.highScoreEl) this.highScoreEl.textContent = highScore;
        if (this.modeEl) this.modeEl.textContent = modeName;
        if (this.levelEl) this.levelEl.textContent = level;
    },

    showTimer(seconds) {
        if (!this.timerEl) return;
        this.timerEl.style.display = "block";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        this.timerEl.textContent = `${m}:${s.toString().padStart(2, "0")}`;
    },

    hideTimer() {
        if (this.timerEl) this.timerEl.style.display = "none";
    },

    reset() {
        this.update(0, 0, "--", 1);
        this.hideTimer();
    },
};

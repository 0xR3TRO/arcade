// src/systems/score-system.js — Scoring, multipliers, high score

import { Storage } from "./storage.js";

export const ScoreSystem = {
    score: 0,
    highScore: 0,

    init() {
        this.score = 0;
        this.highScore = Storage.get("highScore", 0);
    },

    reset() {
        this.score = 0;
    },

    add(level) {
        const points = 10 * level;
        this.score += points;
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
        return points;
    },

    saveHighScore() {
        Storage.set("highScore", this.highScore);
    },

    getScore() {
        return this.score;
    },

    getHighScore() {
        return this.highScore;
    },
};

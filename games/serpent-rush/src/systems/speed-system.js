// src/systems/speed-system.js — Difficulty scaling, snake acceleration

export const SpeedSystem = {
    baseInterval: 150, // ms per tick at level 1
    interval: 150,
    level: 1,
    speedScale: 1.0,
    minInterval: 50, // fastest possible
    pointsPerLevel: 50,

    init(baseInterval, speedScale) {
        this.baseInterval = baseInterval || 150;
        this.interval = this.baseInterval;
        this.speedScale = speedScale || 1.0;
        this.level = 1;
    },

    onScore(totalScore) {
        const newLevel = Math.floor(totalScore / this.pointsPerLevel) + 1;
        if (newLevel !== this.level) {
            this.level = newLevel;
            this.interval = Math.max(
                this.minInterval,
                this.baseInterval - (this.level - 1) * 8 * this.speedScale,
            );
        }
    },

    getInterval() {
        return this.interval;
    },

    getLevel() {
        return this.level;
    },
};

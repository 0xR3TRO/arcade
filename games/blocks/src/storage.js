"use strict";

/**
 * R3TRO Blocks Storage System
 * LocalStorage persistence for scores, settings, and stats
 * @module storage
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEYS = {
    HIGH_SCORES: "r3tro_blocks_scores",
    SETTINGS: "r3tro_blocks_settings",
    STATS: "r3tro_blocks_stats",
};

/** Default settings */
const DEFAULT_SETTINGS = {
    das: 167,
    arr: 33,
    sdf: 20,
    ghostEnabled: true,
    gridEnabled: true,
    animations: true,
    volume: 0.7,
    musicVolume: 0.4,
    sfxVolume: 1.0,
    theme: "dark",
    musicEnabled: false,
    sfxEnabled: true,
    musicStyle: "classic",
};

/** Default stats */
const DEFAULT_STATS = {
    totalGamesPlayed: 0,
    totalLinesCleared: 0,
    totalTimePlayed: 0,
    totalPiecesPlaced: 0,
    maxScore: 0,
    maxLevel: 0,
    maxLines: 0,
    tSpinsTotal: 0,
    quadsTotal: 0,
};

// ============================================================================
// STORAGE MANAGER
// ============================================================================

/**
 * Manages LocalStorage persistence
 * @class StorageManager
 */
class StorageManager {
    #settings;
    #stats;
    #scores;

    constructor() {
        this.#settings = this.#loadSettings();
        this.#stats = this.#loadStats();
        this.#scores = this.#loadScores();
    }

    // =========================================================================
    // SETTINGS
    // =========================================================================

    /**
     * Load settings from storage
     * @returns {Object} Settings object
     */
    #loadSettings() {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (stored) {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.warn("Failed to load settings:", e);
        }
        return { ...DEFAULT_SETTINGS };
    }

    /**
     * Save settings to storage
     */
    #saveSettings() {
        try {
            localStorage.setItem(
                STORAGE_KEYS.SETTINGS,
                JSON.stringify(this.#settings),
            );
        } catch (e) {
            console.warn("Failed to save settings:", e);
        }
    }

    /**
     * Get all settings
     * @returns {Object} Settings object
     */
    getSettings() {
        return { ...this.#settings };
    }

    /**
     * Get a specific setting
     * @param {string} key - Setting key
     * @returns {*} Setting value
     */
    getSetting(key) {
        return this.#settings[key];
    }

    /**
     * Update settings
     * @param {Object} newSettings - Settings to update
     */
    updateSettings(newSettings) {
        this.#settings = { ...this.#settings, ...newSettings };
        this.#saveSettings();
    }

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        this.#settings = { ...DEFAULT_SETTINGS };
        this.#saveSettings();
    }

    // =========================================================================
    // STATS
    // =========================================================================

    /**
     * Load stats from storage
     * @returns {Object} Stats object
     */
    #loadStats() {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.STATS);
            if (stored) {
                return { ...DEFAULT_STATS, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.warn("Failed to load stats:", e);
        }
        return { ...DEFAULT_STATS };
    }

    /**
     * Save stats to storage
     */
    #saveStats() {
        try {
            localStorage.setItem(
                STORAGE_KEYS.STATS,
                JSON.stringify(this.#stats),
            );
        } catch (e) {
            console.warn("Failed to save stats:", e);
        }
    }

    /**
     * Get all stats
     * @returns {Object} Stats object
     */
    getStats() {
        return { ...this.#stats };
    }

    /**
     * Update stats after a game
     * @param {Object} gameStats - Stats from completed game
     */
    updateStats(gameStats) {
        this.#stats.totalGamesPlayed++;
        this.#stats.totalLinesCleared += gameStats.lines || 0;
        this.#stats.totalTimePlayed += gameStats.time || 0;
        this.#stats.totalPiecesPlaced += gameStats.piecesPlaced || 0;
        this.#stats.tSpinsTotal += gameStats.tSpins || 0;
        this.#stats.quadsTotal += gameStats.quads || 0;

        if (gameStats.score > this.#stats.maxScore) {
            this.#stats.maxScore = gameStats.score;
        }
        if (gameStats.level > this.#stats.maxLevel) {
            this.#stats.maxLevel = gameStats.level;
        }
        if (gameStats.lines > this.#stats.maxLines) {
            this.#stats.maxLines = gameStats.lines;
        }

        this.#saveStats();
    }

    /**
     * Reset stats
     */
    resetStats() {
        this.#stats = { ...DEFAULT_STATS };
        this.#saveStats();
    }

    // =========================================================================
    // HIGH SCORES
    // =========================================================================

    /**
     * Load scores from storage
     * @returns {Object} Scores by mode
     */
    #loadScores() {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.HIGH_SCORES);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn("Failed to load scores:", e);
        }
        return {
            marathon: [],
            sprint: [],
            ultra: [],
        };
    }

    /**
     * Save scores to storage
     */
    #saveScores() {
        try {
            localStorage.setItem(
                STORAGE_KEYS.HIGH_SCORES,
                JSON.stringify(this.#scores),
            );
        } catch (e) {
            console.warn("Failed to save scores:", e);
        }
    }

    /**
     * Get high scores for a mode
     * @param {string} mode - Game mode
     * @returns {Array} Array of score entries
     */
    getHighScores(mode) {
        return [...(this.#scores[mode] || [])];
    }

    /**
     * Check if score qualifies for leaderboard
     * @param {string} mode - Game mode
     * @param {number} score - Score to check
     * @returns {boolean} True if qualifies
     */
    isHighScore(mode, score) {
        const scores = this.#scores[mode] || [];
        if (scores.length < 10) return true;
        return score > scores[scores.length - 1].score;
    }

    /**
     * Add a new high score
     * @param {string} mode - Game mode
     * @param {Object} entry - Score entry
     * @returns {number} Position in leaderboard (1-10) or -1 if not added
     */
    addHighScore(mode, entry) {
        if (!this.#scores[mode]) {
            this.#scores[mode] = [];
        }

        const newEntry = {
            name: (entry.name || "AAA").substring(0, 3).toUpperCase(),
            score: entry.score || 0,
            level: entry.level || 1,
            lines: entry.lines || 0,
            time: entry.time || 0,
            date: new Date().toISOString(),
            mode,
        };

        this.#scores[mode].push(newEntry);

        // Sort by score (descending) for marathon/ultra, by time (ascending) for sprint
        if (mode === "sprint") {
            this.#scores[mode].sort((a, b) => a.time - b.time);
        } else {
            this.#scores[mode].sort((a, b) => b.score - a.score);
        }

        // Keep only top 10
        this.#scores[mode] = this.#scores[mode].slice(0, 10);

        this.#saveScores();

        // Return position
        const position = this.#scores[mode].findIndex(
            (e) => e.date === newEntry.date && e.score === newEntry.score,
        );
        return position >= 0 ? position + 1 : -1;
    }

    /**
     * Clear all high scores
     * @param {string} [mode] - Optional specific mode to clear
     */
    clearHighScores(mode) {
        if (mode) {
            this.#scores[mode] = [];
        } else {
            this.#scores = {
                marathon: [],
                sprint: [],
                ultra: [],
            };
        }
        this.#saveScores();
    }

    /**
     * Format time for display
     * @param {number} ms - Time in milliseconds
     * @returns {string} Formatted time string
     */
    static formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor((ms % 1000) / 10);

        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
    }

    /**
     * Format score for display
     * @param {number} score - Score value
     * @returns {string} Formatted score string
     */
    static formatScore(score) {
        return score.toString().padStart(6, "0");
    }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        StorageManager,
        DEFAULT_SETTINGS,
        DEFAULT_STATS,
        STORAGE_KEYS,
    };
}

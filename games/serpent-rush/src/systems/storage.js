// src/systems/storage.js — localStorage wrapper for high score and settings

export const Storage = {
    prefix: "serpentrush_",

    init() {
        // Verify localStorage is available
        try {
            const test = "__sr_test__";
            localStorage.setItem(test, "1");
            localStorage.removeItem(test);
        } catch {
            console.warn("localStorage unavailable, scores will not persist.");
        }
    },

    get(key, fallback) {
        try {
            const val = localStorage.getItem(this.prefix + key);
            if (val === null) return fallback;
            return JSON.parse(val);
        } catch {
            return fallback;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
        } catch {
            // Quota exceeded or unavailable — silently fail
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
        } catch {
            // Silently fail
        }
    },
};

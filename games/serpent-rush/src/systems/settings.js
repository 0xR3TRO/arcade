// src/systems/settings.js — Game configuration loader

import { Storage } from "./storage.js";

export const Settings = {
    gridCols: 20,
    gridRows: 20,
    startSpeed: 150, // ms per tick
    speedScale: 1.0,
    obstacleCount: 8,
    themes: {},
    modes: {},
    currentTheme: "classic",
    defaultMode: "classic",

    async load() {
        try {
            const [themesRes, modesRes] = await Promise.all([
                fetch("./config/themes.json"),
                fetch("./config/modes.json"),
            ]);
            const themesData = await themesRes.json();
            const modesData = await modesRes.json();

            this.themes = themesData.themes || {};
            this.modes = modesData.modes || {};
            this.defaultMode = modesData.default || "classic";
        } catch (err) {
            console.warn("Failed to load config, using defaults.", err);
            this._loadDefaults();
        }

        // Restore saved theme preference
        const savedTheme = Storage.get("theme", null);
        if (savedTheme && this.themes[savedTheme]) {
            this.currentTheme = savedTheme;
        }

        // Populate theme selector
        this._populateThemeSelect();
    },

    _loadDefaults() {
        this.themes = {
            classic: {
                name: "Classic",
                background: "#212837",
                boardBorder: "#2a3347",
                snakeHead: "#4CAF50",
                snakeBody: "#66BB6A",
                food: "#FF003D",
                obstacle: "#FF9800",
                gridLine: "rgba(255,255,255,0.03)",
                text: "#B8C6DC",
                accent: "#3457DC",
                uiBg: "#111118",
                hudBg: "#181c28",
                buttonBg: "#3457DC",
                buttonText: "#ffffff",
                overlay: "rgba(0,0,0,0.85)",
            },
        };
        this.modes = {
            classic: {
                name: "Classic",
                description: "Standard Snake.",
                wallCollision: true,
                wrapAround: false,
                obstacles: false,
                timeLimit: 0,
                speedScale: 1.0,
            },
        };
    },

    _populateThemeSelect() {
        const select = document.getElementById("theme-select");
        if (!select) return;
        select.innerHTML = "";
        for (const [key, theme] of Object.entries(this.themes)) {
            const opt = document.createElement("option");
            opt.value = key;
            opt.textContent = theme.name;
            if (key === this.currentTheme) opt.selected = true;
            select.appendChild(opt);
        }
    },

    getTheme() {
        return this.themes[this.currentTheme] || Object.values(this.themes)[0];
    },

    setTheme(key) {
        if (this.themes[key]) {
            this.currentTheme = key;
            Storage.set("theme", key);
        }
    },

    getMode(key) {
        return this.modes[key] || this.modes[this.defaultMode] || null;
    },
};

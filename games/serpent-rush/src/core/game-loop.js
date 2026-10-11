// src/core/game-loop.js — Main game loop with FPS control

import { Grid } from "./grid.js";
import { Snake } from "./snake.js";
import { Food } from "./food.js";
import { Collision } from "./collision.js";
import { UIRenderer } from "../ui/ui-renderer.js";
import { HUD } from "../ui/hud.js";
import { Menus } from "../ui/menus.js";
import { Controls } from "../ui/controls.js";
import { ScoreSystem } from "../systems/score-system.js";
import { SpeedSystem } from "../systems/speed-system.js";
import { Storage } from "../systems/storage.js";
import { Settings } from "../systems/settings.js";

export const GameLoop = {
    state: "menu", // menu | playing | paused | gameover
    mode: null,
    lastTick: 0,
    accumulator: 0,
    animFrameId: null,
    timeRemaining: 0,
    timerInterval: null,

    async init() {
        await Settings.load();

        // Expose Snake globally for controls (avoids circular imports)
        window.__serpentRush_Snake = Snake;

        const canvas = document.getElementById("game-canvas");
        Grid.init(canvas, Settings.gridCols, Settings.gridRows);

        UIRenderer.init(Grid);
        HUD.init();
        Controls.init(this);
        Menus.init(this);

        Storage.init();
        ScoreSystem.init();
        SpeedSystem.init(Settings.startSpeed, Settings.speedScale);

        UIRenderer.applyTheme(Settings.getTheme());

        Menus.showStart(Settings.modes);
        this.state = "menu";

        window.addEventListener("resize", () => {
            Grid.resize();
            if (this.state === "playing" || this.state === "paused") {
                this.render();
            }
        });
    },

    startGame(modeKey) {
        this.mode = Settings.getMode(modeKey);
        if (!this.mode) return;

        Grid.resize();
        Snake.init(Math.floor(Grid.cols / 2), Math.floor(Grid.rows / 2), 3);
        Food.clear();
        Collision.clearObstacles();
        ScoreSystem.reset();
        SpeedSystem.init(
            Settings.startSpeed,
            this.mode.speedScale || Settings.speedScale,
        );

        if (this.mode.obstacles) {
            Collision.generateObstacles(
                Settings.obstacleCount,
                Grid,
                Snake.getOccupied(),
            );
        }

        const occupied = [...Snake.getOccupied(), ...Collision.getObstacles()];
        Food.spawn(() => Grid.randomCell(occupied));

        HUD.update(
            ScoreSystem.score,
            ScoreSystem.highScore,
            this.mode.name,
            SpeedSystem.level,
        );

        if (this.mode.timeLimit > 0) {
            this.timeRemaining = this.mode.timeLimit;
            HUD.showTimer(this.timeRemaining);
            this.startTimer();
        } else {
            HUD.hideTimer();
        }

        Menus.hideAll();
        this.state = "playing";
        this.lastTick = performance.now();
        this.accumulator = 0;
        this.loop(performance.now());
    },

    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            if (this.state !== "playing") return;
            this.timeRemaining--;
            HUD.showTimer(this.timeRemaining);
            if (this.timeRemaining <= 0) {
                this.gameOver();
            }
        }, 1000);
    },

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    loop(timestamp) {
        if (this.state !== "playing") return;

        const interval = SpeedSystem.getInterval();
        this.accumulator += timestamp - this.lastTick;
        this.lastTick = timestamp;

        while (this.accumulator >= interval) {
            this.update();
            this.accumulator -= interval;
            if (this.state !== "playing") return;
        }

        this.render();
        this.animFrameId = requestAnimationFrame((t) => this.loop(t));
    },

    update() {
        const wrapFn = this.mode.wrapAround
            ? (x, y) => Grid.wrapCoords(x, y)
            : null;

        Snake.move(wrapFn);

        const collision = Collision.check(Snake, Grid, this.mode);
        if (collision) {
            this.gameOver();
            return;
        }

        const head = Snake.getHead();
        if (Food.isAt(head.x, head.y)) {
            Snake.grow();
            ScoreSystem.add(SpeedSystem.level);
            SpeedSystem.onScore(ScoreSystem.score);
            HUD.update(
                ScoreSystem.score,
                ScoreSystem.highScore,
                this.mode.name,
                SpeedSystem.level,
            );

            const occupied = [
                ...Snake.getOccupied(),
                ...Collision.getObstacles(),
            ];
            Food.spawn(() => Grid.randomCell(occupied));
        }
    },

    render() {
        Grid.clear();
        const theme = Settings.getTheme();
        UIRenderer.drawGrid(theme);
        UIRenderer.drawFood(Food.getPosition(), theme);
        UIRenderer.drawObstacles(Collision.getObstacles(), theme);
        UIRenderer.drawSnake(Snake.segments, theme);
    },

    pauseGame() {
        if (this.state !== "playing") return;
        this.state = "paused";
        cancelAnimationFrame(this.animFrameId);
        Menus.showPause();
    },

    resumeGame() {
        if (this.state !== "paused") return;
        Menus.hideAll();
        this.state = "playing";
        this.lastTick = performance.now();
        this.accumulator = 0;
        this.loop(performance.now());
    },

    gameOver() {
        this.state = "gameover";
        cancelAnimationFrame(this.animFrameId);
        this.stopTimer();
        ScoreSystem.saveHighScore();
        HUD.update(
            ScoreSystem.score,
            ScoreSystem.highScore,
            this.mode.name,
            SpeedSystem.level,
        );
        Menus.showGameOver(ScoreSystem.score, ScoreSystem.highScore);
    },

    resetGame() {
        cancelAnimationFrame(this.animFrameId);
        this.stopTimer();
        this.state = "menu";
        Menus.hideAll();
        Menus.showStart(Settings.modes);
        HUD.reset();
    },

    togglePause() {
        if (this.state === "playing") this.pauseGame();
        else if (this.state === "paused") this.resumeGame();
    },

    setTheme(themeKey) {
        Settings.setTheme(themeKey);
        UIRenderer.applyTheme(Settings.getTheme());
        if (this.state === "playing" || this.state === "paused") {
            this.render();
        }
    },
};

/**
 * GameEngine — Orchestrates game state: score, undo, win/lose, spawning.
 * Communicates exclusively via EventBus.
 */
import { Grid } from "./Grid.js";
import { resolve } from "./MoveResolver.js";
import { Storage } from "../utils/Storage.js";

const MAX_UNDO = 10;
const WIN_VAL = 2048;

export class GameEngine {
    constructor(bus, id = "player") {
        this.bus = bus;
        this.id = id; // "player" or "ai" (for race mode)
        this.grid = new Grid();
        this.score = 0;
        this.moveCount = 0;
        this.won = false;
        this.continued = false;
        this.gameOver = false;
        this.moving = false;
        this.undoStack = [];
    }

    init(savedState = null) {
        if (savedState) {
            this.grid = Grid.deserialize(savedState.grid);
            this.score = savedState.score;
            this.moveCount = savedState.moveCount;
            this.won = savedState.won;
            this.continued = savedState.continued;
            this.gameOver = savedState.gameOver;
            this.undoStack = (savedState.undoStack || []).map((s) => ({
                ...s,
                grid: s.grid, // kept as serialized string
            }));
            this.bus.emit("game:restored", this.snapshot());
            return;
        }
        this.grid = new Grid();
        this.score = 0;
        this.moveCount = 0;
        this.won = false;
        this.continued = false;
        this.gameOver = false;
        this.moving = false;
        this.undoStack = [];

        const t1 = this.grid.spawnRandom();
        const t2 = this.grid.spawnRandom();
        this.bus.emit("game:start", {
            id: this.id,
            grid: this.grid,
            spawns: [t1, t2],
            score: 0,
        });
    }

    restart() {
        this.init();
        this.autoSave();
    }

    /**
     * Execute a directional move. Returns true if the board changed.
     */
    move(dir) {
        if (this.moving || this.gameOver) return false;
        if (this.won && !this.continued) return false;

        const { newCells, points, moved, anims } = resolve(this.grid, dir);
        if (!moved) return false;

        this.moving = true;

        // Save undo state
        this.undoStack.push({
            grid: this.grid.serialize(),
            score: this.score,
            moveCount: this.moveCount,
        });
        if (this.undoStack.length > MAX_UNDO) this.undoStack.shift();

        // Apply
        this.grid = new Grid(newCells);
        this.score += points;
        this.moveCount++;

        this.bus.emit("move:resolved", {
            id: this.id,
            dir,
            points,
            anims,
            score: this.score,
            moveCount: this.moveCount,
        });

        // Update high score
        const best = Storage.get("best", 0);
        if (this.score > best) {
            Storage.set("best", this.score);
            this.bus.emit("best:update", this.score);
        }

        return true;
    }

    /**
     * Called by Renderer after animation completes.
     */
    postMove() {
        // Check win
        if (!this.won && !this.continued && this.grid.maxTile() >= WIN_VAL) {
            this.won = true;
            this.bus.emit("game:win", { id: this.id, score: this.score });
            this.moving = false;
            this.autoSave();
            return;
        }

        // Spawn
        const spawn = this.grid.spawnRandom();
        if (spawn) this.bus.emit("tile:spawn", { id: this.id, ...spawn });

        // Check game over
        if (!this.grid.canMove()) {
            this.gameOver = true;
            Storage.recordGame({
                score: this.score,
                won: this.won,
                moves: this.moveCount,
            });
            this.bus.emit("game:over", { id: this.id, score: this.score });
            Storage.remove("autosave_" + this.id);
        }

        this.moving = false;
        this.autoSave();
    }

    continuePlay() {
        this.continued = true;
        this.bus.emit("game:continued", { id: this.id });
    }

    undo() {
        if (!this.undoStack.length || this.moving) return;
        const prev = this.undoStack.pop();
        this.grid = Grid.deserialize(prev.grid);
        this.score = prev.score;
        this.moveCount = prev.moveCount;
        this.won = false;
        this.continued = false;
        this.gameOver = false;
        this.bus.emit("game:undo", this.snapshot());
        this.autoSave();
    }

    snapshot() {
        return {
            id: this.id,
            grid: this.grid,
            score: this.score,
            moveCount: this.moveCount,
            won: this.won,
            continued: this.continued,
            gameOver: this.gameOver,
        };
    }

    autoSave() {
        Storage.set("autosave_" + this.id, {
            grid: this.grid.serialize(),
            score: this.score,
            moveCount: this.moveCount,
            won: this.won,
            continued: this.continued,
            gameOver: this.gameOver,
            undoStack: this.undoStack,
        });
    }

    static loadSave(id = "player") {
        return Storage.get("autosave_" + id, null);
    }
}

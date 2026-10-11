/**
 * Expectimax — AI that plays 2048 using expectimax search.
 *
 * - Max nodes: choose best direction
 * - Chance nodes: average over all possible tile spawns (2 at 90%, 4 at 10%)
 * - Adaptive depth: deeper search when fewer empty cells
 */
import { Grid, SIZE } from "../game/Grid.js";
import { resolve, wouldMove, DIRS } from "../game/MoveResolver.js";
import { evaluate } from "./Heuristics.js";

export class Expectimax {
    constructor() {
        this.maxDepth = 3;
        this.nodesSearched = 0;
    }

    /**
     * Pick the best direction for the given grid.
     * Returns { dir, score } or null if no moves.
     */
    bestMove(grid) {
        this.nodesSearched = 0;

        // Adaptive depth based on empty cells
        const empty = grid.emptyCells().length;
        if (empty <= 3) this.maxDepth = 4;
        else if (empty <= 6) this.maxDepth = 3;
        else this.maxDepth = 2;

        let bestDir = null;
        let bestVal = -Infinity;

        for (const dir of DIRS) {
            if (!wouldMove(grid, dir)) continue;
            const { newCells, points } = resolve(grid, dir);
            const child = new Grid(newCells);
            const val = points + this._chanceNode(child, this.maxDepth - 1);
            if (val > bestVal) {
                bestVal = val;
                bestDir = dir;
            }
        }

        return bestDir ? { dir: bestDir, score: bestVal } : null;
    }

    _maxNode(grid, depth) {
        this.nodesSearched++;
        if (depth <= 0) return evaluate(grid);

        let bestVal = -Infinity;
        let anyMove = false;

        for (const dir of DIRS) {
            if (!wouldMove(grid, dir)) continue;
            anyMove = true;
            const { newCells, points } = resolve(grid, dir);
            const child = new Grid(newCells);
            const val = points + this._chanceNode(child, depth - 1);
            if (val > bestVal) bestVal = val;
        }

        return anyMove ? bestVal : evaluate(grid);
    }

    _chanceNode(grid, depth) {
        this.nodesSearched++;
        if (depth <= 0) return evaluate(grid);

        const empty = grid.emptyCells();
        if (empty.length === 0) return this._maxNode(grid, depth);

        // Sample all empty cells: weight 0.9 for tile=2, 0.1 for tile=4
        let total = 0;
        const prob = 1 / empty.length;

        for (const [r, c] of empty) {
            for (const [val, weight] of [
                [2, 0.9],
                [4, 0.1],
            ]) {
                const child = grid.clone();
                child.set(r, c, val);
                total += prob * weight * this._maxNode(child, depth - 1);
            }
        }

        return total;
    }
}

/**
 * AIController — Manages the AI play loop.
 */
export class AIController {
    constructor(bus, engine) {
        this.bus = bus;
        this.engine = engine;
        this.ai = new Expectimax();
        this.running = false;
        this.speed = 200; // ms per move
        this._timer = null;

        bus.on("ai:speed", (ms) => {
            this.speed = ms;
        });
    }

    start() {
        if (this.running) return;
        this.running = true;
        this._step();
    }

    stop() {
        this.running = false;
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }

    _step() {
        if (!this.running) return;
        if (this.engine.gameOver || this.engine.moving) {
            this._timer = setTimeout(() => this._step(), 50);
            return;
        }
        if (this.engine.won && !this.engine.continued) {
            this.engine.continuePlay();
        }

        const result = this.ai.bestMove(this.engine.grid);
        if (result) {
            this.engine.move(result.dir);
            this.bus.emit("ai:moved", {
                dir: result.dir,
                nodesSearched: this.ai.nodesSearched,
            });
        }

        this._timer = setTimeout(() => this._step(), this.speed);
    }
}

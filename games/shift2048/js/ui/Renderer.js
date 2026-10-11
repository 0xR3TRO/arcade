/**
 * Renderer — Manages tile DOM elements, animations, score display.
 * Listens to EventBus events and updates the visual state.
 */
import { SIZE } from "../game/Grid.js";

const GAP = 8;
const PAD = 8;
const ANIM_MS = 150;

export class Renderer {
    constructor(
        bus,
        containerId = "grid-wrap",
        tileLayerId = "tile-layer",
        opts = {},
    ) {
        this.bus = bus;
        this.$wrap = document.getElementById(containerId);
        this.$tiles = document.getElementById(tileLayerId);
        this.$score =
            "scoreId" in opts
                ? opts.scoreId
                    ? document.getElementById(opts.scoreId)
                    : null
                : document.getElementById("score");
        this.$best =
            "bestId" in opts
                ? opts.bestId
                    ? document.getElementById(opts.bestId)
                    : null
                : document.getElementById("best");
        this.tileMap = this._emptyMap();
        this.tileSeq = 0;
        this.active = true;

        this._bind();
        window.addEventListener("resize", () => this._resizeAll());
    }

    enable() {
        this.active = true;
    }
    disable() {
        this.active = false;
    }

    _emptyMap() {
        return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    }

    _cellSize() {
        return (this.$wrap.clientWidth - PAD * 2 - GAP * (SIZE - 1)) / SIZE;
    }

    _cellPos(r, c) {
        const cs = this._cellSize();
        return { top: PAD + r * (cs + GAP), left: PAD + c * (cs + GAP) };
    }

    _createTile(r, c, val, anim = "pop") {
        const el = document.createElement("div");
        el.className = anim ? `tile ${anim}` : "tile";
        el.dataset.val = val;
        el.textContent = val;
        const cs = this._cellSize();
        el.style.width = cs + "px";
        el.style.height = cs + "px";
        const pos = this._cellPos(r, c);
        el.style.top = pos.top + "px";
        el.style.left = pos.left + "px";
        el.id = "tile-" + ++this.tileSeq;
        this.$tiles.appendChild(el);
        return el;
    }

    _positionTile(el, r, c) {
        const pos = this._cellPos(r, c);
        el.style.top = pos.top + "px";
        el.style.left = pos.left + "px";
    }

    _updateTile(el, val) {
        el.dataset.val = val;
        el.textContent = val;
    }

    _resizeAll() {
        if (!this.active) return;
        const cs = this._cellSize();
        for (let r = 0; r < SIZE; r++)
            for (let c = 0; c < SIZE; c++) {
                const el = this.tileMap[r][c];
                if (!el) continue;
                el.style.width = cs + "px";
                el.style.height = cs + "px";
                this._positionTile(el, r, c);
            }
    }

    _bind() {
        this.bus.on("game:start", (data) => {
            if (this.active) this._onStart(data);
        });
        this.bus.on("game:restored", (data) => {
            if (this.active) this._onRestored(data);
        });
        this.bus.on("move:resolved", (data) => {
            if (this.active) this._onMoveResolved(data);
        });
        this.bus.on("tile:spawn", (data) => {
            if (this.active) this._onSpawn(data);
        });
        this.bus.on("best:update", (s) => {
            if (this.$best) this.$best.textContent = s;
        });
        this.bus.on("game:undo", (snap) => {
            if (this.active) this._onUndo(snap);
        });
    }

    _onStart({ grid, spawns, score }) {
        this.$tiles.innerHTML = "";
        this.tileMap = this._emptyMap();
        if (this.$score) this.$score.textContent = score;
        for (const spawn of spawns) {
            if (spawn)
                this.tileMap[spawn.r][spawn.c] = this._createTile(
                    spawn.r,
                    spawn.c,
                    spawn.val,
                    "pop",
                );
        }
    }

    _onRestored(snap) {
        this.$tiles.innerHTML = "";
        this.tileMap = this._emptyMap();
        if (this.$score) this.$score.textContent = snap.score;
        const g = snap.grid;
        for (let r = 0; r < SIZE; r++)
            for (let c = 0; c < SIZE; c++)
                if (g.get(r, c))
                    this.tileMap[r][c] = this._createTile(
                        r,
                        c,
                        g.get(r, c),
                        null,
                    );
    }

    _onMoveResolved({ id, anims, score }) {
        if (this.$score) this.$score.textContent = score;
        const toRemove = [];
        const merges = [];
        const surviving = [];

        for (const a of anims) {
            if (a.merged) {
                merges.push(a);
                continue;
            }
            const el = this.tileMap[a.fromR]?.[a.fromC];
            if (!el) continue;
            this._positionTile(el, a.toR, a.toC);

            const willMerge = anims.some(
                (m) => m.merged && m.toR === a.toR && m.toC === a.toC,
            );
            if (willMerge) {
                toRemove.push(el);
            } else {
                surviving.push({ el, r: a.toR, c: a.toC, val: a.val });
            }
        }

        setTimeout(() => {
            for (const el of toRemove) el.remove();

            const freshMap = this._emptyMap();
            for (const { el, r, c, val } of surviving) {
                freshMap[r][c] = el;
                this._updateTile(el, val);
            }

            for (const m of merges) {
                const el = this._createTile(m.toR, m.toC, m.val, null);
                void el.offsetWidth;
                el.classList.add("merge-pop");
                freshMap[m.toR][m.toC] = el;
                this._showScoreFloat(m.toR, m.toC, m.val);
            }

            this.tileMap = freshMap;
            this.bus.emit("render:done", { id });
        }, ANIM_MS + 10);
    }

    _onSpawn({ r, c, val }) {
        this.tileMap[r][c] = this._createTile(r, c, val, "pop");
    }

    _onUndo(snap) {
        this.$tiles.innerHTML = "";
        this.tileMap = this._emptyMap();
        if (this.$score) this.$score.textContent = snap.score;
        const g = snap.grid;
        for (let r = 0; r < SIZE; r++)
            for (let c = 0; c < SIZE; c++)
                if (g.get(r, c))
                    this.tileMap[r][c] = this._createTile(
                        r,
                        c,
                        g.get(r, c),
                        null,
                    );
    }

    _showScoreFloat(r, c, val) {
        const pos = this._cellPos(r, c);
        const cs = this._cellSize();
        const el = document.createElement("div");
        el.className = "score-float";
        el.textContent = "+" + val;
        el.style.top = pos.top + "px";
        el.style.left = pos.left + cs / 2 + "px";
        this.$tiles.appendChild(el);
        setTimeout(() => el.remove(), 700);
    }
}

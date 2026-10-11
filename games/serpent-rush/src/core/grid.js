// src/core/grid.js — Grid definition, sizing, coordinate utilities

export const Grid = {
    cols: 20,
    rows: 20,
    cellSize: 0,
    canvas: null,
    ctx: null,

    init(canvas, cols, rows) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.cols = cols || this.cols;
        this.rows = rows || this.rows;
        this.resize();
    },

    resize() {
        const parent = this.canvas.parentElement;
        const size = Math.min(parent.clientWidth, parent.clientHeight);
        this.canvas.width = size;
        this.canvas.height = size;
        this.cellSize = size / Math.max(this.cols, this.rows);
    },

    toPixel(gridX, gridY) {
        return {
            x: gridX * this.cellSize,
            y: gridY * this.cellSize,
        };
    },

    isInBounds(x, y) {
        return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
    },

    wrapCoords(x, y) {
        return {
            x: ((x % this.cols) + this.cols) % this.cols,
            y: ((y % this.rows) + this.rows) % this.rows,
        };
    },

    randomCell(occupied) {
        const free = [];
        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                if (!occupied.some((p) => p.x === x && p.y === y)) {
                    free.push({ x, y });
                }
            }
        }
        return free.length > 0
            ? free[Math.floor(Math.random() * free.length)]
            : null;
    },

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
};

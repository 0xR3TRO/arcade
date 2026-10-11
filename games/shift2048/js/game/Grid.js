/**
 * Grid — Represents a SIZE×SIZE board of tile values.
 * Value 0 = empty cell. Purely data — no DOM.
 */
export const SIZE = 4;

export class Grid {
    constructor(cells = null) {
        this.cells = cells || Grid.empty();
    }

    static empty() {
        return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    }

    get(r, c) {
        return this.cells[r][c];
    }
    set(r, c, v) {
        this.cells[r][c] = v;
    }

    clone() {
        return new Grid(this.cells.map((row) => [...row]));
    }

    emptyCells() {
        const list = [];
        for (let r = 0; r < SIZE; r++)
            for (let c = 0; c < SIZE; c++)
                if (this.cells[r][c] === 0) list.push([r, c]);
        return list;
    }

    maxTile() {
        let max = 0;
        for (let r = 0; r < SIZE; r++)
            for (let c = 0; c < SIZE; c++)
                if (this.cells[r][c] > max) max = this.cells[r][c];
        return max;
    }

    /**
     * Place a random tile (90% → 2, 10% → 4). Returns {r, c, val} or null.
     */
    spawnRandom() {
        const empty = this.emptyCells();
        if (!empty.length) return null;
        const [r, c] = empty[Math.floor(Math.random() * empty.length)];
        const val = Math.random() < 0.9 ? 2 : 4;
        this.cells[r][c] = val;
        return { r, c, val };
    }

    /**
     * Place a specific tile (used for synchronized Race mode).
     */
    spawnAt(r, c, val) {
        this.cells[r][c] = val;
    }

    serialize() {
        return JSON.stringify(this.cells);
    }

    static deserialize(json) {
        return new Grid(JSON.parse(json));
    }

    /**
     * Check if any move is possible.
     */
    canMove() {
        for (let r = 0; r < SIZE; r++)
            for (let c = 0; c < SIZE; c++) {
                if (this.cells[r][c] === 0) return true;
                if (c + 1 < SIZE && this.cells[r][c] === this.cells[r][c + 1])
                    return true;
                if (r + 1 < SIZE && this.cells[r][c] === this.cells[r + 1][c])
                    return true;
            }
        return false;
    }
}

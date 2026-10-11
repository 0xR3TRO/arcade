/**
 * MoveResolver — Pure function that computes the result of a move.
 * No side effects, no DOM, no state mutation. Used by both GameEngine and AI.
 */
import { SIZE } from "./Grid.js";

const DIRS = ["left", "right", "up", "down"];

/**
 * Slide a single row toward index 0: compress, merge, compress.
 * Returns { result: number[], pts: number }
 */
function slideRow(row) {
    let pts = 0;
    const filtered = row.filter((v) => v !== 0);
    const merged = [];
    let skip = false;

    for (let i = 0; i < filtered.length; i++) {
        if (skip) {
            skip = false;
            continue;
        }
        if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
            merged.push(filtered[i] * 2);
            pts += filtered[i] * 2;
            skip = true;
        } else {
            merged.push(filtered[i]);
        }
    }
    while (merged.length < SIZE) merged.push(0);
    return { result: merged, pts };
}

/**
 * Extract logical rows for a given direction.
 * Each row: { cells: [[r,c],...], vals: [v,...] }
 * Cells ordered so index 0 = target edge.
 */
function getRows(grid, dir) {
    const rows = [];
    const g = grid.cells;

    if (dir === "left") {
        for (let r = 0; r < SIZE; r++) {
            const cells = [],
                vals = [];
            for (let c = 0; c < SIZE; c++) {
                cells.push([r, c]);
                vals.push(g[r][c]);
            }
            rows.push({ cells, vals });
        }
    } else if (dir === "right") {
        for (let r = 0; r < SIZE; r++) {
            const cells = [],
                vals = [];
            for (let c = SIZE - 1; c >= 0; c--) {
                cells.push([r, c]);
                vals.push(g[r][c]);
            }
            rows.push({ cells, vals });
        }
    } else if (dir === "up") {
        for (let c = 0; c < SIZE; c++) {
            const cells = [],
                vals = [];
            for (let r = 0; r < SIZE; r++) {
                cells.push([r, c]);
                vals.push(g[r][c]);
            }
            rows.push({ cells, vals });
        }
    } else {
        for (let c = 0; c < SIZE; c++) {
            const cells = [],
                vals = [];
            for (let r = SIZE - 1; r >= 0; r--) {
                cells.push([r, c]);
                vals.push(g[r][c]);
            }
            rows.push({ cells, vals });
        }
    }
    return rows;
}

/**
 * Resolve a move on a Grid (non-mutating).
 *
 * Returns {
 *   newGrid: Grid-like cells[][],
 *   points: number,
 *   moved: boolean,
 *   anims: { fromR, fromC, toR, toC, val, merged }[]
 * }
 */
export function resolve(grid, dir) {
    const rows = getRows(grid, dir);
    let totalPts = 0;
    let moved = false;
    const newCells = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    const anims = [];

    for (const { cells, vals } of rows) {
        const { result, pts } = slideRow(vals);
        totalPts += pts;

        const origIdx = [];
        for (let i = 0; i < SIZE; i++) if (vals[i] !== 0) origIdx.push(i);

        let oi = 0;
        for (let ni = 0; ni < SIZE; ni++) {
            if (result[ni] === 0) continue;
            const [toR, toC] = cells[ni];
            newCells[toR][toC] = result[ni];

            const fi = origIdx[oi];
            const [fR, fC] = cells[fi];

            if (vals[fi] === result[ni]) {
                anims.push({
                    fromR: fR,
                    fromC: fC,
                    toR,
                    toC,
                    val: result[ni],
                    merged: false,
                });
                if (fR !== toR || fC !== toC) moved = true;
                oi++;
            } else {
                const fi2 = origIdx[oi + 1];
                const [fR2, fC2] = cells[fi2];
                anims.push({
                    fromR: fR,
                    fromC: fC,
                    toR,
                    toC,
                    val: vals[fi],
                    merged: false,
                });
                anims.push({
                    fromR: fR2,
                    fromC: fC2,
                    toR,
                    toC,
                    val: vals[fi2],
                    merged: false,
                });
                anims.push({
                    fromR: toR,
                    fromC: toC,
                    toR,
                    toC,
                    val: result[ni],
                    merged: true,
                });
                moved = true;
                oi += 2;
            }
        }
    }

    return { newCells, points: totalPts, moved, anims };
}

/**
 * Quick check: would a move in `dir` change anything? (For AI pruning.)
 */
export function wouldMove(grid, dir) {
    const rows = getRows(grid, dir);
    for (const { vals } of rows) {
        const { result } = slideRow(vals);
        for (let i = 0; i < SIZE; i++) if (result[i] !== vals[i]) return true;
    }
    return false;
}

export { DIRS };

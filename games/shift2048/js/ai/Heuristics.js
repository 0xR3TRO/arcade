/**
 * Heuristics — Board evaluation functions for AI.
 *
 * Combined score considers:
 *   - Empty cells (more = better)
 *   - Monotonicity (rows/cols should be sorted)
 *   - Smoothness (adjacent tiles should be similar)
 *   - Max tile in corner bonus
 *   - Merge potential
 */
import { SIZE } from "../game/Grid.js";

const CORNER_WEIGHT = [
    [6, 5, 4, 3],
    [5, 4, 3, 2],
    [4, 3, 2, 1],
    [3, 2, 1, 0],
];

// Snake-path weighting — encourages keeping high values in a specific path
const SNAKE = [
    [15, 14, 13, 12],
    [8, 9, 10, 11],
    [7, 6, 5, 4],
    [0, 1, 2, 3],
];

/**
 * Evaluate a Grid. Higher = better position.
 */
export function evaluate(grid) {
    const g = grid.cells;
    let empty = 0;
    let mono = 0;
    let smooth = 0;
    let snake = 0;
    let maxVal = 0;

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const v = g[r][c];
            if (v === 0) {
                empty++;
                continue;
            }
            if (v > maxVal) maxVal = v;

            const logV = Math.log2(v);
            snake += logV * SNAKE[r][c];

            // Smoothness: penalize difference with neighbors
            if (c + 1 < SIZE && g[r][c + 1] !== 0) {
                smooth -= Math.abs(logV - Math.log2(g[r][c + 1]));
            }
            if (r + 1 < SIZE && g[r + 1][c] !== 0) {
                smooth -= Math.abs(logV - Math.log2(g[r + 1][c]));
            }
        }
    }

    // Monotonicity per row/col
    for (let r = 0; r < SIZE; r++) {
        let incR = 0,
            decR = 0;
        for (let c = 1; c < SIZE; c++) {
            if (g[r][c] > g[r][c - 1])
                incR +=
                    Math.log2(g[r][c]) -
                    (g[r][c - 1] ? Math.log2(g[r][c - 1]) : 0);
            else if (g[r][c] < g[r][c - 1])
                decR +=
                    (g[r][c - 1] ? Math.log2(g[r][c - 1]) : 0) -
                    Math.log2(g[r][c]);
        }
        mono += Math.max(incR, decR);
    }
    for (let c = 0; c < SIZE; c++) {
        let incC = 0,
            decC = 0;
        for (let r = 1; r < SIZE; r++) {
            if (g[r][c] > g[r - 1][c])
                incC +=
                    Math.log2(g[r][c]) -
                    (g[r - 1][c] ? Math.log2(g[r - 1][c]) : 0);
            else if (g[r][c] < g[r - 1][c])
                decC +=
                    (g[r - 1][c] ? Math.log2(g[r - 1][c]) : 0) -
                    Math.log2(g[r][c]);
        }
        mono += Math.max(incC, decC);
    }

    // Corner bonus: max tile in top-left corner
    const cornerBonus = g[0][0] === maxVal ? Math.log2(maxVal) * 10 : 0;

    return empty * 2.7 + smooth * 0.1 + mono * 1.0 + snake * 0.5 + cornerBonus;
}

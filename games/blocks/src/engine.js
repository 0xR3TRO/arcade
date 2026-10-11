"use strict";

/**
 * R3TRO Blocks Game Engine
 * Implements modern guideline-style mechanics (SRS, 7-bag)
 * @module engine
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Board dimensions */
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BOARD_HIDDEN_ROWS = 2;
const TOTAL_HEIGHT = BOARD_HEIGHT + BOARD_HIDDEN_ROWS;

/** Tetromino types */
const PIECE_TYPES = ["I", "O", "T", "S", "Z", "J", "L"];

/** Standard piece colors */
const PIECE_COLORS = {
    I: "#00f0f0",
    O: "#f0f000",
    T: "#a000f0",
    S: "#00f000",
    Z: "#f00000",
    J: "#0000f0",
    L: "#f0a000",
};

/**
 * Tetromino shapes - each rotation state stored as offsets from center
 * Using SRS rotation system coordinates
 */
const TETROMINO_SHAPES = {
    I: [
        [
            [0, 1],
            [1, 1],
            [2, 1],
            [3, 1],
        ], // 0° - horizontal
        [
            [2, 0],
            [2, 1],
            [2, 2],
            [2, 3],
        ], // 90°
        [
            [0, 2],
            [1, 2],
            [2, 2],
            [3, 2],
        ], // 180°
        [
            [1, 0],
            [1, 1],
            [1, 2],
            [1, 3],
        ], // 270°
    ],
    O: [
        [
            [1, 0],
            [2, 0],
            [1, 1],
            [2, 1],
        ], // O doesn't rotate
        [
            [1, 0],
            [2, 0],
            [1, 1],
            [2, 1],
        ],
        [
            [1, 0],
            [2, 0],
            [1, 1],
            [2, 1],
        ],
        [
            [1, 0],
            [2, 0],
            [1, 1],
            [2, 1],
        ],
    ],
    T: [
        [
            [1, 0],
            [0, 1],
            [1, 1],
            [2, 1],
        ], // 0°
        [
            [1, 0],
            [1, 1],
            [2, 1],
            [1, 2],
        ], // 90°
        [
            [0, 1],
            [1, 1],
            [2, 1],
            [1, 2],
        ], // 180°
        [
            [1, 0],
            [0, 1],
            [1, 1],
            [1, 2],
        ], // 270°
    ],
    S: [
        [
            [1, 0],
            [2, 0],
            [0, 1],
            [1, 1],
        ], // 0°
        [
            [1, 0],
            [1, 1],
            [2, 1],
            [2, 2],
        ], // 90°
        [
            [1, 1],
            [2, 1],
            [0, 2],
            [1, 2],
        ], // 180°
        [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 2],
        ], // 270°
    ],
    Z: [
        [
            [0, 0],
            [1, 0],
            [1, 1],
            [2, 1],
        ], // 0°
        [
            [2, 0],
            [1, 1],
            [2, 1],
            [1, 2],
        ], // 90°
        [
            [0, 1],
            [1, 1],
            [1, 2],
            [2, 2],
        ], // 180°
        [
            [1, 0],
            [0, 1],
            [1, 1],
            [0, 2],
        ], // 270°
    ],
    J: [
        [
            [0, 0],
            [0, 1],
            [1, 1],
            [2, 1],
        ], // 0°
        [
            [1, 0],
            [2, 0],
            [1, 1],
            [1, 2],
        ], // 90°
        [
            [0, 1],
            [1, 1],
            [2, 1],
            [2, 2],
        ], // 180°
        [
            [1, 0],
            [1, 1],
            [0, 2],
            [1, 2],
        ], // 270°
    ],
    L: [
        [
            [2, 0],
            [0, 1],
            [1, 1],
            [2, 1],
        ], // 0°
        [
            [1, 0],
            [1, 1],
            [1, 2],
            [2, 2],
        ], // 90°
        [
            [0, 1],
            [1, 1],
            [2, 1],
            [0, 2],
        ], // 180°
        [
            [0, 0],
            [1, 0],
            [1, 1],
            [1, 2],
        ], // 270°
    ],
};

/**
 * SRS Wall Kick data
 * Format: [dx, dy] offsets to try when rotation would collide
 */
const WALL_KICKS = {
    JLSTZ: {
        "0->1": [
            [0, 0],
            [-1, 0],
            [-1, 1],
            [0, -2],
            [-1, -2],
        ],
        "1->2": [
            [0, 0],
            [1, 0],
            [1, -1],
            [0, 2],
            [1, 2],
        ],
        "2->3": [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, -2],
            [1, -2],
        ],
        "3->0": [
            [0, 0],
            [-1, 0],
            [-1, -1],
            [0, 2],
            [-1, 2],
        ],
        "1->0": [
            [0, 0],
            [1, 0],
            [1, -1],
            [0, 2],
            [1, 2],
        ],
        "2->1": [
            [0, 0],
            [-1, 0],
            [-1, 1],
            [0, -2],
            [-1, -2],
        ],
        "3->2": [
            [0, 0],
            [-1, 0],
            [-1, -1],
            [0, 2],
            [-1, 2],
        ],
        "0->3": [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, -2],
            [1, -2],
        ],
    },
    I: {
        "0->1": [
            [0, 0],
            [-2, 0],
            [1, 0],
            [-2, -1],
            [1, 2],
        ],
        "1->2": [
            [0, 0],
            [-1, 0],
            [2, 0],
            [-1, 2],
            [2, -1],
        ],
        "2->3": [
            [0, 0],
            [2, 0],
            [-1, 0],
            [2, 1],
            [-1, -2],
        ],
        "3->0": [
            [0, 0],
            [1, 0],
            [-2, 0],
            [1, -2],
            [-2, 1],
        ],
        "1->0": [
            [0, 0],
            [2, 0],
            [-1, 0],
            [2, 1],
            [-1, -2],
        ],
        "2->1": [
            [0, 0],
            [1, 0],
            [-2, 0],
            [1, -2],
            [-2, 1],
        ],
        "3->2": [
            [0, 0],
            [-2, 0],
            [1, 0],
            [-2, -1],
            [1, 2],
        ],
        "0->3": [
            [0, 0],
            [-1, 0],
            [2, 0],
            [-1, 2],
            [2, -1],
        ],
    },
};

/** Lock delay configuration */
const LOCK_DELAY = 500; // ms before piece locks
const MAX_LOCK_RESETS = 15; // maximum lock delay resets

/** Scoring table (guideline-style) */
const SCORING = {
    SINGLE: 100,
    DOUBLE: 300,
    TRIPLE: 500,
    QUAD: 800,
    TSPIN_MINI: 100,
    TSPIN_SINGLE: 800,
    TSPIN_DOUBLE: 1200,
    TSPIN_TRIPLE: 1600,
    SOFT_DROP: 1,
    HARD_DROP: 2,
    BACK_TO_BACK_MULTIPLIER: 1.5,
    PERFECT_CLEAR_SINGLE: 800,
    PERFECT_CLEAR_DOUBLE: 1200,
    PERFECT_CLEAR_TRIPLE: 1800,
    PERFECT_CLEAR_QUAD: 2000,
};

// ============================================================================
// EVENT EMITTER
// ============================================================================

/**
 * Simple event emitter for game events
 * @class EventEmitter
 */
class EventEmitter {
    #listeners = new Map();

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.#listeners.has(event)) {
            this.#listeners.set(event, new Set());
        }
        this.#listeners.get(event).add(callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (this.#listeners.has(event)) {
            this.#listeners.get(event).delete(callback);
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (this.#listeners.has(event)) {
            this.#listeners.get(event).forEach((cb) => cb(data));
        }
    }
}

// ============================================================================
// BAG RANDOMIZER (7-bag system)
// ============================================================================

/**
 * 7-bag randomizer - guarantees all 7 pieces appear exactly once per bag
 * @class BagRandomizer
 */
class BagRandomizer {
    #bag = [];
    #preview = [];

    constructor() {
        this.#fillBag();
        this.#fillBag(); // Fill twice for preview
    }

    /**
     * Fill the bag with a shuffled set of all 7 pieces
     */
    #fillBag() {
        const pieces = [...PIECE_TYPES];
        // Fisher-Yates shuffle
        for (let i = pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
        }
        this.#preview.push(...pieces);
    }

    /**
     * Get the next piece from the bag
     * @returns {string} Piece type
     */
    next() {
        if (this.#preview.length <= 7) {
            this.#fillBag();
        }
        return this.#preview.shift();
    }

    /**
     * Preview upcoming pieces
     * @param {number} count - Number of pieces to preview
     * @returns {string[]} Array of piece types
     */
    preview(count = 5) {
        while (this.#preview.length < count) {
            this.#fillBag();
        }
        return this.#preview.slice(0, count);
    }

    /**
     * Reset the randomizer
     */
    reset() {
        this.#bag = [];
        this.#preview = [];
        this.#fillBag();
        this.#fillBag();
    }
}

// ============================================================================
// TETROMINO
// ============================================================================

/**
 * Represents a single tetromino piece
 * @class Tetromino
 */
class Tetromino {
    /**
     * @param {string} type - Piece type (I, O, T, S, Z, J, L)
     */
    constructor(type) {
        this.type = type;
        this.rotation = 0;
        this.x = 3; // Spawn position
        this.y = 0; // Spawn at top (in hidden rows)
        this.color = PIECE_COLORS[type];
    }

    /**
     * Get the current shape cells
     * @returns {number[][]} Array of [x, y] offsets
     */
    getCells() {
        return TETROMINO_SHAPES[this.type][this.rotation];
    }

    /**
     * Get cells at a specific rotation
     * @param {number} rotation - Rotation state (0-3)
     * @returns {number[][]} Array of [x, y] offsets
     */
    getCellsAtRotation(rotation) {
        return TETROMINO_SHAPES[this.type][rotation];
    }

    /**
     * Get absolute board positions of cells
     * @returns {number[][]} Array of [x, y] board coordinates
     */
    getAbsoluteCells() {
        return this.getCells().map(([cx, cy]) => [this.x + cx, this.y + cy]);
    }

    /**
     * Clone this tetromino
     * @returns {Tetromino} Cloned piece
     */
    clone() {
        const piece = new Tetromino(this.type);
        piece.rotation = this.rotation;
        piece.x = this.x;
        piece.y = this.y;
        return piece;
    }
}

// ============================================================================
// BOARD
// ============================================================================

/**
 * Represents the game board (10×22 grid with 2 hidden rows)
 * @class Board
 */
class Board {
    #grid;
    #width;
    #height;

    /**
     * @param {number} width - Board width
     * @param {number} height - Total board height (including hidden rows)
     */
    constructor(width = BOARD_WIDTH, height = TOTAL_HEIGHT) {
        this.#width = width;
        this.#height = height;
        this.#grid = this.#createEmptyGrid();
    }

    get width() {
        return this.#width;
    }
    get height() {
        return this.#height;
    }
    get visibleHeight() {
        return BOARD_HEIGHT;
    }
    get grid() {
        return this.#grid;
    }

    /**
     * Create an empty grid
     * @returns {(string|null)[][]} Empty grid
     */
    #createEmptyGrid() {
        return Array.from({ length: this.#height }, () =>
            Array(this.#width).fill(null),
        );
    }

    /**
     * Check if a cell is within bounds
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if in bounds
     */
    isInBounds(x, y) {
        return x >= 0 && x < this.#width && y >= 0 && y < this.#height;
    }

    /**
     * Check if a cell is occupied
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if occupied or out of bounds
     */
    isOccupied(x, y) {
        if (!this.isInBounds(x, y)) return true;
        return this.#grid[y][x] !== null;
    }

    /**
     * Check if a piece would collide at given position
     * @param {Tetromino} piece - The piece to check
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} [rotation] - Rotation state (defaults to piece's current)
     * @returns {boolean} True if collision
     */
    hasCollision(piece, x, y, rotation = piece.rotation) {
        const cells = piece.getCellsAtRotation(rotation);
        for (const [cx, cy] of cells) {
            const boardX = x + cx;
            const boardY = y + cy;

            // Allow above top of board during spawn
            if (boardY < 0) continue;

            if (boardX < 0 || boardX >= this.#width || boardY >= this.#height) {
                return true;
            }
            if (this.#grid[boardY][boardX] !== null) {
                return true;
            }
        }
        return false;
    }

    /**
     * Lock a piece onto the board
     * @param {Tetromino} piece - The piece to lock
     */
    lockPiece(piece) {
        const cells = piece.getAbsoluteCells();
        for (const [x, y] of cells) {
            if (y >= 0 && y < this.#height && x >= 0 && x < this.#width) {
                this.#grid[y][x] = piece.type;
            }
        }
    }

    /**
     * Clear completed lines and return count
     * @returns {{count: number, rows: number[]}} Number of lines cleared and their indices
     */
    clearLines() {
        const clearedRows = [];

        for (let y = this.#height - 1; y >= 0; y--) {
            if (this.#grid[y].every((cell) => cell !== null)) {
                clearedRows.push(y);
            }
        }

        // Remove cleared rows and add empty rows at top
        for (const row of clearedRows.sort((a, b) => a - b)) {
            this.#grid.splice(row, 1);
            this.#grid.unshift(Array(this.#width).fill(null));
        }

        return { count: clearedRows.length, rows: clearedRows };
    }

    /**
     * Check if board is empty (perfect clear)
     * @returns {boolean} True if empty
     */
    isEmpty() {
        return this.#grid.every((row) => row.every((cell) => cell === null));
    }

    /**
     * Get cell value at position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {string|null} Piece type or null
     */
    getCell(x, y) {
        if (!this.isInBounds(x, y)) return null;
        return this.#grid[y][x];
    }

    /**
     * Reset the board
     */
    reset() {
        this.#grid = this.#createEmptyGrid();
    }
}

// ============================================================================
// GAME ENGINE
// ============================================================================

/**
 * Main game engine - handles all game logic
 * @class GameEngine
 */
class GameEngine extends EventEmitter {
    #board;
    #currentPiece;
    #holdPiece;
    #canHold;
    #randomizer;
    #score;
    #level;
    #lines;
    #combo;
    #backToBack;
    #lastWasTSpin;
    #lastWasRotation;
    #lastKickIndex;
    #lockTimer;
    #lockResets;
    #isLocking;
    #gameOver;
    #paused;
    #mode;
    #timeElapsed;
    #piecesPlaced;
    #tSpins;

    constructor() {
        super();
        this.#board = new Board();
        this.#randomizer = new BagRandomizer();
        this.reset();
    }

    // Getters for game state
    get board() {
        return this.#board;
    }
    get currentPiece() {
        return this.#currentPiece;
    }
    get holdPiece() {
        return this.#holdPiece;
    }
    get canHold() {
        return this.#canHold;
    }
    get score() {
        return this.#score;
    }
    get level() {
        return this.#level;
    }
    get lines() {
        return this.#lines;
    }
    get combo() {
        return this.#combo;
    }
    get gameOver() {
        return this.#gameOver;
    }
    get paused() {
        return this.#paused;
    }
    get mode() {
        return this.#mode;
    }
    get timeElapsed() {
        return this.#timeElapsed;
    }
    get piecesPlaced() {
        return this.#piecesPlaced;
    }
    get tSpins() {
        return this.#tSpins;
    }

    /**
     * Get next pieces preview
     * @param {number} count - Number of pieces
     * @returns {string[]} Array of piece types
     */
    getNextPieces(count = 5) {
        return this.#randomizer.preview(count);
    }

    /**
     * Get gravity speed in ms per cell
     * @returns {number} Milliseconds per cell drop
     */
    getGravity() {
        // Guideline-style formula
        const seconds = Math.pow(
            0.8 - (this.#level - 1) * 0.007,
            this.#level - 1,
        );
        return Math.max(seconds * 1000, 16.67); // Cap at ~60fps
    }

    /**
     * Reset the game
     * @param {string} mode - Game mode (marathon, sprint, ultra)
     */
    reset(mode = "marathon") {
        this.#board.reset();
        this.#randomizer.reset();
        this.#currentPiece = null;
        this.#holdPiece = null;
        this.#canHold = true;
        this.#score = 0;
        this.#level = 1;
        this.#lines = 0;
        this.#combo = -1;
        this.#backToBack = false;
        this.#lastWasTSpin = false;
        this.#lastWasRotation = false;
        this.#lastKickIndex = 0;
        this.#lockTimer = 0;
        this.#lockResets = 0;
        this.#isLocking = false;
        this.#gameOver = false;
        this.#paused = false;
        this.#mode = mode;
        this.#timeElapsed = 0;
        this.#piecesPlaced = 0;
        this.#tSpins = 0;

        this.#spawnPiece();
        this.emit("reset", { mode });
    }

    /**
     * Spawn a new piece
     */
    #spawnPiece() {
        const type = this.#randomizer.next();
        this.#currentPiece = new Tetromino(type);
        this.#lastWasTSpin = false;
        this.#lastWasRotation = false;
        this.#lastKickIndex = 0;
        this.#lockTimer = 0;
        this.#lockResets = 0;
        this.#isLocking = false;
        this.#canHold = true;

        // Check for game over (spawn blocked)
        if (
            this.#board.hasCollision(
                this.#currentPiece,
                this.#currentPiece.x,
                this.#currentPiece.y,
            )
        ) {
            this.#gameOver = true;
            this.emit("gameOver", {
                score: this.#score,
                level: this.#level,
                lines: this.#lines,
                time: this.#timeElapsed,
            });
        } else {
            this.emit("pieceSpawn", { type });
        }
    }

    /**
     * Move piece horizontally
     * @param {number} direction - -1 for left, 1 for right
     * @returns {boolean} True if move was successful
     */
    movePiece(direction) {
        if (this.#gameOver || this.#paused || !this.#currentPiece) return false;

        const newX = this.#currentPiece.x + direction;
        if (
            !this.#board.hasCollision(
                this.#currentPiece,
                newX,
                this.#currentPiece.y,
            )
        ) {
            this.#currentPiece.x = newX;
            this.#lastWasRotation = false;

            // Reset lock delay if touching ground
            if (this.#isLocking && this.#lockResets < MAX_LOCK_RESETS) {
                this.#lockTimer = 0;
                this.#lockResets++;
            }

            this.emit("pieceMove", { direction });
            return true;
        }
        return false;
    }

    /**
     * Rotate piece
     * @param {number} direction - 1 for CW, -1 for CCW
     * @returns {boolean} True if rotation was successful
     */
    rotatePiece(direction) {
        if (this.#gameOver || this.#paused || !this.#currentPiece) return false;
        if (this.#currentPiece.type === "O") return false; // O doesn't rotate

        const currentRotation = this.#currentPiece.rotation;
        const newRotation = (currentRotation + direction + 4) % 4;
        const kickKey = `${currentRotation}->${newRotation}`;

        // Get appropriate wall kick table
        const kickTable =
            this.#currentPiece.type === "I"
                ? WALL_KICKS.I[kickKey]
                : WALL_KICKS.JLSTZ[kickKey];

        if (!kickTable) return false;

        // Try each wall kick offset
        for (let i = 0; i < kickTable.length; i++) {
            const [dx, dy] = kickTable[i];
            const newX = this.#currentPiece.x + dx;
            const newY = this.#currentPiece.y - dy; // Note: dy is inverted (positive = up in SRS)

            if (
                !this.#board.hasCollision(
                    this.#currentPiece,
                    newX,
                    newY,
                    newRotation,
                )
            ) {
                this.#currentPiece.x = newX;
                this.#currentPiece.y = newY;
                this.#currentPiece.rotation = newRotation;
                this.#lastWasRotation = true;
                this.#lastKickIndex = i;

                // Reset lock delay if touching ground
                if (this.#isLocking && this.#lockResets < MAX_LOCK_RESETS) {
                    this.#lockTimer = 0;
                    this.#lockResets++;
                }

                this.emit("pieceRotate", { direction });
                return true;
            }
        }

        return false;
    }

    /**
     * Soft drop - move piece down one cell
     * @returns {boolean} True if drop was successful
     */
    softDrop() {
        if (this.#gameOver || this.#paused || !this.#currentPiece) return false;

        const newY = this.#currentPiece.y + 1;
        if (
            !this.#board.hasCollision(
                this.#currentPiece,
                this.#currentPiece.x,
                newY,
            )
        ) {
            this.#currentPiece.y = newY;
            this.#score += SCORING.SOFT_DROP;
            this.#lastWasRotation = false;
            this.emit("softDrop");
            return true;
        }
        return false;
    }

    /**
     * Hard drop - instantly drop piece to bottom
     * @returns {number} Number of cells dropped
     */
    hardDrop() {
        if (this.#gameOver || this.#paused || !this.#currentPiece) return 0;

        let cellsDropped = 0;
        while (
            !this.#board.hasCollision(
                this.#currentPiece,
                this.#currentPiece.x,
                this.#currentPiece.y + 1,
            )
        ) {
            this.#currentPiece.y++;
            cellsDropped++;
        }

        this.#score += cellsDropped * SCORING.HARD_DROP;
        this.emit("hardDrop", { cells: cellsDropped });

        // Lock immediately
        this.#lockPiece();

        return cellsDropped;
    }

    /**
     * Hold current piece
     * @returns {boolean} True if hold was successful
     */
    hold() {
        if (
            this.#gameOver ||
            this.#paused ||
            !this.#currentPiece ||
            !this.#canHold
        )
            return false;

        const currentType = this.#currentPiece.type;

        if (this.#holdPiece) {
            // Swap with held piece
            this.#currentPiece = new Tetromino(this.#holdPiece);
        } else {
            // No held piece - spawn new one
            this.#spawnPiece();
        }

        this.#holdPiece = currentType;
        this.#canHold = false;
        this.#lastWasRotation = false;

        // Reset lock state
        this.#lockTimer = 0;
        this.#lockResets = 0;
        this.#isLocking = false;

        this.emit("hold", { held: currentType });
        return true;
    }

    /**
     * Get ghost piece position (where piece would land)
     * @returns {number} Y position of ghost
     */
    getGhostY() {
        if (!this.#currentPiece) return 0;

        let ghostY = this.#currentPiece.y;
        while (
            !this.#board.hasCollision(
                this.#currentPiece,
                this.#currentPiece.x,
                ghostY + 1,
            )
        ) {
            ghostY++;
        }
        return ghostY;
    }

    /**
     * Check if current piece is a T-Spin
     * @returns {{isTSpin: boolean, isMini: boolean}}
     */
    #checkTSpin() {
        if (this.#currentPiece?.type !== "T" || !this.#lastWasRotation) {
            return { isTSpin: false, isMini: false };
        }

        const x = this.#currentPiece.x;
        const y = this.#currentPiece.y;

        // Check the 4 corners around T center (offset by 1)
        const corners = [
            [x, y], // top-left
            [x + 2, y], // top-right
            [x, y + 2], // bottom-left
            [x + 2, y + 2], // bottom-right
        ];

        let occupiedCorners = 0;
        for (const [cx, cy] of corners) {
            if (
                cx < 0 ||
                cx >= this.#board.width ||
                cy < 0 ||
                cy >= this.#board.height ||
                this.#board.getCell(cx, cy) !== null
            ) {
                occupiedCorners++;
            }
        }

        if (occupiedCorners >= 3) {
            // Check for mini T-Spin (wall kick index 4 is the defining one for mini)
            const isMini =
                this.#lastKickIndex === 4 ? false : this.#lastKickIndex !== 0;
            return { isTSpin: true, isMini };
        }

        return { isTSpin: false, isMini: false };
    }

    /**
     * Lock the current piece and process line clears
     */
    #lockPiece() {
        if (!this.#currentPiece) return;

        const { isTSpin, isMini } = this.#checkTSpin();
        if (isTSpin) {
            this.#tSpins++;
        }

        this.#board.lockPiece(this.#currentPiece);
        this.#piecesPlaced++;

        this.emit("pieceLock", { type: this.#currentPiece.type });

        // Clear lines
        const { count: linesCleared, rows } = this.#board.clearLines();
        const isPerfectClear = this.#board.isEmpty();

        // Calculate score
        let points = 0;
        let actionText = null;

        if (linesCleared > 0) {
            this.#combo++;
            const comboBonus = 50 * this.#combo * this.#level;

            if (isTSpin) {
                // T-Spin scoring
                if (isMini) {
                    points = SCORING.TSPIN_MINI * this.#level;
                    actionText = "T-SPIN MINI";
                } else {
                    switch (linesCleared) {
                        case 1:
                            points = SCORING.TSPIN_SINGLE * this.#level;
                            actionText = "T-SPIN SINGLE";
                            break;
                        case 2:
                            points = SCORING.TSPIN_DOUBLE * this.#level;
                            actionText = "T-SPIN DOUBLE";
                            break;
                        case 3:
                            points = SCORING.TSPIN_TRIPLE * this.#level;
                            actionText = "T-SPIN TRIPLE";
                            break;
                    }
                }

                // Back-to-back bonus
                if (this.#backToBack) {
                    points = Math.floor(
                        points * SCORING.BACK_TO_BACK_MULTIPLIER,
                    );
                    actionText += "\nBACK-TO-BACK";
                }
                this.#backToBack = true;
            } else {
                // Normal line clear scoring
                switch (linesCleared) {
                    case 1:
                        points = SCORING.SINGLE * this.#level;
                        actionText = "SINGLE";
                        break;
                    case 2:
                        points = SCORING.DOUBLE * this.#level;
                        actionText = "DOUBLE";
                        break;
                    case 3:
                        points = SCORING.TRIPLE * this.#level;
                        actionText = "TRIPLE";
                        break;
                    case 4:
                        points = SCORING.QUAD * this.#level;
                        actionText = "QUAD!";
                        // Back-to-back bonus
                        if (this.#backToBack) {
                            points = Math.floor(
                                points * SCORING.BACK_TO_BACK_MULTIPLIER,
                            );
                            actionText += "\nBACK-TO-BACK";
                        }
                        this.#backToBack = true;
                        break;
                }

                // Reset back-to-back for non-quad clears
                if (linesCleared < 4 && !isTSpin) {
                    this.#backToBack = false;
                }
            }

            // Perfect clear bonus
            if (isPerfectClear) {
                const pcBonus = [
                    0,
                    SCORING.PERFECT_CLEAR_SINGLE,
                    SCORING.PERFECT_CLEAR_DOUBLE,
                    SCORING.PERFECT_CLEAR_TRIPLE,
                    SCORING.PERFECT_CLEAR_QUAD,
                ][linesCleared];
                points += pcBonus * this.#level;
                actionText = "PERFECT CLEAR!\n" + actionText;
            }

            points += comboBonus;
            this.#score += points;
            this.#lines += linesCleared;

            // Level progression (every 10 lines)
            const newLevel = Math.floor(this.#lines / 10) + 1;
            if (newLevel > this.#level && this.#level < 20) {
                this.#level = Math.min(newLevel, 20);
                this.emit("levelUp", { level: this.#level });
            }

            this.emit("lineClear", {
                lines: linesCleared,
                rows,
                points,
                combo: this.#combo,
                isTSpin,
                isMini,
                isPerfectClear,
                actionText,
            });

            // Check sprint mode win condition
            if (this.#mode === "sprint" && this.#lines >= 40) {
                this.emit("sprintComplete", {
                    time: this.#timeElapsed,
                    score: this.#score,
                });
            }
        } else {
            this.#combo = -1;
        }

        // Spawn next piece
        this.#spawnPiece();
    }

    /**
     * Update game state (called every frame)
     * @param {number} deltaTime - Time since last update in ms
     */
    update(deltaTime) {
        if (this.#gameOver || this.#paused || !this.#currentPiece) return;

        this.#timeElapsed += deltaTime;

        // Check ultra mode time limit
        if (this.#mode === "ultra" && this.#timeElapsed >= 120000) {
            this.emit("ultraComplete", {
                score: this.#score,
                lines: this.#lines,
            });
            this.#gameOver = true;
            return;
        }

        // Check if piece is touching ground
        const isTouchingGround = this.#board.hasCollision(
            this.#currentPiece,
            this.#currentPiece.x,
            this.#currentPiece.y + 1,
        );

        if (isTouchingGround) {
            if (!this.#isLocking) {
                this.#isLocking = true;
                this.#lockTimer = 0;
            }

            this.#lockTimer += deltaTime;

            if (
                this.#lockTimer >= LOCK_DELAY ||
                this.#lockResets >= MAX_LOCK_RESETS
            ) {
                this.#lockPiece();
            }
        } else {
            this.#isLocking = false;
            this.#lockTimer = 0;
        }
    }

    /**
     * Apply gravity (move piece down)
     * @returns {boolean} True if piece moved
     */
    applyGravity() {
        if (this.#gameOver || this.#paused || !this.#currentPiece) return false;

        const newY = this.#currentPiece.y + 1;
        if (
            !this.#board.hasCollision(
                this.#currentPiece,
                this.#currentPiece.x,
                newY,
            )
        ) {
            this.#currentPiece.y = newY;
            this.#lastWasRotation = false;
            return true;
        }
        return false;
    }

    /**
     * Pause or resume the game
     */
    togglePause() {
        if (this.#gameOver) return;
        this.#paused = !this.#paused;
        this.emit("pauseToggle", { paused: this.#paused });
    }

    /**
     * Set pause state explicitly
     * @param {boolean} paused - Pause state
     */
    setPaused(paused) {
        if (this.#gameOver) return;
        this.#paused = paused;
        this.emit("pauseToggle", { paused: this.#paused });
    }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        GameEngine,
        Board,
        Tetromino,
        BagRandomizer,
        EventEmitter,
        PIECE_TYPES,
        PIECE_COLORS,
        TETROMINO_SHAPES,
        BOARD_WIDTH,
        BOARD_HEIGHT,
        BOARD_HIDDEN_ROWS,
        SCORING,
    };
}

"use strict";

/**
 * R3TRO Blocks Renderer
 * Handles all Canvas and DOM rendering
 * @module renderer
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const CELL_SIZE = 30;
const BOARD_PADDING = 2;

// Visual settings
const CELL_HIGHLIGHT_FACTOR = 0.3;
const CELL_SHADOW_FACTOR = 0.3;
const GHOST_OPACITY = 0.2;
const GHOST_STROKE_OPACITY = 0.6;

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color string
 * @returns {{r: number, g: number, b: number}} RGB values
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : { r: 0, g: 0, b: 0 };
}

/**
 * Lighten a hex color
 * @param {string} hex - Hex color
 * @param {number} factor - Lightening factor (0-1)
 * @returns {string} Lightened hex color
 */
function lightenColor(hex, factor) {
    const rgb = hexToRgb(hex);
    return (
        `rgb(${Math.min(255, rgb.r + (255 - rgb.r) * factor)}, ` +
        `${Math.min(255, rgb.g + (255 - rgb.g) * factor)}, ` +
        `${Math.min(255, rgb.b + (255 - rgb.b) * factor)})`
    );
}

/**
 * Darken a hex color
 * @param {string} hex - Hex color
 * @param {number} factor - Darkening factor (0-1)
 * @returns {string} Darkened hex color
 */
function darkenColor(hex, factor) {
    const rgb = hexToRgb(hex);
    return (
        `rgb(${Math.floor(rgb.r * (1 - factor))}, ` +
        `${Math.floor(rgb.g * (1 - factor))}, ` +
        `${Math.floor(rgb.b * (1 - factor))})`
    );
}

// ============================================================================
// RENDERER
// ============================================================================

/**
 * Main game renderer
 * @class Renderer
 */
class Renderer {
    #canvas;
    #ctx;
    #engine;
    #cellSize;
    #boardOffsetX;
    #boardOffsetY;
    #hiddenRows;
    #animatingLines = [];
    #actionTexts = [];
    #fps = 0;
    #showFps = false;
    #lastFpsUpdate = 0;
    #frameCount = 0;

    /**
     * @param {HTMLCanvasElement} canvas - Main game canvas
     * @param {GameEngine} engine - Game engine instance
     * @param {number} cellSize - Size of each cell in pixels
     */
    constructor(canvas, engine, cellSize = CELL_SIZE) {
        this.#canvas = canvas;
        this.#ctx = canvas.getContext("2d");
        this.#engine = engine;
        this.#cellSize = cellSize;
        this.#hiddenRows = 2;

        // Calculate board position
        this.#boardOffsetX = BOARD_PADDING;
        this.#boardOffsetY = BOARD_PADDING;

        // Set canvas size
        this.#resizeCanvas();

        // Subscribe to engine events
        this.#setupEventListeners();
    }

    get canvas() {
        return this.#canvas;
    }
    get cellSize() {
        return this.#cellSize;
    }

    /**
     * Resize canvas to fit board
     */
    #resizeCanvas() {
        const boardWidth = this.#engine.board.width * this.#cellSize;
        const boardHeight = this.#engine.board.visibleHeight * this.#cellSize;

        this.#canvas.width = boardWidth + BOARD_PADDING * 2;
        this.#canvas.height = boardHeight + BOARD_PADDING * 2;
    }

    /**
     * Setup event listeners for animations
     */
    #setupEventListeners() {
        this.#engine.on("lineClear", (data) => {
            // Convert row indices for animation (adjust for hidden rows)
            const animRows = data.rows.map((row) => row - this.#hiddenRows);
            this.#animatingLines.push({
                rows: animRows,
                startTime: performance.now(),
                duration: 300,
            });

            // Add action text
            if (data.actionText) {
                this.#addActionText(
                    data.actionText,
                    data.isTSpin ? "#a000f0" : "#f0f000",
                );
            }
        });

        this.#engine.on("levelUp", () => {
            this.#addActionText("LEVEL UP!", "#06b6d4");
        });
    }

    /**
     * Add floating action text
     * @param {string} text - Text to display
     * @param {string} color - Text color
     */
    #addActionText(text, color) {
        this.#actionTexts.push({
            text,
            color,
            startTime: performance.now(),
            duration: 1500,
            y: this.#canvas.height / 2,
        });
    }

    /**
     * Toggle FPS counter
     */
    toggleFps() {
        this.#showFps = !this.#showFps;
    }

    /**
     * Draw a single cell with 3D effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Cell color
     * @param {boolean} isGhost - Whether this is a ghost piece cell
     */
    #drawCell(x, y, color, isGhost = false) {
        const ctx = this.#ctx;
        const size = this.#cellSize;
        const px = this.#boardOffsetX + x * size;
        const py = this.#boardOffsetY + y * size;

        if (isGhost) {
            // Ghost piece - semi-transparent with border
            ctx.globalAlpha = GHOST_OPACITY;
            ctx.fillStyle = color;
            ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
            ctx.globalAlpha = GHOST_STROKE_OPACITY;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 1, py + 1, size - 2, size - 2);
            ctx.globalAlpha = 1;
            return;
        }

        // Main cell fill
        ctx.fillStyle = color;
        ctx.fillRect(px + 1, py + 1, size - 2, size - 2);

        // Highlight (top and left edges)
        const highlight = lightenColor(color, CELL_HIGHLIGHT_FACTOR);
        ctx.fillStyle = highlight;
        ctx.fillRect(px + 3, py + 3, size - 6, 2); // Top edge
        ctx.fillRect(px + 3, py + 3, 2, size - 6); // Left edge

        // Shadow (bottom and right edges)
        const shadow = darkenColor(color, CELL_SHADOW_FACTOR);
        ctx.fillStyle = shadow;
        ctx.fillRect(px + 3, py + size - 5, size - 6, 2); // Bottom edge
        ctx.fillRect(px + size - 5, py + 3, 2, size - 6); // Right edge

        // Inner gradient simulation
        const gradient = ctx.createLinearGradient(px, py, px + size, py + size);
        gradient.addColorStop(0, "rgba(255,255,255,0.1)");
        gradient.addColorStop(1, "rgba(0,0,0,0.1)");
        ctx.fillStyle = gradient;
        ctx.fillRect(px + 1, py + 1, size - 2, size - 2);

        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.fillStyle = "transparent";
        ctx.fillRect(px, py, size, size);
        ctx.shadowBlur = 0;
    }

    /**
     * Draw empty grid cell
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    #drawEmptyCell(x, y) {
        const ctx = this.#ctx;
        const size = this.#cellSize;
        const px = this.#boardOffsetX + x * size;
        const py = this.#boardOffsetY + y * size;

        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(px + 1, py + 1, size - 2, size - 2);

        // Grid lines
        ctx.strokeStyle = "#2a2a4a";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px + 1, py + 1, size - 2, size - 2);
    }

    /**
     * Draw the game board
     */
    #drawBoard() {
        const board = this.#engine.board;
        const visibleStartY = this.#hiddenRows;

        // Draw empty cells and locked pieces
        for (let y = 0; y < board.visibleHeight; y++) {
            for (let x = 0; x < board.width; x++) {
                const cell = board.getCell(x, y + visibleStartY);
                if (cell) {
                    this.#drawCell(x, y, PIECE_COLORS[cell]);
                } else {
                    this.#drawEmptyCell(x, y);
                }
            }
        }
    }

    /**
     * Draw the ghost piece
     */
    #drawGhost() {
        const piece = this.#engine.currentPiece;
        if (!piece) return;

        const ghostY = this.#engine.getGhostY();
        if (ghostY === piece.y) return; // Don't draw if at same position

        const cells = piece.getCells();
        for (const [cx, cy] of cells) {
            const boardY = ghostY + cy - this.#hiddenRows;
            if (boardY >= 0) {
                this.#drawCell(piece.x + cx, boardY, piece.color, true);
            }
        }
    }

    /**
     * Draw the current falling piece
     */
    #drawCurrentPiece() {
        const piece = this.#engine.currentPiece;
        if (!piece) return;

        const cells = piece.getCells();
        for (const [cx, cy] of cells) {
            const boardY = piece.y + cy - this.#hiddenRows;
            if (boardY >= 0) {
                this.#drawCell(piece.x + cx, boardY, piece.color);
            }
        }
    }

    /**
     * Draw line clear animation
     */
    #drawLineAnimations() {
        const now = performance.now();
        const ctx = this.#ctx;

        this.#animatingLines = this.#animatingLines.filter((anim) => {
            const progress = (now - anim.startTime) / anim.duration;
            if (progress >= 1) return false;

            for (const row of anim.rows) {
                if (row < 0) continue;

                const py = this.#boardOffsetY + row * this.#cellSize;
                const width = this.#engine.board.width * this.#cellSize;

                // Flash and shrink effect
                ctx.fillStyle = progress < 0.5 ? "#ffffff" : "#7c3aed";
                ctx.globalAlpha = 1 - progress;
                const scaleY = 1 - progress * 0.5;
                const offsetY = ((1 - scaleY) * this.#cellSize) / 2;
                ctx.fillRect(
                    this.#boardOffsetX,
                    py + offsetY,
                    width,
                    this.#cellSize * scaleY,
                );
                ctx.globalAlpha = 1;
            }

            return true;
        });
    }

    /**
     * Draw action texts
     */
    #drawActionTexts() {
        const now = performance.now();
        const ctx = this.#ctx;

        this.#actionTexts = this.#actionTexts.filter((text) => {
            const progress = (now - text.startTime) / text.duration;
            if (progress >= 1) return false;

            const centerX = this.#canvas.width / 2;
            const y = text.y - progress * 30;

            ctx.globalAlpha = 1 - progress;
            ctx.fillStyle = text.color;
            ctx.font = 'bold 18px "Orbitron", sans-serif';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // Split multi-line text
            const lines = text.text.split("\n");
            lines.forEach((line, i) => {
                ctx.fillText(line, centerX, y + i * 22);
            });

            ctx.globalAlpha = 1;
            return true;
        });
    }

    /**
     * Draw FPS counter
     */
    #drawFps() {
        if (!this.#showFps) return;

        const now = performance.now();
        this.#frameCount++;

        if (now - this.#lastFpsUpdate >= 1000) {
            this.#fps = this.#frameCount;
            this.#frameCount = 0;
            this.#lastFpsUpdate = now;
        }

        const ctx = this.#ctx;
        ctx.fillStyle = "#00ff00";
        ctx.font = '12px "Share Tech Mono", monospace';
        ctx.textAlign = "right";
        ctx.fillText(`FPS: ${this.#fps}`, this.#canvas.width - 5, 15);
    }

    /**
     * Draw pause overlay
     */
    #drawPauseOverlay() {
        if (!this.#engine.paused) return;

        const ctx = this.#ctx;
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);

        ctx.fillStyle = "#7c3aed";
        ctx.font = 'bold 24px "Orbitron", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", this.#canvas.width / 2, this.#canvas.height / 2);
    }

    /**
     * Draw game over overlay
     */
    #drawGameOverOverlay() {
        if (!this.#engine.gameOver) return;

        const ctx = this.#ctx;
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);

        ctx.fillStyle = "#f00000";
        ctx.font = 'bold 24px "Orbitron", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(
            "GAME OVER",
            this.#canvas.width / 2,
            this.#canvas.height / 2 - 20,
        );

        ctx.fillStyle = "#e2e8f0";
        ctx.font = '14px "Share Tech Mono", monospace';
        ctx.fillText(
            "Press R to restart",
            this.#canvas.width / 2,
            this.#canvas.height / 2 + 20,
        );
    }

    /**
     * Main render function
     */
    render() {
        const ctx = this.#ctx;

        // Clear canvas
        ctx.fillStyle = "#0d0d14";
        ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);

        // Draw board background
        ctx.fillStyle = "#0a0a0f";
        ctx.fillRect(
            this.#boardOffsetX,
            this.#boardOffsetY,
            this.#engine.board.width * this.#cellSize,
            this.#engine.board.visibleHeight * this.#cellSize,
        );

        // Draw game elements
        this.#drawBoard();
        this.#drawGhost();
        this.#drawCurrentPiece();
        this.#drawLineAnimations();
        this.#drawActionTexts();

        // Overlays
        this.#drawPauseOverlay();
        this.#drawGameOverOverlay();

        // Debug
        this.#drawFps();
    }

    /**
     * Draw a tetromino preview (for hold/next)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} pieceType - Piece type
     * @param {number} x - X offset
     * @param {number} y - Y offset
     * @param {number} scale - Scale factor
     */
    drawPiecePreview(ctx, pieceType, x, y, scale = 0.6) {
        if (!pieceType) return;

        const shape = TETROMINO_SHAPES[pieceType][0]; // Use rotation 0
        const color = PIECE_COLORS[pieceType];
        const size = this.#cellSize * scale;

        // Center the piece
        const minX = Math.min(...shape.map((c) => c[0]));
        const maxX = Math.max(...shape.map((c) => c[0]));
        const minY = Math.min(...shape.map((c) => c[1]));
        const maxY = Math.max(...shape.map((c) => c[1]));

        const pieceWidth = (maxX - minX + 1) * size;
        const pieceHeight = (maxY - minY + 1) * size;

        const offsetX = x - pieceWidth / 2;
        const offsetY = y - pieceHeight / 2;

        for (const [cx, cy] of shape) {
            const px = offsetX + (cx - minX) * size;
            const py = offsetY + (cy - minY) * size;

            // Draw cell
            ctx.fillStyle = color;
            ctx.fillRect(px + 1, py + 1, size - 2, size - 2);

            // Highlight
            ctx.fillStyle = lightenColor(color, 0.3);
            ctx.fillRect(px + 2, py + 2, size - 4, 2);
            ctx.fillRect(px + 2, py + 2, 2, size - 4);

            // Shadow
            ctx.fillStyle = darkenColor(color, 0.3);
            ctx.fillRect(px + 2, py + size - 4, size - 4, 2);
            ctx.fillRect(px + size - 4, py + 2, 2, size - 4);
        }
    }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = { Renderer, CELL_SIZE };
}

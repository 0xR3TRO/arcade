// src/ui/ui-renderer.js — Drawing game elements on canvas

export const UIRenderer = {
    grid: null,

    init(grid) {
        this.grid = grid;
    },

    applyTheme(theme) {
        const root = document.documentElement;
        root.style.setProperty("--bg-color", theme.uiBg);
        root.style.setProperty("--board-bg", theme.background);
        root.style.setProperty("--board-border", theme.boardBorder);
        root.style.setProperty("--text-color", theme.text);
        root.style.setProperty("--accent-color", theme.accent);
        root.style.setProperty("--hud-bg", theme.hudBg);
        root.style.setProperty("--button-bg", theme.buttonBg);
        root.style.setProperty("--button-text", theme.buttonText);
        root.style.setProperty("--overlay-bg", theme.overlay);
        root.style.setProperty("--food-color", theme.food);
        root.style.setProperty("--snake-head", theme.snakeHead);
        root.style.setProperty("--snake-body", theme.snakeBody);
    },

    drawGrid(theme) {
        const { ctx, canvas, cellSize } = this.grid;

        ctx.fillStyle = theme.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = theme.gridLine;
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= this.grid.cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cellSize, 0);
            ctx.lineTo(x * cellSize, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= this.grid.rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * cellSize);
            ctx.lineTo(canvas.width, y * cellSize);
            ctx.stroke();
        }
    },

    drawSnake(segments, theme) {
        const { ctx, cellSize } = this.grid;
        const padding = cellSize * 0.08;

        segments.forEach((seg, i) => {
            const px = seg.x * cellSize + padding;
            const py = seg.y * cellSize + padding;
            const size = cellSize - padding * 2;

            ctx.fillStyle = i === 0 ? theme.snakeHead : theme.snakeBody;
            ctx.shadowColor = i === 0 ? theme.snakeHead : "transparent";
            ctx.shadowBlur = i === 0 ? 8 : 0;

            const radius = i === 0 ? size * 0.35 : size * 0.2;
            this._roundRect(ctx, px, py, size, size, radius);

            ctx.shadowBlur = 0;
        });
    },

    drawFood(position, theme) {
        if (!position) return;
        const { ctx, cellSize } = this.grid;
        const cx = position.x * cellSize + cellSize / 2;
        const cy = position.y * cellSize + cellSize / 2;
        const radius = cellSize * 0.35;

        // Pulse animation
        const pulse = 1 + Math.sin(performance.now() / 200) * 0.1;

        ctx.fillStyle = theme.food;
        ctx.shadowColor = theme.food;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    },

    drawObstacles(obstacles, theme) {
        if (!obstacles || obstacles.length === 0) return;
        const { ctx, cellSize } = this.grid;
        const padding = cellSize * 0.05;

        ctx.fillStyle = theme.obstacle;
        obstacles.forEach((o) => {
            const px = o.x * cellSize + padding;
            const py = o.y * cellSize + padding;
            const size = cellSize - padding * 2;
            ctx.fillRect(px, py, size, size);
        });
    },

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
    },
};

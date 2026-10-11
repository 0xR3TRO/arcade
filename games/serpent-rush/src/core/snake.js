// src/core/snake.js — Snake logic: movement, growth, self-collision

export const Snake = {
    segments: [],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    grown: false,

    init(startX, startY, length) {
        this.segments = [];
        for (let i = 0; i < length; i++) {
            this.segments.push({ x: startX - i, y: startY });
        }
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.grown = false;
    },

    setDirection(dx, dy) {
        // Prevent 180° reversal
        if (this.direction.x + dx === 0 && this.direction.y + dy === 0) return;
        this.nextDirection = { x: dx, y: dy };
    },

    move(wrapFn) {
        this.direction = { ...this.nextDirection };
        const head = this.getHead();
        let newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y,
        };

        if (wrapFn) {
            newHead = wrapFn(newHead.x, newHead.y);
        }

        this.segments.unshift(newHead);

        if (!this.grown) {
            this.segments.pop();
        }
        this.grown = false;
    },

    grow() {
        this.grown = true;
    },

    getHead() {
        return this.segments[0];
    },

    getBody() {
        return this.segments.slice(1);
    },

    occupies(x, y) {
        return this.segments.some((s) => s.x === x && s.y === y);
    },

    checkSelfCollision() {
        const head = this.getHead();
        return this.getBody().some((s) => s.x === head.x && s.y === head.y);
    },

    getOccupied() {
        return [...this.segments];
    },
};

// src/core/collision.js — Collision detection for walls, self, obstacles

export const Collision = {
    obstacles: [],

    setObstacles(list) {
        this.obstacles = list || [];
    },

    checkWall(head, grid) {
        return !grid.isInBounds(head.x, head.y);
    },

    checkSelf(snake) {
        return snake.checkSelfCollision();
    },

    checkObstacles(head) {
        return this.obstacles.some((o) => o.x === head.x && o.y === head.y);
    },

    generateObstacles(count, grid, occupied) {
        this.obstacles = [];
        for (let i = 0; i < count; i++) {
            const cell = grid.randomCell([...occupied, ...this.obstacles]);
            if (cell) this.obstacles.push(cell);
        }
        return this.obstacles;
    },

    getObstacles() {
        return [...this.obstacles];
    },

    clearObstacles() {
        this.obstacles = [];
    },

    check(snake, grid, mode) {
        const head = snake.getHead();

        if (this.checkSelf(snake)) return "self";
        if (mode.wallCollision && this.checkWall(head, grid)) return "wall";
        if (mode.obstacles && this.checkObstacles(head)) return "obstacle";

        return null;
    },
};

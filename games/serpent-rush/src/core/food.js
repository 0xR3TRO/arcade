// src/core/food.js — Food generation and state

export const Food = {
    position: null,

    spawn(getRandomCell) {
        this.position = getRandomCell();
    },

    isAt(x, y) {
        return this.position && this.position.x === x && this.position.y === y;
    },

    getPosition() {
        return this.position;
    },

    clear() {
        this.position = null;
    },
};

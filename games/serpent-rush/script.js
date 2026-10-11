// script.js — SerpentRush entry point

import { GameLoop } from "./src/core/game-loop.js";

document.addEventListener("DOMContentLoaded", () => {
    GameLoop.init().catch((err) => {
        console.error("SerpentRush failed to initialize:", err);
    });
});

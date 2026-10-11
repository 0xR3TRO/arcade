/**
 * main.js — Bootstrap and wiring for Shift2048.
 * Instantiates all modules, connects them via EventBus, handles mode switching.
 */
import { EventBus } from "./utils/EventBus.js";
import { Storage } from "./utils/Storage.js";
import { GameEngine } from "./game/GameEngine.js";
import { Renderer } from "./ui/Renderer.js";
import { InputHandler } from "./ui/InputHandler.js";
import { AuditLog } from "./ui/AuditLog.js";
import { Overlay } from "./ui/Overlay.js";
import { Stats } from "./ui/Stats.js";
import { AIController } from "./ai/Expectimax.js";

// =============== SHARED BUS ===============
const bus = new EventBus();

// =============== CORE MODULES ===============
const engine = new GameEngine(bus, "player");
const renderer = new Renderer(bus, "grid-wrap", "tile-layer");
const input = new InputHandler(bus, document.getElementById("grid-wrap"));
const auditLog = new AuditLog(bus, "log-list");
const overlay = new Overlay(bus);
const stats = new Stats(bus);
const aiCtrl = new AIController(bus, engine);

// =============== WIRING ===============

// Player input → engine
bus.on("input:move", (dir) => {
    if (currentMode === "watch") return; // ignore keyboard in watch mode
    engine.move(dir);
});

// After render done → engine post-move (spawn + check win/lose)
bus.on("render:done", ({ id }) => {
    if (id === "player") engine.postMove();
    if (id === "ai-race") raceAIEngine?.postMove();
});

// Best score on load
const best = Storage.get("best", 0);
document.getElementById("best").textContent = best;

// =============== BUTTONS ===============
document.getElementById("btn-restart").addEventListener("click", () => {
    if (currentMode === "race") startRace();
    else engine.restart();
});

document
    .getElementById("btn-undo")
    .addEventListener("click", () => engine.undo());
document
    .getElementById("btn-continue")
    .addEventListener("click", () => engine.continuePlay());
document
    .getElementById("btn-new-win")
    .addEventListener("click", () => engine.restart());
document
    .getElementById("btn-retry")
    .addEventListener("click", () => engine.restart());

// =============== MODE SWITCHING ===============
let currentMode = "solo";
let raceAIEngine = null;
let raceAIRenderer = null;
let raceAICtrl = null;
let raceBus = null;

const $modeBtns = document.querySelectorAll(".mode-btn");
const $aiControls = document.getElementById("ai-controls");
const $appSolo = document.getElementById("app-solo");
const $raceWrap = document.getElementById("race-wrap");

$modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;
        if (mode === currentMode) return;
        switchMode(mode);
    });
});

function switchMode(mode) {
    // Cleanup previous
    aiCtrl.stop();
    if (raceAICtrl) raceAICtrl.stop();

    currentMode = mode;

    // Update UI
    $modeBtns.forEach((b) =>
        b.classList.toggle("active", b.dataset.mode === mode),
    );
    $aiControls.classList.toggle("show", mode === "watch" || mode === "race");

    if (mode === "solo") {
        $appSolo.classList.remove("hidden");
        $raceWrap.classList.remove("show");
        renderer.enable();
        input.enable();
        engine.restart();
    } else if (mode === "watch") {
        $appSolo.classList.remove("hidden");
        $raceWrap.classList.remove("show");
        renderer.enable();
        input.disable();
        engine.restart();
        setTimeout(() => aiCtrl.start(), 300);
    } else if (mode === "race") {
        renderer.disable();
        $appSolo.classList.add("hidden");
        $raceWrap.classList.add("show");
        startRace();
    }
}

// =============== RACE MODE ===============
let raceWinHandler = null;

function startRace() {
    // Player side — reuse main bus but with race-specific renderer
    if (!racePlayerRenderer) {
        racePlayerRenderer = new Renderer(
            bus,
            "race-grid-player",
            "race-tiles-player",
            { scoreId: "race-score-player", bestId: null },
        );
    }

    // Remove previous race win handler from main bus
    if (raceWinHandler) bus.off("game:win", raceWinHandler);

    // AI side — separate bus
    if (raceBus) raceBus.clear();
    raceBus = new EventBus();

    raceAIEngine = new GameEngine(raceBus, "ai-race");
    raceAIRenderer = new Renderer(raceBus, "race-grid-ai", "race-tiles-ai", {
        scoreId: "race-score-ai",
        bestId: null,
    });
    raceAICtrl = new AIController(raceBus, raceAIEngine);

    // Wire AI render:done
    raceBus.on("render:done", ({ id }) => {
        if (id === "ai-race") raceAIEngine.postMove();
    });

    // Race win detection
    const checkRaceWin = (winner) => {
        const $pOverlay = document.getElementById("race-overlay-player");
        const $aOverlay = document.getElementById("race-overlay-ai");
        raceAICtrl.stop();

        if (winner === "player") {
            $pOverlay.innerHTML = "<h2>You Win!</h2>";
            $aOverlay.innerHTML = "<h2>AI Loses</h2>";
        } else {
            $pOverlay.innerHTML = "<h2>AI Wins!</h2>";
            $aOverlay.innerHTML = "<h2>AI Wins!</h2>";
        }
        $pOverlay.classList.add("show");
        $aOverlay.classList.add("show");
    };

    raceWinHandler = () => checkRaceWin("player");
    bus.on("game:win", raceWinHandler);
    raceBus.on("game:win", () => checkRaceWin("ai"));

    // Clear overlays
    document.getElementById("race-overlay-player").classList.remove("show");
    document.getElementById("race-overlay-ai").classList.remove("show");
    document.getElementById("race-overlay-player").innerHTML = "";
    document.getElementById("race-overlay-ai").innerHTML = "";
    document.getElementById("race-score-player").textContent = "0";
    document.getElementById("race-score-ai").textContent = "0";

    // Connect player input to main engine for race mode
    input.enable();

    engine.restart();
    raceAIEngine.restart();

    setTimeout(() => raceAICtrl.start(), 300);
}

let racePlayerRenderer = null;

// =============== AI SPEED SLIDER ===============
const $speedSlider = document.getElementById("ai-speed");
const $speedVal = document.getElementById("speed-val");

$speedSlider.addEventListener("input", () => {
    const ms = parseInt($speedSlider.value, 10);
    $speedVal.textContent = ms + "ms";
    bus.emit("ai:speed", ms);
    if (raceBus) raceBus.emit("ai:speed", ms);
});

// =============== THEME SWITCHER ===============
const $themeDots = document.querySelectorAll(".theme-dot");
const savedTheme = Storage.get("theme", "dark");
document.documentElement.dataset.theme = savedTheme;
$themeDots.forEach((d) =>
    d.classList.toggle("active", d.dataset.theme === savedTheme),
);

$themeDots.forEach((dot) => {
    dot.addEventListener("click", () => {
        const theme = dot.dataset.theme;
        document.documentElement.dataset.theme = theme;
        Storage.set("theme", theme);
        $themeDots.forEach((d) =>
            d.classList.toggle("active", d.dataset.theme === theme),
        );
    });
});

// =============== AUTO-SAVE RESTORE ===============
const saved = GameEngine.loadSave("player");
if (saved) {
    engine.init(saved);
} else {
    engine.init();
}

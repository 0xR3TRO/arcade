/* ============================================================
   Clash of Choices — Game Engine
   Pure-JS modular Rock-Paper-Scissors game
   ============================================================ */

(function () {
    "use strict";

    /* ========== CONSTANTS ========== */
    const CHOICES = ["rock", "paper", "scissors"];
    const EMOJI = { rock: "🪨", paper: "📄", scissors: "✂️" };
    const BEATS = { rock: "scissors", scissors: "paper", paper: "rock" };
    const DESCRIPTIONS = {
        rock_scissors: "Rock crushes Scissors",
        scissors_paper: "Scissors cuts Paper",
        paper_rock: "Paper covers Rock",
    };

    /* ========== STATE ========== */
    const state = {
        mode: "quick", // quick | bestof | local
        difficulty: "normal", // easy | normal | hard
        bestOfTarget: 3,
        seriesActive: false, // true while a best-of series is running
        soundEnabled: true,
        darkMode: true,

        // Current match scores
        p1Score: 0,
        p2Score: 0,
        roundNum: 0,

        // For local 1v1
        localPhase: null, // 'p1' | 'p2' | null
        localP1Choice: null,

        // History of player moves (for CPU heuristics)
        playerHistory: [],

        // Stats (persisted)
        stats: defaultStats(),
    };

    function defaultStats() {
        return {
            totalRounds: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            currentStreak: 0,
            bestStreak: 0,
            moveCounts: { rock: 0, paper: 0, scissors: 0 },
            history: [], // last N rounds [{p1, p2, result}]
        };
    }

    /* ========== DOM REFS ========== */
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const dom = {
        // Views
        viewGame: $("#viewGame"),
        viewStats: $("#viewStats"),
        viewSettings: $("#viewSettings"),
        navBtns: $$(".nav-btn"),

        // Mode bar
        modeBtns: $$(".mode-btn"),
        bestofConfig: $("#bestofConfig"),
        bestofSelect: $("#bestofSelect"),
        bestofStart: $("#bestofStart"),

        // Scoreboard
        p1Label: $("#p1Label"),
        p2Label: $("#p2Label"),
        p1Score: $("#p1Score"),
        p2Score: $("#p2Score"),
        roundInfo: $("#roundInfo"),

        // Arena
        arenaLeft: $("#arenaLeft"),
        arenaRight: $("#arenaRight"),
        arenaLeftLabel: $("#arenaLeftLabel"),
        arenaRightLabel: $("#arenaRightLabel"),

        // Result
        resultBanner: $("#resultBanner"),
        resultText: $("#resultText"),
        resultDetail: $("#resultDetail"),

        // Handoff
        handoffScreen: $("#handoffScreen"),
        handoffTitle: $("#handoffTitle"),
        handoffReady: $("#handoffReady"),

        // Choices
        choices: $("#choices"),
        choiceBtns: $$(".choice-btn"),

        // Actions
        gameActions: $("#gameActions"),
        btnPlayAgain: $("#btnPlayAgain"),
        btnNewGame: $("#btnNewGame"),

        // Theme / Sound
        themeToggle: $("#themeToggle"),
        soundToggle: $("#soundToggle"),
        themeIcon: $(".theme-icon"),
        soundIcon: $(".sound-icon"),

        // Settings
        settingDarkMode: $("#settingDarkMode"),
        settingSound: $("#settingSound"),
        btnResetStats: $("#btnResetStats"),
        btnResetAll: $("#btnResetAll"),
        difficultyRadios: $$('input[name="difficulty"]'),

        // Stats
        statTotalRounds: $("#statTotalRounds"),
        statWins: $("#statWins"),
        statLosses: $("#statLosses"),
        statDraws: $("#statDraws"),
        statWinRate: $("#statWinRate"),
        statCurrentStreak: $("#statCurrentStreak"),
        statBestStreak: $("#statBestStreak"),
        statFavMove: $("#statFavMove"),
        barRock: $("#barRock"),
        barPaper: $("#barPaper"),
        barScissors: $("#barScissors"),
        pctRock: $("#pctRock"),
        pctPaper: $("#pctPaper"),
        pctScissors: $("#pctScissors"),
        historyList: $("#historyList"),

        // Toast
        toastContainer: $("#toastContainer"),
    };

    /* ========== AUDIO (Web Audio API – simple beeps) ========== */
    let audioCtx = null;

    function getAudioCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
    }

    function playTone(freq, duration, type) {
        if (!state.soundEnabled) return;
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type || "sine";
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + duration,
            );
            osc.connect(gain).connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (_) {
            /* audio not supported */
        }
    }

    const sfx = {
        select: () => playTone(600, 0.1, "triangle"),
        win: () => {
            playTone(523, 0.12, "square");
            setTimeout(() => playTone(659, 0.12, "square"), 120);
            setTimeout(() => playTone(784, 0.2, "square"), 240);
        },
        lose: () => {
            playTone(400, 0.15, "sawtooth");
            setTimeout(() => playTone(300, 0.25, "sawtooth"), 150);
        },
        draw: () => playTone(440, 0.2, "triangle"),
        click: () => playTone(800, 0.05, "sine"),
    };

    /* ========== PERSISTENCE ========== */
    const STORAGE_KEY = "clashOfChoices";

    function saveAll() {
        const data = {
            stats: state.stats,
            difficulty: state.difficulty,
            mode: state.mode,
            soundEnabled: state.soundEnabled,
            darkMode: state.darkMode,
            playerHistory: state.playerHistory.slice(-50), // keep last 50
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (_) {}
    }

    function loadAll() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (data.stats) Object.assign(state.stats, data.stats);
            if (data.difficulty) state.difficulty = data.difficulty;
            if (data.mode) state.mode = data.mode;
            if (typeof data.soundEnabled === "boolean")
                state.soundEnabled = data.soundEnabled;
            if (typeof data.darkMode === "boolean")
                state.darkMode = data.darkMode;
            if (Array.isArray(data.playerHistory))
                state.playerHistory = data.playerHistory;
        } catch (_) {}
    }

    /* ========== CPU AI ========== */
    function cpuChoose() {
        const diff = state.difficulty;
        const hist = state.playerHistory;
        const rand = () => CHOICES[Math.floor(Math.random() * 3)];

        if (diff === "easy" || hist.length === 0) return rand();

        if (diff === "normal") {
            // 45% chance to counter last move, else random
            if (Math.random() < 0.45) {
                const last = hist[hist.length - 1];
                return BEATS[last] === undefined ? rand() : counterOf(last);
            }
            return rand();
        }

        // Hard: frequency analysis of last 10 moves, counter the most frequent
        if (diff === "hard") {
            if (Math.random() < 0.15) return rand(); // 15% randomness to avoid being too predictable
            const recent = hist.slice(-10);
            const freq = { rock: 0, paper: 0, scissors: 0 };
            recent.forEach((m) => freq[m]++);
            const mostFreq = CHOICES.reduce((a, b) =>
                freq[a] >= freq[b] ? a : b,
            );
            return counterOf(mostFreq);
        }

        return rand();
    }

    /** Return the choice that beats `move` */
    function counterOf(move) {
        // rock beaten by paper, paper beaten by scissors, scissors beaten by rock
        return { rock: "paper", paper: "scissors", scissors: "rock" }[move];
    }

    /* ========== GAME LOGIC ========== */
    function determineResult(p1, p2) {
        if (p1 === p2) return "draw";
        return BEATS[p1] === p2 ? "win" : "lose";
    }

    function getDescription(p1, p2) {
        const key1 = p1 + "_" + p2;
        const key2 = p2 + "_" + p1;
        return DESCRIPTIONS[key1] || DESCRIPTIONS[key2] || "";
    }

    /* ========== UI UPDATES ========== */
    function showArenaResult(p1, p2, result) {
        const leftEmoji = dom.arenaLeft.querySelector(".hand-emoji");
        const rightEmoji = dom.arenaRight.querySelector(".hand-emoji");

        // Shake animation
        dom.arenaLeft.classList.add("shake");
        dom.arenaRight.classList.add("shake");

        setTimeout(() => {
            dom.arenaLeft.classList.remove("shake");
            dom.arenaRight.classList.remove("shake");

            leftEmoji.textContent = EMOJI[p1];
            rightEmoji.textContent = EMOJI[p2];
            dom.arenaLeftLabel.textContent = capitalize(p1);
            dom.arenaRightLabel.textContent = capitalize(p2);

            dom.arenaLeft.classList.add("reveal");
            dom.arenaRight.classList.add("reveal");

            // Color coding
            dom.arenaLeft.classList.remove("win", "lose", "draw-state");
            dom.arenaRight.classList.remove("win", "lose", "draw-state");

            if (result === "win") {
                dom.arenaLeft.classList.add("win");
                dom.arenaRight.classList.add("lose");
            } else if (result === "lose") {
                dom.arenaLeft.classList.add("lose");
                dom.arenaRight.classList.add("win");
            } else {
                dom.arenaLeft.classList.add("draw-state");
                dom.arenaRight.classList.add("draw-state");
            }
        }, 450);
    }

    function showResultBanner(p1, p2, result) {
        setTimeout(() => {
            dom.resultBanner.classList.remove("hidden");
            dom.resultText.className = "result-text " + result;
            if (result === "win") {
                dom.resultText.textContent =
                    state.mode === "local" ? "Player 1 Wins!" : "You Win!";
            } else if (result === "lose") {
                dom.resultText.textContent =
                    state.mode === "local" ? "Player 2 Wins!" : "You Lose!";
            } else {
                dom.resultText.textContent = "It's a Draw!";
            }
            dom.resultDetail.textContent = getDescription(p1, p2);
        }, 500);
    }

    function showPostRound() {
        setTimeout(() => {
            dom.choices.classList.add("hidden");
            dom.gameActions.classList.remove("hidden");
        }, 550);
    }

    function renderScoreboard() {
        dom.p1Score.textContent = state.p1Score;
        dom.p2Score.textContent = state.p2Score;

        if (state.mode === "bestof" && state.seriesActive) {
            dom.roundInfo.textContent = `First to ${state.bestOfTarget}`;
        } else if (state.mode === "quick") {
            dom.roundInfo.textContent =
                state.roundNum > 0 ? `Round ${state.roundNum}` : "—";
        } else {
            dom.roundInfo.textContent =
                state.roundNum > 0 ? `Round ${state.roundNum}` : "—";
        }
    }

    function resetArena() {
        const leftEmoji = dom.arenaLeft.querySelector(".hand-emoji");
        const rightEmoji = dom.arenaRight.querySelector(".hand-emoji");
        leftEmoji.textContent = "❓";
        rightEmoji.textContent = "❓";
        dom.arenaLeftLabel.textContent = "Pick a move";
        dom.arenaRightLabel.textContent = "Waiting";
        dom.arenaLeft.classList.remove(
            "reveal",
            "win",
            "lose",
            "draw-state",
            "shake",
        );
        dom.arenaRight.classList.remove(
            "reveal",
            "win",
            "lose",
            "draw-state",
            "shake",
        );
        dom.resultBanner.classList.add("hidden");
        dom.choices.classList.remove("hidden");
        dom.gameActions.classList.add("hidden");
        dom.choiceBtns.forEach((b) => b.classList.remove("selected"));
    }

    function resetMatch() {
        state.p1Score = 0;
        state.p2Score = 0;
        state.roundNum = 0;
        state.seriesActive = false;
        state.localPhase = null;
        state.localP1Choice = null;
        resetArena();
        renderScoreboard();
        updateLabels();
        dom.handoffScreen.classList.add("hidden");

        if (state.mode === "local") {
            state.localPhase = "p1";
            dom.arenaLeftLabel.textContent = "Player 1";
            dom.arenaRightLabel.textContent = "Player 2";
        }
        if (state.mode === "bestof") {
            state.seriesActive = false;
            dom.bestofConfig.classList.remove("hidden");
            dom.choices.classList.add("hidden");
        } else {
            dom.choices.classList.remove("hidden");
        }
    }

    function updateLabels() {
        if (state.mode === "local") {
            dom.p1Label.textContent = "P1";
            dom.p2Label.textContent = "P2";
        } else {
            dom.p1Label.textContent = "You";
            dom.p2Label.textContent = "CPU";
        }
    }

    function endSeries() {
        const winner =
            state.p1Score >= state.bestOfTarget
                ? "Player 1"
                : state.mode === "local"
                  ? "Player 2"
                  : "CPU";
        setTimeout(() => {
            dom.choices.classList.add("hidden");
            dom.gameActions.classList.remove("hidden");
            dom.resultBanner.classList.remove("hidden");
            dom.resultText.className =
                "result-text " +
                (state.p1Score >= state.bestOfTarget ? "win" : "lose");
            dom.resultText.textContent = `${winner} wins the series!`;
            dom.resultDetail.textContent = `${state.p1Score} – ${state.p2Score}`;
            if (state.p1Score >= state.bestOfTarget) sfx.win();
            else sfx.lose();
        }, 550);
    }

    /* ========== STATS ========== */
    function renderStats() {
        const s = state.stats;
        dom.statTotalRounds.textContent = s.totalRounds;
        dom.statWins.textContent = s.wins;
        dom.statLosses.textContent = s.losses;
        dom.statDraws.textContent = s.draws;
        dom.statCurrentStreak.textContent = s.currentStreak;
        dom.statBestStreak.textContent = s.bestStreak;

        const rate =
            s.totalRounds > 0 ? Math.round((s.wins / s.totalRounds) * 100) : 0;
        dom.statWinRate.textContent = rate + "%";

        // Favorite move
        const mc = s.moveCounts;
        const total = mc.rock + mc.paper + mc.scissors;
        if (total > 0) {
            const fav = CHOICES.reduce((a, b) => (mc[a] >= mc[b] ? a : b));
            dom.statFavMove.textContent = EMOJI[fav] + " " + capitalize(fav);
        } else {
            dom.statFavMove.textContent = "—";
        }

        // Bar chart
        if (total > 0) {
            const rP = Math.round((mc.rock / total) * 100);
            const pP = Math.round((mc.paper / total) * 100);
            const sP = Math.round((mc.scissors / total) * 100);
            dom.barRock.style.width = rP + "%";
            dom.barPaper.style.width = pP + "%";
            dom.barScissors.style.width = sP + "%";
            dom.pctRock.textContent = rP + "%";
            dom.pctPaper.textContent = pP + "%";
            dom.pctScissors.textContent = sP + "%";
        } else {
            dom.barRock.style.width = "0%";
            dom.barPaper.style.width = "0%";
            dom.barScissors.style.width = "0%";
            dom.pctRock.textContent = "0%";
            dom.pctPaper.textContent = "0%";
            dom.pctScissors.textContent = "0%";
        }

        // History
        if (s.history.length === 0) {
            dom.historyList.innerHTML =
                '<p class="history-empty">No rounds played yet.</p>';
        } else {
            dom.historyList.innerHTML = s.history
                .slice(0, 20)
                .map((h) => {
                    const p1E = EMOJI[h.p1] || "?";
                    const p2E = EMOJI[h.p2] || "?";
                    const cls = h.result;
                    const label =
                        h.result === "win"
                            ? "WIN"
                            : h.result === "lose"
                              ? "LOSS"
                              : "DRAW";
                    return `<div class="history-item">
          <span class="hi-moves">${p1E} vs ${p2E}</span>
          <span class="hi-result ${cls}">${label}</span>
        </div>`;
                })
                .join("");
        }
    }

    /* ========== EVENTS ========== */
    function initEvents() {
        // Navigation
        dom.navBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                sfx.click();
                switchView(btn.dataset.view);
            });
        });

        // Mode selector
        dom.modeBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                sfx.click();
                switchMode(btn.dataset.mode);
            });
        });

        // Best-of start
        dom.bestofStart.addEventListener("click", () => {
            sfx.click();
            state.bestOfTarget = parseInt(dom.bestofSelect.value, 10);
            state.seriesActive = true;
            state.p1Score = 0;
            state.p2Score = 0;
            state.roundNum = 0;
            dom.bestofConfig.classList.add("hidden");
            dom.choices.classList.remove("hidden");
            resetArena();
            renderScoreboard();
        });

        // Choice clicks
        dom.choiceBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                const choice = btn.dataset.choice;
                sfx.select();
                btn.classList.add("selected");

                if (state.mode === "local") {
                    handleLocalChoice(choice);
                } else {
                    // VS CPU
                    disableChoices();
                    const cpuMove = cpuChoose();
                    playRoundWithSave(choice, cpuMove);
                }
            });
        });

        // Play again
        dom.btnPlayAgain.addEventListener("click", () => {
            sfx.click();
            if (state.mode === "local") {
                state.localPhase = "p1";
                state.localP1Choice = null;
            }
            resetArena();
            enableChoices();
            if (state.mode === "local") {
                dom.arenaLeftLabel.textContent = "Player 1";
                dom.arenaRightLabel.textContent = "Player 2";
            }
        });

        // New game
        dom.btnNewGame.addEventListener("click", () => {
            sfx.click();
            resetMatch();
            enableChoices();
        });

        // Handoff ready
        dom.handoffReady.addEventListener("click", () => {
            sfx.click();
            dom.handoffScreen.classList.add("hidden");
            dom.choices.classList.remove("hidden");
            dom.choiceBtns.forEach((b) => b.classList.remove("selected"));
            enableChoices();
        });

        // Theme toggle (header)
        dom.themeToggle.addEventListener("click", () => {
            sfx.click();
            toggleDarkMode();
        });

        // Sound toggle (header)
        dom.soundToggle.addEventListener("click", () => {
            state.soundEnabled = !state.soundEnabled;
            dom.soundIcon.textContent = state.soundEnabled ? "🔊" : "🔇";
            dom.settingSound.checked = state.soundEnabled;
            sfx.click();
            saveAll();
        });

        // Settings: dark mode
        dom.settingDarkMode.addEventListener("change", () => {
            toggleDarkMode();
        });

        // Settings: sound
        dom.settingSound.addEventListener("change", () => {
            state.soundEnabled = dom.settingSound.checked;
            dom.soundIcon.textContent = state.soundEnabled ? "🔊" : "🔇";
            saveAll();
        });

        // Difficulty
        dom.difficultyRadios.forEach((radio) => {
            radio.addEventListener("change", () => {
                state.difficulty = radio.value;
                saveAll();
                toast(`Difficulty set to ${capitalize(state.difficulty)}`);
            });
        });

        // Reset stats
        dom.btnResetStats.addEventListener("click", () => {
            if (confirm("Reset all statistics? This cannot be undone.")) {
                state.stats = defaultStats();
                state.playerHistory = [];
                saveAll();
                renderStats();
                toast("Statistics reset");
            }
        });

        // Reset everything
        dom.btnResetAll.addEventListener("click", () => {
            if (
                confirm(
                    "Reset all data and preferences? This cannot be undone.",
                )
            ) {
                localStorage.removeItem(STORAGE_KEY);
                location.reload();
            }
        });
    }

    /* ========== LOCAL 1v1 FLOW ========== */
    function handleLocalChoice(choice) {
        if (state.localPhase === "p1") {
            state.localP1Choice = choice;
            state.localPhase = "p2";
            // Hide choices, show handoff
            dom.choices.classList.add("hidden");
            dom.handoffTitle.textContent = "Pass to Player 2";
            dom.handoffScreen.classList.remove("hidden");
            dom.choiceBtns.forEach((b) => b.classList.remove("selected"));
        } else if (state.localPhase === "p2") {
            disableChoices();
            playRoundWithSave(state.localP1Choice, choice);
            state.localPhase = "p1";
            state.localP1Choice = null;
        }
    }

    function playRoundWithSave(p1, p2) {
        // Fix: properly pass p2 to stats history
        const result = determineResult(p1, p2);
        state.roundNum++;
        if (result === "win") state.p1Score++;
        else if (result === "lose") state.p2Score++;

        if (state.mode !== "local") {
            state.playerHistory.push(p1);
        }

        // Stats update with proper p2
        const s = state.stats;
        s.totalRounds++;
        if (result === "win") {
            s.wins++;
            s.currentStreak++;
            if (s.currentStreak > s.bestStreak) s.bestStreak = s.currentStreak;
        } else if (result === "lose") {
            s.losses++;
            s.currentStreak = 0;
        } else {
            s.draws++;
        }
        s.moveCounts[p1]++;
        s.history.unshift({ p1, p2, result, time: Date.now() });
        if (s.history.length > 50) s.history.length = 50;
        saveAll();

        // Show in arena
        showArenaResult(p1, p2, result);
        showResultBanner(p1, p2, result);
        renderScoreboard();

        if (result === "win") sfx.win();
        else if (result === "lose") sfx.lose();
        else sfx.draw();

        // Series check
        if (state.mode === "bestof" && state.seriesActive) {
            if (
                state.p1Score >= state.bestOfTarget ||
                state.p2Score >= state.bestOfTarget
            ) {
                endSeries();
                return;
            }
        }

        showPostRound();
    }

    /* ========== HELPERS ========== */
    function switchView(viewName) {
        dom.navBtns.forEach((b) => {
            b.classList.toggle("active", b.dataset.view === viewName);
            b.setAttribute(
                "aria-current",
                b.dataset.view === viewName ? "page" : "false",
            );
        });
        [dom.viewGame, dom.viewStats, dom.viewSettings].forEach((v) =>
            v.classList.remove("active"),
        );
        if (viewName === "game") dom.viewGame.classList.add("active");
        else if (viewName === "stats") {
            dom.viewStats.classList.add("active");
            renderStats();
        } else if (viewName === "settings")
            dom.viewSettings.classList.add("active");
    }

    function switchMode(modeName) {
        state.mode = modeName;
        dom.modeBtns.forEach((b) => {
            b.classList.toggle("active", b.dataset.mode === modeName);
            b.setAttribute(
                "aria-pressed",
                b.dataset.mode === modeName ? "true" : "false",
            );
        });
        resetMatch();
        saveAll();

        if (modeName === "bestof") {
            dom.bestofConfig.classList.remove("hidden");
            dom.choices.classList.add("hidden");
        } else {
            dom.bestofConfig.classList.add("hidden");
            dom.choices.classList.remove("hidden");
        }
    }

    function disableChoices() {
        dom.choiceBtns.forEach((b) => (b.disabled = true));
    }

    function enableChoices() {
        dom.choiceBtns.forEach((b) => (b.disabled = false));
    }

    function toggleDarkMode() {
        state.darkMode = !state.darkMode;
        applyTheme();
        saveAll();
    }

    function applyTheme() {
        document.documentElement.setAttribute(
            "data-theme",
            state.darkMode ? "dark" : "light",
        );
        dom.themeIcon.textContent = state.darkMode ? "🌙" : "☀️";
        dom.settingDarkMode.checked = state.darkMode;
    }

    function capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function toast(msg) {
        const el = document.createElement("div");
        el.className = "toast";
        el.textContent = msg;
        dom.toastContainer.appendChild(el);
        setTimeout(() => {
            el.classList.add("out");
        }, 2200);
        setTimeout(() => {
            el.remove();
        }, 2600);
    }

    /* ========== INIT ========== */
    function init() {
        loadAll();
        applyTheme();
        dom.soundIcon.textContent = state.soundEnabled ? "🔊" : "🔇";
        dom.settingSound.checked = state.soundEnabled;

        // Restore difficulty radio
        dom.difficultyRadios.forEach((r) => {
            r.checked = r.value === state.difficulty;
        });

        // Restore mode
        switchMode(state.mode);
        updateLabels();
        renderScoreboard();
        initEvents();
    }

    // Boot
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();

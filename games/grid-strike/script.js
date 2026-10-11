/* ============================================================
   GridStrike — Script
   Modules: Storage, GameState, GameLogic, AI, UI, Events
   ============================================================ */

// ─── Storage Module ──────────────────────────────────────────
const Storage = (() => {
    const KEYS = {
        mode: "gs_mode",
        difficulty: "gs_difficulty",
        theme: "gs_theme",
    };

    const save = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            /* storage unavailable */
        }
    };

    const load = (key, fallback) => {
        try {
            const raw = localStorage.getItem(key);
            return raw !== null ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    };

    return { KEYS, save, load };
})();

// ─── GameState Module ────────────────────────────────────────
const GameState = (() => {
    let board = Array(9).fill("");
    let currentPlayer = "X";
    let gameActive = true;
    let mode = Storage.load(Storage.KEYS.mode, "pvp");
    let difficulty = Storage.load(Storage.KEYS.difficulty, "easy");
    let scores = { X: 0, O: 0, draws: 0 };

    const reset = () => {
        board = Array(9).fill("");
        currentPlayer = "X";
        gameActive = true;
    };

    const resetScores = () => {
        scores = { X: 0, O: 0, draws: 0 };
    };

    return {
        get board() {
            return board;
        },
        set board(b) {
            board = b;
        },
        get currentPlayer() {
            return currentPlayer;
        },
        set currentPlayer(p) {
            currentPlayer = p;
        },
        get gameActive() {
            return gameActive;
        },
        set gameActive(a) {
            gameActive = a;
        },
        get mode() {
            return mode;
        },
        set mode(m) {
            mode = m;
            Storage.save(Storage.KEYS.mode, m);
        },
        get difficulty() {
            return difficulty;
        },
        set difficulty(d) {
            difficulty = d;
            Storage.save(Storage.KEYS.difficulty, d);
        },
        get scores() {
            return scores;
        },
        reset,
        resetScores,
    };
})();

// ─── GameLogic Module ────────────────────────────────────────
const GameLogic = (() => {
    const WIN_PATTERNS = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8], // rows
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8], // columns
        [0, 4, 8],
        [2, 4, 6], // diagonals
    ];

    const checkWin = (board, player) => {
        for (const pattern of WIN_PATTERNS) {
            if (pattern.every((i) => board[i] === player)) {
                return pattern;
            }
        }
        return null;
    };

    const checkDraw = (board) => board.every((cell) => cell !== "");

    const getAvailable = (board) =>
        board.reduce((acc, cell, i) => {
            if (cell === "") acc.push(i);
            return acc;
        }, []);

    const makeMove = (index) => {
        if (GameState.board[index] !== "" || !GameState.gameActive)
            return false;
        GameState.board[index] = GameState.currentPlayer;
        return true;
    };

    return { WIN_PATTERNS, checkWin, checkDraw, getAvailable, makeMove };
})();

// ─── AI Module ───────────────────────────────────────────────
const AI = (() => {
    const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    /** Easy: pick a random open cell */
    const easyMove = (board) => randomFrom(GameLogic.getAvailable(board));

    /**
     * Smart: heuristic strategy
     *  1. Win if possible
     *  2. Block opponent's winning move
     *  3. Take center
     *  4. Take a corner
     *  5. Take a side
     */
    const smartMove = (board, aiPlayer) => {
        const opponent = aiPlayer === "X" ? "O" : "X";
        const available = GameLogic.getAvailable(board);

        // 1. Win immediately
        for (const i of available) {
            const test = [...board];
            test[i] = aiPlayer;
            if (GameLogic.checkWin(test, aiPlayer)) return i;
        }

        // 2. Block opponent
        for (const i of available) {
            const test = [...board];
            test[i] = opponent;
            if (GameLogic.checkWin(test, opponent)) return i;
        }

        // 3. Center
        if (available.includes(4)) return 4;

        // 4. Random corner
        const corners = [0, 2, 6, 8].filter((c) => available.includes(c));
        if (corners.length) return randomFrom(corners);

        // 5. Random side
        const sides = [1, 3, 5, 7].filter((s) => available.includes(s));
        if (sides.length) return randomFrom(sides);

        return available[0];
    };

    const getMove = (board) => {
        if (GameState.difficulty === "easy") return easyMove(board);
        return smartMove(board, "O");
    };

    return { getMove };
})();

// ─── UI Module ───────────────────────────────────────────────
const UI = (() => {
    const boardEl = document.getElementById("game-board");
    const statusEl = document.getElementById("status-message");
    const scoreXEl = document.getElementById("score-x");
    const scoreOEl = document.getElementById("score-o");
    const scoreDrawsEl = document.getElementById("score-draws");
    const themeToggle = document.getElementById("theme-toggle");
    const themeIcon = themeToggle.querySelector(".theme-toggle__icon");

    const renderBoard = () => {
        boardEl.innerHTML = "";
        GameState.board.forEach((mark, i) => {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.index = i;
            cell.setAttribute("role", "button");
            cell.setAttribute("tabindex", "0");
            cell.setAttribute(
                "aria-label",
                mark ? `Cell ${i + 1}: ${mark}` : `Cell ${i + 1}: empty`,
            );
            if (mark) {
                cell.textContent = mark;
                cell.classList.add(
                    "filled",
                    mark === "X" ? "cell-x" : "cell-o",
                );
            }
            boardEl.appendChild(cell);
        });
    };

    const updateStatus = (msg) => {
        statusEl.textContent = msg;
    };

    const updateScores = () => {
        scoreXEl.textContent = GameState.scores.X;
        scoreOEl.textContent = GameState.scores.O;
        scoreDrawsEl.textContent = GameState.scores.draws;
    };

    const highlightWin = (pattern) => {
        const cells = boardEl.querySelectorAll(".cell");
        pattern.forEach((i) => cells[i].classList.add("win"));
    };

    const setTheme = (theme) => {
        document.documentElement.setAttribute("data-theme", theme);
        themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
        Storage.save(Storage.KEYS.theme, theme);
    };

    const toggleTheme = () => {
        const current =
            document.documentElement.getAttribute("data-theme") || "light";
        setTheme(current === "dark" ? "light" : "dark");
    };

    const initTheme = () => {
        setTheme(Storage.load(Storage.KEYS.theme, "light"));
    };

    return {
        renderBoard,
        updateStatus,
        updateScores,
        highlightWin,
        toggleTheme,
        initTheme,
        boardEl,
        themeToggle,
    };
})();

// ─── Events Module ───────────────────────────────────────────
const Events = (() => {
    const modeBtns = document.querySelectorAll(".btn--mode");
    const diffBtns = document.querySelectorAll(".btn--diff");
    const diffSelector = document.querySelector(".difficulty-selector");
    const restartBtn = document.getElementById("restart-btn");
    const resetBtn = document.getElementById("reset-btn");

    let cpuTimeout = null;

    /* --- Core turn flow --- */

    const processAfterMove = () => {
        UI.renderBoard();

        const winPattern = GameLogic.checkWin(
            GameState.board,
            GameState.currentPlayer,
        );

        if (winPattern) {
            GameState.gameActive = false;
            GameState.scores[GameState.currentPlayer]++;
            UI.updateScores();
            UI.highlightWin(winPattern);
            UI.updateStatus(`Player ${GameState.currentPlayer} wins!`);
            return;
        }

        if (GameLogic.checkDraw(GameState.board)) {
            GameState.gameActive = false;
            GameState.scores.draws++;
            UI.updateScores();
            UI.updateStatus("It's a draw!");
            return;
        }

        // Switch player
        GameState.currentPlayer = GameState.currentPlayer === "X" ? "O" : "X";
        UI.updateStatus(`Player ${GameState.currentPlayer}'s turn`);
    };

    const cpuTurn = () => {
        if (!GameState.gameActive || GameState.currentPlayer !== "O") return;
        const move = AI.getMove([...GameState.board]);
        if (move === undefined) return;
        GameLogic.makeMove(move);
        processAfterMove();
    };

    /* --- Event handlers --- */

    const handleCellClick = (e) => {
        const cell = e.target.closest(".cell");
        if (!cell) return;
        const index = parseInt(cell.dataset.index, 10);
        if (!GameLogic.makeMove(index)) return;
        processAfterMove();

        // Trigger CPU move if applicable
        if (
            GameState.gameActive &&
            GameState.mode === "pvcpu" &&
            GameState.currentPlayer === "O"
        ) {
            cpuTimeout = setTimeout(cpuTurn, 350);
        }
    };

    const handleCellKeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCellClick(e);
        }
    };

    const handleRestart = () => {
        clearTimeout(cpuTimeout);
        GameState.reset();
        UI.renderBoard();
        UI.updateStatus("Player X's turn");
    };

    const handleReset = () => {
        clearTimeout(cpuTimeout);
        GameState.resetScores();
        GameState.reset();
        UI.renderBoard();
        UI.updateScores();
        UI.updateStatus("Player X's turn");
    };

    const handleModeChange = (e) => {
        const btn = e.target.closest(".btn--mode");
        if (!btn) return;
        modeBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        GameState.mode = btn.dataset.mode;
        diffSelector.classList.toggle("hidden", GameState.mode !== "pvcpu");
        handleRestart();
    };

    const handleDiffChange = (e) => {
        const btn = e.target.closest(".btn--diff");
        if (!btn) return;
        diffBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        GameState.difficulty = btn.dataset.diff;
        handleRestart();
    };

    /* --- Initialization --- */

    const init = () => {
        UI.boardEl.addEventListener("click", handleCellClick);
        UI.boardEl.addEventListener("keydown", handleCellKeydown);
        restartBtn.addEventListener("click", handleRestart);
        resetBtn.addEventListener("click", handleReset);
        document
            .querySelector(".mode-selector")
            .addEventListener("click", handleModeChange);
        diffSelector.addEventListener("click", handleDiffChange);
        UI.themeToggle.addEventListener("click", UI.toggleTheme);

        // Restore saved UI state
        modeBtns.forEach((b) =>
            b.classList.toggle("active", b.dataset.mode === GameState.mode),
        );
        diffSelector.classList.toggle("hidden", GameState.mode !== "pvcpu");
        diffBtns.forEach((b) =>
            b.classList.toggle(
                "active",
                b.dataset.diff === GameState.difficulty,
            ),
        );
    };

    return { init };
})();

// ─── Bootstrap ───────────────────────────────────────────────
(() => {
    UI.initTheme();
    UI.renderBoard();
    UI.updateScores();
    Events.init();
})();

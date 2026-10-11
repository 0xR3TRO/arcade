/* MineSweep — R3TRO Arcade. Original code, MIT License. */
(() => {
    const LEVELS = {
        easy: { cols: 9, rows: 9, mines: 10 },
        medium: { cols: 16, rows: 16, mines: 40 },
        hard: { cols: 30, rows: 16, mines: 99 },
    };
    const LONG_PRESS_MS = 420;

    const fieldEl = document.getElementById("field");
    const minesEl = document.getElementById("mines");
    const timeEl = document.getElementById("time");
    const bestEl = document.getElementById("best");
    const statusEl = document.getElementById("status");
    const difficultyEl = document.getElementById("difficulty");
    const flagModeBtn = document.getElementById("flag-mode");

    let level;
    let cells; // { mine, open, flag, n, el }
    let started;
    let over;
    let opened;
    let flags;
    let startTime;
    let timer;
    let flagMode = false;

    const scoreId = () => `minesweep-${difficultyEl.value}`;
    const idx = (r, c) => r * level.cols + c;

    function neighbours(r, c) {
        const out = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (!dr && !dc) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < level.rows && nc >= 0 && nc < level.cols) out.push([nr, nc]);
            }
        }
        return out;
    }

    function showBest() {
        const best = window.R3TRO.best(scoreId());
        bestEl.textContent = best === null ? "—" : window.R3TRO.formatTime(best);
    }

    function newGame() {
        level = LEVELS[difficultyEl.value];
        cells = [];
        started = false;
        over = false;
        opened = 0;
        flags = 0;
        clearInterval(timer);
        timeEl.textContent = "0:00";
        minesEl.textContent = level.mines;
        statusEl.textContent = "";
        statusEl.className = "status";
        showBest();

        fieldEl.innerHTML = "";
        fieldEl.style.gridTemplateColumns = `repeat(${level.cols}, var(--cell))`;
        for (let r = 0; r < level.rows; r++) {
            for (let c = 0; c < level.cols; c++) {
                const el = document.createElement("button");
                el.className = "cell";
                el.type = "button";
                el.dataset.r = r;
                el.dataset.c = c;
                el.setAttribute("aria-label", `Row ${r + 1}, column ${c + 1}, hidden`);
                fieldEl.appendChild(el);
                cells.push({ mine: false, open: false, flag: false, n: 0, el });
            }
        }
    }

    function placeMines(safeR, safeC) {
        const safe = new Set([idx(safeR, safeC), ...neighbours(safeR, safeC).map(([r, c]) => idx(r, c))]);
        const pool = [];
        for (let i = 0; i < cells.length; i++) if (!safe.has(i)) pool.push(i);
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        pool.slice(0, level.mines).forEach((i) => (cells[i].mine = true));
        for (let r = 0; r < level.rows; r++) {
            for (let c = 0; c < level.cols; c++) {
                cells[idx(r, c)].n = neighbours(r, c).filter(([nr, nc]) => cells[idx(nr, nc)].mine).length;
            }
        }
        started = true;
        startTime = performance.now();
        timer = setInterval(tick, 250);
    }

    function tick() {
        timeEl.textContent = window.R3TRO.formatTime((performance.now() - startTime) / 1000);
    }

    function reveal(r, c) {
        const stack = [[r, c]];
        while (stack.length) {
            const [cr, cc] = stack.pop();
            const cell = cells[idx(cr, cc)];
            if (cell.open || cell.flag) continue;
            cell.open = true;
            opened++;
            cell.el.classList.add("open");
            cell.el.setAttribute("aria-label", `Row ${cr + 1}, column ${cc + 1}, ${cell.mine ? "mine" : cell.n || "empty"}`);
            if (cell.mine) continue;
            if (cell.n) {
                cell.el.textContent = cell.n;
                cell.el.classList.add(`n${cell.n}`);
            } else {
                for (const nb of neighbours(cr, cc)) stack.push(nb);
            }
        }
    }

    function open(r, c) {
        if (over) return;
        const cell = cells[idx(r, c)];
        if (!started) placeMines(r, c);
        if (cell.flag) return;
        if (cell.open) {
            chord(r, c);
            return;
        }
        if (cell.mine) {
            lose(cell);
            return;
        }
        reveal(r, c);
        checkWin();
    }

    function chord(r, c) {
        const cell = cells[idx(r, c)];
        if (!cell.n) return;
        const nbs = neighbours(r, c);
        const flagged = nbs.filter(([nr, nc]) => cells[idx(nr, nc)].flag).length;
        if (flagged !== cell.n) return;
        for (const [nr, nc] of nbs) {
            const nb = cells[idx(nr, nc)];
            if (nb.flag || nb.open) continue;
            if (nb.mine) {
                lose(nb);
                return;
            }
            reveal(nr, nc);
        }
        checkWin();
    }

    function toggleFlag(r, c) {
        if (over) return;
        const cell = cells[idx(r, c)];
        if (cell.open) return;
        cell.flag = !cell.flag;
        flags += cell.flag ? 1 : -1;
        cell.el.classList.toggle("flag", cell.flag);
        cell.el.setAttribute("aria-label", `Row ${r + 1}, column ${c + 1}, ${cell.flag ? "flagged" : "hidden"}`);
        minesEl.textContent = level.mines - flags;
    }

    function lose(hitCell) {
        over = true;
        clearInterval(timer);
        hitCell.el.classList.add("hit");
        for (const cell of cells) {
            if (cell.mine && !cell.flag) cell.el.classList.add("open", "mine");
            if (!cell.mine && cell.flag) cell.el.classList.add("wrong");
        }
        statusEl.textContent = "Boom! Try again.";
        statusEl.className = "status lose";
    }

    function checkWin() {
        if (opened !== cells.length - level.mines) return;
        over = true;
        clearInterval(timer);
        const seconds = Math.round((performance.now() - startTime) / 1000);
        for (const cell of cells) {
            if (cell.mine && !cell.flag) {
                cell.flag = true;
                cell.el.classList.add("flag");
            }
        }
        minesEl.textContent = "0";
        const result = window.R3TRO.submit(scoreId(), seconds, { lowerIsBetter: true });
        showBest();
        statusEl.textContent = `Cleared in ${window.R3TRO.formatTime(seconds)}${result.isNew ? " — new best!" : ""}`;
        statusEl.className = "status win";
    }

    // --- input -----------------------------------------------------------
    let press = null;

    fieldEl.addEventListener("contextmenu", (e) => e.preventDefault());

    fieldEl.addEventListener("pointerdown", (e) => {
        const el = e.target.closest(".cell");
        if (!el) return;
        const r = Number(el.dataset.r);
        const c = Number(el.dataset.c);
        if (e.button === 2 || (e.button === 0 && e.ctrlKey)) {
            toggleFlag(r, c); // right-click, or Ctrl+click on a Mac trackpad
            return;
        }
        if (e.button !== 0) return;
        press = { r, c, long: false };
        if (e.pointerType !== "mouse") {
            press.timer = setTimeout(() => {
                press.long = true;
                toggleFlag(r, c);
                if (navigator.vibrate) navigator.vibrate(25);
            }, LONG_PRESS_MS);
        }
    });

    fieldEl.addEventListener("pointerup", (e) => {
        if (!press) return;
        clearTimeout(press.timer);
        const el = e.target.closest(".cell");
        const same = el && Number(el.dataset.r) === press.r && Number(el.dataset.c) === press.c;
        if (same && !press.long) {
            if (flagMode && !cells[idx(press.r, press.c)].open) toggleFlag(press.r, press.c);
            else open(press.r, press.c);
        }
        press = null;
    });

    fieldEl.addEventListener("pointercancel", () => {
        if (press) clearTimeout(press.timer);
        press = null;
    });

    fieldEl.addEventListener("keydown", (e) => {
        const el = e.target.closest(".cell");
        if (!el) return;
        const r = Number(el.dataset.r);
        const c = Number(el.dataset.c);
        const move = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
        if (move) {
            e.preventDefault();
            const nr = Math.max(0, Math.min(level.rows - 1, r + move[0]));
            const nc = Math.max(0, Math.min(level.cols - 1, c + move[1]));
            cells[idx(nr, nc)].el.focus();
        } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open(r, c);
        } else if (e.key === "f" || e.key === "F") {
            toggleFlag(r, c);
        }
    });

    flagModeBtn.addEventListener("click", () => {
        flagMode = !flagMode;
        flagModeBtn.setAttribute("aria-pressed", String(flagMode));
    });
    document.getElementById("new-game").addEventListener("click", newGame);
    difficultyEl.addEventListener("change", newGame);

    newGame();
})();

/* Sudoku — R3TRO Arcade. Original code, MIT License. */
(() => {
    const CLUES = { easy: 40, medium: 32, hard: 25 };

    const gridEl = document.getElementById("grid");
    const padEl = document.getElementById("pad");
    const timeEl = document.getElementById("time");
    const mistakesEl = document.getElementById("mistakes");
    const bestEl = document.getElementById("best");
    const statusEl = document.getElementById("status");
    const difficultyEl = document.getElementById("difficulty");
    const notesBtn = document.getElementById("notes");

    let puzzle; // 81 numbers, 0 = empty
    let solution;
    let values;
    let notes; // array of Set
    let given;
    let hinted;
    let selected = 0;
    let notesMode = false;
    let mistakes = 0;
    let startTime;
    let timer;
    let solved = false;
    const cellEls = [];

    // ---------- solver / generator ----------
    const row = (i) => Math.floor(i / 9);
    const col = (i) => i % 9;
    const box = (i) => Math.floor(row(i) / 3) * 3 + Math.floor(col(i) / 3);
    const PEERS = Array.from({ length: 81 }, (_, i) => {
        const set = new Set();
        for (let j = 0; j < 81; j++) {
            if (j !== i && (row(j) === row(i) || col(j) === col(i) || box(j) === box(i))) set.add(j);
        }
        return [...set];
    });

    function shuffled(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    /** Count solutions (stops at `limit`). Fills `grid` with the first solution when `fill` is true. */
    function countSolutions(grid, limit, fill = false, randomize = false) {
        const g = [...grid];
        const rows = new Array(9).fill(0);
        const cols = new Array(9).fill(0);
        const boxes = new Array(9).fill(0);
        for (let i = 0; i < 81; i++) {
            if (g[i]) {
                const bit = 1 << g[i];
                rows[row(i)] |= bit;
                cols[col(i)] |= bit;
                boxes[box(i)] |= bit;
            }
        }
        let count = 0;
        let first = null;
        function search() {
            let best = -1;
            let bestMask = 0;
            let bestCount = 10;
            for (let i = 0; i < 81; i++) {
                if (g[i]) continue;
                const used = rows[row(i)] | cols[col(i)] | boxes[box(i)];
                const mask = ~used & 0x3fe;
                let n = 0;
                for (let m = mask; m; m &= m - 1) n++;
                if (n < bestCount) {
                    best = i;
                    bestMask = mask;
                    bestCount = n;
                    if (n <= 1) break;
                }
            }
            if (best === -1) {
                count++;
                if (!first) first = [...g];
                return count >= limit;
            }
            let digits = [];
            for (let d = 1; d <= 9; d++) if (bestMask & (1 << d)) digits.push(d);
            if (randomize) digits = shuffled(digits);
            for (const d of digits) {
                const bit = 1 << d;
                g[best] = d;
                rows[row(best)] |= bit;
                cols[col(best)] |= bit;
                boxes[box(best)] |= bit;
                if (search()) return true;
                g[best] = 0;
                rows[row(best)] &= ~bit;
                cols[col(best)] &= ~bit;
                boxes[box(best)] &= ~bit;
            }
            return false;
        }
        search();
        if (fill && first) grid.splice(0, 81, ...first);
        return count;
    }

    function generate(clues) {
        const full = new Array(81).fill(0);
        countSolutions(full, 1, true, true);
        const p = [...full];
        let filled = 81;
        for (const i of shuffled([...Array(81).keys()])) {
            if (filled <= clues) break;
            const backup = p[i];
            p[i] = 0;
            if (countSolutions(p, 2) !== 1) p[i] = backup;
            else filled--;
        }
        return { puzzle: p, solution: full };
    }

    // ---------- game ----------
    const scoreId = () => `sudoku-${difficultyEl.value}`;

    function showBest() {
        const best = window.R3TRO.best(scoreId());
        bestEl.textContent = best === null ? "—" : window.R3TRO.formatTime(best);
    }

    function newGame() {
        statusEl.textContent = "Generating…";
        // let the browser paint the message before the (short) generation work
        setTimeout(() => {
            ({ puzzle, solution } = generate(CLUES[difficultyEl.value]));
            values = [...puzzle];
            given = puzzle.map((v) => v !== 0);
            hinted = new Array(81).fill(false);
            notes = Array.from({ length: 81 }, () => new Set());
            mistakes = 0;
            solved = false;
            mistakesEl.textContent = "0";
            statusEl.textContent = "";
            selected = puzzle.indexOf(0);
            clearInterval(timer);
            startTime = performance.now();
            timeEl.textContent = "0:00";
            timer = setInterval(() => {
                timeEl.textContent = window.R3TRO.formatTime((performance.now() - startTime) / 1000);
            }, 500);
            showBest();
            render();
            cellEls[selected].focus();
        }, 20);
    }

    function render() {
        const sel = values[selected];
        for (let i = 0; i < 81; i++) {
            const el = cellEls[i];
            const v = values[i];
            el.className = "cell";
            if (given[i]) el.classList.add("given");
            if (hinted[i]) el.classList.add("hinted");
            if (PEERS[selected].includes(i)) el.classList.add("peer");
            if (sel && v === sel) el.classList.add("same");
            if (i === selected) el.classList.add("selected");
            if (v && !given[i] && v !== solution[i]) el.classList.add("error");
            if (v) {
                el.textContent = v;
            } else if (notes[i].size) {
                el.innerHTML = `<span class="notes">${[1, 2, 3, 4, 5, 6, 7, 8, 9]
                    .map((n) => `<span>${notes[i].has(n) ? n : ""}</span>`)
                    .join("")}</span>`;
            } else {
                el.textContent = "";
            }
            el.setAttribute("aria-label", `Row ${row(i) + 1}, column ${col(i) + 1}${v ? `, ${v}` : ", empty"}`);
        }
        const counts = new Array(10).fill(0);
        values.forEach((v, i) => {
            if (v && v === solution[i]) counts[v]++;
        });
        padEl.querySelectorAll("[data-n]").forEach((b) => b.classList.toggle("done", counts[b.dataset.n] >= 9));
    }

    function enter(n) {
        if (solved || given[selected] || hinted[selected]) return;
        if (notesMode) {
            if (values[selected]) return;
            const set = notes[selected];
            if (set.has(n)) set.delete(n);
            else set.add(n);
        } else {
            values[selected] = values[selected] === n ? 0 : n;
            notes[selected].clear();
            if (values[selected] && values[selected] !== solution[selected]) {
                mistakes++;
                mistakesEl.textContent = mistakes;
            } else if (values[selected]) {
                for (const p of PEERS[selected]) notes[p].delete(n);
            }
        }
        render();
        checkWin();
    }

    function erase() {
        if (solved || given[selected] || hinted[selected]) return;
        values[selected] = 0;
        notes[selected].clear();
        render();
    }

    function hint() {
        if (solved) return;
        let i = selected;
        if (given[i] || values[i] === solution[i]) {
            i = values.findIndex((v, k) => v !== solution[k]);
            if (i < 0) return;
        }
        values[i] = solution[i];
        hinted[i] = true;
        notes[i].clear();
        for (const p of PEERS[i]) notes[p].delete(solution[i]);
        selected = i;
        render();
        checkWin();
    }

    function checkWin() {
        if (!values.every((v, i) => v === solution[i])) return;
        solved = true;
        clearInterval(timer);
        const seconds = Math.round((performance.now() - startTime) / 1000);
        const used = hinted.filter(Boolean).length;
        if (used === 0) {
            const result = window.R3TRO.submit(scoreId(), seconds, { lowerIsBetter: true });
            showBest();
            statusEl.textContent = `Solved in ${window.R3TRO.formatTime(seconds)}${result.isNew ? " — new best!" : ""}`;
        } else {
            statusEl.textContent = `Solved in ${window.R3TRO.formatTime(seconds)} with ${used} hint${used > 1 ? "s" : ""} (best times count only without hints)`;
        }
    }

    function select(i) {
        selected = i;
        render();
        cellEls[i].focus();
    }

    // ---------- build UI ----------
    for (let i = 0; i < 81; i++) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "cell";
        el.dataset.i = i;
        el.addEventListener("click", () => select(i));
        gridEl.appendChild(el);
        cellEls.push(el);
    }

    padEl.addEventListener("click", (e) => {
        const b = e.target.closest("[data-n]");
        if (b) enter(Number(b.dataset.n));
    });
    notesBtn.addEventListener("click", () => {
        notesMode = !notesMode;
        notesBtn.setAttribute("aria-pressed", String(notesMode));
    });
    document.getElementById("erase").addEventListener("click", erase);
    document.getElementById("hint").addEventListener("click", hint);
    document.getElementById("new-game").addEventListener("click", newGame);
    difficultyEl.addEventListener("change", newGame);

    window.addEventListener("keydown", (e) => {
        if (e.target.tagName === "SELECT") return;
        if (/^[1-9]$/.test(e.key)) {
            enter(Number(e.key));
        } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
            erase();
        } else if (e.key === "n" || e.key === "N") {
            notesBtn.click();
        } else if (e.key === "h" || e.key === "H") {
            hint();
        } else {
            const move = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[e.key];
            if (!move) return;
            e.preventDefault();
            let next = selected + move;
            if (move === -1 && col(selected) === 0) next = selected + 8;
            if (move === 1 && col(selected) === 8) next = selected - 8;
            select((next + 81) % 81);
        }
    });

    newGame();
})();

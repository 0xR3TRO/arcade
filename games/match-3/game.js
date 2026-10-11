/* Match-3 — R3TRO Arcade. Original code and graphics, MIT License. */
(() => {
    const { setupCanvas, startLoop, roundRect, pointerPos } = window.R3TROCanvas;
    const N = 8;
    const S = 60; // cell size
    const PAD = 8;
    const W = N * S + PAD * 2;
    const H = W;
    const MOVES = 30;
    const TYPES = [
        { name: "ruby", color: "#ff5d6c", dark: "#b8293a" },
        { name: "sapphire", color: "#3ad7ff", dark: "#167ea3" },
        { name: "emerald", color: "#39ff88", dark: "#159a4f" },
        { name: "topaz", color: "#ffd23f", dark: "#b88b00" },
        { name: "amethyst", color: "#b783ff", dark: "#6f3fc0" },
        { name: "amber", color: "#ff9a3c", dark: "#b85a10" },
    ];

    const canvas = document.getElementById("board");
    const ctx = setupCanvas(canvas, W, H);
    const overlay = document.getElementById("overlay");
    const overlayTitle = document.getElementById("overlay-title");
    const overlayText = document.getElementById("overlay-text");
    const startBtn = document.getElementById("start");
    const scoreEl = document.getElementById("score");
    const movesEl = document.getElementById("moves");
    const bestEl = document.getElementById("best");

    let grid; // grid[r][c] = gem | null
    let state = "ready"; // ready | idle | swapping | unswapping | clearing | falling | over
    let score = 0;
    let moves = MOVES;
    let combo = 0;
    let selected = null;
    let pendingSwap = null;
    let drag = null;
    let popups = [];
    let time = 0;

    bestEl.textContent = window.R3TRO.best("match-3") ?? 0;

    const randType = () => Math.floor(Math.random() * TYPES.length);
    const cellX = (c) => PAD + c * S;
    const cellY = (r) => PAD + r * S;

    function makeGem(type, r, c, startY) {
        return { type, x: cellX(c), y: startY ?? cellY(r), scale: 1, removing: false };
    }

    function newBoard() {
        do {
            grid = [];
            for (let r = 0; r < N; r++) {
                grid.push([]);
                for (let c = 0; c < N; c++) {
                    let t;
                    do {
                        t = randType();
                    } while (
                        (c >= 2 && grid[r][c - 1].type === t && grid[r][c - 2].type === t) ||
                        (r >= 2 && grid[r - 1][c].type === t && grid[r - 2][c].type === t)
                    );
                    grid[r].push(makeGem(t, r, c, cellY(r) - H));
                }
            }
        } while (!hasPossibleMove());
    }

    function findMatches() {
        const marked = new Set();
        const groups = [];
        const scan = (horizontal) => {
            for (let a = 0; a < N; a++) {
                let run = 1;
                for (let b = 1; b <= N; b++) {
                    const cur = b < N ? (horizontal ? grid[a][b] : grid[b][a]) : null;
                    const prev = horizontal ? grid[a][b - 1] : grid[b - 1][a];
                    if (cur && prev && cur.type === prev.type) {
                        run++;
                    } else {
                        if (run >= 3) {
                            const cells = [];
                            for (let k = b - run; k < b; k++) cells.push(horizontal ? [a, k] : [k, a]);
                            groups.push(cells);
                            cells.forEach(([r, c]) => marked.add(r * N + c));
                        }
                        run = 1;
                    }
                }
            }
        };
        scan(true);
        scan(false);
        return { marked, groups };
    }

    function swapCells(a, b) {
        const t = grid[a.r][a.c];
        grid[a.r][a.c] = grid[b.r][b.c];
        grid[b.r][b.c] = t;
    }

    function hasPossibleMove() {
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                for (const [dr, dc] of [[0, 1], [1, 0]]) {
                    const r2 = r + dr;
                    const c2 = c + dc;
                    if (r2 >= N || c2 >= N) continue;
                    swapCells({ r, c }, { r: r2, c: c2 });
                    const ok = findMatches().marked.size > 0;
                    swapCells({ r, c }, { r: r2, c: c2 });
                    if (ok) return true;
                }
            }
        }
        return false;
    }

    function trySwap(a, b) {
        if (state !== "idle") return;
        if (Math.abs(a.r - b.r) + Math.abs(a.c - b.c) !== 1) return;
        selected = null;
        swapCells(a, b);
        pendingSwap = { a, b };
        state = "swapping";
    }

    function animationsDone() {
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                const g = grid[r][c];
                if (!g) continue;
                if (g.removing || Math.abs(g.x - cellX(c)) > 0.5 || Math.abs(g.y - cellY(r)) > 0.5) return false;
            }
        }
        return true;
    }

    function startClearing() {
        const { marked, groups } = findMatches();
        if (!marked.size) return false;
        combo++;
        let points = 0;
        for (const cells of groups) points += cells.length * 10 + Math.max(0, cells.length - 3) * 20;
        points *= combo;
        score += points;
        scoreEl.textContent = score;
        // popup at the centre of the first group
        const [pr, pc] = groups[0][Math.floor(groups[0].length / 2)];
        popups.push({ x: cellX(pc) + S / 2, y: cellY(pr) + S / 2, text: `+${points}${combo > 1 ? ` x${combo}` : ""}`, t: 0 });
        for (const key of marked) {
            const g = grid[Math.floor(key / N)][key % N];
            g.removing = true;
        }
        state = "clearing";
        return true;
    }

    function collapse() {
        for (let c = 0; c < N; c++) {
            let write = N - 1;
            for (let r = N - 1; r >= 0; r--) {
                const g = grid[r][c];
                if (g && !g.removing) {
                    grid[write][c] = g;
                    if (write !== r) grid[r][c] = null;
                    write--;
                } else if (g) {
                    grid[r][c] = null;
                }
            }
            let spawnIndex = 0;
            for (let r = write; r >= 0; r--) {
                spawnIndex++;
                grid[r][c] = makeGem(randType(), r, c, PAD - spawnIndex * S);
            }
        }
        state = "falling";
    }

    function settle() {
        if (startClearing()) return;
        combo = 0;
        if (moves <= 0) {
            endGame();
            return;
        }
        if (!hasPossibleMove()) {
            popups.push({ x: W / 2, y: H / 2, text: "SHUFFLE", t: 0 });
            newBoard();
            state = "falling";
            return;
        }
        state = "idle";
    }

    function update(dt) {
        time += dt;
        let removingDone = true;
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                const g = grid[r][c];
                if (!g) continue;
                const tx = cellX(c);
                const ty = cellY(r);
                const sp = (state === "falling" ? 1100 : 520) * dt;
                g.x += Math.sign(tx - g.x) * Math.min(Math.abs(tx - g.x), sp);
                g.y += Math.sign(ty - g.y) * Math.min(Math.abs(ty - g.y), sp);
                if (g.removing) {
                    g.scale = Math.max(0, g.scale - dt * 6);
                    if (g.scale > 0) removingDone = false;
                }
            }
        }
        popups = popups.filter((p) => (p.t += dt) < 0.9);

        if (state === "swapping" && animationsDone()) {
            if (findMatches().marked.size) {
                moves--;
                movesEl.textContent = moves;
                combo = 0;
                startClearing();
            } else {
                swapCells(pendingSwap.a, pendingSwap.b);
                state = "unswapping";
            }
        } else if (state === "unswapping" && animationsDone()) {
            state = "idle";
        } else if (state === "clearing" && removingDone) {
            collapse();
        } else if (state === "falling" && animationsDone()) {
            settle();
        }
    }

    function drawShape(type, cx, cy, r) {
        ctx.beginPath();
        switch (type) {
            case 0: // circle
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                break;
            case 1: // diamond
                ctx.moveTo(cx, cy - r * 1.1);
                ctx.lineTo(cx + r, cy);
                ctx.lineTo(cx, cy + r * 1.1);
                ctx.lineTo(cx - r, cy);
                break;
            case 2: // rounded square
                roundRect(ctx, cx - r * 0.88, cy - r * 0.88, r * 1.76, r * 1.76, r * 0.35);
                return;
            case 3: // triangle
                ctx.moveTo(cx, cy - r * 1.05);
                ctx.lineTo(cx + r * 1.05, cy + r * 0.8);
                ctx.lineTo(cx - r * 1.05, cy + r * 0.8);
                break;
            case 4: // hexagon
                for (let i = 0; i < 6; i++) {
                    const a = Math.PI / 6 + (i * Math.PI) / 3;
                    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
                }
                break;
            default: // star
                for (let i = 0; i < 10; i++) {
                    const a = -Math.PI / 2 + (i * Math.PI) / 5;
                    const rr = i % 2 ? r * 0.48 : r * 1.05;
                    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
                }
        }
        ctx.closePath();
    }

    function drawGem(g, highlight) {
        const t = TYPES[g.type];
        const cx = g.x + S / 2;
        const cy = g.y + S / 2;
        const r = S * 0.34 * g.scale * (highlight ? 1.08 + Math.sin(time * 8) * 0.04 : 1);
        if (r <= 0) return;
        const grad = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.5, r * 0.1, cx, cy, r * 1.2);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.25, t.color);
        grad.addColorStop(1, t.dark);
        ctx.fillStyle = grad;
        drawShape(g.type, cx, cy, r);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function render() {
        ctx.fillStyle = "#0e1622";
        ctx.fillRect(0, 0, W, H);
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                ctx.fillStyle = (r + c) % 2 ? "#142030" : "#18263a";
                roundRect(ctx, cellX(c) + 2, cellY(r) + 2, S - 4, S - 4, 10);
                ctx.fill();
            }
        }
        if (selected) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            roundRect(ctx, cellX(selected.c) + 3, cellY(selected.r) + 3, S - 6, S - 6, 10);
            ctx.stroke();
        }
        ctx.save();
        ctx.beginPath();
        ctx.rect(PAD, PAD, N * S, N * S);
        ctx.clip();
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                const g = grid[r][c];
                if (g) drawGem(g, selected && selected.r === r && selected.c === c);
            }
        }
        ctx.restore();
        ctx.textAlign = "center";
        ctx.font = '13px "Press Start 2P", monospace';
        for (const p of popups) {
            ctx.globalAlpha = 1 - p.t / 0.9;
            ctx.fillStyle = "#ffffff";
            ctx.fillText(p.text, p.x, p.y - p.t * 40);
        }
        ctx.globalAlpha = 1;
    }

    function cellAt(e) {
        const { x, y } = pointerPos(canvas, e, W, H);
        const c = Math.floor((x - PAD) / S);
        const r = Math.floor((y - PAD) / S);
        if (r < 0 || r >= N || c < 0 || c >= N) return null;
        return { r, c, x, y };
    }

    function start() {
        score = 0;
        moves = MOVES;
        combo = 0;
        selected = null;
        popups = [];
        scoreEl.textContent = "0";
        movesEl.textContent = MOVES;
        newBoard();
        state = "falling";
        overlay.hidden = true;
    }

    function endGame() {
        state = "over";
        const result = window.R3TRO.submit("match-3", score);
        bestEl.textContent = result.best;
        overlayTitle.textContent = result.isNew && score > 0 ? "NEW BEST!" : "OUT OF MOVES";
        overlayText.innerHTML = `<span class="big">${score}</span>Best: ${result.best}`;
        startBtn.textContent = "Play again";
        overlay.hidden = false;
    }

    canvas.addEventListener("pointerdown", (e) => {
        if (state !== "idle") return;
        const cell = cellAt(e);
        if (!cell) return;
        canvas.setPointerCapture(e.pointerId);
        drag = { start: cell, moved: false };
    });
    canvas.addEventListener("pointermove", (e) => {
        if (!drag || drag.moved || state !== "idle") return;
        const { x, y } = pointerPos(canvas, e, W, H);
        const dx = x - drag.start.x;
        const dy = y - drag.start.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < S * 0.35) return;
        drag.moved = true;
        const target = Math.abs(dx) > Math.abs(dy)
            ? { r: drag.start.r, c: drag.start.c + Math.sign(dx) }
            : { r: drag.start.r + Math.sign(dy), c: drag.start.c };
        if (target.r >= 0 && target.r < N && target.c >= 0 && target.c < N) trySwap(drag.start, target);
    });
    canvas.addEventListener("pointerup", (e) => {
        if (!drag) return;
        const wasDrag = drag.moved;
        drag = null;
        if (wasDrag || state !== "idle") return;
        const cell = cellAt(e);
        if (!cell) return;
        if (selected && Math.abs(selected.r - cell.r) + Math.abs(selected.c - cell.c) === 1) {
            trySwap(selected, cell);
        } else if (selected && selected.r === cell.r && selected.c === cell.c) {
            selected = null;
        } else {
            selected = { r: cell.r, c: cell.c };
        }
    });
    startBtn.addEventListener("click", start);
    window.addEventListener("keydown", (e) => {
        if (e.code === "KeyN") start();
    });

    newBoard();
    state = "ready";
    startLoop(update, render);
})();

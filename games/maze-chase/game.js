/* Maze Chase — R3TRO Arcade. Original code, maze and graphics, MIT License. */
(() => {
    const { setupCanvas, startLoop, roundRect, pointerPos } = window.R3TROCanvas;

    // # wall · X void · . dot · o power core · space empty · P player · H hunter home · - home door
    const MAZE = [
        "#####################",
        "#o........#........o#",
        "#.###.###.#.###.###.#",
        "#.#.....#...#.....#.#",
        "#.#.###.#####.###.#.#",
        "#.....#.......#.....#",
        "###.#.#.##-##.#.#.###",
        "XX#.#...#HHH#...#.#XX",
        "###.###.#####.###.###",
        "   .......P.......   ",
        "###.###.#####.###.###",
        "XX#.#.....#.....#.#XX",
        "###.#.###.#.###.#.###",
        "#.........#.........#",
        "#.###.###.#.###.###.#",
        "#...#...........#...#",
        "###.#.#.#####.#.#.###",
        "#.....#...#...#.....#",
        "#.#######.#.#######.#",
        "#o.................o#",
        "#####################",
    ];
    const ROWS = MAZE.length;
    const COLS = MAZE[0].length;
    const T = 24;
    const W = COLS * T;
    const H = ROWS * T;
    const DOOR = { r: 6, c: 10 };
    const EXIT = { r: 5, c: 10 };
    const HOME = { r: 7, c: 10 };
    const HOME_SLOTS = [{ r: 7, c: 10 }, { r: 7, c: 9 }, { r: 7, c: 11 }, { r: 7, c: 10 }];
    const CORNERS = [{ r: -2, c: COLS + 1 }, { r: -2, c: -2 }, { r: ROWS + 1, c: -2 }, { r: ROWS + 1, c: COLS + 1 }];
    const HUNTER_COLORS = ["#ff5d6c", "#ff4fd8", "#ff9a3c", "#b783ff"];
    const DIRS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
    const NONE = { x: 0, y: 0 };

    const canvas = document.getElementById("board");
    const ctx = setupCanvas(canvas, W, H);
    const overlay = document.getElementById("overlay");
    const overlayTitle = document.getElementById("overlay-title");
    const overlayText = document.getElementById("overlay-text");
    const startBtn = document.getElementById("start");
    const scoreEl = document.getElementById("score");
    const livesEl = document.getElementById("lives");
    const levelEl = document.getElementById("level");
    const bestEl = document.getElementById("best");

    let state = "ready"; // ready | starting | playing | dying | cleared | paused | over
    let pausedFrom = null;
    let stateTime = 0;
    let time = 0;
    let level = 1;
    let score = 0;
    let lives = 3;
    let extraLifeGiven = false;
    let dots;
    let dotsLeft;
    let player;
    let hunters;
    let frightTime = 0;
    let huntersEaten = 0;
    let modeClock = 0;
    let popups = [];
    let mazeLayer;
    let mazeLayerFlash;

    bestEl.textContent = window.R3TRO.best("maze-chase") ?? 0;

    // ---------- grid helpers ----------
    const wrapC = (c) => ((c % COLS) + COLS) % COLS;
    function tile(r, c) {
        if (r < 0 || r >= ROWS) return "#";
        return MAZE[r][wrapC(c)];
    }
    function passable(r, c, allowHome) {
        const ch = tile(r, c);
        if (ch === "#" || ch === "X") return false;
        if ((ch === "H" || ch === "-") && !allowHome) return false;
        return true;
    }
    const same = (a, b) => a.x === b.x && a.y === b.y;
    const opposite = (a, b) => a.x === -b.x && a.y === -b.y && (a.x || a.y);

    /** First step of the shortest path from (r,c) to target (BFS, wraps through the tunnel). */
    function bfsDir(r, c, target, allowHome) {
        const key = (rr, cc) => rr * COLS + cc;
        const seen = new Map([[key(r, c), null]]);
        const queue = [[r, c]];
        while (queue.length) {
            const [cr, cc] = queue.shift();
            if (cr === target.r && cc === target.c) {
                let k = key(cr, cc);
                let first = null;
                while (seen.get(k)) {
                    first = seen.get(k);
                    k = first.from;
                }
                return first ? first.dir : NONE;
            }
            for (const d of Object.values(DIRS)) {
                const nr = cr + d.y;
                const nc = wrapC(cc + d.x);
                const k = key(nr, nc);
                if (seen.has(k) || !passable(nr, nc, allowHome)) continue;
                seen.set(k, { from: key(cr, cc), dir: d });
                queue.push([nr, nc]);
            }
        }
        return NONE;
    }

    // ---------- setup ----------
    function buildDots() {
        dots = MAZE.map((row) => [...row].map((ch) => (ch === "." ? 1 : ch === "o" ? 2 : 0)));
        dotsLeft = dots.flat().filter(Boolean).length;
    }

    function speedScale() {
        return Math.min(1.35, 1 + (level - 1) * 0.06);
    }

    function placeActors() {
        player = { r: 9, c: 10, dir: { ...DIRS.left }, want: { ...DIRS.left }, t: 0, mouth: 0 };
        hunters = HUNTER_COLORS.map((color, i) => ({
            i,
            color,
            r: HOME_SLOTS[i].r,
            c: HOME_SLOTS[i].c,
            dir: { ...NONE },
            t: 0,
            mode: i === 0 ? "leave" : "home",
            releaseAt: i * Math.max(1.2, 3 - level * 0.3),
            frightened: false,
            wander: { r: 1, c: 1 },
            wanderAt: 0,
        }));
        if (hunters[0].mode === "leave") {
            hunters[0].r = EXIT.r;
            hunters[0].c = EXIT.c;
            hunters[0].mode = "roam";
            hunters[0].dir = { ...DIRS.left };
        }
        frightTime = 0;
        modeClock = 0;
    }

    function setState(s) {
        state = s;
        stateTime = 0;
    }

    function startGame() {
        level = 1;
        score = 0;
        lives = 3;
        extraLifeGiven = false;
        popups = [];
        scoreEl.textContent = "0";
        livesEl.textContent = lives;
        levelEl.textContent = level;
        buildDots();
        placeActors();
        overlay.hidden = true;
        loop.resume();
        setState("starting");
    }

    function addScore(points, at) {
        score += points;
        scoreEl.textContent = score;
        if (!extraLifeGiven && score >= 10000) {
            extraLifeGiven = true;
            lives++;
            livesEl.textContent = lives;
            popups.push({ x: W / 2, y: H / 2, text: "EXTRA LIFE", t: 0 });
        }
        if (at) popups.push({ ...at, text: String(points), t: 0 });
    }

    // ---------- movement ----------
    function position(e) {
        return { x: e.c + e.dir.x * e.t, y: e.r + e.dir.y * e.t };
    }

    function advance(e, speed, dt, onCenter) {
        let dist = speed * dt;
        let guard = 0;
        while (dist > 0 && guard++ < 8) {
            if (!e.dir.x && !e.dir.y) {
                onCenter(e);
                if (!e.dir.x && !e.dir.y) return;
            }
            const remaining = 1 - e.t;
            if (dist < remaining) {
                e.t += dist;
                return;
            }
            dist -= remaining;
            e.c = wrapC(e.c + e.dir.x);
            e.r += e.dir.y;
            e.t = 0;
            onCenter(e);
        }
    }

    function playerCenter(p) {
        eatAt(p.r, p.c);
        if ((p.want.x || p.want.y) && passable(p.r + p.want.y, p.c + p.want.x, false)) {
            p.dir = { ...p.want };
        } else if (!passable(p.r + p.dir.y, p.c + p.dir.x, false)) {
            p.dir = { ...NONE };
        }
    }

    function setWant(d) {
        if (!player || (state !== "playing" && state !== "starting")) return;
        player.want = { ...d };
        // reversing is allowed at any time
        if (opposite(d, player.dir) && player.t > 0) {
            player.c = wrapC(player.c + player.dir.x);
            player.r += player.dir.y;
            player.t = 1 - player.t;
            player.dir = { ...d };
        }
    }

    function eatAt(r, c) {
        const v = dots[r]?.[wrapC(c)];
        if (!v) return;
        dots[r][wrapC(c)] = 0;
        dotsLeft--;
        if (v === 1) {
            addScore(10);
        } else {
            addScore(50);
            frightTime = Math.max(2.5, 7 - (level - 1) * 0.6);
            huntersEaten = 0;
            for (const h of hunters) {
                if (h.mode === "roam") {
                    h.frightened = true;
                    if (h.t > 0) {
                        h.c = wrapC(h.c + h.dir.x);
                        h.r += h.dir.y;
                        h.t = 1 - h.t;
                    }
                    h.dir = { x: -h.dir.x, y: -h.dir.y };
                    // at a tile centre the reversed way may be a wall — let the hunter re-decide
                    if (h.t === 0 && !passable(h.r + h.dir.y, h.c + h.dir.x, false)) h.dir = { ...NONE };
                }
            }
        }
        if (dotsLeft === 0) setState("cleared");
    }

    function scattering() {
        // 6 s scatter, then 20 s chase, repeating
        return modeClock % 26 < 6;
    }

    function hunterTarget(h) {
        if (h.mode === "leave") return EXIT;
        if (h.mode === "eaten") return HOME;
        if (scattering()) return CORNERS[h.i];
        const p = player;
        switch (h.i) {
            case 0:
                return { r: p.r, c: p.c };
            case 1:
                return { r: p.r + p.dir.y * 3, c: p.c + p.dir.x * 3 };
            case 2: {
                const d = Math.hypot(p.r - h.r, p.c - h.c);
                return d > 7 ? { r: p.r, c: p.c } : CORNERS[2];
            }
            default:
                if (time > h.wanderAt || (h.r === h.wander.r && h.c === h.wander.c)) {
                    h.wander = { r: 1 + Math.floor(Math.random() * (ROWS - 2)), c: 1 + Math.floor(Math.random() * (COLS - 2)) };
                    h.wanderAt = time + 4;
                }
                return h.wander;
        }
    }

    function hunterCenter(h) {
        if (h.mode === "leave" && h.r === EXIT.r && h.c === EXIT.c) {
            h.mode = "roam";
            h.dir = { ...(Math.random() < 0.5 ? DIRS.left : DIRS.right) };
            return;
        }
        if (h.mode === "eaten" && h.r === HOME.r && h.c === HOME.c) {
            h.mode = "leave";
            h.frightened = false;
        }
        if (h.mode === "leave" || h.mode === "eaten") {
            h.dir = { ...bfsDir(h.r, h.c, hunterTarget(h), true) };
            return;
        }
        const options = Object.values(DIRS).filter(
            (d) => !opposite(d, h.dir) && passable(h.r + d.y, h.c + d.x, false),
        );
        if (!options.length) {
            h.dir = { x: -h.dir.x, y: -h.dir.y };
            return;
        }
        if (h.frightened) {
            h.dir = { ...options[Math.floor(Math.random() * options.length)] };
            return;
        }
        const target = hunterTarget(h);
        let best = options[0];
        let bestD = Infinity;
        for (const d of options) {
            const dist = Math.hypot(h.r + d.y - target.r, h.c + d.x - target.c);
            if (dist < bestD) {
                bestD = dist;
                best = d;
            }
        }
        h.dir = { ...best };
    }

    function hunterSpeed(h) {
        const base = 6.6 * speedScale();
        if (h.mode === "eaten") return 15;
        if (h.mode === "leave") return 4;
        if (h.frightened) return 4.2;
        if (h.r === 9 && (h.c <= 2 || h.c >= COLS - 3)) return 3.8;
        return base;
    }

    function distance(a, b) {
        const pa = position(a);
        const pb = position(b);
        let dx = Math.abs(pa.x - pb.x);
        dx = Math.min(dx, COLS - dx);
        return Math.hypot(dx, pa.y - pb.y);
    }

    // ---------- update ----------
    function update(dt) {
        time += dt;
        stateTime += dt;
        popups = popups.filter((p) => (p.t += dt) < 1);

        if (state === "starting") {
            if (stateTime > 1.6) setState("playing");
            return;
        }
        if (state === "dying") {
            if (stateTime > 1.4) {
                if (lives <= 0) {
                    endGame();
                } else {
                    placeActors();
                    setState("starting");
                }
            }
            return;
        }
        if (state === "cleared") {
            if (stateTime > 1.8) {
                level++;
                levelEl.textContent = level;
                buildDots();
                placeActors();
                setState("starting");
            }
            return;
        }
        if (state !== "playing") return;

        if (frightTime > 0) {
            frightTime -= dt;
            if (frightTime <= 0) hunters.forEach((h) => (h.frightened = false));
        } else {
            modeClock += dt;
        }

        player.mouth += dt * 10;
        advance(player, 7.4 * speedScale(), dt, playerCenter);
        if (state !== "playing") return; // level may have been cleared

        for (const h of hunters) {
            if (h.mode === "home") {
                if (stateTime > h.releaseAt) {
                    h.mode = "leave";
                    h.t = 0;
                    h.dir = { ...NONE };
                }
                continue;
            }
            advance(h, hunterSpeed(h), dt, hunterCenter);
        }

        for (const h of hunters) {
            if (h.mode !== "roam" || distance(player, h) > 0.62) continue;
            if (h.frightened) {
                h.frightened = false;
                h.mode = "eaten";
                huntersEaten++;
                const pos = position(h);
                addScore(200 * 2 ** (huntersEaten - 1), { x: (pos.x + 0.5) * T, y: (pos.y + 0.5) * T });
            } else {
                lives--;
                livesEl.textContent = Math.max(0, lives);
                setState("dying");
                return;
            }
        }
    }

    function endGame() {
        setState("over");
        const result = window.R3TRO.submit("maze-chase", score);
        bestEl.textContent = result.best;
        overlayTitle.textContent = result.isNew && score > 0 ? "NEW BEST!" : "GAME OVER";
        overlayText.innerHTML = `<span class="big">${score}</span>Level ${level} · Best: ${result.best}`;
        startBtn.textContent = "Play again";
        overlay.hidden = false;
    }

    function togglePause() {
        if (state === "paused") {
            state = pausedFrom;
            overlay.hidden = true;
            loop.resume();
        } else if (state === "playing" || state === "starting") {
            pausedFrom = state;
            state = "paused";
            loop.pause();
            overlayTitle.textContent = "PAUSED";
            overlayText.textContent = "Press P or the button to continue.";
            startBtn.textContent = "Resume";
            overlay.hidden = false;
        }
    }

    // ---------- drawing ----------
    function buildMazeLayer(edge) {
        const layer = document.createElement("canvas");
        const lctx = setupCanvas(layer, W, H);
        lctx.fillStyle = "#0b1220";
        lctx.fillRect(0, 0, W, H);
        const open = (r, c) => {
            const ch = tile(r, c);
            return ch !== "#" && ch !== "X";
        };
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (MAZE[r][c] !== "#") continue;
                const x = c * T;
                const y = r * T;
                lctx.fillStyle = "#12233b";
                lctx.fillRect(x, y, T, T);
                lctx.strokeStyle = edge;
                lctx.lineWidth = 2;
                lctx.shadowColor = edge;
                lctx.shadowBlur = 6;
                lctx.beginPath();
                if (r > 0 && open(r - 1, c)) { lctx.moveTo(x, y + 1); lctx.lineTo(x + T, y + 1); }
                if (r < ROWS - 1 && open(r + 1, c)) { lctx.moveTo(x, y + T - 1); lctx.lineTo(x + T, y + T - 1); }
                if (c > 0 && open(r, c - 1)) { lctx.moveTo(x + 1, y); lctx.lineTo(x + 1, y + T); }
                if (c < COLS - 1 && open(r, c + 1)) { lctx.moveTo(x + T - 1, y); lctx.lineTo(x + T - 1, y + T); }
                lctx.stroke();
            }
        }
        lctx.shadowBlur = 0;
        lctx.fillStyle = "#ff4fd8";
        lctx.fillRect(DOOR.c * T + 2, DOOR.r * T + T / 2 - 2, T - 4, 4);
        return layer;
    }

    function drawPlayer() {
        const pos = position(player);
        const cx = (pos.x + 0.5) * T;
        const cy = (pos.y + 0.5) * T;
        let size = T * 0.78;
        if (state === "dying") size *= Math.max(0, 1 - stateTime / 1.2);
        if (size <= 0) return;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillStyle = "#39ff88";
        ctx.shadowColor = "#39ff88";
        ctx.shadowBlur = 10;
        roundRect(ctx, -size / 2, -size / 2, size, size, size * 0.3);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#0a0e14";
        roundRect(ctx, -size * 0.36, -size * 0.22, size * 0.72, size * 0.34, size * 0.15);
        ctx.fill();
        const look = player.dir.x || player.dir.y ? player.dir : player.want;
        const blink = Math.sin(player.mouth) > 0.96;
        ctx.fillStyle = "#39ff88";
        if (!blink) {
            ctx.fillRect(-size * 0.22 + look.x * 2.5, -size * 0.12 + look.y * 2, 3, 4);
            ctx.fillRect(size * 0.08 + look.x * 2.5, -size * 0.12 + look.y * 2, 3, 4);
        }
        ctx.restore();
    }

    function drawHunter(h) {
        let pos = position(h);
        if (h.mode === "home") pos = { x: h.c, y: h.r + Math.sin(time * 4 + h.i) * 0.15 };
        const cx = (pos.x + 0.5) * T;
        const cy = (pos.y + 0.5) * T;
        const s = T * 0.42;
        ctx.save();
        ctx.translate(cx, cy);
        if (h.mode !== "eaten") {
            let color = h.color;
            if (h.frightened) {
                const flashing = frightTime < 2 && Math.floor(frightTime * 6) % 2 === 0;
                color = flashing ? "#e6edf3" : "#2f6bff";
            }
            ctx.fillStyle = color;
            ctx.rotate(Math.sin(time * 6 + h.i) * 0.12);
            ctx.beginPath();
            for (let k = 0; k < 8; k++) {
                const a = (k * Math.PI) / 4 - Math.PI / 2;
                const rr = k % 2 ? s * 0.78 : s * 1.08;
                ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
            }
            ctx.closePath();
            ctx.fill();
            ctx.rotate(-Math.sin(time * 6 + h.i) * 0.12);
        }
        // eyes
        const d = h.dir.x || h.dir.y ? h.dir : { x: 0, y: 1 };
        for (const side of [-1, 1]) {
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(side * s * 0.36, -s * 0.12, s * 0.26, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = h.frightened ? "#ff5d6c" : "#0a0e14";
            ctx.beginPath();
            ctx.arc(side * s * 0.36 + d.x * s * 0.1, -s * 0.12 + d.y * s * 0.1, s * 0.12, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function render() {
        if (!mazeLayer) {
            mazeLayer = buildMazeLayer("#3ad7ff");
            mazeLayerFlash = buildMazeLayer("#ffffff");
        }
        const flash = state === "cleared" && Math.floor(stateTime * 6) % 2 === 0;
        ctx.drawImage(flash ? mazeLayerFlash : mazeLayer, 0, 0, W, H);

        if (dots) {
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const v = dots[r][c];
                    if (!v) continue;
                    const x = (c + 0.5) * T;
                    const y = (r + 0.5) * T;
                    if (v === 1) {
                        ctx.fillStyle = "#cfe3f7";
                        ctx.fillRect(x - 2, y - 2, 4, 4);
                    } else {
                        const pulse = 5 + Math.sin(time * 6) * 1.5;
                        ctx.fillStyle = "#ffd23f";
                        ctx.shadowColor = "#ffd23f";
                        ctx.shadowBlur = 10;
                        ctx.beginPath();
                        ctx.arc(x, y, pulse, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                }
            }
        }
        if (player) {
            if (state !== "cleared") hunters.forEach(drawHunter);
            drawPlayer();
        }

        ctx.textAlign = "center";
        ctx.font = '11px "Press Start 2P", monospace';
        for (const p of popups) {
            ctx.globalAlpha = 1 - p.t;
            ctx.fillStyle = "#ffffff";
            ctx.fillText(p.text, p.x, p.y - p.t * 24);
        }
        ctx.globalAlpha = 1;
        if (state === "starting") {
            ctx.fillStyle = "#ffd23f";
            ctx.font = '14px "Press Start 2P", monospace';
            ctx.fillText(level > 1 && stateTime < 1.6 ? `LEVEL ${level}` : "READY!", W / 2, 9 * T + T * 0.7);
        }
    }

    // ---------- input ----------
    const KEYS = {
        ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down",
        ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
    };
    window.addEventListener("keydown", (e) => {
        const dir = KEYS[e.code];
        if (dir) {
            e.preventDefault();
            setWant(DIRS[dir]);
        } else if (e.code === "KeyP" || e.code === "Escape") {
            togglePause();
        } else if ((e.code === "Space" || e.code === "Enter") && (state === "ready" || state === "over")) {
            e.preventDefault();
            startGame();
        }
    });
    let swipe = null;
    canvas.addEventListener("pointerdown", (e) => {
        swipe = pointerPos(canvas, e, W, H);
    });
    canvas.addEventListener("pointerup", (e) => {
        if (!swipe) return;
        const end = pointerPos(canvas, e, W, H);
        const dx = end.x - swipe.x;
        const dy = end.y - swipe.y;
        swipe = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
        setWant(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? DIRS.right : DIRS.left) : dy > 0 ? DIRS.down : DIRS.up);
    });
    document.querySelectorAll(".dpad [data-dir]").forEach((btn) =>
        btn.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            setWant(DIRS[btn.dataset.dir]);
        }),
    );
    startBtn.addEventListener("click", () => {
        if (state === "paused") togglePause();
        else startGame();
    });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && (state === "playing" || state === "starting")) togglePause();
    });

    buildDots();
    placeActors();
    const loop = startLoop(update, render);
})();

/* Dino Run — R3TRO Arcade. Original code and graphics, MIT License. */
(() => {
    const { setupCanvas, startLoop, roundRect, rand } = window.R3TROCanvas;
    const W = 800;
    const H = 240;
    const GROUND_Y = 196;
    const GRAVITY = 2600;
    const JUMP_VELOCITY = -820;
    const JUMP_CUT = 0.45; // releasing early cuts the upward speed
    const DINO_X = 70;

    const canvas = document.getElementById("board");
    const ctx = setupCanvas(canvas, W, H);
    const overlay = document.getElementById("overlay");
    const overlayTitle = document.getElementById("overlay-title");
    const overlayText = document.getElementById("overlay-text");
    const startBtn = document.getElementById("start");
    const scoreEl = document.getElementById("score");
    const bestEl = document.getElementById("best");

    let state = "ready";
    let dino;
    let obstacles;
    let distance;
    let speed;
    let nextSpawn;
    let flash = 0;
    let overAt = 0;
    let time = 0;
    const input = { jump: false, duck: false };
    const hills = Array.from({ length: 6 }, (_, i) => ({ x: i * 170, h: rand(26, 56) }));
    const pebbles = Array.from({ length: 30 }, () => ({ x: rand(0, W), y: rand(GROUND_Y + 8, H - 6), w: rand(2, 6) }));

    bestEl.textContent = window.R3TRO.best("dino-run") ?? 0;

    function reset() {
        dino = { y: 0, vy: 0, onGround: true, ducking: false, step: 0 };
        obstacles = [];
        distance = 0;
        speed = 380;
        nextSpawn = 520;
        scoreEl.textContent = "0";
    }

    const score = () => Math.floor(distance / 12);

    function start() {
        reset();
        state = "playing";
        overlay.hidden = true;
        loop.resume();
    }

    function gameOver() {
        state = "over";
        overAt = performance.now();
        const s = score();
        const result = window.R3TRO.submit("dino-run", s);
        bestEl.textContent = result.best;
        overlayTitle.textContent = result.isNew && s > 0 ? "NEW BEST!" : "GAME OVER";
        overlayText.innerHTML = `<span class="big">${s}</span>Best: ${result.best}`;
        startBtn.textContent = "Run again";
        overlay.hidden = false;
    }

    function togglePause() {
        if (state === "playing") {
            state = "paused";
            loop.pause();
            overlayTitle.textContent = "PAUSED";
            overlayText.textContent = "Press P or the button to continue.";
            startBtn.textContent = "Resume";
            overlay.hidden = false;
        } else if (state === "paused") {
            state = "playing";
            overlay.hidden = true;
            loop.resume();
        }
    }

    function pressJump() {
        if (state === "ready" || (state === "over" && performance.now() - overAt > 450)) {
            start();
        }
        if (state === "paused") return togglePause();
        input.jump = true;
        if (state === "playing" && dino.onGround) {
            dino.vy = JUMP_VELOCITY;
            dino.onGround = false;
        }
    }

    function releaseJump() {
        input.jump = false;
        if (dino && dino.vy < 0) dino.vy *= JUMP_CUT;
    }

    function spawn() {
        const s = score();
        const roll = Math.random();
        if (s > 150 && roll < 0.28) {
            // drone: low (jump over it) or mid height (duck under it) — mid is twice as likely
            const level = [GROUND_Y - 22, GROUND_Y - 52, GROUND_Y - 52][Math.floor(rand(0, 3))];
            obstacles.push({ type: "drone", x: W + 30, y: level, w: 40, h: 20, t: 0 });
        } else if (roll < 0.62) {
            const n = s > 300 && Math.random() < 0.35 ? 2 : 1;
            for (let i = 0; i < n; i++) {
                const h = rand(34, 50);
                obstacles.push({ type: "cactus", x: W + 20 + i * 24, y: GROUND_Y - h, w: 20, h });
            }
        } else {
            const w = rand(30, 52);
            const h = rand(20, 30);
            obstacles.push({ type: "rock", x: W + 20, y: GROUND_Y - h, w, h });
        }
        const gapMin = 260 + speed * 0.35;
        nextSpawn = rand(gapMin, gapMin + 280);
    }

    function dinoBox() {
        if (dino.ducking && dino.onGround) return { x: DINO_X + 2, y: GROUND_Y - 30, w: 58, h: 30 };
        return { x: DINO_X + 10, y: GROUND_Y - 52 + dino.y, w: 32, h: 50 };
    }

    function hit(a, b) {
        const pad = 4;
        return a.x + pad < b.x + b.w && a.x + a.w - pad > b.x && a.y + pad < b.y + b.h && a.y + a.h - pad > b.y;
    }

    function update(dt) {
        time += dt;
        if (state !== "playing") return;

        speed = Math.min(980, speed + dt * 9);
        const dx = speed * dt;
        distance += dx;
        nextSpawn -= dx;
        if (nextSpawn <= 0) spawn();

        dino.ducking = input.duck;
        if (!dino.onGround) {
            dino.vy += GRAVITY * (input.duck ? 1.8 : 1) * dt;
            dino.y += dino.vy * dt;
            if (dino.y >= 0) {
                dino.y = 0;
                dino.vy = 0;
                dino.onGround = true;
            }
        }
        dino.step += dt * speed * 0.035;

        for (const o of obstacles) {
            o.x -= dx * (o.type === "drone" ? 1.12 : 1);
            if (o.type === "drone") o.t += dt;
        }
        obstacles = obstacles.filter((o) => o.x + o.w > -20);
        for (const h of hills) {
            h.x -= dx * 0.2;
            if (h.x < -180) h.x += 6 * 170;
        }
        for (const p of pebbles) {
            p.x -= dx;
            if (p.x < -8) p.x += W + 16;
        }

        const s = score();
        if (s > 0 && s % 100 === 0 && scoreEl.textContent !== String(s)) flash = 0.6;
        flash = Math.max(0, flash - dt);
        scoreEl.textContent = s;

        const box = dinoBox();
        for (const o of obstacles) {
            if (hit(box, o)) {
                gameOver();
                return;
            }
        }
    }

    function drawDino() {
        const ducking = dino.ducking && dino.onGround;
        const baseY = GROUND_Y + dino.y;
        const leg = dino.onGround && state === "playing" ? Math.floor(dino.step) % 2 : -1;
        const body = "#39ff88";
        const dark = "#1d9e57";
        ctx.save();
        ctx.translate(DINO_X, baseY);
        if (ducking) {
            ctx.fillStyle = body;
            roundRect(ctx, 0, -30, 46, 22, 9);
            ctx.fill();
            roundRect(ctx, 38, -32, 24, 18, 7);
            ctx.fill();
            ctx.fillStyle = dark;
            roundRect(ctx, -14, -26, 18, 8, 4); // tail
            ctx.fill();
            ctx.fillStyle = "#0a0e14";
            ctx.fillRect(52, -27, 4, 4);
            drawLegs(8, -8, leg);
            drawLegs(30, -8, leg === -1 ? -1 : 1 - leg);
        } else {
            ctx.fillStyle = dark;
            ctx.beginPath(); // tail
            ctx.moveTo(10, -30);
            ctx.lineTo(-10, -22);
            ctx.lineTo(12, -18);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = body;
            roundRect(ctx, 8, -40, 30, 30, 10); // torso
            ctx.fill();
            roundRect(ctx, 24, -56, 26, 22, 8); // head
            ctx.fill();
            ctx.fillStyle = "#b9ffd6";
            roundRect(ctx, 14, -30, 16, 16, 7); // belly
            ctx.fill();
            ctx.fillStyle = dark;
            ctx.fillRect(36, -32, 8, 4); // arm
            // spikes
            ctx.fillStyle = dark;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(10 + i * 8, -40);
                ctx.lineTo(14 + i * 8, -47);
                ctx.lineTo(18 + i * 8, -40);
                ctx.fill();
            }
            ctx.fillStyle = "#0a0e14";
            if (state === "over") {
                ctx.font = "bold 10px monospace";
                ctx.fillText("x", 39, -45);
            } else {
                ctx.fillRect(40, -50, 4, 5); // eye
            }
            ctx.fillRect(44, -40, 6, 2); // mouth
            drawLegs(12, -10, leg);
            drawLegs(26, -10, leg === -1 ? -1 : 1 - leg);
        }
        ctx.restore();
    }

    function drawLegs(x, y, phase) {
        ctx.fillStyle = "#1d9e57";
        const lift = phase === 1 ? 4 : 0;
        ctx.fillRect(x, y, 7, 10 - lift);
        ctx.fillRect(x, y + 10 - lift - 3, 11, 3);
    }

    function drawObstacle(o) {
        if (o.type === "cactus") {
            ctx.fillStyle = "#2fbf9f";
            roundRect(ctx, o.x + 6, o.y, 9, o.h, 4);
            ctx.fill();
            roundRect(ctx, o.x, o.y + o.h * 0.35, 6, o.h * 0.28, 3);
            ctx.fill();
            roundRect(ctx, o.x, o.y + o.h * 0.35, 9, 5, 2);
            ctx.fill();
            roundRect(ctx, o.x + 15, o.y + o.h * 0.2, 6, o.h * 0.3, 3);
            ctx.fill();
            roundRect(ctx, o.x + 12, o.y + o.h * 0.42, 9, 5, 2);
            ctx.fill();
        } else if (o.type === "rock") {
            ctx.fillStyle = "#5c6b80";
            ctx.beginPath();
            ctx.moveTo(o.x, o.y + o.h);
            ctx.lineTo(o.x + o.w * 0.15, o.y + o.h * 0.25);
            ctx.lineTo(o.x + o.w * 0.55, o.y);
            ctx.lineTo(o.x + o.w * 0.9, o.y + o.h * 0.35);
            ctx.lineTo(o.x + o.w, o.y + o.h);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#77879c";
            ctx.fillRect(o.x + o.w * 0.4, o.y + o.h * 0.3, o.w * 0.18, 3);
        } else {
            const wob = Math.sin(o.t * 12) * 2;
            ctx.fillStyle = "#ff4fd8";
            roundRect(ctx, o.x + 6, o.y + 6 + wob, o.w - 12, 10, 5);
            ctx.fill();
            ctx.fillStyle = "#c33aa6";
            const spin = Math.abs(Math.sin(o.t * 30));
            ctx.fillRect(o.x + 2 - 8 * spin, o.y + 2 + wob, 4 + 16 * spin, 3);
            ctx.fillRect(o.x + o.w - 6 - 8 * spin, o.y + 2 + wob, 4 + 16 * spin, 3);
            ctx.fillStyle = "#ffd23f";
            ctx.fillRect(o.x + o.w / 2 - 2, o.y + 9 + wob, 4, 4);
        }
    }

    function render() {
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, "#0e1a2b");
        sky.addColorStop(1, "#172a43");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        for (let i = 0; i < 18; i++) ctx.fillRect((i * 131 + 40) % W, (i * 37) % 110, 2, 2);
        ctx.fillStyle = "#ffd23f";
        ctx.beginPath();
        ctx.arc(690, 52, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#172a43";
        ctx.beginPath();
        ctx.arc(698, 46, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#162a40";
        for (const h of hills) {
            ctx.beginPath();
            ctx.moveTo(h.x, GROUND_Y);
            ctx.quadraticCurveTo(h.x + 85, GROUND_Y - h.h * 2, h.x + 170, GROUND_Y);
            ctx.fill();
        }

        ctx.fillStyle = "#121d2b";
        ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
        ctx.fillStyle = "#39ff88";
        ctx.fillRect(0, GROUND_Y, W, 2);
        ctx.fillStyle = "#2a3b52";
        for (const p of pebbles) ctx.fillRect(p.x, p.y, p.w, 2);

        for (const o of obstacles) drawObstacle(o);
        drawDino();

        if (flash > 0 && Math.floor(flash * 10) % 2 === 0) {
            ctx.fillStyle = "rgba(57,255,136,0.08)";
            ctx.fillRect(0, 0, W, H);
        }
    }

    reset();
    const loop = startLoop(update, render);

    startBtn.addEventListener("click", () => {
        if (state === "paused") togglePause();
        else start();
    });
    window.addEventListener("keydown", (e) => {
        if (e.repeat && (e.code === "Space" || e.code === "ArrowUp")) return;
        if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
            e.preventDefault();
            pressJump();
        } else if (e.code === "ArrowDown" || e.code === "KeyS") {
            e.preventDefault();
            input.duck = true;
        } else if (e.code === "KeyP" || e.code === "Escape") {
            togglePause();
        }
    });
    window.addEventListener("keyup", (e) => {
        if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") releaseJump();
        if (e.code === "ArrowDown" || e.code === "KeyS") input.duck = false;
    });
    canvas.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        pressJump();
    });
    canvas.addEventListener("pointerup", releaseJump);

    const jumpBtn = document.getElementById("btn-jump");
    const duckBtn = document.getElementById("btn-duck");
    jumpBtn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        pressJump();
    });
    jumpBtn.addEventListener("pointerup", releaseJump);
    duckBtn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        input.duck = true;
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) =>
        duckBtn.addEventListener(ev, () => (input.duck = false)),
    );
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && state === "playing") togglePause();
    });
})();

/* Flap — R3TRO Arcade. Original code and graphics, MIT License. */
(() => {
    const { setupCanvas, startLoop, roundRect, rand } = window.R3TROCanvas;
    const W = 360;
    const H = 640;
    const GROUND = 84;
    const GRAVITY = 1550;
    const FLAP_VELOCITY = -440;
    const MAX_FALL = 720;
    const PIPE_W = 66;
    const PIPE_SPACING = 215;
    const BIRD_X = 96;
    const BIRD_R = 15;

    const canvas = document.getElementById("board");
    const ctx = setupCanvas(canvas, W, H);
    const overlay = document.getElementById("overlay");
    const overlayTitle = document.getElementById("overlay-title");
    const overlayText = document.getElementById("overlay-text");
    const startBtn = document.getElementById("start");
    const scoreEl = document.getElementById("score");
    const bestEl = document.getElementById("best");

    let state = "ready"; // ready | playing | paused | over
    let bird;
    let pipes;
    let score;
    let speed;
    let groundOffset = 0;
    let time = 0;
    let overAt = 0;
    const clouds = Array.from({ length: 5 }, () => ({
        x: rand(0, W),
        y: rand(40, 260),
        s: rand(0.6, 1.2),
    }));

    bestEl.textContent = window.R3TRO.best("flap") ?? 0;

    function reset() {
        bird = { y: H * 0.42, vy: 0, wing: 0 };
        pipes = [];
        score = 0;
        speed = 165;
        scoreEl.textContent = "0";
        spawnPipe(W + 60);
        spawnPipe(W + 60 + PIPE_SPACING);
        spawnPipe(W + 60 + PIPE_SPACING * 2);
    }

    function gapSize() {
        return Math.max(132, 170 - score * 1.4);
    }

    function spawnPipe(x) {
        const gap = gapSize();
        const top = rand(70, H - GROUND - gap - 70);
        pipes.push({ x, top, gap, passed: false });
    }

    function flap() {
        if (state === "ready" || (state === "over" && performance.now() - overAt > 450)) {
            start();
            return;
        }
        if (state !== "playing") return;
        bird.vy = FLAP_VELOCITY;
        bird.wing = 1;
    }

    function start() {
        reset();
        state = "playing";
        overlay.hidden = true;
        loop.resume();
        bird.vy = FLAP_VELOCITY;
    }

    function gameOver() {
        state = "over";
        overAt = performance.now();
        const result = window.R3TRO.submit("flap", score);
        bestEl.textContent = result.best;
        overlayTitle.textContent = result.isNew && score > 0 ? "NEW BEST!" : "GAME OVER";
        overlayText.innerHTML = `<span class="big">${score}</span>Best: ${result.best}`;
        startBtn.textContent = "Play again";
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

    function circleHitsRect(cx, cy, r, x, y, w, h) {
        const nx = Math.max(x, Math.min(cx, x + w));
        const ny = Math.max(y, Math.min(cy, y + h));
        return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
    }

    function update(dt) {
        time += dt;
        const moving = state === "playing" || state === "ready";
        if (moving) groundOffset = (groundOffset + speed * dt) % 24;
        for (const c of clouds) {
            c.x -= 12 * c.s * dt;
            if (c.x < -80) {
                c.x = W + 40;
                c.y = rand(40, 260);
            }
        }

        if (state === "ready") {
            bird.y = H * 0.42 + Math.sin(time * 3) * 8;
            bird.wing = (Math.sin(time * 10) + 1) / 2;
            return;
        }
        if (state !== "playing") return;

        bird.vy = Math.min(MAX_FALL, bird.vy + GRAVITY * dt);
        bird.y += bird.vy * dt;
        bird.wing = Math.max(0, bird.wing - dt * 4);

        speed = Math.min(235, 165 + score * 2);
        for (const p of pipes) {
            p.x -= speed * dt;
            if (!p.passed && p.x + PIPE_W < BIRD_X - BIRD_R) {
                p.passed = true;
                score += 1;
                scoreEl.textContent = score;
            }
        }
        if (pipes.length && pipes[0].x < -PIPE_W) {
            pipes.shift();
            spawnPipe(pipes[pipes.length - 1].x + PIPE_SPACING);
        }

        if (bird.y + BIRD_R >= H - GROUND) {
            bird.y = H - GROUND - BIRD_R;
            gameOver();
            return;
        }
        if (bird.y - BIRD_R < 0) {
            bird.y = BIRD_R;
            bird.vy = 0;
        }
        for (const p of pipes) {
            if (
                circleHitsRect(BIRD_X, bird.y, BIRD_R - 2, p.x, 0, PIPE_W, p.top) ||
                circleHitsRect(BIRD_X, bird.y, BIRD_R - 2, p.x, p.top + p.gap, PIPE_W, H - GROUND - p.top - p.gap)
            ) {
                gameOver();
                return;
            }
        }
    }

    function drawBackground() {
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, "#0d1b2e");
        sky.addColorStop(0.65, "#18355a");
        sky.addColorStop(1, "#2a5578");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // stars
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        for (let i = 0; i < 26; i++) {
            const x = (i * 97) % W;
            const y = (i * 53) % 260;
            ctx.fillRect(x, y, 2, 2);
        }

        ctx.fillStyle = "rgba(230, 240, 255, 0.10)";
        for (const c of clouds) {
            ctx.beginPath();
            ctx.ellipse(c.x, c.y, 46 * c.s, 16 * c.s, 0, 0, Math.PI * 2);
            ctx.ellipse(c.x + 26 * c.s, c.y - 8 * c.s, 30 * c.s, 14 * c.s, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // distant city skyline
        ctx.fillStyle = "#13283f";
        const base = H - GROUND;
        for (let i = 0; i < 12; i++) {
            const bw = 30 + ((i * 37) % 24);
            const bh = 50 + ((i * 71) % 90);
            ctx.fillRect(i * 32 - 6, base - bh, bw, bh);
        }
        ctx.fillStyle = "rgba(255, 210, 63, 0.35)";
        for (let i = 0; i < 40; i++) {
            ctx.fillRect((i * 29) % W, base - 20 - ((i * 43) % 100), 3, 4);
        }
    }

    function drawPipe(p) {
        const lip = 10;
        const grad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
        grad.addColorStop(0, "#1fbf68");
        grad.addColorStop(0.5, "#39ff88");
        grad.addColorStop(1, "#14894a");
        ctx.fillStyle = grad;
        // top
        ctx.fillRect(p.x + 4, 0, PIPE_W - 8, p.top - lip);
        roundRect(ctx, p.x, p.top - lip - 14, PIPE_W, 24, 6);
        ctx.fill();
        // bottom
        const by = p.top + p.gap;
        ctx.fillRect(p.x + 4, by + lip, PIPE_W - 8, H - GROUND - by - lip);
        roundRect(ctx, p.x, by - 10, PIPE_W, 24, 6);
        ctx.fill();
        ctx.strokeStyle = "rgba(4, 30, 15, 0.6)";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x + 4, -2, PIPE_W - 8, p.top - lip - 12);
        ctx.strokeRect(p.x + 4, by + 14, PIPE_W - 8, H - GROUND - by - 12);
    }

    function drawGround() {
        const y = H - GROUND;
        ctx.fillStyle = "#1d2a3a";
        ctx.fillRect(0, y, W, GROUND);
        ctx.fillStyle = "#39ff88";
        ctx.fillRect(0, y, W, 4);
        ctx.fillStyle = "#26384e";
        for (let x = -groundOffset; x < W; x += 24) {
            ctx.beginPath();
            ctx.moveTo(x, y + 4);
            ctx.lineTo(x + 12, y + 4);
            ctx.lineTo(x + 2, y + 22);
            ctx.lineTo(x - 10, y + 22);
            ctx.fill();
        }
    }

    function drawBird() {
        const tilt = Math.max(-0.5, Math.min(1.2, bird.vy / 520));
        ctx.save();
        ctx.translate(BIRD_X, bird.y);
        ctx.rotate(state === "ready" ? 0 : tilt);
        // body
        ctx.fillStyle = "#3ad7ff";
        ctx.beginPath();
        ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2);
        ctx.fill();
        // belly
        ctx.fillStyle = "#c9f4ff";
        ctx.beginPath();
        ctx.ellipse(-2, 6, 10, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        // tail
        ctx.fillStyle = "#1f8fb8";
        ctx.beginPath();
        ctx.moveTo(-BIRD_R + 2, -2);
        ctx.lineTo(-BIRD_R - 9, -8);
        ctx.lineTo(-BIRD_R - 7, 4);
        ctx.closePath();
        ctx.fill();
        // wing
        ctx.fillStyle = "#1f8fb8";
        ctx.beginPath();
        ctx.ellipse(-4, 1 - bird.wing * 7, 9, 5 + bird.wing * 2, -0.4 - bird.wing * 0.5, 0, Math.PI * 2);
        ctx.fill();
        // visor eye
        ctx.fillStyle = "#0a0e14";
        roundRect(ctx, 2, -9, 13, 8, 4);
        ctx.fill();
        ctx.fillStyle = "#39ff88";
        ctx.fillRect(8, -7, 4, 3);
        // beak
        ctx.fillStyle = "#ffd23f";
        ctx.beginPath();
        ctx.moveTo(BIRD_R - 2, 0);
        ctx.lineTo(BIRD_R + 9, 3);
        ctx.lineTo(BIRD_R - 2, 7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function render() {
        drawBackground();
        for (const p of pipes) drawPipe(p);
        drawGround();
        drawBird();
        if (state === "playing") {
            ctx.fillStyle = "rgba(255,255,255,0.92)";
            ctx.font = '20px "Press Start 2P", monospace';
            ctx.textAlign = "center";
            ctx.fillText(String(score), W / 2, 64);
        }
    }

    reset();
    const loop = startLoop(update, render);

    startBtn.addEventListener("click", () => {
        if (state === "paused") togglePause();
        else start();
    });
    canvas.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        flap();
    });
    window.addEventListener("keydown", (e) => {
        if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
            e.preventDefault();
            if (state === "paused") togglePause();
            else flap();
        } else if (e.code === "KeyP" || e.code === "Escape") {
            togglePause();
        }
    });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && state === "playing") togglePause();
    });
})();

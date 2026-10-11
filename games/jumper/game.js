/* Jumper — R3TRO Arcade. Original code and graphics, MIT License. */
(() => {
    const { setupCanvas, startLoop, roundRect, rand, pointerPos } = window.R3TROCanvas;
    const W = 360;
    const H = 600;
    const GRAVITY = 1250;
    const BOUNCE = -640;
    const SPRING = -1050;
    const MOVE_SPEED = 300;
    const PLAYER = 34;
    const PAD_W = 64;
    const PAD_H = 12;

    const canvas = document.getElementById("board");
    const ctx = setupCanvas(canvas, W, H);
    const overlay = document.getElementById("overlay");
    const overlayTitle = document.getElementById("overlay-title");
    const overlayText = document.getElementById("overlay-text");
    const startBtn = document.getElementById("start");
    const scoreEl = document.getElementById("score");
    const bestEl = document.getElementById("best");

    let state = "ready";
    let player;
    let pads;
    let camera; // world y at the top of the screen (decreases as we climb)
    let highest;
    let overAt = 0;
    let time = 0;
    const keys = { left: false, right: false };
    let touchDir = 0;
    const stars = Array.from({ length: 50 }, () => ({ x: rand(0, W), y: rand(0, H), d: rand(0.2, 0.6) }));

    bestEl.textContent = window.R3TRO.best("jumper") ?? 0;

    function reset() {
        player = { x: W / 2 - PLAYER / 2, y: H - 120, vy: BOUNCE, face: 1 };
        camera = 0;
        highest = 0;
        pads = [{ x: W / 2 - PAD_W / 2, y: H - 60, type: "normal", vx: 0, broken: false, spring: false }];
        let y = H - 60;
        while (y > -H) y = addPadsAbove(y, 0);
        scoreEl.textContent = "0";
    }

    /** Add the next path pad above `top` (plus an occasional decoy); returns the new top. */
    function addPadsAbove(top, h) {
        const gap = gapFor(h);
        const y = top - gap;
        pads.push(makePad(y, h));
        if (Math.random() < 0.12 + Math.min(0.2, h / 15000)) pads.push(makePad(y + gap / 2, h, true));
        return y;
    }

    const height = () => Math.max(0, Math.floor(highest / 10));

    function gapFor(h) {
        return rand(48, 62) + Math.min(70, h / 40);
    }

    // Pads on the main path are always reachable (normal or moving).
    // Breaking pads are extra decoys placed between them, never part of the path.
    function makePad(y, h, decoy = false) {
        const hard = Math.min(1, h / 3000);
        let type = "normal";
        if (decoy) type = "breaking";
        else if (Math.random() < 0.1 + hard * 0.25) type = "moving";
        return {
            x: rand(0, W - PAD_W),
            y,
            type,
            vx: type === "moving" ? rand(60, 110) * (Math.random() < 0.5 ? -1 : 1) : 0,
            broken: false,
            fall: 0,
            spring: type === "normal" && Math.random() < 0.07,
        };
    }

    function start() {
        reset();
        state = "playing";
        overlay.hidden = true;
        loop.resume();
    }

    function gameOver() {
        state = "over";
        overAt = performance.now();
        const s = height();
        const result = window.R3TRO.submit("jumper", s);
        bestEl.textContent = result.best;
        overlayTitle.textContent = result.isNew && s > 0 ? "NEW BEST!" : "GAME OVER";
        overlayText.innerHTML = `<span class="big">${s}</span>Best: ${result.best}`;
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

    function update(dt) {
        time += dt;
        if (state !== "playing") return;

        const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0) || touchDir;
        if (dir) player.face = dir;
        player.x += dir * MOVE_SPEED * dt;
        if (player.x > W) player.x = -PLAYER;
        if (player.x < -PLAYER) player.x = W;

        const prevBottom = player.y + PLAYER;
        player.vy += GRAVITY * dt;
        player.y += player.vy * dt;

        for (const p of pads) {
            if (p.type === "moving") {
                p.x += p.vx * dt;
                if (p.x < 0 || p.x > W - PAD_W) p.vx *= -1;
            }
            if (p.broken) {
                p.fall += 500 * dt;
                continue;
            }
            const bottom = player.y + PLAYER;
            const overlapX = player.x + PLAYER - 6 > p.x && player.x + 6 < p.x + PAD_W;
            if (player.vy > 0 && overlapX && prevBottom <= p.y && bottom >= p.y) {
                if (p.type === "breaking") {
                    p.broken = true;
                } else {
                    player.y = p.y - PLAYER;
                    const onSpring = p.spring && player.x + PLAYER / 2 > p.x + PAD_W / 2 - 14 && player.x + PLAYER / 2 < p.x + PAD_W / 2 + 14;
                    player.vy = onSpring ? SPRING : BOUNCE;
                }
            }
        }

        // camera follows upward only
        const screenY = player.y - camera;
        if (screenY < H * 0.4) camera = player.y - H * 0.4;
        highest = Math.max(highest, H - 120 - player.y);
        scoreEl.textContent = height();

        // recycle pads below the screen, add new ones above
        pads = pads.filter((p) => p.y - camera < H + 40 && !(p.broken && p.fall > H));
        let top = Math.min(...pads.filter((p) => p.type !== "breaking").map((p) => p.y));
        while (top - camera > -60) top = addPadsAbove(top, highest);

        if (player.y - camera > H + 10) gameOver();
    }

    function drawPad(p) {
        const y = p.y - camera + (p.broken ? p.fall : 0);
        if (y < -20 || y > H + 20) return;
        const colors = { normal: "#39ff88", moving: "#3ad7ff", breaking: "#c98a4b" };
        ctx.save();
        if (p.broken) {
            ctx.globalAlpha = Math.max(0, 1 - p.fall / 200);
            ctx.translate(p.x + PAD_W / 2, y);
            ctx.rotate(0.3);
            ctx.translate(-(p.x + PAD_W / 2), -y);
        }
        ctx.fillStyle = colors[p.type];
        roundRect(ctx, p.x, y, PAD_W, PAD_H, 6);
        ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(p.x + 6, y + PAD_H - 4, PAD_W - 12, 2);
        if (p.type === "breaking") {
            ctx.strokeStyle = "#5b3a1c";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p.x + PAD_W / 2 - 4, y);
            ctx.lineTo(p.x + PAD_W / 2 + 3, y + 6);
            ctx.lineTo(p.x + PAD_W / 2 - 2, y + PAD_H);
            ctx.stroke();
        }
        if (p.spring) {
            const cx = p.x + PAD_W / 2;
            ctx.strokeStyle = "#ffd23f";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx - 8, y);
            ctx.lineTo(cx + 8, y - 4);
            ctx.lineTo(cx - 8, y - 8);
            ctx.lineTo(cx + 8, y - 12);
            ctx.stroke();
            ctx.fillStyle = "#ffd23f";
            ctx.fillRect(cx - 10, y - 15, 20, 4);
        }
        ctx.restore();
    }

    function drawPlayer() {
        const x = player.x;
        const y = player.y - camera;
        const squash = player.vy < -500 ? 1.08 : 1;
        ctx.save();
        ctx.translate(x + PLAYER / 2, y + PLAYER);
        ctx.scale(1 / squash, squash);
        ctx.translate(-PLAYER / 2, -PLAYER);
        // antenna
        ctx.strokeStyle = "#8b98a9";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(PLAYER / 2, 2);
        ctx.lineTo(PLAYER / 2, -8);
        ctx.stroke();
        ctx.fillStyle = Math.floor(time * 3) % 2 ? "#ff4fd8" : "#ffd23f";
        ctx.beginPath();
        ctx.arc(PLAYER / 2, -9, 3.5, 0, Math.PI * 2);
        ctx.fill();
        // body
        ctx.fillStyle = "#d7e3f0";
        roundRect(ctx, 0, 2, PLAYER, PLAYER - 6, 9);
        ctx.fill();
        // visor
        ctx.fillStyle = "#0a0e14";
        roundRect(ctx, 5, 8, PLAYER - 10, 12, 6);
        ctx.fill();
        ctx.fillStyle = "#39ff88";
        const look = player.face * 3;
        ctx.fillRect(PLAYER / 2 - 8 + look, 11, 5, 6);
        ctx.fillRect(PLAYER / 2 + 3 + look, 11, 5, 6);
        // feet
        ctx.fillStyle = "#8b98a9";
        ctx.fillRect(5, PLAYER - 4, 9, 4);
        ctx.fillRect(PLAYER - 14, PLAYER - 4, 9, 4);
        ctx.restore();
    }

    function render() {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#0b1322");
        g.addColorStop(1, "#14243a");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        for (const s of stars) {
            const y = (((s.y - camera * s.d) % H) + H) % H;
            ctx.fillRect(s.x, y, 2, 2);
        }
        for (const p of pads) drawPad(p);
        drawPlayer();
        if (state === "playing") {
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.font = '16px "Press Start 2P", monospace';
            ctx.textAlign = "left";
            ctx.fillText(String(height()), 14, 32);
        }
    }

    reset();
    const loop = startLoop(update, render);

    startBtn.addEventListener("click", () => {
        if (state === "paused") togglePause();
        else start();
    });
    window.addEventListener("keydown", (e) => {
        if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
        else if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;
        else if (e.code === "KeyP" || e.code === "Escape") togglePause();
        else if ((e.code === "Space" || e.code === "Enter") && (state === "ready" || (state === "over" && performance.now() - overAt > 450))) {
            e.preventDefault();
            start();
        } else return;
        if (e.code.startsWith("Arrow")) e.preventDefault();
    });
    window.addEventListener("keyup", (e) => {
        if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
        if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
    });
    canvas.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);
        touchDir = pointerPos(canvas, e, W, H).x < W / 2 ? -1 : 1;
    });
    canvas.addEventListener("pointermove", (e) => {
        if (touchDir) touchDir = pointerPos(canvas, e, W, H).x < W / 2 ? -1 : 1;
    });
    ["pointerup", "pointercancel"].forEach((ev) => canvas.addEventListener(ev, () => (touchDir = 0)));
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && state === "playing") togglePause();
    });
})();

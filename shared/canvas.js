/*
 * R3TRO Arcade — small helpers shared by the canvas games.
 */
(() => {
    /** Size a canvas for a fixed logical resolution, sharp on HiDPI screens. */
    function setupCanvas(canvas, width, height) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        const ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return ctx;
    }

    /**
     * requestAnimationFrame loop with a clamped delta (seconds).
     * update(dt) runs only while not paused; render() runs every frame.
     */
    function startLoop(update, render) {
        let last = performance.now();
        let paused = false;
        function frame(now) {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            if (!paused) update(dt);
            render();
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
        return {
            pause() {
                paused = true;
            },
            resume() {
                last = performance.now();
                paused = false;
            },
            get paused() {
                return paused;
            },
        };
    }

    function roundRect(ctx, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
    }

    /** Map a pointer event to logical canvas coordinates. */
    function pointerPos(canvas, event, width, height) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: ((event.clientX - rect.left) / rect.width) * width,
            y: ((event.clientY - rect.top) / rect.height) * height,
        };
    }

    const rand = (min, max) => min + Math.random() * (max - min);
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    window.R3TROCanvas = Object.freeze({
        setupCanvas,
        startLoop,
        roundRect,
        pointerPos,
        rand,
        clamp,
    });
})();

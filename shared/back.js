/*
 * R3TRO Arcade — "back to the arcade" button.
 * Included by every game page: <script src="../../shared/back.js" defer></script>
 */
(() => {
    const script = document.currentScript;
    const home = new URL("../index.html", script.src).href;

    const style = document.createElement("style");
    style.textContent = `
        .r3tro-back {
            position: fixed;
            left: 12px;
            bottom: 12px;
            z-index: 2147483000;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 12px 7px 10px;
            border-radius: 999px;
            border: 1px solid rgba(57, 255, 136, 0.45);
            background: rgba(9, 13, 19, 0.82);
            color: #e6edf3;
            font: 600 12px/1 "Space Grotesk", system-ui, sans-serif;
            letter-spacing: 0.02em;
            text-decoration: none;
            backdrop-filter: blur(6px);
            opacity: 0.72;
            transition: opacity 0.15s ease, border-color 0.15s ease;
        }
        .r3tro-back:hover,
        .r3tro-back:focus-visible {
            opacity: 1;
            border-color: #39ff88;
            outline: none;
        }
        .r3tro-back svg { width: 14px; height: 14px; }
        @media print { .r3tro-back { display: none; } }
    `;
    document.head.appendChild(style);

    const link = document.createElement("a");
    link.className = "r3tro-back";
    link.href = home;
    link.setAttribute("aria-label", "Back to R3TRO Arcade");
    link.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>Arcade';
    document.body.appendChild(link);
})();

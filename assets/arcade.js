/* R3TRO Arcade — launcher. */
(() => {
    const svg = (body) =>
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

    const GAMES = [
        {
            id: "blocks", path: "games/blocks/", name: "R3TRO Blocks", tag: "puzzle", tint: "#39ff88",
            text: "Falling-block puzzle with hold, ghost piece, spins and three modes.",
            icon: svg('<rect x="3" y="12" width="6" height="6" rx="1"/><rect x="9" y="12" width="6" height="6" rx="1"/><rect x="15" y="12" width="6" height="6" rx="1"/><rect x="9" y="6" width="6" height="6" rx="1"/>'),
        },
        {
            id: "shift2048", path: "games/shift2048/", name: "Shift2048", tag: "puzzle", tint: "#ffd23f",
            text: "Slide and merge tiles to 2048 — with an AI that can play for you.",
            icon: svg('<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>'),
        },
        {
            id: "serpent-rush", path: "games/serpent-rush/", name: "SerpentRush", tag: "action", tint: "#2fe0c8",
            text: "Snake with game modes, themes and a speed that keeps climbing.",
            icon: svg('<path d="M4 18h6a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h9"/><circle cx="19" cy="6" r="1.6"/>'),
        },
        {
            id: "grid-strike", path: "games/grid-strike/", name: "GridStrike", tag: "classic", tint: "#3ad7ff",
            text: "Tic-tac-toe against a friend or the computer.",
            icon: svg('<path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><path d="M4.5 4.5l3 3M7.5 4.5l-3 3"/><circle cx="18" cy="18" r="1.8"/>'),
        },
        {
            id: "clash-of-choices", path: "games/clash-of-choices/", name: "Clash of Choices", tag: "classic", tint: "#ff9a3c",
            text: "Rock, paper, scissors — best of a quick series.",
            icon: svg('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
        },
        {
            id: "type-master", path: "games/type-master/", name: "TypeMaster", tag: "skill", tint: "#b783ff",
            text: "Typing speed test: words per minute, accuracy and keystrokes.",
            icon: svg('<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>'),
        },
        {
            id: "flap", path: "games/flap/", name: "Flap", tag: "action", tint: "#3ad7ff", best: { id: "flap" },
            text: "Tap to keep the little bot-bird in the air and slip through the gaps.",
            icon: svg('<circle cx="11" cy="12" r="6"/><path d="M17 12l4 1-4 2"/><path d="M8 12c-2-2-4-2-5 0"/><path d="M13 10h2"/>'),
        },
        {
            id: "dino-run", path: "games/dino-run/", name: "Dino Run", tag: "action", tint: "#39ff88", best: { id: "dino-run" },
            text: "Endless runner: jump the rocks and cacti, duck under the drones.",
            icon: svg('<path d="M6 20v-4M10 20v-4"/><path d="M4 9l3 1V7a3 3 0 0 1 3-3h6a2 2 0 0 1 2 2v3h-4v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M14 6.5h.01"/>'),
        },
        {
            id: "jumper", path: "games/jumper/", name: "Jumper", tag: "action", tint: "#ff4fd8", best: { id: "jumper" },
            text: "Bounce your robot ever higher across moving and crumbling platforms.",
            icon: svg('<rect x="8" y="3" width="8" height="8" rx="2"/><path d="M12 11v4"/><path d="M4 21h7M13 18h7"/>'),
        },
        {
            id: "match-3", path: "games/match-3/", name: "Match-3", tag: "puzzle", tint: "#ff5d6c", best: { id: "match-3" },
            text: "Swap gems to line up three or more. 30 moves to set a high score.",
            icon: svg('<path d="M6 3l3 4-3 4-3-4z"/><circle cx="17" cy="7" r="3.5"/><rect x="3.5" y="14" width="6" height="6" rx="1.5"/><path d="M17 13.5l3.5 6.5h-7z"/>'),
        },
        {
            id: "minesweep", path: "games/minesweep/", name: "MineSweep", tag: "puzzle", tint: "#8fd8ff",
            best: { id: "minesweep-easy", time: true, label: "Easy" },
            text: "Clear the field without touching a mine. Three difficulty levels.",
            icon: svg('<circle cx="12" cy="13" r="5"/><path d="M12 4v2M12 20v2M3 13h2M19 13h2M5.6 6.6l1.4 1.4M17 18l1.4 1.4M5.6 19.4L7 18M17 8l1.4-1.4"/>'),
        },
        {
            id: "maze-chase", path: "games/maze-chase/", name: "Maze Chase", tag: "action", tint: "#ffd23f", best: { id: "maze-chase" },
            text: "Collect every dot while four hunters with their own tactics chase you.",
            icon: svg('<path d="M3 3h18v18H3z"/><path d="M7 3v6h6M17 7v10h-6M3 13h4v4"/>'),
        },
        {
            id: "sudoku", path: "games/sudoku/", name: "Sudoku", tag: "puzzle", tint: "#3ad7ff",
            best: { id: "sudoku-medium", time: true, label: "Medium" },
            text: "Fresh puzzles with a unique solution, notes, hints and mistake checks.",
            icon: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>'),
        },
        {
            id: "key-melody", path: "games/key-melody/", name: "KeyMelody", tag: "toy", tint: "#b783ff",
            text: "A two-octave synth piano for your keyboard, mouse or fingers.",
            icon: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16M13 4v16M18 4v16"/><path d="M6.5 4v9M11.5 4v9M16.5 4v9" stroke-width="3"/>'),
        },
    ];

    const list = document.getElementById("games");

    function bestText(game) {
        if (!game.best) return "";
        const value = window.R3TRO.best(game.best.id);
        if (value === null) return "";
        const shown = game.best.time ? window.R3TRO.formatTime(value) : value;
        return `${game.best.label ? `${game.best.label} best` : "Best"}: ${shown}`;
    }

    list.innerHTML = GAMES.map(
        (g) => `
        <li data-tag="${g.tag}">
            <a class="card" href="${g.path}" style="--tint:${g.tint}">
                <span class="icon">${g.icon}</span>
                <h2>${g.name}</h2>
                <p>${g.text}</p>
                <span class="meta"><span class="tag">${g.tag}</span><span class="best">${bestText(g)}</span></span>
            </a>
        </li>`,
    ).join("");

    const chips = document.querySelectorAll(".chip");
    chips.forEach((chip) =>
        chip.addEventListener("click", () => {
            const filter = chip.dataset.filter;
            chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
            list.querySelectorAll("li").forEach((li) => {
                li.hidden = filter !== "all" && li.dataset.tag !== filter;
            });
        }),
    );
})();

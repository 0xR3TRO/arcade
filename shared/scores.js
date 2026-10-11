/*
 * R3TRO Arcade — best scores shared between the games and the launcher.
 * Stored only in the visitor's browser (localStorage); nothing is sent anywhere.
 *
 *   R3TRO.best("flap")                         -> number | null
 *   R3TRO.submit("flap", 42)                   -> { best, isNew }
 *   R3TRO.submit("sudoku-easy", 95, { lowerIsBetter: true })
 */
(() => {
    const PREFIX = "r3tro-arcade:best:";

    function best(id) {
        try {
            const raw = localStorage.getItem(PREFIX + id);
            return raw === null ? null : Number(raw);
        } catch {
            return null;
        }
    }

    function submit(id, score, { lowerIsBetter = false } = {}) {
        const current = best(id);
        const isNew =
            current === null ||
            (lowerIsBetter ? score < current : score > current);
        if (isNew) {
            try {
                localStorage.setItem(PREFIX + id, String(score));
            } catch {
                /* storage unavailable (private mode) — keep playing */
            }
        }
        return { best: isNew ? score : current, isNew };
    }

    function formatTime(seconds) {
        const s = Math.max(0, Math.floor(seconds));
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    }

    window.R3TRO = Object.freeze({ best, submit, formatTime });
})();

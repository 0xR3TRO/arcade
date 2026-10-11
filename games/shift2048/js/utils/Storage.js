/**
 * Storage — localStorage wrapper with JSON serialization and namespacing.
 */
const PREFIX = "shift2048_";

export class Storage {
    static get(key, fallback = null) {
        try {
            const raw = localStorage.getItem(PREFIX + key);
            return raw !== null ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    static set(key, value) {
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify(value));
        } catch {
            /* quota exceeded — silently fail */
        }
    }

    static remove(key) {
        localStorage.removeItem(PREFIX + key);
    }

    static getStats() {
        return Storage.get("stats", {
            gamesPlayed: 0,
            wins: 0,
            bestScore: 0,
            totalScore: 0,
            totalMoves: 0,
        });
    }

    static updateStats(partial) {
        const stats = Storage.getStats();
        Object.assign(stats, partial);
        Storage.set("stats", stats);
        return stats;
    }

    static recordGame({ score, won, moves }) {
        const stats = Storage.getStats();
        stats.gamesPlayed++;
        if (won) stats.wins++;
        if (score > stats.bestScore) stats.bestScore = score;
        stats.totalScore += score;
        stats.totalMoves += moves;
        Storage.set("stats", stats);
        return stats;
    }
}

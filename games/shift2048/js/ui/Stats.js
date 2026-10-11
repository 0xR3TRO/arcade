/**
 * Stats — Tracks and displays game statistics.
 */
import { Storage } from "../utils/Storage.js";

export class Stats {
    constructor(bus) {
        this.bus = bus;
        this.$panel = document.getElementById("stats-panel");

        bus.on("game:over", () => this.render());
        bus.on("game:win", () => this.render());
        bus.on("stats:show", () => this.show());

        this.render();
    }

    render() {
        if (!this.$panel) return;
        const s = Storage.getStats();
        const avg =
            s.gamesPlayed > 0 ? Math.round(s.totalScore / s.gamesPlayed) : 0;
        const winRate =
            s.gamesPlayed > 0 ? Math.round((s.wins / s.gamesPlayed) * 100) : 0;

        this.$panel.innerHTML = `
      <div class="stat-row"><span class="stat-label">Games</span><span class="stat-val">${s.gamesPlayed}</span></div>
      <div class="stat-row"><span class="stat-label">Win Rate</span><span class="stat-val">${winRate}%</span></div>
      <div class="stat-row"><span class="stat-label">Best</span><span class="stat-val">${s.bestScore}</span></div>
      <div class="stat-row"><span class="stat-label">Avg Score</span><span class="stat-val">${avg}</span></div>
      <div class="stat-row"><span class="stat-label">Total Moves</span><span class="stat-val">${s.totalMoves}</span></div>
    `;
    }

    show() {
        if (this.$panel) this.$panel.classList.toggle("hidden");
    }
}

/**
 * AuditLog — Records each move in a scrollable sidebar list.
 */
const DIR_LABEL = { left: "Left", right: "Right", up: "Up", down: "Down" };

export class AuditLog {
    constructor(bus, listId = "log-list") {
        this.bus = bus;
        this.$list = document.getElementById(listId);
        this._cleared = false;

        bus.on("move:resolved", (data) => this._addEntry(data));
        bus.on("game:start", () => this._clear());
        bus.on("game:undo", () => this._clear());
    }

    _clear() {
        this.$list.innerHTML =
            '<div class="log-placeholder">No moves yet.</div>';
        this._cleared = false;
    }

    _addEntry({ dir, points, moveCount }) {
        if (!this._cleared) {
            this.$list.innerHTML = "";
            this._cleared = true;
        }

        const entry = document.createElement("div");
        entry.className = "log-entry";
        const ptsClass = points > 0 ? "pts" : "pts zero";
        const ptsText = points > 0 ? `+${points}` : "No merge";
        entry.innerHTML =
            `<span class="idx">#${moveCount}</span>` +
            `<span class="dir">${DIR_LABEL[dir] || dir}</span>` +
            `<span class="${ptsClass}">${ptsText}</span>`;
        this.$list.prepend(entry);
        this.$list.scrollTop = 0;
    }
}

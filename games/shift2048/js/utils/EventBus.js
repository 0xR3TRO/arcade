/**
 * EventBus — Lightweight pub/sub for decoupled module communication.
 */
export class EventBus {
    constructor() {
        this._listeners = new Map();
    }

    on(event, fn) {
        if (!this._listeners.has(event)) this._listeners.set(event, []);
        this._listeners.get(event).push(fn);
        return () => this.off(event, fn);
    }

    off(event, fn) {
        const fns = this._listeners.get(event);
        if (!fns) return;
        const idx = fns.indexOf(fn);
        if (idx !== -1) fns.splice(idx, 1);
    }

    emit(event, ...args) {
        const fns = this._listeners.get(event);
        if (fns) fns.forEach((fn) => fn(...args));
    }

    once(event, fn) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            fn(...args);
        };
        this.on(event, wrapper);
    }

    clear() {
        this._listeners.clear();
    }
}

/* KeyMelody — R3TRO Arcade. Original code; all sounds are synthesized live with the Web Audio API. MIT License. */
(() => {
    const NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
    const BLACK = new Set([1, 3, 6, 8, 10]);
    // keyboard → semitone offset from the lowest C on screen (two octaves + top C)
    const KEYMAP = {
        KeyZ: 0, KeyS: 1, KeyX: 2, KeyD: 3, KeyC: 4, KeyV: 5, KeyG: 6, KeyB: 7, KeyH: 8, KeyN: 9, KeyJ: 10, KeyM: 11,
        KeyQ: 12, Digit2: 13, KeyW: 14, Digit3: 15, KeyE: 16, KeyR: 17, Digit5: 18, KeyT: 19, Digit6: 20, KeyY: 21, Digit7: 22, KeyU: 23,
        KeyI: 24,
    };
    const LABEL = Object.fromEntries(
        Object.entries(KEYMAP).map(([code, n]) => [n, code.replace("Key", "").replace("Digit", "")]),
    );
    const SEMITONES = 25;

    const piano = document.getElementById("piano");
    const octaveEl = document.getElementById("octave");
    const noteEl = document.getElementById("note");
    const waveEl = document.getElementById("wave");
    const volumeEl = document.getElementById("volume");
    const sustainBtn = document.getElementById("sustain");
    const labelsBtn = document.getElementById("labels");

    let audio = null;
    let master = null;
    let octave = 4;
    let sustain = false;
    let shiftSustain = false;
    const voices = new Map(); // semitone -> voice
    const keyEls = [];

    function ensureAudio() {
        if (audio) {
            if (audio.state === "suspended") audio.resume();
            return;
        }
        audio = new (window.AudioContext || window.webkitAudioContext)();
        master = audio.createGain();
        master.gain.value = Number(volumeEl.value) * 0.5;
        const filter = audio.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 6000;
        const comp = audio.createDynamicsCompressor();
        master.connect(filter).connect(comp).connect(audio.destination);
    }

    const freq = (semi) => 440 * 2 ** ((octave - 4) + (semi - 9) / 12);

    function noteOn(semi) {
        if (voices.has(semi)) noteOff(semi, true);
        ensureAudio();
        const now = audio.currentTime;
        const f = freq(semi);
        const env = audio.createGain();
        env.gain.setValueAtTime(0, now);
        env.connect(master);
        const oscs = [];
        const kind = waveEl.value;
        const partials =
            kind === "piano" ? [[1, "triangle", 0.7], [2, "sine", 0.25], [3, "sine", 0.08]]
            : kind === "organ" ? [[1, "sine", 0.5], [2, "sine", 0.3], [4, "sine", 0.15], [0.5, "sine", 0.2]]
            : [[1, kind, kind === "triangle" ? 0.8 : 0.32]];
        for (const [mult, type, gain] of partials) {
            const o = audio.createOscillator();
            const g = audio.createGain();
            o.type = type;
            o.frequency.value = f * mult;
            g.gain.value = gain;
            o.connect(g).connect(env);
            o.start(now);
            oscs.push(o);
        }
        const peak = 0.9;
        env.gain.linearRampToValueAtTime(peak, now + 0.008);
        if (kind === "piano") env.gain.setTargetAtTime(peak * 0.25, now + 0.01, 0.45);
        else env.gain.setTargetAtTime(peak * 0.75, now + 0.01, 0.2);
        voices.set(semi, { env, oscs, held: true });
        keyEls[semi]?.classList.add("active");
        noteEl.textContent = `${NAMES[semi % 12]}${octave + Math.floor(semi / 12)}`;
    }

    function noteOff(semi, immediate = false) {
        const v = voices.get(semi);
        if (!v) return;
        keyEls[semi]?.classList.remove("active");
        if (!immediate && (sustain || shiftSustain)) {
            v.held = false;
            return;
        }
        const now = audio.currentTime;
        const release = immediate ? 0.03 : 0.35;
        v.env.gain.cancelScheduledValues(now);
        v.env.gain.setValueAtTime(v.env.gain.value, now);
        v.env.gain.setTargetAtTime(0, now, release / 3);
        v.oscs.forEach((o) => o.stop(now + release * 2));
        voices.delete(semi);
    }

    function releaseSustained() {
        for (const [semi, v] of [...voices]) {
            if (!v.held) {
                voices.set(semi, { ...v, held: true });
                noteOff(semi);
            }
        }
    }

    // ---------- build keyboard ----------
    function build() {
        piano.innerHTML = "";
        keyEls.length = 0;
        const whites = [];
        for (let s = 0; s < SEMITONES; s++) {
            if (BLACK.has(s % 12)) continue;
            const el = document.createElement("button");
            el.type = "button";
            el.className = "key white";
            el.dataset.semi = s;
            el.innerHTML = `<span>${LABEL[s] ?? ""}</span>`;
            el.setAttribute("aria-label", `${NAMES[s % 12]}${octave + Math.floor(s / 12)}`);
            piano.appendChild(el);
            keyEls[s] = el;
            whites.push(s);
        }
        const whiteCount = whites.length;
        for (let s = 0; s < SEMITONES; s++) {
            if (!BLACK.has(s % 12)) continue;
            const leftWhite = whites.indexOf(s - 1);
            const el = document.createElement("button");
            el.type = "button";
            el.className = "key black";
            el.dataset.semi = s;
            el.innerHTML = `<span>${LABEL[s] ?? ""}</span>`;
            el.setAttribute("aria-label", `${NAMES[s % 12]}${octave + Math.floor(s / 12)}`);
            const unit = 100 / whiteCount;
            el.style.left = `calc(14px + (100% - 28px) * ${((leftWhite + 1) * unit - unit * 0.32) / 100})`;
            el.style.width = `calc((100% - 28px) * ${(unit * 0.64) / 100})`;
            piano.appendChild(el);
            keyEls[s] = el;
        }
    }

    // ---------- input ----------
    const pointerNotes = new Map(); // pointerId -> semitone
    piano.addEventListener("pointerdown", (e) => {
        const key = e.target.closest(".key");
        if (!key) return;
        e.preventDefault();
        piano.setPointerCapture(e.pointerId);
        const semi = Number(key.dataset.semi);
        pointerNotes.set(e.pointerId, semi);
        noteOn(semi);
    });
    piano.addEventListener("pointermove", (e) => {
        if (!pointerNotes.has(e.pointerId)) return;
        const el = document.elementFromPoint(e.clientX, e.clientY)?.closest(".key");
        if (!el) return;
        const semi = Number(el.dataset.semi);
        const prev = pointerNotes.get(e.pointerId);
        if (semi === prev) return;
        noteOff(prev);
        pointerNotes.set(e.pointerId, semi);
        noteOn(semi);
    });
    const endPointer = (e) => {
        if (!pointerNotes.has(e.pointerId)) return;
        noteOff(pointerNotes.get(e.pointerId));
        pointerNotes.delete(e.pointerId);
    };
    ["pointerup", "pointercancel"].forEach((ev) => piano.addEventListener(ev, endPointer));

    window.addEventListener("keydown", (e) => {
        if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT") return;
        if (e.key === "Shift") {
            shiftSustain = true;
            return;
        }
        if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
            e.preventDefault();
            setOctave(octave + (e.code === "ArrowRight" ? 1 : -1));
            return;
        }
        if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
        const semi = KEYMAP[e.code];
        if (semi !== undefined) {
            e.preventDefault();
            noteOn(semi);
        }
    });
    window.addEventListener("keyup", (e) => {
        if (e.key === "Shift") {
            shiftSustain = false;
            if (!sustain) releaseSustained();
            return;
        }
        const semi = KEYMAP[e.code];
        if (semi !== undefined) noteOff(semi);
    });
    window.addEventListener("blur", () => {
        for (const semi of [...voices.keys()]) noteOff(semi, true);
    });

    function setOctave(o) {
        octave = Math.max(2, Math.min(6, o));
        octaveEl.textContent = octave;
        for (const semi of [...voices.keys()]) noteOff(semi, true);
        build();
    }

    document.getElementById("oct-down").addEventListener("click", () => setOctave(octave - 1));
    document.getElementById("oct-up").addEventListener("click", () => setOctave(octave + 1));
    sustainBtn.addEventListener("click", () => {
        sustain = !sustain;
        sustainBtn.setAttribute("aria-pressed", String(sustain));
        if (!sustain) releaseSustained();
    });
    labelsBtn.addEventListener("click", () => {
        const on = labelsBtn.getAttribute("aria-pressed") !== "true";
        labelsBtn.setAttribute("aria-pressed", String(on));
        piano.classList.toggle("no-labels", !on);
    });
    volumeEl.addEventListener("input", () => {
        if (master) master.gain.value = Number(volumeEl.value) * 0.5;
    });

    build();
})();

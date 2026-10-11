"use strict";

/**
 * R3TRO Blocks Audio System
 * Procedural audio generation using Web Audio API
 * @module audio
 */

// ============================================================================
// AUDIO ENGINE
// ============================================================================

/**
 * Procedural audio engine for game sounds and music
 * @class AudioEngine
 */
class AudioEngine {
    static MUSIC_STYLES = {
        classic: {
            tempo: 152,
            wave: "square",
            gain: 0.18,
            melody: [
                { note: "E5", duration: 0.25 },
                { note: "B4", duration: 0.125 },
                { note: "C5", duration: 0.125 },
                { note: "D5", duration: 0.25 },
                { note: "C5", duration: 0.125 },
                { note: "B4", duration: 0.125 },
                { note: "A4", duration: 0.25 },
                { note: "A4", duration: 0.125 },
                { note: "C5", duration: 0.125 },
                { note: "E5", duration: 0.25 },
                { note: "D5", duration: 0.125 },
                { note: "C5", duration: 0.125 },
                { note: "B4", duration: 0.375 },
                { note: "C5", duration: 0.125 },
                { note: "D5", duration: 0.25 },
                { note: "E5", duration: 0.25 },
                { note: "C5", duration: 0.25 },
                { note: "A4", duration: 0.25 },
                { note: "A4", duration: 0.5 },
            ],
            bass: [
                { note: "E3", duration: 0.5 },
                { note: "B2", duration: 0.5 },
                { note: "C3", duration: 0.5 },
                { note: "D3", duration: 0.5 },
            ],
            percussion: [
                { time: 0, type: "hat" },
                { time: 0.5, type: "hat" },
                { time: 1, type: "hat" },
                { time: 1.5, type: "hat" },
            ],
        },
        pulse: {
            tempo: 176,
            wave: "sawtooth",
            gain: 0.16,
            melody: [
                { note: "A4", duration: 0.125 },
                { note: "C5", duration: 0.125 },
                { note: "E5", duration: 0.25 },
                { note: "D5", duration: 0.125 },
                { note: "C5", duration: 0.125 },
                { note: "B4", duration: 0.25 },
                { note: "A4", duration: 0.25 },
                { note: "G4", duration: 0.25 },
            ],
            bass: [
                { note: "A2", duration: 0.25 },
                { note: "E3", duration: 0.25 },
                { note: "F3", duration: 0.25 },
                { note: "E3", duration: 0.25 },
            ],
            percussion: [
                { time: 0, type: "kick" },
                { time: 0.25, type: "hat" },
                { time: 0.5, type: "snare" },
                { time: 0.75, type: "hat" },
            ],
        },
        ambient: {
            tempo: 112,
            wave: "triangle",
            gain: 0.12,
            melody: [
                { note: "E4", duration: 0.5 },
                { note: "G4", duration: 0.5 },
                { note: "B4", duration: 0.5 },
                { note: "D5", duration: 0.5 },
            ],
            bass: [
                { note: "E2", duration: 1 },
                { note: "B2", duration: 1 },
                { note: "D3", duration: 1 },
                { note: "B2", duration: 1 },
            ],
            pad: true,
        },
    };

    #ctx;
    #masterGain;
    #sfxGain;
    #musicGain;
    #enabled = true;
    #musicEnabled = true;
    #musicOscillators = [];
    #musicPlaying = false;
    #musicStyle = "classic";
    #musicTimer = null;

    constructor() {
        // Defer AudioContext creation until user interaction
        this.#ctx = null;
        this.#masterGain = null;
        this.#sfxGain = null;
        this.#musicGain = null;
    }

    /**
     * Initialize audio context (must be called after user interaction)
     */
    init() {
        if (this.#ctx) return;

        this.#ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Master gain
        this.#masterGain = this.#ctx.createGain();
        this.#masterGain.gain.value = 0.7;
        this.#masterGain.connect(this.#ctx.destination);

        // SFX gain
        this.#sfxGain = this.#ctx.createGain();
        this.#sfxGain.gain.value = 1.0;
        this.#sfxGain.connect(this.#masterGain);

        // Music gain
        this.#musicGain = this.#ctx.createGain();
        this.#musicGain.gain.value = 0.4;
        this.#musicGain.connect(this.#masterGain);
    }

    /**
     * Resume audio context if suspended
     */
    async resume() {
        if (this.#ctx && this.#ctx.state === "suspended") {
            await this.#ctx.resume();
        }
    }

    // =========================================================================
    // VOLUME CONTROLS
    // =========================================================================

    /**
     * Set master volume
     * @param {number} value - Volume (0-1)
     */
    setMasterVolume(value) {
        if (this.#masterGain) {
            this.#masterGain.gain.value = Math.max(0, Math.min(1, value));
        }
    }

    /**
     * Set SFX volume
     * @param {number} value - Volume (0-1)
     */
    setSfxVolume(value) {
        if (this.#sfxGain) {
            this.#sfxGain.gain.value = Math.max(0, Math.min(1, value));
        }
    }

    /**
     * Set music volume
     * @param {number} value - Volume (0-1)
     */
    setMusicVolume(value) {
        if (this.#musicGain) {
            this.#musicGain.gain.value = Math.max(0, Math.min(1, value));
        }
    }

    /**
     * Set music style
     * @param {string} style - Style key
     */
    setMusicStyle(style) {
        if (!AudioEngine.MUSIC_STYLES[style]) style = "classic";
        this.#musicStyle = style;
        if (this.#musicPlaying) {
            this.stopMusic();
            this.playMusic();
        }
    }

    /**
     * Enable/disable all audio
     * @param {boolean} enabled - Enable state
     */
    setEnabled(enabled) {
        this.#enabled = enabled;
        if (!enabled) {
            this.stopMusic();
        }
    }

    /**
     * Enable/disable music
     * @param {boolean} enabled - Enable state
     */
    setMusicEnabled(enabled) {
        this.#musicEnabled = enabled;
        if (!enabled) {
            this.stopMusic();
        }
    }

    // =========================================================================
    // SOUND EFFECTS
    // =========================================================================

    /**
     * Internal beep generator
     * @param {number} freq - Frequency in Hz
     * @param {number} duration - Duration in seconds
     * @param {string} type - Oscillator type
     * @param {number} gain - Gain value (0-1)
     */
    #beep(freq, duration, type, gain) {
        if (!this.#enabled || !this.#ctx) return;

        const osc = this.#ctx.createOscillator();
        const g = this.#ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        g.gain.setValueAtTime(gain, this.#ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(
            0.001,
            this.#ctx.currentTime + duration,
        );

        osc.connect(g);
        g.connect(this.#sfxGain);

        osc.start();
        osc.stop(this.#ctx.currentTime + duration);
    }

    /**
     * Play a chord
     * @param {number[]} freqs - Array of frequencies
     * @param {number} duration - Duration in seconds
     * @param {string} type - Oscillator type
     * @param {number} gain - Gain per note
     */
    #playChord(freqs, duration, type, gain) {
        freqs.forEach((freq, i) => {
            setTimeout(() => this.#beep(freq, duration, type, gain), i * 30);
        });
    }

    /**
     * Play move sound (short click)
     */
    playMove() {
        this.#beep(220, 0.05, "square", 0.08);
    }

    /**
     * Play rotation sound (higher click)
     */
    playRotate() {
        this.#beep(330, 0.05, "square", 0.06);
    }

    /**
     * Play lock/landing sound
     */
    playLock() {
        this.#beep(110, 0.1, "sawtooth", 0.12);
    }

    /**
     * Play line clear sound
     * @param {number} lines - Number of lines cleared
     */
    playLineClear(lines) {
        const freqs = [262, 330, 392, 523]; // C4 E4 G4 C5
        const notesToPlay = freqs.slice(0, lines);
        this.#playChord(notesToPlay, 0.2, "sine", 0.25);
    }

    /**
     * Play quad (4 lines) sound
     */
    playQuad() {
        if (!this.#enabled || !this.#ctx) return;

        // Triumphant fanfare
        const melody = [
            { freq: 523, time: 0 }, // C5
            { freq: 659, time: 0.1 }, // E5
            { freq: 784, time: 0.2 }, // G5
            { freq: 1047, time: 0.3 }, // C6
            { freq: 784, time: 0.5 }, // G5
            { freq: 1047, time: 0.6 }, // C6
        ];

        melody.forEach(({ freq, time }) => {
            setTimeout(
                () => this.#beep(freq, 0.15, "square", 0.2),
                time * 1000,
            );
        });
    }

    /**
     * Play T-Spin sound (glitchy effect)
     */
    playTSpin() {
        if (!this.#enabled || !this.#ctx) return;

        // Glitchy wobble effect
        const osc = this.#ctx.createOscillator();
        const g = this.#ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(200, this.#ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(
            800,
            this.#ctx.currentTime + 0.1,
        );
        osc.frequency.exponentialRampToValueAtTime(
            150,
            this.#ctx.currentTime + 0.2,
        );

        g.gain.setValueAtTime(0.2, this.#ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(
            0.001,
            this.#ctx.currentTime + 0.25,
        );

        osc.connect(g);
        g.connect(this.#sfxGain);

        osc.start();
        osc.stop(this.#ctx.currentTime + 0.25);
    }

    /**
     * Play level up sound
     */
    playLevelUp() {
        if (!this.#enabled || !this.#ctx) return;

        // Ascending arpeggio
        const notes = [262, 330, 392, 523, 659]; // C4 E4 G4 C5 E5

        notes.forEach((freq, i) => {
            setTimeout(() => this.#beep(freq, 0.15, "triangle", 0.15), i * 60);
        });
    }

    /**
     * Play game over sound
     */
    playGameOver() {
        if (!this.#enabled || !this.#ctx) return;

        // Descending tone
        const osc = this.#ctx.createOscillator();
        const g = this.#ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(400, this.#ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(
            50,
            this.#ctx.currentTime + 1.5,
        );

        g.gain.setValueAtTime(0.3, this.#ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.#ctx.currentTime + 1.5);

        osc.connect(g);
        g.connect(this.#sfxGain);

        osc.start();
        osc.stop(this.#ctx.currentTime + 1.5);
    }

    /**
     * Play hard drop sound
     */
    playHardDrop() {
        if (!this.#enabled || !this.#ctx) return;

        // Impact sound
        this.#beep(80, 0.15, "sawtooth", 0.2);

        const osc = this.#ctx.createOscillator();
        const g = this.#ctx.createGain();

        osc.type = "square";
        osc.frequency.setValueAtTime(150, this.#ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(
            60,
            this.#ctx.currentTime + 0.1,
        );

        g.gain.setValueAtTime(0.15, this.#ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.#ctx.currentTime + 0.1);

        osc.connect(g);
        g.connect(this.#sfxGain);

        osc.start();
        osc.stop(this.#ctx.currentTime + 0.1);
    }

    /**
     * Play hold sound
     */
    playHold() {
        this.#beep(440, 0.08, "sine", 0.1);
        setTimeout(() => this.#beep(550, 0.08, "sine", 0.08), 60);
    }

    /**
     * Play pause sound
     */
    playPause() {
        this.#beep(440, 0.1, "sine", 0.1);
    }

    /**
     * Play menu select sound
     */
    playMenuSelect() {
        this.#beep(660, 0.08, "square", 0.08);
    }

    /**
     * Play menu move sound
     */
    playMenuMove() {
        this.#beep(330, 0.05, "square", 0.05);
    }

    // =========================================================================
    // BACKGROUND MUSIC (Korobeiniki-inspired)
    // =========================================================================

    /**
     * Play background music (simple procedural loop)
     */
    playMusic() {
        if (!this.#enabled || !this.#musicEnabled || !this.#ctx) return;

        this.stopMusic();
        this.#musicPlaying = true;

        const style =
            AudioEngine.MUSIC_STYLES[this.#musicStyle] ||
            AudioEngine.MUSIC_STYLES.classic;
        const beatDuration = 60 / style.tempo;

        const melodyBeats = style.melody.reduce(
            (sum, n) => sum + (n.duration || 1),
            0,
        );
        const bassBeats = (style.bass || []).reduce(
            (sum, n) => sum + (n.duration || 1),
            0,
        );
        const loopBeats = Math.max(
            melodyBeats,
            bassBeats,
            (style.pad ? melodyBeats * 2 : 0) || melodyBeats,
        );

        this.#scheduleMusic(style, beatDuration, loopBeats || 8);
    }

    /**
     * Stop background music
     */
    stopMusic() {
        this.#musicPlaying = false;
        if (this.#musicTimer) {
            clearTimeout(this.#musicTimer);
            this.#musicTimer = null;
        }
        this.#musicOscillators.forEach((osc) => {
            try {
                osc.stop();
            } catch (e) {
                /* Already stopped */
            }
        });
        this.#musicOscillators = [];
    }

    /**
     * Toggle background music
     */
    toggleMusic() {
        if (this.#musicPlaying) {
            this.stopMusic();
        } else {
            this.playMusic();
        }
    }

    /**
     * Schedule a music phrase and loop it
     * @param {Object} style - Music style definition
     * @param {number} beatDuration - Duration of one beat in seconds
     * @param {number} loopBeats - Beats per loop
     */
    #scheduleMusic(style, beatDuration, loopBeats) {
        if (!this.#ctx) return;
        const startTime = this.#ctx.currentTime;

        let melodyTime = startTime;
        style.melody.forEach((note) => {
            const freq = this.#noteToFreq(note.note);
            const duration = (note.duration || 1) * beatDuration;
            this.#playNote(
                freq,
                duration,
                melodyTime,
                style.wave,
                style.gain,
            );
            melodyTime += duration;
        });

        if (style.bass?.length) {
            let bassTime = startTime;
            style.bass.forEach((note) => {
                const freq = this.#noteToFreq(note.note);
                const duration = (note.duration || 1) * beatDuration;
                this.#playNote(freq, duration, bassTime, "triangle", 0.12);
                bassTime += duration;
            });
        }

        if (style.pad && style.melody[0]) {
            const padFreq = this.#noteToFreq(style.melody[0].note) / 2;
            if (padFreq) {
                this.#playPad(padFreq, loopBeats * beatDuration, startTime);
            }
        }

        if (style.percussion?.length) {
            style.percussion.forEach((hit) => {
                const time =
                    startTime + (hit.time || 0) * beatDuration - 0.02;
                this.#playPercussion(time, hit.type || "hat");
            });
        }

        const loopDuration = loopBeats * beatDuration;
        this.#musicTimer = setTimeout(
            () => this.#scheduleMusic(style, beatDuration, loopBeats),
            loopDuration * 1000,
        );
    }

    /**
     * Play a note routed to music gain
     */
    #playNote(freq, duration, startTime, type, gain) {
        if (!this.#ctx || !freq) return;

        const osc = this.#ctx.createOscillator();
        const g = this.#ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        g.gain.setValueAtTime(gain, startTime);
        g.gain.setValueAtTime(gain, startTime + duration * 0.8);
        g.gain.exponentialRampToValueAtTime(
            0.001,
            startTime + duration + 0.01,
        );

        osc.connect(g);
        g.connect(this.#musicGain);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);

        osc.onended = () => {
            this.#musicOscillators = this.#musicOscillators.filter(
                (o) => o !== osc,
            );
        };
        this.#musicOscillators.push(osc);
    }

    /**
     * Play sustained pad for ambient style
     */
    #playPad(freq, duration, startTime) {
        const osc = this.#ctx.createOscillator();
        const g = this.#ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;

        g.gain.setValueAtTime(0.001, startTime);
        g.gain.linearRampToValueAtTime(0.08, startTime + 0.6);
        g.gain.setValueAtTime(0.08, startTime + duration - 0.6);
        g.gain.exponentialRampToValueAtTime(
            0.001,
            startTime + duration,
        );

        osc.connect(g);
        g.connect(this.#musicGain);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);
        osc.onended = () => {
            this.#musicOscillators = this.#musicOscillators.filter(
                (o) => o !== osc,
            );
        };
        this.#musicOscillators.push(osc);
    }

    /**
     * Light-weight percussion using filtered noise
     */
    #playPercussion(time, type) {
        if (!this.#ctx) return;

        const buffer = this.#ctx.createBuffer(
            1,
            this.#ctx.sampleRate * 0.2,
            this.#ctx.sampleRate,
        );
        const data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.#ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.#ctx.createBiquadFilter();
        filter.type = type === "kick" ? "lowpass" : "highpass";
        filter.frequency.value = type === "kick" ? 140 : 1800;

        const g = this.#ctx.createGain();
        g.gain.setValueAtTime(type === "kick" ? 0.35 : 0.18, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        noise.connect(filter);
        filter.connect(g);
        g.connect(this.#musicGain);

        noise.start(time);
        noise.stop(time + 0.2);
    }

    /**
     * Convert scientific pitch notation to frequency
     * @param {string} note
     * @returns {number}
     */
    #noteToFreq(note) {
        const match = /([A-G])(#|b)?(\d)/.exec(note);
        if (!match) return 0;
        const [, letter, accidental, octaveStr] = match;
        const octave = parseInt(octaveStr, 10);
        const semitoneMap = {
            C: -9,
            D: -7,
            E: -5,
            F: -4,
            G: -2,
            A: 0,
            B: 2,
        };
        let semitone = semitoneMap[letter] || 0;
        if (accidental === "#") semitone += 1;
        if (accidental === "b") semitone -= 1;
        const distance = semitone + (octave - 4) * 12;
        return 440 * Math.pow(2, distance / 12);
    }

    /**
     * Check if music is playing
     * @returns {boolean} True if playing
     */
    isMusicPlaying() {
        return this.#musicPlaying;
    }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = { AudioEngine };
}

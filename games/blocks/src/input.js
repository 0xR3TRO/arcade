"use strict";

/**
 * R3TRO Blocks Input System
 * Handles keyboard, touch, and gamepad input with DAS/ARR
 * @module input
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default input configuration */
const DEFAULT_INPUT_CONFIG = {
    DAS: 167, // Delayed Auto Shift (ms before repeat starts)
    ARR: 33, // Auto Repeat Rate (ms between repeats)
    SDF: 20, // Soft Drop Factor (multiplier for soft drop speed)
};

/** Key mappings */
const KEY_ACTIONS = {
    ArrowLeft: "moveLeft",
    ArrowRight: "moveRight",
    ArrowDown: "softDrop",
    ArrowUp: "rotateCW",
    KeyX: "rotateCW",
    KeyZ: "rotateCCW",
    ControlLeft: "rotateCCW",
    ControlRight: "rotateCCW",
    Space: "hardDrop",
    KeyC: "hold",
    ShiftLeft: "hold",
    ShiftRight: "hold",
    KeyP: "pause",
    Escape: "pause",
    KeyR: "restart",
    KeyF: "toggleFps",
};

// ============================================================================
// INPUT MANAGER
// ============================================================================

/**
 * Handles all input methods and DAS/ARR timing
 * @class InputManager
 */
class InputManager {
    #engine;
    #config;
    #keyStates = new Map();
    #dasTimers = new Map();
    #arrTimers = new Map();
    #touchControlStates = new Map();
    #callbacks = new Map();
    #touchStartX = 0;
    #touchStartY = 0;
    #touchStartTime = 0;
    #isTouching = false;
    #lastTap = 0;
    #gamepadIndex = null;
    #enabled = true;

    /**
     * @param {GameEngine} engine - Game engine instance
     * @param {Object} config - Input configuration
     */
    constructor(engine, config = {}) {
        this.#engine = engine;
        this.#config = { ...DEFAULT_INPUT_CONFIG, ...config };

        this.#setupKeyboard();
        this.#setupTouch();
        this.#setupTouchButtons();
        this.#setupGamepad();
    }

    /**
     * Get current configuration
     * @returns {Object} Configuration
     */
    get config() {
        return { ...this.#config };
    }

    /**
     * Update configuration
     * @param {Object} newConfig - New configuration values
     */
    setConfig(newConfig) {
        this.#config = { ...this.#config, ...newConfig };
    }

    /**
     * Enable or disable input
     * @param {boolean} enabled - Enable state
     */
    setEnabled(enabled) {
        this.#enabled = enabled;
        if (!enabled) {
            this.#keyStates.clear();
            this.#dasTimers.forEach((timer) => clearTimeout(timer));
            this.#arrTimers.forEach((timer) => clearInterval(timer));
            this.#dasTimers.clear();
            this.#arrTimers.clear();
            this.#releaseTouchControls();
        }
    }

    /**
     * Register callback for an action
     * @param {string} action - Action name
     * @param {Function} callback - Callback function
     */
    on(action, callback) {
        if (!this.#callbacks.has(action)) {
            this.#callbacks.set(action, new Set());
        }
        this.#callbacks.get(action).add(callback);
    }

    /**
     * Trigger action callbacks
     * @param {string} action - Action name
     */
    #triggerAction(action) {
        if (this.#callbacks.has(action)) {
            this.#callbacks.get(action).forEach((cb) => cb());
        }
    }

    // =========================================================================
    // KEYBOARD HANDLING
    // =========================================================================

    /**
     * Setup keyboard event listeners
     */
    #setupKeyboard() {
        document.addEventListener("keydown", (e) => this.#onKeyDown(e));
        document.addEventListener("keyup", (e) => this.#onKeyUp(e));
        window.addEventListener("blur", () => this.#onBlur());
    }

    /**
     * Handle keydown event
     * @param {KeyboardEvent} event - Keyboard event
     */
    #onKeyDown(event) {
        if (!this.#enabled) return;

        const action = KEY_ACTIONS[event.code];
        if (!action) return;

        // Prevent default for game keys
        event.preventDefault();

        // Don't repeat if already pressed
        if (this.#keyStates.get(event.code)) return;

        this.#keyStates.set(event.code, true);
        this.#handleAction(action);

        // Start DAS for repeatable actions
        if (action === "moveLeft" || action === "moveRight") {
            this.#startDAS(action);
        }
    }

    /**
     * Handle keyup event
     * @param {KeyboardEvent} event - Keyboard event
     */
    #onKeyUp(event) {
        const action = KEY_ACTIONS[event.code];
        if (!action) return;

        this.#keyStates.set(event.code, false);
        this.#stopDAS(action);
    }

    /**
     * Handle window blur (pause game, release keys)
     */
    #onBlur() {
        this.#keyStates.clear();
        this.#dasTimers.forEach((_, action) => this.#stopDAS(action));

        // Auto-pause on blur
        if (!this.#engine.gameOver && !this.#engine.paused) {
            this.#engine.setPaused(true);
        }
    }

    // =========================================================================
    // DAS / ARR
    // =========================================================================

    /**
     * Start DAS timer for an action
     * @param {string} action - Action name
     */
    #startDAS(action) {
        // Clear any existing timers
        this.#stopDAS(action);

        // Start DAS delay
        const dasTimer = setTimeout(() => {
            // Start ARR repeat
            const arrTimer = setInterval(() => {
                if (this.#enabled) {
                    this.#handleAction(action);
                }
            }, this.#config.ARR);

            this.#arrTimers.set(action, arrTimer);
        }, this.#config.DAS);

        this.#dasTimers.set(action, dasTimer);
    }

    /**
     * Stop DAS/ARR timers for an action
     * @param {string} action - Action name
     */
    #stopDAS(action) {
        if (this.#dasTimers.has(action)) {
            clearTimeout(this.#dasTimers.get(action));
            this.#dasTimers.delete(action);
        }
        if (this.#arrTimers.has(action)) {
            clearInterval(this.#arrTimers.get(action));
            this.#arrTimers.delete(action);
        }
    }

    // =========================================================================
    // ACTION HANDLING
    // =========================================================================

    /**
     * Handle a game action
     * @param {string} action - Action name
     */
    #handleAction(action) {
        if (!this.#enabled) return;

        switch (action) {
            case "moveLeft":
                this.#engine.movePiece(-1);
                this.#triggerAction("move");
                break;

            case "moveRight":
                this.#engine.movePiece(1);
                this.#triggerAction("move");
                break;

            case "softDrop":
                if (this.#engine.softDrop()) {
                    this.#triggerAction("softDrop");
                }
                break;

            case "hardDrop":
                this.#engine.hardDrop();
                this.#triggerAction("hardDrop");
                break;

            case "rotateCW":
                if (this.#engine.rotatePiece(1)) {
                    this.#triggerAction("rotate");
                }
                break;

            case "rotateCCW":
                if (this.#engine.rotatePiece(-1)) {
                    this.#triggerAction("rotate");
                }
                break;

            case "hold":
                if (this.#engine.hold()) {
                    this.#triggerAction("hold");
                }
                break;

            case "pause":
                this.#engine.togglePause();
                this.#triggerAction("pause");
                break;

            case "restart":
                if (this.#engine.gameOver) {
                    this.#triggerAction("restart");
                }
                break;

            case "toggleFps":
                this.#triggerAction("toggleFps");
                break;
        }
    }

    // =========================================================================
    // TOUCH HANDLING
    // =========================================================================

    /**
     * Setup touch event listeners
     */
    #setupTouch() {
        const canvas = document.getElementById("game-canvas");
        if (!canvas) return;

        canvas.addEventListener("touchstart", (e) => this.#onTouchStart(e), {
            passive: false,
        });
        canvas.addEventListener("touchmove", (e) => this.#onTouchMove(e), {
            passive: false,
        });
        canvas.addEventListener("touchend", (e) => this.#onTouchEnd(e), {
            passive: false,
        });
    }

    /**
     * Setup on-screen touch controls
     */
    #setupTouchButtons() {
        const buttons = document.querySelectorAll("[data-touch-action]");
        if (buttons.length === 0) return;

        const startPress = (button) => {
            if (!this.#enabled) return;

            const action = button.dataset.touchAction;
            if (!action) return;

            this.#stopTouchRepeat(button);
            this.#handleAction(action);

            if (button.dataset.repeat !== "true") return;

            const repeatDelay = Number.parseInt(
                button.dataset.repeatDelay || "140",
                10,
            );
            const repeatRate = Number.parseInt(
                button.dataset.repeatRate || "70",
                10,
            );

            const state = {
                timeoutId: null,
                intervalId: null,
            };

            state.timeoutId = setTimeout(() => {
                state.intervalId = setInterval(() => {
                    if (this.#enabled) {
                        this.#handleAction(action);
                    }
                }, repeatRate);
            }, repeatDelay);

            this.#touchControlStates.set(button, state);
        };

        const stopPress = (button) => {
            this.#stopTouchRepeat(button);
        };

        buttons.forEach((button) => {
            button.addEventListener("pointerdown", (event) => {
                event.preventDefault();
                startPress(button);
            });

            button.addEventListener("pointerup", () => {
                stopPress(button);
            });

            button.addEventListener("pointercancel", () => {
                stopPress(button);
            });

            button.addEventListener("pointerleave", () => {
                stopPress(button);
            });

            button.addEventListener("contextmenu", (event) => {
                event.preventDefault();
            });
        });

        window.addEventListener("pointerup", () =>
            this.#releaseTouchControls(),
        );
        window.addEventListener("blur", () => this.#releaseTouchControls());
    }

    /**
     * Stop repeat timers for one touch button
     * @param {HTMLElement} button - Button element
     */
    #stopTouchRepeat(button) {
        const state = this.#touchControlStates.get(button);
        if (!state) return;

        if (state.timeoutId !== null) {
            clearTimeout(state.timeoutId);
        }

        if (state.intervalId !== null) {
            clearInterval(state.intervalId);
        }

        this.#touchControlStates.delete(button);
    }

    /**
     * Stop repeat timers for all touch buttons
     */
    #releaseTouchControls() {
        this.#touchControlStates.forEach((_, button) => {
            this.#stopTouchRepeat(button);
        });
    }

    /**
     * Handle touch start
     * @param {TouchEvent} event - Touch event
     */
    #onTouchStart(event) {
        if (!this.#enabled) return;
        event.preventDefault();

        const touch = event.touches[0];
        this.#touchStartX = touch.clientX;
        this.#touchStartY = touch.clientY;
        this.#touchStartTime = performance.now();
        this.#isTouching = true;
    }

    /**
     * Handle touch move
     * @param {TouchEvent} event - Touch event
     */
    #onTouchMove(event) {
        if (!this.#enabled || !this.#isTouching) return;
        event.preventDefault();

        const touch = event.touches[0];
        const deltaX = touch.clientX - this.#touchStartX;
        const deltaY = touch.clientY - this.#touchStartY;

        const swipeThreshold = 30;

        // Horizontal swipe
        if (Math.abs(deltaX) > swipeThreshold) {
            if (deltaX > 0) {
                this.#engine.movePiece(1);
                this.#triggerAction("move");
            } else {
                this.#engine.movePiece(-1);
                this.#triggerAction("move");
            }
            this.#touchStartX = touch.clientX;
        }

        // Downward swipe (soft drop)
        if (deltaY > swipeThreshold) {
            if (this.#engine.softDrop()) {
                this.#triggerAction("softDrop");
            }
            this.#touchStartY = touch.clientY;
        }

        // Upward swipe (hard drop)
        if (deltaY < -swipeThreshold * 2) {
            this.#engine.hardDrop();
            this.#triggerAction("hardDrop");
            this.#isTouching = false;
        }
    }

    /**
     * Handle touch end
     * @param {TouchEvent} event - Touch event
     */
    #onTouchEnd(event) {
        if (!this.#enabled) return;
        event.preventDefault();

        const touchDuration = performance.now() - this.#touchStartTime;
        const canvas = document.getElementById("game-canvas");

        // Tap detection
        if (this.#isTouching && touchDuration < 200) {
            const touch = event.changedTouches[0];
            const rect = canvas.getBoundingClientRect();
            const tapX = touch.clientX - rect.left;

            // Left half = CCW rotation, Right half = CW rotation
            if (tapX < rect.width / 2) {
                if (this.#engine.rotatePiece(-1)) {
                    this.#triggerAction("rotate");
                }
            } else {
                if (this.#engine.rotatePiece(1)) {
                    this.#triggerAction("rotate");
                }
            }
        }

        // Long press detection (hold)
        if (this.#isTouching && touchDuration > 500) {
            if (this.#engine.hold()) {
                this.#triggerAction("hold");
            }
        }

        this.#isTouching = false;
    }

    // =========================================================================
    // GAMEPAD HANDLING
    // =========================================================================

    /**
     * Setup gamepad event listeners
     */
    #setupGamepad() {
        window.addEventListener("gamepadconnected", (e) => {
            this.#gamepadIndex = e.gamepad.index;
            console.log(`Gamepad connected: ${e.gamepad.id}`);
        });

        window.addEventListener("gamepaddisconnected", () => {
            this.#gamepadIndex = null;
            console.log("Gamepad disconnected");
        });
    }

    /**
     * Poll gamepad state (call in game loop)
     */
    pollGamepad() {
        if (this.#gamepadIndex === null || !this.#enabled) return;

        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[this.#gamepadIndex];
        if (!gamepad) return;

        // D-pad / Left stick
        const horizontal = gamepad.axes[0] || 0;
        const vertical = gamepad.axes[1] || 0;

        // D-pad buttons (standard mapping)
        const dpadUp = gamepad.buttons[12]?.pressed;
        const dpadDown = gamepad.buttons[13]?.pressed;
        const dpadLeft = gamepad.buttons[14]?.pressed;
        const dpadRight = gamepad.buttons[15]?.pressed;

        // Handle movement (simplified - would need proper DAS for production)
        if (dpadLeft || horizontal < -0.5) {
            this.#handleAction("moveLeft");
        }
        if (dpadRight || horizontal > 0.5) {
            this.#handleAction("moveRight");
        }
        if (dpadDown || vertical > 0.5) {
            this.#handleAction("softDrop");
        }

        // Action buttons (Xbox layout: A=0, B=1, X=2, Y=3)
        if (gamepad.buttons[0]?.pressed) {
            // A - rotate CW
            this.#handleAction("rotateCW");
        }
        if (gamepad.buttons[1]?.pressed) {
            // B - rotate CCW
            this.#handleAction("rotateCCW");
        }
        if (gamepad.buttons[3]?.pressed) {
            // Y - hard drop
            this.#handleAction("hardDrop");
        }
        if (gamepad.buttons[4]?.pressed) {
            // LB - hold
            this.#handleAction("hold");
        }
        if (gamepad.buttons[9]?.pressed) {
            // Start - pause
            this.#handleAction("pause");
        }
    }

    /**
     * Check if soft drop key is held
     * @returns {boolean} True if soft drop is held
     */
    isSoftDropHeld() {
        return this.#keyStates.get("ArrowDown") || false;
    }

    /**
     * Get soft drop factor
     * @returns {number} Soft drop multiplier
     */
    getSoftDropFactor() {
        return this.#config.SDF;
    }

    /**
     * Cleanup event listeners
     */
    destroy() {
        // Clear all timers
        this.#dasTimers.forEach((timer) => clearTimeout(timer));
        this.#arrTimers.forEach((timer) => clearInterval(timer));
        this.#releaseTouchControls();
        this.#dasTimers.clear();
        this.#arrTimers.clear();
        this.#keyStates.clear();
    }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = { InputManager, DEFAULT_INPUT_CONFIG, KEY_ACTIONS };
}

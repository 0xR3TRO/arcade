"use strict";

/**
 * Central place for localStorage keys used by TypeMaster.
 */
const STORAGE_KEYS = {
	HISTORY: "typemaster_history_v1",
	THEME: "typemaster_theme_v1"
};

/**
 * Static text data used to generate typing tests locally in the browser.
 */
const TEXT_LIBRARY = {
	words: [
		"adaptive",
		"binary",
		"canvas",
		"dynamic",
		"element",
		"future",
		"global",
		"harbor",
		"insight",
		"journey",
		"keyboard",
		"logic",
		"module",
		"native",
		"object",
		"pattern",
		"quality",
		"render",
		"signal",
		"thread",
		"update",
		"vector",
		"window",
		"syntax",
		"yellow",
		"zenith",
		"anchor",
		"bridge",
		"cloud",
		"driven",
		"engine",
		"fluent",
		"growth",
		"horizon",
		"impact",
		"jungle",
		"kernel",
		"launch",
		"moment",
		"network",
		"origin",
		"planet",
		"query",
		"rhythm",
		"stream",
		"target",
		"unique",
		"vision",
		"workflow",
		"xenial",
		"yonder",
		"zeal",
		"action",
		"balance",
		"craft",
		"design",
		"effort",
		"focus",
		"ground",
		"health",
		"input",
		"joyful",
		"knowledge",
		"level",
		"motion",
		"novel",
		"output",
		"prompt",
		"result",
		"stable",
		"timing",
		"usable",
		"value",
		"writer",
		"yield",
		"zone"
	],
	sentences: [
		"Typing with rhythm and consistency is often faster than forcing each word.",
		"Small improvements in accuracy usually create larger gains in speed over time.",
		"A focused minute of practice can be more useful than ten distracted minutes.",
		"Relax your shoulders, keep your wrists neutral, and let the fingers do the work.",
		"Reading a full phrase before typing helps maintain smooth and confident motion.",
		"Every correction teaches your brain to recognize the right key pattern faster.",
		"When pressure rises, slow down briefly and rebuild control before accelerating.",
		"Strong typing habits make writing, coding, and communication feel much easier.",
		"A calm pace at the start prevents mistakes that cost more time later.",
		"Practice sessions are most effective when goals are clear and progress is tracked.",
		"Consistency beats intensity, especially when building muscle memory for new keys.",
		"Good posture and reliable technique support long sessions without fatigue."
	],
	quotes: [
		"Success is the sum of small efforts repeated day in and day out.",
		"Discipline is choosing between what you want now and what you want most.",
		"Simplicity is the ultimate sophistication.",
		"You do not rise to the level of your goals, you fall to the level of your systems.",
		"The secret of getting ahead is getting started.",
		"The difference between ordinary and extraordinary is that little extra.",
		"Well done is better than well said.",
		"Quality means doing it right when no one is looking.",
		"The best way to predict the future is to create it.",
		"Excellence is never an accident, it is always the result of high intention."
	]
};

/**
 * Escapes a string so it is safe to inject as HTML text content.
 */
function escapeHtml(value) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

/**
 * Returns a random integer from 0 up to max - 1.
 */
function randomIndex(max) {
	return Math.floor(Math.random() * max);
}

/**
 * Returns a shuffled copy of an array without mutating the original.
 */
function shuffleCopy(items) {
	return [...items].sort(() => Math.random() - 0.5);
}

/**
 * Formats a number into a percent string with one decimal precision.
 */
function formatPercent(value) {
	return `${Math.max(0, value).toFixed(1)}%`;
}

/**
 * Formats an ISO date string into a readable local date-time.
 */
function formatDate(isoDate) {
	return new Date(isoDate).toLocaleString(undefined, {
		year: "numeric",
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit"
	});
}

/**
 * Creates and manages countdown behavior for a typing test.
 */
class TimerModule {
	/**
	 * Builds a timer with tick and end callbacks.
	 */
	constructor(onTick, onEnd) {
		this.onTick = onTick;
		this.onEnd = onEnd;
		this.intervalId = null;
		this.totalSeconds = 0;
		this.remainingSeconds = 0;
	}

	/**
	 * Starts the countdown and triggers callback updates every second.
	 */
	start(totalSeconds) {
		this.stop();
		this.totalSeconds = totalSeconds;
		this.remainingSeconds = totalSeconds;
		this.onTick(this.remainingSeconds, this.totalSeconds);

		this.intervalId = window.setInterval(() => {
			this.remainingSeconds -= 1;
			this.onTick(Math.max(0, this.remainingSeconds), this.totalSeconds);

			if (this.remainingSeconds <= 0) {
				this.stop();
				this.onEnd();
			}
		}, 1000);
	}

	/**
	 * Stops the active timer interval if it is running.
	 */
	stop() {
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	/**
	 * Resets the timer state to a new total without starting it.
	 */
	reset(totalSeconds) {
		this.stop();
		this.totalSeconds = totalSeconds;
		this.remainingSeconds = totalSeconds;
		this.onTick(this.remainingSeconds, this.totalSeconds);
	}

	/**
	 * Returns true when the timer interval is currently active.
	 */
	isRunning() {
		return this.intervalId !== null;
	}
}

/**
 * Generates typing content from local arrays based on selected mode.
 */
class TextGeneratorModule {
	/**
	 * Stores a local text library for random content generation.
	 */
	constructor(textLibrary) {
		this.textLibrary = textLibrary;
	}

	/**
	 * Returns source text matching the chosen type and duration.
	 */
	getText(type, durationSeconds) {
		if (type === "words") {
			return this.createRandomWords(durationSeconds);
		}

		if (type === "quotes") {
			return this.createQuoteSet(durationSeconds);
		}

		return this.createSentenceSet(durationSeconds);
	}

	/**
	 * Builds a random words string with length tuned for test duration.
	 */
	createRandomWords(durationSeconds) {
		const wordCount = Math.max(20, Math.round(durationSeconds * 1.45));
		const words = [];

		for (let index = 0; index < wordCount; index += 1) {
			words.push(this.pickRandom(this.textLibrary.words));
		}

		return words.join(" ");
	}

	/**
	 * Builds a sentence paragraph by sampling unique sentences.
	 */
	createSentenceSet(durationSeconds) {
		const count = durationSeconds <= 30 ? 2 : durationSeconds <= 60 ? 3 : 5;
		const selected = shuffleCopy(this.textLibrary.sentences).slice(0, count);
		return selected.join(" ");
	}

	/**
	 * Builds quote text and extends it for longer test durations.
	 */
	createQuoteSet(durationSeconds) {
		if (durationSeconds > 60) {
			const selected = shuffleCopy(this.textLibrary.quotes).slice(0, 2);
			return selected.join(" ");
		}

		return this.pickRandom(this.textLibrary.quotes);
	}

	/**
	 * Returns one random item from a non-empty list.
	 */
	pickRandom(items) {
		return items[randomIndex(items.length)];
	}
}

/**
 * Calculates and stores typing metrics based on user input.
 */
class StatsModule {
	/**
	 * Initializes metric values for a new test session.
	 */
	constructor() {
		this.reset();
	}

	/**
	 * Resets cumulative counters used during a test.
	 */
	reset() {
		this.totalKeystrokes = 0;
	}

	/**
	 * Adds one keystroke when a trackable key is pressed.
	 */
	recordKeystroke(event) {
		if (this.isTrackableKey(event)) {
			this.totalKeystrokes += 1;
		}
	}

	/**
	 * Returns true only for keys that represent typing actions.
	 */
	isTrackableKey(event) {
		if (event.ctrlKey || event.metaKey || event.altKey) {
			return false;
		}

		return event.key.length === 1 || event.key === "Backspace" || event.key === "Delete";
	}

	/**
	 * Computes WPM, CPM, accuracy and totals for the current input state.
	 */
	calculate(typedText, sourceText, elapsedSeconds) {
		const typedChars = typedText.length;
		let correctChars = 0;

		for (let index = 0; index < typedChars && index < sourceText.length; index += 1) {
			if (typedText[index] === sourceText[index]) {
				correctChars += 1;
			}
		}

		const safeElapsedSeconds = Math.max(elapsedSeconds, 1);
		const minutes = safeElapsedSeconds / 60;
		const wpm = typedChars === 0 ? 0 : (typedChars / 5) / minutes;
		const cpm = typedChars === 0 ? 0 : typedChars / minutes;
		const accuracy = typedChars === 0 ? 100 : (correctChars / typedChars) * 100;

		return {
			wpm,
			cpm,
			accuracy,
			correctChars,
			typedChars,
			mistakes: Math.max(typedChars - correctChars, 0),
			keystrokes: this.totalKeystrokes
		};
	}
}

/**
 * Persists and sorts previous test results in localStorage.
 */
class HistoryModule {
	/**
	 * Stores the storage key used by this history service.
	 */
	constructor(storageKey) {
		this.storageKey = storageKey;
	}

	/**
	 * Loads saved results from localStorage with safe fallback.
	 */
	load() {
		const rawData = localStorage.getItem(this.storageKey);

		if (!rawData) {
			return [];
		}

		try {
			const parsed = JSON.parse(rawData);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}

	/**
	 * Saves provided result list to localStorage.
	 */
	save(historyItems) {
		localStorage.setItem(this.storageKey, JSON.stringify(historyItems));
	}

	/**
	 * Appends a new result and keeps only the most recent 200 entries.
	 */
	addResult(result) {
		const historyItems = this.load();
		historyItems.push(result);
		const trimmed = historyItems.slice(-200);
		this.save(trimmed);
	}

	/**
	 * Deletes all saved results from localStorage.
	 */
	clear() {
		localStorage.removeItem(this.storageKey);
	}

	/**
	 * Returns history sorted by the selected mode.
	 */
	getSorted(sortMode) {
		const items = this.load();

		if (sortMode === "wpm") {
			return items.sort((left, right) => right.wpm - left.wpm);
		}

		if (sortMode === "accuracy") {
			return items.sort((left, right) => right.accuracy - left.accuracy);
		}

		return items.sort((left, right) => new Date(right.dateIso) - new Date(left.dateIso));
	}
}

/**
 * Handles rendering and DOM interactions for the TypeMaster interface.
 */
class UIModule {
	/**
	 * Caches required DOM nodes for quick access.
	 */
	constructor() {
		this.elements = {
			body: document.body,
			themeToggle: document.getElementById("themeToggle"),
			showTestView: document.getElementById("showTestView"),
			showHistoryView: document.getElementById("showHistoryView"),
			testView: document.getElementById("testView"),
			historyView: document.getElementById("historyView"),
			durationSelect: document.getElementById("durationSelect"),
			textTypeSelect: document.getElementById("textTypeSelect"),
			newTextBtn: document.getElementById("newTextBtn"),
			restartBtn: document.getElementById("restartBtn"),
			timerValue: document.getElementById("timerValue"),
			progressBar: document.getElementById("progressBar"),
			wpmLive: document.getElementById("wpmLive"),
			cpmLive: document.getElementById("cpmLive"),
			accuracyLive: document.getElementById("accuracyLive"),
			keystrokesLive: document.getElementById("keystrokesLive"),
			sourceText: document.getElementById("sourceText"),
			typingInput: document.getElementById("typingInput"),
			resultsPanel: document.getElementById("resultsPanel"),
			wpmFinal: document.getElementById("wpmFinal"),
			cpmFinal: document.getElementById("cpmFinal"),
			accuracyFinal: document.getElementById("accuracyFinal"),
			keystrokesFinal: document.getElementById("keystrokesFinal"),
			shareText: document.getElementById("shareText"),
			copyShareBtn: document.getElementById("copyShareBtn"),
			comparisonOriginal: document.getElementById("comparisonOriginal"),
			comparisonTyped: document.getElementById("comparisonTyped"),
			historySortSelect: document.getElementById("historySortSelect"),
			historyTableBody: document.getElementById("historyTableBody"),
			historyEmptyState: document.getElementById("historyEmptyState"),
			clearHistoryBtn: document.getElementById("clearHistoryBtn"),
			toast: document.getElementById("toast")
		};

		this.sourceTextValue = "";
		this.toastTimeoutId = null;
	}

	/**
	 * Returns the current text from the typing textarea.
	 */
	getTypingValue() {
		return this.elements.typingInput.value;
	}

	/**
	 * Clears typed content from the textarea.
	 */
	clearTypingValue() {
		this.elements.typingInput.value = "";
	}

	/**
	 * Enables or disables the typing textarea.
	 */
	setTypingEnabled(enabled) {
		this.elements.typingInput.disabled = !enabled;
	}

	/**
	 * Renders the current source text and creates one span per character.
	 */
	renderSourceText(text) {
		this.sourceTextValue = text;
		this.elements.sourceText.innerHTML = text
			.split("")
			.map((character) => `<span class="source-char">${escapeHtml(character)}</span>`)
			.join("");
		this.updateCharacterHighlights("");
	}

	/**
	 * Colors source characters as correct, incorrect and current cursor position.
	 */
	updateCharacterHighlights(typedText) {
		const charElements = this.elements.sourceText.querySelectorAll(".source-char");

		for (let index = 0; index < charElements.length; index += 1) {
			const element = charElements[index];
			element.classList.remove("char-correct", "char-wrong", "char-current");

			if (index < typedText.length) {
				if (typedText[index] === this.sourceTextValue[index]) {
					element.classList.add("char-correct");
				} else {
					element.classList.add("char-wrong");
				}
			}
		}

		if (typedText.length < this.sourceTextValue.length) {
			charElements[typedText.length].classList.add("char-current");
		}
	}

	/**
	 * Updates remaining seconds and progress bar width.
	 */
	updateTimer(remainingSeconds, totalSeconds) {
		const percent = totalSeconds === 0 ? 0 : (remainingSeconds / totalSeconds) * 100;
		this.elements.timerValue.textContent = `${remainingSeconds}s`;
		this.elements.progressBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
	}

	/**
	 * Refreshes live metric cards while typing.
	 */
	updateLiveStats(metrics) {
		this.elements.wpmLive.textContent = metrics.wpm.toFixed(1);
		this.elements.cpmLive.textContent = metrics.cpm.toFixed(1);
		this.elements.accuracyLive.textContent = formatPercent(metrics.accuracy);
		this.elements.keystrokesLive.textContent = String(metrics.keystrokes);
	}

	/**
	 * Resets live metric values to their defaults.
	 */
	resetLiveStats() {
		this.elements.wpmLive.textContent = "0";
		this.elements.cpmLive.textContent = "0";
		this.elements.accuracyLive.textContent = "100%";
		this.elements.keystrokesLive.textContent = "0";
	}

	/**
	 * Shows final result cards and comparison after test completion.
	 */
	showResults(result, sourceText, typedText, shareText) {
		this.elements.wpmFinal.textContent = result.wpm.toFixed(1);
		this.elements.cpmFinal.textContent = result.cpm.toFixed(1);
		this.elements.accuracyFinal.textContent = formatPercent(result.accuracy);
		this.elements.keystrokesFinal.textContent = String(result.keystrokes);
		this.elements.shareText.textContent = shareText;
		this.renderComparison(sourceText, typedText);
		this.elements.resultsPanel.classList.add("show");
	}

	/**
	 * Hides the final result section.
	 */
	hideResults() {
		this.elements.resultsPanel.classList.remove("show");
	}

	/**
	 * Builds side-by-side per-character comparison for original and typed text.
	 */
	renderComparison(sourceText, typedText) {
		const originalFragments = [];
		const typedFragments = [];
		const total = Math.max(sourceText.length, typedText.length);

		for (let index = 0; index < total; index += 1) {
			const sourceChar = sourceText[index] ?? "";
			const typedChar = typedText[index] ?? "";

			if (sourceChar !== "") {
				if (typedChar === sourceChar) {
					originalFragments.push(`<span class="diff-correct">${escapeHtml(sourceChar)}</span>`);
				} else if (typedChar === "") {
					originalFragments.push(`<span class="diff-missing">${escapeHtml(sourceChar)}</span>`);
				} else {
					originalFragments.push(`<span class="diff-wrong">${escapeHtml(sourceChar)}</span>`);
				}
			}

			if (typedChar !== "") {
				if (typedChar === sourceChar) {
					typedFragments.push(`<span class="diff-correct">${escapeHtml(typedChar)}</span>`);
				} else if (sourceChar === "") {
					typedFragments.push(`<span class="diff-extra">${escapeHtml(typedChar)}</span>`);
				} else {
					typedFragments.push(`<span class="diff-wrong">${escapeHtml(typedChar)}</span>`);
				}
			} else if (sourceChar !== "") {
				typedFragments.push(`<span class="diff-missing">${escapeHtml(sourceChar)}</span>`);
			}
		}

		this.elements.comparisonOriginal.innerHTML = originalFragments.join("");
		this.elements.comparisonTyped.innerHTML = typedFragments.join("");
	}

	/**
	 * Renders history rows according to selected sort mode.
	 */
	renderHistory(historyItems) {
		this.elements.historyTableBody.innerHTML = "";

		if (historyItems.length === 0) {
			this.elements.historyEmptyState.style.display = "block";
			return;
		}

		this.elements.historyEmptyState.style.display = "none";
		const rowsMarkup = historyItems
			.map((item) => {
				return `
					<tr>
						<td>${escapeHtml(formatDate(item.dateIso))}</td>
						<td>${item.wpm.toFixed(1)}</td>
						<td>${formatPercent(item.accuracy)}</td>
						<td>${item.keystrokes}</td>
					</tr>
				`;
			})
			.join("");

		this.elements.historyTableBody.innerHTML = rowsMarkup;
	}

	/**
	 * Sets active tab and panel for test or history view.
	 */
	setActiveView(view) {
		const isHistory = view === "history";
		this.elements.testView.classList.toggle("active", !isHistory);
		this.elements.historyView.classList.toggle("active", isHistory);
		this.elements.showTestView.classList.toggle("active", !isHistory);
		this.elements.showHistoryView.classList.toggle("active", isHistory);
		this.elements.showTestView.setAttribute("aria-selected", String(!isHistory));
		this.elements.showHistoryView.setAttribute("aria-selected", String(isHistory));
	}

	/**
	 * Applies the selected theme and updates toggle label.
	 */
	setTheme(theme) {
		this.elements.body.dataset.theme = theme;
		this.elements.themeToggle.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
	}

	/**
	 * Displays a temporary toast notification near the bottom of the screen.
	 */
	showToast(message) {
		this.elements.toast.textContent = message;
		this.elements.toast.classList.add("show");

		if (this.toastTimeoutId !== null) {
			window.clearTimeout(this.toastTimeoutId);
		}

		this.toastTimeoutId = window.setTimeout(() => {
			this.elements.toast.classList.remove("show");
		}, 1800);
	}
}

/**
 * Coordinates modules and drives TypeMaster application flow.
 */
class TypeMasterApp {
	/**
	 * Creates modules and prepares mutable runtime state.
	 */
	constructor() {
		this.ui = new UIModule();
		this.timer = new TimerModule(
			(remainingSeconds, totalSeconds) => this.handleTimerTick(remainingSeconds, totalSeconds),
			() => this.finishTest("timeup")
		);
		this.textGenerator = new TextGeneratorModule(TEXT_LIBRARY);
		this.stats = new StatsModule();
		this.history = new HistoryModule(STORAGE_KEYS.HISTORY);
		this.state = {
			durationSeconds: 60,
			textType: "sentences",
			sourceText: "",
			started: false,
			finished: false,
			startTimestamp: 0,
			elapsedAtFinish: 0,
			shareText: ""
		};
	}

	/**
	 * Initializes event listeners, theme and first generated test.
	 */
	init() {
		this.bindEvents();
		this.loadTheme();
		this.prepareTest();
		this.refreshHistory();
	}

	/**
	 * Binds UI events to application handlers.
	 */
	bindEvents() {
		this.ui.elements.themeToggle.addEventListener("click", () => this.toggleTheme());
		this.ui.elements.showTestView.addEventListener("click", () => this.ui.setActiveView("test"));
		this.ui.elements.showHistoryView.addEventListener("click", () => {
			this.ui.setActiveView("history");
			this.refreshHistory();
		});

		this.ui.elements.durationSelect.addEventListener("change", () => this.handleConfigChange());
		this.ui.elements.textTypeSelect.addEventListener("change", () => this.handleConfigChange());
		this.ui.elements.newTextBtn.addEventListener("click", () => this.prepareTest());
		this.ui.elements.restartBtn.addEventListener("click", () => this.prepareTest());
		this.ui.elements.historySortSelect.addEventListener("change", () => this.refreshHistory());
		this.ui.elements.clearHistoryBtn.addEventListener("click", () => this.clearHistory());
		this.ui.elements.copyShareBtn.addEventListener("click", () => this.copyShareText());

		this.ui.elements.typingInput.addEventListener("keydown", (event) => this.handleTypingKeydown(event));
		this.ui.elements.typingInput.addEventListener("input", () => this.handleTypingInput());
	}

	/**
	 * Loads stored theme preference and applies it to the page.
	 */
	loadTheme() {
		const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
		const theme = savedTheme === "dark" ? "dark" : "light";
		this.ui.setTheme(theme);
	}

	/**
	 * Toggles between light and dark theme and persists choice.
	 */
	toggleTheme() {
		const current = this.ui.elements.body.dataset.theme;
		const nextTheme = current === "dark" ? "light" : "dark";
		this.ui.setTheme(nextTheme);
		localStorage.setItem(STORAGE_KEYS.THEME, nextTheme);
	}

	/**
	 * Updates state from select inputs and resets the active test.
	 */
	handleConfigChange() {
		this.prepareTest();
	}

	/**
	 * Starts a new typing test with fresh text and reset metrics.
	 */
	prepareTest() {
		this.timer.stop();
		this.stats.reset();
		this.state.durationSeconds = Number(this.ui.elements.durationSelect.value);
		this.state.textType = this.ui.elements.textTypeSelect.value;
		this.state.sourceText = this.textGenerator.getText(this.state.textType, this.state.durationSeconds);
		this.state.started = false;
		this.state.finished = false;
		this.state.startTimestamp = 0;
		this.state.elapsedAtFinish = 0;
		this.state.shareText = "";

		this.ui.renderSourceText(this.state.sourceText);
		this.ui.clearTypingValue();
		this.ui.setTypingEnabled(true);
		this.ui.hideResults();
		this.ui.resetLiveStats();
		this.ui.updateTimer(this.state.durationSeconds, this.state.durationSeconds);
		this.ui.elements.typingInput.focus();
	}

	/**
	 * Handles keydown events for keystroke counting and auto-start logic.
	 */
	handleTypingKeydown(event) {
		if (this.state.finished) {
			return;
		}

		this.stats.recordKeystroke(event);

		if (!this.state.started && this.isStartKey(event)) {
			this.startTest();
		}

		this.updateLiveStats();
	}

	/**
	 * Returns true for printable keys that should start the timer.
	 */
	isStartKey(event) {
		if (event.ctrlKey || event.metaKey || event.altKey) {
			return false;
		}

		return event.key.length === 1;
	}

	/**
	 * Starts timer and marks the session as active.
	 */
	startTest() {
		if (this.state.started || this.state.finished) {
			return;
		}

		this.state.started = true;
		this.state.startTimestamp = performance.now();
		this.timer.start(this.state.durationSeconds);
	}

	/**
	 * Handles input updates, highlighting and early completion detection.
	 */
	handleTypingInput() {
		if (this.state.finished) {
			return;
		}

		const typedText = this.ui.getTypingValue();

		if (!this.state.started && typedText.length > 0) {
			this.startTest();
		}

		this.updateLiveStats();
		this.ui.updateCharacterHighlights(typedText);

		if (typedText === this.state.sourceText) {
			this.finishTest("completed");
		}
	}

	/**
	 * Returns elapsed typing time in seconds based on high-resolution timer.
	 */
	getElapsedSeconds() {
		if (!this.state.started) {
			return 0;
		}

		if (this.state.finished) {
			return this.state.elapsedAtFinish;
		}

		return (performance.now() - this.state.startTimestamp) / 1000;
	}

	/**
	 * Recalculates live metrics from current input and elapsed time.
	 */
	updateLiveStats() {
		const typedText = this.ui.getTypingValue();
		const elapsedSeconds = this.state.started ? this.getElapsedSeconds() : 0;
		const metrics = this.stats.calculate(typedText, this.state.sourceText, elapsedSeconds);
		this.ui.updateLiveStats(metrics);
		return metrics;
	}

	/**
	 * Handles timer tick updates and keeps live metrics fresh while running.
	 */
	handleTimerTick(remainingSeconds, totalSeconds) {
		this.ui.updateTimer(remainingSeconds, totalSeconds);

		if (this.state.started && !this.state.finished) {
			this.updateLiveStats();
		}
	}

	/**
	 * Finalizes the test, computes results and stores them in history.
	 */
	finishTest(reason) {
		if (this.state.finished) {
			return;
		}

		this.state.finished = true;
		this.timer.stop();
		this.ui.setTypingEnabled(false);

		if (this.state.started) {
			if (reason === "completed") {
				this.state.elapsedAtFinish = Math.max(1, Math.min(this.getElapsedSeconds(), this.state.durationSeconds));
			} else {
				this.state.elapsedAtFinish = this.state.durationSeconds;
			}
		} else {
			this.state.elapsedAtFinish = this.state.durationSeconds;
		}

		const typedText = this.ui.getTypingValue();
		const finalMetrics = this.stats.calculate(
			typedText,
			this.state.sourceText,
			this.state.elapsedAtFinish
		);
		const result = {
			dateIso: new Date().toISOString(),
			wpm: Number(finalMetrics.wpm.toFixed(1)),
			cpm: Number(finalMetrics.cpm.toFixed(1)),
			accuracy: Number(finalMetrics.accuracy.toFixed(1)),
			keystrokes: finalMetrics.keystrokes,
			durationSeconds: this.state.durationSeconds,
			textType: this.state.textType
		};

		this.state.shareText = this.buildShareText(result);
		this.ui.showResults(result, this.state.sourceText, typedText, this.state.shareText);

		if (typedText.length > 0 || finalMetrics.keystrokes > 0) {
			this.history.addResult(result);
			this.refreshHistory();
		}
	}

	/**
	 * Creates a reusable text snippet for sharing result achievements.
	 */
	buildShareText(result) {
		return `I scored ${Math.round(result.wpm)} WPM with ${Math.round(result.accuracy)}% accuracy on TypeMaster!`;
	}

	/**
	 * Refreshes history view according to selected sorting option.
	 */
	refreshHistory() {
		const sortMode = this.ui.elements.historySortSelect.value;
		const historyItems = this.history.getSorted(sortMode);
		this.ui.renderHistory(historyItems);
	}

	/**
	 * Clears local result history after explicit user action.
	 */
	clearHistory() {
		this.history.clear();
		this.refreshHistory();
		this.ui.showToast("History cleared.");
	}

	/**
	 * Copies the prepared share text to clipboard with fallback behavior.
	 */
	async copyShareText() {
		if (!this.state.shareText) {
			this.ui.showToast("Complete a test first.");
			return;
		}

		try {
			await navigator.clipboard.writeText(this.state.shareText);
			this.ui.showToast("Summary copied.");
		} catch {
			const temporaryField = document.createElement("textarea");
			temporaryField.value = this.state.shareText;
			document.body.appendChild(temporaryField);
			temporaryField.select();
			document.execCommand("copy");
			document.body.removeChild(temporaryField);
			this.ui.showToast("Summary copied.");
		}
	}
}

/**
 * Boots the TypeMaster app after the document is fully parsed.
 */
function bootstrap() {
	const app = new TypeMasterApp();
	app.init();
}

document.addEventListener("DOMContentLoaded", bootstrap);

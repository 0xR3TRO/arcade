"use strict";

/**
 * R3TRO Blocks - Custom Select Manager
 * Replaces native <select> controls with a themed, keyboard-accessible UI.
 * Native controls stay in DOM for form semantics and state storage.
 */
class CustomSelectManager {
    #items = new Map();
    #boundDocumentClick;
    #boundDocumentKeydown;
    #boundI18nUpdate;

    /**
     * @param {string[]} selectIds - IDs of native select elements to enhance
     */
    constructor(selectIds = []) {
        this.selectIds = Array.isArray(selectIds) ? selectIds : [];
        this.#boundDocumentClick = (event) => this.#onDocumentClick(event);
        this.#boundDocumentKeydown = (event) =>
            this.#onDocumentKeydown(event);
        this.#boundI18nUpdate = () => this.syncAll();
    }

    /**
     * Initialize all configured selects.
     */
    init() {
        this.selectIds.forEach((id) => {
            const select = document.getElementById(id);
            if (select instanceof HTMLSelectElement) {
                this.#enhanceSelect(select);
            }
        });

        document.addEventListener("click", this.#boundDocumentClick);
        document.addEventListener("keydown", this.#boundDocumentKeydown);
        document.addEventListener("i18n:updated", this.#boundI18nUpdate);
    }

    /**
     * Sync all custom controls from native select state.
     */
    syncAll() {
        this.#items.forEach((item) => {
            this.#renderOptions(item);
            this.#syncSelectedState(item);
        });
    }

    /**
     * Cleanup listeners and generated markup.
     */
    destroy() {
        document.removeEventListener("click", this.#boundDocumentClick);
        document.removeEventListener("keydown", this.#boundDocumentKeydown);
        document.removeEventListener("i18n:updated", this.#boundI18nUpdate);

        this.#items.forEach((item) => {
            item.wrapper.remove();
            item.select.classList.remove("setting-select-native");
            item.select.removeAttribute("data-custom-select");
        });
        this.#items.clear();
    }

    /**
     * @param {HTMLSelectElement} select - Native select element
     */
    #enhanceSelect(select) {
        if (select.dataset.customSelect === "true") return;

        const wrapper = document.createElement("div");
        wrapper.className = "rt-select";
        if (select.classList.contains("compact")) {
            wrapper.classList.add("rt-select-compact");
        }

        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "rt-select-trigger";
        trigger.setAttribute("aria-haspopup", "listbox");
        trigger.setAttribute("aria-expanded", "false");
        trigger.setAttribute("aria-label", select.getAttribute("aria-label") || "Select");

        const triggerText = document.createElement("span");
        triggerText.className = "rt-select-value";
        trigger.appendChild(triggerText);

        const triggerChevron = document.createElement("span");
        triggerChevron.className = "rt-select-chevron";
        triggerChevron.setAttribute("aria-hidden", "true");
        triggerChevron.textContent = "▾";
        trigger.appendChild(triggerChevron);

        const list = document.createElement("div");
        list.className = "rt-select-list";
        list.setAttribute("role", "listbox");
        list.tabIndex = -1;

        wrapper.appendChild(trigger);
        wrapper.appendChild(list);
        select.insertAdjacentElement("afterend", wrapper);
        select.classList.add("setting-select-native");
        select.dataset.customSelect = "true";

        const item = {
            id: select.id,
            select,
            wrapper,
            trigger,
            triggerText,
            list,
        };
        this.#items.set(select.id, item);

        trigger.addEventListener("click", () => this.#toggle(item));
        trigger.addEventListener("keydown", (event) =>
            this.#onTriggerKeydown(event, item),
        );
        list.addEventListener("keydown", (event) =>
            this.#onListKeydown(event, item),
        );
        select.addEventListener("change", () => this.#syncSelectedState(item));

        this.#renderOptions(item);
        this.#syncSelectedState(item);
    }

    /**
     * @param {object} item
     */
    #renderOptions(item) {
        item.list.innerHTML = "";
        const options = Array.from(item.select.options);

        options.forEach((option, index) => {
            const optionButton = document.createElement("button");
            optionButton.type = "button";
            optionButton.className = "rt-select-option";
            optionButton.setAttribute("role", "option");
            optionButton.dataset.value = option.value;
            optionButton.dataset.index = String(index);
            optionButton.textContent = option.textContent ?? option.value;
            optionButton.disabled = option.disabled;

            optionButton.addEventListener("click", () => {
                if (!optionButton.disabled) {
                    this.#applyValue(item, option.value, true);
                }
            });

            item.list.appendChild(optionButton);
        });
    }

    /**
     * @param {object} item
     */
    #syncSelectedState(item) {
        const selectedValue = item.select.value;
        const selectedOption = item.select.options[item.select.selectedIndex];
        item.triggerText.textContent = selectedOption?.textContent || selectedValue;

        item.list.querySelectorAll(".rt-select-option").forEach((optionEl) => {
            const isSelected = optionEl.dataset.value === selectedValue;
            optionEl.classList.toggle("selected", isSelected);
            optionEl.setAttribute("aria-selected", String(isSelected));
        });
    }

    /**
     * @param {object} item
     */
    #toggle(item) {
        if (item.wrapper.classList.contains("open")) {
            this.#close(item);
        } else {
            this.#open(item);
        }
    }

    /**
     * @param {object} item
     */
    #open(item) {
        this.#closeAll(item.id);
        item.wrapper.classList.add("open");
        item.trigger.setAttribute("aria-expanded", "true");

        const selected = item.list.querySelector(
            '.rt-select-option[aria-selected="true"]',
        );
        const first = item.list.querySelector(".rt-select-option:not(:disabled)");
        (selected || first)?.focus();
    }

    /**
     * @param {object} item
     */
    #close(item) {
        item.wrapper.classList.remove("open");
        item.trigger.setAttribute("aria-expanded", "false");
    }

    /**
     * @param {string} [exceptId] - Keep one select open
     */
    #closeAll(exceptId) {
        this.#items.forEach((item) => {
            if (item.id !== exceptId) {
                this.#close(item);
            }
        });
    }

    /**
     * @param {object} item
     * @param {string} value
     * @param {boolean} emitChange
     */
    #applyValue(item, value, emitChange) {
        const previous = item.select.value;
        item.select.value = value;
        this.#syncSelectedState(item);
        this.#close(item);
        item.trigger.focus();

        if (emitChange && previous !== value) {
            item.select.dispatchEvent(new Event("change", { bubbles: true }));
        }
    }

    /**
     * @param {KeyboardEvent} event
     * @param {object} item
     */
    #onTriggerKeydown(event, item) {
        switch (event.code) {
            case "ArrowDown":
            case "ArrowUp":
            case "Enter":
            case "Space":
                event.preventDefault();
                this.#open(item);
                break;
            case "Escape":
                this.#close(item);
                break;
        }
    }

    /**
     * @param {KeyboardEvent} event
     * @param {object} item
     */
    #onListKeydown(event, item) {
        const options = Array.from(
            item.list.querySelectorAll(".rt-select-option:not(:disabled)"),
        );
        if (options.length === 0) return;

        const active = document.activeElement;
        const currentIndex = options.indexOf(active);

        const focusByIndex = (index) => {
            options[index]?.focus();
        };

        switch (event.code) {
            case "ArrowDown":
                event.preventDefault();
                focusByIndex(
                    currentIndex < 0
                        ? 0
                        : Math.min(currentIndex + 1, options.length - 1),
                );
                break;
            case "ArrowUp":
                event.preventDefault();
                focusByIndex(currentIndex <= 0 ? 0 : currentIndex - 1);
                break;
            case "Home":
                event.preventDefault();
                focusByIndex(0);
                break;
            case "End":
                event.preventDefault();
                focusByIndex(options.length - 1);
                break;
            case "Enter":
            case "Space":
                event.preventDefault();
                if (active?.dataset?.value) {
                    this.#applyValue(item, active.dataset.value, true);
                }
                break;
            case "Escape":
                event.preventDefault();
                this.#close(item);
                item.trigger.focus();
                break;
            case "Tab":
                this.#close(item);
                break;
        }
    }

    /**
     * @param {MouseEvent} event
     */
    #onDocumentClick(event) {
        this.#items.forEach((item) => {
            if (!item.wrapper.contains(event.target)) {
                this.#close(item);
            }
        });
    }

    /**
     * @param {KeyboardEvent} event
     */
    #onDocumentKeydown(event) {
        if (event.code === "Escape") {
            this.#closeAll();
        }
    }
}

window.CustomSelectManager = CustomSelectManager;


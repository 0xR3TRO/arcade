/* ============================================================================
   R3TRO Blocks - Internationalization System (i18n)
   Multi-language support: PL, EN, DE, JA
   ============================================================================ */

const TRANSLATIONS = {
    pl: {
        app: {
            title: "R3TRO Blocks",
            tagline: "Przeglądarkowa klasyka — nowa era",
        },
        nav: {
            settings: "Ustawienia",
            controls: "Sterowanie",
            scores: "Wyniki",
        },
        menu: {
            play: "Graj",
            modes: "Tryby gry",
            scores: "Tabela wyników",
            settings: "Ustawienia",
            controls: "Sterowanie",
            stats: "Statystyki",
        },
        modes: {
            marathon: {
                name: "Maraton",
                desc: "Graj bez limitu czasu. Poziom rośnie co 10 linii.",
            },
            sprint: {
                name: "Sprint",
                desc: "Skasuj 40 linii w jak najkrótszym czasie.",
            },
            ultra: {
                name: "Ultra",
                desc: "2 minuty. Maksymalny wynik punktowy.",
            },
            back: "Powrót",
        },
        game: {
            hold: "Trzymaj",
            score: "Wynik",
            level: "Poziom",
            time: "Czas",
            next: "Następne",
            lines: "Linie",
            lines_count: ["{count} linia", "{count} linie", "{count} linii"],
            combo: "Combo",
            back2back: "Back-to-Back",
        },
        actions: {
            quad: "QUAD!",
            tspin: "T-SPIN!",
            tspin_mini: "MINI T-SPIN",
            tspin_single: "T-SPIN SINGLE",
            tspin_double: "T-SPIN DOUBLE",
            tspin_triple: "T-SPIN TRIPLE",
            perfect_clear: "PERFEKCYJNE POLE!",
            back2back: "BACK-TO-BACK",
            combo: "x{count} COMBO",
        },
        pause: {
            title: "PAUZA",
            resume: "Wznów",
            restart: "Restart",
            settings: "Ustawienia",
            menu: "Menu",
        },
        gameover: {
            title: "GAME OVER",
            new_record: "NOWY REKORD!",
            score: "Wynik",
            level: "Poziom",
            lines: "Linie",
            time: "Czas",
            initials: "Wpisz inicjały",
            initials_help:
                "Wpisz litery (A-Z, 0-9), strzałkami zmień pozycję, Enter zatwierdza",
            play_again: "Jeszcze raz",
            menu: "Menu",
        },
        settings: {
            title: "Ustawienia",
            sections: {
                appearance: "Wygląd",
                gameplay: "Rozgrywka",
                input: "Sterowanie",
                audio: "Dźwięk",
            },
            theme: "Motyw",
            theme_dark: "Ciemny",
            theme_light: "Jasny",
            language: "Język",
            ghost: "Ghost piece",
            ghost_desc: "Podgląd miejsca lądowania",
            grid: "Siatka",
            grid_desc: "Linie planszy",
            animations: "Animacje",
            animations_desc: "Efekty kasowania linii",
            das: "DAS",
            das_desc: "Opóźnienie auto-powtarzania",
            arr: "ARR",
            arr_desc: "Częstotliwość auto-powtarzania",
            sdf: "SDF",
            sdf_desc: "Mnożnik soft drop",
            sfx: "Efekty dźwiękowe",
            music: "Muzyka",
            reset: "Przywróć domyślne",
            reset_stats_label: "Wyczyść statystyki gry",
            reset_stats_btn: "Resetuj",
            reset_stats_confirm:
                "Czy na pewno wyczyścić wszystkie statystyki?",
            reset_game_label:
                "Przywróć dane gry i wyczyść tabelę wyników",
            reset_game_btn: "Pełny reset",
            reset_game_confirm:
                "Przywrócić ustawienia, wyczyścić statystyki i tabelę wyników?",
            back: "Powrót",
        },
        controls: {
            title: "Sterowanie",
            keyboard: "Klawiatura",
            touch: "Dotyk (Mobile)",
            gamepad: "Gamepad",
            move_left: "Ruch w lewo",
            move_right: "Ruch w prawo",
            rotate_cw: "Rotacja CW",
            rotate_ccw: "Rotacja CCW",
            hard_drop: "Hard Drop",
            soft_drop: "Soft Drop",
            hold: "Trzymaj",
            pause: "Pauza",
            restart: "Restart",
            back: "Powrót",
        },
        scores: {
            title: "Tabela wyników",
            empty: "Brak wyników — zagraj swoją pierwszą partię!",
            rank: "Miejsce",
            name: "Gracz",
            score: "Wynik",
            level: "Poziom",
            lines: "Linie",
            date: "Data",
            back: "Powrót",
        },
        stats: {
            title: "Statystyki",
            games: "Rozegrane gry",
            lines: "Skasowane linie",
            time: "Czas gry",
            max_score: "Najlepszy wynik",
            max_level: "Najlepszy poziom",
            quads: "Czwórki",
            tspins: "T-Spiny",
            pieces: "Położone klocki",
            back: "Powrót",
        },
        toast: {
            theme_dark: "Ciemny motyw włączony",
            theme_light: "Jasny motyw włączony",
            lang_changed: "Język zmieniony",
            settings_saved: "Ustawienia zapisane",
            stats_reset: "Statystyki zostały wyczyszczone",
            game_reset: "Dane gry zostały zresetowane",
        },
    },

    en: {
        app: { title: "R3TRO Blocks", tagline: "Browser classic — new era" },
        nav: { settings: "Settings", controls: "Controls", scores: "Scores" },
        menu: {
            play: "Play",
            modes: "Game Modes",
            scores: "Score Table",
            settings: "Settings",
            controls: "Controls",
            stats: "Statistics",
        },
        modes: {
            marathon: {
                name: "Marathon",
                desc: "Play without time limit. Level up every 10 lines.",
            },
            sprint: {
                name: "Sprint",
                desc: "Clear 40 lines as fast as possible.",
            },
            ultra: { name: "Ultra", desc: "2 minutes. Maximum point score." },
            back: "Back",
        },
        game: {
            hold: "Hold",
            score: "Score",
            level: "Level",
            time: "Time",
            next: "Next",
            lines: "Lines",
            lines_count: ["{count} line", "{count} lines"],
            combo: "Combo",
            back2back: "Back-to-Back",
        },
        actions: {
            quad: "QUAD!",
            tspin: "T-SPIN!",
            tspin_mini: "MINI T-SPIN",
            tspin_single: "T-SPIN SINGLE",
            tspin_double: "T-SPIN DOUBLE",
            tspin_triple: "T-SPIN TRIPLE",
            perfect_clear: "PERFECT CLEAR!",
            back2back: "BACK-TO-BACK",
            combo: "x{count} COMBO",
        },
        pause: {
            title: "PAUSED",
            resume: "Resume",
            restart: "Restart",
            settings: "Settings",
            menu: "Menu",
        },
        gameover: {
            title: "GAME OVER",
            new_record: "NEW RECORD!",
            score: "Score",
            level: "Level",
            lines: "Lines",
            time: "Time",
            initials: "Enter initials",
            initials_help:
                "Type letters (A-Z, 0-9), use arrows to move, press Enter to confirm",
            play_again: "Play Again",
            menu: "Menu",
        },
        settings: {
            title: "Settings",
            sections: {
                appearance: "Appearance",
                gameplay: "Gameplay",
                input: "Input",
                audio: "Audio",
            },
            theme: "Theme",
            theme_dark: "Dark",
            theme_light: "Light",
            language: "Language",
            ghost: "Ghost piece",
            ghost_desc: "Preview landing position",
            grid: "Grid",
            grid_desc: "Board grid lines",
            animations: "Animations",
            animations_desc: "Line clear effects",
            das: "DAS",
            das_desc: "Delayed auto shift",
            arr: "ARR",
            arr_desc: "Auto repeat rate",
            sdf: "SDF",
            sdf_desc: "Soft drop factor",
            sfx: "Sound effects",
            music: "Music",
            reset: "Reset to defaults",
            reset_stats_label: "Clear lifetime statistics",
            reset_stats_btn: "Reset",
            reset_stats_confirm:
                "Are you sure you want to reset all statistics?",
            reset_game_label: "Reset all game data and clear score table",
            reset_game_btn: "Full reset",
            reset_game_confirm:
                "Reset settings, statistics, and score table?",
            back: "Back",
        },
        controls: {
            title: "Controls",
            keyboard: "Keyboard",
            touch: "Touch (Mobile)",
            gamepad: "Gamepad",
            move_left: "Move left",
            move_right: "Move right",
            rotate_cw: "Rotate CW",
            rotate_ccw: "Rotate CCW",
            hard_drop: "Hard Drop",
            soft_drop: "Soft Drop",
            hold: "Hold",
            pause: "Pause",
            restart: "Restart",
            back: "Back",
        },
        scores: {
            title: "Score Table",
            empty: "No scores yet — play your first game!",
            rank: "Rank",
            name: "Player",
            score: "Score",
            level: "Level",
            lines: "Lines",
            date: "Date",
            back: "Back",
        },
        stats: {
            title: "Statistics",
            games: "Games played",
            lines: "Lines cleared",
            time: "Time played",
            max_score: "Best score",
            max_level: "Best level",
            quads: "Quads",
            tspins: "T-Spins",
            pieces: "Pieces placed",
            back: "Back",
        },
        toast: {
            theme_dark: "Dark theme enabled",
            theme_light: "Light theme enabled",
            lang_changed: "Language changed",
            settings_saved: "Settings saved",
            stats_reset: "Statistics were reset",
            game_reset: "Game data has been reset",
        },
    },

    de: {
        app: { title: "R3TRO Blocks", tagline: "Browser-Klassiker — neue Ära" },
        nav: {
            settings: "Einstellungen",
            controls: "Steuerung",
            scores: "Punkte",
        },
        menu: {
            play: "Spielen",
            modes: "Spielmodi",
            scores: "Punktetabelle",
            settings: "Einstellungen",
            controls: "Steuerung",
            stats: "Statistiken",
        },
        modes: {
            marathon: {
                name: "Marathon",
                desc: "Ohne Zeitlimit spielen. Level steigt alle 10 Linien.",
            },
            sprint: {
                name: "Sprint",
                desc: "40 Linien so schnell wie möglich räumen.",
            },
            ultra: { name: "Ultra", desc: "2 Minuten. Maximale Punktzahl." },
            back: "Zurück",
        },
        game: {
            hold: "Halten",
            score: "Punkte",
            level: "Level",
            time: "Zeit",
            next: "Nächste",
            lines: "Linien",
            lines_count: ["{count} Linie", "{count} Linien"],
            combo: "Combo",
            back2back: "Back-to-Back",
        },
        actions: {
            quad: "QUAD!",
            tspin: "T-SPIN!",
            tspin_mini: "MINI T-SPIN",
            tspin_single: "T-SPIN EINFACH",
            tspin_double: "T-SPIN DOPPEL",
            tspin_triple: "T-SPIN DREIFACH",
            perfect_clear: "PERFEKT!",
            back2back: "BACK-TO-BACK",
            combo: "x{count} COMBO",
        },
        pause: {
            title: "PAUSE",
            resume: "Fortsetzen",
            restart: "Neustart",
            settings: "Einstellungen",
            menu: "Menü",
        },
        gameover: {
            title: "SPIEL VORBEI",
            new_record: "NEUER REKORD!",
            score: "Punkte",
            level: "Level",
            lines: "Linien",
            time: "Zeit",
            initials: "Initialen eingeben",
            initials_help:
                "Gib Zeichen ein (A-Z, 0-9), mit Pfeilen wechseln, Enter bestätigt",
            play_again: "Nochmal",
            menu: "Menü",
        },
        settings: {
            title: "Einstellungen",
            sections: {
                appearance: "Aussehen",
                gameplay: "Gameplay",
                input: "Eingabe",
                audio: "Ton",
            },
            theme: "Design",
            theme_dark: "Dunkel",
            theme_light: "Hell",
            language: "Sprache",
            ghost: "Geist-Stück",
            ghost_desc: "Landeposition anzeigen",
            grid: "Gitter",
            grid_desc: "Spielfeldlinien",
            animations: "Animationen",
            animations_desc: "Linien-Effekte",
            das: "DAS",
            das_desc: "Verzögertes Auto-Shift",
            arr: "ARR",
            arr_desc: "Auto-Wiederholrate",
            sdf: "SDF",
            sdf_desc: "Soft-Drop-Faktor",
            sfx: "Soundeffekte",
            music: "Musik",
            reset: "Auf Standard zurücksetzen",
            reset_stats_label: "Spielstatistiken zurücksetzen",
            reset_stats_btn: "Zurücksetzen",
            reset_stats_confirm:
                "Möchtest du wirklich alle Statistiken zurücksetzen?",
            reset_game_label:
                "Spieldaten zurücksetzen und Punktetabelle löschen",
            reset_game_btn: "Vollständig zurücksetzen",
            reset_game_confirm:
                "Einstellungen, Statistiken und Punktetabelle zurücksetzen?",
            back: "Zurück",
        },
        controls: {
            title: "Steuerung",
            keyboard: "Tastatur",
            touch: "Touch (Mobil)",
            gamepad: "Gamepad",
            move_left: "Links bewegen",
            move_right: "Rechts bewegen",
            rotate_cw: "Drehen CW",
            rotate_ccw: "Drehen CCW",
            hard_drop: "Hard Drop",
            soft_drop: "Soft Drop",
            hold: "Halten",
            pause: "Pause",
            restart: "Neustart",
            back: "Zurück",
        },
        scores: {
            title: "Punktetabelle",
            empty: "Noch keine Punkte — spiele dein erstes Spiel!",
            rank: "Rang",
            name: "Spieler",
            score: "Punkte",
            level: "Level",
            lines: "Linien",
            date: "Datum",
            back: "Zurück",
        },
        stats: {
            title: "Statistiken",
            games: "Gespielte Spiele",
            lines: "Gelöschte Linien",
            time: "Spielzeit",
            max_score: "Bester Punktestand",
            max_level: "Bestes Level",
            quads: "Quads",
            tspins: "T-Spins",
            pieces: "Platzierte Teile",
            back: "Zurück",
        },
        toast: {
            theme_dark: "Dunkles Design aktiviert",
            theme_light: "Helles Design aktiviert",
            lang_changed: "Sprache geändert",
            settings_saved: "Einstellungen gespeichert",
            stats_reset: "Statistiken wurden zurückgesetzt",
            game_reset: "Spieldaten wurden zurückgesetzt",
        },
    },

    ja: {
        app: {
            title: "R3TRO Blocks",
            tagline: "ブラウザクラシック — 新時代",
        },
        nav: { settings: "設定", controls: "操作", scores: "スコア" },
        menu: {
            play: "プレイ",
            modes: "ゲームモード",
            scores: "スコア表",
            settings: "設定",
            controls: "操作説明",
            stats: "統計",
        },
        modes: {
            marathon: {
                name: "マラソン",
                desc: "時間制限なし。10ラインごとにレベルアップ。",
            },
            sprint: { name: "スプリント", desc: "40ラインを最速でクリア。" },
            ultra: { name: "ウルトラ", desc: "2分間。最大ポイントを獲得。" },
            back: "戻る",
        },
        game: {
            hold: "ホールド",
            score: "スコア",
            level: "レベル",
            time: "タイム",
            next: "ネクスト",
            lines: "ライン",
            lines_count: ["{count}ライン"],
            combo: "コンボ",
            back2back: "バックトゥバック",
        },
        actions: {
            quad: "クアッド！",
            tspin: "Tスピン！",
            tspin_mini: "ミニTスピン",
            tspin_single: "Tスピン シングル",
            tspin_double: "Tスピン ダブル",
            tspin_triple: "Tスピン トリプル",
            perfect_clear: "パーフェクト！",
            back2back: "バックトゥバック",
            combo: "x{count}コンボ",
        },
        pause: {
            title: "一時停止",
            resume: "再開",
            restart: "リスタート",
            settings: "設定",
            menu: "メニュー",
        },
        gameover: {
            title: "ゲームオーバー",
            new_record: "新記録！",
            score: "スコア",
            level: "レベル",
            lines: "ライン",
            time: "タイム",
            initials: "イニシャルを入力",
            initials_help:
                "文字キー (A-Z, 0-9) で入力、矢印で移動、Enter で確定",
            play_again: "もう一度",
            menu: "メニュー",
        },
        settings: {
            title: "設定",
            sections: {
                appearance: "外観",
                gameplay: "ゲームプレイ",
                input: "入力設定",
                audio: "サウンド",
            },
            theme: "テーマ",
            theme_dark: "ダーク",
            theme_light: "ライト",
            language: "言語",
            ghost: "ゴーストピース",
            ghost_desc: "着地位置プレビュー",
            grid: "グリッド",
            grid_desc: "フィールドのグリッド線",
            animations: "アニメーション",
            animations_desc: "ライン消去エフェクト",
            das: "DAS",
            das_desc: "遅延自動シフト",
            arr: "ARR",
            arr_desc: "自動繰り返し速度",
            sdf: "SDF",
            sdf_desc: "ソフトドロップ係数",
            sfx: "効果音",
            music: "BGM",
            reset: "デフォルトに戻す",
            reset_stats_label: "プレイ統計をリセット",
            reset_stats_btn: "リセット",
            reset_stats_confirm:
                "すべての統計をリセットしてもよろしいですか？",
            reset_game_label: "ゲームデータを初期化してスコア表をクリア",
            reset_game_btn: "完全リセット",
            reset_game_confirm:
                "設定・統計・スコア表をすべてリセットしますか？",
            back: "戻る",
        },
        controls: {
            title: "操作説明",
            keyboard: "キーボード",
            touch: "タッチ（モバイル）",
            gamepad: "ゲームパッド",
            move_left: "左移動",
            move_right: "右移動",
            rotate_cw: "右回転",
            rotate_ccw: "左回転",
            hard_drop: "ハードドロップ",
            soft_drop: "ソフトドロップ",
            hold: "ホールド",
            pause: "一時停止",
            restart: "リスタート",
            back: "戻る",
        },
        scores: {
            title: "スコア表",
            empty: "まだスコアがありません — 最初のゲームをプレイ！",
            rank: "順位",
            name: "プレイヤー",
            score: "スコア",
            level: "レベル",
            lines: "ライン",
            date: "日付",
            back: "戻る",
        },
        stats: {
            title: "統計",
            games: "プレイ回数",
            lines: "消去ライン",
            time: "プレイ時間",
            max_score: "最高スコア",
            max_level: "最高レベル",
            quads: "クアッド",
            tspins: "Tスピン",
            pieces: "配置ピース",
            back: "戻る",
        },
        toast: {
            theme_dark: "ダークテーマを有効化",
            theme_light: "ライトテーマを有効化",
            lang_changed: "言語が変更されました",
            settings_saved: "設定を保存しました",
            stats_reset: "統計をリセットしました",
            game_reset: "ゲームデータをリセットしました",
        },
    },
};

/**
 * i18n System - Lightweight internationalization
 */
class I18n {
    static #locale = "en";
    static #translations = TRANSLATIONS.en;

    static get locale() {
        return this.#locale;
    }

    static load(locale) {
        if (!TRANSLATIONS[locale]) locale = "en";
        this.#locale = locale;
        this.#translations = TRANSLATIONS[locale];
        this.#updateDOM();
    }

    /** Get translated string with interpolation */
    static t(key, vars = {}) {
        const str = this.#get(key) || key;
        if (typeof str !== "string") return key;
        return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
    }

    /** Pluralization */
    static tn(key, count) {
        const forms = this.#get(key);
        if (!Array.isArray(forms)) return this.t(key, { count });
        const idx = this.#pluralIndex(count);
        return (forms[idx] || forms[0]).replace("{count}", count);
    }

    /** Format number according to locale */
    static n(number, opts = {}) {
        return new Intl.NumberFormat(this.#locale, opts).format(number);
    }

    /** Format time as mm:ss.ms */
    static time(ms) {
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        const cs = Math.floor((ms % 1000) / 10);
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
    }

    static #get(key) {
        return key.split(".").reduce((obj, k) => obj?.[k], this.#translations);
    }

    static #pluralIndex(n) {
        switch (this.#locale) {
            case "pl":
                if (n === 1) return 0;
                if (
                    n % 10 >= 2 &&
                    n % 10 <= 4 &&
                    (n % 100 < 10 || n % 100 >= 20)
                )
                    return 1;
                return 2;
            case "de":
                return n === 1 ? 0 : 1;
            case "ja":
                return 0; // Japanese has no plurals
            default:
                return n === 1 ? 0 : 1;
        }
    }

    static #updateDOM() {
        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.dataset.i18n;
            const val = this.t(key);
            if (el.dataset.i18nAttr) {
                el.setAttribute(el.dataset.i18nAttr, val);
            } else {
                el.textContent = val;
            }
        });
        document.querySelectorAll("[data-i18n-html]").forEach((el) => {
            el.innerHTML = this.t(el.dataset.i18nHtml);
        });
        document.documentElement.setAttribute("lang", this.#locale);
    }
}

export { I18n, TRANSLATIONS };

# R3TRO Arcade

14 browser games in one place — no installs, no ads, no trackers.

**Play:** https://klefas.me/arcade/

| Game | Genre | What it is |
| --- | --- | --- |
| R3TRO Blocks | Puzzle | Falling-block puzzle with hold, ghost piece, spins, three modes and four languages |
| Shift2048 | Puzzle | Slide-and-merge tiles to 2048, with an Expectimax AI that can play for you |
| SerpentRush | Action | Snake with game modes, themes and rising speed |
| GridStrike | Classic | Tic-tac-toe against a friend or the computer |
| Clash of Choices | Classic | Rock, paper, scissors |
| TypeMaster | Skill | Typing speed test — WPM, accuracy, keystrokes |
| Flap | Action | Tap to keep the bot-bird in the air and slip through the gaps |
| Dino Run | Action | Endless runner: jump rocks and cacti, duck under drones |
| Jumper | Action | Bounce upward across moving and crumbling platforms |
| Match-3 | Puzzle | Swap gems to line up three or more — 30 moves per game |
| MineSweep | Puzzle | Clear the field without touching a mine — three difficulty levels |
| Maze Chase | Action | Collect every dot while four hunters with different tactics chase you |
| Sudoku | Puzzle | Generated puzzles with a unique solution, notes and hints |
| KeyMelody | Toy | Two-octave synth piano for keyboard, mouse or touch |

## Run locally

No build step — it is plain HTML, CSS and JavaScript. Serve the folder with any static server, for example:

```bash
python3 -m http.server 8000
```

then open http://localhost:8000. (Opening `index.html` straight from disk also works for most games; the ones that use ES modules need a server.)

## Structure

```
index.html            launcher
assets/               launcher styles, script and icon
shared/               code used by every game
  back.js             "← Arcade" button
  scores.js           best scores (localStorage)
  canvas.js           canvas helpers for the action games
  game.css            common look of the arcade games
  fonts/              self-hosted fonts + their licences
games/<name>/         one folder per game
```

## Privacy

The arcade makes no requests to other servers: fonts are self-hosted, there are no analytics and no cookies. Best scores and settings are stored only in your browser (`localStorage`).

## Licence

Code: [MIT](LICENSE) © 2026 0xR3TRO. Fonts are under the SIL Open Font License — see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

All games, names, graphics and sounds in this repository are original. Each game implements a generic, well-known game genre; none is affiliated with or endorsed by the makers of similar commercial games.

## History

The arcade replaced 14 separate game repositories in October 2026. Six games (R3TRO Blocks — formerly Tetrix — Shift2048, SerpentRush, GridStrike, Clash of Choices and TypeMaster) come from their 2026 versions; the other eight were rewritten from scratch with new code and graphics.

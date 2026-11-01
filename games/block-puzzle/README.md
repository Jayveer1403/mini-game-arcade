# 🧩 Neon Block Puzzle Arcade

A feature-rich, responsive 10×10 grid Block Puzzle game with multi-line clears, combo multipliers, undo moves, bomb destruction tools, and procedural Web Audio synthesis.

Live Game URL: **[https://blade-slicer-game.vercel.app/games/block-puzzle/](https://blade-slicer-game.vercel.app/games/block-puzzle/)**

---

## 🎮 Gameplay Features

- **10×10 Grid Board:** Classic puzzle board mechanics with rounded glossy socket cells.
- **Rich Block Library:** 24+ distinct polyomino shapes including 1×1 dots, 2-to-5 unit lines, 2×2 / 3×3 squares, L-shapes, T-shapes, corners, and Z/S variations.
- **Simultaneous Row & Column Clears:** Complete multiple rows and columns in a single placement for exponential combo score rewards.
- **Combo Streak Multipliers:** Clearing lines on consecutive placements triggers combo multipliers (`x2`, `x3`, `x4`...) and animated combo banners.
- **Special Mechanics:**
  - ↩️ **Undo Move (3 uses):** Revert accidental placements and restore the prior board state.
  - 💣 **Bomb Clear Tool:** Detonate a 3×3 blast area anywhere on the board to escape tight spots.
  - 🌟 **Perfect Clear:** Earn a +500 point bonus when the entire board is cleared empty!
- **3 Game Modes:**
  - **Classic Mode:** Endless strategy; plays until no available tray piece fits on the board.
  - **Time Attack:** 2-minute high-speed sprint.
  - **Challenge Mode:** Clear 12 full lines to achieve victory.
- **Input Controls:**
  - **Desktop:** Click & drag from tray onto the grid, or click a shape in the tray, then click a target cell on the board.
  - **Mobile:** Touch & drag with real-time placement highlight preview, or tap tray then tap grid. Non-passive touch handlers eliminate unwanted page scrolling.
  - **Shortcuts:** `Z` to Undo, `P` / `Esc` to Pause.
- **Web Audio API Engine:** Synthesized placement thuds, line clear fanfares, combo chimes, bomb booms, and error buzzes with instant mute toggle (`🔊 / 🔇`).
- **High-Score Persistence:** Remembers best records locally in `localStorage`.

---

## 🚀 Running Locally

```powershell
cd "C:\Users\Welcome\.gemini\antigravity\scratch\blade-slice-game"
python -m http.server 3000
```
Open [http://localhost:3000/games/block-puzzle/](http://localhost:3000/games/block-puzzle/) in your browser.

---

## 🌐 Deployment to Vercel

The project is 100% static and requires zero backend dependencies. Deploy anytime with:

```powershell
npx.cmd vercel --prod
```

# 🔢 Number Merge - Arcade Puzzle Game

A sleek, responsive, neon-styled 2048-inspired number puzzle game running in plain HTML5, CSS3, and JavaScript with the Web Audio API.

---

## 🎮 Game Modes

1. **Classic Mode**:
   - Slide tiles in 4 directions on a 4x4 grid.
   - When two matching numbers collide, they merge into double their value (2 + 2 = 4, 4 + 4 = 8 ... 1024 + 1024 = 2048).
   - Reach your target number (1024 / 2048 / 4096 depending on difficulty) to trigger victory, with the option to continue playing infinitely.

2. **Time Attack Mode**:
   - 90-second rapid-fire blitz.
   - Rack up as many merges and score points as possible before time expires.

3. **Endless Mode**:
   - Relaxed, infinite merging session without target thresholds.
   - Push for the highest tile value and high score record.

4. **Challenge Mode**:
   - Objective: Craft a **512** tile in **60 moves or fewer**.
   - Requires careful planning and forward-looking moves.

---

## ⚡ Power-Up Tools

- ↩️ **Undo (3 uses)**: Revert your previous move when you make an accidental swipe.
- 💡 **Hint (3 uses)**: Analyzes the board in all 4 directions and identifies the optimal swipe direction with animated arrow feedback.
- 🔀 **Shuffle (1 use)**: Re-scrambles existing tiles into new grid positions when trapped.

---

## 🕹️ Controls

- **Desktop Keyboard**:
  - `↑` / `W`: Swipe Up
  - `↓` / `S`: Swipe Down
  - `←` / `A`: Swipe Left
  - `→` / `D`: Swipe Right
  - `Z`: Undo Move
  - `H`: Hint
  - `S`: Shuffle
  - `P` / `Esc`: Pause / Resume

- **Mobile & Touch**:
  - Swipe anywhere directly on the board.
  - Or tap the on-screen responsive **Virtual D-Pad**.
  - Touch gestures automatically prevent page scrolling while interacting.

---

## 🔊 Audio & Accessibility

- Built using the **Web Audio API** with zero external audio assets.
- Sound synthesizes unique slide whooshes, harmonic merge tones, combo chimes, fanfare chords, and UI clicks.
- Toggle sound easily via the top right 🔊 button.

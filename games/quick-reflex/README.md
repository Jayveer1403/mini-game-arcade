# ⚡ Quick Reflex - Reaction Speed Challenge

A high-precision, responsive browser-based reaction speed and reflex arcade game built with pure **HTML5**, **CSS3**, and **modern JavaScript (ES6+)** using the **Web Audio API** and `performance.now()`.

---

## 🎮 Game Modes

1. **Reaction Time Test (Classic)**:
   - Wait on the alert red screen.
   - When the screen randomly flashes bright **GREEN**, tap immediately.
   - Measures raw reflex speed down to the millisecond (`performance.now()`).
   - Penalizes false starts if players jump the gun early.
   - 5 rounds per session to calculate personal average, fastest, and slowest reactions.

2. **Color Reflex Challenge**:
   - Randomizes a target color directive (e.g., "Tap the CYAN circle!").
   - 6 vibrant circular targets shuffle in position.
   - Penalizes incorrect taps while rewarding swift correct picks.

3. **Number Blitz**:
   - Randomly arranged numbered tiles on a grid.
   - Players must tap targets in strict ascending order (`1 ➔ 2 ➔ 3...`).
   - Fosters visual tracking speed and hand-eye coordination.

4. **Fast Tap Challenge**:
   - 10-second rapid clicker / tapper challenge.
   - Unleash maximum click frequency to see taps-per-second and set a personal high speed record.

5. **Memory Reflex Challenge**:
   - Simon-style memory pad reproducing dynamic musical and color sequences.
   - Sequence length expands with each cleared round.

---

## 🕹️ Controls

- **Desktop**:
  - `Mouse`: Click the arena or target elements.
  - `Keyboard`: `Spacebar` or `Enter` to react.
  - `P` / `Esc`: Pause and Resume.
- **Mobile & Tablet**:
  - High-response direct touch tapping.
  - Protected against accidental screen scroll during gameplay (`touch-action: none`).

---

## 📊 Performance Categories (Based on Real Measured Milliseconds)

- ⚡ **Lightning Fast**: Sub-220 ms average
- 🌟 **Excellent**: 220 ms – 280 ms average
- 🎯 **Very Good**: 280 ms – 350 ms average
- 🚀 **Keep Practicing**: Over 350 ms average

---

## 🔊 Audio & Accessibility

- Pure procedural sound generation via the **Web Audio API** (no external audio assets).
- Audio starts only after initial user interaction.
- Instant mute/unmute toggle available on the header HUD.

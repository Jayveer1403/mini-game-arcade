# 🎨 Color Reaction - Fast Color Matching Challenge

A chromatic reaction arcade game built with pure **HTML5**, **CSS3**, and **JavaScript (ES6+)** featuring **Web Audio API** and `performance.now()` precision timing.

---

## 🎮 Game Modes

1. **Classic Color Match**:
   - Observe the top target color swatch.
   - Immediately tap the matching color card from 4–8 options before the round timer expires.
   - Round times shorten progressively as you advance through rounds.

2. **Speed Rush (45s Blitz)**:
   - Match as many target colors as humanly possible against a global 45-second clock.
   - Build massive consecutive combo streaks for bonus points.

3. **Color Name Challenge (Stroop Effect)**:
   - Read the written color name on the target swatch (e.g., "PURPLE").
   - Pick the color corresponding to the text while ignoring the misleading swatch background color!

4. **Reverse Color Challenge**:
   - Inverse rule: Choose any color that does **NOT** match the target swatch.
   - Tests mental inhibition and impulse control.

5. **Color Memory Challenge**:
   - Simon-style chromatic memory test.
   - Watch the animated color sequence and repeat it accurately in order.

---

## 🕹️ Controls

- **Desktop**:
  - `Mouse`: Click any color card.
  - `Keys 1–8`: Rapid numeric hotkeys corresponding to option tiles.
  - `P` / `Esc`: Pause and Resume.
- **Mobile & Tablet**:
  - Large touch-friendly color pads.
  - Touch scrolling suppressed inside game area (`touch-action: none`).

---

## 🏆 Performance Categories

- 🎨 **Color Master**: High score (5000+) & 90%+ accuracy
- ⚡ **Lightning Fast**: Sub-450 ms average response time
- 🌟 **Excellent**: 85%+ accuracy
- 🎯 **Very Good**: 70%+ accuracy
- 🚀 **Keep Practicing**: Below 70% accuracy

---

## 🔊 Audio & Accessibility

- Real-time sound synthesis via the **Web Audio API** (melodic match chimes, error buzzes, sequence tones, fanfare).
- Accessible color cards with both high-contrast color names and numeric badges.
- Sound toggle button available in the HUD header.

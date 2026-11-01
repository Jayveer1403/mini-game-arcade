# 🫧 Bubble Pop Arcade

A high-performance, glossy, browser-based Bubble Pop arcade mini-game built with pure **HTML5 Canvas**, **CSS3**, and **modern JavaScript (ES6+)**.

Live Arcade Link: **[https://blade-slicer-game.vercel.app/games/bubble-pop/](https://blade-slicer-game.vercel.app/games/bubble-pop/)**

---

## 🎮 Game Overview & Features

- **Translucent 3D-Style Bubbles**: Realistic procedural reflections, specular highlights, and soft glowing dropshadows rendered purely via Canvas 2D gradients.
- **Multiple Bubble Tiers & Colors**:
  - **Standard Bubbles (6 Palettes):** Cyan, Pink, Green, Purple, Orange, Blue (+10 to +20 pts).
  - **Golden Bubbles (★):** Rare +50 pts bonus.
  - **Rainbow Bubbles (✦):** Multi-color gradient bubble rewarding +100 pts.
- **4 Special Power-Up Bubbles**:
  - 💥 **Mega Pop:** AOE shockwave exploding all nearby bubbles in a chain reaction.
  - ⏱️ **Slow-Mo:** Temporarily slows all bubble movement by 50%.
  - ⭐ **Score Booster:** Doubles all points earned for 7 seconds.
  - ⏳ **Time Bonus:** Instantly adds +8 extra seconds to the clock.
- **3 Diverse Game Modes**:
  - **Classic Mode:** Pop as many bubbles as possible before the 60-second timer runs out.
  - **Endless Mode:** Chill, continuous popping survival mode with progressively climbing speed and difficulty.
  - **Challenge Mode:** Pop 20 Target Pink Neon bubbles before the 45-second timer expires.
- **Combo Multiplier System**: Pop bubbles consecutively to build your combo multiplier up to 4x.
- **Juicy Pop Particle System**: Multi-particle splatter effects matching the exact bubble color.
- **Zero-Latency Web Audio Synthesizer**: In-browser sound synthesis for pops, gold chimes, explosions, power-up fanfares, and game over sequences with mute toggle (`🔊 / 🔇`).
- **High Score Tracking**: Automatically saves best scores per game mode in `localStorage`.
- **Touch-Friendly & Anti-Scroll**: Full pointer and multi-touch support with `touch-action: none` to prevent accidental screen scrolling.

---

## 🛠️ How to Customize

All gameplay variables are centrally defined in `script.js`:

1. **Bubble Colors & Points:**
   Edit `STANDARD_BUBBLE_PALETTES` in `script.js`:
   ```javascript
   const STANDARD_BUBBLE_PALETTES = [
     { name: 'cyan', base: '#00f2fe', edge: '#0077b6', points: 10 },
     ...
   ];
   ```

2. **Power-Up Types & Durations:**
   Edit `POWERUP_TYPES` in `script.js` to change durations or add new effects:
   ```javascript
   const POWERUP_TYPES = [
     { type: 'slow', name: 'Slow-Mo', icon: '⏱️', duration: 6000 },
     { type: 'booster', name: '2x Score Booster', icon: '⭐', duration: 7000 },
     ...
   ];
   ```

3. **Spawn Rate & Difficulty:**
   Adjust `this.spawnInterval` (default `38`) or difficulty scaling multiplier in `BubblePopGame`.

---

## 🚀 Running Locally

```powershell
cd "C:\Users\Welcome\.gemini\antigravity\scratch\blade-slice-game"
python -m http.server 3000
```
Then visit `http://localhost:3000/games/bubble-pop/`.

---

## 🌐 Deployment to Vercel

The game is 100% static and requires zero build steps or API keys. Deploy with:

```powershell
npx.cmd vercel --prod
```

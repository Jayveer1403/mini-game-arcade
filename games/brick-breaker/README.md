# 🧱 Neon Brick Breaker Arcade

A feature-complete, modern HTML5 Canvas arcade Brick Breaker featuring **10 unique architectural levels**, **multiple brick tiers**, **7 game-changing power-ups**, **multi-ball physics**, and in-browser **Web Audio API** sound synthesis.

Live Game URL: **[https://blade-slicer-game.vercel.app/games/brick-breaker/](https://blade-slicer-game.vercel.app/games/brick-breaker/)**

---

## 🎮 Gameplay Features

- **10 Unique Levels:** Custom architectural formations including Pyramids, Mazes, Gateways, Steel Columns, and Fortresses.
- **5 Distinct Brick Types:**
  - **Normal Bricks (Cyan, Green, Orange):** 1-hit destruction (+20 to +30 pts).
  - **Strong Bricks (Pink):** 2 hits required; cracks visually on first hit (+50 pts).
  - **Golden Bricks (★):** High-score bonus reward (+100 pts).
  - **Explosive Bricks (💣):** AOE detonation shattering adjacent bricks in a chain reaction.
  - **Unbreakable Steel Bricks:** Indestructible obstacles requiring navigation around them.
- **7 Dynamic Power-Ups:**
  - ↔️ **Wide Paddle:** Extends paddle width by 45%.
  - ⚽ **Multi-Ball:** Clones all active balls in play.
  - 🔴 **Laser Cannon:** Paddle shoots projectile beams on Spacebar or screen tap.
  - ⏱️ **Slow-Mo:** Reduces ball velocity for surgical accuracy.
  - ❤️ **Extra Life:** Restores lost health hearts.
  - 🔥 **Fireball:** Slices directly through bricks without bouncing back.
  - ⭐ **2x Score Multiplier:** Doubles all brick smash points for 9 seconds.
- **3 Game Modes:**
  - **Classic Mode:** 10 levels of progression with level-select chips.
  - **Endless Mode:** Endless continuous brick breaking with survival scoring.
  - **Time Challenge:** 90-second high-speed blitz.
- **Web Audio API Synthesizer:** Realistic paddle deflection boings, wall ricochets, explosive blasts, laser shots, and victory fanfare with instant mute toggle (`🔊 / 🔇`).
- **Input Controls:**
  - **Desktop:** Mouse drag, Left/Right Arrow keys, Spacebar (launch / laser shoot), `P` / `Esc` (pause).
  - **Mobile:** Touch drag paddle, tap to launch/shoot, non-passive scroll suppression.

---

## 🚀 Running Locally

```powershell
cd "C:\Users\Welcome\.gemini\antigravity\scratch\blade-slice-game"
python -m http.server 3000
```
Open [http://localhost:3000/games/brick-breaker/](http://localhost:3000/games/brick-breaker/) in your browser.

---

## 🌐 Deployment to Vercel

The project is 100% static with zero backend dependencies. Deploy anytime with:

```powershell
npx.cmd vercel --prod
```

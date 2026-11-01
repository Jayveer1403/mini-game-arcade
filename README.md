# 🕹️ Mini Game Arcade

A fast, responsive, curated browser-based arcade website built with pure **HTML5**, **CSS3**, and **modern JavaScript (ES6+)**.

Live production link: **[https://blade-slicer-game.vercel.app](https://blade-slicer-game.vercel.app)**

---

## 🎮 Playable Games in the Arcade

1. **🍉 Fruit Blade (`/games/fruit-blade/`)**
   - High-speed arcade fruit slicing action with realistic gravity trajectories, 3D slicing physics, juicy color-matched particle bursts, combo multipliers, and explosive bomb hazards.
   - **Controls:** Click & drag with mouse on desktop, or swipe with touch on mobile/tablet.

2. **⚡ Cyber Dash (`/games/cyber-dash/`)**
   - High-reflex neon runner dodging high-voltage plasma barriers, steering across lanes, and collecting glowing energy orbs.
   - **Controls:** Arrow Keys / `A` & `D` on desktop, or tap left/right halves of screen on touchscreens.

---

## 📁 Project Structure

```
blade-slice-game/
├── index.html                   # Main Arcade Portal (catalog, search/filters, policies)
├── portal.css                   # Responsive portal theme and arcade cards grid
├── vercel.json                  # Routing configuration and security headers
├── games/
│   ├── fruit-blade/
│   │   ├── index.html           # Dedicated fruit slicing game page
│   │   ├── game.js              # Ballistics, geometry cutting, combos, particles
│   │   ├── audio.js             # Web Audio procedural sound synthesizer
│   │   └── style.css            # Game HUD & arena styling
│   └── cyber-dash/
│       └── index.html           # Dedicated cyber runner game page
└── README.md                    # Project documentation & Game Addition Guide
```

---

## 🛠️ How to Add a New Game (Step-by-Step)

Adding a new game to the arcade is straightforward:

### Step 1: Create a dedicated game folder
Create a new directory inside `games/`, for example `games/retro-invaders/`:
```bash
mkdir games/retro-invaders
```

### Step 2: Implement the game files
Place your game's `index.html`, scripts, and styles inside `games/retro-invaders/index.html`.
Make sure to include a **"⬅️ Arcade"** back button linking to `/` in the header or pause menu.

### Step 3: Register the game in the portal catalog
Open `index.html` in the root folder, and add a new `<article class="game-card">` entry inside `<div class="games-grid" id="games-grid">`:

```html
<article class="game-card" data-category="arcade" data-tags="space retro invaders shooting">
  <div class="card-thumb-wrapper">
    <!-- Inline Vector SVG thumbnail -->
    <svg class="card-thumb-svg" viewBox="0 0 400 240"> ... </svg>
    <span class="badge-tag runner">RETRO</span>
  </div>
  <div class="card-body">
    <div class="card-meta">
      <h3 class="card-title">Retro Invaders</h3>
      <span class="card-rating">⭐ 4.9</span>
    </div>
    <p class="card-desc">Defend the galaxy against waves of alien invaders.</p>
    <div class="controls-pill-row">
      <span class="control-tag">⌨️ Left/Right & Space</span>
    </div>
    <div class="card-action-row">
      <a href="/games/retro-invaders/" class="play-btn">PLAY NOW ➔</a>
    </div>
  </div>
</article>
```

### Step 4: Test locally and deploy
```bash
npx.cmd vercel --prod
```

---

## 🚀 Local Development

You can run the entire arcade using any lightweight static server:

```powershell
cd "C:\Users\Welcome\.gemini\antigravity\scratch\blade-slice-game"
python -m http.server 3000
```
Then visit `http://localhost:3000` in your browser.

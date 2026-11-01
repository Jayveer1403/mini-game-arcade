# 🚀 Space Dodge - Space Survival Arcade Game

A high-speed cosmic survival arcade game built with pure **HTML5 Canvas**, **CSS3**, and **JavaScript (ES6+)** using the **Web Audio API** and 60 FPS delta-time physics.

---

## 🎮 Game Modes

1. **Classic Survival**:
   - Pilot your spaceship across deep space, dodging asteroids, lasers, and explosive space mines.
   - Hazard frequency and speeds scale progressively over survival time.
   - Near-miss skimming awards bonus score and builds combo streaks.

2. **Endless Space**:
   - Infinite deep space trek without ceiling.
   - Push for the highest distance traveled and top score records.

3. **Time Blitz (60s Storm)**:
   - High-density asteroid and laser barrage.
   - Survive the full 60 seconds to achieve mission completion.

4. **Missions Mode**:
   - Complete specialized survival parameters (near-misses, collecting energy orbs, and power-up mastery).

---

## ⚡ Hazards & Obstacles

- 🪨 **Small Asteroids**: High velocity, requiring swift dodging reflexes.
- 🌑 **Large Asteroids**: Substantial mass that controls screen real estate.
- 💣 **Space Mines**: Dangerous stationary mines drifting through space.
- ⚡ **Laser Sweeps**: Warning telegraph lines flashing into high-damage energy beams.

---

## 🛡️ Power-Ups & Special Ability

- 🛡️ **Shield**: Absorbs one direct hull impact.
- ⚡ **Speed Boost**: Temporarily supercharges ship velocity and engine trails.
- ⏳ **Slow-Mo**: Temporarily slows down all incoming hazard velocities.
- 🧲 **Magnet**: Gravitationally pulls nearby collectible energy orbs toward your craft.
- ⭐ **2X Score Booster**: Doubles all points earned during active duration.
- 💥 **Special Ability (Energy Pulse)**: Trigger with **Spacebar** or the mobile **PULSE** button to obliterate all nearby hazards in a 220px radius.

---

## 🕹️ Controls

- **Desktop**:
  - `Arrow Keys` or `W`, `A`, `S`, `D`: Fly spaceship.
  - `Spacebar`: Activate Energy Pulse special ability.
  - `P` / `Esc`: Pause and Resume.
- **Mobile & Tablet**:
  - Direct touch and drag anywhere on the canvas.
  - On-screen **Virtual Joystick** on the bottom left.
  - Dedicated **PULSE** button with dynamic cooldown animation on the bottom right.
  - Native scrolling suppressed inside game canvas (`touch-action: none`).

---

## 🔊 Audio & Visuals

- Procedural sound synthesizer via the **Web Audio API** (thruster hums, pulse blasts, near-miss whooshes, power-up chimes, and explosions).
- Parallax 3-layer starry starfield with colorful nebulae and engine particle trails.
- Instant sound toggle available on top HUD.

# Vercel Deployment Guide — Mini Game Arcade

This document specifies the exact Vercel project configuration, environment requirements, and verification results for the **Mini Game Arcade** project.

---

## 1. Project Specifications

- **Framework Preset:** `Other` (Static HTML5 / Canvas / Vanilla JS)
- **Root Directory:** `./` (or repository root `blade-slice-game`)
- **Build Command:** *None* (leave empty)
- **Output Directory:** `.` (or leave default empty)
- **Node.js Version:** `20.x` or `22.x` (pure static, serverless functions not required)

---

## 2. Configuration (`vercel.json`)

```json
{
  "cleanUrls": true,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

*Note on Client-Side Rewrites:*  
This project uses standard static multi-page routing (`/`, `/games/fruit-blade/`, `/games/cyber-dash/`). Single-page SPA wildcard catch-all rewrites (`/.* -> /index.html`) are **not** needed and would incorrectly intercept static asset requests.

---

## 3. Production Deployment Commands

To deploy updates from your local workspace:

```powershell
cd "C:\Users\Welcome\.gemini\antigravity\scratch\blade-slice-game"
npx.cmd vercel --prod
```

---

## 4. Live Verification Status

The production deployment has been verified across all endpoints:

- **Production URL:** [https://blade-slicer-game.vercel.app](https://blade-slicer-game.vercel.app)
- **Portal Catalog:** `https://blade-slicer-game.vercel.app/` &rarr; `HTTP 200 OK`
- **Fruit Blade Route:** `https://blade-slicer-game.vercel.app/games/fruit-blade/` &rarr; `HTTP 200 OK`
- **Cyber Dash Route:** `https://blade-slicer-game.vercel.app/games/cyber-dash/` &rarr; `HTTP 200 OK`
- **Asset Integrity:** All stylesheets, Canvas scripts, and Web Audio synthesizers resolved without 404s.

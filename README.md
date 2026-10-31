# 🚀 NEON SLING: Orbit Drift

An arcade cyberpunk gravitational mini-game engineered for instant 5-second mastery, escalating adrenaline, dynamic procedural synthwave music, and viral social sharing.

![Version](https://img.shields.io/badge/version-1.0.0-cyan.svg)
![Technology](https://img.shields.io/badge/tech-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-magenta.svg)
![Audio](https://img.shields.io/badge/sound-Procedural%20Web%20Audio%20API-orange.svg)

---

## 🎮 How to Play (5-Second Mastery)

- **👆 TAP & HOLD (or press & hold `SPACE`):** Shoots a gravitational tether to the nearest neon core and enters radial orbit.
- **🚀 RELEASE:** Fling forward with high-speed tangential momentum.
- **⚡ HIT FORWARD SLINGS:** Slinging straight ahead earns **"PERFECT SLING!"** speed boosts and multiplies your combo (`x2`, `x3`, `x5`, `x10`).
- **💎 COLLECT CRYSTALS:** Charges your **FEVER SURGE** meter.
- **🔥 FEVER SURGE MODE:** At 100% energy, you blast into invincible hyperspeed, shredding all hazards in your path and magnetically pulling all nearby crystals!
- **⚠️ AVOID HAZARDS:** Dodge pulsing red mines and rotating laser barriers. Near misses give slow-mo time dilation bonus points!

---

## 🌟 Key Features

1. **Instant, Addictive Gameplay Loop:**
   - 20-60 second high-intensity runs with instant retry.
   - Built-in dynamic camera tracking, screen shake, and floating combat text.
   - Matrix-style slow-motion time dilation on close-call near misses.

2. **Procedural Web Audio Engine (`audio.js`):**
   - **Zero external audio file dependencies** or download latency.
   - Built with the native Web Audio API (`AudioContext`).
   - Dynamic 80s Synthwave soundtrack featuring driving bass arpeggios, 4-on-the-floor kick, snappy snare, hi-hats, and ambient chords.
   - Music dynamically accelerates and opens filters during Fever Mode.
   - Procedural arcade sound effects: grapple snap, whoosh release, crystal chimes, explosion rumble, and achievement fanfare.
   - Separate Music and SFX volume/mute toggles.

3. **Viral & Social Bragging Mechanics:**
   - **Canvas Share Card Generator:** Renders a pilot badge with your score, call-sign, max combo, and run stats for Instagram, Twitter/X, and TikTok.
   - **1-Click Brag Copy:** Automatically formats and copies a brag message to your clipboard with one click.
   - **20+ Viral Roasts:** Personalized death roasts (e.g. *"Newton just unfollowed you on Twitter 💀"*, *"Reflexes running on 2G dialup internet 📉"*).

4. **Multiple Game Modes:**
   - **Endless:** Progressive difficulty with evolving obstacle densities.
   - **Chrono Rush:** 60-second time attack; crystals add `+1.5s` back to the clock.
   - **Hardcore:** Accelerated velocity, dense rotating laser fields, and instant doom.

5. **Progression & Customization:**
   - Unlock custom Core Avatars (Cyber Neon, Synth Sunset, Solar Flare, Matrix Emerald) and Hyper Trails with earned crystals.
   - Achievements system with real-time HUD toast alerts.
   - Persistent Local Leaderboard and high scores saved to `localStorage`.

---

## 💻 How to Run the Game

### Option 1: Direct File Open
Simply double-click `index.html` in your browser.

### Option 2: Local HTTP Server (Recommended)
Using Python:
```bash
python -m http.server 8080
```
Then open [http://localhost:8080](http://localhost:8080) in any browser (desktop, tablet, or smartphone).

Using Node.js / `npx`:
```bash
npx serve .
```

---

## 📱 Controls Summary

| Device | Action | Control |
|---|---|---|
| **Desktop / Laptop** | Latch / Orbit | Hold <kbd>SPACE</kbd> or Left-Click |
| **Desktop / Laptop** | Fling / Release | Release <kbd>SPACE</kbd> or Mouse |
| **Mobile / Tablet** | Latch & Fling | Tap & Hold anywhere, then Release |
| **Keyboard** | Pause / Resume | Press <kbd>P</kbd> or <kbd>ESC</kbd> |

---

Built with clean, vanilla, zero-dependency HTML5, CSS3, and modern JavaScript.

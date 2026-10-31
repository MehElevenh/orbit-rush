/**
 * ============================================================================
 * NEON SLING: Orbit Drift - Core High-Performance Game Engine
 * ============================================================================
 * Physics, procedural obstacle generation, visual particle systems,
 * retina canvas rendering, input management, and gameplay loop.
 */

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Display DPI & Dimensions
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Game States
    this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
    this.gameMode = 'arcade'; // 'arcade' | 'chrono' | 'hardcore'

    // Time & Performance
    this.lastTime = 0;
    this.chronoTimer = 60.0;
    this.timeScale = 1.0;
    this.slowMoTimer = 0;

    // Camera
    this.camera = { x: 0, y: 0 };
    this.screenShake = 0;

    // Player State
    this.player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 14,
      angle: 0,
      baseSpeed: 420,
      maxSpeed: 820,
      tetheredTo: null,
      tetherAngle: 0,
      tetherRadius: 0,
      tetherAngularVel: 0,
      tetherDuration: 0,
      trail: [],
      shieldActive: false,
      skin: 'core_cyan',
      trailSkin: 'trail_cyan'
    };

    // Input
    this.isHoldingInput = false;

    // Gameplay Metrics & Progression
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('neonsling_highscore') || '0', 10);
    this.crystals = 0;
    this.runCrystals = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.maxCombo = 1;
    this.orbitsSlung = 0;

    // Fever System
    this.feverEnergy = 0; // 0 to 100
    this.isFeverActive = false;
    this.feverTimer = 0;

    // World Entities
    this.anchors = [];
    this.hazards = [];
    this.gems = [];
    this.particles = [];
    this.floatingTexts = [];
    this.stars = [];

    // Generation tracking
    this.spawnDistanceX = 0;
    this.lastAnchorX = 0;

    this.initCanvas();
    this.initStars();
    this.setupListeners();
  }

  // =========================================================================
  // Canvas & Setup
  // =========================================================================
  initCanvas() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  initStars() {
    this.stars = [];
    const count = Math.floor((this.width * this.height) / 8000);
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2 + 0.6,
        color: Math.random() > 0.4 ? '#00f3ff' : '#ff007f',
        alpha: Math.random() * 0.7 + 0.2,
        speed: Math.random() * 0.2 + 0.05
      });
    }
  }

  setupListeners() {
    window.addEventListener('resize', () => {
      this.initCanvas();
      this.initStars();
    });

    // Unified pointer input
    const onStart = (e) => {
      if (this.state === 'PLAYING') {
        this.pressAction();
      }
    };

    const onEnd = (e) => {
      if (this.state === 'PLAYING') {
        this.releaseAction();
      }
    };

    this.canvas.addEventListener('pointerdown', onStart);
    this.canvas.addEventListener('pointerup', onEnd);
    this.canvas.addEventListener('pointercancel', onEnd);

    // Keyboard support
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (this.state === 'PLAYING' && !this.isHoldingInput) {
          this.pressAction();
        }
      }
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (this.state === 'PLAYING') {
          window.uiManager.pauseGame();
        } else if (this.state === 'PAUSED') {
          window.uiManager.resumeGame();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (this.state === 'PLAYING') {
          this.releaseAction();
        }
      }
    });
  }

  // =========================================================================
  // Game Lifecycle
  // =========================================================================
  startRun(mode = 'arcade') {
    this.gameMode = mode;
    this.state = 'PLAYING';
    this.score = 0;
    this.runCrystals = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.maxCombo = 1;
    this.orbitsSlung = 0;
    this.feverEnergy = 0;
    this.isFeverActive = false;
    this.feverTimer = 0;
    this.chronoTimer = 60.0;
    this.screenShake = 0;
    this.slowMoTimer = 0;
    this.timeScale = 1.0;
    this.isHoldingInput = false;

    // Reset Player
    const startSpeed = this.gameMode === 'hardcore' ? 520 : 420;
    this.player = {
      x: 200,
      y: this.height / 2,
      vx: startSpeed,
      vy: 0,
      radius: 14,
      angle: 0,
      baseSpeed: startSpeed,
      maxSpeed: this.gameMode === 'hardcore' ? 950 : 820,
      tetheredTo: null,
      tetherAngle: 0,
      tetherRadius: 0,
      tetherAngularVel: 0,
      tetherDuration: 0,
      trail: [],
      shieldActive: false,
      skin: localStorage.getItem('neonsling_core') || 'core_cyan',
      trailSkin: localStorage.getItem('neonsling_trail') || 'trail_cyan'
    };

    this.camera.x = this.player.x - this.width * 0.3;
    this.camera.y = this.player.y - this.height * 0.5;

    // Reset Entities
    this.anchors = [];
    this.hazards = [];
    this.gems = [];
    this.particles = [];
    this.floatingTexts = [];
    this.spawnDistanceX = 0;
    this.lastAnchorX = 0;

    // Create Starting Anchors
    this.createAnchor(350, this.height / 2, 110);
    this.createAnchor(650, this.height / 2 - 120, 115);
    this.createAnchor(980, this.height / 2 + 100, 120);
    this.spawnDistanceX = 1100;

    // Audio
    window.audioManager.setFever(false);
    window.audioManager.startMusic();

    this.lastTime = performance.now();
  }

  // =========================================================================
  // Input Handling
  // =========================================================================
  pressAction() {
    this.isHoldingInput = true;
    if (this.player.tetheredTo) return;

    // Find closest anchor in front or near player
    let closestAnchor = null;
    let minDistance = 240; // Max latch radius

    for (const anchor of this.anchors) {
      const dx = anchor.x - this.player.x;
      const dy = anchor.y - this.player.y;
      const dist = Math.hypot(dx, dy);

      if (dist < minDistance && dx > -60) {
        minDistance = dist;
        closestAnchor = anchor;
      }
    }

    if (closestAnchor) {
      this.latchAnchor(closestAnchor, minDistance);
    }
  }

  latchAnchor(anchor, dist) {
    this.player.tetheredTo = anchor;
    this.player.tetherRadius = Math.max(dist, 55);
    this.player.tetherDuration = 0;

    // Calculate initial angle from anchor to player
    const dx = this.player.x - anchor.x;
    const dy = this.player.y - anchor.y;
    this.player.tetherAngle = Math.atan2(dy, dx);

    // Tangential cross product determines orbit direction (clockwise or counter-clockwise)
    const crossProduct = dx * this.player.vy - dy * this.player.vx;
    const direction = crossProduct >= 0 ? 1 : -1;

    // Angular velocity from linear speed
    const currentSpeed = Math.hypot(this.player.vx, this.player.vy);
    this.player.tetherAngularVel = (currentSpeed / this.player.tetherRadius) * direction;

    // Slingshot Audio & Particles
    window.audioManager.playGrapple();
    this.createShockwave(this.player.x, this.player.y, '#00f3ff');
    this.createSparks(anchor.x, anchor.y, 10, '#00f3ff');
  }

  releaseAction() {
    this.isHoldingInput = false;
    if (!this.player.tetheredTo) return;

    const anchor = this.player.tetheredTo;
    const angle = this.player.tetherAngle;
    const angVel = this.player.tetherAngularVel;
    const radius = this.player.tetherRadius;

    // Tangent vector
    // Vx = -sin(angle) * angVel * radius
    // Vy =  cos(angle) * angVel * radius
    let vx = -Math.sin(angle) * (angVel * radius);
    let vy = Math.cos(angle) * (angVel * radius);

    // Calculate forward angle efficiency (flinging to the right earns bonus speed & score)
    const velocityAngle = Math.atan2(vy, vx);
    const isForwardSling = Math.abs(velocityAngle) < 0.6; // Launching mostly forward

    let speedBonus = 1.1;
    if (isForwardSling) {
      speedBonus = 1.35;
      this.combo++;
      this.comboTimer = 3.5;
      this.maxCombo = Math.max(this.maxCombo, this.combo);

      this.score += 250 * this.combo;
      this.addFever(12);

      window.audioManager.playPerfect();
      this.addFloatingText(this.player.x, this.player.y - 20, `PERFECT SLING! x${this.combo}`, '#00f3ff');
      this.createShockwave(this.player.x, this.player.y, '#ff007f');
      this.screenShake = 6;
    } else {
      window.audioManager.playRelease();
    }

    // Apply speed
    const currentSpeed = Math.hypot(vx, vy) * speedBonus;
    const clampedSpeed = Math.max(this.player.baseSpeed, Math.min(currentSpeed, this.player.maxSpeed));
    const finalDir = Math.atan2(vy, vx);

    this.player.vx = Math.cos(finalDir) * clampedSpeed;
    this.player.vy = Math.sin(finalDir) * clampedSpeed;

    this.player.tetheredTo = null;
    this.orbitsSlung++;
    this.score += 100 * this.combo;
    this.addFever(6);
  }

  // =========================================================================
  // Fever System & Progression
  // =========================================================================
  addFever(amount) {
    if (this.isFeverActive) return;
    this.feverEnergy = Math.min(100, this.feverEnergy + amount);
    if (this.feverEnergy >= 100) {
      this.activateFever();
    }
  }

  activateFever() {
    this.isFeverActive = true;
    this.feverEnergy = 100;
    this.feverTimer = 6.0; // 6 seconds of invincibility and hyper-speed!
    this.screenShake = 12;

    window.audioManager.playFeverActivate();
    window.audioManager.setFever(true);

    this.createShockwave(this.player.x, this.player.y, '#ffb800');
    this.addFloatingText(this.player.x, this.player.y - 40, '⚡ FEVER SURGE ACTIVATED! ⚡', '#ffb800', 1.8);
  }

  // =========================================================================
  // Entity Generation (Procedural Level Stream)
  // =========================================================================
  createAnchor(x, y, radius = 110) {
    this.anchors.push({
      x,
      y,
      radius,
      pulse: Math.random() * Math.PI,
      glowColor: Math.random() > 0.4 ? '#00f3ff' : '#9d4edd'
    });
    this.lastAnchorX = x;
  }

  createHazard(x, y, type = 'mine') {
    this.hazards.push({
      x,
      y,
      type, // 'mine' | 'laser_rot'
      radius: 16,
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 2.5,
      laserLength: 120,
      pulse: 0
    });
  }

  createGem(x, y) {
    this.gems.push({
      x,
      y,
      radius: 10,
      pulse: Math.random() * Math.PI,
      collected: false
    });
  }

  updateProceduralWorld() {
    // Generate new content ahead of player
    while (this.spawnDistanceX < this.player.x + this.width * 1.5) {
      const gap = 240 + Math.random() * 120;
      const nextX = this.spawnDistanceX + gap;

      // Vertical positioning variation
      const centerY = this.height / 2;
      const maxYOffset = Math.min(this.height * 0.35, 260);
      const nextY = centerY + (Math.random() * 2 - 1) * maxYOffset;

      this.createAnchor(nextX, nextY, 100 + Math.random() * 30);

      // Spawn Gems in the flight corridors
      const gemCount = Math.floor(Math.random() * 3) + 1;
      for (let g = 0; g < gemCount; g++) {
        const gx = this.spawnDistanceX + gap * (0.3 + g * 0.25);
        const gy = nextY + (Math.random() * 2 - 1) * 60;
        this.createGem(gx, gy);
      }

      // Spawn Hazards depending on difficulty/mode
      const hazardChance = this.gameMode === 'hardcore' ? 0.75 : 0.45;
      if (Math.random() < hazardChance) {
        const hazardX = this.spawnDistanceX + gap * 0.5;
        const hazardY = nextY + (Math.random() > 0.5 ? 90 : -90);
        const hazardType = (Math.random() > 0.6 || this.gameMode === 'hardcore') ? 'laser_rot' : 'mine';
        this.createHazard(hazardX, hazardY, hazardType);
      }

      this.spawnDistanceX = nextX;
    }

    // Cleanup entities far behind player to keep memory footprint feather-light
    const cleanupThreshold = this.player.x - this.width;
    this.anchors = this.anchors.filter(a => a.x > cleanupThreshold);
    this.hazards = this.hazards.filter(h => h.x > cleanupThreshold);
    this.gems = this.gems.filter(g => g.x > cleanupThreshold);
  }

  // =========================================================================
  // Physics & Entity Updates
  // =========================================================================
  update(dt) {
    // Time Dilation / Slow Mo on Near Miss
    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= dt;
      this.timeScale = 0.35;
    } else {
      this.timeScale = 1.0;
    }

    const simDt = dt * this.timeScale;

    // Mode-specific timers
    if (this.gameMode === 'chrono') {
      this.chronoTimer -= dt;
      if (this.chronoTimer <= 0) {
        this.chronoTimer = 0;
        this.triggerGameOver('TIME IS UP! ⌛ Out of chronological fuel.');
        return;
      }
    }

    // Fever timer
    if (this.isFeverActive) {
      this.feverTimer -= dt;
      this.feverEnergy = (this.feverTimer / 6.0) * 100;
      if (this.feverTimer <= 0) {
        this.isFeverActive = false;
        this.feverEnergy = 0;
        window.audioManager.setFever(false);
      }
    }

    // Combo Timer Decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
      }
    }

    // Player Movement
    if (this.player.tetheredTo) {
      // Orbiting Anchor
      this.player.tetherDuration += simDt;
      this.player.tetherAngle += this.player.tetherAngularVel * simDt;

      this.player.x = this.player.tetheredTo.x + Math.cos(this.player.tetherAngle) * this.player.tetherRadius;
      this.player.y = this.player.tetheredTo.y + Math.sin(this.player.tetherAngle) * this.player.tetherRadius;

      // Particle sparks during orbit
      if (Math.random() < 0.3) {
        this.createSparks(this.player.x, this.player.y, 1, '#00f3ff');
      }

      // Overheat warning if holding too long (prevents endless passive orbiting)
      if (this.player.tetherDuration > 3.5) {
        this.releaseAction();
        this.addFloatingText(this.player.x, this.player.y - 30, 'TETHER OVERHEAT! ⚡', '#ff3366');
      }
    } else {
      // Free Flight
      this.player.x += this.player.vx * simDt;
      this.player.y += this.player.vy * simDt;

      // Gentle forward stabilization so you don't drift purely vertical
      if (this.player.vx < this.player.baseSpeed * 0.7) {
        this.player.vx += 180 * simDt;
      }

      // Natural drag on vertical speed
      this.player.vy *= Math.pow(0.985, simDt * 60);

      // Auto-latch if player is still holding input and encounters another anchor
      if (this.isHoldingInput) {
        this.pressAction();
      }
    }

    // World bounds safety: soft gravity reflection if flying wildly off-screen
    const verticalPadding = 80;
    if (this.player.y < verticalPadding) {
      this.player.y = verticalPadding;
      this.player.vy = Math.abs(this.player.vy) * 0.6;
    } else if (this.player.y > this.height - verticalPadding) {
      this.player.y = this.height - verticalPadding;
      this.player.vy = -Math.abs(this.player.vy) * 0.6;
    }

    // Update Player Trail
    this.player.trail.unshift({ x: this.player.x, y: this.player.y });
    if (this.player.trail.length > 24) {
      this.player.trail.pop();
    }

    // Camera follow (smooth lerp)
    const targetCamX = this.player.x - this.width * 0.32;
    const targetCamY = this.player.y - this.height * 0.5;
    this.camera.x += (targetCamX - this.camera.x) * 6 * dt;
    this.camera.y += (targetCamY - this.camera.y) * 4 * dt;

    // Screen Shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - 24 * dt);
    }

    // Score accumulation by distance traveled
    this.score += Math.floor((this.player.vx * simDt * 0.1) * this.combo * (this.isFeverActive ? 3 : 1));

    // Update Procedural Generation
    this.updateProceduralWorld();

    // Collision Detection: Gems
    for (const gem of this.gems) {
      if (gem.collected) continue;

      // Magnet pull in Fever Mode
      if (this.isFeverActive) {
        const dx = this.player.x - gem.x;
        const dy = this.player.y - gem.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 280) {
          gem.x += (dx / dist) * 600 * simDt;
          gem.y += (dy / dist) * 600 * simDt;
        }
      }

      const distToPlayer = Math.hypot(gem.x - this.player.x, gem.y - this.player.y);
      if (distToPlayer < gem.radius + this.player.radius) {
        gem.collected = true;
        this.crystals++;
        this.runCrystals++;
        this.score += 350 * this.combo;
        this.addFever(8);

        if (this.gameMode === 'chrono') {
          this.chronoTimer = Math.min(60.0, this.chronoTimer + 1.5);
          this.addFloatingText(gem.x, gem.y - 15, '+1.5s', '#00ff88');
        }

        window.audioManager.playGem(this.combo);
        this.createSparks(gem.x, gem.y, 8, '#00ff88');
      }
    }

    // Collision Detection: Hazards
    for (const hazard of this.hazards) {
      hazard.angle += hazard.rotSpeed * simDt;

      let isHit = false;
      let isNearMiss = false;

      if (hazard.type === 'mine') {
        const dist = Math.hypot(hazard.x - this.player.x, hazard.y - this.player.y);
        if (dist < hazard.radius + this.player.radius) {
          isHit = true;
        } else if (dist < hazard.radius + this.player.radius + 30) {
          isNearMiss = true;
        }
      } else if (hazard.type === 'laser_rot') {
        // Line segment collision with rotating laser bar
        const x1 = hazard.x + Math.cos(hazard.angle) * hazard.laserLength;
        const y1 = hazard.y + Math.sin(hazard.angle) * hazard.laserLength;
        const x2 = hazard.x - Math.cos(hazard.angle) * hazard.laserLength;
        const y2 = hazard.y - Math.sin(hazard.angle) * hazard.laserLength;

        const distToLaser = this.distToSegment(this.player, { x: x1, y: y1 }, { x: x2, y: y2 });
        if (distToLaser < this.player.radius + 4) {
          isHit = true;
        } else if (distToLaser < this.player.radius + 28) {
          isNearMiss = true;
        }
      }

      // Handle Near Miss (Slow-mo Matrix juice)
      if (isNearMiss && !isHit && !hazard.nearMissTriggered) {
        hazard.nearMissTriggered = true;
        this.slowMoTimer = 0.25;
        this.score += 500 * this.combo;
        this.addFever(10);
        window.audioManager.playNearMiss();
        this.addFloatingText(this.player.x, this.player.y - 30, 'NEAR MISS! +500', '#ff007f');
      }

      // Handle Collision
      if (isHit) {
        if (this.isFeverActive) {
          // In Fever Mode, player annihilates the hazard!
          hazard.dead = true;
          this.score += 1000;
          this.screenShake = 10;
          this.createSparks(hazard.x, hazard.y, 25, '#ffb800');
          this.createShockwave(hazard.x, hazard.y, '#ff007f');
          this.addFloatingText(hazard.x, hazard.y - 20, 'SHATTERED! +1000', '#ffb800');
        } else {
          // Fatal Crash
          this.triggerGameOver('Shattered by anti-matter laser barrier! 💥');
          return;
        }
      }
    }

    this.hazards = this.hazards.filter(h => !h.dead);

    // Update Particles & Floating Texts
    this.updateVFX(dt);
  }

  distToSegment(p, v, w) {
    const l2 = Math.hypot(v.x - w.x, v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }

  // =========================================================================
  // Visual Effects (Particles, Shockwaves, Floating Text)
  // =========================================================================
  createSparks(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 260 + 80;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1.5,
        color,
        life: 1.0,
        decay: Math.random() * 2.0 + 1.5
      });
    }
  }

  createShockwave(x, y, color) {
    this.particles.push({
      type: 'shockwave',
      x,
      y,
      radius: 10,
      maxRadius: 110,
      color,
      life: 1.0,
      decay: 2.2
    });
  }

  addFloatingText(x, y, text, color, scale = 1.0) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      scale,
      life: 1.0,
      vy: -60
    });
  }

  updateVFX(dt) {
    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decay * dt;

      if (p.type === 'spark') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94;
        p.vy *= 0.94;
      } else if (p.type === 'shockwave') {
        p.radius += (p.maxRadius - p.radius) * 8 * dt;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Floating text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= 1.4 * dt;
      ft.y += ft.vy * dt;

      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // =========================================================================
  // Rendering
  // =========================================================================
  render() {
    this.ctx.save();

    // Clear Screen
    this.ctx.fillStyle = '#070913';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Camera & Screen Shake Offset
    const shakeX = (Math.random() - 0.5) * this.screenShake;
    const shakeY = (Math.random() - 0.5) * this.screenShake;

    this.ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);

    // 1. Parallax Starfield & Deep Nebula
    this.renderStarfield();

    // 2. Anchors & Gravity Wells
    this.renderAnchors();

    // 3. Collectible Gems
    this.renderGems();

    // 4. Hazards & Rotating Lasers
    this.renderHazards();

    // 5. Tether Line (if attached)
    this.renderTether();

    // 6. Player & Trail
    this.renderPlayer();

    // 7. Visual Particles & Shockwaves
    this.renderParticles();

    // 8. Floating Combat Text
    this.renderFloatingTexts();

    this.ctx.restore();
  }

  renderStarfield() {
    this.ctx.save();
    for (const star of this.stars) {
      // Parallax wrapping
      const parallaxFactor = star.speed;
      const sx = ((star.x - this.camera.x * parallaxFactor) % this.width + this.width) % this.width + this.camera.x;
      const sy = ((star.y - this.camera.y * parallaxFactor) % this.height + this.height) % this.height + this.camera.y;

      this.ctx.beginPath();
      this.ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      this.ctx.fillStyle = star.color;
      this.ctx.globalAlpha = star.alpha;
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  renderAnchors() {
    for (const anchor of this.anchors) {
      // Outer gravity ring
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(anchor.x, anchor.y, anchor.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = anchor.glowColor;
      this.ctx.globalAlpha = 0.25;
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([8, 8]);
      this.ctx.stroke();

      // Glowing anchor center core
      this.ctx.beginPath();
      this.ctx.arc(anchor.x, anchor.y, 16, 0, Math.PI * 2);
      this.ctx.fillStyle = anchor.glowColor;
      this.ctx.globalAlpha = 0.85;
      this.ctx.shadowColor = anchor.glowColor;
      this.ctx.shadowBlur = 20;
      this.ctx.fill();

      // Inner white spark
      this.ctx.beginPath();
      this.ctx.arc(anchor.x, anchor.y, 6, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.globalAlpha = 1;
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  renderTether() {
    if (!this.player.tetheredTo) return;
    const anchor = this.player.tetheredTo;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(this.player.x, this.player.y);
    this.ctx.lineTo(anchor.x, anchor.y);
    this.ctx.strokeStyle = this.isFeverActive ? '#ffb800' : '#00f3ff';
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = this.ctx.strokeStyle;
    this.ctx.shadowBlur = 15;
    this.ctx.stroke();

    // Mid-tether energy pulses
    const pulseCount = 3;
    for (let i = 1; i <= pulseCount; i++) {
      const t = (i / (pulseCount + 1) + (performance.now() * 0.003)) % 1;
      const px = this.player.x + (anchor.x - this.player.x) * t;
      const py = this.player.y + (anchor.y - this.player.y) * t;

      this.ctx.beginPath();
      this.ctx.arc(px, py, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  renderPlayer() {
    const p = this.player;

    // Trail
    this.ctx.save();
    for (let i = 0; i < p.trail.length - 1; i++) {
      const pt = p.trail[i];
      const next = p.trail[i + 1];
      const alpha = (1 - i / p.trail.length) * 0.7;

      this.ctx.beginPath();
      this.ctx.moveTo(pt.x, pt.y);
      this.ctx.lineTo(next.x, next.y);
      this.ctx.strokeStyle = this.isFeverActive ? '#ffb800' : (p.trailSkin === 'trail_pink' ? '#ff007f' : '#00f3ff');
      this.ctx.lineWidth = (p.radius * 2) * (1 - i / p.trail.length);
      this.ctx.globalAlpha = alpha;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
    }
    this.ctx.restore();

    // Core Orb
    this.ctx.save();
    this.ctx.shadowColor = this.isFeverActive ? '#ffb800' : '#00f3ff';
    this.ctx.shadowBlur = 25;

    // Outer shield / core ring
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = this.isFeverActive ? '#ffb800' : (p.skin === 'core_pink' ? '#ff007f' : '#00f3ff');
    this.ctx.fill();

    // Inner bright spark
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();

    // Fever Aural Glow
    if (this.isFeverActive) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius + 8, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  renderGems() {
    for (const gem of this.gems) {
      if (gem.collected) continue;

      this.ctx.save();
      this.ctx.translate(gem.x, gem.y);
      this.ctx.rotate(performance.now() * 0.002);

      this.ctx.beginPath();
      this.ctx.moveTo(0, -gem.radius);
      this.ctx.lineTo(gem.radius, 0);
      this.ctx.lineTo(0, gem.radius);
      this.ctx.lineTo(-gem.radius, 0);
      this.ctx.closePath();

      this.ctx.fillStyle = '#00ff88';
      this.ctx.shadowColor = '#00ff88';
      this.ctx.shadowBlur = 12;
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  renderHazards() {
    for (const hazard of this.hazards) {
      this.ctx.save();

      if (hazard.type === 'mine') {
        // Red spike mine
        this.ctx.translate(hazard.x, hazard.y);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, hazard.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ff3366';
        this.ctx.shadowColor = '#ff3366';
        this.ctx.shadowBlur = 18;
        this.ctx.fill();

        // Pulsing hazard ring
        this.ctx.beginPath();
        this.ctx.arc(0, 0, hazard.radius + 6 + Math.sin(performance.now() * 0.008) * 3, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#ff3366';
        this.ctx.lineWidth = 1.5;
        this.ctx.globalAlpha = 0.5;
        this.ctx.stroke();
      } else if (hazard.type === 'laser_rot') {
        // Dual laser emitter
        this.ctx.translate(hazard.x, hazard.y);

        // Center hub
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ff3366';
        this.ctx.fill();

        // Rotating beam
        const cos = Math.cos(hazard.angle);
        const sin = Math.sin(hazard.angle);

        this.ctx.beginPath();
        this.ctx.moveTo(-cos * hazard.laserLength, -sin * hazard.laserLength);
        this.ctx.lineTo(cos * hazard.laserLength, sin * hazard.laserLength);
        this.ctx.strokeStyle = '#ff3366';
        this.ctx.lineWidth = 4;
        this.ctx.shadowColor = '#ff0055';
        this.ctx.shadowBlur = 15;
        this.ctx.stroke();
      }

      this.ctx.restore();
    }
  }

  renderParticles() {
    this.ctx.save();
    for (const p of this.particles) {
      this.ctx.globalAlpha = Math.max(0, p.life);

      if (p.type === 'spark') {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
      } else if (p.type === 'shockwave') {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
      }
    }
    this.ctx.restore();
  }

  renderFloatingTexts() {
    this.ctx.save();
    this.ctx.font = '700 16px "Orbitron", sans-serif';
    this.ctx.textAlign = 'center';

    for (const ft of this.floatingTexts) {
      this.ctx.globalAlpha = Math.max(0, ft.life);
      this.ctx.fillStyle = ft.color;
      this.ctx.shadowColor = ft.color;
      this.ctx.shadowBlur = 8;
      this.ctx.fillText(ft.text, ft.x, ft.y);
    }
    this.ctx.restore();
  }

  // =========================================================================
  // Game Over & Trigger
  // =========================================================================
  triggerGameOver(reason = 'Crashed into the void') {
    this.state = 'GAMEOVER';
    window.audioManager.stopMusic();
    window.audioManager.playCrash();

    // High Score evaluation
    const isNewHigh = this.score > this.highScore;
    if (isNewHigh) {
      this.highScore = this.score;
      localStorage.setItem('neonsling_highscore', this.highScore);
    }

    // Accumulate total crystals
    const savedTotalCrystals = parseInt(localStorage.getItem('neonsling_total_crystals') || '0', 10);
    localStorage.setItem('neonsling_total_crystals', savedTotalCrystals + this.runCrystals);

    // Save Run to Local Leaderboard
    window.uiManager.recordLeaderboardEntry(this.score);

    // Show Game Over UI
    window.uiManager.showGameOver({
      score: this.score,
      highScore: this.highScore,
      isNewHigh,
      maxCombo: this.maxCombo,
      gems: this.runCrystals,
      orbits: this.orbitsSlung,
      reason
    });
  }

  // =========================================================================
  // Main Animation Frame Loop
  // =========================================================================
  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (this.state === 'PLAYING') {
      this.update(dt);
      window.uiManager.updateHUD({
        score: this.score,
        feverPercent: this.feverEnergy,
        gems: this.runCrystals,
        combo: this.combo,
        chronoTimer: this.chronoTimer
      });
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }
}

// Global engine instance
window.game = new GameEngine();
window.game.start();

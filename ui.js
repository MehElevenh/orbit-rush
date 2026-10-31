/**
 * ============================================================================
 * NEON SLING: UI, Viral Features, Shop, Leaderboard & Social Sharing
 * ============================================================================
 * Handles DOM HUD updates, viral score card canvas export, funny roast
 * generator, achievements system, and persistent player progression.
 */

class UIManager {
  constructor() {
    // Cache UI Elements
    this.hud = document.getElementById('hud');
    this.hudScore = document.getElementById('hud-score');
    this.feverBar = document.getElementById('fever-bar');
    this.feverPercent = document.getElementById('fever-percent');
    this.hudGems = document.getElementById('hud-gems');
    this.comboDisplay = document.getElementById('combo-display');
    this.comboCount = document.getElementById('combo-count');
    this.timerPill = document.getElementById('timer-pill');
    this.timerVal = document.getElementById('timer-val');

    // Screens & Modals
    this.screenStart = document.getElementById('screen-start');
    this.screenGameOver = document.getElementById('screen-gameover');
    this.screenPause = document.getElementById('screen-pause');
    this.toastContainer = document.getElementById('toast-container');

    // Modals
    this.modalHow = document.getElementById('modal-how');
    this.modalShop = document.getElementById('modal-shop');
    this.modalLeaderboard = document.getElementById('modal-leaderboard');
    this.modalShareCard = document.getElementById('modal-share-card');

    // Start Screen Elements
    this.menuHighScore = document.getElementById('menu-high-score');
    this.menuTotalGems = document.getElementById('menu-total-gems');
    this.playerNameInput = document.getElementById('player-name-input');

    // Game Over Elements
    this.roastBadge = document.getElementById('roast-badge');
    this.finalScore = document.getElementById('final-score');
    this.newHighBadge = document.getElementById('new-high-badge');
    this.finalBest = document.getElementById('final-best');
    this.finalCombo = document.getElementById('final-combo');
    this.finalGems = document.getElementById('final-gems');
    this.finalSlings = document.getElementById('final-slings');

    // Audio Buttons
    this.btnToggleMusic = document.getElementById('btn-toggle-music');
    this.btnToggleSfx = document.getElementById('btn-toggle-sfx');
    this.musicStatus = document.getElementById('music-status');
    this.sfxStatus = document.getElementById('sfx-status');

    // Viral Roasts Library (Over 20+ viral punchlines)
    this.roasts = [
      "💀 Newton just unfollowed you on Twitter.",
      "🍎 Bro tried to negotiate with gravity and lost.",
      "🤡 That laser wasn't even moving and you found it.",
      "🚀 Physics.exe has stopped working.",
      "📉 Reflexes running on 2G dialup internet.",
      "💫 Slung with confidence directly into oblivion.",
      "🦥 Sloths navigate space faster than that.",
      "✨ That wasn't a crash, that was aggressive parking.",
      "🔥 Emotional damage: 100%. High score: 0%.",
      "🎮 Skill issue detected in sector 7.",
      "🏆 Certified Orbit Disaster.",
      "🌌 Even the void is judging that angle.",
      "⚡ Flinging hard or hardly flinging?",
      "💥 The mine was just minding its own business!"
    ];

    // Achievements Library
    this.achievements = [
      { id: 'first_blood', title: 'First Orbit', desc: 'Successfully sling through your first anchor', unlocked: false },
      { id: 'combo_5', title: 'Combo Master', desc: 'Achieve a 5x Sling Combo', unlocked: false },
      { id: 'combo_10', title: 'Cosmic Beast', desc: 'Reach a staggering 10x Combo', unlocked: false },
      { id: 'fever_time', title: 'Hypersonic Fever', desc: 'Trigger Fever Surge mode', unlocked: false },
      { id: 'rich_pilot', title: 'Crystal Hoarder', desc: 'Collect 50 total crystals', unlocked: false },
      { id: 'score_10k', title: 'Orbit Legend', desc: 'Score over 10,000 points in a single run', unlocked: false }
    ];

    // Shop Catalog
    this.shopItems = {
      cores: [
        { id: 'core_cyan', name: 'Cyber Neon', icon: '💎', price: 0, unlocked: true },
        { id: 'core_pink', name: 'Synth Sunset', icon: '🌸', price: 30, unlocked: false },
        { id: 'core_gold', name: 'Solar Flare', icon: '⚡', price: 80, unlocked: false },
        { id: 'core_toxic', name: 'Matrix Emerald', icon: '🧪', price: 150, unlocked: false }
      ],
      trails: [
        { id: 'trail_cyan', name: 'Hyper Blue', icon: '🔹', price: 0, unlocked: true },
        { id: 'trail_pink', name: 'Laser Magenta', icon: '🔻', price: 40, unlocked: false },
        { id: 'trail_rainbow', name: 'Prismatic', icon: '🌈', price: 120, unlocked: false }
      ]
    };

    this.currentMode = 'arcade';
    this.loadPlayerData();
    this.bindEvents();
    this.updateAudioButtonLabels();
  }

  // =========================================================================
  // Player Data & Local Storage
  // =========================================================================
  loadPlayerData() {
    const savedHighScore = localStorage.getItem('neonsling_highscore') || '0';
    const savedTotalGems = localStorage.getItem('neonsling_total_crystals') || '0';
    const savedPlayerName = localStorage.getItem('neonsling_pilot_name') || 'PILOT_01';

    this.menuHighScore.textContent = parseInt(savedHighScore, 10).toLocaleString();
    this.menuTotalGems.textContent = `💎 ${parseInt(savedTotalGems, 10).toLocaleString()}`;
    if (this.playerNameInput) {
      this.playerNameInput.value = savedPlayerName;
    }

    // Load unlocked shop items
    const savedShop = localStorage.getItem('neonsling_shop_unlocked');
    if (savedShop) {
      try {
        const parsed = JSON.parse(savedShop);
        parsed.forEach(id => {
          [...this.shopItems.cores, ...this.shopItems.trails].forEach(item => {
            if (item.id === id) item.unlocked = true;
          });
        });
      } catch (e) { }
    }

    // Load unlocked achievements
    const savedAch = localStorage.getItem('neonsling_achievements');
    if (savedAch) {
      try {
        const parsed = JSON.parse(savedAch);
        this.achievements.forEach(a => {
          if (parsed.includes(a.id)) a.unlocked = true;
        });
      } catch (e) { }
    }
  }

  savePlayerData() {
    const unlockedIds = [...this.shopItems.cores, ...this.shopItems.trails]
      .filter(item => item.unlocked)
      .map(item => item.id);
    localStorage.setItem('neonsling_shop_unlocked', JSON.stringify(unlockedIds));

    const unlockedAch = this.achievements.filter(a => a.unlocked).map(a => a.id);
    localStorage.setItem('neonsling_achievements', JSON.stringify(unlockedAch));
  }

  triggerAchievement(id) {
    const ach = this.achievements.find(a => a.id === id);
    if (ach && !ach.unlocked) {
      ach.unlocked = true;
      this.savePlayerData();
      window.audioManager.playFanfare();
      this.showToast('🏆 ACHIEVEMENT UNLOCKED!', `${ach.title}: ${ach.desc}`);
    }
  }

  showToast(title, desc) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <div class="toast-icon">⚡</div>
      <div class="toast-body">
        <span class="toast-title">${title}</span>
        <span class="toast-desc">${desc}</span>
      </div>
    `;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 3200);
  }

  // =========================================================================
  // Event Binding
  // =========================================================================
  bindEvents() {
    // Mode tabs
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        window.audioManager.playClick();
        document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentMode = tab.dataset.mode;
      });
    });

    // Start Run Button
    document.getElementById('btn-play').addEventListener('click', () => {
      window.audioManager.playClick();
      this.screenStart.classList.remove('active');
      this.screenStart.classList.add('hidden');
      this.hud.classList.remove('hidden');

      if (this.currentMode === 'chrono') {
        this.timerPill.classList.remove('hidden');
      } else {
        this.timerPill.classList.add('hidden');
      }

      window.game.startRun(this.currentMode);
    });

    // Pause & Resume
    document.getElementById('btn-pause').addEventListener('click', () => {
      this.pauseGame();
    });
    document.getElementById('btn-resume').addEventListener('click', () => {
      this.resumeGame();
    });
    document.getElementById('btn-pause-restart').addEventListener('click', () => {
      this.resumeGame();
      window.game.startRun(this.currentMode);
    });
    document.getElementById('btn-pause-quit').addEventListener('click', () => {
      this.quitToMenu();
    });

    // Game Over Action Buttons
    document.getElementById('btn-restart').addEventListener('click', () => {
      window.audioManager.playClick();
      this.screenGameOver.classList.remove('active');
      this.screenGameOver.classList.add('hidden');
      window.game.startRun(this.currentMode);
    });

    document.getElementById('btn-back-menu').addEventListener('click', () => {
      window.audioManager.playClick();
      this.quitToMenu();
    });

    // Audio Toggles
    this.btnToggleMusic.addEventListener('click', () => {
      const enabled = window.audioManager.toggleMusic();
      this.musicStatus.textContent = enabled ? 'ON' : 'OFF';
      window.audioManager.playClick();
    });

    this.btnToggleSfx.addEventListener('click', () => {
      const enabled = window.audioManager.toggleSfx();
      this.sfxStatus.textContent = enabled ? 'ON' : 'OFF';
      window.audioManager.playClick();
    });

    // Modals Open/Close
    document.getElementById('btn-open-how').addEventListener('click', () => {
      window.audioManager.playClick();
      this.modalHow.classList.remove('hidden');
    });

    document.getElementById('btn-open-shop').addEventListener('click', () => {
      window.audioManager.playClick();
      this.renderShop();
      this.modalShop.classList.remove('hidden');
    });

    document.getElementById('btn-open-leaderboard').addEventListener('click', () => {
      window.audioManager.playClick();
      this.renderLeaderboard();
      this.modalLeaderboard.classList.remove('hidden');
    });

    // Generic modal close buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.audioManager.playClick();
        const targetId = btn.dataset.close;
        const target = document.getElementById(targetId);
        if (target) target.classList.add('hidden');
      });
    });

    // Viral Sharing Buttons
    document.getElementById('btn-copy-score').addEventListener('click', () => {
      this.copyScoreToClipboard();
    });

    document.getElementById('btn-share-card').addEventListener('click', () => {
      window.audioManager.playClick();
      this.generateViralShareCard();
      this.modalShareCard.classList.remove('hidden');
    });

    document.getElementById('btn-download-image').addEventListener('click', () => {
      this.downloadShareCardImage();
    });

    document.getElementById('btn-native-share').addEventListener('click', () => {
      this.triggerNativeWebShare();
    });

    // Player name input
    if (this.playerNameInput) {
      this.playerNameInput.addEventListener('change', (e) => {
        const val = e.target.value.trim().toUpperCase() || 'PILOT_01';
        localStorage.setItem('neonsling_pilot_name', val);
      });
    }
  }

  updateAudioButtonLabels() {
    this.musicStatus.textContent = window.audioManager.isMusicEnabled ? 'ON' : 'OFF';
    this.sfxStatus.textContent = window.audioManager.isSfxEnabled ? 'ON' : 'OFF';
  }

  // =========================================================================
  // Game State Transitions
  // =========================================================================
  pauseGame() {
    if (window.game.state !== 'PLAYING') return;
    window.game.state = 'PAUSED';
    window.audioManager.playClick();
    this.screenPause.classList.remove('hidden');
  }

  resumeGame() {
    if (window.game.state !== 'PAUSED') return;
    window.game.state = 'PLAYING';
    window.audioManager.playClick();
    this.screenPause.classList.add('hidden');
    window.game.lastTime = performance.now();
  }

  quitToMenu() {
    window.game.state = 'MENU';
    window.audioManager.stopMusic();
    this.screenPause.classList.add('hidden');
    this.screenGameOver.classList.remove('active');
    this.screenGameOver.classList.add('hidden');
    this.hud.classList.add('hidden');
    this.screenStart.classList.remove('hidden');
    this.screenStart.classList.add('active');
    this.loadPlayerData();
  }

  // =========================================================================
  // HUD Update Loop
  // =========================================================================
  updateHUD({ score, feverPercent, gems, combo, chronoTimer }) {
    this.hudScore.textContent = score.toLocaleString();
    this.feverBar.style.width = `${feverPercent}%`;
    this.feverPercent.textContent = `${Math.floor(feverPercent)}%`;
    this.hudGems.textContent = gems.toString();

    // Check dynamic achievements during run
    if (combo >= 5) this.triggerAchievement('combo_5');
    if (combo >= 10) this.triggerAchievement('combo_10');
    if (score >= 10000) this.triggerAchievement('score_10k');
    if (feverPercent >= 99) this.triggerAchievement('fever_time');

    // Combo indicator
    if (combo > 1) {
      this.comboDisplay.classList.remove('hidden');
      this.comboCount.textContent = `x${combo}`;
    } else {
      this.comboDisplay.classList.add('hidden');
    }

    if (this.currentMode === 'chrono') {
      this.timerVal.textContent = `${chronoTimer.toFixed(1)}s`;
    }
  }

  // =========================================================================
  // Game Over UI & Roast Generation
  // =========================================================================
  showGameOver({ score, highScore, isNewHigh, maxCombo, gems, orbits, reason }) {
    this.screenGameOver.classList.remove('hidden');
    this.screenGameOver.classList.add('active');

    // Pick a funny random roast
    const randomRoast = this.roasts[Math.floor(Math.random() * this.roasts.length)];
    this.roastBadge.textContent = randomRoast;

    this.finalScore.textContent = score.toLocaleString();
    this.finalBest.textContent = highScore.toLocaleString();
    this.finalCombo.textContent = `${maxCombo}x`;
    this.finalGems.textContent = `💎 +${gems}`;
    this.finalSlings.textContent = orbits.toString();

    if (isNewHigh && score > 0) {
      this.newHighBadge.classList.remove('hidden');
    } else {
      this.newHighBadge.classList.add('hidden');
    }

    // Check cumulative achievements
    const totalCrystals = parseInt(localStorage.getItem('neonsling_total_crystals') || '0', 10);
    if (totalCrystals >= 50) this.triggerAchievement('rich_pilot');
    if (orbits >= 1) this.triggerAchievement('first_blood');
  }

  // =========================================================================
  // Shop & Customization
  // =========================================================================
  renderShop() {
    const totalGems = parseInt(localStorage.getItem('neonsling_total_crystals') || '0', 10);
    document.getElementById('shop-gems').textContent = totalGems.toLocaleString();

    const container = document.getElementById('shop-items-container');
    container.innerHTML = '';

    const currentCore = localStorage.getItem('neonsling_core') || 'core_cyan';

    this.shopItems.cores.forEach(item => {
      const card = document.createElement('div');
      const isEquipped = currentCore === item.id;
      card.className = `shop-card ${item.unlocked ? 'unlocked' : ''} ${isEquipped ? 'equipped' : ''}`;

      card.innerHTML = `
        <div class="shop-card-preview">${item.icon}</div>
        <span class="shop-card-name">${item.name}</span>
        <button class="shop-card-action ${isEquipped ? 'btn-ghost' : (item.unlocked ? 'btn-secondary' : 'btn-primary')}">
          ${isEquipped ? 'EQUIPPED' : (item.unlocked ? 'EQUIP' : `💎 ${item.price}`)}
        </button>
      `;

      const btn = card.querySelector('.shop-card-action');
      btn.addEventListener('click', () => {
        window.audioManager.playClick();
        if (item.unlocked) {
          localStorage.setItem('neonsling_core', item.id);
          this.renderShop();
        } else {
          // Attempt buy
          if (totalGems >= item.price) {
            localStorage.setItem('neonsling_total_crystals', totalGems - item.price);
            item.unlocked = true;
            localStorage.setItem('neonsling_core', item.id);
            this.savePlayerData();
            this.renderShop();
            this.showToast('🎨 UNLOCKED!', `Equipped ${item.name}!`);
          } else {
            this.showToast('⚠️ NOT ENOUGH GEMS', `Need ${item.price - totalGems} more crystals!`);
          }
        }
      });

      container.appendChild(card);
    });
  }

  // =========================================================================
  // Local Leaderboard
  // =========================================================================
  recordLeaderboardEntry(score) {
    if (score <= 0) return;
    const pilotName = localStorage.getItem('neonsling_pilot_name') || 'PILOT_01';
    let board = [];
    try {
      board = JSON.parse(localStorage.getItem('neonsling_leaderboard') || '[]');
    } catch (e) {
      board = [];
    }

    board.push({ name: pilotName, score, date: new Date().toLocaleDateString() });
    board.sort((a, b) => b.score - a.score);
    board = board.slice(0, 8); // Top 8 entries

    localStorage.setItem('neonsling_leaderboard', JSON.stringify(board));

    // Increment flight counter
    const flights = parseInt(localStorage.getItem('neonsling_total_flights') || '0', 10) + 1;
    localStorage.setItem('neonsling_total_flights', flights);
  }

  renderLeaderboard() {
    let board = [];
    try {
      board = JSON.parse(localStorage.getItem('neonsling_leaderboard') || '[]');
    } catch (e) {
      board = [];
    }

    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';

    if (board.length === 0) {
      list.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted);">No recorded flights yet. Start slinging!</div>`;
    } else {
      board.forEach((entry, idx) => {
        const row = document.createElement('div');
        row.className = `leaderboard-row ${idx === 0 ? 'rank-1' : ''}`;
        row.innerHTML = `
          <div class="leaderboard-left">
            <span class="rank-num">#${idx + 1}</span>
            <span class="pilot-name">${entry.name}</span>
          </div>
          <span class="record-score">${entry.score.toLocaleString()} PTS</span>
        `;
        list.appendChild(row);
      });
    }

    const flights = localStorage.getItem('neonsling_total_flights') || '0';
    const crystals = localStorage.getItem('neonsling_total_crystals') || '0';
    document.getElementById('stat-total-runs').textContent = flights;
    document.getElementById('stat-total-crystals').textContent = parseInt(crystals, 10).toLocaleString();
  }

  // =========================================================================
  // Viral Share Card & Social Bragging
  // =========================================================================
  generateViralShareCard() {
    const canvas = document.getElementById('shareCardCanvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Dark Cyberpunk Gradient Background
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#070913');
    grad.addColorStop(0.5, '#0e122b');
    grad.addColorStop(1, '#05070f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Glowing Cyber Grid Lines
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Outer Neon Border
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Game Title Header
    ctx.font = '900 24px "Orbitron", sans-serif';
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 15;
    ctx.fillText('NEON SLING: ORBIT DRIFT', 30, 48);

    // Pilot Tag
    const pilot = localStorage.getItem('neonsling_pilot_name') || 'PILOT_01';
    ctx.font = '700 13px "Outfit", sans-serif';
    ctx.fillStyle = '#ff007f';
    ctx.shadowBlur = 0;
    ctx.fillText(`PILOT CALL-SIGN: ${pilot}`, 30, 74);

    // Large Score
    ctx.font = '900 64px "Orbitron", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 20;
    ctx.fillText(window.game.score.toLocaleString(), 30, 155);

    // Score Label
    ctx.font = '600 12px "Orbitron", sans-serif';
    ctx.fillStyle = '#8b9bb4';
    ctx.shadowBlur = 0;
    ctx.fillText('OFFICIAL ARCADE RUN SCORE', 30, 180);

    // Stat Badges Row
    const statsY = 225;
    this.drawShareStatBadge(ctx, 30, statsY, 'MAX COMBO', `${window.game.maxCombo}x`, '#ff007f');
    this.drawShareStatBadge(ctx, 160, statsY, 'ORBITS SLUNG', `${window.game.orbitsSlung}`, '#ffb800');
    this.drawShareStatBadge(ctx, 290, statsY, 'CRYSTALS', `💎 ${window.game.runCrystals}`, '#00ff88');

    // Roast / Brag quote
    ctx.font = 'italic 600 15px "Outfit", sans-serif';
    ctx.fillStyle = '#ff8ca3';
    ctx.fillText(this.roastBadge.textContent, 30, 295);

    // Watermark / Viral Call to action
    ctx.font = '700 12px "Orbitron", sans-serif';
    ctx.fillStyle = '#00f3ff';
    ctx.textAlign = 'right';
    ctx.fillText('PLAY: NEON SLING ⚡ CAN YOU BEAT ME?', w - 30, 310);
    ctx.textAlign = 'left';
  }

  drawShareStatBadge(ctx, x, y, label, val, color) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, 115, 48, 8) : ctx.rect(x, y, 115, 48);
    ctx.fill();
    ctx.stroke();

    ctx.font = '700 10px "Orbitron", sans-serif';
    ctx.fillStyle = '#8b9bb4';
    ctx.fillText(label, x + 10, y + 18);

    ctx.font = '800 16px "Orbitron", sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(val, x + 10, y + 38);
  }

  downloadShareCardImage() {
    const canvas = document.getElementById('shareCardCanvas');
    const link = document.createElement('a');
    link.download = `neon_sling_score_${window.game.score}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    this.showToast('💾 DOWNLOADED!', 'Share card saved to your device.');
  }

  copyScoreToClipboard() {
    const score = window.game.score.toLocaleString();
    const combo = window.game.maxCombo;
    const roast = this.roastBadge.textContent;
    const bragText = `🚀 I just scored ${score} PTS in NEON SLING (Max Combo: ${combo}x)!\n${roast}\nCan you beat my orbit gravity skills? 🔥 Play now!`;

    navigator.clipboard.writeText(bragText).then(() => {
      this.showToast('📋 COPIED TO CLIPBOARD!', 'Paste and challenge your friends on TikTok, Twitter, or Discord!');
    }).catch(() => {
      this.showToast('⚠️ COPY FAILED', 'Please allow clipboard permissions.');
    });
  }

  triggerNativeWebShare() {
    const score = window.game.score.toLocaleString();
    const canvas = document.getElementById('shareCardCanvas');

    if (navigator.share) {
      canvas.toBlob(blob => {
        const file = new File([blob], 'neon_sling_score.png', { type: 'image/png' });
        const shareData = {
          title: 'NEON SLING: Orbit Drift',
          text: `🚀 I scored ${score} in NEON SLING! Can you beat my record?`,
          url: window.location.href
        };

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          shareData.files = [file];
        }

        navigator.share(shareData).catch(() => {});
      });
    } else {
      this.copyScoreToClipboard();
    }
  }
}

// Global UI manager instance
window.uiManager = new UIManager();

/**
 * ============================================================================
 * NEON SLING: Procedural Synthwave Web Audio Engine
 * ============================================================================
 * High-performance, zero-asset Web Audio API synthesizer.
 * Generates dynamic 80s Cyberpunk / Synthwave background music and
 * high-impact, satisfying arcade sound effects in real time.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.masterGain = null;

    // Settings persisted in storage
    this.isMusicEnabled = localStorage.getItem('neonsling_music') !== 'false';
    this.isSfxEnabled = localStorage.getItem('neonsling_sfx') !== 'false';

    // Music state
    this.isPlayingMusic = false;
    this.bpm = 124;
    this.currentStep = 0;
    this.musicTimer = null;
    this.isFeverActive = false;

    // Bassline and Chord progressions (D minor synthwave key)
    // Scale: D, F, G, A, C
    this.bassNotes = [73.42, 73.42, 87.31, 65.41]; // D2, D2, F2, C2
    this.chordFrequencies = [
      [293.66, 349.23, 440.00], // Dm
      [261.63, 329.63, 392.00], // C
      [220.00, 261.63, 329.63], // Am
      [349.23, 440.00, 523.25]  // F
    ];
  }

  /**
   * Initializes audio context upon user gesture
   */
  init() {
    if (this.ctx) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.isMusicEnabled ? 0.35 : 0, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(this.isSfxEnabled ? 0.8 : 0, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // =========================================================================
  // Music Sequencer & Synthesis
  // =========================================================================
  startMusic() {
    this.ensureContext();
    if (this.isPlayingMusic) return;
    this.isPlayingMusic = true;
    this.currentStep = 0;
    this.scheduleNextBeat();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  setFever(active) {
    this.isFeverActive = active;
  }

  scheduleNextBeat() {
    if (!this.isPlayingMusic) return;

    const stepInterval = (60 / (this.isFeverActive ? this.bpm * 1.25 : this.bpm)) / 4; // 16th notes
    this.playSequencerStep(this.currentStep);

    this.currentStep = (this.currentStep + 1) % 16;
    this.musicTimer = setTimeout(() => this.scheduleNextBeat(), stepInterval * 1000);
  }

  playSequencerStep(step) {
    if (!this.ctx || !this.isMusicEnabled) return;
    const now = this.ctx.currentTime;

    // Kick on beats 0, 4, 8, 12 (4-on-the-floor)
    if (step % 4 === 0) {
      this.synthKick(now);
    }

    // Snare on beats 4 and 12
    if (step === 4 || step === 12) {
      this.synthSnare(now);
    }

    // Hi-hats on off-beats (2, 6, 10, 14, or every step during fever)
    if (step % 2 === 0 || this.isFeverActive) {
      this.synthHiHat(now, step % 4 === 2);
    }

    // Synthwave Arpeggiated Bass (every 16th note)
    const barIndex = Math.floor(step / 4);
    const root = this.bassNotes[barIndex % this.bassNotes.length];
    const octave = (step % 2 === 0) ? 1 : 2;
    this.synthBassNote(now, root * (this.isFeverActive ? octave * 1.5 : octave), step % 4 === 0);

    // Warm Chord Pad on start of each 4-step bar
    if (step % 8 === 0) {
      const chord = this.chordFrequencies[Math.floor(step / 8) % this.chordFrequencies.length];
      this.synthPadChord(now, chord);
    }
  }

  synthKick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.19);
  }

  synthSnare(time) {
    // Noise buffer
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(900, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.16);
  }

  synthHiHat(time, accent) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(7000, time);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, time);

    const volume = accent ? 0.25 : 0.12;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  synthBassNote(time, freq, accent) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    const cutoff = accent ? (this.isFeverActive ? 2200 : 1200) : (this.isFeverActive ? 1400 : 700);
    filter.frequency.setValueAtTime(cutoff, time);
    filter.frequency.exponentialRampToValueAtTime(300, time + 0.12);

    const vol = accent ? 0.35 : 0.25;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  synthPadChord(time, frequencies) {
    frequencies.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.08, time + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + 1.25);
    });
  }

  // =========================================================================
  // Game Sound Effects (SFX)
  // =========================================================================

  /**
   * Played when tether grapples onto an anchor
   */
  playGrapple() {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Played when releasing the tether and flinging forward
   */
  playRelease() {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(550, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.14);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Played on collecting crystals / gems
   */
  playGem(combo = 1) {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    const baseFreq = 587.33; // D5
    const multiplier = Math.min(1 + (combo - 1) * 0.1, 2.5);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * multiplier, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * multiplier * 1.5, now + 0.12);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.24);
  }

  /**
   * Played on perfect release launch
   */
  playPerfect() {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio flourish
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.04);

      gain.gain.setValueAtTime(0.2, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.2);
    });
  }

  /**
   * Near miss slow-mo whoosh
   */
  playNearMiss() {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.35);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.38);
  }

  /**
   * Fever mode explosion trigger
   */
  playFeverActivate() {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Sub drop + sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.45);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.52);

    this.playPerfect();
  }

  /**
   * Player crash / explosion sound
   */
  playCrash() {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Sub impact
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.4);
    oscGain.gain.setValueAtTime(0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.46);

    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.38);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.42);
  }

  /**
   * Clean UI button click
   */
  playClick() {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.03);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Achievement fanfare
   */
  playFanfare() {
    if (!this.isSfxEnabled) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    const notes = [440, 554.37, 659.25, 880]; // A major
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.25, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.38);
    });
  }

  // =========================================================================
  // Control Toggles
  // =========================================================================
  toggleMusic() {
    this.isMusicEnabled = !this.isMusicEnabled;
    localStorage.setItem('neonsling_music', this.isMusicEnabled);
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.isMusicEnabled ? 0.35 : 0, this.ctx.currentTime);
    }
    if (this.isMusicEnabled && !this.isPlayingMusic) {
      this.startMusic();
    }
    return this.isMusicEnabled;
  }

  toggleSfx() {
    this.isSfxEnabled = !this.isSfxEnabled;
    localStorage.setItem('neonsling_sfx', this.isSfxEnabled);
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.isSfxEnabled ? 0.8 : 0, this.ctx.currentTime);
    }
    return this.isSfxEnabled;
  }
}

// Global sound manager instance
window.audioManager = new SoundEngine();

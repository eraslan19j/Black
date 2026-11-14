// Tamamı yerel Web Audio ile üretilir; ilk kullanıcı hareketinde açılır.
export class Soundscape {
  constructor() { this.ctx = null; this.master = null; this.enabled = true; this.timer = null; }
  start() {
    if (!this.enabled) return;
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain(); this.master.gain.value = 0.14; this.master.connect(this.ctx.destination);
        for (const [frequency, gain] of [[55, .24], [82.41, .08]]) {
          const osc = this.ctx.createOscillator(), volume = this.ctx.createGain(); osc.type = 'sine'; osc.frequency.value = frequency; volume.gain.value = gain; osc.connect(volume).connect(this.master); osc.start();
        }
        let i = 0; const notes = [220, 261.63, 329.63, 293.66, 261.63, 196];
        this.timer = setInterval(() => { if (this.enabled && this.ctx.state === 'running') this.tone(notes[i++ % notes.length], 2.8, .07); }, 2400);
      }
      this.ctx.resume();
    } catch { /* Ses desteklenmiyorsa oyun sessiz devam eder. */ }
  }
  tone(freq, duration = .4, volume = .15) {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(freq, now); g.gain.setValueAtTime(.0001, now); g.gain.exponentialRampToValueAtTime(volume, now + .04); g.gain.exponentialRampToValueAtTime(.0001, now + duration);
    o.connect(g).connect(this.master); o.start(now); o.stop(now + duration + .05);
  }
  toggle() { this.enabled = !this.enabled; if (this.enabled) this.start(); else this.ctx?.suspend(); return this.enabled; }
}

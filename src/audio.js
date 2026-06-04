// Per-stage music. Each stage loops a track that matches its setting; we only
// ever play the slice the stage needs (stages are ~30s, tracks are minutes) and
// crossfade between them on stage transitions.
//
// Browser autoplay policy: nothing plays until a user gesture. Call unlock()
// from the Play-button handler, then play(theme).
//
// Optional `clip` per track: {start, end} keeps a tight loop window so we use
// only the part of the song that fits — set in TRACKS below.

const FADE_MS = 700;
const MASTER = 0.55;

export class AudioManager {
  constructor(tracks) {
    this.enabled = true;
    this.current = null;     // theme key currently playing
    this.unlocked = false;
    this.els = {};
    this.clips = {};
    for (const key in tracks) {
      const t = tracks[key];
      const url = typeof t === "string" ? t : t.url;
      const a = new Audio(url);
      a.loop = true;
      a.preload = "auto";
      a.volume = 0;
      this.els[key] = a;
      this.clips[key] = typeof t === "string" ? null : t.clip || null;
      // keep the loop tight to the requested window
      if (this.clips[key]) {
        a.addEventListener("timeupdate", () => {
          const c = this.clips[key];
          if (a.currentTime >= c.end) a.currentTime = c.start;
        });
      }
    }
  }

  // Must be called inside a user gesture (e.g. the Play-button click). In Chrome
  // one gesture activates the whole document, so every later play() is allowed —
  // we just record that we've been unlocked. (No per-element priming: that races
  // with the immediately-following play() and would pause the first track.)
  unlock() { this.unlocked = true; }

  setEnabled(on) {
    this.enabled = on;
    if (!on) {
      for (const key in this.els) this._fade(this.els[key], 0);
    } else if (this.current) {
      this._fade(this.els[this.current], MASTER);
      this.els[this.current].play().catch(() => {});
    }
    return this.enabled;
  }

  toggle() { return this.setEnabled(!this.enabled); }

  play(theme) {
    if (this.current === theme) return;
    const prev = this.current;
    this.current = theme;
    if (prev && this.els[prev]) this._fade(this.els[prev], 0, () => this.els[prev].pause());
    const a = this.els[theme];
    if (!a) return;
    if (!this.clips[theme]) a.currentTime = 0;
    else if (a.currentTime < this.clips[theme].start || a.currentTime > this.clips[theme].end) {
      a.currentTime = this.clips[theme].start;
    }
    if (this.enabled) {
      a.play().catch(() => {});
      this._fade(a, MASTER);
    }
  }

  stop() {
    const prev = this.current;
    this.current = null;
    if (prev && this.els[prev]) this._fade(this.els[prev], 0, () => this.els[prev].pause());
  }

  _fade(el, target, done) {
    if (el._fadeRAF) cancelAnimationFrame(el._fadeRAF);
    const start = el.volume;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / FADE_MS);
      el.volume = Math.max(0, Math.min(1, start + (target - start) * k));
      if (k < 1) el._fadeRAF = requestAnimationFrame(step);
      else if (done) done();
    };
    el._fadeRAF = requestAnimationFrame(step);
  }
}

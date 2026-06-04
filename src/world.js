import { THEMES, mixHex } from "./palette.js";

// Alto-style backdrop: gradient sky, parallax silhouette ridges, pines,
// a sun/moon, stars at night, and a drifting particle field.
export class World {
  constructor() {
    this.offset = 0; // world scroll accumulator (px)
    this.fromTheme = "day";
    this.toTheme = "day";
    this.t = 1; // blend [0..1]; 1 = fully on toTheme
    this.transRate = 0;
    this.particles = [];
    this.stars = [];
    this._seeded = false;
  }

  reset() {
    this.offset = 0;
    this.fromTheme = "day";
    this.toTheme = "day";
    this.t = 1;
    this.transRate = 0;
    this.particles.length = 0;
    this.stars.length = 0;
    this._seeded = false;
  }

  setTheme(name) { this.fromTheme = name; this.toTheme = name; this.t = 1; }

  transitionTo(name, seconds) {
    this.fromTheme = this._resolveName();
    this._frozen = this._snapshot();
    this.toTheme = name;
    this.t = 0;
    this.transRate = 1 / seconds;
  }

  _resolveName() { return this.t >= 1 ? this.toTheme : this.fromTheme; }

  _snapshot() {
    // resolve current blended theme into a concrete object so a new transition
    // can start cleanly from wherever we are
    return this.theme();
  }

  // current blended theme object
  theme() {
    const a = THEMES[this.fromTheme];
    const b = THEMES[this.toTheme];
    if (this.t >= 1) return b;
    const base = this._frozen && this.t > 0 ? this._frozen : a;
    const t = this.t;
    return {
      sky: base.sky.map((c, i) => mixHex(c, b.sky[i], t)),
      far: mixHex(base.far, b.far, t),
      mid: mixHex(base.mid, b.mid, t),
      near: mixHex(base.near, b.near, t),
      ground: mixHex(base.ground, b.ground, t),
      body: mixHex(base.body, b.body, t),
      bodyGlow: t < 0.5 ? base.bodyGlow : b.bodyGlow,
      particle: t < 0.5 ? base.particle : b.particle,
      star: b.star,
    };
  }

  _seed(width, height) {
    for (let i = 0; i < 70; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 1 + Math.random() * 2.4,
        sp: 12 + Math.random() * 34,
        drift: -10 + Math.random() * 20,
        ph: Math.random() * Math.PI * 2,
      });
    }
    for (let i = 0; i < 90; i++) {
      this.stars.push({ x: Math.random() * width, y: Math.random() * height * 0.6, r: Math.random() * 1.6, tw: Math.random() * Math.PI * 2 });
    }
    this._seeded = true;
  }

  update(dt, speed, width, height) {
    if (!this._seeded) this._seed(width, height);
    this.offset += speed * dt;
    if (this.t < 1) this.t = Math.min(1, this.t + this.transRate * dt);

    for (const p of this.particles) {
      p.y += p.sp * dt;
      p.x -= (speed * 0.15 + p.drift) * dt;
      if (p.y > height + 6) { p.y = -6; p.x = Math.random() * width; }
      if (p.x < -6) p.x = width + 6;
    }
  }

  draw(ctx, width, height, time) {
    const th = this.theme();
    const groundY = this.groundY(height);

    // --- sky gradient ---
    const g = ctx.createLinearGradient(0, 0, 0, groundY);
    g.addColorStop(0, th.sky[0]);
    g.addColorStop(0.55, th.sky[1]);
    g.addColorStop(1, th.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, groundY + 2);

    // --- stars (night) ---
    if (th.star) {
      for (const s of this.stars) {
        ctx.globalAlpha = 0.4 + Math.sin(time * 2 + s.tw) * 0.35;
        ctx.fillStyle = "#eaf0ff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // --- sun / moon ---
    const bx = width * 0.74, by = height * 0.26;
    const glow = ctx.createRadialGradient(bx, by, 6, bx, by, 150);
    glow.addColorStop(0, th.bodyGlow);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(bx, by, 150, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = th.body;
    ctx.beginPath(); ctx.arc(bx, by, 44, 0, Math.PI * 2); ctx.fill();

    // --- parallax ridges ---
    this._ridge(ctx, width, groundY, th.far, 0.12, 120, groundY - 210, 0.5);
    this._ridge(ctx, width, groundY, th.mid, 0.28, 150, groundY - 120, 0.8);
    this._ridge(ctx, width, groundY, th.near, 0.55, 120, groundY - 40, 1.3);

    // --- pines on the near ridge ---
    this._pines(ctx, width, groundY, th.near, th.ground);

    // --- ground ---
    ctx.fillStyle = th.ground;
    ctx.fillRect(0, groundY, width, height - groundY);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(0, groundY, width, 3);

    // --- particles (snow/dust) ---
    ctx.fillStyle = th.particle;
    for (const p of this.particles) {
      ctx.globalAlpha = 0.35 + Math.sin(time + p.ph) * 0.25;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    return groundY;
  }

  groundY(height) { return Math.round(height * 0.78); }

  _ridge(ctx, width, groundY, color, parallax, amp, baseY, freq) {
    const off = this.offset * parallax;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    const step = 24;
    for (let x = 0; x <= width + step; x += step) {
      const wx = (x + off) * 0.0045 * freq;
      const y = baseY + Math.sin(wx) * amp * 0.5 + Math.sin(wx * 0.5 + 1.7) * amp * 0.5;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, groundY);
    ctx.closePath();
    ctx.fill();
  }

  _pines(ctx, width, groundY, color, ground) {
    const off = this.offset * 0.55;
    const spacing = 230;
    const start = -((off % spacing) + spacing);
    ctx.fillStyle = mixHex(color, "#000000", 0.35);
    for (let x = start; x < width + spacing; x += spacing) {
      const h = 70 + ((Math.floor((x + off) / spacing) * 37) % 40);
      const baseYy = groundY - 36;
      ctx.beginPath();
      ctx.moveTo(x, baseYy - h);
      ctx.lineTo(x - h * 0.32, baseYy);
      ctx.lineTo(x + h * 0.32, baseYy);
      ctx.closePath();
      ctx.fill();
    }
  }
}

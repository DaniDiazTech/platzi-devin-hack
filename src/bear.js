import { CONFIG, BEAR_FORM } from "./config.js";

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// IRONBEAR — a large, in-engine vector bear that morphs chubby -> ripped
// and can enter HULK mode. Runs in place while the world scrolls past.
export class Bear {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;          // set each frame from canvas width
    this.groundY = 0;    // feet baseline, set each frame
    this.vy = 0;
    this.yOff = 0;       // vertical offset from ground (jump), <=0 above ground
    this.onGround = true;
    this.ducking = false;
    this.runPhase = 0;

    this.fitness = 0;        // visible, eased
    this.fitnessTarget = 0;  // driven by run progress

    this.hulk = false;
    this.hulkTimer = 0;
    this.invuln = 0;         // i-frames after a hit
  }

  get scale() {
    const base = (CONFIG.bearHeight / 160) * CONFIG.bearBaseScale;
    return base * (this.hulk ? CONFIG.hulkScale : 1);
  }

  startHulk(duration) {
    this.hulk = true;
    this.hulkTimer = duration;
  }

  jump() {
    if (this.onGround || this._coyote > 0) {
      this.vy = CONFIG.jumpVelocity;
      this.onGround = false;
      this._coyote = 0;
    } else {
      this._buffer = CONFIG.jumpBuffer; // remember intent
    }
  }

  setDuck(d) {
    this.ducking = d && this.onGround;
  }

  // distanceProgress: 0..1 across the whole 3-stage run -> drives transformation.
  update(dt, speed, distanceProgress) {
    this.fitnessTarget = clamp(distanceProgress, 0, 1);
    this.fitness += (this.fitnessTarget - this.fitness) *
      clamp(dt * CONFIG.fitnessSmoothing, 0, 1);

    // Gravity / jump integration
    this.vy += CONFIG.gravity * dt;
    this.yOff += this.vy * dt;
    if (this.yOff >= 0) {
      this.yOff = 0;
      this.vy = 0;
      if (!this.onGround) this._buffer = this._buffer || 0;
      this.onGround = true;
      this._coyote = CONFIG.coyoteTime;
      if (this._buffer > 0) { this._buffer = 0; this.jump(); }
    } else {
      this.onGround = false;
    }
    this._coyote = Math.max(0, (this._coyote || 0) - dt);
    this._buffer = Math.max(0, (this._buffer || 0) - dt);

    // Run cycle scales with world speed
    this.runPhase += dt * (speed / 90) * (this.hulk ? 1.4 : 1);

    if (this.invuln > 0) this.invuln -= dt;

    if (this.hulk) {
      this.hulkTimer -= dt;
      if (this.hulkTimer <= 0) { this.hulk = false; this.hulkTimer = 0; }
    }
  }

  // AABB hitbox in world/canvas space.
  hitbox() {
    const s = this.scale;
    const fullW = CONFIG.bearWidth * s * 0.62;
    const fullH = CONFIG.bearHeight * s * (this.ducking ? CONFIG.duckHeightFactor : 0.92);
    const cx = this.x;
    const feet = this.groundY + this.yOff;
    return { x: cx - fullW / 2, y: feet - fullH, w: fullW, h: fullH };
  }

  // ---- Rendering -------------------------------------------------------
  draw(ctx, time) {
    const f = this.fitness;
    const form = {
      belly: lerp(BEAR_FORM.chubby.belly, BEAR_FORM.ripped.belly, f),
      shoulder: lerp(BEAR_FORM.chubby.shoulder, BEAR_FORM.ripped.shoulder, f),
      limb: lerp(BEAR_FORM.chubby.limb, BEAR_FORM.ripped.limb, f),
      lean: lerp(BEAR_FORM.chubby.lean, BEAR_FORM.ripped.lean, f),
      bob: lerp(BEAR_FORM.chubby.bob, BEAR_FORM.ripped.bob, f),
    };

    const s = this.scale;
    const feet = this.groundY + this.yOff;
    const bobAmt = this.onGround ? Math.abs(Math.sin(this.runPhase)) * form.bob : 0;

    // i-frame blink
    if (this.invuln > 0 && Math.floor(time * 12) % 2 === 0 && !this.hulk) return;

    // Fur color: navy -> steel-cobalt as fitness rises; HULK overrides to green.
    let fur, furDark, accent;
    if (this.hulk) {
      const flash = Math.sin(time * Math.PI * 2 * CONFIG.hulkFlashHz) * 0.5 + 0.5;
      fur = `rgb(${40 + flash * 30},${190 + flash * 50},${90 + flash * 30})`;
      furDark = "#1f7a3c";
      accent = "#d7ffe2";
    } else {
      fur = mix("#16263a", "#3a5f86", f);
      furDark = mix("#0c1a29", "#22405e", f);
      accent = mix("#26425f", "#7fb0e0", f);
    }

    ctx.save();
    ctx.translate(this.x, feet - bobAmt);
    ctx.scale(s, s);
    ctx.rotate(form.lean * 0.25);

    // ground shadow
    ctx.save();
    ctx.scale(1, 1);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    const shW = 70 * (this.hulk ? 1.2 : 1) * (1 - (this.yOff < 0 ? Math.min(0.5, -this.yOff / 380) : 0));
    ctx.beginPath();
    ctx.ellipse(0, 6, shW, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const duckSquash = this.ducking ? 0.66 : 1;
    ctx.scale(1, duckSquash);

    const legSwing = this.onGround ? Math.sin(this.runPhase) : 0.5;
    const legSwing2 = this.onGround ? Math.sin(this.runPhase + Math.PI) : -0.5;

    // ---- Legs (behind body) ----
    drawLimb(ctx, -12, -18, 14 * form.limb, 42, legSwing2, furDark);
    // ---- Body ----
    const bellyR = 40 * form.belly;
    const chestW = 46 * form.shoulder;
    ctx.fillStyle = fur;
    roundedBody(ctx, chestW, bellyR);

    // muscle / ab definition appears with fitness (and always in HULK)
    if (!this.hulk && f > 0.4) drawMuscles(ctx, (f - 0.4) * 0.7, 2, 1);
    if (this.hulk) drawMuscles(ctx, 0.6, 3, 1.3);

    // ---- Front leg ----
    drawLimb(ctx, 10, -18, 15 * form.limb, 44, legSwing, fur);

    // ---- Arm swinging ----
    const armSwing = this.onGround ? Math.sin(this.runPhase + Math.PI) : -0.7;
    drawArm(ctx, chestW * 0.5, -70, 13 * form.limb * (this.hulk ? 1.4 : form.shoulder), 38, armSwing, fur);

    // ---- Head ----
    ctx.save();
    ctx.translate(8 + form.lean * 10, -96);
    // ears
    ctx.fillStyle = furDark;
    circle(ctx, -16, -16, 11);
    circle(ctx, 16, -16, 11);
    // head
    ctx.fillStyle = fur;
    circle(ctx, 0, 0, 28);
    // snout
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.ellipse(14, 6, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // nose
    ctx.fillStyle = "#0a0f16";
    circle(ctx, 24, 4, 4.5);
    // eye (determined when fit, dot)
    ctx.fillStyle = this.hulk ? "#0a2a12" : "#0a0f16";
    circle(ctx, 6, -4, 3.4);
    // angry brow grows with fitness/hulk
    const brow = this.hulk ? 1 : f;
    if (brow > 0.3) {
      ctx.strokeStyle = "#0a0f16";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-2, -12); ctx.lineTo(12, -9 + brow * -2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
  }
}

// --- draw helpers ---
function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
  const r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg - ag) * t), bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}
function drawMuscles(ctx, alpha, lw, k) {
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.beginPath();
  // pecs: two diagonals meeting at the sternum
  ctx.moveTo(-1, -70); ctx.lineTo(-15 * k, -56);
  ctx.moveTo(1, -70); ctx.lineTo(15 * k, -56);
  // linea alba (short centerline over the abs)
  ctx.moveTo(0, -54); ctx.lineTo(0, -26);
  // ab rows split by the centerline
  for (const y of [-47, -37]) {
    ctx.moveTo(-3, y); ctx.lineTo(-11 * k, y);
    ctx.moveTo(3, y); ctx.lineTo(11 * k, y);
  }
  ctx.stroke();
  ctx.lineCap = "butt";
}
function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function roundedBody(ctx, chestW, bellyR) {
  // chest narrow at top, belly wide at bottom — a teardrop torso
  ctx.beginPath();
  ctx.moveTo(-chestW * 0.5, -76);
  ctx.quadraticCurveTo(-chestW * 0.9, -50, -bellyR, -24);
  ctx.quadraticCurveTo(-bellyR * 1.05, 4, 0, 6);
  ctx.quadraticCurveTo(bellyR * 1.05, 4, bellyR, -24);
  ctx.quadraticCurveTo(chestW * 0.9, -50, chestW * 0.5, -76);
  ctx.quadraticCurveTo(0, -88, -chestW * 0.5, -76);
  ctx.fill();
}
function drawLimb(ctx, x, y, w, len, swing, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(swing * 0.5);
  ctx.fillStyle = color;
  roundRect(ctx, -w / 2, 0, w, len, w / 2);
  ctx.restore();
}
function drawArm(ctx, x, y, w, len, swing, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(swing * 0.6 - 0.3);
  ctx.fillStyle = color;
  roundRect(ctx, -w / 2, 0, w, len, w / 2);
  ctx.restore();
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.fill();
}

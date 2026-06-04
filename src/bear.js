import { CONFIG, BEAR_FORMS, HULK_FORM } from "./config.js";

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const NUM_KEYS = ["shoulderW", "bellyW", "hipW", "shoulderY", "hipY", "legLen",
  "legW", "armW", "armLen", "headR", "neck", "snout", "muscle", "lean", "bob"];

// IRONBEAR — a large in-engine vector bear that morphs FAT -> NORMAL -> MUSCULAR
// across the run, plus a green ESTEROIDES (HULK) beast while the power-up is on.
// Runs in place while the world scrolls past; can jump and (fluidly) duck.
export class Bear {
  constructor() { this.reset(); }

  reset() {
    this.x = 0;
    this.groundY = 0;
    this.vy = 0;
    this.yOff = 0;
    this.onGround = true;
    this.ducking = false;
    this.duckAmt = 0;       // eased 0..1 crouch
    this.runPhase = 0;

    this.fitness = 0;
    this.fitnessTarget = 0;

    this.hulk = false;
    this.hulkTimer = 0;
    this.invuln = 0;

    this.exercise = null;   // { t } while doing the checkpoint workout
  }

  get scale() {
    const base = (CONFIG.bearHeight / 200) * CONFIG.bearBaseScale;
    return base * (this.hulk ? CONFIG.hulkScale : 1);
  }

  startHulk(d) { this.hulk = true; this.hulkTimer = d; }
  jump() {
    if (this.exercise) return;
    if (this.onGround || this._coyote > 0) {
      this.vy = CONFIG.jumpVelocity; this.onGround = false; this._coyote = 0;
    } else { this._buffer = CONFIG.jumpBuffer; }
  }
  setDuck(d) { this.ducking = d && this.onGround && !this.exercise; }

  // The interpolated body form for the current fitness (+ HULK override).
  form() {
    const f = clamp(this.fitness, 0, 1);
    let lo = BEAR_FORMS[0], hi = BEAR_FORMS[BEAR_FORMS.length - 1];
    for (let i = 0; i < BEAR_FORMS.length - 1; i++) {
      if (f >= BEAR_FORMS[i].at && f <= BEAR_FORMS[i + 1].at) { lo = BEAR_FORMS[i]; hi = BEAR_FORMS[i + 1]; break; }
    }
    const span = hi.at - lo.at || 1;
    const t = clamp((f - lo.at) / span, 0, 1);
    const out = {};
    for (const k of NUM_KEYS) out[k] = lerp(lo[k], hi[k], t);
    out.fur = mix(lo.fur, hi.fur, t);
    out.bell = mix(lo.bell, hi.bell, t);
    out.spiky = 0;
    if (this.hulk) {
      // ease toward the beast as the power-up kicks in
      const k = clamp(this.hulkTimer > 0 ? 1 : 0, 0, 1);
      for (const key of NUM_KEYS) out[key] = lerp(out[key], HULK_FORM[key], k);
      out.fur = HULK_FORM.fur; out.bell = HULK_FORM.bell; out.spiky = 1;
    }
    return out;
  }

  update(dt, speed, distanceProgress) {
    if (!this.exercise) {
      this.fitnessTarget = clamp(distanceProgress, 0, 1);
    }
    this.fitness += (this.fitnessTarget - this.fitness) * clamp(dt * CONFIG.fitnessSmoothing, 0, 1);

    // gravity / jump
    this.vy += CONFIG.gravity * dt;
    this.yOff += this.vy * dt;
    if (this.yOff >= 0) {
      this.yOff = 0; this.vy = 0;
      this.onGround = true; this._coyote = CONFIG.coyoteTime;
      if (this._buffer > 0) { this._buffer = 0; this.jump(); }
    } else { this.onGround = false; }
    this._coyote = Math.max(0, (this._coyote || 0) - dt);
    this._buffer = Math.max(0, (this._buffer || 0) - dt);

    // fluid duck easing (only meaningful on the ground)
    const duckTarget = this.ducking && this.onGround ? 1 : 0;
    this.duckAmt += (duckTarget - this.duckAmt) * clamp(dt * CONFIG.duckEase, 0, 1);
    if (this.duckAmt < 0.001) this.duckAmt = 0;

    this.runPhase += dt * (speed / 90) * (this.hulk ? 1.4 : 1);
    if (this.invuln > 0) this.invuln -= dt;
    if (this.exercise) this.exercise.t += dt;
    if (this.hulk) { this.hulkTimer -= dt; if (this.hulkTimer <= 0) { this.hulk = false; this.hulkTimer = 0; } }
  }

  // AABB hitbox; height shrinks smoothly with the crouch.
  hitbox() {
    const s = this.scale;
    const standH = CONFIG.bearHeight * s * 0.92;
    const h = standH * lerp(1, CONFIG.duckHeightFactor, this.duckAmt);
    const w = CONFIG.bearWidth * s * (0.6 + this.duckAmt * 0.14);
    const feet = this.groundY + this.yOff;
    return { x: this.x - w / 2, y: feet - h, w, h };
  }

  // ---- Rendering -------------------------------------------------------
  draw(ctx, time) {
    if (this.invuln > 0 && Math.floor(time * 12) % 2 === 0 && !this.hulk && !this.exercise) return;

    const fm = this.form();
    const s = this.scale;
    const feet = this.groundY + this.yOff;
    const running = this.onGround && !this.exercise;
    const bob = running ? Math.abs(Math.sin(this.runPhase)) * fm.bob * 30 : 0;
    const d = this.duckAmt;

    // crouch reshapes the body instead of a flat squash
    const shoulderY = fm.shoulderY * (1 - d * 0.34);
    const hipY = fm.hipY * (1 - d * 0.22);
    const legLen = fm.legLen * (1 - d * 0.5);
    const lean = fm.lean + d * 0.5;

    ctx.save();
    ctx.translate(this.x, feet - bob);
    ctx.scale(s, s);

    // ground shadow
    ctx.fillStyle = "rgba(0,0,0,0.26)";
    const shW = (fm.bellyW + 26) * (this.hulk ? 1.15 : 1) * (1 - (this.yOff < 0 ? Math.min(0.5, -this.yOff / 380) : 0));
    ctx.beginPath();
    ctx.ellipse(0, 2, shW, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(lean * 0.18);

    const legSwing = running ? Math.sin(this.runPhase) : 0;
    const armPhase = this.exercise ? this.exercise.t : this.runPhase;

    // ---- back leg ----
    drawLeg(ctx, -fm.hipW * 0.45, hipY, fm.legW, legLen, -legSwing, fm.fur, true);
    // ---- back arm ----
    drawArm(ctx, -fm.shoulderW * 0.5, shoulderY + 14, fm.armW * 0.9, fm.armLen, backArmAngle(this, armPhase), fm.fur);

    // ---- torso ----
    drawTorso(ctx, fm, shoulderY, hipY, d);

    // muscle definition
    if (fm.muscle > 0.05) drawMuscles(ctx, fm, shoulderY, hipY, this.hulk);

    // ---- front leg ----
    drawLeg(ctx, fm.hipW * 0.35, hipY, fm.legW, legLen, legSwing, fm.fur, false);

    // ---- front arm (+ barbell during exercise) ----
    if (this.exercise) drawPressArm(ctx, fm, shoulderY, this.exercise.t);
    else drawArm(ctx, fm.shoulderW * 0.42, shoulderY + 14, fm.armW, fm.armLen, frontArmAngle(this, armPhase), fm.fur);

    // ---- head ----
    drawHead(ctx, fm, shoulderY, lean, this.hulk, time, d);

    ctx.restore();
  }
}

// ============================ draw helpers ============================
function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
  return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)})`;
}
function darken(rgb, k) {
  const m = rgb.match(/\d+/g).map(Number);
  return `rgb(${Math.round(m[0] * k)},${Math.round(m[1] * k)},${Math.round(m[2] * k)})`;
}
function backArmAngle(b, p) {
  if (!b.onGround) return 0.35;
  return Math.sin(p) * 0.55;
}
function frontArmAngle(b, p) {
  if (!b.onGround) return -0.3;
  return Math.sin(p + Math.PI) * 0.55;
}

function drawTorso(ctx, fm, shoulderY, hipY, d) {
  const sw = fm.shoulderW;
  const bw = fm.bellyW * (1 + d * 0.2);
  const hw = fm.hipW;
  const topY = shoulderY;
  const midY = (shoulderY + hipY) / 2 + 4;
  const botY = hipY + 10;

  ctx.fillStyle = fm.fur;
  ctx.beginPath();
  ctx.moveTo(0, topY - 12);                                   // top center (neck/shoulders)
  ctx.bezierCurveTo(sw, topY - 8, bw + 6, midY - 12, bw + 2, midY + 6);   // R shoulder -> belly
  ctx.bezierCurveTo(bw, botY - 2, hw * 0.7, botY + 4, 0, botY + 6);        // belly -> hip
  ctx.bezierCurveTo(-hw * 0.7, botY + 4, -bw, botY - 2, -bw - 2, midY + 6);// L hip -> belly
  ctx.bezierCurveTo(-bw - 6, midY - 12, -sw, topY - 8, 0, topY - 12);      // belly -> L shoulder
  ctx.closePath();
  ctx.fill();

  // lighter chest/belly patch
  ctx.fillStyle = fm.bell;
  ctx.beginPath();
  ctx.ellipse(0, midY + 4, bw * 0.6, Math.abs(botY - topY) * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawMuscles(ctx, fm, shoulderY, hipY, hulk) {
  const a = clamp(fm.muscle, 0, 1) * (hulk ? 0.8 : 0.6);
  ctx.strokeStyle = `rgba(255,255,255,${a})`;
  ctx.lineWidth = hulk ? 3 : 2;
  ctx.lineCap = "round";
  const top = shoulderY + 18, midX = fm.shoulderW * 0.5;
  ctx.beginPath();
  // pecs
  ctx.moveTo(-1, top); ctx.lineTo(-midX, top + 12);
  ctx.moveTo(1, top); ctx.lineTo(midX, top + 12);
  // linea alba
  const abTop = top + 16, abBot = (shoulderY + hipY) / 2 + 18;
  ctx.moveTo(0, abTop); ctx.lineTo(0, abBot);
  // ab rows
  const rows = 2, abW = fm.bellyW * 0.42;
  for (let i = 0; i < rows; i++) {
    const y = abTop + ((abBot - abTop) * (i + 1)) / (rows + 1);
    ctx.moveTo(-3, y); ctx.lineTo(-abW, y);
    ctx.moveTo(3, y); ctx.lineTo(abW, y);
  }
  ctx.stroke();
  ctx.lineCap = "butt";
}

function drawLeg(ctx, x, hipY, w, len, swing, color, back) {
  ctx.save();
  ctx.translate(x, hipY + 6);
  ctx.rotate(swing * 0.5);
  ctx.fillStyle = back ? darken(toRgb(color), 0.8) : color;
  roundRect(ctx, -w / 2, 0, w, len, w / 2);
  // foot
  ctx.beginPath();
  ctx.ellipse(w * 0.15, len, w * 0.7, w * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawArm(ctx, x, y, w, len, angle, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  roundRect(ctx, -w / 2, 0, w, len, w / 2);
  ctx.beginPath(); ctx.arc(0, len, w * 0.6, 0, Math.PI * 2); ctx.fill(); // paw
  ctx.restore();
}
function drawPressArm(ctx, fm, shoulderY, t) {
  // overhead barbell press: both arms reach up, barbell bobs with the reps
  const rep = Math.sin(t * 5);                 // -1..1
  const lift = (rep * 0.5 + 0.5);              // 0..1
  const handY = shoulderY - 6 - lift * 34;
  const color = fm.fur;
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(sx * fm.shoulderW * 0.42, shoulderY + 12);
    const w = fm.armW;
    ctx.fillStyle = color;
    // upper + forearm reaching up to handY
    const reach = (shoulderY + 12) - handY;
    roundRect(ctx, -w / 2, -reach, w, reach + 6, w / 2);
    ctx.restore();
  }
  // barbell
  const barY = handY;
  ctx.fillStyle = "#2a2f3a";
  roundRect(ctx, -fm.shoulderW - 14, barY - 4, (fm.shoulderW + 14) * 2, 8, 4);
  ctx.fillStyle = "#5a6473";
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sx * (fm.shoulderW + 14), barY, 11, 20, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHead(ctx, fm, shoulderY, lean, hulk, time, d) {
  ctx.save();
  ctx.translate(6 + lean * 12, shoulderY - fm.neck - fm.headR * 0.2 + d * 14);
  const R = fm.headR;

  // spiky mane for the beast
  if (fm.spiky) {
    ctx.fillStyle = darken(toRgb(fm.fur), 0.7);
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI * 0.95 + (i / 8) * Math.PI * 1.0;
      const r1 = R * 0.9, r2 = R * 1.7;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - 0.12) * r1, Math.sin(a - 0.12) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.lineTo(Math.cos(a + 0.12) * r1, Math.sin(a + 0.12) * r1);
      ctx.closePath(); ctx.fill();
    }
  }
  // ears
  ctx.fillStyle = darken(toRgb(fm.fur), 0.85);
  circle(ctx, -R * 0.62, -R * 0.6, R * 0.4);
  circle(ctx, R * 0.62, -R * 0.6, R * 0.4);
  // head
  ctx.fillStyle = fm.fur;
  circle(ctx, 0, 0, R);
  // snout
  ctx.fillStyle = fm.bell;
  ctx.beginPath();
  ctx.ellipse(R * 0.5, R * 0.22, fm.snout, fm.snout * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  // nose
  ctx.fillStyle = "#10141b";
  circle(ctx, R * 0.5 + fm.snout * 0.55, R * 0.15, R * 0.16);
  // eye
  ctx.fillStyle = hulk ? "#0a2a12" : "#10141b";
  circle(ctx, R * 0.18, -R * 0.12, R * 0.12);
  // angry brow grows with muscle / hulk
  const brow = hulk ? 1 : fm.muscle;
  if (brow > 0.25) {
    ctx.strokeStyle = "#10141b";
    ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-R * 0.1, -R * 0.42); ctx.lineTo(R * 0.42, -R * 0.24 - brow * R * 0.08);
    ctx.stroke(); ctx.lineCap = "butt";
  }
  ctx.restore();
}

function toRgb(c) {
  if (c.startsWith("rgb")) return c;
  const p = parseInt(c.slice(1), 16);
  return `rgb(${(p >> 16) & 255},${(p >> 8) & 255},${p & 255})`;
}
function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.fill();
}

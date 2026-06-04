// Stage-themed obstacles that scroll right->left. Object-pooled.
// Ground obstacles must be JUMPED; high (floating) obstacles must be DUCKED under.
// Spawning is spacing-aware so the player always has time to react (fairness).
import { drawIcon } from "./icons.js";

export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

// Min reaction time (seconds) before the next obstacle, by transition type.
// Cross-type (jump then duck, or vice-versa) needs noticeably more room.
const GAP_SECONDS = { sameGround: 0.78, sameHigh: 0.72, cross: 1.12, first: 0.55 };

export class ObstacleField {
  constructor() {
    this.items = [];
    this.pool = [];
    this.timer = 0.8;
    this.lastType = null; // 'g' | 'h'
  }

  reset() {
    this.items.length = 0;
    this.timer = 0.8;
    this.lastType = null;
  }

  _alloc() {
    return this.pool.pop() || { x: 0, y: 0, w: 0, h: 0, id: "", high: false, dead: false, smashed: 0 };
  }

  _rightEdge() {
    let m = -Infinity;
    for (const o of this.items) m = Math.max(m, o.x + o.w);
    return m;
  }

  spawn(stage, width, groundY, high) {
    const def = pick(stage.obstacles);
    const o = this._alloc();
    o.id = def.id;
    o.w = def.w;
    o.h = def.h;
    o.dead = false;
    o.smashed = 0;
    o.high = high;
    o.x = width + 40;
    if (high) {
      // bottom edge ~150-160px above ground: clears a duck, hits a stand
      o.y = groundY - 205 - rand(0, 10);
    } else {
      o.y = groundY - o.h;
    }
    this.items.push(o);
    this.lastType = high ? "h" : "g";
  }

  update(dt, speed, stage, width, groundY) {
    this.timer -= dt;
    if (this.timer <= 0) {
      const high = Math.random() < stage.flyChance;
      const type = high ? "h" : "g";
      const key = !this.lastType ? "first" : this.lastType !== type ? "cross" : high ? "sameHigh" : "sameGround";
      const requiredGap = speed * GAP_SECONDS[key];
      if (this._rightEdge() > width - requiredGap) {
        this.timer = 0.06; // too tight — wait and re-check next frames
      } else {
        this.spawn(stage, width, groundY, high);
        this.timer = stage.spawnEvery * rand(0.85, 1.2);
      }
    }
    for (const o of this.items) {
      o.x -= speed * dt;
      if (o.smashed > 0) o.smashed -= dt;
      if (o.x + o.w < -60) o.dead = true;
    }
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (this.items[i].dead) { this.pool.push(this.items[i]); this.items.splice(i, 1); }
    }
  }

  hitbox(o) {
    const pad = 0.16;
    return { x: o.x + o.w * pad, y: o.y + o.h * pad, w: o.w * (1 - pad * 2), h: o.h * (1 - pad * 2) };
  }

  draw(ctx) {
    for (const o of this.items) {
      if (o.smashed > 0) continue;
      if (!o.high) {
        ctx.fillStyle = "rgba(0,0,0,0.22)";
        ctx.beginPath();
        ctx.ellipse(o.x + o.w / 2, o.y + o.h + 4, o.w * 0.48, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      drawIcon(ctx, o.id, o.x, o.y, o.w, o.h);
    }
  }
}

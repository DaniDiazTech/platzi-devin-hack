// Stage-themed obstacles that scroll right->left. Object-pooled.
// Ground obstacles must be JUMPED; high (floating) obstacles must be DUCKED under.

export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

export class ObstacleField {
  constructor() {
    this.items = [];
    this.pool = [];
    this.timer = 0.8; // small grace at stage start
  }

  reset() {
    this.items.length = 0;
    this.timer = 0.8;
  }

  _alloc() {
    return this.pool.pop() || { x: 0, y: 0, w: 0, h: 0, glyph: "", high: false, dead: false, smashed: 0 };
  }

  spawnFromStage(stage, width, groundY) {
    const def = pick(stage.obstacles);
    const o = this._alloc();
    o.glyph = def.glyph;
    o.w = def.w;
    o.h = def.h;
    o.dead = false;
    o.smashed = 0;
    o.high = Math.random() < stage.flyChance;
    o.x = width + 40;
    if (o.high) {
      // floats so a STANDING bear (~203px) is hit but a DUCKING bear (~132px) clears it.
      // bottom edge sits ~150-160px above ground -> above the ducked hitbox, into the standing one.
      o.y = groundY - 205 - rand(0, 10);
    } else {
      o.y = groundY - o.h;
    }
    this.items.push(o);
  }

  update(dt, speed, stage, width, groundY) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.spawnFromStage(stage, width, groundY);
      this.timer = stage.spawnEvery * rand(0.75, 1.25);
    }
    for (const o of this.items) {
      o.x -= speed * dt;
      if (o.smashed > 0) o.smashed -= dt;
      if (o.x + o.w < -60) o.dead = true;
    }
    // recycle
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (this.items[i].dead) {
        this.pool.push(this.items[i]);
        this.items.splice(i, 1);
      }
    }
  }

  hitbox(o) {
    // forgiving hitbox slightly smaller than the visual glyph
    const pad = 0.18;
    return { x: o.x + o.w * pad, y: o.y + o.h * pad, w: o.w * (1 - pad * 2), h: o.h * (1 - pad * 2) };
  }

  draw(ctx) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const o of this.items) {
      if (o.smashed > 0) continue; // hidden once smashed by HULK
      const cx = o.x + o.w / 2;
      const cy = o.y + o.h / 2;
      // soft shadow on ground obstacles
      if (!o.high) {
        ctx.fillStyle = "rgba(0,0,0,0.22)";
        ctx.beginPath();
        ctx.ellipse(cx, o.y + o.h + 4, o.w * 0.5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.font = `${Math.max(o.w, o.h)}px serif`;
      ctx.fillText(o.glyph, cx, cy);
    }
  }
}

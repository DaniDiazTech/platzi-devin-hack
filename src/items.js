// Collectible pickups: ENERGY (⚡ speed boost) and STEROID (💉 -> HULK BEAR).
// Steroids are scheduled per stage; energy spawns at a steady trickle.
import { ENERGY_GLYPH, STEROID_GLYPH } from "./stages.js";

const rand = (a, b) => a + Math.random() * (b - a);

export class ItemField {
  constructor() {
    this.items = [];
    this.energyTimer = 2.2;
  }

  reset() {
    this.items.length = 0;
    this.energyTimer = rand(1.6, 2.6);
    this._steroidQueue = 0;
    this._stageElapsed = 0;
    this._stageLength = 1;
    this._steroidTimes = [];
  }

  // Called when a stage begins: schedule the stage's steroid drops evenly.
  beginStage(stage) {
    this._stageElapsed = 0;
    this._stageLength = stage.length;
    this._steroidTimes = [];
    const n = stage.hulk.count;
    for (let i = 0; i < n; i++) {
      // spread across the stage, biased away from the very edges
      this._steroidTimes.push(stage.length * ((i + 0.7) / (n + 0.4)));
    }
  }

  spawnPickup(glyph, kind, width, groundY) {
    this.items.push({
      x: width + 40,
      y: groundY - 120 - rand(0, 70),
      r: 26,
      glyph,
      kind, // "energy" | "steroid"
      bob: rand(0, Math.PI * 2),
      dead: false,
    });
  }

  update(dt, speed, width, groundY) {
    this._stageElapsed += dt;

    this.energyTimer -= dt;
    if (this.energyTimer <= 0) {
      this.spawnPickup(ENERGY_GLYPH, "energy", width, groundY);
      this.energyTimer = rand(2.0, 3.4);
    }

    if (this._steroidTimes.length && this._stageElapsed >= this._steroidTimes[0]) {
      this._steroidTimes.shift();
      this.spawnPickup(STEROID_GLYPH, "steroid", width, groundY);
    }

    for (const it of this.items) {
      it.x -= speed * dt;
      it.bob += dt * 4;
      if (it.x + it.r < -60) it.dead = true;
    }
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (this.items[i].dead) this.items.splice(i, 1);
    }
  }

  hitbox(it) {
    const yy = it.y + Math.sin(it.bob) * 8;
    return { x: it.x - it.r, y: yy - it.r, w: it.r * 2, h: it.r * 2 };
  }

  draw(ctx, time) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const it of this.items) {
      const yy = it.y + Math.sin(it.bob) * 8;
      // glow halo
      const glow = it.kind === "steroid" ? "rgba(63,208,106,0.5)" : "rgba(255,220,90,0.55)";
      const pulse = 0.6 + Math.sin(time * 6 + it.bob) * 0.25;
      const g = ctx.createRadialGradient(it.x, yy, 2, it.x, yy, it.r * 1.8);
      g.addColorStop(0, glow);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = pulse;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(it.x, yy, it.r * 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.font = `${it.r * 1.7}px serif`;
      ctx.fillText(it.glyph, it.x, yy);
    }
  }
}

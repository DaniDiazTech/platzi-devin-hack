// Transient visual effects: smash explosions and floating score popups.
export class Effects {
  constructor() { this.parts = []; this.pops = []; }
  reset() { this.parts.length = 0; this.pops.length = 0; }

  burst(x, y, color = "#3fd06a") {
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 120 + Math.random() * 320;
      this.parts.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80,
        life: 0.5 + Math.random() * 0.4, t: 0, r: 3 + Math.random() * 4, color,
      });
    }
  }

  popup(x, y, text, color = "#fff") {
    this.pops.push({ x, y, text, color, t: 0, life: 0.9 });
  }

  update(dt) {
    for (const p of this.parts) {
      p.t += dt; p.vy += 900 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    this.parts = this.parts.filter((p) => p.t < p.life);
    for (const p of this.pops) { p.t += dt; p.y -= 40 * dt; }
    this.pops = this.pops.filter((p) => p.t < p.life);
  }

  draw(ctx) {
    for (const p of this.parts) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 26px system-ui, sans-serif";
    for (const p of this.pops) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }
}

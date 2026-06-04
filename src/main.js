import "./style.css";
import { CONFIG } from "./config.js";
import { STAGES } from "./stages.js";
import { Bear } from "./bear.js";
import { ObstacleField, aabb } from "./obstacles.js";
import { ItemField } from "./items.js";
import { World } from "./world.js";
import { Effects } from "./effects.js";
import { UI } from "./ui.js";
import { AudioManager } from "./audio.js";

const STATE = { START: "start", PLAYING: "playing", CHECKPOINT: "checkpoint", GAMEOVER: "gameover", VICTORY: "victory" };

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let width = 0, height = 0, dpr = 1;
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

// --- World objects ---
const world = new World();
const bear = new Bear();
const obstacles = new ObstacleField();
const items = new ItemField();
const fx = new Effects();

const TOTAL_LEN = STAGES.reduce((s, st) => s + st.length, 0);

const g = {
  state: STATE.START,
  lives: CONFIG.startLives,
  maxLives: CONFIG.startLives,
  score: 0,
  stageIndex: 0,
  stageElapsed: 0,
  stageProgress: 0,
  boostTimer: 0,
  checkpointTimer: 0,
  hulkMax: 4,
  flash: 0,
  bear,
};

// Per-stage music — keyed by stage theme. dusk uses the "afternoon" track.
const audio = new AudioManager({
  day: "/audio/day.mp3",
  dusk: "/audio/afternoon.mp3",
  night: "/audio/night.mp3",
});

const ui = new UI({ onPlay: start, onRestart: start });
ui.showStart();

// Mute toggle (button + M key)
const muteBtn = document.getElementById("muteBtn");
function refreshMute() { muteBtn.textContent = audio.enabled ? "🔊" : "🔇"; muteBtn.classList.toggle("off", !audio.enabled); }
muteBtn.addEventListener("click", () => { audio.toggle(); refreshMute(); });
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyM") { audio.toggle(); refreshMute(); }
});

// --- Input ---
const keys = {};
window.addEventListener("keydown", (e) => {
  if (g.state !== STATE.PLAYING) return;
  if (e.code === "ArrowUp" || e.code === "Space" || e.code === "KeyW") {
    e.preventDefault();
    if (!keys.jump) bear.jump();
    keys.jump = true;
  }
  if (e.code === "ArrowDown" || e.code === "KeyS") {
    e.preventDefault();
    bear.setDuck(true);
  }
});
window.addEventListener("keyup", (e) => {
  if (e.code === "ArrowUp" || e.code === "Space" || e.code === "KeyW") keys.jump = false;
  if (e.code === "ArrowDown" || e.code === "KeyS") bear.setDuck(false);
});
// tap / click to jump (mobile + convenience)
canvas.addEventListener("pointerdown", () => { if (g.state === STATE.PLAYING) bear.jump(); });

function completedLength() {
  let s = 0;
  for (let i = 0; i < g.stageIndex; i++) s += STAGES[i].length;
  return s;
}

function start() {
  g.state = STATE.PLAYING;
  g.lives = CONFIG.startLives;
  g.score = 0;
  g.stageIndex = 0;
  g.stageElapsed = 0;
  g.stageProgress = 0;
  g.boostTimer = 0;
  g.flash = 0;
  bear.reset();
  world.reset();
  obstacles.reset();
  items.reset();
  fx.reset();
  const st = STAGES[0];
  world.setTheme(st.theme);
  items.beginStage(st);
  g.hulkMax = st.hulk.duration;
  ui.startGame();
  audio.unlock();      // we're inside the Play-button gesture
  audio.play(st.theme);
}

function enterCheckpointOrFinish() {
  const st = STAGES[g.stageIndex];
  if (g.stageIndex >= STAGES.length - 1) {
    g.state = STATE.VICTORY;
    ui.showVictory(Math.floor(g.score));
    audio.stop();
    return;
  }
  g.state = STATE.CHECKPOINT;
  g.checkpointTimer = CONFIG.checkpointPause;
  obstacles.reset();
  items.reset();
  ui.showBanner(`CHECKPOINT ${st.to}`, "Leaner. Stronger. Keep going →");
}

function advanceStage() {
  g.stageIndex++;
  g.stageElapsed = 0;
  g.stageProgress = 0;
  const st = STAGES[g.stageIndex];
  world.transitionTo(st.theme, CONFIG.skyTransition);
  items.beginStage(st);
  g.hulkMax = st.hulk.duration;
  ui.hideBanner();
  audio.play(st.theme);   // crossfade to the new stage's track
  g.state = STATE.PLAYING;
}

function currentSpeed() {
  const st = STAGES[g.stageIndex] || STAGES[0];
  let sp = CONFIG.baseSpeed + g.stageIndex * CONFIG.speedPerStage;
  sp *= 1 + bear.fitness * 0.18;
  if (g.boostTimer > 0) sp *= CONFIG.boostMultiplier;
  if (bear.hulk) sp *= CONFIG.hulkSpeedMultiplier;
  return sp;
}

function handleCollisions() {
  const bh = bear.hitbox();
  // obstacles
  for (const o of obstacles.items) {
    if (o.smashed > 0) continue;
    if (!aabb(bh, obstacles.hitbox(o))) continue;
    if (bear.hulk) {
      o.smashed = 0.001;
      o.dead = true;
      fx.burst(o.x + o.w / 2, o.y + o.h / 2);
      g.score += CONFIG.smashScore;
      fx.popup(o.x + o.w / 2, o.y, "SMASH!", "#3fd06a");
    } else if (bear.invuln <= 0) {
      g.lives--;
      bear.invuln = CONFIG.invulnAfterHit;
      o.dead = true;
      fx.burst(o.x + o.w / 2, o.y + o.h / 2, "#ff6b6b");
      fx.popup(bear.x, bh.y - 10, "OUCH", "#ff6b6b");
      g.flash = 0.25;
      if (g.lives <= 0) {
        g.state = STATE.GAMEOVER;
        ui.showGameOver(Math.floor(g.score));
        audio.stop();
        return;
      }
    }
  }
  // pickups
  for (const it of items.items) {
    if (it.dead) continue;
    if (!aabb(bh, items.hitbox(it))) continue;
    it.dead = true;
    if (it.kind === "energy") {
      g.boostTimer = CONFIG.boostDuration;
      g.score += CONFIG.energyScore;
      fx.popup(it.x, it.y, "+50 ⚡", "#ffe06a");
    } else {
      bear.startHulk(g.hulkMax);
      fx.burst(it.x, it.y, "#3fd06a");
      fx.popup(it.x, it.y, "HULK BEAR!", "#3fd06a");
    }
  }
}

function update(dt) {
  bear.x = width * CONFIG.bearX;
  bear.groundY = world.groundY(height);

  if (g.state === STATE.PLAYING) {
    const speed = currentSpeed();
    const distProgress = (completedLength() + g.stageElapsed) / TOTAL_LEN;

    world.update(dt, speed, width, height);
    bear.update(dt, speed, distProgress);
    obstacles.update(dt, speed, STAGES[g.stageIndex], width, world.groundY(height));
    items.update(dt, speed, width, world.groundY(height));
    fx.update(dt);

    if (g.boostTimer > 0) g.boostTimer -= dt;
    if (g.flash > 0) g.flash -= dt;

    g.score += dt * CONFIG.distanceScorePerSec * (bear.hulk ? 2 : 1);
    g.stageElapsed += dt;
    g.stageProgress = g.stageElapsed / STAGES[g.stageIndex].length;

    handleCollisions();

    if (g.state === STATE.PLAYING && g.stageElapsed >= STAGES[g.stageIndex].length) {
      enterCheckpointOrFinish();
    }
  } else if (g.state === STATE.CHECKPOINT) {
    // gentle coast: keep the world moving, bear keeps running, no hazards
    const speed = CONFIG.baseSpeed * 0.6;
    world.update(dt, speed, width, height);
    bear.update(dt, speed, (completedLength() + g.stageElapsed) / TOTAL_LEN);
    fx.update(dt);
    g.checkpointTimer -= dt;
    if (g.checkpointTimer <= 0) advanceStage();
  } else {
    // START / GAMEOVER / VICTORY: idle world animation behind the overlay
    world.update(dt, CONFIG.baseSpeed * 0.35, width, height);
    bear.update(dt, CONFIG.baseSpeed * 0.35, bear.fitnessTarget);
    fx.update(dt);
  }

  if (g.state === STATE.PLAYING || g.state === STATE.CHECKPOINT) ui.updateHUD(g);
}

function render(time) {
  const groundY = world.draw(ctx, width, height, time);
  bear.groundY = groundY;
  bear.x = width * CONFIG.bearX;

  obstacles.draw(ctx);
  items.draw(ctx, time);
  bear.draw(ctx, time);
  fx.draw(ctx);

  // HULK screen tint
  if (bear.hulk) {
    ctx.fillStyle = `rgba(63,208,106,${0.06 + Math.sin(time * 20) * 0.04})`;
    ctx.fillRect(0, 0, width, height);
  }
  // hit flash
  if (g.flash > 0) {
    ctx.fillStyle = `rgba(255,40,40,${g.flash})`;
    ctx.fillRect(0, 0, width, height);
  }
}

// Debug/verification hook (harmless in production).
window.IRONBEAR = { g, STAGES, start, bear, world, obstacles, items, STATE, audio };

let last = performance.now() / 1000;
function frame(now) {
  const t = now / 1000;
  let dt = t - last;
  last = t;
  if (dt > CONFIG.maxDelta) dt = CONFIG.maxDelta; // clamp: no tunneling on long frames
  update(dt);
  render(t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

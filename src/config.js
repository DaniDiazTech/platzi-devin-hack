// IRONBEAR — central tunables. All gameplay numbers live here.
// Units: world space is CSS pixels; the ground baseline is anchored to canvas height.

export const CONFIG = {
  // --- Loop ---
  maxDelta: 1 / 30, // clamp dt so a long/blurred frame can't tunnel the bear

  // --- World motion ---
  baseSpeed: 520, // px/s the world scrolls at fitness 0 / stage 1
  speedPerStage: 70, // added base speed each later stage
  boostMultiplier: 1.55, // energy pickup speed multiplier
  boostDuration: 2.4, // seconds
  hulkSpeedMultiplier: 1.7,

  // --- Bear physics ---
  gravity: 2600, // px/s^2
  jumpVelocity: -1050, // px/s (negative = up)
  coyoteTime: 0.08, // grace after leaving ground
  jumpBuffer: 0.1, // grace if jump pressed just before landing

  // Bear placement & size (CSS px). Drawn BIG so transformation reads clearly.
  bearX: 0.22, // fraction of canvas width
  bearBaseScale: 1.0,
  bearWidth: 172, // nominal draw box
  bearHeight: 188,
  duckHeightFactor: 0.6, // hitbox/draw squash while ducking

  // --- Fitness transformation ---
  // fitness 0 -> chubby, 1 -> ripped IRONBEAR. Driven by total run progress.
  fitnessSmoothing: 3.5, // how fast the visible morph eases toward target

  // --- Scoring ---
  distanceScorePerSec: 10,
  energyScore: 50,
  smashScore: 15,

  // --- Lives ---
  startLives: 3,
  invulnAfterHit: 1.3, // seconds of i-frames + blink after a non-fatal hit

  // --- Checkpoint ---
  checkpointPause: 1.4, // seconds the banner holds before resuming
  skyTransition: 1.4, // seconds to lerp sky between stages

  // --- HULK ---
  hulkScale: 2.0,
  hulkFlashHz: 14,
};

// Bear body params at the two extremes of the fitness axis.
// bear.js interpolates between these by the eased fitness value.
export const BEAR_FORM = {
  chubby: {
    belly: 1.0, // belly bulge multiplier
    shoulder: 0.78, // shoulder/chest width
    limb: 1.0, // limb thickness
    lean: 0.0, // forward posture lean (radians-ish)
    bob: 0.18, // vertical run bob amount
  },
  ripped: {
    belly: 0.34,
    shoulder: 1.25,
    limb: 0.82,
    lean: 0.22,
    bob: 0.10,
  },
};

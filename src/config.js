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
  duckHeightFactor: 0.55, // hitbox height multiplier at full crouch
  duckEase: 16, // how fast the crouch eases in/out (per second)

  // --- Fitness transformation ---
  // fitness 0 -> fat, ~0.35 -> normal, >=0.7 -> muscular. Driven by run progress.
  fitnessSmoothing: 3.5, // how fast the visible morph eases toward target

  // --- Scoring ---
  distanceScorePerSec: 10,
  energyScore: 50,
  smashScore: 15,

  // --- Lives ---
  startLives: 3,
  invulnAfterHit: 1.3, // seconds of i-frames + blink after a non-fatal hit

  // --- Checkpoint ---
  checkpointPause: 2.6, // seconds the workout animation + banner holds
  checkpointFitness: [0.36, 0.74], // fitness the bear reaches after checkpoint 1, 2
  skyTransition: 1.6, // seconds to lerp sky between stages

  // --- HULK ---
  hulkScale: 2.0,
  hulkFlashHz: 14,
};

// Bear body keyframes along the fitness axis, matching the reference line-up:
// FAT -> NORMAL -> MUSCULAR (brown). The green steroid beast (HULK) is a
// separate override applied on top while the power-up is active.
// Coordinate space: feet at y=0, "up" is negative y. Units are pre-scale px.
// at = fitness breakpoint this keyframe is anchored to.
export const BEAR_FORMS = [
  {
    at: 0.0, // GORDO — round, bottom-heavy, hunched, tiny limbs
    shoulderW: 38, bellyW: 62, hipW: 50,
    shoulderY: -132, hipY: -30, legLen: 30, legW: 22,
    armW: 19, armLen: 30, headR: 33, neck: 6, snout: 17,
    muscle: 0, lean: 0.04, bob: 0.14,
    fur: "#4a3120", bell: "#5c3f29",
  },
  {
    at: 0.35, // NORMAL — upright classic bear
    shoulderW: 44, bellyW: 43, hipW: 41,
    shoulderY: -150, hipY: -46, legLen: 46, legW: 19,
    armW: 16, armLen: 42, headR: 27, neck: 12, snout: 15,
    muscle: 0.16, lean: 0.12, bob: 0.12,
    fur: "#553823", bell: "#6a482c",
  },
  {
    at: 0.72, // MUSCULOSO — V-taper, abs, thick arms
    shoulderW: 70, bellyW: 30, hipW: 38,
    shoulderY: -162, hipY: -50, legLen: 50, legW: 22,
    armW: 23, armLen: 48, headR: 25, neck: 16, snout: 14,
    muscle: 0.96, lean: 0.18, bob: 0.10,
    fur: "#6b4a2e", bell: "#80592f",
  },
  {
    at: 1.0, // MUSCULOSO peak (slightly bigger)
    shoulderW: 76, bellyW: 29, hipW: 38,
    shoulderY: -166, hipY: -52, legLen: 52, legW: 23,
    armW: 25, armLen: 50, headR: 25, neck: 17, snout: 14,
    muscle: 1, lean: 0.2, bob: 0.09,
    fur: "#74502f", bell: "#8a6033",
  },
];

// ESTEROIDES — green spiky beast, applied while HULK power-up is active.
export const HULK_FORM = {
  shoulderW: 92, bellyW: 30, hipW: 42,
  shoulderY: -170, hipY: -52, legLen: 52, legW: 28,
  armW: 31, armLen: 54, headR: 26, neck: 18, snout: 14,
  muscle: 1, lean: 0.22, bob: 0.12,
  fur: "#39a653", bell: "#4fd070", spiky: 1,
};

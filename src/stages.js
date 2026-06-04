// The 3 stages. Same engine, different parameters.
// length = seconds of running before the checkpoint/finish.
// spawnEvery = base seconds between spawns (jittered). lower = harder.
// flyChance = probability a spawn is a HIGH obstacle (duck under) vs ground (jump over).
// hulk = { count, duration } steroid availability for the stage.

export const STAGES = [
  {
    id: "A",
    name: "STAGE 1 · JUNK FOOD",
    from: "A",
    to: "B",
    theme: "day",
    length: 28,
    spawnEvery: 1.55,
    flyChance: 0.28,
    obstacles: [
      { glyph: "🍔", w: 64, h: 58 },
      { glyph: "🍕", w: 66, h: 60 },
      { glyph: "🌭", w: 66, h: 50 },
      { glyph: "🍟", w: 58, h: 62 },
    ],
    hulk: { count: 1, duration: 4 },
  },
  {
    id: "B",
    name: "STAGE 2 · SWEETS",
    from: "B",
    to: "C",
    theme: "dusk",
    length: 30,
    spawnEvery: 1.25,
    flyChance: 0.36,
    obstacles: [
      { glyph: "🍰", w: 62, h: 58 },
      { glyph: "🍩", w: 60, h: 58 },
      { glyph: "🍦", w: 56, h: 66 },
      { glyph: "🧁", w: 58, h: 62 },
    ],
    hulk: { count: 2, duration: 5 },
  },
  {
    id: "C",
    name: "STAGE 3 · LAST CALL",
    from: "C",
    to: "D",
    theme: "night",
    length: 32,
    spawnEvery: 1.0,
    flyChance: 0.42,
    obstacles: [
      { glyph: "🍺", w: 58, h: 64 },
      { glyph: "🍷", w: 56, h: 66 },
      { glyph: "🍾", w: 52, h: 70 },
      { glyph: "🍸", w: 58, h: 64 },
    ],
    hulk: { count: 3, duration: 6 },
  },
];

export const ENERGY_GLYPH = "⚡";
export const STEROID_GLYPH = "💉";

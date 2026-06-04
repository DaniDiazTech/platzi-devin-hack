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
      { id: "burger", w: 70, h: 64 },
      { id: "pizza", w: 70, h: 66 },
      { id: "hotdog", w: 74, h: 56 },
      { id: "fries", w: 64, h: 70 },
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
      { id: "cake", w: 68, h: 62 },
      { id: "donut", w: 66, h: 66 },
      { id: "icecream", w: 60, h: 72 },
      { id: "cupcake", w: 64, h: 66 },
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
      { id: "beer", w: 64, h: 70 },
      { id: "wine", w: 60, h: 72 },
      { id: "bottle", w: 56, h: 74 },
      { id: "cocktail", w: 64, h: 68 },
    ],
    hulk: { count: 3, duration: 6 },
  },
];

export const ENERGY_GLYPH = "⚡";
export const STEROID_GLYPH = "💉";

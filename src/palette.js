// IronBear brand palette + Alto-style per-stage sky gradients.
export const PALETTE = {
  primary: 0x4a90d9, // cobalt — action color
  gold: 0xd4b84a,
  surfaceBase: 0x060d14,
  surface2: 0x111f2d,
  surface3: 0x182838,
  furNavy: 0x0c1a29,
  textPrimary: 0xe4e0d8,
  textSecondary: 0x9fb0c0,
  success: 0x2e9d6e,
};

export const CSS = {
  primary: "#4A90D9",
  gold: "#D4B84A",
  surfaceBase: "#060D14",
  surface2: "#111F2D",
  surface3: "#182838",
  textPrimary: "#E4E0D8",
  textSecondary: "#9FB0C0",
  hulk: "#3fd06a",
};

// Helper: blend two hex colors "#rrggbb" by t in [0,1].
export function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`;
}

// Each "theme" is an Alto-style palette: sky gradient stops (top->bottom),
// silhouette layer colors (far->near), the ground color, celestial body, and particle tint.
export const THEMES = {
  day: {
    sky: ["#5aa4e6", "#8ec7f3", "#d8edfc"],
    far: "#8fb6da",
    mid: "#5d89b4",
    near: "#3a5d83",
    ground: "#2c4a68",
    body: "#fff6d8", // sun
    bodyGlow: "rgba(255,246,216,0.6)",
    particle: "rgba(255,255,255,0.6)", // light pollen/snow
    star: false,
  },
  dusk: {
    sky: ["#48386b", "#b65a76", "#f0a25a"],
    far: "#7a5278",
    mid: "#583a5e",
    near: "#3a2742",
    ground: "#2a1c30",
    body: "#ffd9a0", // low sun
    bodyGlow: "rgba(255,200,140,0.6)",
    particle: "rgba(255,220,190,0.5)",
    star: false,
  },
  night: {
    sky: ["#0a1326", "#16223f", "#2b3358"],
    far: "#1e2a47",
    mid: "#141d33",
    near: "#0c1322",
    ground: "#080d18",
    body: "#eef2ff", // moon
    bodyGlow: "rgba(220,230,255,0.5)",
    particle: "rgba(200,215,255,0.5)",
    star: true,
  },
};

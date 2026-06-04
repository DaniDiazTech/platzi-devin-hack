// Bold, flat, solid-shape obstacle icons drawn in a 100x100 design box.
// Each has a clear silhouette + dark outline so it never reads as transparent.
const OUTLINE = "#171b24";

export function drawIcon(ctx, id, x, y, w, h) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(w / 100, h / 100);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = 5;
  ctx.strokeStyle = OUTLINE;
  (ICONS[id] || ICONS.burger)(ctx);
  ctx.restore();
}

// fill+stroke helper
function fs(ctx, color) { ctx.fillStyle = color; ctx.fill(); ctx.stroke(); }
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function ell(ctx, cx, cy, rx, ry) { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); }

const ICONS = {
  // ---------------- JUNK FOOD ----------------
  burger(ctx) {
    // bottom bun
    ctx.beginPath(); ctx.moveTo(12, 74); ctx.lineTo(88, 74);
    ctx.quadraticCurveTo(92, 86, 50, 86); ctx.quadraticCurveTo(8, 86, 12, 74); fs(ctx, "#e0a657");
    // patty
    rr(ctx, 12, 60, 76, 14, 7); fs(ctx, "#6b3b22");
    // lettuce
    ctx.beginPath();
    ctx.moveTo(10, 60);
    for (let i = 0; i <= 8; i++) ctx.lineTo(10 + i * 10, i % 2 ? 54 : 62);
    ctx.lineTo(90, 60); ctx.closePath(); fs(ctx, "#5fae4a");
    // top bun
    ctx.beginPath(); ctx.moveTo(10, 50); ctx.quadraticCurveTo(50, 14, 90, 50); ctx.closePath(); fs(ctx, "#e0a657");
    // sesame
    ctx.fillStyle = "#fff4d8";
    for (const [sx, sy] of [[38, 40], [54, 34], [66, 42], [46, 30]]) { ell(ctx, sx, sy, 3, 4.5); ctx.fill(); }
  },
  pizza(ctx) {
    // slice
    ctx.beginPath(); ctx.moveTo(50, 14); ctx.lineTo(86, 84); ctx.lineTo(14, 84); ctx.closePath(); fs(ctx, "#f2c14a");
    // crust
    ctx.beginPath(); ctx.moveTo(14, 84); ctx.quadraticCurveTo(50, 96, 86, 84);
    ctx.lineTo(80, 76); ctx.quadraticCurveTo(50, 86, 20, 76); ctx.closePath(); fs(ctx, "#d98b3a");
    // pepperoni
    ctx.fillStyle = "#c33b2e"; ctx.strokeStyle = OUTLINE;
    for (const [px, py] of [[50, 44], [38, 64], [62, 64]]) { ell(ctx, px, py, 7, 7); fs(ctx, "#c33b2e"); }
  },
  hotdog(ctx) {
    rr(ctx, 10, 40, 80, 26, 13); fs(ctx, "#e7b15c");        // bun
    rr(ctx, 16, 36, 68, 18, 9); fs(ctx, "#b5402f");          // sausage
    ctx.strokeStyle = "#f6d33a"; ctx.lineWidth = 4;          // mustard
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) ctx.lineTo(22 + i * 9, i % 2 ? 40 : 50);
    ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = OUTLINE;
  },
  fries(ctx) {
    // fries sticking up
    ctx.fillStyle = "#f4c542";
    for (const fx of [30, 40, 50, 60, 70]) { rr(ctx, fx, 18 + (fx % 20), 8, 44, 3); fs(ctx, "#f4c542"); }
    // carton
    ctx.beginPath(); ctx.moveTo(22, 50); ctx.lineTo(78, 50); ctx.lineTo(72, 88); ctx.lineTo(28, 88); ctx.closePath(); fs(ctx, "#d8453a");
    ctx.fillStyle = "#fff"; rr(ctx, 40, 58, 20, 10, 2); fs(ctx, "#fff");
  },

  // ---------------- SWEETS ----------------
  cake(ctx) {
    // slice
    ctx.beginPath(); ctx.moveTo(18, 84); ctx.lineTo(18, 44); ctx.lineTo(82, 30); ctx.lineTo(82, 70); ctx.closePath(); fs(ctx, "#f6d9a8");
    // filling stripe
    ctx.beginPath(); ctx.moveTo(18, 60); ctx.lineTo(82, 46); ctx.lineTo(82, 56); ctx.lineTo(18, 70); ctx.closePath(); fs(ctx, "#c2476a");
    // frosting top
    ctx.beginPath(); ctx.moveTo(18, 44); ctx.lineTo(82, 30); ctx.lineTo(82, 22); ctx.lineTo(18, 36); ctx.closePath(); fs(ctx, "#f7f1e6");
    // cherry
    ell(ctx, 50, 24, 7, 7); fs(ctx, "#d23b3b");
  },
  donut(ctx) {
    ctx.beginPath();
    ctx.arc(50, 52, 36, 0, Math.PI * 2);
    ctx.arc(50, 52, 13, 0, Math.PI * 2);
    ctx.fillStyle = "#7a4a2c"; ctx.fill("evenodd"); ctx.stroke();
    // pink glaze
    ctx.beginPath();
    ctx.arc(50, 48, 36, Math.PI, 0);
    ctx.arc(50, 48, 13, 0, Math.PI, true);
    ctx.closePath(); fs(ctx, "#f48fb1");
    // sprinkles
    const sp = [["#fff", 38, 40, 0.6], ["#6cc1ff", 58, 36, -0.5], ["#ffe14d", 64, 52, 0.3], ["#7be07b", 40, 56, -0.4]];
    ctx.lineWidth = 4;
    for (const [c, sx, sy, a] of sp) { ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a) * 8, sy + Math.sin(a) * 8); ctx.stroke(); }
    ctx.lineWidth = 5; ctx.strokeStyle = OUTLINE;
  },
  icecream(ctx) {
    // cone
    ctx.beginPath(); ctx.moveTo(34, 52); ctx.lineTo(66, 52); ctx.lineTo(50, 90); ctx.closePath(); fs(ctx, "#d8a35a");
    // scoops
    ell(ctx, 40, 46, 16, 15); fs(ctx, "#f6b6c8");
    ell(ctx, 60, 46, 16, 15); fs(ctx, "#fff3e0");
    ell(ctx, 50, 34, 17, 16); fs(ctx, "#9bd6c4");
    ell(ctx, 50, 22, 4, 4); fs(ctx, "#d23b3b"); // cherry
  },
  cupcake(ctx) {
    // wrapper
    ctx.beginPath(); ctx.moveTo(26, 52); ctx.lineTo(74, 52); ctx.lineTo(66, 88); ctx.lineTo(34, 88); ctx.closePath(); fs(ctx, "#e08a3c");
    // frosting swirl
    ctx.beginPath();
    ctx.moveTo(24, 52);
    ctx.quadraticCurveTo(28, 24, 50, 22);
    ctx.quadraticCurveTo(72, 24, 76, 52);
    ctx.closePath(); fs(ctx, "#f6c1d6");
    ell(ctx, 50, 18, 5, 5); fs(ctx, "#d23b3b");
  },

  // ---------------- ALCOHOL ----------------
  beer(ctx) {
    rr(ctx, 28, 26, 38, 60, 6); fs(ctx, "#f4b942");      // mug + amber
    ctx.fillStyle = "#fdfdfd"; rr(ctx, 28, 22, 38, 16, 6); fs(ctx, "#fdfdfd"); // foam
    ctx.beginPath(); ctx.moveTo(66, 38); ctx.quadraticCurveTo(86, 42, 86, 56); ctx.quadraticCurveTo(86, 70, 66, 70); // handle
    ctx.lineWidth = 7; ctx.stroke(); ctx.lineWidth = 5;
  },
  wine(ctx) {
    ctx.beginPath(); ctx.moveTo(34, 20); ctx.lineTo(66, 20);
    ctx.quadraticCurveTo(70, 48, 50, 54); ctx.quadraticCurveTo(30, 48, 34, 20); ctx.closePath(); fs(ctx, "#f0ead8"); // bowl
    // wine
    ctx.beginPath(); ctx.moveTo(37, 32); ctx.lineTo(63, 32); ctx.quadraticCurveTo(66, 46, 50, 52); ctx.quadraticCurveTo(34, 46, 37, 32); ctx.closePath(); fs(ctx, "#8e2440");
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(50, 54); ctx.lineTo(50, 80); ctx.stroke(); // stem
    ctx.beginPath(); ctx.moveTo(34, 84); ctx.lineTo(66, 84); ctx.stroke(); // base
  },
  bottle(ctx) {
    rr(ctx, 40, 12, 20, 24, 4); fs(ctx, "#2f6b3a");        // neck
    ctx.beginPath(); ctx.moveTo(40, 34); ctx.lineTo(60, 34);
    ctx.lineTo(64, 50); ctx.lineTo(64, 86); ctx.quadraticCurveTo(64, 90, 60, 90);
    ctx.lineTo(40, 90); ctx.quadraticCurveTo(36, 90, 36, 86); ctx.lineTo(36, 50); ctx.closePath(); fs(ctx, "#2f6b3a");
    ctx.fillStyle = "#efe6cf"; rr(ctx, 38, 58, 24, 22, 3); fs(ctx, "#efe6cf"); // label
  },
  cocktail(ctx) {
    ctx.beginPath(); ctx.moveTo(22, 30); ctx.lineTo(78, 30); ctx.lineTo(50, 58); ctx.closePath(); fs(ctx, "#dff0f5"); // glass
    ctx.beginPath(); ctx.moveTo(30, 36); ctx.lineTo(70, 36); ctx.lineTo(50, 54); ctx.closePath(); fs(ctx, "#e85d8a"); // drink
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(50, 58); ctx.lineTo(50, 84); ctx.stroke(); // stem
    ctx.beginPath(); ctx.moveTo(34, 86); ctx.lineTo(66, 86); ctx.stroke(); // base
    ctx.beginPath(); ctx.moveTo(58, 30); ctx.lineTo(72, 16); ctx.stroke(); // pick
    ell(ctx, 72, 16, 5, 5); fs(ctx, "#5fae4a"); // olive
  },
};

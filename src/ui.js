// DOM overlay layer: live HUD + start / checkpoint / gameover / victory screens.
import { STAGES } from "./stages.js";

const $ = (id) => document.getElementById(id);

export class UI {
  constructor({ onPlay, onRestart }) {
    this.onPlay = onPlay;
    this.onRestart = onRestart;

    this.hud = $("hud");
    this.livesEl = $("lives");
    this.scoreEl = $("score");
    this.stageEl = $("stage");
    this.progFill = $("progFill");
    this.hulkBar = $("hulkBar");
    this.hulkFill = $("hulkFill");

    this.overlay = $("overlay");
    this.screenTitle = $("screenTitle");
    this.screenBody = $("screenBody");
    this.screenBtn = $("screenBtn");
    this.banner = $("banner");

    this.screenBtn.addEventListener("click", () => this._btnAction());
    // keyboard convenience: Enter / Space on a screen
    window.addEventListener("keydown", (e) => {
      if (this.overlay.classList.contains("show") &&
          (e.code === "Enter" || e.code === "Space")) {
        e.preventDefault();
        this._btnAction();
      }
    });
  }

  _btnAction() {
    if (this._mode === "start") this.onPlay();
    else this.onRestart();
  }

  showStart() {
    this._mode = "start";
    this.hud.classList.remove("show");
    this.banner.classList.remove("show");
    this.screenTitle.innerHTML = `IRON<span class="accent">BEAR</span>`;
    this.screenBody.innerHTML =
      `Run from couch to <b>shredded</b>. Dodge the junk.<br>` +
      `<span class="keys"><kbd>↑</kbd> / <kbd>Space</kbd> jump &nbsp;·&nbsp; <kbd>↓</kbd> duck</span><br>` +
      `<span class="keys">Mobile: swipe <kbd>↑</kbd> jump &nbsp;·&nbsp; swipe <kbd>↓</kbd> duck</span><br>` +
      `Grab <span class="acc-energy">⚡</span> for speed · <span class="acc-steroid">💉</span> for <b>HULK BEAR</b>`;
    this.screenBtn.textContent = "▶  PLAY";
    this.overlay.classList.add("show");
    this.overlay.classList.remove("victory", "gameover");
  }

  startGame() {
    this.overlay.classList.remove("show");
    this.hud.classList.add("show");
  }

  showBanner(text, sub) {
    this.banner.innerHTML = `<div class="banner-main">${text}</div><div class="banner-sub">${sub}</div>`;
    this.banner.classList.add("show");
  }
  hideBanner() { this.banner.classList.remove("show"); }

  showGameOver(score) {
    this._mode = "over";
    this.hud.classList.remove("show");
    this.overlay.classList.add("show", "gameover");
    this.overlay.classList.remove("victory");
    this.screenTitle.innerHTML = `GAME OVER`;
    this.screenBody.innerHTML = `You hit the junk one too many times.<br><span class="big">${score}</span><span class="lbl">FINAL SCORE</span>`;
    this.screenBtn.textContent = "↻  TRY AGAIN";
  }

  showVictory(score) {
    this._mode = "over";
    this.hud.classList.remove("show");
    this.overlay.classList.add("show", "victory");
    this.overlay.classList.remove("gameover");
    this.screenTitle.innerHTML = `YOU'RE <span class="accent">SHREDDED</span> 💪`;
    this.screenBody.innerHTML = `IRONBEAR reached the summit, lean and unstoppable.<br><span class="big">${score}</span><span class="lbl">TOTAL SCORE</span>`;
    this.screenBtn.textContent = "↻  RUN AGAIN";
  }

  updateHUD(g) {
    // lives
    let hearts = "";
    for (let i = 0; i < g.maxLives; i++) hearts += i < g.lives ? "🐻" : "<span class='dead'>🐻</span>";
    this.livesEl.innerHTML = hearts;
    this.scoreEl.textContent = Math.floor(g.score).toLocaleString();
    const st = STAGES[g.stageIndex];
    this.stageEl.textContent = st ? st.name : "";
    this.progFill.style.width = `${Math.min(100, g.stageProgress * 100).toFixed(1)}%`;

    if (g.bear.hulk) {
      this.hulkBar.classList.add("show");
      this.hulkFill.style.width = `${Math.max(0, (g.bear.hulkTimer / g.hulkMax) * 100)}%`;
    } else {
      this.hulkBar.classList.remove("show");
    }
  }
}

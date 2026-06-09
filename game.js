const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const levelLabel = document.getElementById("levelLabel");
const statusLabel = document.getElementById("statusLabel");
const ammoLabel = document.getElementById("ammoLabel");
const scoreLabel = document.getElementById("scoreLabel");
const overlay = document.getElementById("overlay");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const nextButton = document.getElementById("nextButton");

const world = { w: 1280, h: 720, scale: 1, ox: 0, oy: 0, ground: 625 };
const gravity = 980;
const sling = { x: 180, y: 500, maxPull: 115 };

const levels = [
  {
    ammo: 3,
    cans: [{ x: 900, y: 562 }],
    blocks: [
      { x: 820, y: 585, w: 32, h: 80, hp: 50, mat: "wood" },
      { x: 935, y: 585, w: 32, h: 80, hp: 50, mat: "wood" },
      { x: 877, y: 525, w: 160, h: 28, hp: 45, mat: "glass" },
    ],
  },
  {
    ammo: 4,
    cans: [
      { x: 875, y: 562 },
      { x: 1015, y: 562 },
    ],
    blocks: [
      { x: 820, y: 585, w: 36, h: 80, hp: 60, mat: "wood" },
      { x: 930, y: 585, w: 36, h: 80, hp: 60, mat: "wood" },
      { x: 1040, y: 585, w: 36, h: 80, hp: 60, mat: "wood" },
      { x: 930, y: 523, w: 250, h: 28, hp: 70, mat: "stone" },
    ],
  },
  {
    ammo: 4,
    cans: [
      { x: 900, y: 562 },
      { x: 980, y: 490 },
      { x: 1060, y: 562 },
    ],
    blocks: [
      { x: 860, y: 590, w: 34, h: 70, hp: 55, mat: "wood" },
      { x: 980, y: 590, w: 34, h: 70, hp: 55, mat: "wood" },
      { x: 1100, y: 590, w: 34, h: 70, hp: 55, mat: "wood" },
      { x: 980, y: 528, w: 280, h: 28, hp: 45, mat: "glass" },
      { x: 980, y: 455, w: 170, h: 28, hp: 75, mat: "stone" },
      { x: 920, y: 490, w: 28, h: 72, hp: 55, mat: "wood" },
      { x: 1040, y: 490, w: 28, h: 72, hp: 55, mat: "wood" },
    ],
  },
];

let state;
let pointer = null;
let lastTime = performance.now();

function resetLevel(index = 0) {
  const src = levels[index % levels.length];
  state = {
    level: index % levels.length,
    ammo: src.ammo,
    score: 0,
    phase: "aim",
    bean: makeBean(),
    cans: src.cans.map((c) => ({ ...c, r: 28, alive: true, vx: 0, vy: 0 })),
    blocks: src.blocks.map((b) => ({ ...b, alive: true, vx: 0, vy: 0 })),
    particles: [],
  };
  overlay.classList.remove("show");
  nextButton.disabled = true;
  updateHud("拖拽弹弓发射");
}

function makeBean() {
  return { x: sling.x, y: sling.y, r: 22, vx: 0, vy: 0, flying: false, rested: false };
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  world.scale = Math.min(innerWidth / world.w, innerHeight / world.h);
  world.ox = (innerWidth - world.w * world.scale) / 2;
  world.oy = (innerHeight - world.h * world.scale) / 2;
}

function screenToWorld(e) {
  return {
    x: (e.clientX - world.ox) / world.scale,
    y: (e.clientY - world.oy) / world.scale,
  };
}

function updateHud(text) {
  levelLabel.textContent = `第 ${state.level + 1} 关`;
  statusLabel.textContent = text;
  ammoLabel.textContent = `豆豆 x${state.ammo}`;
  scoreLabel.textContent = `${state.score}`;
}

function launchBean() {
  if (!pointer || state.phase !== "aim" || state.ammo <= 0) return;
  const bean = state.bean;
  const dx = sling.x - bean.x;
  const dy = sling.y - bean.y;
  if (Math.hypot(dx, dy) < 12) return;
  bean.vx = dx * 7.6;
  bean.vy = dy * 7.6;
  bean.flying = true;
  state.ammo -= 1;
  state.phase = "fly";
  updateHud("好球，看看会撞到哪里");
}

function collideCircleRect(circle, rect) {
  const left = rect.x - rect.w / 2;
  const right = rect.x + rect.w / 2;
  const top = rect.y - rect.h / 2;
  const bottom = rect.y + rect.h / 2;
  const cx = Math.max(left, Math.min(circle.x, right));
  const cy = Math.max(top, Math.min(circle.y, bottom));
  const dx = circle.x - cx;
  const dy = circle.y - cy;
  return dx * dx + dy * dy < circle.r * circle.r;
}

function hitAt(x, y, color) {
  for (let i = 0; i < 12; i++) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 260,
      vy: -Math.random() * 280,
      life: 0.5 + Math.random() * 0.35,
      color,
    });
  }
}

function update(dt) {
  if (!state || state.phase === "start") return;
  const bean = state.bean;
  if (bean.flying) {
    bean.vy += gravity * dt;
    bean.x += bean.vx * dt;
    bean.y += bean.vy * dt;
    bean.vx *= 0.996;
    bean.vy *= 0.996;

    if (bean.y + bean.r > world.ground) {
      bean.y = world.ground - bean.r;
      bean.vy *= -0.36;
      bean.vx *= 0.72;
      if (Math.abs(bean.vy) < 70 && Math.abs(bean.vx) < 55) bean.rested = true;
    }

    for (const block of state.blocks) {
      if (!block.alive || !collideCircleRect(bean, block)) continue;
      const power = Math.hypot(bean.vx, bean.vy);
      block.hp -= power * 0.08;
      bean.vx *= -0.34;
      bean.vy *= 0.72;
      state.score += 15;
      hitAt(bean.x, bean.y, block.mat === "stone" ? "#8793a0" : "#c47a3c");
      if (block.hp <= 0) {
        block.alive = false;
        state.score += 150;
        hitAt(block.x, block.y, "#f6c85f");
      }
    }

    for (const can of state.cans) {
      if (!can.alive) continue;
      const d = Math.hypot(bean.x - can.x, bean.y - can.y);
      if (d < bean.r + can.r) {
        const power = Math.hypot(bean.vx, bean.vy);
        if (power > 120) {
          can.alive = false;
          state.score += 500;
          hitAt(can.x, can.y, "#79c943");
        }
        bean.vx *= -0.45;
        bean.vy *= 0.8;
      }
    }

    if (bean.x > world.w + 120 || bean.x < -120 || bean.y > world.h + 160 || bean.rested) {
      if (state.cans.every((c) => !c.alive)) return winLevel();
      if (state.ammo <= 0) return loseLevel();
      state.bean = makeBean();
      state.phase = "aim";
      updateHud("继续，堡垒已经松了");
    }
  }

  for (const p of state.particles) {
    p.vy += gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);

  for (const can of state.cans) {
    if (!can.alive) continue;
    const support = state.blocks.some((b) => b.alive && Math.abs(b.x - can.x) < b.w / 2 + can.r && b.y < can.y && Math.abs(b.y - can.y) < 84);
    if (!support && can.y + can.r < world.ground) {
      can.vy += gravity * dt;
      can.y += can.vy * dt;
    }
    if (can.y + can.r >= world.ground) {
      can.y = world.ground - can.r;
      can.vy = 0;
    }
  }
}

function winLevel() {
  state.score += state.ammo * 800;
  state.phase = "done";
  state.outcome = "win";
  nextButton.disabled = false;
  showOverlay("过关！", `本关得分 ${state.score}，剩余豆豆 ${state.ammo}。`, "继续挑战");
  updateHud("坏罐头全倒下了");
}

function loseLevel() {
  state.phase = "done";
  state.outcome = "lose";
  showOverlay("再来一次", "角度已经很接近了，换个落点试试。", "重新开始");
  updateHud("豆豆用完了");
}

function showOverlay(title, text, button) {
  overlay.querySelector("h1").textContent = title;
  overlay.querySelector("p").textContent = text;
  startButton.textContent = button;
  overlay.classList.add("show");
}

function draw() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  ctx.save();
  ctx.translate(world.ox, world.oy);
  ctx.scale(world.scale, world.scale);

  drawBackground();
  drawSling();
  drawBlocks();
  drawCans();
  drawBean();
  drawParticles();

  ctx.restore();
}

function drawBackground() {
  ctx.fillStyle = "#8ad16f";
  ctx.fillRect(0, world.ground, world.w, world.h - world.ground);
  ctx.fillStyle = "#6ab654";
  ctx.fillRect(0, world.ground + 22, world.w, 20);
  ctx.fillStyle = "#ffffff88";
  cloud(330, 150, 1.1);
  cloud(780, 100, 0.9);
}

function cloud(x, y, s) {
  ctx.beginPath();
  ctx.arc(x, y, 34 * s, 0, Math.PI * 2);
  ctx.arc(x + 42 * s, y - 10 * s, 44 * s, 0, Math.PI * 2);
  ctx.arc(x + 92 * s, y, 32 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawSling() {
  ctx.lineCap = "round";
  ctx.strokeStyle = "#6b3b22";
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(sling.x - 28, sling.y + 98);
  ctx.lineTo(sling.x - 8, sling.y + 8);
  ctx.moveTo(sling.x + 28, sling.y + 98);
  ctx.lineTo(sling.x + 8, sling.y + 8);
  ctx.stroke();

  if (state.phase === "aim") {
    ctx.strokeStyle = "#3d2530";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(sling.x - 10, sling.y + 14);
    ctx.lineTo(state.bean.x, state.bean.y);
    ctx.lineTo(sling.x + 10, sling.y + 14);
    ctx.stroke();
  }
}

function drawBean() {
  const b = state.bean;
  ctx.fillStyle = "#e84535";
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(b.x + 8, b.y - 8, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawBlocks() {
  for (const b of state.blocks) {
    if (!b.alive) continue;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = b.mat === "stone" ? "#8793a0" : b.mat === "glass" ? "#6ed7e8" : "#bb7436";
    ctx.strokeStyle = "#203040";
    ctx.lineWidth = 3;
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.restore();
  }
}

function drawCans() {
  for (const c of state.cans) {
    if (!c.alive) continue;
    ctx.fillStyle = "#7cc64b";
    ctx.strokeStyle = "#27411f";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(c.x - 26, c.y - 30, 52, 60, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#172033";
    ctx.beginPath();
    ctx.arc(c.x - 10, c.y - 8, 4, 0, Math.PI * 2);
    ctx.arc(c.x + 10, c.y - 8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(c.x - 12, c.y + 10, 24, 4);
  }
}

function drawParticles() {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

canvas.addEventListener("pointerdown", (e) => {
  if (state.phase !== "aim") return;
  const p = screenToWorld(e);
  if (Math.hypot(p.x - state.bean.x, p.y - state.bean.y) > 58) return;
  pointer = e.pointerId;
  canvas.setPointerCapture(pointer);
});

canvas.addEventListener("pointermove", (e) => {
  if (pointer !== e.pointerId || state.phase !== "aim") return;
  const p = screenToWorld(e);
  const dx = p.x - sling.x;
  const dy = p.y - sling.y;
  const len = Math.min(Math.hypot(dx, dy), sling.maxPull);
  const angle = Math.atan2(dy, dx);
  state.bean.x = sling.x + Math.cos(angle) * len;
  state.bean.y = sling.y + Math.sin(angle) * len;
  updateHud("松手发射");
});

canvas.addEventListener("pointerup", (e) => {
  if (pointer !== e.pointerId) return;
  launchBean();
  pointer = null;
});

startButton.addEventListener("click", () => {
  if (!state || state.phase !== "done") return resetLevel(0);
  resetLevel(state.outcome === "win" ? state.level + 1 : state.level);
});

restartButton.addEventListener("click", () => resetLevel(state.level));
nextButton.addEventListener("click", () => resetLevel(state.level + 1));
window.addEventListener("resize", resize);

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.033);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

resize();
state = { phase: "start", level: 0, ammo: 3, score: 0, bean: makeBean(), cans: [], blocks: [], particles: [] };
draw();
requestAnimationFrame(loop);

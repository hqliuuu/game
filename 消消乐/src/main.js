const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const ui = {
  menu: document.getElementById("menu"),
  result: document.getElementById("result"),
  resultTitle: document.getElementById("resultTitle"),
  resultText: document.getElementById("resultText"),
  levelText: document.getElementById("levelText"),
  scoreText: document.getElementById("scoreText"),
  movesText: document.getElementById("movesText"),
  targetText: document.getElementById("targetText"),
  startBtn: document.getElementById("startBtn"),
  continueBtn: document.getElementById("continueBtn"),
  nextBtn: document.getElementById("nextBtn"),
  retryBtn: document.getElementById("retryBtn"),
  restartBtn: document.getElementById("restartBtn"),
  musicBtn: document.getElementById("musicBtn"),
};

const assets = {
  menu: loadImage("./public/assets/generated/background-menu.png"),
  gameplay: loadImage("./public/assets/generated/background-gameplay.png"),
  basic: loadImage("./public/assets/generated/tiles-basic-sheet-alpha.png"),
  special: loadImage("./public/assets/generated/tiles-special-sheet-alpha.png"),
};

const audio = {
  menu: new Audio("./public/assets/audio/bgm/bgm-menu-soft-dossier.wav"),
  gameplay: new Audio("./public/assets/audio/bgm/bgm-gameplay-calm-investigation.wav"),
  win: new Audio("./public/assets/audio/bgm/jingle-level-win-gentle.wav"),
  fail: new Audio("./public/assets/audio/bgm/jingle-level-fail-soft.wav"),
  enabled: true,
  unlocked: false,
};

audio.menu.loop = true;
audio.gameplay.loop = true;
audio.menu.volume = 0.28;
audio.gameplay.volume = 0.3;
audio.win.volume = 0.4;
audio.fail.volume = 0.35;

const size = 8;
const typeCount = 6;
const levels = [
  { moves: 24, target: 4500, title: "新人律师入职" },
  { moves: 24, target: 6200, title: "证据整理" },
  { moves: 22, target: 7600, title: "现场调查" },
  { moves: 20, target: 9000, title: "庭审准备" },
  { moves: 18, target: 10800, title: "NXX 协作" },
];

let state = createState();
let layout = {};
let pointerDown = null;
let particles = [];
let floatingTexts = [];
let animating = false;
let scene = "menu";

function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

function createState(levelIndex = 0) {
  const level = levels[levelIndex % levels.length];
  return {
    levelIndex,
    score: 0,
    moves: level.moves,
    target: level.target,
    selected: null,
    board: createBoard(),
    message: level.title,
  };
}

function createBoard() {
  const board = Array.from({ length: size }, () => Array(size).fill(null));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let type;
      do {
        type = Math.floor(Math.random() * typeCount);
      } while (
        (x >= 2 && board[y][x - 1].type === type && board[y][x - 2].type === type) ||
        (y >= 2 && board[y - 1][x].type === type && board[y - 2][x].type === type)
      );
      board[y][x] = { type, special: null, id: crypto.randomUUID() };
    }
  }
  return board;
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = window.innerWidth;
  const h = window.innerHeight;
  const boardSize = Math.min(w * 0.88, h * 0.7, 640);
  layout.tile = boardSize / size;
  layout.board = {
    x: (w - boardSize) / 2,
    y: Math.max(92, (h - boardSize) / 2 + 24),
    size: boardSize,
  };
}

function draw() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  drawCover(scene === "menu" ? assets.menu : assets.gameplay, w, h);
  drawVignette(w, h);

  if (scene !== "menu") {
    drawBoard();
    drawParticles();
    drawFloatingTexts();
  }

  requestAnimationFrame(draw);
}

function drawCover(img, w, h) {
  if (!img.complete || !img.naturalWidth) {
    ctx.fillStyle = "#101720";
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const iw = img.naturalWidth * scale;
  const ih = img.naturalHeight * scale;
  ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
}

function drawVignette(w, h) {
  const gradient = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
  gradient.addColorStop(0, "rgba(8, 12, 20, 0.05)");
  gradient.addColorStop(1, "rgba(8, 12, 20, 0.64)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

function drawBoard() {
  const { x, y, size: boardSize } = layout.board;
  const t = layout.tile;
  ctx.save();
  ctx.fillStyle = "rgba(8, 15, 24, 0.66)";
  roundRect(x - 14, y - 14, boardSize + 28, boardSize + 28, 14);
  ctx.fill();
  ctx.strokeStyle = "rgba(241, 207, 143, 0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();

  for (let yy = 0; yy < size; yy++) {
    for (let xx = 0; xx < size; xx++) {
      const tile = state.board[yy][xx];
      const px = x + xx * t;
      const py = y + yy * t;
      ctx.fillStyle = "rgba(255, 248, 236, 0.06)";
      roundRect(px + 3, py + 3, t - 6, t - 6, 9);
      ctx.fill();
      drawTile(tile, px + t / 2, py + t / 2, t * 0.82);
    }
  }

  if (state.selected) {
    const px = x + state.selected.x * t;
    const py = y + state.selected.y * t;
    ctx.strokeStyle = "#ffd98d";
    ctx.lineWidth = 3;
    roundRect(px + 5, py + 5, t - 10, t - 10, 10);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTile(tile, cx, cy, diameter) {
  if (!tile) return;
  const source = tile.special ? assets.special : assets.basic;
  const cols = tile.special ? 2 : 3;
  const index = tile.special ? specialIndex(tile.special) : tile.type;
  const sx = (index % cols) * (source.naturalWidth / cols);
  const sy = Math.floor(index / cols) * (source.naturalHeight / 2);
  const sw = source.naturalWidth / cols;
  const sh = source.naturalHeight / 2;
  if (source.complete && source.naturalWidth) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, diameter * 0.47, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(source, sx, sy, sw, sh, cx - diameter / 2, cy - diameter / 2, diameter, diameter);
    ctx.restore();
  } else {
    ctx.fillStyle = ["#e6b76d", "#83c6d9", "#bf5968", "#d9e4ef", "#8768a7", "#65b98d"][tile.type];
    ctx.beginPath();
    ctx.arc(cx, cy, diameter * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

function specialIndex(special) {
  return { horizontal: 0, vertical: 1, bomb: 2, color: 3 }[special] || 0;
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
}

function canvasToCell(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const bx = layout.board.x;
  const by = layout.board.y;
  if (x < bx || y < by || x >= bx + layout.board.size || y >= by + layout.board.size) return null;
  return {
    x: Math.floor((x - bx) / layout.tile),
    y: Math.floor((y - by) / layout.tile),
  };
}

async function handleCell(cell) {
  if (animating || scene !== "game") return;
  if (!state.selected) {
    state.selected = cell;
    playTone(640, 0.05, "sine", 0.06);
    return;
  }
  const first = state.selected;
  state.selected = null;
  if (first.x === cell.x && first.y === cell.y) return;
  if (Math.abs(first.x - cell.x) + Math.abs(first.y - cell.y) !== 1) {
    state.selected = cell;
    return;
  }
  await attemptSwap(first, cell);
}

async function attemptSwap(a, b) {
  animating = true;
  swap(a, b);
  const specialClear = state.board[a.y][a.x].special || state.board[b.y][b.x].special;
  let matches = findMatches();
  if (!specialClear && matches.length === 0) {
    await wait(150);
    swap(a, b);
    playTone(180, 0.12, "triangle", 0.08);
    animating = false;
    return;
  }
  state.moves -= 1;
  playTone(380, 0.08, "triangle", 0.06);
  if (specialClear) triggerSpecial(b, state.board[b.y][b.x]);
  await resolveBoard(matches, a, b);
  updateHud();
  checkEnd();
  animating = false;
}

async function resolveBoard(initialMatches = [], swapA = null, swapB = null) {
  let combo = 0;
  let matches = initialMatches.length ? initialMatches : findMatches();
  while (matches.length > 0) {
    combo += 1;
    const clear = new Map();
    let bonusTile = null;
    for (const match of matches) {
      for (const cell of match.cells) clear.set(`${cell.x},${cell.y}`, cell);
      const special = specialFromMatch(match);
      if (special && !bonusTile) {
        bonusTile = chooseBonusCell(match, swapA, swapB);
        bonusTile.special = special;
      }
    }
    if (bonusTile) clear.delete(`${bonusTile.x},${bonusTile.y}`);
    const cleared = Array.from(clear.values());
    state.score += cleared.length * 90 * combo + (combo - 1) * 220;
    spawnParticles(cleared, combo);
    floatingText(`连锁 x${combo}`, layout.board.x + layout.board.size / 2, layout.board.y - 12);
    playTone(420 + combo * 80, 0.12, "sine", 0.07);
    for (const cell of cleared) state.board[cell.y][cell.x] = null;
    if (bonusTile) state.board[bonusTile.y][bonusTile.x] = { type: bonusTile.type, special: bonusTile.special, id: crypto.randomUUID() };
    updateHud();
    await wait(220);
    collapse();
    await wait(180);
    matches = findMatches();
  }
}

function swap(a, b) {
  const tmp = state.board[a.y][a.x];
  state.board[a.y][a.x] = state.board[b.y][b.x];
  state.board[b.y][b.x] = tmp;
}

function findMatches() {
  const matches = [];
  for (let y = 0; y < size; y++) {
    let run = [{ x: 0, y, type: state.board[y][0].type }];
    for (let x = 1; x < size; x++) {
      const type = state.board[y][x].type;
      if (type === run[0].type) run.push({ x, y, type });
      else {
        if (run.length >= 3) matches.push({ axis: "h", cells: run });
        run = [{ x, y, type }];
      }
    }
    if (run.length >= 3) matches.push({ axis: "h", cells: run });
  }
  for (let x = 0; x < size; x++) {
    let run = [{ x, y: 0, type: state.board[0][x].type }];
    for (let y = 1; y < size; y++) {
      const type = state.board[y][x].type;
      if (type === run[0].type) run.push({ x, y, type });
      else {
        if (run.length >= 3) matches.push({ axis: "v", cells: run });
        run = [{ x, y, type }];
      }
    }
    if (run.length >= 3) matches.push({ axis: "v", cells: run });
  }
  return matches;
}

function specialFromMatch(match) {
  if (match.cells.length >= 5) return "color";
  if (match.cells.length === 4) return match.axis === "h" ? "horizontal" : "vertical";
  return null;
}

function chooseBonusCell(match, a, b) {
  const preferred = match.cells.find((cell) => a && cell.x === a.x && cell.y === a.y) || match.cells.find((cell) => b && cell.x === b.x && cell.y === b.y) || match.cells[Math.floor(match.cells.length / 2)];
  return { ...preferred, special: null };
}

function triggerSpecial(cell, tile) {
  const clear = [];
  if (tile.special === "horizontal") {
    for (let x = 0; x < size; x++) clear.push({ x, y: cell.y });
  } else if (tile.special === "vertical") {
    for (let y = 0; y < size; y++) clear.push({ x: cell.x, y });
  } else if (tile.special === "bomb") {
    for (let y = cell.y - 1; y <= cell.y + 1; y++) {
      for (let x = cell.x - 1; x <= cell.x + 1; x++) {
        if (x >= 0 && y >= 0 && x < size && y < size) clear.push({ x, y });
      }
    }
  } else if (tile.special === "color") {
    const target = state.board[cell.y][cell.x].type;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (state.board[y][x].type === target) clear.push({ x, y });
  }
  for (const c of clear) {
    state.board[c.y][c.x] = null;
  }
  state.score += clear.length * 140;
  spawnParticles(clear, 3);
  collapse();
}

function collapse() {
  for (let x = 0; x < size; x++) {
    const col = [];
    for (let y = size - 1; y >= 0; y--) if (state.board[y][x]) col.push(state.board[y][x]);
    for (let y = size - 1; y >= 0; y--) {
      state.board[y][x] = col[size - 1 - y] || { type: Math.floor(Math.random() * typeCount), special: null, id: crypto.randomUUID() };
    }
  }
}

function spawnParticles(cells, combo) {
  const colors = ["#f2c976", "#8ed6eb", "#e4818f", "#fff2cf"];
  for (const cell of cells) {
    const cx = layout.board.x + (cell.x + 0.5) * layout.tile;
    const cy = layout.board.y + (cell.y + 0.5) * layout.tile;
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: cx,
        y: cy,
        vx: (Math.random() - 0.5) * (1.8 + combo * 0.2),
        vy: (Math.random() - 0.7) * (1.8 + combo * 0.2),
        life: 34,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }
}

function drawParticles() {
  particles = particles.filter((p) => p.life > 0);
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.025;
    p.life -= 1;
    ctx.globalAlpha = p.life / 34;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function floatingText(text, x, y) {
  floatingTexts.push({ text, x, y, life: 58 });
}

function drawFloatingTexts() {
  floatingTexts = floatingTexts.filter((p) => p.life > 0);
  ctx.textAlign = "center";
  ctx.font = "700 20px Microsoft YaHei, sans-serif";
  for (const p of floatingTexts) {
    p.y -= 0.45;
    p.life -= 1;
    ctx.globalAlpha = Math.min(1, p.life / 28);
    ctx.fillStyle = "#ffd98d";
    ctx.fillText(p.text, p.x, p.y);
    ctx.globalAlpha = 1;
  }
}

function updateHud() {
  ui.levelText.textContent = String(state.levelIndex + 1);
  ui.scoreText.textContent = String(state.score);
  ui.movesText.textContent = String(state.moves);
  ui.targetText.textContent = String(state.target);
}

function checkEnd() {
  if (state.score >= state.target) {
    endLevel(true);
  } else if (state.moves <= 0) {
    endLevel(false);
  }
}

function endLevel(win) {
  scene = "result";
  ui.result.classList.remove("hidden");
  ui.resultTitle.textContent = win ? "调查完成" : "线索不足";
  ui.resultText.textContent = win ? "证据链已经整理完毕，新的案件节点已解锁。" : "步数已经用完，重新梳理证据会更稳。";
  ui.nextBtn.style.display = win ? "" : "none";
  playMusic(null);
  if (audio.enabled && audio.unlocked) {
    (win ? audio.win : audio.fail).currentTime = 0;
    (win ? audio.win : audio.fail).play().catch(() => {});
  }
  const best = Number(localStorage.getItem("match3-level") || 0);
  if (win && state.levelIndex + 1 > best) localStorage.setItem("match3-level", String(state.levelIndex + 1));
}

function startGame(levelIndex = state.levelIndex) {
  scene = "game";
  state = createState(levelIndex);
  ui.menu.classList.add("hidden");
  ui.result.classList.add("hidden");
  updateHud();
  unlockAudio();
  playMusic(audio.gameplay);
}

function playMusic(track) {
  for (const item of [audio.menu, audio.gameplay]) item.pause();
  if (!track || !audio.enabled || !audio.unlocked) return;
  track.currentTime = 0;
  track.play().catch(() => {});
}

function unlockAudio() {
  audio.unlocked = true;
}

function playTone(freq, duration, type, volume) {
  if (!audio.enabled || !audio.unlocked) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  if (!audio.ctx) audio.ctx = new AudioContext();
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  gain.gain.exponentialRampToValueAtTime(0.001, audio.ctx.currentTime + duration);
  osc.connect(gain).connect(audio.ctx.destination);
  osc.start();
  osc.stop(audio.ctx.currentTime + duration);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

canvas.addEventListener("pointerdown", (event) => {
  pointerDown = canvasToCell(event.clientX, event.clientY);
});

canvas.addEventListener("pointerup", (event) => {
  const up = canvasToCell(event.clientX, event.clientY);
  if (!up) return;
  if (pointerDown) {
    const dx = up.x - pointerDown.x;
    const dy = up.y - pointerDown.y;
    if (Math.abs(dx) + Math.abs(dy) > 0) {
      const target = Math.abs(dx) > Math.abs(dy) ? { x: pointerDown.x + Math.sign(dx), y: pointerDown.y } : { x: pointerDown.x, y: pointerDown.y + Math.sign(dy) };
      if (target.x >= 0 && target.y >= 0 && target.x < size && target.y < size) {
        state.selected = pointerDown;
        handleCell(target);
      }
    } else {
      handleCell(up);
    }
  }
  pointerDown = null;
});

ui.startBtn.addEventListener("click", () => startGame(0));
ui.continueBtn.addEventListener("click", () => startGame(Number(localStorage.getItem("match3-level") || 0)));
ui.retryBtn.addEventListener("click", () => startGame(state.levelIndex));
ui.restartBtn.addEventListener("click", () => startGame(state.levelIndex));
ui.nextBtn.addEventListener("click", () => startGame((state.levelIndex + 1) % levels.length));
ui.musicBtn.addEventListener("click", () => {
  unlockAudio();
  audio.enabled = !audio.enabled;
  ui.musicBtn.textContent = audio.enabled ? "♪" : "×";
  if (audio.enabled) playMusic(scene === "game" ? audio.gameplay : audio.menu);
  else playMusic(null);
});

window.addEventListener("resize", resize);
resize();
updateHud();
draw();
setTimeout(() => {
  if (scene === "menu") {
    unlockAudio();
    playMusic(audio.menu);
  }
}, 300);

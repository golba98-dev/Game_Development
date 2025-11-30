let virtualW, virtualH;
let pendingGameActivated = false;


let mapLoadComplete = false;

let showLoadingOverlay = true;
let overlayMessage = 'Loading map...';

let inGameMenuVisible = false;
let inGameMenuButtonRects = []; 
let inGameMenuHovered = null; 
let inGameMenuHoverScales = {}; 
let inGameMenuPrevHovered = null;



let activeSettingElements = []; 
let textSizeSetting = 75; 
let difficultySetting = 'normal'; 
let settingsOverlayDiv = null; 

const SETTINGS_CATEGORIES = Object.freeze(["Audio", "Gameplay", "Controls", "Accessibility", "Language"]);
const DEFAULT_SETTINGS = Object.freeze({
  masterVol: 0.8, musicVol: 0.6, sfxVol: 0.7, textSize: 75, difficulty: 'normal'
});


const CONTROL_VERTICAL_NUDGE = 8;
const SELECT_VERTICAL_NUDGE = 15;
const TEXTSIZE_BUTTON_Y_OFFSET = 10;
const BACK_BUTTON_VERTICAL_OFFSET = 120;




const CATEGORY_BUILDERS = {
  Audio: buildAudioSettings,
  Gameplay: buildGameplaySettings,
  Controls: buildControlsSettings,
  Accessibility: buildAccessibilitySettings,
  Language: buildLanguageSettings
};

function styleButton(btn) {
  btn.style("background", "transparent");
  btn.style("border", "none");
  btn.style("cursor", "pointer");
  btn.style("color", "white");
  btn.style("font-size", "20px");
  btn.style("text-shadow", "0 0 10px #000");
  btn.style("font-family", "MyFont, sans-serif");
}

function playClickSFX() {
    
}

function drawInGameMenu() {
  if (!inGameMenuVisible) return;
  try {
    push();
    
    
    let currentHoveredId = null;
    if (typeof mouseX === 'number' && typeof mouseY === 'number') {
      
      for (let i = inGameMenuButtonRects.length - 1; i >= 0; i--) {
        const r = inGameMenuButtonRects[i];
        if (mouseX >= r.x && mouseX <= r.x + r.w && mouseY >= r.y && mouseY <= r.y + r.h) {
          currentHoveredId = r.id;
          break;
        }
      }
    }
    inGameMenuHovered = currentHoveredId;

   
    noStroke();
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);

   
    const panelMaxW = Math.floor(width * 0.72);
    const panelMaxH = Math.floor(height * 0.64);
    const panelW = Math.max(360, Math.min(920, panelMaxW));
    const panelH = Math.max(260, Math.min(640, panelMaxH));
    const px = Math.floor((width - panelW) / 2);
    const py = Math.floor((height - panelH) / 2);

    
    push();
    stroke(0);
    strokeWeight(6);
    fill(40, 40, 44, 255); 
    rect(px, py, panelW, panelH, 12);
    pop();

    
    try {
      if (ESC_MENU_BACKGROUND) {
        const imgAspect = ESC_MENU_BACKGROUND.width / ESC_MENU_BACKGROUND.height;
        const panelAspect = panelW / panelH;
        let imgW, imgH;
        if (imgAspect > panelAspect) {
          imgW = panelW;
          imgH = panelW / imgAspect;
        } else {
          imgH = panelH;
          imgW = panelH * imgAspect;
        }
        const imgX = px + (panelW - imgW) / 2;
        const imgY = py + (panelH - imgH) / 2;
        image(ESC_MENU_BACKGROUND, imgX, imgY, imgW, imgH);
      }
    } catch (e) {}

    
    const btnLabels = [ { id: 'continue', label: 'Continue' }, { id: 'settings', label: 'Settings' }, { id: 'exit', label: 'Exit' } ];

    
    const desiredBtnW = Math.min(Math.floor(panelW * 0.68), 520);
    const baseBtnH = 72;
    const artAspect = (BUTTON_BG && BUTTON_BG.width && BUTTON_BG.height) ? (BUTTON_BG.width / BUTTON_BG.height) : (desiredBtnW / baseBtnH);
    const btnArtW = (BUTTON_BG && BUTTON_BG.width && BUTTON_BG.height) ? Math.floor(desiredBtnW) : Math.min(360, Math.floor(panelW * 0.7));
    const btnArtH = Math.floor(btnArtW / artAspect) || baseBtnH;

    const gap = Math.max(14, Math.floor(panelH * 0.04));
    const totalH = btnArtH * btnLabels.length + gap * (btnLabels.length - 1);
    const startY = py + Math.floor((panelH - totalH) / 2) - Math.floor(panelH * 0.03);

    
    inGameMenuButtonRects = [];

    for (let i = 0; i < btnLabels.length; i++) {
      const b = btnLabels[i];
      const bw = btnArtW;
      const bh = btnArtH;
      const bx = Math.floor(px + (panelW - bw) / 2);
      const by = Math.floor(startY + i * (bh + gap));

     
      const currentScale = (inGameMenuHoverScales[b.id] || 1);
      const desired = (inGameMenuHovered === b.id) ? 1.10 : 1.0;
      inGameMenuHoverScales[b.id] = lerp(currentScale, desired, 0.18);

      const drawW = Math.floor(bw * inGameMenuHoverScales[b.id]);
      const drawH = Math.floor(bh * inGameMenuHoverScales[b.id]);
      const drawX = Math.floor(px + (panelW - drawW) / 2);
      const drawY = Math.floor(by - Math.floor((drawH - bh) / 2));

      
      try {
        if (BUTTON_BG) {
          image(BUTTON_BG, drawX, drawY, drawW, drawH);
        } else {
          push(); noStroke(); fill(70); rect(drawX, drawY, drawW, drawH, 10); pop();
        }
      } catch (e) { push(); noStroke(); fill(70); rect(drawX, drawY, drawW, drawH, 10); pop(); }

      
      try {
        push();
        textFont(uiFont || 'Arial');
        textAlign(CENTER, CENTER);
        const baseTextSize = Math.max(18, Math.floor(drawH * 0.40));
        const tSize = Math.floor(baseTextSize * (inGameMenuHovered === b.id ? 1.08 : 1.0));
        textSize(tSize);
        
        noStroke();
        fill(0, 140);
        text(b.label, drawX + drawW / 2 + 1, drawY + drawH / 2 + 3);
        if (inGameMenuHovered === b.id) fill(255, 220, 0); else fill(255);
        text(b.label, drawX + drawW / 2, drawY + drawH / 2 + 2);
        pop();
      } catch (e) {  }

 
      inGameMenuButtonRects.push({ id: b.id, x: drawX, y: drawY, w: drawW, h: drawH });
    }


    try {
      if (inGameMenuPrevHovered !== inGameMenuHovered) {
        inGameMenuPrevHovered = inGameMenuHovered;
        if (typeof document !== 'undefined' && document && document.body) {
          document.body.style.cursor = inGameMenuHovered ? 'pointer' : '';
        }
      }
    } catch (e) {}

    pop();
  } catch (e) {
    console.warn('[game] drawInGameMenu error', e);
  }
}

function updateLoadingOverlayDom() {
  try {
    const el = document.getElementById('gd-loading-overlay');
    if (!el) return;
    
    if (showLoadingOverlay) {
      el.style.display = 'flex';
      el.style.opacity = '1';
    } else {
      el.style.display = 'none';
      el.style.opacity = '0';
      return; 
    }

    // Update Message
    const msg = el.querySelector('.gd-loading-message');
    if (msg && overlayMessage) msg.innerText = overlayMessage;

    // Calculate %
    let p = 0;
    if (typeof AssetTracker !== 'undefined' && AssetTracker.expected > 0) {
        p = (AssetTracker.loaded / AssetTracker.expected) * 100;
    } else if (typeof overlayProgress !== 'undefined') {
        p = overlayProgress;
    }
    p = Math.floor(Math.max(0, Math.min(100, p)));

    // Update Bar
    const fill = el.querySelector('.gd-progress-fill');
    const pct = el.querySelector('.gd-progress-text');
    
    if (fill) fill.style.width = p + '%';
    if (pct) pct.innerText = p + '%';

  } catch (e) {}
}

try { ensureLoadingOverlayDom(); updateLoadingOverlayDom(); } catch (e) {}

let gameMusic;
let masterVol = 0.8;
let musicVol = 0.6;
let sfxVol = 0.7;

let pendingGameMusicStart = false;
let gameMusicStarted = false;


let persistentGameId = null;
let isNewGame = false;
let localStorageAvailable = true;
try {
  const testKey = '__gd_test__';
  window.localStorage.setItem(testKey, '1');
  window.localStorage.removeItem(testKey);
} catch (e) {
  localStorageAvailable = false;
}
try {
  if (localStorageAvailable) {
    persistentGameId = window.localStorage.getItem('persistentGameId');
    if (!persistentGameId) {
      isNewGame = true;
      persistentGameId = 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      try { window.localStorage.setItem('persistentGameId', persistentGameId); } catch (e) { localStorageAvailable = false; }
    }
  } else {
    isNewGame = true;
    persistentGameId = 'game_fallback_' + Date.now();
    console.warn('[game] localStorage not available, using fallback game ID.');
  }
} catch (e) {
  isNewGame = true;
  persistentGameId = 'game_fallback_' + Date.now();
  localStorageAvailable = false;
  console.warn('[game] localStorage error, using fallback game ID.');
}


let lastAutosavePayload = null;


const AssetTracker = {
  expected: 0,
  loaded: 0,
  names: new Set(),
  _resolve: null,
  _readyPromise: null,
  _callbacks: [],
  expect(name) {
    if (!name) name = 'anon:' + (this.expected + 1);
    if (this.names.has(name)) return;
    this.names.add(name);
    this.expected++;
  },
  markLoaded(name) {
    if (!name) name = 'anon';
    if (!this.names.has(name)) {
      this.names.add(name);
      this.expected++;
    }
    this.loaded++;
    if (this.loaded >= this.expected) {
      if (this._resolve) {
        try { this._resolve(true); } catch (e) {}
        this._resolve = null;
        this._readyPromise = null;
      }
      
      try {
        while (this._callbacks && this._callbacks.length) {
          const cb = this._callbacks.shift();
          try { cb(true); } catch (e) { console.warn('[AssetTracker] onReady callback threw', e); }
        }
      } catch (e) {}
    }
  },
  waitReady(timeoutMs = 3000) {
    if (this.loaded >= this.expected) return Promise.resolve(true);
    if (this._readyPromise) return this._readyPromise;
    this._readyPromise = new Promise((res) => {
      this._resolve = res;
      setTimeout(() => {
        if (this._resolve) {
          try { this._resolve(false); } catch (e) {}
          this._resolve = null;
          this._readyPromise = null;
        }
      }, timeoutMs || 3000);
    });
    return this._readyPromise;
  }
  ,
  onReady(cb) {
    if (typeof cb !== 'function') return;
    if (this.loaded >= this.expected) {
      try { cb(true); } catch (e) { console.warn('[AssetTracker] onReady immediate callback threw', e); }
      return;
    }
    this._callbacks.push(cb);
  }
};

function trackLoadImage(key, path, successCb, errorCb) {
  try { AssetTracker.expect(key || path); } catch (e) {}
  try {
    loadImage(path,
      (img) => {
        try { if (typeof successCb === 'function') successCb(img); } catch (e) {}
        try { AssetTracker.markLoaded(key || path); } catch (e) {}
      },
      (err) => {
        try { if (typeof errorCb === 'function') errorCb(err); } catch (e) {}
        try { AssetTracker.markLoaded(key || path); } catch (e) {}
      }
    );
  } catch (e) {
    try { if (typeof errorCb === 'function') errorCb(e); } catch (ee) {}
    try { AssetTracker.markLoaded(key || path); } catch (ee) {}
  }
}

function trackLoadSound(key, path, successCb, errorCb) {
  try { AssetTracker.expect(key || path); } catch (e) {}
  try {
    loadSound(path,
      (snd) => {
        try { if (typeof successCb === 'function') successCb(snd); } catch (e) {}
        try { AssetTracker.markLoaded(key || path); } catch (e) {}
      },
      (err) => {
        try { if (typeof errorCb === 'function') errorCb(err); } catch (e) {}
        try { AssetTracker.markLoaded(key || path); } catch (e) {}
      }
    );
  } catch (e) {
    try { if (typeof errorCb === 'function') errorCb(e); } catch (ee) {}
    try { AssetTracker.markLoaded(key || path); } catch (ee) {}
  }
}

function tryFetchActiveMap() {
  try {
    if (typeof fetch === 'undefined') return Promise.resolve(false);
    return fetch('http://localhost:3000/maps/active_map.json', { cache: 'no-cache' })
      .then(resp => {
        if (!resp.ok) return false;
        return resp.json().then(obj => {
          try { applyLoadedMap(obj); } catch (e) { console.warn('[game] applyLoadedMap failed', e); }
          try { showToast('Loaded workspace active_map.json', 'info', 1800); } catch (e) {}
          return true;
        }).catch(err => { console.warn('[game] failed to parse active_map.json from server', err); return false; });
      }).catch(err => { return false; });
  } catch (e) { return Promise.resolve(false); }
}

function applyLoadedMap(obj) {
  try {
    if (!obj || typeof obj !== 'object' || !Array.isArray(obj.mapStates) || !obj.logicalW || !obj.logicalH) {
      console.warn('[game] applyLoadedMap: invalid payload', obj);
      return false;
    }
    try {
      if (obj.persistentGameId) {
        persistentGameId = obj.persistentGameId;
        try { localStorage.setItem('persistentGameId', persistentGameId); } catch (e) {}
      }
    } catch (e) {}

    logicalW = Number(obj.logicalW) || Math.ceil((virtualW || W) / cellSize);
    logicalH = Number(obj.logicalH) || Math.ceil((virtualH || H) / cellSize);
    if (obj.cellSize && Number(obj.cellSize) > 0) {
      try { cellSize = Number(obj.cellSize); } catch (e) {}
    }
    try { mapStates = new Uint8Array(obj.mapStates); } catch (e) { mapStates = new Uint8Array(Array.from(obj.mapStates || [])); }
    if (obj.terrainLayer && Array.isArray(obj.terrainLayer)) {
      try { terrainLayer = new Uint8Array(obj.terrainLayer); } catch (e) { terrainLayer = new Uint8Array(Array.from(obj.terrainLayer)); }
    } else {
      terrainLayer = mapStates.slice();
    }
    treeObjects = Array.isArray(obj.treeObjects) ? obj.treeObjects.slice() : [];

    counts = {};
    for (let i = 0; i < mapStates.length; i++) counts[mapStates[i]] = (counts[mapStates[i]] || 0) + 1;

    const centerX = Math.floor((logicalW || Math.ceil(W / (cellSize || 32))) / 2);
    const centerY = Math.floor((logicalH || Math.ceil(H / (cellSize || 32))) / 2);
    playerPosition = { x: centerX, y: centerY };
    renderX = playerPosition.x; renderY = playerPosition.y; renderStartX = renderX; renderStartY = renderY; renderTargetX = renderX; renderTargetY = renderY; isMoving = false;
    createMapImage();
    redraw();
    try { mapLoadComplete = true; } catch (e) {}
    try { showLoadingOverlay = false; } catch (e) {}
    return true;
  } catch (err) {
    console.warn('[game] applyLoadedMap error', err);
    return false;
  }
}



function showFilePickerToLoadActiveMap() {
  try {
    if (typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    input.addEventListener('change', (ev) => {
      const f = input.files && input.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const obj = JSON.parse(reader.result);
          if (applyLoadedMap(obj)) {
            try { showToast('Loaded selected map file', 'info', 1800); } catch (e) {}
          } else {
            try { showToast('Selected file is not a valid map', 'error', 2800); } catch (e) {}
          }
        } catch (e) { try { showToast('Failed to read file', 'error', 2200); } catch (ee) {} }
      };
      reader.readAsText(f);
      setTimeout(() => { try { document.body.removeChild(input); } catch (e) {} }, 6000);
    });
    document.body.appendChild(input);
    input.click();
  } catch (e) { console.warn('[game] showFilePicker failed', e); }
}
function carveRiversMaybeThrough(map, w, h, opts = {}) {
  const clearStartX = opts.clearStartX ?? -1;
  const clearEndX   = opts.clearEndX ?? -1;
  const clearStartY = opts.clearStartY ?? -1;
  const clearEndY   = opts.clearEndY ?? -1;

  const RIVER_TILE = (typeof opts.RIVER_TILE !== 'undefined' && opts.RIVER_TILE !== null)
    ? opts.RIVER_TILE
    : (typeof TILE_TYPES !== 'undefined' && TILE_TYPES.RIVER ? TILE_TYPES.RIVER : null);

  const BRIDGE_TILE = (typeof opts.BRIDGE_TILE !== 'undefined' && opts.BRIDGE_TILE !== null)
    ? opts.BRIDGE_TILE
    : (typeof TILE_TYPES !== 'undefined' && TILE_TYPES.RAMP ? TILE_TYPES.RAMP : TILE_TYPES.GRASS);

  const playerX = Math.floor(opts.playerX ?? Math.floor(w / 2));
  const playerY = Math.floor(opts.playerY ?? Math.floor(h / 2));
  const numRivers = typeof opts.numRivers === 'number' ? opts.numRivers : (1 + Math.floor(Math.random() * 2));
  const allowClearOverride = typeof opts.allowClearOverride === 'boolean' ? opts.allowClearOverride : null;
  const chanceEnterClear = allowClearOverride === null
    ? (typeof opts.chanceEnterClear === 'number' ? Math.max(0, Math.min(1, opts.chanceEnterClear)) : 0.35)
    : (allowClearOverride ? 1 : 0);

  const jitterNoiseScale = typeof opts.jitterNoiseScale === 'number' ? opts.jitterNoiseScale : 0.12;
  const widenProb = typeof opts.widenProb === 'number' ? opts.widenProb : 0.45;
  const maxSteps = Math.max(w, h) * 6;

  function inClear(x, y) {
    if (clearStartX < 0) return false;
    return x > clearStartX && x < clearEndX && y > clearStartY && y < clearEndY;
  }

  function neighbors8(cx, cy) {
    const n = [];
    for (let yy = cy - 1; yy <= cy + 1; yy++) {
      for (let xx = cx - 1; xx <= cx + 1; xx++) {
        if (xx === cx && yy === cy) continue;
        if (xx >= 0 && xx < w && yy >= 0 && yy < h) n.push({ x: xx, y: yy });
      }
    }
    return n;
  }

  function reachedSide(x, y, side) {
    if (side === 0) return y === 0;
    if (side === 1) return x === w - 1;
    if (side === 2) return y === h - 1;
    if (side === 3) return x === 0;
    return false;
  }

  function pickStartAndTarget() {
    const side = Math.floor(Math.random() * 4);
    let sx, sy, tx, ty;
    if (side === 0) { sx = Math.floor(Math.random() * w); sy = 0; tx = Math.floor((w * 0.25) + Math.random() * w * 0.5); ty = h - 1; }
    else if (side === 1) { sx = w - 1; sy = Math.floor(Math.random() * h); tx = 0; ty = Math.floor((h * 0.25) + Math.random() * h * 0.5); }
    else if (side === 2) { sx = Math.floor(Math.random() * w); sy = h - 1; tx = Math.floor((w * 0.25) + Math.random() * w * 0.5); ty = 0; }
    else { sx = 0; sy = Math.floor(Math.random() * h); tx = w - 1; ty = Math.floor((h * 0.25) + Math.random() * h * 0.5); }
    if (inClear(sx, sy)) { if (side === 0) sy = 0; if (side === 1) sx = w - 1; if (side === 2) sy = h - 1; if (side === 3) sx = 0; }
    if (inClear(tx, ty)) { if (side === 0) ty = h - 1; if (side === 1) tx = 0; if (side === 2) ty = 0; if (side === 3) tx = w - 1; }
    return { start: { x: sx, y: sy, side }, target: { x: tx, y: ty, side: (side + 2) % 4 } };
  }

  function placeRiverTile(x, y) {
    const idx = y * w + x;
    if (RIVER_TILE !== null) map[idx] = RIVER_TILE; else map[idx] = TILE_TYPES.FOREST;
  }

  function carveSingleRiver(start, target) {
    let x = start.x, y = start.y;
    let steps = 0;
    let prevDir = null;
    const allowThroughThisRiver = Math.random() < chanceEnterClear;
    while (steps < maxSteps) {
      placeRiverTile(x, y);
      const distToTarget = Math.hypot(target.x - x, target.y - y);
      const localWidenProb = distToTarget < 4 ? widenProb * 0.35 : widenProb;
      for (const n of neighbors8(x, y)) {
        if (Math.random() < localWidenProb) placeRiverTile(n.x, n.y);
      }
      if (reachedSide(x, y, target.side)) {
        if (distToTarget > 2 && Math.random() < 0.4) {
          const extras = neighbors8(x, y).filter(n => reachedSide(n.x, n.y, target.side));
          if (extras.length) { const e = extras[Math.floor(Math.random() * extras.length)]; placeRiverTile(e.x, e.y); }
        }
        break;
      }
      let candidates = neighbors8(x, y);
      let best = null; let bestScore = Infinity;
      for (const c of candidates) {
        const dist = Math.hypot(target.x - c.x, target.y - c.y);
        const jitter = (noise(c.x * jitterNoiseScale, c.y * jitterNoiseScale) - 0.5) * 3;
        const inside = inClear(c.x, c.y);
        const insidePenalty = inside ? (allowThroughThisRiver ? 6 : 1000) : 0;
        const forwardDot = ((target.x - x) * (c.x - x) + (target.y - y) * (c.y - y));
        const backtrackPenalty = forwardDot < 0 ? 6 : 0;
        const dirX = c.x - x;
        const dirY = c.y - y;
        const diagPenalty = (Math.abs(dirX) + Math.abs(dirY) === 2) ? 0.8 : 0;
        const turnPenalty = prevDir && (dirX !== prevDir.dx || dirY !== prevDir.dy) ? 1.4 : 0;
        const score = dist + jitter + insidePenalty + backtrackPenalty + diagPenalty + turnPenalty;
        if (score < bestScore) { bestScore = score; best = c; }
      }
      if (!best) break;
      prevDir = { dx: best.x - x, dy: best.y - y };
      x = best.x; y = best.y; steps++;
      if (steps % 70 === 0 && Math.random() < 0.25) {
        const p = pickStartAndTarget().start; x = Math.max(0, Math.min(w - 1, p.x)); y = Math.max(0, Math.min(h - 1, p.y));
        prevDir = null;
      }
    }
  }

  for (let r = 0; r < numRivers; r++) { const { start, target } = pickStartAndTarget(); carveSingleRiver(start, target); }

  function floodFillWalkable(px, py) {
    const q = [{ x: px, y: py }]; const visited = new Set([`${px},${py}`]); let head = 0;
    while (head < q.length) { const cur = q[head++]; for (const n of neighbors8(cur.x, cur.y)) { const key = `${n.x},${n.y}`; if (visited.has(key)) continue; const t = map[n.y * w + n.x]; const walkable = t === BRIDGE_TILE || t === TILE_TYPES.GRASS || t === TILE_TYPES.FLOWERS || t === TILE_TYPES.LOG; if (walkable) { visited.add(key); q.push({ x: n.x, y: n.y }); } } }
    return visited;
  }

  for (let iter = 0; iter < 5; iter++) {
    const visited = floodFillWalkable(playerX, playerY);
    const unreachable = [];
    for (let yy = 0; yy < h; yy++) { for (let xx = 0; xx < w; xx++) { const key = `${xx},${yy}`; const t = map[yy * w + xx]; if ((t === TILE_TYPES.GRASS || t === TILE_TYPES.FLOWERS || t === TILE_TYPES.LOG) && !visited.has(key)) unreachable.push({ x: xx, y: yy }); } }
    if (unreachable.length === 0) break;
    const candidatesMap = new Map(); const visitedSet = visited;
    for (const g of unreachable) {
      for (const n of neighbors8(g.x, g.y)) {
        const nk = `${n.x},${n.y}`; if (candidatesMap.has(nk)) continue; const t = map[n.y * w + n.x]; if (t === RIVER_TILE) {
          let touchesVisited = false; for (const nn of neighbors8(n.x, n.y)) { if (visitedSet.has(`${nn.x},${nn.y}`)) { const tt = map[nn.y * w + nn.x]; if (tt === TILE_TYPES.GRASS || tt === TILE_TYPES.FLOWERS || tt === TILE_TYPES.LOG || tt === BRIDGE_TILE) { touchesVisited = true; break; } } }
          if (touchesVisited) { const score = Math.hypot(n.x - w/2, n.y - h/2) + Math.random() * 20; candidatesMap.set(nk, { x: n.x, y: n.y, score }); }
        }
      }
    }
    if (candidatesMap.size === 0) break;
    const candidates = Array.from(candidatesMap.values()).sort((a,b) => a.score - b.score);
    const placeCount = Math.min(3, Math.max(1, Math.floor(candidates.length / 6)));
    for (let i = 0; i < placeCount && i < candidates.length; i++) {
      const c = candidates[i];
      layBridgeTile(map, w, h, c.x, c.y, RIVER_TILE, BRIDGE_TILE);
    }
  }
}

function carveBranchFromRiver(map, w, h, opts = {}) {
  const RIVER_TILE = (typeof opts.RIVER_TILE !== 'undefined' && opts.RIVER_TILE !== null)
    ? opts.RIVER_TILE
    : (typeof TILE_TYPES !== 'undefined' && TILE_TYPES.RIVER ? TILE_TYPES.RIVER : null);

  if (RIVER_TILE === null) {
    console.warn('carveBranchFromRiver: no RIVER_TILE available; aborting branch carve.');
    return;
  }

  const BRIDGE_TILE = (typeof opts.BRIDGE_TILE !== 'undefined' && opts.BRIDGE_TILE !== null)
    ? opts.BRIDGE_TILE
    : (typeof TILE_TYPES !== 'undefined' && TILE_TYPES.RAMP ? TILE_TYPES.RAMP : TILE_TYPES.GRASS);

  const playerX = Math.floor(opts.playerX ?? Math.floor(w / 2));
  const playerY = Math.floor(opts.playerY ?? Math.floor(h / 2));
  const { clearStartX = -1, clearEndX = -1, clearStartY = -1, clearEndY = -1 } = opts;

  function neighbors8(cx, cy) {
    const n = [];
    for (let yy = cy - 1; yy <= cy + 1; yy++) {
      for (let xx = cx - 1; xx <= cx + 1; xx++) {
        if (xx === cx && yy === cy) continue;
        if (xx >= 0 && xx < w && yy >= 0 && yy < h) n.push({ x: xx, y: yy });
      }
    }
    return n;
  }

  function isInsideClear(x, y) {
    if (clearStartX < 0) return false;
    return x > clearStartX && x < clearEndX && y > clearStartY && y < clearEndY;
  }

  const riverTiles = [];
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      if (map[yy * w + xx] === RIVER_TILE) riverTiles.push({ x: xx, y: yy });
    }
  }

  function pickEdgeStart() {
    const side = Math.floor(Math.random() * 4);
    if (side === 0) return { x: Math.floor(Math.random() * w), y: 0 };
    if (side === 1) return { x: w - 1, y: Math.floor(Math.random() * h) };
    if (side === 2) return { x: Math.floor(Math.random() * w), y: h - 1 };
    return { x: 0, y: Math.floor(Math.random() * h) };
  }

  const start = riverTiles.length ? riverTiles[Math.floor(Math.random() * riverTiles.length)] : pickEdgeStart();

  function pickOppositeEdgeTargetFrom(sx, sy) {
    if (sx <= w / 2) return { x: w - 1, y: Math.floor(h * (0.25 + Math.random() * 0.5)) };
    if (sx > w / 2) return { x: 0, y: Math.floor(h * (0.25 + Math.random() * 0.5)) };
    if (sy <= h / 2) return { x: Math.floor(w * (0.25 + Math.random() * 0.5)), y: h - 1 };
    return { x: Math.floor(w * (0.25 + Math.random() * 0.5)), y: 0 };
  }

  const targetEdge = pickOppositeEdgeTargetFrom(start.x, start.y);

  const maxSteps = Math.max(w, h) * 6;
  const jitterNoiseScale = 0.12;
  const widenProb = 0.45;

  function carvePath(sx, sy, tx, ty, stepsLimit = maxSteps) {
    let x = sx, y = sy;
    let steps = 0;
    let prevDir = null;
    while (steps < stepsLimit) {
      const idx = y * w + x;
      map[idx] = RIVER_TILE;

      const distToTarget = Math.hypot(tx - x, ty - y);
      const localWidenProb = distToTarget < 4 ? widenProb * 0.35 : widenProb;
      for (const n of neighbors8(x, y)) {
        const nIdx = n.y * w + n.x;
        if (Math.random() < localWidenProb) map[nIdx] = RIVER_TILE;
      }

      if (Math.hypot(tx - x, ty - y) <= 1.5) break;

      let best = null;
      let bestScore = Infinity;
      for (const c of neighbors8(x, y)) {
        const dist = Math.hypot(tx - c.x, ty - c.y);
        const jitter = (noise(c.x * jitterNoiseScale, c.y * jitterNoiseScale) - 0.5) * 3;
        const throughPlayerBias = (Math.hypot(playerX - c.x, playerY - c.y) < Math.max(w,h)*0.25) ? -2 : 0;
        const dirX = c.x - x;
        const dirY = c.y - y;
        const diagPenalty = (Math.abs(dirX) + Math.abs(dirY) === 2) ? 0.6 : 0;
        const turnPenalty = prevDir && (dirX !== prevDir.dx || dirY !== prevDir.dy) ? 1.2 : 0;
        const score = dist + jitter + throughPlayerBias + diagPenalty + turnPenalty;
        if (score < bestScore) {
          bestScore = score;
          best = c;
        }
      }
      if (!best) break;
      prevDir = { dx: best.x - x, dy: best.y - y };
      x = best.x; y = best.y;
      steps++;
    }
    return { x, y, steps };
  }

  carvePath(start.x, start.y, playerX, playerY, Math.floor(maxSteps * 0.6));

  let nearest = null;
  let bestD = Infinity;
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      if (map[yy * w + xx] === RIVER_TILE) {
        const d = Math.hypot(playerX - xx, playerY - yy);
        if (d < bestD) { bestD = d; nearest = { x: xx, y: yy }; }
      }
    }
  }
  if (nearest) {
    carvePath(nearest.x, nearest.y, targetEdge.x, targetEdge.y, maxSteps);
  }

  function floodFillWalkableFrom(px, py) {
    const q = [{ x: px, y: py }];
    const visited = new Set([`${px},${py}`]);
    let head = 0;
    while (head < q.length) {
      const cur = q[head++];
      for (const n of neighbors8(cur.x, cur.y)) {
        const k = `${n.x},${n.y}`;
        if (visited.has(k)) continue;
        const t = map[n.y * w + n.x];
        const walkable = t === BRIDGE_TILE || t === TILE_TYPES.GRASS || t === TILE_TYPES.FLOWERS || t === TILE_TYPES.LOG;
        if (walkable) {
          visited.add(k);
          q.push({ x: n.x, y: n.y });
        }
      }
    }
    return visited;
  }

  for (let iter = 0; iter < 6; iter++) {
    const visited = floodFillWalkableFrom(playerX, playerY);
    const unreachable = [];
    for (let yy = 0; yy < h; yy++) {
      for (let xx = 0; xx < w; xx++) {
        const k = `${xx},${yy}`;
        const t = map[yy * w + xx];
        if ((t === TILE_TYPES.GRASS || t === TILE_TYPES.FLOWERS || t === TILE_TYPES.LOG) && !visited.has(k)) {
          unreachable.push({ x: xx, y: yy });
        }
      }
    }
    if (unreachable.length === 0) break;

    const candidates = [];
    const seen = new Set();
    for (const g of unreachable) {
      for (const n of neighbors8(g.x, g.y)) {
        const nk = `${n.x},${n.y}`;
        if (seen.has(nk)) continue;
        seen.add(nk);
        const t = map[n.y * w + n.x];
        if (t === RIVER_TILE) {
          let touchesVisited = false;
          for (const nn of neighbors8(n.x, n.y)) {
            if (visited.has(`${nn.x},${nn.y}`)) {
              const tt = map[nn.y * w + nn.x];
              if (tt === TILE_TYPES.GRASS || tt === TILE_TYPES.FLOWERS || tt === TILE_TYPES.LOG || tt === BRIDGE_TILE) {
                touchesVisited = true; break;
              }
            }
          }
          if (touchesVisited) {
            const score = Math.hypot(n.x - w/2, n.y - h/2) + Math.random() * 10;
            candidates.push({ x: n.x, y: n.y, score });
          }
        }
      }
    }
    if (candidates.length === 0) break;
    candidates.sort((a,b) => a.score - b.score);
    const placeCount = Math.min(3, Math.max(1, Math.floor(candidates.length / 6)));
    for (let i = 0; i < placeCount; i++) {
      const c = candidates[i];
      layBridgeTile(map, w, h, c.x, c.y, RIVER_TILE, BRIDGE_TILE);
    }
  }
}

function ensureInteractiveClearArea(map, w, h, opts = {}) {
  const {
    clearStartX = -1,
    clearEndX = -1,
    clearStartY = -1,
    clearEndY = -1,
    playerX = Math.floor(w / 2),
    playerY = Math.floor(h / 2),
    RIVER_TILE = (typeof TILE_TYPES !== 'undefined' && TILE_TYPES.RIVER) ? TILE_TYPES.RIVER : null
  } = opts;

  if (clearStartX < 0 || RIVER_TILE === null) return;

  const safeRadius = Math.max(2, Math.floor(Math.min(clearEndX - clearStartX, clearEndY - clearStartY) / 6));

  function insideClear(x, y) {
    return x > clearStartX && x < clearEndX && y > clearStartY && y < clearEndY;
  }

  for (let dy = -safeRadius; dy <= safeRadius; dy++) {
    for (let dx = -safeRadius; dx <= safeRadius; dx++) {
      const x = playerX + dx;
      const y = playerY + dy;
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      if (!insideClear(x, y)) continue;
      const idx = y * w + x;
      const tile = map[idx];
      if (tile === RIVER_TILE) {
        map[idx] = TILE_TYPES.LOG;
      } else if (tile === TILE_TYPES.FOREST || tile === TILE_TYPES.CLIFF) {
        map[idx] = TILE_TYPES.GRASS;
      }
    }
  }

  for (let yy = clearStartY + 1; yy < clearEndY; yy++) {
    for (let xx = clearStartX + 1; xx < clearEndX; xx++) {
      if (!insideClear(xx, yy)) continue;
      const idx = yy * w + xx;
      const tile = map[idx];
      if (tile === TILE_TYPES.RIVER) continue;
      if (tile === TILE_TYPES.FOREST || tile === TILE_TYPES.CLIFF) {
        map[idx] = TILE_TYPES.GRASS;
      }
    }
  }
}

function layBridgeTile(map, w, h, x, y, RIVER_TILE, BRIDGE_TILE) {
  if (x < 0 || x >= w || y < 0 || y >= h) return;
  const idx = y * w + x;
  map[idx] = BRIDGE_TILE;

  const cardinal = [
    { dx: 1, dy: 0, axis: 'h' },
    { dx: -1, dy: 0, axis: 'h' },
    { dx: 0, dy: 1, axis: 'v' },
    { dx: 0, dy: -1, axis: 'v' }
  ];

  let horizontalRiver = 0;
  let verticalRiver = 0;
  for (const dir of cardinal) {
    const nx = x + dir.dx;
    const ny = y + dir.dy;
    if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
    if (map[ny * w + nx] === RIVER_TILE) {
      if (dir.axis === 'h') horizontalRiver++;
      else verticalRiver++;
    }
  }

  const expandVertical = horizontalRiver > verticalRiver;
  const offsets = expandVertical
    ? [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }]
    : [{ dx: -1, dy: 0 }, { dx: 1, dy: 0 }];

  for (const off of offsets) {
    const nx = x + off.dx;
    const ny = y + off.dy;
    if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
    const nIdx = ny * w + nx;
    const tile = map[nIdx];
    if (tile === RIVER_TILE || tile === TILE_TYPES.FOREST || tile === TILE_TYPES.CLIFF || tile === TILE_TYPES.LOG || tile === TILE_TYPES.GRASS) {
      map[nIdx] = BRIDGE_TILE;
    }
  }
}

function smoothRiverTiles(map, w, h, opts = {}) {
  const {
    RIVER_TILE = (typeof TILE_TYPES !== 'undefined' && TILE_TYPES.RIVER) ? TILE_TYPES.RIVER : null,
    clearStartX = -1,
    clearEndX = -1,
    clearStartY = -1,
    clearEndY = -1
  } = opts;

  if (RIVER_TILE === null) return;

  function blockTouchesClear(x, y) {
    if (clearStartX < 0) return false;
    for (let dy = 0; dy <= 1; dy++) {
      for (let dx = 0; dx <= 1; dx++) {
        const bx = x + dx;
        const by = y + dy;
        if (bx > clearStartX && bx < clearEndX && by > clearStartY && by < clearEndY) {
          return true;
        }
      }
    }
    return false;
  }

  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      if (blockTouchesClear(x, y)) continue;
      const idx = y * w + x;
      const topLeft = map[idx];
      const topRight = map[idx + 1];
      const bottomLeft = map[idx + w];
      const bottomRight = map[idx + w + 1];
      const diagA = topLeft === RIVER_TILE && bottomRight === RIVER_TILE && topRight !== RIVER_TILE && bottomLeft !== RIVER_TILE;
      const diagB = topRight === RIVER_TILE && bottomLeft === RIVER_TILE && topLeft !== RIVER_TILE && bottomRight !== RIVER_TILE;
      if (diagA) {
        map[idx + 1] = RIVER_TILE;
        map[idx + w] = RIVER_TILE;
      } else if (diagB) {
        map[idx] = RIVER_TILE;
        map[idx + w + 1] = RIVER_TILE;
      }
    }
  }
}

function roundRiverTips(map, w, h, opts = {}) {
  const {
    RIVER_TILE = (typeof TILE_TYPES !== 'undefined' && TILE_TYPES.RIVER) ? TILE_TYPES.RIVER : null,
    clearStartX = -1,
    clearEndX = -1,
    clearStartY = -1,
    clearEndY = -1
  } = opts;

  if (RIVER_TILE === null) return;

  function insideClear(x, y) {
    if (clearStartX < 0) return false;
    return x > clearStartX && x < clearEndX && y > clearStartY && y < clearEndY;
  }

  const cardDirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 }
  ];

  const diagDirs = [
    { dx: 1, dy: 1 },
    { dx: -1, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 }
  ];

  const toGrass = new Set();

  function countCardinalRivers(x, y) {
    let count = 0;
    for (const d of cardDirs) {
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      if (map[ny * w + nx] === RIVER_TILE) count++;
    }
    return count;
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (map[idx] !== RIVER_TILE) continue;
      if (insideClear(x, y)) continue;

      const cardCount = countCardinalRivers(x, y);
      if (cardCount > 1) continue;

      for (const d of diagDirs) {
        const nx = x + d.dx;
        const ny = y + d.dy;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const nIdx = ny * w + nx;
        if (map[nIdx] !== RIVER_TILE) continue;
        if (insideClear(nx, ny)) continue;
        const diagCard = countCardinalRivers(nx, ny);
        if (diagCard <= 1) {
          toGrass.add(nIdx);
        }
      }
    }
  }

  for (const idx of toGrass) {
    if (map[idx] === RIVER_TILE) {
      map[idx] = TILE_TYPES.GRASS;
    }
  }
}

const UI_FONT_PATH = 'assets/3-GUI/font.ttf';

let spritesheetIdle = null;
const IDLE_SHEET_PATH = 'assets/2-Characters/1-Idle/idle_sheet.png';
const IDLE_SHEET_COLS = 4;
const IDLE_SHEET_ROWS = 6;
let spritesheetWalk = null;
let spritesheetRun = null;

let BUTTON_BG = null;


function injectCustomStyles() {
  try {
    if (typeof document === 'undefined' || !document.head) return;
    
    
    const existing = document.getElementById('gd-custom-styles');
    if (existing) existing.remove();

    const style = document.createElement('style');
    style.id = 'gd-custom-styles';
    const fontPath = (typeof UI_FONT_PATH !== 'undefined' ? UI_FONT_PATH : 'assets/3-GUI/font.ttf').replace(/\\/g, '/');
    
    style.type = 'text/css';
    style.appendChild(document.createTextNode(`
      @font-face {
        font-family: 'MyFont';
        src: url('${fontPath}') format('truetype');
      }
      * {
        font-family: 'MyFont', sans-serif !important;
        transition: all 0.18s ease;
      }
      /* Button Hover Effects */
      button:hover {
        transform: scale(1.05);
        text-shadow: 0 0 12px #ffffffaa;
        color: #ffea00 !important;
      }
      /* Inputs */
      input[type="checkbox"], select, input[type="range"] {
        accent-color: #ffcc00;
        cursor: pointer;
      }
      /* Range Sliders (Webkit) */
      input[type="range"] {
        height: 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.25);
        outline: none;
        -webkit-appearance: none;
        appearance: none;
      }
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 40px;
        height: 24px;
        border-radius: 12px;
        background: #ffcc00;
        box-shadow: 0 0 6px #ffcc0070;
        border: 2px solid #f5b800;
        cursor: pointer;
        margin-top: -7px; /* Align thumb vertically */
      }
      /* Range Sliders (Firefox) */
      input[type="range"]::-moz-range-thumb {
        width: 40px;
        height: 24px;
        border-radius: 12px;
        background: #ffcc00;
        border: 2px solid #f5b800;
        box-shadow: 0 0 6px #ffcc0070;
        cursor: pointer;
      }
      /* Specific UI Classes */
      .setting-label {
        color: white !important;
        text-shadow: 0 1px 4px black;
        pointer-events: none;
        font-size: 24px;
      }
      .setting-checkbox {
        display: flex;
        align-items: center;
      }
    `));
    document.head.appendChild(style);
  } catch (e) { console.warn('[game] injectCustomStyles failed', e); }
}


let SETTINGS_OVERLAY = null;
let ESC_MENU_BACKGROUND = null;
const WALK_SHEET_COMBINED = 'assets/2-Characters/2-Walking/16x16 Walk-Sheet.png';
const RUN_SHEET_COMBINED = 'assets/2-Characters/3-Running/16x16 Run-Sheet.png';
let playerAnimFrame = 0;
let playerAnimTimer = 0;
let playerAnimSpeed = 150;
const IDLE_DIRS = ['N','NE','E','SE','S','SW','W','NW'];

const IDLE_FRAME_PATHS = {
  N:   [null, null, null, null],
  NE:  [null, null, null, null],
  E:   [null, null, null, null],
  SE:  [null, null, null, null],
  S:   [null, null, null, null],
  SW:  [null, null, null, null],
  W:   [null, null, null, null],
  NW:  [null, null, null, null]
};

const IDLE_FRAME_TEMPLATE = null;
let idleFrames = { N:[], NE:[], E:[], SE:[], S:[], SW:[], W:[], NW:[] };
const WALK_FRAME_PATHS = {
  N:   [null, null, null, null],
  NE:  [null, null, null, null],
  E:   [null, null, null, null],
  SE:  [null, null, null, null],
  S:   [null, null, null, null],
  SW:  [null, null, null, null],
  W:   [null, null, null, null],
  NW:  [null, null, null, null]
};

const WALK_FRAME_TEMPLATE = null;

let walkFrames = { N:[], NE:[], E:[], SE:[], S:[], SW:[], W:[], NW:[] };
const RUN_FRAME_PATHS = {
  N:   [null, null, null, null],
  NE:  [null, null, null, null],
  E:   [null, null, null, null],
  SE:  [null, null, null, null],
  S:   [null, null, null, null],
  SW:  [null, null, null, null],
  W:   [null, null, null, null],
  NW:  [null, null, null, null]
};

const RUN_FRAME_TEMPLATE = null;

let runFrames = { N:[], NE:[], E:[], SE:[], S:[], SW:[], W:[], NW:[] };
const IDLE_SHEET_PATHS = {
    N:  'assets/2-Characters/2-Walking/walk_sheet_north.png',
    NE: 'assets/2-Characters/2-Walking/walk_sheet_northeast.png',
    E:  'assets/2-Characters/2-Walking/walk_sheet_east.png',
    SE: 'assets/2-Characters/2-Walking/walk_sheet_southeast.png',
    S:  'assets/2-Characters/2-Walking/walk_sheet_south.png',
    SW: 'assets/2-Characters/2-Walking/walk_sheet_southwest.png',
    W:  'assets/2-Characters/2-Walking/walk_sheet_west.png',
    NW: 'assets/2-Characters/2-Walking/walk_sheet_northwest.png'
};

let idleSheets = { N:null, NE:null, E:null, SE:null, S:null, SW:null, W:null, NW:null };
let walkSheets = { N:null, NE:null, E:null, SE:null, S:null, SW:null, W:null, NW:null };
let runSheets = { N:null, NE:null, E:null, SE:null, S:null, SW:null, W:null, NW:null };

const JUMP_SHEET_PATHS = {
    N:  'assets/2-Characters/4-Jumping/jump_sheet_north.png',
    NE: 'assets/2-Characters/4-Jumping/jump_sheet_northeast.png',
    E:  'assets/2-Characters/4-Jumping/jump_sheet_east.png',
    SE: 'assets/2-Characters/4-Jumping/jump_sheet_southeast.png',
    S:  'assets/2-Characters/4-Jumping/jump_sheet_south.png',
    SW: 'assets/2-Characters/4-Jumping/jump_sheet_southwest.png',
    W:  'assets/2-Characters/4-Jumping/jump_sheet_west.png',
    NW: 'assets/2-Characters/4-Jumping/jump_sheet_northwest.png'
};
let jumpSheets = { N:null, NE:null, E:null, SE:null, S:null, SW:null, W:null, NW:null };
let isJumping = false;
let jumpTimer = 0;
let jumpFrame = 0;
const JUMP_FRAME_COUNT = 5;
const JUMP_ANIM_SPEED = 100; 
const JUMP_DURATION = JUMP_FRAME_COUNT * JUMP_ANIM_SPEED;
let jumpStartY = 0;
let facing = 'right';
let lastMoveDX = 0;
let lastMoveDY = 1;
let lastDirection = 'S';

function deltaToDirection(dx, dy) {
  const eps = 0.01;
  if (Math.abs(dx) <= eps && Math.abs(dy) <= eps) return lastDirection || 'S';
  if (dx < -eps && dy > eps) return 'SW';
  if (dx < -eps && Math.abs(dy) <= eps) return 'W';
  if (dx < -eps && dy < -eps) return 'NW';
  if (Math.abs(dx) <= eps && dy < -eps) return 'N';
  if (Math.abs(dx) <= eps && dy > eps) return 'S';
  if (dx > eps && dy > eps) return 'SE';
  if (dx > eps && Math.abs(dy) <= eps) return 'E';
  if (dx > eps && dy < -eps) return 'NE';
  return 'S';
}

function directionToDelta(dir) {
  
  switch ((dir || '').toUpperCase()) {
    case 'N':  return { dx: 0, dy: -1 };
    case 'NE': return { dx: 1, dy: -1 };
    case 'E':  return { dx: 1, dy: 0 };
    case 'SE': return { dx: 1, dy: 1 };
    case 'S':  return { dx: 0, dy: 1 };
    case 'SW': return { dx: -1, dy: 1 };
    case 'W':  return { dx: -1, dy: 0 };
    case 'NW': return { dx: -1, dy: -1 };
    default:   return { dx: 0, dy: 0 };
  }
}


let W, H;
let logicalW, logicalH;
const cellSize = 32;


// Brown-pixel diagnostic removed. No runtime diagnostic state required.


const BASE_ELEVATION_THRESHOLD = 0.5;
const BASE_BUSH_THRESHOLD = 0.65;


let mapStates;
let terrainLayer;


let playerPosition = null;

const BASE_MOVE_DURATION_MS = 100;
const BASE_MOVE_COOLDOWN_MS = 160;
const SPRINT_MOVE_DURATION_MS = 48;
const SPRINT_MOVE_COOLDOWN_MS = 140;
const SPRINT_MAX_DURATION_MS = 3000;
const SPRINT_COOLDOWN_MS = 4000;


let renderX = 0;
let renderY = 0;
let renderStartX = 0;
let renderStartY = 0;
let renderTargetX = 0;
let renderTargetY = 0;
let isMoving = false;
let queuedMove = null;
let prevKeyA = false;
let prevKeyD = false;
let prevKeyW = false;
let prevKeyS = false;

let holdState = {
  A: { start: 0, last: 0 },
  D: { start: 0, last: 0 },
  W: { start: 0, last: 0 },
  S: { start: 0, last: 0 }
};

const HOLD_INITIAL_DELAY_MS = 120;
const HOLD_REPEAT_INTERVAL_MS = 70;
let moveStartMillis = 0;
let lastMoveDurationMs = BASE_MOVE_DURATION_MS;

const SPAWN_CLEAR_RADIUS = 3;
let lastMoveTime = 0;
let sprintActive = false;
let sprintEndMillis = 0;
let sprintCooldownUntil = 0;

let mapImage;
let mapOverlays = [];
let spritesheet = null;
const SPRITESHEET_PATH = 'assets/1-Background/test3.png';
let spirtesheet_idle = null;

const TILE_TYPES = Object.freeze({
  GRASS: 1,
  FOREST: 2,
  MOB: 3,
  
  CHEST: 100,
  HEALTH: 101,
  POWERUP: 102,
  
  CLIFF: 6,
  RAMP: 7, 
  LOG: 8,
  FLOWERS: 9,
  CAVE: 10,
  RIVER: 11,
  BORDER: 12,
  HILL_NORTH: 13,
  HILL_NORTHEAST: 14,
  HILL_EAST: 15,
  HILL_SOUTHEAST: 16,
  HILL_SOUTH: 17,
  HILL_SOUTHWEST: 18,
  HILL_WEST: 19,
  HILL_NORTHWEST: 20,
});

const WALKABLE_TILES = new Set([
  TILE_TYPES.GRASS, TILE_TYPES.LOG, TILE_TYPES.FLOWERS, TILE_TYPES.RAMP
]);

const ITEM_DATA = Object.freeze({
  [TILE_TYPES.CHEST]:  { label: 'CHEST', spawnRate: 0.01, color: [218, 165, 32] },
  [TILE_TYPES.HEALTH]: { label: 'HEALTH', spawnRate: 0.005, color: [0, 255, 127] },
  [TILE_TYPES.POWERUP]:{ label: 'POWERUP', spawnRate: 0.003, color: [138, 43, 226] },
});

const SPRITES = {
  [TILE_TYPES.GRASS]: { x: 0, y: 0, w: 16, h: 16 },
  [TILE_TYPES.FOREST]: { x: 862, y: 191, w: 32, h: 32, drawW: 64, drawH: 64 },
  [TILE_TYPES.CLIFF]: { x: 862, y: 0, w: 16, h: 16 },
  [TILE_TYPES.RAMP]: { x: 400, y: 224, w: 64, h: 64 }
  
};


const TILE_IMAGE_PATHS = {
  [TILE_TYPES.FOREST]: 'assets/1-Background/2-Game/tree_1.png'
};


const TREE_OVERLAY_PATH = 'assets/1-Background/2-Game/1-Forest/tree_1.png';
let TREE_OVERLAY_IMG = null;
let treeObjects = []; 
const TREE_SPAWN_CHANCE = 0.0001;
let edgeLayer = null;
let EDGE_LAYER_ENABLED = false; 
let EDGE_LAYER_DEBUG = false;
let EDGE_LAYER_COLOR = [76, 175, 80, 200];
function setEdgeLayerColor(r, g, b, a = 200) { EDGE_LAYER_COLOR = [Number(r)||0, Number(g)||0, Number(b)||0, Number(a)||0]; console.log('[game] EDGE_LAYER_COLOR=', EDGE_LAYER_COLOR); }
function setEdgeLayerEnabled(v) { EDGE_LAYER_ENABLED = !!v; console.log('[game] EDGE_LAYER_ENABLED=', EDGE_LAYER_ENABLED); }
function setEdgeLayerDebug(v) { EDGE_LAYER_DEBUG = !!v; console.log('[game] EDGE_LAYER_DEBUG=', EDGE_LAYER_DEBUG); }
try { window.setEdgeLayerEnabled = setEdgeLayerEnabled; window.setEdgeLayerDebug = setEdgeLayerDebug; } catch (e) {}
try { window.setEdgeLayerColor = setEdgeLayerColor; } catch (e) {}

let TILE_IMAGES = { };

let CUSTOM_ASSETS_OFF = false;
let __ASSET_BACKUP = null;
function backupCustomAssets() {
  try {
    __ASSET_BACKUP = {
      tile_1: TILE_IMAGES['tile_1'] || null,
      tree_1: TILE_IMAGES['tree_1'] || null,
      water_1: TILE_IMAGES['water_1'] || null,
      bridge_1: TILE_IMAGES['bridge_1'] || null,
      gentle_forest: TILE_IMAGES['gentle_forest'] || null,
      gentle_trees: TILE_IMAGES['gentle_trees'] || null,
      tree_overlay: TREE_OVERLAY_IMG || null,
      river_alias: TILE_IMAGES[TILE_TYPES.RIVER] || null,
      ramp_alias: TILE_IMAGES[TILE_TYPES.RAMP] || null,
      log_alias: TILE_IMAGES[TILE_TYPES.LOG] || null,
      grass_alias: TILE_IMAGES[TILE_TYPES.GRASS] || null,
      forest_alias: TILE_IMAGES[TILE_TYPES.FOREST] || null
    };
  } catch (e) { __ASSET_BACKUP = null; }
}

function removeCustomAssetsRuntime() {
  try {
    TILE_IMAGES['tile_1'] = null;
    TILE_IMAGES['tree_1'] = null;
    TILE_IMAGES['gentle_forest'] = null;
    TILE_IMAGES['gentle_trees'] = null;
    TILE_IMAGES['water_1'] = null;
    TILE_IMAGES['bridge_1'] = null;
    TREE_OVERLAY_IMG = null;
    try { TILE_IMAGES[TILE_TYPES.RIVER] = null; } catch (e) {}
    try { TILE_IMAGES[TILE_TYPES.RAMP] = null; } catch (e) {}
    try { TILE_IMAGES[TILE_TYPES.LOG] = null; } catch (e) {}
    try { TILE_IMAGES[TILE_TYPES.GRASS] = null; } catch (e) {}
    try { TILE_IMAGES[TILE_TYPES.FOREST] = null; } catch (e) {}
    CUSTOM_ASSETS_OFF = true;
    console.log('[game] custom assets removed (runtime)');
  } catch (e) { console.warn('[game] removeCustomAssetsRuntime failed', e); }
}

function restoreCustomAssetsRuntime() {
  try {
    if (!__ASSET_BACKUP) return;
    TILE_IMAGES['tile_1'] = __ASSET_BACKUP.tile_1 || TILE_IMAGES['tile_1'];
    TILE_IMAGES['tree_1'] = __ASSET_BACKUP.tree_1 || TILE_IMAGES['tree_1'];
    TILE_IMAGES['gentle_forest'] = __ASSET_BACKUP.gentle_forest || TILE_IMAGES['gentle_forest'];
    TILE_IMAGES['gentle_trees'] = __ASSET_BACKUP.gentle_trees || TILE_IMAGES['gentle_trees'];
    TILE_IMAGES['water_1'] = __ASSET_BACKUP.water_1 || TILE_IMAGES['water_1'];
    TILE_IMAGES['bridge_1'] = __ASSET_BACKUP.bridge_1 || TILE_IMAGES['bridge_1'];
    TREE_OVERLAY_IMG = __ASSET_BACKUP.tree_overlay || TREE_OVERLAY_IMG;
    try { TILE_IMAGES[TILE_TYPES.RIVER] = __ASSET_BACKUP.river_alias || TILE_IMAGES[TILE_TYPES.RIVER]; } catch (e) {}
    try { TILE_IMAGES[TILE_TYPES.RAMP] = __ASSET_BACKUP.ramp_alias || TILE_IMAGES[TILE_TYPES.RAMP]; } catch (e) {}
    try { TILE_IMAGES[TILE_TYPES.LOG] = __ASSET_BACKUP.log_alias || TILE_IMAGES[TILE_TYPES.LOG]; } catch (e) {}
    try { TILE_IMAGES[TILE_TYPES.GRASS] = __ASSET_BACKUP.grass_alias || TILE_IMAGES[TILE_TYPES.GRASS]; } catch (e) {}
    try { TILE_IMAGES[TILE_TYPES.FOREST] = __ASSET_BACKUP.forest_alias || TILE_IMAGES[TILE_TYPES.FOREST]; } catch (e) {}
    CUSTOM_ASSETS_OFF = false;
    console.log('[game] custom assets restored (runtime)');
  } catch (e) { console.warn('[game] restoreCustomAssetsRuntime failed', e); }
}

function toggleCustomAssetsRuntime() {
  if (!CUSTOM_ASSETS_OFF) {
    backupCustomAssets();
    removeCustomAssetsRuntime();
  } else {
    restoreCustomAssetsRuntime();
  }
}

const COLORS = {
  [TILE_TYPES.GRASS]: [50, 205, 50],
  [TILE_TYPES.FOREST]: [0, 100, 0],
  [TILE_TYPES.MOB]: [64, 64, 64],
  [TILE_TYPES.CLIFF]: [205, 133, 63],
  [TILE_TYPES.RAMP]: [210, 180, 140],
  [TILE_TYPES.RIVER]: [65, 105, 225],
  [TILE_TYPES.LOG]: [139, 69, 19],
  [TILE_TYPES.FLOWERS]: [255, 105, 180],
  [TILE_TYPES.CAVE]: [47, 79, 79],
  [TILE_TYPES.BORDER]: [0, 0, 0],
  [TILE_TYPES.CHEST]: ITEM_DATA[TILE_TYPES.CHEST].color,
  [TILE_TYPES.HEALTH]: ITEM_DATA[TILE_TYPES.HEALTH].color,
  [TILE_TYPES.POWERUP]: ITEM_DATA[TILE_TYPES.POWERUP].color,
  player: [128, 128, 128]
};

const RIVER_CLEAR_MODES = Object.freeze({ ALWAYS: 'always', NEVER: 'never', AUTO: 'auto' });
let riverClearMode = RIVER_CLEAR_MODES.AUTO;

const SPRITE_ALLOWED_TILES = new Set([TILE_TYPES.GRASS, TILE_TYPES.FOREST]);


const ENVIRONMENTS = ['Rainforest', 'Grasslands', 'Desert', 'Savannah', 'Forest', 'Wetlands', 'Flower'];


let currentEnvironment = 'Forest';


function RandomEnvironment() {
  const idx = Math.floor(Math.random() * ENVIRONMENTS.length);
  const env = ENVIRONMENTS[idx];
  currentEnvironment = env;
  applyEnvironmentDefaults(env);
  return env;
}


function applyEnvironmentDefaults(env) {
}

const DIFFICULTIES = ['easy', 'normal', 'hard'];
const DIFFICULTY_LABELS = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };

const MOB_SPAWN_TUNING = Object.freeze({
  easy:   { mobChance: 0.08, maxMobs: 30 },
  normal: { mobChance: 0.011, maxMobs: 120 },
  hard:   { mobChance: 0.2,  maxMobs: 300 }
});

let currentDifficulty = 'normal';
const DIFFICULTY_SETTINGS = {
  easy:   { mobChance: 0.03,  maxMobs: 40, rampRatio: 0.08 },
  normal: { mobChance: 0.038, maxMobs: 60, rampRatio: 0.15 },
  hard:   { mobChance: 0.10,  maxMobs: 300, rampRatio: 0.20 }
};

function normalizeDifficultyValue(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return DIFFICULTIES.includes(normalized) ? normalized : null;
}

function setDifficulty(value, { regenerate = true, reason = 'unknown' } = {}) {
  const normalized = normalizeDifficultyValue(value);
  if (!normalized) return false;
  if (normalized === currentDifficulty) return false;
  currentDifficulty = normalized;
  console.log(`[game] difficulty set to ${normalized} (${reason})`);
  if (regenerate && typeof generateMap === 'function' && W && H) {
    generateMap();
  }
  return true;
}

function getDifficultyDisplayLabel(value = currentDifficulty) {
  return DIFFICULTY_LABELS[value] || DIFFICULTY_LABELS.normal;
}

let currentGenParams = {};
let showTextures = true;
let counts = {};

let nextGenerateIsManual = false;

const HILL_DIRECTIONS = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
const HILL_ASSETS = {};

function preload() {
  try { ensureLoadingOverlayDom(); overlayMessage = 'Loading assets...'; updateLoadingOverlayDom(); } catch (e) {}
  try {
    trackLoadImage('spritesheet:' + SPRITESHEET_PATH, SPRITESHEET_PATH, (img) => { spritesheet = img; console.log('[game] loaded spritesheet', SPRITESHEET_PATH, img.width, 'x', img.height); }, (err) => { spritesheet = null; console.warn('[game] failed to load spritesheet', SPRITESHEET_PATH, err); });
  } catch (e) {}
  
  HILL_DIRECTIONS.forEach(dir => {
    const path = `assets/1-Background/2-Game/1-Forest/1-hill_${dir}.png`;
    trackLoadImage(`hill_${dir}`, path, (img) => {
        try {
          
          if (typeof img.loadPixels === 'function') img.loadPixels();
          if (img.pixels && img.pixels.length) {
            for (let i = 0; i < img.pixels.length; i += 4) {
              const r = img.pixels[i];
              const g = img.pixels[i + 1];
              const b = img.pixels[i + 2];
              if (r > 240 && g > 240 && b > 240) { 
                img.pixels[i + 3] = 0; 
              } else if (g > 100 && r < 80 && b < 80) { 
                img.pixels[i + 3] = 0; 
              }
            }
            try { img.updatePixels(); } catch (e) {}
          }
          
          try { const fixed = cleanImageBrown(img); if (fixed) console.log('[preload] cleaned brown pixels from hill asset', dir, 'fixed=', fixed); } catch (e) {}
        } catch (e) {}
        HILL_ASSETS[dir] = img;
    });
  });

  
  try {
    trackLoadImage('button_bg', 'assets/3-GUI/Button BG.png', (img) => { BUTTON_BG = img; console.log('[game] loaded BUTTON_BG', img && img.width, 'x', img && img.height); }, (err) => { console.warn('[game] failed to load BUTTON_BG', err); BUTTON_BG = null; });
  } catch (e) {}

  try {
    trackLoadImage('settings_overlay', 'assets/1-Background/1-Menu/Settings_Background.png', (img) => { SETTINGS_OVERLAY = img; console.log('[game] loaded SETTINGS_OVERLAY', img && img.width, 'x', img && img.height); }, (err) => { console.warn('[game] failed to load SETTINGS_OVERLAY', err); SETTINGS_OVERLAY = null; });
  } catch (e) {}

  try {
    trackLoadImage('esc_menu_background', 'assets/1-Background/1-Menu/Background.png', (img) => { ESC_MENU_BACKGROUND = img; console.log('[game] loaded ESC_MENU_BACKGROUND'); }, (err) => { console.warn('[game] failed to load ESC_MENU_BACKGROUND', err); ESC_MENU_BACKGROUND = null; });
  } catch (e) {}

  TILE_IMAGES['forest'] = null;
  TILE_IMAGES['gentle_forest'] = null;
  TILE_IMAGES['gentle_trees'] = null;
  TILE_IMAGES['tile_1'] = null;
  TILE_IMAGES['tree_1'] = null;
  TILE_IMAGES['water_1'] = null;
  TILE_IMAGES['bridge_1'] = null;
  try {
    
    
    
    
    
    
    
    
    trackLoadImage('tile_1', 'assets/1-Background/2-Game/1-Forest/tile_1.png',
      (img) => { TILE_IMAGES['tile_1'] = img; },
      (err) => { TILE_IMAGES['tile_1'] = null; }
    );
    trackLoadImage('tree_1', 'assets/1-Background/2-Game/1-Forest/tree_1.png',
      (img) => { TILE_IMAGES['tree_1'] = img; },
      (err) => { TILE_IMAGES['tree_1'] = null; }
    );
    trackLoadImage('water_1', 'assets/1-Background/2-Game/1-Forest/water_1.png',
      (img) => { TILE_IMAGES['water_1'] = img; try { TILE_IMAGES[TILE_TYPES.RIVER] = img; } catch (e) {} },
      (err) => { TILE_IMAGES['water_1'] = null; }
    );
    trackLoadImage('bridge_1', 'assets/1-Background/2-Game/1-Forest/bridge_1.png',
      (img) => { TILE_IMAGES['bridge_1'] = img; try { TILE_IMAGES[TILE_TYPES.RAMP] = img; TILE_IMAGES[TILE_TYPES.LOG] = img; } catch (e) {} },
      (err) => { TILE_IMAGES['bridge_1'] = null; }
    );
  } catch (e) {}
  
  if (TREE_OVERLAY_PATH) {
    try {
      trackLoadImage('treeoverlay:' + TREE_OVERLAY_PATH, TREE_OVERLAY_PATH,
        (img) => { TREE_OVERLAY_IMG = img; console.log('[game] loaded tree overlay', TREE_OVERLAY_PATH, img.width, 'x', img.height); },
        (err) => { console.warn('[game] failed to load tree overlay', TREE_OVERLAY_PATH, err); TREE_OVERLAY_IMG = null; }
      );
    } catch (e) {}
  }
  try { trackLoadImage('idle_sheet:' + IDLE_SHEET_PATH, IDLE_SHEET_PATH, (img) => { console.log('[game] loaded idle spritesheet', IDLE_SHEET_PATH, img.width, 'x', img.height); spritesheetIdle = img; }, (err) => { console.warn('[game] failed to load idle spritesheet', err); spritesheetIdle = null; }); } catch (e) {}
  try { trackLoadImage('walk_sheet_combined:' + WALK_SHEET_COMBINED, WALK_SHEET_COMBINED, (img) => { console.log('[game] loaded walk combined sheet', WALK_SHEET_COMBINED, img.width, 'x', img.height); spritesheetWalk = img; }, (err) => { spritesheetWalk = null; }); } catch (e) {}
  try { trackLoadImage('run_sheet_combined:' + RUN_SHEET_COMBINED, RUN_SHEET_COMBINED, (img) => { console.log('[game] loaded run combined sheet', RUN_SHEET_COMBINED, img.width, 'x', img.height); spritesheetRun = img; }, (err) => { spritesheetRun = null; }); } catch (e) {}
  uiFont = loadFont(UI_FONT_PATH, () => {}, (err) => {
    console.warn('[game] failed to load UI font', err);
    uiFont = null;
  });
  IDLE_DIRS.forEach(dir => {
    const paths = IDLE_FRAME_PATHS[dir];
    idleFrames[dir] = [];
    if (Array.isArray(paths)) {
      paths.forEach((p, idx) => {
        if (p) {
          idleFrames[dir][idx] = null;
          loadImage(p,
            (img) => { idleFrames[dir][idx] = img; console.log('[game] loaded frame', dir, idx, p, img.width, 'x', img.height); },
            (err) => { console.warn('[game] failed to load frame', dir, idx, p, err); idleFrames[dir][idx] = null; }
          );
        } else {
          idleFrames[dir][idx] = null;
        }
      });
    } else if (IDLE_FRAME_TEMPLATE) {
      for (let i = 0; i < IDLE_SHEET_COLS; i++) {
        const p = IDLE_FRAME_TEMPLATE.replace('{DIR}', dir).replace('{COL}', String(i));
        idleFrames[dir][i] = loadImage(p,
          () => { console.log('[game] loaded frame', dir, i, p); },
          (err) => { console.warn('[game] failed to load frame', dir, i, p, err); idleFrames[dir][i] = null; }
        );
      }
    }
    const sheetPath = IDLE_SHEET_PATHS[dir];
    idleSheets[dir] = null;
    if (sheetPath) {
      idleSheets[dir] = null;
      try {
        trackLoadImage('idle_sheet_dir:' + sheetPath, sheetPath,
          (img) => { idleSheets[dir] = img; console.log('[game] loaded direction sheet', dir, sheetPath, img.width, 'x', img.height); },
          (err) => { console.warn('[game] failed to load direction sheet', dir, sheetPath, err); idleSheets[dir] = null; }
        );
      } catch (e) { idleSheets[dir] = null; }
    } else {
      idleSheets[dir] = null;
    }
  });
  IDLE_DIRS.forEach(dir => {
    const paths = WALK_FRAME_PATHS[dir];
    walkFrames[dir] = [];
    if (Array.isArray(paths)) {
      paths.forEach((p, idx) => {
        if (p) {
          walkFrames[dir][idx] = null;
          loadImage(p,
            (img) => { walkFrames[dir][idx] = img; console.log('[game] loaded walk frame', dir, idx, p, img.width, 'x', img.height); },
            (err) => { console.warn('[game] failed to load walk frame', dir, idx, p, err); walkFrames[dir][idx] = null; }
          );
        } else {
          walkFrames[dir][idx] = null;
        }
      });
    } else if (WALK_FRAME_TEMPLATE) {
      for (let i = 0; i < IDLE_SHEET_COLS; i++) {
        const p = WALK_FRAME_TEMPLATE.replace('{DIR}', dir).replace('{COL}', String(i));
        walkFrames[dir][i] = loadImage(p,
          () => { console.log('[game] loaded walk frame', dir, i, p); },
          (err) => { console.warn('[game] failed to load walk frame', dir, i, p, err); walkFrames[dir][i] = null; }
        );
      }
    }
  });
  IDLE_DIRS.forEach(dir => {
    const paths = RUN_FRAME_PATHS[dir];
    runFrames[dir] = [];
    if (Array.isArray(paths)) {
      paths.forEach((p, idx) => {
        if (p) {
          runFrames[dir][idx] = null;
          loadImage(p,
            (img) => { runFrames[dir][idx] = img; console.log('[game] loaded run frame', dir, idx, p, img.width, 'x', img.height); },
            (err) => { console.warn('[game] failed to load run frame', dir, idx, p, err); runFrames[dir][idx] = null; }
          );
        } else {
          runFrames[dir][idx] = null;
        }
      });
    } else if (RUN_FRAME_TEMPLATE) {
      for (let i = 0; i < IDLE_SHEET_COLS; i++) {
        const p = RUN_FRAME_TEMPLATE.replace('{DIR}', dir).replace('{COL}', String(i));
        runFrames[dir][i] = loadImage(p,
          () => { console.log('[game] loaded run frame', dir, i, p); },
          (err) => { console.warn('[game] failed to load run frame', dir, i, p, err); runFrames[dir][i] = null; }
        );
      }
    }
  });
  const WALK_SHEET_PATHS = {
    N:  'assets/2-Characters/2-Walking/walk_sheet_north.png',
    NE: 'assets/2-Characters/2-Walking/walk_sheet_northeast.png',
    E:  'assets/2-Characters/2-Walking/walk_sheet_east.png',
    SE: 'assets/2-Characters/2-Walking/walk_sheet_southeast.png',
    S:  'assets/2-Characters/2-Walking/walk_sheet_south.png',
    SW: 'assets/2-Characters/2-Walking/walk_sheet_southwest.png',
    W:  'assets/2-Characters/2-Walking/walk_sheet_west.png',
    NW: 'assets/2-Characters/2-Walking/walk_sheet_northwest.png'
  };
  const RUN_SHEET_PATHS = { N: null, NE: null, E: null, SE: null, S: null, SW: null, W: null, NW: null };
  IDLE_DIRS.forEach(dir => {
    const wp = WALK_SHEET_PATHS[dir];
    walkSheets[dir] = null;
    if (wp) {
      try {
        trackLoadImage('walk_sheet_dir:' + wp, wp, (img) => { walkSheets[dir] = img; console.log('[game] loaded walk sheet', dir, wp, img.width, 'x', img.height); }, (err) => { console.warn('[game] failed to load walk sheet', dir, wp, err); walkSheets[dir] = null; });
      } catch (e) { walkSheets[dir] = null; }
    }
    const rp = RUN_SHEET_PATHS[dir];
    runSheets[dir] = null;
    if (rp) {
      try {
        trackLoadImage('run_sheet_dir:' + rp, rp, (img) => { runSheets[dir] = img; console.log('[game] loaded run sheet', dir, rp, img.width, 'x', img.height); }, (err) => { console.warn('[game] failed to load run sheet', dir, rp, err); runSheets[dir] = null; });
      } catch (e) { runSheets[dir] = null; }
    }
  });

  IDLE_DIRS.forEach(dir => {
    const jp = JUMP_SHEET_PATHS[dir];
    jumpSheets[dir] = null;
    if (jp) {
      try {
        trackLoadImage('jump_sheet_dir:' + jp, jp, (img) => { jumpSheets[dir] = img; console.log('[game] loaded jump sheet', dir, jp, img.width, 'x', img.height); }, (err) => { console.warn('[game] failed to load jump sheet', dir, jp, err); jumpSheets[dir] = null; });
      } catch (e) { jumpSheets[dir] = null; }
    }
  });

  try { trackLoadSound('gameMusic:assets/8-Music/game_music.wav', 'assets/8-Music/game_music.wav', (snd) => { gameMusic = snd; }, (err) => { gameMusic = null; }); } catch (e) { try { gameMusic = loadSound('assets/8-Music/game_music.wav'); } catch (ee) { gameMusic = null; } }
}

function setup() {
  console.log('[game] setup()');
  W = windowWidth;
  H = windowHeight;
  virtualW = W;
  virtualH = H;
  createCanvas(W, H);
  noSmooth();
  try { injectCustomStyles(); } catch (e) { console.warn('[game] injectCustomStyles call failed', e); }
  const urlParams = new URLSearchParams(window.location.search);
  masterVol = parseFloat(urlParams.get('masterVol')) || 0.8;
  musicVol = parseFloat(urlParams.get('musicVol')) || 0.6;
  sfxVol = parseFloat(urlParams.get('sfxVol')) || 0.7;
  const urlDifficulty = urlParams.get('difficulty');
  setDifficulty(urlDifficulty, { regenerate: false, reason: 'url-param' });
  const urlRiverClear = (urlParams.get('riverClear') || '').toLowerCase();
  if (urlRiverClear === RIVER_CLEAR_MODES.ALWAYS || urlRiverClear === 'true') {
    riverClearMode = RIVER_CLEAR_MODES.ALWAYS;
  } else if (urlRiverClear === RIVER_CLEAR_MODES.NEVER || urlRiverClear === 'false') {
    riverClearMode = RIVER_CLEAR_MODES.NEVER;
  } else {
    riverClearMode = RIVER_CLEAR_MODES.AUTO;
  }
  
  let loadedFromStorage = false;
  let loadedFromServer = false;
  let serverFetchPromise = Promise.resolve(false);
  try {
    const tryServer = (typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost')) || (new URLSearchParams(window.location.search).get('useServer') === '1');
    if (!isNewGame && tryServer) {
      try {
        serverFetchPromise = tryFetchActiveMap();
      } catch (e) { console.warn('[game] tryFetchActiveMap failed', e); serverFetchPromise = Promise.resolve(false); }
    } else {
      if (!isNewGame) console.log('[game] skipping workspace server fetch (not on localhost)');
      else console.log('[game] new game detected, will generate a fresh map.');
    }
  } catch (e) { console.warn('[game] loadMapFromStorage/Server init failed', e); serverFetchPromise = Promise.resolve(false); }

  // --- REPLACE THE ENTIRE AssetTracker.waitReady BLOCK WITH THIS ---
  AssetTracker.waitReady(3500).then((ready) => {
    if (ready) {
      console.log('[game] assets loaded before map init');
    } else {
      console.warn('[game] assets did not fully load before timeout; proceeding');
      try { showToast('Asset load timeout — processing map...', 'warn', 3000); } catch (e) {}
    }

    // Helper function to handle missing map
    const ensureGameStarts = () => {
        console.log('[game] No saved map found (or load failed). Auto-generating new map...');
        generateMap();
    };

    try {
      serverFetchPromise.then((serverLoaded) => {
        try {
          loadedFromServer = !!serverLoaded;
          
          // If server didn't have a map, try local storage
          if (!loadedFromServer) {
            loadedFromStorage = !!loadMapFromStorage();
          }

          // If NEITHER had a map, generate one automatically
          if (!loadedFromStorage && !loadedFromServer) {
             ensureGameStarts();
          } else {
            // We found a map! Draw it.
            try { createMapImage(); redraw(); } catch (e) { console.warn('[game] failed to recreate mapImage', e); }
          }
        } catch (e) { 
          console.warn('[game] error in map load logic, falling back to auto-gen', e);
          ensureGameStarts();
        }
      }).catch((e) => {
        // If the server check completely crashed/failed, we still need to start the game!
        console.warn('[game] serverFetchPromise failed, checking storage...', e);
        if (!loadMapFromStorage()) {
           ensureGameStarts();
        } else {
           try { createMapImage(); redraw(); } catch (err) {}
        }
      });
    } catch (e) {
      console.warn('[game] fatal error in setup promise, forcing auto-gen', e);
      ensureGameStarts();
    }
    
    if (!ready) {
      // If assets were late, register a callback to refresh the map once they arrive
      try {
        AssetTracker.onReady(() => {
          try {
            console.log('[game] assets finished after timeout — refreshing map image');
            createMapImage(); 
            redraw(); 
          } catch (e) {}
        });
      } catch (e) {}
    }
  });
  // --- END REPLACEMENT ---
  if (gameMusic) {
    gameMusic.setVolume(musicVol * masterVol);
  }
  if (pendingGameActivated) {
    try { _confirmResize(); pendingGameActivated = false; } catch (e) { console.warn('[game] pending _confirmResize failed', e); }
  }
}

function draw() {
  if (typeof window !== 'undefined' && window && window.__gameDebugShown !== true) { console.log('[game] draw() running'); window.__gameDebugShown = true; }
  
  
  try { ensureLoadingOverlayDom(); updateLoadingOverlayDom(); } catch (e) {}

  push(); 

  const mapW = (logicalW || 0) * cellSize;
  if (mapW > 0) {
      const scaleFactor = width / mapW;
      if (scaleFactor < 1) {
          scale(scaleFactor);
      }
  }

  background(34, 139, 34);
  if (mapImage) {
    image(mapImage, 0, 0);
  }

  if (showLoadingOverlay) {
    background(0); // Draws a solid black background
    return;        // Stops the game from drawing anything else underneath
  }
  
  if (playerPosition) {
    handleMovement();
    updateMovementInterpolation();
  }

  try {
    const drawables = [];
    if (Array.isArray(mapOverlays)) {
      for (const o of mapOverlays) {
          if (!o) continue;
          const drawX = o.px + Math.floor((cellSize - o.destW) / 2);
          const drawY = o.py + (cellSize - o.destH);
          const baseY = o.py + cellSize;
          drawables.push({ type: 'overlay', o, drawX, drawY, baseY });
        }
    }
    
    if (playerPosition) {
      const drawTileX = isMoving ? renderX : playerPosition.x;
      const drawTileY = isMoving ? renderY : playerPosition.y;
      const playerBaseY = (drawTileY * cellSize) + cellSize;
      drawables.push({ type: 'player', baseY: playerBaseY });
    }
    
    drawables.sort((a, b) => (a.baseY - b.baseY));
    
    for (const d of drawables) {
      if (d.type === 'overlay') {
        const o = d.o;
        try {
          if (o.imgType === 'image' && o.img) {
            image(o.img, d.drawX, d.drawY, o.destW, o.destH);
          } else if (o.imgType === 'sheet' && o.s) {
            image(spritesheet, d.drawX, d.drawY, o.destW, o.destH, o.s.x, o.s.y, o.s.w, o.s.h);
          }
        } catch (e) { console.warn('[game] draw overlay failed', e); }
      } else if (d.type === 'player') {
        try { drawPlayer(); } catch (e) { console.warn('[game] drawPlayer failed in ordered draw', e); }
      }
    }
  } catch (e) { console.warn('[game] depth-sorted draw failed', e); }

  pop(); 

  drawDifficultyBadge();
  drawSprintMeter();
  if (EDGE_LAYER_DEBUG && edgeLayer && logicalW && logicalH) {
    push();
    noStroke();
    fill(255, 0, 0, 100);
    for (let y = 0; y < logicalH; y++) {
      for (let x = 0; x < logicalW; x++) {
        const idx = y * logicalW + x;
        if (edgeLayer[idx]) rect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
    pop();
  }
  
  try {
    if (typeof drawInGameMenu === 'function') drawInGameMenu();
  } catch (e) { console.warn('[game] drawInGameMenu failed', e); }
}



window.addEventListener('message', (ev) => {
  if (!ev || !ev.data) return;
  try {
    switch (ev.data.type) {
        case 'game-activated': {
          try {
            pendingGameActivated = true;
            if (typeof _confirmResize === 'function') {
              try { _confirmResize(); pendingGameActivated = false; } catch (e) { console.warn('[game] _confirmResize failed', e); }
            } else {
              try { window.dispatchEvent(new Event('resize')); } catch (e) {}
            }
            
            
            
            
            
            
            
            
            
            
          } catch (e) {}
          break;
        }
      case 'stop-game-music': {
        try {
          if (gameMusic && typeof gameMusic.isPlaying === 'function' && gameMusic.isPlaying()) {
            gameMusic.stop();
            gameMusicStarted = false;
            pendingGameMusicStart = false;
            console.log('[game] stopped gameMusic on request');
          }
        } catch (stopErr) {
          console.warn('[game] failed to stop gameMusic', stopErr);
        }
        try {
          window.parent && window.parent.postMessage && window.parent.postMessage({ type: 'game-music-stopped' }, '*');
        } catch (ackErr) {
          console.warn('[game] failed to send game-music-stopped ack', ackErr);
        }
        break;
      }
      case 'start-game-music': {
        pendingGameMusicStart = true;
        attemptStartGameMusic('message:start-game-music');
        break;
      }
      case 'update-audio-settings': {
        try {
          if (typeof ev.data.masterVol === 'number') masterVol = ev.data.masterVol;
          if (typeof ev.data.musicVol === 'number') musicVol = ev.data.musicVol;
          if (typeof ev.data.sfxVol === 'number') sfxVol = ev.data.sfxVol;
          if (typeof ev.data.difficulty === 'string') {
            setDifficulty(ev.data.difficulty, { reason: 'message:update-audio-settings' });
          }
          if (gameMusic && typeof gameMusic.setVolume === 'function') {
            gameMusic.setVolume(musicVol * masterVol);
            console.log('[game] applied updated audio settings to gameMusic');
          }
        } catch (settingsErr) {
          console.warn('[game] failed to apply updated audio settings', settingsErr);
        }
        break;
      }
      case 'all-settings': {
        try {
          
          const payload = ev.data || {};
          try { openInGameSettings(payload); } catch (e) { console.warn('[game] openInGameSettings failed', e); }
        } catch (e) { console.warn('[game] failed to handle all-settings', e); }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.warn('[game] message handler error', err);
  }
}, false);

function attemptStartGameMusic(reason = 'unknown') {
  if (!pendingGameMusicStart || gameMusicStarted || !gameMusic) return;
  console.log(`[game] attemptStartGameMusic reason=${reason}`);
  const startPlayback = () => {
    if (gameMusicStarted || !gameMusic) return;
    try { gameMusic.setVolume(musicVol * masterVol); } catch (volumeErr) {}
    try {
      if (typeof gameMusic.loop === 'function') {
        gameMusic.loop();
      } else if (typeof gameMusic.play === 'function') {
        gameMusic.play();
      } else {
        console.warn('[game] gameMusic has no loop/play');
        return;
      }
      gameMusicStarted = true;
      pendingGameMusicStart = false;
      console.log('[game] gameMusic playback started');
    } catch (startErr) {
      console.warn('[game] startPlayback failed', startErr);
    }
  };
  const tryResumeAudioContext = () => {
    if (typeof getAudioContext !== 'function') return false;
    try {
      const ctx = getAudioContext();
      if (!ctx || ctx.state === 'running') return false;
      const resumeResult = ctx.resume?.();
      if (resumeResult && typeof resumeResult.then === 'function') {
        resumeResult.then(() => {
          console.log('[game] AudioContext.resume resolved');
          startPlayback();
        }).catch((err) => {
          console.warn('[game] AudioContext.resume rejected', err);
          startPlayback();
        });
        return true;
      }
    } catch (ctxErr) {
      console.warn('[game] tryResumeAudioContext threw', ctxErr);
    }
    return false;
  };
  if (typeof userStartAudio === 'function') {
    try {
      const maybePromise = userStartAudio();
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(() => {
          console.log('[game] userStartAudio resolved');
          startPlayback();
        }).catch((err) => {
          console.warn('[game] userStartAudio rejected', err);
          if (!tryResumeAudioContext()) startPlayback();
        });
        return;
      }
    } catch (userStartErr) {
      console.warn('[game] userStartAudio threw', userStartErr);
    }
  }
  if (tryResumeAudioContext()) return;
  startPlayback();
}


function closeInGameSettings() {
  
  if (activeSettingElements && activeSettingElements.length) {
    activeSettingElements.forEach(e => {
      if (e) e.remove();
    });
  }
  activeSettingElements = [];

  
  if (settingsOverlayDiv) {
    settingsOverlayDiv.remove();
    settingsOverlayDiv = null;
  }
}



['pointerdown', 'keydown'].forEach((evt) => {
  window.addEventListener(evt, () => {
    if (pendingGameMusicStart && !gameMusicStarted) {
      attemptStartGameMusic(`user-${evt}`);
    }
  });
});



try {
  window.addEventListener('keydown', (e) => {
    try {
      if (e.key === 'Escape' || e.keyCode === 27) {
        
        const active = document && document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

        
        try {
          const ig = (typeof document !== 'undefined') ? document.getElementById('gd-in-game-settings') : null;
          if (ig) {
            try { closeInGameSettings(); } catch (err) { console.warn('[game] closeInGameSettings failed', err); }
            e.preventDefault();
            return;
          }
        } catch (err) {  }

        
        try {
          inGameMenuVisible = !inGameMenuVisible;
          e.preventDefault();
        } catch (err) {
          console.warn('[game] toggling inGameMenuVisible (global handler) failed', err);
        }
      }
    } catch (err) {  }
  }, false);
} catch (e) { console.warn('[game] failed to attach global Escape handler', e); }


function drawDifficultyBadge() {
  const label = `Difficulty: ${getDifficultyDisplayLabel()}`;
  const margin = 20;
  const paddingX = 18;
  const paddingY = 10;
  const vw = virtualW || width;
  const vh = virtualH || height;
  const textPx = 24;
  push();
  textFont(uiFont || 'Arial');
  textSize(textPx);
  const textH = textAscent() + textDescent();
  const boxW = textWidth(label) + paddingX * 2;
  const boxH = textH + paddingY * 2;
  const boxX = vw - margin - boxW;
  const boxY = margin;
  stroke(255, 80);
  strokeWeight(2);
  fill(0, 180);
  rect(boxX, boxY, boxW, boxH, 14);
  noStroke();
  fill(255);
  textAlign(RIGHT, BASELINE);
  stroke(0, 180);
  strokeWeight(3);
  text(label, boxX + boxW - paddingX, boxY + paddingY + textAscent());
  noStroke();
  pop();
}

function drawSprintMeter() {
  const now = millis();
  const margin = 20;
  const vw = virtualW || width;
  const barWidth = 300;
  const barHeight = 18;
  const x = vw - margin - barWidth;
  const y = margin + 65;
  let ratio = 0;
  let barColor = color(0, 200, 255);
  let label = 'Sprint Ready';
  if (sprintActive) {
    ratio = constrain((sprintEndMillis - now) / SPRINT_MAX_DURATION_MS, 0, 1);
    barColor = color(0, 255, 140);
    label = 'Sprinting';
  } else if (now < sprintCooldownUntil) {
    ratio = 1 - constrain((sprintCooldownUntil - now) / SPRINT_COOLDOWN_MS, 0, 1);
    barColor = color(255, 180, 0);
    label = 'Recovering';
  } else {
    ratio = 1;
  }
  push();
  noStroke();
  fill(0, 180);
  rect(x, y, barWidth, barHeight, 10);
  fill(barColor);
  rect(x, y, barWidth * ratio, barHeight, 10);
  textFont(uiFont || 'Arial');
  textSize(16);
  fill(255);
  textAlign(RIGHT, BOTTOM);
  text(label, x + barWidth, y - 4);
  pop();
}

function drawPlayer() {
  const inputLeft  = keyIsDown && keyIsDown(65);
  const inputRight = keyIsDown && keyIsDown(68);
  const inputUp    = keyIsDown && keyIsDown(87);
  const inputDown  = keyIsDown && keyIsDown(83);
  const inputWalking = !!(inputLeft || inputRight || inputUp || inputDown);
  const drawTileX = isMoving ? renderX : playerPosition.x;
  const drawTileY = isMoving ? renderY : playerPosition.y;
  const destX = drawTileX * cellSize;
  let destY = drawTileY * cellSize;

  if (isJumping) {
    const jumpProgress = (jumpTimer % JUMP_DURATION) / JUMP_DURATION;
    const jumpHeight = Math.sin(jumpProgress * Math.PI) * cellSize * 1.5; 
    destY -= jumpHeight;

    jumpTimer += deltaTime;
    if (jumpTimer >= JUMP_DURATION) {
      isJumping = false;
      jumpTimer = 0;
    }

    jumpFrame = Math.floor((jumpTimer / JUMP_ANIM_SPEED) % JUMP_FRAME_COUNT);
    
    const dir = lastDirection || 'S';
    const sheet = jumpSheets[dir];
    if (sheet) {
        const fw = sheet.width / JUMP_FRAME_COUNT;
        const fh = sheet.height;
        const sx = jumpFrame * fw;
        const sy = 0;
        const desiredHeight = cellSize * 1.25;
        const scale = desiredHeight / fh;
        const drawW = fw * scale;
        const drawH = fh * scale;
        const drawX = destX + (cellSize / 2) - (drawW / 2);
        const drawY = destY + cellSize - drawH;
        push(); noSmooth();
        image(sheet, drawX, drawY, drawW, drawH, sx, sy, fw, fh);
        pop();
        return; 
    }
  }

  let dir = null;
  if (isMoving) {
    const dx = renderTargetX - renderStartX;
    const dy = renderTargetY - renderStartY;
    dir = deltaToDirection(dx, dy);
  } else if (inputWalking) {
    const dx = (inputRight ? 1 : 0) + (inputLeft ? -1 : 0);
    const dy = (inputDown ? 1 : 0) + (inputUp ? -1 : 0);
    dir = deltaToDirection(dx, dy);
    if (dx < 0) facing = 'left';
    else if (dx > 0) facing = 'right';
  } else {
    dir = lastDirection || 'S';
  }
  const cols = IDLE_SHEET_COLS;
  playerAnimTimer += (typeof deltaTime === 'number' ? deltaTime : 16.67);
  if (playerAnimTimer >= playerAnimSpeed) {
    playerAnimTimer -= playerAnimSpeed;
    playerAnimFrame = (playerAnimFrame + 1) % cols;
  }
  const colIndex = Math.floor(playerAnimFrame) % cols;
  const movingForAnimation = isMoving || inputWalking;
  if (movingForAnimation) {
    const action = sprintActive ? 'run' : 'walk';
    if (action === 'walk') {
      const frameImgWalk = (walkFrames[dir] && walkFrames[dir][colIndex]) ? walkFrames[dir][colIndex] : null;
      if (frameImgWalk) {
        const fw = frameImgWalk.width;
        const fh = frameImgWalk.height;
        const desiredHeight = cellSize * 1.25;
        const scale = desiredHeight / fh;
        const drawW = fw * scale;
        const drawH = fh * scale;
        const drawX = destX + (cellSize / 2) - (drawW / 2);
        const drawY = destY + cellSize - drawH;
        push(); noSmooth(); image(frameImgWalk, drawX, drawY, drawW, drawH); pop();
        return;
      }
      const dirSheetWalk = walkSheets[dir] || null;
      if (dirSheetWalk) {
        const sheet = dirSheetWalk;
        const fw = sheet.width / cols;
        const fh = sheet.height;
        const sx = colIndex * fw;
        const sy = 0;
        const desiredHeight = cellSize * 1.25;
        const scale = desiredHeight / fh;
        const drawW = fw * scale;
        const drawH = fh * scale;
        const drawX = destX + (cellSize / 2) - (drawW / 2);
        const drawY = destY + cellSize - drawH;
        push(); noSmooth();
        if (facing === 'left') image(sheet, drawX + drawW, drawY, -drawW, drawH, sx, sy, fw, fh);
        else image(sheet, drawX, drawY, drawW, drawH, sx, sy, fw, fh);
        pop();
        return;
      }
      if (spritesheetWalk) {
        const fw = spritesheetWalk.width / cols;
        const fh = spritesheetWalk.height;
        const sx = colIndex * fw;
        const sy = 0;
        const desiredHeight = cellSize * 1.25;
        const scale = desiredHeight / fh;
        const drawW = fw * scale;
        const drawH = fh * scale;
        const drawX = destX + (cellSize / 2) - (drawW / 2);
        const drawY = destY + cellSize - drawH;
        push(); noSmooth();
        if (facing === 'left') image(spritesheetWalk, drawX + drawW, drawY, -drawW, drawH, sx, sy, fw, fh);
        else image(spritesheetWalk, drawX, drawY, drawW, drawH, sx, sy, fw, fh);
        pop();
        return;
      }
    } else if (action === 'run') {
      const frameImgRun = (runFrames[dir] && runFrames[dir][colIndex]) ? runFrames[dir][colIndex] : null;
      if (frameImgRun) {
        const fw = frameImgRun.width;
        const fh = frameImgRun.height;
        const desiredHeight = cellSize * 1.25;
        const scale = desiredHeight / fh;
        const drawW = fw * scale;
        const drawH = fh * scale;
        const drawX = destX + (cellSize / 2) - (drawW / 2);
        const drawY = destY + cellSize - drawH;
        push(); noSmooth(); image(frameImgRun, drawX, drawY, drawW, drawH); pop();
        return;
      }
      const dirSheetRun = runSheets[dir] || null;
      if (dirSheetRun) {
        const sheet = dirSheetRun;
        const fw = sheet.width / cols;
        const fh = sheet.height;
        const sx = colIndex * fw;
        const sy = 0;
        const desiredHeight = cellSize * 1.25;
        const scale = desiredHeight / fh;
        const drawW = fw * scale;
        const drawH = fh * scale;
        const drawX = destX + (cellSize / 2) - (drawW / 2);
        const drawY = destY + cellSize - drawH;
        push(); noSmooth();
        if (facing === 'left') image(sheet, drawX + drawW, drawY, -drawW, drawH, sx, sy, fw, fh);
        else image(sheet, drawX, drawY, drawW, drawH, sx, sy, fw, fh);
        pop();
        return;
      }
      if (spritesheetRun) {
        const fw = spritesheetRun.width / cols;
        const fh = spritesheetRun.height;
        const sx = colIndex * fw;
        const sy = 0;
        const desiredHeight = cellSize * 1.25;
        const scale = desiredHeight / fh;
        const drawW = fw * scale;
        const drawH = fh * scale;
        const drawX = destX + (cellSize / 2) - (drawW / 2);
        const drawY = destY + cellSize - drawH;
        push(); noSmooth();
        if (facing === 'left') image(spritesheetRun, drawX + drawW, drawY, -drawW, drawH, sx, sy, fw, fh);
        else image(spritesheetRun, drawX, drawY, drawW, drawH, sx, sy, fw, fh);
        pop();
        return;
      }
    }
  }
  const frameImg = (idleFrames[dir] && idleFrames[dir][colIndex]) ? idleFrames[dir][colIndex] : null;
  if (frameImg) {
    const fw = frameImg.width;
    const fh = frameImg.height;
    const desiredHeight = cellSize * 1.25;
    const scale = desiredHeight / fh;
    const drawW = fw * scale;
    const drawH = fh * scale;
    const drawX = destX + (cellSize / 2) - (drawW / 2);
    const drawY = destY + cellSize - drawH;
    push(); noSmooth(); image(frameImg, drawX, drawY, drawW, drawH); pop();
    return;
  }
  const dirSheet = idleSheets[dir] || null;
  if (dirSheet) {
    const sheet = dirSheet;
    const fw = sheet.width / cols;
    const fh = sheet.height;
    const sx = colIndex * fw;
    const sy = 0;
    const desiredHeight = cellSize * 1.25;
    const scale = desiredHeight / fh;
    const drawW = fw * scale;
    const drawH = fh * scale;
    const drawX = destX + (cellSize / 2) - (drawW / 2);
    const drawY = destY + cellSize - drawH;
    push(); noSmooth();
    if (facing === 'left') image(sheet, drawX + drawW, drawY, -drawW, drawH, sx, sy, fw, fh);
    else image(sheet, drawX, drawY, drawW, drawH, sx, sy, fw, fh);
    pop();
    return;
  }
  if (spritesheetIdle) {
    const rows = IDLE_SHEET_ROWS;
    const fw = spritesheetIdle.width / cols;
    const fh = spritesheetIdle.height / rows;
    let rowIndex = 0;
    let flip = false;
    switch (dir) {
      case 'S': rowIndex = 0; break;
      case 'SW': rowIndex = 1; break;
      case 'W': rowIndex = 2; break;
      case 'NW': rowIndex = 3; break;
      case 'N': rowIndex = 4; break;
      case 'SE': rowIndex = 1; flip = true; break;
      case 'E': rowIndex = 2; flip = true; break;
      case 'NE': rowIndex = 3; flip = true; break;
      default: rowIndex = 0; break;
    }
    if (dir.includes('W')) facing = 'left';
    else if (dir.includes('E')) facing = 'right';
    const sx = colIndex * fw;
    const sy = rowIndex * fh;
    const desiredHeight = cellSize * 1.25;
    const scale = desiredHeight / fh;
    const drawW = fw * scale;
    const drawH = fh * scale;
    const drawX = destX + (cellSize / 2) - (drawW / 2);
    const drawY = destY + cellSize - drawH;
    push(); noSmooth();
    if (flip || facing === 'left') image(spritesheetIdle, drawX + drawW, drawY, -drawW, drawH, sx, sy, fw, fh);
    else image(spritesheetIdle, drawX, drawY, drawW, drawH, sx, sy, fw, fh);
    pop();
    return;
  }
  push();
  noStroke();
  fill(COLORS.player);
  rect(destX, destY, cellSize, cellSize);
  pop();
}

function getCellSizeSpeedScale() {
  const BASE_CELL_SIZE = 32;
  if (typeof cellSize !== 'number' || cellSize <= 0) return 1;
  return cellSize / BASE_CELL_SIZE;
}

function hideCategoryButtons() {
  categoryBackgrounds.forEach(e => e && e.hide());
  categoryButtons.forEach(e => e && e.hide());
}

function hideBottomButtons() {
  [saveBackground, btnSave, backMenuBackground, btnBackMenu].forEach(e => e && e.hide());
}

function showSubSettings(label) {
  clearSubSettings();

  const cx = width / 2;
  const cy = height / 2;
  const panelW = 0.7 * width;
  const panelH = 0.7 * height;
  const panelLeft = cx - panelW / 2;
  const panelRight = cx + panelW / 2;
  const paddingX = panelW * 0.08;
  const labelX = panelLeft + paddingX;
  const controlX = panelLeft + panelW * 0.42;
  const controlWidth = panelRight - paddingX - controlX;
  const spacingY = panelH * 0.14;

  const ctx = createSettingsContext({
    labelX, controlX, controlWidth, panelH,
    startY: cy - panelH / 2 + panelH * 0.18,
    spacingY
  });

  const builder = CATEGORY_BUILDERS[label];
  if (builder) {
    builder(ctx);
  }

  const backY = cy + panelH / 2 - panelH * 0.12;
  const backWidth = panelW * 0.3;
  const backBG = createBgImg("assets/3-GUI/Button BG.png", cx - backWidth / 2, backY - BACK_BUTTON_VERTICAL_OFFSET, backWidth, panelH * 0.08, '3');
  const backBtn = makeSmallBtn("← Back", cx - backWidth / 2, backY - BACK_BUTTON_VERTICAL_OFFSET, backWidth, panelH * 0.08, () => {
    playClickSFX();
    clearSubSettings();
    showSettingsMenu();
  });

  activeSettingElements.push(backBG, backBtn);
  applyCurrentTextSize();
}

function makeBtn(label, x, y, w, h, cb) {
  const b = createButton(label);
  b.size(w, h).position(x, y);
  styleButton(b);
  b.mousePressed(cb);
  return b;
}

function createBgImg(path, x, y, w, h, zIndex = '9998') {
  const img = createImg(path, '');
  img.size(w, h).position(x, y);
  img.style('pointer-events', 'none');
  img.style('z-index', zIndex);
  img.style('position', 'absolute');
  return img;
}

function makeSmallBtn(label, x, y, w, h, cb) {
  const b = createButton(label);
  b.size(w, h).position(x, y);
  styleSmallButton(b);
  b.mousePressed(cb);
  return b;
}

function createSettingLabel(txt, x, y, maxWidth = 200) {
  const d = createDiv(txt);
  d.position(x, y);
  d.style("color", "white");
  d.style("font-size", (0.035 * height) + "px");
  d.style("text-align", "right");
  d.style("width", maxWidth + "px");
  d.style("z-index", "4");
  d.style("position", "absolute");
  d.style("pointer-events", "none");
  if (d.elt && d.elt.classList) d.elt.classList.add('setting-label');
  return d;
}

function updateTextSizeButtonStyles() {
  const buttons = selectAll('button[data-text-size-val]');
  buttons.forEach(btn => {
    const sizeVal = Number(btn.attribute('data-text-size-val'));
    if (sizeVal === textSizeSetting) {
      btn.style('color', '#ffcc00');
      btn.style('text-shadow', '0 0 8px #ffcc0070');
    } else {
      btn.style('color', 'white');
      btn.style('text-shadow', '0 0 8px #ffffff60');
    }
  });
}

function syncSlidersToSettings() {
  activeSettingElements.forEach(e => {
    if (!e.elt || e.elt.tagName !== 'INPUT' || e.elt.type !== 'range') return;
    const key = e.elt.getAttribute('data-setting');
    if (!key) return;
    let value;
    switch (key) {
      case 'masterVol': value = masterVol * 100; break;
      case 'musicVol': value = musicVol * 100; break;
      case 'sfxVol': value = sfxVol * 100; break;
      default: return;
    }
    e.value(value);
  });
}

function clearSubSettings() {
  activeSettingElements.forEach(e => e && e.remove());
  activeSettingElements = [];
}

function hideMainMenu() {
  [playButtonBackground, btnPlay, settingsButtonBackground, btnSettings, exitButtonBackground, btnExit]
    .forEach(e => e && e.hide());
}

function showMainMenu() {
  if (!btnPlay || !btnSettings || !btnExit) {
    createMainMenu();
    return;
  }
  [playButtonBackground, btnPlay, settingsButtonBackground, btnSettings, exitButtonBackground, btnExit]
    .forEach(e => e && e.show());
}

function hideSettingsMenu() {
  [...categoryBackgrounds, ...categoryButtons, saveBackground, btnSave, backMenuBackground, btnBackMenu]
    .forEach(e => e && e.remove());
  categoryBackgrounds = [];
  categoryButtons = [];
}

function applyVolumes() {
  if (bgMusic?.isPlaying()) bgMusic.setVolume(musicVol * masterVol);
}

function playClickSFX() {
  if (clickSFX) {
    clickSFX.setVolume(sfxVol * masterVol);
    clickSFX.play();
  }
}

function unlockAudioAndStart(cb) {
  if (audioUnlocked) {
    cb && cb();
    return;
  }
  try {
    if (typeof userStartAudio === 'function') {
      userStartAudio().then(() => {
        audioUnlocked = true;
        console.log('[unlockAudioAndStart] userStartAudio resolved — starting menu music');
        startMenuMusicIfNeeded();
        cb && cb();
      }).catch(() => {
        try {
          getAudioContext().resume().then(() => {
            audioUnlocked = true;
            console.log('[unlockAudioAndStart] AudioContext.resume succeeded — starting menu music');
            startMenuMusicIfNeeded();
            cb && cb();
          }).catch(() => {
            audioUnlocked = true;
            console.log('[unlockAudioAndStart] resume rejected but marking audio unlocked');
            startMenuMusicIfNeeded();
            cb && cb();
          });
        } catch (e) {
          audioUnlocked = true;
          console.log('[unlockAudioAndStart] fallback unlock — starting menu music');
          startMenuMusicIfNeeded();
          cb && cb();
        }
      });
    } else {
      try { getAudioContext().resume(); } catch (e) {}
      audioUnlocked = true;
      console.log('[unlockAudioAndStart] no userStartAudio — audioUnlocked set');
      startMenuMusicIfNeeded();
      cb && cb();
    }
  } catch (e) { audioUnlocked = true; cb && cb(); }
}

function startMenuMusicIfNeeded() {
  if (!bgMusic) {
    console.warn('[startMenuMusicIfNeeded] bgMusic not loaded yet');
    return;
  }
  try {
    if (typeof bgMusic.setVolume === 'function') bgMusic.setVolume(musicVol * masterVol);

    if (typeof bgMusic.isPlaying === 'function') {
      if (!bgMusic.isPlaying()) {
        bgMusic.loop();
        console.log('[startMenuMusicIfNeeded] bgMusic.loop() called');
      }
    } else if (typeof bgMusic.loop === 'function') {
      bgMusic.loop();
      console.log('[startMenuMusicIfNeeded] bgMusic.loop() fallback called');
    } else if (typeof bgMusic.play === 'function') {
      bgMusic.play();
      console.log('[startMenuMusicIfNeeded] bgMusic.play() fallback called');
    }
  } catch (err) {
    console.warn('[startMenuMusicIfNeeded] playback error', err);
  }
}

function styleButton(btn) {
  btn.style("background", "transparent");
  btn.style("border", "none");
  btn.style("cursor", "pointer");
  btn.style("color", "white");
  btn.style("text-shadow", "0 0 10px #ffffff60");
  if (btn.elt) {
    btn.elt.style.position = 'absolute';
    btn.elt.style.pointerEvents = 'auto';
    btn.elt.style.zIndex = '10001';
  }
}

function styleSmallButton(btn) {
  btn.style("background", "transparent");
  btn.style("border", "none");
  btn.style("cursor", "pointer");
  btn.style("color", "white");
  btn.style("text-shadow", "0 0 8px #ffffff60");
  if (btn.elt) {
    btn.elt.style.position = 'absolute';
    btn.elt.style.pointerEvents = 'auto';
    btn.elt.style.zIndex = '10001';
  }
}

function ensureLoopFallbackBuffer() {
  if (!loopFallbackBuffer || loopFallbackBuffer.width !== width || loopFallbackBuffer.height !== height) {
    loopFallbackBuffer = createGraphics(width, height);
  }
}


function getCellSizeSpeedScale() {
  const BASE_CELL_SIZE = 32;
  if (typeof cellSize !== 'number' || cellSize <= 0) return 1;
  return cellSize / BASE_CELL_SIZE;
}


function getActiveMoveDurationMs() {
  const base = sprintActive ? SPRINT_MOVE_DURATION_MS : BASE_MOVE_DURATION_MS;
  return Math.max(1, Math.round(base * getCellSizeSpeedScale()));
}

function getActiveMoveCooldownMs() {
  const base = sprintActive ? SPRINT_MOVE_COOLDOWN_MS : BASE_MOVE_COOLDOWN_MS;
  return Math.max(0, Math.round(base * getCellSizeSpeedScale()));
}

function updateSprintState() {
  const now = millis();
  const shiftHeld = keyIsDown(16);
  if (sprintActive) {
    if (!shiftHeld || now >= sprintEndMillis) {
      sprintActive = false;
      sprintCooldownUntil = now + SPRINT_COOLDOWN_MS;
    }
  } else if (shiftHeld && now >= sprintCooldownUntil) {
    sprintActive = true;
    sprintEndMillis = now + SPRINT_MAX_DURATION_MS;
  }
}

function startMoveVisual(prevX, prevY, newX, newY) {
  lastMoveDurationMs = getActiveMoveDurationMs();
  renderStartX = isNaN(renderX) ? prevX : renderX;
  renderStartY = isNaN(renderY) ? prevY : renderY;
  renderTargetX = newX;
  renderTargetY = newY;
  moveStartMillis = millis();
  isMoving = true;
}

function updateMovementInterpolation() {
  if (!isMoving) return;
  const elapsed = millis() - moveStartMillis;
  const duration = Math.max(1, lastMoveDurationMs);
  const t = constrain(elapsed / duration, 0, 1);
  renderX = lerp(renderStartX, renderTargetX, t);
  renderY = lerp(renderStartY, renderTargetY, t);
  if (t >= 1) {
    isMoving = false;
    renderStartX = renderTargetX;
    renderStartY = renderTargetY;
    if (queuedMove) {
      const q = queuedMove;
      queuedMove = null;
      playerPosition.x = q.targetX;
      playerPosition.y = q.targetY;
      lastMoveDX = playerPosition.x - q.prevX;
      lastMoveDY = playerPosition.y - q.prevY;
      lastDirection = deltaToDirection(lastMoveDX, lastMoveDY);
      startMoveVisual(renderStartX, renderStartY, playerPosition.x, playerPosition.y);
    } else {
      lastMoveTime = millis();
    }
  }
}

function handleItemInteraction(targetX, targetY) {
  const tileIdx = targetY * logicalW + targetX;
  const tileState = mapStates[tileIdx];
  if (!ITEM_DATA.hasOwnProperty(tileState)) return;
  const item = ITEM_DATA[tileState];
  console.log(`Player interacted with ${item.label}`);
  switch (tileState) {
    case TILE_TYPES.CHEST:
      break;
    case TILE_TYPES.HEALTH:
      break;
    case TILE_TYPES.POWERUP:
      break;
  }
  const underlyingTerrain = terrainLayer[tileIdx] || TILE_TYPES.GRASS;
  mapStates[tileIdx] = underlyingTerrain;
  const useSprites = showTextures && spritesheet;
  drawTile(mapImage, targetX, targetY, underlyingTerrain, useSprites);
}

function handleMovement() {
  updateSprintState();
  if (isJumping || (isMoving && (millis() - lastMoveTime < getActiveMoveCooldownMs()))) return;
  const nowA = keyIsDown(65);
  const nowD = keyIsDown(68);
  const nowW = keyIsDown(87);
  const nowS = keyIsDown(83);
  const now = millis();
  let moved = false;
  let targetX = playerPosition.x;
  let targetY = playerPosition.y;
  const maxTileX = Math.max(0, Math.floor(((virtualW || W) - cellSize) / cellSize));
  const maxTileY = Math.max(0, Math.floor(((virtualH || H) - cellSize) / cellSize));
  function keyTriggered(keyNow, prevKey, holdObj) {
    if (keyNow && !prevKey) {
      holdObj.start = now;
      holdObj.last = now;
      return true;
    }
    if (keyNow && prevKey) {
      if (holdObj.start > 0 && (now - holdObj.start >= HOLD_INITIAL_DELAY_MS) && (now - holdObj.last >= HOLD_REPEAT_INTERVAL_MS)) {
        holdObj.last = now;
        return true;
      }
      return false;
    }
    holdObj.start = 0;
    holdObj.last = 0;
    return false;
  }
  const A_trig = keyTriggered(nowA, prevKeyA, holdState.A);
  const D_trig = keyTriggered(nowD, prevKeyD, holdState.D);
  const W_trig = keyTriggered(nowW, prevKeyW, holdState.W);
  const S_trig = keyTriggered(nowS, prevKeyS, holdState.S);
  if (A_trig) { facing = 'left'; targetX--; moved = true; }
  else if (D_trig) { facing = 'right'; targetX++; moved = true; }
  if (W_trig) { targetY--; moved = true; }
  else if (S_trig) { targetY++; moved = true; }
  if (targetX < 0) targetX = 0;
  if (targetY < 0) targetY = 0;
  if (targetX > maxTileX) targetX = maxTileX;
  if (targetY > maxTileY) targetY = maxTileY;
  if (moved) {
    if (canMoveTo(playerPosition.x, playerPosition.y, targetX, targetY)) {
      handleItemInteraction(targetX, targetY);
      const prevX = playerPosition.x;
      const prevY = playerPosition.y;
      if (isMoving) {
        const qx = Math.max(0, Math.min(targetX, Math.max(0, Math.floor(((virtualW || W) - cellSize) / cellSize))));
        const qy = Math.max(0, Math.min(targetY, Math.max(0, Math.floor(((virtualH || H) - cellSize) / cellSize))));
        queuedMove = { prevX, prevY, targetX: qx, targetY: qy };
      } else {
        playerPosition.x = targetX;
        playerPosition.y = targetY;
        lastMoveDX = playerPosition.x - prevX;
        lastMoveDY = playerPosition.y - prevY;
        lastDirection = deltaToDirection(lastMoveDX, lastMoveDY);
        startMoveVisual(prevX, prevY, playerPosition.x, playerPosition.y);
      }
    }
  }
  prevKeyA = nowA;
  prevKeyD = nowD;
  prevKeyW = nowW;
  prevKeyS = nowS;
}

function tryMoveDirection(keyChar) {
  if (!playerPosition) return;
  const k = keyChar ? keyChar.toUpperCase() : '';
  let targetX = playerPosition.x;
  let targetY = playerPosition.y;
  if (k === 'A') { facing = 'left'; targetX--; }
  else if (k === 'D') { facing = 'right'; targetX++; }
  else if (k === 'W') { targetY--; }
  else if (k === 'S') { targetY++; }
  else return;
  const maxTileX = Math.max(0, Math.floor(((virtualW || W) - cellSize) / cellSize));
  const maxTileY = Math.max(0, Math.floor(((virtualH || H) - cellSize) / cellSize));
  targetX = Math.max(0, Math.min(targetX, maxTileX));
  targetY = Math.max(0, Math.min(targetY, maxTileY));
  if (!canMoveTo(playerPosition.x, playerPosition.y, targetX, targetY)) return;
  handleItemInteraction(targetX, targetY);
  const prevX = playerPosition.x;
  const prevY = playerPosition.y;
  if (isMoving) {
    queuedMove = { prevX, prevY, targetX, targetY };
  } else {
    playerPosition.x = targetX;
    playerPosition.y = targetY;
    lastMoveDX = playerPosition.x - prevX;
    lastMoveDY = playerPosition.y - prevY;
    lastDirection = deltaToDirection(lastMoveDX, lastMoveDY);
    startMoveVisual(prevX, prevY, playerPosition.x, playerPosition.y);
  }
  const now = millis();
  if (k === 'A') { holdState.A.start = now; holdState.A.last = now; prevKeyA = true; }
  if (k === 'D') { holdState.D.start = now; holdState.D.last = now; prevKeyD = true; }
  if (k === 'W') { holdState.W.start = now; holdState.W.last = now; prevKeyW = true; }
  if (k === 'S') { holdState.S.start = now; holdState.S.last = now; prevKeyS = true; }
}

window.addEventListener('keydown', (ev) => {
  const k = ev.key ? ev.key.toUpperCase() : '';
  if (k === 'W' || k === 'A' || k === 'S' || k === 'D') {
    try { tryMoveDirection(k); } catch (e) {  }
  }
  if (k === 'P') {
    try {
      // 1. Turn on the loading screen visually
      showLoadingOverlay = true;
      overlayMessage = 'Generating New Map...';
      updateLoadingOverlayDom();

      // 2. Wait 100ms so the screen actually turns black, THEN generate
      setTimeout(() => {
        console.log('[game] key P pressed — generating new map');
        nextGenerateIsManual = true;
        generateMap();
        // generateMap will handle turning the overlay off when it's done
      }, 100);

    } catch (e) {
      console.warn('[game] generateMap() failed from key press', e);
      showLoadingOverlay = false; // Turn off if it fails
      updateLoadingOverlayDom();
    }
    return;
  }
});

function saveMap(name) {
  try {
    if (typeof mapStates === 'undefined' || !mapStates) {
      console.warn('[game] no map to save');
      return false;
    }
    const payload = {
      persistentGameId: persistentGameId,
      timestamp: Date.now(),
      logicalW: logicalW || Math.ceil(W / cellSize),
      logicalH: logicalH || Math.ceil(H / cellSize),
      cellSize: cellSize,
      mapStates: Array.from(mapStates),
      terrainLayer: terrainLayer ? Array.from(terrainLayer) : null,
      treeObjects: Array.isArray(treeObjects) ? treeObjects.slice() : []
    };
    const key = name || ('saved_map_' + payload.timestamp);
    if (localStorageAvailable) {
      try {
        localStorage.setItem(key, JSON.stringify(payload));
        console.log('[game] map saved to localStorage as', key);
      } catch (err) {
        console.warn('[game] failed to save to localStorage', err);
        localStorageAvailable = false;
      }
    } else {
      console.warn('[game] localStorage unavailable, skipping save');
    }
    try {
      try { showToast('Map saved locally', 'info', 2200); } catch (e) {}
    } catch (e) {}
    downloadMapJSON(payload, key + '.json');
    return true;
  } catch (err) {
    console.error('[game] saveMap error', err);
    return false;
  }
}

function downloadMapJSON(obj, filename) {
  try {
    const json = JSON.stringify(obj, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || ('map_' + Date.now() + '.json');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('[game] map download started', a.download);
  } catch (err) {
    console.error('[game] downloadMapJSON error', err);
  }
}

function showToast(message, type = 'info', duration = 3000) {
  try {
    if (typeof document === 'undefined') return;
    const id = 'game-toast-overlay';
    let container = document.getElementById(id);
    if (!container) {
      container = document.createElement('div');
      container.id = id;
      container.style.position = 'fixed';
      container.style.right = '18px';
      container.style.top = '18px';
      container.style.zIndex = 99999;
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '8px';
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = 'game-toast ' + String(type || 'info');
    el.style.minWidth = '180px';
    el.style.maxWidth = '420px';
    el.style.background = type === 'error' ? '#7b1e1e' : (type === 'warn' ? '#8a6d1f' : '#1f6f8f');
    el.style.color = '#fff';
    el.style.padding = '10px 12px';
    el.style.borderRadius = '8px';
    el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.35)';
    el.style.fontFamily = 'Arial, sans-serif';
    el.style.fontSize = '13px';
    el.style.opacity = '0';
    el.style.transition = 'opacity 220ms ease, transform 220ms ease';
    el.style.transform = 'translateY(-6px)';
    el.textContent = message;
    container.appendChild(el);
    
    void el.offsetWidth;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
    const timeout = setTimeout(() => {
      try {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-6px)';
        setTimeout(() => { try { if (el && el.parentNode) el.parentNode.removeChild(el); } catch (e) {} }, 240);
      } catch (e) {}
    }, duration || 3000);
    
    el.addEventListener('click', () => {
      clearTimeout(timeout);
      try { el.style.opacity = '0'; el.style.transform = 'translateY(-6px)'; setTimeout(() => { if (el && el.parentNode) el.parentNode.removeChild(el); }, 180); } catch (e) {}
    });
  } catch (err) {
    console.warn('[game] showToast failed', err);
  }
}

function autosaveMap() {
  try {
    if (typeof mapStates === 'undefined' || !mapStates) {
      console.warn('[game] no map to autosave');
      return false;
    }
    const payload = {
      persistentGameId: persistentGameId,
      timestamp: Date.now(),
      logicalW: logicalW || Math.ceil(W / cellSize),
      logicalH: logicalH || Math.ceil(H / cellSize),
      cellSize: cellSize,
      mapStates: Array.from(mapStates),
      terrainLayer: terrainLayer ? Array.from(terrainLayer) : null,
      treeObjects: Array.isArray(treeObjects) ? treeObjects.slice() : []
    };
    const key = 'autosave_map';
    if (localStorageAvailable) {
      try {
        if (typeof localStorage === 'undefined') throw new Error('localStorage undefined');
        localStorage.setItem(key, JSON.stringify(payload));
        console.log('[game] map autosaved to localStorage as', key);
        try { showToast('Map autosaved', 'info', 2200); } catch (e) {}
    
      } catch (err) {
        
        console.warn('[game] localStorage write failed; autosave not persisted', err);
        localStorageAvailable = false;
        try { showToast('Autosave failed (storage full or unavailable)', 'warn', 4200); } catch (e) {}
        
        try { lastAutosavePayload = payload; try { showToast('Autosave stored in memory (not persisted)', 'info', 3000); } catch (e) {} } catch (e) {}
        
        return false;
      }
    } else {
      console.warn('[game] localStorage unavailable, storing autosave in memory');
      try { lastAutosavePayload = payload; try { showToast('Autosave stored in memory (not persisted)', 'info', 3000); } catch (e) {} } catch (e) {}
    
    }
    return true;
  } catch (err) {
    console.error('[game] autosaveMap error', err);
    return false;
  }
}

 

function createMapImage() {
  if (!logicalW || !logicalH) {
    console.warn('[createMapImage] aborted: logical size not set yet');
    return;
  }
  const w = logicalW * cellSize;
  const h = logicalH * cellSize;
  console.log(`[createMapImage] creating graphics ${w}x${h} (logical: ${logicalW}x${logicalH})`);
  mapImage = createGraphics(w, h);
  mapImage.noSmooth();
  const useSprites = showTextures && spritesheet && spritesheet.width > 1;
  console.log(`[createMapImage] useSprites=${useSprites}, spritesheet.width=${spritesheet ? spritesheet.width : 'null'}`);
  if (showTextures && !useSprites) {
    console.warn('[createMapImage] textures requested but spritesheet not available - drawing raw map');
    try { showToast('Textures not available yet — showing raw map', 'warn', 3000); } catch (e) {}
  }

  const overlays = [];
  const TREE_PIXEL_SIZE = 64;

  for (let ly = 0; ly < logicalH; ly++) {
    for (let lx = 0; lx < logicalW; lx++) {
      const tileState = getTileState(lx, ly);
      const px = lx * cellSize;
      const py = ly * cellSize;
      let img = null;
      let imgDestW = cellSize;
      let imgDestH = cellSize;
      
      if (tileState === TILE_TYPES.FOREST && TILE_IMAGES['gentle_forest']) {
        img = TILE_IMAGES['gentle_forest'];
        imgDestW = img.width;
        imgDestH = img.height;
      } else if (tileState === TILE_TYPES.GRASS && TILE_IMAGES['tile_1']) {
        img = TILE_IMAGES['tile_1'];
        imgDestW = cellSize;
        imgDestH = cellSize;
      } else if (tileState === TILE_TYPES.TREE && TILE_IMAGES['tree_1']) {
        img = TILE_IMAGES['tree_1'];
        imgDestW = TREE_PIXEL_SIZE;
        imgDestH = TREE_PIXEL_SIZE;
      } else if (tileState === TILE_TYPES.RIVER && (TILE_IMAGES['water_1'] || TILE_IMAGES[TILE_TYPES.RIVER])) {
        img = TILE_IMAGES['water_1'] || TILE_IMAGES[TILE_TYPES.RIVER];
        imgDestW = cellSize;
        imgDestH = cellSize;
      } else if ((tileState === TILE_TYPES.RAMP || tileState === TILE_TYPES.LOG) && (TILE_IMAGES['bridge_1'] || TILE_IMAGES[TILE_TYPES.RAMP] || TILE_IMAGES[TILE_TYPES.LOG])) {
        img = TILE_IMAGES['bridge_1'] || TILE_IMAGES[TILE_TYPES.RAMP] || TILE_IMAGES[TILE_TYPES.LOG];
        imgDestW = cellSize;
        imgDestH = cellSize;
      } else if (TILE_IMAGES[tileState]) {
        img = TILE_IMAGES[tileState];
        imgDestW = img.width;
        imgDestH = img.height;
      }
      else if (tileState >= TILE_TYPES.HILL_NORTH && tileState <= TILE_TYPES.HILL_NORTHWEST) {
        
        
        const grassColor = getColorForState(TILE_TYPES.GRASS);
        const baseTileImg = (TILE_IMAGES && TILE_IMAGES['tile_1']) ? TILE_IMAGES['tile_1'] : null;
        if (baseTileImg) {
          mapImage.image(baseTileImg, px, py, cellSize, cellSize);
        } else {
          mapImage.fill(grassColor[0], grassColor[1], grassColor[2]);
          mapImage.noStroke();
          mapImage.rect(px, py, cellSize, cellSize);
        }

        
        const direction = Object.keys(TILE_TYPES).find(key => TILE_TYPES[key] === tileState).replace('HILL_', '').toLowerCase();
        img = HILL_ASSETS[direction];
        if (img) {
          imgDestW = cellSize;
          imgDestH = cellSize;
        }
      }
      
      if (img) {
        const drawX = px + Math.floor((cellSize - imgDestW) / 2);
        const drawY = py + (cellSize - imgDestH);
        mapImage.image(img, drawX, drawY, imgDestW, imgDestH);
      } else {
        const c = getColorForState(tileState);
        mapImage.fill(c[0], c[1], c[2]);
        mapImage.noStroke();
        mapImage.rect(px, py, cellSize, cellSize);
      }

      
      if (tileState >= TILE_TYPES.HILL_NORTH && tileState <= TILE_TYPES.HILL_NORTHWEST) {
        try {
          const gradH = Math.max(8, Math.min(Math.floor(cellSize * 0.5), 48));
          const maxAlpha = 220;
          const grassImg = (TILE_IMAGES && TILE_IMAGES['tile_1']) ? TILE_IMAGES['tile_1'] : null;
          if (grassImg) {
            for (let row = 0; row < gradH; row++) {
              const y = cellSize - gradH + row;
              const alpha = map(row, 0, Math.max(1, gradH - 1), 0, maxAlpha);
              mapImage.noStroke();
              mapImage.tint(255, alpha);
              
              
              try {
                const srcH = Math.max(1, Math.floor((grassImg.height || 1) - 1));
                mapImage.image(grassImg, px, py + y, cellSize, 1, 0, srcH, grassImg.width, 1);
              } catch (e) {
                
                mapImage.image(grassImg, px, py + y, cellSize, 1);
              }
              mapImage.noTint();
            }
          } else {
            const grassColor2 = getColorForState(TILE_TYPES.GRASS);
            for (let y = cellSize - gradH; y < cellSize; y++) {
              let alpha = map(y, cellSize - gradH, cellSize, 0, maxAlpha);
              mapImage.noStroke();
              mapImage.fill(grassColor2[0], grassColor2[1], grassColor2[2], alpha);
              mapImage.rect(px, py + y, cellSize, 1);
            }
          }
        } catch (e) {}
      }
    }
  }

  if (Array.isArray(treeObjects) && treeObjects.length) {
    for (const t of treeObjects) {
      const px = t.x * cellSize;
      const py = t.y * cellSize;
      let destW = cellSize;
      let destH = cellSize;
      if (TREE_OVERLAY_IMG) {
        destW = TREE_PIXEL_SIZE;
        destH = TREE_PIXEL_SIZE;
      } else if (SPRITES && SPRITES[TILE_TYPES.FOREST]) {
        const s = SPRITES[TILE_TYPES.FOREST];
        destW = (s.drawW && Number(s.drawW) > 0) ? s.drawW : cellSize;
        destH = (s.drawH && Number(s.drawH) > 0) ? s.drawH : cellSize;
      }
      overlays.push({
        tileState: TILE_TYPES.FOREST,
        px, py,
        imgType: (TREE_OVERLAY_IMG ? 'image' : 'none'),
        img: TREE_OVERLAY_IMG || null,
        s: null,
        destW,
        destH,
        source: 'treeObject'
      });
    }
  }

  
  try {
    for (let ly = 0; ly < logicalH; ly++) {
      for (let lx = 0; lx < logicalW; lx++) {
        const ts = getTileState(lx, ly);
        if (ts !== TILE_TYPES.FOREST) continue;
        const px = lx * cellSize;
        const py = ly * cellSize;
        const exists = overlays.some(o => o && o.px === px && o.py === py);
        if (exists) continue;
        let destW = cellSize;
        let destH = cellSize;
        if (TREE_OVERLAY_IMG) {
            destW = TREE_PIXEL_SIZE;
            destH = TREE_PIXEL_SIZE;
        } else if (SPRITES && SPRITES[TILE_TYPES.FOREST]) {
          const s = SPRITES[TILE_TYPES.FOREST];
          destW = (s.drawW && Number(s.drawW) > 0) ? s.drawW : cellSize;
          destH = (s.drawH && Number(s.drawH) > 0) ? s.drawH : cellSize;
        }
        overlays.push({ tileState: TILE_TYPES.FOREST, px, py, imgType: (TREE_OVERLAY_IMG ? 'image' : 'none'), img: TREE_OVERLAY_IMG || null, s: null, destW, destH, source: 'mapForest' });
      }
    }
  } catch (e) {}

  overlays.sort((a, b) => ( (a.py + (cellSize - a.destH)) - (b.py + (cellSize - b.destH)) ));
  try {
    const total = (logicalW || 0) * (logicalH || 0);
    if (!edgeLayer || !(edgeLayer instanceof Uint8Array) || edgeLayer.length !== total) {
      edgeLayer = new Uint8Array(total);
    } else {
      edgeLayer.fill(0);
    }

    console.log('[game] overlays total=', overlays.length, 'sample=', overlays.slice(0,6).map(o=>({px:o.px,py:o.py,destW:o.destW,destH:o.destH,imgType:o.imgType})));
    for (const o of overlays) {
      if (!o || o.tileState !== TILE_TYPES.FOREST) continue;
      const drawX = o.px + Math.floor((cellSize - o.destW) / 2);
      const drawY = o.py + (cellSize - o.destH);
      const drawRight = drawX + o.destW;
      const drawBottom = drawY + o.destH;
      const minTileX = Math.max(0, Math.floor(drawX / cellSize));
      const maxTileX = Math.min(logicalW - 1, Math.floor((drawRight - 1) / cellSize));
      const minTileY = Math.max(0, Math.floor(drawY / cellSize));
      const maxTileY = Math.min(logicalH - 1, Math.floor((drawBottom - 1) / cellSize));
      const fromTreeObject = o.source === 'treeObject';
      const baseTileX = Math.max(0, Math.min(logicalW - 1, Math.floor(o.px / cellSize)));
      const baseTileY = Math.max(0, Math.min(logicalH - 1, Math.floor(o.py / cellSize)));
      let markedCount = 0;
      for (let ty = minTileY; ty <= maxTileY; ty++) {
        if (fromTreeObject && ty !== baseTileY) continue;
        for (let tx = minTileX; tx <= maxTileX; tx++) {
          if (fromTreeObject && tx !== baseTileX) continue;
          try {
            const idx = ty * logicalW + tx;
            const ts = getTileState(tx, ty);
            if (isSolid(ts)) continue;
            let shouldMark = false;
            const tileLeft = tx * cellSize;
            const tileTop = ty * cellSize;
            const tileRight = tileLeft + cellSize;
            const tileBottom = tileTop + cellSize;
            const overlapLeft = Math.max(drawX, tileLeft);
            const overlapTop = Math.max(drawY, tileTop);
            const overlapRight = Math.min(drawRight, tileRight);
            const overlapBottom = Math.min(drawBottom, tileBottom);
            const overlapWidth = Math.max(0, overlapRight - overlapLeft);
            const overlapHeight = Math.max(0, overlapBottom - overlapTop);
            const coverage = (overlapWidth * overlapHeight) / (cellSize * cellSize);
            const coverageThreshold = fromTreeObject ? 0.05 : 0.45;
            if (coverage >= coverageThreshold) {
              shouldMark = true;
            } else if (fromTreeObject && tx === baseTileX && ty === baseTileY) {
              shouldMark = true;
            }
            if (!shouldMark) continue;
           
          } catch (e) {}
        }
      }
      if (markedCount > 0 && EDGE_LAYER_DEBUG) {
        console.log('[game] marked non-solid tiles under overlay as barrier=', markedCount);
      }
      
      try {
        for (const t of treeObjects) {
          if (!t) continue;
          if ((t.x * cellSize) === o.px && (t.y * cellSize) === o.py) {
            t._overlay = t._overlay || {};
            t._overlay.coveredTiles = { minTileX, maxTileX, minTileY, maxTileY };
          }
        }
      } catch (e) {}
    }
  } catch (e) {
    console.warn('[game] compute edgeLayer failed', e);
  }
  try {
    ensureEdgeLayerConnectivity();
  } catch (e) {
    console.warn('[game] ensureEdgeLayerConnectivity failed', e);
  }
  try {
    mapOverlays = overlays.slice();
  } catch (e) { mapOverlays = overlays; }
  try {
    if (!useSprites && edgeLayer && logicalW && logicalH) {
      if (!EDGE_LAYER_ENABLED) {
        console.log('[game] edgeLayer painting skipped because EDGE_LAYER_ENABLED=false');
      } else {
      
        let cnt = 0;
        for (let i = 0; i < edgeLayer.length; i++) cnt += edgeLayer[i] ? 1 : 0;
        console.log('[game] painting edgeLayer into raw mapImage - barrier tiles=', cnt, 'logical=', logicalW, 'x', logicalH, 'useSprites=', useSprites);
        mapImage.noStroke();
        const c = EDGE_LAYER_COLOR || [34, 120, 34, 200];
        mapImage.fill(c[0], c[1], c[2], c[3] || 200);
        for (let yy = 0; yy < logicalH; yy++) {
          for (let xx = 0; xx < logicalW; xx++) {
            const idx = yy * logicalW + xx;
            if (edgeLayer[idx]) {
              mapImage.rect(xx * cellSize, yy * cellSize, cellSize, cellSize);
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('[game] failed to paint edgeLayer into raw map image', e);
  }

  
  
  // Brown-pixel diagnose/fix removed to avoid runtime diagnostics and asset mutation.
}

function loadMapFromStorage() {
  if (isNewGame) {
    console.log('[game] new game detected, ignoring stored maps and generating a new one.');
    return false;
  }
  try {
    let raw = null;
    try { raw = localStorage.getItem('autosave_map'); } catch (e) { raw = null; }
    if (!raw) {
      try {
        const keys = Object.keys(localStorage || {});
        let latestKey = null;
        let latestTs = 0;
        for (const k of keys) {
          if (!k || typeof k !== 'string') continue;
          if (k.startsWith('saved_map_')) {
            const parts = k.split('_');
            const ts = Number(parts[parts.length - 1]) || 0;
            if (ts > latestTs) { latestTs = ts; latestKey = k; }
          }
        }
        if (latestKey) {
          try { raw = localStorage.getItem(latestKey); } catch (e) { raw = null; }
        }
      } catch (e) {
        raw = null;
      }
    }
    
    if (!raw) {
      console.log('[game] no saved map found in storage for this session');
      return false;
    }
    let obj = null;
    try { obj = JSON.parse(raw); } catch (e) { console.warn('[game] failed to parse stored map JSON', e); return false; }
    if (obj.persistentGameId !== persistentGameId) {
      console.warn(`[game] stored map has wrong game ID (expected ${persistentGameId}, got ${obj.persistentGameId}). Ignoring.`);
      return false;
    }
    if (!obj || typeof obj !== 'object' || !Array.isArray(obj.mapStates) || !obj.logicalW || !obj.logicalH) {
      console.warn('[game] stored map payload invalid', obj);
      return false;
    }
    logicalW = Number(obj.logicalW) || Math.ceil((virtualW || W) / cellSize);
    logicalH = Number(obj.logicalH) || Math.ceil((virtualH || H) / cellSize);
    console.log(`[game] loaded map from storage. logicalW=${logicalW}, logicalH=${logicalH}, mapStates.length=${obj.mapStates.length}`);
    const nonZero = obj.mapStates.filter(x => x !== 0).length;
    console.log(`[game] mapStates has ${nonZero} non-zero tiles out of ${obj.mapStates.length}`);
    if (obj.cellSize && Number(obj.cellSize) > 0) {
      try { cellSize = Number(obj.cellSize); } catch (e) { }
    }
    try {
      mapStates = new Uint8Array(obj.mapStates);
    } catch (e) {
      mapStates = new Uint8Array(Array.from(obj.mapStates || []));
    }
    if (obj.terrainLayer && Array.isArray(obj.terrainLayer)) {
      try { terrainLayer = new Uint8Array(obj.terrainLayer); } catch (e) { terrainLayer = new Uint8Array(Array.from(obj.terrainLayer)); }
    } else {
      terrainLayer = mapStates.slice();
    }
    treeObjects = Array.isArray(obj.treeObjects) ? obj.treeObjects.slice() : [];
    counts = {};
    for (let i = 0; i < mapStates.length; i++) counts[mapStates[i]] = (counts[mapStates[i]] || 0) + 1;
    const centerX = Math.floor((logicalW || Math.ceil(W / (cellSize || 32))) / 2);
    const centerY = Math.floor((logicalH || Math.ceil(H / (cellSize || 32))) / 2);
    playerPosition = { x: centerX, y: centerY };
    renderX = playerPosition.x;
    renderY = playerPosition.y;
    renderStartX = renderX; renderStartY = renderY; renderTargetX = renderX; renderTargetY = renderY; isMoving = false;
    createMapImage();
    redraw();
    try { showToast('Loaded saved map', 'info', 2200); } catch (e) {}
    console.log('[game] loadMapFromStorage: loaded map (logicalW,logicalH)=', logicalW, logicalH);
    try { mapLoadComplete = true; } catch (e) {}
    try { showLoadingOverlay = false; } catch (e) {}
    return true;
  } catch (err) {
    console.warn('[game] loadMapFromStorage error', err);
    return false;
  }
}

function carveRivers(map, w, h, opts) {
  const { clearStartX, clearEndX, clearStartY, clearEndY } = opts;
  const RIVER_TILE = opts.RIVER_TILE;
  const riverId = () => (RIVER_TILE !== null ? RIVER_TILE : TILE_TYPES.FOREST);
  const numRivers = 1 + Math.floor(Math.random() * 2);
  const maxSteps = Math.max(w, h) * 6;
  function isInsideClear(x, y) {
    return x > clearStartX && x < clearEndX && y > clearStartY && y < clearEndY;
  }
  function pickStartAndTarget() {
    const side = Math.floor(Math.random() * 4);
    let sx, sy, tx, ty;
    if (side === 0) { sx = Math.floor(Math.random() * w); sy = 0; tx = Math.floor((w * 0.25) + Math.random() * w * 0.5); ty = h - 1; }
    else if (side === 1) { sx = w - 1; sy = Math.floor(Math.random() * h); tx = 0; ty = Math.floor((h * 0.25) + Math.random() * h * 0.5); }
    else if (side === 2) { sx = Math.floor(Math.random() * w); sy = h - 1; tx = Math.floor((w * 0.25) + Math.random() * w * 0.5); ty = 0; }
    else { sx = 0; sy = Math.floor(Math.random() * h); tx = w - 1; ty = Math.floor((h * 0.25) + Math.random() * h * 0.5); }
    if (isInsideClear(sx, sy)) { if (side === 0) sy = 0; if (side === 1) sx = w - 1; if (side === 2) sy = h - 1; if (side === 3) sx = 0; }
    if (isInsideClear(tx, ty)) { if (side === 0) ty = h - 1; if (side === 1) tx = 0; if (side === 2) ty = 0; if (side === 3) tx = w - 1; }
    return { start: { x: sx, y: sy, side }, target: { x: tx, y: ty, side: (side + 2) % 4 } };
  }
  function neighbors8(cx, cy) {
    const n = [];
    for (let yy = cy - 1; yy <= cy + 1; yy++) {
      for (let xx = cx - 1; xx <= cx + 1; xx++) {
        if (xx === cx && yy === cy) continue;
        if (xx >= 0 && xx < w && yy >= 0 && yy < h) n.push({ x: xx, y: yy });
      }
    }
    return n;
  }
  function reachedSide(x, y, side) {
    if (side === 0) return y === 0;
    if (side === 1) return x === w - 1;
    if (side === 2) return y === h - 1;
    if (side === 3) return x === 0;
    return false;
  }
  for (let r = 0; r < numRivers; r++) {
    const { start, target } = pickStartAndTarget();
    let x = start.x, y = start.y;
    let steps = 0;
    const biasStrength = 1.0;
    const jitterNoiseScale = 0.12;
    while (steps < maxSteps) {
      const idx = y * w + x;
      map[idx] = riverId();
      for (const n of neighbors8(x, y)) {
        const nIdx = n.y * w + n.x;
        if (Math.random() < 0.45) map[nIdx] = riverId();
      }
      if (reachedSide(x, y, target.side)) {
        if (Math.random() < 0.4) {
          const extra = neighbors8(x, y).filter(n => reachedSide(n.x, n.y, target.side));
          if (extra.length) {
            const e = extra[Math.floor(Math.random() * extra.length)];
            map[e.y * w + e.x] = riverId();
          }
        }
        break;
      }
      let usable = neighbors8(x, y).filter(n => !isInsideClear(n.x, n.y));
      const allowInside = usable.length === 0;
      if (allowInside) usable = neighbors8(x, y);
      let best = null;
      let bestScore = Infinity;
      for (const c of usable) {
        const dist = Math.hypot(target.x - c.x, target.y - c.y);
        const jitter = (noise(c.x * jitterNoiseScale, c.y * jitterNoiseScale) - 0.5) * 6;
        const insidePenalty = isInsideClear(c.x, c.y) ? 50 : 0;
        const score = dist * biasStrength + jitter + insidePenalty;
        const forwardDot = ((target.x - x) * (c.x - x) + (target.y - y) * (c.y - y));
        const backtrackPenalty = forwardDot < 0 ? 4 : 0;
        const finalScore = score + backtrackPenalty;
        if (finalScore < bestScore) {
          bestScore = finalScore;
          best = c;
        }
      }
      if (!best) break;
      x = best.x;
      y = best.y;
      steps++;
      if (steps % 60 === 0 && Math.random() < 0.25) {
        const edgeJump = pickStartAndTarget().start;
        x = Math.max(0, Math.min(w - 1, edgeJump.x));
        y = Math.max(0, Math.min(h - 1, edgeJump.y));
      }
    }
  }
}





function generateHills(map, w, h) {
  
  const seed1 = Math.random() * 9999;
  const seed2 = Math.random() * 9999;
  
  
  const scale1 = 0.06;
  const thresh1 = 0.52;

  
  const scale2 = 0.08; 
  const thresh2 = 0.58; 

  
  let grid1 = new Uint8Array(w * h); 
  let grid2 = new Uint8Array(w * h); 

  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      
      if (x < 3 || x > w - 4 || y < 3 || y > h - 4) continue;

      
      const n1 = noise((x * scale1) + seed1, (y * scale1) + seed1);
      if (n1 > thresh1) grid1[idx] = 1;

      
      const n2 = noise((x * scale2) + seed2, (y * scale2) + seed2);
      if (n2 > thresh2) grid2[idx] = 1;
    }
  }

  
  
  
  
  let cleanGrid2 = new Uint8Array(grid2);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (grid2[idx] === 1) {
        
        
        if (grid1[idx] === 0 || 
            grid1[idx-1] === 0 || grid1[idx+1] === 0 || 
            grid1[idx-w] === 0 || grid1[idx+w] === 0) {
          cleanGrid2[idx] = 0;
        }
      } else {
        
        cleanGrid2[idx] = 0; 
      }
    }
  }
  grid2 = cleanGrid2;

  
  
  const performSquaring = (g) => {
    for (let i = 0; i < 2; i++) {
      const nextG = new Uint8Array(g);
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          let cn = 0; 
          if (g[idx-1]) cn++; if (g[idx+1]) cn++;
          if (g[idx-w]) cn++; if (g[idx+w]) cn++;

          if (g[idx] === 0 && cn >= 2) nextG[idx] = 1; 
          else if (g[idx] === 1 && cn <= 1) nextG[idx] = 0; 
        }
      }
      for(let k=0; k<g.length; k++) g[k] = nextG[k];
    }
  };

  performSquaring(grid1);
  performSquaring(grid2);

  
  
  
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      
      
      
      
      
      let finalTile = 0;

      
      if (grid2[idx] === 1) {
        const t2 = getHillTileType(grid2, x, y, w);
        
        
        finalTile = t2;
      }
      
      
      
      if (finalTile === 0 || finalTile === TILE_TYPES.GRASS) {
        if (grid1[idx] === 1) {
          const t1 = getHillTileType(grid1, x, y, w);
          
          
          
          if (grid2[idx] === 0) finalTile = t1;
        }
      }

      if (finalTile !== 0) map[idx] = finalTile;
    }
  }
}






function getHillTileType(grid, x, y, w) {
  
  
  const isHill = (dx, dy) => {
    const nx = x + dx;
    const ny = y + dy;
    const h = grid.length / w; 
    
    
    if (nx < 0 || nx >= w || ny < 0 || ny >= h) return false;
    
    return grid[ny * w + nx] === 1;
  };

  
  const n = isHill(0, -1);  
  const s = isHill(0, 1);   
  const e = isHill(1, 0);   
  const wDir = isHill(-1, 0); 

  
  
  
  
  
  if (!n && !wDir) return TILE_TYPES.HILL_NORTHWEST;
  if (!n && !e)    return TILE_TYPES.HILL_NORTHEAST;
  if (!s && !wDir) return TILE_TYPES.HILL_SOUTHWEST;
  if (!s && !e)    return TILE_TYPES.HILL_SOUTHEAST;

  
  
  
  
  
  if (!n) return TILE_TYPES.HILL_NORTH;
  if (!s) return TILE_TYPES.HILL_SOUTH;
  if (!wDir) return TILE_TYPES.HILL_WEST;
  if (!e) return TILE_TYPES.HILL_EAST;

  
  
  
  
  
  
  return TILE_TYPES.GRASS; 
}


function generateMap() {
  console.log('[game] generateMap() start');
  const manual = !!nextGenerateIsManual;
  nextGenerateIsManual = false;

  if (!manual && !mapLoadComplete && !isNewGame) {
    console.log('[game] skipping auto-generate: authoritative map not yet applied');
    return;
  }
  if (!W || !H) return;

  try {
    showLoadingOverlay = true;
    overlayMessage = 'Generating new map...';
  } catch (e) {}

  logicalW = Math.ceil((virtualW || W) / cellSize);
  logicalH = Math.ceil((virtualH || H) / cellSize);

  mapStates = new Uint8Array(logicalW * logicalH);
  terrainLayer = new Uint8Array(logicalW * logicalH);

  // --- Helper 1: Calculate the center clearing ---
  function computeClearArea() {
    const centerX = logicalW / 2;
    const centerY = logicalH / 2;
    const clearAreaRatio = 0.75 + Math.random() * 0.15;
    const baseClearWidth = logicalW * clearAreaRatio;
    const baseClearHeight = logicalH * clearAreaRatio;
    return {
      centerX,
      centerY,
      baseClearWidth,
      baseClearHeight,
      clearStartX: centerX - baseClearWidth / 2,
      clearEndX: centerX + baseClearWidth / 2,
      clearStartY: centerY - baseClearHeight / 2,
      clearEndY: centerY + baseClearHeight / 2
    };
  }

  // --- Helper 2: Apply noise for grass/forest distribution ---
  function applyNoiseTerrain(centerX, centerY, baseClearWidth, baseClearHeight) {
    const lowFreqScale = 0.07;
    const highFreqScale = 0.2;
    const pathNoiseScale = 0.15;
    const wobbleFactor = baseClearWidth * 0.12;

    for (let y = 0; y < logicalH; y++) {
      for (let x = 0; x < logicalW; x++) {
        const idx = y * logicalW + x;
        const lowFreqNoise = noise(x * lowFreqScale, y * lowFreqScale);
        const highFreqNoise = noise(x * highFreqScale, y * highFreqScale);
        const combinedNoise = (lowFreqNoise * 0.7) + (highFreqNoise * 0.3);
        const wobble = (combinedNoise - 0.5) * wobbleFactor * 2;
        const distFromCenterX = Math.abs(x - centerX);
        const distFromCenterY = Math.abs(y - centerY);

        if (distFromCenterX < baseClearWidth / 2 + wobble && distFromCenterY < baseClearHeight / 2 + wobble) {
          mapStates[idx] = TILE_TYPES.GRASS;
        } else {
          const pathNoise = noise(x * pathNoiseScale, y * pathNoiseScale);
          mapStates[idx] = pathNoise < 0.4 ? TILE_TYPES.GRASS : TILE_TYPES.FOREST;
        }
      }
    }
  }

  // --- Helper 3: Handle Rivers ---
  function postProcessRiversAndClearArea(clearStartX, clearEndX, clearStartY, clearEndY) {
    const RIVER_TILE = (typeof TILE_TYPES !== 'undefined' && TILE_TYPES.RIVER) ? TILE_TYPES.RIVER : null;

    carveRivers(mapStates, logicalW, logicalH, {
      clearStartX,
      clearEndX,
      clearStartY,
      clearEndY,
      RIVER_TILE
    });

    const spawnX = Math.floor(logicalW / 2);
    const spawnY = Math.floor(logicalH / 2);

    const allowClearOverride = riverClearMode === RIVER_CLEAR_MODES.AUTO ? null : (riverClearMode === RIVER_CLEAR_MODES.ALWAYS);

    carveRiversMaybeThrough(mapStates, logicalW, logicalH, {
      clearStartX,
      clearEndX,
      clearStartY,
      clearEndY,
      RIVER_TILE,
      playerX: spawnX,
      playerY: spawnY,
      allowClearOverride
    });

    const branchChance = allowClearOverride === true ? 1 : 0.55;
    if (allowClearOverride !== false && Math.random() < branchChance) {
      carveBranchFromRiver(mapStates, logicalW, logicalH, {
        clearStartX,
        clearEndX,
        clearStartY,
        clearEndY,
        RIVER_TILE,
        playerX: spawnX,
        playerY: spawnY
      });
    }

    ensureInteractiveClearArea(mapStates, logicalW, logicalH, {
      clearStartX,
      clearEndX,
      clearStartY,
      clearEndY,
      playerX: spawnX,
      playerY: spawnY,
      RIVER_TILE
    });

    smoothRiverTiles(mapStates, logicalW, logicalH, {
      RIVER_TILE,
      clearStartX,
      clearEndX,
      clearStartY,
      clearEndY
    });
    roundRiverTips(mapStates, logicalW, logicalH, {
      RIVER_TILE,
      clearStartX,
      clearEndX,
      clearStartY,
      clearEndY
    });

    return {
      spawnX: Math.floor(logicalW / 2),
      spawnY: Math.floor(logicalH / 2)
    };
  }

  // --- Helper 4: Remove Unreachable Areas (UPDATED) ---
  function pruneUnreachable(startX, startY) {
    // Safety: ensure spawn isn't solid before we start
    const startIdx = startY * logicalW + startX;
    if (isSolid(mapStates[startIdx])) {
      console.warn("Prune warning: Spawn point is solid.");
      return; 
    }

    const q = [{ x: startX, y: startY }];
    const visited = new Set([`${startX},${startY}`]);
    let head = 0;

    // 8-Way Directions (Horizontal, Vertical, Diagonal)
    const dirs = [
      { dx: 0, dy: -1 }, { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 },
      { dx: 0, dy: 1 },  { dx: -1, dy: 1 }, { dx: -1, dy: 0 }, { dx: -1, dy: -1 }
    ];

    while (head < q.length) {
      const { x, y } = q[head++];

      for (const d of dirs) {
        const nx = x + d.dx;
        const ny = y + d.dy;

        // Boundary check
        if (nx >= 0 && nx < logicalW && ny >= 0 && ny < logicalH) {
          const key = `${nx},${ny}`;
          const idx = ny * logicalW + nx;
          
          // If not visited AND NOT SOLID, we can walk there
          if (!visited.has(key) && !isSolid(mapStates[idx])) {
            visited.add(key);
            q.push({ x: nx, y: ny });
          }
        }
      }
    }

    // Replace ONLY unreachable GRASS with FOREST
    for (let i = 0; i < mapStates.length; i++) {
      const x = i % logicalW;
      const y = Math.floor(i / logicalW);
      const key = `${x},${y}`;

      if (mapStates[i] === TILE_TYPES.GRASS && !visited.has(key)) {
        mapStates[i] = TILE_TYPES.FOREST;
      }
    }
  }

  // --- EXECUTION START ---

  const clearArea = computeClearArea();
  applyNoiseTerrain(clearArea.centerX, clearArea.centerY, clearArea.baseClearWidth, clearArea.baseClearHeight);
  
  // Create rivers and get spawn point
  const spawn = postProcessRiversAndClearArea(clearArea.clearStartX, clearArea.clearEndX, clearArea.clearStartY, clearArea.clearEndY);

  // 1. PRUNE FIRST (Removes unreachable grass before hills are made)
  pruneUnreachable(spawn.spawnX, spawn.spawnY);

  // 2. GENERATE HILLS (Decorate the valid map)
  generateHills(mapStates, logicalW, logicalH);


  // --- Finalization ---
  terrainLayer = mapStates.slice();
  counts = {};
  for (let i = 0; i < mapStates.length; i++) counts[mapStates[i]] = (counts[mapStates[i]] || 0) + 1;

  playerPosition = {
    x: spawn.spawnX,
    y: spawn.spawnY
  };
  renderX = playerPosition.x;
  renderY = playerPosition.y;
  renderStartX = renderX;
  renderStartY = renderY;
  renderTargetX = renderX;
  renderTargetY = renderY;
  isMoving = false;

  createMapImage();

  treeObjects = [];
  if (TREE_OVERLAY_IMG) {
    for (let y = 0; y < logicalH; y++) {
      for (let x = 0; x < logicalW; x++) {
        const idx = y * logicalW + x;
        if (mapStates[idx] !== TILE_TYPES.FOREST) continue;
        if (x === spawn.spawnX && y === spawn.spawnY) continue;
        if (Math.random() < TREE_SPAWN_CHANCE) {
          treeObjects.push({
            x,
            y
          });
        }
      }
    }
    createMapImage();
  }

  redraw();

  try {
    let existing = null;
    try {
      existing = localStorage.getItem('autosave_map');
    } catch (e) {
      existing = null;
    }
    if (manual || !existing) autosaveMap();
  } catch (err) {
    console.warn('[game] autosave after generateMap failed', err);
  }

  try {
    mapLoadComplete = true;
    showLoadingOverlay = false;
  } catch (e) {}
}


function cleanImageBrown(img) {
  try {
    if (!img) return 0;
    if (typeof img.loadPixels === 'function') img.loadPixels();
    if (!img.pixels || img.pixels.length === 0) return 0;
    let fixed = 0;
    for (let i = 0; i < img.pixels.length; i += 4) {
      const r = img.pixels[i];
      const g = img.pixels[i + 1];
      const b = img.pixels[i + 2];
      // Inline brown-ish test to avoid a function call per pixel
      if (r > 60 && r < 180 && g > 30 && g < 120 && b < 80) {
        if (img.pixels[i + 3] !== 0) {
          img.pixels[i + 3] = 0;
          fixed++;
        }
      }
    }
    if (fixed > 0) {
      try { img.updatePixels(); } catch (e) {}
    }
    return fixed;
  } catch (e) { console.warn('[cleanImageBrown] failed', e); return 0; }
}


// diagnoseMapPixel removed — runtime diagnosis no longer supported.

function getTileState(x, y, layer = mapStates) {
  if (x < 0 || x >= logicalW || y < 0 || y >= logicalH) return -1;
  return layer[y * logicalW + x];
}

function isSolid(tileState) {
  
  if (WALKABLE_TILES.has(tileState)) {
    return false;
  }

  
  if (ITEM_DATA.hasOwnProperty(tileState)) {
    return false;
  }
  
  
  if (tileState === TILE_TYPES.MOB) {
      return false;
  }

  
  return true;
}

function canMoveTo(fromX, fromY, toX, toY) {
  const toState = getTileState(toX, toY);
  
  if (typeof TILE_TYPES !== 'undefined' && TILE_TYPES && typeof TILE_TYPES.HILL_NORTH === 'number') {
    const hillMin = TILE_TYPES.HILL_NORTH;
    const hillMax = TILE_TYPES.HILL_NORTHWEST;
    if (toState >= hillMin && toState <= hillMax) {
      if (isJumping) {
        return true; 
      } else {
        return false;
      }
    }
  }
  if (isSolid(toState)) return false;
  try {
    if (EDGE_LAYER_ENABLED && edgeLayer && logicalW && logicalH) {
      if (toX >= 0 && toX < logicalW && toY >= 0 && toY < logicalH) {
        const idx = toY * logicalW + toX;
        if (edgeLayer[idx]) return false;
      }
    }
  } catch (e) {  }
  return true;
}

function neighbors(x, y) {
  const out = [];
  if (x > 0) out.push({ x: x - 1, y });
  if (x < logicalW - 1) out.push({ x: x + 1, y });
  if (y > 0) out.push({ x, y: y - 1 });
  if (y < logicalH - 1) out.push({ x, y: y + 1 });
  return out;
}

function findFloodStart() {
  if (!logicalW || !logicalH) return -1;
  const candidates = [];
  if (playerPosition && typeof playerPosition.x === 'number' && typeof playerPosition.y === 'number') {
    candidates.push({ x: Math.round(playerPosition.x), y: Math.round(playerPosition.y) });
  }
  candidates.push({ x: Math.floor(logicalW / 2), y: Math.floor(logicalH / 2) });
  for (const c of candidates) {
    if (!c) continue;
    const { x, y } = c;
    if (x < 0 || x >= logicalW || y < 0 || y >= logicalH) continue;
    const state = getTileState(x, y);
    if (!isSolid(state)) {
      return y * logicalW + x;
    }
  }
  for (let idx = 0; idx < logicalW * logicalH; idx++) {
    const x = idx % logicalW;
    const y = Math.floor(idx / logicalW);
    const state = getTileState(x, y);
    if (!isSolid(state)) return idx;
  }
  return -1;
}

function floodReachable(options = {}) {
  let respectEdgeLayer = Object.prototype.hasOwnProperty.call(options, 'respectEdgeLayer') ? !!options.respectEdgeLayer : true;
  
  if (!EDGE_LAYER_ENABLED) respectEdgeLayer = false;
  if (!logicalW || !logicalH) return new Uint8Array(0);
  const total = logicalW * logicalH;
  const visited = new Uint8Array(total);
  if (!mapStates || mapStates.length !== total) return visited;
  const startIdx = findFloodStart();
  if (startIdx < 0) return visited;
  const queue = new Array(total);
  let head = 0;
  let tail = 0;
  queue[tail++] = startIdx;
  visited[startIdx] = 1;
  while (head < tail) {
    const idx = queue[head++];
    const x = idx % logicalW;
    const y = Math.floor(idx / logicalW);
    const next = [
      { nx: x - 1, ny: y },
      { nx: x + 1, ny: y },
      { nx: x, ny: y - 1 },
      { nx: x, ny: y + 1 }
    ];
    for (const { nx, ny } of next) {
      if (nx < 0 || nx >= logicalW || ny < 0 || ny >= logicalH) continue;
      const nIdx = ny * logicalW + nx;
      if (visited[nIdx]) continue;
      const state = getTileState(nx, ny);
      if (isSolid(state)) continue;
      if (respectEdgeLayer && edgeLayer && edgeLayer.length === total && edgeLayer[nIdx]) continue;
      visited[nIdx] = 1;
      queue[tail++] = nIdx;
    }
  }
  return visited;
}

function ensureEdgeLayerConnectivity() {
  
  if (!EDGE_LAYER_ENABLED) return;
  if (!edgeLayer || !logicalW || !logicalH) return;
  const total = logicalW * logicalH;
  if (edgeLayer.length !== total) return;
  const reachableWithoutBarrier = floodReachable({ respectEdgeLayer: false });
  if (!reachableWithoutBarrier || reachableWithoutBarrier.length !== total) return;
  let reachableWithBarrier = floodReachable({ respectEdgeLayer: true });
  if (!reachableWithBarrier || reachableWithBarrier.length !== total) return;
  let needsFix = false;
  for (let i = 0; i < total; i++) {
    if (reachableWithoutBarrier[i] && !reachableWithBarrier[i]) {
      needsFix = true;
      break;
    }
  }
  if (!needsFix) return;
  let adjustments = 0;
  let iterations = 0;
  const maxIterations = 16;
  while (needsFix && iterations < maxIterations) {
    iterations++;
    let opened = 0;
    for (let idx = 0; idx < total; idx++) {
      if (!edgeLayer[idx]) continue;
      if (!reachableWithoutBarrier[idx]) continue;
      if (reachableWithBarrier[idx]) continue;
      const x = idx % logicalW;
      const y = Math.floor(idx / logicalW);
      let touchesReachable = false;
      if (x > 0 && reachableWithBarrier[idx - 1]) touchesReachable = true;
      if (!touchesReachable && x < logicalW - 1 && reachableWithBarrier[idx + 1]) touchesReachable = true;
      if (!touchesReachable && y > 0 && reachableWithBarrier[idx - logicalW]) touchesReachable = true;
      if (!touchesReachable && y < logicalH - 1 && reachableWithBarrier[idx + logicalW]) touchesReachable = true;
      if (!touchesReachable) continue;
      edgeLayer[idx] = 0;
      opened++;
      adjustments++;
      if (EDGE_LAYER_DEBUG) console.log('[game] connectivity fix: clearing barrier at', x, y);
    }
    if (!opened) break;
    reachableWithBarrier = floodReachable({ respectEdgeLayer: true });
    needsFix = false;
    for (let i = 0; i < total; i++) {
      if (reachableWithoutBarrier[i] && !reachableWithBarrier[i]) {
        needsFix = true;
        break;
      }
    }
  }
  if (adjustments > 0) {
    console.log('[game] ensureEdgeLayerConnectivity removed', adjustments, 'barrier tiles to keep paths accessible');
  }
}

function createFullWindowCanvas() {
  W = windowWidth;
  H = windowHeight;
  createCanvas(W, H);
  pixelDensity(1);
}

let _resizeConfirmTimer = null;
let _lastRequestedSize = { w: 0, h: 0 };

function _confirmResize() {
  _resizeConfirmTimer = null;

  W = windowWidth;
  H = windowHeight;
  virtualW = W;
  virtualH = H;

  resizeCanvas(W, H);
  const mapW = (logicalW || 0) * cellSize;
  const mapH = (logicalH || 0) * cellSize;
  const needsRegen = mapW < virtualW || mapH < virtualH;
  if (!needsRegen && typeof mapStates !== 'undefined' && mapStates && mapStates.length > 0 && logicalW && logicalH) {
    
    redraw();
    console.log('[game] windowResized: shrinking, redrawing with existing mapImage');
  } else {
    if (needsRegen) {
      console.log('[game] windowResized: map too small for new viewport, regenerating');
      try { showToast('Viewport expanded — regenerating map', 'info', 2000); } catch (e) {}
    }
    generateMap();
  }
}

function windowResized() {
  try {
    clearTimeout(_resizeConfirmTimer);
  } catch (e) {}
  _lastRequestedSize = { w: windowWidth, h: windowHeight };
  _resizeConfirmTimer = setTimeout(() => {
    if (_lastRequestedSize.w === windowWidth && _lastRequestedSize.h === windowHeight) {
      _confirmResize();
    } else {
      windowResized();
    }
  }, 200);
}

function mousePressed() {
  try {
    if (inGameMenuVisible) {
      
      try {
        const mx = mouseX;
        const my = mouseY;
        for (const b of inGameMenuButtonRects || []) {
          if (!b) continue;
          if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
            if (b.id === 'continue') {
              inGameMenuVisible = false;
              return;
            }
            if (b.id === 'settings') {
              
              try {
                
                openInGameSettings({ 
                    masterVol, 
                    musicVol, 
                    sfxVol, 
                    difficulty: currentDifficulty 
                });
                
              } catch (e) { console.warn('[game] openInGameSettings failed', e); }
              return;
            }
            if (b.id === 'exit') {
              try {
                if (window.parent && window.parent !== window) {
                  window.parent.postMessage({ type: 'close-game-overlay' }, '*');
                  try { if (typeof window.parent.removeGameOverlay === 'function') window.parent.removeGameOverlay(); } catch (e) {}
                }
              } catch (e) { console.warn('[game] failed to post close-game-overlay', e); }
              return;
            }
          }
        }
      } catch (e) { console.warn('[game] inGameMenu mouse handling failed', e); }
      
      return;
    }
  } catch (e) {}
}

function keyPressed() {
  if (key === ' ' && !isJumping && !isMoving) {
    
    isJumping = true;
    jumpFrame = 0;
    jumpTimer = 0;

    
    try {
      const nowA = (typeof keyIsDown === 'function') ? keyIsDown(65) : false;
      const nowD = (typeof keyIsDown === 'function') ? keyIsDown(68) : false;
      const nowW = (typeof keyIsDown === 'function') ? keyIsDown(87) : false;
      const nowS = (typeof keyIsDown === 'function') ? keyIsDown(83) : false;
      const dx = (nowD ? 1 : 0) - (nowA ? 1 : 0);
      const dy = (nowS ? 1 : 0) - (nowW ? 1 : 0);
      
      if (dx === 0 && dy === 0) {
        
      } else {
        const dir = deltaToDirection(dx, dy);
        const d = directionToDelta(dir);
      const maxTileX = Math.max(0, Math.floor(((virtualW || W) - cellSize) / cellSize));
      const maxTileY = Math.max(0, Math.floor(((virtualH || H) - cellSize) / cellSize));
      let targetX = (typeof playerPosition.x === 'number' ? playerPosition.x : 0) + d.dx;
      let targetY = (typeof playerPosition.y === 'number' ? playerPosition.y : 0) + d.dy;
      targetX = Math.max(0, Math.min(targetX, maxTileX));
      targetY = Math.max(0, Math.min(targetY, maxTileY));
        if (canMoveTo(playerPosition.x, playerPosition.y, targetX, targetY)) {
        handleItemInteraction(targetX, targetY);
        const prevX = playerPosition.x;
        const prevY = playerPosition.y;
        if (isMoving) {
          queuedMove = { prevX, prevY, targetX, targetY };
        } else {
          playerPosition.x = targetX;
          playerPosition.y = targetY;
          lastMoveDX = playerPosition.x - prevX;
          lastMoveDY = playerPosition.y - prevY;
          lastDirection = deltaToDirection(lastMoveDX, lastMoveDY);
          startMoveVisual(prevX, prevY, playerPosition.x, playerPosition.y);
        }
      }
      }
    } catch (e) { console.warn('[game] jump-forward movement failed', e); }
    return;
  }
  if (key === 'Escape' || keyCode === 27) {
    try {
      console.log('[game] keyPressed Escape — toggling inGameMenuVisible (was)', inGameMenuVisible);
      inGameMenuVisible = !inGameMenuVisible;
      console.log('[game] inGameMenuVisible is now', inGameMenuVisible);
    } catch (e) { console.warn('[game] toggling inGameMenuVisible failed', e); }
    return;
  }

  if (key === 'f' || key === 'F') {
    fullscreen(!fullscreen());
    return;
  }

  if (key === 't' || key === 'T') {
    try {
      toggleCustomAssetsRuntime();
      try { createMapImage(); redraw(); } catch (e) { console.warn('[game] createMapImage failed after custom asset toggle', e); }
    } catch (e) { console.warn('[game] error toggling custom assets', e); }
    return;
  }

  if (key === 'p' || key === 'P') {
    try {
      console.log('[game] key P pressed — generating new map (previous autosave will be archived)');
      nextGenerateIsManual = true;
      generateMap();
    } catch (e) {
      console.warn('[game] generateMap() failed from key press', e);
    }
    return;
  }

  
  if (key === 'o' || key === 'O') {
    try {
      console.log('[game] debug key O pressed — forcing inGameMenuVisible = true');
      inGameMenuVisible = true;
    } catch (e) { console.warn('[game] debug O failed', e); }
    return;
  }
}


try {
  window.addEventListener('keydown', (e) => {
    try {
      if (e.key === 'Escape' || e.keyCode === 27) {
        
        const active = document && document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

        
        try {
          const ig = (typeof document !== 'undefined') ? document.getElementById('gd-in-game-settings') : null;
          if (ig) {
            try { closeInGameSettings(); } catch (err) { console.warn('[game] closeInGameSettings failed', err); }
            e.preventDefault();
            return;
          }
        } catch (err) {  }

        
        try {
          inGameMenuVisible = !inGameMenuVisible;
          e.preventDefault();
        } catch (err) {
          console.warn('[game] toggling inGameMenuVisible (global handler) failed', err);
        }
      }
    } catch (err) {  }
  }, false);
} catch (e) { console.warn('[game] failed to attach global Escape handler', e); }

// --- HELPER FUNCTIONS TO FIX CRASHES ---

function getColorForState(state) {
  // Uses the COLORS object defined earlier in your code
  if (typeof COLORS !== 'undefined' && COLORS[state]) {
    return COLORS[state];
  }
  // Fallback default color (Magenta to make it obvious if something is missing)
  return [255, 0, 255]; 
}

// (removed) brown pixel helper — checks are now inlined and sampled

// --- UNIFIED SETTINGS BUILDERS (Upscaled) ---

function buildAudioSettings(ctx) {
  ctx
    .addSliderRow("Master Volume", 0, 100, masterVol * 100, v => { 
        masterVol = v / 100; 
        if(typeof applyVolumes === 'function') applyVolumes();
        if(gameMusic) gameMusic.setVolume(musicVol * masterVol); 
    }, { isAudio: true })
    .addSliderRow("Music Volume", 0, 100, musicVol * 100, v => { 
        musicVol = v / 100; 
        if(typeof applyVolumes === 'function') applyVolumes();
        if(gameMusic) gameMusic.setVolume(musicVol * masterVol);
    }, { isAudio: true })
    .addSliderRow("SFX Volume", 0, 100, sfxVol * 100, v => { 
        sfxVol = v / 100; 
    }, { isAudio: true });
}

function buildGameplaySettings(ctx) {
  ctx
    .addCheckboxRow("Show Tutorials", true)
    .addCheckboxRow("Enable HUD", true)
    .addSelectRow("Difficulty", ["Easy", "Normal", "Hard"], {
      value: (difficultySetting.charAt(0).toUpperCase() + difficultySetting.slice(1)),
      onChange: (val) => {
        const normalized = val.toLowerCase();
        difficultySetting = normalized;
        if(typeof setDifficulty === 'function') setDifficulty(normalized, { regenerate: false });
      }
    });
}

function buildControlsSettings(ctx) {
  ctx.addSliderRow("Sensitivity", 1, 10, 5, v => {})
     .addCheckboxRow("Invert Y Axis", false);
}



function buildLanguageSettings(ctx) {
  ctx.addSelectRow("Language", ["English", "Spanish", "French", "German"]);
}

// --- HELPER: Pixel Art Button Styling ---
function stylePixelButton(btn) {
  // Reset basic styles
  btn.style('background-color', 'transparent');
  btn.style('border', 'none');
  btn.style('color', 'white');
  btn.style('cursor', 'pointer');
  
  // Apply the Asset
  btn.style('background-image', "url('assets/3-GUI/Button BG.png')");
  btn.style('background-size', '100% 100%');
  btn.style('background-repeat', 'no-repeat');
  btn.style('image-rendering', 'pixelated'); // Keep it crisp
  
  // Font & Shadow
  btn.style('font-family', 'MyFont, sans-serif'); // Ensure your font is used
  btn.style('text-shadow', '3px 3px 0 #000');
  
  // Hover Effect
  btn.mouseOver(() => {
    btn.style('filter', 'brightness(1.2)');
    btn.style('transform', 'scale(1.05)');
  });
  btn.mouseOut(() => {
    btn.style('filter', 'brightness(1.0)');
    btn.style('transform', 'scale(1.0)');
  });
  
  // Initial Z-Index
  btn.style('z-index', '20005');
}


// --- UNIFIED SETTINGS BUILDERS ---

function buildAudioSettings(ctx) {
  ctx
    .addSliderRow("Master Volume", 0, 100, masterVol * 100, v => { 
        masterVol = v / 100; 
        if(typeof applyVolumes === 'function') applyVolumes();
        if(gameMusic) gameMusic.setVolume(musicVol * masterVol); 
    })
    .addSliderRow("Music Volume", 0, 100, musicVol * 100, v => { 
        musicVol = v / 100; 
        if(typeof applyVolumes === 'function') applyVolumes();
        if(gameMusic) gameMusic.setVolume(musicVol * masterVol);
    })
    .addSliderRow("SFX Volume", 0, 100, sfxVol * 100, v => { 
        sfxVol = v / 100; 
    });
}

function buildGameplaySettings(ctx) {
  ctx
    .addCheckboxRow("Show Tutorials", true)
    .addCheckboxRow("Enable HUD", true)
    .addSelectRow("Difficulty", ["Easy", "Normal", "Hard"], {
      value: (difficultySetting.charAt(0).toUpperCase() + difficultySetting.slice(1)),
      onChange: (val) => {
        difficultySetting = val.toLowerCase();
        if(typeof setDifficulty === 'function') setDifficulty(difficultySetting, { regenerate: false });
      }
    });
}

function buildControlsSettings(ctx) {
  ctx.addSliderRow("Sensitivity", 1, 10, 5, v => {})
     .addCheckboxRow("Invert Y Axis", false);
}

function buildAccessibilitySettings(ctx) {
  ctx.addSelectRow("Color Mode", ["None", "Protanopia", "Deuteranopia", "Tritanopia"]);
  
  // Custom buttons for Text Size (using Assets)
  const { labelX, controlX, controlWidth, spacingY } = ctx.layout;
  
  // Label
  const lbl = createDiv("Text Size");
  lbl.class('setting-label');
  lbl.position(labelX, ctx.y);
  lbl.size(ctx.layout.labelWidth, 60); // Use calculated width
  lbl.style('text-align', 'right');
  lbl.style('color', 'white');
  lbl.style('font-size', '48px');
  lbl.style('text-shadow', '3px 3px 0 #000');
  lbl.style('z-index', '20005');
  ctx.pushElement(lbl);

  // Buttons
  const sizes = ["Small", "Default", "Big"];
  const btnGap = 10;
  // Calculate button width to fit exactly in the control area
  const btnW = (controlWidth - (btnGap * (sizes.length - 1))) / sizes.length;
  let currX = controlX;
  
  sizes.forEach(size => {
      const btn = createButton(size);
      btn.position(currX, ctx.y - 10); // Slight nudge up to align with text
      btn.size(btnW, 80); 
      
      stylePixelButton(btn); // <--- APPLY ASSET HERE
      btn.style('font-size', '30px'); 
      
      btn.mousePressed(() => { console.log("Text size:", size); });
      ctx.pushElement(btn);
      currX += btnW + btnGap;
  });
  
  ctx.y += spacingY + 30; 
}

function buildLanguageSettings(ctx) {
  ctx.addSelectRow("Language", ["English", "Spanish", "French", "German"]);
}

// --- UNIFIED CONTEXT CREATOR ---
function createSettingsContext({ cx, startY, spacingY }) {
  let y = startY;
  
  // --- CENTER ALIGNMENT MATH ---
  // We define a fixed width for labels and controls relative to the center (cx)
  const labelWidth = 500;   // Width of the text area to the left
  const controlWidth = 500; // Width of the input area to the right
  const gap = 40;           // Gap between label and input in the exact center
  
  const labelX = cx - labelWidth - (gap / 2);
  const controlX = cx + (gap / 2);

  const styleLabel = (el) => {
      el.class('setting-label');
      el.style('color', 'white');
      el.style('font-size', '45px');
      el.style('text-align', 'right'); // Align text to the center gap
      el.style('z-index', '20005');
      el.style('pointer-events', 'none');
      el.style('text-shadow', '3px 3px 0 #000');
      el.style('display', 'flex');
      el.style('align-items', 'center');
      el.style('justify-content', 'flex-end');
  };

  const styleInput = (el) => {
      el.style('z-index', '20005');
      el.style('cursor', 'pointer');
  };

  const ctx = {
    get y() { return y; },
    set y(value) { y = value; },
    layout: { labelX, controlX, labelWidth, controlWidth, spacingY },
    
    pushElement(el) {
        activeSettingElements.push(el);
        return ctx;
    },

    addSliderRow(name, min, max, val, callback) {
      const lbl = createDiv(name);
      lbl.position(labelX, y);
      lbl.size(labelWidth, 60);
      styleLabel(lbl);
      activeSettingElements.push(lbl);

      const slider = createSlider(min, max, val);
      slider.position(controlX, y + 20); 
      slider.style('width', (controlWidth * 0.8) + 'px'); // Slightly shorter than full width
      slider.style('height', '30px');
      styleInput(slider);
      
      slider.style('transform', 'scale(2.5)'); 
      slider.style('transform-origin', 'left center');
      
      slider.input(() => callback(slider.value()));
      
      activeSettingElements.push(slider);
      y += spacingY;
      return ctx;
    },

    addCheckboxRow(name, state) {
      const cb = createCheckbox(' ' + name, state);
      // For checkboxes, p5 creates a label. We position it at controlX
      cb.position(controlX, y);
      cb.style('color', 'white');
      cb.style('font-size', '45px');
      cb.style('text-shadow', '3px 3px 0 #000');
      styleInput(cb);
      
      cb.style('transform', 'scale(2.5)');
      cb.style('transform-origin', 'left top');
      
      // Since p5 checkboxes include the text, we don't need a separate label on the left usually.
      // But to keep alignment, if 'name' is long, we might want to split it.
      // For now, standard p5 behavior:
      activeSettingElements.push(cb);
      y += spacingY;
      return ctx;
    },

    addSelectRow(name, opts, options = {}) {
      const lbl = createDiv(name);
      lbl.position(labelX, y);
      lbl.size(labelWidth, 60);
      styleLabel(lbl);
      activeSettingElements.push(lbl);

      const sel = createSelect();
      sel.position(controlX, y);
      sel.size(controlWidth * 0.8, 70); 
      sel.style('font-size', '35px');
      sel.style('background', '#222');
      sel.style('color', 'white');
      sel.style('border', '4px solid #555'); // Thicker border for visibility
      sel.style('border-radius', '8px');
      styleInput(sel);
      
      opts.forEach(opt => sel.option(opt));
      
      if (options.value) sel.value(options.value);
      if (options.onChange) sel.changed(() => options.onChange(sel.value()));

      activeSettingElements.push(sel);
      y += spacingY;
      return ctx;
    }
  };
  return ctx;
}

// --- IN-GAME MENU FUNCTIONS ---

function openInGameSettings(payload = {}) {
  closeInGameSettings(); 

  if (payload.masterVol !== undefined) masterVol = payload.masterVol;
  if (payload.musicVol !== undefined) musicVol = payload.musicVol;
  if (payload.sfxVol !== undefined) sfxVol = payload.sfxVol;
  if (payload.difficulty) difficultySetting = payload.difficulty;

  // Background
  settingsOverlayDiv = createDiv('');
  settingsOverlayDiv.style('position', 'fixed');
  settingsOverlayDiv.style('top', '0');
  settingsOverlayDiv.style('left', '0');
  settingsOverlayDiv.style('width', '100%');
  settingsOverlayDiv.style('height', '100%');
  settingsOverlayDiv.style('background', '#000000'); 
  settingsOverlayDiv.style('z-index', '20000'); 
  
  renderSettingsCategories();
}

function renderSettingsCategories() {
  activeSettingElements.forEach(e => e.remove());
  activeSettingElements = [];

  const menuWidth = 600;       
  const buttonHeight = 110;  
  const spacing = 30;          
  const cx = windowWidth / 2;
  const cy = windowHeight / 2;
  
  const totalMenuH = (SETTINGS_CATEGORIES.length * (buttonHeight + spacing)) + 220; 
  const startY = cy - (totalMenuH / 2);
  const xPos = cx - (menuWidth / 2);

  // Title
  const title = createDiv("SETTINGS");
  title.style('color', '#ffcc00');
  title.style('font-size', '100px'); 
  title.style('font-weight', 'bold');
  title.style('text-align', 'center');
  title.style('text-shadow', '6px 6px 0 #333');
  title.position(cx - 400, startY);
  title.size(800, 140);
  title.style('z-index', '20005');
  activeSettingElements.push(title);

  let currentY = startY + 160;

  // Category Buttons
  SETTINGS_CATEGORIES.forEach((label) => {
    const btn = createButton(label);
    btn.position(xPos, currentY);
    btn.size(menuWidth, buttonHeight);
    
    stylePixelButton(btn); // <--- APPLY ASSET HERE
    btn.style('font-size', '55px'); 
    
    btn.mousePressed(() => {
       showSubSettingsInGame(label);
    });
    
    activeSettingElements.push(btn);
    currentY += buttonHeight + spacing;
  });

  // Close Button
  const btnClose = createButton("Close");
  btnClose.position(xPos, currentY + 50);
  btnClose.size(menuWidth, buttonHeight);
  
  stylePixelButton(btnClose); // <--- APPLY ASSET HERE
  btnClose.style('font-size', '55px');
  btnClose.style('color', '#ff5555'); // Red tint text for close
  
  btnClose.mousePressed(() => {
    closeInGameSettings();
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'sync-settings',
        masterVol, musicVol, sfxVol, difficulty: difficultySetting
      }, '*');
    }
  });
  activeSettingElements.push(btnClose);
}

function showSubSettingsInGame(label) {
  activeSettingElements.forEach(e => e.remove());
  activeSettingElements = [];

  const cx = windowWidth / 2;
  const cy = windowHeight / 2;
  
  // Title
  const title = createDiv(label);
  title.style('color', '#ffcc00');
  title.style('font-size', '80px'); 
  title.style('font-weight', 'bold');
  title.style('text-align', 'center');
  title.style('text-shadow', '5px 5px 0 #333');
  title.position(cx - 400, 50);
  title.size(800, 100);
  title.style('z-index', '20005');
  activeSettingElements.push(title);

  // Layout Context (Centered)
  const startY = 220; 
  const ctx = createSettingsContext({
    cx: cx,
    startY: startY,
    spacingY: 140
  });

  const builders = {
      Audio: buildAudioSettings,
      Gameplay: buildGameplaySettings,
      Controls: buildControlsSettings,
      Accessibility: buildAccessibilitySettings,
      Language: buildLanguageSettings
  };

  const builder = builders[label];
  if (builder) {
    builder(ctx);
  }

  // Back Button
  const backBtn = createButton("← Back");
  backBtn.position(cx - 200, windowHeight - 160);
  backBtn.size(400, 100);
  
  stylePixelButton(backBtn); // <--- APPLY ASSET HERE
  backBtn.style('font-size', '50px'); 
  
  backBtn.mousePressed(() => {
    renderSettingsCategories(); 
  });
  activeSettingElements.push(backBtn);
}

function ensureLoadingOverlayDom() {
  try {
    if (typeof document === 'undefined') return null;
    
    if (!document.body) {
      setTimeout(ensureLoadingOverlayDom, 50);
      return null;
    }

    let el = document.getElementById('gd-loading-overlay');
    if (el) return el;

    // --- 1. Font Configuration ---
    // Ensure this path matches your file structure exactly
    const fontPath = 'assets/3-GUI/font.ttf'; 

    const styleId = 'gd-loading-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @font-face {
          font-family: 'PixelGameFont';
          src: url('${fontPath}');
        }
        #gd-loading-overlay {
          font-family: 'PixelGameFont', 'Courier New', monospace !important;
          background-color: #000000 !important; /* SOLID BLACK */
          color: #ffcc00;
        }
        .gd-loading-message {
          font-size: 48px; 
          text-transform: uppercase;
          margin-bottom: 25px;
          text-shadow: 4px 4px 0px #333;
          letter-spacing: 2px;
        }
        .gd-progress-container {
          width: 500px;
          max-width: 85%;
          height: 30px;
          border: 4px solid #ffcc00;
          background-color: #111; /* Dark inner bar */
          padding: 3px;
          margin-bottom: 10px;
        }
        .gd-progress-fill {
          height: 100%;
          width: 0%;
          background-color: #ffcc00; /* Yellow Fill */
          transition: width 0.1s linear;
        }
        .gd-progress-text {
          font-size: 24px;
          color: #888;
        }
      `;
      document.head.appendChild(style);
    }

    // --- 2. Create Elements ---
    el = document.createElement('div');
    el.id = 'gd-loading-overlay';
    Object.assign(el.style, {
      position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: '2147483647',
      userSelect: 'none',
      opacity: '1' // Force opacity
    });

    const msg = document.createElement('div');
    msg.className = 'gd-loading-message';
    msg.innerText = overlayMessage || 'LOADING MAP...';

    const barCont = document.createElement('div');
    barCont.className = 'gd-progress-container';
    
    const barFill = document.createElement('div');
    barFill.className = 'gd-progress-fill';
    
    const pct = document.createElement('div');
    pct.className = 'gd-progress-text';
    pct.innerText = '0%';

    barCont.appendChild(barFill);
    el.appendChild(msg);
    el.appendChild(barCont);
    el.appendChild(pct);
    document.body.appendChild(el);

    return el;
  } catch (e) { return null; }
}
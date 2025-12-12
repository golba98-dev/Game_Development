let virtualW, virtualH;
let pendingGameActivated = false;

let mapLoadComplete = false;

let cloudImages = [];
let clouds = [];
const MAX_CLOUDS = 100;
const CLOUD_SPAWN_INTERVAL = 8000; 
let lastCloudSpawn = 0;

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
let settingsOverlayPanel = null;

const SETTINGS_CATEGORIES = Object.freeze(["Audio", "Gameplay", "Controls", "Accessibility", "Language"]);
const DEFAULT_SETTINGS = Object.freeze({
  masterVol: 0.8, musicVol: 0.6, sfxVol: 0.7, textSize: 75, difficulty: 'normal'
});

const CONTROL_VERTICAL_NUDGE = 8;
const SELECT_VERTICAL_NUDGE = 15;
const TEXTSIZE_BUTTON_Y_OFFSET = 10;
const BACK_BUTTON_VERTICAL_OFFSET = 120;

let genPhase = 0;      
let genTimer = 0;      
let genTempData = {};  

// --- ZOOM SETTINGS ---
const FIXED_VIRTUAL_HEIGHT = 3000; 
let gameScale = 1;

// --- SPRINT VARIABLES (Prevents Crash) ---
let sprintEnergy = 100;
const SPRINT_MAX = 100;
const SPRINT_COST_PER_FRAME = 0.5; 
const SPRINT_REGEN_PER_FRAME = 0.2;
let lastRunTime = 0;

// --- CORE LIFECYCLE ---
// preload() -
// setup() -
// draw() -
// windowResized() -
// _confirmResize() -
// createFullWindowCanvas() -
// mousePressed() -
// keyPressed() -
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
  
  
  for (let i = 1; i <= 5; i++) {
    try {
      trackLoadImage(`cloud_${i}`, `assets/5-Objects/cloud_${i}.png`, 
        (img) => { cloudImages[i - 1] = img; console.log(`[game] loaded cloud_${i}`); },
        (err) => { console.warn(`[game] failed to load cloud_${i}`, err); }
      );
    } catch (e) {}
  }
  
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
  console.log("!!! NEW VERSION LOADED !!! - FIXED_VIRTUAL_HEIGHT = " + FIXED_VIRTUAL_HEIGHT);
  
  W = windowWidth;
  H = windowHeight;

  // 1. FORCE SHARPNESS (CSS Method)
  // This makes the game crisp immediately.
  let canvasStyle = document.createElement('style');
  canvasStyle.innerHTML = `
    canvas { 
      image-rendering: pixelated !important; 
      image-rendering: crisp-edges !important; 
    }
    #gd-loading-content {
      transform-origin: center center;
      transition: transform 0.1s ease-out;
    }
  `;
  document.head.appendChild(canvasStyle);

  // 2. High Resolution
  pixelDensity(window.devicePixelRatio || 1);

  // 3. Calculate Scale
  gameScale = H / FIXED_VIRTUAL_HEIGHT;
  virtualW = W / gameScale;
  virtualH = H / gameScale;

  let cnv = createCanvas(W, H);
  
  // 4. Backup Sharpness
  try {
    if (cnv && cnv.elt) cnv.elt.style.imageRendering = "pixelated"; 
    if (drawingContext) drawingContext.imageSmoothingEnabled = false;
    noSmooth(); 
  } catch (e) {}

  try { injectCustomStyles(); } catch (e) {}
  
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
    const loc = window.location;
    const isLocal = loc.hostname === 'localhost' || loc.hostname === '127.0.0.1';
    const forceServer = urlParams.get('useServer') === '1';
    if (isLocal || forceServer) {
      serverFetchPromise = tryFetchActiveMap();
    }
  } catch (e) {}

  AssetTracker.waitReady(3500).then((ready) => {
    if (ready) {
      console.log('[game] assets loaded. Pre-warming clouds...');
      
      // FORCE CLOUDS EVERYWHERE
      // We use the virtual world width so clouds don't bunch on the left.
      const wWidth = width / (height / 3000); 
      for(let i = 0; i < 25; i++) {
          spawnCloud(Math.random() * wWidth); 
      }
    }

    const runAutoGenerator = () => { generateMap(); };

    serverFetchPromise.then((serverLoaded) => {
      if (serverLoaded) {
         if (persistentGameId && persistentGameId.startsWith('server_default_')) {
             runAutoGenerator();
         }
         return; 
      }
      if (loadMapFromStorage()) return;
      runAutoGenerator();
    }).catch((err) => { runAutoGenerator(); });
    
    try {
      serverFetchPromise.finally(() => {
          setTimeout(() => {
             if (typeof mapLoadComplete === 'undefined' || !mapLoadComplete) {
                 if (genPhase === 0) generateMap();
             }
          }, 1000);
      });
    } catch(e) {}
    
    if (!ready) {
      try {
        AssetTracker.onReady(() => {
          try { createMapImage(); redraw(); } catch (e) {}
        });
      } catch (e) {}
    }
  });
  
  if (gameMusic) gameMusic.setVolume(musicVol * masterVol);
  if (pendingGameActivated) { try { _confirmResize(); pendingGameActivated = false; } catch (e) {} }
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

function _confirmResize() {
  _resizeConfirmTimer = null;

  W = windowWidth;
  H = windowHeight;

  // 1. Maintain Quality
  pixelDensity(window.devicePixelRatio || 1);
  
  // 2. Recalculate Scale
  gameScale = H / FIXED_VIRTUAL_HEIGHT;
  virtualW = W / gameScale;
  virtualH = H / gameScale;

  resizeCanvas(W, H);
  
  // 3. RE-APPLY CLARITY (Important!)
  try {
    if (drawingContext) {
      drawingContext.imageSmoothingEnabled = false;
    }
    let cnv = select('canvas');
    if (cnv) {
        cnv.elt.style.imageRendering = "pixelated";
    }
  } catch (e) {}

  if (typeof mapStates === 'undefined' || !mapStates || mapStates.length === 0) {
      console.log('[game] windowResized: Map not ready yet.');
      return;
  }

  const mapW = (logicalW || 0) * cellSize;
  const mapH = (logicalH || 0) * cellSize;
  
  const needsRegen = mapW < virtualW || mapH < virtualH;

  if (!needsRegen) {
    console.log('[game] windowResized: preserving existing map');
    try { createMapImage(); } catch (e) { console.warn('createMapImage failed', e); }
    redraw();
  } else {
    console.log('[game] windowResized: map too small, regenerating');
    try { showToast('Viewport expanded — regenerating map', 'info', 2000); } catch (e) {}
    generateMap();
  }
}

function createFullWindowCanvas() {
  W = windowWidth;
  H = windowHeight;
  createCanvas(W, H);
  pixelDensity(1);
}

function mousePressed() {
  try {
    // FIX: Un-scale mouse coordinates to match the virtual world
    const mx = mouseX / gameScale;
    const my = mouseY / gameScale;

    // Canvas menu click handling removed (now using DOM menu)
  } catch (e) {}
}

function togglePauseMenuFromEscape() {
  const now = Date.now();
  if (now - _lastEscToggleAt < 50) return; // debounce to prevent double-fire from multiple handlers
  _lastEscToggleAt = now;

  try {
    if (settingsOverlayDiv) {
      if (settingsOverlayDiv.closeZoomPanel) settingsOverlayDiv.closeZoomPanel();
      else settingsOverlayDiv.remove();
      settingsOverlayDiv = null;
      openInGameMenu();
      return;
    }

    if (inGameMenuVisible) {
      closeInGameMenu();
    } else {
      openInGameMenu();
    }
  } catch (e) { console.warn('[game] toggling inGameMenuVisible failed', e); }
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
  if (key === 'Escape' || keyCode === 27) { togglePauseMenuFromEscape(); return false; }

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

// Global escape listener to handle cases where p5 keyPressed is not firing (e.g., focus on overlay div)
try {
  window.addEventListener('keydown', (ev) => {
    if (ev && ev.key === 'Escape') {
      ev.preventDefault();
      togglePauseMenuFromEscape();
    }
  }, { capture: true });
} catch (e) {
  console.warn('[game] failed to attach global Escape handler', e);
}


// --- MAP GENERATION & MANAGEMENT ---
// generateMap() -
// generateMap_Part1() -
// generateMap_Part2() -
// computeClearArea() -
// applyNoiseTerrain(centerX, centerY, baseClearWidth, baseClearHeight) - 
// postProcessRiversAndClearArea(clearStartX, clearEndX, clearStartY, clearEndY) -
// pruneUnreachable(startX, startY) -
// generateHills(map, w, h) -
// getHillTileType(grid, x, y, w) - 
// carveRivers(map, w, h, opts) -
// carveRiversMaybeThrough(map, w, h, opts) /
// carveBranchFromRiver(map, w, h, opts) /
// ensureInteractiveClearArea(map, w, h, opts) /
// smoothRiverTiles(map, w, h, opts) /
// roundRiverTips(map, w, h, opts) /
// layBridgeTile(map, w, h, x, y, RIVER_TILE, BRIDGE_TILE) -
// buildActiveMapPayload() -
// persistActiveMapToServer(reason) /
// saveMap(name) -
// downloadMapJSON(obj, filename) -
// autosaveMap() -
// tryFetchActiveMap() -
// applyLoadedMap(obj) -
// loadMapFromStorage() -
// showFilePickerToLoadActiveMap() -
// createMapImage() -
// ensureEdgeLayerConnectivity()
function generateMap() {
    genPhase = 1; 
}

function generateMap_Part1() {
  console.log('[game] Generating Part 1 (Base)...');
  
  if (!W || !H) return;
  logicalW = Math.ceil((virtualW || W) / cellSize);
  logicalH = Math.ceil((virtualH || H) / cellSize);

  mapStates = new Uint8Array(logicalW * logicalH);
  terrainLayer = new Uint8Array(logicalW * logicalH);

  
  const clearArea = computeClearArea();
  applyNoiseTerrain(clearArea.centerX, clearArea.centerY, clearArea.baseClearWidth, clearArea.baseClearHeight);
  
  
  genTempData = { clearArea };
}

function generateMap_Part2() {
  console.log('[game] Generating Part 2 (Roughness)...');
  
  const { clearArea } = genTempData;
  
  const spawn = postProcessRiversAndClearArea(clearArea.clearStartX, clearArea.clearEndX, clearArea.clearStartY, clearArea.clearEndY);

  

  generateHills(mapStates, logicalW, logicalH);

  
  pruneUnreachable(spawn.spawnX, spawn.spawnY);
  
  terrainLayer = mapStates.slice();
  counts = {};
  for (let i = 0; i < mapStates.length; i++) counts[mapStates[i]] = (counts[mapStates[i]] || 0) + 1;

  playerPosition = { x: spawn.spawnX, y: spawn.spawnY };
  renderX = playerPosition.x; renderY = playerPosition.y;
  renderStartX = renderX; renderStartY = renderY; renderTargetX = renderX; renderTargetY = renderY;
  isMoving = false;

  createMapImage();

  treeObjects = [];
  if (TREE_OVERLAY_IMG) {
    for (let y = 0; y < logicalH; y++) {
      for (let x = 0; x < logicalW; x++) {
        const idx = y * logicalW + x;
        if (mapStates[idx] !== TILE_TYPES.FOREST) continue;
        if (x === spawn.spawnX && y === spawn.spawnY) continue;
        if (Math.random() < TREE_SPAWN_CHANCE) treeObjects.push({ x, y });
      }
    }
    createMapImage();
  }
  
  
  genTempData = {};
  
  redraw();
  autosaveMap();
  persistActiveMapToServer('generated');
}

function computeClearArea() {
    const centerX = logicalW / 2;
    const centerY = logicalH / 2;
    const clearAreaRatio = 0.75 + Math.random() * 0.15;
    const baseClearWidth = logicalW * clearAreaRatio;
    const baseClearHeight = logicalH * clearAreaRatio;
    return {
      centerX, centerY, baseClearWidth, baseClearHeight,
      clearStartX: centerX - baseClearWidth / 2,
      clearEndX: centerX + baseClearWidth / 2,
      clearStartY: centerY - baseClearHeight / 2,
      clearEndY: centerY + baseClearHeight / 2
    };
}

function applyNoiseTerrain(centerX, centerY, baseClearWidth, baseClearHeight) {
    const noiseScale = 0.12;
    
    const radiusX = logicalW / 2;
    const radiusY = logicalH / 2;

    for (let y = 0; y < logicalH; y++) {
      for (let x = 0; x < logicalW; x++) {
        const idx = y * logicalW + x;

   
        const dx = (x - centerX) / radiusX;
        const dy = (y - centerY) / radiusY;
        const dist = Math.sqrt(dx*dx + dy*dy);

        const n = noise(x * noiseScale, y * noiseScale);
        const wobble = (n - 0.5) * 0.3; 

        if (dist + wobble > 0.80) {
            mapStates[idx] = TILE_TYPES.FOREST;
        } else {
            mapStates[idx] = TILE_TYPES.GRASS;
        }
      }
    }
}

function postProcessRiversAndClearArea(clearStartX, clearEndX, clearStartY, clearEndY) {
    const RIVER_TILE = (typeof TILE_TYPES !== 'undefined' && TILE_TYPES.RIVER) ? TILE_TYPES.RIVER : null;

    carveRivers(mapStates, logicalW, logicalH, { clearStartX, clearEndX, clearStartY, clearEndY, RIVER_TILE });

    const spawnX = Math.floor(logicalW / 2);
    const spawnY = Math.floor(logicalH / 2);
    const allowClearOverride = riverClearMode === RIVER_CLEAR_MODES.AUTO ? null : (riverClearMode === RIVER_CLEAR_MODES.ALWAYS);

    carveRiversMaybeThrough(mapStates, logicalW, logicalH, {
      clearStartX, clearEndX, clearStartY, clearEndY, RIVER_TILE,
      playerX: spawnX, playerY: spawnY, allowClearOverride
    });

    const branchChance = allowClearOverride === true ? 1 : 0.55;
    if (allowClearOverride !== false && Math.random() < branchChance) {
      carveBranchFromRiver(mapStates, logicalW, logicalH, {
        clearStartX, clearEndX, clearStartY, clearEndY, RIVER_TILE, playerX: spawnX, playerY: spawnY
      });
    }

    ensureInteractiveClearArea(mapStates, logicalW, logicalH, {
      clearStartX, clearEndX, clearStartY, clearEndY, playerX: spawnX, playerY: spawnY, RIVER_TILE
    });

    smoothRiverTiles(mapStates, logicalW, logicalH, { RIVER_TILE, clearStartX, clearEndX, clearStartY, clearEndY });
    roundRiverTips(mapStates, logicalW, logicalH, { RIVER_TILE, clearStartX, clearEndX, clearStartY, clearEndY });

    return { spawnX, spawnY };
}

function pruneUnreachable(startX, startY) {
    const startIdx = startY * logicalW + startX;
    if (isSolid(mapStates[startIdx])) return; 
    const q = [{ x: startX, y: startY }];
    const visited = new Set([`${startX},${startY}`]);
    let head = 0;
    const dirs = [
      { dx: 0, dy: -1 }, { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 },
      { dx: 0, dy: 1 },  { dx: -1, dy: 1 }, { dx: -1, dy: 0 }, { dx: -1, dy: -1 }
    ];
    while (head < q.length) {
      const { x, y } = q[head++];
      for (const d of dirs) {
        const nx = x + d.dx; const ny = y + d.dy;
        if (nx >= 0 && nx < logicalW && ny >= 0 && ny < logicalH) {
          const key = `${nx},${ny}`; const idx = ny * logicalW + nx;
          if (!visited.has(key) && !isSolid(mapStates[idx])) {
            visited.add(key); q.push({ x: nx, y: ny });
          }
        }
      }
    }
    for (let i = 0; i < mapStates.length; i++) {
      const x = i % logicalW; 
      const y = Math.floor(i / logicalW);
      
      if (!isSolid(mapStates[i]) && !visited.has(`${x},${y}`)) {
        mapStates[i] = TILE_TYPES.FOREST;
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

function buildActiveMapPayload() {
  try {
    if (typeof mapStates === 'undefined' || !mapStates) return null;
    return {
      persistentGameId: persistentGameId,
      timestamp: Date.now(),
      logicalW: logicalW || Math.ceil(W / cellSize),
      logicalH: logicalH || Math.ceil(H / cellSize),
      cellSize: cellSize,
      mapStates: Array.from(mapStates),
      terrainLayer: terrainLayer ? Array.from(terrainLayer) : null,
      treeObjects: Array.isArray(treeObjects) ? treeObjects.slice() : []
    };
  } catch (err) {
    console.warn('[game] buildActiveMapPayload failed', err);
    return null;
  }
}

function saveMap(name) {
  try {
    const payload = buildActiveMapPayload();
    if (!payload) {
      console.warn('[game] no map to save');
      return false;
    }
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
    persistActiveMapToServer('manual-save');
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

function autosaveMap() {
  try {
    const payload = buildActiveMapPayload();
    if (!payload) {
      console.warn('[game] no map to autosave');
      return false;
    }
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

function tryFetchActiveMap() {
  try {
    if (typeof fetch === 'undefined') return Promise.resolve(false);

    // FIX: Use relative path if we are on the server port (3000) to avoid CORS/origin mismatches.
    // Otherwise, default to standard localhost address.
    let url = 'http://localhost:3000/maps/active_map.json';
    if (typeof window !== 'undefined' && window.location && window.location.port === '3000') {
        url = '/maps/active_map.json';
    }

    return fetch(url, { cache: 'no-cache' })
      .then(resp => {
        if (!resp.ok) {
            console.warn('[game] tryFetchActiveMap: Server returned status', resp.status);
            return false;
        }
        return resp.json().then(obj => {
          try { 
              // applyLoadedMap updates the global persistentGameId
              const success = applyLoadedMap(obj); 
              if (success) {
                  console.log('[game] tryFetchActiveMap: Successfully applied map from server.');
                  return true;
              }
          } catch (e) { console.warn('[game] applyLoadedMap failed', e); }
          return false;
        }).catch(err => { console.warn('[game] failed to parse active_map.json', err); return false; });
      }).catch(err => { 
          // This usually happens if the server isn't running or port is blocked
          console.warn('[game] tryFetchActiveMap: Fetch failed', err); 
          return false; 
      });
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

function createMapImage() {
  if (!logicalW || !logicalH) {
    console.warn('[createMapImage] aborted: logical size not set yet');
    return;
  }
  const w = logicalW * cellSize;
  const h = logicalH * cellSize;
  console.log(`[createMapImage] creating graphics ${w}x${h} (logical: ${logicalW}x${logicalH})`);
  
  mapImage = createGraphics(w, h);
  
  // 1. Memory Optimization (Keep this at 1 for large maps)
  mapImage.pixelDensity(1); 
  
  // 2. FORCE CLARITY on the map buffer
  try {
    // This is the specific property that makes the map crisp
    if (mapImage.drawingContext) {
        mapImage.drawingContext.imageSmoothingEnabled = false;
    }
    // Try standard way too, just in case
    mapImage.noSmooth(); 
  } catch(e) {}

  const useSprites = showTextures && spritesheet && spritesheet.width > 1;
  // ... (keep the rest of the existing function logic exactly as is below) ...
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
            // logic to mark edge layer (if needed) ...
          } catch (e) {}
        }
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






// --- CHARACTER & MOVEMENT ---
// handleMovement() -
// tryMoveDirection(keyChar)
// handleItemInteraction(targetX, targetY)
// canMoveTo(fromX, fromY, toX, toY)
// isSolid(tileState)
// getTileState(x, y, layer) /
// deltaToDirection(dx, dy)
// directionToDelta(dir)
// startMoveVisual(prevX, prevY, newX, newY)
// updateMovementInterpolation()
// updateSprintState()
// getActiveMoveDurationMs()
// getActiveMoveCooldownMs()
// getCellSizeSpeedScale()
// drawPlayer()
// findFloodStart()
// floodReachable(options) /
// neighbors(x, y)
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

function getActiveMoveDurationMs() {
  const base = sprintActive ? SPRINT_MOVE_DURATION_MS : BASE_MOVE_DURATION_MS;
  return Math.max(1, Math.round(base * getCellSizeSpeedScale()));
}

function getActiveMoveCooldownMs() {
  const base = sprintActive ? SPRINT_MOVE_COOLDOWN_MS : BASE_MOVE_COOLDOWN_MS;
  return Math.max(0, Math.round(base * getCellSizeSpeedScale()));
}

function getCellSizeSpeedScale() {
  const BASE_CELL_SIZE = 32;
  if (typeof cellSize !== 'number' || cellSize <= 0) return 1;
  return cellSize / BASE_CELL_SIZE;
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

function neighbors(x, y) {
  const out = [];
  if (x > 0) out.push({ x: x - 1, y });
  if (x < logicalW - 1) out.push({ x: x + 1, y });
  if (y > 0) out.push({ x, y: y - 1 });
  if (y < logicalH - 1) out.push({ x, y: y + 1 });
  return out;
}









//UI & MENUS
// drawInGameMenu()
// openInGameSettings(payload) /
// closeInGameSettings()
// renderSettingsCategories()
// showSubSettings(label)
// showSubSettingsInGame(label)
// createSettingsContext({ cx, startY, spacingY })
// hideCategoryButtons()
// hideBottomButtons()
// hideMainMenu()
// hideSettingsMenu()
// clearSubSettings()
// updateLoadingOverlayDom()
// ensureLoadingOverlayDom()
// showToast(message, type, duration)
// drawDifficultyBadge()
// drawSprintMeter()
// styleButton(btn)
// styleSmallButton(btn)
// stylePixelButton(btn)
// makeBtn(label, x, y, w, h, cb)

let inGameMenuOverlay = null;
let _lastEscToggleAt = 0;

// Capture initial zoom baselines so we can detect relative browser zoom changes.
const BASE_VV_SCALE = (typeof window !== 'undefined' && window.visualViewport && window.visualViewport.scale) ? window.visualViewport.scale : 1;
const BASE_DPR = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
let __zoomProbeEl = null;

function measureZoomViaInch() {
  try {
    if (typeof document === 'undefined') return null;
    if (!__zoomProbeEl) {
      __zoomProbeEl = document.createElement('div');
      __zoomProbeEl.id = 'gd-zoom-probe';
      __zoomProbeEl.style.position = 'absolute';
      __zoomProbeEl.style.width = '1in';
      __zoomProbeEl.style.height = '1in';
      __zoomProbeEl.style.left = '-9999px';
      __zoomProbeEl.style.top = '-9999px';
      __zoomProbeEl.style.pointerEvents = 'none';
      document.body.appendChild(__zoomProbeEl);
    }
    const rect = __zoomProbeEl.getBoundingClientRect();
    if (!rect || !rect.width) return null;
    // CSS inch is 96px at 100% zoom; measured px / 96 gives zoom factor.
    return rect.width / 96;
  } catch (e) { return null; }
}

// Keep a DOM node visually constant when browser zoom changes
function makeElementZoomInvariant(el, origin = 'center center') {
  if (!el) return () => {};
  let zoomLoopId = null;
  const update = () => {
    if (!el || !el.parentNode) return;
    let zoom = 1;
    if (window.visualViewport) {
      zoom = window.visualViewport.scale || 1;
    } else {
      zoom = (window.outerWidth / window.innerWidth) || 1;
    }
    zoom = Math.max(0.1, Math.min(10, zoom));
    const inv = 1 / zoom;
    el.style.transform = `scale(${inv})`;
    el.style.transformOrigin = origin;
    zoomLoopId = requestAnimationFrame(update);
  };
  update();
  return () => { if (zoomLoopId) cancelAnimationFrame(zoomLoopId); };
}

function createZoomStablePanel(w, h, id) {
  let container = createDiv('');
  container.id(id);
  container.style('position', 'fixed');
  container.style('top', '0');
  container.style('left', '0');
  container.style('width', '100%');
  container.style('height', '100%');
  container.style('z-index', '100000');
  container.style('display', 'flex');
  container.style('align-items', 'center');
  container.style('justify-content', 'center');
  container.style('background-color', 'rgba(0, 0, 0, 0.5)'); 
  container.style('transform-origin', 'top left');
  container.style('will-change', 'transform');
  container.style('pointer-events', 'auto');
  
  let panel = createDiv('');
  panel.parent(container);
  panel.style('width', `${w}px`);
  panel.style('height', `${h}px`);
  panel.style('background-color', 'rgba(30, 30, 35, 0.95)');
  panel.style('border', '4px solid #444');
  panel.style('border-radius', '16px');
  panel.style('display', 'flex');
  panel.style('flex-direction', 'column');
  panel.style('align-items', 'center');
  panel.style('justify-content', 'center');
  panel.style('font-family', '"Courier New", monospace');
  panel.style('color', 'white');
  panel.style('box-shadow', '0 0 40px rgba(0,0,0,0.8)');
  panel.style('transform', 'none');
  
  let zoomLoopId = null;
  const updateZoom = () => {
    if (!document.getElementById(id)) return; 
    
    const vv = window.visualViewport;
    let zoomCandidates = [];
    let ox = 0;
    let oy = 0;

    if (vv) {
      zoomCandidates.push(vv.scale);
      ox = vv.offsetLeft || 0;
      oy = vv.offsetTop || 0;
    }

    const probeZoom = measureZoomViaInch();
    if (probeZoom) zoomCandidates.push(probeZoom);

    const dprZoom = (window.devicePixelRatio || 1) / (BASE_DPR || 1);
    zoomCandidates.push(dprZoom);

    if (window.outerWidth && window.innerWidth) {
      zoomCandidates.push(window.outerWidth / window.innerWidth);
    }

    // Pick the first sane zoom candidate
    let zoom = zoomCandidates.find(v => v && isFinite(v) && v > 0.05 && v < 20) || 1;

    zoom = Math.max(0.1, Math.min(10, zoom));
    const inv = 1 / zoom;

    // Use CSS zoom (Chrome/Edge) as a primary neutralizer; keep transform for offsets only.
    if (container.elt && container.elt.style) {
      container.elt.style.zoom = inv;
    }

    // Translate for visual viewport offsets; scale left at 1 to avoid double-scaling when zoom is applied via CSS zoom.
    container.style('transform', `translate(${ox}px, ${oy}px) scale(1)`);
    
    zoomLoopId = requestAnimationFrame(updateZoom);
  };
  updateZoom();

  return { 
    container, 
    panel, 
    close: () => {
      if (zoomLoopId) cancelAnimationFrame(zoomLoopId);
      container.remove();
    }
  };
}

function openInGameMenu() {
  if (inGameMenuOverlay) {
    inGameMenuOverlay.close();
    inGameMenuOverlay = null;
  }
  
  inGameMenuVisible = true;
  
  const { container, panel, close } = createZoomStablePanel(500, 400, 'gd-ingame-menu');
  inGameMenuOverlay = { close, container };

  let title = createDiv('PAUSED');
  title.parent(panel);
  title.style('font-size', '48px');
  title.style('font-weight', 'bold');
  title.style('margin-bottom', '40px');
  title.style('color', '#ffcc00');
  title.style('text-shadow', '3px 3px 0 #000');

  const createMenuBtn = (label, onClick) => {
    let btn = createButton(label);
    btn.parent(panel);
    btn.style('width', '320px');
    btn.style('height', '60px');
    btn.style('margin-bottom', '20px');
    btn.style('font-size', '28px');
    btn.style('font-family', 'inherit');
    btn.style('background-color', '#444');
    btn.style('color', 'white');
    btn.style('border', 'none');
    btn.style('cursor', 'pointer');
    
    btn.elt.onmouseover = () => btn.style('background-color', '#666');
    btn.elt.onmouseout = () => btn.style('background-color', '#444');
    
    btn.mousePressed(onClick);
  };

  createMenuBtn('RESUME', () => {
    closeInGameMenu();
  });

  createMenuBtn('SETTINGS', () => {
    inGameMenuOverlay.close();
    inGameMenuOverlay = null;
    openInGameSettings({ masterVol, musicVol, sfxVol, difficulty: currentDifficulty });
  });

  createMenuBtn('EXIT', () => {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'close-game-overlay' }, '*');
      }
    } catch (e) {}
  });
}

function closeInGameMenu() {
  if (inGameMenuOverlay) {
    inGameMenuOverlay.close();
    inGameMenuOverlay = null;
  }
  inGameMenuVisible = false;
}

function drawInGameMenu() { return; }
function drawInGameMenu_OLD() {
  if (!inGameMenuVisible) return;
  try {
    push();
    
    // Virtual Dimensions
    const vW = virtualW || (width / gameScale);
    const vH = virtualH || (height / gameScale);

    // Mouse Logic
    let currentHoveredId = null;
    const mx = mouseX / gameScale;
    const my = mouseY / gameScale;
    
    if (typeof mx === 'number' && typeof my === 'number') {
      for (let i = inGameMenuButtonRects.length - 1; i >= 0; i--) {
        const r = inGameMenuButtonRects[i];
        if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
          currentHoveredId = r.id;
          break;
        }
      }
    }
    inGameMenuHovered = currentHoveredId;

    // Background Dimmer
    noStroke();
    fill(0, 0, 0, 200);
    rect(0, 0, vW, vH); 

    // --- NEW SMALLER DIMENSIONS ---
    const panelW = 500; 
    const panelH = 400;
    
    const px = Math.floor((vW - panelW) / 2);
    const py = Math.floor((vH - panelH) / 2);

    // Panel Body
    push();
    stroke(0); strokeWeight(6); fill(40, 40, 44, 255); 
    rect(px, py, panelW, panelH, 12);
    pop();

    try {
      if (ESC_MENU_BACKGROUND) {
        const imgAspect = ESC_MENU_BACKGROUND.width / ESC_MENU_BACKGROUND.height;
        const panelAspect = panelW / panelH;
        let imgW, imgH;
        if (imgAspect > panelAspect) { imgW = panelW; imgH = panelW / imgAspect; } 
        else { imgH = panelH; imgW = panelH * imgAspect; }
        const imgX = px + (panelW - imgW) / 2;
        const imgY = py + (panelH - imgH) / 2;
        image(ESC_MENU_BACKGROUND, imgX, imgY, imgW, imgH);
      }
    } catch (e) {}

    // Button Layout
    const btnLabels = [ { id: 'continue', label: 'Continue' }, { id: 'settings', label: 'Settings' }, { id: 'exit', label: 'Exit' } ];
    const btnW = 320; 
    const btnH = 60;  
    const gap = 15;
    
    const totalH = btnH * btnLabels.length + gap * (btnLabels.length - 1);
    const startY = py + (panelH - totalH) / 2;

    inGameMenuButtonRects = [];

    for (let i = 0; i < btnLabels.length; i++) {
      const b = btnLabels[i];
      const bx = px + (panelW - btnW) / 2;
      const by = startY + i * (btnH + gap);

      const currentScaleVal = (inGameMenuHoverScales[b.id] || 1);
      const desired = (inGameMenuHovered === b.id) ? 1.05 : 1.0;
      inGameMenuHoverScales[b.id] = lerp(currentScaleVal, desired, 0.2);

      const drawW = Math.floor(btnW * inGameMenuHoverScales[b.id]);
      const drawH = Math.floor(btnH * inGameMenuHoverScales[b.id]);
      const drawX = Math.floor(bx - (drawW - btnW) / 2);
      const drawY = Math.floor(by - (drawH - btnH) / 2);

      try {
        if (BUTTON_BG) image(BUTTON_BG, drawX, drawY, drawW, drawH);
        else { push(); noStroke(); fill(70); rect(drawX, drawY, drawW, drawH, 10); pop(); }
      } catch (e) {}

      try {
        push();
        textFont(uiFont || 'Arial');
        textAlign(CENTER, CENTER);
        textSize(28); 
        noStroke();
        fill(0, 140);
        text(b.label, drawX + drawW / 2 + 2, drawY + drawH / 2 + 3);
        if (inGameMenuHovered === b.id) fill(255, 220, 0); else fill(255);
        text(b.label, drawX + drawW / 2, drawY + drawH / 2);
        pop();
      } catch (e) {}
      
      inGameMenuButtonRects.push({ id: b.id, x: drawX, y: drawY, w: drawW, h: drawH });
    }

    try {
      if (inGameMenuPrevHovered !== inGameMenuHovered) {
        inGameMenuPrevHovered = inGameMenuHovered;
        if (document.body) document.body.style.cursor = inGameMenuHovered ? 'pointer' : '';
      }
    } catch (e) {}

    pop();
  } catch (e) {}
}

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
    settingsOverlayPanel = null;
  }
}

['pointerdown', 'keydown'].forEach((evt) => {
  window.addEventListener(evt, () => {
    if (pendingGameMusicStart && !gameMusicStarted) {
      attemptStartGameMusic(`user-${evt}`);
    }
  });
});


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

function updateLoadingOverlayDom() {
  try {
    const el = document.getElementById('gd-loading-overlay');
    if (!el) return;
    
    if (showLoadingOverlay) {
      el.style.display = 'flex';
      el.style.opacity = '1';
      
      // NEW: Force the Loading Screen to Zoom Out
      const content = document.getElementById('gd-loading-content');
      if (content) {
          // Force calculate scale: Screen Height / 3000
          // e.g., 900 / 3000 = 0.3 (Very small, fits perfectly)
          let s = 1;
          if (typeof window !== 'undefined') s = window.innerHeight / 3000;
          content.style.transform = `scale(${s})`;
      }
    } else {
      el.style.display = 'none';
      el.style.opacity = '0';
      return; 
    }

    const msg = el.querySelector('.gd-loading-message');
    if (msg && overlayMessage) msg.innerText = overlayMessage;

    let p = 0;
    if (typeof AssetTracker !== 'undefined' && AssetTracker.expected > 0) {
        p = (AssetTracker.loaded / AssetTracker.expected) * 100;
    } else if (typeof overlayProgress !== 'undefined') {
        p = overlayProgress;
    }
    p = Math.floor(Math.max(0, Math.min(100, p)));

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




// --- ASSETS & ENVIRONMENT ---
// trackLoadImage(key, path, successCb, errorCb)
// trackLoadSound(key, path, successCb, errorCb)
// cleanImageBrown(img)
// getColorForState(state)
// injectCustomStyles()
// ensureLoopFallbackBuffer()
// backupCustomAssets()
// removeCustomAssetsRuntime()
// restoreCustomAssetsRuntime()
// toggleCustomAssetsRuntime()
// setEdgeLayerColor(r, g, b, a)
// setEdgeLayerEnabled(v)
// setEdgeLayerDebug(v)
// RandomEnvironment()
// applyEnvironmentDefaults(env)
// spawnCloud()
// updateClouds()

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

let W, H;
let logicalW, logicalH;
const cellSize = 32;

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

function setEdgeLayerColor(r, g, b, a = 200) { 
  EDGE_LAYER_COLOR = [Number(r)||0, Number(g)||0, Number(b)||0, Number(a)||0]; 
  console.log('[game] EDGE_LAYER_COLOR=', EDGE_LAYER_COLOR); 
}

function setEdgeLayerEnabled(v) { 
  EDGE_LAYER_ENABLED = !!v; 
  console.log('[game] EDGE_LAYER_ENABLED=', EDGE_LAYER_ENABLED); 
}

function setEdgeLayerDebug(v) { 
  EDGE_LAYER_DEBUG = !!v; console.log('[game] EDGE_LAYER_DEBUG=', EDGE_LAYER_DEBUG); 
}

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






// --- SETTINGS & AUDIO ---
// buildAudioSettings(ctx)
// buildGameplaySettings(ctx)
// buildControlsSettings(ctx)
// buildAccessibilitySettings(ctx)
// buildLanguageSettings(ctx)
// applyVolumes()
// attemptStartGameMusic(reason)
// unlockAudioAndStart(cb)
// startMenuMusicIfNeeded()
// playClickSFX()
// setDifficulty(value, { regenerate, reason })
// normalizeDifficultyValue(value)
// getDifficultyDisplayLabel(value)
// syncSlidersToSettings()
// saveLocalSettings() (Added recently)
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

function draw() {
  
  // --- Generation Phases ---
  if (genPhase > 0) {
    if (genPhase === 1) {
      showLoadingOverlay = true;
      overlayMessage = 'Initializing World...';
      updateLoadingOverlayDom();
      background(0);
      genTimer = millis() + 100;
      genPhase = 2; return; 
    }
    if (genPhase === 2) {
      background(0); 
      if (millis() < genTimer) return; 
      generateMap_Part1();
      overlayMessage = 'Roughening & Eroding...';
      updateLoadingOverlayDom();
      genTimer = millis() + 800;
      genPhase = 3; return;
    }
    if (genPhase === 3) {
      background(0); 
      if (millis() < genTimer) return; 
      generateMap_Part2();
      genPhase = 0;
      showLoadingOverlay = false;
      updateLoadingOverlayDom();
    }
  }

  // --- Main Draw Loop ---
  if (typeof window !== 'undefined' && window && window.__gameDebugShown !== true) { 
    console.log('[game] draw() running'); window.__gameDebugShown = true; 
  }
  
  try { ensureLoadingOverlayDom(); updateLoadingOverlayDom(); } catch (e) {}

  // !!! START GLOBAL SCALING !!!
  push();

  // 1. Apply the shrink factor
  if (gameScale !== 1) scale(gameScale);

  // 2. Center the game if screen is ultra-wide
  const mapW = (logicalW || 0) * cellSize;
  if (mapW > 0 && mapW < virtualW) {
      translate((virtualW - mapW) / 2, 0);
  }

  background(34, 139, 34);
  
  if (mapImage) image(mapImage, 0, 0);

  if (showLoadingOverlay) {
    background(0); 
    pop(); 
    return;        
  }
  
  if (playerPosition) {
    // Pause movement when any overlay is visible (settings or pause menu)
    if (!settingsOverlayDiv && !inGameMenuVisible) {
      handleMovement();
      updateMovementInterpolation();
    }
  }

  // 3. Draw Game World Objects
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
        if (o.imgType === 'image' && o.img) image(o.img, d.drawX, d.drawY, o.destW, o.destH);
        else if (o.imgType === 'sheet' && o.s) image(spritesheet, d.drawX, d.drawY, o.destW, o.destH, o.s.x, o.s.y, o.s.w, o.s.h);
      } else if (d.type === 'player') {
        try { drawPlayer(); } catch (e) {}
      }
    }
  } catch (e) {}

  // 4. Draw HUD (Scaled automatically now)
  drawDifficultyBadge();
  drawSprintMeter();
  drawClouds();

  // 5. Draw Menu (Scaled automatically now)
  try {
    if (typeof drawInGameMenu === 'function') drawInGameMenu();
  } catch (e) {}
  
  if (!inGameMenuVisible && !settingsOverlayDiv) updateClouds();

  // 6. Draw Debug
  if (EDGE_LAYER_DEBUG && edgeLayer && logicalW && logicalH) {
    noStroke(); fill(255, 0, 0, 100);
    for (let y = 0; y < logicalH; y++) {
      for (let x = 0; x < logicalW; x++) {
        if (edgeLayer[y * logicalW + x]) rect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  pop(); // !!! END GLOBAL SCALING !!!
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

function saveLocalSettings() {
  try {
    const settings = { masterVol, musicVol, sfxVol, textSizeSetting, difficulty: difficultySetting };
    localStorage.setItem("menuSettings", JSON.stringify(settings));
    
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'sync-settings', ...settings }, '*');
    }
  } catch(e) {}
}

function openInGameSettings(currentVals) {
  if (settingsOverlayDiv) {
    // If it's a container from createZoomStablePanel, it might have a .remove() method on the DOM element
    // But our helper returns an object { close, container }.
    // If settingsOverlayDiv is just the DOM element, .remove() works.
    // If we used the helper, we should probably store the object.
    // For now, let's just remove the DOM element if it exists.
    settingsOverlayDiv.remove();
    settingsOverlayDiv = null;
  }

  // Use the helper
  const { container, panel, close } = createZoomStablePanel(480, 640, 'gd-settings-overlay');
  
  // Store container so we can check if it exists (for pausing)
  settingsOverlayDiv = container;
  settingsOverlayPanel = panel;
  
  // We need to handle closing properly to stop the zoom loop
  // We can attach the close function to the container for easy access
  container.closeZoomPanel = close;
  container.zoomPanel = panel;

  let title = createDiv('SETTINGS');
  title.parent(panel);
  title.style('font-size', '40px'); 
  title.style('font-weight', 'bold');
  title.style('margin-bottom', '24px');
  title.style('color', '#ffcc00');
  title.style('text-shadow', '3px 3px 0 #000');

  const createSliderRow = (label, val, callback) => {
    let row = createDiv('');
    row.parent(panel);
    row.style('display', 'flex');
    row.style('flex-direction', 'column');
    row.style('align-items', 'center');
    row.style('margin-bottom', '18px');
    row.style('width', '88%');

    let lbl = createDiv(`${label}: ${Math.floor(val * 100)}%`);
    lbl.parent(row);
    lbl.style('font-size', '20px'); 
    lbl.style('margin-bottom', '8px');

    let slider = createSlider(0, 1, val, 0.01);
    slider.parent(row);
    slider.style('width', '100%');
    slider.style('height', '18px');
    
    slider.input(() => {
      let v = slider.value();
      lbl.html(`${label}: ${Math.floor(v * 100)}%`);
      callback(v);
    });
  };

  createSliderRow('Master', masterVol, (v) => {
    masterVol = v;
    if (gameMusic) gameMusic.setVolume(musicVol * masterVol);
  });

  createSliderRow('Music', musicVol, (v) => {
    musicVol = v;
    if (gameMusic) gameMusic.setVolume(musicVol * masterVol);
  });

  createSliderRow('SFX', sfxVol, (v) => {
    sfxVol = v;
  });

  let diffRow = createDiv('');
  diffRow.parent(panel);
  diffRow.style('margin-top', '10px');
  diffRow.style('text-align', 'center');

  let diffLabel = createDiv('DIFFICULTY');
  diffLabel.parent(diffRow);
  diffLabel.style('font-size', '32px');
  diffLabel.style('margin-bottom', '10px');

  let diffSel = createSelect();
  diffSel.parent(diffRow);
  diffSel.style('font-size', '28px');
  diffSel.style('padding', '8px');
  diffSel.style('width', '300px');
  diffSel.style('background', '#333');
  diffSel.style('color', 'white');
  diffSel.style('border', '2px solid #666');
  
  diffSel.option('Easy', 'easy');
  diffSel.option('Normal', 'normal');
  diffSel.option('Hard', 'hard');
  
  if (typeof currentDifficulty !== 'undefined') diffSel.selected(currentDifficulty);
  else diffSel.selected('normal');

  diffSel.changed(() => {
    let d = diffSel.value();
    try { setDifficulty(d, { regenerate: false, reason: 'user-settings' }); } 
    catch(e) { currentDifficulty = d; }
  });

  let closeBtn = createButton('CLOSE');
  closeBtn.parent(panel);
  closeBtn.style('margin-top', '50px');
  closeBtn.style('font-size', '36px');
  closeBtn.style('padding', '15px 50px');
  closeBtn.style('background-color', '#444');
  closeBtn.style('color', 'white');
  closeBtn.style('border', '3px solid #888');
  closeBtn.style('cursor', 'pointer');
  closeBtn.style('font-family', 'inherit');
  
  closeBtn.elt.onmouseover = () => closeBtn.style('background-color', '#666');
  closeBtn.elt.onmouseout = () => closeBtn.style('background-color', '#444');

  closeBtn.mousePressed(() => {
    if (container.closeZoomPanel) container.closeZoomPanel();
    else container.remove();
    
    settingsOverlayDiv = null;
    settingsOverlayPanel = null;
    
    // Re-open main menu if it was open?
    // Or just set inGameMenuVisible = true which now triggers openInGameMenu via Escape?
    // Actually, if we just set inGameMenuVisible = true, the draw loop won't draw the menu (since I disabled it).
    // So we must call openInGameMenu().
    openInGameMenu();
  });
}

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

try {
  window.addEventListener('keydown', (e) => {
    try {
      if (e.key === 'Escape' || e.keyCode === 27) {
        
        const active = document && document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

        try {
          if (settingsOverlayDiv) {
             if (settingsOverlayDiv.closeZoomPanel) settingsOverlayDiv.closeZoomPanel();
             else settingsOverlayDiv.remove();
             settingsOverlayDiv = null;
             openInGameMenu();
             e.preventDefault();
             return;
          }
        } catch (err) {  }

        try {
          if (inGameMenuVisible) closeInGameMenu();
          else openInGameMenu();
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
  
  // FIX: Use virtualW instead of width
  const vW = virtualW || (width / gameScale); 
  
  push();
  textSize(24); // Make text larger for 4K view
  if (uiFont) textFont(uiFont);
  
  const tWidth = textWidth(label);
  const badgeW = tWidth + paddingX * 2;
  const badgeH = 32 + paddingY * 2;
  
  const x = vW - badgeW - margin; // Align to virtual right edge
  const y = margin;

  fill(0, 0, 0, 150);
  noStroke();
  rect(x, y, badgeW, badgeH, 8);

  fill(255);
  textAlign(CENTER, CENTER);
  text(label, x + badgeW / 2, y + badgeH / 2);
  pop();
}

function drawSprintMeter() {
  const now = millis();
  const margin = 20;
  
  // Use virtual dimensions context
  const vW = virtualW || (width / gameScale);
  
  // Safely check variables
  if (typeof lastRunTime === 'undefined') lastRunTime = 0;
  if (typeof sprintEnergy === 'undefined') sprintEnergy = 100;

  // Only draw if player recently ran or is not full stamina
  if (now - lastRunTime > 2000 && sprintEnergy >= SPRINT_MAX) return;

  const barW = 200; 
  const barH = 24;
  
  // Position: Top-Left (below difficulty badge area if needed)
  const x = margin;
  const y = margin + 60; 

  const pct = Math.max(0, Math.min(1, sprintEnergy / SPRINT_MAX));

  push();
  
  // Background
  noStroke();
  fill(0, 0, 0, 150);
  rect(x, y, barW, barH, 6);

  // Fill Bar
  if (pct > 0) {
    if (sprintEnergy < SPRINT_COST_PER_FRAME * 10) fill(255, 50, 50); // Red if low
    else fill(255, 215, 0); // Gold normally
    
    rect(x + 2, y + 2, (barW - 4) * pct, barH - 4, 4);
  }
  
  // Text Label
  fill(255);
  textSize(16);
  textAlign(LEFT, BOTTOM);
  text("STAMINA", x, y - 5);
  
  pop();
}

function hideCategoryButtons() {
  categoryBackgrounds.forEach(e => e && e.hide());
  categoryButtons.forEach(e => e && e.hide());
}

function hideBottomButtons() {
  [saveBackground, btnSave, backMenuBackground, btnBackMenu].forEach(e => e && e.hide());
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
  if (gameMusic) {
    
    const vol = Math.max(0, Math.min(1, musicVol * masterVol));
    gameMusic.setVolume(vol);
  }
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


window.addEventListener('keydown', (ev) => {
  const k = ev.key ? ev.key.toUpperCase() : '';
  if (k === 'W' || k === 'A' || k === 'S' || k === 'D') {
    try { tryMoveDirection(k); } catch (e) {  }
  }
  if (k === 'P') {
    console.log('[game] P pressed - Starting Phase 1');
    genPhase = 1; 
    return;
}
});


function persistActiveMapToServer(reason = 'unspecified') {
  try {
    if (typeof fetch === 'undefined') return false;
    const payload = buildActiveMapPayload();
    if (!payload) { console.warn('[game] no payload to persist to server'); return false; }

    let allowServer = false;
    try {
      if (typeof window !== 'undefined' && window.location) {
        const params = new URLSearchParams(window.location.search);
        allowServer = (window.location.hostname === 'localhost') || (params.get('useServer') === '1');
      }
    } catch (e) { allowServer = false; }
    if (!allowServer) return false;

    return fetch('http://localhost:3000/save-map', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(resp => resp.json().catch(() => ({}))).then((data) => {
      if (data && data.ok) {
        console.log(`[game] workspace active_map.json saved (${reason})`);
      } else {
        console.warn('[game] workspace save-map response not ok', data);
      }
      return !!(data && data.ok);
    }).catch((err) => { console.warn('[game] persistActiveMapToServer failed', err); return false; });
  } catch (err) {
    console.warn('[game] persistActiveMapToServer error', err);
    return false;
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

function getTileState(x, y, layer = mapStates) {
  if (x < 0 || x >= logicalW || y < 0 || y >= logicalH) return -1;
  return layer[y * logicalW + x];
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

let _resizeConfirmTimer = null;
let _lastRequestedSize = { w: 0, h: 0 };


try {
  window.addEventListener('keydown', (e) => {
    try {
      if (e.key === 'Escape' || e.keyCode === 27) {
        
        const active = document && document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

        try {
          if (settingsOverlayDiv) {
             if (settingsOverlayDiv.closeZoomPanel) settingsOverlayDiv.closeZoomPanel();
             else settingsOverlayDiv.remove();
             settingsOverlayDiv = null;
             openInGameMenu();
             e.preventDefault();
             return;
          }
        } catch (err) {  }

        try {
          if (inGameMenuVisible) closeInGameMenu();
          else openInGameMenu();
          e.preventDefault();
        } catch (err) {
          console.warn('[game] toggling inGameMenuVisible (global handler) failed', err);
        }
      }
    } catch (err) {  }
  }, false);
} catch (e) { console.warn('[game] failed to attach global Escape handler', e); }

function getColorForState(state) {
  
  if (typeof COLORS !== 'undefined' && COLORS[state]) {
    return COLORS[state];
  }
  
  return [255, 0, 255]; 
}

function buildControlsSettings(ctx) {
  ctx.addSliderRow("Sensitivity", 1, 10, 5, v => {})
     .addCheckboxRow("Invert Y Axis", false);
}

function buildLanguageSettings(ctx) {
  ctx.addSelectRow("Language", ["English", "Spanish", "French", "German"]);
}

function stylePixelButton(btn) {
  
  btn.style('background-color', 'transparent');
  btn.style('border', 'none');
  btn.style('color', 'white');
  btn.style('cursor', 'pointer');
  
  
  btn.style('background-image', "url('assets/3-GUI/Button BG.png')");
  btn.style('background-size', '100% 100%');
  btn.style('background-repeat', 'no-repeat');
  btn.style('image-rendering', 'pixelated'); 
  
  
  btn.style('font-family', 'MyFont, sans-serif'); 
  btn.style('text-shadow', '3px 3px 0 #000');
  
  
  btn.mouseOver(() => {
    btn.style('filter', 'brightness(1.2)');
    btn.style('transform', 'scale(1.05)');
  });
  btn.mouseOut(() => {
    btn.style('filter', 'brightness(1.0)');
    btn.style('transform', 'scale(1.0)');
  });
  
  
  btn.style('z-index', '20005');
}

function buildAudioSettings(ctx) {
  ctx
    .addSliderRow("Master Volume", 0, 100, masterVol * 100, v => { 
        masterVol = v / 100; 
        if(typeof applyVolumes === 'function') applyVolumes(); 
        if(gameMusic) gameMusic.setVolume(musicVol * masterVol); 
        saveLocalSettingsDebounced(); 
    }, { isAudio: true })
    .addSliderRow("Music Volume", 0, 100, musicVol * 100, v => { 
        musicVol = v / 100; 
        if(typeof applyVolumes === 'function') applyVolumes(); 
        if(gameMusic) gameMusic.setVolume(musicVol * masterVol);
        saveLocalSettingsDebounced(); 
    }, { isAudio: true })
    .addSliderRow("SFX Volume", 0, 100, sfxVol * 100, v => { 
        sfxVol = v / 100; 
        saveLocalSettingsDebounced(); 
    }, { isAudio: true });
}

function spawnCloud(forceX) {
  if (clouds.length >= MAX_CLOUDS) return;
  
  const validImages = cloudImages.filter(img => img);
  if (validImages.length === 0) return;
  
  const cloudImg = validImages[Math.floor(Math.random() * validImages.length)];
  
  // FIX: Hardcode Map Height (3000px)
  const worldHeight = 3000; 
  
  // Spawn from 0 (Very Top) to 3000 (Very Bottom)
  // This guarantees coverage everywhere.
  const minY = 0; 
  const maxY = worldHeight; 
  const yPos = minY + Math.random() * (maxY - minY);
  
  // DEBUG: Check console to prove it's working
  // console.log(`Spawning cloud at Y: ${Math.floor(yPos)}`);

  const baseSpeed = 0.3 + Math.random() * 1;
  const scale = 2.0 + Math.random() * 4.0;
  
  // Calculate width based on 3000px height ratio
  const currentScale = height / 3000; 
  const startX = (typeof forceX === 'number') ? forceX : -cloudImg.width * scale;

  clouds.push({
    img: cloudImg,
    x: startX,
    y: yPos,
    baseY: yPos,
    speed: baseSpeed,
    scale: scale,
    opacity: 180 + Math.random() * 75,
    verticalDrift: (Math.random() - 0.5) * 0.15,
    driftPhase: Math.random() * Math.PI * 2
  });
}

let _saveTimer = null;
function saveLocalSettingsDebounced() {
  
  if (_saveTimer) clearTimeout(_saveTimer);
  
  
  _saveTimer = setTimeout(() => {
    try {
      const settings = { masterVol, musicVol, sfxVol, textSizeSetting, difficulty: difficultySetting };
      localStorage.setItem("menuSettings", JSON.stringify(settings));
      console.log('[game] Settings saved (debounced)');
    } catch(e) {}
  }, 500);
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
        
        saveLocalSettings(); 
      }
    });
}

function buildControlsSettings(ctx) {
  ctx.addSliderRow("Sensitivity", 1, 10, 5, v => {})
     .addCheckboxRow("Invert Y Axis", false);
}

function buildAccessibilitySettings(ctx) {
  ctx.addSelectRow("Color Mode", ["None", "Protanopia", "Deuteranopia", "Tritanopia"]);
  
  // Custom row for Text Size
  const row = createDiv('');
  row.parent(ctx.container);
  row.style('display', 'flex');
  row.style('align-items', 'center');
  row.style('justify-content', 'space-between');
  row.style('width', '100%');
  row.style('margin-bottom', '10px');
  activeSettingElements.push(row);

  const lbl = createDiv("Text Size");
  lbl.parent(row);
  lbl.class('setting-label');
  lbl.style('color', 'white');
  lbl.style('font-size', '20px');
  lbl.style('text-align', 'right'); 
  lbl.style('text-shadow', '1px 1px 0 #000');
  lbl.style('margin-right', '10px');
  lbl.style('flex', '1');

  const btnGroup = createDiv('');
  btnGroup.parent(row);
  btnGroup.style('display', 'flex');
  btnGroup.style('gap', '5px');
  btnGroup.style('flex', '1');

  const sizes = ["Small", "Default", "Big"];
  sizes.forEach(size => {
      const btn = createButton(size);
      btn.parent(btnGroup);
      btn.style('flex', '1');
      btn.style('height', '30px');
      
      stylePixelButton(btn); 
      btn.style('font-size', '14px'); 
      btn.style('padding', '0');
      
      btn.mousePressed(() => { console.log("Text size:", size); });
  });
}

function buildLanguageSettings(ctx) {
  ctx.addSelectRow("Language", ["English", "Spanish", "French", "German"]);
}

function createSettingsContext({ container }) {
  
  const styleLabel = (el) => {
      el.class('setting-label');
      el.style('color', 'white');
      el.style('font-size', '20px');
      el.style('text-align', 'right'); 
      el.style('text-shadow', '1px 1px 0 #000');
      el.style('margin-right', '10px');
      el.style('flex', '1');
  };

  const styleInput = (el) => {
      el.style('cursor', 'pointer');
      el.style('flex', '1');
  };

  const createRow = () => {
      const row = createDiv('');
      row.parent(container);
      row.style('display', 'flex');
      row.style('align-items', 'center');
      row.style('justify-content', 'space-between');
      row.style('width', '100%');
      row.style('margin-bottom', '10px');
      activeSettingElements.push(row);
      return row;
  };

  const ctx = {
    // Mock layout for compatibility if needed, though we should refactor consumers
    layout: { labelX: 0, controlX: 0, labelWidth: 0, controlWidth: 0, spacingY: 0 },
    
    container: container, // Expose container

    pushElement(el) {
        activeSettingElements.push(el);
        return ctx;
    },

    addSliderRow(name, min, max, val, callback) {
      const row = createRow();

      const lbl = createDiv(name);
      lbl.parent(row);
      styleLabel(lbl);
      
      const slider = createSlider(min, max, val);
      slider.parent(row);
      slider.style('width', '100%'); 
      styleInput(slider);
      
      slider.input(() => callback(slider.value()));
      
      return ctx;
    },

    addCheckboxRow(name, state) {
      const row = createRow();

      const lbl = createDiv(name);
      lbl.parent(row);
      styleLabel(lbl);

      const cb = createCheckbox('', state);
      cb.parent(row);
      styleInput(cb);
      cb.style('transform', 'scale(1.5)');
      
      return ctx;
    },

    addSelectRow(name, opts, options = {}) {
      const row = createRow();

      const lbl = createDiv(name);
      lbl.parent(row);
      styleLabel(lbl);

      const sel = createSelect();
      sel.parent(row);
      sel.style('font-size', '16px');
      sel.style('background', '#222');
      sel.style('color', 'white');
      sel.style('border', '1px solid #555'); 
      sel.style('border-radius', '4px');
      sel.style('padding', '5px');
      styleInput(sel);
      
      opts.forEach(opt => sel.option(opt));
      
      if (options.value) sel.value(options.value);
      if (options.onChange) sel.changed(() => options.onChange(sel.value()));

      return ctx;
    }
  };
  return ctx;
}


function ensureLoadingOverlayDom() {
  try {
    if (typeof document === 'undefined') return null;
    
    if (!document.body) {
      setTimeout(ensureLoadingOverlayDom, 50);
      return null;
    }

    let el = document.getElementById('gd-loading-overlay');
    
    // CRITICAL: If the wrapper is missing (old version), remove it so we can rebuild it
    if (el && !document.getElementById('gd-loading-content')) {
        el.remove();
        el = null;
    }

    if (el) return el;

    // --- Inject Styles ---
    const fontPath = 'assets/3-GUI/font.ttf'; 
    const styleId = 'gd-loading-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @font-face { font-family: 'PixelGameFont'; src: url('${fontPath}'); }
        #gd-loading-overlay {
          font-family: 'PixelGameFont', 'Courier New', monospace !important;
          background-color: #000000 !important;
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
          background-color: #111;
          padding: 3px;
          margin-bottom: 10px;
        }
        .gd-progress-fill {
          height: 100%;
          width: 0%;
          background-color: #ffcc00;
          transition: width 0.1s linear;
        }
        .gd-progress-text {
          font-size: 24px;
          color: #888;
        }
      `;
      document.head.appendChild(style);
    }

    // --- Create Elements ---
    el = document.createElement('div');
    el.id = 'gd-loading-overlay';
    Object.assign(el.style, {
      position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: '2147483647', userSelect: 'none', opacity: '1' 
    });

    // NEW WRAPPER: This is what we scale down
    const content = document.createElement('div');
    content.id = 'gd-loading-content';
    Object.assign(content.style, {
        display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center',
        transformOrigin: 'center center', 
        transition: 'transform 0.1s ease-out' 
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
    
    content.appendChild(msg);
    content.appendChild(barCont);
    content.appendChild(pct);
    
    el.appendChild(content);
    document.body.appendChild(el);

    // Keep loading UI stable across browser zoom
    makeElementZoomInvariant(content, 'top center');

    return el;
  } catch (e) { return null; }
}

function updateClouds() {
  const now = millis();
  
  if (now - lastCloudSpawn > CLOUD_SPAWN_INTERVAL) {
    spawnCloud();
    lastCloudSpawn = now;
  }
  
  // Use the game scale so the virtual width matches world units
  const virtualWidth = (gameScale && gameScale !== 0) ? width / gameScale : width;

  for (let i = clouds.length - 1; i >= 0; i--) {
    const cloud = clouds[i];
    
    cloud.x += cloud.speed;
    cloud.driftPhase += 0.01;
    cloud.y = cloud.baseY + Math.sin(cloud.driftPhase) * 20 * cloud.verticalDrift;
    
    // Remove only after the full cloud image has exited the right edge
    const cloudWidth = cloud.img.width * cloud.scale;
    if (cloud.x > virtualWidth + cloudWidth) {
      clouds.splice(i, 1);
    }
  }
}

function drawClouds() {
  push();
  
  
  clouds.sort((a, b) => a.scale - b.scale);
  
  for (const cloud of clouds) {
    push();
    tint(255, cloud.opacity);
    imageMode(CORNER);
    
    const w = cloud.img.width * cloud.scale;
    const h = cloud.img.height * cloud.scale;
    
    image(cloud.img, cloud.x, cloud.y, w, h);
    pop();
  }
  
  noTint();
  pop();
}


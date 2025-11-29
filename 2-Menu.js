const VIDEO_FADE_WINDOW = 1.0;
const LOOP_CAPTURE_DELAY_MS = 150;
const VIDEO_RECOVERY_WINDOW = 0.75;

const CONTROL_VERTICAL_NUDGE = 8;
const SELECT_VERTICAL_NUDGE = 15;
const TEXTSIZE_BUTTON_Y_OFFSET = 10;
const BACK_BUTTON_VERTICAL_OFFSET = 120;



const DEFAULT_SETTINGS = Object.freeze({
  masterVol: 0.8,
  musicVol: 0.6,
  sfxVol: 0.7,
  textSize: 75,
  difficulty: 'normal'
});

const DIFFICULTY_LABELS = Object.freeze({
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard'
});

function normalizeDifficultyChoice(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(DIFFICULTY_LABELS, normalized) ? normalized : null;
}

function getDifficultyLabel(value) {
  return DIFFICULTY_LABELS[value] || DIFFICULTY_LABELS.normal;
}

const SETTINGS_CATEGORIES = Object.freeze([
  "Audio",
  "Gameplay",
  "Controls",
  "Accessibility",
  "Language"
]);

let bgVideo = null;
let videoBuffer = null;
let rectSkin = null;
let loopFallbackBuffer = null;

let myFont = null;
let baseFontPx = 0;
let smallFontPx = 0;
let labelFontPx = 0;
let headingFontPx = 0;

let bgMusic = null;
let bgPlayMusic = null;
let clickSFX = null;
let menuMusicStopped = false;



function stopMenuMusicImmediate() {
  try {
    if (!bgMusic) { menuMusicStopped = true; return; }
    try { if (typeof bgMusic.stop === 'function') bgMusic.stop(); } catch (e) {}
    try { if (typeof bgMusic.pause === 'function') bgMusic.pause(); } catch (e) {}
    try { if (typeof bgMusic.setVolume === 'function') bgMusic.setVolume(0); } catch (e) {}
    menuMusicStopped = !(typeof bgMusic.isPlaying === 'function' && bgMusic.isPlaying());
  } catch (e) {
    console.warn('[stopMenuMusicImmediate] failed to stop bgMusic', e);
    menuMusicStopped = true;
  }
}

let playButtonBackground = null;
let settingsButtonBackground = null;
let exitButtonBackground = null;
let btnPlay = null;
let btnSettings = null;
let btnExit = null;

let categoryBackgrounds = [];
let categoryButtons = [];
let saveBackground = null;
let btnSave = null;
let backMenuBackground = null;
let btnBackMenu = null;

let activeSettingElements = [];

let showingSettings = false;
let activeCategory = null;
let fadeAlpha = 0;
let videoOpacity = 255;
let fallbackOpacity = 0;
let inGame = false;
let loading = true;
let loadingProgress = 0;

let textSizeSetting = DEFAULT_SETTINGS.textSize;
let difficultySetting = DEFAULT_SETTINGS.difficulty;
let masterVol = DEFAULT_SETTINGS.masterVol;
let musicVol = DEFAULT_SETTINGS.musicVol;
let sfxVol = DEFAULT_SETTINGS.sfxVol;

let audioUnlocked = false;
let videoLoopPending = false;
let fallbackFrameReady = false;
let wasInVideoFadeWindow = false;
let resizeTimeout = null;
let _menuResizeTimer = null;
let _menuLastSize = { w: 0, h: 0 };

let skipNextMenuReload = false;

function preload() {
  rectSkin = loadImage("assets/1-Background/1-Menu/Settings_Background.png");
  myFont   = loadFont("assets/3-GUI/font.ttf");
  bgVideo  = createVideo("assets/1-Background/1-Menu/Menu_Vid.mp4");
  bgMusic      = loadSound('assets/8-Music/menu_music.wav');
  clickSFX     = loadSound('assets/9-Sounds/Button_Press.mp3');
  bgPlayButton = loadImage('assets/1-Background/1-Menu/Background.png');
}

let canvas;
function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.style('z-index', '1');

  canvas.style('pointer-events', 'none');

  textFont(myFont);
  noStroke();

  loadAllSettings();
  injectCustomStyles();

  bgVideo.hide();
  try {
    if (bgVideo.elt) {
      bgVideo.elt.muted = true;
      bgVideo.elt.loop = false;
      bgVideo.elt.addEventListener('loadeddata', () => {
        captureLoopFallbackFrame();
      }, { once: true });
    }
  } catch (e) {}

  bgVideo.play();
  bgVideo.loop();

  videoBuffer = createGraphics(width, height);
  bgVideo.onended(() => { videoLoopPending = true; });

  applyVolumes();
  startMenuMusicIfNeeded();
  const resumeOnFirstGesture = () => {
    try {
      console.log('[setup] first user gesture detected — attempting to unlock audio and start music');
      unlockAudioAndStart(() => {
        startMenuMusicIfNeeded();
      });
    } catch (e) {
      console.warn('[setup] resumeOnFirstGesture failed', e);
    }
  };
  window.addEventListener('pointerdown', resumeOnFirstGesture, { once: true });
  window.addEventListener('keydown', resumeOnFirstGesture, { once: true });
  calculateLayout();
  createMainMenu();

  try { getAudioContext && getAudioContext().suspend && getAudioContext().suspend(); } catch (e) {}
}

  window.removeGameOverlay = function () {
    requestStopGameMusicAndCloseOverlay();
  };

  window.addEventListener('message', (ev) => {
    if (!ev || !ev.data) return;
    try {
      
      if (ev.data.type === 'close-game-overlay') {
        window.removeGameOverlay();
      } 
     
      else if (ev.data.type === 'game-iframe-ready') {
        try {
          const iframe = document.getElementById('game-iframe');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
              type: 'update-audio-settings',
              masterVol: masterVol,
              musicVol: musicVol,
              sfxVol: sfxVol,
              difficulty: difficultySetting
            }, '*');
          }
        } catch (e) {}
      }
     
      else if (ev.data.type === 'sync-settings') {
        console.log('[menu] received settings sync from game', ev.data);
        
        
        if (typeof ev.data.masterVol === 'number') masterVol = ev.data.masterVol;
        if (typeof ev.data.musicVol === 'number') musicVol = ev.data.musicVol;
        if (typeof ev.data.sfxVol === 'number') sfxVol = ev.data.sfxVol;
        if (typeof ev.data.difficulty === 'string') difficultySetting = ev.data.difficulty;
        
       
        applyVolumes();
        
       
        saveAllSettings();
      }
    } catch (e) { console.warn('Message error', e); }
}, false);

  
  function requestStopGameMusicAndCloseOverlay() {
    const iframe = document.getElementById('game-iframe');
    const ov = document.getElementById('game-overlay');

    const cleanupAndResume = () => {
      try { if (ov) ov.remove(); } catch (e) { console.warn('remove overlay failed', e); }
      try { if (getAudioContext) getAudioContext().resume && getAudioContext().resume(); } catch (e) {}
      try { startMenuMusicIfNeeded(); } catch (e) { console.warn('startMenuMusicIfNeeded failed', e); }
      showMainMenu();
      setTimeout(() => { try { window.focus(); } catch (e) {} }, 50);
      
      try {
        setTimeout(() => {
            try {
              
              skipNextMenuReload = true;
            } catch (e) {}
            try { window.dispatchEvent(new Event('resize')); } catch (e) {}
            try { windowResized(); } catch (e) { console.warn('menu: windowResized call failed', e); }
        }, 350);
      } catch (e) { console.warn('failed to schedule menu resize', e); }
    };

    if (!iframe || !iframe.contentWindow) {
      cleanupAndResume();
      return;
    }

    const ackType = 'game-music-stopped';
    let acked = false;
    const onMessage = (ev) => {
      if (!ev || !ev.data) return;
      if (ev.data.type === ackType) {
        acked = true;
        window.removeEventListener('message', onMessage);
        cleanupAndResume();
      }
    };

    window.addEventListener('message', onMessage);

    try {
      iframe.contentWindow.postMessage({ type: 'stop-game-music' }, '*');
    } catch (e) { console.warn('failed to post stop-game-music', e); }

    setTimeout(() => {
      if (!acked) {
        window.removeEventListener('message', onMessage);
        cleanupAndResume();
      }
    }, 400);
  }

let mainButtonWidth = 0;
let mainButtonHeight = 0;
let mainButtonGap = 0;

function calculateLayout() {
  mainButtonWidth = 0.25 * width;
  mainButtonHeight = 0.12 * height;
  mainButtonGap  = 0.045 * height;
}

function createMainMenu() {
  const cx = width / 2;
  const startY = height / 2 - (mainButtonHeight * 1.5 + mainButtonGap);

  playButtonBackground = createBgImg("assets/3-GUI/Button BG.png", cx - mainButtonWidth / 2, startY, mainButtonWidth, mainButtonHeight);

  btnPlay = makeBtn("▶ Play", cx - mainButtonWidth / 2, startY, mainButtonWidth, mainButtonHeight, () => {
    console.log("Play pressed — opening game overlay iframe with settings");

    unlockAudioAndStart(() => {
      playClickSFX();
        hideMainMenu();
        try {
          stopMenuMusicImmediate();
          console.log('[createMainMenu] requested stopMenuMusicImmediate for overlay');
        } catch (e) { console.warn('Failed to stop bgMusic', e); }

      let overlay = document.getElementById('game-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'game-overlay';
        Object.assign(overlay.style, {
          position: 'fixed', inset: '0', display: 'flex', flexDirection: 'column',
          background: '#000', zIndex: 2147483647, margin: '0', padding: '0'
        });

        

        const iframe = document.createElement('iframe');
        iframe.id = 'game-iframe';
        const params = new URLSearchParams({
          masterVol,
          musicVol,
          sfxVol,
          difficulty: difficultySetting
        });
        iframe.src = `3-Game_Index.html?${params.toString()}`;
        Object.assign(iframe.style, {
          width: '100%', height: '100%', border: 'none', background: '#000'
        });

        overlay.appendChild(iframe);
        document.body.appendChild(overlay);
        try { document.documentElement.style.overflow = 'hidden'; document.body.style.overflow='hidden'; } catch(e) {}

        iframe.addEventListener('load', () => {
          try {
            if (iframe.contentWindow) {
              iframe.contentWindow.postMessage({
                type: 'update-audio-settings',
                masterVol: masterVol,
                musicVol: musicVol,
                sfxVol: sfxVol,
                difficulty: difficultySetting
              }, '*');
              console.log('[parent] iframe load: sent audio settings to game iframe');
              (function waitAndRequestStart() {
                const startTs = Date.now();
                const maxWait = 800;
                const poll = () => {
                  if (menuMusicStopped || Date.now() - startTs > maxWait) {
                    try {
                      iframe.contentWindow.postMessage({ type: 'start-game-music' }, '*');
                      console.log('[parent] iframe load: requested start-game-music (after wait)');
                    } catch (e) { console.warn('[parent] failed to request start-game-music', e); }
                  } else {
                    setTimeout(poll, 60);
                  }
                };
                poll();
              })();
            }
          } catch (e) { console.warn('[parent] failed to post audio settings on iframe load', e); }
        }, { once: true });

        setTimeout(() => {
          try {
            const ifr = document.getElementById('game-iframe');
            if (ifr && ifr.contentWindow) {
              ifr.contentWindow.postMessage({
                type: 'update-audio-settings',
                masterVol: masterVol,
                musicVol: musicVol,
                sfxVol: sfxVol,
                difficulty: difficultySetting
              }, '*');
              console.log('[parent] fallback: posted audio settings to iframe after timeout');
            }
          } catch (e) {}
        }, 500);

       
        setTimeout(() => {
          try {
            const ifr = document.getElementById('game-iframe');
            if (ifr && ifr.contentWindow) {
              ifr.contentWindow.postMessage({ type: 'game-activated' }, '*');
              console.log('[parent] posted game-activated to iframe');
            }
          } catch (e) {}
        }, 180);
      } else {
        overlay.style.display = 'flex';
      }
    });
  });

  const settingsY = startY + mainButtonHeight + mainButtonGap;
  settingsButtonBackground = createBgImg("assets/3-GUI/Button BG.png", cx - mainButtonWidth / 2, settingsY, mainButtonWidth, mainButtonHeight);
  btnSettings = makeBtn("⚙ Settings", cx - mainButtonWidth / 2, settingsY, mainButtonWidth, mainButtonHeight, () => {
    unlockAudioAndStart(() => {
      playClickSFX();
      fadeTo(() => {
        hideMainMenu();
        showingSettings = true;
        showSettingsMenu();
      });
    });
  });

  const exitY = settingsY + mainButtonHeight + mainButtonGap;
  exitButtonBackground = createBgImg("assets/3-GUI/Button BG.png", cx - mainButtonWidth / 2, exitY, mainButtonWidth, mainButtonHeight);
  btnExit = makeBtn("✖ Exit", cx - mainButtonWidth / 2, exitY, mainButtonWidth, mainButtonHeight, () => {
    unlockAudioAndStart(() => {
      playClickSFX();
      fadeTo(() => {
        hideMainMenu();
        showingSettings = false;
        alert("Thank you for playing!");
      });
    });
  });

  applyCurrentTextSize();
}

function fadeTo(callback) {
  let fadeOut = true;
  const step = () => {
    fadeAlpha += fadeOut ? 15 : -15;
    fadeAlpha = constrain(fadeAlpha, 0, 255);
    if (fadeOut && fadeAlpha === 255) {
      callback();
      fadeOut = false;
    }
    if (fadeAlpha === 0) return;
    setTimeout(step, 20);
  };
  step();
}

function showSettingsMenu() {
  clearSubSettings();

  const cx = width / 2;
  const cy = height / 2;
  const panelW = 0.7 * width;
  const panelH = 0.7 * height;

  const leftPanelX = cx - panelW / 2 + 150;
  const categoryButtonWidth = 0.2 * width;
  const categoryButtonHeight = 0.07 * height;
  const categorySpacing = 0.09 * height;
  const yOffset = -0.10 * height + 120;
  const totalH = (SETTINGS_CATEGORIES.length - 1) * categorySpacing;
  const yStart = cy - totalH / 2 - 10 + yOffset - 50;

  categoryBackgrounds = [];
  categoryButtons = [];

  SETTINGS_CATEGORIES.forEach((label, index) => {
    const yPos = yStart + index * categorySpacing;
    const bg = createBgImg("assets/3-GUI/Button BG.png", leftPanelX, yPos, categoryButtonWidth, categoryButtonHeight);
    categoryBackgrounds.push(bg);
    const btn = makeBtn(label, leftPanelX, yPos, categoryButtonWidth, categoryButtonHeight, () => {
      playClickSFX();
      hideCategoryButtons();
      hideBottomButtons();
      activeCategory = label;
      showSubSettings(label);
    });
    categoryButtons.push(btn);
  });

  const secondaryButtonHeight = categoryButtonHeight * 0.75;
  const baseBottom = cy + panelH / 2 - secondaryButtonHeight - 80;
  const leftThird = width / 3;
  const rightThird = (width / 3) * 2;

  saveBackground = createBgImg("assets/3-GUI/Button BG.png", leftThird - categoryButtonWidth * 0.4, baseBottom, categoryButtonWidth * 0.8, secondaryButtonHeight);
  btnSave = makeSmallBtn("💾 Save", leftThird - categoryButtonWidth * 0.4, baseBottom, categoryButtonWidth * 0.8, secondaryButtonHeight, saveSettings);

  backMenuBackground = createBgImg("assets/3-GUI/Button BG.png", rightThird - categoryButtonWidth * 0.4, baseBottom, categoryButtonWidth * 0.8, secondaryButtonHeight);
  btnBackMenu = makeSmallBtn("↩ Back to Menu", rightThird - categoryButtonWidth * 0.4, baseBottom, categoryButtonWidth * 0.8, secondaryButtonHeight, () => {
      playClickSFX();
      showingSettings = false;
      clearSubSettings();
      hideSettingsMenu();
      showMainMenu();
    });

  applyCurrentTextSize();
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

function createSettingsContext({ labelX, controlX, controlWidth, panelH, startY, spacingY }) {
  let y = startY;
  const ctx = {
    get y() { return y; },
    set y(value) { y = value; },
    layout: { labelX, controlX, controlWidth, panelH, spacingY },
    addSliderRow(name, min, max, val, callback, options = {}) {
      const { isAudio = false, settingKey = null, dataAttrs = {} } = options;
      const lbl = createSettingLabel(name, labelX, y, controlX - labelX - 20);
      activeSettingElements.push(lbl);
      const slider = createSlider(min, max, val);
      slider.position(controlX, y + CONTROL_VERTICAL_NUDGE);
      slider.style("width", controlWidth + "px");
      slider.style("margin", "0");
      slider.style("padding", panelH * 0.01 + "px 0");
      slider.style("position", "absolute");
      slider.style("z-index", "4");
      if (settingKey) slider.attribute('data-setting', settingKey);
      Object.entries(dataAttrs).forEach(([k, v]) => { if (v !== undefined && v !== null) slider.attribute(k, v); });
      if (isAudio) slider.attribute('data-audio', '1');
      slider.input(() => callback(slider.value()));
      activeSettingElements.push(slider);
      y += spacingY;
      return ctx;
    },
    addCheckboxRow(name, state) {
      const cb = createCheckbox(name, state);
      const checkboxShift = Math.round(controlWidth * 0.06);
      cb.position(controlX, y);
      if (cb.elt && cb.elt.classList) cb.elt.classList.add('setting-checkbox');
      cb.style("color", "white");
      cb.style("font-size", (0.035 * height) + "px");
      cb.style("transform", "scale(1.2)");
      cb.style("transform-origin", "left center");
      const checkboxInput = cb.elt?.querySelector('input[type="checkbox"]');
      if (checkboxInput) {
        const boxSize = Math.max(30, panelH * 0.055);
        checkboxInput.style.width = boxSize + "px";
        checkboxInput.style.height = boxSize + "px";
        checkboxInput.style.transform = `translateX(-${checkboxShift}px)`;
        checkboxInput.style.marginRight = Math.max(8, Math.round(controlWidth * 0.02)) + "px";
        checkboxInput.style.transformOrigin = 'left center';
      }
      activeSettingElements.push(cb);
      y += spacingY;
      return ctx;
    },
    addSelectRow(name, opts, options = {}) {
      const normalizedOptions = (opts || []).map((opt) => {
        if (opt && typeof opt === 'object') {
          return {
            label: opt.label ?? opt.value ?? '',
            value: opt.value ?? opt.label ?? ''
          };
        }
        return { label: String(opt), value: String(opt) };
      });
      const lbl = createSettingLabel(name, labelX, y, controlX - labelX - 20);
      activeSettingElements.push(lbl);
      const sel = createSelect();
      sel.position(controlX, y + SELECT_VERTICAL_NUDGE);
      sel.style('width', controlWidth + 'px');
      sel.style('height', (0.045 * panelH) + 'px');
      sel.style('font-size', (0.035 * height) + 'px');
      normalizedOptions.forEach(({ label, value }) => sel.option(label, value));
      const initialValue = options.value ?? normalizedOptions[0]?.value;
      if (initialValue !== undefined) {
        try { sel.value(initialValue); } catch (e) {}
      }
      if (typeof options.onChange === 'function') {
        sel.changed(() => options.onChange(sel.value()));
      }
      activeSettingElements.push(sel);
      y += spacingY;
      return ctx;
    },
    pushElement(el) {
      activeSettingElements.push(el);
      return ctx;
    }
  };
  return ctx;
}

const CATEGORY_BUILDERS = {
  Audio: buildAudioSettings,
  Gameplay: buildGameplaySettings,
  Controls: buildControlsSettings,
  Accessibility: buildAccessibilitySettings,
  Language: buildLanguageSettings
};

function buildAudioSettings(ctx) {
  ctx
    .addSliderRow("Master Volume", 0, 100, masterVol * 100, v => { masterVol = v / 100; applyVolumes(); }, { isAudio: true, settingKey: 'masterVol' })
    .addSliderRow("Music Volume", 0, 100, musicVol * 100, v => { musicVol = v / 100; applyVolumes(); }, { isAudio: true, settingKey: 'musicVol' })
    .addSliderRow("SFX Volume", 0, 100, sfxVol * 100, v => { sfxVol = v / 100; }, { isAudio: true, settingKey: 'sfxVol' });
}

function buildGameplaySettings(ctx) {
  ctx
    .addCheckboxRow("Show Tutorials", true)
    .addCheckboxRow("Enable HUD", true)
    .addSelectRow("Difficulty", ["Easy", "Normal", "Hard"], {
      value: getDifficultyLabel(difficultySetting),
      onChange: (val) => {
        const normalized = normalizeDifficultyChoice(val);
        if (normalized) difficultySetting = normalized;
      }
    });
}

function buildControlsSettings(ctx) {
  ctx
    .addSliderRow("Sensitivity", 1, 10, 5, v => {})
    .addCheckboxRow("Invert Y Axis", false);
}

function buildAccessibilitySettings(ctx) {
  const { labelX, controlX, controlWidth, panelH, spacingY } = ctx.layout;
  ctx.addSelectRow("Color Mode", ["None", "Protanopia", "Deuteranopia", "Tritanopia"]);
  const label = createSettingLabel("Text Size", labelX, ctx.y, controlX - labelX - 20);
  ctx.pushElement(label);
  const sizes = { Small: DEFAULT_SETTINGS.textSize - 20, Default: DEFAULT_SETTINGS.textSize, Big: DEFAULT_SETTINGS.textSize + 20 };
  const btnWidth = controlWidth / 3.2;
  let currentX = controlX;
  Object.entries(sizes).forEach(([sizeLabel, sizeVal]) => {
  const btn = makeSmallBtn(sizeLabel, currentX, ctx.y + TEXTSIZE_BUTTON_Y_OFFSET, btnWidth, panelH * 0.07, () => {
      playClickSFX();
      textSizeSetting = sizeVal;
      adjustTextSize(sizeVal);
      updateTextSizeButtonStyles();
    });
    btn.attribute('data-text-size-val', sizeVal);
    ctx.pushElement(btn);
    currentX += btnWidth + 15;
  });
  updateTextSizeButtonStyles();
  ctx.y += spacingY;
  const actionBtnWidth = controlWidth * 0.42;
  const actionBtnHeight = panelH * 0.09;
  const actionGap = controlWidth * 0.06;
  const applyX = controlX;
  const resetX = controlX + actionBtnWidth + actionGap;
  const actionY = ctx.y + TEXTSIZE_BUTTON_Y_OFFSET;
  const applyBG = createBgImg("assets/3-GUI/Button BG.png", applyX, actionY, actionBtnWidth, actionBtnHeight, '3');
  const applyBtn = makeSmallBtn("💾 Apply", applyX, actionY, actionBtnWidth, actionBtnHeight, saveAccessibilitySettings);
  ctx.pushElement(applyBG).pushElement(applyBtn);
  const resetBG = createBgImg("assets/3-GUI/Button BG.png", resetX, actionY, actionBtnWidth, actionBtnHeight, '3');
  const resetBtn = makeSmallBtn("Default", resetX, actionY, actionBtnWidth, actionBtnHeight, resetDefaults);
  ctx.pushElement(resetBG).pushElement(resetBtn);
  ctx.y += spacingY;
}

function buildLanguageSettings(ctx) {
  ctx.addSelectRow("Language", ["English", "Spanish", "French", "German"]);
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

function captureLoopFallbackFrame() {
  if (!bgVideo) return;
  ensureLoopFallbackBuffer();
  loopFallbackBuffer.clear();
  loopFallbackBuffer.image(bgVideo, 0, 0, width, height);
  fallbackFrameReady = true;
}

function updateBackgroundVideo() {
  if (!bgVideo || typeof bgVideo.duration !== 'function' || typeof bgVideo.time !== 'function') return;
  const duration = bgVideo.duration();
  if (!duration || !isFinite(duration)) return;
  const currentTime = bgVideo.time();
  if (!isFinite(currentTime)) return;

  const inFadeWindow = duration - currentTime <= VIDEO_FADE_WINDOW;
  const dt = (typeof deltaTime === 'number' ? deltaTime : 16.67) / 1000;
  const fadeStep = 255 * dt / VIDEO_FADE_WINDOW;
  const recoverStep = 255 * dt / (VIDEO_FADE_WINDOW * VIDEO_RECOVERY_WINDOW);

  if (inFadeWindow && !wasInVideoFadeWindow) {
    captureLoopFallbackFrame();
    wasInVideoFadeWindow = true;
  } else if (!inFadeWindow && wasInVideoFadeWindow) {
    wasInVideoFadeWindow = false;
  }

  if (inFadeWindow) {
    videoOpacity = max(0, videoOpacity - fadeStep);
    fallbackOpacity = min(255, fallbackOpacity + fadeStep);
    videoLoopPending = true;
  } else {
    videoOpacity = min(255, videoOpacity + recoverStep);
    fallbackOpacity = max(0, fallbackOpacity - recoverStep);
  }

  if (videoLoopPending && videoOpacity <= 0) {
    videoLoopPending = false;
    try { bgVideo.time(0); bgVideo.play(); } catch (e) {}
  }
}

function saveSettings() {
  playClickSFX();
  saveAllSettings();
  try {
    const iframe = document.getElementById('game-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'update-audio-settings',
        masterVol: masterVol,
        musicVol: musicVol,
        sfxVol: sfxVol,
        difficulty: difficultySetting
      }, '*');
      console.log('[saveSettings] forwarded audio settings to game iframe');
    }
  } catch (e) { console.warn('[saveSettings] failed to post audio settings to iframe', e); }
  alert("💾 Settings saved and stored locally!");
}

function resetDefaults() {
  playClickSFX();
  clearSavedSettings();
  masterVol = DEFAULT_SETTINGS.masterVol;
  musicVol = DEFAULT_SETTINGS.musicVol;
  sfxVol = DEFAULT_SETTINGS.sfxVol;
  textSizeSetting = DEFAULT_SETTINGS.textSize;
  difficultySetting = DEFAULT_SETTINGS.difficulty;
  applyVolumes();
  applyCurrentTextSize();
  syncSlidersToSettings();
  alert("↺ Settings reset to default (and saved).");
  saveAllSettings();
}

function saveAllSettings() {
  const settings = { masterVol, musicVol, sfxVol, textSizeSetting, difficulty: difficultySetting };
  localStorage.setItem("menuSettings", JSON.stringify(settings));
  console.log("💾 Saved Settings:", settings);
}

function loadAllSettings() {
  const saved = localStorage.getItem("menuSettings");
  if (saved) {
    const s = JSON.parse(saved);
    masterVol = s.masterVol ?? masterVol;
    musicVol = s.musicVol ?? musicVol;
    sfxVol = s.sfxVol ?? sfxVol;
    textSizeSetting = s.textSizeSetting ?? textSizeSetting;
    const storedDifficulty = normalizeDifficultyChoice(s.difficulty);
    if (storedDifficulty) difficultySetting = storedDifficulty;
    applyVolumes();
    applyCurrentTextSize();
    syncSlidersToSettings();
    console.log("✅ Loaded Settings:", s);
  } else {
    console.log("⚙️ No saved settings found. Using defaults.");
    applyCurrentTextSize();
  }
}

function clearSavedSettings() {
  localStorage.removeItem("menuSettings");
  console.log("🗑️ Cleared saved settings.");
}

function draw() {
  if (inGame) return;

  updateBackgroundVideo();
  videoBuffer.clear();
  videoBuffer.image(bgVideo, 0, 0, width, height);
  imageMode(CORNER);
  tint(255, videoOpacity);
  image(videoBuffer, 0, 0, width, height);
  if (fallbackOpacity > 1) {
    const fallbackSource = fallbackFrameReady ? loopFallbackBuffer : bgPlayButton;
    if (fallbackSource) {
      tint(255, fallbackOpacity);
      image(fallbackSource, 0, 0, width, height);
    }
  }
  noTint();

  if (showingSettings) {
    const cx = width / 2;
    const cy = height / 2;
    const panelW = 0.7 * width;
    const panelH = 0.7 * height;

    push();
    imageMode(CENTER);
    tint(255, 220);
    image(rectSkin, cx, cy, panelW, panelH);
    pop();

    textSize(headingFontPx || 0.055 * height);
    fill(0);
    textAlign(CENTER, TOP);
    text("Settings", cx, cy - panelH / 2 - 170);
  }

  if (fadeAlpha > 0) {
    fill(0, fadeAlpha);
    rect(0, 0, width, height);
    fadeAlpha = max(0, fadeAlpha - 10);
  }
}

function windowResized() {
  try { clearTimeout(_menuResizeTimer); } catch (e) {}
  _menuLastSize = { w: window.innerWidth, h: window.innerHeight };
  _menuResizeTimer = setTimeout(() => {
    try {
      
      const overlay = document.getElementById('game-overlay');
      if (overlay) {
        console.log('[menu] windowResized: game overlay present — skipping reload');
        return;
      }
    } catch (e) {
      console.warn('[menu] windowResized overlay check failed', e);
    }

   
    if (skipNextMenuReload) {
      console.log('[menu] windowResized: skipping one-time programmatic reload');
      skipNextMenuReload = false;
      return;
    }

    
    if (_menuLastSize.w === window.innerWidth && _menuLastSize.h === window.innerHeight) {
      try {
        location.reload();
      } catch (e) {
        console.warn('[menu] failed to reload after resize', e);
      }
    } else {
     
      windowResized();
    }
  }, 200);
}

function adjustTextSize(sizeValue) {
  if (typeof sizeValue !== 'number' || !isFinite(sizeValue)) {
    sizeValue = DEFAULT_SETTINGS.textSize;
  }
  const scale = sizeValue / DEFAULT_SETTINGS.textSize;
  baseFontPx = scale * 0.04 * height;
  smallFontPx = scale * 0.03 * height;
  labelFontPx = scale * 0.035 * height;
  headingFontPx = baseFontPx * 1.25;

  const applyFont = (el, sizePx) => { if (el) el.style('font-size', sizePx + 'px'); };
  [btnPlay, btnSettings, btnExit].forEach(btn => applyFont(btn, baseFontPx));
  [btnSave, btnBackMenu].forEach(btn => applyFont(btn, smallFontPx));
  categoryButtons.forEach(btn => applyFont(btn, baseFontPx));
  activeSettingElements.forEach(e => {
    if (!e || !e.elt) return;
    const tag = e.elt.tagName;
    if (tag === 'BUTTON' || tag === 'SELECT' || tag === 'INPUT') applyFont(e, smallFontPx);
    else if (e.elt.classList?.contains('setting-label')) applyFont(e, labelFontPx);
  });
  selectAll('.setting-label').forEach(lbl => lbl.style('font-size', labelFontPx + 'px'));
  selectAll('.setting-checkbox').forEach(cbEl => { try { cbEl.style('font-size', smallFontPx + 'px'); } catch (e) {} });
  window.textSize(headingFontPx);
}

function applyCurrentTextSize() {
  adjustTextSize(textSizeSetting);
  updateTextSizeButtonStyles();
}

function saveAccessibilitySettings() {
  playClickSFX();
  alert("✅ Accessibility settings applied!");
  applyCurrentTextSize();
}

function injectCustomStyles() {
  const style = createElement("style", `
    @font-face {
      font-family: "MyFont";
      src: url("assets/3-GUI/font.ttf") format("truetype");
    }
    * {
      font-family: "MyFont", sans-serif !important;
      try {
        const iframe = document.getElementById('game-iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'stop-game-music' }, '*');
        }
      } catch (e) {}
      transition: all 0.25s ease;
    }
    button:hover {
      transform: scale(1.05);
      text-shadow: 0 0 10px #ffffff80;
      color: #ffea80 !important;
    }
    input[type="checkbox"], select, input[type="range"] {
      accent-color: #ffcc00;
    }
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
      width: 50px;
      height: 10px;
      border-radius: 50%;
      background: #ffcc00;
      box-shadow: 0 0 6px #ffcc0070;
      border: 2px solid #f5b800;
      cursor: pointer;
      margin-top: -3px;
    }
    input[type="range"]::-moz-range-thumb {
      width: 50px;
      height: 10px;
      border-radius: 50%;
      background: #ffcc00;
      border: 2px solid #f5b800;
      box-shadow: 0 0 6px #ffcc0070;
      cursor: pointer;
    }
    label {
      color: white !important;
    }
  `);
  style.parent(document.head);
}
# FOREST RPG - PROTOTYPE

**Version:** 0.5.0 (Alpha)
**Engine:** p5.js (JavaScript)
**Render Mode:** Pixelated / Crisp-Edges (High-DPI Support)

---

## 1. OVERVIEW
This is a web-based, top-down 2D RPG engine prototype built with p5.js. It features a robust procedural generation system that creates unique worlds containing rivers, hills, forests, and dynamic weather effects (clouds).

Unlike previous versions, this build includes persistent settings, map saving/loading capabilities, a functional stamina system, and jump mechanics.

---

## 2. KEY FEATURES

### 🌍 Procedural Generation
* **Dynamic Terrain:** Generates forests, grass, and elevation (hills/cliffs) using Perlin noise.
* **River Carving:** sophisticated river generation logic that flows from edges or lakes, complete with bridge placement logic.
* **Biomes:** Includes logic for different environment types (Forest, Grasslands, etc.).

### 🎮 Gameplay Mechanics
* **Movement:** 8-directional movement with collision detection.
* **Physics:** Jumping mechanics to clear small obstacles.
* **Stamina System:** Sprinting consumes stamina, which regenerates over time.
* **Interaction:** Basic interaction logic for items (Chests, Health Packs) exists in the engine.

### ⚙️ Engine & Systems
* **Save/Load System:** * **Autosave:** Maps are automatically saved to your browser's LocalStorage.
    * **Manual Save:** Press 'P' to regenerate and save map states.
    * **JSON Export:** Maps can be downloaded as JSON files.
* **Persistent Settings:** Audio volumes (Master/Music/SFX), text size, and difficulty settings are saved between sessions.
* **Visuals:** * Dynamic cloud system with parallax scrolling.
    * "Crisp" pixel-art rendering ensuring sharp visuals on 4K/Retina displays.
    * Edge-layer debugging.

---

## 3. HOW TO RUN

**⚠️ IMPORTANT:** Due to browser security restrictions regarding local file access (CORS), you **cannot** simply double-click the `.html` files. You must run a local web server.

### Option A: VS Code (Recommended)
1.  Install the "Live Server" extension in VS Code.
2.  Right-click `1-Menu_Index.html`.
3.  Select **"Open with Live Server"**.

### Option B: Python
1.  Open a terminal/command prompt in the game folder.
2.  Run one of the following commands:
    * `python -m http.server` (Python 3)
    * `python -m SimpleHTTPServer` (Python 2)
3.  Open your browser to: `http://localhost:8000/1-Menu_Index.html`

### Option C: Node.js (If configured)
1.  If you have a `package.json` with a start script, run `npm start`.

---

## 4. CONTROLS

### Movement
| Key | Action |
| :--- | :--- |
| **W / A / S / D** | Move Character |
| **SHIFT** (Hold) | Sprint (Consumes Stamina) |
| **SPACEBAR** | Jump (Clear small obstacles/water) |

### System
| Key | Action |
| :--- | :--- |
| **ESC** | Pause Game / Open Settings |
| **P** | Force Regenerate World & Manual Save |
| **F** | Toggle Fullscreen |
| **T** | Toggle Assets (Debug Texture Mode) |

---

## 5. SETTINGS & CUSTOMIZATION

The game now features a fully functional settings menu accessible via the Main Menu or by pressing **ESC** in-game.

* **Audio:** Separate sliders for Master, Music, and SFX volume.
* **Gameplay:** Difficulty toggles (affects mob spawn rates in code logic).
* **Accessibility:** Text size scaling and Color Blindness simulation modes.

---

## 6. FILE STRUCTURE

* `1-Menu_Index.html`: The entry point. Handles the main menu UI and video background.
* `2-Menu.js`: Logic for the main menu, settings persistence, and audio unlocking.
* `3-Game_Index.html`: The container for the actual game engine (loaded via iframe).
* `4-Game.js`: The core game engine. Contains the loop, rendering, physics, and map generation algorithms.
* `assets/`: Contains all sprites, spritesheets, audio, and font files.

---

## 7. KNOWN ISSUES & LIMITATIONS

* **Combat:** While mob spawn logic exists, actual combat mechanics (attacking/taking damage) are not fully implemented in the UI.
* **Loading Times:** Initial map generation involves complex erosion simulations and may take a moment on slower devices.
* **Browser Zoom:** The engine attempts to compensate for browser zoom levels, but playing at 100% zoom is recommended for pixel-perfect accuracy.

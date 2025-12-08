================================================================================
                                FOREST RPG - PROTOTYPE
================================================================================

Version: 0.1.0
Engine: p5.js (JavaScript)

--------------------------------------------------------------------------------
1. OVERVIEW
--------------------------------------------------------------------------------
This is a web-based, top-down 2D RPG engine prototype. It features a procedurally
generated world with distinct biomes, dynamic river carving, and basic movement
mechanics.

The current build is a "walking simulator" engine test. Your goal is to explore
the generated world and test the movement physics.

--------------------------------------------------------------------------------
2. HOW TO RUN
--------------------------------------------------------------------------------
IMPORTANT: Due to browser security settings (CORS), you cannot simply double-click
the .html files to play. You must run a local server.

OPTION A: Using the included batch file (Windows)
   - Double-click 'start-game.bat' if configured on your system.

OPTION B: Using Python
   1. Open a terminal/command prompt in the game folder.
   2. Run: python -m http.server
   3. Open your browser to: http://localhost:8000/1-Menu_Index.html

OPTION C: VS Code
   - Right-click '1-Menu_Index.html' and select "Open with Live Server".

--------------------------------------------------------------------------------
3. CONTROLS
--------------------------------------------------------------------------------
[ W / A / S / D ]   Move Character (Up, Left, Down, Right)
[ SHIFT (Hold)  ]   Sprint (Consumes Stamina)
[ SPACEBAR      ]   Jump (Useful for clearing small obstacles/water)
[ ESC           ]   Open/Close In-Game Menu
[ F             ]   Toggle Fullscreen

--- Debug / Dev Keys ---
[ P ]   Regenerate World (Force new procedural generation)
[ T ]   Toggle Assets (Switch between textures and debug hitboxes)
[ O ] ALSO [ESC]  Force Menu Open (Use if UI gets stuck)

--------------------------------------------------------------------------------
4. CURRENT LIMITATIONS & KNOWN ISSUES
--------------------------------------------------------------------------------
Please be aware of the following limitations in the current build:

* **GAMEPLAY ONLY:** You can currently ONLY move around the map. There are no
    other interactions implemented yet.
* **SETTINGS:** Game Menu settings (Volume, etc.) do NOT save. They will reset
    every time you reload the game.
* **ITEMS:** There are NO working chests or health packs. They may appear
    visually but have no function.
* **MODS:** No mod support is available yet.
* **COMBAT:** No combat mechanics or AI are implemented.

--------------------------------------------------------------------------------
5. FEATURES
--------------------------------------------------------------------------------
* Procedural Generation: Creates unique maps with rivers, hills, and forests.
* Dynamic Audio: Music and sound effects (adjustable per session).
* Visual Styles: Toggle between pixel-art textures and debugging colors.

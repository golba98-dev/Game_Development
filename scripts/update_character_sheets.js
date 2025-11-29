#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'assets', '2-Characters');
const OUT_JSON = path.resolve(__dirname, 'character_sheets_mappings.json');
const OUT_JS = path.resolve(__dirname, 'character_sheets_mappings.js');

function walk(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...walk(full));
    else if (e.isFile()) results.push(full);
  }
  return results;
}

function detectAction(filePath) {
  const n = filePath.toLowerCase();
  if (/(idle|stand|still|idle_sheet)/.test(n)) return 'idle';
  // Prefer detecting 'walk' separately from 'run' so the script can emit distinct walk mappings
  if (/(walk|walking|walk_sheet|walk_sheets)/.test(n)) return 'walk';
  if (/(run|running|run_sheet|run_sheets)/.test(n)) return 'run';
  return null;
}

function detectDirection(filePath) {
  const n = filePath.toLowerCase();
  if (/northeast|ne/.test(n)) return 'NE';
  if (/northwest|nw/.test(n)) return 'NW';
  if (/southeast|se/.test(n)) return 'SE';
  if (/southwest|sw/.test(n)) return 'SW';
  if (/north|n\b/.test(n)) return 'N';
  if (/south|s\b/.test(n)) return 'S';
  if (/east|e\b/.test(n)) return 'E';
  if (/west|w\b/.test(n)) return 'W';
  // fallback: front/back -> S/N
  if (/front/.test(n)) return 'S';
  if (/back/.test(n)) return 'N';
  return null;
}

function toRelative(p) {
  return path.relative(path.resolve(__dirname, '..'), p).replace(/\\/g, '/');
}

function buildMappings() {
  if (!fs.existsSync(ROOT)) {
    console.error('Root folder not found:', ROOT);
    process.exit(1);
  }

  const files = walk(ROOT).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

  const mappings = { idle: {}, walk: {}, run: {} };
  for (const f of files) {
    const action = detectAction(f);
    if (!action) continue;
    const dir = detectDirection(f) || 'S';
    
    const rel = toRelative(f);
    
    const existing = mappings[action][dir];
    if (!existing) mappings[action][dir] = rel;
    else {
      const curIsSheet = /sheet/.test(existing.toLowerCase());
      const newIsSheet = /sheet/.test(rel.toLowerCase());
      if (newIsSheet && !curIsSheet) mappings[action][dir] = rel;
    }
  }

  return mappings;
}

function writeOutputs(mappings) {
  fs.writeFileSync(OUT_JSON, JSON.stringify(mappings, null, 2), 'utf8');

  const jsContent = `// Auto-generated mapping for character sheets
module.exports = ${JSON.stringify(mappings, null, 2)};
`;
  fs.writeFileSync(OUT_JS, jsContent, 'utf8');
}

function printSnippet(mappings) {
  console.log('\n=== Suggested JS snippets to paste into your `4-Game.js` file ===\n');
  if (Object.keys(mappings.idle).length) {
    console.log('const IDLE_SHEET_PATHS = ' + JSON.stringify(mappings.idle, null, 2) + ' ;\n');
  } else {
    console.log('// No idle sheets detected.');
  }
  if (Object.keys(mappings.walk).length) {
    console.log('const WALK_SHEET_PATHS = ' + JSON.stringify(mappings.walk, null, 2) + ' ;\n');
  } else {
    console.log('// No walk sheets detected.');
  }
  if (Object.keys(mappings.run).length) {
    console.log('const RUN_SHEET_PATHS = ' + JSON.stringify(mappings.run, null, 2) + ' ;\n');
  } else {
    console.log('// No run sheets detected.');
  }
  console.log('Files written:');
  console.log(' -', OUT_JSON);
  console.log(' -', OUT_JS);
  console.log('\nTo apply automatically, you can open `scripts/character_sheets_mappings.js` and copy the objects into `4-Game.js`.');
}

function main() {
  const mappings = buildMappings();
  writeOutputs(mappings);
  printSnippet(mappings);
}

main();

const fs = require('fs');
const path = require('path');

const MAPS_DIR = path.join(__dirname, '..', 'maps');

function ensureMapsDir() {
  try { if (!fs.existsSync(MAPS_DIR)) fs.mkdirSync(MAPS_DIR); } catch (e) { console.error('Failed to create maps dir', e); }
}

ensureMapsDir();

// Usage: pipe JSON into this script or pass a filename
// Example: node save_map_payload.js payload.json
const argv = process.argv.slice(2);
if (argv.length > 0) {
  const src = argv[0];
  try {
    const data = fs.readFileSync(src, 'utf8');
    const obj = JSON.parse(data);
    const ts = obj.timestamp || Date.now();
    const out = path.join(MAPS_DIR, `saved_map_${ts}.json`);
    fs.writeFileSync(out, JSON.stringify(obj, null, 2), 'utf8');
    console.log('Saved to', out);
  } catch (e) {
    console.error('Failed to save payload', e);
  }
} else {
  // read stdin
  let body = '';
  process.stdin.on('data', d => body += d.toString());
  process.stdin.on('end', () => {
    try {
      const obj = JSON.parse(body);
      const ts = obj.timestamp || Date.now();
      const out = path.join(MAPS_DIR, `saved_map_${ts}.json`);
      fs.writeFileSync(out, JSON.stringify(obj, null, 2), 'utf8');
      console.log('Saved to', out);
    } catch (e) {
      console.error('Failed to save payload from stdin', e);
    }
  });
}

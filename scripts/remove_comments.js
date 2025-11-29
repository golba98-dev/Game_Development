#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function stripComments(src) {
  let out = '';
  let i = 0;
  const len = src.length;
  let inSingle = false, inDouble = false, inTemplate = false;
  while (i < len) {
    const ch = src[i];
    const nch = src[i+1];

    if (!inSingle && !inDouble && !inTemplate) {
      // block comment
      if (ch === '/' && nch === '*') {
        i += 2;
        while (i < len && !(src[i] === '*' && src[i+1] === '/')) i++;
        i += 2; // skip closing */
        continue;
      }
      // line comment
      if (ch === '/' && nch === '/') {
        i += 2;
        while (i < len && src[i] !== '\n') i++;
        continue;
      }
      if (ch === "'") { inSingle = true; out += ch; i++; continue; }
      if (ch === '"') { inDouble = true; out += ch; i++; continue; }
      if (ch === '`') { inTemplate = true; out += ch; i++; continue; }
      out += ch; i++; continue;
    }

    if (inSingle) {
      out += ch;
      if (ch === '\\') { out += (src[i+1] || ''); i += 2; continue; }
      if (ch === "'") { inSingle = false; }
      i++; continue;
    }
    if (inDouble) {
      out += ch;
      if (ch === '\\') { out += (src[i+1] || ''); i += 2; continue; }
      if (ch === '"') { inDouble = false; }
      i++; continue;
    }
    if (inTemplate) {
      // preserve template content, but remove comments inside ${...} expressions
      if (ch === '`') { out += ch; inTemplate = false; i++; continue; }
      if (ch === '$' && nch === '{') {
        out += '${';
        i += 2;
        // parse until matching brace, removing comments inside
        let brace = 1;
        while (i < len && brace > 0) {
          const c = src[i];
          const nc = src[i+1];
          // remove block
          if (c === '/' && nc === '*') {
            i += 2;
            while (i < len && !(src[i] === '*' && src[i+1] === '/')) i++;
            i += 2; continue;
          }
          // remove line
          if (c === '/' && nc === '/') {
            i += 2; while (i < len && src[i] !== '\n') i++; continue;
          }
          if (c === "'") {
            out += c; i++;
            while (i < len) {
              const cc = src[i]; out += cc; if (cc === '\\') { out += (src[i+1] || ''); i += 2; continue; } if (cc === "'") { i++; break; } i++; }
            continue;
          }
          if (c === '"') {
            out += c; i++;
            while (i < len) { const cc = src[i]; out += cc; if (cc === '\\') { out += (src[i+1] || ''); i += 2; continue; } if (cc === '"') { i++; break; } i++; }
            continue;
          }
          if (c === '`') {
            out += c; i++;
            while (i < len) { const cc = src[i]; out += cc; if (cc === '\\') { out += (src[i+1] || ''); i += 2; continue; } if (cc === '`') { i++; break; } i++; }
            continue;
          }
          if (c === '{') { out += c; brace++; i++; continue; }
          if (c === '}') { brace--; out += c; i++; continue; }
          out += c; i++;
        }
        continue;
      }
      out += ch; i++; continue;
    }
  }
  return out;
}

function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node remove_comments.js <path-to-file>');
    process.exit(2);
  }
  const abs = path.resolve(target);
  if (!fs.existsSync(abs)) {
    console.error('File not found:', abs);
    process.exit(3);
  }
  const src = fs.readFileSync(abs, 'utf8');
  const bak = abs + '.bak';
  if (!fs.existsSync(bak)) {
    try { fs.writeFileSync(bak, src, 'utf8'); console.log('Backup written to', bak); } catch (e) { console.error('Failed to write backup', bak, e); process.exit(4); }
  } else {
    console.log('Backup already exists at', bak);
  }
  try {
    const stripped = stripComments(src);
    fs.writeFileSync(abs, stripped, 'utf8');
    console.log('Stripped comments and wrote', abs);
    console.log('Original size:', src.length, '-> new size:', stripped.length);
  } catch (e) {
    console.error('Failed to strip/write target file:', e);
    process.exit(5);
  }
}

main();

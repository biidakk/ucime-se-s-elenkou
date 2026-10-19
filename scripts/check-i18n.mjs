// Checks the translation files in src/i18n.  Run with:  npm run check-i18n
//   - every language file has exactly the keys of cs.json, with the same {placeholders}
//   - every key used in the code as t('…') exists in cs.json

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './content-tools.mjs';

const DIR = path.join(ROOT, 'src', 'i18n');
const load = (file) => JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
const reference = load('cs.json');
const problems = [];

const placeholders = (value) => {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return [...new Set(text.match(/\{\w+\}/g) ?? [])].sort().join(',');
};

for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== 'cs.json')) {
  const other = load(file);
  for (const key of Object.keys(reference)) {
    if (!(key in other)) problems.push(`${file}: missing "${key}"`);
    else if (placeholders(other[key]) !== placeholders(reference[key])) {
      problems.push(`${file}: "${key}" has different {placeholders} than cs.json`);
    }
  }
  for (const key of Object.keys(other)) if (!(key in reference)) problems.push(`${file}: unknown key "${key}"`);
}

// Keys used in the code (only plain t('key') calls; built keys like `lang.${code}.name` are skipped).
function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(d.name) ? [full] : [];
  });
}
for (const file of sourceFiles(path.join(ROOT, 'src'))) {
  const code = fs.readFileSync(file, 'utf8');
  for (const match of code.matchAll(/\bt(?:\.list)?\(\s*'([a-zA-Z0-9.]+)'/g)) {
    if (!(match[1] in reference)) problems.push(`${path.relative(ROOT, file)}: key "${match[1]}" is not in cs.json`);
  }
}

if (problems.length) {
  for (const p of problems) console.log(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`✓ Translations OK (${Object.keys(reference).length} keys).`);

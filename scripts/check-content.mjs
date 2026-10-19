// Checks the files in /content for mistakes.  Run with:  npm run check-content
// Errors must be fixed (the command fails); warnings are worth a look but allowed.
// Pass a course id to check just one course:  npm run check-content -- cs-de

import fs from 'node:fs';
import path from 'node:path';
import { checkCourse, CONTENT_DIR, courseIds, loadUnits } from './content-tools.mjs';

const only = process.argv[2];
const courses = courseIds().filter((id) => !only || id === only);
let failed = false;

for (const courseId of courses) {
  const units = loadUnits(courseId);
  const { errors, warnings } = checkCourse(courseId, units);
  const lessons = units.flatMap(({ unit }) => unit.lessons);
  const words = lessons.flatMap((l) => l.words).length;
  const exercises = lessons.flatMap((l) => l.exercises).length;

  for (const w of warnings) console.log(`  ! ${w}`);
  if (errors.length > 0) {
    failed = true;
    console.log(`✗ ${courseId}: ${errors.length} error(s):`);
    for (const e of errors) console.log(`  ✗ ${e}`);
  } else {
    const levels = [...new Set(units.map(({ unit }) => unit.level))].join('+');
    console.log(
      `✓ ${courseId} OK (${levels}): ${units.length} units, ${lessons.length} lessons, ${words} words, ${exercises} exercises` +
        (warnings.length ? `, ${warnings.length} warning(s)` : ''),
    );
  }
}

// Pronunciation fixes (content/pronunciation/<language>.json): see src/lib/pronunciation.ts.
const pronDir = path.join(CONTENT_DIR, 'pronunciation');
for (const file of fs.existsSync(pronDir) ? fs.readdirSync(pronDir).filter((f) => f.endsWith('.json')) : []) {
  const errors = [];
  try {
    const data = JSON.parse(fs.readFileSync(path.join(pronDir, file), 'utf8'));
    if (!Array.isArray(data.fixes)) errors.push('"fixes" must be a list');
    for (const [i, fix] of (data.fixes ?? []).entries()) {
      if (typeof fix.write !== 'string' || !fix.write.trim()) errors.push(`fixes[${i}]: "write" is missing`);
      if (typeof fix.say !== 'string' || !fix.say.trim()) errors.push(`fixes[${i}]: "say" is missing`);
      if (fix.voices !== undefined) {
        try {
          new RegExp(fix.voices, 'i');
        } catch {
          errors.push(`fixes[${i}]: "voices" is not a valid pattern`);
        }
      }
    }
  } catch (error) {
    errors.push(`not valid JSON: ${error.message}`);
  }
  if (errors.length) {
    failed = true;
    for (const e of errors) console.log(`  ✗ pronunciation/${file}: ${e}`);
  }
}

if (failed) process.exit(1);

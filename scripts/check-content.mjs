// Checks the files in /content for mistakes.  Run with:  npm run check-content
// Errors must be fixed (the command fails); warnings are worth a look but allowed.
// Pass a course id to check just one course:  npm run check-content -- cs-de

import { checkCourse, courseIds, loadUnits } from './content-tools.mjs';

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

if (failed) process.exit(1);

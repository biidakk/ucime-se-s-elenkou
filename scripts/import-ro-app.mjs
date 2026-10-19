// Converts the content of the old Romanian → Czech app (C:\Users\ander\czech-ro-app, fields cs/ro)
// into this app's format (fields target/native) as the course "ro-cs". See MIGRATION.md.
// It only READS the old app; it never changes it.
//
//   node scripts/import-ro-app.mjs <old-app-folder> <output-folder>
//   e.g. node scripts/import-ro-app.mjs ../czech-ro-app content/ro-cs
//
// Ids (u1, u1-l1, u1-l1-w1 …) stay exactly the same, so saved progress can be carried over.

import fs from 'node:fs';
import path from 'node:path';

const [from, to] = process.argv.slice(2);
if (!from || !to) {
  console.log('Usage: node scripts/import-ro-app.mjs <old-app-folder> <output-folder>');
  process.exit(1);
}
const source = path.join(from, 'content');
fs.mkdirSync(to, { recursive: true });

const lang = (l) => (l === 'cs' ? 'target' : 'native'); // Czech is the language being learned
const pair = (p) => ({ target: p.cs, native: p.ro });

function exercise(ex) {
  const { cs, ro, ...rest } = ex; // only "speak" has cs/ro at the top level (text/ro)
  switch (ex.type) {
    case 'choice':
      return { ...rest, questionLang: lang(ex.questionLang) };
    case 'match':
      return { ...rest, pairs: ex.pairs.map(pair) };
    case 'speak': {
      const { ro: native, ...speak } = ex;
      return { ...speak, native };
    }
    default:
      return rest; // type, listen, build, fill: same fields, only the languages' roles changed
  }
}

// Known small mistakes in the old content, corrected during the conversion (see MIGRATION.md).
const FIXES = {
  // The question „2+kk“ is Czech, but was marked as a Romanian question.
  'u10-l3-e3': (ex) => ({ ...ex, questionLang: 'target' }),
};

let count = 0;
for (const file of fs.readdirSync(source).filter((f) => /^unit\d+-.*\.json$/.test(f))) {
  const unit = JSON.parse(fs.readFileSync(path.join(source, file), 'utf8'));
  const converted = {
    id: unit.id,
    level: unit.level,
    title: unit.title,
    titleTarget: unit.titleCs,
    description: unit.description,
    reviewed: unit.reviewed,
    lessons: unit.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      titleTarget: lesson.titleCs,
      reviewed: lesson.reviewed,
      tip: {
        ...lesson.tip,
        ...(lesson.tip.examples && { examples: lesson.tip.examples.map(pair) }),
      },
      words: lesson.words.map(({ cs, ro, ...w }) => ({ id: w.id, target: cs, native: ro, ...(w.note && { note: w.note }), reviewed: w.reviewed })),
      exercises: lesson.exercises.map((ex) => (FIXES[ex.id] ? FIXES[ex.id](exercise(ex)) : exercise(ex))),
    })),
  };
  fs.writeFileSync(path.join(to, file), JSON.stringify(converted, null, 2) + '\n');
  count++;
}
console.log(`✓ Converted ${count} units into ${to}`);

// Builds the checklists for native-speaker reviewers from /content:
//   CONTENT_REVIEW.md      overview with the progress of every course
//   review/<course>.md     every item of one course, grouped by unit and lesson
// Run with:  npm run review
// Never edit these files by hand: change the JSON files, then run this again.

import fs from 'node:fs';
import path from 'node:path';
import { checkCourse, courseIds, loadUnits, ROOT } from './content-tools.mjs';

const LANGUAGE_NAMES = { cs: 'čeština', en: 'angličtina', de: 'němčina', ro: 'rumunština' };

const TYPE_NAMES = {
  choice: 'Výběr',
  match: 'Dvojice',
  type: 'Psaní',
  listen: 'Poslech',
  build: 'Skládání věty',
  fill: 'Doplňování',
  speak: 'Mluvení',
};

const box = (item) => (item.reviewed ? '[x]' : '[ ]');
// Keep table cells on one line and stop "|" from breaking the table.
const cell = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const quoted = (list) => list.map((o) => `„${o}“`).join(', ');

function describeExercise(ex) {
  const prompt = ex.prompt ? `${ex.prompt} ` : '';
  switch (ex.type) {
    case 'choice':
      return `${prompt}**${ex.question}** — možnosti: ${quoted(ex.options)} — ✔ **${ex.answer}**`;
    case 'listen':
      return `${prompt}🔊 zazní: **${ex.audio}** — možnosti: ${quoted(ex.options)} — ✔ **${ex.answer}**`;
    case 'type': {
      const extra = ex.accept?.length ? ` (uznává se i: ${quoted(ex.accept)})` : '';
      return `${prompt}**${ex.question}** → ✔ **${ex.answer}**${extra}`;
    }
    case 'match':
      return `${prompt}${ex.pairs.map((p) => `**${p.target}** = ${p.native}`).join(' · ')}`;
    case 'build': {
      const extra = ex.extra?.length ? ` (chybné dílky: ${quoted(ex.extra)})` : '';
      const accept = ex.accept?.length ? ` (uznává se i: ${quoted(ex.accept)})` : '';
      return `${prompt}${ex.question} → ✔ **${ex.answer}**${extra}${accept}`;
    }
    case 'fill': {
      const explain = ex.explain ? ` — vysvětlení: ${ex.explain}` : '';
      return `${prompt}**${ex.sentence}** (${ex.translation}) — možnosti: ${quoted(ex.options)} — ✔ **${ex.answer}**${explain}`;
    }
    case 'speak':
      return `${prompt}🎤 **${ex.text}** — ${ex.native}`;
  }
}

function countItems(units) {
  let total = 0;
  let done = 0;
  const count = (item) => {
    total++;
    if (item.reviewed) done++;
  };
  for (const { unit } of units) {
    count(unit);
    for (const lesson of unit.lessons) {
      count(lesson);
      count(lesson.tip);
      lesson.words.forEach(count);
      lesson.exercises.forEach(count);
    }
  }
  return { total, done };
}

function courseReview(courseId, units) {
  const [nativeLang, targetLang] = courseId.split('-');
  const { total, done } = countItems(units);
  const out = [];
  out.push(`# Kontrola obsahu: ${LANGUAGE_NAMES[targetLang]} pro mluvčí jazyka ${LANGUAGE_NAMES[nativeLang]} (\`${courseId}\`)`);
  out.push('');
  out.push('> **Generovaný soubor, needitujte ho ručně.** Vzniká z JSON souborů v `/content` příkazem `npm run review`.');
  out.push('');
  out.push(`**Zkontrolováno: ${done} / ${total} položek.**`);
  out.push('');

  units.forEach(({ file, unit }, unitIndex) => {
    out.push(`## ${box(unit)} Kapitola ${unitIndex + 1}: ${unit.title} (${unit.titleTarget}) · ${unit.level}`);
    out.push('');
    out.push(`Soubor: \`content/${file}\` · ID: \`${unit.id}\` · Popis: ${unit.description}`);
    out.push('');

    unit.lessons.forEach((lesson, lessonIndex) => {
      out.push(`### ${box(lesson)} ${unitIndex + 1}.${lessonIndex + 1}: ${lesson.title} (${lesson.titleTarget}) · \`${lesson.id}\``);
      out.push('');
      const tip = lesson.tip;
      out.push(`**${box(tip)} Tip: ${tip.title}**`);
      out.push('');
      out.push(`> ${tip.text.replace(/\n/g, '\n> ')}`);
      if (tip.examples?.length) {
        out.push('>');
        for (const ex of tip.examples) out.push(`> - **${ex.target}** — ${ex.native}`);
      }
      out.push('');
      out.push('**Slovíčka**');
      out.push('');
      out.push(`| OK | ID | ${LANGUAGE_NAMES[targetLang]} | ${LANGUAGE_NAMES[nativeLang]} | Poznámka |`);
      out.push('|----|----|----|----|----|');
      for (const w of lesson.words) {
        out.push(`| ${box(w)} | \`${w.id}\` | **${cell(w.target)}** | ${cell(w.native)} | ${cell(w.note)} |`);
      }
      out.push('');
      out.push('**Cvičení**');
      out.push('');
      for (const ex of lesson.exercises) {
        out.push(`- ${box(ex)} \`${ex.id}\` *${TYPE_NAMES[ex.type]}* — ${describeExercise(ex)}`);
      }
      out.push('');
    });
  });
  return { text: out.join('\n'), total, done };
}

const summary = [];
let failed = false;
fs.mkdirSync(path.join(ROOT, 'review'), { recursive: true });

for (const courseId of courseIds()) {
  const units = loadUnits(courseId);
  const { errors } = checkCourse(courseId, units);
  if (errors.length > 0) {
    failed = true;
    console.log(`✗ ${courseId}: fix ${errors.length} content error(s) first (see: npm run check-content)`);
    continue;
  }
  const { text, total, done } = courseReview(courseId, units);
  fs.writeFileSync(path.join(ROOT, 'review', `${courseId}.md`), text);
  summary.push({ courseId, units: units.length, total, done });
  console.log(`✓ Wrote review/${courseId}.md (${done} / ${total} items reviewed).`);
}

const out = [];
out.push('# Content review / Kontrola obsahu');
out.push('');
out.push('> **Generated file, do not edit by hand.** Built from `/content` with `npm run review`.');
out.push('');
out.push('## Jak kontrolovat');
out.push('');
out.push('- **Rodilý mluvčí cílového jazyka** (angličtina, němčina, rumunština): zkontroluje, že každé slovo a věta jsou správně, přirozeně a běžně používané, a že jsou správné i chybné možnosti (chybné nesmí být náhodou také správně).');
out.push('- **Česky mluvící kontrolor:** zkontroluje české překlady, vysvětlení v tipech a srovnání s češtinou.');
out.push('- Opravu zapište k ID položky (např. `u2-l1-w3`). Když je položka v pořádku, nastavte v jejím JSON souboru `"reviewed": true` a spusťte znovu `npm run review` — políčko se změní na [x].');
out.push('');
out.push('| Kurz | Kapitoly | Zkontrolováno |');
out.push('|------|-------|---------------|');
for (const s of summary) {
  out.push(`| [${s.courseId}](review/${s.courseId}.md) | ${s.units} | ${s.done} / ${s.total} |`);
}
out.push('');
fs.writeFileSync(path.join(ROOT, 'CONTENT_REVIEW.md'), out.join('\n'));
console.log('✓ Wrote CONTENT_REVIEW.md');
if (failed) process.exit(1);

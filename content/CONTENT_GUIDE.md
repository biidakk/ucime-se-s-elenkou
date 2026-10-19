# Content guide

How to write lessons for this app. Every word, sentence and explanation lives in JSON files
under `content/<course>/`. The app has no lesson text in its code.

## Courses and files

A **course** is one pair *native language → language to learn*, named `<native>-<target>`:

| Folder | Learner speaks | Learns | Speech voice |
|---|---|---|---|
| `content/cs-en` | Czech | English (**British**) | en-GB |
| `content/cs-de` | Czech | German | de-DE |
| `content/cs-ro` | Czech | Romanian | ro-RO |

Each course folder holds `SYLLABUS.md` (the plan of all units) and one file per unit:
`unit1-hello.json`, `unit2-family.json`, … The number in the file name sets the order;
the unit `id` must be `u` + that number (`u1`, `u2`, …).

## Field names

Fields are neutral so any language pair fits:

- **`target`** = text in the language being learned (English, German, Romanian).
- **`native`** = text in the learner's language (Czech).
- `title`, `description`, `prompt`, `note`, `explain`, tip `title`/`text`, and every
  `question` that is not in the target language are in the **native** language (Czech).

## Unit file

```json
{
  "id": "u1",
  "level": "A1",
  "title": "Pozdravy",
  "titleTarget": "Hello!",
  "description": "Jak pozdravit, poděkovat a zeptat se „jak se máš?“.",
  "reviewed": false,
  "lessons": [ … 3 lessons … ]
}
```

`level` is `"A1"`, `"A2"` or `"B1"` (the course map shows a heading for each level).

## Lesson

```json
{
  "id": "u1-l1",
  "title": "Dobrý den a na shledanou",
  "titleTarget": "Hello and goodbye",
  "reviewed": false,
  "tip": {
    "title": "Krátký nadpis tipu",
    "text": "Krátké vysvětlení v jednoduché češtině (max. ~600 znaků).",
    "examples": [ { "target": "Good morning!", "native": "Dobré ráno!" } ],
    "reviewed": false
  },
  "words": [
    { "id": "u1-l1-w1", "target": "hello", "native": "ahoj; dobrý den", "note": "volitelná poznámka", "reviewed": false }
  ],
  "exercises": [ … ]
}
```

- **6–9 words** per lesson, **8–10 exercises** per lesson, 3 lessons per unit.
- Every id is unique in the course: `u2-l1-w3` = unit 2, lesson 1, word 3; `u2-l1-e5` = exercise 5.
- Every item has `"reviewed": false` until a native speaker has checked it.

### Words are also flashcards and test questions

The app automatically builds the lesson quiz, the unit test and the flashcards from `words`.
So each word must work on its own:

- `target`: the form to learn, as it should be typed. One form only, **no "/" and no
  brackets** (put alternatives and grammar in `note`).
  - German nouns **with the article**: `der Tisch`. Plural in the note: `"note": "množné číslo: die Tische"`.
  - Romanian nouns **with the indefinite article**: `o casă`, `un scaun`. Definite and plural
    forms in the note: `"note": "casa = ten dům; množné číslo: case"`.
  - English: British spelling (colour, centre, flat, holiday, mum). Nouns without articles
    unless the phrase needs one.
  - Phrases are fine: `How are you?`, `Wie geht's?`, `Ce mai faci?`.
- `native`: a short, natural Czech meaning. Different words in one lesson must have different
  meanings (tests show 3 meanings to choose from). Use `;` to give two meanings: `ahoj; dobrý den`.
- `note` (optional): one short line in Czech: register (formal/informal), plural, a trap.

## Exercise types

`prompt` is optional. Without it, the app shows a standard Czech instruction for the type
("Co to znamená?", "Jak se to řekne?", "Poslechněte si a vyberte" …). Give a `prompt` only
when the standard one doesn't fit.

All option lists: **2–4 options** (3 is best at A1), no duplicates, the `answer` must be
exactly one of them, and the wrong options must be **clearly wrong** (never a second correct
answer, not even a synonym).

| type | fields |
|---|---|
| `choice` | `question`, `questionLang` (`"target"` or `"native"`), `options` (in the *other* language), `answer` |
| `match` | `pairs`: 3–5 × `{ "target": …, "native": … }` |
| `type` | `question` (Czech), `answer` (target language, one plain answer), optional `accept` (other correct answers) |
| `listen` | `audio` (target text spoken aloud), `options`, `answer`. Either *"what did you hear"* (options in target language, answer = audio) or *"what does it mean"* (options in Czech) |
| `build` | `question` (Czech sentence), `answer` (target sentence, 3–8 words; its words become tiles), optional `extra` (1–2 wrong tiles, e.g. a wrong article), optional `accept` (other correct orders using the same tiles), optional `optional` (words of the answer the learner may leave out and still be right, e.g. `["that"]` in "She said that she was tired.") |
| `fill` | `sentence` (target, with exactly one `___`), `translation` (Czech), `options`, `answer`, optional `explain` (one Czech sentence: why) |
| `speak` | `text` (target, short, numbers written as words), `native` (Czech meaning) |

A good lesson mix (8–10): 2× `choice`, 1× `match`, 2× `listen`, 1× `type`, 1–2× `build`,
1–2× `fill` (from unit 2 on), and at most 1× `speak`. Exercises should use the lesson's
words and recycle a few from earlier lessons.

Typed answers: capitals, punctuation and extra spaces never matter; English contractions
(`I'm` = `I am`) are accepted automatically; a missing diacritic (ä, ș, ă …) counts as right
with a reminder. So `accept` is only for genuinely different answers.

## Tips (grammar explanations)

The learner is older and not a linguist. Write **short, plain, friendly Czech** (vykání:
"Všimněte si…", "Řekněte…"). One idea per tip. Compare with Czech wherever it helps:

- English: no cases, but articles (a/an/the) that Czech lacks; tenses (present perfect,
  continuous) where Czech uses one form; questions with *do*; th/w sounds; spelling ≠ sound.
- German: 4 cases vs 7 Czech cases (Akkusativ ≈ 4. pád, Dativ ≈ 3. pád; *na stůl / na stole*
  ≈ *auf den Tisch / auf dem Tisch*); der/die/das often differs from Czech gender; verb in
  2nd place; verb at the end after *weil/dass*; separable verbs; *Sie* ≈ *Vy*; ü/ö/ch/z.
- Romanian: the article is glued to the end (*o casă* → *casa*); neuter = masc. sg. + fem. pl.;
  *vreau să merg* (no infinitive); ș = š, ț = c, ă, î/â; stress moves (Czech is always on the
  1st syllable); vocative exists like in Czech; shared Slavic words (*prieten* ≈ přítel) and
  false friends (*drag* = drahý jen ve smyslu milý; *nevastă* = manželka, ne nevěsta).

Tip examples (`examples`) are 2–4 short target sentences with Czech meanings.

**Pronunciation hints** in Czech spelling are welcome where Czech readers would go wrong,
but they must be accurate (check the IPA, e.g. on Wiktionary). Split syllables and mark the
stressed one in capitals when the stress is not on the first syllable: „mul-cu-MESK“,
„la re-ve-DE-re“; „Bună ziua“ ≈ „BU-nă ZI-wa“ (no n!). Don't promise sounds Czech lacks
(say „like i with rounded lips“ for ü rather than inventing a spelling).

**Never address the learner with a gendered past form** („Udělal jste chybu“): the same
text is read by men and women. Use present tense or neutral phrasing („Tohle je chyba“).

## Text that is read aloud

The phone reads aloud every `target` text: words, tip examples, `audio`, target questions,
match pairs, build answers, fill sentences, `speak` texts. So these strings must be clean
for a speech voice: no symbols (≈ / + …), no brackets, no digits (write numbers as words
unless the lesson is about digits), no Czech words inside, normal sentence punctuation.

## Quality rules

- Correct grammar and **natural everyday phrases** a native speaker would really say.
- Accurate, natural Czech translations (not word-for-word).
- Use what has been taught; introduce at most a few unknown words per lesson.
- Romanian: always ș and ț with a comma below (never ş/ţ with a cedilla).
- No real people's names except common first names; no brands.
- JSON is strict: `"` only around keys and values; in Czech text use „ “ for quotes.

## Check before you finish

```
npm run check-content          # all courses (or: npm run check-content -- cs-de)
npm run review                 # rebuilds CONTENT_REVIEW.md and review/<course>.md
```

The checker finds: invalid JSON, duplicate ids or words, answers missing from options,
too many options/pairs/tiles, letters that don't belong to the language (e.g. ş with a
cedilla, Czech letters in English text), tiles that don't match, and more. Fix every error;
read every warning.

## Pronunciation fixes

Some phone voices read a word wrongly (Apple's Romanian voice Ioana says „ziuna“ for „ziua“).
`content/pronunciation/<language>.json` lists respellings that are sent only to the voice;
the learner still sees the real spelling:

```json
{ "fixes": [ { "write": "ziua", "say": "zi-ua", "voices": "Ioana", "note": "why" } ] }
```

`write` matches whole words (capitals don't matter), `voices` (optional) limits the fix to
voices whose name matches. Find a working spelling in the app: Nastavení → Zvuk →
Kontrola výslovnosti → Vyzkoušet jiný zápis. `"try"` lists suggestions shown there.

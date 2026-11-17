// Numbers in a spoken sentence. Speech recognition usually writes numbers as digits: the
// learner says „Eleven, twelve, thirteen“ and the phone hears „11 1213“ (sometimes with no
// space between them). To check such a sentence, the number words of the expected text are
// turned into values here, which can then be found among the digits the phone wrote.
//
// Words come in already tidied: lower case, no punctuation, no accents (see answers.ts).

import type { LanguageCode } from './languages';

type Kind = 'unit' | 'teen' | 'tens' | 'mult';
type NumberWord = { value: number; kind: Kind };

// unit = 1–9 (can follow tens: „twenty one“), teen = 10–19 (stands alone),
// tens = 20, 30 … 90, mult = hundred, thousand (multiplies what came before).
function words(list: Record<Kind, Record<string, number>>): Record<string, NumberWord> {
  const result: Record<string, NumberWord> = {};
  for (const kind of Object.keys(list) as Kind[]) {
    for (const [word, value] of Object.entries(list[kind])) result[word] = { value, kind };
  }
  return result;
}

const EN = words({
  unit: {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9,
  },
  teen: {
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
    seventeen: 17, eighteen: 18, nineteen: 19,
    tenth: 10, eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15,
    sixteenth: 16, seventeenth: 17, eighteenth: 18, nineteenth: 19,
  },
  tens: {
    twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
    twentieth: 20, thirtieth: 30,
  },
  mult: { hundred: 100, thousand: 1000 },
});

const CS = words({
  unit: {
    nula: 0, jeden: 1, jedna: 1, jedno: 1, jednu: 1, dva: 2, dve: 2, tri: 3, ctyri: 4, pet: 5,
    sest: 6, sedm: 7, osm: 8, devet: 9,
  },
  teen: {
    deset: 10, jedenact: 11, dvanact: 12, trinact: 13, ctrnact: 14, patnact: 15, sestnact: 16,
    sedmnact: 17, osmnact: 18, devatenact: 19,
  },
  tens: {
    dvacet: 20, tricet: 30, ctyricet: 40, padesat: 50, sedesat: 60, sedmdesat: 70,
    osmdesat: 80, devadesat: 90,
  },
  mult: { sto: 100, sta: 100, ste: 100, set: 100, tisic: 1000, tisice: 1000 },
});

const RO = words({
  unit: {
    zero: 0, unu: 1, una: 1, doi: 2, doua: 2, trei: 3, patru: 4, cinci: 5, sase: 6, sapte: 7,
    opt: 8, noua: 9,
  },
  teen: {
    zece: 10, unsprezece: 11, doisprezece: 12, douasprezece: 12, treisprezece: 13,
    paisprezece: 14, cincisprezece: 15, saisprezece: 16, saptesprezece: 17, optsprezece: 18,
    nouasprezece: 19,
  },
  tens: {
    douazeci: 20, treizeci: 30, patruzeci: 40, cincizeci: 50, saizeci: 60, saptezeci: 70,
    optzeci: 80, nouazeci: 90,
  },
  mult: { suta: 100, sute: 100, mie: 1000, mii: 1000 },
});

// „a hundred“, „o sută“, „un milion“: these mean 1 only right before hundred/thousand.
const ONE_BEFORE_MULT: Partial<Record<LanguageCode, string[]>> = { en: ['a'], ro: ['o', 'un'] };
// „one hundred and five“, „douăzeci și unu“: joins the parts of one number.
const JOINERS: Partial<Record<LanguageCode, string[]>> = { en: ['and'], ro: ['si'] };

const CS_UNITS: Record<string, number> = {
  jedn: 1, dva: 2, tri: 3, ctyri: 4, pet: 5, sest: 6, sedm: 7, osm: 8, devet: 9,
};

// „jednadvacet“ = 21, „dvaadvacet“ = 22 (the old Czech word order, written as one word).
function czechCompound(word: string): number | null {
  const match = /^(jedn|dva|tri|ctyri|pet|sest|sedm|osm|devet)a(\w+)$/.exec(word);
  const tens = match && CS[match[2]];
  return match && tens?.kind === 'tens' ? CS_UNITS[match[1]] + tens.value : null;
}

const DE_UNITS: Record<string, number> = {
  null: 0, eins: 1, ein: 1, eine: 1, einen: 1, zwei: 2, drei: 3, vier: 4, funf: 5, sechs: 6,
  sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, zwolf: 12, dreizehn: 13, vierzehn: 14,
  funfzehn: 15, sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19,
};
const DE_TENS: Record<string, number> = {
  zwanzig: 20, dreissig: 30, vierzig: 40, funfzig: 50, sechzig: 60, siebzig: 70, achtzig: 80,
  neunzig: 90,
};

// German writes a whole number as one word: „einundzwanzig“, „zweihundertfunf“.
function german(word: string): number | null {
  if (word === '') return 0;
  for (const [mult, value] of [['tausend', 1000], ['hundert', 100]] as const) {
    const at = word.indexOf(mult);
    if (at === -1) continue;
    const before = word.slice(0, at);
    const times = before === '' ? 1 : DE_UNITS[before === 'ein' ? 'eins' : before];
    const rest = german(word.slice(at + mult.length));
    return times === undefined || rest === null ? null : times * value + rest;
  }
  if (word in DE_UNITS) return DE_UNITS[word];
  if (word in DE_TENS) return DE_TENS[word];
  const match = /^(\w+)und(\w+)$/.exec(word);
  if (match && match[1] in DE_UNITS && DE_UNITS[match[1]] < 10 && match[2] in DE_TENS) {
    return DE_UNITS[match[1] === 'ein' ? 'eins' : match[1]] + DE_TENS[match[2]];
  }
  return null;
}

const TABLES: Partial<Record<LanguageCode, Record<string, NumberWord>>> = { en: EN, cs: CS, ro: RO };

export type NumberPhrase = { start: number; end: number; value: number }; // words start…end-1

// The numbers in a list of words: where each one starts and ends, and its value.
// „one two three“ is three numbers; „twenty one“ and „one hundred and five“ are one each.
export function findNumbers(plainWords: string[], lang?: LanguageCode): NumberPhrase[] {
  const phrases: NumberPhrase[] = [];
  if (lang === 'de') {
    plainWords.forEach((word, i) => {
      const value = german(word);
      if (value !== null) phrases.push({ start: i, end: i + 1, value });
    });
    return phrases;
  }
  const table = lang ? TABLES[lang] : undefined;
  if (!table) return phrases;

  const lookup = (i: number): NumberWord | null => {
    const word = plainWords[i];
    if (word === undefined) return null;
    if (table[word]) return table[word];
    if (lang === 'cs') {
      const value = czechCompound(word);
      if (value !== null) return { value, kind: 'teen' }; // a whole tens+unit, ends the number
    }
    if (ONE_BEFORE_MULT[lang!]?.includes(word) && table[plainWords[i + 1]]?.kind === 'mult') {
      return { value: 1, kind: 'unit' };
    }
    return null;
  };

  let current: { start: number; end: number; total: number; part: number; last: Kind } | null = null;
  const close = () => {
    if (current) phrases.push({ start: current.start, end: current.end, value: current.total + current.part });
    current = null;
  };

  for (let i = 0; i < plainWords.length; i++) {
    const word = lookup(i);
    if (!word) {
      // „and“ / „și“ between two parts of the same number keeps it open.
      const next = lookup(i + 1);
      const joins = current && JOINERS[lang!]?.includes(plainWords[i]) && next && next.kind !== 'mult'
        && (current.last === 'mult' || (current.last === 'tens' && next.kind === 'unit'));
      if (!joins) close();
      continue;
    }
    const last = current?.last;
    const continues = current !== null && (
      word.kind === 'mult'
        ? last !== 'mult' || word.value > (current.part || 1)
        : word.kind === 'unit'
          ? last === 'tens' || last === 'mult'
          : last === 'mult'
    );
    if (!continues) {
      close();
      current = { start: i, end: i, total: 0, part: 0, last: word.kind };
    }
    const c = current!;
    if (word.kind === 'mult') {
      c.part = (c.part || 1) * word.value;
      if (word.value >= 1000) {
        c.total += c.part;
        c.part = 0;
      }
    } else {
      c.part += word.value;
    }
    c.end = i + 1;
    c.last = word.kind;
  }
  close();
  return phrases;
}

// All digits the phone wrote, in order and run together: „11 1213“ → „111213“, „2nd“ → „2“.
export function heardDigits(plainWords: string[]): string {
  return plainWords
    .map((word) => /^(\d+)(st|nd|rd|th)?$/.exec(word)?.[1] ?? '')
    .join('');
}

// Interface text (i18n). Every string the user sees comes from a translation file:
// src/i18n/<language>.json, one per native language. The code only uses keys.
//
// A value can be:
//   - a string with {placeholders}:               "Test: {score} z {total}"
//   - plural forms, chosen by the {count} param:   { "one": …, "few": …, "other": … }
//   - a list (for random praise, weekday names):  ["Správně!", "Výborně!"]
//
// To add a language: copy cs.json to <code>.json, translate the values, add it to
// TRANSLATIONS below and to UI_LANGUAGES in src/lib/languages.ts, then run npm run check-i18n.

import { useSettings } from '@/lib/settings';
import type { UiLanguage } from '@/lib/languages';
import cs from './cs.json';

type Dictionary = typeof cs;
export type TextKey = keyof Dictionary;
type PluralForms = { one: string; few?: string; many?: string; other: string };
type Params = Record<string, string | number>;

const TRANSLATIONS: Record<UiLanguage, Dictionary> = { cs };

function fill(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}

function pluralForm(lang: UiLanguage, forms: PluralForms, count: number): string {
  let category: string;
  try {
    category = new Intl.PluralRules(lang).select(count);
  } catch {
    category = count === 1 ? 'one' : 'other';
  }
  return (forms as Record<string, string | undefined>)[category] ?? forms.other;
}

export function translate(lang: UiLanguage, key: TextKey, params?: Params): string {
  const value: unknown = TRANSLATIONS[lang][key] ?? TRANSLATIONS.cs[key];
  if (typeof value === 'string') return fill(value, params);
  if (Array.isArray(value)) return fill(String(value[0]), params);
  if (value && typeof value === 'object') {
    return fill(pluralForm(lang, value as PluralForms, Number(params?.count ?? 0)), params);
  }
  return key;
}

export function translateList(lang: UiLanguage, key: TextKey): string[] {
  const value: unknown = TRANSLATIONS[lang][key] ?? TRANSLATIONS.cs[key];
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

export type T = ((key: TextKey, params?: Params) => string) & {
  list: (key: TextKey) => string[];
  lang: UiLanguage;
};

// The translate function for the interface language chosen in the settings.
export function useT(): T {
  const { settings } = useSettings();
  const lang = settings.nativeLanguage ?? 'cs';
  const t = ((key: TextKey, params?: Params) => translate(lang, key, params)) as T;
  t.list = (key) => translateList(lang, key);
  t.lang = lang;
  return t;
}

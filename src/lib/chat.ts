// Groundwork for the AI conversation partner (not built yet; see docs/CHAT_PLAN.md).
// The app will send the unit's topic and the words the learner already knows to a small
// server function, which holds the Claude API key and asks Claude to play a role.
// Nothing here talks to the network yet.

import type { ChatScenario, Course, Level, Unit } from './content';
import type { LanguageCode } from './languages';

// Where the server function lives. Empty = the feature is switched off (the default).
// Set EXPO_PUBLIC_CHAT_URL at build time once the server exists.
export const CHAT_URL = process.env.EXPO_PUBLIC_CHAT_URL ?? '';
export const chatAvailable = (): boolean => CHAT_URL !== '';

// At most this many known words go to Claude (the newest ones), to keep each message cheap.
const MAX_KNOWN_WORDS = 300;

// What Claude is told about the conversation (the server turns it into the prompt).
export type ChatContext = {
  targetLanguage: LanguageCode; // the language of the conversation
  nativeLanguage: LanguageCode; // corrections and help are in this language
  level: Level;
  unitTitle: string; // in the learner's language
  topics: string[]; // the unit's lesson titles, in the language being learned
  scenario: ChatScenario;
  knownWords: string[]; // words taught up to and including this unit
};

export type ChatMessage = { role: 'learner' | 'partner'; text: string };

// One request to the server function: the context and the conversation so far.
export type ChatRequest = {
  context: ChatContext;
  messages: ChatMessage[];
  help?: boolean; // the learner pressed "Help": a hint and a translation instead of a reply
};

// The server's answer, already split for the screen.
export type ChatReply = {
  reply: string; // the partner's next line, in the language being learned (read aloud)
  correction?: string; // the learner's last message, corrected (if it had a mistake)
  explanation?: string; // why, short, in the learner's language
  translation?: string; // the reply in the learner's language (on "Help")
  hint?: string; // what the learner could say next (on "Help")
  limitReached?: boolean; // the daily limit is used up
};

// The context for practising one unit: its topic and every word taught so far.
export function chatContext(course: Course, unit: Unit, native: LanguageCode, target: LanguageCode): ChatContext {
  const unitIndex = course.units.findIndex((u) => u.id === unit.id);
  const knownWords = course.units
    .slice(0, unitIndex + 1)
    .flatMap((u) => u.lessons.flatMap((l) => l.words.map((w) => w.target)))
    .slice(-MAX_KNOWN_WORDS);
  return {
    targetLanguage: target,
    nativeLanguage: native,
    level: unit.level,
    unitTitle: unit.title,
    topics: unit.lessons.map((l) => l.titleTarget),
    scenario: unit.chat ?? {
      situation: unit.description,
      partnerRole: `a friendly local person in an everyday situation about: ${unit.titleTarget}`,
    },
    knownWords,
  };
}

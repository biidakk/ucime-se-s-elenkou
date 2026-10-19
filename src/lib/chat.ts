// The AI conversation partner (docs/CHAT_PLAN.md). The app sends the unit's topic and the
// words the learner already knows to a small server function (server/chat), which holds
// the Claude API key and asks Claude to play a role.
// sendChat() is the only part that uses the network.

import type { ChatScenario, Course, Level, Unit } from './content';
import type { LanguageCode } from './languages';

// Where the server function lives. Empty = the feature is switched off (the default).
// Set EXPO_PUBLIC_CHAT_URL at build time (GitHub repository variable CHAT_URL).
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
};

// The server's answer, already split for the screen.
export type ChatReply = {
  reply: string; // the partner's next line, in the language being learned (read aloud)
  correction: string | null; // the learner's last message, corrected (if it had a mistake)
  explanation: string | null; // why, short, in the learner's language
  translation: string; // the reply in the learner's language (shown on "Pomoc")
  hint: string; // what the learner could say next (shown on "Pomoc")
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

export type ChatError = 'offline' | 'code' | 'limit' | 'busy' | 'error';
export type ChatResult = { ok: true; reply: ChatReply } | { ok: false; error: ChatError };

// Sends the conversation to the server function and returns the partner's answer.
export async function sendChat(request: ChatRequest, familyCode: string): Promise<ChatResult> {
  if (!chatAvailable()) return { ok: false, error: 'error' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Family-Code': familyCode },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    if (response.status === 401) return { ok: false, error: 'code' };
    if (response.status === 429) return { ok: false, error: 'limit' };
    if (response.status === 503) return { ok: false, error: 'busy' };
    if (!response.ok) return { ok: false, error: 'error' };
    return { ok: true, reply: (await response.json()) as ChatReply };
  } catch {
    return { ok: false, error: 'offline' };
  } finally {
    clearTimeout(timer);
  }
}

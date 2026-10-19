# Plan: AI conversation partner („Konverzace“)

**Status: planned, not built.** The app is prepared for it (see "Already in place"). Nothing
here costs money until it is switched on.

## What the learner sees

After finishing a unit, a **„Konverzace“** button opens a chat screen:

- Claude plays a role that fits the unit (a waiter in a café, a passer-by asked for
  directions, a doctor), in the language being learned.
- It speaks at the learner's level: short, simple sentences, mostly with words the learner
  already knows.
- If the learner makes a mistake, it answers naturally, then shows a short correction with a
  one-line explanation in Czech.
- Every message can be read aloud (the same voices as the lessons); the learner can answer
  by typing or, where speech recognition works, by voice.
- **„Pomoc“** shows a Czech translation of the last message and a hint what to say next.
- It needs internet. The rest of the app keeps working offline; without internet the
  button explains that.

## How it works

```
Phone (the app)  ──►  small server function (holds the API key, daily limit)  ──►  Claude API
                 ◄──  { reply, correction, explanation, translation, hint }   ◄──
```

The **API key must never be in the app**: the code is public and anyone could copy it.

- **Server function: a Cloudflare Worker** (recommended). Free plan: 100,000 requests a
  day, far more than needed. About 100 lines of code, kept in this repo (`server/chat/`),
  deployed with `npx wrangler deploy`. The key is stored as a Worker secret.
  - Alternative: an Expo Router API route on EAS Hosting. That would mean moving the whole
    app from GitHub Pages to EAS Hosting (free tier, already have an account). Possible,
    but more change for the same result.
- **Model:** `claude-haiku-5-5` (cheap and fast), with effort set to `low` for snappy replies.
- **Answer format:** structured output (JSON with `reply`, `correction`, `explanation`,
  `translation`, `hint`), so the app can show corrections separately.
- **Prompt:** the role and goal of the unit, the level, and the list of known words go in a
  stable system prompt (cached, so later messages in the same chat cost less); the
  conversation follows. Draft rules for Claude: stay in role; use only short sentences at
  level A1/A2/B1; prefer the known words; if the learner's message has a mistake, reply
  normally and fill `correction` + a one-sentence Czech `explanation`; be warm and patient;
  never correct more than one thing at a time.
- **Protection against strangers and big bills:**
  - a **family code**, typed once in Nastavení and stored on the phone; the Worker
    rejects requests without it;
  - a **daily limit** (e.g. 200 messages a day for the whole family, counted in Workers KV);
    after that the app says „Na dnešek je konverzací dost, zítra zase.“;
  - a **monthly spending limit** set in the Anthropic Console as the final safety net;
  - the Worker only accepts requests from the app's address.

## Already in place

- `src/lib/chat.ts`: the request/answer types, `chatContext()` (the unit's topic, level,
  scenario and up to 300 known words), and the switch `EXPO_PUBLIC_CHAT_URL` (empty = off).
- Units can have an optional role-play in their JSON, checked by `npm run check-content`:

  ```json
  "chat": {
    "situation": "Jste v kavárně v Londýně a objednáváte si.",
    "partnerRole": "a friendly waiter in a small London café",
    "goal": "order a drink and something to eat, then ask how much it is and pay"
  }
  ```

  Example: `content/cs-en/unit6-food.json`. Units without it get a role made from their
  title and description.
- Speech in and out (`src/lib/speech.ts`, `src/lib/recognition.web.ts`) and the pronunciation
  fixes already work and will be reused.

## What it would take

1. **You:** create an Anthropic API account (console.anthropic.com), add a payment method
   or a small prepaid credit, set a monthly limit, and create an API key. Create a free
   Cloudflare account. (I'll guide you through both; about 15 minutes.)
2. **Me:**
   - the Worker (key, family code, daily limit, prompt, structured output) and its deploy;
   - the chat screen (bubbles, read aloud, microphone, „Pomoc“, corrections in Czech),
     the „Konverzace“ button on the course map, the family code in Nastavení;
   - role-plays for every unit (helpers write them, reviewers check them);
   - tests, including a few scripted conversations per language to check the level and
     the corrections.
   Roughly one phase like A2 or B1 was.

## What it would cost

Claude Haiku 5.5 costs **$0.10 per million input tokens and $0.50 per million output
tokens** (Anthropic's list price, October 2026, for prompts under 100,000 tokens).

One chat message ≈ 3,000 input tokens (role, known words, conversation so far) and
≈ 250 output tokens (reply, correction, a little thinking):

| | per message | 60 messages a day (2 people × 30) | daily limit reached every day (200) |
|---|---|---|---|
| Input | ≈ $0.0003 | | |
| Output | ≈ $0.000125 | | |
| **Total** | **≈ $0.0004** | **≈ $0.03 a day, ≈ $0.75 a month** | **≈ $0.09 a day, ≈ $2.50 a month** |

Prompt caching lowers the input part further for longer chats. The Cloudflare Worker is
free at this size. These are estimates: the real cost is visible in the Anthropic Console
after the first days, and the monthly limit caps it in any case.

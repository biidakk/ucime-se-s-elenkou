# Chat server (Cloudflare Worker)

Holds the Claude API key for the AI conversation partner (`docs/CHAT_PLAN.md`). The app calls
it with the family code; it checks the calling page and a daily limit, then asks
`claude-haiku-5-5` for the next line of the role-play.

**Never put the API key in any file in this repository: the repository is public.**
The key and the family code are Worker secrets, typed into the prompts below.

## First setup (once)

```
cd server/chat
npm install
npx wrangler login                              # opens Cloudflare in the browser: allow access
npx wrangler kv namespace create CHAT_LIMIT     # copy the printed id into wrangler.toml
npx wrangler secret put ANTHROPIC_API_KEY       # paste the key when asked (it is hidden)
npx wrangler secret put FAMILY_CODE             # choose a code, e.g. three words
npx wrangler deploy                             # prints the address, e.g. https://elenka-chat.<name>.workers.dev
```

Then tell the app where the server is (GitHub repository variable, read by the deploy action):

```
gh variable set CHAT_URL --body "https://elenka-chat.<name>.workers.dev"
gh workflow run deploy.yml
```

On each phone: Nastavení → Konverzace s AI → type the family code → Uložit kód.

## Changing things

- Daily limit: `DAILY_LIMIT` in `wrangler.toml`, then `npx wrangler deploy`.
- New key or code: `npx wrangler secret put …` again (no deploy needed).
- Switch the chat off in the app: `gh variable delete CHAT_URL` and run the deploy action.
- Local test: put `FAMILY_CODE=…` and `ANTHROPIC_API_KEY=…` in `.dev.vars` (git-ignored) and
  run `npx wrangler dev`.

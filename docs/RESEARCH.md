# Research notes (October 2026)

Summary of the research done before building the app. Sources are linked; facts marked
*unverified* had no authoritative source.

## 1. iPhone web apps (PWA), iOS 26–27

- Since iOS 26 every site added to the Home Screen opens as a web app; a manifest is optional
  but still used for name/icons ([WebKit, Safari 26](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)).
- Manifest fields Safari uses: `name`, `short_name`, `scope`, `icons`, `display`, `start_url`, `id`,
  `theme_color`. `apple-touch-icon` (PNG 180×180) still overrides manifest icons ([firt.dev](https://firt.dev/notes/pwa-ios/)).
- Home Screen apps have **their own storage**, separate from Safari ([WebKit bug 181849](https://bugs.webkit.org/show_bug.cgi?id=181849)),
  and their own "days of use" counter, so Safari's 7-day deletion doesn't hit them in practice
  ([WebKit blog](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)).
- Quota: up to 60 % of disk per origin; `navigator.storage.persist()` is granted by heuristics
  (Home Screen apps favoured) ([WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)).
- Whether deleting the icon or "Clear History and Website Data" wipes a Home Screen app's data
  is *unverified* → **the app offers export/import of progress**.
- Text-to-speech (`speechSynthesis`) works; only pre-installed voices are exposed and the list can
  load late (`voiceschanged`) ([Apple forums](https://developer.apple.com/forums/thread/723503)).
  `expo-speech` on web wraps `speechSynthesis`. Silent mode may mute it (*unverified*): the app shows a hint.
- Speech recognition (`webkitSpeechRecognition`) exists in Safari (needs Siri, HTTPS), but WebKit
  said it is not available in Home Screen apps ([bug 225298](https://bugs.webkit.org/show_bug.cgi?id=225298));
  2026 reports show it failing after audio playback ([web-speech-api #96](https://github.com/WebAudio/web-speech-api/issues/96)).
  → The speak exercise appears only when recognition is available and can always be skipped.
- Expo has no built-in service worker; the official guide uses Workbox after `expo export`
  ([Expo PWA guide](https://docs.expo.dev/guides/progressive-web-apps/)).

**Hosting**: GitHub Pages (chosen; free plan needs a public repo, no custom headers, project
pages need `experiments.baseUrl`), EAS Hosting (100k requests/month free), Cloudflare Pages
(free, SPA fallback, custom headers), Netlify (credit-based free plan that pauses sites).

## 2. Course design (Duolingo, Babbel, Anki; older learners)

- Spaced practice beats massed practice ([Cepeda et al. 2006](https://pubmed.ncbi.nlm.nih.gov/16719566/));
  retrieval (quizzes) beats re-reading (Roediger & Karpicke 2006) → quizzes are learning, not judging.
- Duolingo: short lessons on a path, mistakes come back; its hearts/energy systems frustrate users.
  Babbel: dialogue-based lessons with grammar tips + review manager. Anki: SM-2/FSRS; Leitner is a
  simple fixed-interval version.
- Older learners (60–75): large text (≥18 px), contrast ≥ 4.5:1, targets ≥ 44–48 px, text labels
  on icons, no time pressure, one task per screen, few options, tap instead of drag, forgiving
  streaks (a lost streak demotivates) ([WCAG 2.5.5/2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
  [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/accessibility),
  [The Decision Lab on streaks](https://thedecisionlab.com/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification)).

## 3. English for Czech speakers (A1–A2)

Sources: [Cambridge A2 Key vocabulary list](https://www.cambridgeenglish.org/images/506886-a2-key-2020-vocabulary-list.pdf),
[British Council/EAQUALS Core Inventory](https://www.teachingenglish.org.uk/article/british-council-eaquals-core-inventory-general-english),
[Charles University corpus study of Czech learners](https://karolinum.cz/en/journal/auc-philologica/year-2017/issue-1/article-3828).

- **A1 grammar:** be; have got; present simple (do/does); present continuous (now); can; imperatives;
  there is/are; a/an/the, plurals, some/any; pronouns, possessives, 's; this/that; in/on/at;
  frequency adverbs; wh-questions; like + -ing; was/were.
- **A2 grammar:** past simple (irregular); past continuous; present perfect (ever/never, just/already/yet);
  going to, will; present continuous for plans; comparatives/superlatives; much/many; must/have to/should;
  would like; adverbs of manner; linkers; first conditional.
- **Typical Czech errors:** missing articles (*I have car*); past simple instead of present perfect
  (*I was never in London*); present for duration (*I am here since Monday*); overusing continuous;
  questions without *do* (*Where you live?*); missing 3rd-person -s; free word order; double negation
  (*I don't know nothing*); dropped *it* (*Is cold*); *he/she* for things; th → t/d/s/f, w → v;
  final devoicing (*dog* → "dok"); /æ/ = /e/.
- **Helpful comparisons:** *ten* ≈ the, *nějaký* ≈ a; Czech aspect (*dělal/udělal*) as a hook for
  continuous vs simple; English spelling is not phonetic like Czech.
- **False friends:** aktuální ≠ actual, sympatický ≠ sympathetic, eventuálně ≠ eventually,
  kontrola ≠ control, fabrika ≠ fabric, gymnázium ≠ gym, recept ≠ receipt.

## 4. German for Czech speakers (A1–A2)

Sources: [Goethe Start Deutsch 1 Wortliste](https://www.goethe.de/pro/relaunch/prf/ca/A1_SD1_Wortliste_02.pdf),
Goethe A2, [Charles University thesis on word-order errors](https://dspace.cuni.cz/handle/20.500.11956/184117).

- **A1 grammar:** present tense incl. sein/haben and stem-changing verbs; der/die/das, ein, kein;
  nominative and accusative; plurals; personal pronouns, mein/dein/Ihr; nicht/kein; W- and yes/no
  questions; verb in 2nd place; modal verbs (können, möchten, müssen, wollen); separable verbs;
  imperative; am/um/im; Perfekt of common verbs (haben/sein); und/aber/oder/denn.
- **A2 grammar:** dative (articles, pronouns, helfen/gefallen); Wechselpräpositionen (wo? Dativ /
  wohin? Akkusativ; stellen/stehen, legen/liegen); Perfekt fully; Präteritum of war/hatte/modals;
  weil/dass/wenn/ob with verb last; comparative/superlative; basic adjective endings; reflexive verbs;
  würde/könnte/hätte gern; seit/vor.
- **Typical Czech errors:** wrong gender (learn noun + article together); *in der Stadt* for direction;
  *Morgen ich fahre* (V2); *weil ich habe* (verb last); *Ich anrufe* (separable); *habe gefahren*
  (sein); *nicht Auto* (kein); ü/ö → i/e; German *z* = Czech *c*; *ich* sound.
- **Helpful comparisons:** cases (Akkusativ ≈ 4. pád, Dativ ≈ 3. pád: *pomáhám muži* = *ich helfe dem
  Mann*); location vs direction already changes case in Czech (*na stole / na stůl*); three genders
  (often different); *Sie* ≈ *Vy*; *je mi zima* = *mir ist kalt*; shared words (Schinken/šunka,
  Flasche/flaška, Tasche/taška, Zucker/cukr); final devoicing as in Czech.
- **False friends:** Termin (= appointment), Rente (= pension), Gift (= poison), bekommen (= get),
  Kur (= spa treatment), Tablett (= tray), Brief (= letter).

## 5. Romanian for Czech speakers (A1–A2)

Sources: Council of Europe "Nivel prag" ([list of threshold levels](https://rm.coe.int/liste-des-niveaux-seuil-list-of-threshold-levels/168077c54a)),
Gönczöl-Davies *Romanian: An Essential Grammar*, [Romanian lexis](https://en.wikipedia.org/wiki/Romanian_lexis),
[Slavic influence on Romanian](https://en.wikipedia.org/wiki/Slavic_influence_on_Romanian),
[Romanian phonology](https://en.wikipedia.org/wiki/Romanian_phonology), Duță (Charles University) on Czech learners.

- **A1 grammar:** a fi, a avea, present tense groups (incl. -ez/-esc); gender, un/o/niște;
  enclitic definite article (-ul, -le, -a); plurals; adjective agreement and position; possessives;
  acest/acel (ăsta/ăla); numbers (două, douăzeci de); nu; question words; în/la/pe/cu/de/din;
  reflexive verbs (mă cheamă); să + subjunctive after vreau/pot/trebuie; vocative; perfect compus.
- **A2 grammar:** genitive-dative (-ului/-ei/-lor; al/a/ai/ale); îmi place, mi-e foame; îl văd pe Ion;
  future (voi, o să); conditional (aș vrea); imperative and nu + infinitive; imperfect; comparison;
  nimic/nimeni with double negation; care/pe care; că/dacă/pentru că.
- **Typical Czech difficulties:** the enclitic article (*casa* vs *o casă*, *pe masă* but *pe masa mare*);
  neuter (masc. sg., fem. pl.: *un scaun*, *două scaune*); possessive article agreeing with the
  possessed thing; no verbal aspect; *vreau să merg* instead of infinitive; clitic doubling;
  ă and î/â; c/g before e/i (*ce* = če, *che* = ke); moving stress; no vowel length; *este* = [jeste].
- **Helpful comparisons:** vocative (*Ioane!* ~ *Jano!*); case thinking; ș = š, ț = c, j = ž;
  Slavic loanwords: da, ceas (čas), a citi (číst), a iubi, prieten (přítel), drag (drahý),
  a plăti (platit), vreme, noroc, sută (sto), târg (trh), smântână (smetana), slănină (slanina).
- **False friends:** *prost* = hloupý; *nevastă* = manželka (not nevěsta); *drag* = milý (expensive = *scump*).

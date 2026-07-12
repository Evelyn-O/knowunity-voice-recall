# CLAUDE.md — Knowunity Voice Recall prototype

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A Next.js + Tailwind v4 + Motion prototype of "Voice Recall," an in-path Exam Plan step for the Knowunity app (student explains a term aloud or by typing; a mocked AI judge grades recall quality and gives hints). Scaffolded with `create-next-app` (App Router, TypeScript, Turbopack). No test suite — this is a click-through prototype, not production code.

- [sprint-context.md](sprint-context.md) — the original build context/brief.
- [SPEC.md](SPEC.md) — **the actual build plan**: every screen, state, and scripted line, resolved from sprint-context.md's open questions through a build interview. This is what a fresh session should read to know what to build next, not sprint-context.md directly.
- [design.md](design.md) — extracted design tokens (colors/type/spacing/radius) and composition patterns, sourced from the Figma file.

See "Current build status" below for what's actually implemented right now.

## Working with sprint-context.md and SPEC.md

sprint-context.md's open questions (entry-sequence simplification, etc.) have since been resolved through a build interview — **SPEC.md §1 "Locked decisions" is the current source of truth for those**, not the open-question markers in sprint-context.md. sprint-context.md still holds the "why" behind each decision and the constraints that haven't changed. Read SPEC.md first for "what to build"; read sprint-context.md when you need the reasoning behind a SPEC.md decision.

Treat sprint-context.md as a living spec, not a finished one — it explicitly flags open tensions (search for `⚠ **Open:**`), most now closed in SPEC.md. Before proposing or implementing anything related to this feature:

- **Read the whole file first.** Decisions, hard constraints ("Constraints — do NOT build"), and rationale ("Key decisions") are load-bearing — a change that looks like a simplification may directly violate a decision recorded a few sections away.
- **Don't silently resolve open questions.** Where the doc says something is unresolved (e.g. the entry-sequence simplification candidates in steps 1–3), don't pick one and treat it as settled — flag the tradeoff back to the user instead.
- **Preserve the "why."** Each decision in the doc is recorded as `decision — because reason`. When extending or implementing the feature, keep changes consistent with the stated reason, not just the surface behavior.
- **Reskin target matters.** Build against the target reskin (mascot "Noe," typefaces Inter Variable + Bricolage), not the current live Knowunity app's branding ("Knowie," proprietary Greed VF), unless told otherwise.

## Project
- Building: a clickable prototype of a voice active-recall step in
  Knowunity's Exam Plan. A student explains a key term out loud; the
  character "Knowie" (reskinned as "Noe") replies in TEXT.
- For: students (~14–18) revising on their phone.
- Committed concept (SPEC.md §1): the mic-permission primer screen **is** the
  entry fork for first encounter — there's no separate Speak/Type/Maybe-later
  screen before it. Confidence tap is its own screen (first encounter) or
  merged with the primer content (recurring student); never merged into the
  term-1 card. 4 base terms (Note, Time signature, Tempo, Syncopation) always
  play; a 5th (Cadence) is a conditional bonus round, only if the student
  didn't get all 4 unaided.
- Platform: mobile only. Dark mode only (current design focus). Reskin
  target is agency Wreck-It-Edge's new visual system, not the current live
  app.

## This is a test prototype, not a working AI   (read this first)
- MOCK the recall intelligence: fixed example terms — Section 1 has Note,
  Time signature, Tempo, Syncopation, each with a scripted prompt, hint 1,
  hint 2, reveal, say-it-back offer, and skip line already written. The
  mic just advances the mocked flow.
- Never build real speech-to-text, real audio capture, or call any
  model/API.
- Knowie/Noe replies in TEXT only. Never add text-to-speech or audio
  output — this is a hard constraint from the brief, not a scope cut.

## Stack & tools
- Next.js + Tailwind (deploys to Vercel). Animations: the Motion library
  (motion/react); see motion-guide.md. Type: Variable and Bricolage Grotesque.
- Animations: the Motion library (motion/react) — never hand-code
  transitions; see motion-guide.md for presets and per-moment recipes.
- Font: Inter Variable (substitute for the proprietary "Greed VF").
- Style only from the design tokens / semantic color variables — never
  invent hex. Amber warning has no direct semantic token yet; coral is
  the closest substitute until that's resolved.

## Commands
- Install: `npm install`
- Dev: `npm run dev` (Turbopack; use the Preview tool's `preview_start` with the `dev` config in `.claude/launch.json`, not raw Bash, so the browser tools can attach to it)
- Build: `npm run build`
- If a code change doesn't seem to take effect in the preview, it's very
  likely a stale Turbopack cache, not your code — see "Good to know" below
  before debugging further.

## Current build status

Routes built so far, all under the `(recall)` route group (URLs are
unaffected by the group — `/`, `/confidence`, `/confidence-recurring`, etc.):

- `/` — **entry screen, fully built** (Figma node `13900:26392`). First-
  encounter entry fork + mic-permission primer combined. Mocked native
  permission dialog with background blur+scrim (blurs the persistent
  TopBar too, not just this screen's own content). Mascot idle bob/drift/
  glow animation (pure CSS `@keyframes`, respects `prefers-reduced-motion`).
  **"Don't Allow" genuinely lands the term loop in text-fallback mode now**
  (previously a dead `mode` query param term pages never read — Allow/Deny
  now instead set a real `micPermissionGranted` context value; see "Shared
  infrastructure"). `X` and "Maybe later" both open the shared
  exit-confirmation sheet (see the dedicated bullet below) instead of
  navigating directly.
- `/confidence` — **confidence tap, fully built** (Figma nodes `13900:24794`
  unselected / `13900:25634` selected). Default mascot pose is `standby`
  (not `excited`, despite that being the Figma layer's *name* — see "Good
  to know"). Selecting an option enables Continue; mascot swaps to
  `giggling`; bubble text becomes "Let's find out!". `X` now opens the
  shared exit-confirmation sheet (this fixed the long-standing `router.back()`
  TODO stub — see the exit-confirmation-sheet bullet below).
- `/term-1` — **the full voice mic loop for Note, built**: Idle → Recording
  → Paused ⇄ Hearing back → Sending → Checking it → Result (unaided pass),
  all as client-side state in one route (Figma nodes `13900:24880`,
  `13900:25472`, `13900:25504`, `13900:25536`, `13900:25568`, `13900:25602`,
  `13900:25720`). Mascot pose changes per state (idle thinking-less-judge,
  recording listening, paused excited, hearing-back standby, sending happy,
  checking listening; Result's answer bubble also uses happy). The typed-fallback
  variant of Idle (SPEC.md §3's growing-textbox swap) isn't built.
  Result's "Continue" routes to `/term-2` (real, now that it's built);
  "Why?" still doesn't lead anywhere real (not scoped). Term-1 predates the
  global skip-confirmation/session-outcome-tracking rules added while
  building later terms — skip was retrofitted to match term-2/3's pattern:
  tapping it opens the shared `SkipConfirmSheet` (default variant) instead
  of navigating immediately, and both Continue and a confirmed skip record
  this term's outcome via `useRecordTermOutcome("note", …)` — see "Shared
  infrastructure" below for both.
  - **Live mic reactivity is a deliberate, explicit exception to
    CLAUDE.md's "never build real audio capture" line, scoped narrowly.**
    Recording's waveform reads real input level via the Web Audio API
    (`getUserMedia` → `AudioContext` → `AnalyserNode`, sampled ~30fps) —
    visual reactivity only. No `MediaRecorder`, no audio blob, no upload,
    no model/API call; nothing is transcribed. The only thing kept in
    memory is small numeric level arrays (7 floats per sampled frame,
    capped at 600 frames), used solely to silently replay the same motion
    during Hearing back — discarded on delete/re-record, never persisted
    or sent anywhere. If mic permission is denied or unavailable, it falls
    back to a scripted looping pulse (`ScriptedWaveform`) rather than
    breaking — confirmed working in a sandboxed preview browser with no
    mic device, where `navigator.permissions.query` reports `"denied"`.
  - Hearing back replays the captured levels from Recording (silent, no
    audio) — this is a genuine echo of that take's motion, not a generic
    animation. If nothing was captured (mic blocked), it uses the same
    scripted fallback pulse as Recording's fallback.
  - Send is available from Recording and Hearing back, not just Paused —
    both now show delete + waveform + timer + send, matching Evelyn's
    updated `public/images/recording-mic.svg` and
    `hearing-back-mic.svg` reference art (both widened to include the
    same 40px brand-bold send circle Paused already had). Those two SVGs
    are read as reference only, not embedded — they bake the button fill,
    icons, AND the timer digits together as one static composite, same
    reason `checking-it-mic.svg`/`idle-mic.svg` aren't embedded either.
  - **No animation between mic states, by explicit instruction — it's an
    instant state swap, not a crossfade.** An earlier pass here had the
    mic button and its icon crossfade between states via `AnimatePresence`
    to avoid a "screen change" feel; Evelyn flagged that as still reading
    like jumping/an animation and asked for a hard state change instead.
    The button and its content now render with plain conditionals, no
    `AnimatePresence`/`layout`/color-transition. Animations that survived
    are the ones *within* a single state, not between states: the Sending
    spinner's rotation, the Checking-it pulse, and the live waveform's
    per-frame smoothing — don't reintroduce a between-state transition
    without checking with Evelyn first, this has been corrected once.
  - Sending lasts 4s, then Checking it lasts its own separate 4s, each via
    its own `setTimeout` — not a combined 4s.
  - Checking-it's center graphic is the actual `knowie-listening.svg`
    mascot art (via `MascotImage`, matching the mascot-per-state mapping),
    with a pulse (`scale` 1↔1.08, infinite reverse) — motion-guide.md's
    own "Recording / listening state" recipe, reused here rather than a
    new one invented for this spot. Not
    `public/images/checking-it-mic.svg`: that file bakes the button fill,
    a bespoke eyes graphic, AND both status lines together as one static
    composite (confirmed by inspecting it), which would mean non-real,
    non-tokenized text unlike everywhere else in this app.
  - The bottom "I can't speak right now" pill (and the Result sheet's
    "Why?"/"Continue" pair) are hand-rolled locally in `term-1/page.tsx`,
    not the shared `SecondaryButton` — its own baked-in `text-[21px]`
    doesn't fit this label on one line at this button's width, and a
    caller `className` override on `SecondaryButton` doesn't reliably beat
    that internal class (same cascade gotcha `buttons.tsx` already flags
    for its shared pill base). Sized down to `text-[18px]` with
    `whitespace-nowrap` directly on the local markup instead.
  - The skip icon-button is `IconButton variant="tertiary"` (no fill) —
    added to `components/buttons.tsx` after Evelyn flagged the default
    filled variant as wrong for this spot. Default `IconButton` behavior
    (filled) is unchanged for any future caller.
  - Skip + "I can't speak right now" are only disabled while a take is
    actively being captured or processed — Recording, Sending, Checking
    it. Active on Idle, Paused, and Hearing back (soft-gating: the student
    always has a way to skip once they're not mid-capture — an earlier
    pass here disabled them on every non-Idle state, which Evelyn
    corrected). Disabled state is signaled via `text/disabled` on the
    label/icon, not the fill — `interactive/secondary`'s fill already
    equals `interactive/disabled` (design.md's documented gap).
  - The recording timer (`formatTimer`) uses `tabular-nums` + a
    `min-w-[48px]` (sized to fit `0:59`, the longest realistic value)
    on the `<p>` itself — without it, proportional-width digits caused a
    small layout jump on every tick. Scoped to just that element.
- `/term-2` — **Time signature, built**: same mic-loop shape as term-1,
  extended with the partial → hint → retry → correct path term-1 never
  needed (Figma nodes: idle `13900:25208`, partial result `13900:25857`,
  hint `13900:26321`; the correct-result sheet has no separate Figma node
  — it reuses term-1's celebration sheet exactly, copy swapped). Scripted
  sequence is fixed: attempt 1 → partial, attempt 2 → correct
  (`TERM_2_OUTCOME_BY_ATTEMPT` — the one place that mapping lives, per the
  "known limitation, not a bug" instruction repeated for every term since:
  outcomes are hardcoded this sprint, a future phase adds real answer
  evaluation, and each term keeps that logic in one clearly-named local
  place so the swap-in is localized, not a rewrite).
  - Reused `HighlightCard` and `AlertTriangleIcon`/`WaveIcon` (already in
    `components/icons.tsx`, unused until now) rather than inventing new
    pieces for the partial sheet.
  - The "nailed it after the hint" reply line has no Figma frame (SPEC.md
    §4 flags this gap) — authored in Knowie's short/warm pattern, answers
    the hint's own question directly, flagged `// Authored, not sourced`
    in the source. Every later term with the same kind of gap (term-3's
    correct-on-3rd-attempt line, term-4's fallback answer, term-5's
    correct line) follows the same pattern: authored, commented as
    authored-not-sourced, consistent tone.
  - Skip and Continue both call `useRecordTermOutcome("time-signature", …)`
    (`"skipped"` / `"hinted"` — this term's script always resolves via
    exactly 1 hint) and route to `/term-3`.
- `/term-3` — **Tempo, built**: the full 2-hint wrong ladder plus the
  mishear-dispute detour neither prior term needed (Figma nodes: idle
  `13900:25242`, wrong result `13900:25923`, mishear-restart idle
  `13900:25274`, hint 1 `13900:26005`, 2nd wrong result `13900:26083`,
  hint 2 `13900:26165`, reveal `13900:26243`).
  - **Scripted sequence is `["wrong", "wrong", "wrong"]`** — the 3rd
    attempt has no hints left (`HINTS_AVAILABLE` = 2), so it routes
    straight to Reveal instead of another wrong-sheet (SPEC.md §3: "a 3rd
    wrong/no-retry resolves to Reveal"). This was corrected mid-build:
    the term first shipped as `["wrong","wrong","correct"]` (a 3rd-attempt
    save), with Reveal built but never naturally reached; Evelyn
    explicitly asked for the real wrong-wrong-wrong ending so Reveal is
    the actual path, not just architecturally-present-but-dead code. The
    "correct" `Outcome` case and its JSX stayed in the file rather than
    being deleted — still real/wired, just not exercised by this term's
    own script, same "keep it real even if unreached" reasoning SPEC.md
    already uses elsewhere.
  - **"What I heard." transcript card + "Did Knowie mishear you?" link**
    appear only on wrong-result sheets, not on hint screens (confirmed
    against the Figma frames — the card persists visually once shown but
    the mishear link doesn't carry into the hint stage). The transcript
    card does *not* participate in the dim/bright bubble-thread cycle —
    it stays at normal opacity as a static reference while the
    conversational bubbles around it dim.
  - Figma's literal copy is "Did knowie **misheard** you?" (a likely
    source typo mixing tenses); this build uses the grammatically-correct
    "Did Knowie **mishear** you?" instead, matching both SPEC.md §3.6's
    phrasing and this task's own instructions — flagged as a deliberate
    correction, not an oversight.
  - Mishear dispute resets to a clean Idle with adapted copy ("Sorry
    about that, lets try again! [bare question]", not the full prompt
    preamble — confirmed against the Figma mishear-restart frame) but
    consumes no hint and does not advance the attempt counter — the next
    Checking still resolves via the *same* scripted-outcome index. A
    dedicated `promptVariant` ("normal" | "mishear") state drives this;
    it's local to the mic-loop portion only — once dimmed for a
    result/hint/reveal screen, the persistent top bubble always reverts
    to the plain official prompt.
  - The can't-speak/type-instead label swap this term originally added
    (`hasTriedVoiceOnce`) was later removed — see the global copy fix
    below.
  - Skip and Continue call `useRecordTermOutcome("tempo", …)` and route to
    `/term-4`. Reveal's "Got it - Continue" also records the outcome
    (`"revealed"`) before routing — `handleContinue` is shared between the
    Reveal sheet and the (unreached) correct-result sheet, and branches on
    `stage` to record the right outcome for whichever actually resolved.
- `/term-4` — **Syncopation, built, last of the 4 base terms**: same
  simple unaided-pass shape as term-1 (no wrong/hint ladder — SPEC.md's
  own script for this term is "skipped, never attempted," and this task's
  brief was entirely about the skip-confirmation flow, not a new outcome
  ladder) (Figma idle `13900:25306`). If a tester answers instead of
  skipping (not the demo path), it resolves with an authored
  Syncopation answer, same "authored, not sourced" pattern as term-2/3's
  gaps.
  - **First term with real skip-confirmation** (Figma: general-case sheet
    `13900:25459`/on-screen mockup `13900:25371`, last-term variant
    `13900:25446`) — this term uses the **last-term** copy ("Maybe next
    time!") since it's the last base term, even though the general-case
    sheet screenshot happens to be mocked up over this term's own
    background in Figma (a documentation convenience, not an instruction
    to use that variant here — the task text explicitly says last-term).
  - **The end-of-base-terms routing decision lives here**: once this term
    resolves (skipped or completed), check whether terms 1–3 were *all*
    unaided passes. If so **and** this term is also unaided-or-skipped, go
    straight to `/summary`. Otherwise go to `/term-5` ("One more before we
    wrap up" → Cadence). Explicit carve-out: skipping *this* term after an
    otherwise-perfect 1–3 does **not** trigger "one more" — the only
    imperfect thing in that case is the skip itself, so immediately
    re-asking the exact term just skipped would defeat skipping it.
    Because terms 1–3's own scripts are fixed (term-2 always "hinted",
    term-3 always "revealed"), this bypass is architecturally real but not
    naturally reachable by clicking through the shipped demo — verified
    instead by temporarily forcing terms 1–3's recorded outcomes to
    `"unaided"`, confirming the route, then reverting (see "Good to know").
- `/term-5` — **Cadence / "One more before we wrap up," built**: the
  conditional bonus/make-up round (SPEC.md §2C), only reached when term 4
  decided the lesson wasn't perfect. Two stages in one route, same
  "no navigation between internal states" pattern as every term:
  - **"entry" stage** (Figma `13900:25415`) — the interstitial itself
    ("Woohoo! One more before we wrap up. You are doing great!", mascot
    wink). Reuses the *entry screen's* (`(recall)/page.tsx`) large
    glowing-hero mascot treatment verbatim, **including that screen's own
    still-unfixed `bg-black/40 blur-md` ellipse** (the raw-hardcoded-color
    issue already flagged and fixed on the *small* `MascotBubble`'s
    ellipse — see `components/mascot-bubble.tsx` below — was never
    retroactively applied to this larger, separate one on the entry
    screen). Deliberately copied as-is rather than fixed here: fixing it
    only on this new screen would create a new inconsistency between two
    now-different-looking hero-mascot moments; leaving both matching (and
    both still carrying the same known gap) was judged the smaller
    problem. If the entry screen's ellipse is ever tokenized, this one
    should be updated to match in the same pass, not separately.
    Same `mascot-glow`/`mascot-bob`/`mascot-drift` classes reused too,
    with a speech bubble *above* the mascot
    (a one-off hand-built shape, not the small side-by-side
    `MascotBubble` row) instead of plain heading text. Not wired through
    `useMascotBubble` while on this stage — same reasoning as the entry
    screen: bespoke local mascot, must explicitly clear the shared bubble
    (`useMascotBubble(null)`) so it doesn't also render. Skip here opens
    the same `SkipConfirmSheet` (last-term variant — Cadence is the
    absolute last term the session can reach) and confirming always goes
    to `/summary`.
  - **mic-loop stage** (Figma `13900:25338`, prompt "Last one for this
    set: what's Cadence?") — same simple unaided-pass shape as term-1/4.
    Scripted outcome is **correct on first attempt** (this task's own
    instruction). Continue on the correct-result sheet routes straight to
    `/summary` — this is the genuine end of the whole session, so unlike
    every other term there's no "next term" to wire.
  - **⚠ Flagged, resolved divergence from the literal brief:** the brief
    describing this feature originally said "One more" should review
    whichever of terms 1–4 had the worst outcome this session (a
    priority order: wrong → hinted-after-2 → hinted-after-1 → revealed →
    skipped), re-presented with rephrased/synonym'd copy — which would
    have required authoring 4 separate rephrased content variants (one
    per possible term) since the picked term is dynamic. The actual Figma
    node given for this screen (`13900:25338`) shows fixed Cadence
    content matching SPEC.md's own separate "Term 5 — Cadence" section
    word-for-word, not a rephrasing of any base term. Surfaced this
    conflict directly rather than guessing; Evelyn confirmed: **always
    show Cadence**. The priority-severity language in the brief still
    describes *whether* to trigger "one more" (i.e. was anything in 1–4
    imperfect) — term-4's routing decision implements that as a simple
    "were terms 1–3 all unaided" boolean, not a literal 5-tier priority
    engine, since content-selection was the only thing that needed the
    full ordering and that's now moot.
- **Text-fallback path — built across all 5 terms** ("I can't speak right
  now" pill and, on term-2/3's hint screens, the "Type instead" link both
  now really switch to a typed-answer flow instead of being placeholders).
  Architecture: `lib/term-attempt-state.ts`'s `useTermAttemptState` hook
  holds `attempt`/`outcome`/`inputMode`/`typedAnswer` **per term, shared
  between voice and text** — switching mode mid-term only changes how the
  *current* attempt is presented, it never resets or advances
  attempt/outcome (verified: a voice attempt that resolves "partial" and
  then switches to text on the retry gets the *next* scripted outcome,
  not a restart). New shared components: `components/text-input.tsx`
  (idle/typing/overflow states, custom 8px scroll thumb, Figma
  13965:32461/32459/32460), `components/text-fallback-body.tsx` (entering-
  answer/Sending/Checking, reusing the exact mic-flow Sending/Checking
  visuals via `components/mic-status-indicator.tsx`), and
  `components/mic-loop-bottom-bar.tsx` (`MicLoopBottomBar` — replaced 5
  duplicated local `BottomBar` functions; its pill flips between "I can't
  speak right now" and "Try with voice"). Per CLAUDE.md's own
  already-established rule, "Type instead" only lives on the hint-screen
  link (term-2/3), never relabels the idle-screen pill — confirmed against
  the Figma idle frames before building, not assumed. Term-3's "What I
  heard."/mishear-dispute link is voice-only and correctly hidden when the
  current attempt was typed (nothing was "heard" if typed).
- **`HighlightCard` (`components/highlight-card.tsx`) — general fix,
  covers "Picture this:", "What you wrote.", "What I heard."** Takes a
  `variant: "definition" | "transcript"` prop (transcript is the default —
  8 of 9 callers are that kind); title color, content size/weight, and
  border width all differ by variant per Figma's dev-mode data (title was
  previously hardcoded to the "definition" look for every caller, which
  was wrong for the far more common transcript usage). Padding 17px/gap
  4px, transcript content capped at max-height 145.25px with scroll. The
  border is Figma's hand-drawn brush-stroke artwork
  (`public/images/picture-this-box.svg`) applied via CSS **`border-image`
  (9-slice)**, not a stretched `<img>` — a stretched image (an earlier
  version of this component, and briefly a plain solid CSS border after
  that) either distorts the brush texture non-uniformly as the card grows
  taller (a long typed/heard answer visibly crossed the corner texture)
  or loses the hand-drawn look entirely (Figma's "sketch" stroke style
  isn't captured by dev-mode's plain CSS export). `border-image-slice`
  keeps the four corners a fixed size regardless of card height; only the
  straight edges stretch. The rendered border also had to be widened well
  past Figma's thin dev-mode line width (6.22px/2.073px) — that value
  only describes a plain fallback border, the brush texture is invisible
  at that thickness.
- **Root layout width/height — corrected** (`app/layout.tsx`). Content
  max-width is `404.28px` (was `390px` — didn't match the actual Figma
  canvas; searched the repo, this was the only place it was hardcoded).
  Real-device height is driven by `h-dvh` alone, **not** `h-full` +
  `min-h-dvh` stacked — the static `h-full` could size body taller than
  the actually-visible viewport once mobile browser chrome is accounted
  for, silently pushing `BottomCta` buttons below the fold on shorter
  devices with no way to scroll to them (reproduced at 667px height,
  fixed by adding `min-h-0` to every `flex-1` container in the chain from
  `body` down to each screen's own middle-content div, `overflow-y-auto`
  on that same div). A flex item's automatic minimum size only becomes 0
  when it itself has non-`visible` overflow — `min-h-0` alone without
  `overflow-y-auto`, or vice versa on the wrong element, doesn't fully
  contain the overflow at the intended level. Also added: a desktop-only
  phone-mockup frame (404.28×874.9px, gradient backdrop, fake status bar)
  gated behind `min-[500px]:` — confirmed absent at real device widths up
  to 430px, confirmed the frame renders at exactly the right size via
  `getBoundingClientRect()` (screenshots from the Preview tool are
  JPEG-compressed/rescaled and unreliable for judging exact proportions
  at wide viewports — measure, don't eyeball). The gradient specifically
  had to move from a Tailwind arbitrary-value class into a plain CSS rule
  in `globals.css` (`.desktop-frame-backdrop`) — Tailwind's bracket parser
  doesn't reliably handle the commas inside `radial-gradient()`'s argument
  list; the class was present in the DOM but silently produced no
  `background-image` at all.
- **`MicLoopBottomBar` padding fix** — the pill was `flex-1` but missing
  `min-w-0`, so its `whitespace-nowrap` label forced the button wider than
  its flex allotment on narrower viewports, overflowing past the
  container's right 29px padding (left stayed correctly padded — read as
  the whole row shifted right/off-center). Fixed with `min-w-0` on the
  button, `shrink-0` on the icon, `overflow-hidden text-ellipsis` on the
  label so it truncates gracefully instead of overflowing if this ever
  happens again.
- **`/streak`, `/recall-summary`, `/summary` — the end-of-session summary
  flow, built.** Branches on SPEC.md's locked 3-way rule (kept
  deliberately, not simplified away — confirmed with Evelyn since the
  build brief for this only described 2 paths): no term attempted
  ("Maybe later") and an all-typed session both skip straight from
  `/streak` to `/summary`'s simplified variant (Figma 13900:26571 — no
  RECALL stat tile, has a nudge line, "Share"/"Continue" buttons, *not*
  "Try again"/"Claim XP" — Figma genuinely doesn't give this screen a
  Try-again button); a voice-touched session detours through
  `/recall-summary` (per-term chips, Figma 13900:24948, re-fetched fresh
  since it had just been edited — its "Revealed" chip is purple/brand
  now, superseding SPEC.md's older "(coral)" text) first, then
  `/summary`'s full variant (13900:26505, has the RECALL tile). The
  branch decision reads from session context, not a query param:
  `lib/recall-flow-context.tsx` now also tracks `voiceUsedThisSession`
  (set imperatively the moment any term actually sends a voice take, via
  `recordVoiceUsed()` in each term's `sendRecording()`) and `TermId`
  gained `"cadence"` (term-5 previously never called
  `recordTermOutcome` at all — fixed, it's needed for the summary to be
  accurate). Per-term rows on `/recall-summary` are genuinely dynamic —
  built from real recorded `termOutcomes`, not the demo script — verified
  by skipping every term except one and confirming only that one row
  showed a non-"Skipped" chip. `lib/term-summary-data.ts` holds the
  per-term title/caption copy, sourced from the fresh Figma fetch. "Try
  again" (both `/recall-summary` and `/summary`'s full variant) is an
  explicit stub (`window.alert`, per instruction — recurring-flow UX
  isn't built this pass); "Claim XP" and the simplified variant's
  "Continue" both end the session by routing to `/`.
  - **Known gap:** the streak screen's flame icon (`components/`) is an
    empty placeholder sized to Figma's slot (13900:26440, 141×177) —
    isn't in `public/images` and Evelyn is supplying the asset herself
    rather than having one invented; wire it in once it lands.
  - **`CountUpNumber` (`components/count-up-number.tsx`) — mind this if
    you touch it:** an earlier version added a `useRef` "already started"
    guard around the `animate()` call meant to prevent double-starts.
    That guard instead broke it in development: React 18 Strict Mode
    double-invokes effects (mount → cleanup → mount again, effects only,
    the component instance doesn't actually remount), so the guard's
    `started.current` stayed `true` across the double-invoke, the
    cleanup's `controls.stop()` killed the animation, and the guard then
    blocked it from ever restarting — every count-up was silently stuck
    at 0 in dev only (production, without Strict Mode, would have been
    fine, which is what made this easy to miss). `animate()`'s own
    cleanup is already the correct way to handle Strict Mode here; don't
    add a second guard on top of it.
  - **Confetti is a deliberate exception to motion-guide.md's own "not
    confetti" / "no particle effects" lines** — both written before this
    request. `components/confetti-burst.tsx` keeps to that file's spirit
    otherwise (brief, once-only, transform/opacity only, respects
    reduced motion) rather than being a general license to add particle
    effects elsewhere.
  - Shared `SecondaryButton`'s `pillBase` is `w-full`, which only works
    when a button is alone or stacked vertically — every "small pill +
    wide pill" row built this session (`streak`'s Share+Continue,
    `recall-summary`/`summary`'s Try again+Continue/Claim XP) hand-rolls
    the small button locally instead, same workaround the *original*
    Result-sheet Why?/Continue pairs already used. If you add a new
    side-by-side row, don't reach for `SecondaryButton` there.
- **Streak icon wired** — `/streak`'s flame icon (previously an empty
  placeholder, see the old "Known gap" note) now renders
  `public/images/streak.svg` (142×178, matches Figma's slot `13900:26440`,
  141×177).
- **App bar (X + progress bar + streak chip) removed from every
  summary-path screen** — `(recall)/layout.tsx` now only renders `TopBar`
  when `currentStep !== null`. `/streak`, `/recall-summary`, and
  `/summary` already registered `currentStep: null` (previously that only
  hid the progress bar, per `useRecallStep`'s own doc comment); this one
  check is what fully removes the whole bar from all three without
  touching any real term/recall screen, which always registers a real
  step number.
- **No-recall `/summary` buttons wired + stat-tile images (both
  variants).** Simplified/no-recall variant's buttons are "Try voice"
  (→ `/`, the first-time entry fork — this student hasn't done the recall
  loop yet) / "Claim XP" (→ `/`, ends the session; no further screen
  exists yet in this prototype). Its Score value was corrected to `7/10`
  (was a stale `10/10` mismatch against the real Figma frame).
  Every stat tile on both `/summary` variants (XP/Score/Blazing/Recall)
  now uses the real exported box images
  (`public/images/{xp,score,blazing,recall}-summary-with(out)-recall.svg`
  — note `xp-summary-without-recall.svg.svg` and
  `blazing-summary-without-recall.svg.svg` really do have that doubled
  extension on disk, use the exact filename) instead of a hand-rolled
  Tailwind border+icon box — each image bakes its own label+border+icon
  as one flattened composite (Figma's dev-mode export flattens text to
  outlined paths). Two small components in `summary/page.tsx`: `StatImage`
  (a pure drop-in, for tiles whose value can never diverge from the
  baked sample — Score/Blazing on both variants, XP on the no-recall
  variant) and `StatImageWithValue` (the image supplies box/label/icon
  chrome only; an opaque patch — `bg-background-page`, matching the
  inner rect's own fill exactly — covers the baked sample glyphs, with
  the real live value rendered on top in the same spot) for the two
  tiles that genuinely are dynamic: XP on the with-recall variant (the
  zeroing case below) and RECALL (always computed for real). The
  no-recall variant is a single row of 3 (its own narrower assets,
  `flex`, not the with-recall variant's `grid-cols-2`), matching Figma.
  Copy also fixed to match the current Figma frame: the subheading is
  now "I'll be here if you wanna explain it out loud too, I'll be fun
  too" (the old separate duplicate nudge line below the stats was
  removed — Figma only shows this text once).
- **Background gradient leak fixed** (`app/layout.tsx`). The phone-frame
  div (the actual app-content boundary) had no background of its own, so
  `body`'s `.desktop-frame-backdrop` radial gradient — meant to be
  desktop-only decoration visible *around* the phone frame — was bleeding
  straight through into real screen content on wide viewports. Fixed by
  adding `bg-background-page` explicitly to that div. The gradient now
  only ever shows in the margin around the frame; every screen defaults
  to `background/page`, and per-screen overrides (`/streak`'s own
  `bg-coral-bold`, etc.) still correctly paint over it, unaffected.
- **Recall-step exit/routing edge cases resolved** — three related
  signals in `lib/recall-flow-context.tsx` now decide which summary path
  (and which stat values) a session lands on:
  - `recallAttempted` (`useRecordRecallAttempted`/`useRecallAttempted`) —
    was at least one REAL attempt (voice or text) ever *submitted* this
    session, set at send-time, independent of whether that term's outcome
    was ever confirmed via Continue.
  - Combined with `termOutcomes` being non-empty (an outcome confirmed, or
    a term explicitly skipped), this is "did the session ever really
    engage with the recall step at all" — the deciding factor throughout:
    zero interaction → no-recall summary path (`/summary` simplified);
    any real attempt or explicit skip → recall-summary path
    (`/streak` → `/recall-summary` → `/summary` full), with every
    unreached term backfilled as "Skipped" via
    `fillRemainingTermsAsSkipped()` (`BASE_TERM_IDS`-scoped, never
    cadence).
  - Recall-specific XP (`RECALL_XP_EARNED`, `lib/term-summary-data.ts`) is
    0 whenever the session engaged with recall ONLY via explicit skips
    (zero real attempts) — on `/recall-summary` directly, and on
    `/summary`'s combined XP tile only the recall *component* zeroes out
    (150 → 50), never the whole combined total.
- **`/confidence-recurring` — the merged entry+confidence-tap for a
  RETURNING/recurring student, built** (SPEC.md §2B; Figma nodes
  `13900:24834` unselected / `13900:25674` selected). The only entry
  point into `/term-1` for a returning session — no mic-permission primer
  step at all (SPEC.md: a returning student is assumed already granted).
  Reuses the small shared `MascotBubble` row (not the first-time entry
  screen's big hero-mascot treatment), `HighlightCard`, `SelectableButton`,
  `PrimaryButton`/`IconButton`/`TextLinkButton` — no new UI pattern
  invented. Its `HighlightCard` copy differs slightly from the first-time
  entry screen's own ("...4 terms for the exam." vs "...4 terms.") —
  confirmed against Figma, not a copy-paste oversight. Bottom row:
  skip-forward icon (opens the shared exit-confirmation sheet, same as
  `X`) + "Let's go!" (disabled until an option is picked, routes to
  `/term-1`) + "Type instead" (visible, an explicit non-functional stub
  this pass — SPEC.md §2B says this screen has no term-level
  Skip/Type-instead/Continue of its own, those belong to `/term-1`'s own
  idle state).
  - Reached exclusively via "Try again" on `/recall-summary` or
    `/summary` (full variant) — both call `useResetRecallSession()`
    (clears `termOutcomes`/`voiceUsedThisSession`/`recallAttempted`,
    deliberately preserves `micPermissionGranted`) right before routing,
    **except** when every term in the just-finished session was
    "skipped" (nothing was ever really attempted) — that specific case
    routes to `/` instead (the first-time entry fork, mic primer included
    if not already granted), not the merged recurring screen.
- **Per-term-summary + result-sheet icons swapped to the real exported
  assets.** `components/term-result-row.tsx`'s per-outcome chip icons (on
  `/recall-summary`) now use
  `public/images/per-term-summary-on-{your-own,with-hint,revealed,skipped}.svg`
  (each baking its own color) instead of the old inline `CheckCircleIcon`/
  `WaveIcon`/`AlertTriangleIcon`/`SkipForwardIcon` components. Every
  term's own Result/wrong/reveal bottom-sheet header icon ("Exactly
  right"/"Almost there!"/"You are closer!"/"We'll do it next time!")
  similarly swapped to
  `public/images/{correct,partial-correct,incorrect,revealed}-answer-icon.svg`.
  Since the new assets bake their own color, the old `text-*`
  currentColor wrapper classes were dropped at each call site.
  `public/images/per-term-summary-on-wrong.svg` was also delivered but
  is intentionally unused (no `TermOutcome` maps to "wrong" as a final
  state — it's an internal per-attempt stage, not a summary outcome).
- **The real soft exit-confirmation bottom sheet, finally built**
  (SPEC.md §2E; `components/exit-confirm-sheet.tsx`, `ExitConfirmSheet` —
  Figma nodes `13965:41377` "first-time"/not-yet-attempted variant,
  `13965:41416` "in-progress"/already-engaged variant). Every exit
  trigger across the whole flow — `X` on the entry fork, `X` on
  `/confidence`, `X` + the skip-forward icon on `/confidence-recurring`,
  `X` on every term at every stage (recording, hint, reveal, text
  fallback, all of it), and "Maybe later" — now calls the exact same
  `useRequestExit()`; none of them navigate directly anymore. This is a
  single shared exit-intent handler, not duplicated logic per screen: it
  **removed** the per-term `onExit` logic each of term-1 through term-5
  used to carry independently (each recomputing the same
  hasInteracted/backfill/navigate) — every term's `onExit` is now just
  `requestExit`.
  - `(recall)/layout.tsx` renders the ONE sheet instance and owns the
    actual "Leave" logic: computes `hasInteracted` (same
    `recallAttempted`/`termOutcomes`-non-empty check the summary flow
    already uses) to pick the sheet's variant (`"first-time"`: mascot
    `dont-leave`, "You got this!" / `"in-progress"`: mascot `laughing`,
    "Almost there!"), backfills remaining terms as skipped via
    `fillRemainingTermsAsSkipped()` if engaged, then routes to
    `/streak`.
  - "Keep learning" (or tapping the scrim) just closes the boolean
    overlay (`cancelExit()`) — confirmed via testing that dismissing it
    mid-"Sending" resumes the exact same in-flight timers untouched;
    nothing about the underlying screen's own state ever changes while
    the sheet is up, same reasoning `SkipConfirmSheet` already
    established.
  - Blur now wraps `TopBar` + `MascotBubble` + `{children}` together as
    one group (a new wrapper one level up from the pre-existing
    `chromeBlurred` one, which only ever covered `TopBar` for the
    mic-permission dialog's own narrower blur) — same
    `blur-[10px]`/`bg-background-scrim` treatment as the mic-permission
    dialog, just scoped wider since this modal can be triggered from any
    screen.
- **Per-term-summary caption truncation fixed + second-session
  comparison captions added.** `TermResultRow`'s caption line no longer
  truncates — switched from `truncate` (single-line ellipsis) to
  `line-clamp-2`, and the row switched from a fixed `h-[58px]` to
  `min-h-[58px]` so it grows to fit a wrapped 2-line caption instead of
  clipping it.
  - For a returning student, `getTermSummaryCaption` (in
    `lib/term-summary-data.ts`) now also takes an optional
    `previousOutcome` — `resetRecallSession()` snapshots the outgoing
    `termOutcomes` into a new `previousSessionOutcomes` context field
    (one-session-back memory only, not deeper history) right before
    clearing for the new attempt. Whenever this session's outcome is
    `"unaided"` and a prior, non-`"unaided"` outcome exists for that same
    term, the caption swaps to an authored comparison line ("Nice! Last
    time you needed a hint.") instead of the sourced/first-time
    recommendation; any other combination (no prior data for that term,
    or this session still needed help too) is unchanged from before.
    Deliberately narrow in scope — only fires on "current = unaided +
    prior = worse than unaided" — regression/no-change combinations
    weren't asked for and would need invented tone-sensitive copy, so
    they intentionally keep today's existing caption.

Shared infrastructure (all under `src/`):
- `app/(recall)/layout.tsx` + `lib/recall-flow-context.tsx` — the
  persistent chrome. `TopBar` lives in the layout, not in each screen, so
  it survives route changes and animates step-to-step instead of
  remounting at a snapped value. A screen registers itself once via
  `useRecallStep({ currentStep, totalSteps, onExit })`; `currentStep: null`
  hides the bar (for the summary). A screen blurs the whole chrome (e.g.
  for its own modal) via `useRecallChromeBlur(boolean)`.
  - Both hooks patch context state with a **functional updater**
    (`setValue(prev => ({...prev, ...patch}))`), not a value captured at
    render time — two hooks patching the same render's stale snapshot is
    what caused the progress bar to silently vanish the first time this
    was built. Keep patching this way if you extend the context.
  - `useRecallChromeBlur` resets to `false` on unmount — without that,
    navigating away while a screen's own dialog is open leaves the next
    screen's chrome permanently blurred.
  - **`MascotBubble` now renders once in the layout too** (same pattern as
    `TopBar`), driven by a `mascot` context value a screen sets via
    `useMascotBubble({ pose, alt, text, dimmed })`; `null` means "don't
    show it" — the entry screen and `/summary` must explicitly pass `null`
    so they don't inherit whatever the previous screen left behind (the
    context is deliberately *not* reset on a screen's unmount, unlike
    `chromeBlurred` — see below for why). This is what lets pose/text
    crossfade across a route change (e.g. confidence → term-1) instead of
    the block unmounting and a fresh one snapping in with no transition —
    the original symptom this fixed. The block itself is wrapped in
    `AnimatePresence` in the layout so its own mount/unmount (not just
    value changes within an already-mounted instance) also fades in/out —
    without this, going from a screen with no bubble (entry) to one with
    it (confidence) popped the block in at full opacity with zero
    animation; confirmed via `getAnimations()` inspection, not just a
    screenshot (a screenshot at settled state looks identical whether or
    not the entrance actually animated).
  - **`useMascotBubble` does not reset on unmount** — unlike
    `chromeBlurred`, the outgoing screen's value should keep showing until
    the incoming screen's own effect overwrites it, so the crossfade has
    something to animate *from*. Resetting on unmount here would
    reintroduce the flash-to-empty this was built to avoid.
  - **`termOutcomes` session-tracking**: a `Partial<Record<TermId,
    TermOutcome>>` in the same context (`TermId` = `"note" |
    "time-signature" | "tempo" | "syncopation" | "cadence"`; `TermOutcome`
    = `"unaided" | "hinted" | "revealed" | "skipped"`). Added specifically
    so term 4 can answer "was the lesson perfect so far?" without each
    term needing to know about any other. A screen calls
    `useRecordTermOutcome()` (returns a stable function) **imperatively**,
    once, at the exact moment it resolves — inside a Continue/skip-confirm
    onClick, never inside a `useEffect` like `useRecallStep`/
    `useMascotBubble` are, since recording an outcome is a one-time event,
    not a per-render "here's my current value" sync. `useTermOutcomes()`
    gives read-only access to the whole snapshot. The merge uses its own
    `setValue(prev => ({...prev, termOutcomes: {...prev.termOutcomes,
    [termId]: outcome}}))` inside the provider (not the generic `patch`),
    since it's merging one key into a *nested* object, one level deeper
    than what `patch`'s top-level spread handles.
  - **`micPermissionGranted`** (`useMicPermissionGranted`/
    `useSetMicPermissionGranted`) — the mocked OS mic-permission decision,
    false by default (covers both an explicit "Don't Allow" and never
    having seen the primer at all, e.g. "Type instead"). Every term reads
    this to pick its own starting `inputMode` (`useTermAttemptState` now
    takes an optional initial-mode arg) and re-checks it before switching
    text→voice mid-term, re-showing the mocked `IosPermissionDialog`
    locally (each term owns its own `micPermissionPromptOpen` state +
    blur/scrim, reusing the entry screen's exact pattern) rather than
    silently switching without real permission.
  - **`recallAttempted`** (`useRecordRecallAttempted`/`useRecallAttempted`)
    — was at least one real attempt (voice or text) ever *submitted* this
    session, set at send-time (before Continue), regardless of whether
    that term's outcome was later confirmed. Combined with `termOutcomes`
    non-empty, this is the one signal used everywhere a screen needs to
    know "did the session ever really engage with the recall step at
    all" — see the exit-confirmation-sheet and edge-case-routing bullets
    above.
  - **`fillRemainingTermsAsSkipped()`** — backfills every `BASE_TERM_IDS`
    entry (never cadence, which is conditional and simply never happens
    if the session ends early) that doesn't have a recorded outcome yet
    to `"skipped"`. Called once by `(recall)/layout.tsx`'s shared "Leave"
    handler, only when `hasInteracted` is true.
  - **`previousSessionOutcomes`** (`usePreviousSessionOutcomes`) — a
    one-session-back (not deeper) snapshot of the prior session's
    `termOutcomes`, captured by `resetRecallSession()` right before it
    clears `termOutcomes` for a new attempt. `/recall-summary` reads this
    to show a comparison caption instead of the sourced one for a term
    with prior data — see the dedicated bullet above.
  - **`resetRecallSession()`** (`useResetRecallSession`) — called once by
    a "Try again" handler right before routing into a new session (either
    `/confidence-recurring`, or `/` if every term was skipped last time).
    Clears `termOutcomes`/`voiceUsedThisSession`/`recallAttempted` back to
    defaults; deliberately does NOT touch `micPermissionGranted` (SPEC.md
    §2B: a returning student's prior grant must carry over, never
    re-asked).
  - **`exitConfirmOpen`** (`useRequestExit`/`useCancelExit`) — the one
    shared exit-intent flag; see the exit-confirmation-sheet bullet above
    for the full mechanism. `requestExit()` is what every screen's own
    `onExit`/skip-icon now points at instead of navigating directly.
- `components/top-bar.tsx` — track+fill progress bar (16px, real `%`
  width via `currentStep/totalSteps`, animated with a `scaleX` transform
  on a spring, not by animating `width` — motion-guide.md says never
  animate `width`/`height` directly), exit button, streak chip (uses
  `public/images/streak-ray.svg`, not a hand-drawn icon).
- `components/buttons.tsx` — `PrimaryButton` (disabled state swaps to
  `background/surface` + `text/disabled`, not just dimmed opacity),
  `SecondaryButton`, `SelectableButton` (the MCQ/confidence-tap option
  pill — selected state is `accent/brand/subtle` bg + `accent/brand/bold`
  text), `IconButton`, `TextLinkButton`. **Typography lives on each
  variant, not on the shared base** — a shared `text-[21px]` in the base
  once silently beat a variant's own `text-[18px]` because both set the
  same CSS property; verify with computed-style inspection, not just a
  screenshot, if you add a new variant.
- `components/mascot-bubble.tsx` — the small avatar + shadow-ellipse +
  tail + speech-bubble row (design.md's documented pattern), rendered
  once by the shared layout (see above) and reused for every term-loop
  screen and confidence tap. One shared component, so a fix here is a
  global fix — don't patch this per-screen.
  - **Pose swaps now crossfade — this reverses an earlier, explicit
    decision.** The original build made pose swaps instant/no-animation
    on purpose (matching the mic button's "state change, not the thing
    appearing/disappearing" treatment). Evelyn later asked for the
    opposite for this component specifically: both pose and text should
    crossfade smoothly, matching motion-guide.md, not snap. Confirmed via
    `getAnimations()` inspection (not just screenshots — `element.style.
    opacity` reads stale for WAAPI-accelerated animations, a real trap hit
    while diagnosing this, see "Good to know") that this is a genuinely
    running animation, not a static end-state that happens to look the
    same as a snap. If mic-button-style instant swaps are ever wanted
    again elsewhere, that's a *different*, separately-confirmed decision
    — don't assume this component's old behavior still applies.
  - Avatar sits in a fixed 70×70 box. Both the outgoing and incoming pose
    render `absolute inset-0` inside that box during the crossfade (same
    box, same size, so the crossfade itself never causes a layout shift),
    with the image layer at `z-10` so it reliably paints above the
    ellipse regardless of DOM order.
  - **The avatar box itself needs its own `layout` prop, even though its
    own size/position never intentionally changes.** It's a sibling of
    the bubble inside a `layout`-animated row, and when the bubble
    resizes (new/longer/shorter text), Framer projects a FLIP transform
    onto the row to fake the resize smoothly — a transform that visually
    stretches/squishes any child that isn't independently layout-tracked.
    Confirmed live: without `layout` on the avatar box, the row hit
    `scaleY(1.47)` mid-transition and the avatar visibly warped with it —
    reading as "the whole bubble" animating instead of just the text.
    Adding `layout` there makes Motion projected-animate the box on its
    own (a clean position shift only); confirmed afterward that
    `rowScale × avatarScale ≈ 1.0` at every sampled frame, i.e. the
    avatar's own counter-transform exactly cancels the parent's
    distortion. General lesson if new elements are added inside this row:
    any child of a `layout`-animating parent that must *not* visually
    distort also needs `layout`, not just the element whose size is
    actually changing.
  - Shadow ellipse is `bg-background-stacking`, no blur, positioned
    `bottom-0` inside the avatar box (behind the mascot in paint order,
    not overlapping the face) — was previously `bg-black/40 blur-[3px]`
    (a raw hardcoded color) *and* rendering on top of the mascot, both
    flagged and fixed. It's a true flat ellipse — **`w-[61px] h-[11px]
    rounded-[50%]`, not `rounded-full`**: at this aspect ratio a fixed
    pixel radius (`rounded-full`) gets clamped into a stadium/pill shape
    with straight top/bottom edges (reads as a rounded rectangle);
    percentage radius on both axes is what makes each corner's own
    ellipse combine into one true ellipse. Must stay a real rendered
    shape (a div, not a pre-rendered image) so it stays token-driven;
    don't export it as a `public/images` asset even if that seems easier.
  - When the bubble's *text* changes length, the bubble resizes smoothly
    instead of snapping: the row and the bubble both carry Motion's
    `layout`, and the text swap uses `AnimatePresence mode="popLayout"`
    (not `mode="wait"`) so the outgoing line is pulled out of flow the
    instant it exits, letting the incoming line's height drive the resize
    immediately rather than the bubble collapsing to empty first.
  - The tail (the small rotated square pointing at the mascot) is at
    `-left-0.5`, not `-left-1.5` — at 12px pre-rotation, a 45° tail's
    bounding box widens to ~17px, so the original `-left-1.5` (-6px) put
    its rotated corner almost exactly where the mascot's artwork ends
    (mascot SVGs fill their box to within ~1px on every side — confirmed
    by a pixel-level canvas scan, not just eyeballing it). The row's
    `gap-2` (8px) box spacing was always correct; the tail was silently
    eating nearly all of it, reading as the mascot and bubble touching.
    If the gap looks wrong again, check the tail's offset before touching
    `gap-2` — the box gap and the tail's own offset are two separate
    numbers that both affect the visible clearance.
  - Accepts an optional `dimmed` prop — animates the whole row's opacity
    to 0.5 (via Motion, not a hard class swap, so dimming/undimming also
    crossfades) rather than requiring a caller-side wrapper div. Used for
    the "echoed question" bubble on every term's Result screen, and for
    term-3's wrong-reply bubble once a hint has been shown (see `/term-3`
    above).
- `components/bottom-cta.tsx` — the shared `BottomCta` wrapper for every
  screen's docked bottom button row (design.md's "bottomCta" pattern):
  `p-700` (29px on all four sides — see `--spacing-700` in
  `globals.css`, a real custom token since 29 doesn't land on Tailwind's
  default 4px-multiple scale) and nothing else; callers own their own
  internal row/column layout via `className`. Used by the entry screen's
  button stack, confidence's Continue button, term-1's `BottomBar`, and
  term-1's Result-sheet button row. **The bottomCta div must be a sibling
  of the screen's padded content wrapper, not nested inside it** — nest
  it and its own `p-700` compounds with the content wrapper's `px-4`,
  double-padding one side. If you add a new screen with a bottom button
  row, structure it like term-1/confidence: an outer plain flex column,
  containing the `px-4 pt-6` content div and `<BottomCta>` as two
  siblings, not one wrapping the other.
- `components/skip-confirm-sheet.tsx` — the reusable soft skip-
  confirmation bottom sheet (Figma: general-case `13900:25459`, last-term
  `13900:25446`), first built for term-4/5 then retrofitted onto
  term-1/2/3 (see below). Two copy variants via a `variant` prop:
  `"default"` ("We can review this one later no worries!" — any non-last
  term) and `"last-term"` ("Maybe next time!" — term 4 and term 5/Cadence,
  the two terms that can end the base sequence). No icon, no like/dislike
  reactions (unlike the Result sheets) — heading + "Skip"/"I changed my
  mind" only, matching the Figma frames exactly. `open` is a **boolean
  overlay, not a stage/route change** — the caller's own state machine
  never transitions when the sheet opens, so "I changed my mind" always
  returns to exactly the state the student was already in (there's
  nothing to restore; nothing ever left it). The scrim
  (`bg-background-scrim`, a real design.md token) doubles as the "dim the
  mic UI behind the sheet" treatment visible in the Figma "on screen"
  mockup — not a separate blur mechanism.
  - **Every term needed retrofitting, not just term-4/5.** Terms 1–3
    initially had skip navigate immediately with no confirmation at all
    (built before this pattern existed) — a follow-up fix wired the sheet
    onto all five terms' skip icons. Term-2 and term-3 each have **two**
    skip entry points, not one: the main mic-loop `BottomBar`'s icon, and
    a second, separate skip icon inside their own "hint" stage's bottom
    bar — both needed the same fix (open the sheet, don't navigate
    directly), confirmed by testing each one individually rather than
    assuming the fix in one spot covered both.
  - The actual skip logic (record the term's outcome, `router.push` to
    the next screen) stays each term's own local `handleSkip` — the sheet
    only ever calls that function as its `onSkip` confirm handler; the
    icon buttons that used to call `handleSkip` directly now just open
    the sheet (`() => setSkipConfirmOpen(true)`).
- `components/exit-confirm-sheet.tsx` — the reusable soft
  exit-confirmation bottom sheet (SPEC.md §2E; Figma `13965:41377`
  first-time / `13965:41416` in-progress), rendered ONCE by
  `(recall)/layout.tsx` (not per-screen, unlike `SkipConfirmSheet`) since
  every exit trigger across the whole app shares this one instance — see
  "Current build status" above for the full mechanism
  (`requestExit`/`cancelExit`/`hasInteracted`-driven variant). Same
  boolean-overlay, scrim+slide-up pattern as `SkipConfirmSheet`
  (`bg-background-scrim`, the shared `sheet` transition), plus a
  layout-level blur wrapping `TopBar`+`MascotBubble`+`{children}` as one
  group. Props: `open`, `variant: "first-time" | "in-progress"`,
  `onKeepLearning`, `onLeave` — reuses `MascotImage`, `BottomCta`,
  `PrimaryButton`/`SecondaryButton` directly, no new button markup.
- `components/highlight-card.tsx` — the "Picture this:" / "What you
  wrote."/"What I heard." card. Border is `public/images/picture-this-box.svg`
  (real hand-drawn asset), applied via CSS `border-image` (9-slice, not a
  stretched `<img>`) so it scales cleanly at any card height — see
  "Current build status" above for the full rationale and the variant
  prop (`"definition" | "transcript"`, padding/gap/typography/scroll
  details).
- `components/mascot-image.tsx`, `components/icons.tsx` (inline SVG,
  hand-written — generic UI glyphs aren't in `public/images`, only mascot/
  mic-state art is), `components/ios-permission-dialog.tsx`.
- `lib/motion.ts` — the four shared transition presets from
  motion-guide.md (`gentle`/`snappy`/`sheet`/`soft`). Reuse these; don't
  add new ones without checking motion-guide.md first.
- Text-fallback path — `lib/term-attempt-state.ts` (`useTermAttemptState`,
  the shared per-term attempt/outcome/inputMode/typedAnswer hook),
  `components/text-input.tsx`, `components/text-fallback-body.tsx`,
  `components/mic-status-indicator.tsx`, `components/mic-loop-bottom-bar.tsx`
  — see "Current build status" above.
- End-of-session summary flow — `components/term-result-row.tsx`,
  `components/count-up-number.tsx`, `components/confetti-burst.tsx`,
  `lib/term-summary-data.ts` — see "Current build status" above, plus the
  `CountUpNumber`/confetti-specific gotchas noted there.

## Always
- Build the states my committed flow needs (from Module 3). At minimum
  the core loop reads clearly: idle → recording → processing → result.
- Keep the can't-speak text fallback reachable in one tap on every recall
  screen — voice is primary, text is an explicit fallback, never the
  default.
- Never let the student get trapped, and never make the step hard-gated —
  soft-gated only.
- Make the summary point to a next step (repeat missed terms, re-test
  later, cross-session callback), not just a score.
- Keep the confidence tap where it's locked (pre-session, three-tier,
  "So-so" as the middle option) — it's a pre-registered prediction and
  can't be repositioned, merged into the entry fork, or removed.
- Wrong-answer and so-so loops are distinct paths with the same
  mechanical hint ladder but different tone — don't collapse them.
- Any social/community element stays a single passive, anonymous signal
  on the summary screen, and only if Harry has signed off — otherwise
  leave it out entirely.
- Reuse a pattern from the design system before inventing one — check
  `src/components/` before writing a new one; see "Current build status".
- Before building a screen, fetch its Figma node (via the Figma MCP tools
  or the `build-screen` skill) and match its layout and feel — there is no
  local `reference/` folder in this repo; the Figma file is the reference.
- **"I can't speak right now" and "Type instead" are not interchangeable
  labels for the same button — they're two different copy strings for two
  different UI spots, and neither ever swaps into the other's spot:**
  - "I can't speak right now" — always, unconditionally, on every term's
    main skip-icon-button + pill combo (the standard mic-loop bottom bar).
    Never swaps to "Type instead" here, no matter how many attempts the
    student has made on that term.
  - "Type instead" — only on (a) the entry screen's own secondary button,
    and (b) the small text-link at the bottom of a hint screen (term-2/3).
    An earlier pass had the mic-loop pill swap to "Type instead" after a
    term's first attempt (per an early reading of SPEC.md §3's Idle-state
    description) — that swap was removed after Evelyn corrected it; don't
    reintroduce attempt-based or "has tried voice once" label-swapping on
    that pill.

## Never
- Never style with raw hex or inline styles.
- Never build the whole app or every edge state. Build my core flow well.
- Never change screens or styles I didn't ask you to touch. Fix only what
  I name.
- Never add open Q&A branching, or an entry point into Voice Recall from
  outside the Exam Plan — v1 is Exam Plan only.
- Never skip the mic permission consideration silently — if a screen
  touches permission priming, treat it as a real decision (iOS denials
  can't be re-prompted), not a detail to smooth over.

## Hard constraints (do not violate)

From the spec's "Constraints — do NOT build" section:
- No open Q&A/tutoring — the feature is recall-only, never answers student questions.
- No entry points outside the Exam Plan in v1 (no home-page pill, no post-quiz entry, no standalone chat mode).
- No voice output ever — text-only responses, no TTS.
- No auto-endpointing — push-to-talk only; explicit stop = send.
- Never blocking — skip/exit must always be reachable in one tap.
- Community/social signal is capped at one passive, anonymous element on the summary screen, and is unshipped until sign-off from Harry.
- Out of scope this sprint: pause/resume into one take, mid-answer language switching, mic-hardware-busy handling.


## Where things live (point, don't paste)
- feedback.md — Evelyn's prioritized fix-list from user testing (Module 5
  → Module 6). **Read this before making fixes** — it's the actual work
  queue, not background reading. When asked to fix something, change what
  it lists and nothing beyond that; anything it doesn't flag (or that
  testers confirmed working) stays as-is, protected from incidental
  "while I'm in there" changes.
- SPEC.md — the build plan; wins over sprint-context.md for anything
  sprint-context.md marked as an open question (see "Working with
  sprint-context.md and SPEC.md" above)
- sprint-context.md — the "why" behind SPEC.md's decisions, and any
  constraint that isn't a resolved-open-question
- Product_brief_-_Voice_Active_Recall.md — original brief, authority on
  constraints and non-goals
- Voice_UX_Reference.md — voice-specific UX principles (mic permission
  behavior, etc.)
- [Figma — Yummy__Knowie---Evelyn](https://www.figma.com/design/czYYTmUKwJFFmqiQ669i4t/Yummy__Knowie---Evelyn?node-id=13499-3646) — **canonical source of truth for flow/screen designs**, specifically the "Full Flow ✅ ready for claude" page (node `13499:3646`). `design.md` was extracted from it; `SPEC.md`'s screen sequence and script were read directly off it. If a flow question comes up that isn't answered in `design.md` or `SPEC.md`, go back to this file rather than guessing — don't rely on `voice-recall-flow-spec-figma.html`, which isn't present in this repo.
- prototype-rules.md — the source of truth for making this feel like a
  real phone app, plus the recall loop itself: how the AI is mocked, the
  voice states, and the can't-speak fallback
- motion-guide.md — the motion toolkit: animate with the Motion library
  (motion/react), not hand-coded transitions; has reusable presets and
  ready-made recipes for each moment in the recall flow, plus rules for
  what NOT to animate so it stays native-feeling, not flashy
- There is no `reference/` folder — it was planned but never populated.
  Use the Figma file directly (link above) for every screen's reference,
  the same way the `build-screen` skill does.
- `.claude/skills/build-screen/SKILL.md` — invoke via the Skill tool
  (`/build-screen` or naming it) to build one screen end-to-end: read
  SPEC.md + design.md, fetch the Figma node I give you, build, screenshot,
  compare, iterate until it matches. Note: a skill created mid-session
  doesn't register until the *next* session — if invoking it returns
  "Unknown skill," just follow SKILL.md's steps directly instead of
  retrying the tool call.
- `.claude/agents/design-reviewer.md` — a review-only subagent (Read/Grep/
  Glob/Bash + Figma screenshot) to sanity-check a screen against SPEC.md,
  design.md, and its Figma frame after it's built. Same mid-session
  registration caveat as above.
- public/images — mascot (Knowie/Noe), mic-state, and summary/result-icon art. Complete current list:
  - blazing-summary-with-recall.svg
  - blazing-summary-without-recall.svg.svg *(yes, doubled extension — that's the real filename on disk, not a typo to fix)*
  - checking-it-mic.svg
  - correct-answer-icon.svg
  - disabled-mic.svg
  - hearing-back-mic.svg
  - idle-mic.svg
  - incorrect-answer-icon.svg
  - knowie-amazed.svg
  - knowie-angry.svg
  - knowie-approving.svg
  - knowie-confused.svg
  - knowie-cool.svg
  - knowie-dazed.svg
  - knowie-determined.svg
  - knowie-dont-leave.svg
  - knowie-excited.svg
  - knowie-giggling.svg
  - knowie-happy.svg
  - knowie-laughing.svg
  - knowie-listening.svg
  - knowie-overit.svg
  - knowie-questioning.svg
  - knowie-reading.svg
  - knowie-sad.svg
  - knowie-standby.svg
  - knowie-thinking-less-judge.svg
  - knowie-thinking.svg
  - partial-correct-answer-icon.svg
  - paused-mic.svg
  - per-term-summary-on-revealed.svg
  - per-term-summary-on-skipped.svg
  - per-term-summary-on-with-hint.svg
  - per-term-summary-on-wrong.svg *(delivered but intentionally unused — no `TermOutcome` maps to "wrong" as a final state)*
  - per-term-summary-on-your-own.svg
  - recall-summary-with-recall.svg
  - recording-mic.svg
  - revealed-answer-icon.svg
  - score-summary-with-recall.svg
  - score-summary-without-recall.svg
  - sending-mic.svg
  - streak.svg
  - xp-summary-with-recall.svg
  - xp-summary-without-recall.svg.svg *(doubled extension, same as blazing's — real filename)*

  public/images is the ONLY valid image source for this prototype. Reference every image as
  /images/[filename], matching the exact filenames listed above. Never use placeholder
  services, external URLs, or invented paths. If a screen needs a mascot pose or icon that
  isn't in this list, stop and ask — don't guess a filename or substitute a different one
  silently.

## Definition of done
- Matches my Figma frames. Uses design tokens + Inter Variable; dark mode.
- Core voice loop is tappable and legible; can't-speak fallback works;
  summary points to a next step. Builds clean and deploys to Vercel.

## Good to know
- Module boundaries are tracked precisely — don't relabel or reassign a
  deliverable to a different module without checking with me first.
- "Considered and rejected" options should stay visible with rationale in
  docs, not get deleted, even once we've moved on.
- Push back on weak reasoning and surface brief conflicts explicitly —
  don't quietly work around them.
- **Stale Turbopack cache is a real, recurring failure mode.** If a code
  change doesn't seem to apply — a CSS rule silently missing from the
  compiled output, an animation that never runs — don't assume the code
  is wrong before ruling this out: stop the dev server, `rm -rf .next`,
  restart. This has happened more than once in this project specifically.
- **Figma's dev-mode layer *names* are not reliable pose/state labels.**
  A layer named "excited" turned out to render the exact same asset hash
  as a layer named "standby" elsewhere in the same file — trust the
  rendered pixels (screenshot or asset-hash comparison), not the label,
  when picking which local mascot file to use.
- **When verifying a color/spacing/size token match, inspect computed
  styles, not just a screenshot.** A screenshot can look right while the
  underlying value is wrong (or vice versa). The mascot-bubble tail bug
  (see `components/mascot-bubble.tsx` above) only surfaced by measuring
  actual rendered pixel bounds via canvas — the
  flex `gap` was already correct at 8px, and no amount of reading the
  className would have shown that the tail's *rotated* bounding box was
  the actual culprit. Use the Preview tool's inspect/eval to read real
  computed CSS and rendered geometry before calling a visual match
  confirmed, especially for anything rotated, absolutely positioned, or
  layered.
- When two effects/hooks can both patch the same shared state in one
  render (e.g. two `useEffect`s both calling a context setter on mount),
  use a functional state updater, not a value closed over from render —
  see `recall-flow-context.tsx` for why and the fix.
- **The Preview tool's browser tab persists state across unrelated
  navigations within a session** — a `preview_click`/`preview_eval` can
  silently land on a stale route or mid-flow state left over from earlier
  testing, even after calling `window.location.replace`/`assign`. Always
  confirm `window.location.pathname` (or query for a state-specific
  element, e.g. a stage-specific `aria-label`) *before* trusting a
  screenshot or measurement — several verification passes in this project
  wasted a round-trip on a screenshot of the wrong screen before this was
  caught. Cache-bust with a `?_=timestamp` query param if a navigation
  seems to not be taking effect.
- **`preview_console_logs` returns a historical buffer, not "current
  errors."** It has repeatedly surfaced a genuine-looking compile error
  (e.g. an "Expected '}', got EOF" parse error) that was real at some
  earlier point *during* a multi-step edit sequence but had already
  self-resolved by the time it was read back — the tool doesn't clear or
  scope entries to the current page load. Before treating a logged error
  as a live problem: check `preview_logs` (server-side) for the *most
  recent* compile line, and/or hit the route directly with `curl -s -o
  /dev/null -w "%{http_code}"` — a fresh 200 from curl is stronger
  evidence than an old console entry. This has cost more than one wasted
  investigation in this project specifically.
- **Reading `element.style.opacity` (or any inline style property) to
  check whether a Motion animation is "actually running" is unreliable.**
  Motion/Framer uses the Web Animations API for simple opacity/transform
  animations when it can (a real performance win), which animates on the
  compositor and does **not** rewrite the element's inline `style`
  attribute per frame — so `.style.opacity` reads a stale, static value
  the whole time even while the pixel is genuinely animating. Use
  `element.getAnimations()` (playState, currentTime, keyframes) or
  `getComputedStyle(element).transform` sampled across a few
  `requestAnimationFrame` ticks instead — this is what caught both the
  mascot-bubble pose-crossfade bug (avatar box needed its own `layout`,
  see above) and confirmed the eventual fix was real, not just a
  differently-broken end state that happened to screenshot the same.
- **When a feature needs to be verified but the deterministic/scripted
  content never naturally exercises that path** (e.g. term-3's Reveal
  screen when the shipped script is wrong→wrong→wrong and always reaches
  it anyway now, or term-4's "perfect lesson" skip-bypass, which the
  fixed term-2/3 scripts can never actually produce since they're never
  "unaided"), verify by **temporarily** editing the hardcoded
  outcome/constant that gates the path, clicking through to confirm the
  screen/route is genuinely correct, then reverting the edit and
  re-grepping/diffing to confirm the file matches its original state
  exactly before moving on. Don't skip the revert-and-verify step — one
  pass in this project accidentally left a stray edited comment behind
  from a rushed revert and had to be caught and fixed separately.
- **The small "N" badge visible in preview screenshots is the Next.js
  dev-mode build indicator, not part of this app's UI.** It floats at a
  fixed viewport position and can visually overlap real UI (it's been
  seen sitting directly on top of the TopBar's exit "X" button on shorter
  screens). Before treating an overlap like that as a layout bug, check
  the *actual* element's `getBoundingClientRect()` — if it's positioned
  correctly, the badge is just a dev-only rendering artifact, not
  something to fix.

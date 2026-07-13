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
- **Reskin target matters.** Build against the target reskin (mascot "Knowie," typefaces Inter Variable + Bricolage), not the current live Knowunity app's proprietary Greed VF typeface, unless told otherwise.

## Project
- Building: a clickable prototype of a voice active-recall step in
  Knowunity's Exam Plan. A student explains a key term out loud; the
  character "Knowie" replies in TEXT.
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
- Knowie replies in TEXT only. Never add text-to-speech or audio
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
    **Superseded by a later pass:** Evelyn asked for voice and
    text-fallback's Checking-it icon to be made consistent — both now use
    the shared `CheckingItIcon` component instead, which crops
    `checking-it-mic.svg` down to just its circle+eyes region (discarding
    the asset's own baked text portion, so the non-tokenized-text problem
    flagged above doesn't apply — the real tokenized "Checking it"/"Give
    me a second" text still renders separately, exactly as before). See
    the dedicated "Checking it" build-status bullet further down.
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
  loop yet) / "Claim XP" (→ `/path`, the exam-plan path view — **updated
  by a later pass**, see the dedicated "Claim XP" correction bullet
  further down for why this moved off `/`). Its Score value was corrected
  to `7/10`
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
- **Confidence-tap copy unified across first-time and returning
  encounters.** `/confidence` and `/confidence-recurring` now share the
  exact same `DEFAULT_PROMPT` — "We're about to test what you've learned
  in your own words, before we get started, how confident do you feel?"
  — replacing each screen's own previously-different wording. Straight
  copy swap, no logic change.
- **"Claim XP" on `/summary`'s full variant now routes like "Try
  again."** Previously called `endSession()` (→ `/`, the first-time
  entry fork) unconditionally — the only summary button that never got
  wired to the recurring-flow logic when everything else did. Now calls
  the same `handleTryAgain()` "Try again" already used (reset + route to
  `/confidence-recurring`, with the existing all-skipped carve-out to
  `/`), confirming SPEC.md §2D's own "inferred — confirm" note that
  Claim XP loops back to a fresh confidence tap. The no-recall/simplified
  variant's own "Claim XP" (→ `/`, since that student never engaged with
  recall) is untouched — still correct there.
  - **Superseded by a later pass, once `/path` existed:** "Claim XP" on
    *both* variants now ends the recall-step session at the exam-plan
    path view instead — `goToPathView()` (→ `/path`, no session reset,
    same as this button already didn't reset on the no-recall variant).
    On the full variant this is a genuine behavior split from "Try
    again", which they'd shared since the entry above: "Try again" keeps
    looping to a fresh confidence tap exactly as documented above,
    "Claim XP" no longer does. Confirmed directly with Evelyn — this
    reverses the SPEC.md §2D reading the entry above was based on, not a
    silent guess.
- **`HighlightCard` — horizontal-scroll bug fixed, dimmed variant added,
  padding/title copy corrected.**
  - **Horizontal-scroll bug**: `overflow-y-auto` alone doesn't stop
    `overflow-x` from computing to `auto` too (CSS overflow spec) — a
    long unbroken typed token (no spaces) could overflow the box
    sideways instead of wrapping. Fixed with `break-words` (wrap) +
    explicit `overflow-x-hidden` (a hard guarantee, not just implicit
    `auto`).
  - **Vertical scroll thumb added** — same measured-thumb approach as
    `TextInput` (`components/text-input.tsx`): native scrollbar hidden
    (`.no-scrollbar`), a hand-drawn 8px `rounded-full`
    `bg-interactive-disabled` thumb shown only once content overflows
    past the 145.25px cap, tracking real `scrollTop`. Position
    (`right: -9px`) taken directly from Figma node `13900:25130`'s
    dev-mode data.
  - **`dimmed` prop added** (opacity 0.5, same crossfade treatment as
    `MascotBubble`'s own `dimmed`) — used only by term-3's hint screen
    (Figma `14030:16746`), where the transcript card dims along with the
    surrounding bubble thread, unlike its normal-opacity appearance
    everywhere else (e.g. the wrong-result sheet, Figma `14030:16666`).
  - **Padding corrected to 16px** on every side (was `17px`, itself a
    rounding of Figma's `16.586px` — the correct value is a clean 16px,
    not a Figma-fraction round).
  - **Title copy**: "What you wrote"/"What I heard"/"Picture this" all
    now end in a colon, not a period, everywhere they appear (5 terms +
    `text-fallback-body.tsx`).
- **"Did Knowie mishear you?" — reverted back to voice-only.** Briefly
  made available in text mode too (see git history), then reversed:
  mishearing is a voice/STT-specific failure mode that can't happen for
  a typed answer, so both occurrences (term-3's wrong-result sheet and
  Reveal screen) are gated behind `inputMode === "voice"` again. This is
  the current, correct state — don't remove the gate again without
  checking with Evelyn first, this has flipped once already.
- **"What I heard:" now shows on every voice-mode result, regardless of
  outcome — not just wrong answers.** Previously only term-3's
  wrong-result/Reveal screens had any transcript box in voice mode; a
  correct or partial voice answer showed nothing (unlike text mode's
  "What you wrote:", which always showed the real typed input). Since
  there's no real STT in this prototype (hard constraint), extending
  this required *authoring* new mocked "what the student said" lines,
  not just a visibility toggle — flagged back before building, per
  Evelyn's direction to follow the same script-driven pattern term-3's
  existing transcripts already use. New per-term constants, same
  "authored, not sourced" convention as elsewhere in this doc:
  `WHAT_I_HEARD` (term-1/4/5, single unaided-pass outcome),
  `WHAT_I_HEARD_BY_ATTEMPT` (term-2, indexed [partial, correct]),
  `WHAT_I_HEARD_CORRECT` (term-3's "correct" Outcome case — still
  unreached by the shipped script, kept real/wired same as `ANSWER`
  already was). Verified via the temporarily-force-then-revert pattern
  documented below for term-3's own unreachable "correct" path.
- **Term-3 Reveal screen: spacing between the transcript card and the
  reply bubble is conditional on mode.** The wrapping div around the
  reply `MascotBubble` only gets `mt-5` when `inputMode === "voice"`
  (i.e. when the "Did Knowie mishear you?" link is rendered above it) —
  in text mode, where that link is absent, the parent's own `gap-5`
  already supplies the correct 20px, so the extra `mt-5` would double it
  to 40px. Don't hardcode `mt-5` back onto that div unconditionally.
- **Modality (voice/text) now persists across terms and retries — no
  more silently resetting to the mic-permission default.** Previously,
  every term computed its own starting `inputMode` purely from
  `micPermissionGranted` (denied/unconfirmed → text, granted → voice),
  so switching to text on term 2 and continuing to term 3 would silently
  snap back to voice if permission had ever been granted. Fixed via a
  new `lastInputMode: InputMode | null` context field
  (`lib/recall-flow-context.tsx`) — `null` until the student makes an
  explicit choice, then holds `"voice"` or `"text"` until changed again.
  Every term now computes its starting mode as
  `lastInputMode ?? (micPermissionGranted ? "voice" : "text")`, and every
  term's own `switchToText`/`switchToVoice`/`allowMicAndSwitchToVoice`
  sets it alongside the local `inputMode` state. Replaces the older
  one-shot `termInTextModeRequested` flag entirely (that flag only
  covered the single confidence-recurring → term-1 handoff and cleared
  itself on read; `lastInputMode` is general-purpose and persists).
  **Deliberately resets at Practice More** (`resetRecallSession()` now
  also clears `lastInputMode`), confirmed with Evelyn rather than
  assumed — a fresh restart goes back to the plain
  `micPermissionGranted`-based default, same as a first-ever session.
- **Term-3's reveal-sheet title fixed to render on 1 line.** "We'll do
  it next time!" now uses Figma's exact `29.025px` font-size **and**
  line-height (100%, no extra leading) for node `13900:26243`, instead
  of an unspecified-line-height `26px` that wrapped to 2 lines. Nothing
  else on the reveal screen touched (copy, icon, buttons, spacing all
  as-is).
- **Text-fallback's "Checking it" mascot now reads, not listens.**
  `CheckingIndicator` (`components/mic-status-indicator.tsx`, the shared
  Sending/Checking markup used only by the text-fallback path) and every
  term's own persistent top bubble now show `knowie-reading.svg` instead
  of `knowie-listening.svg` while checking a *typed* answer — "listening"
  never made sense for something the student typed rather than said
  aloud. Scoped narrowly to the Checking stage specifically
  (`stage === "checking" && inputMode === "text"`); voice mode's own
  Checking (and its separate big-mic-button mascot) is completely
  unchanged. **Superseded by a later pass, for `CheckingIndicator`'s own
  icon specifically:** `CheckingIndicator` (and voice mode's matching
  inline circle) now both show the shared `CheckingItIcon` crop
  regardless of modality instead — see the dedicated "Checking it" bullet
  further down. The PERSISTENT TOP BUBBLE'S pose logic described in this
  bullet (the "reading" vs "listening" swap for the chat bubble above the
  mic button) is a separate mechanism and is untouched by that later
  pass. **Superseded by a (different) later pass:** the Result/Hint/Reveal
  screens' dimmed top-bubble pose was originally left showing
  "listening" regardless of mode as a deliberate scope decision — a
  follow-up request explicitly extended the same `inputMode === "text"
  ? "reading" : "listening"` swap to every Result/Hint/Reveal screen
  across all 5 terms, so that scope line no longer holds. See "What I
  heard now shows on every voice result, regardless of outcome" below.
- **`/path` and `/quiz` — the new pre-step lead-in, built.** A short
  mocked sequence in front of the existing entry fork: exam plan path
  view → last quiz question → the fork, unchanged. Both routes live
  under `(recall)` and reuse its TopBar/MascotBubble/BottomCta chrome,
  but with their own step numbers (this quiz's own progress, unrelated
  to the recall flow's 1–6) — this is additive in front of the existing
  flow, `/` still means exactly what it always did.
  - **`/path`** (Figma `14030:17149`) — hero card (XP chip, gear,
    "Music theory" title, calendar/grade-goal chips, progress bar,
    "Notes, Pitch & Rhythm" card) kept as a **sibling of the scrollable
    node list, not inside it** — simplest way to keep it pinned at the
    top while the path scrolls underneath, no `position: sticky` edge
    cases. No TopBar/exit-X or MascotBubble (`currentStep: null`,
    `useMascotBubble(null)` — nothing in this Figma frame uses either).
    4 path nodes: Music Theory (unlocked, tappable → `/quiz`), Harmony I
    / Harmony II / Harmony III (locked, inert `<div>`s not buttons).
    **Figma naming gap, confirmed with Evelyn, not guessed:** the
    updated file has nodes 2 and 3 both literally labeled "Harmony
    II" — a copy-paste leftover from duplicating the node to add
    "Harmony III"; the real sequence is Harmony I → II → III.
    - Path connectors are curved/sinuous 3-dot shapes reproduced
      directly from Figma's own "Group 1"/"Group 2" assets (white/10%
      opacity circles at specific offsets), not a straight dashed line
      — an early pass used a plain dashed `border-l` as a placeholder
      since the connector assets weren't in this task's delivered asset
      list; corrected once Evelyn flagged it.
    - `test-path-enabled-music.svg`/`test-path-dissabled.svg` render
      **directly, no wrapper border** — both assets already bake in the
      correct-thickness ring (`stroke-width=8`, white/10%) at their
      native 118×118; an earlier pass added an extra `border-8` div
      around them, which doubled the ring thickness. Use the assets as
      the source of truth for thickness, don't hand-code it.
    - Bottom nav's 5 icons are **deliberately not the same box size** —
      measured each asset's actual opaque-pixel bounds via a canvas
      readback (not just its declared viewBox): the 4 line icons only
      fill ~51% of their own 40×40 canvas, while the avatar badge's
      circle fills ~99.5% of its 24×24 canvas edge-to-edge. Equal
      *boxes* at a small render size read as very unequal glyphs; 32px
      line icons (~16.5px effective) + a 16px avatar (~15.9px
      effective) match instead. If new nav-style icons are added later,
      measure before assuming equal boxes = equal visual weight.
  - **`/quiz`** (Figma: idle `13954:10374`, selected `13954:10484`,
    correct review `13900:24733`, incorrect review `14030:17584`) — a
    single mocked True/False question, the last question of the exam
    plan's quiz (explicitly not a full quiz mockup). "True" is the
    factually correct answer, so correctness here is real boolean
    evaluation (`selected === "true"`), not a scripted per-attempt
    outcome like the Voice Recall terms use — there's only one attempt,
    nothing to script per-attempt. Option buttons are **rectangular,
    24px corner radius** (Figma `24.879px` scaled) — not the pill/
    rounded-full shape `SelectableButton` uses elsewhere, so they're
    hand-rolled locally rather than reusing that component.
    - X opens a local **`ExitConfirmSheet` `"pre-step"` variant**
      (Figma `14033:4400`) instead of exiting directly — boolean overlay
      state local to this screen (not the shared layout-level
      `exitConfirmOpen` every VR screen's X uses, since "Leave" here
      goes to `/path`, not `/streak`).
    - "Skip to next question" and both review screens' "Continue"
      route through `getEntryForkRoute()` (see `recall-flow-context.tsx`
      below) — same first-time/returning determination the rest of the
      app uses, so a session that already did a VR round this session
      and comes back through the quiz correctly lands on the returning
      fork, not always the first-time one.
    - **The review sheet's "Why?" button is now real, not a stub.**
      Tapping it reveals a `WhyExplanation` box (shared with the VR
      terms' own Result/Reveal sheets — see the dedicated build-status
      bullet below) with a fixed explanation of this question's answer.
      Unlike the terms' own Why boxes, tapping Why? here does NOT collapse
      the Why?/Continue button pair into a single button — both stay
      visible after reveal, matching this screen's own Figma frames
      (`14036:17120` correct / `14036:17147` incorrect) rather than the
      terms' collapse-to-one-button pattern. Added an `"incorrect"`
      (coral) variant to `WhyExplanation` specifically for this screen's
      own incorrect-answer case — the component previously only had
      `"correct"` (green, for terms) and `"reveal"` (purple, for term-3).
- **Combined quiz+recall progress bar.** The pre-step quiz and the Voice
  Recall term loop now share ONE continuous progress sequence instead of
  two separately-numbered ones — previously `/quiz` ran its own isolated
  1–4 (unrelated to VR's own 1–6) and the bar visibly reset to 1/6 the
  moment VR's entry fork began. New constants in
  `lib/recall-flow-context.tsx`: `QUIZ_TOTAL_QUESTIONS` (10 — only the
  last question is actually built, the other 9 are assumed-prior and
  never rendered), `ENTRY_STEP`/`CONFIDENCE_STEP` (11/12), `TERM_STEP` (a
  `TermId → number` map, 13–17), `COMBINED_TOTAL_STEPS` (17, derived from
  `BASE_TERM_IDS.length + 1` for Cadence, not hardcoded). Two decisions
  confirmed with Evelyn rather than guessed: (1) entry/confidence keep
  their OWN step slots (the alternative — holding the bar flat through
  both screens — was considered and rejected); (2) the VR term count is
  fixed at 5 always, not session-dependent — a hypothetical "perfect" run
  that skips Cadence tops out at 16/17 (not 100%) right before the bar
  disappears on `/streak`, a known/accepted gap rather than something
  dynamically tracked. `/confidence-recurring` reuses `CONFIDENCE_STEP`'s
  own slot (a returning student never sees `/entry`, so the bar visibly
  jumps from 10→12, skipping 11, rather than `COMBINED_TOTAL_STEPS`
  shrinking just for that session type). This also incidentally fixed a
  pre-existing bug where term-4 and term-5 both showed "step 6 of 6"
  (term-5 — the conditional bonus round — had no step slot of its own
  before this).
- **Screen transitions are now purely horizontal; the term-to-term
  mascot-bubble resize glitch is fixed.** Two related but separate
  issues:
  - Several ROUTE-MOUNT animations (`/entry`'s hero mascot,
    `/recall-summary` and `/summary`'s own hero-content reveal,
    `/term-5`'s "entry" stage, `/`'s bottom nav) had their own
    `initial={{opacity:0, y:8/12}}` vertical offset firing AT THE SAME
    TIME as the shared layout's own horizontal screen-slide
    (`(recall)/layout.tsx`'s `AnimatePresence`) — the two competing axes
    read as "sliding/dropping vertically" even though the primary route
    transition was already correctly horizontal. All of these are now
    flattened to a pure opacity fade (no directional offset), so the
    horizontal slide is the only visible motion during a real screen
    transition. Scoped narrowly to ROUTE-MOUNT animations only — every
    WITHIN-screen stage-change animation (a term's own Result/Hint/Reveal
    reveal, quiz's idle→review reveal) was left untouched, since those
    were never screen transitions to begin with.
  - The persistent top `MascotBubble` (rendered once in the shared
    layout) previously used a STATIC `AnimatePresence` key, so
    pose/text/dimmed all cross-faded IN PLACE via its own internal
    layout-FLIP resize — fine for a single prop changing, but
    term-to-term hops change pose+text+dimmed simultaneously (Result's
    dimmed bubble → next term's fresh prompt), which visibly glitched (a
    brief height jump as the FLIP and the nested pose/text
    `AnimatePresence`s fought for the same frame). Fixed by keying that
    block on `pathname` instead — since each term route has a distinct
    pathname even though the main content's own `motionKey` collapses
    them (see `getMotionKey`'s own doc comment), this forces a full
    remount + simple opacity crossfade specifically at term boundaries,
    "a simple animation from one term to another" per the actual ask —
    while pose/text crossfades WITHIN one term's own stage progression
    (pathname unchanged) still go through `MascotBubble`'s own smooth
    internal handling, untouched.
- **Why box (`WhyExplanation`, `components/why-explanation.tsx`) now uses
  a brush-stroke `border-image` per outcome color, not a solid border.**
  Originally a plain solid 2px border (Figma's own reveal-sheet frame,
  node `14036:14642`, actually still shows a clean border on the Why box
  even though "What I heard:" right above it in the same frame uses the
  brush texture) — Evelyn asked for the brush treatment here too,
  superseding that frame. Each variant has its own dedicated asset
  (`green-brush-box.svg`/`coral-brush-box.svg`/`purple-brush-box.svg`,
  all supplied by Evelyn, not invented/approximated with a CSS filter)
  rather than reusing `HighlightCard`'s own `picture-this-box.svg` (a
  different-sized asset, and this box needs 3 outcome colors, not
  `HighlightCard`'s single fixed purple).
  - `borderImageSlice` is **`"40"`**, not a smaller value — each asset's
    own path data confirms its rounded-corner curve spans ~38.4 SVG units
    (measured directly off the path's own corner-to-straight-edge
    transition point, not eyeballed); an earlier pass here used `"20"`
    (copied from `HighlightCard`'s own `picture-this-box.svg` value
    without re-measuring for this differently-proportioned asset), which
    sliced through the MIDDLE of the corner arc instead of past its end —
    the leftover curve fragment landed in the stretched edge strip,
    visible as a stray line down the left edge once that strip was
    stretched much taller than its ~77px source sliver.
  - `reveal`'s own box fill is **`bg-brand-on-bold`**, not
    `bg-background-scrim` (an earlier pass here) — `background-scrim` is
    a 50%-alpha token (meant for dimming an overlay, not filling a card),
    so it never visually matched the reveal asset's own opaque baked
    fill: the border-image's corner/edge slices necessarily carry a thin
    strip of that baked fill alongside the visible brush stroke (a
    hand-drawn stroke doesn't have a perfectly crisp inner edge), and
    against the translucent scrim that strip read as a visible dark ring
    between the stroke and the box content. Evelyn re-exported
    `purple-brush-box.svg` with a solid (non-translucent) fill
    specifically to fix this and gave the exact color to use (`#16171c`)
    rather than approximating it against an existing token —
    `--color-brand-on-bold` (`globals.css`) was updated to that exact
    value and reused here, since that slot existed but was otherwise
    unused anywhere in the app (safe to repoint, no raw hex added to the
    component itself). `correct`/`incorrect` never had this problem —
    their own bg tokens (`green`/`coral-on-bold`) already were exact
    opaque matches for their own assets' baked fill colors.
  - Padding between the Why box and the bottom sheet's title row is
    **`mt-5` (+20px), on the 5 term pages only** — `/quiz`'s own Why box
    wrapper (`px-7 pt-3`) is untouched, it already had the right spacing
    per Evelyn's own note ("the pre step has a good padding").
  - **Gotcha hit while debugging this:** a stale Turbopack cache served
    the OLD `--color-brand-on-bold` value even after the source file was
    edited and `next build`/`tsc` both passed clean — confirmed via a
    direct `curl` of the compiled CSS chunk (still showed the old hex)
    before concluding it was a caching issue, not a code bug. Fixed the
    same way this file's own "Good to know" gotcha already prescribes:
    kill the dev server, `rm -rf .next`, restart via `preview_start`.
- **Bottom sheets across `/quiz` and all 5 terms now have a consistent
  `z-20`.** Every term's own Result/Hint/Wrong/Reveal sheet and
  `/quiz`'s own review-stage sheet previously had NO explicit z-index
  (relying purely on DOM order), unlike `SkipConfirmSheet`/
  `ExitConfirmSheet` which already had `z-20`. Matched them to the same
  value so an expanded sheet (e.g. the Why box growing the sheet taller)
  always renders above surrounding screen content instead of DOM-order
  stacking quirks.
- **"Try again" → "Try weak terms," on `/recall-summary` and
  `/summary`'s full variant only** (the no-recall/simplified variant's
  own "Try voice" is untouched). Copy-only change — the underlying retry
  logic (full replay via the entry fork) is unchanged; no filtering to
  weak terms yet. Button layout is now a **full-width vertical stack**
  ("Try weak terms" on top, Continue/Claim XP below), not the equal-width
  side-by-side row first attempted — measured directly (canvas text
  metrics, not eyeballed) that "Try weak terms" at Continue's own
  21px/bold type genuinely doesn't fit an equal half-width share even at
  this app's full 404px content width (~159px of text, ~121px
  available), so the original Figma reference's own single-line
  equal-width render (nodes `13900:24948`/`26505`) isn't physically
  achievable at this button's real constrained width. Evelyn's follow-up
  reference (nodes `14050:23562`/`14050:23647`) supersedes it with the
  stacked layout instead.
- **"Checking it" now shows the same icon regardless of modality.** Voice
  mode previously showed `knowie-listening.svg` and text-fallback showed
  `knowie-reading.svg` — two different icons for the same state. Both now
  use the new **`CheckingItIcon`** (`components/checking-it-icon.tsx`),
  which crops `public/images/checking-it-mic.svg` down to just its
  circle+eyes region (the asset actually bakes a purple circle + eyes +
  "Checking it"/"Give me a second" text together as one flattened Figma
  dev-mode composite, 133×180 viewBox — the circle+eyes occupy the top
  120px, the text fills the remaining 60px below; only the top region is
  shown here, since the real, tokenized "Checking it"/"Give me a second"
  text already renders separately alongside this icon everywhere it's
  used, so showing the asset's own baked copy too would duplicate it).
  Used by all 5 terms' own inline voice-mode circle AND the shared
  `CheckingIndicator` (`components/mic-status-indicator.tsx`,
  text-fallback's own Sending/Checking markup) — same asset, same
  component, one shared replacement for both. The persistent TOP
  BUBBLE'S own separate pose logic (still swapping "listening"/"reading"
  for voice/text on Result/Hint/Reveal screens) is unrelated and
  untouched by this.
- **XP/RECALL stat-tile font fixed on `/summary`.** The overlay text in
  `StatImageWithValue` (XP and RECALL, the two tiles with a real dynamic
  value) was rendering in `font-sans` (Inter Variable) while SCORE/BLAZING
  (baked into their own images) read as bold/condensed — an earlier
  comment on that component asserted Greed Condensed Heavy substitutes to
  Inter Variable, which turned out wrong once actually compared: switched
  to `font-display` (Bricolage Grotesque), confirmed via computed-style
  inspection (`fontFamily`) before and after, not just a screenshot.
- **`/recall-summary`'s header (title + body, above the per-term rows) is
  now genuinely dynamic — confidence × per-term-outcome, not static
  copy.** Previously hardcoded to the "Confident + Right" block ("You
  knew you had this...") regardless of session outcome. Two real gaps had
  to be closed first: the confidence-tap pick was never persisted past
  the click that set it (fixed by adding `confidenceLevel`/
  `CONFIDENCE_OPTIONS`/`confidenceLevelForOption` to
  `recall-flow-context.tsx`, set by both `/confidence` and
  `/confidence-recurring` right before routing to `/term-1`, reset on
  "Try again"), and no per-term "source" field exists in the content
  model for the spec's conditional "[Term] is worth another look in
  [source]" line — always falls back to the generic review-suggestion
  line instead of inventing source names. The header picks from
  `SUMMARY_HEADER_COPY` (`lib/term-summary-data.ts`) by crossing
  confidence against a **worst-case-wins outcome bucket** (right only if
  every attempted term was unaided; else hinted; else revealed — skipped
  folds into revealed) — same pattern already used for term-5's own
  trigger rule. **Given this app's fixed demo script, term-2 always
  resolves "hinted" and term-3 always resolves "revealed" when reached,
  so "revealed" is the only bucket actually reachable via a full
  click-through** — the "right"/"hinted" blocks are wired and
  unit-verified (via a standalone `npx tsx` check of
  `getSummaryHeaderCopy`, not the UI) but architecturally unreachable in
  the shipped demo, same situation as other documented gaps in this file.
  The two "with a hint" copy blocks are Claude-drafted, flagged
  unconfirmed pending Evelyn's review.
  - **Superseded by a later pass: the "right" bucket is no longer pure
    worst-case-wins.** Evelyn flagged that a single skipped/revealed term
    was dragging the whole header down to the "revealed" copy even after
    3 clean terms — too punishing given the north star ("costs nothing to
    get wrong"). `summaryOutcomeBucket()` (`lib/term-summary-data.ts`) now
    tolerates some misses via two paths into "right", confirmed with
    Evelyn across several rounds of back-and-forth on the exact boundary,
    not guessed:
    - `>=2` unaided qualifies as "right" regardless of what the rest did
      (any mix of hinted/revealed/skipped, any count) — **except** the
      barely-2 edge case: exactly 2 unaided with *every* remaining term
      skipped (zero hinted, zero revealed — no engagement shown on the
      rest at all) still falls through to "revealed", since that reads
      weaker than either 3+ unaided or a 2-unaided session where the rest
      shows some real effort. Explicitly confirmed this boundary stays
      exactly here — 3+ unaided with the rest all skipped stays "right",
      and 2 unaided + 1 revealed + 1 skipped (not *literally* all
      skipped) also stays "right" — both checked with Evelyn directly
      rather than assumed from the pattern.
    - `>=1` unaided AND `>=2` hinted AND zero skipped also qualifies as
      "right" — a weaker path for a session that leaned on hints twice
      but still landed one term clean and never outright skipped
      anything. A revealed term is still tolerated on this path too
      (only skip disqualifies it) — confirmed directly, not inferred from
      the first path's own tolerance.
    - Anything clearing neither path still falls back to the original
      worst-case-wins split for "hinted" vs "revealed" (unchanged): only
      "hinted" if there's a hinted term and zero revealed/skipped, else
      "revealed".
    This also means the reachability claim above (only "revealed" is hit
    via a full click-through, given the fixed demo script) no longer
    holds in general — a click-through that answers term-1/4/(5) for real
    and *skips* term-2/3 instead of letting their scripted hint/reveal
    ladders run now reaches "right" too, verified live this way (2
    unaided + 3 skipped → "You knew you had this").
- **Motion bounce bugs fixed — two separate, unrelated root causes.**
  (1) The mascot-bubble's outer `AnimatePresence` in
  `(recall)/layout.tsx` was the one instance in the app missing
  `mode="popLayout"` — without it, the exiting and entering bubble both
  stayed in normal document flow during the crossfade, so content below
  briefly got pushed down then snapped back once the old one unmounted
  (confirmed via `document.getAnimations()` — see the new "Good to know"
  entry on how). (2) Several `y:12→0` stagger reveals (`/summary`'s 4
  stat tiles, `TermResultRow` on `/recall-summary`) had no explicit
  `transition`, silently falling back to Motion's default spring
  (damping ratio ≈0.5, genuinely underdamped) — fixed with an explicit
  `soft` transition (`STAT_TILE_VARIANTS` in `summary/page.tsx`,
  `rowVariants` in `term-result-row.tsx`), same fade+rise motion, no
  overshoot. Term-5's own "One more" entry mascot was already clean
  (opacity-only) — verified, not changed.
- **`/streak`'s flame icon has a deliberate landing animation now, paired
  with confetti — the one intentional bounce this pass.** A new
  `motion.img` drops from `y:-80` and settles via `snappy` (genuinely
  underdamped on purpose here, unlike everywhere else).
  `onAnimationComplete` fires `ConfettiBurst`'s `play` prop at the exact
  landing moment instead of the screen's own generic `revealed` timer —
  verified live: the icon's `top` genuinely overshoots past its resting
  value before settling, and confetti fires right after.
- **Thin (4px) custom scrollbar added for whole-page scroll, across every
  recall screen.** New `lib/use-scroll-thumb.ts` (`useScrollThumb`) +
  `components/scroll-thumb-indicator.tsx` (`ScrollThumbIndicator`) — same
  hand-drawn measured-thumb mechanism `HighlightCard`/`TextInput` already
  use for their own small boxes (native scrollbars aren't reliably
  stylable on mobile Safari, the actual target platform), just half the
  width. Applied to all 11 screens' existing `overflow-y-auto` containers
  without restructuring layout: `relative` added to the existing outer
  wrapper, `ref`/`onScroll`/`no-scrollbar` added to the existing scroll
  div, the thumb rendered as a new sibling right after it.
  `HighlightCard`/`TextInput`'s own box scrollbars are untouched, still
  8px.
- **Quiz True/False button padding fixed on real mobile viewports.** The
  buttons were fixed-width (`w-[179px]` each, matching Figma's own
  404.28px canvas exactly) — **this app's 404.28px max-width is
  desktop-mockup-only, never applied on a real narrower device** — so at
  an actual ~375px phone width the two fixed-width buttons + gap (370px)
  overflowed the padded container and ate into the intended edge padding
  down to ~2.5px instead of Figma's 16.586px. Fixed with `flex-1
  max-w-[179px]` instead of a fixed width: unchanged at Figma's own
  canvas width, shrinks together on narrower viewports so the edge
  padding stays correct. Verified via `getBoundingClientRect()` at both
  375px and 600px.
- **Quiz True/False buttons no longer jump ~72px down when graded.** The
  result sheet (`stage === "review"`) is `position: absolute` (needed for
  its own slide-up entrance), so unlike idle — where the button row's
  `flex-1` centering shares real flow space with a genuine `BottomCta`
  sibling (144px) — the review stage's button row had no such sibling and
  centered over the *full* remaining height instead, visibly dropping the
  buttons the instant the answer graded. Fixed with an invisible 144px
  spacer (matching `BottomCta`'s own measured height) added to the review
  stage's flow, so both stages' centering math produces the same result;
  the result sheet's own animation is untouched. Verified via
  `getBoundingClientRect()`: `top` is identical (387px) in both the idle
  and freshly-graded states.
- **Motion audit against motion-guide.md's own recipes — three fixes
  shipped, two explicitly declined.** Walked the full recall loop
  (starting to speak, while speaking, the wait after finishing, result
  landing, moving to the next term, finishing) and checked each moment
  against the guide's stated recipes; presented as a prioritized list,
  reviewed item-by-item rather than as a batch:
  - **Shipped:** Sending + Checking's combined wait shortened from 8s
    (4000ms each) to ~2.4s (1200ms each) across all 5 terms — the guide's
    own "Processing" recipe calls for "~1-1.5s... don't make it look like
    a real network call you don't have," and 8s read exactly like one.
    1200ms still completes a full spinner rotation / checking pulse cycle
    before advancing, so neither animation gets cut off mid-loop.
  - **Shipped:** Recording's mic icon now pulses (`scale` 1↔1.08, 1s
    loop) the same way Checking's icon already did — the guide's
    "Recording / listening state" recipe calls for exactly this pulse,
    but it was only ever wired to Checking, not Recording, even though
    the recipe is written for this moment specifically. This is a
    *within*-state loop (same category as the Sending spinner/Checking
    pulse), not a between-state crossfade, so it doesn't touch the
    locked "instant swap between mic states" decision (see term-1's own
    "Instant state swap, deliberately" comment) — confirmed via
    computed-style sampling that the scale genuinely oscillates on a
    continuous loop, not a one-shot.
  - **Shipped:** `/streak`'s day-of-week circles (`dayVariants`) now use
    an explicit `soft` transition instead of falling back to Motion's
    default spring (damping ratio ≈0.5) — the same missing-transition
    bounce bug already fixed elsewhere this session (stat tiles,
    `TermResultRow`), left unfixed at the time as out of scope, now
    closed. It sat right next to the flame icon's own *deliberate*
    landing bounce, reading as sloppy rather than playful. Verified via
    computed-style sampling: scale now rises monotonically from 0.6 to
    exactly 1.0, no overshoot.
  - **Explicitly declined, not touched:** staggering the result-reveal
    bubble and bottom sheet (currently fire simultaneously, which
    technically violates the guide's own "one thing moving at a time"
    rule) and adding an entrance animation to the "What I heard"/"What
    you wrote" recap card (currently static while the reply bubble and
    sheet around it animate). Both remain open findings if revisited
    later — flagged here so they aren't rediscovered as new bugs.
- **`/summary`'s XP/RECALL count-up and reward confetti now sync to the
  actual stat-tile landing, not a generic timer.** `CountUpNumber`
  previously started its 0.9s count the instant it mounted, while its
  tile was still `opacity:0` behind `STAT_TILE_VARIANTS`' staggered
  reveal — most of the "climbs from zero" motion played invisibly before
  the tile ever appeared. Confetti fired off a bare `revealed` timeout
  that overlapped the whole stagger instead of landing on any real
  moment. Both now key off the XP tile's own landing: new
  `tileRevealDelay(index)` (mirrors the stagger's
  `delayChildren`/`staggerChildren` timing) is passed as `CountUpNumber`'s
  `delay` on the XP and RECALL tiles, and a new `xpTileLanded` state
  (set via `onAnimationComplete` on the XP tile's own `motion.div`, both
  variants) now drives `ConfettiBurst`'s `play` prop — same "confetti
  follows a real landing moment" pattern `/streak`'s flame icon already
  used, instead of an independently-timed effect competing with the
  stagger for attention.
  - **A real bug surfaced while wiring this, not just a timing tweak:**
    Motion calls `onAnimationComplete` for the *initial* "hidden→hidden"
    state too, since `animate={revealed ? "visible" : "hidden"}` starts
    equal to `initial="hidden"` before `revealed` flips true — a
    technically-completed no-op animation the callback doesn't
    distinguish from a real one. The first version of this fix burst
    confetti ~90ms after mount, well before any tile had appeared.
    Guarded with `if (definition === "visible") setXpTileLanded(true)`
    on both the full and simplified variant's XP tile — `definition` is
    the variant label Motion's callback receives, and checking it is
    what actually fixes this, not a delay/timeout workaround. Confirmed
    live (not just by reading the code) via the trigger+poll-in-one-script
    technique the "Good to know" section already prescribes for
    route-mount animations: navigated `/streak` → `/summary` inside one
    `javascript_tool` call, sampling `getComputedStyle(tile).opacity` and
    confetti-piece count every ~40ms. Before the guard, confetti was
    already at full count by t≈90ms while every tile was still at
    opacity 0; after the guard, confetti onset now lines up with the XP
    tile crossing opacity 1 (~590–835ms depending on variant/tile index).
- **Pre-ship critique against 5 lenses (system status, token consistency,
  copy, can't-speak-fallback reachability, native feel), 4 fixes applied
  from it.** Walked every screen in the loop — full source read, not
  spot-checked — and cross-referenced `feedback.md`'s own (still-unchecked)
  testing items against what's actually shipped, surfacing several
  findings not yet acted on (the "Why?" explanation feature's blocked
  sign-off gate in `feedback.md`, "Try weak terms" not actually filtering
  to weak terms, the duplicated raw `rgba(0,0,0,0.15)` button-bevel
  shadow, two different modal-scrim treatments, term-3's Tempo hint
  referencing "a note" — matches `feedback.md`'s own unresolved S-tier
  item almost verbatim — among others). Only four items were actioned
  this pass, on explicit instruction; the rest are intentionally left
  open rather than silently fixed or silently dropped:
  - **Confidence-tap prompt copy fixed** (`confidence/page.tsx`,
    `confidence-recurring/page.tsx`) — was a three-clause comma splice
    ("We're about to test what you've learned in your own words, before
    we get started, how confident do you feel?"), now two sentences
    ("We're about to test what you've learned, in your own words. Before
    we get started — how confident do you feel?").
  - **"Try to go to quiet place" → "Try to find a quiet place"** — the
    missing-article typo was duplicated identically (not shared) across
    all five term idle screens' helper caption; fixed in each file.
  - **Reskin-target naming reversed back to "Knowie," not "Noe,"
    across this file, design.md, and sprint-context.md — the docs were
    wrong, not the app.** The shipped prototype already used "Knowie" in
    its own real copy ("Say it back to knowie" on `/entry`, "Did Knowie
    mishear you?" on `/term-3`) and every mascot asset has always been
    named `knowie-*.svg` (see the image inventory below) — the docs'
    "target reskin is Noe, not Knowie" framing was the thing out of sync
    with reality, confirmed and corrected rather than renaming the app's
    copy/assets to match a doc that was itself stale. This section's own
    "Reskin target matters" bullet, the "Project"/"test prototype" bullets
    above, and the image-inventory line all now read "Knowie" — if you
    still see "Noe" anywhere in this file, it's a miss, not intentional.
  - **The can't-speak-label rule below (under "Always") corrected to
    match the shipped app, not the other way around.** It previously
    still described "I
    can't speak right now" as the permanent, non-swappable copy and
    warned against ever using "Type instead" in that spot — but
    `MicLoopBottomBar` has read "Type instead"/"Try with voice"
    everywhere, mode-driven, since a `feedback.md`-tested fix (2/5
    testers were confused whether "I can't speak right now" meant an
    action or a state). The old rule would have told a future session to
    revert a validated, tester-driven fix. See that bullet for the
    current rule.
  - All four fixes were built locally (`tsc --noEmit` clean, `npm run
    build` clean), committed as two commits, and pushed to `main`, which
    triggered a Vercel production deploy via the GitHub integration (no
    separate deploy step) — confirmed `READY` via the Vercel MCP tools
    and spot-checked the live confidence-tap copy on the production URL
    afterward, not just assumed from a green push.

Shared infrastructure (all under `src/`):
- `lib/recall-flow-context.tsx` also exports **`getEntryForkRoute(termOutcomes)`**
  — the one place "which entry-fork variant should this session see" is
  decided (`"/"` if `termOutcomes` is empty or every recorded outcome is
  `"skipped"`, else `"/confidence-recurring"`). Extracted from what was
  previously the identical `allSkipped ? "/" : "/confidence-recurring"`
  expression duplicated in `recall-summary/page.tsx` and
  `summary/page.tsx`'s own "Try again" handlers — `/quiz`'s "Skip to next
  question" and review-continue needed the same determination a third
  time, so it's centralized now instead of copy-pasted again. Plain
  function, not a hook — pair with `useTermOutcomes()` at the call site.
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
  - **Screen-to-screen transitions now genuinely slide** —
    motion-guide.md's own "push transitions slide in from the right"
    recipe existed as a written recipe but was never actually built at
    the route level until this pass; every navigation was an instant
    swap before. `{children}` is wrapped in
    `AnimatePresence mode="popLayout"` + a `motion.div key={pathname}`,
    sliding in from the right / out to the left with the `soft` preset.
    **Term-to-term advancement is explicitly excluded** — a content
    change within the same mic loop, not a screen transition, per
    direct instruction — by tracking the previous pathname in a ref and
    using a `{duration: 0}` transition (not by removing the
    AnimatePresence wrapper for that case, which would risk a genuine
    double-mount of two term screens' side-effecting hooks). Verified
    for real, not assumed: sampled `getComputedStyle(el).transform`
    across several frames during a live navigation and confirmed x
    actually moves 24→0 (and the exiting screen 0→-24) for a real
    transition, and stays frozen at `0,0` for a term-to-term one — see
    the `getAnimations()` gotcha below for why that was the right tool
    and not `getAnimations()`.
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
    this as the *fallback* for its own starting `inputMode` — see
    `lastInputMode` immediately below for the value that actually wins
    once the student has made an explicit choice this session
    (`useTermAttemptState` takes an optional initial-mode arg either
    way) — and re-checks it before switching text→voice mid-term,
    re-showing the mocked `IosPermissionDialog` locally (each term owns
    its own `micPermissionPromptOpen` state + blur/scrim, reusing the
    entry screen's exact pattern) rather than silently switching without
    real permission.
  - **`lastInputMode`** (`useLastInputMode`/`useSetLastInputMode`) — the
    student's most recently chosen modality this session (`"voice"` |
    `"text"`), or `null` if no explicit choice has been made yet. Every
    term computes its starting mode as
    `lastInputMode ?? (micPermissionGranted ? "voice" : "text")`, and
    every term's own `switchToText`/`switchToVoice`/
    `allowMicAndSwitchToVoice` sets it alongside the local `inputMode`
    state — so a switch made on any term carries forward into every
    later term and retry until changed again, instead of silently
    resetting to the `micPermissionGranted` default each time. Also set
    by /confidence-recurring's own mode-choosing actions where it has
    them. Reset only by `resetRecallSession()` (Practice More) — see
    that hook's own doc comment below.
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
    Clears `termOutcomes`/`voiceUsedThisSession`/`recallAttempted`/
    `lastInputMode` back to defaults; deliberately does NOT touch
    `micPermissionGranted` (SPEC.md §2B: a returning student's prior
    grant must carry over, never re-asked). Clearing `lastInputMode` here
    (confirmed with Evelyn, not assumed) means a fresh Practice More
    restart goes back to the plain `micPermissionGranted`-based default
    rather than carrying over whichever mode the *previous* session ended
    in.
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
  **A third variant, `"pre-step"`, was added later** (Figma
  `14033:4400`, "standby" mascot pose — design.md's own "pre-step /
  neutral prompts" mapping) for `/quiz`'s own X — used locally there
  with its own boolean state, not through the layout's shared
  `exitConfirmOpen`/`requestExit`, since "Leave" needs to go to `/path`
  rather than the shared `/streak` every VR screen's exit shares.
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
- `lib/use-scroll-thumb.ts` + `components/scroll-thumb-indicator.tsx` —
  the thin (4px) page-level scroll-thumb mechanism, used across every
  recall screen's own `overflow-y-auto` container; see "Current build
  status" above.

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
- **The mic-loop bottom bar's mode-switch pill is mode-driven, not
  attempt-driven — and its copy is "Type instead"/"Try with voice", not
  "I can't speak right now".** The shared bar (`components/mic-loop-bottom-bar.tsx`)
  always reads "Type instead" in voice mode and "Try with voice" in text
  mode, on every term. This replaced the original "I can't speak right
  now" copy after Module 5 testing (feedback.md [M]: 2/5 testers were
  unsure whether "I can't speak right now" meant an action or a state) —
  don't reintroduce "I can't speak right now," that reverses a validated
  fix. What still doesn't change: the swap is driven only by `inputMode`,
  never by attempt count — don't reintroduce attempt-based or "has tried
  voice once" label-swapping on that pill (an earlier pass tried that per
  an early reading of SPEC.md §3's Idle-state description; Evelyn
  corrected it back to a pure mode-driven flip). Term-2/3's hint screens
  keep their own separate "Type instead" text-link, unrelated to this
  pill. The entry screen's own former "Type instead" secondary button was
  removed entirely per feedback.md — see `(recall)/entry/page.tsx`.

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
- public/images — mascot (Knowie), mic-state, and summary/result-icon art. Complete current list:
  - blazing-summary-with-recall.svg
  - blazing-summary-without-recall.svg.svg *(yes, doubled extension — that's the real filename on disk, not a typo to fix)*
  - checking-it-mic.svg
  - coral-brush-box.svg
  - correct-answer-icon.svg
  - disabled-mic.svg
  - green-brush-box.svg
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
  - purple-brush-box.svg
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
  - **Correction: `element.getAnimations()` can *also* silently miss a
    genuinely-running Motion animation** — querying it on a batch of
    `repeat: Infinity` spinner/pulse elements (the Sending spinner,
    Checking pulse) returned an empty list for the bulk of their runtime
    even though the animation was visibly, continuously running, and even
    though a user had directly reported "these animations don't seem to
    be happening." Re-verifying with `getComputedStyle(el).transform`
    sampled every ~150ms across several seconds showed the rotation/scale
    matrix genuinely changing the whole time — a false negative, not a
    real bug. When the two methods disagree, trust the computed-style
    sampling; don't conclude an animation is broken from `getAnimations()`
    alone.
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
- **The dev server can silently die between turns/sessions — don't
  assume `preview_start` will just reuse it.** A `navigate` call failing
  with "denied or failed" on `localhost:3000` was the process having
  stopped, not a real navigation error. Confirm with `lsof -nP -iTCP:3000
  -sTCP:LISTEN` (or check `preview_list`'s tabs vs its process list —
  they can disagree) before debugging app code; if it's down, `rm -rf
  .next` isn't needed, just `preview_start` with the `dev` config again.
- **`read_page` with `filter: "interactive"` can miss elements that
  appear immediately after the triggering click** — e.g. the mocked
  mic-permission dialog's Allow/Don't Allow buttons were invisible to an
  interactive-filtered read taken right after clicking "Let's go!", even
  though the dialog was genuinely in the DOM (confirmed via a screenshot
  and `filter: "all"`). If expected buttons don't show up right after a
  click, re-read with `filter: "all"` or take a screenshot before
  concluding the click didn't register.
- **This repo deploys via Vercel's GitHub integration — pushing to
  `main` alone triggers a production deploy, no separate deploy step
  needed.** No local `.vercel/project.json` exists; look up the team/
  project via the Vercel MCP tools' `list_teams` → `list_projects`
  (team `egorgds`, project `knowunity-voice-recall`) if you need the IDs
  for `get_deployment`/`list_deployments`. Run `npm run build` locally
  before pushing — `next build`'s `tsc` pass catches errors `next dev`
  (Turbopack) doesn't (see the build-breaking-type-error commit already
  in this repo's history).
- **Figma dev-mode asset URLs (from `get_design_context`, e.g.
  `http://localhost:3845/assets/<hash>.svg`) are directly fetchable via
  `curl` while the Figma desktop app is open.** This gets you the real
  source recipe instead of reverse-engineering one from a screenshot —
  used to fix the entry screen's mascot glow, which turned out to be an
  actual radial-gradient (exact stops/colors pulled from the fetched
  SVG), not a blurred flat circle as the code had assumed.
- **`git stash` is the wrong tool for "does this bug predate my
  changes" checks — it reverts your own uncommitted work along with
  everything else.** Nearly lost a full session's edits running `git
  stash && npm run build` to test against the pre-change code; recovered
  with an immediate `git stash pop`, but reasoning from `git diff`/`git
  show`, or just checking which files your current changes actually
  touch, answers the same question without needing an undo step at all.
- **The Browser pane's `computer` tool and `read_page` don't share a
  coordinate space.** `read_page` reports the viewport in CSS px (e.g.
  390x844), but `computer` screenshots/clicks operate at ~2x that
  (physical px) — a coordinate hand-calculated from a screenshot lands
  in the wrong place. Always click via a `ref_N` from `read_page`, never
  a coordinate guessed from screenshot pixels.
- **`read_page` can return multiple stale, overlapping ref sets during
  an animated route/state transition — clicking one can silently hit
  whatever now occupies that DOM position, not the element you meant**
  (e.g. a stale "Dislike" ref resolving to "Continue" after the sheet
  re-rendered, firing an unintended navigation). Re-read with
  `filter: "all"` immediately before each click rather than reusing
  refs from an earlier read, especially right after a click that
  changes stage/route.
- **`document.getAnimations()`/rAF/`setTimeout` polling only reliably
  observes a Motion animation when triggered and polled inside the SAME
  script call.** Navigating or clicking in one tool call, then polling in
  a separate subsequent call, consistently found the animation already
  fully settled — even a spring that should take 300-800ms. Chaining
  `element.click()` and an immediate polling loop inside one
  `javascript_tool` call does catch it mid-flight. For a route-MOUNT
  animation (fires on page load, not a click you can script), trigger it
  via a client-side navigation you script yourself (clicking a button
  whose handler calls `router.push`) rather than a raw `navigate()` call,
  so the trigger and the poll are still in one script.
- **`AnimatePresence` missing `mode="popLayout"` is a real, recurring
  source of "content pushed down then snaps back" bugs in this specific
  codebase.** Without it, an exiting and entering sibling both stay in
  normal document flow during the crossfade — briefly double-stacking and
  pushing whatever's below them down, then snapping back once the old one
  unmounts. If a "bounce"/"jump" bug is reported near an
  AnimatePresence-driven crossfade, check for this before reaching for
  spring-damping tweaks — every instance with more than one possible
  child at a time needs it (single-child boolean-overlay sheets like
  `SkipConfirmSheet`/`ExitConfirmSheet` don't, since there's never more
  than one child).
- **A Motion `variants`/`animate` change with no explicit `transition`
  falls back to Motion's default spring (stiffness 100 / damping 10 — a
  damping ratio of ~0.5, clearly underdamped) and will visibly
  overshoot.** Hit this independently in multiple unrelated spots
  (`/summary`'s stat tiles, `TermResultRow`) — always give an explicit
  `transition` (this app's own `gentle`/`snappy`/`sheet`/`soft` presets)
  on any `y`/`scale`/`x` animation, even a "just fade this in" one,
  unless a visible bounce is actually wanted.
- **This app's `404.28px` content max-width (`app/layout.tsx`) is
  desktop-mockup-only — real device viewports get no such cap**, so a
  value copied verbatim from Figma's own fixed-width canvas (e.g. a
  `w-[179px]` button matching Figma's `179.333px`) can overflow into its
  own container's padding on an actual narrower phone. Confirmed via
  `getBoundingClientRect()` at a real 375px viewport, not just the 404px
  desktop mockup frame this project's own screenshots default to. If a
  spacing bug only reproduces on a real device and not the desktop
  preview, check for fixed-pixel-width elements sized to Figma's exact
  canvas dimensions first.
- **Two Claude Code sessions can end up pointed at the same project
  directory at once, and Next.js's dev-server lock is per-directory, not
  per-port.** A second `preview_start` refuses to start even on a
  different port, and the second session's Browser pane can't reach the
  first session's server either (separate sandboxes) — `curl` from Bash
  can reach it, but the Browser pane can't. Resolved this session by
  asking the user whether to kill the other session's process; the
  alternative is a git worktree, but `EnterWorktree` is explicitly gated
  to only fire when the user or CLAUDE.md asks for one.
- **Motion's `onAnimationComplete` fires for a no-op "initial state"
  transition too, not just a real one — a genuine trap when `animate` is
  gated behind a boolean that starts `false`.** A pattern like
  `initial="hidden" animate={revealed ? "visible" : "hidden"}` (the
  `/summary` stat-tile stagger, and similar elsewhere) means `animate`
  equals `initial` on first render, before `revealed` ever flips true —
  Motion still invokes `onAnimationComplete` for that non-transition
  almost immediately (~90ms after mount, i.e. next tick, not truly 0),
  which reads exactly like a real animation completing if you're using
  the callback to trigger something (confetti, a sound, a state flip).
  Confirmed by sampling `getComputedStyle(el).opacity` and a rendered
  effect (confetti-piece count) across `~40ms` polling steps inside one
  `javascript_tool` call, per the trigger+poll-in-one-script technique
  above — the effect fired while every tile was still at `opacity: 0`.
  Fix: check the `definition` argument `onAnimationComplete` receives
  (the variant label that just finished, e.g. `"visible"`) and only act
  when it's the transition you actually mean, not any completion.

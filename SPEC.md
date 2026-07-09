# SPEC.md — Voice Recall Prototype Build Plan

This is the concrete build plan: which screens exist, what states each one needs, exactly how they connect, and the exact mocked content. It assumes the reader has also read `sprint-context.md` (why), `design.md` (tokens), `prototype-rules.md` (general mock/accessibility rules), and `motion-guide.md` (animation) — this file doesn't repeat those, it resolves the open questions those files left and turns them into a sequence you can build screen-by-screen.

**Source of truth for the flow/screen designs:** [Figma — Yummy__Knowie---Evelyn](https://www.figma.com/design/czYYTmUKwJFFmqiQ669i4t/Yummy__Knowie---Evelyn?node-id=13499-3646), specifically the "Full Flow ✅ ready for claude" page (node `13499:3646`). Every screen, state, and line of scripted copy in this document was read directly off that file. If something here looks wrong or incomplete, check that file before assuming this doc is authoritative over it.

Where something below is a direct decision from Evelyn, it's stated flatly. Where it's my synthesis of scattered Figma evidence rather than something explicitly confirmed, it's marked **(inferred — confirm)**.

---

## 1. Locked decisions (from the build interview)

1. **Entry sequence — corrected:** confidence tap is its own screen, not merged into the term-1 card. The only merge is for recurring students, where the permission-primer content and the confidence tap share one screen (§2B). Term 1 is always its own separate screen after confidence tap, for both encounters.
2. **First encounter — corrected, no separate fork screen:** there is no distinct "Speak / Type / Maybe later" screen. The permission-primer screen ("Say it back to knowie," Figma node `13900:26392`) *is* the entry screen — its 3 actions (Let's go! / Type instead / X or Maybe later) function as the fork. See §2A for the exact branching, including what X/Maybe-later actually does here (it's not a no-op exit — see §2E).
3. **Returning/recurring student:** no entry fork, no permission primer screen. Opens directly on one merged screen (primer's "Picture this" preview + confidence tap together, mic not asked), top-left X to exit. Picking a confidence option → Knowie: "Let's find out!" → term 1 (separate screen). The edge case of a returning student who has since revoked mic access is explicitly **not built** for this prototype.
4. **Mic permission:** only asked on first encounter, as a native-dialog overlay on the primer screen. Returning students are assumed already granted (revoked-permission edge case excluded per #3).
5. **Term content:** sourced verbatim from the Figma "Full Flow" screens, not the generic subjects in `prototype-rules.md` (those are a stale generic template — superseded here).
6. **Term count — corrected: 4 base terms**, not 5. Note, Time signature, Tempo, Syncopation always play. **Cadence (term 5) is conditional**: it only appears if the student did *not* get all 4 base terms right unaided (i.e. any hint, reveal, or skip among terms 1–4 triggers it as a bonus/make-up round — matching its Figma internal name, "5th term - **practice**"). If all 4 are unaided passes, there's no term 5 and the session goes straight to end-of-session. See §2C.
7. **End-of-session, voice path** (student used the mic for ≥1 term this session): Streak reveal → per-term Recall summary → "You did it!" stats screen.
8. **End-of-session, type-only path** (every term this session was typed): Streak reveal → "You did it!" stats screen with an added nudge line, no per-term summary.
9. **Score tile:** kept. It's the Exam Plan's existing recognition-quiz score, not a Voice Recall running score — the "RECALL 4/5" tile is the recall-specific metric, and that one follows the "session vs. own last session" framing sprint-context.md locked in (for returning students, per-term summary captions compare to their prior session instead of pointing at a study chapter).
10. **Share button:** kept, on both the streak and stats screens. Reasoning: Share is an existing native-app convention (used elsewhere in Knowunity), not a new social/community feature being introduced by Voice Recall — so it isn't the kind of element CLAUDE.md's Harry-sign-off gate is about. **(This reasoning is Evelyn's; keep it attached to the decision so a future pass doesn't strip Share thinking it's the gated element.)**
11. **"Say-it-back" step:** dropped for this build. The pre-send "Hear back or send" playback covers the "hear your own voice" need; no separate post-result repeat-it-back moment exists.
12. **5th term / "one more before we wrap up":** in scope.
13. **Skip / defer:** never an instant fail. Deferred term rejoins the queue at the end.

---

## 2. Full flow map

### 2A. First encounter

```
Mic-permission primer ("Say it back to knowie" — this IS the entry screen, node 13900:26392)
        │
        ├─ X (top-left) or "Maybe later" ──► skip the entire term loop ──► no-recall-path
        │                                     end-of-session: Streak reveal → "You did it!" stats
        │                                     + nudge line (§2D's type-only path, reused as-is)
        │
        ├─ "Type instead" ─────────────► Confidence tap (separate screen), typing mode carried forward
        │
        └─ "Let's go!" ─────────────────► native OS mic-permission dialog overlays THIS SAME screen
                  ├─ Allow ─────────────► Confidence tap (separate screen), voice mode carried forward
                  └─ Don't Allow ───────► routed into the type-instead path above → Confidence tap,
                                          typing mode carried forward (confirmed by Evelyn)
                        │
                        ▼
        Confidence tap (separate screen, 3-tier) → pick one → Knowie: "Let's find out!"
                        │
                        ▼
                    Term 1 (separate screen), voice or typing mode per branch above
```

**Flag:** sprint-context.md describes "Maybe later" as "a clean exit, no penalty, re-surfaces next time" — Evelyn's direct instruction here (jump to the no-recall summary instead of just leaving) is more specific than that line and supersedes it, but it's worth knowing the two docs phrase this differently. Locked as: X/Maybe-later on this screen specifically routes to the summary, not a bare app-exit.

### 2B. Returning / recurring encounter

```
Merged screen: "Picture this" preview + confidence tap together (top-left X to exit, mic not asked)
        │
        ▼
   pick a confidence option → Knowie: "Let's find out!"
        │
        ▼
    Term 1 (separate screen)
```

Note: unlike first encounter, this merged screen does not itself have Skip/Type-instead/Continue as term-level actions — those belong to term 1's own idle state (§3), which follows right after. The merge here is specifically primer-content + confidence-tap, not confidence-tap + term-1.

### 2C. Term loop (both encounters converge here)

The 4 base terms run in order: **Note → Time signature → Tempo → Syncopation.** Each term is a self-contained state machine (detailed in §3) that always resolves to one of: **unaided pass, passed-with-hint, revealed, or skipped** — never a hard fail, never blocking.

```
After term 4 (Syncopation) resolves:
        │
        ├─ all 4 base terms were unaided passes ──► skip term 5 entirely ──► end of session (§2D)
        │
        └─ any hint / reveal / skip happened among terms 1–4
                    │
                    ▼
        "One more before we wrap up!" interstitial
        (mascot wink, "Woohoo! One more before we wrap up. You are doing great!", single Continue)
                    │
                    ▼
        Term 5 — Cadence (bonus/make-up round, same state machine as §3)
                    │
                    ▼
              end of session (§2D)
```

In the specific committed demo script (§4), terms 2–4 each use a hint, reveal, or skip — so term 5 (Cadence) does trigger in that script, resolving as an unaided pass.

### 2D. End of session

```
Base terms (+ term 5 if triggered) resolved
        │
        ├─ any term done via voice ──► Streak reveal ─► Recall summary (per-term chips) ─► "You did it!" stats
        │
        └─ every term typed ─────────► Streak reveal ─► "You did it!" stats + nudge line
                                          ("I'll be here if you wanna explain out loud too,
                                           I'll be fun too")
```

The primary CTA on the stats screen ("Claim XP") loops back to a fresh confidence tap for a new practice round, per sprint-context.md's "Practice More re-fires the confidence tap" rule. **(inferred — confirm the button does this; the Figma label is "Claim XP," not "Practice More," so the loop-back behavior itself isn't directly shown on that node.)**

### 2E. Exit, anywhere in the flow

Two different X behaviors, depending on where the student is:

- **On the first-encounter entry/primer screen itself (before confidence tap or term 1 has happened):** X and "Maybe later" both do the same thing — skip straight to the no-recall-path end-of-session summary (§2A). No confirmation sheet here.
- **Everywhere else once the loop is underway** (confidence tap, any term, the merged recurring screen): top-left X → soft exit-confirmation sheet (never a hard block): mascot + reassuring headline + "Keep learning" (primary, dismiss) / "Leave" (secondary, exits immediately). Two copy variants exist — use whichever matches context:
  - First encounter, early in the loop: *"You got this! Next time, try saying one out loud — it's how it really sticks!"*
  - Mid-session / returning: *"Almost there! Your progress will be saved for when you're back."*

---

## 3. Per-term state machine

Applies to every term. States map directly to `motion-guide.md`'s recipes (recording pulse, processing dots/shimmer, sheet slide-up, etc.) — build the states, animate them per that guide.

1. **Idle** — Knowie's prompt bubble; large mic button, "Tap to answer"; helper caption "Try to go to quiet place for better results >.<"; bottom bar: skip icon-button + **"I can't speak right now"** (first attempt on this term) or **"Type instead"** (any later attempt on this term, once voice has already been tried once — the label swaps, don't leave it stuck on the first-attempt copy).
2. **Recording** — mic recolors to `accent/magenta/bold`, icon → pause; "Recording" label; 7-bar waveform (magenta) + running timer; delete/cancel icon-button beside it.
3. **Paused / review** — mic-sized circle turns blue, icon → play; "Hear back or send"; frozen waveform + timer; delete icon-button; send icon-button (circular arrow).
   - Play → **Hearing back**: circle turns orange, icon → pause, "Hearing back", waveform animates (played back audio).
   - Delete → back to Idle (re-record).
   - Send → **Sending**.
4. **Sending** — dim spinner circle, "Sending", "Tap to cancel" link; "What I heard." (voice) / "What you wrote." (typed) transcript-echo card appears showing the mocked transcript.
5. **Checking it** — mascot processing-face avatar, "Checking it" / "Give me a second"; ~1–1.5s simulated delay (per motion-guide.md — this is the only "fake latency" in the whole prototype, keep it there and nowhere else).
6. **Result** — one of:
   - **Unaided pass:** question bubble dims (50% opacity), new answer bubble appears with Knowie's affirming reply; celebratory bottom sheet (`feedback/success/subtle` bg, green heading) with like/dislike icons + "Why?" (secondary) / "Continue" (primary). Continue → next term.
   - **Partial (so-so tone):** bottom sheet "Almost there!" (gold tone), gentle copy, "Hint me!" / "Try again". Hint reveals inline in the thread, sheet dismisses, bottom bar becomes skip-icon + "Try again" (primary) + "Type instead" (link).
   - **Wrong (2-hint ladder):** bottom sheet "You are closer!" (coral tone) on both the 1st and 2nd miss, "Hint me!" / "Try again" each time. After the 2nd hint, a 3rd wrong/no-retry resolves to **Reveal**: Knowie states the answer outright, bottom sheet "We'll do it next time!" (purple tone, distinct from the coral "still trying" tone), single "Got it - Continue" — terminal, no further retries.
   - **Skipped:** triggered by the skip icon-button from Idle, Recording, or any hint state. Bottom sheet "We can review this one later no worries!" → "Continue" / "Move to next term" → term deferred to the end of the queue.
   - **Mishear dispute:** available as an underlined "Did knowie mishear you?" link on any wrong/partial result. Tapping it resets to a clean Idle state for the *same* term with Knowie saying "Sorry about that, lets try again! [prompt]" — no hint consumed, no penalty. This is the mechanism that protects against a bad mock-transcript match feeling unfair.

**Typed-fallback variant:** tapping "I can't speak right now" / "Type instead" from Idle swaps the mic button for a single growing text box with an inline send control (no separate pause/hear-back step — compose and send is one action) plus the native keyboard. From Sending onward, it's the same state machine as voice. "Try with voice" is offered back at the bottom throughout, so the switch works both directions, not just voice → type.

---

## 4. The term script (4 base terms + 1 conditional)

This is the actual scripted content, pulled verbatim from Figma where a frame existed for it. Gaps are called out explicitly — do not invent lines to fill them without flagging that they're new. Term 5 (Cadence) only appears per the trigger rule in §2C — in this committed demo script it does trigger, since terms 2–4 each use a hint, reveal, or skip.

### Term 1 — Note
- Prompt: *"First one: in your own words, what's a note?"*
- Scripted outcome this session: **unaided pass**, first try.
- Result reply: *"You got it! A note is a sound with a specific pitch."* — sheet heading "Exactly right".
- **Gap:** no wrong/hint/skip content exists for this term (it's never missed in this script). If a tester somehow lands here after backing out and retrying, fall back to the generic partial/wrong sheet copy from another term rather than leaving it blank.
- The Figma typing-mode mock shows a long illustrative draft answer ("A note is a single musical sound with a specific pitch. It is also the written symbol on a staff...") — this reads as filler to demonstrate the text box scrolling, not necessarily the canonical typed answer. Use it or shorten it; either is fine.

### Term 2 — Time signature
- Prompt: *"Next: what does a time signature tell you?"*
- Scripted outcome: **partial → passed with hint.**
- First miss: sheet "Almost there!", Knowie: *"You are almost there! Take your time and try again."*
- Hint 1: *"Two numbers stacked on top of each other. What does the top one tell you?"*
- **Gap:** the in-thread "nailed after hint" reply line wasn't found as its own frame. The Summary screen confirms the outcome (chip "With a hint", caption "Review Chapter 2 about music theory and you'll nail it!") but not the exact in-conversation line said the moment they get it right on the retry. Write one in Knowie's established voice (short, warm, not robotic) consistent with the Term 1/5 pattern, and flag it as authored-not-sourced.

### Term 3 — Tempo
- Prompt: *"Half way there! What's tempo?"*
- Scripted outcome: **wrong twice → hint ladder → revealed.**
- 1st miss — mocked transcript ("What I heard."): *"Tempo is how loud or soft a song is, like when you press the pedal to make the music sound fast."* Knowie: *"Not exactly! But you are getting closer."*
- Hint 1: *"Think about it in two parts, what does a note tell a musician about a sound?"*
- (If mishear disputed here, retry line: *"Sorry about that, lets try again! What's tempo?"*)
- 2nd miss — mocked transcript: *"Tempo is just the speed of the notes, so a song with a lot of fast sixteenth notes automatically has a faster tempo than a song with slow whole notes."* Knowie: *"Mmm...Not quite yet, you got one more hint!"*
- Hint 2: *"1, 2, 3, 4....1, 2, 3, 4. What does that tell you?"*
- Reveal: *"We can review next time: Tempo is the speed or pace of a piece of music — how fast or slow it's played."* Sheet: "We'll do it next time!" → "Got it - Continue".
- Summary row: chip "Revealed" (coral), caption "Review Chapter 1 about music theory and you will crush it!"

### Term 4 — Syncopation
- Prompt: *"We are very close! What's syncopation?"*
- Scripted outcome: **skipped**, never attempted.
- Skip sheet: *"We can review this one later no worries!"* → "Move to next term" (advances to Cadence).
- Summary row: chip "Skipped" (gray), caption "Let's try this one next time!"
- **Gap:** no result/hint content exists for this term since the script never attempts it. If a tester answers instead of skipping, reuse the Term-2/3-style partial/wrong sheets generically.

### Term 5 — Cadence (conditional bonus/make-up round — see §2C for the trigger rule)
- Prompt: *"Last one for this set: what's Cadence?"*
- Scripted outcome: **unaided pass.**
- Summary row: chip "On your own" (green), caption "Amazing work! Strong end."
- **Gap:** the exact in-thread affirming reply line (equivalent to Term 1's "You got it! A note is...") wasn't found as its own frame. Author one in the same short/warm pattern, flagged as authored-not-sourced.

### Confidence-tap options (own screen for first encounter; merged with the primer for recurring)
*"Very confident!"* / *"Somewhat, I think I got it"* / *"So so, but I'm gonna try"* — verbatim from the Confidence tap screen, reused as-is for both encounters.

### "Picture this" preview card copy
*"You're teaching a friend who missed class, 4 terms."* — this is correct as written. The 4 refers to the base terms (Note, Time signature, Tempo, Syncopation); Cadence is a conditional 5th round the card doesn't need to mention.

---

## 5. Mocked vs. real (pointer, not a repeat)

Full rules live in `prototype-rules.md` — this build follows them exactly: no real STT/audio/API, deterministic scripted outcomes per term above, ~1–1.5s fake "Checking it" delay only, Knowie replies in text only, mic tap/hold just advances the mocked state machine. Nothing in this spec introduces an exception to that.

---

## 6. Explicitly out of scope

- Pause/resume **into one take** (stopping and resuming the *same* recording mid-sentence) — out of scope per sprint-context.md. This is distinct from the in-scope stop → review (hear-back/delete) → send sequence in §3, which is a one-shot take reviewed once, not a resumable multi-part recording.
- Mid-answer language switching.
- Mic-hardware-busy handling.
- Open Q&A / tutoring branches.
- Any entry point into Voice Recall from outside the Exam Plan.
- Voice output / TTS of any kind.
- Any community/social element beyond the existing Share convention already addressed in §1.10.
- A dedicated "say-it-back" repeat-the-definition screen (§1.11).
- Duplicate/alternate-position Figma frames that don't add new content (extra Confidence-tap instances, the green "Perfect lesson" full-bleed takeover, the "not perfect" muted variant) — these were shortlist alternatives, not part of the committed sequence in §2.

---

## 7. Verification checklist

- [ ] First encounter opens directly on the permission-primer screen (no separate fork screen before it): native permission dialog overlays it on "Let's go!" → confidence tap (own screen) → "Let's find out!" → term 1 (own screen). "Type instead" and Don't-Allow both land on confidence tap in typing mode; X/"Maybe later" skip straight to the no-recall summary, not a bare exit.
- [ ] Returning encounter: opens directly on the merged primer-preview + confidence-tap screen (no separate primer, no permission dialog), top-left X present; picking an option → "Let's find out!" → term 1 (own screen).
- [ ] Confidence tap is never shown as part of the term-1 screen itself, for either encounter.
- [ ] All 4 base terms play in order (Note, Time signature, Tempo, Syncopation) with their scripted outcomes from §4.
- [ ] Term 5 (Cadence) is skipped entirely on an all-4-unaided run, and triggers (with the "One more before we wrap up!" interstitial first) whenever any hint/reveal/skip happened among terms 1–4.
- [ ] Idle → Recording → Paused/review (hear-back / delete / send) → Sending → Checking it → Result works for voice on at least one term.
- [ ] Typed fallback works end-to-end on at least one term, both directions (voice→type and type→voice).
- [ ] Can't-speak button label swaps from "I can't speak right now" to "Type instead" after a term's first attempt.
- [ ] Hint ladder: partial path shows 1 hint before resolving; wrong path shows 2 hints then a terminal reveal; tone is visibly gentler on partial than on wrong.
- [ ] Mishear-dispute link resets the same term cleanly, no hint burned.
- [ ] Skip works from idle, recording, and any hint state; skipped term reappears at the end of the queue, never an instant fail.
- [ ] Ending on any voice-touched session shows Streak → Recall summary → You-did-it stats, in that order.
- [ ] Ending on an all-typed session shows Streak → You-did-it stats with the nudge line, and skips the per-term summary.
- [ ] Score tile and Share button both present on the stats screen; Recall summary captions compare to last session for a returning student (not chapter pointers).
- [ ] X, at any point, opens the soft exit sheet (correct copy variant for first vs. returning) and "Leave" always exits immediately — never a hard block.
- [ ] Nothing animates besides transform/opacity; reduced-motion is respected; correct/partial/missed/skipped are each distinguishable without color alone.
- [ ] No raw hex, no value outside `design.md`'s tokens, dark mode only, 390px mobile viewport only.

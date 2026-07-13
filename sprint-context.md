# Voice Recall — Build Context
Knowunity Exam Plan, Module 3 → 4. Concept locked; entry sequence (below) still open — don't treat it as final.

## What this is
- In-path Exam Plan step: after revising, student explains a key term aloud (or types it); Knowie replies in text only, judges recall quality, gives hints.
- Primary build target: Sofia Reyes (voice-comfortable, ~15%). Marcus Chen (voice-hesitant, ~85%) is the conversion target, not a separate design — de-risked by the same four mechanisms built for Sofia: generous judging, permission priming, a real text fallback/skip, and the single passive summary signal.
- Problem it solves: quiz/flashcard test recognition, not retrieval — this step forces retrieval.

## Committed concept
One-liner: **"Explain it out loud like you're teaching a friend who missed class — wrong costs nothing, right feels earned."**

Tensions accepted, not solved — design around these, don't assume they're closed:
- The judge has to catch confident-but-wrong answers, since getting it wrong costs nothing.
- The results screen has to work equally well for a confident talker and a shy typer.
- The confidence tap only works if students answer honestly — a self-conscious student might not.

## Core flow (entry → exit)
1. Entry fork: Speak / Type / Maybe later — first encounter only; returning students skip straight to step 3. "Maybe later" is a clean exit, no penalty, re-surfaces next time.
2. Mic permission primer → native OS dialog. First encounter only; returning students resolve this at the mic tap, and only if not already granted.
3. Confidence tap (3-tier: Very / So-so / Not really) — fires once, session start.
4. Term loop (1–4 terms): prompt → record or type → processing (<4s) → result (`unaided_pass` / `passed_with_hints` / `revealed` / `skipped`) → hint ladder if needed → say-it-back offer (voice only) → affirmation.
5. Hard/skipped term: single deferral to end of queue, never an instant fail.
6. Session end: calibrated reveal, start-of-session confidence vs. actual outcomes (Illusion of Mastery).
7. Summary: unaided-pass count out of N, cross-session improvement callback, one passive anonymous signal (pending Harry's sign-off). "Practice More" re-fires the confidence tap (step 3).

⚠ **Open:** steps 1–3 have 3 candidate simplifications prototyped (presentation-merge confidence into the term-1 card / reorder so both Knowie-voice beats sit together, primer immediately before mic / cut the primer entirely) — none chosen yet. Don't lock a "final" version of steps 1–3 until this resolves.

**Placement:** primary slot is the next quiz card in-path, last step before the mock exam. Also appears inline inside True/False and MCQ cards as an optional, secondary placement — same fork, offered as an occasional alternate way to answer, additive to the primary slot, not a replacement for it.

## Key decisions (decision — because reason)
- Confidence tap fires twice only, start + end, never per-term — per-term asks feel like constant testing (this is why per-term Idea 4B was dropped).
- Confidence tap can't be removed, moved after the first attempt, or merged into the entry fork (step 1) — the end-of-session reveal depends on it as a fixed baseline.
- Progress is framed session-vs-own-last-session, not a running per-term score — a running score reads as continuous grading, breaks felt safety.
- Wrong-answer and so-so-answer loops share the same hint-ladder mechanics but distinct tone — wrong needs correction, so-so needs encouragement, not the same voice.
- Session = one app visit, not one practice loop — this is what resets the confidence tap.
- Score is diagnostic only: no mandatory pass threshold, no fixed weighted formula yet — right weighting needs real usage data, not a guess now.
- No stark red "Incorrect" state, ever — a false wrong from mishearing is worse here than in multiple-choice; judge and UI both lean generous.
- Text fallback is visually and tonally equal to voice, never a lesser/second-class path — that's what keeps switching to it from feeling like giving up.
- Target reskin: mascot is "Knowie", typefaces are Inter Variable and Bricolage (not proprietary Greed VF) — build against the reskin, not the current live app.

## Can't-speak fallback
Typing is a real parallel option offered at the entry fork itself, not something revealed only after a failed voice attempt. Switching to it any time never traps the student; it runs the same judge/hint-ladder logic, minus the voice-only "say it back" step.

## Constraints — do NOT build
- No open Q&A or tutoring branch — recall only, never answer a student's question.
- No entry points outside the Exam Plan in v1 — no home-page pill, no post-quiz entry, no standalone chat mode.
- No voice output, ever — Knowie is text-only, no TTS.
- No auto-endpointing — push-to-talk only, explicit stop = send.
- Never blocking — soft-gated; skip/exit must always be reachable in one tap.
- Community signal capped at one passive, anonymous element on the summary screen — nothing visible, competitive, or inside the recall loop, and it's unshipped until Harry signs off.
- Not this sprint: pause/resume into one take, mid-answer language switching, mic-hardware-busy handling — known gaps, explicitly out of scope.

## Testing Findings (Module 5 — The Stress Test)

5 moderated sessions (Paula, Yomar, Raquel, Teresa, Heber) tested the Module 4
prototype against the four riskiest assumptions: confidence-tap honesty,
mic-denial → text-fallback discoverability, hint-ladder drop-off, and STT/judge
trust. Full synthesis and per-item fixes live in `feedback.md` (handoff doc for
Module 6). This section holds the load-bearing summary.

**Top findings:**

- **Judge results don't reliably match what students said** (3/5: Yomar, Raquel,
Paula*) — including "I don't know" scored as correct, and an unrelated answer
scored as correct. This is the sharpest hit on the north star: trust anxiety is
exactly what "costs nothing to get wrong" depends on, and a wrong verdict reads
as the system lying, not as a fair miss.
- **Skip reads as exiting the whole session, not the current term** (3/5: Yomar,
Teresa, Heber). Threatens both "never trap the student" and "soft-gated, never
blocking" at once — if skip feels more consequential than it is, students avoid
using it when they'd actually benefit from it.
- **"I can't speak right now" copy is ambiguous** (2/5: Teresa, Heber) — read as
a command/state rather than a tappable action. Both testers independently
proposed the same fix ("Type instead"), which is a strong signal it's the right
one.
- **Students want to see what was captured, not just be told a verdict**
(explicit: Paula; reinforced by the same trust gap in Yomar/Raquel's mismatch
reports above). A transcript view and the mishearing-recovery flow are the same
underlying need and should be designed together.
- **Modality choice tracks confidence and framing, not voice comfort** (2/5:
Raquel, Paula) — Raquel typed on uncertain terms and voiced confident ones;
Paula converted to voice once the task was framed as "explain it out loud,"
not because she was told to. Genuinely open whether this is the text fallback
working as designed or voice still feeling risky when unsure — not resolved by
this round.

**What's getting fixed (Module 6):**

- Ship the already-locked 4.7 mishearing-recovery flow, paired with a visible
transcript view — same fix, same screen.
- Relabel skip with explicit per-term copy ("Skip this term").
- Rename the can't-speak fallback to "Type instead."
- Add a first-use "Tap to talk" affordance (tap-vs-hold gesture confusion hit
one tester but fully blocks voice for anyone sharing that mental model).
- Hint-content relevance pass, "Try Again" copy expectation-setting, and a
short list of prototype-fidelity bugs — all copy/content fixes, no mechanic
changes.
- **Blocked, not scheduled:** a "why" explanation on the result screen, and any
change to modality defaults or nudging toward voice. Both are real fixes but
each touches an open question or the brief's Non-Goal #1 (no tutoring/open
Q&A) — held until I sign off explicitly, item by item, and "why" separately
needs Harry's read since it's a brief-level constraint, not a design call.

**What worked well — protect this going into Module 6:**

- 5/5 said they'd use the real app. One tester (Raquel) independently reframed
it as an end-of-study weak-spot diagnostic rather than a mid-study checkpoint —
worth carrying to launch positioning, separate from the UX fixes above.
- Near-unanimous persistence: no skip-abuse, no boredom, no early exits, even
against content nobody actually knew. Zero reveal-seeking anywhere in the data.
This is the strongest evidence the "peer, not evaluator" mechanism is doing its
job — don't let the fixes above dilute it.
- The intro illustration/mascot landed exactly as designed — unprompted delight,
not a single complaint. Validates the "swag, not study" tone bet; don't restyle
without reason.
- The hint ladder itself works when hint content is on-topic (Heber
self-corrected across multiple terms using it as designed) — the fix above is
content-authoring, not the mechanic.

**Still open, not resolved by this round:** confidence-tap honesty (zero UX
friction observed, but that only confirms the screen isn't confusing — it says
nothing about whether the tap was a genuine prediction or a reflexive one).
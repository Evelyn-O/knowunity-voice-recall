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
- Target reskin: mascot is "Noe" (not "Knowie"), typefaces are Inter Variable and Bricolage (not proprietary Greed VF) — build against the reskin, not the current live app.

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

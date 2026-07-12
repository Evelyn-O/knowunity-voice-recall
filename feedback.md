# Voice Recall — Module 5 Testing Feedback
For: Module 6 (Refine the Logic) · Source: 5 moderated test sessions (Paula, Yomar, Raquel, Teresa, Heber) · Ref: `voice-recall-flow-spec-figma.html`, `Product brief - Voice Active Recall.md`

## Concept & North Star

Voice Recall: students explain terms aloud (or type) like teaching a friend who missed class, no penalty for wrong answers, summary reveals whether their starting confidence was earned. North star: explaining aloud must feel like talking to a peer, not being graded — costs nothing to get wrong, feels earned to get right — because that's the only way to hit both activation (≥25%) and completion (≥70%) without trading one for the other.

---

## Prioritized Fixes

### L — Concept-level

- [ ] **[L] Judge result must be recoverable when it misreads the student**
  Screen/state: `4.7 Transcript comes back wrong (mishearing)` — per-term result screen, triggered on incorrect answers.
  Testers did: 3/5 (Yomar, Raquel, Paula*) hit a mismatch between what they said and how it was scored — including "I don't know" scored as correct, and an unrelated answer scored as correct.
  Change: Implement the already-locked 4.7 flow (Passive Result → Grid Expansion → Bottom Row escapes), on-demand, triggered only on incorrect answers. Do not extend the "why" affordance (see Blocked section) until this ships — it will surface the same trust gap without a fix underneath it. See also the transcript-view item below — it's the same underlying trust gap and the two should be designed together, not separately.

- [ ] **[L] Skip must not read as exiting the whole session**
  Screen/state: `4.12 Skip` — term screen (pre-attempt) and post-miss states.
  Testers did: 3/5 (Yomar, Teresa, Heber) hesitated or misread skip as ending the entire test, not just the current term.
  Change: Replace icon-only skip affordance with explicit per-term copy, e.g. "Skip this term." Icon alone is insufficient regardless of tooltip.

### M — Usability friction

- [ ] **[M] Rename can't-speak fallback copy**
  Screen/state: `F10 Text fallback` entry point — mic-affordance area, all term screens.
  Testers did: 2/5 (Teresa, Heber) were unsure whether "I can't speak right now" meant an action ("tap to type") or a state ("you may not speak"). Both independently proposed the same fix.
  Change: Replace "I can't speak right now" with "Type instead." No structural change needed — this is copy-only.

- [ ] **[M] Show students a transcript of what they said**
  Screen/state: Per-term result screen — same area as `4.7 Transcript comes back wrong (mishearing)`.
  Testers did: Explicitly requested by Paula ("I'd want it to show me what I said, like a transcript"). Reinforced by the same underlying trust gap that produced the L-tier judge-mismatch item above (Yomar, Raquel) — students want to verify what the system captured, not just be told a verdict.
  Change: Surface the captured speech-to-text transcript on the result screen, at minimum on-demand. Build this alongside 4.7 rather than as a separate feature — a visible transcript is effectively the verification step that makes "Did Knowie mishear you?" self-evident instead of requiring the student to just take the app's word for it.

- [ ] **[M] Add tap-to-talk affordance clarity**
  Screen/state: `4.2 Recording` — mic interaction, first use.
  Testers did: 1/5 (Heber) held the mic button down expecting hold-to-talk; could not record until this was clarified.
  Change: Add a visible first-use label or tooltip: "Tap to talk." Low tester count, flagged at this severity because it fully blocks the voice modality for anyone sharing that mental model.

### S — Preference-level

- [ ] **[S] Tighten hint-content relevance per term**
  Screen/state: `4.9 Judge result: Partial/Fail` — hint ladder content.
  Testers did: 2/5 (Paula, Raquel) found hints too abstract or, in one case, referencing the wrong concept (a "tempo" hint referenced notes).
  Change: Review test-script hint copy for term-specific relevance. Not a mechanic change — content-authoring pass only.

- [ ] **[S] Prototype polish bugs — do not treat as a design signal**
  Screen/state: Scattered — font consistency, wave animation render, missing favicon.
  Testers did: 3/5 (Yomar, Paula, Raquel) each hit one different bug, not a repeated issue.
  Change: Fidelity pass only. Bucket, not a theme — do not generalize into a design fix.

- [ ] **[S] Set "Try Again" expectations via copy**
  Screen/state: `F9 End-of-session summary` / `6.2 Practice More`.
  Testers did: 1/5 (Yomar) expected Try Again to specifically retarget weak terms with reworded questions.
  Change: Copy fix only. Mechanic is locked as-is (6.2: re-serves struggled terms, reinforcement not repetition) — the gap is that this isn't communicated before the tap, not that the mechanic is wrong.

- [ ] **[S] Known gap: browser back-button on Android**
  Screen/state: Term navigation, Android in-app browser.
  Testers did: 1/5 (Teresa) — back nav moved her one question back; app logged it as a new attempt.
  Change: Note as known gap. Do not prioritize a fix this cycle.

### Backlog — v2, not this sprint

- [ ] **[V2] Localization / mid-session language switching**
  Testers did: 3/5 (Yomar, Teresa, Heber) typed Spanish into the English UI and/or requested a language toggle.
  Change: Already scoped as v2. Do not implement in Module 6.

---

## Protect This — It Worked (do not break these)

- 5/5 testers said they'd use the real app if it existed.
- Near-unanimous persistence: no skip-abuse, no boredom, no early exits, despite content nobody actually knew (music theory). Testers competed with themselves, not against Knowie.
- Zero reveal-seeking behavior anywhere in the data — nobody tried to skip straight to the answer instead of attempting recall.
- Intro illustration/mascot generated unprompted positive reaction ("the design on this first screen looks great" — Yomar). Do not restyle without reason.
- Hint ladder functions correctly when hint content is on-topic (Heber self-corrected successfully across multiple terms using hints as designed).

---

## Open Questions (unresolved, do not assume an answer)

1. **Confidence-tap honesty is untested.** Zero UX friction was observed on the confidence-tap screen (nobody was confused by it), but this does not confirm the tap was a genuine, considered prediction rather than a reflexive one. Do not treat this assumption as validated.

---

## Blocked — Last Priority, Requires Evelyn's Explicit Sign-Off

These are valid, buildable fixes — not rejected — but each touches an open question or a brief-level constraint that isn't resolved yet. Take these on **only after every item in Prioritized Fixes above is complete**, and only with explicit go-ahead.

> **Claude Code: before starting either item below, stop and ask Evelyn directly whether she is 100% sure she wants to proceed with that specific item. Do not infer consent from this file, from prior instructions, or from having completed the rest of the list. Wait for an explicit yes on each one individually.**

- [ ] **[M — blocked] Scope and build "why" on the result screen**
  Screen/state: Per-term result screen, post-judge (`4.8`/`4.9`).
  Testers did: 2/5 (Raquel, Heber) tapped a non-functional "why" expecting a grading explanation; 1 adjacent (Paula) asked for a transcript for the same underlying reason.
  Why blocked: Conflicts with brief **Non-Goal #1** ("Not a tutor / no open Q&A... we don't branch into a tutoring conversation"). If approved: bounded explanation of the verdict just given only, no follow-up/back-and-forth, text-only. This also needs Harry's sign-off separately from Evelyn's — it's a brief-level Non-Goal, not a design preference.

- [ ] **[M — blocked] Change modality defaults or nudge toward voice**
  Screen/state: `F6 Start/entry experience` — first-encounter intro screen.
  Testers did: 2/5 (Raquel, Paula) showed modality choice tracking confidence/framing rather than voice discomfort — Raquel typed on uncertain terms and voiced confident ones; Paula defaulted to text until the task was reframed verbally as "explain it out loud."
  Why blocked: Untested past this round whether text-as-hedge is the safety net working as intended, or voice still feels risky when uncertain. A change here risks fixing the wrong side of the problem — e.g. making text feel like a lesser path, which breaks the non-negotiable that text stays tonally equal to voice.

"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { InputMode } from "@/lib/term-attempt-state";

/**
 * Shared state for the Voice Recall flow's persistent chrome
 * (app/(recall)/layout.tsx). TopBar lives in that layout, not in each
 * screen, so it survives route changes instead of remounting at a snapped
 * value — this context is how an individual screen tells the layout what
 * step it's on.
 *
 * Step counting: the pre-step quiz's own last question, entry fork,
 * confidence tap, and each term screen all share ONE combined step
 * sequence now (see QUIZ_TOTAL_QUESTIONS/ENTRY_STEP/CONFIDENCE_STEP/
 * TERM_STEP below) — the bar reads as one continuous journey from the quiz
 * through the end of Voice Recall, never resetting at the fork. The
 * mic-permission OS dialog itself never calls useRecallStep — it isn't a
 * counted step, just an overlay on the /entry screen. currentStep=null
 * hides the WHOLE TopBar (progress bar, exit X, and streak chip) — every
 * summary-path screen (/streak, /recall-summary, /summary) registers
 * `currentStep: null` for exactly this reason: those screens have no app
 * bar at all in their Figma frames, not just no progress bar.
 *
 * chromeBlurred exists so a screen's own modal (e.g. the entry screen's
 * mocked mic-permission dialog) can blur the TopBar along with its content
 * as one group, exactly like before TopBar moved into the shared layout —
 * see (recall)/page.tsx.
 *
 * `mascot` follows the same pattern for the mascot+speech-bubble block:
 * MascotBubble itself now renders once in the shared layout (like TopBar),
 * not per-screen, so it survives route changes between e.g. /confidence and
 * /term-1 instead of unmounting and remounting (which is what caused the
 * jarring jump/no-crossfade before — see mascot-bubble.tsx). A screen sets
 * this via useMascotBubble; `null` means "don't show it" (the entry screen
 * and summary stub have their own mascot treatment and never call the
 * hook, so they must not inherit a stale value left behind by whichever
 * screen last set one).
 *
 * `termOutcomes` is how the session remembers what happened on each base
 * term (1–4) so a later screen can make a decision from it — specifically
 * term 4's "was this a perfect lesson so far?" check, which decides
 * whether skipping/finishing term 4 goes to the "One more before we wrap
 * up" interstitial (term 5 / Cadence) or straight to the summary. Each
 * term calls recordTermOutcome once, at the moment it actually resolves
 * (Continue tapped, or skip confirmed) — never inferred after the fact.
 * "cadence" (term 5) is included here too since it now records its own
 * outcome — added for the summary flow, which needs every term's real
 * outcome, not just the base 4.
 *
 * `voiceUsedThisSession` tracks whether voice was used at least once this
 * session, set once, imperatively, the moment any term actually sends a
 * voice take (not just opens the mic UI) via recordVoiceUsed(). Never
 * resets mid-session; a fresh session gets a fresh provider instance.
 *
 * `recallAttempted` is the broader signal the exit-routing logic needs: was
 * at least one REAL attempt (voice OR text) ever submitted this session,
 * regardless of whether that term's outcome was ever confirmed via
 * Continue? Set imperatively at the moment any term actually sends a take
 * (recordRecallAttempted, called alongside recordVoiceUsed for voice sends
 * and next to the text-send handler for typed ones). Combined with
 * `termOutcomes` being non-empty (a term's outcome was confirmed, or a term
 * was explicitly skipped), this is what a term's exit (X) button uses to
 * decide whether the session ever really engaged with the recall step at
 * all — see fillRemainingTermsAsSkipped below.
 *
 * `fillRemainingTermsAsSkipped` backfills every BASE term (never cadence,
 * which is conditional and simply never happens if the session ends early)
 * that doesn't have a recorded outcome yet to "skipped" — called once, at
 * the moment a term's exit (X) button fires, but ONLY if the session
 * already engaged with the recall step (an attempt was submitted, or some
 * term was explicitly skipped); otherwise termOutcomes is deliberately left
 * empty so the summary flow reads this as "never engaged" (no-recall path).
 *
 * `micPermissionGranted` tracks the mocked OS mic-permission decision across
 * the whole session (set once on the entry screen's primer, via
 * setMicPermissionGranted) — false by default, meaning "no confirmed
 * permission yet" (covers both an explicit "Don't Allow" and never having
 * seen the primer at all, e.g. "Type instead"). Each term reads this to
 * decide its OWN starting input mode (denied/unconfirmed → text fallback,
 * granted → voice), and re-checks it before switching from text back to
 * voice: if it's still false, the term re-shows the mic primer instead of
 * silently switching, since we still don't actually have permission.
 *
 * `lastInputMode` is the student's most recently chosen modality (voice or
 * text) this session, persisting forward across terms and retries — once
 * a student taps "Type instead" or "Try with voice" anywhere, every
 * subsequent term starts in that same mode instead of resetting to the
 * micPermissionGranted-based default. `null` means no explicit choice has
 * been made yet this session, in which case a term falls back to the
 * original micPermissionGranted-based default (denied/unconfirmed → text,
 * granted → voice). Every term's own switchToText/switchToVoice/
 * allowMicAndSwitchToVoice sets this alongside its local inputMode state,
 * and every term computes its OWN starting mode as
 * `lastInputMode ?? (micPermissionGranted ? "voice" : "text")`. Also set
 * by /confidence-recurring's "Type instead" link (which has no attempt
 * state of its own) right before routing to /term-1, replacing the old
 * one-shot `termInTextModeRequested` flag — unlike that flag, this is
 * never cleared on read, only reset by resetRecallSession (a fresh
 * Practice More restart goes back to the plain micPermissionGranted
 * default, confirmed with Evelyn rather than assumed either way).
 * Deliberately separate from micPermissionGranted itself, which must stay
 * untouched: a returning student who already granted mic access should
 * still be able to switch back to voice with no re-prompt, even if their
 * last-used mode this session was text.
 *
 * `resetRecallSession` is called once, imperatively, by a "Try again"
 * handler (recall-summary/summary) right before routing into a NEW
 * session — clears termOutcomes/voiceUsedThisSession/recallAttempted/
 * lastInputMode back to their defaults so term-4's "perfect lesson"
 * check, the exit-routing logic, the summary flow, and modality
 * persistence all start fresh rather than reading stale data left over
 * from the just-finished session. Deliberately does NOT touch
 * micPermissionGranted — SPEC.md §2B: a returning student is assumed
 * already granted, so a prior grant must carry over, never re-asked.
 * Before clearing, it snapshots the outgoing `termOutcomes` into
 * `previousSessionOutcomes` — that's the one-session-back memory
 * /recall-summary reads to show a comparison caption ("Nice! Last time
 * you needed a hint") instead of a sourced recommendation, for any term
 * that has prior data. A term with no entry there (never reached last
 * time, or this is the first session ever) falls back to the normal
 * sourced/first-time caption, unchanged.
 *
 * `exitConfirmOpen` is the ONE shared exit-intent flag every trigger point
 * in the whole flow uses — X on the entry fork, X on any term at any
 * stage, X on confidence/confidence-recurring, "Maybe later", and the
 * recurring entry fork's skip-forward icon. None of these navigate
 * directly anymore; they all call requestExit(), which just opens this
 * flag. The shared layout (app/(recall)/layout.tsx) is the ONE place that
 * renders `ExitConfirmSheet` and owns the actual "Leave" logic (compute
 * whether the session ever engaged with the recall step — same
 * termOutcomes/recallAttempted check the summary flow already uses — pick
 * the sheet's variant from that, backfill remaining terms as skipped if
 * engaged, then route to /streak) — this is what makes it "a single
 * shared exit-intent handler, not duplicated logic per screen": every
 * screen's own onExit is now just `requestExit`, nothing else. A boolean
 * overlay, not a stage/route change (same reasoning as SkipConfirmSheet)
 * — "Keep learning" never has anything to restore, since nothing about
 * the underlying screen's own state ever changed while the sheet was up.
 */
export type TermOutcome = "unaided" | "hinted" | "revealed" | "skipped";
export type TermId =
  | "note"
  | "time-signature"
  | "tempo"
  | "syncopation"
  | "cadence";

/**
 * The confidence-tap's own 2-tier bucket, used by /recall-summary's header
 * copy matrix (term-summary-data.ts's SUMMARY_HEADER_COPY). The tap itself
 * offers 3 options (see CONFIDENCE_OPTIONS below) — confidenceLevelForOption
 * collapses those down to this.
 */
export type ConfidenceLevel = "confident" | "unsure";

/** Verbatim confidence-tap option labels, shared by /confidence and
 * /confidence-recurring so both screens and confidenceLevelForOption stay
 * in sync on the exact strings. */
export const CONFIDENCE_OPTIONS = [
  "Very confident!",
  "Somewhat, I think I got it",
  "So so, but I’m gonna try",
] as const;
export type ConfidenceOption = (typeof CONFIDENCE_OPTIONS)[number];

/**
 * Collapses the 3-tier confidence-tap pick to the 2-tier confident/unsure
 * bucket the summary-header copy matrix keys off. Only "Very confident!" is
 * genuinely unhedged; "Somewhat, I think I got it" and "So so, but I'm
 * gonna try" both hedge in their own wording, so both bucket as unsure.
 * This 3-to-2 mapping wasn't specified by the copy-matrix task (which only
 * ever names "Confident"/"Unsure") — flag with Evelyn before treating as
 * final if the middle option ever needs its own tier.
 */
export function confidenceLevelForOption(option: ConfidenceOption): ConfidenceLevel {
  return option === "Very confident!" ? "confident" : "unsure";
}

/** The 4 base terms, fixed order, never including cadence (conditional,
 * 5th round) — the set fillRemainingTermsAsSkipped backfills against. */
export const BASE_TERM_IDS: readonly TermId[] = [
  "note",
  "time-signature",
  "tempo",
  "syncopation",
];

/**
 * The combined progress-bar step map (TopBar), spanning the pre-step quiz
 * AND the Voice Recall loop as one continuous sequence instead of two
 * separately-numbered ones. Previously /quiz ran its own isolated 1-4
 * (unrelated to VR's own 1-6) and VR itself reset to step 1 on /entry —
 * both now collapse into a single 1-COMBINED_TOTAL_STEPS run so the bar
 * never resets or jumps backward across that boundary.
 *
 * QUIZ_TOTAL_QUESTIONS is fixed at 10 per Evelyn's own framing ("treat the
 * pre-step's mocked question as question 10 of 10") — only the last
 * question is actually built, the other 9 are assumed-prior and never
 * rendered. TOTAL_VR_TERMS is derived from BASE_TERM_IDS (not a hardcoded
 * literal) — 4 base terms + Cadence, fixed at 5 always, confirmed with
 * Evelyn rather than made session-dependent: the shipped demo script
 * always triggers Cadence, so this matches every reference screen; a
 * hypothetical "perfect" run that skips Cadence will top out at 16/
 * COMBINED_TOTAL_STEPS (not 100%) right before the bar disappears on
 * /streak — a known, accepted gap, not something this tracks dynamically.
 *
 * Entry (mic-permission primer) and confidence tap each keep their own
 * step slot too (confirmed with Evelyn — the alternative was holding the
 * bar flat through both screens, which she didn't want): ENTRY_STEP and
 * CONFIDENCE_STEP sit right after the quiz's own 10. /confidence-recurring
 * (the merged primer+confidence screen a RETURNING student sees instead of
 * /entry) reuses CONFIDENCE_STEP's own slot rather than getting a new one —
 * that student never sees /entry at all, so this deliberately keeps
 * COMBINED_TOTAL_STEPS identical for both session types (a returning
 * student's bar visibly jumps from 10 to 12, skipping 11, rather than the
 * total shrinking to 16 for their session only) — simpler than branching
 * every term's own totalSteps on which fork the session took, at the cost
 * of that one small jump.
 *
 * TERM_STEP maps each term to its own slot, in fixed base-term order plus
 * cadence last — this also fixes a pre-existing quirk where term-4 and
 * term-5 both showed the same "step 6 of 6" (term-5, the conditional bonus
 * round, had no step slot of its own before this).
 */
export const QUIZ_TOTAL_QUESTIONS = 10;
export const TOTAL_VR_TERMS = BASE_TERM_IDS.length + 1;
export const ENTRY_STEP = QUIZ_TOTAL_QUESTIONS + 1;
export const CONFIDENCE_STEP = QUIZ_TOTAL_QUESTIONS + 2;
export const COMBINED_TOTAL_STEPS = CONFIDENCE_STEP + TOTAL_VR_TERMS;
export const TERM_STEP: Record<TermId, number> = {
  note: CONFIDENCE_STEP + 1,
  "time-signature": CONFIDENCE_STEP + 2,
  tempo: CONFIDENCE_STEP + 3,
  syncopation: CONFIDENCE_STEP + 4,
  cadence: CONFIDENCE_STEP + 5,
};

/**
 * The one place "which entry-fork variant should this session see" is
 * decided — first-time (`/entry`) if the recall step has never really been
 * engaged this session (`termOutcomes` empty, or every recorded outcome is
 * "skipped"), otherwise returning (`/confidence-recurring`). Extracted from
 * what was previously the same `allSkipped ? "/entry" : "/confidence-recurring"`
 * expression duplicated identically in recall-summary/page.tsx and
 * summary/page.tsx's own "Try again" handlers; the pre-step quiz flow
 * (`/quiz`'s "Skip to next question" and its own no-answer-given path) needed
 * the exact same determination a third time, so it's centralized here
 * instead of copy-pasted again. `Object.values({}).every(...)` is `true`
 * (vacuous truth), so an empty `termOutcomes` — a student who has never
 * touched the recall step this session — correctly resolves to `"/entry"`.
 *
 * Returns `/entry`, not `/` — the app's root (`/`) is now the exam-plan
 * path view (the pre-step lead-in), not the Voice Recall entry fork; the
 * fork moved to `/entry` so a fresh visit lands on the path view first.
 */
export function getEntryForkRoute(
  termOutcomes: Partial<Record<TermId, TermOutcome>>
): "/entry" | "/confidence-recurring" {
  const allSkipped = Object.values(termOutcomes).every((o) => o === "skipped");
  return allSkipped ? "/entry" : "/confidence-recurring";
}

type MascotBubbleValue = {
  pose: string;
  alt: string;
  text: string;
  dimmed?: boolean;
} | null;

type RecallChromeValue = {
  currentStep: number | null;
  totalSteps: number;
  onExit: () => void;
  chromeBlurred: boolean;
  mascot: MascotBubbleValue;
  termOutcomes: Partial<Record<TermId, TermOutcome>>;
  previousSessionOutcomes: Partial<Record<TermId, TermOutcome>>;
  voiceUsedThisSession: boolean;
  recallAttempted: boolean;
  micPermissionGranted: boolean;
  lastInputMode: InputMode | null;
  confidenceLevel: ConfidenceLevel | null;
  exitConfirmOpen: boolean;
};

const defaultValue: RecallChromeValue = {
  currentStep: null,
  totalSteps: 1,
  onExit: () => {},
  chromeBlurred: false,
  mascot: null,
  termOutcomes: {},
  previousSessionOutcomes: {},
  voiceUsedThisSession: false,
  recallAttempted: false,
  micPermissionGranted: false,
  lastInputMode: null,
  confidenceLevel: null,
  exitConfirmOpen: false,
};

const RecallChromeContext = createContext<{
  value: RecallChromeValue;
  patch: (partial: Partial<RecallChromeValue>) => void;
  recordTermOutcome: (termId: TermId, outcome: TermOutcome) => void;
  recordVoiceUsed: () => void;
  recordRecallAttempted: () => void;
  fillRemainingTermsAsSkipped: () => void;
  setMicPermissionGranted: (granted: boolean) => void;
  setLastInputMode: (mode: InputMode) => void;
  setConfidenceLevel: (level: ConfidenceLevel) => void;
  resetRecallSession: () => void;
  requestExit: () => void;
  cancelExit: () => void;
} | null>(null);

export function RecallChromeProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<RecallChromeValue>(defaultValue);

  // Functional updater is required here: useRecallStep and
  // useRecallChromeBlur are two separate effects that can both fire in the
  // same commit (e.g. on the entry screen's first render). If each one
  // spread a `value` captured from render, the second to run would
  // clobber the first's update with a stale snapshot. Building the patch
  // from `prev` instead means each patch always applies on top of
  // whatever the other one just committed.
  const patch = useCallback((partial: Partial<RecallChromeValue>) => {
    setValue((prev) => ({ ...prev, ...partial }));
  }, []);

  // Separate from `patch` because this merges one key into the
  // `termOutcomes` sub-object rather than replacing a top-level field —
  // same functional-updater reasoning as `patch` itself, just one level
  // deeper.
  const recordTermOutcome = useCallback((termId: TermId, outcome: TermOutcome) => {
    setValue((prev) => ({
      ...prev,
      termOutcomes: { ...prev.termOutcomes, [termId]: outcome },
    }));
  }, []);

  // Same functional-updater reasoning as recordTermOutcome — also a no-op
  // guard against redundant re-renders once already true, since a term can
  // call this every time it sends a voice take, not just once per session.
  const recordVoiceUsed = useCallback(() => {
    setValue((prev) =>
      prev.voiceUsedThisSession ? prev : { ...prev, voiceUsedThisSession: true }
    );
  }, []);

  // Same no-op guard as recordVoiceUsed — a term can call this every time
  // it sends a take, not just once per session.
  const recordRecallAttempted = useCallback(() => {
    setValue((prev) =>
      prev.recallAttempted ? prev : { ...prev, recallAttempted: true }
    );
  }, []);

  // Only fills BASE_TERM_IDS entries that don't already have a recorded
  // outcome — a term that already resolved (Continue) or was explicitly
  // skipped keeps its real outcome, never overwritten to "skipped".
  const fillRemainingTermsAsSkipped = useCallback(() => {
    setValue((prev) => {
      let changed = false;
      const nextTermOutcomes = { ...prev.termOutcomes };
      for (const termId of BASE_TERM_IDS) {
        if (nextTermOutcomes[termId] === undefined) {
          nextTermOutcomes[termId] = "skipped";
          changed = true;
        }
      }
      return changed ? { ...prev, termOutcomes: nextTermOutcomes } : prev;
    });
  }, []);

  const setMicPermissionGranted = useCallback((granted: boolean) => {
    setValue((prev) => ({ ...prev, micPermissionGranted: granted }));
  }, []);

  const setLastInputMode = useCallback((mode: InputMode) => {
    setValue((prev) => ({ ...prev, lastInputMode: mode }));
  }, []);

  // Set once by /confidence or /confidence-recurring right before routing
  // to /term-1 — the confidence tap itself never persists past that click
  // otherwise, and /recall-summary's header copy needs it afterward.
  const setConfidenceLevel = useCallback((level: ConfidenceLevel) => {
    setValue((prev) => ({ ...prev, confidenceLevel: level }));
  }, []);

  // Deliberately omits micPermissionGranted — see the doc comment above.
  // Snapshots the outgoing termOutcomes as previousSessionOutcomes before
  // clearing, so /recall-summary can compare the new session against it.
  // confidenceLevel resets to null here too (same as lastInputMode) — a
  // fresh "Try again" session re-asks confidence via /confidence-recurring
  // before term-1 is reachable again, so the prior session's pick must not
  // leak into the new one's summary header.
  const resetRecallSession = useCallback(() => {
    setValue((prev) => ({
      ...prev,
      previousSessionOutcomes: prev.termOutcomes,
      termOutcomes: {},
      voiceUsedThisSession: false,
      recallAttempted: false,
      lastInputMode: null,
      confidenceLevel: null,
    }));
  }, []);

  const requestExit = useCallback(() => {
    setValue((prev) => ({ ...prev, exitConfirmOpen: true }));
  }, []);

  const cancelExit = useCallback(() => {
    setValue((prev) => ({ ...prev, exitConfirmOpen: false }));
  }, []);

  return (
    <RecallChromeContext.Provider
      value={{
        value,
        patch,
        recordTermOutcome,
        recordVoiceUsed,
        recordRecallAttempted,
        fillRemainingTermsAsSkipped,
        setMicPermissionGranted,
        setLastInputMode,
        setConfidenceLevel,
        resetRecallSession,
        requestExit,
        cancelExit,
      }}
    >
      {children}
    </RecallChromeContext.Provider>
  );
}

function useRecallChromeContext() {
  const ctx = useContext(RecallChromeContext);
  if (!ctx) {
    throw new Error(
      "Voice Recall screens must render under app/(recall)/layout.tsx"
    );
  }
  return ctx;
}

/** Read by the layout to drive TopBar. */
export function useRecallChromeValue() {
  return useRecallChromeContext().value;
}

/**
 * Called once by each screen to register its step/total/exit-handler with
 * the shared TopBar. `onExit` should be stable (useCallback) so this
 * doesn't re-sync on every unrelated render.
 */
export function useRecallStep({
  currentStep,
  totalSteps,
  onExit,
}: {
  currentStep: number | null;
  totalSteps: number;
  onExit: () => void;
}) {
  const { patch } = useRecallChromeContext();
  useEffect(() => {
    patch({ currentStep, totalSteps, onExit });
  }, [currentStep, totalSteps, onExit, patch]);
}

/**
 * Called by a screen to blur the whole chrome (TopBar + content) behind
 * its own modal/dialog, e.g. the entry screen's mic-permission primer.
 */
export function useRecallChromeBlur(blurred: boolean) {
  const { patch } = useRecallChromeContext();
  useEffect(() => {
    patch({ chromeBlurred: blurred });
    // Reset on unmount — otherwise navigating away while a screen's own
    // dialog is open leaves the next screen's chrome permanently blurred,
    // since nothing else would ever set chromeBlurred back to false.
    return () => patch({ chromeBlurred: false });
  }, [blurred, patch]);
}

/**
 * Called by a screen to set (or hide) the shared mascot+bubble block
 * rendered by the layout. Deliberately does NOT reset on unmount — unlike
 * chromeBlurred, we want the outgoing screen's value to keep showing until
 * the incoming screen's own effect overwrites it, so MascotBubble's
 * pose/text crossfade animates between the two instead of flashing empty
 * in between. Screens that don't use the mascot block (entry, summary)
 * must explicitly pass `null` to clear out whatever the previous screen
 * left behind.
 */
export function useMascotBubble(value: MascotBubbleValue) {
  const { patch } = useRecallChromeContext();
  useEffect(() => {
    patch({ mascot: value });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.pose, value?.alt, value?.text, value?.dimmed, patch]);
}

/**
 * Returns a stable function a term calls once, imperatively, at the exact
 * moment it resolves (inside a Continue/skip-confirm handler) — unlike
 * useRecallStep/useMascotBubble, this isn't a per-render "here's my
 * current value" sync, it's a one-time event, so it's called directly
 * from an onClick, not from inside a useEffect.
 */
export function useRecordTermOutcome() {
  return useRecallChromeContext().recordTermOutcome;
}

/** Read-only snapshot of every term resolved so far this session — e.g.
 * term 4 uses this to decide whether terms 1–3 were all unaided passes
 * before deciding whether to trigger "One more before we wrap up". */
export function useTermOutcomes() {
  return useRecallChromeContext().value.termOutcomes;
}

/** Read-only snapshot of the PREVIOUS session's per-term outcomes (one
 * session back only, not a deeper history) — populated by
 * resetRecallSession right before a "Try again" starts a new session.
 * Empty on a student's first-ever session. /recall-summary reads this to
 * show a comparison caption for any term it has data for. */
export function usePreviousSessionOutcomes() {
  return useRecallChromeContext().value.previousSessionOutcomes;
}

/**
 * Called once, imperatively, the moment a term actually sends a voice
 * take (inside sendRecording, not just on opening the mic UI) — same
 * one-time-event pattern as useRecordTermOutcome, not a useEffect sync.
 */
export function useRecordVoiceUsed() {
  return useRecallChromeContext().recordVoiceUsed;
}

/** Read-only: was voice used at least once this session? */
export function useVoiceUsedThisSession() {
  return useRecallChromeContext().value.voiceUsedThisSession;
}

/**
 * Called once, imperatively, the moment any term actually sends a take —
 * voice (sendRecording) or text (sendTyped) — regardless of whether that
 * term's outcome is later confirmed via Continue. Same one-time-event
 * pattern as useRecordTermOutcome/useRecordVoiceUsed.
 */
export function useRecordRecallAttempted() {
  return useRecallChromeContext().recordRecallAttempted;
}

/** Read-only: was at least one real attempt (voice or text) ever
 * submitted this session? Used alongside termOutcomes to decide whether
 * exiting a term (X) should route to the recall-summary path (session
 * engaged with the recall step) or the no-recall path (never engaged). */
export function useRecallAttempted() {
  return useRecallChromeContext().value.recallAttempted;
}

/** Returns a stable function a term's exit (X) handler calls once, right
 * before navigating to /streak, so every base term not yet resolved (or
 * explicitly skipped) renders as "Skipped" on the recall-summary screen —
 * only meaningful to call when the session already engaged with the
 * recall step; see recall-flow-context.tsx's own doc comment above. */
export function useFillRemainingTermsAsSkipped() {
  return useRecallChromeContext().fillRemainingTermsAsSkipped;
}

/** Read-only: has the (mocked) OS mic permission been confirmed granted
 * this session? False covers both an explicit "Don't Allow" and never
 * having seen the primer at all — either way, a term must not default to
 * the voice mic UI, and switching back to voice from text must re-show the
 * primer rather than assume access. */
export function useMicPermissionGranted() {
  return useRecallChromeContext().value.micPermissionGranted;
}

/** Returns a stable setter, called once at the moment the (mocked) OS
 * mic-permission dialog resolves — the entry screen's primer on first
 * encounter, or a term's own re-prompt when switching from text back to
 * voice without a confirmed grant yet. */
export function useSetMicPermissionGranted() {
  return useRecallChromeContext().setMicPermissionGranted;
}

/** Read-only: the student's most recently chosen modality this session
 * (voice or text), or `null` if no explicit choice has been made yet.
 * Every term falls back to the micPermissionGranted-based default when
 * this is null; otherwise this wins, so a switch made anywhere carries
 * forward into every later term and retry until changed again or the
 * session resets (Practice More). */
export function useLastInputMode() {
  return useRecallChromeContext().value.lastInputMode;
}

/** Returns a stable setter — called by every term's own switchToText/
 * switchToVoice/allowMicAndSwitchToVoice, and by /confidence-recurring's
 * "Type instead" link (which has no attempt state of its own but still
 * needs to set the mode the upcoming /term-1 visit starts in). */
export function useSetLastInputMode() {
  return useRecallChromeContext().setLastInputMode;
}

/** Read-only: the confidence-tap bucket set at the start of this session
 * (null before either confidence screen has been completed, or after a
 * reset). /recall-summary's header copy reads this alongside termOutcomes
 * to pick which of the confident/unsure × right/hinted/revealed copy
 * blocks to show. */
export function useConfidenceLevel() {
  return useRecallChromeContext().value.confidenceLevel;
}

/** Returns a stable setter — called once by /confidence and
 * /confidence-recurring right before routing to /term-1. */
export function useSetConfidenceLevel() {
  return useRecallChromeContext().setConfidenceLevel;
}

/** Returns a stable function a "Try again" handler calls once, right
 * before routing into a new session (recurring-encounter merged screen, or
 * the first-time entry fork if every term was skipped last time) — see
 * this file's own doc comment above for exactly what it clears. */
export function useResetRecallSession() {
  return useRecallChromeContext().resetRecallSession;
}

/**
 * Returns a stable function — THE single shared exit-intent handler.
 * Every trigger point in the flow (X anywhere, "Maybe later", the
 * recurring entry fork's skip-forward icon) wires its onExit/onClick
 * directly to this, and nothing else: it never navigates itself, it just
 * opens the shared ExitConfirmSheet (rendered once by the layout, which
 * owns the actual "Leave" routing decision).
 */
export function useRequestExit() {
  return useRecallChromeContext().requestExit;
}

/** Returns a stable function — dismisses the shared exit-confirm sheet
 * ("Keep learning", or tapping its scrim) without navigating anywhere;
 * also used as the sheet's onKeepLearning. */
export function useCancelExit() {
  return useRecallChromeContext().cancelExit;
}

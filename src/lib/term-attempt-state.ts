"use client";

import { useCallback, useState } from "react";

/**
 * Per-term attempt state, shared between a term's voice and text input
 * paths so switching input mode mid-session never resets or duplicates
 * progress — only how the CURRENT attempt is presented changes. One
 * instance lives in each term page's top-level state (not global context:
 * it never needs to survive a route change, only a mode switch within the
 * same term).
 *
 * `outcomeSequence` itself stays owned by the term page (each term's own
 * `OUTCOME_BY_ATTEMPT` constant, already indexed by attempt) — this hook
 * only tracks which attempt we're on and what it resolved to, generic over
 * whatever Outcome union a given term uses.
 *
 * `initialInputMode` lets the caller decide which mode the term STARTS in
 * (a term reads the session's mic-permission state and passes "text" when
 * it isn't confirmed granted, so denying the mic primer on entry lands the
 * whole term loop in the text fallback, not the voice mic UI) — defaults to
 * "voice" for backward compatibility with a plain `useTermAttemptState()`
 * call.
 */
export type InputMode = "voice" | "text";

export function useTermAttemptState<Outcome extends string>(
  initialInputMode: InputMode = "voice"
) {
  const [attempt, setAttemptState] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [inputMode, setInputMode] = useState<InputMode>(initialInputMode);
  const [typedAnswer, setTypedAnswer] = useState("");
  // Kept for future reference (per-attempt input-mode history), not read by
  // any term's own outcome logic today.
  const [inputModeByAttempt, setInputModeByAttempt] = useState<InputMode[]>([]);

  const resolveOutcome = useCallback(
    (next: Outcome) => {
      setOutcome(next);
      setInputModeByAttempt((prev) => {
        const copy = [...prev];
        copy[attempt] = inputMode;
        return copy;
      });
    },
    [attempt, inputMode]
  );

  const advanceAttempt = useCallback(() => {
    setAttemptState((a) => a + 1);
    setOutcome(null);
    setTypedAnswer("");
  }, []);

  const recordHintUsed = useCallback(() => setHintsUsed((h) => h + 1), []);

  return {
    attempt,
    outcome,
    hintsUsed,
    inputMode,
    typedAnswer,
    inputModeByAttempt,
    setInputMode,
    setTypedAnswer,
    resolveOutcome,
    advanceAttempt,
    recordHintUsed,
  };
}

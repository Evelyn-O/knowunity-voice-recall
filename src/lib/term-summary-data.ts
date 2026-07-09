import type { TermId, TermOutcome } from "@/lib/recall-flow-context";

/**
 * Per-term title + caption for the Recall summary screen (Figma node
 * 13900:24948, re-fetched fresh per this task since it was just edited).
 * Copy is sourced directly from that fetch / SPEC.md §4, matched to each
 * term's own scripted outcome — not invented. `title` is the short label
 * Figma uses in the row (e.g. "Signature", not "Time signature").
 *
 * Each term's `captions` map only covers the outcomes actually reachable
 * through this app's own mocked outcome ladders (see each term's own
 * OUTCOME_BY_ATTEMPT constant) plus "skipped", since skip is always
 * reachable from any term regardless of its scripted ladder. Combinations
 * that can't occur through the built UI (e.g. Note resolving "revealed")
 * are intentionally left out rather than filled with invented copy.
 *
 * For a RETURNING student (a term with prior-session data — see
 * recall-flow-context.tsx's previousSessionOutcomes), a term this session
 * resolved "unaided" (correct, first try, no help) swaps in a comparison
 * caption instead of the normal sourced/first-time one, referencing
 * whatever help was needed last time — e.g. "Nice! Last time you needed a
 * hint." Any other combination (no prior data for that term, or this
 * session still needed help too) keeps today's caption unchanged; see
 * getTermSummaryCaption below.
 */
const SKIPPED_CAPTION = "Let’s try this one next time!";

/** The recall step's own XP contribution — shown as-is on /recall-summary,
 * and the portion /summary's combined XP tile subtracts back out when the
 * session was engaged only via explicit skips (zero real attempts): the
 * recall component goes to 0, not the whole combined total. */
export const RECALL_XP_EARNED = 100;

export const TERM_SUMMARY: Record<
  TermId,
  { title: string; captions: Partial<Record<TermOutcome, string>> }
> = {
  note: {
    title: "Note",
    captions: {
      unaided: "Strong start!",
      skipped: SKIPPED_CAPTION,
    },
  },
  "time-signature": {
    title: "Signature",
    captions: {
      hinted: "Review Chapter 2 about music theory and you’ll nail it!",
      skipped: SKIPPED_CAPTION,
    },
  },
  tempo: {
    title: "Tempo",
    captions: {
      revealed: "Review Chapter 1 about music theory and you will crush it!",
      skipped: SKIPPED_CAPTION,
    },
  },
  syncopation: {
    title: "Syncopation",
    captions: {
      // Authored, not sourced — SPEC.md §4 flags this exact gap: this
      // term's committed demo script is "skipped, never attempted," so no
      // Figma frame captures an unaided-pass caption for it. Only reached
      // if a tester answers instead of skipping. Same short/warm pattern
      // as the other unaided captions.
      unaided: "Nice, you got that one on your own!",
      skipped: SKIPPED_CAPTION,
    },
  },
  cadence: {
    title: "Cadence",
    captions: {
      unaided: "Amazing work! Strong end.",
      skipped: SKIPPED_CAPTION,
    },
  },
};

/** Order the summary rows render in — the fixed term sequence, cadence
 * last since it's the conditional 5th round. A given session's row list
 * filters this down to whichever terms actually have a recorded outcome
 * (cadence only appears when that round was actually reached). */
export const TERM_SUMMARY_ORDER: readonly TermId[] = [
  "note",
  "time-signature",
  "tempo",
  "syncopation",
  "cadence",
];

/** Generic fallback if a term+outcome combination isn't in TERM_SUMMARY
 * above (shouldn't happen via the built UI, but keeps a row from ever
 * rendering blank if the outcome data is ever wider than expected). */
const FALLBACK_CAPTION: Record<TermOutcome, string> = {
  unaided: "Nice work on this one!",
  hinted: "A quick review will help this stick.",
  revealed: "We’ll cover this one again soon.",
  skipped: SKIPPED_CAPTION,
};

/** Authored, not sourced (no Figma frame shows a returning-student
 * comparison state) — keyed by what the PRIOR session's outcome was, only
 * ever shown when this session resolved "unaided" (see
 * getTermSummaryCaption). Short/warm, matching this app's established
 * caption tone; "Nice! Last time you needed a hint." is this task's own
 * given example verbatim. */
const COMPARISON_CAPTION: Partial<Record<TermOutcome, string>> = {
  hinted: "Nice! Last time you needed a hint.",
  revealed: "Nice! Last time this one was revealed to you.",
  skipped: "Nice! Last time you skipped this one.",
};

/**
 * `previousOutcome` is this same term's outcome from the PRIOR session
 * (undefined if there isn't one — first-ever session, or that term wasn't
 * reached last time). It only ever changes anything when the CURRENT
 * outcome is "unaided": a returning student nailing a term this session
 * that needed help last time gets the comparison caption instead of the
 * sourced/first-time one. Every other case (no prior data, or this
 * session still needed help too) is unchanged from before.
 */
export function getTermSummaryCaption(
  termId: TermId,
  outcome: TermOutcome,
  previousOutcome?: TermOutcome
): string {
  if (outcome === "unaided" && previousOutcome && previousOutcome !== "unaided") {
    return COMPARISON_CAPTION[previousOutcome] ?? TERM_SUMMARY[termId].captions[outcome]!;
  }
  return TERM_SUMMARY[termId].captions[outcome] ?? FALLBACK_CAPTION[outcome];
}

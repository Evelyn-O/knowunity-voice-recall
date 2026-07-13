import type { ConfidenceLevel, TermId, TermOutcome } from "@/lib/recall-flow-context";

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

/**
 * /recall-summary's header (Figma node 14050:23562/13900:24948 — title
 * node 14050:23574, body node 14050:23575). Chosen by crossing the
 * session's confidence-tap bucket against a single outcome bucket derived
 * from EVERY attempted term's own real outcome — not a numeric/percentage
 * score.
 *
 * "Right" tolerates some misses rather than requiring a perfect session —
 * a pure worst-case-wins rule (any single revealed/skipped term drags the
 * whole header down) read as too punishing: 3 clean terms and 1 skip used
 * to show the same "Revealed" copy as a genuinely rough session. See
 * summaryOutcomeBucket below for the exact two-path rule (confirmed with
 * Evelyn, not inferred). Everything that doesn't clear "Right" still
 * falls back to the original worst-case-wins split between "hinted" and
 * "revealed". Skipped is folded into "revealed" per that original
 * instruction — a term the student never attempted counts as a miss the
 * same way a fully-revealed one does, unless it's outweighed by enough
 * unaided terms to clear "Right" first.
 *
 * The "with a hint" row is Claude-drafted to match the tone of Evelyn's
 * confirmed originals, not confirmed copy — flag for her review before
 * treating as final. Every other row is her exact wording.
 *
 * The task's spec also describes a conditional per-term source line
 * ("[Term] is worth another look in [source]") for non-"right" outcomes,
 * used instead of the generic review line when a source exists for that
 * term. No such per-term source field exists in this content model
 * (TERM_SUMMARY above has no `source`, only free-text captions) — rather
 * than invent placeholder source names, this always uses the generic line.
 * Flagging the gap rather than fabricating sources, per this task's own
 * instruction.
 */
const REVIEW_SUGGESTION =
  "Give the material a quick review and come back — you’ve got this.";

type SummaryOutcomeBucket = "right" | "hinted" | "revealed";

type SummaryHeaderCopy = { title: string; body: string };

export const SUMMARY_HEADER_COPY: Record<
  ConfidenceLevel,
  Record<SummaryOutcomeBucket, SummaryHeaderCopy>
> = {
  confident: {
    right: {
      title: "You knew you had this",
      body: "And you did. That’s the kind of gut check that’s actually worth trusting.",
    },
    hinted: {
      // DRAFT — Claude-authored, not confirmed by Evelyn. See doc comment above.
      title: "Hinted and amazed!",
      body: `You were sure going in, and a small hint closed the gap. That’s still worth a quick review before the exam. ${REVIEW_SUGGESTION}`,
    },
    revealed: {
      title: "Good thing we checked.",
      body: `A few of these took more digging than you expected — that’s exactly what this step is for, catching it before the exam does. ${REVIEW_SUGGESTION}`,
    },
  },
  unsure: {
    right: {
      title: "You had more in there than you thought.",
      body: "You went in unsure and nailed it anyway. Trust that a little more next time.",
    },
    hinted: {
      // DRAFT — Claude-authored, not confirmed by Evelyn. See doc comment above.
      title: "That hint was all you needed!",
      body: `You weren’t sure, and a nudge got you the rest of the way. That still counts — trust it a little more next time! ${REVIEW_SUGGESTION}`,
    },
    revealed: {
      title: "Your gut was right.",
      body: `You weren’t sure, and yeah, this one needs more work — but catching that now is the actual win. ${REVIEW_SUGGESTION}`,
    },
  },
};

/**
 * "Right" if either path clears, first match wins:
 *  - >=2 unaided terms, no matter what happened to the rest (any mix of
 *    hinted/revealed/skipped, any count) — also covers a fully clean
 *    session, since this app's base term count is always >=4. **Except**
 *    the barely-2 edge case: exactly 2 unaided with every remaining term
 *    skipped (zero hinted, zero revealed — no engagement at all on the
 *    rest) doesn't qualify. That reads weaker than 3+ unaided, or a
 *    2-unaided session where the rest shows some real effort (a hint, or
 *    a genuine miss via reveal) — it falls through to the normal
 *    "revealed" (actionable) copy below instead.
 *  - >=1 unaided AND >=2 hinted AND zero skipped — a weaker path for a
 *    session that leaned on hints twice but still landed one term clean
 *    and never outright skipped anything (a revealed term is still
 *    tolerated here — skip is the only disqualifier, confirmed with
 *    Evelyn rather than assumed).
 * Anything that clears neither path falls back to the original
 * worst-case-wins split: "hinted" only if there's a hinted term and zero
 * revealed/skipped; "revealed" (the actionable/review copy) otherwise.
 * Only meaningful when termOutcomes is non-empty (guaranteed on
 * /recall-summary, which is only reached when recallAttempted).
 */
function summaryOutcomeBucket(
  termOutcomes: Partial<Record<TermId, TermOutcome>>
): SummaryOutcomeBucket {
  const outcomes = Object.values(termOutcomes);
  const unaidedCount = outcomes.filter((o) => o === "unaided").length;
  const hintedCount = outcomes.filter((o) => o === "hinted").length;
  const skippedCount = outcomes.filter((o) => o === "skipped").length;
  const restCount = outcomes.length - unaidedCount;

  const barelyTwoAllSkipped =
    unaidedCount === 2 && restCount > 0 && skippedCount === restCount;
  const solidMajority = unaidedCount >= 2 && !barelyTwoAllSkipped;
  const oneCleanTwoHints = unaidedCount >= 1 && hintedCount >= 2 && skippedCount === 0;
  if (solidMajority || oneCleanTwoHints) return "right";

  if (outcomes.some((o) => o === "revealed" || o === "skipped")) return "revealed";
  return "hinted";
}

export function getSummaryHeaderCopy(
  confidenceLevel: ConfidenceLevel,
  termOutcomes: Partial<Record<TermId, TermOutcome>>
): SummaryHeaderCopy {
  return SUMMARY_HEADER_COPY[confidenceLevel][summaryOutcomeBucket(termOutcomes)];
}

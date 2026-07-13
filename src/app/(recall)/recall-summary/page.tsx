"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { MascotImage } from "@/components/mascot-image";
import { BottomCta } from "@/components/bottom-cta";
import { PrimaryButton } from "@/components/buttons";
import { CountUpNumber } from "@/components/count-up-number";
import { TermResultRow } from "@/components/term-result-row";
import {
  getEntryForkRoute,
  useConfidenceLevel,
  useMascotBubble,
  usePreviousSessionOutcomes,
  useRecallAttempted,
  useRecallStep,
  useResetRecallSession,
  useTermOutcomes,
} from "@/lib/recall-flow-context";
import {
  getSummaryHeaderCopy,
  getTermSummaryCaption,
  RECALL_XP_EARNED,
  TERM_SUMMARY,
  TERM_SUMMARY_ORDER,
} from "@/lib/term-summary-data";
import { gentle, snappy } from "@/lib/motion";
import { useScrollThumb } from "@/lib/use-scroll-thumb";
import { ScrollThumbIndicator } from "@/components/scroll-thumb-indicator";

/**
 * Recall summary — per-term results (Figma node 13900:24948, "Recall
 * reveal - first time user"; re-fetched fresh per this task since it was
 * just edited — its "Revealed" chip is purple/brand now, not the coral
 * SPEC.md's older text describes). Only reached on a voice-touched
 * session (see /streak's branch) — an all-typed or no-attempt session
 * skips straight from /streak to /summary instead.
 *
 * Rows are genuinely dynamic: built from `termOutcomes` (recorded
 * imperatively by each term the moment it resolves — never re-graded or
 * guessed here), filtered/ordered by TERM_SUMMARY_ORDER so cadence only
 * appears when that round actually happened this session, and every
 * term shows whatever chip its real recorded outcome maps to — a
 * something-went-wrong session where every term was skipped would
 * correctly render five "Skipped" rows, not the demo-script chips.
 *
 * The recall-specific XP shown here is 0 whenever the session engaged
 * with the recall step ONLY via explicit skips — no real attempt (voice
 * or text) was ever submitted, so the recall step itself earned nothing,
 * even though this screen is still reached (skip is its own real
 * interaction — see recall-flow-context.tsx's recallAttempted doc).
 *
 * For a returning student, each row's caption compares against
 * `previousSessionOutcomes` (one session back) instead of always pulling
 * the sourced/first-time recommendation — see term-summary-data.ts's own
 * doc comment on getTermSummaryCaption for exactly when that kicks in.
 *
 * The header (title + body, right above the per-term rows) is genuinely
 * dynamic too — crossed from the session's confidence-tap bucket
 * (useConfidenceLevel, set once by /confidence or /confidence-recurring
 * right before term-1) against a worst-case-wins outcome bucket derived
 * from every attempted term's real outcome. See term-summary-data.ts's
 * getSummaryHeaderCopy doc comment for the full matrix and the two rows
 * still marked draft/unconfirmed.
 */

export default function RecallSummaryPage() {
  const router = useRouter();
  const termOutcomes = useTermOutcomes();
  const previousSessionOutcomes = usePreviousSessionOutcomes();
  const recallAttempted = useRecallAttempted();
  const xpEarned = recallAttempted ? RECALL_XP_EARNED : 0;
  const resetRecallSession = useResetRecallSession();
  const [revealed, setRevealed] = useState(false);
  const { ref: scrollRef, thumb, measure } = useScrollThumb<HTMLDivElement>();

  // Guaranteed non-null here: this screen is only reachable through
  // /confidence or /confidence-recurring, both of which set this before
  // routing to term-1 — the `?? "confident"` is a type-only fallback for
  // TypeScript's benefit, not a real path.
  const confidenceLevel = useConfidenceLevel() ?? "confident";
  const headerCopy = getSummaryHeaderCopy(confidenceLevel, termOutcomes);

  const onExit = useCallback(() => router.back(), [router]);
  useRecallStep({ currentStep: null, totalSteps: 6, onExit });
  useMascotBubble(null);

  useEffect(() => {
    const id = setTimeout(() => setRevealed(true), 350);
    return () => clearTimeout(id);
  }, []);

  const rows = TERM_SUMMARY_ORDER.filter((termId) => termOutcomes[termId] !== undefined).map(
    (termId) => {
      const outcome = termOutcomes[termId]!;
      return {
        termId,
        outcome,
        title: TERM_SUMMARY[termId].title,
        caption: getTermSummaryCaption(termId, outcome, previousSessionOutcomes[termId]),
      };
    }
  );

  // This screen is only ever reached when termOutcomes is non-empty (the
  // recall step was engaged), so "every term skipped" here means the
  // student never actually attempted anything — that specific case routes
  // back through the first-time entry fork (mic primer included, if not
  // already granted) instead of the merged recurring screen, per this
  // task's own instruction. Reset happens either way, right before
  // navigating into the new session, so the next attempt starts clean.
  function handleTryAgain() {
    const forkRoute = getEntryForkRoute(termOutcomes);
    resetRecallSession();
    router.push(forkRoute);
  }

  function handleContinue() {
    router.push("/summary");
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={measure}
        className="no-scrollbar flex min-h-0 flex-1 flex-col items-center gap-5 overflow-y-auto px-4 pt-2"
      >
        {/* Pure opacity fade, no y-offset — fires on route mount, and a
            vertical offset here competes with the shared layout's own
            horizontal screen-transition slide instead of complementing it. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={gentle}
          className="flex flex-col items-center gap-4 text-center"
        >
          <MascotImage pose="cool" alt="Noe, wearing sunglasses and a cap" size={150} />
          <div className="flex flex-col gap-1">
            <CountUpNumber
              value={xpEarned}
              format={(n) => `+${Math.round(n)} XP`}
              className="font-display text-[36px] font-extrabold text-brand-bold"
            />
            <p className="font-display text-2xl font-bold text-text-primary">
              {headerCopy.title}
            </p>
          </div>
          <p className="font-display text-base text-text-secondary">
            {headerCopy.body}
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={revealed ? "visible" : "hidden"}
          variants={{ visible: { transition: { staggerChildren: 0.09 } } }}
          className="flex w-full flex-col gap-3 pb-4"
        >
          {rows.map((row) => (
            <TermResultRow
              key={row.termId}
              title={row.title}
              caption={row.caption}
              outcome={row.outcome}
            />
          ))}
        </motion.div>
      </div>
      <ScrollThumbIndicator thumb={thumb} />

      <BottomCta className="flex flex-col gap-2">
        {/* Stacked, not side-by-side — "Try weak terms" (14 chars) at
            Continue's own 21px/bold type genuinely doesn't fit an equal
            half-width share even at this app's full 404px content width
            (measured: ~159px of text, ~121px available) — side-by-side
            equal-width was the first attempt here (matching Figma node
            13900:24948's `flex: 1 0 0` pair), but that node's own
            single-line render isn't achievable at this button's real
            constrained width. Evelyn's follow-up reference (nodes
            14050:23562/23647) supersedes it with a full-width stacked
            pair instead — "Try weak terms" on top, Continue below, same
            8px gap, both full-width. Hand-rolled, not SecondaryButton —
            that component's shared pillBase is already w-full, which is
            exactly right for a stacked pill; this one's hand-rolled
            purely to match PrimaryButton's own pillLabel type (21px
            bold) that SecondaryButton doesn't expose. */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          transition={snappy}
          onClick={handleTryAgain}
          className="relative flex h-[58px] w-full items-center justify-center rounded-full bg-interactive-secondary px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]"
        >
          <span className="font-display text-[21px] font-bold whitespace-nowrap text-interactive-on-secondary">
            Try weak terms
          </span>
        </motion.button>
        <PrimaryButton onClick={handleContinue}>Continue</PrimaryButton>
      </BottomCta>
    </div>
  );
}

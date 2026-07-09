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
  useMascotBubble,
  usePreviousSessionOutcomes,
  useRecallAttempted,
  useRecallStep,
  useResetRecallSession,
  useTermOutcomes,
} from "@/lib/recall-flow-context";
import {
  getTermSummaryCaption,
  RECALL_XP_EARNED,
  TERM_SUMMARY,
  TERM_SUMMARY_ORDER,
} from "@/lib/term-summary-data";
import { gentle, snappy } from "@/lib/motion";

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
 */

export default function RecallSummaryPage() {
  const router = useRouter();
  const termOutcomes = useTermOutcomes();
  const previousSessionOutcomes = usePreviousSessionOutcomes();
  const recallAttempted = useRecallAttempted();
  const xpEarned = recallAttempted ? RECALL_XP_EARNED : 0;
  const resetRecallSession = useResetRecallSession();
  const [revealed, setRevealed] = useState(false);

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
    const allSkipped = Object.values(termOutcomes).every((o) => o === "skipped");
    resetRecallSession();
    router.push(allSkipped ? "/" : "/confidence-recurring");
  }

  function handleContinue() {
    router.push("/summary");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col items-center gap-5 overflow-y-auto px-4 pt-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
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
              You knew you had this
            </p>
          </div>
          <p className="font-display text-base text-text-secondary">
            And you did. That&apos;s the kind of gut check that&apos;s actually
            worth trusting.
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

      <BottomCta className="flex gap-2">
        {/* Hand-rolled, not SecondaryButton — that component's shared
            pillBase is w-full, which only works alone or stacked; every
            other "small pill + wide pill" row in this app (Result
            sheets' Why?/Continue, hint screens' Try again) hand-rolls
            the small one for the same reason. */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          transition={snappy}
          onClick={handleTryAgain}
          className="relative flex h-[58px] items-center justify-center rounded-full bg-interactive-secondary px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]"
        >
          <span className="font-display text-[18px] font-semibold text-interactive-on-secondary">
            Try again
          </span>
        </motion.button>
        <PrimaryButton onClick={handleContinue} className="flex-1">
          Continue
        </PrimaryButton>
      </BottomCta>
    </div>
  );
}

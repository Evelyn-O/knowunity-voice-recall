"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { MascotImage } from "@/components/mascot-image";
import { BottomCta } from "@/components/bottom-cta";
import { PrimaryButton } from "@/components/buttons";
import { CountUpNumber } from "@/components/count-up-number";
import { ConfettiBurst } from "@/components/confetti-burst";
import {
  useMascotBubble,
  useRecallAttempted,
  useRecallStep,
  useResetRecallSession,
  useTermOutcomes,
} from "@/lib/recall-flow-context";
import { RECALL_XP_EARNED } from "@/lib/term-summary-data";
import { gentle, snappy } from "@/lib/motion";

/**
 * Final "You did it!" stats screen — two Figma-distinct variants, chosen
 * from the same session context /streak already used to route here,
 * rather than a query param:
 *
 * - Full (node 13900:26505, "Full summary"): reached whenever the recall
 *   step was ever engaged this session (a real attempt, or an explicit
 *   skip — same `termOutcomes`-non-empty signal /streak's own branch
 *   uses). 4 stat tiles including RECALL (the one genuinely dynamic
 *   number here — see below), "Try again" + "Claim XP" buttons.
 * - Simplified/no-recall (node 13900:26571, "Reveal - Lesson not
 *   perfect"): reached only when the recall step was NEVER engaged at
 *   all this session (no attempt, no skip — "Maybe later", or exiting
 *   with zero interaction). 3 tiles (no RECALL), a nudge line encouraging
 *   voice next time, "Try voice" (→ the first-time entry fork, since this
 *   student hasn't done the recall loop yet) + "Claim XP" (ends the
 *   session; routes back to the entry fork too, since no further screen
 *   exists yet in this prototype) buttons.
 *
 * XP/Score/Blazing are fixed mocked values (Figma's own literal numbers,
 * one set per variant) — Score/Blazing are explicitly "the Exam Plan's
 * existing recognition-quiz score, not a Voice Recall running score"
 * (SPEC.md §1.9), and no XP formula was specified, so these follow the
 * same "mock the recall intelligence" rule as every other scripted value
 * in this app rather than inventing a scoring algorithm. RECALL is the
 * one exception — SPEC.md calls it out as "the recall-specific metric,"
 * and it maps directly to data already tracked, so it's computed for
 * real: (terms not skipped) / (terms actually reached this session).
 *
 * The full variant's XP tile combines a base Exam Plan contribution with
 * the recall step's own RECALL_XP_EARNED (matching /recall-summary's own
 * number) — when the session engaged with recall ONLY via explicit skips
 * (zero real attempts), only the recall component drops to 0, not the
 * whole combined total (per this task's own instruction: don't zero out
 * XP that isn't the recall step's).
 *
 * Every stat tile is now one of the real exported box images
 * (public/images/*-summary-with(out)-recall.svg) instead of a hand-rolled
 * border+icon — each one bakes its own label, border/background, and icon
 * as a single flattened composite (Figma's dev-mode export flattens text
 * to outlined paths), matching Figma pixel-for-pixel. SCORE and BLAZING
 * (both variants) are pure static drop-ins since those two are already
 * fixed mocked values that exactly match what's baked into the image. XP
 * (full variant only, since the zeroing case only applies there) and
 * RECALL are the two tiles with a REAL dynamic value that must survive a
 * session where it differs from the image's baked sample ("150"/"4/5") —
 * for those, the image supplies only the box/label/icon chrome, and the
 * baked value glyphs are covered by an opaque patch (bg-background-page,
 * matching the box's own inner-rect fill exactly) with the real value
 * rendered as live text on top, positioned over where the glyphs were.
 * Without-recall XP is never dynamic (always SIMPLE_STATS.xp), so it's a
 * plain image there.
 */
const FULL_STATS = { xp: 150, score: "7/10", blazing: "4:09" };
const SIMPLE_STATS = { xp: 39, score: "7/10", blazing: "2:09" };

/** A stat tile that's entirely the baked image — used wherever the shown
 * value can never diverge from what's baked into the asset. */
function StatImage({ src }: { src: string }) {
  return <img src={src} alt="" aria-hidden className="block w-full h-auto" />;
}

/** A stat tile whose value is real and can diverge from the image's own
 * baked sample — the image still supplies the box/label/icon, but an
 * opaque patch (exactly matching the inner rect's own fill) covers the
 * baked glyphs and the real value renders on top in the same spot. The
 * patch's position (47%/44% of the box) was measured directly off each
 * asset's own path coordinates (icon ends ~46%, value glyphs start
 * ~49–52% across every with-recall box), not eyeballed. */
function StatImageWithValue({
  src,
  value,
  accentClass,
}: {
  src: string;
  value: ReactNode;
  accentClass: string;
}) {
  return (
    <div className="relative w-full">
      <img src={src} alt="" aria-hidden className="block w-full h-auto" />
      <div className="absolute left-[47%] top-[44%] h-[36%] w-[50%] flex items-center justify-center bg-background-page">
        <span className={`font-display text-lg font-black tracking-wide ${accentClass}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

export default function SummaryPage() {
  const router = useRouter();
  const termOutcomes = useTermOutcomes();
  const recallAttempted = useRecallAttempted();
  const resetRecallSession = useResetRecallSession();
  const [revealed, setRevealed] = useState(false);

  const onExit = useCallback(() => router.back(), [router]);
  useRecallStep({ currentStep: null, totalSteps: 6, onExit });
  useMascotBubble(null);

  useEffect(() => {
    const id = setTimeout(() => setRevealed(true), 350);
    return () => clearTimeout(id);
  }, []);

  const attemptedTermIds = Object.keys(termOutcomes);
  // Same "did the recall step ever get engaged" signal /streak's own
  // branch uses (a real attempt, or an explicit skip) — not gated on
  // voice specifically, since a skip-only or all-typed session still
  // earns the full per-term breakdown.
  const isFullVariant = attemptedTermIds.length > 0;

  const recallTotal = attemptedTermIds.length;
  const recallSuccessful = Object.values(termOutcomes).filter(
    (o) => o !== "skipped"
  ).length;

  function endSession() {
    router.push("/");
  }

  // "Try voice" — no-recall variant only: this student hasn't done the
  // recall loop yet, so this is the first-time entry fork, not a
  // recurring-user shortcut.
  function goToFirstTimeEntryFork() {
    router.push("/");
  }

  // Full variant only, so termOutcomes is guaranteed non-empty here — same
  // "every term skipped" carve-out as recall-summary's own handleTryAgain:
  // that specific case means nothing was ever really attempted, so it
  // routes back through the first-time entry fork instead of the merged
  // recurring screen. Reset happens either way, right before navigating.
  function handleTryAgain() {
    const allSkipped = Object.values(termOutcomes).every((o) => o === "skipped");
    resetRecallSession();
    router.push(allSkipped ? "/" : "/confidence-recurring");
  }

  const stats = isFullVariant
    ? {
        ...FULL_STATS,
        // Only the recall step's own XP contribution zeroes out when the
        // session engaged with recall ONLY via explicit skips (zero real
        // attempts) — the rest of the combined total is untouched.
        xp: recallAttempted ? FULL_STATS.xp : FULL_STATS.xp - RECALL_XP_EARNED,
      }
    : SIMPLE_STATS;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <ConfettiBurst play={revealed} />

      <div className="flex min-h-0 flex-1 flex-col items-center gap-8 overflow-y-auto px-5 pt-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={gentle}
          className="flex flex-col items-center gap-3"
        >
          <MascotImage pose="giggling" alt="Noe, winking" size={170} />
          <div className="flex flex-col gap-2">
            <p className="font-display text-[36px] font-extrabold text-text-primary">
              You did it!
            </p>
            {isFullVariant ? (
              <p className="font-display text-lg font-black text-text-secondary">
                You didn&apos;t just recognize the terms, you explained them
                from memory.
                <br />
                <br />
                See your general stats below
              </p>
            ) : (
              <p className="font-display text-lg font-black text-text-secondary">
                I&apos;ll be here if you wanna explain it out loud too,
                I&apos;ll be fun too
              </p>
            )}
          </div>
        </motion.div>

        {isFullVariant ? (
          <motion.div
            initial="hidden"
            animate={revealed ? "visible" : "hidden"}
            variants={{ visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } } }}
            className="grid w-full max-w-[370px] grid-cols-2 gap-3"
          >
            <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
              <StatImageWithValue
                src="/images/xp-summary-with-recall.svg"
                accentClass="text-blue-bold"
                value={<CountUpNumber value={stats.xp} />}
              />
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
              <StatImage src="/images/score-summary-with-recall.svg" />
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
              <StatImageWithValue
                src="/images/recall-summary-with-recall.svg"
                accentClass="text-magenta-bold"
                value={
                  <CountUpNumber
                    value={recallSuccessful}
                    format={(n) => `${Math.round(n)}/${recallTotal}`}
                  />
                }
              />
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
              <StatImage src="/images/blazing-summary-with-recall.svg" />
            </motion.div>
          </motion.div>
        ) : (
          // Single row of 3 (Figma node 13900:26571) — narrower
          // without-recall assets, no RECALL tile, no dynamic value ever
          // diverges from what's baked in, so these are plain image drop-ins.
          <motion.div
            initial="hidden"
            animate={revealed ? "visible" : "hidden"}
            variants={{ visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } } }}
            className="flex w-full max-w-[370px] gap-3"
          >
            <motion.div
              className="flex-1"
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
            >
              <StatImage src="/images/xp-summary-without-recall.svg.svg" />
            </motion.div>
            <motion.div
              className="flex-1"
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
            >
              <StatImage src="/images/score-summary-without-recall.svg" />
            </motion.div>
            <motion.div
              className="flex-1"
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
            >
              <StatImage src="/images/blazing-summary-without-recall.svg.svg" />
            </motion.div>
          </motion.div>
        )}
      </div>

      <BottomCta className="flex gap-2">
        {isFullVariant ? (
          <>
            {/* Hand-rolled, not SecondaryButton — see recall-summary/
                page.tsx for why (shared pillBase is w-full). */}
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
            <PrimaryButton onClick={endSession} className="flex-1">
              Claim XP
            </PrimaryButton>
          </>
        ) : (
          <>
            <motion.button
              whileTap={{ scale: 0.94 }}
              transition={snappy}
              onClick={goToFirstTimeEntryFork}
              className="relative flex h-[58px] items-center justify-center rounded-full bg-interactive-secondary px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]"
            >
              <span className="font-display text-[18px] font-semibold text-interactive-on-secondary">
                Try voice
              </span>
            </motion.button>
            <PrimaryButton onClick={endSession} className="flex-1">
              Claim XP
            </PrimaryButton>
          </>
        )}
      </BottomCta>
    </div>
  );
}

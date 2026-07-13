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
  getEntryForkRoute,
  useMascotBubble,
  useRecallAttempted,
  useRecallStep,
  useResetRecallSession,
  useTermOutcomes,
} from "@/lib/recall-flow-context";
import { RECALL_XP_EARNED } from "@/lib/term-summary-data";
import { gentle, snappy, soft } from "@/lib/motion";
import { useScrollThumb } from "@/lib/use-scroll-thumb";
import { ScrollThumbIndicator } from "@/components/scroll-thumb-indicator";

/** The 4/3 stat-tile stagger-in reveal — fades in and rises 12px into
 * place. Needs its own explicit `transition` (baked into the "visible"
 * variant, not left to Motion's default): with none specified, Motion
 * falls back to its default spring (stiffness 100 / damping 10, a
 * damping ratio of ~0.5 — clearly underdamped), which visibly overshoots
 * past y:0 and settles back — the "drops down, bounces back up" glitch.
 * `soft` (a duration-based easing, not a spring) keeps the same rise/fade
 * motion with zero overshoot. */
const STAT_TILE_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: soft },
};

/**
 * Final "You did it!" stats screen — two Figma-distinct variants, chosen
 * from the same session context /streak already used to route here,
 * rather than a query param:
 *
 * - Full (node 13900:26505, "Full summary"): reached whenever the student
 *   actually attempted at least one term this session — a real voice or
 *   text submission (`recallAttempted`), not merely a `termOutcomes` entry.
 *   A session where every term was explicitly skipped and nothing was ever
 *   submitted does NOT count — that's not "doing voice active recall," so
 *   it falls through to the simplified variant below. 4 stat tiles
 *   including RECALL (the one genuinely dynamic number here — see below),
 *   "Try again" + "Claim XP" buttons.
 * - Simplified/no-recall (node 13900:26571, "Reveal - Lesson not
 *   perfect"): reached whenever the student never actually attempted a
 *   term this session — no real attempt, whether or not any term was
 *   explicitly skipped ("Maybe later", zero-interaction exit, or a
 *   skip-only session). 3 tiles (no RECALL), a nudge line encouraging
 *   voice next time, "Try voice" (→ the first-time entry fork, since this
 *   student hasn't done the recall loop yet) + "Claim XP" (ends the
 *   session; routes back to the entry fork too, since no further screen
 *   exists yet in this prototype) buttons.
 *
 * Score/Blazing are fixed mocked values (Figma's own literal numbers, one
 * set per variant) — explicitly "the Exam Plan's existing recognition-quiz
 * score, not a Voice Recall running score" (SPEC.md §1.9), so these follow
 * the same "mock the recall intelligence" rule as every other scripted
 * value in this app rather than inventing a scoring algorithm. XP and
 * RECALL are both computed for real: RECALL is SPEC.md's own
 * recall-specific metric — (terms not skipped) / (terms actually reached
 * this session) — and XP combines a fixed base Exam Plan contribution (50,
 * Figma's own baseline) with the recall step's own contribution scaled by
 * real performance: RECALL_XP_EARNED (100) × (recallSuccessful /
 * recallTotal), rounded. A perfect session earns the full 150 baked into
 * the image; a session with only some terms recalled unaided/hinted earns
 * proportionally less, down to the 50 base-only floor for a real-attempt
 * session where every attempted term still ended up "skipped" (e.g. the
 * student attempted one term then exited before the rest resolved).
 * `isFullVariant` already guarantees `recallAttempted`, so this tile is
 * never reached by a session that never really engaged.
 *
 * Every stat tile is now one of the real exported box images
 * (public/images/*-summary-with(out)-recall.svg) instead of a hand-rolled
 * border+icon — each one bakes its own label, border/background, and icon
 * as a single flattened composite (Figma's dev-mode export flattens text
 * to outlined paths), matching Figma pixel-for-pixel. SCORE and BLAZING
 * (both variants) are pure static drop-ins since those two are already
 * fixed mocked values that exactly match what's baked into the image. XP
 * (full variant only) and RECALL are the two tiles with a REAL dynamic
 * value that must survive a session where it differs from the image's
 * baked sample ("150"/"4/5") — for those, the image supplies only the
 * box/label/icon chrome, and the baked value glyphs are covered by an
 * opaque patch (bg-background-page, matching the box's own inner-rect
 * fill exactly) with the real value rendered as live text on top,
 * positioned over where the glyphs were. Without-recall XP is never
 * dynamic (always SIMPLE_STATS.xp), so it's a plain image there.
 */
const FULL_STATS_BASE_XP = 50;
const FULL_STATS = { score: "7/10", blazing: "4:09" };
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
        {/* font-display (Bricolage), not font-sans (Inter) — confirmed by
            comparing against the baked SCORE/BLAZING glyphs (condensed,
            heavy weight): Greed Condensed Heavy is this app's display/
            headline substitute (Bricolage Grotesque), not the body font.
            An earlier version of this component used font-sans on the
            assumption Greed Condensed Heavy fell back to Inter Variable —
            confirmed wrong by screenshot, corrected here. */}
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
  const { ref: scrollRef, thumb, measure } = useScrollThumb<HTMLDivElement>();

  const onExit = useCallback(() => router.back(), [router]);
  useRecallStep({ currentStep: null, totalSteps: 6, onExit });
  useMascotBubble(null);

  useEffect(() => {
    const id = setTimeout(() => setRevealed(true), 350);
    return () => clearTimeout(id);
  }, []);

  const attemptedTermIds = Object.keys(termOutcomes);
  // Same "did the student actually attempt at least one term" signal
  // /streak's own branch uses — a real voice or text submission
  // (`recallAttempted`), not just termOutcomes having entries. A
  // skip-only session (every term explicitly skipped, nothing ever
  // submitted) still populates termOutcomes, but that's not "doing voice
  // active recall" — it correctly falls through to the simplified
  // no-recall variant, same as never touching the recall step at all.
  const isFullVariant = recallAttempted;

  const recallTotal = attemptedTermIds.length;
  const recallSuccessful = Object.values(termOutcomes).filter(
    (o) => o !== "skipped"
  ).length;

  // "Claim XP" — both variants: ends this recall-step session by returning
  // to the exam-plan path view (the pre-step lead-in's own "home", and now
  // the app's root `/` — see (recall)/page.tsx's own doc comment), not the
  // Voice Recall entry fork. Deliberately does not reset the recall session
  // (termOutcomes etc. stay as-is) — same as this button already did
  // nothing-resetting on the no-recall variant; a later quiz→fork visit
  // this same session correctly reads as "returning" per getEntryForkRoute.
  function goToPathView() {
    router.push("/");
  }

  // "Try voice" — no-recall variant only: this student hasn't done the
  // recall loop yet, so this is the first-time entry fork (`/entry`), not a
  // recurring-user shortcut.
  function goToFirstTimeEntryFork() {
    router.push("/entry");
  }

  // Full variant's "Try again" only, so termOutcomes is guaranteed
  // non-empty here — same "every term skipped" carve-out as
  // recall-summary's own handleTryAgain: that specific case means nothing
  // was ever really attempted, so it routes back through the first-time
  // entry fork instead of the merged recurring screen. Reset happens
  // either way, right before navigating.
  function handleTryAgain() {
    const forkRoute = getEntryForkRoute(termOutcomes);
    resetRecallSession();
    router.push(forkRoute);
  }

  // Recall's own XP contribution scales with real performance this
  // session — full RECALL_XP_EARNED for a perfect recallSuccessful ===
  // recallTotal, proportionally less otherwise. recallTotal is guaranteed
  // > 0 whenever isFullVariant (recallAttempted implies fillRemainingTermsAsSkipped
  // already populated termOutcomes before this screen was reachable).
  const recallXp = isFullVariant
    ? Math.round((RECALL_XP_EARNED * recallSuccessful) / recallTotal)
    : 0;

  const stats = isFullVariant
    ? { ...FULL_STATS, xp: FULL_STATS_BASE_XP + recallXp }
    : SIMPLE_STATS;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <ConfettiBurst play={revealed} />

      <div
        ref={scrollRef}
        onScroll={measure}
        className="no-scrollbar flex min-h-0 flex-1 flex-col items-center justify-center gap-8 overflow-y-auto px-5 py-6 text-center"
      >
        {/* Pure opacity fade, no y-offset — fires on route mount, and a
            vertical offset here competes with the shared layout's own
            horizontal screen-transition slide instead of complementing it. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
            <motion.div variants={STAT_TILE_VARIANTS}>
              <StatImageWithValue
                src="/images/xp-summary-with-recall.svg"
                accentClass="text-blue-bold"
                value={<CountUpNumber value={stats.xp} />}
              />
            </motion.div>
            <motion.div variants={STAT_TILE_VARIANTS}>
              <StatImage src="/images/score-summary-with-recall.svg" />
            </motion.div>
            <motion.div variants={STAT_TILE_VARIANTS}>
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
            <motion.div variants={STAT_TILE_VARIANTS}>
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
              variants={STAT_TILE_VARIANTS}
            >
              <StatImage src="/images/xp-summary-without-recall.svg.svg" />
            </motion.div>
            <motion.div
              className="flex-1"
              variants={STAT_TILE_VARIANTS}
            >
              <StatImage src="/images/score-summary-without-recall.svg" />
            </motion.div>
            <motion.div
              className="flex-1"
              variants={STAT_TILE_VARIANTS}
            >
              <StatImage src="/images/blazing-summary-without-recall.svg.svg" />
            </motion.div>
          </motion.div>
        )}
      </div>
      <ScrollThumbIndicator thumb={thumb} />

      <BottomCta className="flex flex-col gap-2">
        {isFullVariant ? (
          <div className="flex flex-col gap-2">
            {/* Stacked, not side-by-side — see recall-summary/page.tsx's
                own comment for the full reasoning (equal-width side-by-
                side was tried first, matching Figma node 13900:26505's
                `flex: 1 0 0` pair, but "Try weak terms" at Continue's own
                21px/bold type doesn't actually fit half the row even at
                this app's full 404px width; Evelyn's follow-up reference,
                node 14050:23647, supersedes it with a full-width stacked
                pair). Hand-rolled, not SecondaryButton — that component's
                shared pillBase is already w-full, right for a stacked
                pill; this one's hand-rolled purely to match
                PrimaryButton's own pillLabel type. */}
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
            {/* Claim XP ends this recall-step session at the path view —
                see goToPathView's own doc comment above for why this no
                longer shares handleTryAgain with "Try again" (a later,
                explicit instruction superseded SPEC.md §2D's earlier
                "loops back to confidence tap" reading). */}
            <PrimaryButton onClick={goToPathView}>Claim XP</PrimaryButton>
          </div>
        ) : (
          <div className="flex gap-2">
            {/* Corrected: this screen's own Figma frame (node 13900:26571)
                only ever has 2 buttons — an earlier pass here mistakenly
                added a 3rd "Try again", removed. "Claim XP" and "Try
                voice" share the same 21.77px/Bricolage Bold type (only
                their fill/outline differs) — hand-rolled "Try voice" can't
                reuse SecondaryButton (its shared pillBase is w-full, see
                recall-summary/page.tsx for why), so its label is matched
                to PrimaryButton's own pillLabel styling by hand instead of
                the smaller text/weight other hand-rolled pills on this
                screen use. */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              transition={snappy}
              onClick={goToFirstTimeEntryFork}
              className="relative flex h-[58px] items-center justify-center rounded-full bg-interactive-secondary px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]"
            >
              <span className="font-display text-[21px] font-bold text-interactive-on-secondary">
                Try voice
              </span>
            </motion.button>
            <PrimaryButton onClick={goToPathView} className="flex-1">
              Claim XP
            </PrimaryButton>
          </div>
        )}
      </BottomCta>
    </div>
  );
}

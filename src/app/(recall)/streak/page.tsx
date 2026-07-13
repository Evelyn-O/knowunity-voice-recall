"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { PrimaryButton } from "@/components/buttons";
import { BottomCta } from "@/components/bottom-cta";
import { CountUpNumber } from "@/components/count-up-number";
import { ConfettiBurst } from "@/components/confetti-burst";
import {
  useMascotBubble,
  useRecallAttempted,
  useRecallStep,
} from "@/lib/recall-flow-context";
import { gentle, snappy, soft } from "@/lib/motion";
import { useScrollThumb } from "@/lib/use-scroll-thumb";
import { ScrollThumbIndicator } from "@/components/scroll-thumb-indicator";

/**
 * Streak reveal (Figma nodes 13900:26427 "completed" path / 13900:26466
 * "Maybe later" path — pixel-identical frames, same component either
 * way). design.md's "Full-bleed celebration takeover": the one screen in
 * this flow that goes solid coral instead of the standard dark chrome.
 *
 * Mocked streak data (3-day streak, Mo/Tu/We filled) is the same fixed
 * example Figma shows — this app doesn't track a real streak, consistent
 * with "mock the recall intelligence" for every other scripted value.
 *
 * Continue branches on whether the student actually ATTEMPTED at least one
 * term this session (a real voice or text submission — `recallAttempted`,
 * set imperatively at send-time; see recall-flow-context.tsx), not on
 * whether `termOutcomes` merely has entries. A session that only ever used
 * the explicit Skip button (never submitted a real answer) still populates
 * `termOutcomes` with "skipped" for every term, but that's not the student
 * "doing voice active recall" — it correctly skips straight to the
 * simplified `/summary`, same as "Maybe later" or X with zero interaction.
 * Only a session with a real attempt detours through the per-term
 * `/recall-summary` first. `/summary` itself re-derives which variant it's
 * showing from the same session context, so this page doesn't need to pass
 * a query param through.
 */
const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr"];
const FILLED_DAYS = 3;

// Explicit `soft` transition on "visible" — with none specified, Motion
// falls back to its default spring (damping ratio ~0.5, clearly
// underdamped), an unintended bounce sitting right next to the flame
// icon's own *deliberate* landing bounce above it. `soft` keeps the same
// fade+pop-in motion with no overshoot.
const dayVariants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: { opacity: 1, scale: 1, transition: soft },
};

export default function StreakPage() {
  const router = useRouter();
  const recallAttempted = useRecallAttempted();
  const [revealed, setRevealed] = useState(false);
  // Set the instant the flame icon's own landing animation completes (see
  // onAnimationComplete below) — confetti is paired to fire at that exact
  // moment, not on the generic `revealed` timer the day-circle stagger
  // uses, so the burst genuinely reads as the icon's "landing impact"
  // rather than an independently-timed effect.
  const [iconLanded, setIconLanded] = useState(false);
  const { ref: scrollRef, thumb, measure } = useScrollThumb<HTMLDivElement>();

  const onExit = useCallback(() => router.back(), [router]);
  useRecallStep({ currentStep: null, totalSteps: 6, onExit });
  // Bespoke full-bleed screen, not the shared small mascot+bubble block.
  useMascotBubble(null);

  useEffect(() => {
    const id = setTimeout(() => setRevealed(true), 450);
    return () => clearTimeout(id);
  }, []);

  function handleContinue() {
    router.push(recallAttempted ? "/recall-summary" : "/summary");
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-coral-bold">
      <ConfettiBurst play={iconLanded} />

      <div
        ref={scrollRef}
        onScroll={measure}
        className="no-scrollbar flex min-h-0 flex-1 flex-col items-center justify-center gap-7 overflow-y-auto px-5 py-10"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={gentle}
          className="flex flex-col items-center gap-4"
        >
          {/* Flame streak icon (public/images/streak.svg, natively
              142x178 — matches Figma's slot 13900:26440, 141x177).
              A deliberate landing animation, not a bug to remove: falls
              from above (y:-80) and settles with `snappy`'s own spring
              bounce (stiffness 400 / damping 28, a damping ratio of ~0.7 —
              genuinely underdamped on purpose here, unlike every other
              entrance in this app, which is why this is its own nested
              motion.img instead of reusing the parent block's plain fade).
              onAnimationComplete fires the paired confetti burst at the
              exact moment it lands. */}
          <motion.img
            src="/images/streak.svg"
            alt=""
            aria-hidden
            className="h-[141px] w-[141px]"
            initial={{ opacity: 0, y: -80, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={snappy}
            onAnimationComplete={() => setIconLanded(true)}
          />

          <div className="flex flex-col items-center">
            <CountUpNumber
              value={FILLED_DAYS}
              format={(n) => Math.round(n).toString().padStart(2, "0")}
              className="font-display text-[88px] font-extrabold leading-none tracking-tight text-coral-on-bold"
            />
            <p className="font-display text-2xl font-black text-coral-on-bold">
              Day Streak
            </p>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={revealed ? "visible" : "hidden"}
          variants={{
            visible: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } },
          }}
          className="flex items-center gap-2"
        >
          {DAY_LABELS.map((day, i) => {
            const filled = i < FILLED_DAYS;
            return (
              <motion.div
                key={day}
                variants={dayVariants}
                className="flex flex-col items-center gap-2"
              >
                <span className="text-xs text-coral-on-bold/70">{day}</span>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    filled ? "bg-coral-subtle" : "bg-interactive-disabled"
                  }`}
                >
                  {filled && (
                    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
                      <path
                        d="M3 8.5l3 3 7-7"
                        fill="none"
                        stroke="var(--color-coral-on-subtle)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
      <ScrollThumbIndicator thumb={thumb} />

      <BottomCta className="flex gap-2">
        {/* Hand-rolled, not SecondaryButton — see recall-summary/page.tsx
            for why (shared pillBase is w-full, breaks side-by-side). */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          transition={snappy}
          onClick={() => console.log("[stub] Share tapped — not implemented")}
          className="relative flex h-[58px] items-center justify-center rounded-full bg-interactive-secondary px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]"
        >
          <span className="font-display text-[18px] font-semibold text-interactive-on-secondary">
            Share
          </span>
        </motion.button>
        <PrimaryButton onClick={handleContinue} className="flex-1">
          Continue
        </PrimaryButton>
      </BottomCta>
    </div>
  );
}

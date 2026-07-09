"use client";

import { motion } from "motion/react";
import { CloseIcon } from "@/components/icons";
import { gentle } from "@/lib/motion";

/**
 * Persistent chrome on every recall screen (design.md §4 "Persistent chrome"):
 * exit button, term-queue progress bar, streak chip.
 *
 * Step counting: entry fork, confidence tap, and each term screen each count
 * as one step — the mic-permission primer/OS dialog does NOT increment
 * progress. The bar reaches 100% on the last term screen, not the summary.
 *
 * Pass `currentStep={null}` to unmount the progress bar entirely (the
 * summary screen has no bar at all, rather than one stuck at 100%). A
 * "Try again" from the summary starts a new practice pass back at
 * `currentStep={1}` against that pass's own `totalSteps`.
 *
 * The fill's width is `(currentStep / totalSteps) * 100%`, but it's driven
 * via a `scaleX` transform (transform-origin left) instead of animating
 * `width` directly — same visual result, but transform/opacity is the only
 * thing motion-guide.md allows animating for performance.
 */
export function TopBar({
  currentStep,
  totalSteps,
  streak,
  onExit,
}: {
  currentStep: number | null;
  totalSteps: number;
  streak: number;
  onExit: () => void;
}) {
  const ratio =
    currentStep === null
      ? 0
      : Math.min(Math.max(currentStep / totalSteps, 0), 1);

  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <button
        type="button"
        onClick={onExit}
        aria-label="Exit"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      >
        <CloseIcon className="h-6 w-6 text-text-primary" />
      </button>

      {currentStep !== null && (
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-background-surface">
          <motion.div
            className="h-4 w-full origin-left rounded-full bg-brand-bold"
            initial={false}
            animate={{ scaleX: ratio }}
            transition={gentle}
          />
        </div>
      )}

      <div className="flex h-9 shrink-0 items-center gap-1 rounded-full px-1">
        <img
          src="/images/streak-ray.svg"
          alt=""
          aria-hidden
          className="h-[19px] w-[16px]"
        />
        <span className="font-display text-lg font-medium tracking-wide text-blue-on-subtle">
          {streak}
        </span>
      </div>
    </div>
  );
}

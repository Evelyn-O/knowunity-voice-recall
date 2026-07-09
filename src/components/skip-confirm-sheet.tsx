"use client";

import { AnimatePresence, motion } from "motion/react";
import { BottomCta } from "@/components/bottom-cta";
import { sheet, snappy } from "@/lib/motion";

/**
 * The soft skip-confirmation bottom sheet (Figma nodes 13900:25459 general
 * / 13900:25446 last-term) — never a hard block, matches CLAUDE.md's
 * "skip/exit must always be reachable in one tap, never blocking" rule:
 * this sheet is a check-in, not a gate. Two copy variants, same shape:
 * - `default`: "We can review this one later no worries!" — any non-last
 *   term.
 * - `last-term`: "Maybe next time!" — term 4 (the last base term) and
 *   term 5 / Cadence (the absolute last term this session can reach).
 *
 * Deliberately a boolean overlay, not a stage/route change: the caller's
 * own `open` state doesn't touch its stage machine at all, so "I changed
 * my mind" always returns to exactly the state the student was already in
 * — there's nothing to restore, nothing ever left it.
 *
 * The scrim doubles as the "dim the mic UI behind the sheet" treatment
 * visible in the Figma "on screen" mockup (13900:25371) — background/scrim
 * is a real design.md token (`background-scrim`), not an invented dim.
 */
export function SkipConfirmSheet({
  open,
  variant = "default",
  onSkip,
  onCancel,
}: {
  open: boolean;
  variant?: "default" | "last-term";
  onSkip: () => void;
  onCancel: () => void;
}) {
  const heading =
    variant === "last-term"
      ? "Maybe next time!"
      : "We can review this one later no worries!";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            aria-hidden
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 z-10 bg-background-scrim"
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={sheet}
            className="absolute inset-x-0 bottom-0 z-20 rounded-t-[32px] border-t border-border-default bg-pro-subtle"
          >
            <div className="mx-auto mt-2 h-1 w-8 rounded-full bg-background-stacking" />
            <div className="px-7 pt-5">
              <p className="font-display text-[26px] font-black leading-[1.1] text-pro-bold">
                {heading}
              </p>
            </div>
            <BottomCta className="flex gap-1">
              <motion.button
                whileTap={{ scale: 0.94 }}
                transition={snappy}
                onClick={onSkip}
                className="relative flex h-[58px] items-center justify-center rounded-full bg-interactive-secondary px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]"
              >
                <span className="font-display text-[18px] font-semibold text-interactive-on-secondary">
                  Skip
                </span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.94 }}
                transition={snappy}
                onClick={onCancel}
                className="relative flex h-[58px] flex-1 items-center justify-center rounded-full bg-pro-bold px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]"
              >
                <span className="font-display text-[18px] font-semibold text-pro-on-bold">
                  I changed my mind
                </span>
              </motion.button>
            </BottomCta>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

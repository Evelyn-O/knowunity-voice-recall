"use client";

import { AnimatePresence, motion } from "motion/react";
import { MascotImage } from "@/components/mascot-image";
import { BottomCta } from "@/components/bottom-cta";
import { PrimaryButton, SecondaryButton } from "@/components/buttons";
import { sheet } from "@/lib/motion";

export type ExitConfirmVariant = "first-time" | "in-progress";

/**
 * The soft exit-confirmation bottom sheet (Figma nodes 13965:41377
 * "first-time"/not-yet-attempted, 13965:41416 "in-progress"/already-
 * engaged) — SPEC.md §2E, finally built: every X (and "Maybe later", and
 * the recurring entry fork's skip-forward icon) across the whole recall
 * flow opens this same shared sheet instead of exiting immediately.
 * "Keep learning" (or tapping the scrim) just dismisses it — a boolean
 * overlay, not a stage/route change, so there's nothing to restore, same
 * as `SkipConfirmSheet`'s own pattern. "Leave" is the only path that
 * actually exits.
 *
 * Blurring the screen content behind this sheet is the CALLER's job
 * (wired once at the layout level, the same `blur-[10px]` treatment the
 * entry screen's mic-permission dialog already uses) — this component
 * only owns the scrim + sheet itself.
 */
const COPY: Record<
  ExitConfirmVariant,
  { pose: string; alt: string; headline: string; subcopy: string }
> = {
  "first-time": {
    pose: "dont-leave",
    alt: "Noe, sad",
    headline: "You got this!",
    subcopy: "Next time, try saying one out loud — it's how it really sticks!",
  },
  "in-progress": {
    pose: "laughing",
    alt: "Noe, laughing",
    headline: "Almost there!",
    subcopy: "Your progress will be saved for when you're back.",
  },
};

export function ExitConfirmSheet({
  open,
  variant,
  onKeepLearning,
  onLeave,
}: {
  open: boolean;
  variant: ExitConfirmVariant;
  onKeepLearning: () => void;
  onLeave: () => void;
}) {
  const { pose, alt, headline, subcopy } = COPY[variant];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            aria-hidden
            onClick={onKeepLearning}
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
            className="absolute inset-x-0 bottom-0 z-20 rounded-t-[32px] bg-background-surface"
          >
            <div className="mx-auto mt-2 h-1 w-8 rounded-full bg-background-inverse" />
            <div className="flex flex-col items-center gap-6 px-4 pb-2 pt-8 text-center">
              <MascotImage pose={pose} alt={alt} size={160} />
              <div className="flex flex-col gap-1">
                <p className="font-display text-[36px] font-extrabold text-text-primary">
                  {headline}
                </p>
                <p className="font-display text-lg font-black text-text-secondary">
                  {subcopy}
                </p>
              </div>
            </div>
            <BottomCta className="flex flex-col gap-2">
              <PrimaryButton onClick={onKeepLearning}>Keep learning</PrimaryButton>
              <SecondaryButton onClick={onLeave}>Leave</SecondaryButton>
            </BottomCta>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

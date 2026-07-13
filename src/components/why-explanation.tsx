"use client";

import { motion } from "motion/react";
import { gentle } from "@/lib/motion";

const VARIANT_STYLES: Record<"correct" | "reveal", { box: string; heading: string }> = {
  correct: {
    box: "border-green-bold bg-green-on-bold",
    heading: "text-green-bold",
  },
  reveal: {
    box: "border-brand-bold bg-background-scrim",
    heading: "text-brand-bold",
  },
};

/**
 * The "Why?" explanation box (Figma nodes 14036:14586 "correct" /
 * 14036:14642 "reveal") — revealed in place of the Why?/Continue button
 * pair once Why? is tapped, on result-sheet types that support it
 * (correct-answer and reveal; never the intermediate hint-ladder sheets).
 * Used on every term's own correct-answer sheet (terms 1/2/4/5) plus
 * term-3's reveal sheet — each term supplies its own explanation copy,
 * some sourced from Figma's worked examples, some given directly by
 * Evelyn (see each term's own WHY_EXPLANATION constant for its sourcing
 * note).
 *
 * Typography matches HighlightCard's own "transcript" variant exactly
 * (same Figma dev-mode values — 18.659px/12.439px eyebrow/body) since
 * this is visually the same family of "bordered info box." Not built as
 * a HighlightCard variant: that component's border is the hand-drawn
 * brush-stroke asset applied via `border-image`, while this box is a
 * plain solid 2px border/fill whose color swaps per variant — a
 * different-enough treatment that folding it into HighlightCard's
 * definition/transcript binary would complicate a component several
 * other screens already depend on.
 */
export function WhyExplanation({
  variant,
  children,
}: {
  variant: "correct" | "reveal";
  children: React.ReactNode;
}) {
  const styles = VARIANT_STYLES[variant];
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={gentle}
      className={`w-full overflow-hidden rounded-card border-2 border-solid p-4 ${styles.box}`}
    >
      <div className="flex flex-col gap-1 text-left">
        <p
          className={`font-display text-[18.659px] font-medium leading-[24.879px] tracking-[0.187px] ${styles.heading}`}
        >
          Why?
        </p>
        <p className="font-sans text-[12.439px] font-light leading-[16.586px] tracking-[0.124px] text-text-primary">
          {children}
        </p>
      </div>
    </motion.div>
  );
}

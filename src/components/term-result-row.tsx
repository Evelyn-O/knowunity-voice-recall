"use client";

import { motion } from "motion/react";
import type { TermOutcome } from "@/lib/recall-flow-context";

/**
 * The per-term result row on the Recall summary screen (design.md §4
 * "Summary list": pill-shaped row, interactive/secondary fill, status
 * icon + two-line title/caption + colored outcome chip). Figma node
 * 13900:24948 (re-fetched fresh) is the source for exact colors/copy —
 * "Revealed" is purple/brand there now, not the coral SPEC.md's older
 * text described; this build follows the fresh fetch.
 *
 * Icons are the real exported per-outcome assets
 * (public/images/per-term-summary-on-*.svg) — each one bakes its own
 * color (green/gold/muted/purple), matching the chip colors below, so
 * unlike the old inline icon components these render as-is with no
 * text-* color class needed.
 */
const CHIP_CONFIG: Record<
  TermOutcome,
  { label: string; bg: string; text: string; iconSrc: string }
> = {
  unaided: {
    label: "On your own",
    bg: "bg-green-bold",
    text: "text-green-on-bold",
    iconSrc: "/images/per-term-summary-on-your-own.svg",
  },
  hinted: {
    label: "With a hint",
    bg: "bg-pro-bold",
    text: "text-pro-on-bold",
    iconSrc: "/images/per-term-summary-on-with-hint.svg",
  },
  revealed: {
    label: "Revealed",
    bg: "bg-brand-bold",
    text: "text-brand-subtle",
    iconSrc: "/images/per-term-summary-on-revealed.svg",
  },
  skipped: {
    label: "Skipped",
    bg: "bg-interactive-disabled",
    text: "text-text-secondary",
    iconSrc: "/images/per-term-summary-on-skipped.svg",
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function TermResultRow({
  title,
  caption,
  outcome,
}: {
  title: string;
  caption: string;
  outcome: TermOutcome;
}) {
  const { label, bg, text, iconSrc } = CHIP_CONFIG[outcome];

  return (
    <motion.div
      variants={rowVariants}
      className="flex min-h-[58px] w-full shrink-0 items-center gap-4 rounded-full bg-interactive-secondary px-4 py-2"
    >
      <img src={iconSrc} alt="" aria-hidden className="h-6 w-6 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
        <p className="truncate font-sans text-[15px] font-medium tracking-wide text-text-primary">
          {title}
        </p>
        {/* Never truncate the recommendation/comparison line — it wraps
            to a 2nd line instead (and the row grows to fit, since it's
            min-h now, not a fixed h-[58px]), rather than clipping copy
            the student actually needs to read. */}
        <p className="line-clamp-2 font-sans text-[9px] tracking-wide text-text-secondary">
          {caption}
        </p>
      </div>
      <div className={`flex h-8 shrink-0 items-center justify-center rounded-full px-3 ${bg}`}>
        <span className={`whitespace-nowrap font-display text-[15px] font-medium ${text}`}>
          {label}
        </span>
      </div>
    </motion.div>
  );
}

export { rowVariants as termResultRowVariants };

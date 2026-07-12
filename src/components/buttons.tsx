"use client";

import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import { snappy } from "@/lib/motion";

/** Shared tactile press feedback for every tappable control (motion-guide.md). */
const tap = { whileTap: { scale: 0.94 }, transition: snappy };

// HTMLMotionProps (not React's own ButtonHTMLAttributes) — motion.button
// redefines onAnimationStart/onDrag/onDragStart/onDragEnd with its own
// animation-oriented signatures, incompatible with the native DOM event
// handler types; spreading native-typed props onto motion.button is a type
// error, not just a lint nit (surfaces in `next build`'s tsc pass even
// though `next dev`/Turbopack never runs it, which is why this stayed
// unnoticed until deploying to Vercel).
type ButtonProps = HTMLMotionProps<"button"> & {
  children: ReactNode;
};

/** Shape/sizing only — no typography, so a variant's own font classes never
 * lose the cascade to this (they'd tie on specificity and whichever was
 * compiled later would silently win). */
const pillBase =
  "relative flex h-[58px] w-full items-center justify-center gap-2 rounded-full px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]";

const pillLabel = "font-display text-[21px] font-bold";

/**
 * Disabled state swaps to background/surface + text/disabled (design.md),
 * not just a dimmed version of the primary colors — e.g. the confidence-tap
 * "Continue" button before an option is picked (Figma node 13900:24794).
 */
export function PrimaryButton({
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      {...tap}
      disabled={disabled}
      className={`${pillBase} ${pillLabel} ${
        disabled
          ? "bg-background-surface text-text-disabled"
          : "bg-interactive-primary text-interactive-on-primary"
      } ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function SecondaryButton({ children, className = "", ...props }: ButtonProps) {
  return (
    <motion.button
      {...tap}
      className={`${pillBase} ${pillLabel} bg-interactive-secondary text-text-primary ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/**
 * Vertically-stacked selection box (design.md §4 "Options / input area" —
 * MCQ / confidence-tap pattern). Selected swaps fill to accent/brand/subtle
 * and text to accent/brand/bold (Figma node 13900:25634); unselected stays
 * background/surface + text/primary, matching PrimaryButton/SecondaryButton
 * sizing so the three states read as one family.
 *
 * Corner radius is 16px, not the pill/rounded-full shape PrimaryButton and
 * SecondaryButton use — Figma node 13900:24869 draws this as a selection
 * box, not a button. `!rounded-bubble` overrides pillBase's `rounded-full`
 * on this variant only (`!` forces it past Tailwind's same-specificity
 * cascade-order gotcha — see buttons.tsx's own note above on typography —
 * rather than hardcoding 16px, this binds to the existing --radius-bubble
 * token (globals.css), the same named 16px value the text-fallback input
 * container's corner radius already matches.
 */
export function SelectableButton({
  children,
  selected,
  className = "",
  ...props
}: ButtonProps & { selected: boolean }) {
  return (
    <motion.button
      {...tap}
      className={`${pillBase} !rounded-bubble font-sans text-[18px] font-medium tracking-[0.18px] ${
        selected
          ? "bg-brand-subtle text-brand-bold"
          : "bg-background-surface text-text-primary"
      } ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/**
 * `secondary` (default) is the filled background/surface pill used
 * elsewhere in the bottomCta buttonGroup. `tertiary` drops the fill and
 * shadow entirely — just the icon, no chrome — for spots like the term
 * idle screen's skip button where Figma shows no background at all.
 */
export function IconButton({
  children,
  className = "",
  variant = "secondary",
  ...props
}: HTMLMotionProps<"button"> & {
  children: ReactNode;
  variant?: "secondary" | "tertiary";
}) {
  return (
    <motion.button
      {...tap}
      className={`relative flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full ${
        variant === "tertiary"
          ? ""
          : "bg-background-surface shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]"
      } ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function TextLinkButton({ children, className = "", ...props }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={snappy}
      className={`font-display text-sm text-text-secondary underline decoration-1 underline-offset-2 ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

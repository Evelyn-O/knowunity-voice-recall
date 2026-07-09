import type { ReactNode } from "react";

/**
 * The docked bottomCta area shared by every recall screen (design.md §4
 * "Persistent chrome" — the bottomCta pattern). Figma's own "Bottom CTA"
 * layers pad 29px on all four sides (space/700 — see globals.css's
 * --spacing-700, a real token since 29 doesn't land on Tailwind's default
 * 4px-multiple scale), flat, not safe-area-adjusted — this is a prototype
 * matched to Figma's frame, not a native app. Callers own their own
 * internal arrangement (row vs. column, gaps) via className; this only
 * owns the outer padding, so every screen's bottomCta padding stays in
 * one place instead of being re-specified per screen.
 */
export function BottomCta({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-700 ${className}`}>{children}</div>;
}

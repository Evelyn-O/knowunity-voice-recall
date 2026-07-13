import type { ScrollThumbRect } from "@/lib/use-scroll-thumb";

/**
 * The visual half of useScrollThumb (lib/use-scroll-thumb.ts) — a thin
 * (4px, half the 8px width HighlightCard/TextInput use for their own
 * small contained boxes) hand-drawn thumb for whole-screen scroll. Render
 * as a sibling of the scrolling element, inside a `relative` ancestor that
 * shares the scrolling element's own top edge, so its absolute `top`
 * (computed from scrollTop, not offset by anything else) lines up.
 */
export function ScrollThumbIndicator({ thumb }: { thumb: ScrollThumbRect }) {
  if (!thumb) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-1 w-1 rounded-full bg-interactive-disabled"
      style={{ top: thumb.top, height: thumb.height }}
    />
  );
}

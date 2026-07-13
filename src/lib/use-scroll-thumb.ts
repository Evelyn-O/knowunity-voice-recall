"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

export type ScrollThumbRect = { top: number; height: number } | null;

/**
 * Same measured-thumb approach as HighlightCard/TextInput's own contained-
 * box scrollbar (components/highlight-card.tsx, components/text-input.tsx)
 * — a real native scrollbar is hidden (.no-scrollbar, globals.css) in
 * favor of a hand-drawn thumb tracking scrollTop, since native scrollbar
 * styling (`::-webkit-scrollbar`) isn't reliably stylable on mobile
 * Safari, the actual target platform. This is a fresh, separate
 * implementation for whole-SCREEN scroll containers rather than a small
 * bounded box — those two components keep their own copy of this logic
 * untouched (different thumb thickness, not worth a shared refactor that
 * risks their already-working behavior).
 *
 * Attach `ref` to the scrolling element itself and `onScroll={measure}` to
 * keep the thumb's position live; `thumb` is null whenever the content
 * doesn't actually overflow (nothing to show).
 */
export function useScrollThumb<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [thumb, setThumb] = useState<ScrollThumbRect>(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 1) {
      setThumb(null);
      return;
    }
    const trackHeight = el.clientHeight;
    const thumbHeight = Math.max(32, (trackHeight / el.scrollHeight) * trackHeight);
    const maxScroll = el.scrollHeight - el.clientHeight;
    const thumbTop =
      maxScroll > 0 ? (el.scrollTop / maxScroll) * (trackHeight - thumbHeight) : 0;
    setThumb({ top: thumbTop, height: thumbHeight });
  }, []);

  // Re-measure on mount and whenever the scrollable element's own size (or
  // its content's size) changes — a ResizeObserver on the element itself
  // catches both, since content growing/shrinking changes scrollHeight.
  useLayoutEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  return { ref, thumb, measure };
}

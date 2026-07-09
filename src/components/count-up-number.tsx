"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "motion/react";

/**
 * Counts a number up from 0 to `value` rather than snapping straight to
 * it — the streak/summary reveal's "numbers count up" requirement. Uses
 * Motion's imperative `animate()` (motion-guide.md: "Motion handles the
 * spring physics" — this drives a plain number via a tween, not a new
 * pattern invented outside the library) to tween a ref'd number and
 * re-render on each frame via onUpdate, formatted through `format` so
 * callers can keep e.g. "4/5" or "2:09" shapes rather than a bare int.
 *
 * Respects reduced motion: renders the final value immediately with no
 * tween, same rule every other animation in this app follows.
 */
export function CountUpNumber({
  value,
  duration = 0.9,
  delay = 0,
  format = (n: number) => Math.round(n).toString(),
  className = "",
}: {
  value: number;
  duration?: number;
  delay?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(prefersReducedMotion ? value : 0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplay(value);
      return;
    }
    // No extra "already started" guard — animate()'s own cleanup
    // (controls.stop()) is what correctly handles React 18 Strict
    // Mode's dev-only double-invoke (mount → cleanup → mount again). An
    // earlier version added a ref guard here to stop it from double-
    // starting; that instead made Strict Mode's cleanup stop the
    // animation and then the guard blocked it from ever restarting,
    // leaving the number stuck at 0 in development.
    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={className}>{format(display)}</span>;
}

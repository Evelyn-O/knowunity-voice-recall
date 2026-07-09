"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * A brief, once-only confetti burst for the streak/summary reveal —
 * explicitly requested for this one celebratory moment, which is a
 * deliberate exception to motion-guide.md's general "no particle
 * effects" / "not confetti" rules (both written before this request).
 * Kept to that same file's spirit otherwise: short, interruptible,
 * transform/opacity only, and gone rather than looping.
 *
 * Reuses the app's own existing hue tokens for the pieces rather than
 * inventing confetti-specific colors. Fires once when `play` flips to
 * true (the caller's own staggered reveal finishing), not on mount, so
 * it lands after the rows/numbers have already appeared — respects
 * reduced motion by never rendering at all.
 */
const COLORS = [
  "bg-brand-bold",
  "bg-green-bold",
  "bg-coral-bold",
  "bg-pro-bold",
  "bg-magenta-bold",
  "bg-blue-bold",
];

type Piece = {
  id: number;
  x: number;
  y: number;
  delay: number;
  rotate: number;
  color: string;
};

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 260,
    y: 200 + Math.random() * 60,
    delay: Math.random() * 0.12,
    rotate: (Math.random() - 0.5) * 540,
    color: COLORS[i % COLORS.length],
  }));
}

export function ConfettiBurst({ play }: { play: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  const pieces = useMemo(() => makePieces(16), []);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!play || prefersReducedMotion) return;
    setVisible(true);
    const id = setTimeout(() => setVisible(false), 1300);
    return () => clearTimeout(id);
  }, [play, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
    >
      <AnimatePresence>
        {visible &&
          pieces.map((p) => (
            <motion.span
              key={p.id}
              className={`absolute h-2 w-2 rounded-[2px] ${p.color}`}
              initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
              animate={{ x: p.x, y: p.y, rotate: p.rotate, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.05,
                delay: p.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          ))}
      </AnimatePresence>
    </div>
  );
}

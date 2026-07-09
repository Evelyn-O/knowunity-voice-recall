"use client";

import { AnimatePresence, motion } from "motion/react";
import { MascotImage } from "@/components/mascot-image";
import { gentle } from "@/lib/motion";

/**
 * The small avatar + speech-bubble row (design.md §4 "Mascot + speech-bubble
 * card"): circular mascot with a drop-shadow ellipse beneath it, a rounded
 * background/surface bubble with a tail pointing back at the mascot.
 * Rendered once by the shared layout (app/(recall)/layout.tsx), driven by
 * the `mascot` value a screen sets via useMascotBubble — same persistent-
 * chrome pattern as TopBar, so this block survives route changes between
 * screens instead of unmounting/remounting (which is what previously made
 * pose/text changes across a screen change snap instead of crossfade).
 * Horizontally centered as a unit by being `w-full` inside its wrapper's
 * padded column.
 *
 * The mascot avatar sits in a fixed-size box (MascotImage is always
 * size={70}) — swapping pose never resizes or shifts the ellipse or the
 * bubble, only the artwork inside crossfades. Both mascot poses (old/new)
 * render `absolute inset-0` inside that fixed box during the transition —
 * same box, same size — so the crossfade never causes a layout shift. The
 * row and the bubble both carry `layout` so that when the bubble's *text*
 * changes length (different question, different screen), the bubble
 * resizes smoothly via the Motion library instead of snapping, and the
 * row reflows around it in the same animation rather than the mascot
 * jumping to a new position. `AnimatePresence mode="popLayout"` pulls the
 * outgoing pose/line out of flow the instant it starts exiting, so the
 * incoming one drives the resize immediately instead of collapsing to
 * empty first (motion-guide.md's "fades, simple moves" territory, not a
 * hand-rolled height animation).
 */
export function MascotBubble({
  pose,
  alt,
  text,
  dimmed = false,
}: {
  pose: string;
  alt: string;
  text: string;
  dimmed?: boolean;
}) {
  return (
    <motion.div
      layout
      animate={{ opacity: dimmed ? 0.5 : 1 }}
      transition={gentle}
      className="flex w-full items-end gap-2"
    >
      <motion.div layout transition={gentle} className="relative h-[70px] w-[70px] shrink-0">
        {/* This needs its own `layout` even though its own size/position
            never intentionally changes: it's a sibling of the bubble
            inside a `layout`-animated row, and when the bubble resizes
            (new/longer/shorter text), Framer projects a FLIP transform
            onto the row to fake the resize smoothly — a transform that
            visually stretches/squishes any child that isn't independently
            layout-tracked. Confirmed live: without `layout` here, the row
            hit scaleY(1.47) mid-transition and the avatar visibly warped
            with it — reading as "the whole bubble" animating instead of
            just the text. `layout` here makes Motion projected-animate
            this box on its own (a clean position shift only), decoupled
            from the row's own resize distortion. */}
        {/* Shadow ellipse: sits BEHIND the mascot (z-index below the
            image layer) near the bottom of this fixed avatar box, not
            overlapping the face. A true flat ellipse — 61x11 (~5.5:1) with
            rounded-[50%], not rounded-full: at this width a fixed pixel
            radius (rounded-full) gets clamped into a stadium/pill shape
            with straight top/bottom edges, which reads as a rounded
            rectangle. Percentage radius on both axes is what makes each
            corner's own ellipse combine into one true ellipse. */}
        <div
          aria-hidden
          className="absolute bottom-0 left-[4.5px] h-[11px] w-[61px] rounded-[50%] bg-background-stacking"
        />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={pose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={gentle}
            className="absolute inset-0 z-10"
          >
            <MascotImage pose={pose} alt={alt} size={70} />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <motion.div
        layout
        transition={gentle}
        className="relative flex-1 rounded-bubble bg-background-surface p-4"
      >
        {/* -left-0.5, not -left-1.5: at 12px pre-rotation, the 45° tail's
            bounding box widens to ~17px, so -1.5 (-6px) put its rotated
            corner almost exactly where the mascot's artwork ends (it fills
            its own box to within ~1px on every side) — the gap-2 (8px) row
            gap was correct, but the tail was eating nearly all of it. */}
        <div
          aria-hidden
          className="absolute -left-0.5 bottom-4 h-3 w-3 rotate-45 rounded-[2px] bg-background-surface"
        />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={text}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={gentle}
            className="text-[16px] leading-[1.5] tracking-[-0.16px] text-text-primary"
          >
            {text}
          </motion.p>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

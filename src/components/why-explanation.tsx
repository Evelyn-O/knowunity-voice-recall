"use client";

import { motion } from "motion/react";
import { gentle } from "@/lib/motion";

const VARIANT_STYLES: Record<
  "correct" | "incorrect" | "reveal",
  { box: string; heading: string; borderImage: string }
> = {
  correct: {
    box: "border-green-bold bg-green-on-bold",
    heading: "text-green-bold",
    borderImage: "/images/green-brush-box.svg",
  },
  incorrect: {
    box: "border-coral-bold bg-coral-on-bold",
    heading: "text-coral-bold",
    borderImage: "/images/coral-brush-box.svg",
  },
  reveal: {
    box: "border-brand-bold bg-brand-on-bold",
    heading: "text-brand-bold",
    borderImage: "/images/purple-brush-box.svg",
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
 * `incorrect` (coral, Figma node 14036:17147) is a third variant added for
 * the pre-step quiz's own Why box (`/quiz`) — that screen keeps the
 * Why?/Continue button pair visible even after reveal (per its own Figma
 * frames, 14036:17120 correct / 14036:17147 incorrect), unlike the terms'
 * collapse-to-single-button pattern, so it's a separate toggle at that
 * call site rather than a change to this component's own behavior.
 *
 * Typography matches HighlightCard's own "transcript" variant exactly
 * (same Figma dev-mode values — 18.659px/12.439px eyebrow/body) since
 * this is visually the same family of "bordered info box." Not built as
 * a HighlightCard variant: HighlightCard is a single shared asset/color
 * (always the purple brush stroke) regardless of context, while this box
 * needs a DIFFERENT brush texture per outcome color — a different-enough
 * shape (3 assets, not 1) that folding it into HighlightCard's
 * definition/transcript binary would complicate a component several
 * other screens already depend on.
 *
 * Border is the same `border-image` (9-slice) brush-stroke technique
 * HighlightCard uses for "What I heard:"/"Picture this:" — originally
 * this box had a plain solid 2px border instead (Figma's own reveal-sheet
 * frame, 14036:14642, actually still shows a clean border on the Why box
 * even though the "What I heard:" box right above it in the same frame
 * uses the brush texture); Evelyn asked for the brush treatment here too,
 * superseding that frame. Each variant has its own dedicated 375x117
 * asset — purple-brush-box.svg/green-brush-box.svg/coral-brush-box.svg
 * (public/images, all supplied by Evelyn, not invented/approximated with
 * a CSS filter) — rather than reusing HighlightCard's own
 * picture-this-box.svg (a different-sized asset, and this box needs 3
 * outcome colors, not HighlightCard's single fixed purple).
 * `borderImageSlice` is "40", not a smaller value — each asset's own path
 * data confirms its rounded-corner curve spans ~38.4 SVG units (measured
 * directly off the path's own corner-to-straight-edge transition point,
 * not eyeballed), so a slice smaller than that (an earlier pass here used
 * "20", copied from HighlightCard's own picture-this-box.svg value
 * without re-measuring for this differently-proportioned asset) slices
 * through the MIDDLE of the corner arc instead of past its end — the
 * leftover curve fragment then lands in the stretched edge strip, visible
 * as a stray line down the left edge once that strip is stretched much
 * taller than its ~77px source sliver. All three assets share the exact
 * same corner geometry (same template), so one slice value covers all.
 *
 * `reveal`'s own box fill is `bg-brand-on-bold`, not `bg-background-
 * scrim` (an earlier pass here) — `background-scrim` is a 50%-alpha token
 * (meant for dimming an overlay, not filling a card), so it never
 * visually matched purple-brush-box.svg's own opaque baked fill: the
 * border-image's corner/edge slices necessarily carry a thin strip of
 * that baked fill alongside the visible brush stroke (a hand-drawn stroke
 * doesn't have a perfectly crisp inner edge), and against the translucent
 * scrim that strip read as a visible dark ring between the stroke and the
 * box content. Evelyn re-exported purple-brush-box.svg with a solid
 * (non-translucent) fill specifically to fix this, and gave the exact
 * color to use (`#16171c`) rather than approximating it against an
 * existing token — `--color-brand-on-bold` (globals.css) was updated to
 * that exact value and used here, since that slot existed but was
 * otherwise unused anywhere in the app (safe to repoint, no raw hex in
 * the component itself). `correct`/`incorrect` never had this problem —
 * their own bg tokens (green/coral-on-bold) already were exact opaque
 * matches for their own assets' baked fill colors.
 */
export function WhyExplanation({
  variant,
  children,
}: {
  variant: "correct" | "incorrect" | "reveal";
  children: React.ReactNode;
}) {
  const styles = VARIANT_STYLES[variant];
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={gentle}
      className={`w-full overflow-hidden rounded-card border-solid p-4 ${styles.box}`}
      style={{
        borderWidth: "12px",
        borderImageSource: `url(${styles.borderImage})`,
        borderImageSlice: "40",
        borderImageWidth: "12px",
        borderImageRepeat: "stretch",
      }}
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

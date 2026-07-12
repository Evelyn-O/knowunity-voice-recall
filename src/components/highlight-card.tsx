"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * The bordered "highlight card" pattern (design.md §4): reused for the
 * definition/preview card ("Picture this: …", Figma node 13900:26421,
 * variant="definition") and the transcript-echo card ("What I heard." /
 * "What you wrote.", nodes 13900:25954 / 13900:25161, variant=
 * "transcript" — the default, since it's the more frequent caller). Same
 * card shape, but Figma's own dev-mode data shows the two variants don't
 * share identical type: the eyebrow color, border weight, and the
 * content's size/weight all differ. This was previously hardcoded to the
 * "definition" look for every caller, which was wrong for the (more
 * common) transcript usage.
 *
 * The border itself is the hand-drawn "brush stroke" artwork from
 * public/images/picture-this-box.svg, applied as a CSS `border-image`
 * (9-slice) rather than a stretched `<img>` — a plain stretched image
 * (an earlier version of this component, and briefly a plain solid CSS
 * border after that) either distorts the brush texture non-uniformly as
 * the card grows taller, or loses the hand-drawn look Figma actually has
 * (Figma's own "sketch" stroke style isn't captured by dev-mode's plain
 * CSS export, which is why this looked like a solid border before). With
 * `border-image-slice`, the four brush corners stay a fixed size and only
 * the straight edges stretch, so a long typed/heard answer's taller card
 * never pushes text across the corner texture. Fill/radius still come
 * from real tokens (`bg-brand-subtle`, `radius-card`) as a fallback if
 * the image doesn't load, and `border-brand-on-subtle` covers the same
 * case for the border color.
 *
 * Padding is 17px on every side, and the eyebrow-to-content gap is 4px —
 * both taken directly from Figma's rendered dev-mode values (16.586px/
 * 4.146px, which round to 17px/4px).
 */
export function HighlightCard({
  eyebrow,
  children,
  variant = "transcript",
}: {
  eyebrow: string;
  children: React.ReactNode;
  variant?: "definition" | "transcript";
}) {
  const isDefinition = variant === "definition";
  const borderWidth = isDefinition ? "20px" : "12px";

  const contentRef = useRef<HTMLParagraphElement>(null);
  const [thumb, setThumb] = useState<{ top: number; height: number } | null>(null);

  // Same measured-thumb approach as TextInput (components/text-input.tsx)
  // — a real native scrollbar is hidden (.no-scrollbar) in favor of a
  // hand-drawn 8px rounded thumb (interactive/disabled) shown only once
  // content actually overflows, tracking scrollTop like a real scrollbar
  // would. `top` is offset by the content <p>'s own offsetTop within the
  // relative wrapper (not hardcoded), so it lands correctly below the
  // eyebrow regardless of caller-to-caller eyebrow length.
  const measure = () => {
    const el = contentRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 1) {
      setThumb(null);
      return;
    }
    const trackHeight = el.clientHeight;
    const thumbHeight = Math.max(24, (trackHeight / el.scrollHeight) * trackHeight);
    const maxScroll = el.scrollHeight - el.clientHeight;
    const thumbTop = maxScroll > 0 ? (el.scrollTop / maxScroll) * (trackHeight - thumbHeight) : 0;
    setThumb({ top: el.offsetTop + thumbTop, height: thumbHeight });
  };

  // Only the transcript variant scrolls — a typed/heard answer can run
  // long, but the definition preview is always a short single line in
  // Figma, so it never needs measuring.
  useLayoutEffect(() => {
    if (!isDefinition) measure();
  }, [children, isDefinition]);

  return (
    <div
      className="w-full rounded-card border-solid border-brand-on-subtle bg-brand-subtle p-[17px]"
      style={{
        borderWidth,
        borderImageSource: "url(/images/picture-this-box.svg)",
        borderImageSlice: "20",
        borderImageWidth: borderWidth,
        borderImageRepeat: "stretch",
      }}
    >
      <div className="relative flex flex-col gap-[4px] text-left">
        <p
          className={`font-display text-[18.659px] font-medium leading-[24.879px] tracking-[0.187px] ${
            isDefinition ? "text-brand-on-subtle" : "text-brand-bold"
          }`}
        >
          {eyebrow}
        </p>
        {/* Only the transcript variant scrolls — a typed/heard answer can
            run long, but the definition preview is always a short single
            line in Figma. Scoped to the content paragraph, not the whole
            card, so the eyebrow stays pinned above it. break-words +
            overflow-x-hidden fix the horizontal-scroll bug a long
            unbroken token (no spaces) used to cause — overflow-y-auto
            alone computes overflow-x to "auto" too (CSS overflow spec),
            not "hidden", so without an explicit wrap rule a long token
            could overflow sideways instead of wrapping. */}
        {isDefinition ? (
          <p className="font-sans text-[15.549px] font-medium leading-[20.732px] tracking-[0.155px] text-text-primary">
            {children}
          </p>
        ) : (
          <p
            ref={contentRef}
            onScroll={measure}
            className="no-scrollbar max-h-[145.25px] overflow-y-auto overflow-x-hidden break-words pr-3 font-sans text-[12.439px] font-light leading-[16.586px] tracking-[0.124px] text-text-primary"
          >
            {children}
          </p>
        )}
        {thumb && (
          <div
            aria-hidden
            className="absolute w-2 rounded-full bg-interactive-disabled"
            style={{ right: "-9px", top: thumb.top, height: thumb.height }}
          />
        )}
      </div>
    </div>
  );
}

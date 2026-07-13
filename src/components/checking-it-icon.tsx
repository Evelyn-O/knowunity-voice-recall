/**
 * The "Checking it" eyes icon, cropped from public/images/checking-it-mic.svg
 * — that asset bakes a purple circle + eyes + "Checking it"/"Give me a
 * second" text together as one flattened composite (Figma dev-mode export,
 * 133x180 viewBox; the circle+eyes region is the top 120px, the text fills
 * the remaining 60px below it). Only the circle+eyes region is shown here —
 * the baked text is cropped away since real, tokenized "Checking it"/"Give
 * me a second" text already renders separately alongside this icon
 * everywhere it's used, so showing the asset's own baked copy too would
 * duplicate it.
 *
 * Used for BOTH voice and text-fallback's Checking-it state — previously
 * voice showed knowie-listening.svg and text-fallback showed
 * knowie-reading.svg (two different icons for the same state); this is the
 * one shared replacement for both, regardless of modality.
 */
export function CheckingItIcon({ size }: { size: number }) {
  const scale = size / 120;
  return (
    <div
      style={{ width: size, height: size, overflow: "hidden", position: "relative" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/checking-it-mic.svg"
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 133 * scale,
          height: 180 * scale,
        }}
      />
    </div>
  );
}

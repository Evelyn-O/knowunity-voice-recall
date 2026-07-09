/**
 * Renders a mascot pose from public/images/knowie-*.svg. Plain <img>, not
 * next/image — these are vector art with no optimization benefit from the
 * image loader, and next/image's dimension-inference warns on some of
 * these SVGs even when width/height are set correctly.
 */
export function MascotImage({
  pose,
  alt,
  size,
  className = "",
}: {
  pose: string;
  alt: string;
  size: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/images/knowie-${pose}.svg`}
      alt={alt}
      width={size}
      height={size}
      className={className}
    />
  );
}

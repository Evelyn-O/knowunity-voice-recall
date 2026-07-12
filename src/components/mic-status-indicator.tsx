"use client";

import { motion } from "motion/react";
import { MascotImage } from "@/components/mascot-image";
import { LoadingSpinnerIcon } from "@/components/icons";

/**
 * Sending/Checking — the exact circle + status markup every term's voice
 * mic-loop already renders inline for these two stages. Factored out here
 * so the text-fallback path (which reaches the same two stages after
 * tapping Send) reuses the identical visual/animation instead of a
 * second, hand-copied version — "reuse the exact Sending UI/animation
 * from the mic flow" per the text-fallback build task. Each term's own
 * voice-path JSX is left as-is (already verified, no need to touch it);
 * this component is additive, used only by the new text-mode branches.
 */
export function SendingIndicator({ onCancel }: { onCancel: () => void }) {
  return (
    <>
      <div className="relative flex h-[120px] w-[120px] items-center justify-center rounded-full bg-brand-subtle shadow-[inset_0px_-8px_0px_0px_rgba(0,0,0,0.15)]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <LoadingSpinnerIcon className="h-[50px] w-[50px] text-text-primary" />
        </motion.div>
      </div>
      <div className="mt-3 flex flex-col items-center gap-2">
        <p className="font-display text-[18px] font-medium tracking-[0.01em] text-text-secondary">
          Sending
        </p>
        <button
          onClick={onCancel}
          className="font-sans text-xs text-text-secondary underline decoration-1 underline-offset-2"
        >
          Tap to cancel
        </button>
      </div>
    </>
  );
}

export function CheckingIndicator() {
  return (
    <>
      <div className="relative flex h-[120px] w-[120px] items-center justify-center rounded-full bg-brand-bold shadow-[inset_0px_-8px_0px_0px_rgba(0,0,0,0.15)]">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
        >
          <MascotImage pose="reading" alt="Noe, reading" size={80} />
        </motion.div>
      </div>
      <div className="mt-3 flex flex-col items-center gap-2">
        <p className="font-display text-[18px] font-medium tracking-[0.01em] text-text-secondary">
          Checking it
        </p>
        <p className="font-sans text-xs text-text-secondary">Give me a second</p>
      </div>
    </>
  );
}

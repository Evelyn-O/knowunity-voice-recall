"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { SendIcon } from "@/components/icons";
import { snappy } from "@/lib/motion";

/**
 * The reusable typed-answer box (Figma: default/idle 13965:32461, typing
 * 13965:32459, overflow 13965:32460) — used only during a term's "entering
 * answer" stage. Once sent, the typed text is echoed via HighlightCard
 * ("What you wrote.") instead, matching the Sending/Checking/Result Figma
 * frames, so this component never renders a disabled/read-only variant of
 * itself — idle/typing/overflow are its only three states.
 *
 * Fixed 195px height, content scrolls inside it — never grows the box.
 * The native scrollbar is hidden (.no-scrollbar, globals.css) in favor of
 * a hand-drawn 8px rounded thumb (interactive/disabled) shown only once
 * content actually overflows, positioned/sized from real scroll metrics
 * so it tracks scrollTop like a real scrollbar would.
 */
export function TextInput({
  value,
  onChange,
  onSend,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  autoFocus?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [thumb, setThumb] = useState<{ top: number; height: number } | null>(null);

  const measure = () => {
    const el = textareaRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 1) {
      setThumb(null);
      return;
    }
    const trackHeight = el.clientHeight;
    const thumbHeight = Math.max(24, (trackHeight / el.scrollHeight) * trackHeight);
    const maxScroll = el.scrollHeight - el.clientHeight;
    const thumbTop = maxScroll > 0 ? (el.scrollTop / maxScroll) * (trackHeight - thumbHeight) : 0;
    setThumb({ top: thumbTop, height: thumbHeight });
  };

  // Re-measure on every value change (typing, or a value set programmatically
  // e.g. by "Try with voice" round-tripping back) — layout effect so the
  // thumb never flashes at a stale size for a frame.
  useLayoutEffect(measure, [value]);

  const canSend = value.trim().length > 0;

  return (
    <div className="relative flex h-[195px] w-full flex-col justify-between rounded-[16px] bg-background-surface p-[24px] shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={measure}
        autoFocus={autoFocus}
        placeholder="Type your answer"
        aria-label="Type your answer"
        className="no-scrollbar min-h-0 flex-1 resize-none bg-transparent pr-3 font-display text-sm leading-5 tracking-wide text-text-primary placeholder:text-text-secondary focus:outline-none"
      />

      {thumb && (
        <div
          aria-hidden
          className="absolute right-[10px] w-2 rounded-full bg-interactive-disabled"
          style={{ top: 24 + thumb.top, height: thumb.height }}
        />
      )}

      <div className="flex w-full shrink-0 justify-end">
        <motion.button
          whileTap={canSend ? { scale: 0.9 } : undefined}
          transition={snappy}
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send answer"
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-brand-bold shadow-[inset_0px_-2px_0px_0px_rgba(0,0,0,0.15)] ${
            canSend ? "" : "opacity-50"
          }`}
        >
          <SendIcon className="h-5 w-5 text-text-primary" />
        </motion.button>
      </div>
    </div>
  );
}

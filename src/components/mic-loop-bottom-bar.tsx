"use client";

import { motion } from "motion/react";
import { BottomCta } from "@/components/bottom-cta";
import { IconButton } from "@/components/buttons";
import { KeyboardIcon, MicIcon, SkipForwardIcon } from "@/components/icons";
import { snappy } from "@/lib/motion";
import type { InputMode } from "@/lib/term-attempt-state";

/**
 * Skip icon-button + mode-switch pill, shared by every term's mic-loop
 * (previously duplicated per term as a local `BottomBar`). The pill's
 * copy/icon flips with `inputMode` — "I can't speak right now" (keyboard
 * icon) in voice mode, "Try with voice" (mic icon) in text mode — but the
 * component and its disabled/soft-gating behavior are identical either
 * way, so this is now the one shared implementation every term imports
 * rather than five hand-copied versions.
 *
 * Disabled only while a take is actively being captured or processed
 * (Recording, Sending, Checking) — active on Idle, Paused, Hearing back,
 * and while typing, so the student always has a way to change mode when
 * not mid-capture (CLAUDE.md's soft-gating rule).
 */
export function MicLoopBottomBar({
  disabled,
  onSkip,
  inputMode,
  onSwitchMode,
}: {
  disabled: boolean;
  onSkip: () => void;
  inputMode: InputMode;
  onSwitchMode: () => void;
}) {
  return (
    <BottomCta className="flex gap-2">
      <IconButton
        aria-label="Skip this term"
        variant="tertiary"
        disabled={disabled}
        onClick={onSkip}
      >
        <SkipForwardIcon
          className={`h-6 w-6 ${disabled ? "text-text-disabled" : "text-text-primary"}`}
        />
      </IconButton>
      <motion.button
        whileTap={disabled ? undefined : { scale: 0.94 }}
        transition={snappy}
        disabled={disabled}
        onClick={onSwitchMode}
        className={`relative flex h-[58px] min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-interactive-secondary px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)] ${
          disabled ? "text-text-disabled" : "text-text-primary"
        }`}
      >
        {inputMode === "voice" ? (
          <>
            <KeyboardIcon className="h-6 w-6 shrink-0" />
            <span className="overflow-hidden text-ellipsis whitespace-nowrap font-display text-[18px] font-bold">
              I can&apos;t speak right now
            </span>
          </>
        ) : (
          <>
            <MicIcon className="h-6 w-6 shrink-0" strokeWidth={1.5} />
            <span className="overflow-hidden text-ellipsis whitespace-nowrap font-display text-[18px] font-bold">
              Try with voice
            </span>
          </>
        )}
      </motion.button>
    </BottomCta>
  );
}

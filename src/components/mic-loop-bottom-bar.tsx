"use client";

import { motion } from "motion/react";
import { BottomCta } from "@/components/bottom-cta";
import { TextLinkButton } from "@/components/buttons";
import { snappy } from "@/lib/motion";
import type { InputMode } from "@/lib/term-attempt-state";

/**
 * Mode-switch pill + skip text link, shared by every term's mic-loop
 * (previously duplicated per term as a local `BottomBar`). The pill's
 * copy/icon flips with `inputMode` — "Type instead" (type_instead_icon.svg)
 * in voice mode, "Try with voice" (try_with_voice_icon.svg) in text mode —
 * but the component and its disabled/soft-gating behavior are identical
 * either way, so this is now the one shared implementation every term
 * imports rather than five hand-copied versions.
 *
 * Skip was an icon-only button until Module 5 testing (feedback.md [L]
 * "Skip must not read as exiting the whole session" — 3/5 testers
 * misread it as ending the entire session, not just the current term).
 * Now an explicit text link, styled like "Maybe later" and positioned the
 * same way (below the primary control, not beside it) — `skipLabel`
 * defaults to "Skip to next question" for every non-last term; term-5
 * (Cadence, the absolute last term) passes "Skip to summary" instead,
 * since there's no next term to name.
 *
 * Disabled only while a take is actively being captured or processed
 * (Recording, Sending, Checking) — active on Idle, Paused, Hearing back,
 * and while typing, so the student always has a way to change mode or skip
 * when not mid-capture (CLAUDE.md's soft-gating rule). The mode-switch
 * pill's icon is now a baked-color asset (not `currentColor`), so it can't
 * dim itself the way the old inline-SVG icon did — an opacity step stands
 * in for that on disabled instead.
 */
export function MicLoopBottomBar({
  disabled,
  onSkip,
  inputMode,
  onSwitchMode,
  skipLabel = "Skip to next question",
}: {
  disabled: boolean;
  onSkip: () => void;
  inputMode: InputMode;
  onSwitchMode: () => void;
  skipLabel?: string;
}) {
  return (
    <BottomCta className="flex flex-col gap-2">
      <motion.button
        whileTap={disabled ? undefined : { scale: 0.94 }}
        transition={snappy}
        disabled={disabled}
        onClick={onSwitchMode}
        className={`relative flex h-[58px] w-full items-center justify-center gap-2 rounded-full bg-interactive-secondary px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)] ${
          disabled ? "text-text-disabled" : "text-text-primary"
        }`}
      >
        {inputMode === "voice" ? (
          <>
            <img
              src="/images/type_instead_icon.svg"
              alt=""
              aria-hidden
              className={`h-6 w-6 shrink-0 ${disabled ? "opacity-40" : ""}`}
            />
            <span className="overflow-hidden text-ellipsis whitespace-nowrap font-display text-[18px] font-bold">
              Type instead
            </span>
          </>
        ) : (
          <>
            <img
              src="/images/try_with_voice_icon.svg"
              alt=""
              aria-hidden
              className={`h-6 w-6 shrink-0 ${disabled ? "opacity-40" : ""}`}
            />
            <span className="overflow-hidden text-ellipsis whitespace-nowrap font-display text-[18px] font-bold">
              Try with voice
            </span>
          </>
        )}
      </motion.button>
      <TextLinkButton
        className={`mx-auto ${disabled ? "!text-text-disabled" : ""}`}
        disabled={disabled}
        onClick={onSkip}
      >
        {skipLabel}
      </TextLinkButton>
    </BottomCta>
  );
}

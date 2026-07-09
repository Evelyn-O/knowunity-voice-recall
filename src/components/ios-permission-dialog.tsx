"use client";

import { AnimatePresence, motion } from "motion/react";
import { soft } from "@/lib/motion";

/**
 * Mocked native iOS mic-permission dialog (design.md: "System/OS-chrome
 * tokens", not app tokens). This is a visual replica only — we never call
 * getUserMedia or request real mic access (prototype-rules.md: no real
 * audio capture). Styled with the system font stack and iOS's "Action"
 * blue (#1C98F3), not Inter/Bricolage.
 *
 * Renders only the alert box itself — the caller owns the background
 * blur/scrim as a single group (see app/page.tsx), so this stays a plain
 * centered overlay with no backdrop of its own.
 */
export function IosPermissionDialog({
  open,
  onAllow,
  onDeny,
}: {
  open: boolean;
  onAllow: () => void;
  onDeny: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={soft}
            className="w-[270px] overflow-hidden rounded-2xl bg-[rgba(248,248,248,0.92)] font-[system-ui] text-black backdrop-blur-xl"
          >
            <div className="flex flex-col gap-1 p-4 text-center shadow-[inset_0px_-1px_0px_0px_rgba(0,0,0,0.15)]">
              <p className="text-[13px] font-semibold leading-5 tracking-tight">
                &ldquo;Knowunity&rdquo; would like to access the Microphone.
              </p>
              <p className="text-[11px] leading-4 tracking-tight">
                Your microphone will only be used while you&apos;re recording an
                answer.
              </p>
            </div>
            <div className="grid grid-cols-2">
              <button
                type="button"
                onClick={onDeny}
                className="border-r border-t border-black/15 py-2.5 text-[15px] text-[#1C98F3]"
              >
                Don&apos;t Allow
              </button>
              <button
                type="button"
                onClick={onAllow}
                className="border-t border-black/15 py-2.5 text-[15px] text-[#1C98F3]"
              >
                Allow
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

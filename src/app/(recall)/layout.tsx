"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { TopBar } from "@/components/top-bar";
import { MascotBubble } from "@/components/mascot-bubble";
import { ExitConfirmSheet } from "@/components/exit-confirm-sheet";
import {
  RecallChromeProvider,
  useCancelExit,
  useFillRemainingTermsAsSkipped,
  useRecallAttempted,
  useRecallChromeValue,
  useTermOutcomes,
} from "@/lib/recall-flow-context";
import { gentle } from "@/lib/motion";

/**
 * Persistent chrome for the whole Voice Recall flow: entry fork →
 * confidence tap → term screens → summary all render as {children} here.
 * TopBar lives here (not in individual screens) so it survives route
 * changes and animates from its previous width to its new one instead of
 * remounting at a snapped value (see recall-flow-context.tsx).
 *
 * MascotBubble follows the same pattern: it renders once here, driven by
 * the `mascot` context value a screen sets via useMascotBubble, instead of
 * each screen mounting its own instance. That's what lets its pose/text
 * crossfade smoothly across a route change (e.g. confidence → term-1)
 * instead of the old block unmounting and a new one snapping in.
 *
 * Only the TopBar wrapper gets the `chromeBlurred` filter here — {children}
 * is a sibling, not a descendant, of that wrapper. A screen's own
 * scrim/dialog (e.g. the entry screen's mic-permission primer) render as
 * later siblings within {children} too, so `absolute inset-0` on them
 * still resolves against this outer relative box (covering TopBar +
 * content as one visual group) without also being blurred themselves —
 * see (recall)/page.tsx.
 *
 * TopBar (and its safe-area padding wrapper) only renders when
 * `currentStep` isn't null — every summary-path screen (/streak,
 * /recall-summary, /summary) already registers `currentStep: null` (it
 * was previously only used to hide the progress bar, per useRecallStep's
 * own doc comment), so this single check is what fully removes the exit X
 * + streak chip from all of them without touching any real term/recall
 * screen, which always registers a real step number.
 *
 * `ExitConfirmSheet` renders once here too, same reasoning as TopBar/
 * MascotBubble: every screen's onExit is now just `requestExit` (opens
 * `exitConfirmOpen`), and this is the ONE place that decides the sheet's
 * variant and performs the actual "Leave" routing — see
 * recall-flow-context.tsx's own doc comment for exitConfirmOpen. Its blur
 * wraps TopBar + MascotBubble + {children} together as one group (a new
 * wrapper one level up from the `chromeBlurred` one, which only ever
 * covered TopBar) — the same "blur the whole chrome behind a modal"
 * treatment the mic-permission primer already established, just scoped
 * one level wider since this modal can be triggered from ANY screen, not
 * just one.
 */
function RecallChrome({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentStep, totalSteps, onExit, chromeBlurred, mascot, exitConfirmOpen } =
    useRecallChromeValue();
  const cancelExit = useCancelExit();
  const recallAttempted = useRecallAttempted();
  const termOutcomes = useTermOutcomes();
  const fillRemainingTermsAsSkipped = useFillRemainingTermsAsSkipped();

  // Same "did the recall step ever get engaged" signal the summary flow
  // already uses (a real attempt, or an explicit skip) — this single
  // boolean both picks the sheet's copy variant and decides whether
  // "Leave" needs to backfill unreached terms before routing away.
  const hasInteracted = recallAttempted || Object.keys(termOutcomes).length > 0;

  function handleLeave() {
    if (hasInteracted) {
      fillRemainingTermsAsSkipped();
    }
    cancelExit();
    router.push("/streak");
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className={`flex min-h-0 flex-1 flex-col transition-[filter] duration-[180ms] ease-out ${
          exitConfirmOpen ? "blur-[10px]" : ""
        }`}
      >
        {currentStep !== null && (
          <div
            className={`transition-[filter] duration-[180ms] ease-out ${
              chromeBlurred ? "blur-[10px]" : ""
            }`}
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <TopBar
              currentStep={currentStep}
              totalSteps={totalSteps}
              streak={2}
              onExit={onExit}
            />
          </div>
        )}
        {/* AnimatePresence here covers the block's own mount/unmount — e.g.
            entry (no mascot) → confidence (mascot appears) — which previously
            popped in/out at full opacity with zero animation. Pose/text
            crossfades *within* an already-mounted block are handled inside
            MascotBubble itself; this only smooths the block appearing or
            disappearing as a whole. */}
        <AnimatePresence>
          {mascot && (
            <motion.div
              key="mascot-bubble"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={gentle}
              className="px-4 pt-6"
            >
              <MascotBubble
                pose={mascot.pose}
                alt={mascot.alt}
                text={mascot.text}
                dimmed={mascot.dimmed}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {children}
      </div>

      <ExitConfirmSheet
        open={exitConfirmOpen}
        variant={hasInteracted ? "in-progress" : "first-time"}
        onKeepLearning={cancelExit}
        onLeave={handleLeave}
      />
    </div>
  );
}

export default function RecallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RecallChromeProvider>
      <RecallChrome>{children}</RecallChrome>
    </RecallChromeProvider>
  );
}

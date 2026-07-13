"use client";

import { useRouter, usePathname } from "next/navigation";
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
import { gentle, soft } from "@/lib/motion";

/** Matches any term-loop route — used by getMotionKey below to detect
 * "term-to-term advancement", the one screen-to-screen transition this
 * task's own brief says must stay exactly instant (no slide). */
const isTermRoute = (path: string | null) => !!path && /^\/term-\d/.test(path);

/** All term routes collapse onto one shared AnimatePresence key. This means
 * term-to-term navigation (term-1 -> term-2 etc.) never triggers a
 * key-change exit/enter at all — the wrapping motion.div simply never
 * unmounts, so content swaps instantly via ordinary React reconciliation,
 * with no animation and (critically) no exit-animation-completion tracking
 * to rely on. Real screen-to-screen transitions still key by their own
 * pathname and get the full slide.
 *
 * This replaces an earlier approach that kept pathname as the key everywhere
 * and suppressed the animation for term-to-term hops via
 * `transition: { duration: 0 }` with an exit target equal to the current
 * value. That approach leaked: Motion's AnimatePresence only prunes an
 * exited child once its exit animation's promise resolves, and a same-value
 * zero-duration "animation" never reliably resolves that promise — so the
 * old screen was never removed from AnimatePresence's internal rendered-
 * children list. Worse, every following exit gets stuck behind it (the list
 * is only flushed once *every* tracked exit completes), so consecutive
 * term hops accumulated stale, fully-opaque, identically-positioned screens
 * in the DOM (invisible per-hop since they exactly overlapped the new
 * screen, but confirmed via document.querySelectorAll — repeated
 * "Try again" loops made this an unbounded leak). A stable key sidesteps
 * the whole exit-completion mechanism for this case instead of trying to
 * make it complete reliably. */
const getMotionKey = (path: string | null) => (isTermRoute(path) ? "term-loop" : path);

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
  const pathname = usePathname();
  const { currentStep, totalSteps, onExit, chromeBlurred, mascot, exitConfirmOpen } =
    useRecallChromeValue();
  const cancelExit = useCancelExit();
  const recallAttempted = useRecallAttempted();
  const termOutcomes = useTermOutcomes();
  const fillRemainingTermsAsSkipped = useFillRemainingTermsAsSkipped();

  // motion-guide.md's own "Screen-to-screen" recipe ("push transitions
  // slide in from the right"), applied at the route level. Term-to-term
  // advancement (term-1 → term-2 etc.) is excluded per this task's own
  // scope: that's a content change within the same mic loop, not a screen
  // transition — see getMotionKey's own doc comment above for how that's
  // achieved (a shared key, not a suppressed animation) and why.
  const motionKey = getMotionKey(pathname);

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
        {/* mode="popLayout" — without it, this is the one AnimatePresence
            in the app that left the exiting bubble in normal document
            flow alongside the entering one, so both briefly stacked and
            pushed the mic UI below down, then snapped back up once the
            old one unmounted (confirmed via document.getAnimations() at
            the moment of a term-to-term hop: the exit+enter opacity
            animations genuinely overlap in time). popLayout pulls the
            exiting element out of flow (position: absolute) the instant
            it starts exiting, matching every other AnimatePresence in
            this codebase (mascot-bubble.tsx's own two, and the main
            content's own AnimatePresence right below this one). */}
        <AnimatePresence mode="popLayout">
          {mascot && (
            <motion.div
              // Keyed by pathname, not a static string — this makes the
              // block fully remount (a plain opacity crossfade, via this
              // AnimatePresence) on every route change, INCLUDING
              // term-to-term hops (each term route has a distinct
              // pathname even though the main content's own motionKey
              // collapses them — see getMotionKey above). Previously this
              // used a single static key, so pose/text/dimmed all
              // crossfaded in place via MascotBubble's own internal
              // layout-FLIP resize — smooth for a single prop changing,
              // but term-to-term changes pose+text+dimmed all at once
              // (Result's dimmed bubble -> next term's fresh prompt),
              // which visibly glitched (a brief height jump as the FLIP
              // and the nested pose/text AnimatePresences fought for the
              // same frame). A hard remount + simple fade sidesteps that
              // entirely: "a simple animation from one term to another,"
              // per this task's own ask. Pose/text crossfades WITHIN one
              // term's own stage progression (pathname unchanged) still
              // go through MascotBubble's own smooth internal handling,
              // untouched.
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={motionKey}
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={soft}
            className="flex min-h-0 flex-1 flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
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

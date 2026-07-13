"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BottomCta } from "@/components/bottom-cta";
import { HighlightCard } from "@/components/highlight-card";
import { PrimaryButton, SelectableButton, TextLinkButton } from "@/components/buttons";
import {
  COMBINED_TOTAL_STEPS,
  CONFIDENCE_OPTIONS as OPTIONS,
  CONFIDENCE_STEP,
  confidenceLevelForOption,
  useMascotBubble,
  useRecallStep,
  useRequestExit,
  useSetConfidenceLevel,
} from "@/lib/recall-flow-context";
import { useScrollThumb } from "@/lib/use-scroll-thumb";
import { ScrollThumbIndicator } from "@/components/scroll-thumb-indicator";

const DEFAULT_PROMPT =
  "We’re about to test what you’ve learned in your own words, before we get started, how confident do you feel?";
const SELECTED_PROMPT = "Let’s find out!";

/**
 * Merged entry + confidence tap for a RETURNING/recurring student
 * (SPEC.md §2B; Figma nodes 13900:24834 unselected / 13900:25674
 * selected). No mic-permission primer step here at all — SPEC.md: a
 * returning student is assumed already granted, so this goes straight
 * from mount to the confidence question. This is the only entry point
 * into term-1 for a returning session.
 *
 * Reached exclusively via "Try again" on /recall-summary or /summary
 * (full variant) — both already call resetRecallSession() right before
 * navigating here (recall-flow-context.tsx), so this screen assumes a
 * clean termOutcomes and never resets anything itself.
 *
 * Unlike the first-time entry screen, the mascot+bubble here uses the
 * shared SMALL avatar+bubble row (useMascotBubble, rendered once by the
 * layout) — the same mechanism (recall)/confidence/page.tsx already uses
 * — not the big hero-mascot treatment. Pose/text crossfade in place when
 * an option is picked, same as confidence/page.tsx; no screen jump.
 */
export default function ConfidenceRecurringPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<(typeof OPTIONS)[number] | null>(
    null
  );

  // X (TopBar) and "Maybe later" both now open the shared exit-confirm
  // sheet instead of navigating directly — its "Leave" (owned by
  // (recall)/layout.tsx) is what actually routes to /streak.
  const requestExit = useRequestExit();
  const setConfidenceLevel = useSetConfidenceLevel();
  const { ref: scrollRef, thumb, measure } = useScrollThumb<HTMLDivElement>();

  // Reuses CONFIDENCE_STEP's own slot rather than getting a new one — a
  // returning student never sees /entry, so the bar deliberately jumps
  // straight from the quiz's step to this one (skipping ENTRY_STEP)
  // instead of shrinking COMBINED_TOTAL_STEPS just for this session type.
  useRecallStep({ currentStep: CONFIDENCE_STEP, totalSteps: COMBINED_TOTAL_STEPS, onExit: requestExit });
  useMascotBubble({
    pose: selected ? "giggling" : "cool",
    alt: selected ? "Noe giggling" : "Noe, wearing sunglasses and a cap",
    text: selected ? SELECTED_PROMPT : DEFAULT_PROMPT,
  });

  function handleLetsGo() {
    // Continue is disabled until `selected` is set — the assertion just
    // satisfies TypeScript, this branch can't fire with it still null.
    setConfidenceLevel(confidenceLevelForOption(selected!));
    router.push("/term-1");
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={measure}
        className="no-scrollbar flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-4 pt-2"
      >
        <div className="flex w-full flex-col items-center gap-5">
          <HighlightCard eyebrow="Picture this:" variant="definition">
            You&apos;re teaching a friend who missed class, 4 terms for the
            exam.
          </HighlightCard>

          <div className="flex w-full flex-col gap-3">
            {OPTIONS.map((option) => (
              <SelectableButton
                key={option}
                selected={selected === option}
                onClick={() => setSelected(option)}
              >
                {option}
              </SelectableButton>
            ))}
          </div>
        </div>
      </div>
      <ScrollThumbIndicator thumb={thumb} />

      {/* Skip icon-button + "Type instead" link removed per feedback.md —
          matches the first-encounter fork's own "Let's go!" + "Maybe
          later" shape now (same functionality as the entry screen's
          "Maybe later": the clean, no-penalty exit already locked at
          spec §5.1, via the shared exit-confirm sheet). A returning
          student who wants to type instead gets there from term-1's own
          idle screen, whose mode-switch pill already offers "Type
          instead" — not gone, just one screen later. */}
      <BottomCta className="flex flex-col gap-2">
        <PrimaryButton disabled={!selected} onClick={handleLetsGo}>
          Let&apos;s go!
        </PrimaryButton>
        <TextLinkButton className="mx-auto" onClick={requestExit}>
          Maybe later
        </TextLinkButton>
      </BottomCta>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BottomCta } from "@/components/bottom-cta";
import { HighlightCard } from "@/components/highlight-card";
import {
  IconButton,
  PrimaryButton,
  SelectableButton,
  TextLinkButton,
} from "@/components/buttons";
import { SkipForwardIcon } from "@/components/icons";
import {
  useMascotBubble,
  useRecallStep,
  useRequestExit,
  useSetTermInTextModeRequested,
} from "@/lib/recall-flow-context";

const OPTIONS = [
  "Very confident!",
  "Somewhat, I think I got it",
  "So so, but I’m gonna try",
] as const;

const DEFAULT_PROMPT =
  "How confident do you feel to test your knowledge saying it out loud?";
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

  // X and the skip-forward icon both now open the shared exit-confirm
  // sheet instead of navigating directly — its "Leave" (owned by
  // (recall)/layout.tsx) is what actually routes to /streak.
  const requestExit = useRequestExit();
  const setTermInTextModeRequested = useSetTermInTextModeRequested();

  useRecallStep({ currentStep: 2, totalSteps: 6, onExit: requestExit });
  useMascotBubble({
    pose: selected ? "giggling" : "cool",
    alt: selected ? "Noe giggling" : "Noe, wearing sunglasses and a cap",
    text: selected ? SELECTED_PROMPT : DEFAULT_PROMPT,
  });

  // SPEC.md §2B: this merged screen has no term-level attempt state of its
  // own — Type instead just needs to carry "start in text mode" forward
  // into term-1 (the only entry point into the term loop from here), same
  // as the first-encounter fork's Type-instead/Don't-Allow branches do via
  // micPermissionGranted. Deliberately doesn't touch micPermissionGranted
  // itself, so a returning student who already granted mic access can
  // still switch back to voice from term-1 with no re-prompt.
  function handleTypeInstead() {
    setTermInTextModeRequested(true);
    router.push("/term-1");
  }

  function handleLetsGo() {
    router.push("/term-1");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-4 pt-2">
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

      <BottomCta className="flex flex-col gap-2">
        <div className="flex gap-2">
          <IconButton aria-label="Skip this session" onClick={requestExit}>
            <SkipForwardIcon className="h-6 w-6 text-text-primary" />
          </IconButton>
          <PrimaryButton
            disabled={!selected}
            onClick={handleLetsGo}
            className="flex-1"
          >
            Let&apos;s go!
          </PrimaryButton>
        </div>
        <TextLinkButton className="mx-auto" onClick={handleTypeInstead}>
          Type instead
        </TextLinkButton>
      </BottomCta>
    </div>
  );
}

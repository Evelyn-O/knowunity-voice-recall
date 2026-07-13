"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BottomCta } from "@/components/bottom-cta";
import { PrimaryButton, SelectableButton } from "@/components/buttons";
import {
  COMBINED_TOTAL_STEPS,
  CONFIDENCE_STEP,
  useMascotBubble,
  useRecallStep,
  useRequestExit,
} from "@/lib/recall-flow-context";

const OPTIONS = [
  "Very confident!",
  "Somewhat, I think I got it",
  "So so, but I’m gonna try",
] as const;

const DEFAULT_PROMPT =
  "We’re about to test what you’ve learned in your own words, before we get started, how confident do you feel?";
const SELECTED_PROMPT = "Let’s find out!";

/**
 * Confidence tap — first encounter (SPEC.md §2A; Figma nodes 13900:24794
 * unselected / 13900:25634 selected). Fires once at session start; picking
 * an option is what unlocks Continue, per sprint-context.md's rule that
 * this can't be skipped or merged into the entry fork.
 */
function ConfidenceScreen() {
  const router = useRouter();
  const mode = useSearchParams().get("mode") ?? "voice";
  const [selected, setSelected] = useState<(typeof OPTIONS)[number] | null>(
    null
  );

  const requestExit = useRequestExit();

  useRecallStep({ currentStep: CONFIDENCE_STEP, totalSteps: COMBINED_TOTAL_STEPS, onExit: requestExit });
  useMascotBubble({
    pose: selected ? "giggling" : "standby",
    alt: selected ? "Noe giggling" : "Noe, calm and attentive",
    text: selected ? SELECTED_PROMPT : DEFAULT_PROMPT,
  });

  function handleContinue() {
    router.push(`/term-1?mode=${mode}`);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4">
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
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

      <BottomCta>
        <PrimaryButton disabled={!selected} onClick={handleContinue}>
          Continue
        </PrimaryButton>
      </BottomCta>
    </div>
  );
}

export default function ConfidencePage() {
  return (
    <Suspense>
      <ConfidenceScreen />
    </Suspense>
  );
}

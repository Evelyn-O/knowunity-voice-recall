"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { motion } from "motion/react";
import { BottomCta } from "@/components/bottom-cta";
import { PrimaryButton, TextLinkButton } from "@/components/buttons";
import { ExitConfirmSheet } from "@/components/exit-confirm-sheet";
import { ThumbsDownIcon, ThumbsUpIcon } from "@/components/icons";
import { WhyExplanation } from "@/components/why-explanation";
import {
  COMBINED_TOTAL_STEPS,
  QUIZ_TOTAL_QUESTIONS,
  getEntryForkRoute,
  useMascotBubble,
  useRecallStep,
  useTermOutcomes,
} from "@/lib/recall-flow-context";
import { gentle, sheet, snappy } from "@/lib/motion";

const QUESTION =
  "A standard major triad consists of a root, a major third, and a perfect fifth.";
const CORRECT_REPLY = "Nice!";
const INCORRECT_REPLY = "Maybe next time!";
const WHY_EXPLANATION =
  "This specific combination creates a perfectly balanced chord, blending three stable tones that sound highly pleasing and harmonious together.";

type Answer = "true" | "false";
type Stage = "idle" | "review";

/**
 * The mocked pre-step quiz question — the last question of the exam
 * plan's quiz, shown right before the Voice Recall entry fork (Figma
 * nodes: idle 13954:10374, selected 13954:10484, correct review
 * 13900:24733, incorrect review 14030:17584). Explicitly a single mocked
 * question, not a full quiz — see CLAUDE.md/this task's own scope note.
 *
 * "True" is the factually correct answer to this question, so correctness
 * is real boolean evaluation (selectedAnswer === "true"), not a scripted
 * per-attempt outcome like the Voice Recall terms use — there's only one
 * attempt here, so there's nothing to script per-attempt.
 *
 * Reuses the exact TopBar/MascotBubble/BottomCta machinery the Voice
 * Recall screens already use (this screen's Figma frames are visually
 * identical to them). This is question 10 of 10 in the combined
 * quiz+recall progress bar (recall-flow-context.tsx's
 * QUIZ_TOTAL_QUESTIONS/COMBINED_TOTAL_STEPS) — the bar continues into
 * Voice Recall from here rather than resetting at the fork. X opens a local
 * "pre-step" ExitConfirmSheet (Figma node 14033:4400) rather than the
 * shared layout-level exitConfirmOpen every VR screen's X uses — "Leave"
 * here goes to `/` (the exam-plan path view, now the app's root — see
 * (recall)/page.tsx's own doc comment), not /streak, so it's local
 * boolean-overlay state, same pattern SkipConfirmSheet already
 * establishes elsewhere.
 */
export default function QuizPage() {
  const router = useRouter();
  const termOutcomes = useTermOutcomes();
  const [stage, setStage] = useState<Stage>("idle");
  const [selected, setSelected] = useState<Answer | null>(null);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  // X no longer exits immediately (Figma node 14033:4400) — opens a local
  // confirm sheet instead. "Leave" (the sheet's own onLeave) is what
  // actually routes to /path; "Keep learning" just closes the sheet, same
  // boolean-overlay pattern SkipConfirmSheet already uses elsewhere (the
  // underlying quiz stage/selection never changes while it's open).
  const onExit = useCallback(() => setExitConfirmOpen(true), []);
  useRecallStep({ currentStep: QUIZ_TOTAL_QUESTIONS, totalSteps: COMBINED_TOTAL_STEPS, onExit });
  useMascotBubble({ pose: "standby", alt: "Noe", text: QUESTION, dimmed: stage === "review" });

  function goToEntryFork() {
    router.push(getEntryForkRoute(termOutcomes));
  }

  function skipToNextQuestion() {
    goToEntryFork();
  }

  function checkAnswer() {
    setStage("review");
  }

  const isCorrect = selected === "true";

  function pillClass(answer: Answer) {
    if (stage === "idle") {
      return selected === answer
        ? "bg-brand-subtle text-brand-bold"
        : "bg-background-surface text-text-primary";
    }
    // Review: only the option the student picked gets colored — the
    // unselected option always stays neutral, matching both Figma review
    // frames (the correct-but-unpicked option is never highlighted).
    if (selected !== answer) return "bg-background-surface text-text-primary";
    return isCorrect ? "bg-feedback-success-subtle text-feedback-success-on-subtle" : "bg-coral-subtle text-coral-on-subtle";
  }

  if (stage === "review") {
    return (
      <div className="relative flex flex-1 flex-col px-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={gentle}
          className="flex flex-1 flex-col items-center justify-center gap-3"
        >
          {/* Same w-full + flex-1/max-w fix as the idle stage's identical
              button row — see that block's own comment. */}
          <div className="flex w-full gap-3">
            <button
              type="button"
              disabled
              className={`relative flex h-[83px] flex-1 max-w-[179px] items-center justify-center rounded-[24px] px-5 py-7 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)] ${pillClass("true")}`}
            >
              <span className="font-display text-[18px] font-medium tracking-[0.18px]">True</span>
            </button>
            <button
              type="button"
              disabled
              className={`relative flex h-[83px] flex-1 max-w-[179px] items-center justify-center rounded-[24px] px-5 py-7 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)] ${pillClass("false")}`}
            >
              <span className="font-display text-[18px] font-medium tracking-[0.18px]">False</span>
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={sheet}
          className={`absolute inset-x-0 bottom-0 z-20 rounded-t-[32px] border-t border-border-default ${
            isCorrect ? "bg-feedback-success-subtle" : "bg-coral-subtle"
          }`}
        >
          <div className="mx-auto mt-2 h-1 w-8 rounded-full bg-background-stacking" />
          <div className="flex items-center gap-2 px-7 pt-3">
            <img
              src={isCorrect ? "/images/correct-answer-icon.svg" : "/images/incorrect-answer-icon.svg"}
              alt=""
              aria-hidden
              className="h-8 w-8 shrink-0"
            />
            <p
              className={`flex-1 font-display text-[26px] font-black ${
                isCorrect ? "text-feedback-success-on-subtle" : "text-coral-bold"
              }`}
            >
              {isCorrect ? CORRECT_REPLY : INCORRECT_REPLY}
            </p>
            <button aria-label="Dislike this reply">
              <ThumbsDownIcon className="h-6 w-6 text-text-primary" />
            </button>
            <button aria-label="Like this reply">
              <ThumbsUpIcon className="h-6 w-6 text-text-primary" />
            </button>
          </div>
          {showWhy && (
            <div className="px-7 pt-3">
              <WhyExplanation variant={isCorrect ? "correct" : "incorrect"}>
                {WHY_EXPLANATION}
              </WhyExplanation>
            </div>
          )}
          <BottomCta className="flex gap-1">
            {/* "Why?" reveals a static explanation card below — still not
                open Q&A/tutoring (Non-Goal #1): it's one fixed line tied to
                this question, not a free-form answer to a student prompt. */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              transition={snappy}
              onClick={() => setShowWhy((v) => !v)}
              className="relative flex h-[58px] items-center justify-center rounded-full bg-interactive-secondary px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]"
            >
              <span className="font-display text-[18px] font-semibold text-interactive-on-secondary">
                Why?
              </span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.94 }}
              transition={snappy}
              onClick={goToEntryFork}
              className={`relative flex h-[58px] flex-1 items-center justify-center rounded-full px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)] ${
                isCorrect ? "bg-green-bold" : "bg-coral-bold"
              }`}
            >
              <span
                className={`font-display text-[18px] font-semibold ${
                  isCorrect ? "text-green-on-bold" : "text-coral-on-bold"
                }`}
              >
                Continue
              </span>
            </motion.button>
          </BottomCta>
        </motion.div>

        <ExitConfirmSheet
          open={exitConfirmOpen}
          variant="pre-step"
          onKeepLearning={() => setExitConfirmOpen(false)}
          onLeave={() => router.push("/")}
        />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
        {/* w-full + flex-1/max-w on the buttons (not a fixed w-[179px] each)
            — at Figma's own 404.28px canvas width this caps out to the
            exact same 179.333px buttons, but a fixed pixel width on a
            narrower real device (the two buttons + gap, 370px, wider than
            a real ~375px phone's padded content area) overflowed past this
            container's own px-4, eating into the padding down to ~2.5px a
            side instead of Figma's 16.586px. flex-1 lets the buttons
            shrink together on narrower viewports so the edge padding stays
            correct instead of being eaten by overflow. */}
        <div className="flex w-full gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            transition={snappy}
            onClick={() => setSelected("true")}
            className={`relative flex h-[83px] flex-1 max-w-[179px] items-center justify-center rounded-[24px] px-5 py-7 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)] ${pillClass("true")}`}
          >
            <span className="font-display text-[18px] font-medium tracking-[0.18px]">True</span>
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            transition={snappy}
            onClick={() => setSelected("false")}
            className={`relative flex h-[83px] flex-1 max-w-[179px] items-center justify-center rounded-[24px] px-5 py-7 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)] ${pillClass("false")}`}
          >
            <span className="font-display text-[18px] font-medium tracking-[0.18px]">False</span>
          </motion.button>
        </div>
      </div>

      <BottomCta className="flex flex-col gap-2">
        <PrimaryButton onClick={checkAnswer} disabled={selected === null}>
          Check
        </PrimaryButton>
        <TextLinkButton className="mx-auto" onClick={skipToNextQuestion}>
          Skip to next question
        </TextLinkButton>
      </BottomCta>

      <ExitConfirmSheet
        open={exitConfirmOpen}
        variant="pre-step"
        onKeepLearning={() => setExitConfirmOpen(false)}
        onLeave={() => router.push("/")}
      />
    </div>
  );
}

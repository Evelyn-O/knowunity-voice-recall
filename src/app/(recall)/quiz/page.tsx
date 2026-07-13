"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { motion } from "motion/react";
import { BottomCta } from "@/components/bottom-cta";
import { PrimaryButton, TextLinkButton } from "@/components/buttons";
import { ExitConfirmSheet } from "@/components/exit-confirm-sheet";
import { ThumbsDownIcon, ThumbsUpIcon } from "@/components/icons";
import {
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
 * identical to them), but with its own step numbers (this quiz's own
 * progress, unrelated to the recall flow's 1-6). X opens a local
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

  // X no longer exits immediately (Figma node 14033:4400) — opens a local
  // confirm sheet instead. "Leave" (the sheet's own onLeave) is what
  // actually routes to /path; "Keep learning" just closes the sheet, same
  // boolean-overlay pattern SkipConfirmSheet already uses elsewhere (the
  // underlying quiz stage/selection never changes while it's open).
  const onExit = useCallback(() => setExitConfirmOpen(true), []);
  useRecallStep({ currentStep: 3, totalSteps: 4, onExit });
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
          <div className="flex gap-3">
            <button
              type="button"
              disabled
              className={`relative flex h-[83px] w-[179px] items-center justify-center rounded-[24px] px-5 py-7 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)] ${pillClass("true")}`}
            >
              <span className="font-display text-[18px] font-medium tracking-[0.18px]">True</span>
            </button>
            <button
              type="button"
              disabled
              className={`relative flex h-[83px] w-[179px] items-center justify-center rounded-[24px] px-5 py-7 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)] ${pillClass("false")}`}
            >
              <span className="font-display text-[18px] font-medium tracking-[0.18px]">False</span>
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={sheet}
          className={`absolute inset-x-0 bottom-0 rounded-t-[32px] border-t border-border-default ${
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
          <BottomCta className="flex gap-1">
            {/* Stub — "Why?" is Non-Goal #1 (open Q&A), Harry sign-off
                pending, same as every other Result-style sheet in this app. */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              transition={snappy}
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
        <div className="flex gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            transition={snappy}
            onClick={() => setSelected("true")}
            className={`relative flex h-[83px] w-[179px] items-center justify-center rounded-[24px] px-5 py-7 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)] ${pillClass("true")}`}
          >
            <span className="font-display text-[18px] font-medium tracking-[0.18px]">True</span>
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            transition={snappy}
            onClick={() => setSelected("false")}
            className={`relative flex h-[83px] w-[179px] items-center justify-center rounded-[24px] px-5 py-7 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)] ${pillClass("false")}`}
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

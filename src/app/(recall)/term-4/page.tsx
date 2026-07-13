"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { MascotBubble } from "@/components/mascot-bubble";
import { CheckingItIcon } from "@/components/checking-it-icon";
import { BottomCta } from "@/components/bottom-cta";
import { HighlightCard } from "@/components/highlight-card";
import { MicLoopBottomBar } from "@/components/mic-loop-bottom-bar";
import { TextFallbackBody } from "@/components/text-fallback-body";
import { SkipConfirmSheet } from "@/components/skip-confirm-sheet";
import { IosPermissionDialog } from "@/components/ios-permission-dialog";
import { ReactionButtons } from "@/components/reaction-buttons";
import { WhyExplanation } from "@/components/why-explanation";
import {
  LoadingSpinnerIcon,
  MicIcon,
  PauseIcon,
  PlayIcon,
  SendIcon,
  TrashIcon,
} from "@/components/icons";
import {
  COMBINED_TOTAL_STEPS,
  TERM_STEP,
  useLastInputMode,
  useMascotBubble,
  useMicPermissionGranted,
  useRecallChromeBlur,
  useRecallStep,
  useRecordRecallAttempted,
  useRecordTermOutcome,
  useRecordVoiceUsed,
  useRequestExit,
  useSetLastInputMode,
  useSetMicPermissionGranted,
  useTermOutcomes,
} from "@/lib/recall-flow-context";
import { useTermAttemptState } from "@/lib/term-attempt-state";
import { gentle, sheet, snappy } from "@/lib/motion";
import { useScrollThumb } from "@/lib/use-scroll-thumb";
import { ScrollThumbIndicator } from "@/components/scroll-thumb-indicator";

const PROMPT = "We are very close! What's syncopation?";
// Authored, not sourced: SPEC.md §4 Term 4 flags that no result/hint
// content exists for Syncopation since its committed demo script is
// "skipped, never attempted" — this task's own brief only covers the skip
// path too. This line only ever renders if a tester answers instead of
// skipping (an edge case, not the demo path), so it stays simple and
// mirrors term-1's single unaided-pass reply pattern rather than
// inventing a hint/wrong ladder nothing asked for.
const ANSWER =
  "Exactly! Syncopation is accenting a beat you don't expect, throwing off the regular rhythm.";
// Authored, not sourced — same reasoning as ANSWER above: this term's
// script never actually reaches a voice result (its demo path is skip),
// so no scripted transcript exists to reuse. Only renders if a tester
// answers by voice instead of skipping.
const WHAT_I_HEARD =
  "Syncopation is when the beat lands somewhere you don't expect it to.";
// Sourced from Evelyn directly for this term's "Why?" explanation box —
// not a Figma-mockup placeholder like term-1/term-3's, but the same
// "correct" (green) variant treatment.
const WHY_EXPLANATION =
  "By shifting the accent to weak beats or the spaces between beats, it creates an instant moment of musical tension and surprise.";

/** Max height (px) per bar — the base silhouette; live/replayed levels
 * (0..1) scale each bar down from this via `transform: scaleY`, never by
 * animating `height` directly (motion-guide.md). */
const WAVEFORM_HEIGHTS = [35, 28, 44, 44, 28, 44, 20];
const BAR_COUNT = WAVEFORM_HEIGHTS.length;
const IDLE_LEVELS = WAVEFORM_HEIGHTS.map(() => 0.15);
const FULL_LEVELS = WAVEFORM_HEIGHTS.map(() => 1);

type Stage =
  | "idle"
  | "recording"
  | "paused"
  | "hearing-back"
  | "sending"
  | "checking"
  | "result";

/** Mascot pose per moment — unchanged from term-1's mapping. */
const MASCOT_POSE: Record<Exclude<Stage, "result">, string> = {
  idle: "thinking-less-judge",
  recording: "listening",
  paused: "excited",
  "hearing-back": "standby",
  sending: "happy",
  checking: "listening",
};

function formatTimer(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Averages a Web Audio frequency-data array into BAR_COUNT levels
 * (0..1), sqrt-curved so quiet input still reads as visible motion. */
function sampleBars(data: Uint8Array): number[] {
  const chunk = Math.max(1, Math.floor(data.length / BAR_COUNT));
  const levels: number[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    let sum = 0;
    for (let j = 0; j < chunk; j++) sum += data[i * chunk + j] ?? 0;
    const avg = sum / chunk / 255;
    levels.push(Math.max(0.12, Math.min(1, Math.sqrt(avg))));
  }
  return levels;
}

/**
 * Live/replayed 7-bar waveform — each bar holds a fixed max height
 * (WAVEFORM_HEIGHTS) and is scaled by a live `levels[i]` (0..1) via
 * `transform: scaleY`, smoothed with a short CSS transition. Plain divs
 * rather than the Motion library here: `levels` updates at animation-
 * frame rate from real audio data, and driving that many Motion
 * `animate` calls per frame is unnecessary overhead for what's really a
 * live data readout, not a discrete state transition.
 */
function LiveWaveform({
  colorClassName,
  levels,
}: {
  colorClassName: string;
  levels: number[];
}) {
  return (
    <div className="flex items-center gap-1">
      {WAVEFORM_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className={`w-[6px] origin-center rounded-full transition-transform duration-75 ease-out ${colorClassName}`}
          style={{ height: h, transform: `scaleY(${levels[i] ?? 0.15})` }}
        />
      ))}
    </div>
  );
}

/** Scripted fallback waveform (the original build's loop) — used only
 * when live mic data isn't available: permission denied, or Hearing-back
 * with nothing captured yet to replay. Keeps the prototype demoable even
 * without mic access. */
function ScriptedWaveform({
  colorClassName,
  animated,
}: {
  colorClassName: string;
  animated: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {WAVEFORM_HEIGHTS.map((h, i) => (
        <motion.div
          key={i}
          className={`w-[6px] rounded-full ${colorClassName}`}
          style={{ height: h }}
          animate={animated ? { scaleY: [0.5, 1, 0.5] } : { scaleY: 1 }}
          transition={
            animated
              ? { duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }
              : { duration: 0.2 }
          }
        />
      ))}
    </div>
  );
}

/** The smaller 40px icon button beside the mic in Recording/Paused/
 * Hearing-back (delete, send) — distinct from the 58px bottomCta
 * IconButton, so hand-rolled locally rather than adding a size prop to
 * that shared component for a single-screen need. */
function MicControlButton({
  onClick,
  ariaLabel,
  bgClassName = "bg-background-surface",
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  bgClassName?: string;
  children: ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      transition={snappy}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bgClassName} shadow-[inset_0px_-2px_0px_0px_rgba(0,0,0,0.15)]`}
    >
      {children}
    </motion.button>
  );
}

/**
 * Term 4 (Syncopation) — the last of the 4 base terms. Same mocked mic
 * state machine as term-1 (no wrong/hint ladder — SPEC.md's own script for
 * this term is "skipped, never attempted", and this task's brief is about
 * the skip-confirmation flow, not a new outcome ladder), extended with:
 *
 * - A real skip-confirmation sheet (SkipConfirmSheet, "last-term" variant
 *   — "Maybe next time!" — since this is the last BASE term) instead of
 *   skip navigating immediately.
 * - The end-of-base-terms routing decision: once this term resolves
 *   (skipped or completed), check whether terms 1–3 were ALL unaided
 *   passes (a perfect lesson). If so AND this term is also unaided-or-
 *   skipped, go straight to /summary. Otherwise go to /term-5 ("One more
 *   before we wrap up" → Cadence). This task's own note: skipping this
 *   term after an otherwise-perfect 1–3 does NOT trigger "one more" — the
 *   only imperfect thing in that case would be the skip itself, so
 *   immediately re-asking the exact term just skipped would defeat the
 *   point of skipping it.
 *
 * Figma nodes: idle 13900:25306, skip-confirm sheet — general case
 * 13900:25371/13900:25459, last-term case 13900:25446 (this term uses the
 * last-term copy). The correct-result sheet reuses term-1's pattern.
 */
export default function TermFourPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [frozenSeconds, setFrozenSeconds] = useState(0);
  const [liveLevels, setLiveLevels] = useState<number[]>(IDLE_LEVELS);
  const [micBlocked, setMicBlocked] = useState(false);
  const [hasCapturedFrames, setHasCapturedFrames] = useState(false);
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const [whyRevealed, setWhyRevealed] = useState(false);
  const micPermissionGranted = useMicPermissionGranted();
  const setMicPermissionGranted = useSetMicPermissionGranted();
  const [micPermissionPromptOpen, setMicPermissionPromptOpen] = useState(false);
  const lastInputMode = useLastInputMode();
  const setLastInputMode = useSetLastInputMode();
  const { ref: scrollRef, thumb, measure } = useScrollThumb<HTMLDivElement>();

  const capturedFramesRef = useRef<number[][]>([]);
  const recordRecallAttempted = useRecordRecallAttempted();

  const recordTermOutcome = useRecordTermOutcome();
  const recordVoiceUsed = useRecordVoiceUsed();
  const termOutcomes = useTermOutcomes();

  // X (exit) opens the shared exit-confirm sheet instead of navigating
  // directly — bypassing term-4's own routeAfterTermFour "one more?"
  // decision entirely either way (X means abandoning the flow, not
  // naturally completing it). See term-1's own onExit for the rationale.
  const requestExit = useRequestExit();

  useRecallStep({ currentStep: TERM_STEP.syncopation, totalSteps: COMBINED_TOTAL_STEPS, onExit: requestExit });
  // Blurs the whole chrome behind this term's own re-shown mic-permission
  // primer, same treatment as the entry screen's original primer.
  useRecallChromeBlur(micPermissionPromptOpen);

  // Shared per-term attempt state (lib/term-attempt-state.ts) — see term-1
  // for the rationale. Term-4 never branches on outcome/attempt itself
  // (single unaided-pass script), same as term-1. Starting mode follows
  // the student's last-chosen modality this session (lastInputMode), if
  // any; otherwise falls back to the mic-permission decision (denied/
  // unconfirmed on the entry primer → text fallback here too, not voice).
  const { inputMode, setInputMode, typedAnswer, setTypedAnswer } =
    useTermAttemptState<"unaided">(
      lastInputMode ?? (micPermissionGranted ? "voice" : "text")
    );

  const isTyping = inputMode === "text" && stage === "idle" && typedAnswer.length > 0;
  // Checking it's default pose is "listening" (MASCOT_POSE), but that's a
  // voice-specific idea — text fallback shows "reading" instead, since the
  // student typed rather than spoke.
  const isCheckingText = stage === "checking" && inputMode === "text";
  useMascotBubble({
    pose:
      stage === "result"
        ? inputMode === "text"
          ? "reading"
          : "listening"
        : isTyping || isCheckingText
          ? "reading"
          : MASCOT_POSE[stage],
    alt: "Noe",
    text: PROMPT,
    dimmed: stage === "result",
  });

  // Recording timer.
  useEffect(() => {
    if (stage !== "recording") return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [stage]);

  // Live mic reactivity while Recording — visual only, nothing recorded.
  useEffect(() => {
    if (stage !== "recording") return;
    let cancelled = false;
    let raf = 0;
    let frame = 0;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("no getUserMedia");
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        ctx = new AudioContextClass();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const loop = () => {
          analyser.getByteFrequencyData(data);
          frame++;
          if (frame % 2 === 0) {
            const levels = sampleBars(data);
            setLiveLevels(levels);
            capturedFramesRef.current.push(levels);
            if (capturedFramesRef.current.length > 600) {
              capturedFramesRef.current.shift();
            }
            setHasCapturedFrames(true);
          }
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      } catch {
        if (!cancelled) setMicBlocked(true);
      }
    }
    start();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close();
    };
  }, [stage]);

  // Hearing back — silently replay the captured levels on a loop.
  useEffect(() => {
    if (stage !== "hearing-back") return;
    const frames = capturedFramesRef.current;
    if (frames.length === 0) return;
    let i = 0;
    const id = setInterval(() => {
      setLiveLevels(frames[i % frames.length]);
      i++;
    }, 66);
    return () => clearInterval(id);
  }, [stage]);

  useEffect(() => {
    if (stage !== "sending") return;
    const id = setTimeout(() => setStage("checking"), 4000);
    return () => clearTimeout(id);
  }, [stage]);

  useEffect(() => {
    if (stage !== "checking") return;
    const id = setTimeout(() => setStage("result"), 4000);
    return () => clearTimeout(id);
  }, [stage]);

  function startRecording() {
    setElapsed(0);
    setMicBlocked(false);
    capturedFramesRef.current = [];
    setHasCapturedFrames(false);
    setLiveLevels(IDLE_LEVELS);
    setStage("recording");
  }
  function pauseRecording() {
    setFrozenSeconds(elapsed);
    setStage("paused");
  }
  function deleteRecording() {
    setElapsed(0);
    setFrozenSeconds(0);
    capturedFramesRef.current = [];
    setHasCapturedFrames(false);
    setMicBlocked(false);
    setStage("idle");
  }
  function playHearBack() {
    setStage("hearing-back");
  }
  function pauseHearBack() {
    setStage("paused");
  }
  function sendRecording() {
    recordVoiceUsed();
    recordRecallAttempted();
    setStage("sending");
  }
  function cancelSending() {
    setElapsed(0);
    setFrozenSeconds(0);
    capturedFramesRef.current = [];
    setHasCapturedFrames(false);
    setStage("idle");
  }
  function sendTyped() {
    recordRecallAttempted();
    setStage("sending");
  }
  // Keeps the typed draft (unlike voice's cancelSending) so the student
  // can resume editing instead of retyping from scratch.
  function cancelSendingText() {
    setStage("idle");
  }
  // Both directions reset to a clean Idle for whichever mode is now
  // active, never touching attempt/outcome — only how the CURRENT,
  // still-pending attempt is presented changes.
  function switchToText() {
    deleteRecording();
    setInputMode("text");
    setLastInputMode("text");
  }
  // If the mic isn't confirmed granted (denied on the entry primer, or
  // never asked at all), re-show that same primer instead of silently
  // switching — only a fresh Allow actually flips into the voice loop.
  function switchToVoice() {
    if (micPermissionGranted) {
      setStage("idle");
      setInputMode("voice");
      setLastInputMode("voice");
    } else {
      setMicPermissionPromptOpen(true);
    }
  }
  function allowMicAndSwitchToVoice() {
    setMicPermissionGranted(true);
    setMicPermissionPromptOpen(false);
    setStage("idle");
    setInputMode("voice");
    setLastInputMode("voice");
  }
  function denyMicPrompt() {
    setMicPermissionPromptOpen(false);
  }

  // The one place this term's "was the lesson perfect so far?" decision
  // lives — terms 1–3 were all unaided AND this term is also unaided (or
  // was skipped) → straight to the end-of-session Streak reveal (session
  // over); otherwise → "One more before we wrap up" (term 5 / Cadence).
  function routeAfterTermFour(thisTermOutcome: "unaided" | "skipped") {
    const priorPerfect =
      termOutcomes.note === "unaided" &&
      termOutcomes["time-signature"] === "unaided" &&
      termOutcomes.tempo === "unaided";
    router.push(priorPerfect ? "/streak" : "/term-5");
  }

  function handleContinue() {
    recordTermOutcome("syncopation", "unaided");
    routeAfterTermFour("unaided");
  }
  function handleSkipConfirmed() {
    recordTermOutcome("syncopation", "skipped");
    setSkipConfirmOpen(false);
    routeAfterTermFour("skipped");
  }

  if (stage === "result") {
    return (
      <div className="relative flex flex-1 flex-col px-4">
        <div className="pt-5">
          {inputMode === "text" ? (
            <HighlightCard eyebrow="What you wrote:">{typedAnswer}</HighlightCard>
          ) : (
            <HighlightCard eyebrow="What I heard:">{WHAT_I_HEARD}</HighlightCard>
          )}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={gentle}
          className="pt-5"
        >
          <MascotBubble pose="happy" alt="Noe, happy" text={ANSWER} />
        </motion.div>

        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={sheet}
          className="absolute inset-x-0 bottom-0 z-20 rounded-t-[32px] border-t border-border-default bg-feedback-success-subtle"
        >
          <div className="mx-auto mt-2 h-1 w-8 rounded-full bg-background-stacking" />
          <div className="flex items-center gap-2 px-7 pt-3">
            <img src="/images/correct-answer-icon.svg" alt="" aria-hidden className="h-8 w-8 shrink-0" />
            <p className="flex-1 font-display text-[26px] font-black text-feedback-success-on-subtle">
              Exactly right
            </p>
            <ReactionButtons />
          </div>
          {whyRevealed && (
            <div className="px-4 pb-2 mt-5">
              <WhyExplanation variant="correct">{WHY_EXPLANATION}</WhyExplanation>
            </div>
          )}
          <BottomCta className="flex gap-1">
            {whyRevealed ? (
              <motion.button
                whileTap={{ scale: 0.94 }}
                transition={snappy}
                onClick={handleContinue}
                className="relative flex h-[58px] w-full items-center justify-center rounded-full bg-green-bold px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]"
              >
                <span className="font-display text-[18px] font-semibold text-green-on-bold">
                  Got it - Continue
                </span>
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  transition={snappy}
                  onClick={() => setWhyRevealed(true)}
                  className="relative flex h-[58px] items-center justify-center rounded-full bg-interactive-secondary px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]"
                >
                  <span className="font-display text-[18px] font-semibold text-interactive-on-secondary">
                    Why?
                  </span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  transition={snappy}
                  onClick={handleContinue}
                  className="relative flex h-[58px] flex-1 items-center justify-center rounded-full bg-green-bold px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]"
                >
                  <span className="font-display text-[18px] font-semibold text-green-on-bold">
                    Continue
                  </span>
                </motion.button>
              </>
            )}
          </BottomCta>
        </motion.div>
      </div>
    );
  }

  // Text mode only ever occupies Idle/Sending/Checking — Recording/Paused/
  // Hearing-back are voice-only, never entered here; Result is handled
  // above, shared by both modes.
  if (inputMode === "text") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className={`flex min-h-0 flex-1 flex-col transition-[filter] duration-[180ms] ease-out ${
            micPermissionPromptOpen ? "blur-[10px]" : ""
          }`}
        >
          <TextFallbackBody
            stage={stage as "idle" | "sending" | "checking"}
            value={typedAnswer}
            onChange={setTypedAnswer}
            onSend={sendTyped}
            onCancelSending={cancelSendingText}
          />

          <MicLoopBottomBar
            disabled={stage === "sending" || stage === "checking"}
            onSkip={() => setSkipConfirmOpen(true)}
            inputMode={inputMode}
            onSwitchMode={switchToVoice}
          />

          <SkipConfirmSheet
            open={skipConfirmOpen}
            variant="last-term"
            onSkip={handleSkipConfirmed}
            onCancel={() => setSkipConfirmOpen(false)}
          />
        </div>

        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 bg-black/25 transition-opacity duration-[180ms] ease-out ${
            micPermissionPromptOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <IosPermissionDialog
          open={micPermissionPromptOpen}
          onAllow={allowMicAndSwitchToVoice}
          onDeny={denyMicPrompt}
        />
      </div>
    );
  }

  const seconds = stage === "recording" ? elapsed : frozenSeconds;

  const micBg: Record<Exclude<Stage, "result">, string> = {
    idle: "bg-brand-bold",
    recording: "bg-magenta-bold",
    paused: "bg-blue-bold",
    "hearing-back": "bg-coral-bold",
    sending: "bg-brand-subtle",
    checking: "bg-brand-bold",
  };

  const micAriaLabel: Record<Exclude<Stage, "result">, string> = {
    idle: "Tap to answer",
    recording: "Pause recording",
    paused: "Play recording",
    "hearing-back": "Pause playback",
    sending: "Sending",
    checking: "Checking it",
  };

  const micAction: Partial<Record<Exclude<Stage, "result">, () => void>> = {
    idle: startRecording,
    recording: pauseRecording,
    paused: playHearBack,
    "hearing-back": pauseHearBack,
  };

  const micDisabled = stage === "sending" || stage === "checking";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={measure}
        className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-4"
      >
        <div className="flex flex-1 flex-col items-center pt-[60px]">
          <motion.button
            whileTap={micDisabled ? undefined : { scale: 0.94 }}
            transition={snappy}
            aria-label={micAriaLabel[stage]}
            onClick={micAction[stage]}
            disabled={micDisabled}
            className={`relative flex h-[120px] w-[120px] items-center justify-center rounded-full shadow-[inset_0px_-8px_0px_0px_rgba(0,0,0,0.15)] ${
              micDisabled ? "cursor-default" : ""
            } ${micBg[stage]}`}
          >
            {stage === "idle" && (
              <MicIcon className="h-[50px] w-[50px] text-text-primary" strokeWidth={1.5} />
            )}
            {stage === "recording" && (
              <PauseIcon className="h-[50px] w-[50px] text-text-primary" />
            )}
            {stage === "paused" && <PlayIcon className="h-[50px] w-[50px] text-text-primary" />}
            {stage === "hearing-back" && (
              <PauseIcon className="h-[50px] w-[50px] text-text-primary" />
            )}
            {stage === "sending" && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <LoadingSpinnerIcon className="h-[50px] w-[50px] text-text-primary" />
              </motion.div>
            )}
            {stage === "checking" && (
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
              >
                <CheckingItIcon size={80} />
              </motion.div>
            )}
          </motion.button>

          <div className="mt-3 flex flex-col items-center gap-2">
            {stage === "idle" && (
              <>
                <p className="font-display text-[18px] font-medium tracking-[0.01em] text-text-secondary">
                  Tap to answer
                </p>
                <p className="max-w-[190px] text-center font-sans text-xs text-text-secondary">
                  Try to go to quiet place for better results &gt;.&lt;
                </p>
              </>
            )}

            {stage === "recording" && (
              <>
                <p className="font-display text-[18px] font-medium tracking-[0.01em] text-text-secondary">
                  Recording
                </p>
                <div className="flex items-center gap-[18px]">
                  <MicControlButton onClick={deleteRecording} ariaLabel="Delete recording">
                    <TrashIcon className="h-5 w-5 text-text-primary" />
                  </MicControlButton>
                  {micBlocked ? (
                    <ScriptedWaveform colorClassName="bg-magenta-bold" animated />
                  ) : (
                    <LiveWaveform colorClassName="bg-magenta-bold" levels={liveLevels} />
                  )}
                  <p className="min-w-[48px] text-center font-display text-[23px] font-medium tabular-nums text-text-primary">
                    {formatTimer(seconds)}
                  </p>
                  <MicControlButton
                    onClick={sendRecording}
                    ariaLabel="Send recording"
                    bgClassName="bg-brand-bold"
                  >
                    <SendIcon className="h-5 w-5 text-text-primary" />
                  </MicControlButton>
                </div>
              </>
            )}

            {(stage === "paused" || stage === "hearing-back") && (
              <>
                <p className="font-display text-[18px] font-medium tracking-[0.01em] text-text-secondary">
                  {stage === "paused" ? "Hear back or send" : "Hearing back"}
                </p>
                <div className="flex items-center gap-[18px]">
                  <MicControlButton onClick={deleteRecording} ariaLabel="Delete recording">
                    <TrashIcon className="h-5 w-5 text-text-primary" />
                  </MicControlButton>
                  {stage === "paused" ? (
                    <LiveWaveform colorClassName="bg-background-surface" levels={FULL_LEVELS} />
                  ) : hasCapturedFrames ? (
                    <LiveWaveform colorClassName="bg-coral-bold" levels={liveLevels} />
                  ) : (
                    <ScriptedWaveform colorClassName="bg-coral-bold" animated />
                  )}
                  <p className="min-w-[48px] text-center font-display text-[23px] font-medium tabular-nums text-text-primary">
                    {formatTimer(seconds)}
                  </p>
                  <MicControlButton
                    onClick={sendRecording}
                    ariaLabel="Send recording"
                    bgClassName="bg-brand-bold"
                  >
                    <SendIcon className="h-5 w-5 text-text-primary" />
                  </MicControlButton>
                </div>
              </>
            )}

            {stage === "sending" && (
              <>
                <p className="font-display text-[18px] font-medium tracking-[0.01em] text-text-secondary">
                  Sending
                </p>
                <button
                  onClick={cancelSending}
                  className="font-sans text-xs text-text-secondary underline decoration-1 underline-offset-2"
                >
                  Tap to cancel
                </button>
              </>
            )}

            {stage === "checking" && (
              <>
                <p className="font-display text-[18px] font-medium tracking-[0.01em] text-text-secondary">
                  Checking it
                </p>
                <p className="font-sans text-xs text-text-secondary">Give me a second</p>
              </>
            )}
          </div>
        </div>
      </div>
      <ScrollThumbIndicator thumb={thumb} />

      <MicLoopBottomBar
        disabled={stage === "recording" || stage === "sending" || stage === "checking"}
        onSkip={() => setSkipConfirmOpen(true)}
        inputMode={inputMode}
        onSwitchMode={switchToText}
      />

      <SkipConfirmSheet
        open={skipConfirmOpen}
        variant="last-term"
        onSkip={handleSkipConfirmed}
        onCancel={() => setSkipConfirmOpen(false)}
      />
    </div>
  );
}

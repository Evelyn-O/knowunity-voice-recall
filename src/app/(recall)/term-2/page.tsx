"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { MascotBubble } from "@/components/mascot-bubble";
import { CheckingItIcon } from "@/components/checking-it-icon";
import { BottomCta } from "@/components/bottom-cta";
import { HighlightCard } from "@/components/highlight-card";
import { TextLinkButton } from "@/components/buttons";
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
} from "@/lib/recall-flow-context";
import { useTermAttemptState } from "@/lib/term-attempt-state";
import { gentle, sheet, snappy } from "@/lib/motion";
import { useScrollThumb } from "@/lib/use-scroll-thumb";
import { ScrollThumbIndicator } from "@/components/scroll-thumb-indicator";

const PROMPT = "Next: what does a time signature tell you?";
const PARTIAL_REPLY = "You are almost there! Take your time and try again.";
const HINT_1 = "Two numbers stacked on top of each other. What does the top one tell you?";
// Authored, not sourced (SPEC.md §4 Term 2 flags this exact line as a gap:
// no Figma frame captured the "nailed it after the hint" reply). Written in
// Knowie's established short/warm pattern, and answers the hint's own
// question ("what does the top one tell you?") directly.
const ANSWER = "Exactly! The top number tells you how many beats are in each measure.";
// Authored, not sourced — no scripted voice transcript exists for either
// attempt of this term (term-3's TRANSCRIPT_BY_ATTEMPT is the only term
// that had one before this), indexed the same way TERM_2_OUTCOME_BY_ATTEMPT
// is: [partial attempt, correct attempt].
const WHAT_I_HEARD_BY_ATTEMPT = [
  "Um, I think it's something about the beats in a measure?",
  "It's the two numbers that tell you how many beats are in a measure and what note gets the beat.",
];
// Sourced from Evelyn directly for this term's "Why?" explanation box —
// not a Figma-mockup placeholder like term-1/term-3's, but the same
// "correct" (green) variant treatment.
const WHY_EXPLANATION =
  "A time signature acts as a musical blueprint, organizing a steady stream of beats into predictable, repeating rhythmic blocks.";

type Outcome = "partial" | "correct";

/**
 * Known limitation, left exactly as scripted (not a bug): outcome grading
 * is entirely mocked. Each term has a fixed, hardcoded sequence of outcomes
 * keyed by attempt number (0-indexed) — nothing about the take is actually
 * evaluated. This is the ONE place that mapping lives for this term, so a
 * future phase swapping in real voice-transcription/typed-answer evaluation
 * only has to replace this lookup, not hunt through every handler below.
 */
const TERM_2_OUTCOME_BY_ATTEMPT: readonly Outcome[] = ["partial", "correct"];

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
  | "result"
  | "hint";

/** Mascot pose per moment — same mapping term-1 uses; "result" and "hint"
 * are handled separately below since each shows its own local reply
 * bubble(s) rather than swapping the persistent bubble's own pose. */
const MASCOT_POSE: Record<Exclude<Stage, "result" | "hint">, string> = {
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
 * Term 2 (Time signature) — same mocked mic state machine as term-1 (SPEC.md
 * §3), extended with the partial → hint → retry → correct path term-1 never
 * needed. Scripted outcome sequence for this term is fixed: attempt 1 →
 * partial, attempt 2 → correct (TERM_2_OUTCOME_BY_ATTEMPT above) — the mic
 * and "Type instead" only ever advance the flow, nothing is analyzed.
 *
 * Figma nodes: idle 13900:25208, partial result 13900:25857, hint
 * 13900:26321. The correct-result sheet (2nd attempt) has no separate
 * Figma node for this term — it reuses term-1's celebration sheet exactly,
 * per instruction, with only PROMPT/ANSWER copy swapped.
 */
export default function TermTwoPage() {
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

  // Shared per-term attempt state (lib/term-attempt-state.ts) — attempt/
  // outcome/inputMode/typedAnswer all live here now instead of local
  // useState, so both the voice retry ladder and the text fallback read
  // and advance the exact same sequence position. Switching mode never
  // touches attempt/outcome, only how the current one is presented.
  // Starting mode follows the student's last-chosen modality this session
  // (lastInputMode), if any; otherwise falls back to the mic-permission
  // decision (denied/unconfirmed on the entry primer → text fallback here
  // too, not voice).
  const {
    attempt,
    outcome,
    inputMode,
    typedAnswer,
    setInputMode,
    setTypedAnswer,
    resolveOutcome,
    advanceAttempt,
  } = useTermAttemptState<Outcome>(lastInputMode ?? (micPermissionGranted ? "voice" : "text"));

  const capturedFramesRef = useRef<number[][]>([]);
  const recordRecallAttempted = useRecordRecallAttempted();

  // X (exit) opens the shared exit-confirm sheet instead of navigating
  // directly — see term-1's own onExit for the full rationale.
  const requestExit = useRequestExit();

  useRecallStep({ currentStep: TERM_STEP["time-signature"], totalSteps: COMBINED_TOTAL_STEPS, onExit: requestExit });
  // Blurs the whole chrome behind this term's own re-shown mic-permission
  // primer, same treatment as the entry screen's original primer.
  useRecallChromeBlur(micPermissionPromptOpen);
  const recordTermOutcome = useRecordTermOutcome();
  const recordVoiceUsed = useRecordVoiceUsed();
  // Same PROMPT/alt throughout this term; only pose changes per mic-loop
  // stage. Dims (and holds "listening") for both Result and Hint, since
  // both moments are showing a reply below this question, not the question
  // itself changing. While actively typing on Idle, swaps to "reading"
  // (same rule term-1 uses) ahead of the stage-based pose.
  const isTyping = inputMode === "text" && stage === "idle" && typedAnswer.length > 0;
  // Checking it's default pose is "listening" (MASCOT_POSE), but that's a
  // voice-specific idea — text fallback shows "reading" instead, since the
  // student typed rather than spoke.
  const isCheckingText = stage === "checking" && inputMode === "text";
  useMascotBubble({
    pose:
      stage === "result" || stage === "hint"
        ? inputMode === "text"
          ? "reading"
          : "listening"
        : isTyping || isCheckingText
          ? "reading"
          : MASCOT_POSE[stage],
    alt: "Noe",
    text: PROMPT,
    dimmed: stage === "result" || stage === "hint",
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
          // Throttle to ~30fps — plenty smooth for a 7-bar meter, half
          // the state updates of a full 60fps loop.
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

  // Hearing back — silently replay the captured levels on a loop. No
  // audio, no MediaRecorder; just numbers already sitting in memory.
  useEffect(() => {
    if (stage !== "hearing-back") return;
    const frames = capturedFramesRef.current;
    if (frames.length === 0) return; // ScriptedWaveform fallback handles this in render.
    let i = 0;
    const id = setInterval(() => {
      setLiveLevels(frames[i % frames.length]);
      i++;
    }, 66);
    return () => clearInterval(id);
  }, [stage]);

  // Shortened from 4000ms each (8s total) — see term-1's own comment on
  // this same pair for the motion-guide.md reasoning.
  useEffect(() => {
    if (stage !== "sending") return;
    const id = setTimeout(() => setStage("checking"), 1200);
    return () => clearTimeout(id);
  }, [stage]);

  // Checking resolves into whichever outcome this attempt is scripted for
  // (see TERM_2_OUTCOME_BY_ATTEMPT) — the only place attempt number turns
  // into an outcome.
  useEffect(() => {
    if (stage !== "checking") return;
    const id = setTimeout(() => {
      const index = Math.min(attempt, TERM_2_OUTCOME_BY_ATTEMPT.length - 1);
      resolveOutcome(TERM_2_OUTCOME_BY_ATTEMPT[index]);
      setStage("result");
    }, 1200);
    return () => clearTimeout(id);
  }, [stage, attempt, resolveOutcome]);

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
  // Wrong/partial + "Try again" → re-enter the recording loop for THIS
  // same term (same route, no navigation) — never a hard fail. Used by
  // both the partial sheet's own "Try again" (hint skipped) and the
  // post-hint bottom bar's "Try again". advanceAttempt() (shared hook)
  // moves to the NEXT scripted outcome and clears the typed draft; it
  // never resets inputMode, so retrying stays in whichever mode the
  // student is already using.
  function tryAgain() {
    advanceAttempt();
    setElapsed(0);
    setFrozenSeconds(0);
    capturedFramesRef.current = [];
    setHasCapturedFrames(false);
    setMicBlocked(false);
    setStage("idle");
  }
  function requestHint() {
    setStage("hint");
  }
  // Skip always advances to the next term, regardless of attempt/hint
  // state (this task's global rule).
  function handleSkip() {
    recordTermOutcome("time-signature", "skipped");
    router.push("/term-3");
  }
  function handleContinue() {
    // This term's script always reaches "correct" via exactly 1 hint
    // (partial → hint → correct) — see TERM_2_OUTCOME_BY_ATTEMPT.
    recordTermOutcome("time-signature", "hinted");
    router.push("/term-3");
  }

  if (stage === "hint") {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          onScroll={measure}
          className="no-scrollbar flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-5"
        >
          {/* Both bubbles below the (already-dimmed, persistent) question
              dim in turn as the thread grows — only the newest line (the
              hint) stays at full opacity, matching the Figma frame. */}
          <MascotBubble pose="approving" alt="Noe, approving" text={PARTIAL_REPLY} dimmed />
          <MascotBubble pose="giggling" alt="Noe, giggling" text={HINT_1} />
        </div>
        <ScrollThumbIndicator thumb={thumb} />

        {/* Hint reveals inline in the thread, sheet dismisses, bottom bar
            becomes "Try again" (primary) + "Skip to next question" (link)
            only — SPEC.md §3 state 6's partial description, skip control
            updated per feedback.md [L] "Skip must not read as exiting the
            whole session" (icon-only skip read as ending the session, not
            the term). No separate "Type instead" here (Figma node
            13900:26321): the retry itself lands back on Idle, whose own
            mode-switch pill already offers "Type instead" there — this
            screen doesn't need to duplicate it. Distinct from the
            mic-loop's BottomBar: no mic circle shown here, this is a
            dedicated "waiting for the retry tap" moment. */}
        <BottomCta className="flex flex-col gap-2">
          <motion.button
            whileTap={{ scale: 0.94 }}
            transition={snappy}
            onClick={tryAgain}
            className="relative flex h-[58px] w-full items-center justify-center gap-2 rounded-full bg-interactive-primary px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]"
          >
            <span className="font-display text-[18px] font-bold text-interactive-on-primary">
              Try again
            </span>
          </motion.button>
          <TextLinkButton
            className="mx-auto"
            onClick={() => setSkipConfirmOpen(true)}
          >
            Skip to next question
          </TextLinkButton>
        </BottomCta>

        <SkipConfirmSheet
          open={skipConfirmOpen}
          onSkip={handleSkip}
          onCancel={() => setSkipConfirmOpen(false)}
        />
      </div>
    );
  }

  if (stage === "result" && outcome === "partial") {
    return (
      <div className="relative flex flex-1 flex-col px-4">
        {/* Text mode echoes the real typed answer; voice mode echoes the
            scripted "What I heard" transcript (WHAT_I_HEARD_BY_ATTEMPT),
            same pattern term-3's wrong-result screens use — shows
            regardless of outcome/mode. */}
        <div className="pt-5">
          {inputMode === "text" ? (
            <HighlightCard eyebrow="What you wrote:">{typedAnswer}</HighlightCard>
          ) : (
            <HighlightCard eyebrow="What I heard:">
              {WHAT_I_HEARD_BY_ATTEMPT[Math.min(attempt, WHAT_I_HEARD_BY_ATTEMPT.length - 1)]}
            </HighlightCard>
          )}
        </div>
        {/* The dimmed question echo is the persistent MascotBubble in the
            shared layout (dimmed:true via useMascotBubble above) — only
            this reply bubble is local to this screen. */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={gentle}
          className="pt-5"
        >
          <MascotBubble pose="approving" alt="Noe, approving" text={PARTIAL_REPLY} />
        </motion.div>

        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={sheet}
          className="absolute inset-x-0 bottom-0 z-20 rounded-t-[32px] border-t border-border-default bg-pro-subtle"
        >
          <div className="mx-auto mt-2 h-1 w-8 rounded-full bg-background-stacking" />
          <div className="flex items-center gap-2 px-7 pt-3">
            <img src="/images/partial-correct-answer-icon.svg" alt="" aria-hidden className="h-8 w-8 shrink-0" />
            <p className="flex-1 font-display text-[26px] font-black text-pro-bold">
              Almost there!
            </p>
            <ReactionButtons />
          </div>
          <BottomCta className="flex gap-1">
            <motion.button
              whileTap={{ scale: 0.94 }}
              transition={snappy}
              onClick={requestHint}
              className="relative flex h-[58px] items-center justify-center rounded-full bg-interactive-secondary px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]"
            >
              <span className="font-display text-[18px] font-semibold text-interactive-on-secondary">
                Hint me!
              </span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.94 }}
              transition={snappy}
              onClick={tryAgain}
              className="relative flex h-[58px] flex-1 items-center justify-center rounded-full bg-pro-bold px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]"
            >
              <span className="font-display text-[18px] font-semibold text-pro-on-bold">
                Try again
              </span>
            </motion.button>
          </BottomCta>
        </motion.div>
      </div>
    );
  }

  if (stage === "result") {
    return (
      <div className="relative flex flex-1 flex-col px-4">
        {/* Reuses term-1's correct/celebration pattern exactly — only the
            dimmed question echo (persistent, via useMascotBubble above)
            and this new answer bubble, same as term-1's Result. The
            partial/hint history isn't carried over into this view. */}
        <div className="pt-5">
          {inputMode === "text" ? (
            <HighlightCard eyebrow="What you wrote:">{typedAnswer}</HighlightCard>
          ) : (
            <HighlightCard eyebrow="What I heard:">
              {WHAT_I_HEARD_BY_ATTEMPT[Math.min(attempt, WHAT_I_HEARD_BY_ATTEMPT.length - 1)]}
            </HighlightCard>
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
  // Hearing-back are voice-only states, never entered here; Result/Hint
  // are handled above, shared by both modes.
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
            onSkip={handleSkip}
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

  const micBg: Record<Exclude<Stage, "result" | "hint">, string> = {
    idle: "bg-brand-bold",
    recording: "bg-magenta-bold",
    paused: "bg-blue-bold",
    "hearing-back": "bg-coral-bold",
    sending: "bg-brand-subtle",
    checking: "bg-brand-bold",
  };

  const micAriaLabel: Record<Exclude<Stage, "result" | "hint">, string> = {
    idle: "Tap to answer",
    recording: "Pause recording",
    paused: "Play recording",
    "hearing-back": "Pause playback",
    sending: "Sending",
    checking: "Checking it",
  };

  const micAction: Partial<Record<Exclude<Stage, "result" | "hint">, () => void>> = {
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
          {/* Instant state swap, deliberately — no crossfade/layout animation
              between mic states (same fix already applied in term-1: it
              should read as a state change, not an animation). Only
              animations left here are continuous ones *within* a single
              state: the spinner's rotation, the checking-it pulse, and the
              live waveform's per-frame smoothing. */}
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
              // Same within-state breathing pulse Checking already uses
              // (motion-guide.md's "Recording / listening state" recipe) —
              // doesn't touch the locked instant-swap between mic states,
              // this only loops while already in Recording.
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
              >
                <PauseIcon className="h-[50px] w-[50px] text-text-primary" />
              </motion.div>
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
                  Try to find a quiet place for better results &gt;.&lt;
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
        onSkip={handleSkip}
        onCancel={() => setSkipConfirmOpen(false)}
      />
    </div>
  );
}

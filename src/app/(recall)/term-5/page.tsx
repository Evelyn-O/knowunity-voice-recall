"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { MascotBubble } from "@/components/mascot-bubble";
import { MascotImage } from "@/components/mascot-image";
import { BottomCta } from "@/components/bottom-cta";
import { HighlightCard } from "@/components/highlight-card";
import { PrimaryButton, TextLinkButton } from "@/components/buttons";
import { MicLoopBottomBar } from "@/components/mic-loop-bottom-bar";
import { TextFallbackBody } from "@/components/text-fallback-body";
import { SkipConfirmSheet } from "@/components/skip-confirm-sheet";
import { IosPermissionDialog } from "@/components/ios-permission-dialog";
import {
  LoadingSpinnerIcon,
  MicIcon,
  PauseIcon,
  PlayIcon,
  SendIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  TrashIcon,
} from "@/components/icons";
import {
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

const ENTRY_LINE = "Woohoo! One more before we wrap up. You are doing great!";
const PROMPT = "Last one for this set: what's Cadence?";
// Authored, not sourced: SPEC.md §4 Term 5 flags this exact gap too (no
// in-thread affirming reply line was found as its own Figma frame for
// Cadence). Short/warm, matching the Term 1 pattern.
const ANSWER =
  "Exactly! A cadence is the musical phrase that signals an ending or resting point.";

/** Max height (px) per bar — the base silhouette; live/replayed levels
 * (0..1) scale each bar down from this via `transform: scaleY`, never by
 * animating `height` directly (motion-guide.md). */
const WAVEFORM_HEIGHTS = [35, 28, 44, 44, 28, 44, 20];
const BAR_COUNT = WAVEFORM_HEIGHTS.length;
const IDLE_LEVELS = WAVEFORM_HEIGHTS.map(() => 0.15);
const FULL_LEVELS = WAVEFORM_HEIGHTS.map(() => 1);

type Stage =
  | "entry"
  | "idle"
  | "recording"
  | "paused"
  | "hearing-back"
  | "sending"
  | "checking"
  | "result";

type MicStage = Exclude<Stage, "entry" | "result">;

/** Mascot pose per moment — unchanged from term-1/4's mapping. */
const MASCOT_POSE: Record<MicStage, string> = {
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
 * Term 5 (Cadence) — the conditional bonus/make-up round (SPEC.md §2C),
 * only reached when term 4 decided the lesson wasn't perfect. Two stages
 * in one route, same "no navigation between internal states" pattern as
 * every term:
 *
 * - "entry": the "One more before we wrap up!" interstitial (Figma
 *   13900:25415) — reuses the entry screen's (recall)/page.tsx large
 *   glowing-hero mascot treatment verbatim (same mascot-glow/bob/drift
 *   classes, same ellipse styling) since this is the same "big hero
 *   moment" pattern, not the small MascotBubble row — with a speech
 *   bubble above the mascot instead of plain heading text. Not wired
 *   through useMascotBubble while on this stage (same reasoning as the
 *   entry screen: bespoke local mascot, must clear the shared bubble so
 *   it doesn't also render).
 * - mic-loop stages + "result": identical shape to term-1/4 (no wrong/
 *   hint ladder — this task's own script is "correct on first attempt").
 *
 * Skip is available on both the entry screen and the mic-loop, both using
 * SkipConfirmSheet's "last-term" copy ("Maybe next time!") — this is the
 * absolute last term the session can reach, same variant term 4 uses.
 * Confirming either always goes straight to /summary, end of session.
 *
 * Figma nodes: entry 13900:25415, term screen 13900:25338.
 */
export default function TermFivePage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("entry");
  const [elapsed, setElapsed] = useState(0);
  const [frozenSeconds, setFrozenSeconds] = useState(0);
  const [liveLevels, setLiveLevels] = useState<number[]>(IDLE_LEVELS);
  const [micBlocked, setMicBlocked] = useState(false);
  const [hasCapturedFrames, setHasCapturedFrames] = useState(false);
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const micPermissionGranted = useMicPermissionGranted();
  const setMicPermissionGranted = useSetMicPermissionGranted();
  const [micPermissionPromptOpen, setMicPermissionPromptOpen] = useState(false);
  const lastInputMode = useLastInputMode();
  const setLastInputMode = useSetLastInputMode();

  const capturedFramesRef = useRef<number[][]>([]);
  const recordRecallAttempted = useRecordRecallAttempted();

  // X (exit) opens the shared exit-confirm sheet instead of navigating
  // directly — see term-1's own onExit for the full rationale.
  const requestExit = useRequestExit();

  useRecallStep({ currentStep: 6, totalSteps: 6, onExit: requestExit });
  // Blurs the whole chrome behind this term's own re-shown mic-permission
  // primer, same treatment as the entry screen's original primer.
  useRecallChromeBlur(micPermissionPromptOpen);
  const recordTermOutcome = useRecordTermOutcome();
  const recordVoiceUsed = useRecordVoiceUsed();

  // Shared per-term attempt state (lib/term-attempt-state.ts) — see term-1
  // for the rationale. Term-5's mic-loop never branches on outcome/attempt
  // itself (single correct-on-first-attempt script), same as term-1.
  // Starting mode follows the student's last-chosen modality this session
  // (lastInputMode), if any; otherwise falls back to the mic-permission
  // decision (denied/unconfirmed on the entry primer → text fallback here
  // too, not voice).
  const { inputMode, setInputMode, typedAnswer, setTypedAnswer } =
    useTermAttemptState<"correct">(
      lastInputMode ?? (micPermissionGranted ? "voice" : "text")
    );

  const isTyping = inputMode === "text" && stage === "idle" && typedAnswer.length > 0;
  useMascotBubble(
    stage === "entry"
      ? null
      : {
          pose: stage === "result" ? "listening" : isTyping ? "reading" : MASCOT_POSE[stage as MicStage],
          alt: "Noe",
          text: PROMPT,
          dimmed: stage === "result",
        }
  );

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
  // Cadence is the last term the session can ever reach, either way this
  // resolves — routes to the end-of-session Streak reveal, same as term
  // 4's own "priorPerfect" branch.
  function goToStreak() {
    router.push("/streak");
  }
  function handleContinue() {
    recordTermOutcome("cadence", "unaided");
    goToStreak();
  }
  function handleSkipConfirmed() {
    recordTermOutcome("cadence", "skipped");
    setSkipConfirmOpen(false);
    goToStreak();
  }

  if (stage === "entry") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-5 pt-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={gentle}
            className="relative mb-6 max-w-[300px] rounded-bubble bg-background-surface p-4"
          >
            <p className="text-center text-[16px] leading-[1.5] tracking-[-0.16px] text-text-primary">
              {ENTRY_LINE}
            </p>
            <div
              aria-hidden
              className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] bg-background-surface"
            />
          </motion.div>

          {/* Same large glowing-hero mascot treatment as (recall)/page.tsx's
              entry screen — reused verbatim, just a different pose. */}
          <div className="relative flex flex-col items-center">
            <div
              aria-hidden
              className="mascot-glow absolute left-1/2 top-1/2 h-[260px] w-[260px] rounded-full bg-brand-bold/25 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute bottom-2 h-5 w-32 rounded-full bg-black/40 blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={gentle}
              className="relative"
            >
              <div className="mascot-bob">
                <div className="mascot-drift">
                  <MascotImage pose="giggling" alt="Noe, winking" size={200} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Skip control updated per feedback.md [L] "Skip must not read as
            exiting the whole session" — text link below the primary CTA,
            same treatment as the entry screen's "Maybe later", instead of
            an icon-only button. This is the absolute last term the session
            can reach, so the label names the real destination directly. */}
        <BottomCta className="flex flex-col gap-2">
          <PrimaryButton onClick={() => setStage("idle")}>
            Continue
          </PrimaryButton>
          <TextLinkButton
            className="mx-auto"
            onClick={() => setSkipConfirmOpen(true)}
          >
            Skip to summary
          </TextLinkButton>
        </BottomCta>

        <SkipConfirmSheet
          open={skipConfirmOpen}
          variant="last-term"
          onSkip={handleSkipConfirmed}
          onCancel={() => setSkipConfirmOpen(false)}
        />
      </div>
    );
  }

  if (stage === "result") {
    return (
      <div className="relative flex flex-1 flex-col px-4">
        {inputMode === "text" && (
          <div className="pt-5">
            <HighlightCard eyebrow="What you wrote:">{typedAnswer}</HighlightCard>
          </div>
        )}
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
          className="absolute inset-x-0 bottom-0 rounded-t-[32px] border-t border-border-default bg-feedback-success-subtle"
        >
          <div className="mx-auto mt-2 h-1 w-8 rounded-full bg-background-stacking" />
          <div className="flex items-center gap-2 px-7 pt-3">
            <img src="/images/correct-answer-icon.svg" alt="" aria-hidden className="h-8 w-8 shrink-0" />
            <p className="flex-1 font-display text-[26px] font-black text-feedback-success-on-subtle">
              Exactly right
            </p>
            <button aria-label="Dislike this reply">
              <ThumbsDownIcon className="h-6 w-6 text-text-primary" />
            </button>
            <button aria-label="Like this reply">
              <ThumbsUpIcon className="h-6 w-6 text-text-primary" />
            </button>
          </div>
          <BottomCta className="flex gap-1">
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
              onClick={handleContinue}
              className="relative flex h-[58px] flex-1 items-center justify-center rounded-full bg-green-bold px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]"
            >
              <span className="font-display text-[18px] font-semibold text-green-on-bold">
                Continue
              </span>
            </motion.button>
          </BottomCta>
        </motion.div>
      </div>
    );
  }

  // Text mode only ever occupies Idle/Sending/Checking — Recording/Paused/
  // Hearing-back are voice-only, never entered here; Result/Entry are
  // handled elsewhere in this file.
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
            skipLabel="Skip to summary"
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

  const micStage = stage as MicStage;
  const seconds = micStage === "recording" ? elapsed : frozenSeconds;

  const micBg: Record<MicStage, string> = {
    idle: "bg-brand-bold",
    recording: "bg-magenta-bold",
    paused: "bg-blue-bold",
    "hearing-back": "bg-coral-bold",
    sending: "bg-brand-subtle",
    checking: "bg-brand-bold",
  };

  const micAriaLabel: Record<MicStage, string> = {
    idle: "Tap to answer",
    recording: "Pause recording",
    paused: "Play recording",
    "hearing-back": "Pause playback",
    sending: "Sending",
    checking: "Checking it",
  };

  const micAction: Partial<Record<MicStage, () => void>> = {
    idle: startRecording,
    recording: pauseRecording,
    paused: playHearBack,
    "hearing-back": pauseHearBack,
  };

  const micDisabled = micStage === "sending" || micStage === "checking";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4">
        <div className="flex flex-1 flex-col items-center pt-[60px]">
          <motion.button
            whileTap={micDisabled ? undefined : { scale: 0.94 }}
            transition={snappy}
            aria-label={micAriaLabel[micStage]}
            onClick={micAction[micStage]}
            disabled={micDisabled}
            className={`relative flex h-[120px] w-[120px] items-center justify-center rounded-full shadow-[inset_0px_-8px_0px_0px_rgba(0,0,0,0.15)] ${
              micDisabled ? "cursor-default" : ""
            } ${micBg[micStage]}`}
          >
            {micStage === "idle" && (
              <MicIcon className="h-[50px] w-[50px] text-text-primary" strokeWidth={1.5} />
            )}
            {micStage === "recording" && (
              <PauseIcon className="h-[50px] w-[50px] text-text-primary" />
            )}
            {micStage === "paused" && <PlayIcon className="h-[50px] w-[50px] text-text-primary" />}
            {micStage === "hearing-back" && (
              <PauseIcon className="h-[50px] w-[50px] text-text-primary" />
            )}
            {micStage === "sending" && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <LoadingSpinnerIcon className="h-[50px] w-[50px] text-text-primary" />
              </motion.div>
            )}
            {micStage === "checking" && (
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
              >
                <MascotImage pose="listening" alt="Noe, listening" size={80} />
              </motion.div>
            )}
          </motion.button>

          <div className="mt-3 flex flex-col items-center gap-2">
            {micStage === "idle" && (
              <>
                <p className="font-display text-[18px] font-medium tracking-[0.01em] text-text-secondary">
                  Tap to answer
                </p>
                <p className="max-w-[190px] text-center font-sans text-xs text-text-secondary">
                  Try to go to quiet place for better results &gt;.&lt;
                </p>
              </>
            )}

            {micStage === "recording" && (
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

            {(micStage === "paused" || micStage === "hearing-back") && (
              <>
                <p className="font-display text-[18px] font-medium tracking-[0.01em] text-text-secondary">
                  {micStage === "paused" ? "Hear back or send" : "Hearing back"}
                </p>
                <div className="flex items-center gap-[18px]">
                  <MicControlButton onClick={deleteRecording} ariaLabel="Delete recording">
                    <TrashIcon className="h-5 w-5 text-text-primary" />
                  </MicControlButton>
                  {micStage === "paused" ? (
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

            {micStage === "sending" && (
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

            {micStage === "checking" && (
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

      <MicLoopBottomBar
        disabled={micStage === "recording" || micStage === "sending" || micStage === "checking"}
        onSkip={() => setSkipConfirmOpen(true)}
        inputMode={inputMode}
        onSwitchMode={switchToText}
        skipLabel="Skip to summary"
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

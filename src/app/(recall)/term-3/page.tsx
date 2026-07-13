"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { MascotBubble } from "@/components/mascot-bubble";
import { MascotImage } from "@/components/mascot-image";
import { HighlightCard } from "@/components/highlight-card";
import { BottomCta } from "@/components/bottom-cta";
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

const QUESTION = "What's tempo?";
const PROMPT = `Half way there! ${QUESTION}`;
// SPEC.md §3's mishear-dispute copy is the bare question, not the "Half way
// there!" preamble — confirmed against this term's own Figma frame
// (node 13900:25274).
const MISHEAR_PROMPT = `Sorry about that, lets try again! ${QUESTION}`;

const TRANSCRIPT_BY_ATTEMPT = [
  "Tempo is how loud or soft a song is, like when you press the pedal to make the music sound fast.",
  "Tempo is just the speed of the notes, so a song with a lot of fast sixteenth notes automatically has a faster tempo than a song with slow whole notes.",
] as const;
const WRONG_REPLY_BY_ATTEMPT = [
  "Not exactly! But you are getting closer.",
  "Mmm...Not quite yet, you got one more hint!",
] as const;
const HINT_BY_ATTEMPT = [
  "Think about it in two parts, what does a note tell a musician about a sound?",
  "1, 2, 3, 4....1, 2, 3, 4. What does that tell you?",
] as const;
const REVEAL_TEXT =
  "We can review next time: Tempo is the speed or pace of a piece of music — how fast or slow it's played.";
// Authored, not sourced (same gap SPEC.md flags for term 2): a "correct on
// the 3rd attempt" outcome isn't part of this term's committed script (see
// TERM_3_OUTCOME_BY_ATTEMPT below) and no Figma frame captures this line,
// but the "correct" Outcome case is kept real/wired rather than deleted —
// same reasoning as keeping Reveal fully built when a script doesn't
// exercise it. Kept consistent with Reveal's own definition of tempo,
// phrased as a short warm affirmation.
const ANSWER = "Exactly! Tempo is the speed or pace of the music — how fast or slow it feels.";
// Authored, not sourced — same gap as ANSWER above: this term's "correct"
// case is unreached by the committed script, so no scripted transcript
// exists for it (TRANSCRIPT_BY_ATTEMPT only covers the two wrong attempts).
const WHAT_I_HEARD_CORRECT =
  "Tempo is how fast or slow the music is played.";
// Sourced from Figma's own worked example for the reveal sheet's "Why?"
// explanation box (node 14036:14642) — Evelyn flagged this exact copy as
// placeholder/stand-in content, not final, but it's the one example given
// for this term's reveal sheet, so it's used verbatim rather than
// invented. Deliberately NOT reused for this term's own unreached
// "correct" sheet further down — no content was given for a
// Tempo-correct explanation, only Tempo-reveal.
const WHY_EXPLANATION =
  "Fast vibrations create high pitches, while slow vibrations create low pitches. Your brain hears this steady speed as one clear, specific tone.";

type Outcome = "wrong" | "correct";

/**
 * Known limitation, left exactly as scripted (not a bug): outcome grading
 * is entirely mocked, keyed by attempt number (0-indexed) — nothing about
 * the take is actually evaluated. This is the ONE place that mapping lives
 * for this term, so a future phase swapping in real voice-transcription/
 * typed-answer evaluation only has to replace this lookup. Per this term's
 * brief: wrong → wrong → wrong, so the 3rd attempt resolves via the
 * reveal-routing check below (no hints left + still wrong → Reveal) rather
 * than through the "correct" Outcome case. That case stays real/wired
 * (see ANSWER above) in case a future term's script needs it.
 */
const TERM_3_OUTCOME_BY_ATTEMPT: readonly Outcome[] = ["wrong", "wrong", "wrong"];
/** 1 hint after the 1st wrong, 2 hints after the 2nd wrong (this task's
 * global hint-economy rule) — HINT_BY_ATTEMPT.length is the source of
 * truth for how many wrong attempts still get offered a hint before a
 * wrong result routes straight to Reveal instead of another hint sheet. */
const HINTS_AVAILABLE = HINT_BY_ATTEMPT.length;

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
  | "hint"
  | "reveal";

type MicStage = Exclude<Stage, "result" | "hint" | "reveal">;

/** Mascot pose per moment — same mapping term-1/term-2 use for the mic
 * loop; "result"/"hint"/"reveal" are handled separately below since each
 * shows its own local reply bubble(s) rather than swapping the persistent
 * bubble's own pose. */
const MASCOT_POSE: Record<MicStage, string> = {
  idle: "thinking-less-judge",
  recording: "listening",
  paused: "excited",
  "hearing-back": "standby",
  sending: "happy",
  checking: "listening",
};

const MIC_STAGES: readonly MicStage[] = [
  "idle",
  "recording",
  "paused",
  "hearing-back",
  "sending",
  "checking",
];

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
 * Term 3 (Tempo) — same mocked mic state machine as term-1/2 (SPEC.md §3),
 * extended with the full 2-hint wrong ladder plus the mishear-dispute
 * detour term-1/2 never needed. Scripted outcome sequence for this term is
 * fixed: attempt 1 → wrong, attempt 2 → wrong, attempt 3 → wrong-with-no-
 * hints-left, which resolves straight to Reveal rather than a 3rd wrong
 * sheet (TERM_3_OUTCOME_BY_ATTEMPT above; see the reveal-routing check in
 * the Checking effect) — the mic and "Type instead" only ever advance the
 * flow, nothing is analyzed.
 *
 * Figma nodes: idle 13900:25242, wrong result 13900:25923, mishear-restart
 * idle 13900:25274, hint 1 13900:26005, 2nd wrong result 13900:26083,
 * hint 2 13900:26165, reveal 13900:26243. The correct-result sheet has no
 * separate Figma node for this term and isn't reached by this term's
 * script — it stays wired (reusing term-1's celebration sheet exactly,
 * with PROMPT/ANSWER copy swapped) in case a future term's script needs
 * this same "correct" Outcome path.
 */
export default function TermThreePage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [promptVariant, setPromptVariant] = useState<"normal" | "mishear">("normal");
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

  // Shared per-term attempt state (lib/term-attempt-state.ts) — see term-2
  // for the full rationale. promptVariant/mishear stays local, separate
  // from this shared state. Starting mode follows the student's
  // last-chosen modality this session (lastInputMode), if any; otherwise
  // falls back to the mic-permission decision (denied/unconfirmed on the
  // entry primer → text fallback here too, not voice).
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

  useRecallStep({ currentStep: TERM_STEP.tempo, totalSteps: COMBINED_TOTAL_STEPS, onExit: requestExit });
  // Blurs the whole chrome behind this term's own re-shown mic-permission
  // primer, same treatment as the entry screen's original primer.
  useRecallChromeBlur(micPermissionPromptOpen);
  const recordTermOutcome = useRecordTermOutcome();
  const recordVoiceUsed = useRecordVoiceUsed();

  const isMicStage = MIC_STAGES.includes(stage as MicStage);
  const isTyping = inputMode === "text" && stage === "idle" && typedAnswer.length > 0;
  // Checking it's default pose is "listening" (MASCOT_POSE), but that's a
  // voice-specific idea — text fallback shows "reading" instead, since the
  // student typed rather than spoke.
  const isCheckingText = stage === "checking" && inputMode === "text";
  // The persistent top bubble only ever shows the mishear-adapted line
  // while actually mid mic-loop for the retry it applies to — once
  // dimmed for a result/hint/reveal screen it always reverts to the
  // plain, official PROMPT (the "sorry about that" framing is a one-off
  // Idle-moment nicety, not a lasting replacement of the question). While
  // actively typing, swaps to "reading" (same rule term-1/2 use) ahead of
  // the stage-based pose.
  useMascotBubble({
    pose: isMicStage
      ? isTyping || isCheckingText
        ? "reading"
        : MASCOT_POSE[stage as MicStage]
      : inputMode === "text"
        ? "reading"
        : "listening",
    alt: "Noe",
    text: isMicStage && promptVariant === "mishear" ? MISHEAR_PROMPT : PROMPT,
    dimmed: !isMicStage,
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

  useEffect(() => {
    if (stage !== "sending") return;
    const id = setTimeout(() => setStage("checking"), 4000);
    return () => clearTimeout(id);
  }, [stage]);

  // Checking resolves into whichever outcome this attempt is scripted for
  // (see TERM_3_OUTCOME_BY_ATTEMPT) — the only place attempt number turns
  // into an outcome. A wrong outcome with no hints left to offer routes
  // straight to Reveal instead of another wrong-sheet (SPEC.md §3: "a 3rd
  // wrong/no-retry resolves to Reveal") — this is exactly how this term's
  // own script ends (attempt 3 is scripted wrong, with both hints already
  // spent), so this branch is the normal path here, not a dead one.
  useEffect(() => {
    if (stage !== "checking") return;
    const id = setTimeout(() => {
      const index = Math.min(attempt, TERM_3_OUTCOME_BY_ATTEMPT.length - 1);
      const nextOutcome = TERM_3_OUTCOME_BY_ATTEMPT[index];
      resolveOutcome(nextOutcome);
      setStage(nextOutcome === "wrong" && attempt >= HINTS_AVAILABLE ? "reveal" : "result");
    }, 4000);
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
  // Wrong + "Try again" → re-enter the recording loop for THIS same term
  // (same route, no navigation) — never a hard fail. Used by both the
  // wrong sheet's own "Try again" (hint skipped) and the post-hint bottom
  // bar's "Try again". advanceAttempt() (shared hook) moves to the NEXT
  // scripted outcome and clears the typed draft; never touches inputMode,
  // so retrying stays in whichever mode the student is already using.
  function tryAgain() {
    advanceAttempt();
    setPromptVariant("normal");
    setElapsed(0);
    setFrozenSeconds(0);
    capturedFramesRef.current = [];
    setHasCapturedFrames(false);
    setMicBlocked(false);
    setStage("idle");
  }
  // "Did Knowie mishear you?" — a correction, not a genuine retry: resets
  // to a clean Idle with adapted copy, but consumes no hint and does not
  // advance `attempt`, so the same scripted outcome is still what resolves
  // once the student tries again. Available in both voice and text mode
  // (Figma node 14030:16666 shows the link on the wrong-result sheet even
  // in text mode) — never touches inputMode, so it lands back on Idle in
  // whichever mode the student was already using; the voice-specific
  // resets below (elapsed/capturedFrames/micBlocked) are just harmless
  // no-ops when in text mode.
  function disputeMishear() {
    setPromptVariant("mishear");
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
    recordTermOutcome("tempo", "skipped");
    router.push("/term-4");
  }
  // Shared by both the Reveal sheet's "Got it - Continue" and the
  // (currently unreached, see TERM_3_OUTCOME_BY_ATTEMPT) correct-result
  // sheet's "Continue" — `stage` at the moment this fires tells us which
  // one just resolved, so the recorded outcome reflects what actually
  // happened rather than assuming a single fixed path.
  function handleContinue() {
    if (stage === "reveal") {
      recordTermOutcome("tempo", "revealed");
    } else {
      recordTermOutcome("tempo", attempt > 0 ? "hinted" : "unaided");
    }
    router.push("/term-4");
  }

  // Text mode swaps the transcript-echo card's content: instead of the
  // scripted "what I heard" line, it shows the real typed answer — same
  // HighlightCard, different eyebrow/content. Voice mode is unchanged.
  const transcriptEyebrow = inputMode === "text" ? "What you wrote:" : "What I heard:";
  function transcriptFor(index: number) {
    return inputMode === "text" ? typedAnswer : TRANSCRIPT_BY_ATTEMPT[index];
  }

  if (stage === "hint") {
    const index = Math.min(attempt, HINT_BY_ATTEMPT.length - 1);
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-5">
          {/* Unlike the wrong-result sheet (where this same card stays at
              normal opacity, node 14030:16666), the hint screen dims it to
              match the surrounding bubble thread (Figma node 14030:16746). */}
          <HighlightCard eyebrow={transcriptEyebrow} dimmed>
            {transcriptFor(index)}
          </HighlightCard>
          <MascotBubble pose="approving" alt="Noe, approving" text={WRONG_REPLY_BY_ATTEMPT[index]} dimmed />
          <MascotBubble pose="giggling" alt="Noe, giggling" text={HINT_BY_ATTEMPT[index]} />
        </div>

        {/* Hint reveals inline in the thread, sheet dismisses, bottom bar
            becomes "Try again" (primary) + "Skip to next question" (link)
            only — same pattern as term-2's hint screen (Figma node
            13900:26321), skip control updated per feedback.md [L] "Skip
            must not read as exiting the whole session". No separate "Type
            instead" here: the retry lands back on Idle, whose own
            mode-switch pill already offers it. No mic circle shown here,
            this is a dedicated "waiting for the retry tap" moment. */}
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

  if (stage === "reveal") {
    const index = Math.min(attempt, TRANSCRIPT_BY_ATTEMPT.length - 1);
    return (
      <div className="relative flex flex-1 flex-col px-4">
        <div className="flex flex-1 flex-col gap-5 pt-5">
          <HighlightCard eyebrow={transcriptEyebrow}>{transcriptFor(index)}</HighlightCard>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={gentle}
          >
            {/* Voice-only — mishearing is a voice/STT-specific failure mode,
                so it can't apply to a typed answer. */}
            {inputMode === "voice" && (
              <TextLinkButton onClick={disputeMishear} className="mx-auto block">
                Did Knowie mishear you?
              </TextLinkButton>
            )}
            <div className={inputMode === "voice" ? "mt-5" : undefined}>
              <MascotBubble pose="giggling" alt="Noe, giggling" text={REVEAL_TEXT} />
            </div>
          </motion.div>
        </div>

        {/* Terminal — no hints/retries left, so no skip icon and only the
            single "Got it - Continue" button, matching the Figma frame
            (distinct from the wrong/hint bottom bars, both of which do
            offer skip). */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={sheet}
          className="absolute inset-x-0 bottom-0 z-20 rounded-t-[32px] border-t border-border-default bg-background-surface"
        >
          <div className="mx-auto mt-2 h-1 w-8 rounded-full bg-background-stacking" />
          <div className="flex items-center gap-2 px-7 pt-3">
            <img src="/images/revealed-answer-icon.svg" alt="" aria-hidden className="h-8 w-8 shrink-0" />
            <p className="flex-1 font-display text-[29.025px] leading-[29.025px] font-black text-brand-bold">
              We&apos;ll do it next time!
            </p>
            <ReactionButtons />
          </div>
          {whyRevealed && (
            <div className="px-4 pb-2 mt-5">
              <WhyExplanation variant="reveal">{WHY_EXPLANATION}</WhyExplanation>
            </div>
          )}
          <BottomCta className="flex gap-1">
            {whyRevealed ? (
              <motion.button
                whileTap={{ scale: 0.94 }}
                transition={snappy}
                onClick={handleContinue}
                className="relative flex h-[58px] w-full items-center justify-center rounded-full bg-interactive-primary px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]"
              >
                <span className="font-display text-[18px] font-semibold text-interactive-on-primary">
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
                  className="relative flex h-[58px] flex-1 items-center justify-center rounded-full bg-interactive-primary px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]"
                >
                  <span className="font-display text-[18px] font-semibold text-interactive-on-primary">
                    Got it - Continue
                  </span>
                </motion.button>
              </>
            )}
          </BottomCta>
        </motion.div>
      </div>
    );
  }

  if (stage === "result") {
    if (outcome === "wrong") {
      const index = Math.min(attempt, TRANSCRIPT_BY_ATTEMPT.length - 1);
      return (
        <div className="relative flex flex-1 flex-col px-4">
          <div className="flex flex-col gap-5 pt-5">
            <HighlightCard eyebrow={transcriptEyebrow}>{transcriptFor(index)}</HighlightCard>
            {/* Voice-only — mishearing is a voice/STT-specific failure mode,
                so it can't apply to a typed answer. */}
            {inputMode === "voice" && (
              <TextLinkButton onClick={disputeMishear} className="mx-auto block">
                Did Knowie mishear you?
              </TextLinkButton>
            )}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={gentle}
            >
              <MascotBubble
                pose="approving"
                alt="Noe, approving"
                text={WRONG_REPLY_BY_ATTEMPT[index]}
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={sheet}
            className="absolute inset-x-0 bottom-0 z-20 rounded-t-[32px] border-t border-border-default bg-coral-subtle"
          >
            <div className="mx-auto mt-2 h-1 w-8 rounded-full bg-background-stacking" />
            <div className="flex items-center gap-2 px-7 pt-3">
              <img src="/images/incorrect-answer-icon.svg" alt="" aria-hidden className="h-8 w-8 shrink-0" />
              <p className="flex-1 font-display text-[26px] font-black text-coral-bold">
                You are closer!
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
                className="relative flex h-[58px] flex-1 items-center justify-center rounded-full bg-coral-bold px-6 shadow-[inset_0px_-4px_0px_0px_rgba(0,0,0,0.15)]"
              >
                <span className="font-display text-[18px] font-semibold text-coral-on-bold">
                  Try again
                </span>
              </motion.button>
            </BottomCta>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="relative flex flex-1 flex-col px-4">
        {/* Reuses term-1's correct/celebration pattern exactly — only the
            dimmed question echo (persistent, via useMascotBubble above)
            and this new answer bubble, same as term-1's Result. The
            wrong/hint history isn't carried over into this view. */}
        <div className="pt-5">
          {inputMode === "text" ? (
            <HighlightCard eyebrow="What you wrote:">{typedAnswer}</HighlightCard>
          ) : (
            <HighlightCard eyebrow="What I heard:">{WHAT_I_HEARD_CORRECT}</HighlightCard>
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
  // Hearing-back are voice-only, never entered here; Result/Hint/Reveal
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

  const micStage = stage as MicStage;
  const micDisabled = micStage === "sending" || micStage === "checking";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4">
        <div className="flex flex-1 flex-col items-center pt-[60px]">
          {/* Instant state swap, deliberately — no crossfade/layout animation
              between mic states (same fix already applied in term-1/2: it
              should read as a state change, not an animation). Only
              animations left here are continuous ones *within* a single
              state: the spinner's rotation, the checking-it pulse, and the
              live waveform's per-frame smoothing. */}
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
      />

      <SkipConfirmSheet
        open={skipConfirmOpen}
        onSkip={handleSkip}
        onCancel={() => setSkipConfirmOpen(false)}
      />
    </div>
  );
}

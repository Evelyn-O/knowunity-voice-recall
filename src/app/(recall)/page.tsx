"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { motion } from "motion/react";
import { useMascotBubble, useRecallStep } from "@/lib/recall-flow-context";
import { gentle, snappy } from "@/lib/motion";

/**
 * Curved dotted path connectors — reproduced from Figma's own "Group 1"/
 * "Group 2" assets (3 circles each, white/10% opacity, sinuous curve), not
 * a straight line. "Rightward" curves left→right as it descends (used
 * before a right-offset node); "Leftward" curves right→left (used before a
 * left-aligned node) — alternates Rightward/Leftward/Rightward matching
 * Figma's own connector assignment across the 4-node path.
 */
function ConnectorRightward({ className = "" }: { className?: string }) {
  return (
    <svg width="19" height="40" viewBox="0 0 19 40" fill="none" aria-hidden className={className}>
      <circle cx="4" cy="4" r="4" fill="white" fillOpacity="0.1" />
      <circle cx="13" cy="19" r="4" fill="white" fillOpacity="0.1" />
      <circle cx="15" cy="36" r="4" fill="white" fillOpacity="0.1" />
    </svg>
  );
}

function ConnectorLeftward({ className = "" }: { className?: string }) {
  return (
    <svg width="19" height="41" viewBox="0 0 19 41" fill="none" aria-hidden className={className}>
      <circle cx="15" cy="4" r="4" fill="white" fillOpacity="0.1" />
      <circle cx="6" cy="19" r="4" fill="white" fillOpacity="0.1" />
      <circle cx="4" cy="37" r="4" fill="white" fillOpacity="0.1" />
    </svg>
  );
}

/** A locked path node — test-path-dissabled.svg already bakes in the grey
 * fill, opacity-15 icon, lock overlay, AND the correct-thickness ring
 * border (rx=55, stroke-width=8, white/10%) at its native 118x118, so it
 * renders directly with no extra wrapper border (a wrapper border here
 * would double the ring thickness — see CLAUDE.md's own fix note). */
function LockedNode({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <img src="/images/test-path-dissabled.svg" alt="" aria-hidden className="h-[118px] w-[118px]" />
      <p className="font-display text-sm font-semibold text-white">{label}</p>
    </div>
  );
}

/**
 * Exam plan path view (Figma node 14030:17149, "Pre-step-0-exam-plan") —
 * the new lead-in screen a viewer lands on before the mocked quiz question
 * and, from there, the Voice Recall entry fork. This is now the app's true
 * root/start screen (`/`) — previously the entry fork lived here and this
 * screen was at `/path`; they've swapped so a fresh visit shows the path
 * first. The entry fork moved to `/entry` (see (recall)/entry/page.tsx);
 * every internal reference to "the first-time entry fork" now points at
 * `/entry`, not `/` — see getEntryForkRoute in recall-flow-context.tsx,
 * the one place that's decided. No TopBar (this screen has no exit X, no
 * progress bar, no streak chip in its own Figma frame — currentStep: null
 * hides it, same pattern /streak and /summary already use) and no
 * MascotBubble (nothing in the frame uses it).
 *
 * The "9:41 / wifi / battery" status row seen in Figma isn't rendered
 * here — that's the app's single global `DesktopFakeStatusBar`
 * (app/layout.tsx), not per-screen content.
 *
 * Only "Music Theory" is real/tappable — "Harmony I", "Harmony II", and
 * "Harmony III" are locked per the brief (not a full quiz mockup, single
 * mocked question only) and stay inert, not buttons. Figma's updated file
 * (adding the 4th node) has nodes 2 and 3 both literally labeled "Harmony
 * II" — a copy-paste leftover confirmed with Evelyn, not an intentional
 * duplicate; the real sequence is Harmony I → Harmony II → Harmony III.
 *
 * The hero card is a sibling of the scrollable node list, not inside it —
 * simplest way to keep it pinned at the top while the path scrolls
 * underneath, no `position: sticky` edge cases to account for.
 */
export default function PathPage() {
  const router = useRouter();

  const onExit = useCallback(() => {}, []);
  useRecallStep({ currentStep: null, totalSteps: 1, onExit });
  useMascotBubble(null);

  function goToQuiz() {
    router.push("/quiz");
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Hero card — gradient is Figma-sourced (node 14030:17152's own
          fill), not an existing named token; it's a one-off specific to
          this card, same reasoning globals.css's own
          .desktop-frame-backdrop gradient already used for a one-off
          Tailwind-arbitrary-value gradient that didn't translate cleanly. */}
      <div className="shrink-0 bg-background-page px-4 pt-4">
        <div
          className="flex w-full flex-col gap-3.5 rounded-[26px] px-[18px] pb-[18px] pt-3.5"
          style={{
            backgroundImage:
              "linear-gradient(133deg, rgb(74, 48, 184) 6.6667%, rgb(43, 26, 102) 43.333%, rgb(58, 26, 110) 73.333%)",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full bg-background-inverse px-4">
              <img src="/images/energy-icon-path.svg" alt="" aria-hidden className="h-5 w-5" />
              <span className="font-sans text-sm font-semibold text-background-page">20</span>
            </div>
            <div className="flex-1" />
            <button type="button" aria-label="Settings" className="flex h-12 w-12 items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background-inverse">
                <img src="/images/tool-gear-icon-path.svg" alt="" aria-hidden className="h-5 w-5" />
              </div>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <img src="/images/music-icon.svg" alt="" aria-hidden className="h-8 w-8 shrink-0" />
            <p className="font-display text-[30px] font-semibold leading-9 text-white">
              Music theory
            </p>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-1 shrink-0">
              <path
                d="M6 9l6 6 6-6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <img src="/images/calendar-icon.svg" alt="" aria-hidden className="h-[18px] w-[18px]" />
              <span className="font-sans text-sm font-medium text-text-primary">In 1 day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <img src="/images/grade-goal.svg" alt="" aria-hidden className="h-[18px] w-[18px]" />
              <span className="font-sans text-sm font-medium text-text-primary">Grade Goal: 2</span>
            </div>
          </div>

          <img
            src="/images/progressIndicator-path.svg"
            alt=""
            aria-hidden
            className="h-6 w-full"
          />

          <div className="flex w-full items-center justify-between rounded-3xl bg-background-stacking px-4 py-3">
            <span className="font-sans text-sm font-semibold text-text-primary">
              Notes, Pitch &amp; Rhythm
            </span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M4 5h12M4 10h12M4 15h8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                className="text-text-primary"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-[110px]">
        <div className="flex flex-col items-center gap-5 pt-[18px]">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            transition={snappy}
            onClick={goToQuiz}
            className="flex flex-col items-center gap-3"
          >
            <img
              src="/images/test-path-enabled-music.svg"
              alt=""
              aria-hidden
              className="h-[118px] w-[118px]"
            />
            <p className="font-display text-sm font-semibold text-white">
              Music
              <br />
              Theory
            </p>
          </motion.button>

          <ConnectorRightward className="ml-[52px]" />
          <div className="ml-[59px]">
            <LockedNode label="Harmony I" />
          </div>

          <ConnectorLeftward className="mr-[52px]" />
          <LockedNode label="Harmony II" />

          <ConnectorRightward className="ml-[52px]" />
          <div className="ml-[59px]">
            <LockedNode label="Harmony III" />
          </div>
        </div>
      </div>

      {/* Bottom nav — decorative except the path tab (this screen); the
          other 4 icons have no destination in this prototype. The avatar
          icon has been through a few sizing passes: 16px (a "measured
          effective glyph size" theory, flagged as too small), then 32px to
          exactly match the other four (flagged as too big), settled on
          28px — a deliberate step down from the other four's 32px box, not
          a mistake to "fix" back to matching. */}
      {/* Pure opacity fade, no y-offset — fires on route mount, and a
          vertical offset here competes with the shared layout's own
          horizontal screen-transition slide instead of complementing it. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={gentle}
        className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-background-page px-4 pb-[env(safe-area-inset-bottom)] pt-2"
      >
        <button type="button" aria-label="Chat" className="flex items-center justify-center p-2">
          <img src="/images/navigation-chat-icon.svg" alt="" aria-hidden className="h-8 w-8" />
        </button>
        <button type="button" aria-label="Search" className="flex items-center justify-center p-2">
          <img src="/images/navigation-magnifier-icon.svg" alt="" aria-hidden className="h-8 w-8" />
        </button>
        <button type="button" aria-label="Path" className="flex items-center justify-center p-2">
          <img src="/images/navigation-path-icon.svg" alt="" aria-hidden className="h-8 w-8" />
        </button>
        <button type="button" aria-label="Quizzes" className="flex items-center justify-center p-2">
          <img src="/images/navigation-book-icon.svg" alt="" aria-hidden className="h-8 w-8" />
        </button>
        <button type="button" aria-label="Profile" className="flex items-center justify-center p-2">
          <img src="/images/navigation-avatar-icon.svg" alt="" aria-hidden className="h-7 w-7" />
        </button>
      </motion.div>
    </div>
  );
}

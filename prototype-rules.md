# Prototype Rules — Knowunity Voice Recall

## What this is

A mobile prototype of a voice active-recall step inside Knowunity's Exam Plan.
After revising, a student explains a key term out loud; the character "Knowie"
responds in text. It deploys to Vercel and gets tested by real people on their
phones in Module 5.

Built with web tech, but it should look, feel, and behave like a native mobile
app, in dark mode. Every rule below serves that goal. This is a *test prototype* —
the recall intelligence is mocked, not real (see "The recall loop").

## Visual values: one source of truth

Every color, type, spacing, and radius value comes from `design.md` (extracted
from the Knowunity brand file). Do not define, substitute, or approximate visual
values here or invent your own. If a value you need isn't in `design.md`, ask —
don't guess.

Dark mode only. The UI stays quiet and confident; the content — the term, Knowie's
reply, the student's progress — carries the screen. No gradients, decorative
illustrations, or background patterns unless the Figma design includes them.

Match the committed Figma frames. Don't add visual elements, icons, or styling
that isn't in the design. When in doubt, simpler.

## Making it feel like a real phone app

The gap between "a website on a phone" and "an app" is mostly these:

- **Safe areas.** Use CSS `env(safe-area-inset-*)` so content never sits under the
  notch, status bar, or home indicator. Target a full-screen "Add to Home Screen"
  experience with no browser chrome.
- **Navigation.** Back is a left chevron, top-left, on pushed screens. Sheets slide
  up from the bottom with a small grabber handle. Any persistent bottom nav stays
  fixed and visible.
- **Transitions.** Push (drilling in) slides from the right. Sheets animate up with
  a gentle spring. Avoid jarring pop-in: fade or slide things in and out so they
  read as intentional. Easing detail lives in `motion-guide.md`.
- **Touch feedback.** Every interactive element reacts to a press — a subtle scale
  or opacity change on buttons, a light highlight on cards and list items. This
  matters even more here, because the mic is the most-tapped control in the whole
  experience.
- **Scrolling.** Vertical by default. Horizontal scroll only for deliberate row
  content (a term carousel, a chip row). Never let whole pages scroll sideways.

## The recall loop (the heart of this prototype)

Read this before building the recall step. It's what makes this different from a
normal screen build.

**Mock the intelligence — never build the real thing.** No real speech-to-text,
no audio recording, no model or API call. Hardcode 2–3 example terms, each with a
canned "transcript" of what the student supposedly said and a canned result (and
hint). Tapping or holding the mic just advances the mocked flow. Add a short
simulated "thinking" delay (≈1–1.5s) so the processing state reads as real. Keep it
deterministic so it behaves identically every time a tester runs it.

**Knowie replies in text, always.** Never add text-to-speech, audio output, or a
talking avatar. The student speaks; Knowie writes back. That asymmetry is the
concept — protect it.

**The recording affordance.** Build it to match the committed Figma design. Don't
assume hold-to-talk vs. tap-to-toggle — whichever the designer chose is correct.
Whatever it is, make the active/recording state unmistakable, because a student
needs to know the mic is live.

**The states the loop moves through.** At minimum the core loop should read
clearly: idle → recording → processing → result (e.g. got it / partial + hint /
missed + answer). Build the states the committed flow actually needs — if the
design includes say-it-back, multiple hint levels, streaks, or anything else, build
those too. This is a floor for legibility, not a cap on the design.

**The can't-speak text fallback.** On every recall screen, a student who can't talk
right now must be able to switch to typing in one tap, and the step must work end
to end by typing. Never leave the fallback as a dead end.

**First run vs. returning.** On a first encounter, include the intro /
mic-permission primer from the design. A returning student skips to the prompt.
Build whichever your flow calls for.

**The summary points forward.** The end-of-session summary shouldn't just report a
score. It should set up the next loop — repeat the terms just missed, re-test before
the exam, come back later. Recall sticks through repetition over time, so a dead-end
"you're ready" screen is the weak version.

## Screen states

States are led by the design, not a fixed checklist. Build the states your
committed flow needs to be understood and tested. Beyond the voice states above,
think about the realistic moments your concept creates — a first-time view vs. a
return, a partial answer, the typed-fallback version of a screen, the summary. Build
the ones that matter for *your* flow; don't manufacture states the design doesn't
call for, and don't skip the ones a tester will obviously hit.

## Layout and sizing

Mobile only. 390px viewport width, full height. No desktop breakpoints or
responsive layouts — this is a phone app, dark mode.

Touch targets at least 44×44px. If a control looks smaller in the design, keep the
visual size but extend the invisible hit area to 44px. Keep at least 8px between
adjacent targets so the mic, skip, and fallback controls don't get mis-tapped.

## Content and data

Use realistic study content, not Lorem ipsum — testers engage far more with
believable material.

- **Example terms** should be real and recognizable across subjects: e.g.
  "photosynthesis," "the causes of World War I," "Pythagoras' theorem," "supply and
  demand." Pair each with a believable canned transcript and a result/hint.
- **Knowie's replies** are written, short, and encouraging — friendly and clear,
  never robotic or harsh, even on a miss. Match Knowie's tone in the brief.
- **Progress** is realistic ("you recalled 4 of 5"), not everything perfect.
- **Images** (mascot, avatars) come from `/public/images/`, referenced as
  `/images/[filename]`. No placeholder URLs, external URLs, or made-up paths — only
  files that actually exist in the folder.

## Accessibility baseline

Not optional polish — part of building something real people use, in dark mode.

- **Contrast.** Body text meets 4.5:1 against its (dark) background; large text
  meets 3:1. Watch the term, Knowie's reply, and hint text especially.
- **Focus states.** Every interactive element has a visible focus state for keyboard
  and assistive-tech users.
- **Alt text.** Meaningful images (a mascot pose that conveys a state) get
  descriptive alt text; purely decorative ones get empty alt.
- **Never color alone.** State must read without relying only on color. The
  recording state needs a shape, motion, or label change, not just a hue shift — and
  correct / partial / missed results must be distinguishable beyond red/green.
- Text stays readable at the default system size without zooming.

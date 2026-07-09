# Motion Guide — Knowunity Voice Recall

Motion is what makes this read as a real app instead of a static mockup. You don't
hand-write animations: you use **Motion** (the library formerly called Framer
Motion) and reach for the presets and recipes below. Keep motion quiet and
purposeful, it should confirm what just happened, not show off.

## The library

- Install: `npm install motion`. Import from `motion/react`.
- In Next.js (App Router) any file using Motion needs `"use client"` at the top.
- You mostly use `<motion.div>` with `initial` / `animate` / `exit` / `transition`,
  the gesture props (`whileTap`, `whileHover`, `drag`), `<AnimatePresence>` for
  enter/exit, and `layout` for size/position changes. Motion handles the spring
  physics, so never reach for raw CSS keyframes or hand-rolled easing.

## Transition presets (reuse these, don't invent new ones)

Define these once and reference them everywhere so the whole prototype feels
consistent:

```js
// motion presets
export const gentle = { type: "spring", stiffness: 260, damping: 30 }; // most UI
export const snappy = { type: "spring", stiffness: 400, damping: 28 }; // taps, toggles
export const sheet  = { type: "spring", stiffness: 300, damping: 34 }; // bottom sheets
export const soft   = { duration: 0.22, ease: [0.22, 1, 0.36, 1] };    // fades, simple moves
```

- **Feedback** (a tap responding) should feel instant: ~150–250ms, use `snappy`.
- **Transitions** (a screen or sheet arriving) can be a touch slower: use `gentle`
  or `sheet`.
- When in doubt, `gentle`.

## Recipes for this flow

**Mic press (the most-tapped control).** Give it real tactile feedback:
`whileTap={{ scale: 0.94 }}` with `snappy`. The press should feel immediate.

**Recording / listening state.** A calm looping pulse so the student knows the mic
is live: animate `scale` between 1 and ~1.08 (or opacity on a ring) on a repeating
transition (`repeat: Infinity, repeatType: "reverse", duration: 1`). One pulse,
not a light show.

**Processing ("thinking").** A short, honest wait. Three dots fading in sequence,
or a gentle shimmer. Keep it ~1–1.5s (matches the mocked delay) and don't make it
look like a real network call you don't have.

**Knowie's reply appearing.** Wrap it in `<AnimatePresence>`; the message fades and
slides up a little (`initial={{ opacity: 0, y: 8 }}` → `animate={{ opacity: 1, y: 0 }}`)
with `gentle`. This is the moment of payoff, let it land cleanly.

**Result reveal (got it / partial / missed).** A small spring entrance on the result
card with `gentle`. Distinguish states with shape/icon/copy, not motion, the
animation is the same; the content differs.

**The can't-speak text fallback (bottom sheet).** Slide up from the bottom with
`sheet`, `initial={{ y: "100%" }}` → `animate={{ y: 0 }}`, exit back down. Add a
grabber handle. Make it feel like a native sheet, not a page swap.

**End-of-session summary.** Stagger the lines in so it feels composed:
`staggerChildren: 0.06` on a parent variant, each child a small fade-and-rise.
A subtle, earned moment, not confetti.

**Screen-to-screen.** Push transitions slide in from the right; going back slides
out. Keep these short (`soft` or `gentle`) so the flow feels quick to tap through.

## Rules that keep it feeling native

- **Animate only `transform` and `opacity`** (scale, x, y, rotate). Never animate
  `width`, `height`, `top`, or `left`, that's what causes jank. Use `layout` if a
  size genuinely needs to change.
- **Respect reduced motion.** Read `useReducedMotion()` and drop to simple fades
  (or no motion) when it's true. Some testers will have it on.
- **Keep it interruptible and fast.** A student tapping quickly shouldn't wait on
  animations. Short durations, springs that settle quickly.
- **One thing moving at a time** in a given moment. Motion should direct attention,
  not scatter it.

## What NOT to animate

- The whole screen bouncing or sliding on every state change.
- Anything looping in the background while the student is trying to read or speak.
- Colors as the only signal for correct / partial / missed (animation and color
  both fail colorblind users, use shape, icon, and copy).
- Marketing-style flourishes: glowing borders, particle effects, parallax, 3D card
  tilts. This is a focused study tool, not a landing page.

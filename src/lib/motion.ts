import type { Transition } from "motion/react";

/**
 * Shared transition presets — see motion-guide.md. Reuse these, don't
 * invent new ones or hand-write easing/keyframes.
 */
export const gentle: Transition = { type: "spring", stiffness: 260, damping: 30 };
export const snappy: Transition = { type: "spring", stiffness: 400, damping: 28 };
export const sheet: Transition = { type: "spring", stiffness: 300, damping: 34 };
export const soft: Transition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] };

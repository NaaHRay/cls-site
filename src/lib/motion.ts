// Motion constants from the design system's Motion section, in the units each engine wants.
import type { Transition } from "motion/react";

export const DUR = { instant: 0.1, quick: 0.18, base: 0.32, slow: 0.6, page: 0.9 }; // seconds

export const EASE = {
  page: [0.2, 0.7, 0.2, 1] as const, // everything that enters or grows
  leave: [0.4, 0, 1, 1] as const, // everything that exits, at half the entering duration
  glow: [0.45, 0, 0.2, 1] as const, // glows and halos
};

// Springs. "soft" for things arriving; "hover" for pointer feedback (a little give, no wobble).
export const SPRING = {
  soft: { type: "spring", stiffness: 140, damping: 22, mass: 0.9 } satisfies Transition,
  hover: { type: "spring", stiffness: 380, damping: 26 } satisfies Transition,
  magnet: { type: "spring", stiffness: 220, damping: 18, mass: 0.6 } satisfies Transition,
};

// Entrance travel: the design system allows 16px, never more than 24px.
export const RISE = 20;

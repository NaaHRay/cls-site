import { useState, type PointerEvent } from "react";
import { useReducedMotion, useSpring, type MotionStyle } from "motion/react";
import { SPRING } from "@/lib/motion";

// Card hover: a 2px lift and a slight tilt towards the pointer, on springs, so cards feel
// like paper being picked up. Also lifts on keyboard focus inside the card. Still under reduced motion.
export function useTilt(maxDeg = 3) {
  const still = useReducedMotion();
  const [hot, setHot] = useState(false);
  const rx = useSpring(0, SPRING.magnet);
  const ry = useSpring(0, SPRING.magnet);
  const y = useSpring(0, SPRING.hover);

  const on = () => {
    setHot(true);
    y.set(-2);
  };
  const off = () => {
    setHot(false);
    y.set(0);
    rx.set(0);
    ry.set(0);
  };

  return {
    hot,
    style: (still ? {} : { rotateX: rx, rotateY: ry, y, transformPerspective: 900 }) as MotionStyle,
    handlers: {
      onPointerEnter: on,
      onPointerLeave: off,
      onFocus: on,
      onBlur: off,
      onPointerMove: (e: PointerEvent<HTMLElement>) => {
        if (still || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5; // -0.5 … 0.5
        const py = (e.clientY - r.top) / r.height - 0.5;
        ry.set(px * maxDeg * 2);
        rx.set(-py * maxDeg * 2);
      },
    },
  };
}

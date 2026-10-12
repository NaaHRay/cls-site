import { useState, type PointerEvent } from "react";
import { Link } from "react-router";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import LetterSwapPingPong from "@/components/fancy/text/letter-swap-pingpong-anim";
import { SPRING } from "@/lib/motion";

type Props = {
  /** Sentence case; CSS sets the capitals. */
  children: string;
  /** filled: burgundy on light grounds, white on black and burgundy (picked by the nearest data-theme). */
  variant?: "filled" | "secondary";
  arrow?: boolean;
  /** Internal path ("/sub-clubs") or in-page anchor ("#clubs"); omit for a <button>. */
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

const MotionLink = motion.create(Link);
const PULL = 0.22; // share of the pointer's offset the button follows
const MAX_PULL = 6; // px

// The arrow leaves through the top-right corner and a fresh one arrives from the bottom-left.
function Arrow({ hot }: { hot: boolean }) {
  const path = <path d="M3 9L9 3M4 3h5v5" />;
  return (
    <span className="relative inline-block w-3 h-3 overflow-hidden" aria-hidden="true">
      <motion.svg viewBox="0 0 12 12" className="absolute inset-0" animate={{ x: hot ? 14 : 0, y: hot ? -14 : 0 }} transition={SPRING.hover}>
        {path}
      </motion.svg>
      <motion.svg viewBox="0 0 12 12" className="absolute inset-0" initial={false} animate={{ x: hot ? 0 : -14, y: hot ? 0 : 14 }} transition={SPRING.hover}>
        {path}
      </motion.svg>
    </span>
  );
}

// The call to action. One filled button per screen.
export default function Button({ children, variant = "filled", arrow, to, onClick, disabled, className = "" }: Props) {
  const still = useReducedMotion();
  const [hot, setHot] = useState(false);

  // Magnetic pull towards the pointer, plus the 2px lift, on one spring each.
  const mx = useSpring(useMotionValue(0), SPRING.magnet);
  const my = useSpring(useMotionValue(0), SPRING.magnet);
  const lift = useSpring(0, SPRING.hover);
  const y = useTransform(() => my.get() + lift.get());

  const on = () => {
    setHot(true);
    lift.set(-2);
  };
  const off = () => {
    setHot(false);
    lift.set(0);
    mx.set(0);
    my.set(0);
  };
  const follow = (e: PointerEvent<HTMLElement>) => {
    if (still || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const clamp = (v: number) => Math.max(-MAX_PULL, Math.min(MAX_PULL, v));
    mx.set(clamp((e.clientX - r.left - r.width / 2) * PULL));
    my.set(clamp((e.clientY - r.top - r.height / 2) * PULL));
  };

  const motionProps = {
    className: `btn btn-${variant} ${className}`,
    style: still ? undefined : { x: mx, y },
    whileTap: still ? undefined : { scale: 0.97 },
    transition: SPRING.hover,
    onPointerEnter: on,
    onPointerLeave: off,
    onPointerMove: follow,
    onFocus: on,
    onBlur: off,
    onClick,
  };
  const body = (
    <>
      {still ? children : <LetterSwapPingPong label={children} active={hot} staggerDuration={0.018} />}
      {arrow && (still ? <Arrow hot={false} /> : <Arrow hot={hot} />)}
    </>
  );

  if (to?.startsWith("#")) return <motion.a href={to} {...motionProps}>{body}</motion.a>;
  if (to) return <MotionLink to={to} aria-disabled={disabled || undefined} {...motionProps}>{body}</MotionLink>;
  return <motion.button type="button" disabled={disabled} {...motionProps}>{body}</motion.button>;
}

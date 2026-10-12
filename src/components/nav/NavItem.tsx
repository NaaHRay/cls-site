import { useState } from "react";
import { NavLink } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import LetterSwapPingPong from "@/components/fancy/text/letter-swap-pingpong-anim";
import { DUR, EASE, SPRING } from "@/lib/motion";

type Props = {
  to: string;
  label: string;
  onNavigate?: () => void;
  /** Links sharing a markId pass the current-page mark between them. */
  markId?: string;
  className?: string;
};

// One bar link. Hover or focus: the capitals roll to a second copy and a 1px rose underline
// draws in from the left (320ms). The current page keeps a rose mark that slides between links
// when the page changes (shared layoutId), so the bar shows where you came from.
export default function NavItem({ to, label, onNavigate, markId = "bar", className = "" }: Props) {
  const still = useReducedMotion();
  const [hot, setHot] = useState(false);
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onNavigate}
      onPointerEnter={() => setHot(true)}
      onPointerLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      className={`relative inline-flex py-2 text-ink no-underline ${className}`}
    >
      {({ isActive }) => (
        <>
          {still ? label : <LetterSwapPingPong label={label} active={hot} staggerDuration={0.02} transition={{ ...SPRING.hover }} />}
          <motion.span
            aria-hidden="true"
            className="absolute left-0 right-0 bottom-1 h-px bg-rose origin-left"
            initial={false}
            animate={{ scaleX: hot && !isActive ? 1 : 0 }}
            transition={{ duration: hot ? DUR.base : DUR.quick, ease: hot ? EASE.page : EASE.leave }}
          />
          {isActive && (
            <motion.span
              layoutId={still ? undefined : `nav-mark-${markId}`}
              aria-hidden="true"
              className="absolute left-0 right-0 bottom-1 h-px bg-rose"
              transition={SPRING.soft}
            />
          )}
        </>
      )}
    </NavLink>
  );
}

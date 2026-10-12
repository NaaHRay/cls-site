import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import Letter3DSwap from "@/components/fancy/text/letter-3d-swap";
import { SPRING } from "@/lib/motion";
import { useTilt } from "@/lib/useTilt";

type Props = { name: string; description: string; to: string; linkLabel?: string };

// One card per sub-club. All four share structure, padding, type and height.
// Hover: the card lifts and tilts, the rose rule draws out, the name flips letter by letter.
export default function SubClubCard({ name, description, to, linkLabel = "Explore" }: Props) {
  const still = useReducedMotion();
  const { hot, style, handlers } = useTilt();
  return (
    <motion.article
      {...handlers}
      style={style}
      className="lift bg-ground-raised border border-line rounded-sm py-6 px-5 flex flex-col gap-4 min-w-0 h-full"
    >
      <motion.span
        className="block w-6 h-px bg-rose origin-left"
        aria-hidden="true"
        animate={{ scaleX: hot && !still ? 2.5 : 1 }}
        transition={SPRING.soft}
      />
      {still ? (
        <h3 className="t-h3">{name}</h3>
      ) : (
        <Letter3DSwap as="h3" mainClassName="t-h3" rotateDirection="top" staggerDuration={0.025}>
          {name}
        </Letter3DSwap>
      )}
      <p className="t-body-sm text-ink-muted">{description}</p>
      <Link to={to} className="t-label text-leaf-text underline underline-offset-4 mt-auto self-start inline-flex items-center gap-2 focus-visible:outline-offset-4">
        {linkLabel}
        <motion.span aria-hidden="true" animate={{ x: hot && !still ? 4 : 0 }} transition={SPRING.hover}>
          &rarr;
        </motion.span>
        <span className="sr-only">: {name}</span>
      </Link>
    </motion.article>
  );
}

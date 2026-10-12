import { useRef, type ReactNode } from "react";
import { motion, useInView, useReducedMotion, type Variants } from "motion/react";
import VerticalCutReveal from "@/components/fancy/text/vertical-cut-reveal";
import { EASE, RISE, SPRING } from "@/lib/motion";

// Content arriving as it scrolls into view: a soft spring rise from RISE px, once.
// A Reveal with `stagger` passes the timing on to its <Reveal.Item> children (60ms apart).
const item: Variants = {
  hidden: { opacity: 0, y: RISE },
  shown: { opacity: 1, y: 0, transition: { ...SPRING.soft, opacity: { duration: 0.6, ease: EASE.page } } },
};

type Props = { children: ReactNode; className?: string; stagger?: boolean; delay?: number };

export default function Reveal({ children, className, stagger, delay = 0 }: Props) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.25, margin: "0px 0px -8% 0px" }}
      variants={stagger ? { shown: { transition: { staggerChildren: 0.06, delayChildren: delay } } } : item}
      transition={stagger ? undefined : { delay }}
    >
      {children}
    </motion.div>
  );
}

Reveal.Item = function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
};

// A heading whose words rise out of a cut, once, when it scrolls into view (Fancy vertical-cut-reveal).
export function CutReveal({ text, className, center }: { text: string; className?: string; center?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const still = useReducedMotion();
  if (still) return <span className={className}>{text}</span>;
  return (
    <span ref={ref} className={`block ${className ?? ""}`}>
      {inView ? (
        <VerticalCutReveal
          splitBy="words"
          staggerDuration={0.08}
          transition={SPRING.soft}
          wordLevelClassName="pb-[0.12em]"
          containerClassName={center ? "justify-center" : undefined}
        >
          {text}
        </VerticalCutReveal>
      ) : (
        <span className="opacity-0">{text}</span>
      )}
    </span>
  );
}

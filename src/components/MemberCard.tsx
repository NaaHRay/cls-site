import { motion, useReducedMotion } from "motion/react";
import { SPRING } from "@/lib/motion";
import { useTilt } from "@/lib/useTilt";

type Props = {
  name: string;
  role: string;
  portrait?: string;
  /** Chair or editor only; at most one per row. */
  signature?: boolean;
};

// An Editorial Board member. Portraits are 4:5, never tinted, cropped alike.
// Hover: the card lifts and tilts, the portrait eases in slightly inside its frame.
export default function MemberCard({ name, role, portrait, signature }: Props) {
  const still = useReducedMotion();
  const { hot, style, handlers } = useTilt(2.5);
  const zoom = { animate: { scale: hot && !still ? 1.04 : 1 }, transition: SPRING.soft };
  return (
    <motion.article
      {...handlers}
      style={style}
      className="lift bg-ground-raised border border-line rounded-sm p-4 flex flex-col gap-3 min-w-0"
    >
      <div className="aspect-[4/5] rounded-sm overflow-hidden bg-ground-inset">
        {portrait ? (
          <motion.img {...zoom} src={portrait} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <motion.div {...zoom} className="w-full h-full bg-ground-inset" aria-hidden="true" />
        )}
      </div>
      <p className="t-sub-sm">{name}</p>
      <p className="t-eyebrow text-ink-muted">{role}</p>
      {signature && <p className="t-signature text-[32px]! text-rose-text" aria-hidden="true">{name}</p>}
    </motion.article>
  );
}

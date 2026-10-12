// Fancy Components (MIT, Daniel Petho) — letter-swap-pingpong-anim.
// CLS changes: driven by an `active` prop so the parent link or button can trigger it on
// hover AND keyboard focus (the original listened to pointer hover only); lodash removed.
import { useEffect, useRef } from "react"
import { AnimationOptions, motion, stagger, useAnimate } from "motion/react"

interface TextProps {
  label: string
  /** Swap state. When omitted, the component swaps on its own pointer hover. */
  active?: boolean
  reverse?: boolean
  transition?: AnimationOptions
  staggerDuration?: number
  staggerFrom?: "first" | "last" | "center" | number
  className?: string
}

const LetterSwapPingPong = ({
  label,
  active,
  reverse = true,
  transition = { type: "spring", duration: 0.7 },
  staggerDuration = 0.03,
  staggerFrom = "first",
  className,
}: TextProps) => {
  const [scope, animate] = useAnimate()
  const swapped = useRef(false)

  const run = (on: boolean) => {
    if (swapped.current === on) return
    swapped.current = on
    const t = { ...transition, delay: stagger(staggerDuration, { from: staggerFrom }) }
    animate(".letter", { y: on ? (reverse ? "100%" : "-100%") : 0 }, t)
    animate(".letter-secondary", { top: on ? "0%" : reverse ? "-100%" : "100%" }, t)
  }

  useEffect(() => {
    if (active !== undefined) run(active)
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.span
      className={`inline-flex relative overflow-hidden ${className ?? ""}`}
      onHoverStart={active === undefined ? () => run(true) : undefined}
      onHoverEnd={active === undefined ? () => run(false) : undefined}
      ref={scope}
    >
      <span className="sr-only">{label}</span>
      {label.split("").map((letter, i) => (
        <span className="whitespace-pre relative flex" key={i} aria-hidden={true}>
          <motion.span className="relative letter" style={{ top: 0 }}>
            {letter}
          </motion.span>
          <motion.span className="absolute letter-secondary" style={{ top: reverse ? "-100%" : "100%" }}>
            {letter}
          </motion.span>
        </span>
      ))}
    </motion.span>
  )
}

export default LetterSwapPingPong

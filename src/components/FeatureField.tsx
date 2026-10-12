import { useEffect, useRef, type ReactNode } from "react";
import { useInView, useReducedMotion } from "motion/react";
import Button from "@/components/Button";
import { CutReveal } from "@/components/Reveal";
import { useGsap } from "@/lib/gsap";

type Props = {
  eyebrow: string;
  heading: string;
  level?: "h1" | "h2";
  children?: ReactNode; // up to two lines of supporting text
  cta: { label: string; to: string };
};

const ORBITS = [
  { cx: 480, cy: 270, rx: 560, ry: 200, rot: -18 },
  { cx: 520, cy: 250, rx: 360, ry: 260, rot: 32 },
  { cx: 470, cy: 260, rx: 440, ry: 150, rot: 12 },
];

// The burgundy field: the system's loudest moment. At most one per scroll-screen.
// Motion: the orbit lines draw themselves in as the field arrives (anime.js), then turn gently
// with the scroll, up to 10° (GSAP, smoothed scrub); the text block drifts slightly against them.
export default function FeatureField({ eyebrow, heading, level = "h2", children, cta }: Props) {
  const H = level;
  const root = useRef<HTMLElement>(null);
  const art = useRef<SVGSVGElement>(null);
  const inView = useInView(root, { once: true, amount: 0.3 });
  const still = useReducedMotion();

  useEffect(() => {
    if (!inView || still || !art.current) return;
    const lines = art.current.querySelectorAll("ellipse");
    let anim: { revert: () => void } | undefined;
    import("animejs").then(({ animate, svg, stagger }) => {
      anim = animate(svg.createDrawable(lines), {
        draw: ["0 0", "0 1"],
        duration: 2200,
        delay: stagger(220),
        ease: "outQuart",
      });
    });
    return () => anim?.revert();
  }, [inView, still]);

  useGsap(root, ({ gsap }, el) => {
    const scroll = { trigger: el, start: "top bottom", end: "bottom top", scrub: 1.4 };
    el.querySelectorAll<SVGGElement>(".orbit").forEach((g, i) => {
      gsap.fromTo(g, { rotation: -4 - i }, { rotation: 4 + i, svgOrigin: "480 260", ease: "none", scrollTrigger: scroll });
    });
    gsap.fromTo(".feature-copy", { y: 36 }, { y: -36, ease: "none", scrollTrigger: scroll });
  });

  return (
    <section
      ref={root}
      data-theme="dark"
      className="relative bg-ground-feature text-ink-on-feature min-h-[560px] flex items-center justify-center overflow-hidden"
    >
      <svg ref={art} className="absolute inset-0 w-full h-full" viewBox="0 0 960 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {ORBITS.map((o, i) => (
          <g key={i} className="orbit">
            <ellipse
              cx={o.cx}
              cy={o.cy}
              rx={o.rx}
              ry={o.ry}
              transform={`rotate(${o.rot} ${o.cx} ${o.cy})`}
              fill="none"
              stroke="var(--line-feature)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      </svg>
      <div className="feature-copy relative text-center max-w-text px-5 py-8 flex flex-col items-center">
        <p className="t-eyebrow mb-4">{eyebrow}</p>
        <H className="t-h1 text-ink-on-feature mb-5">
          <CutReveal text={heading} center />
        </H>
        {children && <p className="t-body max-w-[30rem] mb-6">{children}</p>}
        <Button to={cta.to} arrow>{cta.label}</Button>
      </div>
    </section>
  );
}

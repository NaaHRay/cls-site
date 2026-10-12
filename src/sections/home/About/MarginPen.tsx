import { useEffect, useRef } from "react";

// The ink line down the left margin of the stacked layouts (phone and reduced motion): the same blue pen
// line as the 3D diary, run vertically. It fills its parent (which must be `relative`).
//   draw="scroll": drawn as you scroll down the section, with a dot at its tip (phones)
//   draw="full":   shown fully drawn and still (reduced motion)
// Decoration only. The path is a gentle hand-drawn wobble, rebuilt when the section's height changes.
export default function MarginPen({ draw }: { draw: "scroll" | "full" }) {
  const svg = useRef<SVGSVGElement>(null);
  const path = useRef<SVGPathElement>(null);
  const head = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const host = svg.current!.parentElement!;
    const p = path.current!;
    let len = 1;
    let raf = 0;

    const build = () => {
      const h = host.offsetHeight;
      let d = "M 12 0";
      for (let y = 0; y < h; y += 90) d += ` C ${12 + (y % 180 ? -7 : 7)} ${y + 30}, ${12 + (y % 180 ? 7 : -7)} ${y + 60}, 12 ${y + 90}`;
      p.setAttribute("d", d);
      len = p.getTotalLength();
      p.style.strokeDasharray = String(len);
      update();
    };
    const update = () => {
      raf = 0;
      let k = 1;
      if (draw === "scroll") {
        const r = host.getBoundingClientRect();
        k = Math.max(0, Math.min(1, (window.innerHeight * 0.7 - r.top) / r.height));
      }
      p.style.strokeDashoffset = String(len * (1 - k));
      const pt = p.getPointAtLength(len * k);
      head.current!.setAttribute("cx", String(pt.x));
      head.current!.setAttribute("cy", String(pt.y));
      head.current!.style.opacity = draw === "scroll" && k > 0 && k < 1 ? "1" : "0";
    };
    const onScroll = () => { raf ||= requestAnimationFrame(update); };

    build();
    const ro = new ResizeObserver(build);
    ro.observe(host);
    if (draw === "scroll") window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [draw]);

  return (
    <svg ref={svg} aria-hidden="true" className="absolute left-0 top-0 h-full w-[24px] pointer-events-none overflow-visible">
      <path ref={path} fill="none" stroke="var(--leaf)" strokeWidth="3" strokeLinecap="round" />
      <circle ref={head} r="6" fill="var(--leaf)" opacity="0" />
    </svg>
  );
}

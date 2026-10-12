import { useEffect, useRef } from "react";

// The dim room's veil: darkens and softly blurs everything behind it (the book and stickers), except a
// circle of light that follows the cursor. One element, so no text is duplicated: the blur comes from
// backdrop-filter and the hole from a radial mask. Fine pointers only; off under reduced motion (the
// book is then simply lit). Beat text, top bar, rail and cursor sit above it, so real text never dims.
export default function Spotlight() {
  const veil = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = veil.current!;
    const stage = el.parentElement!;
    const on = matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.hidden = !on;
    if (!on) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const move = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      x = e.clientX - r.left;
      y = e.clientY - r.top;
      raf ||= requestAnimationFrame(() => {
        raf = 0;
        el.style.setProperty("--x", `${x}px`);
        el.style.setProperty("--y", `${y}px`);
      });
    };
    stage.addEventListener("pointermove", move);
    return () => {
      stage.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={veil} aria-hidden="true" className="diary-veil absolute inset-0 pointer-events-none" />;
}

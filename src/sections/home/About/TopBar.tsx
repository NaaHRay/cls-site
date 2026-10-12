import { forwardRef, useImperativeHandle, useRef } from "react";
import { PLACEHOLDER as P } from "@/content/placeholders";

export type TopBarHandle = { set: (beat: number, progress: number, visible: boolean) => void };

// The diary's top bar: the club's name on the left, a one-liner that changes every beat in the middle,
// and how much of the diary has been read on the right, with a blue ink bar filling behind it.
// Updated straight from the scroll (no React re-render per frame). Decorative: the rail carries the
// real position for assistive tech, so this is aria-hidden.
const TopBar = forwardRef<TopBarHandle>(function TopBar(_, ref) {
  const bar = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const shown = useRef({ beat: -1, pct: -1, visible: false });

  useImperativeHandle(ref, () => ({
    set(beat, progress, visible) {
      const s = shown.current;
      if (visible !== s.visible) {
        s.visible = visible;
        bar.current!.dataset.visible = String(visible);
      }
      if (beat !== s.beat) {
        s.beat = beat;
        const el = line.current!;
        el.classList.remove("diary-line-in");
        void el.offsetWidth; // restart the line's entrance
        el.textContent = P.topBar[beat] ?? "";
        el.classList.add("diary-line-in");
      }
      const pct = Math.round(progress * 100);
      if (pct !== s.pct) {
        s.pct = pct;
        count.current!.textContent = P.progress(pct);
        fill.current!.style.transform = `scaleX(${progress})`;
      }
    },
  }));

  return (
    <div
      ref={bar}
      aria-hidden="true"
      data-visible="false"
      className="diary-topbar absolute top-0 inset-x-0 z-[20] flex items-stretch h-[48px] bg-ground border-b border-line font-antic-slab"
    >
      <span data-theme="dark" className="flex items-center px-5 bg-ground-feature text-ink-on-feature t-label shrink-0 max-md:hidden">
        Crescent Literary Society
      </span>
      <span className="flex-1 flex items-center justify-center px-4 min-w-0">
        <span ref={line} className="t-body-sm text-ink truncate" />
      </span>
      <span className="relative flex items-center px-5 w-[260px] max-md:w-[150px] shrink-0 border-l border-line overflow-hidden">
        <span ref={fill} className="absolute inset-0 bg-leaf origin-left" style={{ transform: "scaleX(0)", opacity: 0.18 }} />
        <span ref={count} className="relative t-meta text-ink tabular-nums">{P.progress(0)}</span>
      </span>
    </div>
  );
});

export default TopBar;

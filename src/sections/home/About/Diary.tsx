import { lazy, Suspense, useEffect, useState } from "react";

// Below the hero, so each layout loads on its own after first paint (only the one in use is fetched).
const DiaryStage = lazy(() => import("./DiaryStage"));
const PhoneDiary = lazy(() => import("./PhoneDiary"));
const StackedDiary = lazy(() => import("./StackedDiary"));

// The Club Diary picks its layout from the visitor's setup:
//   stage: wide screens with motion allowed: the pinned 3D scene (camera, pen line, spotlight, cursor)
//   phone: under 768px: a flat book sticky on top, the beats' text stacked below
//   still: reduced motion (any width): six ordinary stacked sections, nothing moves, the pen line is drawn
// Same content in all three; only the staging changes.
type Mode = "stage" | "phone" | "still";

const read = (): Mode =>
  matchMedia("(prefers-reduced-motion: reduce)").matches ? "still" : matchMedia("(max-width: 767px)").matches ? "phone" : "stage";

function useDiaryMode() {
  const [mode, setMode] = useState<Mode>(read);
  useEffect(() => {
    const qs = [matchMedia("(prefers-reduced-motion: reduce)"), matchMedia("(max-width: 767px)")];
    const on = () => setMode(read());
    qs.forEach((q) => q.addEventListener("change", on));
    return () => qs.forEach((q) => q.removeEventListener("change", on));
  }, []);
  return mode;
}

/** The link keyboard users meet first: it jumps past the whole diary. Hidden until it has focus. */
function SkipDiary() {
  return (
    <a
      href="#after-diary"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[300] t-label bg-ground text-ink px-4 py-3"
    >
      Skip the diary
    </a>
  );
}

export default function Diary() {
  const mode = useDiaryMode();
  return (
    <>
      <SkipDiary />
      {/* the fallback holds the stage's height so nothing below jumps when the layout arrives */}
      <Suspense fallback={<section id="about" className={mode === "stage" ? "h-[1180svh]" : "min-h-[100svh]"} />}>
        {mode === "stage" ? <DiaryStage /> : mode === "phone" ? <PhoneDiary /> : <StackedDiary />}
      </Suspense>
      {/* where "Skip the diary" lands: the next section goes right after this */}
      <div id="after-diary" tabIndex={-1} />
    </>
  );
}

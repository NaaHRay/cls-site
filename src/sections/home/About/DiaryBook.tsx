import { memo, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import DragElements from "@/components/fancy/blocks/drag-elements";
import { PLACEHOLDER as P } from "@/content/placeholders";
import { HangTag, NudgeFrame, Polaroid, SpineCard, Stamp, StatBox, TAB_Y, Tabs, TornStack } from "./objects";
import { openPiece } from "./ReadPiece";
import Stickers from "./Stickers";

// The diary as a real book, in "book units": sized for the camera's closest view (scale 1 = crisp text).
//
// It is built like a bound book. Each LEAF is hinged at the spine and has a front (a right-hand page
// before it turns) and a back (the left-hand page after it turns). The front cover is leaf 0: its front
// is the maroon cover, its back the first left page. Turning a leaf = rotateY 0° to −180° (DiaryStage
// scrubs it). Under all the leaves lies the last right-hand page.
//
// Paper is ivory in both themes: every paper surface is a data-theme="light" island, so all colours on
// it are light-theme tokens and every design-system contrast pair holds, even in the dark room.
export const PAGE_W = 1000;
export const PAGE_H = 1300;
export const SPINE_W = 72;
export const RIM = 20; // the cover boards showing around the pages
export const BOOK_W = RIM * 2 + PAGE_W * 2 + SPINE_W; // 2112
export const BOOK_H = RIM * 2 + PAGE_H; // 1340
export const HINGE_X = RIM + PAGE_W + SPINE_W / 2; // the spine's centre line
const HALF = SPINE_W / 2;

// ---------- pieces ----------

/** A page. `open` lets objects (tabs, the spine card) reach past its edges. */
function Paper({ fold, open, children }: { fold: "left" | "right"; open?: boolean; children?: ReactNode }) {
  return (
    <div
      data-theme="light"
      data-paper=""
      className={`relative bg-ground text-ink ${open ? "" : "overflow-hidden"}`}
      style={{ width: PAGE_W, height: PAGE_H, padding: "88px 96px" }}
    >
      {/* the paper's fold beside the spine: a flat darker band (no gradients in this system) */}
      <span aria-hidden="true" className={`absolute inset-y-0 w-[28px] bg-ground-inset ${fold === "right" ? "right-0" : "left-0"}`} />
      {children}
    </div>
  );
}

function Header({ label, aside }: { label: string; aside: string }) {
  return (
    <div className="flex justify-between font-antic-slab text-[22px] tracking-[0.16em] uppercase text-ink-muted">
      <span>{label}</span>
      <span>{aside}</span>
    </div>
  );
}

function Ruled({ bottom = 120, count = 5 }: { bottom?: number; count?: number }) {
  return (
    <div aria-hidden="true" className="absolute left-[96px] right-[96px] flex flex-col gap-[56px]" style={{ bottom }}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="h-px bg-line block" />
      ))}
    </div>
  );
}

const face = (back: boolean): CSSProperties => ({
  position: "absolute",
  inset: 0,
  backfaceVisibility: "hidden",
  WebkitBackfaceVisibility: "hidden",
  // A pixel apart in depth, so the face pointing at the viewer is also the one under the pointer
  // (Chrome still hit-tests a hidden back face that sits in the same plane).
  transform: back ? "rotateY(180deg) translateZ(1px)" : "translateZ(1px)",
  pointerEvents: "auto",
  paddingLeft: back ? 0 : HALF,
  paddingRight: back ? HALF : 0,
});

/**
 * One leaf hinged on the spine. GSAP turns the outer div; the inner div lifts the leaf by `z` in the
 * leaf's own space, so once turned the order flips like real paper (the first leaf turned ends at the
 * bottom of the left-hand pile). The static view opens the cover with CSS ([data-diary-static]).
 */
function Leaf({ index, z, front, back, turned }: { index: number; z: number; front: ReactNode; back: ReactNode; turned?: boolean }) {
  return (
    <div
      data-leaf={index}
      className="diary-leaf absolute"
      // Only the faces take the pointer; the leaf boxes are click-through so a page above never blocks one below.
      style={{ left: HINGE_X, top: RIM, width: PAGE_W + HALF, height: PAGE_H, transformOrigin: "left center", transformStyle: "preserve-3d", pointerEvents: "none", ...(turned === undefined ? {} : { transform: `rotateY(${turned ? -180 : 0}deg)`, transition: "transform 700ms cubic-bezier(0.2, 0.7, 0.2, 1)" }) }}
    >
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transform: `translateZ(${z}px)`, pointerEvents: "none" }}>
        <div style={face(false)}>{front}</div>
        <div style={face(true)}>{back}</div>
      </div>
    </div>
  );
}

// The cover board, bleeding past the page on the three outer edges.
function CoverBoard({ side, children }: { side: "front" | "back"; children?: ReactNode }) {
  return (
    <div
      className="absolute bg-ground-deep rounded-sm"
      style={{ top: -RIM, bottom: -RIM, left: side === "front" ? HALF : -RIM, right: side === "front" ? -RIM : HALF }}
    >
      {children}
    </div>
  );
}

// ---------- page contents ----------

const body = "font-antic-slab text-[30px] leading-[1.6]";

function Entry1Left() {
  return (
    <Paper fold="right">
      <Header label={P.entry1.label} aside={P.entry1.aside} />
      <p className="font-handlee text-leaf-text text-[44px] mt-[120px] -rotate-2">{P.founding.penNote}</p>
      <h2 className="font-handlee text-[104px] leading-[1.05] mt-[16px] max-w-[760px]">{P.founding.title}</h2>
      <div className="flex items-end gap-[40px] mt-[56px]">
        <span className="font-finesse-flair text-rose text-[260px] leading-[0.9]" aria-hidden="true">
          2006
        </span>
        <span className="font-handlee text-rose-text text-[40px] -rotate-2 mb-[32px]">{P.founding.margin}</span>
      </div>
      <p className={`${body} text-ink mt-[48px] max-w-[700px]`}>{P.founding.body}</p>
    </Paper>
  );
}

function Entry1Right() {
  return (
    <Paper fold="left">
      <Header label={P.entry1.label} aside="" />
      <p className={`${body} text-ink-muted mt-[160px] max-w-[700px]`}>{P.founding2.body}</p>
      <Ruled />
    </Paper>
  );
}

// A page that only flashes past while the years turn.
function YearPage({ fold, n }: { fold: "left" | "right"; n: number }) {
  return (
    <Paper fold={fold}>
      <Header label={P.entry2.label} aside={P.entry2.aside} />
      <p aria-hidden="true" className="font-antic-slab text-[64px] text-ink-faint mt-[200px]">{`[year ${n}]`}</p>
      <Ruled count={9} bottom={160} />
    </Paper>
  );
}

// Positions of the year rows in book units: the pen line's milestone nodes sit exactly on them.
export const YEAR_ROWS_Y = [305, 425, 545, 665];

function Entry2Left() {
  return (
    <Paper fold="right">
      <Header label={P.entry2.label} aside={P.entry2.aside} />
      <ol>
        {P.evolution.years.map((y, i) => (
          <li key={i} className="absolute left-[96px] right-[96px] flex items-baseline" style={{ top: YEAR_ROWS_Y[i] - RIM - 30 }}>
            <span className="font-antic-slab text-[36px] text-rose-text w-[300px] shrink-0 tabular-nums">{y.year}</span>
            <span className="font-antic-slab text-[30px] text-ink-muted">{y.what}</span>
          </li>
        ))}
      </ol>
      <span className="absolute left-[420px] top-[780px] font-handlee text-rose-text text-[40px] -rotate-2">{P.evolution.margin}</span>
    </Paper>
  );
}

function Entry2Right() {
  return (
    <Paper fold="left">
      <Header label={P.entry2.label} aside="" />
      <p className={`${body} text-ink-muted mt-[160px] max-w-[400px]`}>{P.evolution.body}</p>
      <HangTag x={560} y={300} />
      <span className="absolute left-[520px] top-[820px] font-handlee text-rose-text text-[34px] -rotate-2 max-w-[380px]">{P.evolution.tagAside}</span>
    </Paper>
  );
}

function Entry3Left() {
  return (
    <Paper fold="right">
      <Header label={P.entry3.label} aside={P.entry3.aside} />
      <h2 className="font-handlee text-[96px] leading-[1.05] mt-[100px] max-w-[760px]">{P.clubs.title}</h2>
      <p className={`${body} text-ink-muted mt-[40px] max-w-[640px]`}>{P.clubs.body}</p>
      <Stamp x={540} y={780}>{P.clubs.stamp}</Stamp>
    </Paper>
  );
}

function Entry3Right() {
  return (
    <Paper fold="left" open>
      <Header label={P.entry3.label} aside="" />
      <SpineCard />
      <Tabs />
      <Ruled />
    </Paper>
  );
}

function Entry4Left() {
  return (
    <Paper fold="right">
      <Header label={P.entry4.label} aside={P.entry4.aside} />
      {/* the polaroids can be picked up and moved around the page */}
      <DragElements className="absolute! inset-0" dragElastic={0.2} dragMomentum={false}>
        <div data-drag="" data-beat="4"><NudgeFrame i={0}><Polaroid i={0} x={100} y={200} rot={-4} /></NudgeFrame></div>
        <div data-drag="" data-beat="4"><NudgeFrame i={1}><Polaroid i={1} x={470} y={560} rot={5} /></NudgeFrame></div>
      </DragElements>
    </Paper>
  );
}

function Entry4Right() {
  return (
    <Paper fold="left">
      <Header label={P.entry4.label} aside="" />
      <StatBox i={0} x={96} y={220} />
      <StatBox i={1} x={520} y={360} />
      <StatBox i={2} x={230} y={760} w={520} />
    </Paper>
  );
}

function Entry5Left({ active }: { active: boolean }) {
  return (
    <Paper fold="right">
      <Header label={P.entry5.label} aside={P.entry5.aside} />
      <TornStack x={110} y={230} active={active} />
    </Paper>
  );
}

function Entry5Right() {
  return (
    <Paper fold="left">
      <Header label={P.entry5.label} aside="" />
      <button type="button" data-beat="5" onClick={openPiece} className="block font-handlee text-rose-text text-[38px] mt-[420px] -rotate-2 max-w-[600px] text-left underline underline-offset-8 cursor-pointer">
        {P.writing.more}
      </button>
      <Ruled />
    </Paper>
  );
}

// "CLS", typed one letter at a time once the diary has risen. A blinking caret waits before the first
// letter and goes a moment after the last. Letters are decoration (the full name sits right beneath),
// the space is reserved so nothing shifts, and reduced motion shows it finished.
function TypedWord({ text, on }: { text: string; on: boolean }) {
  const still = useReducedMotion();
  const [n, setN] = useState(0);
  const [caret, setCaret] = useState(true);
  const done = n >= text.length;
  useEffect(() => {
    if (still) { setN(text.length); setCaret(false); return; }
    if (!on || done) return;
    const t = setTimeout(() => setN(n + 1), n === 0 ? 260 : 300 + Math.random() * 140);
    return () => clearTimeout(t);
  }, [on, n, done, still, text]);
  useEffect(() => {
    if (!done || still) return;
    const t = setTimeout(() => setCaret(false), 1400);
    return () => clearTimeout(t);
  }, [done, still]);
  return (
    <span aria-hidden="true" className="relative inline-block">
      <span className="invisible">{text}</span>
      <span className="absolute left-0 top-0 whitespace-nowrap">
        {text.slice(0, n)}
        {caret && <span className="diary-caret inline-block w-[12px] h-[0.78em] bg-current ml-[10px] align-baseline" />}
      </span>
    </span>
  );
}

function Cover({ typed }: { typed: boolean }) {
  return (
    <CoverBoard side="front">
      <div data-theme="dark" data-cover="" className="absolute inset-0 flex flex-col justify-end text-ink-on-feature" style={{ padding: "96px 96px" }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1340" preserveAspectRatio="none" aria-hidden="true">
          <g fill="none" stroke="var(--line-feature)" strokeWidth="2">
            <ellipse cx="420" cy="560" rx="620" ry="240" transform="rotate(-24 420 560)" />
            <ellipse cx="560" cy="520" rx="420" ry="300" transform="rotate(30 560 520)" />
          </g>
        </svg>
        <span className="absolute font-antic-slab text-[230px] leading-none tracking-[0.1em]" style={{ left: 96, top: 170 }}>
          <TypedWord text="CLS" on={typed} />
        </span>
        <span className="relative font-antic-slab text-[26px] tracking-[0.16em] uppercase">Crescent Literary Society</span>
        <span className="relative font-finesse-flair text-[220px] leading-[0.9] mt-[24px]" aria-hidden="true">2006</span>
        {/* The closing line: taped across the cover, written by the pen as the book closes (beat 6).
            The tape is a light-theme island so the ink reads; the words are real text from the start. */}
        <div
          data-theme="light"
          className="diary-tape absolute bg-ground-inset border border-line"
          style={{ left: 90, top: 560, width: 840, padding: "18px 40px", transform: "rotate(-3deg)" }}
        >
          <p className="diary-tagline font-caveat font-medium text-[64px] leading-[1.25] text-leaf-text">With Inclusion comes Strength</p>
        </div>
        <span className="diary-keep absolute font-handlee text-[44px]" style={{ left: 640, top: 1130, transform: "rotate(-2deg)" }}>
          {P.keepScrolling}
        </span>
      </div>
    </CoverBoard>
  );
}

// ---------- the pen line (book space, above the pages) ----------

// Hand-authored paths in book units, one per spread; each node is a dot the pen leaves at a milestone.
//  a — spread 1: from the pen note, around the word "literary", down the page towards the spine
//  b — spread 2: through the year rows, across the spine, around the hanging tag
//  c — spread 3: from the card in the spine, past each bookmark tab, down to the stamp
//  d — spread 4: from the polaroids, across the spine, through the three stat boxes
//  e — spread 5: around the torn page and out to the right-hand page
//  f — the closed cover: a loop around the taped closing line
export const PENS = [
  {
    id: "a",
    d:
      "M 352 300 C 392 296, 424 302, 442 316 C 588 336, 588 450, 402 464 C 222 478, 172 416, 214 360 " +
      "C 254 312, 442 308, 544 342 C 664 384, 702 520, 640 620 C 560 760, 180 720, 140 900 C 110 1040, 500 1100, 980 1060",
    nodes: [] as number[][],
  },
  {
    id: "b",
    d:
      "M 80 240 C 200 220, 330 250, 330 305 C 330 360, 250 380, 330 425 C 410 470, 250 500, 330 545 " +
      "C 410 590, 250 620, 330 665 C 420 760, 700 820, 1000 700 C 1200 600, 1400 380, 1620 330 " +
      "C 1700 300, 2040 300, 2010 520 C 1990 760, 1700 780, 1640 640 C 1600 560, 1700 470, 1760 470",
    nodes: [...YEAR_ROWS_Y.map((y) => [330, y]), [1620, 330]],
  },
  {
    id: "c",
    d:
      "M 1240 430 C 1400 520, 1700 300, 2000 325 C 2090 345, 1930 485, 2000 505 C 2090 525, 1930 665, 2000 685 " +
      "C 2090 705, 1930 845, 2000 865 C 2060 950, 1800 1120, 1450 1060 C 1200 1020, 900 1100, 700 900",
    nodes: TAB_Y.map((y) => [2000, y + RIM + 75]), // each tab's middle
  },
  {
    id: "d",
    d:
      "M 360 760 C 420 860, 380 960, 480 1000 C 700 1080, 950 900, 1000 700 C 1060 480, 1200 330, 1388 300 " +
      "C 1560 280, 1700 420, 1812 450 C 1960 490, 2000 700, 1800 730 C 1600 760, 1560 820, 1582 860",
    nodes: [
      [1388, 300],
      [1812, 450],
      [1582, 860],
    ],
  },
  {
    id: "e",
    d:
      "M 90 300 C 300 180, 760 200, 880 420 C 960 560, 840 700, 600 700 C 360 700, 260 860, 420 980 " +
      "C 560 1080, 900 1120, 1060 1000 C 1250 860, 1450 520, 1700 520",
    nodes: [[1700, 520]],
  },
  {
    id: "f",
    d: "M 2010 560 C 2150 650, 1990 790, 1600 800 C 1180 810, 1010 720, 1110 590 C 1200 470, 1560 440, 1850 480 C 2040 505, 2110 580, 2040 650",
    nodes: [] as number[][],
  },
];

function PenLine() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-visible"
      width={BOOK_W}
      height={BOOK_H}
      viewBox={`0 0 ${BOOK_W} ${BOOK_H}`}
      style={{ transform: "translateZ(20px)" }}
    >
      {PENS.map((p) => (
        <g key={p.id} className={`pen pen-${p.id}`} opacity="0">
          <path className="pen-path" d={p.d} fill="none" stroke="var(--leaf)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {p.nodes.map(([x, y], i) => (
            <circle key={i} className="pen-node" cx={x} cy={y} r="9" fill="var(--leaf)" />
          ))}
          <circle className="pen-head" r="11" fill="var(--leaf)" />
        </g>
      ))}
    </svg>
  );
}

// ---------- the book ----------

/** `writing`: beat 5 is on screen, so the member line may type itself. Memoised: only that flag re-renders it. */
/** `turned`: how many leaves lie turned on the left (phones set it from the scroll; the stage leaves it to GSAP). */
function DiaryBook({ writing, cover, turned }: { writing: boolean; cover: boolean; turned?: number }) {
  const t = (i: number) => (turned === undefined ? undefined : i < turned);
  return (
    <div className="relative" style={{ width: BOOK_W, height: BOOK_H, transformStyle: "preserve-3d" }}>
      {/* back cover under the right-hand page stack, and the spine */}
      <div className="absolute bg-ground-deep rounded-sm" style={{ left: HINGE_X, top: 0, width: PAGE_W + HALF + RIM, height: BOOK_H }} />
      <div aria-hidden="true" className="absolute bg-ground-deep" style={{ left: RIM + PAGE_W, top: RIM - 8, width: SPINE_W, height: PAGE_H + 16 }}>
        {[0.22, 0.78].map((t) => (
          <span key={t} className="absolute inset-x-0 h-px bg-line-feature" style={{ top: `${t * 100}%` }} />
        ))}
      </div>
      {/* leaves, top of the stack first; spread n = back of one leaf + front of the next */}
      <Leaf index={0} z={8} turned={t(0)} front={<Cover typed={cover} />} back={<><CoverBoard side="back" /><div className="relative"><Entry1Left /></div></>} />
      <Leaf index={1} z={7} turned={t(1)} front={<Entry1Right />} back={<YearPage fold="right" n={1} />} />
      <Leaf index={2} z={6} turned={t(2)} front={<YearPage fold="left" n={2} />} back={<YearPage fold="right" n={3} />} />
      <Leaf index={3} z={5} turned={t(3)} front={<YearPage fold="left" n={4} />} back={<Entry2Left />} />
      <Leaf index={4} z={4} turned={t(4)} front={<Entry2Right />} back={<Entry3Left />} />
      <Leaf index={5} z={3} turned={t(5)} front={<Entry3Right />} back={<Entry4Left />} />
      <Leaf index={6} z={2} turned={t(6)} front={<Entry4Right />} back={<Entry5Left active={writing} />} />

      {/* the last right-hand page: under every leaf in depth (it sits at z 0), but last in the markup so Tab
          reaches it after the earlier beats' controls */}
      <div className="absolute" style={{ left: HINGE_X + HALF, top: RIM }}>
        <Entry5Right />
      </div>

      <PenLine />
      <Stickers />
    </div>
  );
}

export default memo(DiaryBook);

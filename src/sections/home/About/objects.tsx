import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import Tag from "@/components/Tag";
import TextHighlighter, { type TextHighlighterRef } from "@/components/fancy/text/text-highlighter";
import Typewriter from "@/components/fancy/text/typewriter";
import { SPRING } from "@/lib/motion";
import { CLUBS } from "@/content/clubs";
import { PLACEHOLDER as P } from "@/content/placeholders";

// Physical things in the diary: tape, a hanging tag, stat boxes, a stamp, polaroids, torn pages,
// bookmark tabs and a card tucked into the spine. All in book units (the camera's close-up = 1:1),
// all from design-system tokens: they sit on the paper's light-theme islands.

// A small seeded random, so hand-drawn shapes are the same on every visit.
function rand(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/** A rectangle drawn by hand: each side bows a little and the stroke overshoots its start. */
export function handRect(w: number, h: number, seed: number, wobble = 7) {
  const r = rand(seed);
  const j = () => (r() - 0.5) * wobble;
  const c = [
    [j(), j()],
    [w + j(), j()],
    [w + j(), h + j()],
    [j(), h + j()],
  ];
  const mid = (a: number[], b: number[]) => `${(a[0] + b[0]) / 2 + j()} ${(a[1] + b[1]) / 2 + j()}`;
  let d = `M ${c[0][0] - 6} ${c[0][1] + 3}`;
  for (let i = 0; i < 4; i++) d += ` Q ${mid(c[i], c[(i + 1) % 4])} ${c[(i + 1) % 4][0]} ${c[(i + 1) % 4][1]}`;
  return d + ` L ${c[1][0] * 0.04} ${c[0][1] - 2}`;
}

/** A clip-path that tears one or both vertical edges of a sheet. */
function tornEdges(seed: number, left = true, right = false) {
  const r = rand(seed);
  const pts: string[] = [];
  const steps = 26;
  for (let i = 0; i <= steps; i++) pts.push(`${right ? 100 - r() * 2.4 : 100}% ${(i / steps) * 100}%`);
  for (let i = steps; i >= 0; i--) pts.push(`${left ? r() * 2.4 : 0}% ${(i / steps) * 100}%`);
  return `polygon(${pts.join(",")})`;
}

const at = (x: number, y: number, rot = 0, extra?: CSSProperties): CSSProperties => ({
  position: "absolute",
  left: x,
  top: y,
  transform: rot ? `rotate(${rot}deg)` : undefined,
  ...extra,
});

/** A strip of tape. On paper it is the paper's inset grey with a hairline edge. */
export function Tape({ x, y, w = 150, rot = -6 }: { x: number; y: number; w?: number; rot?: number }) {
  return <span aria-hidden="true" className="bg-ground-inset border border-line" style={at(x, y, rot, { width: w, height: 44, opacity: 0.92 })} />;
}

/** A tag hanging on a string from the top of the page, with one big number. */
export function HangTag({ x, y }: { x: number; y: number }) {
  return (
    <div style={at(x, 0, 0)}>
      <svg aria-hidden="true" width="200" height={y + 40} className="absolute left-[60px] top-0 overflow-visible">
        <path d={`M 100 0 C 80 ${y * 0.4}, 130 ${y * 0.7}, 100 ${y + 30}`} fill="none" stroke="var(--line-strong)" strokeWidth="2" />
      </svg>
      <div
        className="relative bg-ground-raised border-[1.5px] border-line-strong rounded-sm px-[40px] pt-[64px] pb-[40px] w-[400px]"
        style={{ top: y, transform: "rotate(6deg)", clipPath: "polygon(18% 0, 82% 0, 100% 12%, 100% 100%, 0 100%, 0 12%)" }}
      >
        <span aria-hidden="true" className="absolute left-1/2 top-[24px] -translate-x-1/2 w-[22px] h-[22px] rounded-pill border-[3px] border-line-strong" />
        <p className="font-antic-slab text-[20px] tracking-[0.12em] uppercase text-ink-muted">{P.evolution.tag.label}</p>
        <p className="font-antic-slab text-[72px] leading-none text-rose mt-[12px] whitespace-nowrap">{P.evolution.tag.count}</p>
        <p className="font-antic-slab text-[22px] tracking-[0.12em] uppercase text-ink mt-[16px]">{P.evolution.tag.what}</p>
      </div>
    </div>
  );
}

const STAT_LOOKS = [
  { kind: "hand", color: "var(--rose-text)", text: "text-rose-text" },
  { kind: "dashed", color: "var(--ink-muted)", text: "text-ink-muted" },
  { kind: "hand", color: "var(--leaf-text)", text: "text-leaf-text" },
] as const;

/** One count in a hand-made box: solid hand-drawn, dashed, or hand-drawn again, in three inks. */
export function StatBox({ i, x, y, w = 400, h = 270 }: { i: number; x: number; y: number; w?: number; h?: number }) {
  const look = STAT_LOOKS[i % 3];
  const s = P.events.stats[i];
  return (
    <div style={at(x, y, i === 1 ? 1.5 : -1.5, { width: w, height: h })} className="p-[32px]">
      <svg aria-hidden="true" className="absolute inset-0 overflow-visible" width={w} height={h}>
        {look.kind === "dashed" ? (
          <rect x="2" y="2" width={w - 4} height={h - 4} fill="none" stroke={look.color} strokeWidth="4" strokeDasharray="16 12" />
        ) : (
          <path d={handRect(w, h, 11 + i * 7)} fill="none" stroke={look.color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
      <p className={`relative font-antic-slab text-[72px] leading-none ${look.text}`}>{s.n}</p>
      <p className={`relative font-antic-slab text-[20px] tracking-[0.12em] uppercase mt-[12px] ${look.text}`}>{s.label}</p>
      <p className={`relative font-handlee text-[28px] mt-[20px] text-right ${look.text}`}>{s.note}</p>
    </div>
  );
}

/** A rubber stamp, slightly crooked. */
export function Stamp({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <span
      className="border-[5px] border-rose text-rose font-antic-slab text-[44px] tracking-[0.14em] uppercase px-[28px] py-[12px] rounded-xs"
      style={at(x, y, -9, { opacity: 0.88 })}
    >
      {children}
    </span>
  );
}

/** A polaroid: an empty frame until the club's own photos arrive (never stock images). */
export function Polaroid({ x, y, rot, i }: { x: number; y: number; rot: number; i: number }) {
  const p = P.events.polaroids[i];
  return (
    <figure className="bg-ground-raised border border-line p-[20px] pb-[24px] w-[400px]" style={at(x, y, rot)}>
      <div aria-hidden="true" className="aspect-[5/4] bg-ground-inset" />
      <figcaption className="mt-[16px] flex items-center justify-between gap-[16px]">
        <span className="font-antic-slab text-[24px] tracking-[0.08em] uppercase text-ink">{p.caption}</span>
        <span className="scale-[1.6] origin-right">
          <Tag>{p.tag}</Tag>
        </span>
      </figcaption>
      <p className="font-handlee text-[26px] text-ink-muted mt-[8px]">{p.note}</p>
      <Tape x={130} y={-22} rot={i ? 4 : -5} />
    </figure>
  );
}

import { openPiece } from "./ReadPiece";

const LINE = `${P.writing.lineBefore} ${P.writing.mark} ${P.writing.lineAfter}`;
const TYPE_MS = 38; // per character

/**
 * Three torn sheets of member writing, stacked; the top one carries the piece. When beat 5 arrives
 * (`active`) the line types itself once, then its one word is highlighted. The full line is real
 * text for screen readers from the start; reduced motion shows it finished. Tapping the sheet opens
 * the whole piece.
 */
export function TornStack({ x, y, active }: { x: number; y: number; active: boolean }) {
  const still = useReducedMotion();
  const [typed, setTyped] = useState(false);
  const mark = useRef<TextHighlighterRef>(null);

  useEffect(() => {
    if (!active || typed || still) return;
    const t = setTimeout(() => setTyped(true), 400 + LINE.length * TYPE_MS + 300);
    return () => clearTimeout(t);
  }, [active, typed, still]);
  useEffect(() => {
    if (typed || still) mark.current?.animate();
  }, [typed, still]);

  const sheet = "absolute inset-0 bg-ground-raised border border-line";
  const finished = (
    <>
      {P.writing.lineBefore}{" "}
      <TextHighlighter ref={mark} as="span" triggerType="ref" highlightColor="var(--rose)" className="text-on-rose px-[4px]">
        {P.writing.mark}
      </TextHighlighter>{" "}
      {P.writing.lineAfter}
    </>
  );
  return (
    <div style={at(x, y, 0, { width: 720, height: 780 })}>
      <div className={sheet} style={{ transform: "translate(34px, 30px) rotate(3deg)", clipPath: tornEdges(3, true, true) }} />
      <div className={sheet} style={{ transform: "translate(16px, 14px) rotate(-2deg)", clipPath: tornEdges(5, true, false) }} />
      <article
        className={`${sheet} px-[64px] py-[64px] cursor-pointer`}
        style={{ clipPath: tornEdges(9, true, false) }}
        onClick={openPiece}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPiece(); } }}
        role="button"
        tabIndex={0}
        aria-label={`Read the whole piece: ${P.writing.title}`}
        data-drag=""
        data-beat="5"
      >
        <h3 className="font-handlee text-[52px] leading-[1.15]">{P.writing.title}</h3>
        <p className="font-antic-slab text-[30px] leading-[1.6] mt-[32px] min-h-[144px]">
          <span className="sr-only">{LINE}</span>
          <span aria-hidden="true">
            {still || typed ? finished : active ? <Typewriter as="span" text={LINE} speed={TYPE_MS} initialDelay={400} loop={false} cursorClassName="ml-[2px]" /> : null}
          </span>
        </p>
        <p className="font-parisienne text-[52px] text-rose-text mt-[64px] text-right">{P.writing.author}</p>
      </article>
      <Tape x={290} y={-24} w={170} rot={2} />
    </div>
  );
}

const MotionLink = motion.create(Link);

/**
 * Four bookmark tabs sticking out past the page's outer edge, one per club, in the fixed order.
 * Hover or keyboard focus pulls a tab out and reveals its one line; a click goes to the club.
 */
export const TAB_Y = [230, 410, 590, 770];
export function Tabs() {
  const [hot, setHot] = useState(-1);
  return (
    <ul className="absolute" style={{ left: PAGE_EDGE, top: 0 }} data-beat="3">
      {CLUBS.map((c, i) => (
        <li key={c.slug} className="absolute" style={{ top: TAB_Y[i], left: 0 }}>
          <MotionLink
            to={`/sub-clubs/${c.slug}`}
            className="block bg-ground-raised border-[1.5px] border-line-strong rounded-r-sm pl-[56px] pr-[24px] py-[16px] w-[360px] h-[150px] overflow-hidden text-ink no-underline"
            style={{ marginLeft: -120 }}
            animate={{ x: hot === i ? 36 : 0 }}
            transition={SPRING.hover}
            onPointerEnter={() => setHot(i)}
            onPointerLeave={() => setHot(-1)}
            onFocus={() => setHot(i)}
            onBlur={() => setHot(-1)}
          >
            <span className="font-handlee text-[34px] block leading-tight">{c.name}</span>
            <motion.span
              className="font-antic-slab text-[18px] text-ink-muted block mt-[4px]"
              initial={false}
              animate={{ opacity: hot === i ? 1 : 0, y: hot === i ? 0 : 8 }}
              transition={{ duration: 0.25 }}
            >
              {P.clubs.lines[i]}
            </motion.span>
          </MotionLink>
        </li>
      ))}
    </ul>
  );
}
const PAGE_EDGE = 1000; // the page's outer edge, in page coordinates

/** A card tucked into the spine, half on the page and half in the gutter. */
export function SpineCard() {
  return (
    <div data-theme="dark" className="diary-spine-card bg-ground-feature text-ink-on-feature rounded-sm px-[40px] py-[32px] w-[460px]" style={at(-90, 230, -5)}>
      <p className="font-antic-slab text-[18px] tracking-[0.14em] uppercase whitespace-nowrap">Crescent Literary Society</p>
      <p className="font-handlee text-[34px] mt-[16px] leading-tight">{P.clubs.card}</p>
    </div>
  );
}

/**
 * Makes a draggable frame reachable from the keyboard: Tab focuses it, Shift+Arrow nudges it (plain
 * arrows still step between beats). A separate offset, so it works alongside the mouse drag above it.
 */
export function NudgeFrame({ i, children }: { i: number; children: ReactNode }) {
  const [d, setD] = useState({ x: 0, y: 0 });
  return (
    <div
      tabIndex={0}
      role="group"
      aria-label={`Photo frame ${i + 1}. Empty until the club adds photos. Hold Shift and use the arrow keys to move it.`}
      className="outline-offset-[6px]"
      style={{ translate: `${d.x}px ${d.y}px` }}
      onKeyDown={(e) => {
        if (!e.shiftKey || !e.key.startsWith("Arrow")) return;
        e.preventDefault();
        e.stopPropagation();
        const step = 40;
        setD((p) => ({
          x: Math.max(-320, Math.min(320, p.x + (e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0))),
          y: Math.max(-240, Math.min(240, p.y + (e.key === "ArrowDown" ? step : e.key === "ArrowUp" ? -step : 0))),
        }));
      }}
    >
      {children}
    </div>
  );
}

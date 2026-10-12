import type { ReactNode } from "react";

const BOOK_W = 2112; // DiaryBook's width in book units (not imported: DiaryBook imports this file)

// Die-cut stickers of literary things (a quill, an inkwell, an open book, quotation marks), stuck half
// off the book's edges. They live in book space but lifted off the pages (translateZ), so the camera's
// tilt gives them real parallax against the paper; DiaryStage adds a slow scroll drift and tilt.
// Drawn only from design-system colours. The club's own personal stickers (favourite books, tickets,
// badges…) join or replace these when supplied. Decorative only.

// A die-cut: the shape drawn twice, a thick ivory border behind the coloured shape.
function DieCut({ size, children, border }: { size: number; children: ReactNode; border: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="-60 -60 120 120" className="block overflow-visible drop-shadow-[0_10px_14px_rgb(0_0_0/0.35)]">
      <g fill="var(--ivory)" stroke="var(--ivory)" strokeWidth="14" strokeLinejoin="round" strokeLinecap="round">
        {border}
      </g>
      {children}
    </svg>
  );
}

// A quill: a blue feather on a pale shaft, a dark nib at the tip.
const QUILL_VANE = "M -30 38 C -18 30, -8 28, 4 22 C 28 10, 50 -10, 42 -48 C 20 -42, -6 -26, -20 -2 C -28 16, -32 28, -30 38 Z";
const Quill = () => (
  <DieCut
    size={190}
    border={
      <>
        <path d={QUILL_VANE} />
        <path d="M -44 52 L -34 40" strokeWidth="18" fill="none" />
      </>
    }
  >
    <path d={QUILL_VANE} fill="var(--leaf)" />
    <path d="M -36 46 C -10 20, 18 -10, 40 -44" fill="none" stroke="var(--ivory)" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M -30 38 C -14 28, 6 14, 20 -6 M -22 22 C -8 16, 8 4, 18 -14 M -12 8 C 0 4, 12 -6, 22 -26" fill="none" stroke="var(--ivory)" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
    <path d="M -46 54 L -42 42 L -34 44 Z" fill="var(--ink-black)" />
  </DieCut>
);

// An inkwell with a quill in it.
const BODY = "M -32 -2 L -32 36 Q -32 46 -22 46 L 22 46 Q 32 46 32 36 L 32 -2 Q 32 -14 20 -14 L -20 -14 Q -32 -14 -32 -2 Z";
const Inkwell = () => (
  <DieCut
    size={180}
    border={
      <>
        <path d={BODY} />
        <rect x="-13" y="-28" width="26" height="16" />
        <path d="M 8 -26 C 30 -40, 40 -52, 46 -62 C 24 -58, 10 -42, 8 -26 Z" />
      </>
    }
  >
    <path d="M 8 -26 C 30 -40, 40 -52, 46 -62 C 24 -58, 10 -42, 8 -26 Z" fill="var(--leaf)" />
    <rect x="-13" y="-28" width="26" height="16" fill="var(--maroon-deep)" />
    <path d={BODY} fill="var(--maroon)" />
    <rect x="-20" y="8" width="40" height="24" rx="2" fill="var(--ivory)" />
    <path d="M -13 16 H 13 M -13 24 H 6" stroke="var(--ink-black)" strokeWidth="2.4" strokeLinecap="round" />
  </DieCut>
);

// An open book: rose cover, white pages, ruled lines.
const COVER = "M -56 -22 Q -28 -34, 0 -20 Q 28 -34, 56 -22 L 56 34 Q 28 22, 0 36 Q -28 22, -56 34 Z";
const Book = () => (
  <DieCut size={200} border={<path d={COVER} />}>
    <path d={COVER} fill="var(--rose)" />
    <path d="M -50 -20 Q -26 -30, -2 -17 L -2 30 Q -26 20, -50 30 Z" fill="var(--white)" />
    <path d="M 50 -20 Q 26 -30, 2 -17 L 2 30 Q 26 20, 50 30 Z" fill="var(--white)" />
    <path d="M -42 -8 Q -26 -14, -10 -6 M -42 2 Q -26 -4, -10 4 M -42 12 Q -26 6, -10 14 M 42 -8 Q 26 -14, 10 -6 M 42 2 Q 26 -4, 10 4 M 42 12 Q 26 6, 10 14" fill="none" stroke="var(--ink-black)" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    <path d="M 0 -17 V 36" stroke="var(--maroon-deep)" strokeWidth="3" />
  </DieCut>
);

// A big pair of quotation marks in the club's display type.
const Quote = () => (
  <DieCut
    size={170}
    border={
      <text x="0" y="78" textAnchor="middle" fontSize="260" style={{ fontFamily: "var(--font-finesse-flair)" }}>
        &ldquo;
      </text>
    }
  >
    <text x="0" y="78" textAnchor="middle" fontSize="260" fill="var(--rose)" style={{ fontFamily: "var(--font-finesse-flair)" }}>
      &ldquo;
    </text>
  </DieCut>
);

// Where each sticker sits in book units (outside the page edges) and how it starts tilted.
const STICKERS = [
  { el: <Quill />, x: -170, y: 130, rot: -14 },
  { el: <Quote />, x: BOOK_W - 50, y: -60, rot: 10 },
  { el: <Inkwell />, x: -120, y: 1040, rot: 8 },
  { el: <Book />, x: BOOK_W - 70, y: 1100, rot: -10 },
];

export default function Stickers() {
  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ transform: "translateZ(80px)", transformStyle: "preserve-3d" }}>
      {STICKERS.map((s, i) => (
        <div key={i} className="diary-sticker absolute" style={{ left: s.x, top: s.y, transform: `rotate(${s.rot}deg)` }}>
          {s.el}
        </div>
      ))}
    </div>
  );
}

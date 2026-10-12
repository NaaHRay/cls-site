import type { ReactNode } from "react";

// The club diary as flat pieces. Milestone 8 turns these into the leaves of one 3D book;
// here each beat shows its own spread. All page content stays real DOM.

const ORBITS = [
  { cx: 180, cy: 260, rx: 300, ry: 110, rot: -22 },
  { cx: 200, cy: 230, rx: 210, ry: 150, rot: 28 },
];

// The burgundy cover: always dark in both themes, like every burgundy field. Thin orbit lines cross it.
export function Cover({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <div
      data-theme="dark"
      className={`relative overflow-hidden bg-ground-deep text-ink-on-feature rounded-sm aspect-[4/5] w-full max-w-[360px] flex items-end p-5 ${className}`}
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 360 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g fill="none" stroke="var(--line-feature)" strokeWidth="1" vectorEffect="non-scaling-stroke">
          {ORBITS.map((o, i) => (
            <ellipse key={i} cx={o.cx} cy={o.cy} rx={o.rx} ry={o.ry} transform={`rotate(${o.rot} ${o.cx} ${o.cy})`} />
          ))}
        </g>
      </svg>
      <div className="relative">{children}</div>
    </div>
  );
}

// An open book: two raised pages and a spine. A card gets a fill and a border, never a shadow too.
// On phones the two pages stack, left over right, with the spine turned into a horizontal rule.
export function Spread({ left, right, className = "" }: { left?: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div
      className={`relative grid grid-cols-2 w-full max-w-[560px] aspect-[16/10] bg-ground-raised border border-line rounded-sm max-md:grid-cols-1 max-md:aspect-auto ${className}`}
    >
      <span
        className="absolute inset-y-0 left-1/2 w-px bg-line-strong max-md:inset-x-0 max-md:inset-y-auto max-md:left-0 max-md:top-1/2 max-md:w-auto max-md:h-px"
        aria-hidden="true"
      />
      <div className="p-5 min-w-0 overflow-hidden max-md:min-h-[180px]">{left}</div>
      <div className="p-5 min-w-0 overflow-hidden max-md:min-h-[180px]">{right}</div>
    </div>
  );
}

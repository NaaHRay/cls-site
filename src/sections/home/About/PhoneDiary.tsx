import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import ScrollRail from "@/components/ScrollRail";
import { CLUBS } from "@/content/clubs";
import { PLACEHOLDER as P } from "@/content/placeholders";
import { BEAT_NAMES, TURNED } from "./beats";
import DiaryBook, { BOOK_H, BOOK_W } from "./DiaryBook";
import MarginPen from "./MarginPen";
import ReadPiece, { openPiece } from "./ReadPiece";

// The Club Diary on phones (under 768px): no 3D camera. The whole book lies flat, sticky at the top of the
// screen, and turns its pages by itself as each beat scrolls past; the beats' readable text stacks below as
// full-width pages (the book's own text is too small to read at this size), with the blue pen line running
// down the left margin. Uses svh, so the address bar collapsing does not move anything.
export default function PhoneDiary() {
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.18);
  const [beat, setBeat] = useState(-1); // -1: the diary has not been reached yet (book closed)
  const [seen, setSeen] = useState(false);

  // Fit the whole book into the sticky frame.
  useLayoutEffect(() => {
    const fit = () => {
      const r = frame.current!.getBoundingClientRect();
      setScale(Math.min((r.width * 0.96) / BOOK_W, (r.height * 0.96) / BOOK_H));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(frame.current!);
    return () => ro.disconnect();
  }, []);

  // Which beat is under the sticky book: the last one whose top has passed the middle of the screen.
  useEffect(() => {
    const els = [...root.current!.querySelectorAll<HTMLElement>("[data-beat-section]")];
    const io = new IntersectionObserver(
      () => {
        const mid = window.innerHeight * 0.55;
        let cur = -1;
        els.forEach((el, i) => { if (el.getBoundingClientRect().top < mid) cur = i; });
        setBeat(cur);
        if (cur >= 0) setSeen(true);
      },
      { rootMargin: "0px 0px 0px 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const jump = (i: number) => root.current!.querySelector(`#diary-beat-${i}`)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });

  return (
    <section id="about" ref={root} aria-label="About the club: the club diary" className="relative">
      <div className="sticky top-0 z-[15] bg-ground border-b border-line">
        <div ref={frame} className="h-[34svh] min-h-[220px] flex items-center justify-center overflow-hidden diary-phone-book" style={{ perspective: 2200 }}>
          <div style={{ transform: `scale(${scale})`, transformStyle: "preserve-3d", width: BOOK_W, height: BOOK_H, flex: "none" }}>
            <DiaryBook writing={false} cover={seen} turned={beat < 0 ? 0 : TURNED[beat]} />
          </div>
        </div>
        <ScrollRail names={BEAT_NAMES} current={Math.max(beat, 0)} onJump={jump} label="Diary beats" orientation="horizontal" className="pb-[4px]" />
      </div>

      <div className="relative">
        <MarginPen draw="scroll" />
        {P.beats.map((b, i) => (
          <section key={b.eyebrow} id={`diary-beat-${i}`} data-beat-section={i} aria-labelledby={`diary-beat-title-${i}`} className="min-h-[64svh] flex flex-col justify-center px-[40px] py-[40px] scroll-mt-[36svh]">
            <p className="t-eyebrow text-rose-text">{b.eyebrow}</p>
            <h2 id={`diary-beat-title-${i}`} className="t-h2 mt-4">{b.title}</h2>
            {b.body && <p className="t-body mt-5">{b.body}</p>}
            {i === 2 && (
              <ul className="mt-6 flex flex-col gap-3">
                {CLUBS.map((c, k) => (
                  <li key={c.slug}>
                    <Link to={`/sub-clubs/${c.slug}`} className="block border-[1.5px] border-line-strong px-4 py-3 text-ink no-underline">
                      <span className="t-sub-sm block">{c.name}</span>
                      <span className="t-meta text-ink-muted block">{P.clubs.lines[k]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {i === 4 && (
              <button type="button" onClick={openPiece} className="t-label text-ink border-[1.5px] border-line-strong px-4 py-3 mt-6 self-start cursor-pointer">
                {P.readPiece}
              </button>
            )}
          </section>
        ))}
      </div>
      <ReadPiece />
    </section>
  );
}

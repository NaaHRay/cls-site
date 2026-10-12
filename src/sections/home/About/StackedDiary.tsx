import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import ScrollRail from "@/components/ScrollRail";
import Tag from "@/components/Tag";
import { Annotated, InsetPage } from "@/components/Marginalia";
import Reveal from "@/components/Reveal";
import { CLUBS } from "@/content/clubs";
import { PH } from "@/content/placeholders";
import { BEAT_NAMES } from "./beats";
import { Cover, Spread } from "./Book";
import MarginPen from "./MarginPen";
import ReadPiece, { openPiece } from "./ReadPiece";

// The Club Diary as six ordinary stacked sections: the reduced-motion and no-JS version (wired in D5).
// Each beat is a text block and a piece of the book, mirrored left and right.

type Props = {
  n: number; // which beat (0-based): its anchor id for the rail
  eyebrow: string;
  title: string;
  flip?: boolean; // book on the left, text on the right
  feature?: boolean; // burgundy ground
  children: ReactNode; // the text under the title
  visual: ReactNode;
};

function Beat({ n, eyebrow, title, flip, feature, children, visual }: Props) {
  const text = flip ? "lg:col-start-8 lg:col-span-5" : "lg:col-start-1 lg:col-span-5";
  const book = flip ? "lg:col-start-1 lg:col-span-6" : "lg:col-start-7 lg:col-span-6";
  return (
    <section
      id={`diary-beat-${n}`}
      data-beat-section={n}
      data-theme={feature ? "dark" : undefined}
      aria-labelledby={`about-${eyebrow}`}
      className={`${feature ? "bg-ground-feature text-ink-on-feature" : ""} py-10 max-lg:py-9 max-md:py-8`}
    >
      <div className="grid grid-cols-12 gap-x-gutter gap-y-7 items-center px-7 max-md:px-4 max-w-container-max mx-auto">
        <div className={`col-span-12 row-start-1 ${text} ${flip ? "lg:mt-8" : ""}`}>
          <Reveal stagger>
            <Reveal.Item>
              <p className={`t-eyebrow ${feature ? "" : "text-rose-text"}`} id={`about-${eyebrow}`}>{eyebrow}</p>
            </Reveal.Item>
            <Reveal.Item>
              <h2 className="t-h2 mt-4">{title}</h2>
            </Reveal.Item>
            <Reveal.Item className="mt-5 max-w-text">{children}</Reveal.Item>
          </Reveal>
        </div>
        <div className={`col-span-12 row-start-2 lg:row-start-1 ${book} ${flip ? "" : "lg:mt-8"}`}>
          <Reveal className={`w-full flex justify-center ${flip ? "lg:justify-start" : "lg:justify-end"}`}>{visual}</Reveal>
        </div>
      </div>
    </section>
  );
}

// An empty polaroid frame: real photos replace the inset; no stock images, ever.
function Polaroid({ rot, tag }: { rot: string; tag: string }) {
  return (
    <figure className={`${rot} bg-ground border border-line-strong rounded-xs p-2 flex flex-col gap-2 max-w-[200px] mx-auto`}>
      <div className="aspect-[5/4] bg-ground-inset" aria-hidden="true" />
      <figcaption className="flex flex-wrap items-center gap-2">
        <span className="t-meta text-ink-muted">{PH("caption")}</span>
        <Tag>{tag}</Tag>
      </figcaption>
    </figure>
  );
}

const body = "t-body";
const years = [
  { year: "2006", what: "Founded", real: true },
  { year: PH("year"), what: PH("a turning point") },
  { year: PH("year"), what: PH("a turning point") },
  { year: PH("year"), what: PH("a turning point") },
];

export default function StackedDiary() {
  const [beat, setBeat] = useState(0);
  // Which beat is on screen: the last one whose top has passed the middle of the screen.
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("#about [data-beat-section]")];
    const io = new IntersectionObserver(
      () => {
        let cur = 0;
        els.forEach((el, i) => { if (el.getBoundingClientRect().top < window.innerHeight * 0.55) cur = i; });
        setBeat(cur);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  const jump = (i: number) => document.getElementById(`diary-beat-${i}`)?.scrollIntoView({ behavior: "auto", block: "start" });

  return (
    <div id="about" className="relative">
      <MarginPen draw="full" />
      {/* the rail: a zero-height sticky strip, so it stays on screen while the diary scrolls past */}
      <div className="sticky top-[45svh] h-0 z-[20] flex justify-end pr-[6px] pointer-events-none">
        <div data-theme={beat === 0 ? "dark" : undefined} className="pointer-events-auto h-fit">
          <ScrollRail names={BEAT_NAMES} current={beat} onJump={jump} label="Diary beats" tone={beat === 0 ? "feature" : "room"} />
        </div>
      </div>
      <ReadPiece />
      <Beat
        n={0}
        feature
        eyebrow="The club, since 2006"
        title="Founded 2006"
        visual={
          <Cover>
            <span className="t-numeral-year text-[112px]! leading-none block" aria-hidden="true">2006</span>
          </Cover>
        }
      >
        <p className={body}>{PH("the founding story, in the club's own words")}</p>
      </Beat>

      <Beat
        n={1}
        flip
        eyebrow="Evolution"
        title="Year by year"
        visual={
          <Spread
            left={
              <ol className="flex flex-col gap-3 h-full justify-center">
                {years.map((y, i) => (
                  <li key={i} className="flex items-baseline gap-3">
                    <span className="t-numeral text-rose-text shrink-0 w-[4.5rem]">{y.year}</span>
                    <span className="t-body-sm text-ink-muted">{y.what}</span>
                  </li>
                ))}
              </ol>
            }
            right={
              <div className="h-full flex flex-col justify-end gap-3" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="h-px bg-line block" />
                ))}
              </div>
            }
          />
        }
      >
        <Annotated note="est. 2006">
          <span className={body}>{PH("how the club changed over the years, a few lines")}</span>
        </Annotated>
      </Beat>

      <Beat
        n={2}
        eyebrow="The four clubs"
        title="Pick a bookmark"
        visual={
          <Spread
            left={
              <p className="t-margin-note text-rose-text h-full flex items-end -rotate-2" aria-hidden="true">
                one book, four clubs
              </p>
            }
            right={
              <ul className="flex flex-col gap-3 h-full justify-center">
                {CLUBS.map((c, i) => (
                  <li key={c.slug} style={{ marginLeft: i * 8 }}>
                    <Link
                      to={`/sub-clubs/${c.slug}`}
                      className="lift block bg-ground-inset border border-line-strong rounded-xs px-4 py-2 text-ink no-underline"
                    >
                      <span className="t-sub-sm block">{c.name}</span>
                      <span className="t-meta text-ink-muted block">{PH("one line about the club")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            }
          />
        }
      >
        <p className={body}>
          Writers Guild, Quizzers Circuit, House of Debaters and Order of Improv. Each has its own page.
        </p>
      </Beat>

      <Beat
        n={3}
        flip
        eyebrow="Events"
        title="Pinned to the pages"
        visual={
          <Spread
            left={<Polaroid rot="-rotate-3" tag="Event" />}
            right={<Polaroid rot="rotate-2" tag="Writing" />}
          />
        }
      >
        <p className={body}>{PH("a line about the club's events; real photos go on these pages")}</p>
      </Beat>

      <Beat
        n={4}
        eyebrow="Member writing"
        title="In their own words"
        visual={
          <div className="relative w-full max-w-[420px] pb-6 pr-6">
            <div className="absolute left-6 top-6 right-0 bottom-0 bg-ground-inset border border-line rounded-sm" aria-hidden="true" />
            <div className="relative">
              <InsetPage title={PH("title of a piece")} author={PH("author")}>
                {PH("a few lines of member writing, with the author's permission")}
              </InsetPage>
            </div>
          </div>
        }
      >
        <p className={body}>{PH("a line introducing the member writing")}</p>
        <button type="button" onClick={openPiece} className="t-label text-ink border-[1.5px] border-line-strong px-4 py-3 mt-6 cursor-pointer">
          Read the whole piece
        </button>
      </Beat>

      <section id="diary-beat-5" data-beat-section={5} className="py-10 max-lg:py-9 max-md:py-8 px-7 max-md:px-4" aria-label="With Inclusion comes Strength">
        <div className="max-w-container-wide mx-auto lg:pl-[16.66%]">
          <Reveal>
            <p className="t-write-en">With Inclusion comes Strength</p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

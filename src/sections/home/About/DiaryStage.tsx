import { useLayoutEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent } from "react";
import ScrollRail from "@/components/ScrollRail";
import { PLACEHOLDER as P } from "@/content/placeholders";
import { useGsap } from "@/lib/gsap";
import { lenis } from "@/lib/smooth";
import { BEATS, BEAT_NAMES, LENGTH, SETTLE, beatAt } from "./beats";
import Cursor from "./Cursor";
import DiaryBook, { BOOK_H, BOOK_W, HINGE_X, PAGE_H, PAGE_W, RIM, SPINE_W } from "./DiaryBook";
import ReadPiece from "./ReadPiece";
import Spotlight from "./Spotlight";
import TopBar, { type TopBarHandle } from "./TopBar";

// The Club Diary: six beats on scroll. A dim room, one book, a camera that moves over it, a pen line
// that draws itself across each spread, a top bar with progress; the book closes at the end and the
// pen writes the closing line on the cover.
//
// Mechanism: a tall section with a native sticky stage (no GSAP pin spacer, no scroll lock); one GSAP
// timeline, scrubbed by ScrollTrigger with a smoothed scrub, drives everything. The scroll itself is
// never taken over.
//
// Layers, back to front: room (ground) > lens (blur on entry, perspective) > camera > book (+ pen lines)
// > veil with the spotlight > hint, top bar.

const BAR_AT = 1.6; // when the top bar arrives

// The static pose (phones, reduced motion, before GSAP loads): the whole open book, gently tilted.
const STATIC = { rotateX: 22, rotateZ: -3, fill: 0.74 };
const PHONE = { rotateX: 0, rotateZ: 0, fill: 0.94 };

export default function DiaryStage() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const bar = useRef<TopBarHandle>(null);
  const [pose, setPose] = useState({ ...STATIC, scale: 0.5 });
  const [coverOn, setCoverOn] = useState(false); // the diary has risen: "CLS" may type itself, once
  const [writing, setWriting] = useState(false); // beat 5 on screen: the member line may type itself
  const [beat, setBeat] = useState(0); // the beat on screen (the rail's current stop)
  const time = useRef(0); // where the timeline is, in screens

  // Scroll the page to timeline time t (the scroll is the only clock; the scene is never animated directly).
  const scrollToTime = (t: number) => {
    const el = root.current!;
    const top = el.getBoundingClientRect().top + window.scrollY + (t / LENGTH) * (el.offsetHeight - window.innerHeight);
    if (lenis) lenis.scrollTo(top, { duration: 1.6 });
    else window.scrollTo({ top, behavior: "smooth" });
  };
  // Keyboard: Left/Right arrows step between beats while focus is inside the diary (Up/Down keep
  // scrolling the page, Shift+arrows nudge a focused photo). The rail's buttons do the same by click or Enter.
  const jump = (i: number) => scrollToTime(SETTLE[Math.max(0, Math.min(SETTLE.length - 1, i))]);
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowRight") { e.preventDefault(); jump(beat + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); jump(beat - 1); }
  };
  // Focus follows the content: tabbing to a tab, a photo or the torn page brings its beat on screen.
  const onFocus = (e: FocusEvent) => {
    const n = Number((e.target as Element).closest("[data-beat]")?.getAttribute("data-beat"));
    if (n >= 1 && n - 1 !== beat) jump(n - 1);
  };
  // Beat 1: clicking the closed cover opens the diary early.
  const onStageClick = (e: MouseEvent) => {
    if ((e.target as Element).closest("[data-cover]") && time.current < 1.4) scrollToTime(1.7);
  };

  // Static pose: fit the whole book in the room.
  useLayoutEffect(() => {
    const fit = () => {
      const r = stage.current!.getBoundingClientRect();
      const p = r.width < 768 ? PHONE : STATIC;
      setPose({ ...p, scale: Math.min((r.width * p.fill) / BOOK_W, (r.height * p.fill) / BOOK_H) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage.current!);
    return () => ro.disconnect();
  }, []);

  useGsap(root, ({ gsap }, el) => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const st = stage.current!;
      el.removeAttribute("data-diary-static");
      const cam = el.querySelector<HTMLElement>(".diary-camera")!;
      const lens = el.querySelector<HTMLElement>(".diary-lens")!;
      const leaves = gsap.utils.toArray<HTMLElement>(".diary-leaf", el);
      const pen = (id: string) => el.querySelector<SVGGElement>(`.pen-${id}`)!;

      // Camera poses. A pose puts book point (bx, by) at the centre of the room at scale s.
      // Values are functions so they recompute on resize (invalidateOnRefresh).
      const vw = () => st.clientWidth;
      const vh = () => st.clientHeight;
      const fit = () => Math.min((vw() * 0.74) / BOOK_W, (vh() * 0.74) / BOOK_H);
      const half = () => Math.min((vw() * 0.5) / PAGE_W, (vh() * 0.8) / PAGE_H); // one page fills the view
      const close = () => Math.min(1, vw() / 1150); // the close-up: scale 1 = crisp text
      const k = (f: () => number, m: number) => () => f() * m;
      const pose = (bx: number, by: number, s: () => number, rx: number, rz: number, dx: () => number = () => 0, dy: () => number = () => 0) => ({
        x: () => (BOOK_W / 2 - bx) * s() + dx(),
        y: () => (BOOK_H / 2 - by) * s() + dy(),
        scale: s,
        rotationX: rx,
        rotation: rz,
      });
      const rightPageX = HINGE_X + SPINE_W / 2 + PAGE_W / 2;
      const leftPageX = RIM + PAGE_W / 2;
      const back = pose(HINGE_X, BOOK_H / 2, k(fit, 1.12), 8, -1); // pulled back to watch a page turn

      // Pen lines start hidden and undrawn.
      gsap.set(".pen", { opacity: 0 });
      gsap.set(".pen-node", { scale: 0, transformOrigin: "50% 50%" });
      el.querySelectorAll<SVGPathElement>(".pen-path").forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      gsap.set(".diary-tape", { opacity: 0 });
      gsap.set(".diary-spine-card", { opacity: 0 }); // tucked in only while beat 3 is on screen
      gsap.set(".diary-tagline", { clipPath: "inset(0 100% 0 0)" });
      gsap.set(".diary-keep", { opacity: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.2, // the scene glides after the scroll instead of jumping with it
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const t = self.progress * LENGTH;
            time.current = t;
            st.toggleAttribute("data-entering", t < 0.9); // the lens blurs the scene: the veil skips its own blur
            setBeat(beatAt(t));
            if (t > 0.5) setCoverOn(true);
            setWriting(t > BEATS[4] + 0.4 && t < BEATS[5]);
            bar.current?.set(beatAt(t), self.progress, t > BAR_AT);
          },
        },
      });

      // Draw a pen line from `at` for `dur`: the stroke runs, the head rides its tip, the nodes pop in turn.
      const draw = (id: string, at: number, dur: number) => {
        const g = pen(id);
        const path = g.querySelector<SVGPathElement>(".pen-path")!;
        const nodes = g.querySelectorAll(".pen-node");
        tl.set(g, { opacity: 1 }, at)
          .to(path, { strokeDashoffset: 0, duration: dur }, at)
          .to(g.querySelector(".pen-head"), { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }, duration: dur }, at);
        if (nodes.length) tl.to(nodes, { scale: 1, duration: 0.05, stagger: dur / (nodes.length + 1), ease: "back.out(3)" }, at + dur / (nodes.length + 1));
      };
      // Fade a spread's line as its page turns away (and bring it back when scrolling up).
      const fade = (id: string, at: number) => tl.to(pen(id), { opacity: 0, duration: 0.2 }, at);
      const turn = (i: number, at: number) => tl.to(leaves[i], { rotationY: -180, duration: 0.4, ease: "power1.inOut" }, at);

      tl.fromTo(leaves, { rotationY: 0 }, { rotationY: 0, duration: 0.01 }, 0);

      // Beat 1 — Founding. The closed book rises from the bottom right, tilted and out of focus.
      tl.fromTo(
        cam,
        pose(rightPageX, BOOK_H / 2, k(fit, 0.8), 55, -9, () => vw() * 0.28, () => vh() * 0.5),
        { ...pose(rightPageX, BOOK_H / 2, half, 16, -3), duration: 1, ease: "power2.out" },
        0,
      ).fromTo(lens, { filter: "blur(10px)" }, { filter: "blur(0px)", duration: 0.9 }, 0)
        // blur(0px) still costs a render pass over the whole scene: drop the filter once sharp
        .set(lens, { filter: "none" }, 0.9);
      // the cover opens while the camera pulls back to the whole spread; then in to the title and down
      tl.to(leaves[0], { rotationY: -180, duration: 0.5, ease: "power1.inOut" }, 1)
        .to(cam, { ...pose(HINGE_X, BOOK_H / 2, fit, 10, -2), duration: 0.5 }, 1)
        .to(cam, { ...pose(leftPageX - 40, 420, close, 4, -1), duration: 0.7 }, 1.5)
        .to(cam, { ...pose(leftPageX, 900, close, 3, 0), duration: 0.6 }, 2.2);
      draw("a", 1.6, 1.2);

      // Beat 2 — Evolution. Pull back, the years turn, the line runs through them to the hanging tag.
      const b2 = BEATS[1];
      tl.to(cam, { ...back, duration: 0.8 }, b2 - 0.1);
      fade("a", b2);
      tl.to(leaves.slice(1, 4), { rotationY: -180, duration: 0.35, stagger: 0.18, ease: "power1.inOut" }, b2);
      tl.to(cam, { ...pose(560, 560, k(close, 0.85), 3, 0), duration: 0.6 }, b2 + 0.7).to(
        cam,
        { ...pose(1760, 560, k(close, 0.85), 3, -1), duration: 0.6 },
        b2 + 1.3,
      );
      draw("b", b2 + 0.7, 1.2);

      // Beat 3 — The four clubs. Turn; the camera finds the card in the spine, then the bookmark tabs.
      const b3 = BEATS[2];
      tl.to(cam, { ...back, duration: 0.4 }, b3);
      fade("b", b3 + 0.05);
      turn(4, b3 + 0.05);
      tl.to(cam, { ...pose(HINGE_X + 120, 400, k(close, 0.95), 4, 0), duration: 0.45 }, b3 + 0.45).to(
        cam,
        { ...pose(1880, 600, k(close, 0.8), 4, -1), duration: 0.5 },
        b3 + 0.95,
      );
      draw("c", b3 + 0.5, 0.95);
      tl.to(".diary-spine-card", { opacity: 1, duration: 0.1 }, b3 + 0.1);

      // Beat 4 — Events. Turn; polaroids on the left, three stat boxes on the right.
      const b4 = BEATS[3];
      tl.to(cam, { ...back, duration: 0.4 }, b4);
      fade("c", b4 + 0.05);
      turn(5, b4 + 0.05);
      tl.to(cam, { ...pose(500, 640, k(close, 0.85), 3, 1), duration: 0.5 }, b4 + 0.45).to(
        cam,
        { ...pose(1600, 640, k(close, 0.8), 3, -1), duration: 0.5 },
        b4 + 1.0,
      );
      draw("d", b4 + 0.5, 1.0);
      tl.to(".diary-spine-card", { opacity: 0, duration: 0.05 }, b4 + 0.1); // its page is turning away

      // Beat 5 — Member writing. Turn; the torn pages, then the right-hand page.
      const b5 = BEATS[4];
      tl.to(cam, { ...back, duration: 0.4 }, b5);
      fade("d", b5 + 0.05);
      turn(6, b5 + 0.05);
      tl.to(cam, { ...pose(500, 640, k(close, 0.9), 3, 0), duration: 0.5 }, b5 + 0.45).to(
        cam,
        { ...pose(1500, 600, k(close, 0.85), 3, 0), duration: 0.45 },
        b5 + 0.95,
      );
      draw("e", b5 + 0.5, 0.85);

      // Beat 6 — Close. Every leaf turns back, the cover shuts, and the pen writes the closing line on it.
      const b6 = BEATS[5];
      fade("e", b6);
      tl.to([...leaves].reverse(), { rotationY: 0, duration: 0.3, stagger: 0.06, ease: "power1.inOut" }, b6 + 0.05).to(
        cam,
        { ...pose(rightPageX, BOOK_H / 2 + 20, half, 12, -3), duration: 0.6 },
        b6 + 0.05,
      );
      tl.to(".diary-tape", { opacity: 1, duration: 0.1 }, b6 + 0.6);
      draw("f", b6 + 0.65, 0.75);
      tl.to(".diary-tagline", { clipPath: "inset(0 0% 0 0)", duration: 0.6 }, b6 + 0.7).to(".diary-keep", { opacity: 1, duration: 0.15 }, b6 + 1.25);

      // Stickers drift and tilt slowly with the scroll, each at its own rate (they also get real 3D parallax).
      tl.to(".diary-sticker", { y: (i: number) => [-90, 70, -60, 50][i % 4], rotation: (i: number) => [8, -6, 10, -8][i % 4], duration: LENGTH }, 0);

      return () => el.setAttribute("data-diary-static", "");
    });
  });

  return (
    <section
      id="about"
      ref={root}
      data-diary-static=""
      aria-label="About the club: the club diary"
      className="relative md:h-[1180svh] motion-reduce:h-auto"
    >
      <div ref={stage} onClick={onStageClick} onKeyDown={onKeyDown} onFocus={onFocus} className="sticky top-0 h-[100svh] min-h-[560px] overflow-hidden bg-ground">
        <div className="diary-lens absolute inset-0 flex items-center justify-center" style={{ perspective: 2200 }}>
          <div
            className="diary-camera will-change-transform"
            style={{
              transformStyle: "preserve-3d",
              transform: `scale(${pose.scale}) rotateX(${pose.rotateX}deg) rotateZ(${pose.rotateZ}deg)`,
            }}
          >
            <DiaryBook writing={writing} cover={coverOn} />
          </div>
        </div>

        <Spotlight />

        <TopBar ref={bar} />
        <Cursor />
        <ScrollRail names={BEAT_NAMES} current={beat} onJump={jump} label="Diary beats" className="absolute right-[10px] top-1/2 -translate-y-1/2 z-[20] bg-ground border border-line rounded-sm py-[6px] pl-[6px]" />
        <p className="absolute top-[64px] left-1/2 -translate-x-1/2 z-[10] t-label text-ink border border-line-strong bg-ground rounded-pill px-5 py-2 whitespace-nowrap max-md:text-[12px]!">
          {P.scrollHint}
        </p>
      </div>
      <ReadPiece />
    </section>
  );
}

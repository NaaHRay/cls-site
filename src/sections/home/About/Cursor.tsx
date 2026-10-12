import { useEffect, useRef } from "react";

// The diary's cursor: a small ring with a dot, a trail of dots that shrink and fade behind it, and a pen
// nib inside the ring over the pages. It grows over anything you can press or drag. Drawn on one small
// canvas inside the stage, from a fixed pool of trail points (no per-frame allocation).
// Fine pointers only, off under reduced motion, and only while the pointer is in the stage. The native
// cursor is hidden only over the pages (see components.css), never over links, buttons or drag handles.
const TRAIL = 14;

export default function Cursor() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current!;
    const stage = cv.parentElement!;
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cv.hidden = true;
      return;
    }
    stage.classList.add("diary-cursor-on");
    const g = cv.getContext("2d")!;
    const css = () => getComputedStyle(document.documentElement);
    let room = "", paper = "";
    const colours = () => {
      room = getComputedStyle(stage).getPropertyValue("--ink").trim(); // the room's ink in this theme
      paper = css().getPropertyValue("--ink-black").trim(); // pages are always ivory, so dark ink
    };
    colours();
    const themeWatch = new MutationObserver(colours);
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    let w = 0, h = 0;
    const size = () => {
      const r = stage.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
      w = r.width; h = r.height;
      cv.width = w * d; cv.height = h * d;
      g.setTransform(d, 0, 0, d, 0, 0);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(stage);

    const pts = Array.from({ length: TRAIL }, () => ({ x: 0, y: 0 }));
    let tx = 0, ty = 0, rx = 0, ry = 0, inside = false, onPaper = false, hot = false, grow = 0, raf = 0;

    const frame = () => {
      raf = 0;
      rx += (tx - rx) * 0.3;
      ry += (ty - ry) * 0.3;
      for (let i = TRAIL - 1; i > 0; i--) { pts[i].x = pts[i - 1].x; pts[i].y = pts[i - 1].y; }
      pts[0].x = rx; pts[0].y = ry;
      grow += ((hot ? 1 : 0) - grow) * 0.2;
      g.clearRect(0, 0, w, h);
      if (!inside) return;
      const ink = onPaper ? paper : room;
      g.fillStyle = ink;
      g.strokeStyle = ink;
      for (let i = 3; i < TRAIL; i += 1) {
        const k = 1 - i / TRAIL;
        g.globalAlpha = k * 0.55;
        g.beginPath();
        g.arc(pts[i].x, pts[i].y, 1 + k * 4, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
      const r = 14 + grow * 10;
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(rx, ry, r, 0, Math.PI * 2);
      g.stroke();
      if (onPaper && !hot) {
        // a pen nib, tip at the pointer's hotspot side
        g.beginPath();
        g.moveTo(tx, ty + 7);
        g.lineTo(tx - 5, ty - 3);
        g.lineTo(tx - 2, ty - 8);
        g.lineTo(tx + 2, ty - 8);
        g.lineTo(tx + 5, ty - 3);
        g.closePath();
        g.fill();
      } else {
        g.beginPath();
        g.arc(tx, ty, 3, 0, Math.PI * 2);
        g.fill();
      }
      const still = Math.hypot(pts[TRAIL - 1].x - rx, pts[TRAIL - 1].y - ry) < 0.5 && Math.abs(grow - (hot ? 1 : 0)) < 0.01;
      if (!still) raf = requestAnimationFrame(frame);
    };
    const kick = () => { raf ||= requestAnimationFrame(frame); };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = stage.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      if (!inside) { inside = true; rx = tx; ry = ty; pts.forEach((p) => { p.x = tx; p.y = ty; }); }
      const t = e.target as Element;
      hot = !!t.closest("a, button, [data-drag], [data-cover]");
      onPaper = !!t.closest("[data-paper]");
      kick();
    };
    const leave = () => { inside = false; kick(); };
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerleave", leave);
    return () => {
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", leave);
      stage.classList.remove("diary-cursor-on");
      themeWatch.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none z-[30]" />;
}

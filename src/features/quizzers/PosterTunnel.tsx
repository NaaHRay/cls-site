import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import manifest from "@/content/quizzers/manifest.json";
import { QUIZZERS_NAME, posterTarget } from "@/content/quizzers/copy";
import { loadGsap } from "@/lib/gsap";
import { pauseScroll, resumeScroll } from "@/lib/smooth";
import { TUNNEL, buildSequence, buildSlots, entryAt, slotAt } from "./tunnel";
import "./quizzers.css";

// Input feel. Velocity is depth px per second; damping is per second, so it feels the same at any frame rate.
const DRIFT = 22;
const V_MAX = 6000;
const DAMPING = 4.2;
const WHEEL_GAIN = 9;
const TOUCH_GAIN = 2.2;
const KEY_STEP = 1600;
const CACHE_SIZE = 3; // × pool decoded images kept

// AVIF where the browser decodes it (a 1×1 probe), WebP otherwise.
const AVIF_PROBE =
  "data:image/avif;base64,AAAAHGZ0eXBhdmlmAAAAAG1pZjFhdmlmbWlhZgAAANZtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAACJpbG9jAAAAAERAAAEAAQAAAAAA+gABAAAAAAAAAB0AAAAjaWluZgAAAAAAAQAAABVpbmZlAgAAAAABAABhdjAxAAAAAA5waXRtAAAAAAABAAAAVmlwcnAAAAA4aXBjbwAAAAxhdjFDgSACAAAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAABZpcG1hAAAAAAAAAAEAAQOBAgMAAAAlbWRhdBIACgc4AAaQENBpMhAcQmLk4AAWAACQNY48fohQ";
const formatReady = new Promise<"avif" | "webp">((resolve) => {
  const probe = new Image();
  probe.onload = () => resolve(probe.width > 0 ? "avif" : "webp");
  probe.onerror = () => resolve("webp");
  probe.src = AVIF_PROBE;
});

type SlotState = { entry: number; poster: number; big: boolean; gen: number };

// The Quizzer's Circuit poster tunnel: a fixed, always-dark stage that the wheel, touch and keys fly
// through. A small pool of poster elements is recycled; tunnel.ts decides where each one is and what
// it shows, from the camera position alone. Only transform and opacity change per frame.
export default function PosterTunnel() {
  const stage = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const debug = useRef<HTMLPreElement>(null);
  const [paused, setPaused] = useState(() => {
    try {
      return localStorage.getItem("qz-paused") === "1";
    } catch {
      return false;
    }
  });
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  // Dev only: ?debug shows the overlay, ?n=5 limits the posters (edge-case test).
  const [{ showDebug, posters, pool }] = useState(() => {
    const params = new URLSearchParams(location.search);
    const n = import.meta.env.DEV ? Number(params.get("n")) : 0;
    return {
      showDebug: import.meta.env.DEV && params.has("debug"),
      posters: n > 0 ? manifest.slice(0, n) : manifest,
      pool: matchMedia("(max-width: 640px)").matches ? 16 : 28,
    };
  });

  useEffect(() => {
    const root = stage.current!;
    const els = Array.from(root.querySelectorAll<HTMLButtonElement>(".qz-poster"));
    const imgs = els.map((el) => el.querySelector("img")!);
    const lqips = els.map((el) => el.querySelector<HTMLElement>(".qz-lqip")!);
    const phone = pool < 28;
    const slots = buildSlots(pool, phone ? { minDist: 0.42, laneX: 0.3, laneY: 0.22 } : { minDist: 0.34, laneX: 0.3, laneY: 0.3 });
    const seq = buildSequence(posters.length, pool);
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const L = TUNNEL.length;

    let format: "avif" | "webp" = "webp";
    let cam = 0;
    let velocity = 0;
    let touched = false;
    let titleOpacity = 1;
    let vw = 0, vh = 0, height = 0;
    const state: SlotState[] = els.map(() => ({ entry: NaN, poster: -1, big: false, gen: 0 }));
    // Per slot, from the last frame: screen offset from the centre, nearness, and whether it can be
    // clicked or focused (clearly visible, centre on screen).
    const sx = new Float32Array(pool), sy = new Float32Array(pool), near = new Float32Array(pool);
    const live: boolean[] = els.map(() => false);
    let roving = -1; // the one poster in the Tab order

    let leaving = false;
    const open = (i: number) => {
      if (leaving || i < 0 || !live[i]) return;
      leaving = true;
      navigateRef.current(posterTarget(state[i].poster));
    };
    els.forEach((el, i) => (el.onclick = () => open(i)));

    // The clearly visible poster nearest `from` in direction `dir` (-1 left, 1 right); with no
    // `from`, the nearest one to the camera.
    const pick = (from = -1, dir = 0) => {
      let best = -1, bestScore = Infinity;
      for (let j = 0; j < pool; j++) {
        if (!live[j] || j === from) continue;
        let score = -near[j];
        if (from >= 0) {
          const dx = sx[j] - sx[from];
          if (dir && dx * dir <= 4) continue;
          score = dir ? Math.abs(dx) + 2 * Math.abs(sy[j] - sy[from]) : Math.hypot(dx, sy[j] - sy[from]);
        }
        if (score < bestScore) { best = j; bestScore = score; }
      }
      return best;
    };
    const setRoving = (i: number) => {
      if (i === roving) return;
      if (roving >= 0) els[roving].tabIndex = -1;
      roving = i;
      if (i >= 0) els[i].tabIndex = 0;
    };

    // Decoded-image cache, least recently used dropped first.
    const cache = new Map<string, Promise<void>>();
    const load = (url: string) => {
      let p = cache.get(url);
      if (p) cache.delete(url);
      else {
        const img = new Image();
        img.fetchPriority = "low";
        img.src = url;
        p = img.decode().catch(() => {});
      }
      cache.set(url, p);
      if (cache.size > CACHE_SIZE * pool) cache.delete(cache.keys().next().value!);
      return p;
    };
    const url = (p: number, big: boolean) => `${posters[p].base}-${big ? 960 : 480}.${format}`;

    const show = (i: number, big: boolean) => {
      const s = state[i];
      const gen = ++s.gen;
      const src = url(s.poster, big);
      load(src).then(() => {
        if (s.gen !== gen) return; // the slot has moved on
        imgs[i].src = src;
        imgs[i].style.opacity = "1";
      });
    };

    const assign = (i: number, entry: number, forward: boolean) => {
      const s = state[i];
      s.entry = entry;
      s.poster = entryAt(seq, entry);
      s.big = false;
      const p = posters[s.poster];
      els[i].style.width = `${(height * p.aspect).toFixed(1)}px`;
      lqips[i].style.backgroundImage = `url(${p.lqip})`;
      imgs[i].style.opacity = "0";
      imgs[i].alt = p.alt;
      els[i].setAttribute("aria-label", `Open ${QUIZZERS_NAME}, poster ${s.poster + 1} of ${posters.length}`);
      show(i, false);
      load(url(entryAt(seq, entry + (forward ? pool : -pool)), false)); // what this slot shows next
    };

    const measure = () => {
      vw = innerWidth;
      vh = innerHeight;
      height = Math.min(vh * 0.52, vw * 0.95);
      root.style.setProperty("--qz-h", `${height.toFixed(1)}px`);
      state.forEach((s, i) => {
        if (s.poster >= 0) els[i].style.width = `${(height * posters[s.poster].aspect).toFixed(1)}px`;
      });
    };

    let frames = 0, fpsAt = performance.now(), fps = 0, worst = 0, worstAt = performance.now();
    const tick = (_t: number, deltaMs: number) => {
      const dt = Math.min(deltaMs / 1000, 0.05);
      const drift = still || pausedRef.current ? 0 : DRIFT;
      velocity = Math.max(-V_MAX, Math.min(V_MAX, velocity));
      cam += (velocity + drift) * dt;
      velocity *= Math.exp(-DAMPING * dt);
      if (Math.abs(velocity) < 0.5) velocity = 0;
      const forward = velocity + drift >= 0;
      // Far posters gather toward the vanishing point, so the plane is wider than the screen.
      const spreadX = vw * (phone ? 1.1 : 1.5);
      const spreadY = vh * (phone ? 0.9 : 1.15);

      for (let i = 0; i < pool; i++) {
        const slot = slots[i];
        const s = slotAt(slot, i, pool, cam);
        if (s.entry !== state[i].entry) assign(i, s.entry, forward);
        if (!state[i].big && s.z < TUNNEL.nearSize * L) {
          state[i].big = true;
          show(i, true);
        }
        els[i].style.transform = `translate3d(${(slot.x * spreadX).toFixed(1)}px,${(slot.y * spreadY).toFixed(1)}px,${(-s.z).toFixed(1)}px) rotate(${slot.r.toFixed(2)}deg) translate(-50%,-50%)`;
        els[i].style.opacity = s.opacity.toFixed(3);
        near[i] = TUNNEL.perspective / (TUNNEL.perspective + s.z);
        sx[i] = slot.x * spreadX * near[i];
        sy[i] = slot.y * spreadY * near[i];
        const isLive = s.opacity > 0.3 && Math.abs(sx[i]) < vw / 2 && Math.abs(sy[i]) < vh / 2;
        if (isLive !== live[i]) {
          live[i] = isLive;
          els[i].style.pointerEvents = isLive ? "auto" : "none";
        }
      }

      // Keyboard: the nearest poster is the field's tab stop; a focused poster that fades out hands
      // focus to its nearest visible neighbour.
      const focused = els.indexOf(document.activeElement as HTMLButtonElement);
      if (focused < 0) setRoving(pick());
      else if (!live[focused]) {
        const next = pick(focused);
        setRoving(next);
        els[next]?.focus({ preventScroll: true });
      }

      // The title leaves on the first scroll and returns when the camera is back at the start.
      const target = !touched || cam < 150 ? 1 : 0;
      const step = dt / 0.4;
      titleOpacity = target > titleOpacity ? Math.min(target, titleOpacity + step) : Math.max(target, titleOpacity - step);
      title.current!.style.opacity = titleOpacity.toFixed(3);

      if (debug.current) {
        const now = performance.now();
        frames++;
        worst = Math.max(worst, deltaMs);
        if (now - fpsAt >= 500) {
          fps = (frames * 1000) / (now - fpsAt);
          frames = 0;
          fpsAt = now;
        }
        if (now - worstAt > 2000) {
          worstAt = now;
          worst = deltaMs;
        }
        const visible = state.filter((_, i) => Number(els[i].style.opacity) > 0.05).map((s) => s.poster);
        debug.current.textContent = `N ${posters.length}  pool ${pool}  ${format}\ncam ${cam.toFixed(0)}  v ${velocity.toFixed(0)}\nfps ${fps.toFixed(0)}  worst ${worst.toFixed(1)}ms\nvisible ${visible.length}  repeats ${visible.length - new Set(visible).size}`;
      }
    };

    // Input: everything becomes velocity.
    const push = (dv: number) => {
      touched = true;
      velocity += dv;
    };
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch-zoom
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? vh : 1;
      push(e.deltaY * unit * WHEEL_GAIN);
    };
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && el !== document.body && !root.contains(el)) return; // keys belong to the focused control
      const onPoster = els.indexOf(el as HTMLButtonElement);
      if (onPoster >= 0 && (e.key === " " || e.key === "Enter")) return; // the button opens it
      if (onPoster >= 0 && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        const next = pick(onPoster, e.key === "ArrowLeft" ? -1 : 1);
        if (next >= 0) {
          setRoving(next);
          els[next].focus({ preventScroll: true });
        }
        return;
      }
      const dir ={ ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1, " ": e.shiftKey ? -1 : 1 }[e.key];
      if (dir) {
        e.preventDefault();
        push(dir * KEY_STEP);
      } else if (e.key === "Home") {
        velocity = 0;
        cam = 0;
      }
    };
    let lastY = 0, lastT = 0, flick = 0, finger = -1;
    let downX = 0, downY = 0, downT = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      finger = e.pointerId;
      lastY = downY = e.clientY;
      downX = e.clientX;
      lastT = downT = e.timeStamp;
      flick = 0;
      velocity = 0;
      try {
        root.setPointerCapture(e.pointerId);
      } catch {
        // Some synthetic or already-ended pointers cannot be captured; the drag still works.
      }
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== finger) return;
      const dy = (lastY - e.clientY) * TOUCH_GAIN; // swipe up = forward
      const dtMs = Math.max(1, e.timeStamp - lastT);
      cam += dy;
      touched = true;
      flick = 0.7 * flick + 0.3 * ((dy / dtMs) * 1000);
      lastY = e.clientY;
      lastT = e.timeStamp;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== finger) return;
      finger = -1;
      // A tap opens the poster under the finger (pointer capture keeps the click from reaching it).
      if (Math.hypot(e.clientX - downX, e.clientY - downY) < 10 && e.timeStamp - downT < 500) {
        const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest(".qz-poster");
        open(els.indexOf(hit as HTMLButtonElement));
        return;
      }
      if (e.timeStamp - lastT < 100) velocity = flick;
    };

    let gsapTicker: { remove: (fn: typeof tick) => void } | undefined;
    let dead = false;
    pauseScroll();
    measure();
    formatReady.then((f) => {
      format = f;
      return loadGsap();
    }).then(({ gsap }) => {
      if (dead) return;
      gsap.ticker.add(tick);
      gsapTicker = gsap.ticker;
    });
    addEventListener("resize", measure);
    addEventListener("wheel", onWheel, { passive: true });
    addEventListener("keydown", onKey);
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onUp);
    return () => {
      dead = true;
      gsapTicker?.remove(tick);
      resumeScroll();
      removeEventListener("resize", measure);
      removeEventListener("wheel", onWheel);
      removeEventListener("keydown", onKey);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onUp);
      state.forEach((s) => s.gen++);
      imgs.forEach((img) => img.removeAttribute("src"));
    };
  }, [pool, posters]);

  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    try {
      localStorage.setItem("qz-paused", next ? "1" : "0");
    } catch {
      // Private mode: the choice lasts for this visit.
    }
  };

  return createPortal(
    <div ref={stage} className="qz qz-stage" data-theme="dark">
      <div className="qz-field" role="group" aria-label="Posters. Left and right arrows move between them, up and down fly through.">
        {Array.from({ length: pool }, (_, i) => (
          <button key={i} type="button" tabIndex={-1} className="qz-poster" style={{ opacity: 0, pointerEvents: "none" }}>
            <span className="qz-lqip" />
            <img alt="" decoding="async" draggable={false} />
          </button>
        ))}
      </div>
      <div className="qz-vignette" aria-hidden="true" />
      <div className="qz-grain" aria-hidden="true" />
      <h1 ref={title} className="qz-title">
        {QUIZZERS_NAME}
      </h1>
      <button type="button" className="qz-pause" aria-pressed={paused} onClick={togglePause}>
        {paused ? "Play motion" : "Pause motion"}
      </button>
      {showDebug && <pre ref={debug} className="qz-debug" />}
    </div>,
    document.body,
  );
}

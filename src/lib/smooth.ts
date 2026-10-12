// Smooth scrolling (Lenis). Native scroll stays underneath, so sticky stages, ScrollTrigger,
// find-in-page and the keyboard all keep working; Lenis only eases the wheel/trackpad into a glide.
// Off under prefers-reduced-motion. Until GSAP arrives Lenis runs on its own frame loop; then it
// hands its clock to GSAP's ticker so scroll scenes and smooth scrolling move on the same frame.
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export let lenis: Lenis | undefined;
let frame = 0;

export function startSmoothScroll() {
  if (lenis || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  lenis = new Lenis({
    lerp: 0.09, // lower = longer glide; 0.09 is gentle without feeling floaty
    anchors: true, // in-page links (#clubs) glide too
    stopInertiaOnNavigate: true,
    allowNestedScroll: true,
  });
  const loop = (t: number) => {
    lenis?.raf(t);
    frame = requestAnimationFrame(loop);
  };
  frame = requestAnimationFrame(loop);
}

/** Called by lib/gsap.ts once GSAP has loaded. */
export function attachToGsap(gsap: typeof import("gsap").gsap, ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger) {
  if (!lenis) return;
  cancelAnimationFrame(frame);
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/** Pause scrolling (open menus, dialogs) and resume it. */
export const pauseScroll = () => lenis?.stop();
export const resumeScroll = () => lenis?.start();

/** Jump to the top without a glide (page changes). */
export const resetScroll = () => (lenis ? lenis.scrollTo(0, { immediate: true, force: true }) : window.scrollTo(0, 0));

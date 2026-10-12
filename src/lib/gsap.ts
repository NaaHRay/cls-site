// GSAP, loaded on demand so it never weighs on the first paint. Scroll belongs to GSAP:
// any scroll-linked movement goes through here. Only plugins in use are registered.
import { useEffect, type RefObject } from "react";
import { attachToGsap } from "@/lib/smooth";

type Gsap = typeof import("gsap").gsap;
type ST = typeof import("gsap/ScrollTrigger").ScrollTrigger;

let loading: Promise<{ gsap: Gsap; ScrollTrigger: ST }> | undefined;

export function loadGsap() {
  loading ??= Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
    import("gsap/CustomEase"),
    import("gsap/MotionPathPlugin"),
  ]).then(
    ([{ gsap }, { ScrollTrigger }, { CustomEase }, { MotionPathPlugin }]) => {
      gsap.registerPlugin(ScrollTrigger, CustomEase, MotionPathPlugin);
      CustomEase.create("ease-page", "0.2,0.7,0.2,1");
      CustomEase.create("ease-leave", "0.4,0,1,1");
      // The mobile address bar showing/hiding must not re-lay-out scroll scenes.
      ScrollTrigger.config({ ignoreMobileResize: true });
      attachToGsap(gsap, ScrollTrigger);
      return { gsap, ScrollTrigger };
    },
  );
  return loading;
}

/**
 * Runs a GSAP setup scoped to `scope` once GSAP has loaded, and reverts everything it made on
 * unmount. Skipped under prefers-reduced-motion. Scrubbed scroll effects should use a smoothed
 * `scrub` (a number of seconds) so they glide after the scroll instead of jumping with it.
 */
export function useGsap(
  scope: RefObject<HTMLElement | null>,
  setup: (g: { gsap: Gsap; ScrollTrigger: ST }, el: HTMLElement) => void,
) {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ctx: ReturnType<Gsap["context"]> | undefined;
    let dead = false;
    loadGsap().then((g) => {
      if (dead || !scope.current) return;
      const el = scope.current;
      ctx = g.gsap.context(() => setup(g, el), el);
    });
    return () => {
      dead = true;
      ctx?.revert();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

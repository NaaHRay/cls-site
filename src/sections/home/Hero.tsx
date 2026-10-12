import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Button from "@/components/Button";
import { mountGarden, type GardenColors } from "@/garden/engine";
import { EASE } from "@/lib/motion";

const NAME = "Crescent Literary Society";
const FONT = '"Playfair Display", Georgia, serif'; // the Type Garden original is GT Ultra Fine, a commercial face

// Hex mix, for the one colour the design system doesn't name: the pale line on the roses' petals.
const mix = (a: string, b: string, t: number) => {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return "#" + [0, 1, 2].map((i) => Math.round(p(a, i) * (1 - t) + p(b, i) * t).toString(16).padStart(2, "0")).join("");
};

// The garden's colours are the page theme's own tokens, so each theme gets its Type Garden palette:
// dark = Rose noir (black ground, pure red roses, bright blue leaves);
// light = Paper (ivory ground, orange-red roses, navy leaves, near-black letters).
function readColors(): GardenColors {
  const css = getComputedStyle(document.documentElement);
  const v = (n: string) => css.getPropertyValue(n).trim();
  return {
    red: v("--rose"),
    blue: v("--leaf"),
    text: v("--ink"),
    vein: v("--ground"), // leaf veins are cut in the ground colour
    line: mix(v("--rose"), "#FFFFFF", 0.7),
  };
}

// The hero: the club's name grows itself one letter at a time (Type Garden), stems and roses
// sprouting from every letter, a space cutting the stems so the next word starts a new garden.
// The garden is the hero; there is no video. The name is real text for screen readers;
// the canvas is decoration. Pointer: nearby roses and letters lean towards it.
export default function Hero() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const still = useReducedMotion();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const garden = mountGarden(canvas.current!, {
      text: NAME,
      colors: readColors(),
      reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
      fontFamily: FONT,
      onDone: () => setDone(true),
    });
    // Theme switch: recolour in place, without growing again.
    const watch = new MutationObserver(() => garden.setColors(readColors()));
    watch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      watch.disconnect();
      garden.destroy();
    };
  }, []);

  return (
    <section className="relative bg-ground overflow-hidden h-[calc(100svh-72px)] min-h-[640px] max-lg:h-[calc(100svh-64px)] max-md:h-[calc(100svh-56px)] max-md:min-h-[480px]">
      <h1 className="sr-only">{NAME}</h1>
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 w-full h-full" />
      <motion.div
        className="absolute bottom-6 inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 flex justify-center"
        initial={false}
        animate={{ opacity: done || still ? 1 : 0, y: done || still ? 0 : 16 }}
        transition={{ duration: 0.6, ease: EASE.page }}
        style={{ pointerEvents: done || still ? "auto" : "none" }}
      >
        {/* To "#clubs" once the club chapters exist. */}
        <Button to="/sub-clubs" arrow className="max-md:w-full">Meet the clubs</Button>
      </motion.div>
    </section>
  );
}

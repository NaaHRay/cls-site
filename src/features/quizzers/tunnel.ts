// The poster tunnel's maths, with no DOM: seeded randomness, the poster sequence, slot placement and
// the per-frame depth of each slot. Everything is a pure function of `cam`, so scrolling backwards
// replays exactly what scrolling forwards showed. Checked by scripts/check-tunnel.mjs.

export const TUNNEL = {
  length: 4200, // L: depth of the tunnel, px
  perspective: 900, // P
  fadeInFrom: 0.8, // fraction of L where a poster starts to appear
  fadeOutTo: 0.03, // fraction of L where it has vanished
  fadeOutFrom: 0.15,
  nearSize: 0.35, // closer than this fraction of L: use the 960px image
};

/** Mulberry32: a small seeded PRNG returning floats in [0, 1). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

function shuffle(n: number, rand: () => number) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Move the entries of `avoid` out of the first `w` places of `block`, keeping the order otherwise.
function pushBack(block: number[], avoid: Set<number>, w: number) {
  const head = block.slice(0, w);
  const keep = head.filter((x) => !avoid.has(x));
  const moved = head.filter((x) => avoid.has(x));
  const rest = block.slice(w);
  // Swap moved ones with the earliest allowed entries after the head.
  for (let i = 0; i < rest.length && moved.length; i++) {
    if (!avoid.has(rest[i])) {
      keep.push(rest[i]);
      rest[i] = moved.shift()!;
    }
  }
  return [...keep, ...moved, ...rest];
}

/**
 * The order posters appear in: shuffles of all n posters back to back, so every poster shows before
 * any repeats. Any `window` consecutive entries (cyclically) are all different when n ≥ 2·window;
 * for smaller n only neighbours are kept different.
 */
export function buildSequence(n: number, window: number, seed = 2006, blocks = 8) {
  const rand = rng(seed);
  const w = Math.max(1, Math.min(window - 1, Math.floor(n / 2)));
  const seq: number[][] = [];
  for (let b = 0; b < blocks; b++) {
    let block = shuffle(n, rand);
    if (b > 0) block = pushBack(block, new Set(seq[b - 1].slice(-w)), w);
    seq.push(block);
  }
  // The last block also meets the first one (the sequence is read cyclically).
  const last = seq[blocks - 1].slice().reverse();
  seq[blocks - 1] = pushBack(last, new Set(seq[0].slice(0, w)), w).reverse();
  return seq.flat();
}

export type Slot = { d: number; x: number; y: number; r: number };

/**
 * Fixed constants for each pool slot: a depth spread evenly through the tunnel, a Poisson-disc spot
 * on the [-1, 1] plane outside a clear central lane, and a small tilt. Neighbours on screen are
 * given far-apart depths so they never stack.
 */
export function buildSlots(pool: number, opts: { minDist: number; laneX: number; laneY: number }, seed = 1846): Slot[] {
  const rand = rng(seed);
  const pts: { x: number; y: number }[] = [];
  let minDist = opts.minDist;
  for (let tries = 0; pts.length < pool; tries++) {
    if (tries > 4000) { minDist *= 0.9; tries = 0; } // crowded: relax the spacing
    const x = rand() * 2 - 1;
    const y = rand() * 2 - 1;
    if (Math.abs(x) < opts.laneX && Math.abs(y) < opts.laneY) continue;
    if (pts.every((p) => Math.hypot(p.x - x, p.y - y) >= minDist)) pts.push({ x, y });
  }
  pts.sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));
  const stride = pool % 7 === 0 ? 5 : 7; // coprime with pool, so every depth is used once
  return Array.from({ length: pool }, (_, i) => {
    const p = pts[(i * stride) % pool];
    return { d: ((i + rand() * 0.6) * TUNNEL.length) / pool, x: p.x, y: p.y, r: (rand() * 2 - 1) * 3 };
  });
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/**
 * Where slot i is when the camera is at `cam`: its depth in front of the camera (0 = at the lens,
 * L = farthest), its opacity, and which sequence entry it shows. The entry changes only when the
 * slot wraps from the front to the back (or back to front in reverse), where its opacity is 0.
 * The slots on screen always show `pool` consecutive sequence entries.
 */
export function slotAt(slot: Slot, i: number, pool: number, cam: number) {
  const L = TUNNEL.length;
  const rel = slot.d - cam;
  const z = mod(rel, L);
  const k = -Math.floor(rel / L); // how many times this slot has passed the camera
  const opacity = smooth(L, TUNNEL.fadeInFrom * L, z) * smooth(TUNNEL.fadeOutTo * L, TUNNEL.fadeOutFrom * L, z);
  return { z, entry: i + k * pool, opacity };
}

/** The sequence entry at an (unbounded) index. */
export const entryAt = (seq: number[], entry: number) => seq[mod(entry, seq.length)];

// Self-check for src/features/quizzers/tunnel.ts (Node 24 strips the types). Run: node scripts/check-tunnel.mjs
import assert from "node:assert/strict";
import { TUNNEL, buildSequence, buildSlots, entryAt, slotAt } from "../src/features/quizzers/tunnel.ts";

const L = TUNNEL.length;
for (const [n, pool] of [[185, 28], [185, 16], [40, 16], [5, 16]]) {
  const seq = buildSequence(n, pool);
  // Every block is a permutation: each poster appears before any repeats.
  for (let b = 0; b < seq.length; b += n) assert.equal(new Set(seq.slice(b, b + n)).size, n, `block ${b / n} is a permutation (n=${n})`);
  // Neighbours always differ, cyclically.
  for (let i = 0; i < seq.length; i++) assert.notEqual(seq[i], entryAt(seq, i + 1), `neighbours differ at ${i} (n=${n})`);
  // Any `pool` consecutive entries differ when there are enough posters.
  if (n >= 2 * pool) {
    for (let i = 0; i < seq.length; i++) {
      const win = Array.from({ length: pool }, (_, j) => entryAt(seq, i + j));
      assert.equal(new Set(win).size, pool, `window at ${i} has no repeats (n=${n}, pool=${pool})`);
    }
  }

  const slots = buildSlots(pool, { minDist: 0.32, laneX: 0.22, laneY: 0.18 });
  const shown = (cam) => slots.map((s, i) => slotAt(s, i, pool, cam));
  for (let cam = -3 * L; cam <= 3 * L; cam += 37.3) {
    const now = shown(cam);
    // The slots show `pool` consecutive entries (so the window rule above covers the screen).
    const entries = now.map((s) => s.entry).sort((a, b) => a - b);
    for (let j = 1; j < entries.length; j++) assert.equal(entries[j], entries[0] + j, `consecutive entries at cam ${cam}`);
    // Depth is in range; an image change happens only where the slot is invisible.
    const next = shown(cam + 37.3);
    now.forEach((s, i) => {
      assert.ok(s.z >= 0 && s.z < L);
      if (s.entry !== next[i].entry) assert.ok(s.opacity < 0.01 && next[i].opacity < 0.01, `swap is invisible (slot ${i}, cam ${cam})`);
    });
    // Same cam, same picture, whichever way we arrived.
    assert.deepEqual(shown(cam), now);
  }
  console.log(`ok  n=${n} pool=${pool}`);
}

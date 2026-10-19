# Quizzer's Circuit poster tunnel: plan

Phase 1 output. No feature code has been written. Inventory details: [inventory.md](inventory.md), [inventory.json](inventory.json), [samples.jpg](samples.jpg) ([samples.md](samples.md) lists the 12 files).

## What the inventory found

- **185 files in `CLS@\Armaan`, all images, 47.3 MB:** 172 JPEG and 13 WebP.
  - No HEIC, PNG, GIF or TIFF.
  - No non-image files.
  - None corrupt, none animated, none transparent, none with an EXIF rotation.
  - All are downloaded from OneDrive: 0 cloud-only, 0 slow reads.
- **182 unique posters after deduplication:**
  - `fight club.jpg` is byte-identical to `57170885….jpg`.
  - `rockstar.jpg` is byte-identical to `9c5da7bb….jpg`.
  - `beabadoobee.jpg` ≈ `IMG_9874.JPG`: the same poster at a different size, confirmed by eye.
  - `fight club poster.webp` and `fight club.jpg` are *different* posters; both stay.
- **Shapes:** 181 portrait, 1 square, 3 landscape.
  - Dominant ratios: **4:5 (0.80, 43 files)**, **1:√2 (0.71, 38)**, **2:3 (0.67, 24)** and 3:4 (0.75, 21).
  - Range 0.525 to 1.44.
- **Resolution:**
  - The long side is 800–1200 px for 124 of the posters.
  - One is tiny: `Interstellar poster.webp`, 474×593.
  - None is huge.
  - 11 are under 800 px on the long side and will look soft as large close-ups.
- **Content:** these are designed, stylised posters for films, shows, anime, musicians and footballers (see samples.jpg), mostly 736 px wide.
  - 34 files are named after their subject. The 110 hex-named and 41 `IMG_` files carry no information in the name.

### Mixed aspect ratios

98% of the posters are portrait, so there are no separate slot types. Every slot has a fixed **height** that depends on depth. Its width is `height × aspect`, taken from the manifest, so each poster keeps its own shape. The four square or landscape posters come out wider at the same height, which reads as variety, not a bug.

## A. Image pipeline: `npm run quizzers:images`

The script is `scripts/quizzers-images.mjs`, using sharp 0.35, now installed as a devDependency. It reads `inventory.json` and the originals, read-only.

1. **Skip:** corrupt files (there are none) and duplicates, keeping the larger file of each group.
2. **Rotate:** run `.rotate()` to apply EXIF orientation (none needed today; kept for future files).
3. **Encode:** at 480 and 960 px on the long side with `withoutEnlargement`. Names are `public/quizzers/<sha12>-480.avif|webp` and `-960.avif|webp`, so they're stable from the content hash.
4. **LQIP:** a 24 px WebP of about 280 bytes, inlined as base64 in the manifest.
5. **Manifest:** `src/content/quizzers/manifest.json` with `[{id, w, h, aspect, src480, src960, avif480, avif960, lqip, alt}]`. Alt defaults to "Quizzer's Circuit poster N".
6. **Idempotent:** existing outputs are skipped, and the manifest is rewritten in a stable order.

**Sizes**, measured by encoding every unique poster in memory:

| | Total | Per poster |
| --- | --- | --- |
| Originals | 47.3 MB | 262 KB |
| WebP 480 (q78) | 5.9 MB | 33 KB |
| WebP 960 (q78) | 20.0 MB | 112 KB |
| AVIF 960 (q50, 20-file sample) | about 10.5 MB | 63 KB (47% smaller than WebP) |
| LQIPs, inline | 50 KB | 282 B |

AVIF saves far more than the 25% bar, so the plan is AVIF first with a WebP fallback through `<picture>`. The repository holds about 39 MB of derived images.

**What a visitor downloads:**
- **First view:** about 1 MB, which is 28 × 33 KB.
- **Unoptimised:** the same view would be about 7.2 MB at original size.

## B. Pool and sequence

- **Pool:** 28 posters mounted on desktop; 16 at 640 px wide or less. It's fixed at mount. Never all 182.
- **Sequence:** a seeded Fisher–Yates shuffle of all N ids, repeated, so all 182 appear before any repeats.
  - At each boundary between shuffles, the head of the next shuffle is re-rolled until none of its first `pool` entries appear in the last `pool` entries of the previous one. That means no repeat inside any window of `pool` consecutive entries.
  - The windowed rule implies no two neighbours repeat.
- **Small N** (N < pool, for example the N = 5 test): repeats can't be avoided. Only neighbours are kept distinct, and the slots' x/y spread keeps copies apart.

## C. Tunnel maths

The model is deterministic: a slot's position and image depend only on `cam`, so backward scrolling runs the same frames in reverse. There's no state to repair.

- **Constants:**
  - Tunnel length `L` = 4200 px of depth.
  - Perspective `P` = 900 px.
  - `pool` slots.
- **Slot setup:** slot i gets its constants once, from a seeded RNG:
  - `d_i = (i + u_i·0.6) · L / pool`, depths spread evenly with jitter;
  - `(x_i, y_i)` in [−1, 1]²;
  - `r_i` = rotation in ±3°.
- **Every frame:**
  ```
  rel = d_i − cam
  z   = ((rel % L) + L) % L         // 0 = at the camera, L = farthest
  k   = floor(rel / L)              // wrap count
  img = seq[(i + k·pool) mod seq.length]   // changes only when z wraps L→0 or 0→L
  ```
- **x/y placement:** Poisson-disc in [−1, 1]² with a minimum distance of 0.32 (0.4 on phones).
  - **Clear lane:** an ellipse in the middle (|x| < 0.22, |y| < 0.18) is excluded, so nothing flies into the lens.
  - **Avoiding stacks:** slots are sorted by angle and assigned to depths round-robin, so neighbours on screen sit at different depths and never stack.
  - **Spread:** screen spread is `spreadX = 0.62·vw` and `spreadY = 0.55·vh`.
  - **Transform:** `translate3d(x·spreadX, y·spreadY, −z) rotateZ(r)` inside a `perspective: P` stage. Perspective makes side posters drift outward and grow as z → 0, with no extra maths.
- **Size:** poster height is 34vh (min 220 px) at z = 0, scaled only by perspective.
- **Opacity:**
  ```
  fadeIn  = smoothstep(L, 0.80·L, z)    // appear at the back
  fadeOut = smoothstep(0.03·L, 0.15·L, z)  // vanish just before the camera
  opacity = fadeIn · fadeOut
  ```
  - Since opacity is 0 at both ends of z, an image swap at a wrap is never visible.
  - **Depth fog:** a fixed radial-gradient overlay, near-black at the edges, over the whole stage. Opacity only, no `filter: blur`.
- **Title:** real `<h1>` text, outside the 3D stage, fixed at the top centre over the field. Its name is the `QUIZZERS_NAME` constant in `src/content/quizzers/copy.ts`.

## D. Input and smoothness

- **Virtual scroll:** the tunnel route calls `pauseScroll()` (Lenis, `src/lib/smooth.ts`) on mount and `resumeScroll()` on unmount. The stage is `position: fixed; height: 100svh`, so the page has no scroll height.
- **Input:** everything becomes `velocity` in depth px/s.
  - **Wheel:** `deltaMode` normalised (line × 16, page × innerHeight), then `velocity += delta · 9`.
  - **Touch:**
    - Vertical drag moves `cam` 1:1 × 2.2 while the finger is down.
    - On release, the last 100 ms of movement becomes a fling.
    - Swipe up goes forward.
  - **Keys:**
    - ↓, PageDown and Space go forward;
    - ↑, PageUp and Shift+Space go back;
    - Home returns to the start.
  - **Clamp:** ±6000 px/s.
- **Loop:** one `gsap.ticker` callback, through `loadGsap()` in `src/lib/gsap.ts`.
  ```
  dt  = min(ticker.deltaRatio()/60, 0.05)
  cam += (velocity + drift) · dt
  velocity *= exp(−4.2 · dt)            // frame-rate independent damping
  ```
  - It writes `style.transform` and `style.opacity` to the pool items only, and `src` only on a wrap.
  - It reads no layout per frame: viewport size is cached on `resize`.
  - The pool items get `will-change: transform, opacity`.
  - Device pixel ratio is capped by the size choice: 960 images only for near slots, even on 3× screens.
- **Idle drift:** 22 px/s forward. None under reduced motion or "Pause motion".
- **Title:**
  - The first input fades it out over 400 ms (`ease-leave`).
  - It fades back in when `cam` returns within 150 px of 0.
  - It is never removed from the DOM.
- **Behaviour cases:**
  - **Fast flick:** the velocity clamp limits it to about 100 px of depth per frame at 60 fps, which is under 1/40 of L. Deterministic wraps mean nothing skips or jumps, at any speed.
  - **Trackpad:** many small deltas add up smoothly. The exponential damping turns them into a glide without fighting the trackpad's own momentum.
  - **Touchscreen:** direct drag plus fling. `touch-action: none` applies to the stage only.
  - **Inactive tab:** the ticker is removed on `visibilitychange`. `dt` is clamped to 50 ms, so on return there's no big step.

## E. CSS 3D + GSAP, not WebGL

- **Cost:** 28 `<img>` layers, each changing only `transform` and `opacity`, are composited on the GPU with no layout or paint per frame. That is well within 60 fps on mid-range phones.
- **Why not WebGL:**
  - It would add Three.js (`three@0.165` is installed but unused by the site).
  - It needs a DOM mirror for focus, click and screen readers.
  - Every recycled poster needs a texture upload, and that stutters on phones.
- **What's needed:** nothing new. If M3 measurements show frames over 20 ms that I can't fix, I'll come back and ask before switching.

## F. Image loading

- **Preload:** the next `K = pool / 2` sequence entries in the direction of travel are preloaded with `new Image()`, then `img.decode()`. They're held in a cache of about 3 × pool with LRU eviction.
- **Swap:** when a slot wraps, it shows the LQIP as its CSS background right away and swaps `src` once the decode resolves.
- **Size:** 960 for slots with z < 0.35 L, otherwise 480. It's chosen by the slot, not by `sizes`, so a slot never fetches twice.
- **No layout shift:** the box reserves its width and height from the manifest aspect.
- **Aborting:**
  - Late decodes are ignored with a per-slot generation counter.
  - Preloads use `fetchPriority = "low"`.
  - On unmount, `src` is cleared on the pool.

## G. Interaction

- **Hover:** Motion lifts the poster 2 px and scales it to 1.02 at `quick` (180 ms), with a 2 px focus-style outline. Pointer hover never changes depth.
- **Open:** click, tap, or Enter/Space on the highlighted poster calls `navigate(posterTarget(poster))`. `posterTarget()` returns the same route for every poster for now.
- **Keyboard:**
  - The field is one tab stop: a roving `tabIndex`; poster buttons are inside `role="list"`.
  - ←/→/↑/↓ move the highlight to the nearest visible poster in that direction, scored on screen position.
  - The camera eases the highlighted poster to z ≈ 0.3 L over 600 ms (`ease-page`).
  - Tab and Shift+Tab leave the field normally, so focus is never trapped.
- **Label:** `aria-label="Open Quizzer's Circuit, poster 12 of 182"`.
- **Escape:** on the Quizzers page, Escape works like Back.

## H. Transition and the Quizzers page

- **Routes:**
  - `/sub-clubs/quizzers-circuit` is the tunnel.
  - `/sub-clubs/quizzers-circuit/about` is the page (the name is decision 2).
  - Both go into `src/main.tsx` ahead of the generic `/sub-clubs/:slug` stub.
- **Transition:**
  - The page is a nested route rendered *over* the tunnel, so the tunnel stays mounted.
  - A 500 ms GSAP crossfade: the tunnel fades out with `ease-leave` while the page fades in with `ease-page`.
  - The tunnel's ticker stops while it is hidden.
- **Back:**
  - The Back button (fixed top-left, always visible), browser Back and Escape all return to the tunnel route.
  - The page fades out, `cam` resets to 0, the title returns, and the drift resumes.
  - The page doesn't use Layout's 600 ms page cross-fade; the tunnel uses its own.
- **Page content:**
  - A hero with the section name and a one-line placeholder;
  - the main description, as placeholder paragraphs;
  - a closing area with links and contact placeholders.
  - All copy lives in `src/content/quizzers/copy.ts`, every string marked `PLACEHOLDER`.

## I. Look (placeholders until decided)

- **Ground:** #0B0A09 in both themes. The stage carries `data-theme="dark"`.
- **Title:** large, heavy, retro poster type in the accent yellow, with a hard 6 px red offset shadow (`text-shadow`, no blur).
  - Handlee has a single weight and the design system forbids faked bold, so a truly heavy title needs a new face (decision 4).
  - Until then: Handlee at 400 with the shadow.
- **Posters:** a 6 px off-white paper border, a soft black drop shadow, rotations within ±3°.
- **Grain:** a static SVG noise tile at 8% opacity, shifted by `transform` every 120 ms. No CSS filters.
- **Retro accents:** blue #2F5BFF, red #FF3B1F, yellow #FFD23F, orange #FF8A1F, lime #B6F23A. They're custom properties scoped to `.qz`, used for the title, focus highlight and page accents only.
- **Themes:** the Quizzers page follows the site theme, with retro accents on top of the design system's ground and ink tokens. The rest of the site is unchanged.

## J. Accessibility

- **Reduced motion:** no tunnel, no drift. A plain paginated grid of all 182 posters: 24 per page, prev/next buttons and a page count, every poster a link to the same route.
- **Focus:** a visible ring everywhere (2 px `focus` with a 2 px gap). Keyboard focus is never trapped.
- **Text and motion:** the title is real text. Nothing moves on load except the slow drift.
- **Pausing:** a visible "Pause motion" toggle in the bottom right, remembered per browser. The loop also pauses when the tab is hidden.

## K. Phones

- **Pool and input:** 16 posters; swipe up and down moves forward and back; tap opens a poster.
- **Layout:**
  - The stage is `100svh` so the address bar doesn't make it jump.
  - Spread is tighter and the Poisson radius larger, so at 400 px wide posters don't overlap the lane or each other.
  - The title is set with `clamp(2.5rem, 11vw, 6rem)`.
- **Nav:** the site nav bar stays on top of the tunnel. The phone Menu still works.

## L. Test plan

- **Dev overlay** (`?debug`, dev builds only): N, pool size, `cam`, velocity, FPS, the longest frame in the last 2 s, and a count of repeated images in the visible set.
- **`?n=5`:** limits the manifest to 5 posters for the edge case.
- **Self-check:** `scripts/check-tunnel.mjs` asserts:
  - the same cam gives the same images forward and back;
  - no repeats in any `pool` window when N ≥ pool;
  - N = 5 never shows the same poster in two adjacent slots.
- **Runs:**
  - all 182;
  - N = 5;
  - DevTools Slow 4G;
  - 4× CPU throttle with a 400 px viewport;
  - Lighthouse Performance and Accessibility.
- **Pass criteria:**
  - steady 60 fps on desktop, and no frame over 20 ms during a fast flick;
  - no visible pop-in, since only LQIP to sharp swaps happen and only at opacity below 0.2;
  - no repeated poster inside the visible set when N ≥ pool;
  - CLS 0;
  - Lighthouse Accessibility ≥ 95, Performance ≥ 85 on mobile;
  - the reduced-motion grid fully works with the keyboard;
  - Back returns to the tunnel at the top with the flow running.

## M. Milestones

| | Delivers | Review |
| --- | --- | --- |
| M1 | Inventory (done) + image pipeline + manifest | Output sizes, manifest, spot-check images |
| M2 | Static field: pool placed at cam = 0, title, look | Screenshots |
| M3 | Scroll-driven flythrough with recycling, idle drift, dev overlay | FPS and longest-frame numbers, video or screenshots |
| M4 | Click, keyboard, Quizzers page, Back, browser Back, Escape | Walkthrough |
| M5 | Reduced-motion grid, Pause toggle, phone layout, performance pass, Lighthouse | Metrics |
| M6 | Polish, final report | Report |

**Screenshots:** each milestone shows dark and light, desktop and a 400 px phone. Browser tools aren't connected in this session, so either you take screenshots from `npm run dev`, or I add Playwright as a dev-only tool to capture them (decision 7).

## N. Risks and open questions

1. **Rights.** These are fan-designed posters of commercial films, shows and artists, found online, plus phone screenshots (`IMG_…`). Publishing them on a public club site may need permission or credit to the designers. Is that settled?
2. **Duplicates.** Three are dropped (listed above). Agree?
3. **Low resolution.** `Interstellar poster.webp` (474×593) and 10 more under 800 px look soft when close. Keep them (960 is never upscaled, so they stay at their size) or drop them?
4. **Mixed aspect ratios.** Handled with one height and each poster's own width, as described above. There are no outliers to drop.
5. **One page or one per poster.** `posterTarget()` makes per-poster pages a one-line change later.
6. **Real copy.** The club text, links and contact details. Everything is a marked placeholder until then.
7. **Colour and fonts.** The heavy title face and the final retro palette.
8. **Design-system conflicts.** Each one follows your words for this page:
   - **Spelling:** you wrote "Quizzer's Circuit"; the design system says "Quizzers Circuit". It's one constant, set to yours.
   - **Palette:** a retro multi-colour palette instead of the Old Money one.
   - **Grain:** film grain, where the design system says "no gradients and texture".
   - **Looping:** the idle drift loops, where it says "nothing loops".
   - **Scroll:** virtual scroll takes over the wheel, where Home: the four club chapters says "no scroll-jacking".
   - **Shadows:** drop shadows on dark, where it asks for glows.
   - **Title font:** Handlee for the title has no heavy weight, against "heavy type".
   - **Page layout:** the design system's sub-club page recipe is a burgundy FeatureField header plus About-style sections. Yours is hero, description, closing; I'll follow yours.

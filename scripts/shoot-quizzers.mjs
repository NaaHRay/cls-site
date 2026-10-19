// Dev tool: screenshots and frame timings of the Quizzer's Circuit tunnel.
// Start `npm run dev` first, then: node scripts/shoot-quizzers.mjs [baseUrl]  → docs/quizzers/shots/
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://localhost:5173";
const OUT = "docs/quizzers/shots";
await mkdir(OUT, { recursive: true });
// Without these flags headless Chromium rasterises on the CPU (SwiftShader), which says nothing about real frame rates.
const browser = await chromium.launch({ args: ["--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist"] });
const report = [];

const VIEWS = { desktop: { width: 1440, height: 900 }, phone: { width: 400, height: 860, isMobile: true, hasTouch: true } };

for (const [view, opts] of Object.entries(VIEWS)) {
  for (const theme of ["dark", "light"]) {
    const { width, height, ...rest } = opts;
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, ...rest });
    await page.addInitScript((t) => localStorage.setItem("cls-theme", t), theme);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    // The phone run stands in for a mid-range phone: 4× slower CPU.
    if (view === "phone") await (await page.context().newCDPSession(page)).send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.goto(`${BASE}/sub-clubs/quizzers-circuit?debug`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/${view}-${theme}-1-opening.png` });

    // Record every frame interval while flying forward fast, then back.
    await page.evaluate(() => {
      window.__frames = [];
      let last = performance.now();
      const loop = (t) => {
        window.__frames.push(t - last);
        last = t;
        if (window.__frames.length < 100000) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
    await page.mouse.move(width / 2, height / 2);
    if (view === "phone") {
      for (let i = 0; i < 6; i++) {
        await page.mouse.move(width / 2, height * 0.8);
        await page.evaluate(([x, y]) => {
          const el = document.querySelector(".qz-stage");
          const fire = (type, yy) => el.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: "touch", clientX: x, clientY: yy, bubbles: true }));
          fire("pointerdown", y);
          for (let k = 1; k <= 8; k++) fire("pointermove", y - k * 40);
          fire("pointerup", y - 320);
        }, [width / 2, height * 0.8]);
        await page.waitForTimeout(120);
      }
    } else {
      for (let i = 0; i < 30; i++) {
        await page.mouse.wheel(0, 240); // a fast flick
        await page.waitForTimeout(16);
      }
    }
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/${view}-${theme}-2-flying.png` });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/${view}-${theme}-3-settled.png` });
    for (let i = 0; i < 30; i++) {
      await page.mouse.wheel(0, -240);
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(1500);
    const frames = await page.evaluate(() => window.__frames.slice(2));
    const overlay = await page.locator(".qz-debug").textContent();
    const sorted = [...frames].sort((a, b) => a - b);
    report.push({
      view,
      theme,
      frames: frames.length,
      avgFps: Math.round(1000 / (frames.reduce((s, f) => s + f, 0) / frames.length)),
      p95ms: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1),
      over20ms: frames.filter((f) => f > 20).length,
      worstMs: +sorted.at(-1).toFixed(1),
      overlay,
      errors,
    });
    await page.close();
  }
}
await browser.close();
await writeFile(`${OUT}/metrics.json`, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));

// Quizzer's Circuit poster inventory. Reads the source folder (never writes to it) and writes
// docs/quizzers/inventory.json, inventory.md and samples.jpg (a 12-image contact sheet).
// Usage: npm run quizzers:inventory -- "C:\path\to\posters"   (or set QUIZZERS_SRC)
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = process.argv[2] || process.env.QUIZZERS_SRC || "C:\\Users\\Admin\\OneDrive\\Desktop\\CLS@\\Armaan";
const OUT = path.resolve("docs/quizzers");
const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "tif", "tiff", "avif"]);
const NEAR_DUP_BITS = 6; // dHash Hamming distance that counts as "the same picture"
const POOL = 28;

const mb = (b) => b / 1048576;
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

// 64-bit difference hash: 9x8 greyscale, each bit = left pixel brighter than its right neighbour.
async function dHash(buf) {
  const px = await sharp(buf).rotate().greyscale().resize(9, 8, { fit: "fill" }).raw().toBuffer();
  let bits = 0n;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits = (bits << 1n) | (px[y * 9 + x] > px[y * 9 + x + 1] ? 1n : 0n);
  return bits;
}
const hamming = (a, b) => {
  let v = a ^ b, n = 0;
  while (v) { n += Number(v & 1n); v >>= 1n; }
  return n;
};

function oddName(name) {
  const reasons = [];
  if (/\s/.test(name)) reasons.push("space");
  if (/[^\x20-\x7e]/.test(name)) reasons.push("non-ASCII");
  if (/['&#%@!()[\]{}]/.test(name) || /_(?!\d+\.)/.test(name)) reasons.push("punctuation"); // IMG_1234 is normal
  if (/\.[A-Z]+$/.test(name)) reasons.push("uppercase extension");
  return reasons;
}

function shapeOf(aspect) {
  if (aspect < 0.85) return "portrait";
  if (aspect <= 1.15) return "square";
  return "landscape";
}

const names = (await readdir(SRC, { withFileTypes: true })).filter((d) => d.isFile()).map((d) => d.name).sort((a, b) => a.localeCompare(b));
const records = [];
const skipped = [];
const slowReads = [];

for (const name of names) {
  const ext = path.extname(name).slice(1).toLowerCase();
  const full = path.join(SRC, name);
  const st = await stat(full);
  const rec = { file: name, ext, bytes: st.size, flags: [] };
  if (!IMAGE_EXT.has(ext)) { skipped.push(name); continue; }
  if (st.size === 0) { rec.flags.push("zero-byte (cloud-only placeholder?)"); records.push(rec); continue; }
  let buf;
  const t0 = performance.now();
  try {
    buf = await readFile(full);
  } catch (e) {
    rec.flags.push(`unreadable: ${e.code ?? e.message}`);
    records.push(rec);
    continue;
  }
  const readMs = performance.now() - t0;
  if (readMs > 1500) slowReads.push({ name, ms: Math.round(readMs) });
  rec.sha256 = createHash("sha256").update(buf).digest("hex");
  try {
    const m = await sharp(buf, { animated: true }).metadata();
    const rotated = m.orientation >= 5 && m.orientation <= 8;
    const pageH = m.pageHeight ?? m.height;
    rec.format = m.format;
    rec.orientation = m.orientation ?? 1;
    rec.width = rotated ? pageH : m.width;
    rec.height = rotated ? m.width : pageH;
    rec.aspect = round(rec.width / rec.height, 3);
    rec.shape = shapeOf(rec.aspect);
    rec.hasAlpha = !!m.hasAlpha;
    rec.pages = m.pages ?? 1;
    rec.dhash = (await dHash(buf)).toString(16).padStart(16, "0");
    const long = Math.max(rec.width, rec.height);
    if (long < 600) rec.flags.push("tiny");
    if (st.size > 8 * 1048576 || long > 5000) rec.flags.push("huge");
    if (rec.aspect < 0.5 || rec.aspect > 2) rec.flags.push("unusual aspect");
    if (rec.hasAlpha && rec.format === "png") rec.flags.push("transparent PNG");
    if (rec.pages > 1) rec.flags.push("animated");
    if (rec.format && rec.format !== ext.replace("jpg", "jpeg") && !(ext === "jpg" && rec.format === "jpeg")) rec.flags.push(`extension says ${ext}, content is ${rec.format}`);
  } catch (e) {
    rec.flags.push(`corrupt: ${e.message}`);
  }
  const odd = oddName(name);
  if (odd.length) rec.flags.push(`odd filename (${odd.join(", ")})`);
  records.push(rec);
}

// Exact duplicates by content hash, near-duplicates by dHash distance (union-find over pairs).
const byHash = new Map();
for (const r of records) if (r.sha256) byHash.set(r.sha256, [...(byHash.get(r.sha256) ?? []), r.file]);
const exactGroups = [...byHash.values()].filter((g) => g.length > 1);

const hashed = records.filter((r) => r.dhash);
const parent = new Map(hashed.map((r) => [r.file, r.file]));
const find = (x) => (parent.get(x) === x ? x : (parent.set(x, find(parent.get(x))), parent.get(x)));
const pairs = [];
for (let i = 0; i < hashed.length; i++) {
  for (let j = i + 1; j < hashed.length; j++) {
    const d = hamming(BigInt("0x" + hashed[i].dhash), BigInt("0x" + hashed[j].dhash));
    if (d <= NEAR_DUP_BITS && hashed[i].sha256 !== hashed[j].sha256) {
      pairs.push({ a: hashed[i].file, b: hashed[j].file, distance: d });
      parent.set(find(hashed[i].file), find(hashed[j].file));
    }
  }
}
const nearGroupsMap = new Map();
for (const p of pairs) for (const f of [p.a, p.b]) {
  const root = find(f);
  nearGroupsMap.set(root, new Set([...(nearGroupsMap.get(root) ?? []), f]));
}
const nearGroups = [...nearGroupsMap.values()].map((s) => [...s].sort());
for (const r of records) {
  if (exactGroups.some((g) => g.includes(r.file))) r.flags.push("exact duplicate");
  if (nearGroups.some((g) => g.includes(r.file))) r.flags.push("near duplicate");
}

await mkdir(OUT, { recursive: true });
await writeFile(path.join(OUT, "inventory.json"), JSON.stringify({ source: SRC, files: names.length, skipped, records, exactGroups, nearDuplicatePairs: pairs }, null, 2) + "\n");

// ---------- inventory.md ----------
const ok = records.filter((r) => r.width);
const byExt = {};
for (const r of records) byExt[r.ext] = (byExt[r.ext] ?? 0) + 1;
const totalBytes = records.reduce((s, r) => s + r.bytes, 0);
const hist = (vals, edges, fmt) => {
  const rows = edges.slice(0, -1).map((lo, i) => {
    const hi = edges[i + 1];
    const n = vals.filter((v) => v >= lo && v < hi).length;
    return `| ${fmt(lo, hi)} | ${n} | ${"█".repeat(Math.round((n / Math.max(1, vals.length)) * 40))} |`;
  });
  return rows.join("\n");
};
const aspectBuckets = [0, 0.5, 0.6, 0.67, 0.72, 0.78, 0.85, 1.15, 1.4, 1.6, 2, Infinity];
const sizeBuckets = [0, 50e3, 100e3, 200e3, 300e3, 500e3, 1e6, 2e6, Infinity];
const shapeCount = { portrait: 0, square: 0, landscape: 0 };
for (const r of ok) shapeCount[r.shape]++;
const flagged = (pred) => records.filter((r) => r.flags.some(pred)).map((r) => `- \`${r.file}\`${r.width ? ` (${r.width}×${r.height}, ${round(r.bytes / 1024, 0)} KB)` : ""}: ${r.flags.filter(pred).join("; ")}`).join("\n") || "- none";
const avgPool = ok.length ? (totalBytes / records.length) * Math.min(POOL, records.length) : 0;
const commonRatios = {};
for (const r of ok) { const k = r.aspect.toFixed(2); commonRatios[k] = (commonRatios[k] ?? 0) + 1; }
const topRatios = Object.entries(commonRatios).sort((a, b) => b[1] - a[1]).slice(0, 8);
const named = records.filter((r) => !/^[0-9a-f]{32}$/i.test(path.parse(r.file).name) && !/^IMG_\d+$/i.test(path.parse(r.file).name));

const md = `# Quizzer's Circuit poster inventory

Source: \`${SRC}\` (read only; originals untouched). Generated by \`npm run quizzers:inventory\`.

## Counts

| | Count |
| --- | --- |
| Files | ${names.length} |
| Images | ${records.length} |
${Object.entries(byExt).sort().map(([k, v]) => `| .${k} | ${v} |`).join("\n")}
| Non-image files skipped | ${skipped.length}${skipped.length ? ` (${skipped.join(", ")})` : ""} |
| Readable images | ${ok.length} |
| Portrait / square / landscape | ${shapeCount.portrait} / ${shapeCount.square} / ${shapeCount.landscape} |

Total weight: **${round(mb(totalBytes), 1)} MB**. Unoptimised, a tunnel showing the first ${POOL} posters would load about **${round(mb(avgPool), 1)} MB**; every poster at original size is **${round(mb(totalBytes), 1)} MB**.

OneDrive: ${records.filter((r) => r.flags.some((f) => f.startsWith("zero-byte") || f.startsWith("unreadable"))).length} files unreadable or zero-byte; ${slowReads.length} slow reads (over 1.5 s)${slowReads.length ? `: ${slowReads.map((s) => `${s.name} ${s.ms}ms`).join(", ")}` : ""}.

## Aspect ratio (width / height, after EXIF rotation)

| Range | Images | |
| --- | --- | --- |
${hist(ok.map((r) => r.aspect), aspectBuckets, (lo, hi) => `${lo}–${hi === Infinity ? "∞" : hi}`)}

Most common ratios: ${topRatios.map(([k, v]) => `${k} (${v})`).join(", ")}.

## File size

| Range | Images | |
| --- | --- | --- |
${hist(records.map((r) => r.bytes), sizeBuckets, (lo, hi) => `${round(lo / 1e3, 0)}–${hi === Infinity ? "∞" : round(hi / 1e3, 0)} KB`)}

## Long side (px)

| Range | Images | |
| --- | --- | --- |
${hist(ok.map((r) => Math.max(r.width, r.height)), [0, 600, 800, 1000, 1200, 1600, 2000, 3000, 5000, Infinity], (lo, hi) => `${lo}–${hi === Infinity ? "∞" : hi}`)}

## Flagged

### Corrupt or unreadable
${flagged((f) => f.startsWith("corrupt") || f.startsWith("unreadable") || f.startsWith("zero-byte"))}

### Tiny (long side under 600 px)
${flagged((f) => f === "tiny")}

### Huge (over 8 MB or over 5000 px)
${flagged((f) => f === "huge")}

### Exact duplicates (same bytes)
${exactGroups.map((g) => `- ${g.map((f) => `\`${f}\``).join(" = ")}`).join("\n") || "- none"}

### Near duplicates (dHash distance ≤ ${NEAR_DUP_BITS})
${nearGroups.map((g) => `- ${g.map((f) => `\`${f}\``).join(" ≈ ")}`).join("\n") || "- none"}

### Unusual aspect ratio (under 0.5 or over 2)
${flagged((f) => f === "unusual aspect")}

### Transparent PNGs
${flagged((f) => f === "transparent PNG")}

### Animated
${flagged((f) => f === "animated")}

### EXIF orientation other than 1
${ok.filter((r) => r.orientation !== 1).map((r) => `- \`${r.file}\`: orientation ${r.orientation}`).join("\n") || "- none"}

### Extension does not match content
${flagged((f) => f.startsWith("extension says"))}

### Odd filenames
${flagged((f) => f.startsWith("odd filename"))}

## Filenames that name something

These ${named.length} files are named after films, shows or musicians. Nothing about quizzes, dates or captions is inferred from them.

${named.map((r) => `- \`${r.file}\``).join("\n")}
`;
await writeFile(path.join(OUT, "inventory.md"), md);

// ---------- samples.jpg: 12 images spread across the aspect range ----------
const sorted = [...ok].sort((a, b) => a.aspect - b.aspect);
const picks = Array.from({ length: Math.min(12, sorted.length) }, (_, i) => sorted[Math.round((i * (sorted.length - 1)) / Math.max(1, Math.min(12, sorted.length) - 1))]);
const CELL_W = 260, CELL_H = 300, GAP = 12, COLS = 6;
const rows = Math.ceil(picks.length / COLS);
const tiles = await Promise.all(picks.map(async (r, i) => ({
  input: await sharp(path.join(SRC, r.file)).rotate().resize(CELL_W, CELL_H, { fit: "contain", background: "#1a1918" }).jpeg().toBuffer(),
  left: GAP + (i % COLS) * (CELL_W + GAP),
  top: GAP + Math.floor(i / COLS) * (CELL_H + GAP),
})));
await sharp({ create: { width: GAP + COLS * (CELL_W + GAP), height: GAP + rows * (CELL_H + GAP), channels: 3, background: "#0b0a09" } })
  .composite(tiles).jpeg({ quality: 82 }).toFile(path.join(OUT, "samples.jpg"));
await writeFile(path.join(OUT, "samples.md"), `# Sample sheet (samples.jpg), left to right, top to bottom\n\n${picks.map((r, i) => `${i + 1}. \`${r.file}\` ${r.width}×${r.height}, aspect ${r.aspect}`).join("\n")}\n`);

console.log(`${names.length} files, ${records.length} images, ${ok.length} readable, ${round(mb(totalBytes), 1)} MB; ${exactGroups.length} exact duplicate groups, ${nearGroups.length} near-duplicate groups.`);

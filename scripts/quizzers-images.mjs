// Quizzer's Circuit image pipeline. Reads docs/quizzers/inventory.json and the originals (never written
// to), and writes public/quizzers/<sha12>-{480,960}.{avif,webp} plus src/content/quizzers/manifest.json.
// Idempotent: an output that already exists is skipped. Run `npm run quizzers:inventory` first.
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const inv = JSON.parse(await readFile("docs/quizzers/inventory.json", "utf8"));
const OUT = path.resolve("public/quizzers");
const SIZES = [480, 960];
const FORMATS = { avif: { quality: 50 }, webp: { quality: 78 } };
await mkdir(OUT, { recursive: true });
await mkdir("src/content/quizzers", { recursive: true });

const exists = (p) => access(p).then(() => true, () => false);
let written = 0;
const manifest = [];

for (const r of inv.records) {
  if (!r.width || r.flags.some((f) => f.startsWith("corrupt"))) continue;
  const id = r.sha256.slice(0, 12);
  let buf;
  const load = async () => (buf ??= await readFile(path.join(inv.source, r.file)));
  for (const size of SIZES) {
    for (const [fmt, opts] of Object.entries(FORMATS)) {
      const file = path.join(OUT, `${id}-${size}.${fmt}`);
      if (await exists(file)) continue;
      await sharp(await load()).rotate().resize(size, size, { fit: "inside", withoutEnlargement: true })[fmt](opts).toFile(file);
      written++;
    }
  }
  const lqip = await sharp(await load()).rotate().resize(24, 24, { fit: "inside" }).webp({ quality: 40 }).toBuffer();
  manifest.push({
    id,
    w: r.width,
    h: r.height,
    aspect: r.aspect,
    base: `/quizzers/${id}`,
    lqip: `data:image/webp;base64,${lqip.toString("base64")}`,
    alt: `Quizzer's Circuit poster ${manifest.length + 1}`,
  });
}

await writeFile("src/content/quizzers/manifest.json", JSON.stringify(manifest, null, 1) + "\n");
console.log(`${manifest.length} posters in the manifest, ${written} image files written.`);

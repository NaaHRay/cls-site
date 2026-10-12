// Builds the Editorial Board's newsletter shelf: public/landing-pages/complete-shelf-v2.html.
// Source: ThreeUI's Complete Shelf page as packaged in @designcodeio/threeui (left untouched in
// node_modules), with its seven "tool" books replaced by the club's newsletter issues from
// content/newsletters/*.json (written by Decap CMS at /admin), and its colours and fonts moved onto
// the CLS design system. Every patch must match exactly once, so a package update that moves the
// source fails the build instead of shipping a half-patched page.
// Run: node scripts/build-shelf.mjs
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const SOURCE = new URL("node_modules/@designcodeio/threeui/lib-dist/assets/landing-pages/complete-shelf-v2.html", root);
const OUT = new URL("public/landing-pages/complete-shelf-v2.html", root);
const CONTENT = new URL("content/newsletters/", root);

// ---- design-system colours (raw tokens from design/tokens.json) ----
const tokens = JSON.parse(readFileSync(new URL("design/tokens.json", root), "utf8"));
const raw = Object.fromEntries(tokens.color.tokens.filter((c) => typeof c.value === "string").map((c) => [c.name, c.value]));
const C = (name) => {
  if (!raw[name]) throw new Error(`build-shelf: no raw colour token "${name}"`);
  return raw[name];
};
// A mix of two palette colours (the DS builds its neutrals the same way).
const mix = (a, b, t) => {
  const p = (h) => [1, 3, 5].map((i) => parseInt(C(h).slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
};

// Each issue picks one colourway in the CMS. Text pairs follow the DS Color tables:
// on burgundy and deep maroon only ivory (ink-on-feature); rose and leaf never as text on burgundy.
const COLOURWAYS = {
  night: {
    label: "Black · ivory · rose",
    room: C("black"), deep: mix("black", "charcoal", 0.07), ink: C("ivory"), inkSoft: C("stone"),
    cloth: C("maroon"), foil: C("ivory"), accent: C("rose-bright"),
    shelf: C("maroon-deep"), shelfDark: mix("maroon-deep", "black", 0.6),
  },
  burgundy: {
    label: "Burgundy · ivory · deep maroon",
    room: C("maroon"), deep: mix("maroon", "black", 0.25), ink: C("ivory"), inkSoft: C("ivory"),
    cloth: C("maroon-deep"), foil: C("ivory"), accent: C("ivory"),
    shelf: C("maroon-deep"), shelfDark: mix("maroon-deep", "black", 0.6),
  },
  ivory: {
    label: "Ivory · navy · burgundy",
    room: C("ivory"), deep: mix("ivory", "stone", 0.2), ink: C("ink-black"), inkSoft: C("charcoal"),
    cloth: C("leaf-navy"), foil: C("ivory"), accent: C("maroon"),
    shelf: C("maroon-deep"), shelfDark: mix("maroon-deep", "black", 0.6),
  },
  "deep-maroon": {
    label: "Deep maroon · ivory · black",
    room: C("maroon-deep"), deep: mix("maroon-deep", "black", 0.3), ink: C("ivory"), inkSoft: C("ivory"),
    cloth: C("ink-black"), foil: C("ivory"), accent: C("ivory"),
    shelf: mix("charcoal", "black", 0.5), shelfDark: mix("charcoal", "black", 0.8),
  },
};

// ---- the issues ----
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const longDate = (d) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || "");
  return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : "[date]";
};
const monthYear = (d) => {
  const m = /^(\d{4})-(\d{2})/.exec(d || "");
  return m ? `${MONTHS[+m[2] - 1]} ${m[1]}` : "[date]";
};
// The original seven books' shapes and motifs, reused in turn so the shelf keeps its rhythm.
const SHAPES = [
  { motifKey: "brackets", width: 1.02, height: 1.58, depth: 0.26, seed: 11 },
  { motifKey: "paths", width: 1.1, height: 1.46, depth: 0.29, seed: 22 },
  { motifKey: "caret", width: 0.92, height: 1.52, depth: 0.22, seed: 33 },
  { motifKey: "orbits", width: 1.08, height: 1.68, depth: 0.25, seed: 44 },
  { motifKey: "modules", width: 1, height: 1.48, depth: 0.3, seed: 55 },
  { motifKey: "frames", width: 0.96, height: 1.57, depth: 0.24, seed: 66 },
  { motifKey: "compass", width: 1.12, height: 1.63, depth: 0.28, seed: 77 },
];

const issues = readdirSync(CONTENT)
  .filter((f) => f.endsWith(".json"))
  .map((f) => ({ id: f.replace(/\.json$/, ""), ...JSON.parse(readFileSync(new URL(f, CONTENT), "utf8")) }))
  .sort((a, b) => (b.date || "").localeCompare(a.date || "") || a.id.localeCompare(b.id)); // newest first, undated last
if (!issues.length) throw new Error("build-shelf: content/newsletters/ has no issues (the shelf needs at least one)");

const BOOKS = issues.map((n, i) => {
  const cw = COLOURWAYS[n.colourway];
  if (!cw) throw new Error(`build-shelf: ${n.id}.json has unknown colourway "${n.colourway}" (${Object.keys(COLOURWAYS).join(", ")})`);
  const articles = (n.articles ?? []).filter((a) => a?.heading);
  const heads = articles.map((a) => a.heading);
  while (heads.length < 3) heads.push("[article]");
  const issue = String(n.issue ?? "").trim() || "[issue]";
  return {
    id: n.id,
    title: n.title || "[Issue title]",
    roman: issue,
    discipline: monthYear(n.date),
    note: n.summary || "[one line about this issue]",
    deck: n.intro || "",
    binding: `Issue ${issue}`,
    format: longDate(n.date),
    theme: `${articles.length} ${articles.length === 1 ? "article" : "articles"}`,
    motif: n.editors || "[editors]",
    motifKey: SHAPES[i % 7].motifKey,
    paletteLabel: cw.label,
    color: cw.cloth,
    foil: cw.foil,
    accent: cw.accent,
    palette: {
      paper: cw.room, paperDeep: cw.deep, paperPale: C("ivory"), ink: cw.ink, inkSoft: cw.inkSoft,
      wall: cw.room, shelf: cw.shelf, shelfDark: cw.shelfDark, light: C("ivory"), fill: mix("ivory", "leaf-bright", 0.35),
    },
    width: SHAPES[i % 7].width,
    height: SHAPES[i % 7].height,
    depth: SHAPES[i % 7].depth,
    chapters: heads.slice(0, 3),
    seed: SHAPES[i % 7].seed,
    cover: n.cover || "",
    pdf: n.pdf || "",
    articles: articles.map((a) => ({ heading: a.heading, author: a.author || "", body: a.body || "" })),
  };
});

// ---- patching ----
let html = readFileSync(SOURCE, "utf8");
const once = (name, from, to) => {
  const n = typeof from === "string" ? html.split(from).length - 1 : (html.match(new RegExp(from.source, from.flags.replace("g", "") + "g")) || []).length;
  if (n !== 1) throw new Error(`build-shelf: patch "${name}" matched ${n} times (expected 1); the packaged page changed`);
  html = html.replace(from, typeof to === "string" ? () => to : to);
};
const every = (name, from, to, expected) => {
  const n = html.split(from).length - 1;
  if (n !== expected) throw new Error(`build-shelf: patch "${name}" matched ${n} times (expected ${expected}); the packaged page changed`);
  html = html.split(from).join(to);
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// JSON for inside a <script>: no "</script" and no raw line/paragraph separators (U+2028/9).
const LS = new RegExp(String.fromCharCode(0x2028, 124, 0x2029), "g");
const BS = "\\"; // one backslash
const js = (v) => JSON.stringify(v, null, 2).replace(/</g, BS + "u003c").replace(LS, (c) => BS + "u" + c.charCodeAt(0).toString(16));

const HANDLEE = 'Handlee, "Segoe Print", cursive';
const ANTIC = '"Antic Slab", Rockwell, "Courier New", serif';
const first = COLOURWAYS[issues[0].colourway];

// head: copy, fonts, starting colours (the first issue's, so the loading screen matches)
once("theme-color", '<meta name="theme-color" content="#171a24">', `<meta name="theme-color" content="${first.room}">`);
once("description", /content="Working Volumes is an original[^"]*"/, 'content="The Crescent Literary Society newsletter: every issue on one shelf."');
once("title", "<title>Working Volumes — Seven Tools for Making</title>", "<title>The CLS Newsletter — Crescent Literary Society</title>");
once("google fonts", "family=Inter:wght@400;500;600&amp;display=swap", "family=Handlee&amp;family=Antic+Slab&amp;display=swap");
once("--paper", "--paper: #171a24;", `--paper: ${first.room};`);
once("--paper-deep", "--paper-deep: #10131b;", `--paper-deep: ${first.deep};`);
once("--paper-pale", "--paper-pale: #f1eadf;", `--paper-pale: ${C("ivory")};`);
once("--ink", "--ink: #f4eee6;", `--ink: ${first.ink};`);
once("--ink-soft", "--ink-soft: #b9b4ae;", `--ink-soft: ${first.inkSoft};`);
once("--walnut", "--walnut: #3a2118;", `--walnut: ${first.shelf};`);
once("--walnut-deep", "--walnut-deep: #1c0e0a;", `--walnut-deep: ${first.shelfDark};`);
once("--accent", "--accent: #c87046;", `--accent: ${first.accent};`);
once("--serif", '--serif: "Iowan Old Style", "Baskerville", "Times New Roman", serif;', `--serif: ${HANDLEE};`);
once("--mono", '--mono: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;', `--mono: ${ANTIC};`);

// The CLS design-system layer. Last in <head>'s authored styles; !important where ThreeUI's
// component injects its own typography (Iowan/Inter, negative tracking) into the frame at runtime.
const DS_CSS = `
  <style id="cls-ds">
    /* CLS design system: Handlee headings (tracking 0), Antic Slab text (12px minimum), no faked weights. */
    body { font-synthesis: none; }
    body, .detail-deck, .selection__note, .meta-list dd, .fallback__status, .fallback__footer {
      font-family: ${ANTIC} !important;
      font-weight: 400 !important;
    }
    .selection__title, .detail-title, .editorial-identity strong, .page-status strong, .fallback-book strong,
    #fallback-title, #pointer-label-title, .cls-reader h2, .cls-reader h3 {
      font-family: ${HANDLEE} !important;
      font-weight: 400 !important;
      letter-spacing: 0 !important;
    }
    .detail-title { font-size: clamp(48px, 6vw, 72px) !important; line-height: 1.1 !important; }
    .microcopy, .page-status span, .counter, .editorial-index span, .fallback-book span, .pointer-label span,
    .loading p, .text-button, .fallback__kicker, .issue { font-size: 12px !important; }
    .selection { grid-template-columns: auto minmax(0, 1fr) !important; } /* the counter is wider at 12px */
    :focus-visible { outline: 2px solid var(--ink) !important; outline-offset: 2px; }
    .cls-reader {
      width: min(680px, 92vw); max-height: 86vh; padding: 32px; overflow: auto;
      border: 1px solid var(--rule); border-radius: 6px; background: var(--paper); color: var(--ink);
    }
    .cls-reader::backdrop { background: rgb(0 0 0 / 0.55); }
    .cls-reader__top { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin: 0 0 16px; }
    .cls-reader__top form { margin: 0; }
    .cls-reader__meta { margin: 0; color: var(--ink-soft); font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; }
    .cls-reader h2 { margin: 0 0 24px; font-size: clamp(38px, 4.4vw, 52px); line-height: 1.15; }
    .cls-reader h3 { margin: 48px 0 8px; font-size: clamp(30px, 3vw, 36px); line-height: 1.2; }
    .cls-reader p { max-width: 36rem; margin: 0 0 16px; font-size: 18px; line-height: 1.7; }
    .cls-reader .cls-reader__by { color: var(--ink-soft); font-size: 14px; letter-spacing: 0.06em; }
    .cls-reader__actions { margin-top: 32px; }
    .cls-reader .round-button, #cls-reader-pdf {
      border: 1.5px solid var(--ink-soft); background: transparent; color: var(--ink);
    }
    #cls-reader-pdf {
      display: inline-flex; align-items: center; min-height: 44px; padding: 0 20px; border-radius: 999px;
      font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; text-decoration: none;
    }
    #cls-read { margin: 16px 0 24px; }
  </style>
  <script type="importmap">`;
once("ds stylesheet", '\n  <script type="importmap">', DS_CSS);

// visible copy
once("identity", "<strong>Working Volumes</strong>\n        <span>Seven field guides for making</span>",
  "<strong>The CLS Newsletter</strong>\n        <span>Crescent Literary Society · Editorial Board</span>");
once("edition", "<span>Edition 02 · 2026</span>", `<span>${BOOKS.length} ${BOOKS.length === 1 ? "issue" : "issues"} on the shelf</span>`);
once("palette label", '<span id="palette-label">Ultramarine · bone · copper</span>', `<span id="palette-label">${esc(first.label)}</span>`);
once("pointer label", '<span id="pointer-label-index">Volume 01</span>\n      <strong id="pointer-label-title">Codex</strong>',
  `<span id="pointer-label-index">${esc(BOOKS[0].binding)}</span>\n      <strong id="pointer-label-title">${esc(BOOKS[0].title)}</strong>`);
once("counter", '<span class="counter" id="counter">01 / 07</span>', `<span class="counter" id="counter">01 / ${String(BOOKS.length).padStart(2, "0")}</span>`);
once("selection", '<h1 class="selection__title" id="selection-title">Codex</h1>\n          <p class="selection__note" id="selection-note">Precise intent, translated into tested systems.</p>',
  `<h1 class="selection__title" id="selection-title">${esc(BOOKS[0].title)}</h1>\n          <p class="selection__note" id="selection-note">${esc(BOOKS[0].note)}</p>`);
for (const [from, to] of [
  ['aria-label="Previous volume"', 'aria-label="Previous issue"'],
  ['aria-label="Next volume"', 'aria-label="Next issue"'],
  ['aria-label="Volume index"', 'aria-label="Issue index"'],
  ['aria-label="Choose a volume"', 'aria-label="Choose an issue"'],
  ['aria-label="Return volume to shelf"', 'aria-label="Return issue to shelf"'],
  ["<dt>Binding</dt>", "<dt>Issue</dt>"],
  ["<dt>Format</dt>", "<dt>Published</dt>"],
  ["<dt>Theme</dt>", "<dt>Inside</dt>"],
  ["<dt>Motif</dt>", "<dt>Editors</dt>"],
  ["<p>Binding the collection</p>", "<p>Shelving the newsletters</p>"],
]) once(from, from, to);
// the detail panel's starting text (the page fills it per issue when one opens)
const b0 = BOOKS[0];
for (const [id, text, tag] of [
  ["detail-eyebrow", `${b0.binding} · ${b0.discipline}`, "p"], ["detail-title", b0.title, "h2"], ["detail-deck", b0.deck, "p"],
  ["detail-binding", b0.binding, "dd"], ["detail-format", b0.format, "dd"], ["detail-theme", b0.theme, "dd"], ["detail-motif", b0.motif, "dd"],
]) once(id, new RegExp(`(id="${id}">)[^<]*(</${tag}>)`), (_, open, close) => open + esc(text) + close);
once("read button", '\n      <dl class="meta-list">',
  '\n      <button class="text-button" id="cls-read" type="button">Read this issue</button>\n      <dl class="meta-list">');

// the static catalogue (no WebGL, or before the shelf is ready): every issue, as real text
once("fallback kicker", "<p class=\"fallback__kicker\">Working Volumes · Static catalog</p>", '<p class="fallback__kicker">The CLS Newsletter · Every issue</p>');
once("fallback title", '<h2 id="fallback-title">Seven tools for making.</h2>', '<h2 id="fallback-title">Our newsletters.</h2>');
once("fallback status", /The complete catalog remains readable while the interactive shelf is prepared\./, "Every issue is listed here while the shelf is prepared.");
once("fallback grid", /<div class="fallback__grid" aria-label="Seven conceptual hardcovers">[\s\S]*?\n      <\/div>/,
  `<div class="fallback__grid" aria-label="Newsletter issues">\n${BOOKS.map((b) =>
    `        <article class="fallback-book" style="--book-color:${b.color};--book-foil:${b.accent};--book-height:${Math.round(b.height * 240)}px"><span>${esc(b.binding)}</span><strong>${esc(b.title)}</strong></article>`).join("\n")}\n      </div>`);
once("fallback footer", /<div class="fallback__footer">[\s\S]*?<\/div>/,
  '<div class="fallback__footer">\n        <span>Crescent Literary Society · With Inclusion comes Strength</span>\n      </div>');

// the reader: the whole issue as real, selectable text, plus its PDF
once("reader dialog", "\n  <script type=\"module\">", `
  <dialog class="cls-reader" id="cls-reader" aria-labelledby="cls-reader-title">
    <div class="cls-reader__top">
      <p class="cls-reader__meta" id="cls-reader-meta"></p>
      <form method="dialog">
        <button class="round-button" type="submit" aria-label="Close the issue">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"></path></svg>
        </button>
      </form>
    </div>
    <h2 id="cls-reader-title"></h2>
    <div id="cls-reader-body"></div>
    <p class="cls-reader__actions" id="cls-reader-pdf-row" hidden>
      <a class="text-button" id="cls-reader-pdf" href="#" download>Download the PDF</a>
    </p>
  </dialog>

  <script type="module">`);

// the books
once("BOOKS", /\n    const BOOKS = \[[\s\S]*?\n    \];\n/, `\n    // CLS: the newsletter issues, generated by scripts/build-shelf.mjs from content/newsletters/.\n    const BOOKS = ${js(BOOKS).replace(/\n/g, "\n    ")};\n`);

// covers: one image per issue (uploaded in the CMS) instead of the seven-cover atlas
once("cover atlas data", /\n    const COVER_ATLAS_DATA = "data:[^\n]*/, "");
once("cover atlas image", /    \/\/ Seven 2:3 cover artworks[\s\S]*?    let coverAtlasReady = false;\n/, `    // CLS: each issue's own cover, cropped to the book's 2:3 face from its centre.
    const coverImages = BOOKS.map((book) => {
      if (!book.cover) return null;
      const image = new Image();
      image.decoding = "async";
      image.src = book.cover;
      return image;
    });
    const coverCrop = (image) => {
      const w = image.naturalWidth, h = image.naturalHeight;
      const cw = Math.min(w, (h * 2) / 3), ch = Math.min(h, (w * 3) / 2);
      return [(w - cw) / 2, (h - ch) / 2, cw, ch];
    };
`);
once("cover texture", "      if (coverAtlasReady) {\n        const [sourceX, sourceY, sourceWidth, sourceHeight] = COVER_CROPS[BOOKS.indexOf(book)];\n        ctx.drawImage(\n          coverAtlasImage,",
  "      const coverImage = coverImages[BOOKS.indexOf(book)];\n      if (coverImage?.naturalWidth) {\n        const [sourceX, sourceY, sourceWidth, sourceHeight] = coverCrop(coverImage);\n        ctx.drawImage(\n          coverImage,");
once("cover decode", "      try {\n        await coverAtlasImage.decode();\n        coverAtlasReady = true;\n      } catch (error) {\n        coverAtlasReady = false;\n      }",
  "      await Promise.all(coverImages.map((image) => image?.decode().catch(() => {})));");
once("font load", 'await document.fonts.load("600 82px Inter");',
  "await Promise.all([document.fonts.load('400 82px Handlee'), document.fonts.load('400 18px \"Antic Slab\"')]);");

// canvas lettering on covers, spines and pages
every("canvas serif", '"Iowan Old Style", Baskerville, Georgia, serif', HANDLEE, 15);
every("canvas sans", 'Inter, "Helvetica Neue", Arial, sans-serif', ANTIC, 18);
every("cover running head", "`WORKING VOLUMES  /  ${book.roman}`", "`CLS NEWSLETTER  /  ${book.roman}`", 3);
once("foil running head", "`WORKING VOLUMES  /  ${pad(index)}`", "`CLS NEWSLETTER  /  ${book.roman}`");
once("colophon", "Conceived as an original editorial study for Working Volumes.", "Crescent Literary Society, with Inclusion comes Strength.");
once("specimen", "`SPECIMEN ${book.roman} / ${book.seed}  ·  IMAGINED EDITION`", "`ISSUE ${book.roman}  ·  ${book.discipline.toUpperCase()}`");

// words in the running interface
once("accent", 'rootStyle.setProperty("--accent", book.foil);', 'rootStyle.setProperty("--accent", book.accent);');
once("marker label", "`Select volume ${index + 1}: ${book.title}`", "`Select ${book.binding}: ${book.title}`");
once("live region", "`Selected volume ${selectedIndex + 1} of ${BOOKS.length}: ${book.title}. ${book.note}`", "`Selected ${book.binding}, ${selectedIndex + 1} of ${BOOKS.length}: ${book.title}. ${book.note}`");
once("eyebrow", "`Volume ${book.roman} · ${book.discipline}`", "`${book.binding} · ${book.discipline}`");
once("hover label", "`Volume ${pad(index + 1)}`", "book.binding");
once("spread 1", "`${book.chapters[0]} · Plate`", "book.chapters[0]");
once("spread 2", "`${book.chapters[1]} · Notes`", "book.chapters[1]");
once("spread 3", "`${book.chapters[2]} · System`", "book.chapters[2]");

// the reader's behaviour (inside the page's module, where BOOKS and the selection live)
once("reader script", "\n    initialize().catch(() => {", `
    // CLS: "Read this issue" opens the whole issue as real text; the 3D pages are decoration.
    const clsReader = document.querySelector("#cls-reader");
    const clsParagraph = (text, className) => {
      const p = document.createElement("p");
      p.textContent = text;
      if (className) p.className = className;
      return p;
    };
    document.querySelector("#cls-read").addEventListener("click", () => {
      const book = activeBook?.data || BOOKS[selectedIndex];
      document.querySelector("#cls-reader-meta").textContent = \`\${book.binding} · \${book.format}\`;
      document.querySelector("#cls-reader-title").textContent = book.title;
      const body = document.querySelector("#cls-reader-body");
      body.replaceChildren();
      if (book.deck) body.append(clsParagraph(book.deck));
      for (const article of book.articles) {
        const heading = document.createElement("h3");
        heading.textContent = article.heading;
        body.append(heading);
        if (article.author) body.append(clsParagraph(article.author, "cls-reader__by"));
        for (const text of article.body.split(/\\n\\s*\\n/)) if (text.trim()) body.append(clsParagraph(text.trim()));
      }
      document.querySelector("#cls-reader-pdf-row").hidden = !book.pdf;
      if (book.pdf) document.querySelector("#cls-reader-pdf").href = book.pdf;
      clsReader.showModal();
    });
    // Keys inside the reader stay there (the shelf listens for arrows and Escape on the window).
    clsReader.addEventListener("keydown", (event) => event.stopPropagation());

    initialize().catch(() => {`);

mkdirSync(new URL("public/landing-pages/", root), { recursive: true });
writeFileSync(OUT, html);
console.log(`build-shelf: ${BOOKS.length} issues -> public/landing-pages/complete-shelf-v2.html (${Math.round(html.length / 1024)} KB)`);

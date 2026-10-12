// Generates src/styles/tokens.css from design/tokens.json (the CLS design system's tokens).
// Run: node scripts/build-tokens.mjs. Exits non-zero if a design-system contrast pair fails.
import { readFileSync, writeFileSync } from "node:fs";

const t = JSON.parse(readFileSync(new URL("../design/tokens.json", import.meta.url), "utf8"));
const THEMES = t.color.themes.map((x) => x.id); // ["dark", "light"]; first theme is the default

// ---- colour: resolve "{alias}" references, per theme ----
const raw = Object.fromEntries(
  t.color.tokens.filter((c) => typeof c.value === "string").map((c) => [c.name, c.value]),
);
const resolve = (v) => {
  const m = /^\{(.+)\}$/.exec(v);
  if (!m) return v;
  if (!(m[1] in raw)) throw new Error(`Unknown colour alias ${v}`);
  return resolve(raw[m[1]]);
};
const semantic = t.color.tokens.filter((c) => typeof c.value === "object");
const themed = (theme, family) =>
  family.map((c) => [c.name, resolve(c.value[theme] ?? c.value[THEMES[0]])]);

// ---- contrast check (WCAG 2 relative luminance) ----
const lum = (hex) => {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
// The pairs the Color section promises, with their floors.
const GROUNDS = ["ground", "ground-raised", "ground-inset"];
const PAIRS = [
  ...["ink", "ink-muted", "rose-text", "leaf-text"].flatMap((fg) => GROUNDS.map((bg) => [fg, bg, 4.5])),
  ...["line-strong", "focus"].flatMap((fg) => GROUNDS.map((bg) => [fg, bg, 3])),
  ["on-rose", "rose", 4.5], ["on-leaf", "leaf", 4.5], ["on-action", "action", 4.5],
  ["on-action-inverse", "action-inverse", 4.5],
  ["ink-on-feature", "ground-feature", 4.5], ["ink-on-feature", "ground-deep", 4.5],
];
const failures = [];
for (const theme of THEMES) {
  const c = Object.fromEntries(themed(theme, semantic));
  for (const [fg, bg, min] of PAIRS) {
    const r = ratio(c[fg], c[bg]);
    if (r < min) failures.push(`${theme}: ${fg} on ${bg} = ${r.toFixed(2)} (needs ${min})`);
  }
}
if (failures.length) {
  console.error("Contrast check failed:\n  " + failures.join("\n  "));
  process.exit(1);
}

// ---- type ----
// Fluid sizes from the Typography section ("Below 1100px, scale the large steps with clamp()").
const FLUID = {
  "display-xl": "clamp(72px, 12vw, 144px)", "display-lg": "clamp(56px, 8.5vw, 104px)",
  h1: "clamp(48px, 6vw, 72px)", h2: "clamp(38px, 4.4vw, 52px)", h3: "clamp(30px, 3vw, 36px)",
  quote: "clamp(36px, 3.6vw, 44px)", lead: "clamp(19px, 1.6vw, 22px)",
  body: "clamp(17px, 0.4vw + 15.5px, 18px)",
};
const CAPS = new Set(["eyebrow", "label"]); // capitals by CSS, typed in sentence case
const typeUtilities = t.type.groups.flatMap((g) =>
  g.styles.map((s) => {
    const decl = [
      `font-family: var(--font-${s.family ?? g.family});`,
      `font-size: ${FLUID[s.name] ?? s.fontSize};`,
      `line-height: ${s.lineHeight};`,
      `font-weight: ${s.fontWeight};`,
      s.letterSpacing && `letter-spacing: ${s.letterSpacing};`,
      s.fontStyle && `font-style: ${s.fontStyle};`,
      CAPS.has(s.name) && "text-transform: uppercase;",
      s.name === "numeral" && "font-variant-numeric: tabular-nums;",
    ].filter(Boolean);
    return `@utility t-${s.name} {\n  ${decl.join("\n  ")}\n}`;
  }),
);

// ---- assemble ----
const block = (pairs) => pairs.map(([k, v]) => `  --${k}: ${v};`).join("\n");
const list = (family) => t[family].tokens.map((x) => [x.name, x.value]);
const shadows = (theme) => t.shadow.tokens.map((s) => [s.name, s.value[theme] ?? s.value[THEMES[0]]]);
const bpName = { "bp-sm": "sm", "bp-md": "md", "bp-lg": "lg", "bp-xl": "xl" };

const css = `/* Crescent Literary Society — generated from design/tokens.json by scripts/build-tokens.mjs. Do not edit. */

/* Raw source colours: never change with the theme. */
:root {
${block(Object.entries(raw))}
${block(list("spacing").map(([k, v]) => [k, v]))}
${block(list("container"))}
${block(list("zIndex"))}
${block(list("opacity"))}
}

/* Semantic tokens. "${THEMES[0]}" is the default; a nested data-theme re-themes its subtree. */
:root, [data-theme="${THEMES[0]}"] {
  color-scheme: ${THEMES[0]};
${block(themed(THEMES[0], semantic))}
${block(shadows(THEMES[0]))}
}
${THEMES.slice(1).map((th) => `[data-theme="${th}"] {
  color-scheme: ${th};
${block(themed(th, semantic))}
${block(shadows(th))}
}`).join("\n")}

/* Tailwind theme: only design-system values exist; the default palette and scales are removed. */
@theme static {
  --color-*: initial;
  --spacing-*: initial;
  --radius-*: initial;
  --breakpoint-*: initial;
  --container-*: initial;
  --font-*: initial;
${block(list("radius"))}
${block(list("breakpoint").map(([k, v]) => [`breakpoint-${bpName[k]}`, v]))}
${block(list("container").filter(([k]) => k.startsWith("container-")))}
${block(Object.entries(t.type.families).map(([k, v]) => [`font-${k}`, v]))}
}
@theme inline {
  --spacing-0: 0px; /* left-0, inset-0, gap-0 … need a zero step once the default scale is gone */
${block([...Object.keys(raw), ...semantic.map((c) => c.name)].map((k) => [`color-${k}`, `var(--${k})`]))}
${block(list("spacing").map(([k]) => [`spacing-${k.replace(/^space-/, "")}`, `var(--${k})`]))}
}

${typeUtilities.join("\n")}
`;

writeFileSync(new URL("../src/styles/tokens.css", import.meta.url), css);
console.log(`tokens.css written; ${PAIRS.length * THEMES.length} contrast pairs pass.`);

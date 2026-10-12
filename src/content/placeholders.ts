// PLACEHOLDER copy for the Club Diary (and the stacked diary). Every string in this file is a stand-in
// until the club supplies its own. Facts (stories, years, counts, names, captions) stay [bracketed] on screen
// so nobody mistakes them for real ones; never invent club facts here.
// Real, known facts are NOT in this file: "Crescent Literary Society", "2006", the tagline and the four
// club names live in their components or in content/clubs.ts.

/** Wrap a missing fact: "[the founding story]". */
export const PH = (what: string) => `[${what}]`;

export const PLACEHOLDER = {
  // Interface lines in the club's voice (replaceable, not facts)
  scrollHint: "Keep scrolling, the diary turns itself",
  /** The top bar's one-liner, one per beat (1 Founding … 6 Close). */
  topBar: [
    "Opened in 2006. Still being written.",
    "Some years were louder than others.",
    "Four clubs, one notebook.",
    "Evidence, pinned to the pages.",
    "Written by members, signed in ink.",
    "With Inclusion comes Strength.",
  ],
  progress: (pct: number) => `${pct}% of the diary read`,

  /** The six beats' readable text (phones show it under the book; the book's own pages are too small to read there). */
  beats: [
    { eyebrow: "The club, since 2006", title: "Founded 2006", body: PH("the founding story, in the club's own words: who started it, where and why") },
    { eyebrow: "Evolution", title: "Year by year", body: PH("how the club changed over the years, a few lines") },
    { eyebrow: "The four clubs", title: "Four clubs, one society", body: "Writers Guild, Quizzers Circuit, House of Debaters and Order of Improv. Each has its own page." },
    { eyebrow: "Events", title: "Pinned to the pages", body: PH("a line about the club's events; real photos go on these pages") },
    { eyebrow: "Member writing", title: "In their own words", body: PH("a line introducing the member writing") },
    { eyebrow: "Close", title: "With Inclusion comes Strength", body: "" },
  ],
  readPiece: "Read the whole piece",

  // Beat 1 — Founding, 2006
  entry1: { label: "Entry 01", aside: "The club, since 2006" },
  founding: {
    penNote: "where it began",
    title: "A literary society",
    body: PH("the founding story, in the club's own words: who started it, where and why"),
    margin: "est. 2006",
  },

  founding2: {
    body: PH("more of the founding story: the first members, the first meeting"),
  },

  // Beat 2 — Evolution
  entry2: { label: "Entry 02", aside: "Year by year" },
  evolution: {
    body: PH("how the club changed over the years, a few lines"),
    /** "2006 Founded" is real; every other row waits for the club's own milestones. */
    years: [
      { year: "2006", what: "Founded" },
      { year: PH("year"), what: PH("a turning point") },
      { year: PH("year"), what: PH("a turning point") },
      { year: PH("year"), what: PH("a turning point") },
    ],
    margin: "kept going",
    /** The hanging tag: one number. Bracketed until the club gives a real one (then it can count up). */
    tag: { label: PH("in N years"), count: PH("count"), what: PH("what it counts") },
    tagAside: PH("a line about that number"),
  },

  // Beat 3 — The four clubs
  entry3: { label: "Entry 03", aside: "Four clubs" },
  clubs: {
    title: "Four clubs, one society",
    body: PH("how the four clubs came to be"),
    stamp: "Four clubs",
    card: "Four clubs, one society",
    /** One line per club, in the fixed order. */
    lines: [PH("one line about Writers Guild"), PH("one line about Quizzers Circuit"), PH("one line about House of Debaters"), PH("one line about Order of Improv")],
  },

  // Beat 4 — Events
  entry4: { label: "Entry 04", aside: "Events" },
  events: {
    polaroids: [
      { caption: PH("event name"), note: PH("a line about it"), tag: "Event" },
      { caption: PH("event name"), note: PH("a line about it"), tag: "Writing" },
    ],
    /** Three counts, each in its own hand-made box. Numbers stay bracketed until real. */
    stats: [
      { n: PH("00"), label: PH("what it counts"), note: PH("a handwritten aside") },
      { n: PH("00"), label: PH("what it counts"), note: PH("a handwritten aside") },
      { n: PH("00"), label: PH("what it counts"), note: PH("a handwritten aside") },
    ],
  },

  // Beat 5 — Member writing
  entry5: { label: "Entry 05", aside: "Member writing" },
  writing: {
    title: PH("title of a piece"),
    /** The line that types itself; `mark` is the one highlighted word, taken from inside the line. */
    lineBefore: PH("a line of member writing with one"),
    mark: "word",
    lineAfter: PH("highlighted"),
    author: PH("author"),
    more: "Tap the page to read the whole piece",
    full: PH("the whole piece, with the author's permission"),
  },

  // Beat 6 — Close
  keepScrolling: "keep scrolling",
} as const;

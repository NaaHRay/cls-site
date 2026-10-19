// Quizzer's Circuit copy. The name is the club's spelling choice for this section, kept in one place.
export const QUIZZERS_NAME = "Quizzer's Circuit";
export const QUIZZERS_PATH = "/sub-clubs/quizzers-circuit";

// Where a poster leads. Every poster opens the same page for now; per-poster pages change only this.
export const posterTarget = (_poster: number) => `${QUIZZERS_PATH}/about`;

// The Quizzers page. Every string marked PLACEHOLDER waits for the club's real copy.
export const QUIZZERS_ABOUT = {
  tagline: "PLACEHOLDER: one line on what the circuit is.",
  description: [
    "PLACEHOLDER: the main description of the Quizzer's Circuit: who runs it, what a quiz night looks like, and how often it meets.",
    "PLACEHOLDER: a second paragraph on the formats, the themes (films, music, sport, anime) and how anyone can take part.",
  ],
  closingHeading: "PLACEHOLDER: Join the circuit",
  links: [
    { label: "PLACEHOLDER: Instagram", href: "#" },
    { label: "PLACEHOLDER: WhatsApp group", href: "#" },
  ],
  contact: "PLACEHOLDER: contact name and email",
};

// The four sub-clubs, always in this order. Names are the club's own; descriptions come later.
export const CLUBS = [
  { slug: "writers-guild", name: "Writers Guild" },
  { slug: "quizzers-circuit", name: "Quizzers Circuit" },
  { slug: "house-of-debaters", name: "House of Debaters" },
  { slug: "order-of-improv", name: "Order of Improv" },
] as const;

export type Club = (typeof CLUBS)[number];

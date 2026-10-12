import type { ReactNode } from "react";

const LOOKS = {
  plain: "text-ink border-line-strong",
  highlight: "text-rose-text border-rose-text", // one per group
  solid: "text-ink border-line bg-ground-inset", // for years
};

// A one- or two-word pill for photos, writings and highlights.
export default function Tag({ children, look = "plain" }: { children: ReactNode; look?: keyof typeof LOOKS }) {
  return (
    <span
      className={`inline-block font-antic-slab text-[12px] leading-none tracking-[0.14em] uppercase px-3 py-2 border rounded-pill ${LOOKS[look]}`}
    >
      {children}
    </span>
  );
}

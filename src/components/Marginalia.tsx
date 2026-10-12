import type { ReactNode } from "react";

// A paragraph with a margin note in the outer gutter. On phones the note drops below and loses its tilt.
export function Annotated({ note, children }: { note: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,36rem)_160px] gap-5 items-start max-md:grid-cols-1">
      <p className="t-body m-0">{children}</p>
      <span className="t-margin-note text-rose-text mt-[2px] -rotate-2 max-md:rotate-0">{note}</span>
    </div>
  );
}

// A member's writing on a raised page, signed in Parisienne.
export function InsetPage({ title, children, author }: { title: ReactNode; children: ReactNode; author: ReactNode }) {
  return (
    <article className="bg-ground-raised border border-line rounded-sm p-5 max-w-text">
      <h4 className="t-h4 mb-3">{title}</h4>
      <p className="t-body-sm text-ink-muted mb-5">{children}</p>
      <p className="t-signature text-[32px]!">{author}</p>
    </article>
  );
}

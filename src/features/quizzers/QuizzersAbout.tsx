import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { QUIZZERS_ABOUT as C, QUIZZERS_NAME, QUIZZERS_PATH } from "@/content/quizzers/copy";
import "./quizzers.css";

// The page a poster opens: hero, description, closing. Back, browser Back and Escape all return to
// the tunnel, which mounts fresh: camera at the start, title up, drift running.
export default function QuizzersAbout() {
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate(QUIZZERS_PATH);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <article className="qz qz-about px-7 pb-9 max-md:px-4 max-md:pb-8">
      <Link to={QUIZZERS_PATH} className="qz-back t-label">
        ← Back to the posters
      </Link>
      <header className="pt-8 max-md:pt-6">
        <h1 className="qz-about-title">{QUIZZERS_NAME}</h1>
        <p className="t-body-hi mt-4">{C.tagline}</p>
      </header>
      <section className="mt-8 max-w-[62ch] space-y-5 max-md:mt-6">
        {C.description.map((p) => (
          <p key={p} className="t-body">
            {p}
          </p>
        ))}
      </section>
      <footer className="mt-9 max-md:mt-8">
        <h2 className="t-h2">{C.closingHeading}</h2>
        <ul className="mt-5 flex flex-wrap gap-6">
          {C.links.map((l) => (
            <li key={l.label}>
              <a href={l.href} className="t-label underline underline-offset-4">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="t-body text-ink-muted mt-5">{C.contact}</p>
      </footer>
    </article>
  );
}

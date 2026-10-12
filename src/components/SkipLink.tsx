// First stop for keyboard users; hidden until focused.
export default function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[300] t-label bg-ground text-ink px-4 py-3"
    >
      Skip to content
    </a>
  );
}

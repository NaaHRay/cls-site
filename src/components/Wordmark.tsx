import { Link } from "react-router";

// The wordmark files are not supplied yet. To swap them in:
// 1. add public/brand/wordmark-dark.svg (white name, red roses, blue leaves) and
//    public/brand/wordmark-light.svg (near-black name, orange-red roses, navy leaves);
// 2. set HAS_WORDMARK to true. CSS shows the one matching the nearest data-theme.
// Never redraw the wordmark in type.
const HAS_WORDMARK = false;

export default function Wordmark() {
  return (
    <Link to="/" aria-label="Crescent Literary Society home" className="block w-[160px] h-[40px] shrink-0">
      {HAS_WORDMARK && (
        <>
          <img src="/brand/wordmark-dark.svg" alt="" className="wordmark-dark h-full w-auto" />
          <img src="/brand/wordmark-light.svg" alt="" className="wordmark-light h-full w-auto" />
        </>
      )}
    </Link>
  );
}

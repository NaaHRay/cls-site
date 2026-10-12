import { PLACEHOLDER as P } from "@/content/placeholders";
import { pauseScroll, resumeScroll } from "@/lib/smooth";

/** Opens the dialog with the whole piece of member writing. */
export const openPiece = () => (document.getElementById("diary-piece") as HTMLDialogElement | null)?.showModal();

// The whole piece of member writing, opened from the torn page (beat 5). A native modal dialog: focus
// stays inside, Esc closes it, the page behind does not scroll. Rendered once per layout, outside the
// 3D book, so nothing distorts it.
export default function ReadPiece() {
  return (
    <dialog
      id="diary-piece"
      aria-labelledby="diary-piece-title"
      onFocus={pauseScroll}
      onClose={resumeScroll}
      className="m-auto max-w-[min(640px,92vw)] p-0 bg-transparent backdrop:bg-[rgb(0_0_0/var(--veil-mid))]"
    >
      <article data-theme="light" className="bg-ground-raised text-ink border border-line rounded-sm px-6 py-6 max-md:px-5">
        <h2 id="diary-piece-title" className="t-h3">{P.writing.title}</h2>
        <p className="t-body mt-5">{P.writing.full}</p>
        <p className="t-signature text-rose-text text-right mt-6">{P.writing.author}</p>
        <form method="dialog" className="mt-6 flex justify-end">
          <button className="t-label text-ink border-[1.5px] border-line-strong px-4 py-2 cursor-pointer">Close</button>
        </form>
      </article>
    </dialog>
  );
}

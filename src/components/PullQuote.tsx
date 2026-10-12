// One display-size quotation, a line not a paragraph. One per section at most.
export default function PullQuote({ quote, signature, source }: { quote: string; signature: string; source: string }) {
  return (
    <figure className="mx-auto max-w-text text-center flex flex-col items-center my-8">
      <div className="font-finesse-flair text-[96px] leading-[0.7] h-[48px] text-rose mb-4" aria-hidden="true">
        &ldquo;
      </div>
      <blockquote className="t-quote">{quote}</blockquote>
      <figcaption className="self-end flex flex-col items-end">
        <span className="t-signature mt-5">{signature}</span>
        <cite className="t-meta not-italic text-ink-muted mt-2">{source}</cite>
      </figcaption>
    </figure>
  );
}

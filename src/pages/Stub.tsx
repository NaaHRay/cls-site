import { useParams } from "react-router";
import { CLUBS } from "@/content/clubs";

// Placeholder for the pages built after the Home milestones.
export default function Stub({ title }: { title?: string }) {
  const { slug } = useParams();
  const club = CLUBS.find((c) => c.slug === slug);
  return (
    <section className="px-7 py-10 max-md:px-4 max-md:py-8">
      <h1 className="t-h1">{club?.name ?? title}</h1>
      <p className="t-body text-ink-muted mt-6">This page comes after the Home page milestones.</p>
    </section>
  );
}

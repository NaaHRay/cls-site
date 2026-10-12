import type { ReactNode } from "react";
import Button from "@/components/Button";
import FeatureField from "@/components/FeatureField";
import { Annotated, InsetPage } from "@/components/Marginalia";
import MemberCard from "@/components/MemberCard";
import PullQuote from "@/components/PullQuote";
import Reveal, { CutReveal } from "@/components/Reveal";
import SubClubCard from "@/components/SubClubCard";
import Tag from "@/components/Tag";
import { CLUBS } from "@/content/clubs";

// Dev-only review page (/kit): every primitive on black, burgundy and ivory. Sample copy is placeholder.
const PH_DESCRIPTIONS = [
  "Prose and poetry, read aloud and workshopped.",
  "Questions, rounds and friendly rivalry.",
  "Motions, rebuttals and the art of argument.",
  "Scenes made up on the spot, together.",
];

function Pane({ theme, feature, label, children }: { theme: "dark" | "light"; feature?: boolean; label: string; children: ReactNode }) {
  return (
    <section
      data-theme={theme}
      className={`${feature ? "bg-ground-feature text-ink-on-feature" : "bg-ground text-ink"} px-7 py-8 max-md:px-4 flex flex-col gap-7`}
    >
      <p className="t-meta opacity-80">{label}</p>
      {children}
    </section>
  );
}

function Buttons() {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <Button arrow>Join CLS</Button>
      <Button variant="secondary">The clubs</Button>
      <Button disabled>Disabled</Button>
    </div>
  );
}

function Grounds({ theme }: { theme: "dark" | "light" }) {
  return (
    <Pane theme={theme} label={`${theme === "dark" ? "Dark: black ground" : "Light: ivory ground"}`}>
      <h2 className="t-h2">
        <CutReveal text="Keep the conversation going" />
      </h2>
      <Reveal>
        <Buttons />
      </Reveal>
      <Reveal className="flex flex-wrap gap-2">
        <Tag>Event</Tag>
        <Tag look="highlight">Highlight</Tag>
        <Tag look="solid">2006</Tag>
        <Tag>Writing</Tag>
      </Reveal>
      <Reveal>
        <Annotated note="the best ones start late">
          Meetings begin with a question and end with a page that was not there before.
        </Annotated>
      </Reveal>
      <Reveal>
        <InsetPage title="A page from the diary" author="A member">
          An excerpt from a member's writing sits on a raised page of its own, two steps from every edge.
        </InsetPage>
      </Reveal>
      <Reveal stagger className="grid grid-cols-4 gap-gutter max-lg:grid-cols-2 max-md:grid-cols-1">
        {CLUBS.map((c, i) => (
          <Reveal.Item key={c.slug}>
            <SubClubCard name={c.name} description={PH_DESCRIPTIONS[i]} to={`/sub-clubs/${c.slug}`} />
          </Reveal.Item>
        ))}
      </Reveal>
      <Reveal stagger className="grid grid-cols-4 gap-gutter max-lg:grid-cols-3 max-md:grid-cols-2">
        <Reveal.Item><MemberCard name="Member name" role="Editor in chief" signature /></Reveal.Item>
        <Reveal.Item><MemberCard name="Member name" role="Poetry editor" /></Reveal.Item>
        <Reveal.Item><MemberCard name="Member name" role="Prose editor" /></Reveal.Item>
      </Reveal>
      <Reveal>
        <PullQuote quote="With Inclusion comes Strength" signature="The Editorial Board" source="Crescent Literary Society" />
      </Reveal>
    </Pane>
  );
}

export default function Kit() {
  return (
    <>
      <Grounds theme="dark" />
      <Pane theme="dark" feature label="Burgundy field (forced dark in both themes)">
        <Buttons />
      </Pane>
      <FeatureField
        eyebrow="A seat at the table"
        heading="Bring your unfinished thoughts"
        cta={{ label: "Join CLS", to: "/sub-clubs" }}
      >
        CLS is a living room for language. Come for one chapter, stay for the whole story.
      </FeatureField>
      <Grounds theme="light" />
    </>
  );
}

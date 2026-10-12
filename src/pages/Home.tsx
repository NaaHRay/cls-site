import Diary from "@/sections/home/About/Diary";
import Hero from "@/sections/home/Hero";

// Home, built section by section. Now: the Club Diary (D1 to D6). The rest of the site waits for it.
export default function Home() {
  return (
    <>
      <Hero />
      <Diary />
    </>
  );
}

import { useMatch } from "react-router";
import ThemeToggle from "@/components/ThemeToggle";
import Wordmark from "@/components/Wordmark";
import PhoneMenu from "./PhoneMenu";
import SiteDock from "./SiteDock";

// The bar: logo slot left, the Sable dock (three links) centred, the theme toggle right; on phones a
// single Menu control. Static at the top of the page until the club decides sticky / hide-on-scroll.
// Heights 72 / 64 / 56, page margins 48 / 32 / 16, per the design system.
export default function NavBar() {
  // The Quizzer's Circuit tunnel is dark in both themes, so the bar over it uses the dark values.
  const overTunnel = useMatch("/sub-clubs/quizzers-circuit");
  return (
    <header data-theme={overTunnel ? "dark" : undefined} className="relative z-[100] flex items-center justify-between gap-5 h-[72px] px-7 max-lg:h-[64px] max-lg:px-6 max-md:h-[56px] max-md:px-4">
      <Wordmark />
      <div className="absolute inset-0 pointer-events-none max-md:hidden">
        <SiteDock />
      </div>
      <div className="max-md:hidden">
        <ThemeToggle />
      </div>
      <PhoneMenu />
    </header>
  );
}

import ThemeToggle from "@/components/ThemeToggle";
import Wordmark from "@/components/Wordmark";
import NavItem from "./NavItem";
import PhoneMenu from "./PhoneMenu";
import { NAV_LINKS } from "./links";

// The bar: logo slot left, three links and the theme toggle right; on phones a single Menu
// control. Static at the top of the page until the club decides sticky / hide-on-scroll.
// Heights 72 / 64 / 56, page margins 48 / 32 / 16, per the design system.
export default function NavBar() {
  return (
    <header className="relative z-[100] flex items-center justify-between gap-5 h-[72px] px-7 max-lg:h-[64px] max-lg:px-6 max-md:h-[56px] max-md:px-4">
      <Wordmark />
      <div className="flex items-center gap-6 max-md:hidden">
        <nav aria-label="Main">
          <ul className="flex gap-6">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <NavItem to={l.to} label={l.label} className="t-label" />
              </li>
            ))}
          </ul>
        </nav>
        <ThemeToggle />
      </div>
      <PhoneMenu />
    </header>
  );
}

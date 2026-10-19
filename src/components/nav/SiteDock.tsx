import { useLocation, useNavigate } from "react-router";
import { AnimatedTopDock, type DockItem } from "@/shaders/animated-top-dock/AnimatedTopDock";
import "@/shaders/threeui.css";
import { NAV_LINKS } from "./links";

// ThreeUI's Sable dock as the bar's three links. Icons are drawn on the dock's own 16-unit grid.
const ICONS: Record<(typeof NAV_LINKS)[number]["to"], DockItem["icon"]> = {
  "/": <path d="M2.5 7.5 8 2.75l5.5 4.75M4 6.75v6.5h8v-6.5M6.75 13.25V9.5h2.5v3.75" />,
  "/sub-clubs": (
    <>
      <circle cx="5.25" cy="5.5" r="2.25" />
      <circle cx="10.75" cy="5.5" r="2.25" />
      <circle cx="8" cy="10.5" r="2.25" />
    </>
  ),
  "/editorial-board": <path d="M3 2.75h6.5a2 2 0 0 1 2 2v8.5H5a2 2 0 0 1-2-2zM5.5 6h3.5M5.5 8.5h3.5" />,
};

const ITEMS: DockItem[] = NAV_LINKS.map((l) => ({ id: l.to, label: l.label.toUpperCase(), icon: ICONS[l.to] }));

export default function SiteDock() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = NAV_LINKS.find((l) => (l.to === "/" ? pathname === "/" : pathname.startsWith(l.to)))?.to;
  return (
    <AnimatedTopDock
      variant="sable"
      proximity={122}
      spring={0.19}
      damping={0.7}
      widthGrowth={17}
      heightGrowth={16}
      drop={3.5}
      className="site-dock"
      items={ITEMS}
      activeId={active ?? ""}
      onSelect={(to) => navigate(to)}
      hideCaption
    />
  );
}

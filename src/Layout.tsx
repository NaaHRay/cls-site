import { useLocation, useOutlet } from "react-router";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import SkipLink from "@/components/SkipLink";
import NavBar from "@/components/nav/NavBar";
import { EASE } from "@/lib/motion";
import { resetScroll } from "@/lib/smooth";

// Every page: skip link, the bar, then the page. Pages cross-fade: the old one fades out quickly,
// the scroll returns to the top, and the new one rises in softly.
export default function Layout() {
  const location = useLocation();
  const outlet = useOutlet();
  return (
    <MotionConfig reducedMotion="user">
      <SkipLink />
      <NavBar />
      <AnimatePresence mode="wait" initial={false} onExitComplete={resetScroll}>
        <motion.main
          id="main"
          key={location.pathname}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE.page } }}
          exit={{ opacity: 0, transition: { duration: 0.22, ease: EASE.leave } }}
        >
          {outlet}
        </motion.main>
      </AnimatePresence>
    </MotionConfig>
  );
}

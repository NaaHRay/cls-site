import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import ThemeToggle from "@/components/ThemeToggle";
import { CLUBS } from "@/content/clubs";
import { EASE, SPRING } from "@/lib/motion";
import { pauseScroll, resumeScroll } from "@/lib/smooth";
import NavItem from "./NavItem";
import { NAV_LINKS } from "./links";

// One line of the menu: it sits in an overflow-hidden cut and rises into place, 60ms after the
// line before; on close every line drops back together, quickly.
function Line({ i, open, still, children }: { i: number; open: boolean; still: boolean | null; children: ReactNode }) {
  const motionProps = still
    ? { initial: { opacity: 0 }, animate: { opacity: open ? 1 : 0 }, transition: { duration: 0.18 } }
    : {
        initial: { y: "110%" },
        animate: { y: open ? "0%" : "110%" },
        transition: open ? { ...SPRING.soft, delay: 0.18 + i * 0.06 } : { duration: 0.16, ease: EASE.leave },
      };
  return (
    <li className="overflow-hidden pb-1">
      <motion.div {...motionProps}>{children}</motion.div>
    </li>
  );
}

// Phones: one "Menu" control opens a full-screen sheet that drops in like a curtain.
// A native modal <dialog> keeps focus inside, makes the page behind inert, and closes on Esc.
export default function PhoneMenu() {
  const still = useReducedMotion();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    pauseScroll();
  }, [open]);

  // After the closing animation, take the dialog down. (Browsers may also close it at once on Esc;
  // either way the dialog's own close event below restores scrolling and focus.)
  const finishClose = () => {
    if (!open && dialog.current?.open) dialog.current.close();
  };
  const onClosed = () => {
    setOpen(false);
    resumeScroll();
    opener.current?.focus();
  };

  const [home, subClubs, board] = NAV_LINKS;
  const line = (i: number, node: ReactNode) => (
    <Line i={i} open={open} still={still}>
      {node}
    </Line>
  );
  const big = "t-label text-[22px]!";

  return (
    <>
      <button
        ref={opener}
        type="button"
        className="md:hidden t-label text-ink py-2 cursor-pointer"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        Menu
      </button>
      <dialog
        ref={dialog}
        aria-label="Menu"
        onCancel={(e) => {
          e.preventDefault(); // Esc: play the closing animation first
          close();
        }}
        onClose={onClosed}
        className="m-0 p-0 w-screen h-dvh max-w-none max-h-none bg-transparent backdrop:bg-transparent text-ink"
      >
        <motion.div
          className="h-full bg-ground flex flex-col px-4"
          initial={still ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
          animate={still ? { opacity: open ? 1 : 0 } : { clipPath: open ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)" }}
          transition={open ? { duration: 0.55, ease: EASE.page } : { duration: 0.3, ease: EASE.leave, delay: 0.1 }}
          onAnimationComplete={finishClose}
        >
          <div className="flex items-center justify-between h-[56px] shrink-0">
            <span className="t-meta text-ink-muted">Crescent Literary Society</span>
            <button type="button" className="t-label text-ink py-2 cursor-pointer" onClick={close}>
              Close
            </button>
          </div>
          <nav aria-label="Main" className="flex-1 flex flex-col justify-center gap-7 pb-8">
            <ul className="flex flex-col gap-4">
              {line(0, <NavItem to={home.to} label={home.label} onNavigate={close} markId="menu" className={big} />)}
              {line(1, <NavItem to={subClubs.to} label={subClubs.label} onNavigate={close} markId="menu" className={big} />)}
              <li>
                <ul className="flex flex-col gap-2 pl-5 ml-1 border-l border-line" aria-label="Sub-clubs">
                  {CLUBS.map((c, i) => (
                    <Line key={c.slug} i={2 + i} open={open} still={still}>
                      <Link to={`/sub-clubs/${c.slug}`} onClick={close} className="t-body text-ink-muted no-underline hover:text-ink transition-colors">
                        {c.name}
                      </Link>
                    </Line>
                  ))}
                </ul>
              </li>
              {line(6, <NavItem to={board.to} label={board.label} onNavigate={close} markId="menu" className={big} />)}
            </ul>
            <ul>{line(7, <ThemeToggle />)}</ul>
          </nav>
        </motion.div>
      </dialog>
    </>
  );
}

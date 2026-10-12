import { useState } from "react";
import { getTheme, setTheme, type Theme } from "@/lib/theme";

// A button, not a link: the bar keeps exactly three links. Placement is still a club decision.
export default function ThemeToggle() {
  const [theme, setState] = useState<Theme>(getTheme);
  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="t-label text-ink-muted hover:text-ink transition-colors duration-[180ms] cursor-pointer py-2"
      aria-label={`Switch to ${next} theme`}
      onClick={() => {
        setTheme(next);
        setState(next);
      }}
    >
      {next === "light" ? "Light" : "Dark"}
    </button>
  );
}

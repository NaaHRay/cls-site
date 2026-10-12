// The page theme. index.html sets it before first paint; this reads and changes it afterwards.
export type Theme = "dark" | "light";

const KEY = "cls-theme";

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Private mode or blocked storage: the theme still applies for this visit.
  }
}

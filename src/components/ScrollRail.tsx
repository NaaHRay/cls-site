type Props = {
  /** One label per stop; the rail has one short rule for each. */
  names: readonly string[];
  /** The stop on screen now (0-based). */
  current: number;
  /** Click or Enter on a rule jumps to that stop. */
  onJump: (i: number) => void;
  label: string;
  orientation?: "vertical" | "horizontal";
  /** "feature": the rail sits over the burgundy section, so the current rule is ivory (rose would be too faint there). */
  tone?: "room" | "feature";
  className?: string;
};

// A progress rail: short rules, one per stop; the current one is rose and longer. Real buttons, so Tab
// reaches every rule, Enter or Space jumps, and focus is visible. Reused by the club chapters later.
export default function ScrollRail({ names, current, onJump, label, orientation = "vertical", tone = "room", className = "" }: Props) {
  const vertical = orientation === "vertical";
  return (
    <nav aria-label={label} className={className}>
      <ol className={`flex ${vertical ? "flex-col items-end" : "items-center justify-center"} gap-[2px]`}>
        {names.map((name, i) => {
          const on = i === current;
          return (
            <li key={name}>
              <button
                type="button"
                onClick={() => onJump(i)}
                aria-label={`${i + 1} of ${names.length}: ${name}`}
                aria-current={on ? "step" : undefined}
                className="group flex items-center justify-end cursor-pointer h-[28px] min-w-[44px] px-[6px]"
              >
                <span
                  aria-hidden="true"
                  className={`block h-[3px] transition-[width,background-color] duration-[320ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
                    on ? `w-[40px] ${tone === "feature" ? "bg-ink-on-feature" : "bg-rose"}` : "w-[24px] bg-line-strong group-hover:bg-ink"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

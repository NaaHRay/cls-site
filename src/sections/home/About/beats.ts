// Shared by every layout of the Club Diary (3D stage, phone, reduced-motion stack).

/** The six beats, by name (the rail and its labels). */
export const BEAT_NAMES = ["Founding", "Evolution", "The four clubs", "Events", "Member writing", "Close"] as const;

/** Timeline of the 3D stage, in "screens" of scroll (1 = 100svh): where each beat starts, and the whole length. */
export const BEATS = [0, 2.9, 4.8, 6.3, 7.9, 9.3];
export const LENGTH = 10.8;

/** Where each beat is fully on screen and settled: the rail and the arrow keys scroll here. */
export const SETTLE = [2.2, 3.9, 5.5, 7.0, 8.6, 10.75]; // Close: after the tape line and "keep scrolling" (10.7)

/** How many leaves are turned (lying on the left) while each beat is on screen, in the flat phone book. */
export const TURNED = [1, 4, 5, 6, 7, 0];

/** Which beat the timeline is at, at time t (in screens). */
export function beatAt(t: number) {
  let beat = 0;
  while (beat < BEATS.length - 1 && t >= BEATS[beat + 1]) beat++;
  return beat;
}

/**
 * Bill plays the masterpiece: two notes, back and forth, and the third always comes out wrong
 * however right the key was. Then he blames the gear. Pure, so it's unit-tested.
 */
export type JamKey = "E" | "R";

/** Which key plays each note, and the note (MIDI): D, A, then D again, which goes sour. */
export const JAM = [
  { key: "E" as JamKey, midi: 62 },
  { key: "R" as JamKey, midi: 69 },
  { key: "E" as JamKey, midi: 62 },
];

export interface Jam {
  step: number;
  /** Set once the third note has gone wrong. */
  done: boolean;
}

export const newJam = (): Jam => ({ step: 0, done: false });

/** The key the player should press next, or null when the take is over. */
export const nextKey = (j: Jam): JamKey | null => (j.done ? null : JAM[j.step].key);

/** A key press: the right key plays the next note (the last one sour, always); a wrong key does nothing. */
export function press(j: Jam, key: JamKey): { midi: number; sour: boolean } | null {
  if (j.done || JAM[j.step].key !== key) return null;
  const n = JAM[j.step];
  j.step++;
  const sour = j.step === JAM.length;
  if (sour) j.done = true;
  return { midi: n.midi, sour };
}

import type { MidiNumber, NoteInfo, PitchClass } from "./types";

const LETTER_TO_PC: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11
};

export const PC_NAMES = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"] as const;

export const PC_COMPACT_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export function pc(value: number): PitchClass {
  return ((value % 12) + 12) % 12;
}

export function parseNoteName(note: string): MidiNumber {
  const primaryName = note.trim().split("/")[0];
  const match = primaryName.match(/^([A-Ga-g])([#b♯♭]?)(-?\d+)$/u);

  if (!match) {
    throw new Error(`Invalid note name: ${note}`);
  }

  const [, rawLetter, accidental, rawOctave] = match;
  const basePc = LETTER_TO_PC[rawLetter.toUpperCase()];
  const accidentalOffset =
    accidental === "#" || accidental === "♯" ? 1 : accidental === "b" || accidental === "♭" ? -1 : 0;
  const octave = Number.parseInt(rawOctave, 10);

  return (octave + 1) * 12 + pc(basePc + accidentalOffset);
}

export function midiToNote(midi: number): NoteInfo {
  const pitchClass = pc(midi);
  const octave = Math.floor(midi / 12) - 1;
  const compactName = PC_COMPACT_NAMES[pitchClass];

  return {
    midi,
    pc: pitchClass,
    octave,
    name: `${PC_NAMES[pitchClass]}${octave}`,
    compactName: `${compactName}${octave}`
  };
}

export function pcToName(pitchClass: PitchClass): string {
  return PC_NAMES[pc(pitchClass)];
}

export function pcToCompactName(pitchClass: PitchClass): string {
  return PC_COMPACT_NAMES[pc(pitchClass)];
}

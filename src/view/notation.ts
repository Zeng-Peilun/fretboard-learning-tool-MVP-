export type NotationMode = "musician" | "theorist";

export interface RootNoteOption {
  id: string;
  label: string;
  pc: number;
  letter: number;
}

export interface SpellingRecord {
  letter: number;
  delta: number;
  overflow: boolean;
}

export interface AuditResult {
  hasOverflow: boolean;
  awfulCount: number;
}

export type LetterTrackResolution =
  | {
      kind: "track";
      letterOffsets: number[];
    }
  | {
      kind: "base-only";
      reason: string;
    };

export const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
export const P_NAT = [0, 2, 4, 5, 7, 9, 11] as const;
export const DICT_BASE = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;

export const ROOT_NOTE_OPTIONS: RootNoteOption[] = [
  { id: "c", label: "C", pc: 0, letter: 0 },
  { id: "c-sharp", label: "C#", pc: 1, letter: 0 },
  { id: "d-flat", label: "Db", pc: 1, letter: 1 },
  { id: "d", label: "D", pc: 2, letter: 1 },
  { id: "d-sharp", label: "D#", pc: 3, letter: 1 },
  { id: "e-flat", label: "Eb", pc: 3, letter: 2 },
  { id: "e", label: "E", pc: 4, letter: 2 },
  { id: "f-flat", label: "Fb", pc: 4, letter: 3 },
  { id: "e-sharp", label: "E#", pc: 5, letter: 2 },
  { id: "f", label: "F", pc: 5, letter: 3 },
  { id: "f-sharp", label: "F#", pc: 6, letter: 3 },
  { id: "g-flat", label: "Gb", pc: 6, letter: 4 },
  { id: "g", label: "G", pc: 7, letter: 4 },
  { id: "g-sharp", label: "G#", pc: 8, letter: 4 },
  { id: "a-flat", label: "Ab", pc: 8, letter: 5 },
  { id: "a", label: "A", pc: 9, letter: 5 },
  { id: "a-sharp", label: "A#", pc: 10, letter: 5 },
  { id: "b-flat", label: "Bb", pc: 10, letter: 6 },
  { id: "b", label: "B", pc: 11, letter: 6 },
  { id: "c-flat", label: "Cb", pc: 11, letter: 0 },
  { id: "b-sharp", label: "B#", pc: 0, letter: 6 }
] as const;

const AWFUL_SPELLINGS = new Set(["2:1", "6:1", "0:-1", "3:-1"]);
const BASE_ONLY_SCALE_IDS = new Set(["major-blues", "minor-blues", "diminished", "dominant-diminished", "chromatic"]);
const CHORD_LETTER_OFFSET_BY_INTERVAL = new Map<number, number>([
  [0, 0],
  [1, 1],
  [2, 1],
  [3, 2],
  [4, 2],
  [5, 3],
  [6, 4],
  [7, 4],
  [8, 4],
  [9, 5],
  [10, 6],
  [11, 6],
  [12, 0],
  [13, 1],
  [14, 1],
  [15, 1],
  [16, 2],
  [17, 3],
  [18, 3],
  [19, 4],
  [20, 5],
  [21, 5]
]);

export function baseNameForPitchClass(pitchClass: number): string {
  return DICT_BASE[mod(pitchClass, 12)];
}

export function spell(x: number, index: number, rootLetter: number, letterOffsets: number[]): SpellingRecord {
  assertPitchClass(x);
  assertLetterIndex(rootLetter, "Root letter");
  assertLetterTrack(letterOffsets);

  if (!Number.isInteger(index) || index < 0 || index >= letterOffsets.length) {
    throw new Error(`Spelling index ${index} is outside 0..${letterOffsets.length - 1}`);
  }

  const targetLetter = mod(rootLetter + letterOffsets[index], 7);
  const delta = mod(x - P_NAT[targetLetter] + 6, 12) - 6;

  return {
    letter: targetLetter,
    delta,
    overflow: Math.abs(delta) > 2
  };
}

export function spellMany(
  pitchClasses: number[],
  indexes: number[],
  rootLetter: number,
  letterOffsets: number[]
): SpellingRecord[] {
  if (pitchClasses.length !== indexes.length) {
    throw new Error("Pitch classes and indexes must have the same length");
  }

  return pitchClasses.map((pitchClass, recordIndex) =>
    spell(pitchClass, indexes[recordIndex], rootLetter, letterOffsets)
  );
}

export function renderRecord(record: SpellingRecord): string {
  assertLetterIndex(record.letter, "Record letter");

  const letter = LETTERS[record.letter];

  if (record.delta === 0) {
    return letter;
  }

  return record.delta > 0 ? `${letter}${"#".repeat(record.delta)}` : `${letter}${"b".repeat(Math.abs(record.delta))}`;
}

export function audit(records: SpellingRecord[]): AuditResult {
  return {
    hasOverflow: records.some((record) => record.overflow),
    awfulCount: records.filter(
      (record) => AWFUL_SPELLINGS.has(`${record.letter}:${record.delta}`) || Math.abs(record.delta) >= 2
    ).length
  };
}

export function renderNames(
  records: SpellingRecord[],
  pitchClasses: number[],
  mode: NotationMode,
  awfulTolerance = 0
): string[] {
  assertNotationMode(mode);

  if (records.length !== pitchClasses.length) {
    throw new Error("Records and pitch classes must have the same length");
  }

  pitchClasses.forEach(assertPitchClass);

  if (mode === "theorist") {
    return records.map(renderRecord);
  }

  const auditResult = audit(records);

  if (auditResult.hasOverflow || auditResult.awfulCount > awfulTolerance) {
    return pitchClasses.map(baseNameForPitchClass);
  }

  return records.map(renderRecord);
}

export function resolveScaleLetterOffsets(scaleId: string, scaleLength: number): LetterTrackResolution {
  if (BASE_ONLY_SCALE_IDS.has(scaleId)) {
    return { kind: "base-only", reason: `${scaleId} does not have a unique standard letter track` };
  }

  if (scaleId === "major-pentatonic") {
    return { kind: "track", letterOffsets: [0, 1, 2, 4, 5] };
  }

  if (scaleId === "minor-pentatonic") {
    return { kind: "track", letterOffsets: [0, 2, 3, 4, 6] };
  }

  if (scaleId === "whole-tone") {
    return { kind: "track", letterOffsets: [0, 1, 2, 3, 4, 5] };
  }

  if (scaleLength === 7) {
    return { kind: "track", letterOffsets: [0, 1, 2, 3, 4, 5, 6] };
  }

  return { kind: "base-only", reason: `${scaleId} is outside the supported standard letter tracks` };
}

export function resolveNamedChordLetterOffsets(offsets: number[]): LetterTrackResolution {
  const letterOffsets = offsets.map((offset) => CHORD_LETTER_OFFSET_BY_INTERVAL.get(offset));

  if (letterOffsets.some((offset) => offset === undefined)) {
    return { kind: "base-only", reason: "Chord contains an unsupported interval spelling" };
  }

  return { kind: "track", letterOffsets: letterOffsets as number[] };
}

function assertLetterTrack(letterOffsets: number[]): void {
  if (letterOffsets.length === 0) {
    throw new Error("Letter track cannot be empty");
  }

  if (letterOffsets[0] !== 0) {
    throw new Error("Letter track must start from 0");
  }

  const normalizedLetters = letterOffsets.map((letterOffset) => {
    assertLetterIndex(letterOffset, "Letter offset");
    return mod(letterOffset, 7);
  });

  if (new Set(normalizedLetters).size !== normalizedLetters.length) {
    throw new Error("Letter track cannot contain duplicated letters");
  }
}

function assertLetterIndex(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 6) {
    throw new Error(`${name} must be an integer inside 0..6`);
  }
}

function assertPitchClass(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > 11) {
    throw new Error(`Pitch class ${value} must be normalized inside 0..11`);
  }
}

function assertNotationMode(mode: NotationMode): void {
  if (mode !== "musician" && mode !== "theorist") {
    throw new Error(`Unsupported notation mode: ${mode}`);
  }
}

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

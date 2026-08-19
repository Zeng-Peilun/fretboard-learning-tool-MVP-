import { midiToNote, parseNoteName, pc } from "./notes";
import type {
  BoxPreset,
  BoxRange,
  FretCell,
  HighlightedFretCell,
  PitchClass,
  TargetPitch,
  TuningPreset
} from "./types";

export const TUNING_PRESETS: TuningPreset[] = [
  {
    id: "guitar-6-standard",
    label: "6弦吉他 Standard",
    instrument: "guitar",
    notes: ["E2", "A2", "D3", "G3", "B3", "E4"],
    defaultFretCount: 24
  },
  {
    id: "guitar-6-drop-d",
    label: "6弦吉他 Drop D",
    instrument: "guitar",
    notes: ["D2", "A2", "D3", "G3", "B3", "E4"],
    defaultFretCount: 24
  },
  {
    id: "guitar-6-eb-standard",
    label: "6弦吉他 Eb Standard",
    instrument: "guitar",
    notes: ["Eb2", "Ab2", "Db3", "Gb3", "Bb3", "Eb4"],
    defaultFretCount: 24
  },
  {
    id: "guitar-6-d-standard",
    label: "6弦吉他 D Standard",
    instrument: "guitar",
    notes: ["D2", "G2", "C3", "F3", "A3", "D4"],
    defaultFretCount: 24
  },
  {
    id: "guitar-6-drop-c",
    label: "6弦吉他 Drop C",
    instrument: "guitar",
    notes: ["C2", "G2", "C3", "F3", "A3", "D4"],
    defaultFretCount: 24
  },
  {
    id: "guitar-6-dadgad",
    label: "6弦吉他 DADGAD",
    instrument: "guitar",
    notes: ["D2", "A2", "D3", "G3", "A3", "D4"],
    defaultFretCount: 24
  },
  {
    id: "guitar-6-open-d",
    label: "6弦吉他 Open D",
    instrument: "guitar",
    notes: ["D2", "A2", "D3", "F#3", "A3", "D4"],
    defaultFretCount: 24
  },
  {
    id: "guitar-6-open-g",
    label: "6弦吉他 Open G",
    instrument: "guitar",
    notes: ["D2", "G2", "D3", "G3", "B3", "D4"],
    defaultFretCount: 24
  },
  {
    id: "guitar-6-facgce",
    label: "6弦吉他 FACGCE",
    instrument: "guitar",
    notes: ["F2", "A2", "C3", "G3", "C4", "E4"],
    defaultFretCount: 24
  },
  {
    id: "guitar-6-daeac-sharp-e",
    label: "6弦吉他 DAEAC#E",
    instrument: "guitar",
    notes: ["D2", "A2", "E3", "A3", "C#4", "E4"],
    defaultFretCount: 24
  },
  {
    id: "guitar-7-standard",
    label: "7弦吉他 Standard",
    instrument: "guitar",
    notes: ["B1", "E2", "A2", "D3", "G3", "B3", "E4"],
    defaultFretCount: 24
  },
  {
    id: "bass-4-standard",
    label: "4弦贝斯 Standard",
    instrument: "bass",
    notes: ["E1", "A1", "D2", "G2"],
    defaultFretCount: 24
  },
  {
    id: "bass-5-standard",
    label: "5弦贝斯 Standard",
    instrument: "bass",
    notes: ["B0", "E1", "A1", "D2", "G2"],
    defaultFretCount: 24
  },
  {
    id: "bass-4-drop-d",
    label: "4弦贝斯 Drop D",
    instrument: "bass",
    notes: ["D1", "A1", "D2", "G2"],
    defaultFretCount: 24
  },
  {
    id: "bass-4-eb-standard",
    label: "4弦贝斯 Eb Standard",
    instrument: "bass",
    notes: ["Eb1", "Ab1", "Db2", "Gb2"],
    defaultFretCount: 24
  },
  {
    id: "bass-4-d-standard",
    label: "4弦贝斯 D Standard",
    instrument: "bass",
    notes: ["D1", "G1", "C2", "F2"],
    defaultFretCount: 24
  },
  {
    id: "bass-4-drop-c",
    label: "4弦贝斯 Drop C",
    instrument: "bass",
    notes: ["C1", "G1", "C2", "F2"],
    defaultFretCount: 24
  },
  {
    id: "bass-4-bead",
    label: "4弦贝斯 BEAD",
    instrument: "bass",
    notes: ["B0", "E1", "A1", "D2"],
    defaultFretCount: 24
  },
  {
    id: "bass-5-drop-a",
    label: "5弦贝斯 Drop A",
    instrument: "bass",
    notes: ["A0", "E1", "A1", "D2", "G2"],
    defaultFretCount: 24
  }
];

export function buildFretboard(tuning: string[], fretCount: number): FretCell[] {
  if (tuning.length === 0) {
    throw new Error("Tuning must contain at least one string");
  }

  if (fretCount < 0) {
    throw new Error("Fret count cannot be negative");
  }

  const openStringMidis = tuning.map(parseNoteName);
  const stringCount = openStringMidis.length;
  const cells: FretCell[] = [];

  openStringMidis.forEach((openMidi, stringIndex) => {
    const internalString = stringIndex + 1;
    const displayString = stringCount - internalString + 1;

    for (let fret = 0; fret <= fretCount; fret += 1) {
      const midi = openMidi + fret;
      cells.push({
        internalString,
        displayString,
        fret,
        midi,
        note: midiToNote(midi)
      });
    }
  });

  return cells;
}

export function coordKey(cell: Pick<FretCell, "internalString" | "fret">): string {
  return `${cell.internalString}:${cell.fret}`;
}

export function displayStringToInternal(displayString: number, stringCount: number): number {
  return stringCount - displayString + 1;
}

export function makeBoxFromDisplayRange(
  displayStringStart: number,
  displayStringEnd: number,
  fretStart: number,
  fretEnd: number,
  stringCount: number,
  fretCount: number
): BoxRange {
  const internalA = displayStringToInternal(displayStringStart, stringCount);
  const internalB = displayStringToInternal(displayStringEnd, stringCount);

  return normalizeBox(
    {
      stringStart: Math.min(internalA, internalB),
      stringEnd: Math.max(internalA, internalB),
      fretStart,
      fretEnd
    },
    stringCount,
    fretCount
  );
}

export function normalizeBox(box: BoxRange, stringCount: number, fretCount: number): BoxRange {
  const stringStart = clamp(Math.min(box.stringStart, box.stringEnd), 1, stringCount);
  const stringEnd = clamp(Math.max(box.stringStart, box.stringEnd), 1, stringCount);
  const fretStart = clamp(Math.min(box.fretStart, box.fretEnd), 0, fretCount);
  const fretEnd = clamp(Math.max(box.fretStart, box.fretEnd), 0, fretCount);

  return { stringStart, stringEnd, fretStart, fretEnd };
}

export function filterByBox(cells: FretCell[], box: BoxRange): FretCell[] {
  return cells.filter((cell) => isCellInBox(cell, box));
}

export function isCellInBox(cell: FretCell, box: BoxRange): boolean {
  return (
    cell.internalString >= box.stringStart &&
    cell.internalString <= box.stringEnd &&
    cell.fret >= box.fretStart &&
    cell.fret <= box.fretEnd
  );
}

export function annotateTargets(cells: FretCell[], targetPcs: PitchClass[] | TargetPitch[]): HighlightedFretCell[] {
  const targets = targetPcs.map((target, order) =>
    typeof target === "number"
      ? {
          pc: pc(target),
          label: String(order + 1),
          order
        }
      : {
          ...target,
          pc: pc(target.pc)
        }
  );

  return cells.map((cell) => ({
    ...cell,
    matches: targets.filter((target) => target.pc === cell.note.pc)
  }));
}

export function createBoxPresets(stringCount: number, fretCount: number): BoxPreset[] {
  const fullBoard = normalizeBox(
    { stringStart: 1, stringEnd: stringCount, fretStart: 0, fretEnd: fretCount },
    stringCount,
    fretCount
  );

  return [
    {
      id: "full",
      label: `全指板 0-${fretCount}品`,
      box: fullBoard
    },
    {
      id: "open",
      label: "开放把位 0-3品",
      box: normalizeBox({ stringStart: 1, stringEnd: stringCount, fretStart: 0, fretEnd: 3 }, stringCount, fretCount)
    },
    {
      id: "low",
      label: "低把位 1-5品",
      box: normalizeBox({ stringStart: 1, stringEnd: stringCount, fretStart: 1, fretEnd: 5 }, stringCount, fretCount)
    },
    {
      id: "three-to-seven",
      label: "3-7品",
      box: normalizeBox({ stringStart: 1, stringEnd: stringCount, fretStart: 3, fretEnd: 7 }, stringCount, fretCount)
    },
    {
      id: "middle",
      label: "中把位 5-9品",
      box: normalizeBox({ stringStart: 1, stringEnd: stringCount, fretStart: 5, fretEnd: 9 }, stringCount, fretCount)
    },
    {
      id: "seven-to-ten",
      label: "7-10品",
      box: normalizeBox({ stringStart: 1, stringEnd: stringCount, fretStart: 7, fretEnd: 10 }, stringCount, fretCount)
    },
    {
      id: "upper",
      label: "高把位 8-13品",
      box: normalizeBox({ stringStart: 1, stringEnd: stringCount, fretStart: 8, fretEnd: 13 }, stringCount, fretCount)
    }
  ];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.trunc(value), min), max);
}

import { useMemo } from "react";
import { CHORD_TEMPLATES, SCALE_TEMPLATES } from "../domain/catalog";
import {
  annotateTargets,
  buildFretboard,
  coordKey,
  createBoxPresets,
  filterByBox,
  makeBoxFromDisplayRange
} from "../domain/fretboard";
import { diatonicChordTargets, namedChordTargets, scaleTargets } from "../domain/intervals";
import { pc } from "../domain/notes";
import type {
  BoxPreset,
  BoxRange,
  ChordTemplate,
  FretCell,
  HighlightedFretCell,
  ScaleTemplate,
  TargetPitch
} from "../domain/types";
import {
  baseNameForPitchClass,
  renderNames,
  resolveNamedChordLetterOffsets,
  resolveScaleLetterOffsets,
  ROOT_NOTE_OPTIONS,
  spellMany,
  type LetterTrackResolution,
  type NotationMode
} from "../view/notation";

export type LearningMode = "named-chord" | "diatonic-chord";
export type DiatonicDisplayMode = "arpeggio" | "scale";
export type DiatonicChordSummary = {
  fullName: string;
  qualityName: string;
  symbol: string;
};

type RootNoteOption = (typeof ROOT_NOTE_OPTIONS)[number];

type FretboardState = {
  cells: FretCell[];
  error: string;
};

type TargetState = {
  targetDisplayNames: string[];
  targetNameByPc: Map<number, string>;
  targetNames: string;
  targets: TargetPitch[];
  title: string;
};

type LegendItem = (typeof OCTAVE_PALETTE)[number] & {
  count: number;
  notes: string[];
};

type HighlightedState = {
  colorByOctave: Map<number, string>;
  highlightMap: Map<string, HighlightedFretCell>;
  legend: LegendItem[];
  matchedCells: HighlightedFretCell[];
};

export type UseMusicModelInput = {
  awfulTolerance: number;
  boxPresetId: string;
  chordId: string;
  degree: number;
  diatonicDisplayMode: DiatonicDisplayMode;
  fretCount: number;
  learningMode: LearningMode;
  manualDisplayStringEnd: number;
  manualDisplayStringStart: number;
  manualFretEnd: number;
  manualFretStart: number;
  notationMode: NotationMode;
  rootNoteId: string;
  scaleId: string;
  stackSize: number;
  tuningText: string;
};

export type MusicModel = {
  boxPresets: BoxPreset[];
  cellMap: Map<string, FretCell>;
  currentBox: BoxRange | null;
  degreeChordSummaries: DiatonicChordSummary[];
  fretNumbers: number[];
  fretboardState: FretboardState;
  highlightedState: HighlightedState;
  maxDiatonicDegree: number;
  rowDisplayStrings: number[];
  selectedChord: ChordTemplate;
  selectedRoot: RootNoteOption;
  selectedScale: ScaleTemplate;
  stringCount: number;
  targetState: TargetState;
  tuningNotes: string[];
};

const ROMAN_DEGREES = ["I", "II", "III", "IV", "V", "VI", "VII"] as const;
const DEGREE_OPTIONS = ROMAN_DEGREES.map((roman, index) => ({
  degree: index + 1,
  roman
}));
const EMPTY_DIATONIC_CHORD_SUMMARY: DiatonicChordSummary = {
  fullName: "",
  qualityName: "",
  symbol: ""
};

const OCTAVE_PALETTE = [
  { octave: 0, name: "深海蓝", englishName: "Deep Sea Blue", color: "rgba(28, 95, 176, 0.52)" },
  { octave: 1, name: "亮紫", englishName: "Bright Purple", color: "rgba(168, 85, 247, 0.52)" },
  { octave: 2, name: "亮红", englishName: "Bright Red", color: "rgba(248, 78, 93, 0.52)" },
  { octave: 3, name: "珊瑚橙", englishName: "Coral Orange", color: "rgba(255, 127, 86, 0.52)" },
  { octave: 4, name: "荧光粉", englishName: "Fluorescent Pink", color: "rgba(255, 82, 170, 0.52)" },
  { octave: 5, name: "柠檬黄", englishName: "Lemon Yellow", color: "rgba(247, 214, 74, 0.54)" },
  { octave: 6, name: "蒂芙尼蓝", englishName: "Tiffany Blue", color: "rgba(76, 205, 196, 0.52)" },
  { octave: 7, name: "极光绿", englishName: "Aurora Green", color: "rgba(92, 221, 138, 0.52)" }
] as const;

export function useMusicModel({
  awfulTolerance,
  boxPresetId,
  chordId,
  degree,
  diatonicDisplayMode,
  fretCount,
  learningMode,
  manualDisplayStringEnd,
  manualDisplayStringStart,
  manualFretEnd,
  manualFretStart,
  notationMode,
  rootNoteId,
  scaleId,
  stackSize,
  tuningText
}: UseMusicModelInput): MusicModel {
  const tuningNotes = useMemo(() => parseTuningNotes(tuningText), [tuningText]);
  const stringCount = useMemo(() => countStrings(tuningNotes), [tuningNotes]);
  const selectedRoot = useMemo(() => resolveSelectedRoot(rootNoteId), [rootNoteId]);
  const selectedScale = useMemo(() => resolveSelectedScale(scaleId), [scaleId]);
  const selectedChord = useMemo(() => resolveSelectedChord(chordId), [chordId]);
  const maxDiatonicDegree = useMemo(() => getMaxDiatonicDegree(selectedScale), [selectedScale]);
  const boxPresets = useMemo(() => createBoxPresets(stringCount, fretCount), [stringCount, fretCount]);
  const currentBox = useMemo(
    () =>
      resolveCurrentBox({
        boxPresetId,
        boxPresets,
        fretCount,
        manualDisplayStringEnd,
        manualDisplayStringStart,
        manualFretEnd,
        manualFretStart,
        stringCount
      }),
    [
      boxPresetId,
      boxPresets,
      fretCount,
      manualDisplayStringEnd,
      manualDisplayStringStart,
      manualFretEnd,
      manualFretStart,
      stringCount
    ]
  );
  const fretboardState = useMemo(() => buildFretboardState(tuningNotes, fretCount), [fretCount, tuningNotes]);
  const targetState = useMemo(
    () =>
      buildTargetState({
        awfulTolerance,
        degree,
        diatonicDisplayMode,
        learningMode,
        maxDiatonicDegree,
        notationMode,
        selectedChord,
        selectedRoot,
        selectedScale,
        stackSize
      }),
    [
      awfulTolerance,
      degree,
      diatonicDisplayMode,
      learningMode,
      maxDiatonicDegree,
      notationMode,
      selectedChord,
      selectedRoot,
      selectedScale,
      stackSize
    ]
  );
  const degreeChordSummaries = useMemo(
    () =>
      buildDegreeChordSummaries({
        awfulTolerance,
        maxDiatonicDegree,
        notationMode,
        selectedRoot,
        selectedScale,
        stackSize
      }),
    [awfulTolerance, maxDiatonicDegree, notationMode, selectedRoot, selectedScale, stackSize]
  );
  const highlightedState = useMemo(
    () => buildHighlightedState(currentBox, fretboardState.cells, targetState),
    [currentBox, fretboardState.cells, targetState]
  );
  const cellMap = useMemo(() => buildCellMap(fretboardState.cells), [fretboardState.cells]);
  const rowDisplayStrings = useMemo(() => buildRowDisplayStrings(stringCount), [stringCount]);
  const fretNumbers = useMemo(() => buildFretNumbers(fretCount), [fretCount]);

  return {
    boxPresets,
    cellMap,
    currentBox,
    degreeChordSummaries,
    fretNumbers,
    fretboardState,
    highlightedState,
    maxDiatonicDegree,
    rowDisplayStrings,
    selectedChord,
    selectedRoot,
    selectedScale,
    stringCount,
    targetState,
    tuningNotes
  };
}

function parseTuningNotes(tuningText: string): string[] {
  return tuningText.trim().split(/\s+/).filter(Boolean);
}

function countStrings(tuningNotes: string[]): number {
  return Math.max(tuningNotes.length, 1);
}

function resolveSelectedRoot(rootNoteId: string): RootNoteOption {
  return ROOT_NOTE_OPTIONS.find((root) => root.id === rootNoteId) ?? ROOT_NOTE_OPTIONS[0];
}

function resolveSelectedScale(scaleId: string): ScaleTemplate {
  return SCALE_TEMPLATES.find((scale) => scale.id === scaleId) ?? SCALE_TEMPLATES[0];
}

function resolveSelectedChord(chordId: string): ChordTemplate {
  return CHORD_TEMPLATES.find((chord) => chord.id === chordId) ?? CHORD_TEMPLATES[0];
}

function getMaxDiatonicDegree(selectedScale: ScaleTemplate): number {
  return Math.min(ROMAN_DEGREES.length, selectedScale.offsets.length);
}

function resolveCurrentBox({
  boxPresetId,
  boxPresets,
  fretCount,
  manualDisplayStringEnd,
  manualDisplayStringStart,
  manualFretEnd,
  manualFretStart,
  stringCount
}: {
  boxPresetId: string;
  boxPresets: BoxPreset[];
  fretCount: number;
  manualDisplayStringEnd: number;
  manualDisplayStringStart: number;
  manualFretEnd: number;
  manualFretStart: number;
  stringCount: number;
}): BoxRange | null {
  if (boxPresetId === "none") {
    return null;
  }

  const selectedBoxPreset = boxPresets.find((preset) => preset.id === boxPresetId);

  return (
    selectedBoxPreset?.box ??
    makeBoxFromDisplayRange(
      manualDisplayStringStart,
      manualDisplayStringEnd,
      manualFretStart,
      manualFretEnd,
      stringCount,
      fretCount
    )
  );
}

function buildFretboardState(tuningNotes: string[], fretCount: number): FretboardState {
  try {
    return {
      cells: buildFretboard(tuningNotes, fretCount),
      error: ""
    };
  } catch (error) {
    return {
      cells: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function buildTargetState({
  awfulTolerance,
  degree,
  diatonicDisplayMode,
  learningMode,
  maxDiatonicDegree,
  notationMode,
  selectedChord,
  selectedRoot,
  selectedScale,
  stackSize
}: {
  awfulTolerance: number;
  degree: number;
  diatonicDisplayMode: DiatonicDisplayMode;
  learningMode: LearningMode;
  maxDiatonicDegree: number;
  notationMode: NotationMode;
  selectedChord: ChordTemplate;
  selectedRoot: RootNoteOption;
  selectedScale: ScaleTemplate;
  stackSize: number;
}): TargetState {
  const safeDegree = clamp(degree, 1, maxDiatonicDegree);
  const rootPc = selectedRoot.pc;
  const targets =
    learningMode === "named-chord"
      ? namedChordTargets(rootPc, selectedChord)
      : diatonicDisplayMode === "scale"
        ? scaleTargets(rootPc, selectedScale)
        : diatonicChordTargets(rootPc, selectedScale, safeDegree, stackSize);
  const targetDisplayNames = renderTargetDisplayNames(
    targets,
    learningMode === "named-chord"
      ? {
          type: "named-chord",
          chordOffsets: selectedChord.offsets
        }
      : {
          type: diatonicDisplayMode === "scale" ? "scale" : "diatonic-chord",
          degree: safeDegree,
          scaleId: selectedScale.id,
          scaleLength: selectedScale.offsets.length
        },
    selectedRoot.letter,
    notationMode,
    awfulTolerance
  );
  const targetNameByPc = makeFirstNameByPitchClass(targets, targetDisplayNames);
  const inferredChord =
    learningMode === "diatonic-chord" && diatonicDisplayMode === "arpeggio"
      ? inferChordSummary(targets, targetDisplayNames)
      : null;
  const title = formatTargetTitle({
    diatonicDisplayMode,
    inferredChord,
    safeDegree,
    selectedChord,
    selectedRoot,
    selectedScale,
    learningMode
  });

  return {
    targets,
    title,
    targetDisplayNames,
    targetNameByPc,
    targetNames: describeUniqueTargetNames(targets, targetDisplayNames)
  };
}

function formatTargetTitle({
  diatonicDisplayMode,
  inferredChord,
  learningMode,
  safeDegree,
  selectedChord,
  selectedRoot,
  selectedScale
}: {
  diatonicDisplayMode: DiatonicDisplayMode;
  inferredChord: DiatonicChordSummary | null;
  learningMode: LearningMode;
  safeDegree: number;
  selectedChord: ChordTemplate;
  selectedRoot: RootNoteOption;
  selectedScale: ScaleTemplate;
}): string {
  if (learningMode === "named-chord") {
    return selectedChord.symbol.replace(/X/g, selectedRoot.label);
  }

  if (diatonicDisplayMode === "scale") {
    return `${selectedRoot.label} ${selectedScale.name}`;
  }

  return `${selectedRoot.label} ${selectedScale.name} · ${ROMAN_DEGREES[safeDegree - 1]}级 · ${inferredChord?.symbol ?? ""}`;
}

function buildDegreeChordSummaries({
  awfulTolerance,
  maxDiatonicDegree,
  notationMode,
  selectedRoot,
  selectedScale,
  stackSize
}: {
  awfulTolerance: number;
  maxDiatonicDegree: number;
  notationMode: NotationMode;
  selectedRoot: RootNoteOption;
  selectedScale: ScaleTemplate;
  stackSize: number;
}): DiatonicChordSummary[] {
  return DEGREE_OPTIONS.map(({ degree }) =>
    degree <= maxDiatonicDegree
      ? describeDiatonicChord(
          selectedRoot.pc,
          selectedScale,
          degree,
          stackSize,
          selectedRoot.letter,
          notationMode,
          awfulTolerance
        )
      : EMPTY_DIATONIC_CHORD_SUMMARY
  );
}

function buildHighlightedState(
  currentBox: BoxRange | null,
  fretboardCells: FretCell[],
  targetState: TargetState
): HighlightedState {
  const cellsInBox = currentBox ? filterByBox(fretboardCells, currentBox) : [];
  const annotatedCells = annotateTargets(cellsInBox, targetState.targets);
  const matchedCells = annotatedCells.filter((cell) => cell.matches.length > 0);
  const highlightMap = new Map(matchedCells.map((cell) => [coordKey(cell), cell]));
  const legend = OCTAVE_PALETTE.map((paletteItem) => {
    const { octave } = paletteItem;
    const cells = matchedCells.filter((cell) => cell.note.octave === octave);
    const notes = Array.from(
      new Set(cells.map((cell) => targetState.targetNameByPc.get(cell.note.pc) ?? baseNameForPitchClass(cell.note.pc)))
    ).sort(sortNoteNames);

    return {
      ...paletteItem,
      notes,
      count: cells.length
    };
  });
  const colorByOctave = new Map<number, string>(OCTAVE_PALETTE.map((item) => [item.octave, item.color]));

  return { matchedCells, highlightMap, legend, colorByOctave };
}

function buildCellMap(cells: FretCell[]): Map<string, FretCell> {
  return new Map(cells.map((cell) => [coordKey(cell), cell]));
}

function buildRowDisplayStrings(stringCount: number): number[] {
  return Array.from({ length: stringCount }, (_, index) => index + 1);
}

function buildFretNumbers(fretCount: number): number[] {
  return Array.from({ length: fretCount + 1 }, (_, fret) => fret);
}

type TargetRenderContext =
  | {
      type: "named-chord";
      chordOffsets: number[];
    }
  | {
      type: "scale" | "diatonic-chord";
      degree: number;
      scaleId: string;
      scaleLength: number;
    };

function renderTargetDisplayNames(
  targets: TargetPitch[],
  context: TargetRenderContext,
  rootLetter: number,
  mode: NotationMode,
  awfulTolerance: number
): string[] {
  const pitchClasses = targets.map((target) => target.pc);
  const letterTrack =
    context.type === "named-chord"
      ? resolveNamedChordLetterOffsets(context.chordOffsets)
      : resolveScaleLetterOffsets(context.scaleId, context.scaleLength);

  if (letterTrack.kind === "base-only") {
    return pitchClasses.map(baseNameForPitchClass);
  }

  const indexes = targetIndexes(targets, context, letterTrack);
  const records = spellMany(pitchClasses, indexes, rootLetter, letterTrack.letterOffsets);

  return renderNames(records, pitchClasses, mode, awfulTolerance);
}

function targetIndexes(
  targets: TargetPitch[],
  context: TargetRenderContext,
  letterTrack: Extract<LetterTrackResolution, { kind: "track" }>
): number[] {
  if (context.type === "named-chord") {
    return targets.map((_, index) => index);
  }

  if (context.type === "scale") {
    return targets.map((_, index) => index);
  }

  return targets.map((_, index) => (context.degree - 1 + 2 * index) % letterTrack.letterOffsets.length);
}

function makeFirstNameByPitchClass(targets: TargetPitch[], names: string[]): Map<number, string> {
  return targets.reduce((nameByPc, target, index) => {
    if (!nameByPc.has(target.pc)) {
      nameByPc.set(target.pc, names[index] ?? baseNameForPitchClass(target.pc));
    }

    return nameByPc;
  }, new Map<number, string>());
}

function describeUniqueTargetNames(targets: TargetPitch[], names: string[]): string {
  const seen = new Set<number>();

  return targets
    .reduce<string[]>((uniqueNames, target, index) => {
      if (!seen.has(target.pc)) {
        seen.add(target.pc);
        uniqueNames.push(names[index] ?? baseNameForPitchClass(target.pc));
      }

      return uniqueNames;
    }, [])
    .join(" ");
}

function describeDiatonicChord(
  rootPc: number,
  scaleTemplate: ScaleTemplate,
  degree: number,
  stackSize: number,
  rootLetter: number,
  mode: NotationMode,
  awfulTolerance: number
): DiatonicChordSummary {
  const targets = diatonicChordTargets(rootPc, scaleTemplate, degree, stackSize);
  const targetDisplayNames = renderTargetDisplayNames(
    targets,
    {
      type: "diatonic-chord",
      degree,
      scaleId: scaleTemplate.id,
      scaleLength: scaleTemplate.offsets.length
    },
    rootLetter,
    mode,
    awfulTolerance
  );

  return inferChordSummary(targets, targetDisplayNames);
}

function inferChordSummary(targets: TargetPitch[], targetDisplayNames: string[]): DiatonicChordSummary {
  if (targets.length === 0) {
    return {
      fullName: "",
      qualityName: "",
      symbol: ""
    };
  }

  const chordRootPc = targets[0].pc;
  const chordRootName = targetDisplayNames[0] ?? baseNameForPitchClass(chordRootPc);
  const normalizedOffsets = targets.map((target) => pc(target.pc - chordRootPc));
  const matchedTemplate = CHORD_TEMPLATES.find(
    (template) =>
      template.offsets.length === normalizedOffsets.length &&
      template.offsets.every((offset, index) => pc(offset) === normalizedOffsets[index])
  );

  if (matchedTemplate) {
    return {
      fullName: `${chordRootName} ${matchedTemplate.name}`,
      qualityName: matchedTemplate.name,
      symbol: matchedTemplate.symbol.replace(/X/g, chordRootName)
    };
  }

  const noteNames = targets
    .map((target, index) => targetDisplayNames[index] ?? baseNameForPitchClass(target.pc))
    .join(" ");

  return {
    fullName: `${chordRootName} (${noteNames})`,
    qualityName: "自定义音组",
    symbol: `${chordRootName} (${noteNames})`
  };
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(Math.trunc(value), min), max);
}

function sortNoteNames(a: string, b: string): number {
  return a.localeCompare(b, "en", { numeric: true });
}

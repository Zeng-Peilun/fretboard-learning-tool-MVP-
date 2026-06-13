export type MidiNumber = number;
export type PitchClass = number;

export interface NoteInfo {
  midi: MidiNumber;
  pc: PitchClass;
  octave: number;
  name: string;
  compactName: string;
}

export interface TuningPreset {
  id: string;
  label: string;
  instrument: "guitar" | "bass";
  notes: string[];
  defaultFretCount: number;
}

export interface ScaleTemplate {
  id: string;
  name: string;
  category: string;
  source: string;
  steps: number[];
  offsets: number[];
}

export interface ChordTemplate {
  id: string;
  name: string;
  symbol: string;
  source: string;
  steps: number[];
  offsets: number[];
}

export interface FretCell {
  internalString: number;
  displayString: number;
  fret: number;
  midi: MidiNumber;
  note: NoteInfo;
}

export interface BoxRange {
  stringStart: number;
  stringEnd: number;
  fretStart: number;
  fretEnd: number;
}

export interface BoxPreset {
  id: string;
  label: string;
  box: BoxRange;
}

export interface TargetPitch {
  pc: PitchClass;
  label: string;
  offset?: number;
  order: number;
}

export interface HighlightedFretCell extends FretCell {
  matches: TargetPitch[];
}

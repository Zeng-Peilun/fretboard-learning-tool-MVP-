import { describe, expect, it } from "vitest";
import { CHORD_TEMPLATES, SCALE_TEMPLATES } from "../domain/catalog";
import { diatonicChordPcs, namedChordPcs, scaleOrder } from "../domain/intervals";
import {
  baseNameForPitchClass,
  renderNames,
  resolveNamedChordLetterOffsets,
  resolveScaleLetterOffsets,
  ROOT_NOTE_OPTIONS,
  spell,
  spellMany,
  type NotationMode,
  type RootNoteOption
} from "./notation";

describe("enharmonic notation rendering", () => {
  it("renders Db Ionian with flat spellings", () => {
    expect(renderScale("d-flat", "ionian", "musician")).toEqual(["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"]);
  });

  it("keeps theoretical C# Ionian spellings in theorist mode and falls back in musician mode", () => {
    expect(renderScale("c-sharp", "ionian", "theorist")).toEqual(["C#", "D#", "E#", "F#", "G#", "A#", "B#"]);
    expect(renderScale("c-sharp", "ionian", "musician")).toEqual(["C#", "Eb", "F", "F#", "Ab", "Bb", "C"]);
  });

  it("renders C Ionian II7 as D F A C", () => {
    const root = findRoot("c");
    const ionian = findScale("ionian");
    const pitchClasses = diatonicChordPcs(root.pc, ionian, 2, 4);
    const letterTrack = resolveScaleLetterOffsets(ionian.id, ionian.offsets.length);

    expect(letterTrack.kind).toBe("track");

    const indexes = [1, 3, 5, 0];
    const records = spellMany(
      pitchClasses,
      indexes,
      root.letter,
      letterTrack.kind === "track" ? letterTrack.letterOffsets : []
    );

    expect(renderNames(records, pitchClasses, "musician")).toEqual(["D", "F", "A", "C"]);
  });

  it("renders a C# major chord theoretically and falls back for musician mode", () => {
    expect(renderChord("c-sharp", "major", "theorist")).toEqual(["C#", "E#", "G#"]);
    expect(renderChord("c-sharp", "major", "musician")).toEqual(["C#", "F", "Ab"]);
  });

  it("uses the minor pentatonic letter track from the plan", () => {
    expect(renderScale("c", "minor-pentatonic", "musician")).toEqual(["C", "Eb", "F", "G", "Bb"]);
  });

  it("renders whole-tone scales with a unique six-letter track", () => {
    expect(renderScale("c", "whole-tone", "musician")).toEqual(["C", "D", "E", "F#", "G#", "A#"]);
  });

  it("falls back for diminished and chromatic scales", () => {
    expect(renderScale("c", "diminished", "musician")).toEqual(["C", "D", "Eb", "F", "F#", "Ab", "A", "B"]);
    expect(renderScale("c", "chromatic", "theorist")).toEqual([
      "C",
      "C#",
      "D",
      "Eb",
      "E",
      "F",
      "F#",
      "G",
      "Ab",
      "A",
      "Bb",
      "B"
    ]);
  });

  it("rejects invalid spelling inputs", () => {
    expect(() => spell(0, 0, 0, [0, 0])).toThrow("duplicated letters");
    expect(() => spell(0, 2, 0, [0, 1])).toThrow("outside 0..1");
    expect(() => renderNames([], [], "listener" as NotationMode)).toThrow("Unsupported notation mode");
  });
});

function renderScale(rootId: string, scaleId: string, mode: NotationMode): string[] {
  const root = findRoot(rootId);
  const scale = findScale(scaleId);
  const pitchClasses = scaleOrder(root.pc, scale);
  const letterTrack = resolveScaleLetterOffsets(scale.id, scale.offsets.length);

  if (letterTrack.kind === "base-only") {
    return pitchClasses.map(baseNameForPitchClass);
  }

  const indexes = pitchClasses.map((_, index) => index);
  const records = spellMany(pitchClasses, indexes, root.letter, letterTrack.letterOffsets);

  return renderNames(records, pitchClasses, mode);
}

function renderChord(rootId: string, chordId: string, mode: NotationMode): string[] {
  const root = findRoot(rootId);
  const chord = CHORD_TEMPLATES.find((item) => item.id === chordId);

  if (!chord) {
    throw new Error(`Missing test chord: ${chordId}`);
  }

  const pitchClasses = namedChordPcs(root.pc, chord);
  const letterTrack = resolveNamedChordLetterOffsets(chord.offsets);

  if (letterTrack.kind === "base-only") {
    return pitchClasses.map(baseNameForPitchClass);
  }

  const indexes = pitchClasses.map((_, index) => index);
  const records = spellMany(pitchClasses, indexes, root.letter, letterTrack.letterOffsets);

  return renderNames(records, pitchClasses, mode);
}

function findRoot(id: string): RootNoteOption {
  const root = ROOT_NOTE_OPTIONS.find((item) => item.id === id);

  if (!root) {
    throw new Error(`Missing test root: ${id}`);
  }

  return root;
}

function findScale(id: string) {
  const scale = SCALE_TEMPLATES.find((item) => item.id === id);

  if (!scale) {
    throw new Error(`Missing test scale: ${id}`);
  }

  return scale;
}

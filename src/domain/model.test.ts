import { describe, expect, it } from "vitest";
import { CHORD_TEMPLATES, SCALE_TEMPLATES } from "./catalog";
import {
  annotateTargets,
  buildFretboard,
  createBoxPresets,
  displayStringToInternal,
  filterByBox,
  makeBoxFromDisplayRange,
  normalizeBox,
  TUNING_PRESETS
} from "./fretboard";
import {
  describeTargetPitchClasses,
  diatonicChordPcs,
  diatonicChordTargets,
  makeChordTemplate,
  makeScaleTemplate,
  namedChordPcs,
  namedChordTargets,
  parseIntervalSteps,
  scaleOrder,
  scaleTargets,
  stepsToOffsets,
  validateScaleTemplate
} from "./intervals";
import { midiToNote, parseNoteName, pc, pcToCompactName, pcToName } from "./notes";

describe("note conversion", () => {
  it("maps note names to MIDI numbers", () => {
    expect(parseNoteName("E2")).toBe(40);
    expect(parseNoteName("C4")).toBe(60);
    expect(parseNoteName("B0")).toBe(23);
  });

  it("normalizes pitch classes and common note spellings", () => {
    expect(pc(-1)).toBe(11);
    expect(pc(12)).toBe(0);
    expect(parseNoteName(" C#4/Db4 ")).toBe(61);
    expect(parseNoteName("Db4")).toBe(61);
    expect(parseNoteName("F♯3")).toBe(54);
    expect(parseNoteName("G♭3")).toBe(54);
  });

  it("maps MIDI numbers back to note names", () => {
    expect(midiToNote(60)).toEqual({
      midi: 60,
      pc: 0,
      octave: 4,
      name: "C4",
      compactName: "C4"
    });
    expect(midiToNote(61)).toMatchObject({
      pc: 1,
      octave: 4,
      name: "C#/Db4",
      compactName: "C#4"
    });
    expect(pcToName(-1)).toBe("B");
    expect(pcToCompactName(13)).toBe("C#");
  });

  it("rejects invalid note names", () => {
    expect(() => parseNoteName("H2")).toThrow("Invalid note name");
    expect(() => parseNoteName("C##4")).toThrow("Invalid note name");
  });
});

describe("fretboard mapping", () => {
  it("builds standard 6 string guitar open string MIDI numbers", () => {
    const preset = TUNING_PRESETS.find((item) => item.id === "guitar-6-standard");
    const cells = buildFretboard(preset?.notes ?? [], 0);

    expect(cells.map((cell) => cell.midi)).toEqual([40, 45, 50, 55, 59, 64]);
  });

  it("renders guitar display strings from high string to low string", () => {
    const preset = TUNING_PRESETS.find((item) => item.id === "guitar-6-standard");
    const cells = buildFretboard(preset?.notes ?? [], 0);

    expect(cells.sort((a, b) => a.displayString - b.displayString).map((cell) => cell.note.name)).toEqual([
      "E4",
      "B3",
      "G3",
      "D3",
      "A2",
      "E2"
    ]);
  });

  it("keeps the standard guitar major third between display strings 2 and 3", () => {
    const preset = TUNING_PRESETS.find((item) => item.id === "guitar-6-standard");
    const cells = buildFretboard(preset?.notes ?? [], 0);
    const string2 = cells.find((cell) => cell.displayString === 2 && cell.fret === 0);
    const string3 = cells.find((cell) => cell.displayString === 3 && cell.fret === 0);

    expect(string2?.note.name).toBe("B3");
    expect(string3?.note.name).toBe("G3");
    expect((string2?.midi ?? 0) - (string3?.midi ?? 0)).toBe(4);
  });

  it("keeps standard guitar cross-string unisons around the 2/3 string boundary", () => {
    const preset = TUNING_PRESETS.find((item) => item.id === "guitar-6-standard");
    const cells = buildFretboard(preset?.notes ?? [], 12);

    expect(findCell(cells, 3, 4)?.note.name).toBe("B3");
    expect(findCell(cells, 2, 0)?.note.name).toBe("B3");
    expect(findCell(cells, 3, 5)?.note.name).toBe("C4");
    expect(findCell(cells, 2, 1)?.note.name).toBe("C4");
    expect(findCell(cells, 2, 5)?.note.name).toBe("E4");
    expect(findCell(cells, 1, 0)?.note.name).toBe("E4");
  });

  it("advances every string by one semitone per fret", () => {
    const cells = buildFretboard(["E2", "A2", "D3", "G3", "B3", "E4"], 12);

    for (let displayString = 1; displayString <= 6; displayString += 1) {
      for (let fret = 1; fret <= 12; fret += 1) {
        expect(
          (findCell(cells, displayString, fret)?.midi ?? 0) - (findCell(cells, displayString, fret - 1)?.midi ?? 0)
        ).toBe(1);
      }
    }
  });

  it("contains common guitar and bass tuning presets", () => {
    const expectedNotesByPreset = new Map([
      ["guitar-6-standard", ["E2", "A2", "D3", "G3", "B3", "E4"]],
      ["guitar-6-drop-d", ["D2", "A2", "D3", "G3", "B3", "E4"]],
      ["guitar-6-eb-standard", ["Eb2", "Ab2", "Db3", "Gb3", "Bb3", "Eb4"]],
      ["guitar-6-d-standard", ["D2", "G2", "C3", "F3", "A3", "D4"]],
      ["guitar-6-drop-c", ["C2", "G2", "C3", "F3", "A3", "D4"]],
      ["guitar-6-dadgad", ["D2", "A2", "D3", "G3", "A3", "D4"]],
      ["guitar-6-open-d", ["D2", "A2", "D3", "F#3", "A3", "D4"]],
      ["guitar-6-open-g", ["D2", "G2", "D3", "G3", "B3", "D4"]],
      ["guitar-6-facgce", ["F2", "A2", "C3", "G3", "C4", "E4"]],
      ["guitar-6-daeac-sharp-e", ["D2", "A2", "E3", "A3", "C#4", "E4"]],
      ["guitar-7-standard", ["B1", "E2", "A2", "D3", "G3", "B3", "E4"]],
      ["bass-4-standard", ["E1", "A1", "D2", "G2"]],
      ["bass-5-standard", ["B0", "E1", "A1", "D2", "G2"]],
      ["bass-4-drop-d", ["D1", "A1", "D2", "G2"]],
      ["bass-4-eb-standard", ["Eb1", "Ab1", "Db2", "Gb2"]],
      ["bass-4-d-standard", ["D1", "G1", "C2", "F2"]],
      ["bass-4-drop-c", ["C1", "G1", "C2", "F2"]],
      ["bass-4-bead", ["B0", "E1", "A1", "D2"]],
      ["bass-5-drop-a", ["A0", "E1", "A1", "D2", "G2"]]
    ]);
    const presetIds = TUNING_PRESETS.map((preset) => preset.id);

    expect(new Set(presetIds).size).toBe(presetIds.length);

    for (const [presetId, expectedNotes] of expectedNotesByPreset) {
      const preset = TUNING_PRESETS.find((item) => item.id === presetId);

      expect(preset?.notes).toEqual(expectedNotes);
      expect(preset?.defaultFretCount).toBe(24);
    }
  });

  it("keeps preset open-string interval structures", () => {
    const expectedIntervalsByPreset = new Map([
      ["guitar-6-standard", [5, 5, 5, 4, 5]],
      ["guitar-6-drop-d", [7, 5, 5, 4, 5]],
      ["guitar-6-eb-standard", [5, 5, 5, 4, 5]],
      ["guitar-6-d-standard", [5, 5, 5, 4, 5]],
      ["guitar-6-drop-c", [7, 5, 5, 4, 5]],
      ["guitar-6-dadgad", [7, 5, 5, 2, 5]],
      ["guitar-6-open-d", [7, 5, 4, 3, 5]],
      ["guitar-6-open-g", [5, 7, 5, 4, 3]],
      ["guitar-6-facgce", [4, 3, 7, 5, 4]],
      ["guitar-6-daeac-sharp-e", [7, 7, 5, 4, 3]],
      ["guitar-7-standard", [5, 5, 5, 5, 4, 5]],
      ["bass-4-standard", [5, 5, 5]],
      ["bass-5-standard", [5, 5, 5, 5]],
      ["bass-4-drop-d", [7, 5, 5]],
      ["bass-4-eb-standard", [5, 5, 5]],
      ["bass-4-d-standard", [5, 5, 5]],
      ["bass-4-drop-c", [7, 5, 5]],
      ["bass-4-bead", [5, 5, 5]],
      ["bass-5-drop-a", [7, 5, 5, 5]]
    ]);

    for (const preset of TUNING_PRESETS) {
      const cells = buildFretboard(preset.notes, 0);
      const openMidis = cells.map((cell) => cell.midi);
      const intervals = openMidis.slice(1).map((midi, index) => midi - openMidis[index]);

      expect(intervals).toEqual(expectedIntervalsByPreset.get(preset.id));
    }
  });

  it("filters cells by a string/fret box", () => {
    const cells = buildFretboard(["E2", "A2", "D3"], 5);
    const filtered = filterByBox(cells, {
      stringStart: 2,
      stringEnd: 3,
      fretStart: 1,
      fretEnd: 3
    });

    expect(filtered).toHaveLength(6);
    expect(filtered.every((cell) => cell.internalString >= 2 && cell.internalString <= 3)).toBe(true);
    expect(filtered.every((cell) => cell.fret >= 1 && cell.fret <= 3)).toBe(true);
  });

  it("rejects invalid fretboard inputs", () => {
    expect(() => buildFretboard([], 12)).toThrow("Tuning must contain at least one string");
    expect(() => buildFretboard(["E2"], -1)).toThrow("Fret count cannot be negative");
  });

  it("translates and normalizes display-selected boxes", () => {
    expect(displayStringToInternal(1, 6)).toBe(6);
    expect(displayStringToInternal(6, 6)).toBe(1);

    expect(makeBoxFromDisplayRange(6, 2, 9, 3, 6, 24)).toEqual({
      stringStart: 1,
      stringEnd: 5,
      fretStart: 3,
      fretEnd: 9
    });

    expect(normalizeBox({ stringStart: 9, stringEnd: -2, fretStart: 27.8, fretEnd: -4.2 }, 6, 24)).toEqual({
      stringStart: 1,
      stringEnd: 6,
      fretStart: 0,
      fretEnd: 24
    });
  });

  it("annotates target pitch classes inside fretboard cells", () => {
    const cells = buildFretboard(["C4"], 4);
    const annotatedNumeric = annotateTargets(cells, [0, 2, -1]);
    const annotatedCustom = annotateTargets(cells, [
      { pc: 4, label: "3", order: 0 },
      { pc: 16, label: "10", offset: 16, order: 1 }
    ]);

    expect(annotatedNumeric.find((cell) => cell.fret === 0)?.matches).toEqual([{ pc: 0, label: "1", order: 0 }]);
    expect(annotatedNumeric.find((cell) => cell.fret === 2)?.matches).toEqual([{ pc: 2, label: "2", order: 1 }]);
    expect(annotatedCustom.find((cell) => cell.fret === 4)?.matches).toEqual([
      { pc: 4, label: "3", order: 0 },
      { pc: 4, label: "10", offset: 16, order: 1 }
    ]);
  });

  it("creates updated position box presets without removed shapes", () => {
    const presets = createBoxPresets(6, 24);
    const byId = new Map(presets.map((preset) => [preset.id, preset]));

    expect(byId.get("open")?.box).toMatchObject({ fretStart: 0, fretEnd: 3 });
    expect(byId.get("three-to-seven")?.box).toMatchObject({ fretStart: 3, fretEnd: 7 });
    expect(byId.get("seven-to-ten")?.box).toMatchObject({ fretStart: 7, fretEnd: 10 });
    expect(byId.get("upper")?.box).toMatchObject({ fretStart: 8, fretEnd: 13 });
    expect(byId.has("upper-strings")).toBe(false);
    expect(
      ["caged-c-shape", "caged-a-shape", "caged-g-shape", "caged-e-shape", "caged-d-shape"].some((id) => byId.has(id))
    ).toBe(false);
  });
});

describe("interval templates", () => {
  it("parses interval steps and rejects malformed values", () => {
    expect(parseIntervalSteps("0, +4, +3")).toEqual([0, 4, 3]);
    expect(parseIntervalSteps(" 0, , +2 ")).toEqual([0, 2]);
    expect(() => parseIntervalSteps("0, nope")).toThrow("Invalid interval step");
  });

  it("turns step sequences into cumulative offsets", () => {
    expect(stepsToOffsets([0, 4, 3, 4])).toEqual([0, 4, 7, 11]);
    expect(() => stepsToOffsets([])).toThrow("Interval steps cannot be empty");
  });

  it("keeps all scale templates rooted, unique, and inside one octave", () => {
    for (const scale of SCALE_TEMPLATES) {
      expect(scale.offsets[0]).toBe(0);
      expect(scale.offsets.every((offset) => offset >= 0 && offset < 12)).toBe(true);
      expect(new Set(scale.offsets).size).toBe(scale.offsets.length);
      expect(scale.offsets[scale.offsets.length - 1]).toBeLessThan(12);
    }
  });

  it("keeps all chord templates rooted and ordered", () => {
    for (const chord of CHORD_TEMPLATES) {
      expect(chord.offsets[0]).toBe(0);

      for (let index = 1; index < chord.offsets.length; index += 1) {
        expect(chord.offsets[index]).toBeGreaterThan(chord.offsets[index - 1]);
      }
    }
  });

  it("validates scale template invariants", () => {
    expect(makeScaleTemplate("test-major", "Test Major", "test", "0, +2, +2, +1, +2, +2, +2").offsets).toEqual([
      0, 2, 4, 5, 7, 9, 11
    ]);
    expect(() => validateScaleTemplate("Bad Root", [2, 4, 7])).toThrow("must start from 0");
    expect(() =>
      validateScaleTemplate(
        "Too Many",
        Array.from({ length: 13 }, (_, index) => index)
      )
    ).toThrow("cannot contain more than 12 pitch classes");
    expect(() => validateScaleTemplate("Duplicate", [0, 2, 14])).toThrow("duplicated pitch classes");
  });

  it("turns C Ionian into ordered pitch classes", () => {
    const ionian = SCALE_TEMPLATES.find((item) => item.id === "ionian");

    expect(ionian?.offsets).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(scaleOrder(0, ionian!)).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it("keeps common scale formulas intact", () => {
    expect(scaleOffsets("ionian")).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(scaleOffsets("aeolian")).toEqual([0, 2, 3, 5, 7, 8, 10]);
    expect(scaleOffsets("melodic-minor")).toEqual([0, 2, 3, 5, 7, 9, 11]);
    expect(scaleOffsets("harmonic-minor")).toEqual([0, 2, 3, 5, 7, 8, 11]);
    expect(scaleOffsets("major-pentatonic")).toEqual([0, 2, 4, 7, 9]);
    expect(scaleOffsets("minor-pentatonic")).toEqual([0, 3, 5, 7, 10]);
    expect(scaleOffsets("minor-blues")).toEqual([0, 3, 5, 6, 7, 10]);
    expect(scaleOffsets("whole-tone")).toEqual([0, 2, 4, 6, 8, 10]);
    expect(scaleOffsets("chromatic")).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it("builds a C Ionian I triad", () => {
    const ionian = SCALE_TEMPLATES.find((item) => item.id === "ionian");

    expect(diatonicChordPcs(0, ionian!, 1, 3)).toEqual([0, 4, 7]);
  });

  it("builds basic C Ionian diatonic triads and sevenths", () => {
    const ionian = SCALE_TEMPLATES.find((item) => item.id === "ionian");

    expect(Array.from({ length: 7 }, (_, index) => diatonicChordPcs(0, ionian!, index + 1, 3))).toEqual([
      [0, 4, 7],
      [2, 5, 9],
      [4, 7, 11],
      [5, 9, 0],
      [7, 11, 2],
      [9, 0, 4],
      [11, 2, 5]
    ]);
    expect(diatonicChordPcs(0, ionian!, 5, 4)).toEqual([7, 11, 2, 5]);
    expect(() => diatonicChordPcs(0, ionian!, 0, 3)).toThrow("outside 1..7");
    expect(() => diatonicChordPcs(0, ionian!, 8, 3)).toThrow("outside 1..7");
  });

  it("turns Major chord steps into a cumulative template", () => {
    const major = CHORD_TEMPLATES.find((item) => item.id === "major");

    expect(major?.offsets).toEqual([0, 4, 7]);
    expect(namedChordPcs(0, major!)).toEqual([0, 4, 7]);
  });

  it("creates named, scale, and diatonic target descriptors", () => {
    const ionian = SCALE_TEMPLATES.find((item) => item.id === "ionian");
    const dominant = CHORD_TEMPLATES.find((item) => item.id === "dominant-7");
    const wide = makeChordTemplate("wide", "Wide", "Xwide", "0, +22");

    expect(namedChordTargets(0, dominant!)).toEqual([
      { pc: 0, label: "R", offset: 0, order: 0 },
      { pc: 4, label: "3", offset: 4, order: 1 },
      { pc: 7, label: "5", offset: 7, order: 2 },
      { pc: 10, label: "b7", offset: 10, order: 3 }
    ]);
    expect(namedChordTargets(0, wide)[1]).toEqual({ pc: 10, label: "22st", offset: 22, order: 1 });
    expect(scaleTargets(0, ionian!).slice(0, 3)).toEqual([
      { pc: 0, label: "1", offset: 0, order: 0 },
      { pc: 2, label: "2", offset: 2, order: 1 },
      { pc: 4, label: "3", offset: 4, order: 2 }
    ]);
    expect(diatonicChordTargets(0, ionian!, 5, 4)).toEqual([
      { pc: 7, label: "1", offset: 7, order: 0 },
      { pc: 11, label: "3", offset: 11, order: 1 },
      { pc: 2, label: "5", offset: 2, order: 2 },
      { pc: 5, label: "7", offset: 5, order: 3 }
    ]);
    expect(diatonicChordTargets(0, ionian!, 1, 10)[9]).toEqual({ pc: 7, label: "19", offset: 7, order: 9 });
    expect(() => diatonicChordTargets(0, ionian!, 8, 3)).toThrow("outside 1..7");
  });

  it("describes unique target pitch classes in compact names", () => {
    expect(
      describeTargetPitchClasses([
        { pc: 0, label: "R", order: 0 },
        { pc: 4, label: "3", order: 1 },
        { pc: 0, label: "R8", order: 2 },
        { pc: 7, label: "5", order: 3 }
      ])
    ).toBe("C E G");
  });

  it("keeps Add9 as an absolute extension before pitch-class projection", () => {
    const add9 = CHORD_TEMPLATES.find((item) => item.id === "add-9");

    expect(add9?.offsets).toEqual([0, 4, 7, 14]);
    expect(namedChordPcs(0, add9!)).toEqual([0, 4, 7, 2]);
  });

  it("keeps common chord formulas intact", () => {
    expect(chordOffsets("major")).toEqual([0, 4, 7]);
    expect(chordOffsets("minor")).toEqual([0, 3, 7]);
    expect(chordOffsets("diminished")).toEqual([0, 3, 6]);
    expect(chordOffsets("augmented")).toEqual([0, 4, 8]);
    expect(chordOffsets("dominant-7")).toEqual([0, 4, 7, 10]);
    expect(chordOffsets("major-7")).toEqual([0, 4, 7, 11]);
    expect(chordOffsets("minor-7")).toEqual([0, 3, 7, 10]);
    expect(chordOffsets("minor-7-flat-5")).toEqual([0, 3, 6, 10]);
    expect(chordOffsets("diminished-7")).toEqual([0, 3, 6, 9]);
    expect(chordOffsets("sus4")).toEqual([0, 5, 7]);
    expect(chordOffsets("sus2")).toEqual([0, 2, 7]);
  });
});

function findCell(cells: ReturnType<typeof buildFretboard>, displayString: number, fret: number) {
  return cells.find((cell) => cell.displayString === displayString && cell.fret === fret);
}

function scaleOffsets(id: string) {
  return SCALE_TEMPLATES.find((scale) => scale.id === id)?.offsets;
}

function chordOffsets(id: string) {
  return CHORD_TEMPLATES.find((chord) => chord.id === id)?.offsets;
}

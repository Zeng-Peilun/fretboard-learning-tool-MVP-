import { pc, pcToCompactName } from "./notes";
import type { ChordTemplate, PitchClass, ScaleTemplate, TargetPitch } from "./types";

const CHORD_DEGREE_BY_OFFSET: Record<number, string> = {
  0: "R",
  1: "b2",
  2: "2",
  3: "b3",
  4: "3",
  5: "4",
  6: "b5",
  7: "5",
  8: "#5",
  9: "6",
  10: "b7",
  11: "7",
  12: "R8",
  13: "b9",
  14: "9",
  15: "#9",
  16: "10",
  17: "11",
  18: "#11",
  19: "12",
  20: "b13",
  21: "13"
};

const STACK_LABELS = ["1", "3", "5", "7", "9", "11", "13", "15", "17"];

export function parseIntervalSteps(source: string): number[] {
  return source
    .split(",")
    .map((part) => part.trim().replace("+", ""))
    .filter(Boolean)
    .map((part) => {
      const value = Number.parseInt(part, 10);
      if (Number.isNaN(value)) {
        throw new Error(`Invalid interval step: ${part}`);
      }
      return value;
    });
}

export function stepsToOffsets(steps: number[]): number[] {
  if (steps.length === 0) {
    throw new Error("Interval steps cannot be empty");
  }

  const offsets = [steps[0]];
  let cursor = steps[0];

  for (let index = 1; index < steps.length; index += 1) {
    cursor += steps[index];
    offsets.push(cursor);
  }

  return offsets;
}

export function makeScaleTemplate(id: string, name: string, category: string, source: string): ScaleTemplate {
  const steps = parseIntervalSteps(source);
  const offsets = stepsToOffsets(steps);
  validateScaleTemplate(name, offsets);

  return { id, name, category, source, steps, offsets };
}

export function makeChordTemplate(id: string, name: string, symbol: string, source: string): ChordTemplate {
  const steps = parseIntervalSteps(source);
  const offsets = stepsToOffsets(steps);

  return { id, name, symbol, source, steps, offsets };
}

export function validateScaleTemplate(name: string, offsets: number[]): void {
  if (offsets[0] !== 0) {
    throw new Error(`${name} must start from 0`);
  }

  if (offsets.length > 12) {
    throw new Error(`${name} cannot contain more than 12 pitch classes`);
  }

  const uniquePitchClasses = new Set(offsets.map((offset) => pc(offset)));

  if (uniquePitchClasses.size !== offsets.length) {
    throw new Error(`${name} contains duplicated pitch classes`);
  }
}

export function scaleOrder(rootPc: PitchClass, scaleTemplate: ScaleTemplate): PitchClass[] {
  return scaleTemplate.offsets.map((offset) => pc(rootPc + offset));
}

export function namedChordPcs(rootPc: PitchClass, chordTemplate: ChordTemplate): PitchClass[] {
  return chordTemplate.offsets.map((offset) => pc(rootPc + offset));
}

export function diatonicChordPcs(
  rootPc: PitchClass,
  scaleTemplate: ScaleTemplate,
  degree: number,
  stackSize: number
): PitchClass[] {
  const order = scaleOrder(rootPc, scaleTemplate);
  const scaleLength = order.length;

  if (degree < 1 || degree > scaleLength) {
    throw new Error(`Degree ${degree} is outside 1..${scaleLength}`);
  }

  return Array.from({ length: stackSize }, (_, stackIndex) => {
    const k = degree - 1 + 2 * stackIndex;
    const scaleIndex = k % scaleLength;
    return order[scaleIndex];
  });
}

export function namedChordTargets(rootPc: PitchClass, chordTemplate: ChordTemplate): TargetPitch[] {
  return chordTemplate.offsets.map((offset, order) => ({
    pc: pc(rootPc + offset),
    label: CHORD_DEGREE_BY_OFFSET[offset] ?? `${offset}st`,
    offset,
    order
  }));
}

export function scaleTargets(rootPc: PitchClass, scaleTemplate: ScaleTemplate): TargetPitch[] {
  return scaleOrder(rootPc, scaleTemplate).map((pitchClass, order) => ({
    pc: pitchClass,
    label: `${order + 1}`,
    offset: scaleTemplate.offsets[order],
    order
  }));
}

export function diatonicChordTargets(
  rootPc: PitchClass,
  scaleTemplate: ScaleTemplate,
  degree: number,
  stackSize: number
): TargetPitch[] {
  const order = scaleOrder(rootPc, scaleTemplate);
  const scaleLength = order.length;

  if (degree < 1 || degree > scaleLength) {
    throw new Error(`Degree ${degree} is outside 1..${scaleLength}`);
  }

  return Array.from({ length: stackSize }, (_, stackIndex) => {
    const k = degree - 1 + 2 * stackIndex;
    const scaleIndex = k % scaleLength;
    return {
      pc: order[scaleIndex],
      label: STACK_LABELS[stackIndex] ?? `${2 * stackIndex + 1}`,
      offset: scaleTemplate.offsets[scaleIndex],
      order: stackIndex
    };
  });
}

export function describeTargetPitchClasses(targets: TargetPitch[]): string {
  const seen = new Set<number>();

  return targets
    .filter((target) => {
      if (seen.has(target.pc)) {
        return false;
      }
      seen.add(target.pc);
      return true;
    })
    .map((target) => pcToCompactName(target.pc))
    .join(" ");
}

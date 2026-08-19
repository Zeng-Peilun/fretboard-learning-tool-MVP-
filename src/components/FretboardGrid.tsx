import { type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { coordKey, displayStringToInternal, isCellInBox } from "../domain/fretboard";
import type { BoxRange, FretCell, HighlightedFretCell, TargetPitch } from "../domain/types";
import { baseNameForPitchClass } from "../view/notation";

type DiatonicChordSummary = {
  fullName: string;
  qualityName: string;
  symbol: string;
};

const DEGREE_OPTIONS = ["I", "II", "III", "IV", "V", "VI", "VII"].map((roman, index) => ({
  degree: index + 1,
  roman
}));

type FretboardGridProps = {
  box: BoxRange | null;
  cellMap: Map<string, FretCell>;
  colorByOctave: Map<number, string>;
  chordSummaries: DiatonicChordSummary[];
  fretboardViewportRef: RefObject<HTMLDivElement | null>;
  fretCount: number;
  fretNumbers: number[];
  highlightMap: Map<string, HighlightedFretCell>;
  maxDegree: number;
  onBeginSelection: (cell: FretCell, event: ReactPointerEvent<HTMLDivElement>) => void;
  onClearBoxSelection: () => void;
  onFinishSelection: () => void;
  onFixPendingBox: () => void;
  onSelectDegree: (degree: number) => void;
  onUpdateSelection: (cell: FretCell, event: ReactPointerEvent<HTMLDivElement>) => void;
  pendingBox: BoxRange | null;
  rowDisplayStrings: number[];
  selectedDegree: number | null;
  showDegreeSelector: boolean;
  stringCount: number;
  targetNameByPc: Map<number, string>;
  targetNames: string;
};

export function FretboardGrid({
  box,
  cellMap,
  colorByOctave,
  chordSummaries,
  fretboardViewportRef,
  fretCount,
  fretNumbers,
  highlightMap,
  maxDegree,
  onBeginSelection,
  onClearBoxSelection,
  onFinishSelection,
  onFixPendingBox,
  onSelectDegree,
  onUpdateSelection,
  pendingBox,
  rowDisplayStrings,
  selectedDegree,
  showDegreeSelector,
  stringCount,
  targetNameByPc,
  targetNames
}: FretboardGridProps) {
  return (
    <div className="fretboard-panel">
      <div className="panel-heading">
        <div>
          <h2>指板映射</h2>
          <p>{targetNames || "无目标音"}</p>
        </div>
        <div className="box-actions">
          <div className="box-readout">{box ? formatBox(box, stringCount) : "未选定"}</div>
          <button className="clear-selection-button" type="button" onClick={onClearBoxSelection}>
            清除选定
          </button>
        </div>
      </div>

      <div className="fretboard-layout">
        <div className="fretboard-viewport" ref={fretboardViewportRef}>
          <div
            className="fretboard-grid"
            style={
              {
                "--fret-count": fretCount + 1,
                "--board-min-width": `${76 + (fretCount + 1) * 54}px`
              } as CSSProperties
            }
          >
            <div className="corner-cell">弦 / 品</div>
            {fretNumbers.map((fret) => (
              <div className={`fret-header ${fret === 1 ? "nut-boundary-header" : ""}`} key={fret}>
                {fret}
              </div>
            ))}

            {rowDisplayStrings.map((displayString) => {
              const internalString = displayStringToInternal(displayString, stringCount);
              const openCell = cellMap.get(`${internalString}:0`);

              return (
                <Row
                  box={box}
                  cellMap={cellMap}
                  colorByOctave={colorByOctave}
                  displayString={displayString}
                  fretNumbers={fretNumbers}
                  highlightMap={highlightMap}
                  internalString={internalString}
                  key={displayString}
                  onBeginSelection={onBeginSelection}
                  onFinishSelection={onFinishSelection}
                  onUpdateSelection={onUpdateSelection}
                  openCell={openCell}
                  pendingBox={pendingBox}
                  targetNameByPc={targetNameByPc}
                />
              );
            })}
          </div>
        </div>

        {showDegreeSelector ? (
          <DegreeSelector
            chordSummaries={chordSummaries}
            maxDegree={maxDegree}
            selectedDegree={selectedDegree}
            onSelectDegree={onSelectDegree}
          />
        ) : null}
      </div>

      {pendingBox ? (
        <div className="box-confirm-dialog" role="dialog" aria-label="固定待选Box">
          <span>
            {formatBox(pendingBox, stringCount)} · {countBoxCells(pendingBox)}格
          </span>
          <button type="button" onClick={onFixPendingBox}>
            固定Box
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DegreeSelector({
  chordSummaries,
  maxDegree,
  onSelectDegree,
  selectedDegree
}: {
  chordSummaries: DiatonicChordSummary[];
  maxDegree: number;
  onSelectDegree: (degree: number) => void;
  selectedDegree: number | null;
}) {
  return (
    <div className="degree-selector" aria-label="调内和弦级数">
      {DEGREE_OPTIONS.map(({ degree: optionDegree, roman }, index) => {
        const isActive = optionDegree === selectedDegree;
        const isDisabled = optionDegree > maxDegree;
        const chordSummary = chordSummaries[index];

        return (
          <div className="degree-option" key={roman}>
            <button
              className={isActive ? "active" : ""}
              disabled={isDisabled}
              type="button"
              onClick={() => onSelectDegree(optionDegree)}
            >
              {roman}
            </button>
            <div className="degree-chord-copy" aria-hidden={isDisabled}>
              <strong>{isDisabled ? "\u00a0" : (chordSummary?.symbol ?? "\u00a0")}</strong>
              <span>{isDisabled ? "\u00a0" : (chordSummary?.qualityName ?? "\u00a0")}</span>
              <small>{isDisabled ? "\u00a0" : (chordSummary?.fullName ?? "\u00a0")}</small>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Row({
  box,
  cellMap,
  colorByOctave,
  displayString,
  fretNumbers,
  highlightMap,
  internalString,
  onBeginSelection,
  onFinishSelection,
  onUpdateSelection,
  openCell,
  pendingBox,
  targetNameByPc
}: {
  box: BoxRange | null;
  cellMap: Map<string, FretCell>;
  colorByOctave: Map<number, string>;
  displayString: number;
  fretNumbers: number[];
  highlightMap: Map<string, HighlightedFretCell>;
  internalString: number;
  onBeginSelection: (cell: FretCell, event: ReactPointerEvent<HTMLDivElement>) => void;
  onFinishSelection: () => void;
  onUpdateSelection: (cell: FretCell, event: ReactPointerEvent<HTMLDivElement>) => void;
  openCell?: FretCell;
  pendingBox: BoxRange | null;
  targetNameByPc: Map<number, string>;
}) {
  return (
    <>
      <div className="string-header">
        <strong>{displayString}弦</strong>
        <span>{openCell?.note.compactName}</span>
      </div>
      {fretNumbers.map((fret) => {
        const cell = cellMap.get(`${internalString}:${fret}`);

        return (
          <FretCellTile
            box={box}
            cell={cell}
            colorByOctave={colorByOctave}
            highlightMap={highlightMap}
            isEndCell={fret === fretNumbers[fretNumbers.length - 1]}
            isNutBoundary={fret === 1}
            key={fret}
            onBeginSelection={onBeginSelection}
            onFinishSelection={onFinishSelection}
            onUpdateSelection={onUpdateSelection}
            pendingBox={pendingBox}
            targetNameByPc={targetNameByPc}
          />
        );
      })}
    </>
  );
}

function FretCellTile({
  box,
  cell,
  colorByOctave,
  highlightMap,
  isEndCell,
  isNutBoundary,
  onBeginSelection,
  onFinishSelection,
  onUpdateSelection,
  pendingBox,
  targetNameByPc
}: {
  box: BoxRange | null;
  cell?: FretCell;
  colorByOctave: Map<number, string>;
  highlightMap: Map<string, HighlightedFretCell>;
  isEndCell: boolean;
  isNutBoundary: boolean;
  onBeginSelection: (cell: FretCell, event: ReactPointerEvent<HTMLDivElement>) => void;
  onFinishSelection: () => void;
  onUpdateSelection: (cell: FretCell, event: ReactPointerEvent<HTMLDivElement>) => void;
  pendingBox: BoxRange | null;
  targetNameByPc: Map<number, string>;
}) {
  const highlightedCell = cell ? highlightMap.get(coordKey(cell)) : undefined;
  const inBox = cell && box ? isCellInBox(cell, box) : false;
  const inPendingBox = cell && pendingBox ? isCellInBox(cell, pendingBox) : false;
  const cellColor = cell ? (colorByOctave.get(cell.note.octave) ?? fallbackOctaveColor()) : fallbackOctaveColor();
  const className = [
    "fret-cell",
    inBox ? "in-box" : "out-box",
    inPendingBox ? "pending-cell" : "",
    highlightedCell ? "target" : "",
    isNutBoundary ? "nut-boundary-cell" : "",
    isEndCell ? "end-cell" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const highlightedName =
    highlightedCell && cell ? (targetNameByPc.get(cell.note.pc) ?? baseNameForPitchClass(cell.note.pc)) : "";

  return (
    <div
      className={className}
      data-display-string={cell?.displayString}
      data-fret={cell?.fret}
      data-internal-string={cell?.internalString}
      onPointerDown={cell ? (event) => onBeginSelection(cell, event) : undefined}
      onPointerEnter={cell ? (event) => onUpdateSelection(cell, event) : undefined}
      onPointerMove={cell ? (event) => onUpdateSelection(cell, event) : undefined}
      onPointerUp={onFinishSelection}
      style={{ "--string-color": cellColor, "--note-color": cellColor } as CSSProperties}
      title={
        cell
          ? `${highlightedCell ? `${highlightedName}${cell.note.octave}` : cell.note.name} · MIDI ${cell.midi}${
              highlightedCell ? ` · ${formatMatches(highlightedCell.matches)}` : ""
            }`
          : undefined
      }
    >
      {highlightedCell ? <span className="note-dot">{highlightedName}</span> : null}
    </div>
  );
}

function formatMatches(matches: TargetPitch[]): string {
  return matches.map((match) => match.label).join("/");
}

function formatBox(box: BoxRange, stringCount: number): string {
  const displayA = stringCount - box.stringEnd + 1;
  const displayB = stringCount - box.stringStart + 1;

  return `${displayA}-${displayB}弦 · ${box.fretStart}-${box.fretEnd}品`;
}

function countBoxCells(box: BoxRange): number {
  return (box.stringEnd - box.stringStart + 1) * (box.fretEnd - box.fretStart + 1);
}

function fallbackOctaveColor(): string {
  return "rgba(96, 108, 116, 0.34)";
}

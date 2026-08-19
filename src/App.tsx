import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ControlPanel } from "./components/ControlPanel";
import { FretboardGrid } from "./components/FretboardGrid";
import { LegendPanel } from "./components/LegendPanel";
import { SettingsModal } from "./components/SettingsModal";
import { CHORD_TEMPLATES, SCALE_TEMPLATES } from "./domain/catalog";
import { isCellInBox, TUNING_PRESETS } from "./domain/fretboard";
import type { BoxRange, FretCell } from "./domain/types";
import { useMusicModel, type DiatonicDisplayMode, type LearningMode } from "./hooks/useMusicModel";
import { ROOT_NOTE_OPTIONS, type NotationMode } from "./view/notation";

type SelectionPoint = Pick<FretCell, "displayString" | "fret" | "internalString">;
type SelectionDraft = {
  anchor: SelectionPoint;
  focus: SelectionPoint;
};

export function App() {
  const defaultPreset = TUNING_PRESETS[0];
  const [presetId, setPresetId] = useState(defaultPreset.id);
  const [tuningText, setTuningText] = useState(defaultPreset.notes.join(" "));
  const [fretCount, setFretCount] = useState(defaultPreset.defaultFretCount);
  const [learningMode, setLearningMode] = useState<LearningMode>("named-chord");
  const [rootNoteId, setRootNoteId] = useState("c");
  const [chordId, setChordId] = useState("major");
  const [scaleId, setScaleId] = useState("ionian");
  const [degree, setDegree] = useState(1);
  const [stackSize, setStackSize] = useState(3);
  const [diatonicDisplayMode, setDiatonicDisplayMode] = useState<DiatonicDisplayMode>("arpeggio");
  const [notationMode, setNotationMode] = useState<NotationMode>("musician");
  const [awfulTolerance, setAwfulTolerance] = useState(0);
  const [boxPresetId, setBoxPresetId] = useState("low");
  const [manualDisplayStringStart, setManualDisplayStringStart] = useState(1);
  const [manualDisplayStringEnd, setManualDisplayStringEnd] = useState(defaultPreset.notes.length);
  const [manualFretStart, setManualFretStart] = useState(1);
  const [manualFretEnd, setManualFretEnd] = useState(5);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectionDraft, setSelectionDraft] = useState<SelectionDraft | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const fretboardViewportRef = useRef<HTMLDivElement | null>(null);
  const latestPointerRef = useRef<{ clientX: number; clientY: number } | null>(null);

  const model = useMusicModel({
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
  });
  const {
    boxPresets,
    cellMap,
    currentBox,
    degreeChordSummaries,
    fretNumbers,
    fretboardState,
    highlightedState,
    maxDiatonicDegree,
    rowDisplayStrings,
    stringCount,
    targetState
  } = model;
  const pendingBox = useMemo(() => (selectionDraft ? boxFromSelectionDraft(selectionDraft) : null), [selectionDraft]);

  // Validate and clamp state values when bounds change to keep state within valid ranges
  useEffect(() => {
    setManualDisplayStringStart((value) => clamp(value, 1, stringCount));
    setManualDisplayStringEnd((value) => clamp(value, 1, stringCount));
  }, [stringCount]);

  useEffect(() => {
    setManualFretStart((value) => clamp(value, 0, fretCount));
    setManualFretEnd((value) => clamp(value, 0, fretCount));
  }, [fretCount]);

  useEffect(() => {
    setDegree((value) => clamp(value, 1, maxDiatonicDegree));
  }, [maxDiatonicDegree]);

  const fixPendingBoxCallback = useCallback(() => {
    if (!pendingBox) {
      return;
    }

    const displayStart = stringCount - pendingBox.stringEnd + 1;
    const displayEnd = stringCount - pendingBox.stringStart + 1;

    setBoxPresetId("custom");
    setManualDisplayStringStart(displayStart);
    setManualDisplayStringEnd(displayEnd);
    setManualFretStart(pendingBox.fretStart);
    setManualFretEnd(pendingBox.fretEnd);
    setSelectionDraft(null);
    setIsSelecting(false);
  }, [pendingBox, stringCount]);

  useEffect(() => {
    if (!isSelecting) {
      return;
    }

    function updateSelectionFromPointer(clientX: number, clientY: number) {
      latestPointerRef.current = { clientX, clientY };
      const focus = pointFromClientPosition(clientX, clientY);

      if (focus) {
        setSelectionDraft((draft) => (draft ? { ...draft, focus } : draft));
      }
    }

    function handlePointerMove(event: PointerEvent) {
      if ((event.buttons & 1) !== 1) {
        setIsSelecting(false);
        return;
      }

      event.preventDefault();
      updateSelectionFromPointer(event.clientX, event.clientY);
    }

    function handlePointerUp() {
      latestPointerRef.current = null;
      setIsSelecting(false);
    }

    function handlePointerCancel() {
      latestPointerRef.current = null;
      setIsSelecting(false);
    }

    function scrollWhileSelecting() {
      const viewport = fretboardViewportRef.current;
      const pointer = latestPointerRef.current;

      if (viewport && pointer) {
        const rect = viewport.getBoundingClientRect();
        const edgeSize = 72;
        const maxSpeed = 22;
        let scrollDelta = 0;

        if (pointer.clientX < rect.left + edgeSize) {
          const intensity = (rect.left + edgeSize - pointer.clientX) / edgeSize;
          scrollDelta = -Math.ceil(maxSpeed * Math.min(intensity, 1));
        } else if (pointer.clientX > rect.right - edgeSize) {
          const intensity = (pointer.clientX - (rect.right - edgeSize)) / edgeSize;
          scrollDelta = Math.ceil(maxSpeed * Math.min(intensity, 1));
        }

        if (scrollDelta !== 0) {
          viewport.scrollLeft += scrollDelta;
          updateSelectionFromPointer(pointer.clientX, pointer.clientY);
        }
      }

      animationFrame = window.requestAnimationFrame(scrollWhileSelecting);
    }

    let animationFrame = window.requestAnimationFrame(scrollWhileSelecting);

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [isSelecting]);

  useEffect(() => {
    if (!pendingBox) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter") {
        event.preventDefault();
        fixPendingBoxCallback();
      }
      if (event.key === "Escape") {
        setSelectionDraft(null);
        setIsSelecting(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingBox, fixPendingBoxCallback]);

  function handlePresetChange(nextPresetId: string) {
    setPresetId(nextPresetId);
    setSelectionDraft(null);
    setIsSelecting(false);

    const nextPreset = TUNING_PRESETS.find((preset) => preset.id === nextPresetId);
    if (nextPreset) {
      setTuningText(nextPreset.notes.join(" "));
      setFretCount(nextPreset.defaultFretCount);
      setManualDisplayStringStart(1);
      setManualDisplayStringEnd(nextPreset.notes.length);
      setManualFretStart(1);
      setManualFretEnd(5);
      setBoxPresetId("low");
    }
  }

  function handleManualBoxChange(update: Partial<BoxRange & { displayStart: number; displayEnd: number }>) {
    setBoxPresetId("custom");
    setSelectionDraft(null);
    setIsSelecting(false);

    if (update.displayStart !== undefined) {
      setManualDisplayStringStart(update.displayStart);
    }
    if (update.displayEnd !== undefined) {
      setManualDisplayStringEnd(update.displayEnd);
    }
    if (update.fretStart !== undefined) {
      setManualFretStart(update.fretStart);
    }
    if (update.fretEnd !== undefined) {
      setManualFretEnd(update.fretEnd);
    }
  }

  function handleBoxPresetChange(nextBoxPresetId: string) {
    setBoxPresetId(nextBoxPresetId);
    setSelectionDraft(null);
    setIsSelecting(false);
  }

  function beginCellSelection(cell: FretCell, event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (currentBox && isCellInBox(cell, currentBox) && !selectionDraft)) {
      return;
    }

    event.preventDefault();
    latestPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
    const point = pointFromCell(cell);
    setSelectionDraft({ anchor: point, focus: point });
    setIsSelecting(true);
  }

  function updateCellSelection(cell: FretCell, event: ReactPointerEvent<HTMLDivElement>) {
    if (!isSelecting || (event.buttons & 1) !== 1) {
      return;
    }

    latestPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
    const focus = pointFromCell(cell);
    setSelectionDraft((draft) => (draft ? { ...draft, focus } : draft));
  }

  function finishCellSelection() {
    latestPointerRef.current = null;
    setIsSelecting(false);
  }

  function clearBoxSelection() {
    latestPointerRef.current = null;
    setSelectionDraft(null);
    setIsSelecting(false);
    setBoxPresetId("none");
  }

  return (
    <main className="app-shell">
      <ControlPanel
        boxPresetId={boxPresetId}
        boxPresets={boxPresets}
        chordId={chordId}
        chordTemplates={CHORD_TEMPLATES}
        diatonicDisplayMode={diatonicDisplayMode}
        error={fretboardState.error}
        fretCount={fretCount}
        learningMode={learningMode}
        notationMode={notationMode}
        presetId={presetId}
        rootNoteId={rootNoteId}
        rootNoteOptions={ROOT_NOTE_OPTIONS}
        scaleId={scaleId}
        scaleTemplates={SCALE_TEMPLATES}
        stackSize={stackSize}
        title={targetState.title}
        tuningPresets={TUNING_PRESETS}
        tuningText={tuningText}
        onBoxPresetChange={handleBoxPresetChange}
        onChordChange={setChordId}
        onDiatonicDisplayModeChange={setDiatonicDisplayMode}
        onFretCountChange={(nextFretCount) => setFretCount(clamp(nextFretCount, 1, 36))}
        onLearningModeChange={setLearningMode}
        onNotationModeChange={setNotationMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onPresetChange={handlePresetChange}
        onRootNoteChange={setRootNoteId}
        onScaleChange={setScaleId}
        onStackSizeChange={(nextStackSize) => setStackSize(clamp(nextStackSize, 2, 7))}
        onTuningTextChange={(nextTuningText) => {
          setPresetId("custom");
          setTuningText(nextTuningText);
        }}
      />

      {isSettingsOpen ? (
        <SettingsModal
          awfulTolerance={awfulTolerance}
          fretCount={fretCount}
          manualDisplayStringEnd={manualDisplayStringEnd}
          manualDisplayStringStart={manualDisplayStringStart}
          manualFretEnd={manualFretEnd}
          manualFretStart={manualFretStart}
          notationMode={notationMode}
          open={isSettingsOpen}
          stringCount={stringCount}
          onAwfulToleranceChange={(nextAwfulTolerance) => setAwfulTolerance(clamp(nextAwfulTolerance, 0, 12))}
          onClose={() => setIsSettingsOpen(false)}
          onManualDisplayStringEndChange={(displayEnd) =>
            handleManualBoxChange({ displayEnd: clamp(displayEnd, 1, stringCount) })
          }
          onManualDisplayStringStartChange={(displayStart) =>
            handleManualBoxChange({ displayStart: clamp(displayStart, 1, stringCount) })
          }
          onManualFretEndChange={(fretEnd) => handleManualBoxChange({ fretEnd: clamp(fretEnd, 0, fretCount) })}
          onManualFretStartChange={(fretStart) => handleManualBoxChange({ fretStart: clamp(fretStart, 0, fretCount) })}
        />
      ) : null}

      <section className="workbench">
        <FretboardGrid
          box={currentBox}
          cellMap={cellMap}
          colorByOctave={highlightedState.colorByOctave}
          chordSummaries={degreeChordSummaries}
          fretboardViewportRef={fretboardViewportRef}
          fretCount={fretCount}
          fretNumbers={fretNumbers}
          highlightMap={highlightedState.highlightMap}
          maxDegree={maxDiatonicDegree}
          pendingBox={pendingBox}
          rowDisplayStrings={rowDisplayStrings}
          selectedDegree={diatonicDisplayMode === "arpeggio" ? degree : null}
          showDegreeSelector={learningMode === "diatonic-chord"}
          stringCount={stringCount}
          targetNameByPc={targetState.targetNameByPc}
          targetNames={targetState.targetNames}
          onBeginSelection={beginCellSelection}
          onClearBoxSelection={clearBoxSelection}
          onFinishSelection={finishCellSelection}
          onFixPendingBox={fixPendingBoxCallback}
          onSelectDegree={(nextDegree) => {
            setDegree(nextDegree);
            setDiatonicDisplayMode("arpeggio");
          }}
          onUpdateSelection={updateCellSelection}
        />

        <LegendPanel
          legend={highlightedState.legend}
          matchedCount={highlightedState.matchedCells.length}
          targetDisplayNames={targetState.targetDisplayNames}
          targets={targetState.targets}
        />
      </section>
    </main>
  );
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(Math.trunc(value), min), max);
}

function pointFromCell(cell: FretCell): SelectionPoint {
  return {
    displayString: cell.displayString,
    fret: cell.fret,
    internalString: cell.internalString
  };
}

function pointFromClientPosition(clientX: number, clientY: number): SelectionPoint | null {
  const element = document.elementFromPoint(clientX, clientY);
  const cellElement = element?.closest<HTMLElement>(".fret-cell[data-display-string][data-fret][data-internal-string]");

  if (!cellElement) {
    return null;
  }

  return {
    displayString: Number(cellElement.dataset.displayString),
    fret: Number(cellElement.dataset.fret),
    internalString: Number(cellElement.dataset.internalString)
  };
}

function boxFromSelectionDraft(draft: SelectionDraft): BoxRange {
  return {
    stringStart: Math.min(draft.anchor.internalString, draft.focus.internalString),
    stringEnd: Math.max(draft.anchor.internalString, draft.focus.internalString),
    fretStart: Math.min(draft.anchor.fret, draft.focus.fret),
    fretEnd: Math.max(draft.anchor.fret, draft.focus.fret)
  };
}

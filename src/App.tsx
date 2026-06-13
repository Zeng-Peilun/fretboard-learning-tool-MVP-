import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode
} from "react";
import { CHORD_TEMPLATES, SCALE_TEMPLATES } from "./domain/catalog";
import {
  annotateTargets,
  buildFretboard,
  coordKey,
  createBoxPresets,
  displayStringToInternal,
  filterByBox,
  isCellInBox,
  makeBoxFromDisplayRange,
  TUNING_PRESETS
} from "./domain/fretboard";
import { describeTargetPitchClasses, diatonicChordTargets, namedChordTargets, scaleTargets } from "./domain/intervals";
import { PC_COMPACT_NAMES, pc, pcToCompactName } from "./domain/notes";
import type { BoxRange, FretCell, HighlightedFretCell, ScaleTemplate, TargetPitch } from "./domain/types";

type LearningMode = "named-chord" | "diatonic-chord";
type DiatonicDisplayMode = "arpeggio" | "scale";
type SelectionPoint = Pick<FretCell, "displayString" | "fret" | "internalString">;
type SelectionDraft = {
  anchor: SelectionPoint;
  focus: SelectionPoint;
};
type DiatonicChordSummary = {
  fullName: string;
  qualityName: string;
  symbol: string;
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

const OCTAVE_COLOR_BY_NUMBER = new Map<number, string>(OCTAVE_PALETTE.map((item) => [item.octave, item.color]));

export function App() {
  const defaultPreset = TUNING_PRESETS[0];
  const [presetId, setPresetId] = useState(defaultPreset.id);
  const [tuningText, setTuningText] = useState(defaultPreset.notes.join(" "));
  const [fretCount, setFretCount] = useState(defaultPreset.defaultFretCount);
  const [learningMode, setLearningMode] = useState<LearningMode>("named-chord");
  const [rootPc, setRootPc] = useState(0);
  const [chordId, setChordId] = useState("major");
  const [scaleId, setScaleId] = useState("ionian");
  const [degree, setDegree] = useState(1);
  const [stackSize, setStackSize] = useState(3);
  const [diatonicDisplayMode, setDiatonicDisplayMode] = useState<DiatonicDisplayMode>("arpeggio");
  const [boxPresetId, setBoxPresetId] = useState("low");
  const [manualDisplayStringStart, setManualDisplayStringStart] = useState(1);
  const [manualDisplayStringEnd, setManualDisplayStringEnd] = useState(defaultPreset.notes.length);
  const [manualFretStart, setManualFretStart] = useState(1);
  const [manualFretEnd, setManualFretEnd] = useState(5);
  const [selectionDraft, setSelectionDraft] = useState<SelectionDraft | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const fretboardViewportRef = useRef<HTMLDivElement | null>(null);
  const latestPointerRef = useRef<{ clientX: number; clientY: number } | null>(null);

  const tuningNotes = useMemo(() => tuningText.trim().split(/\s+/).filter(Boolean), [tuningText]);
  const stringCount = Math.max(tuningNotes.length, 1);
  const selectedScale = SCALE_TEMPLATES.find((scale) => scale.id === scaleId) ?? SCALE_TEMPLATES[0];
  const selectedChord = CHORD_TEMPLATES.find((chord) => chord.id === chordId) ?? CHORD_TEMPLATES[0];
  const maxDiatonicDegree = Math.min(ROMAN_DEGREES.length, selectedScale.offsets.length);
  const boxPresets = useMemo(() => createBoxPresets(stringCount, fretCount), [stringCount, fretCount]);
  const selectedBoxPreset = boxPresets.find((preset) => preset.id === boxPresetId);
  const currentBox = useMemo(
    () =>
      boxPresetId === "none"
        ? null
        : (selectedBoxPreset?.box ??
          makeBoxFromDisplayRange(
            manualDisplayStringStart,
            manualDisplayStringEnd,
            manualFretStart,
            manualFretEnd,
            stringCount,
            fretCount
          )),
    [
      fretCount,
      manualDisplayStringEnd,
      manualDisplayStringStart,
      manualFretEnd,
      manualFretStart,
      boxPresetId,
      selectedBoxPreset?.box,
      stringCount
    ]
  );

  const fretboardState = useMemo(() => {
    try {
      return {
        cells: buildFretboard(tuningNotes, fretCount),
        error: ""
      };
    } catch (error) {
      return {
        cells: [] as FretCell[],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }, [fretCount, tuningNotes]);

  const targetState = useMemo(() => {
    const safeDegree = clamp(degree, 1, maxDiatonicDegree);
    const targets =
      learningMode === "named-chord"
        ? namedChordTargets(rootPc, selectedChord)
        : diatonicDisplayMode === "scale"
          ? scaleTargets(rootPc, selectedScale)
          : diatonicChordTargets(rootPc, selectedScale, safeDegree, stackSize);
    const inferredChord =
      learningMode === "diatonic-chord" && diatonicDisplayMode === "arpeggio" ? inferChordSummary(targets) : null;

    const title =
      learningMode === "named-chord"
        ? `${PC_COMPACT_NAMES[rootPc]} ${selectedChord.symbol}`
        : diatonicDisplayMode === "scale"
          ? `${PC_COMPACT_NAMES[rootPc]} ${selectedScale.name}`
          : `${PC_COMPACT_NAMES[rootPc]} ${selectedScale.name} · ${ROMAN_DEGREES[safeDegree - 1]}级 · ${inferredChord?.symbol ?? ""}`;

    return {
      targets,
      title,
      targetNames: describeTargetPitchClasses(targets)
    };
  }, [degree, diatonicDisplayMode, learningMode, maxDiatonicDegree, rootPc, selectedChord, selectedScale, stackSize]);

  const degreeChordSummaries = useMemo(
    () =>
      DEGREE_OPTIONS.map(({ degree: optionDegree }) =>
        optionDegree <= maxDiatonicDegree
          ? describeDiatonicChord(rootPc, selectedScale, optionDegree, stackSize)
          : EMPTY_DIATONIC_CHORD_SUMMARY
      ),
    [maxDiatonicDegree, rootPc, selectedScale, stackSize]
  );

  const highlightedState = useMemo(() => {
    const cellsInBox = currentBox ? filterByBox(fretboardState.cells, currentBox) : [];
    const annotatedCells = annotateTargets(cellsInBox, targetState.targets);
    const matchedCells = annotatedCells.filter((cell) => cell.matches.length > 0);
    const highlightMap = new Map(matchedCells.map((cell) => [coordKey(cell), cell]));
    const legend = OCTAVE_PALETTE.map((paletteItem) => {
      const { octave } = paletteItem;
      const cells = matchedCells.filter((cell) => cell.note.octave === octave);
      const notes = Array.from(new Set(cells.map((cell) => pcToCompactName(cell.note.pc)))).sort(sortNoteNames);

      return {
        ...paletteItem,
        notes,
        count: cells.length
      };
    });
    const colorByOctave = new Map<number, string>(OCTAVE_PALETTE.map((item) => [item.octave, item.color]));

    return { matchedCells, highlightMap, legend, colorByOctave };
  }, [currentBox, fretboardState.cells, targetState.targets]);

  const cellMap = useMemo(
    () => new Map(fretboardState.cells.map((cell) => [coordKey(cell), cell])),
    [fretboardState.cells]
  );
  const rowDisplayStrings = useMemo(() => Array.from({ length: stringCount }, (_, index) => index + 1), [stringCount]);
  const fretNumbers = useMemo(() => Array.from({ length: fretCount + 1 }, (_, fret) => fret), [fretCount]);
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
      <section className="control-panel" aria-label="控制区">
        <div className="brand-strip">
          <h1>有品弦乐乐理指板工具</h1>
          <p>{targetState.title}</p>
        </div>

        <div className="control-grid">
          <Field label="乐器">
            <select value={presetId} onChange={(event) => handlePresetChange(event.target.value)}>
              {TUNING_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
              <option value="custom">自定义调弦</option>
            </select>
          </Field>

          <Field label="调弦">
            <input
              value={tuningText}
              spellCheck={false}
              onChange={(event) => {
                setPresetId("custom");
                setTuningText(event.target.value);
              }}
            />
          </Field>

          <Field label="品数">
            <input
              type="number"
              min={1}
              max={36}
              value={fretCount}
              onChange={(event) => setFretCount(clamp(Number(event.target.value), 1, 36))}
            />
          </Field>

          <Field label="学习方向">
            <div className="segmented">
              <button
                className={learningMode === "named-chord" ? "active" : ""}
                type="button"
                onClick={() => setLearningMode("named-chord")}
              >
                纯和弦
              </button>
              <button
                className={learningMode === "diatonic-chord" ? "active" : ""}
                type="button"
                onClick={() => setLearningMode("diatonic-chord")}
              >
                调内和弦
              </button>
            </div>
          </Field>

          <Field label={learningMode === "named-chord" ? "根音" : "调中心"}>
            <select value={rootPc} onChange={(event) => setRootPc(Number(event.target.value))}>
              {PC_COMPACT_NAMES.map((name, pitchClass) => (
                <option key={name} value={pitchClass}>
                  {name}
                </option>
              ))}
            </select>
          </Field>

          {learningMode === "named-chord" ? (
            <Field label="和弦">
              <select value={chordId} onChange={(event) => setChordId(event.target.value)}>
                {CHORD_TEMPLATES.map((chord) => (
                  <option key={chord.id} value={chord.id}>
                    {chord.name} · {chord.symbol}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <>
              <Field label="调式">
                <select value={scaleId} onChange={(event) => setScaleId(event.target.value)}>
                  {SCALE_TEMPLATES.map((scale) => (
                    <option key={scale.id} value={scale.id}>
                      {scale.category} · {scale.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="显示">
                <div className="segmented">
                  <button
                    className={diatonicDisplayMode === "arpeggio" ? "active" : ""}
                    type="button"
                    onClick={() => setDiatonicDisplayMode("arpeggio")}
                  >
                    级数琶音
                  </button>
                  <button
                    className={diatonicDisplayMode === "scale" ? "active" : ""}
                    type="button"
                    onClick={() => setDiatonicDisplayMode("scale")}
                  >
                    完整音阶
                  </button>
                </div>
              </Field>

              <Field label="叠置层数">
                <input
                  type="number"
                  min={2}
                  max={7}
                  value={stackSize}
                  disabled={diatonicDisplayMode === "scale"}
                  onChange={(event) => setStackSize(clamp(Number(event.target.value), 2, 7))}
                />
              </Field>
            </>
          )}

          <Field label="Box预设">
            <select value={boxPresetId} onChange={(event) => handleBoxPresetChange(event.target.value)}>
              <option value="none">未选定</option>
              {boxPresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
              <option value="custom">手动弦品矩形</option>
            </select>
          </Field>
        </div>

        <div className="manual-box">
          <Field label="起始弦">
            <input
              type="number"
              min={1}
              max={stringCount}
              value={manualDisplayStringStart}
              onChange={(event) =>
                handleManualBoxChange({ displayStart: clamp(Number(event.target.value), 1, stringCount) })
              }
            />
          </Field>
          <Field label="结束弦">
            <input
              type="number"
              min={1}
              max={stringCount}
              value={manualDisplayStringEnd}
              onChange={(event) =>
                handleManualBoxChange({ displayEnd: clamp(Number(event.target.value), 1, stringCount) })
              }
            />
          </Field>
          <Field label="起始品">
            <input
              type="number"
              min={0}
              max={fretCount}
              value={manualFretStart}
              onChange={(event) =>
                handleManualBoxChange({ fretStart: clamp(Number(event.target.value), 0, fretCount) })
              }
            />
          </Field>
          <Field label="结束品">
            <input
              type="number"
              min={0}
              max={fretCount}
              value={manualFretEnd}
              onChange={(event) => handleManualBoxChange({ fretEnd: clamp(Number(event.target.value), 0, fretCount) })}
            />
          </Field>
        </div>

        {fretboardState.error ? <p className="notice error">{fretboardState.error}</p> : null}
      </section>

      <section className="workbench">
        <div className="fretboard-panel">
          <div className="panel-heading">
            <div>
              <h2>指板映射</h2>
              <p>{targetState.targetNames || "无目标音"}</p>
            </div>
            <div className="box-actions">
              <div className="box-readout">{currentBox ? formatBox(currentBox, stringCount) : "未选定"}</div>
              <button className="clear-selection-button" type="button" onClick={clearBoxSelection}>
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
                      box={currentBox}
                      cellMap={cellMap}
                      colorByOctave={highlightedState.colorByOctave}
                      displayString={displayString}
                      fretNumbers={fretNumbers}
                      highlightMap={highlightedState.highlightMap}
                      internalString={internalString}
                      key={displayString}
                      onBeginSelection={beginCellSelection}
                      onFinishSelection={finishCellSelection}
                      onUpdateSelection={updateCellSelection}
                      openCell={openCell}
                      pendingBox={pendingBox}
                    />
                  );
                })}
              </div>
            </div>

            {learningMode === "diatonic-chord" ? (
              <DegreeSelector
                chordSummaries={degreeChordSummaries}
                maxDegree={maxDiatonicDegree}
                selectedDegree={diatonicDisplayMode === "arpeggio" ? degree : null}
                onSelectDegree={(nextDegree) => {
                  setDegree(nextDegree);
                  setDiatonicDisplayMode("arpeggio");
                }}
              />
            ) : null}
          </div>

          {pendingBox ? (
            <div className="box-confirm-dialog" role="dialog" aria-label="固定待选Box">
              <span>
                {formatBox(pendingBox, stringCount)} · {countBoxCells(pendingBox)}格
              </span>
              <button type="button" onClick={fixPendingBoxCallback}>
                固定Box
              </button>
            </div>
          ) : null}
        </div>

        <aside className="legend-panel" aria-label="图例">
          <div className="panel-heading compact">
            <div>
              <h2>八度颜色</h2>
              <p>{highlightedState.matchedCells.length} 个落点</p>
            </div>
          </div>

          <div className="legend-list">
            {highlightedState.legend.length > 0 ? (
              highlightedState.legend.map((item) => (
                <div className={`legend-row ${item.count > 0 ? "active" : "muted"}`} key={item.octave}>
                  <span className="legend-swatch" style={{ backgroundColor: item.color }} />
                  <div>
                    <strong>Octave {item.octave}</strong>
                    <span>
                      {item.name} · {item.notes.length > 0 ? item.notes.join(" ") : item.englishName} · {item.count}处
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">当前 Box 内没有目标落点</p>
            )}
          </div>

          <div className="target-list">
            {targetState.targets.map((target) => (
              <span key={`${target.pc}-${target.order}`}>
                {target.label}: {pcToCompactName(target.pc)}
              </span>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
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
  pendingBox
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
  pendingBox
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
}) {
  const highlightedCell = cell ? highlightMap.get(coordKey(cell)) : undefined;
  const inBox = cell && box ? isCellInBox(cell, box) : false;
  const inPendingBox = cell && pendingBox ? isCellInBox(cell, pendingBox) : false;
  const cellColor = cell
    ? (colorByOctave.get(cell.note.octave) ?? colorForOctave(cell.note.octave))
    : colorForOctave(-1);
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
          ? `${cell.note.name} · MIDI ${cell.midi}${highlightedCell ? ` · ${formatMatches(highlightedCell.matches)}` : ""}`
          : undefined
      }
    >
      {highlightedCell ? <span className="note-dot">{pcToCompactName(highlightedCell.note.pc)}</span> : null}
    </div>
  );
}

function describeDiatonicChord(
  rootPc: number,
  scaleTemplate: ScaleTemplate,
  degree: number,
  stackSize: number
): DiatonicChordSummary {
  return inferChordSummary(diatonicChordTargets(rootPc, scaleTemplate, degree, stackSize));
}

function inferChordSummary(targets: TargetPitch[]): DiatonicChordSummary {
  if (targets.length === 0) {
    return {
      fullName: "",
      qualityName: "",
      symbol: ""
    };
  }

  const chordRootPc = targets[0].pc;
  const chordRootName = pcToCompactName(chordRootPc);
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

  const noteNames = targets.map((target) => pcToCompactName(target.pc)).join(" ");

  return {
    fullName: `${chordRootName} (${noteNames})`,
    qualityName: "自定义音组",
    symbol: `${chordRootName} (${noteNames})`
  };
}

function formatMatches(matches: TargetPitch[]): string {
  return matches.map((match) => match.label).join("/");
}

function formatBox(box: BoxRange, stringCount: number): string {
  const displayA = stringCount - box.stringEnd + 1;
  const displayB = stringCount - box.stringStart + 1;

  return `${displayA}-${displayB}弦 · ${box.fretStart}-${box.fretEnd}品`;
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

function colorForOctave(octave: number): string {
  return OCTAVE_COLOR_BY_NUMBER.get(octave) ?? "rgba(96, 108, 116, 0.34)";
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

function countBoxCells(box: BoxRange): number {
  return (box.stringEnd - box.stringStart + 1) * (box.fretEnd - box.fretStart + 1);
}

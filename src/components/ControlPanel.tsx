import type { ReactNode } from "react";
import type { BoxPreset, ChordTemplate, ScaleTemplate, TuningPreset } from "../domain/types";
import type { DiatonicDisplayMode, LearningMode } from "../hooks/useMusicModel";
import type { NotationMode } from "../view/notation";

type RootNoteOption = {
  id: string;
  label: string;
};

type ControlPanelProps = {
  boxPresetId: string;
  boxPresets: BoxPreset[];
  chordId: string;
  chordTemplates: ChordTemplate[];
  diatonicDisplayMode: DiatonicDisplayMode;
  error: string;
  fretCount: number;
  learningMode: LearningMode;
  notationMode: NotationMode;
  onBoxPresetChange: (boxPresetId: string) => void;
  onChordChange: (chordId: string) => void;
  onDiatonicDisplayModeChange: (displayMode: DiatonicDisplayMode) => void;
  onFretCountChange: (fretCount: number) => void;
  onLearningModeChange: (learningMode: LearningMode) => void;
  onNotationModeChange: (notationMode: NotationMode) => void;
  onOpenSettings: () => void;
  onPresetChange: (presetId: string) => void;
  onRootNoteChange: (rootNoteId: string) => void;
  onScaleChange: (scaleId: string) => void;
  onStackSizeChange: (stackSize: number) => void;
  onTuningTextChange: (tuningText: string) => void;
  presetId: string;
  rootNoteId: string;
  rootNoteOptions: RootNoteOption[];
  scaleId: string;
  scaleTemplates: ScaleTemplate[];
  stackSize: number;
  title: string;
  tuningPresets: TuningPreset[];
  tuningText: string;
};

export function ControlPanel({
  boxPresetId,
  boxPresets,
  chordId,
  chordTemplates,
  diatonicDisplayMode,
  error,
  fretCount,
  learningMode,
  notationMode,
  onBoxPresetChange,
  onChordChange,
  onDiatonicDisplayModeChange,
  onFretCountChange,
  onLearningModeChange,
  onNotationModeChange,
  onOpenSettings,
  onPresetChange,
  onRootNoteChange,
  onScaleChange,
  onStackSizeChange,
  onTuningTextChange,
  presetId,
  rootNoteId,
  rootNoteOptions,
  scaleId,
  scaleTemplates,
  stackSize,
  title,
  tuningPresets,
  tuningText
}: ControlPanelProps) {
  const canEditStackSize = learningMode === "diatonic-chord" && diatonicDisplayMode === "arpeggio";

  return (
    <section className="control-panel" aria-label="控制区">
      <div className="brand-strip">
        <div className="brand-copy">
          <h1>有品指板地图</h1>
          <p>{title}</p>
        </div>
        <button className="settings-button" type="button" onClick={onOpenSettings}>
          设置
        </button>
      </div>

      <div className="control-groups">
        <div className="control-row low-frequency-controls" aria-label="低频配置">
          <Field label="乐器">
            <select value={presetId} onChange={(event) => onPresetChange(event.target.value)}>
              {tuningPresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
              <option value="custom">自定义调弦</option>
            </select>
          </Field>

          <Field label="调弦">
            <input value={tuningText} spellCheck={false} onChange={(event) => onTuningTextChange(event.target.value)} />
          </Field>

          <Field label="品数">
            <input
              type="number"
              min={1}
              max={36}
              value={fretCount}
              onChange={(event) => onFretCountChange(Number(event.target.value))}
            />
          </Field>

          <Field label="记谱策略">
            <div className="segmented">
              <button
                className={notationMode === "musician" ? "active" : ""}
                type="button"
                onClick={() => onNotationModeChange("musician")}
              >
                演奏者
              </button>
              <button
                className={notationMode === "theorist" ? "active" : ""}
                type="button"
                onClick={() => onNotationModeChange("theorist")}
              >
                理论派
              </button>
            </div>
          </Field>
        </div>

        <div className="control-row high-frequency-controls" aria-label="高频演奏学习控制">
          <Field label="学习方向">
            <div className="segmented">
              <button
                className={learningMode === "named-chord" ? "active" : ""}
                type="button"
                onClick={() => onLearningModeChange("named-chord")}
              >
                纯和弦
              </button>
              <button
                className={learningMode === "diatonic-chord" ? "active" : ""}
                type="button"
                onClick={() => onLearningModeChange("diatonic-chord")}
              >
                调内和弦
              </button>
            </div>
          </Field>

          <Field label={learningMode === "named-chord" ? "根音" : "调中心"}>
            <select value={rootNoteId} onChange={(event) => onRootNoteChange(event.target.value)}>
              {rootNoteOptions.map((root) => (
                <option key={root.id} value={root.id}>
                  {root.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="和弦/调式">
            {learningMode === "named-chord" ? (
              <select value={chordId} onChange={(event) => onChordChange(event.target.value)}>
                {chordTemplates.map((chord) => (
                  <option key={chord.id} value={chord.id}>
                    {chord.name} · {chord.symbol}
                  </option>
                ))}
              </select>
            ) : (
              <div className="control-stack">
                <select value={scaleId} onChange={(event) => onScaleChange(event.target.value)}>
                  {scaleTemplates.map((scale) => (
                    <option key={scale.id} value={scale.id}>
                      {scale.category} · {scale.name}
                    </option>
                  ))}
                </select>

                <div className="segmented">
                  <button
                    className={diatonicDisplayMode === "arpeggio" ? "active" : ""}
                    type="button"
                    onClick={() => onDiatonicDisplayModeChange("arpeggio")}
                  >
                    级数琶音
                  </button>
                  <button
                    className={diatonicDisplayMode === "scale" ? "active" : ""}
                    type="button"
                    onClick={() => onDiatonicDisplayModeChange("scale")}
                  >
                    完整音阶
                  </button>
                </div>
              </div>
            )}
          </Field>

          <Field label="Box">
            <select value={boxPresetId} onChange={(event) => onBoxPresetChange(event.target.value)}>
              <option value="none">未选定</option>
              {boxPresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
              <option value="custom">手动弦品矩形</option>
            </select>
          </Field>

          <Field label="重叠层数">
            <input
              type="number"
              min={2}
              max={7}
              value={stackSize}
              disabled={!canEditStackSize}
              onChange={(event) => onStackSizeChange(Number(event.target.value))}
            />
          </Field>
        </div>
      </div>

      {error ? <p className="notice error">{error}</p> : null}
    </section>
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

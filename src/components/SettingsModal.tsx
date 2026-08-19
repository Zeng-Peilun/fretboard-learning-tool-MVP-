import { useEffect, useRef, type ReactNode } from "react";
import type { NotationMode } from "../view/notation";

type SettingsModalProps = {
  awfulTolerance: number;
  fretCount: number;
  manualDisplayStringEnd: number;
  manualDisplayStringStart: number;
  manualFretEnd: number;
  manualFretStart: number;
  notationMode: NotationMode;
  onAwfulToleranceChange: (awfulTolerance: number) => void;
  onClose: () => void;
  onManualDisplayStringEndChange: (displayStringEnd: number) => void;
  onManualDisplayStringStartChange: (displayStringStart: number) => void;
  onManualFretEndChange: (fretEnd: number) => void;
  onManualFretStartChange: (fretStart: number) => void;
  open: boolean;
  stringCount: number;
};

export function SettingsModal({
  awfulTolerance,
  fretCount,
  manualDisplayStringEnd,
  manualDisplayStringStart,
  manualFretEnd,
  manualFretStart,
  notationMode,
  onAwfulToleranceChange,
  onClose,
  onManualDisplayStringEndChange,
  onManualDisplayStringStartChange,
  onManualFretEndChange,
  onManualFretStartChange,
  open,
  stringCount
}: SettingsModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open) {
      if (!dialog.open) {
        if (typeof dialog.showModal === "function") {
          dialog.showModal();
        } else {
          dialog.setAttribute("open", "");
        }
      }
      return;
    }

    if (dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
  }, [open]);

  return (
    <dialog
      className="settings-modal"
      ref={dialogRef}
      aria-labelledby="settings-modal-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onClose={() => {
        if (open) {
          onClose();
        }
      }}
    >
      <form className="settings-card" method="dialog">
        <div className="settings-header">
          <div>
            <h2 id="settings-modal-title">设置</h2>
            <p>Box 限位与记谱宽容度</p>
          </div>
          <button className="settings-close-button" type="button" aria-label="关闭设置" onClick={onClose}>
            ×
          </button>
        </div>

        <section className="settings-section" aria-label="Box 限位">
          <h3>Box 限位</h3>
          <div className="settings-grid">
            <Field label="起始弦">
              <input
                type="number"
                min={1}
                max={stringCount}
                value={manualDisplayStringStart}
                onChange={(event) => onManualDisplayStringStartChange(Number(event.target.value))}
              />
            </Field>

            <Field label="结束弦">
              <input
                type="number"
                min={1}
                max={stringCount}
                value={manualDisplayStringEnd}
                onChange={(event) => onManualDisplayStringEndChange(Number(event.target.value))}
              />
            </Field>

            <Field label="起始品">
              <input
                type="number"
                min={0}
                max={fretCount}
                value={manualFretStart}
                onChange={(event) => onManualFretStartChange(Number(event.target.value))}
              />
            </Field>

            <Field label="结束品">
              <input
                type="number"
                min={0}
                max={fretCount}
                value={manualFretEnd}
                onChange={(event) => onManualFretEndChange(Number(event.target.value))}
              />
            </Field>
          </div>
        </section>

        <section className="settings-section" aria-label="宽容度设定">
          <h3>记谱策略</h3>
          <Field label="宽容度">
            <input
              type="number"
              min={0}
              max={12}
              value={awfulTolerance}
              disabled={notationMode !== "musician"}
              onChange={(event) => onAwfulToleranceChange(Number(event.target.value))}
            />
          </Field>
        </section>

        <div className="settings-footer">
          <button type="button" onClick={onClose}>
            完成
          </button>
        </div>
      </form>
    </dialog>
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

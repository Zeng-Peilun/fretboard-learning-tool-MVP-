import type { TargetPitch } from "../domain/types";
import { baseNameForPitchClass } from "../view/notation";

type LegendItem = {
  color: string;
  count: number;
  englishName: string;
  name: string;
  notes: string[];
  octave: number;
};

type LegendPanelProps = {
  legend: LegendItem[];
  matchedCount: number;
  targetDisplayNames: string[];
  targets: TargetPitch[];
};

export function LegendPanel({ legend, matchedCount, targetDisplayNames, targets }: LegendPanelProps) {
  return (
    <aside className="legend-panel" aria-label="图例">
      <div className="target-list legend-target-list">
        {targets.map((target, index) => (
          <span key={`${target.pc}-${target.order}`}>
            {target.label}: {targetDisplayNames[index] ?? baseNameForPitchClass(target.pc)}
          </span>
        ))}
      </div>

      <div className="panel-heading compact">
        <div>
          <h2>八度颜色</h2>
          <p>{matchedCount} 个落点</p>
        </div>
      </div>

      <div className="legend-list">
        {legend.length > 0 ? (
          legend.map((item) => (
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
    </aside>
  );
}

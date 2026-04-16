import { h } from "preact";
import type { WriteMode } from "../core/description";

interface ControlsProps {
  writeMode: WriteMode;
  onWriteModeChange: (mode: WriteMode) => void;
  includeLowConfidence: boolean;
  onIncludeLowConfidenceChange: (v: boolean) => void;
  isScanning: boolean;
  isWriting: boolean;
  hasResults: boolean;
  onCopyUnmatched: () => void;
  unmatchedCount: number;
}

const MODES: WriteMode[] = ["merge", "append"];

export function Controls({
  writeMode, onWriteModeChange,
  includeLowConfidence, onIncludeLowConfidenceChange,
  isScanning, isWriting, hasResults, onCopyUnmatched, unmatchedCount,
}: ControlsProps) {
  return (
    <div class="controls">
      <div class="controls__row">
        <span class="controls__mode-label">Mode:</span>
        <div class="controls__mode">
          {MODES.map((m) => (
            <button
              key={m}
              class={`mode-btn${writeMode === m ? " active" : ""}`}
              onClick={() => onWriteModeChange(m)}
              disabled={isScanning || isWriting}
            >
              {m}
            </button>
          ))}
        </div>
        <label class="checkbox-label" style="margin-left: auto;">
          <input
            type="checkbox"
            checked={includeLowConfidence}
            onChange={(e) => onIncludeLowConfidenceChange((e.target as HTMLInputElement).checked)}
          />
          Low confidence
        </label>
      </div>
      {hasResults && unmatchedCount > 0 && (
        <div class="controls__row">
          <button class="btn btn--small btn--ghost" onClick={onCopyUnmatched}>
            Copy unmatched ({unmatchedCount})
          </button>
        </div>
      )}
    </div>
  );
}

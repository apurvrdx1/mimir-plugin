import { h } from "preact";
import type { WriteMode } from "../core/description";

interface ControlsProps {
  onScan: () => void;
  onWrite: () => void;
  writeMode: WriteMode;
  onWriteModeChange: (mode: WriteMode) => void;
  includeLowConfidence: boolean;
  onIncludeLowConfidenceChange: (v: boolean) => void;
  isScanning: boolean;
  isWriting: boolean;
  hasResults: boolean;
  onCopyUnmatched: () => void;
  onExportReport: () => void;
  unmatchedCount: number;
}

const MODES: WriteMode[] = ["merge", "append", "replace"];

export function Controls({
  onScan, onWrite, writeMode, onWriteModeChange,
  includeLowConfidence, onIncludeLowConfidenceChange,
  isScanning, isWriting, hasResults,
  onCopyUnmatched, onExportReport, unmatchedCount,
}: ControlsProps) {
  return (
    <div class="controls">
      <div class="controls__row">
        <button
          class="btn btn--primary"
          onClick={onScan}
          disabled={isScanning || isWriting}
        >
          {isScanning ? <><span class="spinner" /> Scanning…</> : "Scan Selection"}
        </button>
        <button
          class="btn"
          onClick={onWrite}
          disabled={!hasResults || isScanning || isWriting}
        >
          {isWriting ? <><span class="spinner" /> Writing…</> : "Write Descriptions"}
        </button>
      </div>
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
      </div>
      <div class="controls__row">
        <label class="checkbox-label">
          <input
            type="checkbox"
            checked={includeLowConfidence}
            onChange={(e) => onIncludeLowConfidenceChange((e.target as HTMLInputElement).checked)}
          />
          Include low-confidence matches
        </label>
      </div>
      {hasResults && (
        <div class="controls__row">
          {unmatchedCount > 0 && (
            <button class="btn btn--small btn--ghost" onClick={onCopyUnmatched}>
              Copy unmatched ({unmatchedCount})
            </button>
          )}
          <button class="btn btn--small btn--ghost" onClick={onExportReport}>
            Export JSON
          </button>
        </div>
      )}
    </div>
  );
}

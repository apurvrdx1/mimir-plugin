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
  customPrefix: string;
  onCustomPrefixChange: (v: string) => void;
  onRematch: () => void;
  showPrefixHint: boolean;
  prefixSource: "stored" | "user" | null;
}

const MODES: WriteMode[] = ["merge", "append"];

export function Controls({
  writeMode, onWriteModeChange,
  includeLowConfidence, onIncludeLowConfidenceChange,
  isScanning, isWriting, hasResults, onCopyUnmatched, unmatchedCount,
  customPrefix, onCustomPrefixChange, onRematch, showPrefixHint, prefixSource,
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
      {hasResults && (unmatchedCount > 0 || showPrefixHint) && (
        <div class="controls__row">
          {unmatchedCount > 0 && (
            <button class="btn btn--small btn--ghost" onClick={onCopyUnmatched}>
              Copy unmatched ({unmatchedCount})
            </button>
          )}
          <input
            class="controls__prefix-input"
            type="text"
            placeholder="Strip prefix…"
            value={customPrefix}
            onInput={(e) => onCustomPrefixChange((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => { if (e.key === "Enter") onRematch(); }}
          />
          <button
            class="btn btn--small"
            onClick={() => onRematch()}
            disabled={!customPrefix.trim()}
          >
            Re-match
          </button>
        </div>
      )}
      {prefixSource === "stored" && (
        <div class="controls__prefix-note">↩ prefixes from last run auto-applied</div>
      )}
    </div>
  );
}

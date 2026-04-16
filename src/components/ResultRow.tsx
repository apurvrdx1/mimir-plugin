import { h } from "preact";
import { useState } from "preact/hooks";
import type { MatchResult } from "../core/match";
import type { WriteMode } from "../core/description";
import { formatMimirBlock } from "../core/description";

export interface ResultRowData {
  nodeId: string;
  nodeName: string;
  nodeType: "COMPONENT" | "COMPONENT_SET" | "UNSUPPORTED";
  normalizedName: string;
  normalizationSteps: string[];
  matchResult: MatchResult;
  existingDescription: string;
  tags: string[];
  included: boolean;
  writeError?: string;
}

interface ResultRowProps {
  data: ResultRowData;
  writeMode: WriteMode;
  pluginVersion: string;
  onIncludedChange: (nodeId: string, included: boolean) => void;
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  return (
    <span class={`badge badge--${confidence}`}>{confidence}</span>
  );
}

export function ResultRow({ data, writeMode, pluginVersion, onIncludedChange }: ResultRowProps) {
  const [expanded, setExpanded] = useState(false);
  const { matchResult, nodeName, tags, included } = data;
  const isUnsupported = data.nodeType === "UNSUPPORTED";
  const isDimmed = !included || matchResult.confidence === "none";
  const hasMatch = matchResult.entry !== null;

  function handleToggle() {
    if (!isUnsupported && hasMatch) setExpanded((v) => !v);
  }

  function handleCheckbox(e: Event) {
    e.stopPropagation();
    onIncludedChange(data.nodeId, (e.target as HTMLInputElement).checked);
  }

  const today = new Date().toISOString().slice(0, 10);
  const finalDescPreview = hasMatch ? formatMimirBlock(tags, pluginVersion, today) : null;

  const descLabel =
    writeMode === "append" ? "Description to be appended" : "New merged description";

  return (
    <div class={`result-row${isDimmed ? " result-row--dimmed" : ""}${expanded ? " result-row--expanded" : ""}`}>
      {/* Header — always visible */}
      <div
        class="result-row__header"
        onClick={handleToggle}
        role={!isUnsupported && hasMatch ? "button" : undefined}
        tabIndex={!isUnsupported && hasMatch ? 0 : undefined}
        onKeyDown={!isUnsupported && hasMatch ? (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleToggle(); } } : undefined}
        aria-expanded={!isUnsupported && hasMatch ? expanded : undefined}
      >
        {/* Checkbox first */}
        {!isUnsupported && (
          <input
            type="checkbox"
            class="result-row__checkbox"
            checked={included}
            aria-label={`Include ${nodeName}`}
            onChange={handleCheckbox}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {/* Name + tags block */}
        <div class="result-row__main">
          <span class="result-row__name" title={nodeName}>{nodeName}</span>
          {isUnsupported ? (
            <span class="badge badge--none">skipped</span>
          ) : tags.length > 0 ? (
            <div class="result-row__tag-row">
              <ConfidenceBadge confidence={matchResult.confidence} />
              <span class="result-row__tag-list">{tags.join(", ")}</span>
            </div>
          ) : matchResult.confidence === "none" ? (
            <div class="result-row__tag-row">
              <ConfidenceBadge confidence="none" />
              <span class="result-row__tag-list result-row__tag-list--muted">no match</span>
            </div>
          ) : null}
        </div>

        {/* Chevron last */}
        {!isUnsupported && hasMatch && (
          <span
            class={`result-row__chevron${expanded ? " result-row__chevron--open" : ""}`}
            aria-hidden="true"
          >▶</span>
        )}

        {data.writeError && (
          <span class="result-row__error" title={data.writeError}>⚠</span>
        )}
      </div>

      {/* Expanded body — only description preview */}
      {!isUnsupported && expanded && finalDescPreview !== null && (
        <div class="result-row__body">
          <div class="result-row__field">
            <span class="result-row__label">{descLabel}:</span>
            <pre class="result-row__mono-box">{finalDescPreview}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

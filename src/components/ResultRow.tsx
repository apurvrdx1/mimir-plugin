import { h } from "preact";
import { useState } from "preact/hooks";
import type { MatchResult } from "../core/match";
import type { WriteMode } from "../core/description";
import { formatMimirBlock, deduplicateTags } from "../core/description";

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
  onTagsChange: (nodeId: string, tags: string[]) => void;
  onIncludedChange: (nodeId: string, included: boolean) => void;
}

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "high",
  medium: "medium",
  low: "low",
  none: "none",
};

function ConfidenceBadge({ confidence }: { confidence: string }) {
  return (
    <span class={`badge badge--${confidence}`}>
      {CONFIDENCE_LABELS[confidence] ?? confidence}
    </span>
  );
}

export function ResultRow({
  data,
  writeMode,
  pluginVersion,
  onTagsChange,
  onIncludedChange,
}: ResultRowProps) {
  const [expanded, setExpanded] = useState(false);
  const { matchResult, nodeName, normalizedName, tags, included } = data;
  const isUnsupported = data.nodeType === "UNSUPPORTED";
  const isDimmed = !included || matchResult.confidence === "none";

  function handleTagsBlur(e: Event) {
    const input = e.target as HTMLInputElement;
    const raw = input.value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const deduped = deduplicateTags(raw);
    onTagsChange(data.nodeId, deduped);
  }

  function handleToggle(e: Event) {
    e.stopPropagation();
    if (!isUnsupported) {
      setExpanded((v) => !v);
    }
  }

  function handleCheckbox(e: Event) {
    e.stopPropagation();
    onIncludedChange(data.nodeId, (e.target as HTMLInputElement).checked);
  }

  const tagPreview = tags.slice(0, 3).join(", ");
  const truncatedPreview =
    tagPreview.length > 40 ? tagPreview.slice(0, 37) + "…" : tagPreview;

  const sourceId =
    matchResult.entry?.sourceAttributions?.[0]?.sourceId ?? null;

  const existingDescPreview =
    data.existingDescription.length === 0
      ? "—"
      : data.existingDescription.length > 100
      ? data.existingDescription.slice(0, 97) + "…"
      : data.existingDescription;

  const finalDescPreview =
    matchResult.entry !== null
      ? formatMimirBlock(matchResult.entry, tags, matchResult, pluginVersion)
      : null;

  return (
    <div
      class={`result-row${isDimmed ? " result-row--dimmed" : ""}${expanded ? " result-row--expanded" : ""}`}
    >
      {/* Collapsed header — always visible */}
      <div class="result-row__header" onClick={handleToggle}>
        {!isUnsupported && (
          <span class={`result-row__chevron${expanded ? " result-row__chevron--open" : ""}`}>
            ▶
          </span>
        )}
        <span class="result-row__name" title={nodeName}>
          {nodeName}
        </span>
        <span class="result-row__badges">
          {isUnsupported ? (
            <span class="badge badge--none">skipped</span>
          ) : (
            <ConfidenceBadge confidence={matchResult.confidence} />
          )}
        </span>
        {!isUnsupported && tags.length > 0 && (
          <span class="result-row__tag-preview" title={tags.join(", ")}>
            {truncatedPreview}
          </span>
        )}
        {!isUnsupported && (
          <input
            type="checkbox"
            class="result-row__checkbox"
            checked={included}
            onChange={handleCheckbox}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {data.writeError && (
          <span class="result-row__error" title={data.writeError}>⚠</span>
        )}
      </div>

      {/* Expanded body */}
      {!isUnsupported && expanded && (
        <div class="result-row__body">
          <div class="result-row__field">
            <span class="result-row__label">Original name:</span>
            <span class="result-row__value">{data.nodeName}</span>
          </div>
          <div class="result-row__field">
            <span class="result-row__label">Normalized:</span>
            <span class="result-row__value mono">{normalizedName}</span>
            {data.normalizationSteps.length > 1 && (
              <span class="result-row__steps">
                {data.normalizationSteps.map((step) => (
                  <span key={step} class="result-row__step-pill">{step}</span>
                ))}
              </span>
            )}
          </div>
          <div class="result-row__field">
            <span class="result-row__label">Node type:</span>
            <span class="result-row__value">{data.nodeType}</span>
          </div>
          <div class="result-row__field">
            <span class="result-row__label">Match:</span>
            <span class="result-row__value">
              {matchResult.matchedVia}
              {sourceId && <span class="result-row__source"> · {sourceId}</span>}
            </span>
          </div>
          <div class="result-row__field">
            <span class="result-row__label">Tags:</span>
            <input
              type="text"
              class="result-row__tags-input"
              defaultValue={tags.join(", ")}
              key={tags.join(",")}
              onBlur={handleTagsBlur}
            />
          </div>
          <div class="result-row__field">
            <span class="result-row__label">Existing description:</span>
            <pre class="result-row__mono-box">{existingDescPreview}</pre>
          </div>
          {finalDescPreview !== null && (
            <div class="result-row__field">
              <span class="result-row__label">Final description preview:</span>
              <pre class="result-row__mono-box">{finalDescPreview}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

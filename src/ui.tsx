import { h, render } from "preact";
import { signal, computed } from "@preact/signals";
import { buildThesaurusIndex, matchIcon } from "./core/match";
import { normalizeName } from "./core/normalize";
import {
  formatMimirBlock,
  composeDescription,
  deduplicateTags,
} from "./core/description";
import {
  createSessionReport,
  addReportItem,
  finalizeReport,
  exportReportAsJson,
} from "./core/report";
import type { ThesaurusIndex } from "./core/match";
import type { WriteMode } from "./core/description";
import type {
  PluginToUiMessage,
  UiToPluginMessage,
  PluginNodeData,
  WriteItem,
} from "./types";
import type { CompiledIconThesaurus } from "./schema/compiled-dataset";
import { Header } from "./components/Header";
import { SummaryBar } from "./components/SummaryBar";
import { Controls } from "./components/Controls";
import { EmptyState } from "./components/EmptyState";
import { ResultRow } from "./components/ResultRow";
import type { ResultRowData } from "./components/ResultRow";
import thesaurusJson from "./data/compiled/icon-thesaurus.v1.json";
import "./styles.css";

// ── Constants ──────────────────────────────────────────────────────────────
const PLUGIN_VERSION = "1.0.0";

// ── Thesaurus index (built once at startup) ────────────────────────────────
const thesaurus = thesaurusJson as unknown as CompiledIconThesaurus;
const index: ThesaurusIndex = buildThesaurusIndex(thesaurus);

// ── Signals ────────────────────────────────────────────────────────────────
const rows = signal<ResultRowData[]>([]);
const writeMode = signal<WriteMode>("merge");
const includeLowConfidence = signal(false);
const isScanning = signal(false);
const isWriting = signal(false);

// Derived
const visibleRows = computed(() =>
  includeLowConfidence.value
    ? rows.value
    : rows.value.filter(
        (r) => r.matchResult.confidence !== "low" || r.included
      )
);
const matchedCount = computed(
  () => rows.value.filter((r) => r.matchResult.confidence !== "none").length
);
const unmatchedCount = computed(
  () => rows.value.filter((r) => r.matchResult.confidence === "none").length
);
const skippedCount = computed(
  () => rows.value.filter((r) => r.nodeType === "UNSUPPORTED").length
);
const includedRows = computed(() =>
  rows.value.filter((r) => r.included && r.matchResult.entry !== null)
);

// ── postMessage handlers ────────────────────────────────────────────────────
window.onmessage = (event: MessageEvent) => {
  const msg = event.data?.pluginMessage as PluginToUiMessage | undefined;
  if (!msg) return;

  if (msg.type === "SELECTION_RESULT") {
    isScanning.value = false;
    rows.value = msg.nodes.map((node) => nodeToRowData(node));
  } else if (msg.type === "WRITE_RESULT") {
    isWriting.value = false;
    const resultMap = new Map(msg.results.map((r) => [r.nodeId, r]));
    rows.value = rows.value.map((row) => {
      const result = resultMap.get(row.nodeId);
      if (!result) return row;
      return { ...row, writeError: result.success ? undefined : result.error };
    });
  }
};

// ── Helper: node → ResultRowData ───────────────────────────────────────────
function nodeToRowData(node: PluginNodeData): ResultRowData {
  if (node.nodeType === "UNSUPPORTED") {
    return {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: "UNSUPPORTED",
      normalizedName: node.name,
      normalizationSteps: [],
      matchResult: {
        entry: null,
        confidence: "none",
        matchedVia: "none",
        normalizationSteps: [],
      },
      existingDescription: "",
      tags: [],
      included: false,
    };
  }

  const { normalized, steps } = normalizeName(node.name);
  const matchResult = matchIcon(normalized, index);
  const baseTags = matchResult.entry
    ? deduplicateTags([
        ...matchResult.entry.tags,
        ...(matchResult.entry.aliases ?? []),
      ])
    : [];

  return {
    nodeId: node.id,
    nodeName: node.name,
    nodeType: node.nodeType as "COMPONENT" | "COMPONENT_SET",
    normalizedName: normalized,
    normalizationSteps: steps,
    matchResult,
    existingDescription: node.existingDescription,
    tags: baseTags,
    included:
      matchResult.confidence === "high" || matchResult.confidence === "medium",
  };
}

// ── Actions ─────────────────────────────────────────────────────────────────
function scanSelection() {
  isScanning.value = true;
  rows.value = [];
  const msg: UiToPluginMessage = { type: "SCAN_SELECTION" };
  parent.postMessage({ pluginMessage: msg }, "*");
}

function writeDescriptions() {
  const toWrite = includedRows.value;
  if (toWrite.length === 0) return;

  const report = createSessionReport({
    pluginVersion: PLUGIN_VERSION,
    thesaurusVersion: thesaurus.datasetVersion,
    schemaVersion: thesaurus.schemaVersion,
    writeMode: writeMode.value,
  });

  const items: WriteItem[] = toWrite.map((row) => {
    const mimirBlock =
      row.matchResult.entry !== null
        ? formatMimirBlock(
            row.matchResult.entry,
            row.tags,
            row.matchResult,
            PLUGIN_VERSION
          )
        : "";
    const finalDescription = composeDescription(
      row.existingDescription,
      mimirBlock,
      writeMode.value
    );

    addReportItem(report, {
      nodeId: row.nodeId,
      nodeName: row.nodeName,
      nodeType: row.nodeType,
      normalizedName: row.normalizedName,
      matchResult: row.matchResult,
      proposedTags: row.tags,
      existingDescription: row.existingDescription,
      finalDescription,
      written: true,
      skipped: false,
    });

    return { nodeId: row.nodeId, finalDescription };
  });

  currentReport = finalizeReport(report);

  isWriting.value = true;
  const msg: UiToPluginMessage = { type: "WRITE_DESCRIPTIONS", items };
  parent.postMessage({ pluginMessage: msg }, "*");
}

let currentReport: ReturnType<typeof finalizeReport> | null = null;

function exportReport() {
  if (!currentReport) return;
  const json = exportReportAsJson(currentReport);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mimir-report-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function copyUnmatched() {
  const names = rows.value
    .filter(
      (r) =>
        r.matchResult.confidence === "none" && r.nodeType !== "UNSUPPORTED"
    )
    .map((r) => r.nodeName)
    .join("\n");
  navigator.clipboard.writeText(names).catch(() => {});
}

function updateTags(nodeId: string, tags: string[]) {
  rows.value = rows.value.map((r) =>
    r.nodeId === nodeId ? { ...r, tags } : r
  );
}

function updateIncluded(nodeId: string, included: boolean) {
  rows.value = rows.value.map((r) =>
    r.nodeId === nodeId ? { ...r, included } : r
  );
}

// ── Determine empty state variant ───────────────────────────────────────────
function getEmptyVariant(): "no-selection" | "no-supported" | "no-matches" | "scanning" {
  if (isScanning.value) return "scanning";
  if (rows.value.length === 0) return "no-selection";
  const supported = rows.value.filter((r) => r.nodeType !== "UNSUPPORTED");
  if (supported.length === 0) return "no-supported";
  return "no-matches";
}

// ── Root component ──────────────────────────────────────────────────────────
function App() {
  const visible = visibleRows.value;
  const hasResults = visible.length > 0;
  const showEmpty = !hasResults;

  return (
    <div id="app">
      <Header />
      <SummaryBar
        total={rows.value.length}
        matched={matchedCount.value}
        unmatched={unmatchedCount.value}
        skipped={skippedCount.value}
      />
      <Controls
        onScan={scanSelection}
        onWrite={writeDescriptions}
        writeMode={writeMode.value}
        onWriteModeChange={(m) => {
          writeMode.value = m;
        }}
        includeLowConfidence={includeLowConfidence.value}
        onIncludeLowConfidenceChange={(v) => {
          includeLowConfidence.value = v;
        }}
        isScanning={isScanning.value}
        isWriting={isWriting.value}
        hasResults={hasResults}
        onCopyUnmatched={copyUnmatched}
        onExportReport={exportReport}
        unmatchedCount={unmatchedCount.value}
      />
      {showEmpty ? (
        <EmptyState variant={getEmptyVariant()} />
      ) : (
        <div class="result-list">
          {visible.map((row) => (
            <ResultRow
              key={row.nodeId}
              data={row}
              writeMode={writeMode.value}
              pluginVersion={PLUGIN_VERSION}
              onTagsChange={updateTags}
              onIncludedChange={updateIncluded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

render(<App />, document.getElementById("app")!);

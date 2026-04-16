import type { MatchResult } from "./match";
import type { WriteMode } from "./description";

export type NodeType = "COMPONENT" | "COMPONENT_SET" | "UNSUPPORTED";

export type SkipReason =
  | "unsupported-node-type"
  | "no-match"
  | "low-confidence-excluded"
  | "user-unchecked";

export interface ReportItem {
  nodeId: string;
  nodeName: string;
  nodeType: NodeType;
  normalizedName: string;
  matchResult: MatchResult;
  proposedTags: string[];
  existingDescription: string;
  /** null when the item was not written */
  finalDescription: string | null;
  written: boolean;
  skipped: boolean;
  skipReason?: SkipReason;
  error?: string;
}

export interface SessionSummary {
  total: number;
  matched: number;
  unmatched: number;
  skipped: number;
  written: number;
  errors: number;
}

export interface SessionReport {
  sessionId: string;
  timestamp: string;
  pluginVersion: string;
  thesaurusVersion: string;
  schemaVersion: string;
  writeMode: WriteMode;
  items: ReportItem[];
  summary: SessionSummary;
}

/**
 * Generate a lightweight UUID-like identifier without a crypto dependency.
 */
function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function zeroSummary(): SessionSummary {
  return {
    total: 0,
    matched: 0,
    unmatched: 0,
    skipped: 0,
    written: 0,
    errors: 0,
  };
}

/**
 * Initialise a new session report. Summary counts start at zero and are
 * recomputed by `finalizeReport`.
 */
export function createSessionReport(params: {
  pluginVersion: string;
  thesaurusVersion: string;
  schemaVersion: string;
  writeMode: WriteMode;
}): SessionReport {
  return {
    sessionId: generateSessionId(),
    timestamp: new Date().toISOString(),
    pluginVersion: params.pluginVersion,
    thesaurusVersion: params.thesaurusVersion,
    schemaVersion: params.schemaVersion,
    writeMode: params.writeMode,
    items: [],
    summary: zeroSummary(),
  };
}

/**
 * Append a single item to the report.
 * Summary is NOT updated here — call `finalizeReport` when the session ends.
 */
export function addReportItem(report: SessionReport, item: ReportItem): void {
  report.items.push(item);
}

/**
 * Recompute the summary from the current items list, mutate the report in
 * place, and return it.
 */
export function finalizeReport(report: SessionReport): SessionReport {
  const summary: SessionSummary = {
    total: report.items.length,
    matched: report.items.filter((i) => i.matchResult.confidence !== "none")
      .length,
    unmatched: report.items.filter((i) => i.matchResult.confidence === "none")
      .length,
    skipped: report.items.filter((i) => i.skipped).length,
    written: report.items.filter((i) => i.written).length,
    errors: report.items.filter((i) => i.error !== undefined).length,
  };

  report.summary = summary;
  return report;
}

/**
 * Serialise the report to a pretty-printed JSON string suitable for download
 * or logging.
 */
export function exportReportAsJson(report: SessionReport): string {
  return JSON.stringify(report, null, 2);
}

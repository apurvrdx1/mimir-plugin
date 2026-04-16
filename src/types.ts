// ---------------------------------------------------------------------------
// Shared postMessage types for Figma plugin ↔ UI iframe communication.
// ---------------------------------------------------------------------------

// Messages sent from UI → Plugin sandbox
export type UiToPluginMessage =
  | { type: "SCAN_SELECTION" }
  | { type: "WRITE_DESCRIPTIONS"; items: WriteItem[] }
  | { type: "CREATE_CHANGELOG"; entries: ChangelogEntry[]; unchangedEntries: ChangelogEntry[]; meta: ChangelogMeta };

// Messages sent from Plugin sandbox → UI
export type PluginToUiMessage =
  | { type: "SELECTION_RESULT"; nodes: PluginNodeData[] }
  | { type: "WRITE_RESULT"; results: WriteResult[] };

export interface PluginNodeData {
  id: string;
  name: string;
  nodeType: "COMPONENT" | "COMPONENT_SET" | "UNSUPPORTED";
  existingDescription: string;
  /** Populated for UNSUPPORTED nodes to explain why the node was skipped. */
  skipReason?: string;
}

export interface WriteItem {
  nodeId: string;
  finalDescription: string;
}

export interface WriteResult {
  nodeId: string;
  success: boolean;
  error?: string;
}

export interface ChangelogEntry {
  componentName: string;
  tags: string[];
}

export interface ChangelogMeta {
  date: string;
  time: string;
  writeMode: string;
  source: string;
  pluginVersion: string;
  totalWritten: number;
}
